from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import logging
import datetime
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import Competitor, Product, ProductPriceHistory

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

    # 3. Deep Fallback: Heuristics from generic HTML
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

async def scrape_competitor_data(url: str, db: AsyncSession):
    logger.info(f"Scraping data from {url}")
    
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
        
    # Check if competitor exists securely to avoid duplicate constraint failures
    existing_competitor = await db.execute(select(Competitor).where(Competitor.url == domain))
    competitor = existing_competitor.scalars().first()
    
    if not competitor:
        competitor = Competitor(name=domain, url=domain)
        db.add(competitor)
        await db.flush()
    
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
