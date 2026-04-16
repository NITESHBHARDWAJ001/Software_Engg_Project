from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import logging
import datetime
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import Competitor, Product, ProductPriceHistory, SocialPostSentiment
from app.services.sentiment_analysis import analyze_text_sentiment
from urllib.parse import urljoin

logger = logging.getLogger(__name__)

def _scrape_sync(url: str):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto(url, timeout=30000)
            content = page.content()
        except Exception as e:
            logger.error(f"Failed to scrape {url}: {e}")
            browser.close()
            return None, str(e)
        browser.close()
        return content, None

async def scrape_competitor_data(url: str, db: AsyncSession):
    logger.info(f"Scraping data from {url}")
    
    # Run the playwright sequence in a separate thread so it creates its own event loop logic
    # This prevents Windows NotImplementedError when running underneath FastAPI/Uvicorn
    content, error = await asyncio.to_thread(_scrape_sync, url)
    
    if error or not content:
        return {"status": "failed", "error": error}
        
    soup = BeautifulSoup(content, 'html.parser')
    text = soup.get_text(strip=True)
    
import json
import re
from sqlalchemy.future import select

def extract_products(soup, url):
    products = []
    
    # 1. Try to find JSON-LD Product schemas (Shopify, WooCommerce, Custom)
    ld_scripts = soup.find_all('script', type='application/ld+json')
    for script in ld_scripts:
        try:
            if not script.string: continue
            data = json.loads(script.string)
            if isinstance(data, dict):
                data = [data]
            for item in data:
                if isinstance(item, dict) and item.get('@type') == 'Product':
                    price = 0.0
                    currency = 'USD'
                    offers = item.get('offers', {})
                    if isinstance(offers, list):
                        offers = offers[0] if offers else {}
                    
                    price_str = offers.get('price', 0.0)
                    try: price = float(price_str)
                    except (ValueError, TypeError): pass
                    
                    image = item.get('image', [])
                    if isinstance(image, list) and len(image) > 0:
                        image = image[0]
                    elif not isinstance(image, str):
                        image = ""
                        
                    products.append({
                        "name": item.get('name', 'Unknown Product')[:250],
                        "category": item.get('category', 'General')[:250],
                        "price": price,
                        "currency": offers.get('priceCurrency', currency),
                        "image_url": str(image)[:500],
                        "url": item.get('url', url)[:500]
                    })
        except Exception as e:
            logger.warning(f"Error parsing JSON-LD: {e}")

    # 2. OpenGraph Meta Tags Fallback
    if not products:
        og_title = soup.find("meta", property="og:title")
        og_image = soup.find("meta", property="og:image")
        og_price = soup.find("meta", property="product:price:amount")
        og_currency = soup.find("meta", property="product:price:currency")
        
        if og_title and og_title.get("content"):
            price = 0.0
            if og_price and og_price.get("content"):
                try: price = float(og_price.get("content"))
                except ValueError: pass
                    
            products.append({
                "name": og_title.get("content", "Unknown Product")[:250],
                "category": "General",
                "price": price,
                "currency": og_currency.get("content", "USD") if og_currency else "USD",
                "image_url": og_image.get("content", "")[:500] if og_image else "",
                "url": url[:500]
            })

    # 3. Enhanced E-commerce Selectors (Shopify, WooCommerce, etc.)
    if not products:
        # First try to find product links (Shopify style)
        product_links = soup.find_all('a', href=lambda x: x and '/products/' in x)
        if product_links:
            for link in product_links[:50]:  # Limit to 50 products
                href = link.get('href')
                if href:
                    product_url = urljoin(url, href)
                    
                    # Try to find associated product info in parent elements
                    parent = link.parent
                    name = link.get_text(strip=True)
                    
                    # Look for price in nearby elements
                    price = 0.0
                    currency = 'USD'
                    
                    # Check siblings and parent for price
                    for elem in [parent] + list(parent.find_all()) if parent else []:
                        if elem.name in ['span', 'div', 'p'] and ('price' in elem.get('class', []) or 'money' in elem.get('class', [])):
                            price_text = elem.get_text(strip=True)
                            price_match = re.search(r'[\$₹€£]?(\d+(?:,\d{3})*(?:\.\d{2})?)', price_text)
                            if price_match:
                                try:
                                    price = float(price_match.group(1).replace(',', ''))
                                    break
                                except ValueError:
                                    pass
                    
                    # Look for image
                    img_elem = parent.select_one('img') if parent else link.select_one('img')
                    image_url = ""
                    if img_elem:
                        image_url = img_elem.get('src', '')
                        if image_url.startswith('//'):
                            image_url = 'https:' + image_url
                        elif image_url.startswith('/'):
                            image_url = urljoin(url, image_url)
                    
                    if name and len(name) > 3:  # Filter out very short names
                        products.append({
                            "name": name[:250],
                            "category": "General",
                            "price": price,
                            "currency": currency,
                            "image_url": image_url[:500],
                            "url": product_url[:500]
                        })
        else:
            # Common product card selectors for different platforms
            product_selectors = [
                '.product-item', '.product-card', '.product', '.item',
                '[data-product-id]', '[data-product-handle]',
                '.grid-item', '.collection-item', '.product-grid-item',
                '.product-list-item', '.shopify-product-item',
                # Shopify specific
                '.product-single__meta', '.product-info', '.product-details',
                # Generic e-commerce
                '.card', '.grid__item', '.collection__item',
            ]
            
            # Common product card selectors for different platforms
            for selector in product_selectors:
                product_elements = soup.select(selector)
                if product_elements:
                    for elem in product_elements[:20]:  # Limit to 20 products
                        # Extract product name
                        name_elem = elem.select_one('h3, h4, .product-title, .title, a[title], .card-title')
                        name = name_elem.get_text(strip=True) if name_elem else "Unknown Product"
                        
                        # Extract price
                        price_elem = elem.select_one('.price, .product-price, [data-price], .money, .price__current')
                        price = 0.0
                        if price_elem:
                            price_text = price_elem.get_text(strip=True)
                            # Extract numeric price from text like "$29.99", "₹1,299", "29.99 USD"
                            price_match = re.search(r'[\$₹€£]?(\d+(?:,\d{3})*(?:\.\d{2})?)', price_text)
                            if price_match:
                                try:
                                    price = float(price_match.group(1).replace(',', ''))
                                except ValueError:
                                    pass
                        
                        # Extract image
                        img_elem = elem.select_one('img')
                        image_url = ""
                        if img_elem:
                            image_url = img_elem.get('src', '')
                            if image_url.startswith('//'):
                                image_url = 'https:' + image_url
                            elif image_url.startswith('/'):
                                # Try to construct full URL
                                from urllib.parse import urljoin
                                image_url = urljoin(url, image_url)
                        
                        # Extract product URL
                        link_elem = elem.select_one('a')
                        product_url = url
                        if link_elem:
                            href = link_elem.get('href')
                            if href:
                                product_url = urljoin(url, href)
                        
                        if name and name != "Unknown Product":
                            products.append({
                                "name": name[:250],
                                "category": "General",
                                "price": price,
                                "currency": "USD",
                                "image_url": image_url[:500],
                                "url": product_url[:500]
                            })
                    
                    if products:
                        break  # Stop if we found products with this selector

    # 4. Deep Fallback: Heuristics from generic HTML
    if not products:
        title = soup.title.string if soup.title else "Unknown Title"
        price_match = re.search(r'\$\s?(\d+(?:\.\d{2})?)', soup.get_text())
        products.append({
            "name": title.strip()[:250],
            "category": "General",
            "price": float(price_match.group(1)) if price_match else 0.0,
            "currency": "USD",
            "image_url": "",
            "url": url[:500]
        })
        
    return products

async def scrape_competitor_data(url: str, org_id: str, db: AsyncSession):
    logger.info(f"[{org_id}] Scraping data from {url}")
    
    # Run the playwright sequence in a separate thread safely
    content, error = await asyncio.to_thread(_scrape_sync, url)
    
    if error or not content:
        return {"status": "failed", "error": error}
        
    soup = BeautifulSoup(content, 'html.parser')
    extracted_products = extract_products(soup, url)
    
    # Isolate domain name for competitor mapping (e.g., www.instagram.com)
    try:
        domain = url.split("//")[1].split("/")[0]
    except Exception:
        domain = url[:250]
        
    # Check if competitor exists for THIS TENANT securely
    existing_competitor = await db.execute(select(Competitor).where(Competitor.url == domain, Competitor.org_id == org_id))
    competitor = existing_competitor.scalars().first()
    
    if not competitor:
        competitor = Competitor(name=domain, url=domain, org_id=org_id)
        db.add(competitor)
        await db.flush()
        
    # --- SOCIAL MEDIA SENTIMENT BRANCH ---
    if "instagram.com" in domain or "twitter.com" in domain or "facebook.com" in domain:
        # Heavily target meta descriptions which usually hold full post captions without JS rendering
        meta_desc = soup.find("meta", property="og:description")
        raw_text = meta_desc.get("content", "") if meta_desc else soup.get_text(separator=' ', strip=True)[:1000]
        
        # Analyze
        sentiment_data = analyze_text_sentiment(raw_text)
        
        # Upsert: Update if it exists under this specific competitor, otherwise create new
        existing_sentiment_result = await db.execute(select(SocialPostSentiment).where(
            SocialPostSentiment.post_url == url[:500],
            SocialPostSentiment.competitor_id == competitor.id
        ))
        sentiment_entry = existing_sentiment_result.scalars().first()
        
        if sentiment_entry:
            sentiment_entry.content_text = raw_text[:1000]
            sentiment_entry.sentiment_score = sentiment_data["score"]
            sentiment_entry.sentiment_label = sentiment_data["label"]
            sentiment_entry.analyzed_at = datetime.datetime.utcnow()
        else:
            sentiment_entry = SocialPostSentiment(
                competitor_id=competitor.id,
                post_url=url[:500],
                content_text=raw_text[:1000],
                sentiment_score=sentiment_data["score"],
                sentiment_label=sentiment_data["label"]
            )
            db.add(sentiment_entry)
            
        await db.commit()
        
        return {"url": url, "type": "social_post", "sentiment": sentiment_data, "status": "success"}

    # --- STANDARD E-COMMERCE PRODUCT BRANCH ---
    extracted_products = extract_products(soup, url)
    
    for pd in extracted_products:
        # Avoid duplicate product URLs if same competitor
        existing_prod_req = await db.execute(select(Product).where(Product.url == pd["url"]))
        product = existing_prod_req.scalars().first()
        
        if not product:
            product = Product(
                competitor_id=competitor.id,
                name=pd["name"],
                category=pd["category"],
                url=pd["url"],
                image_url=pd["image_url"]
            )
            db.add(product)
            await db.flush()
        
        # Log price state
        history = ProductPriceHistory(
            product_id=product.id,
            price=pd["price"],
            currency=pd.get("currency", "USD"),
            recorded_at=datetime.datetime.utcnow()
        )
        db.add(history)
        
    await db.commit()
    return {"url": url, "products_extracted": len(extracted_products), "status": "success", "data": extracted_products}
