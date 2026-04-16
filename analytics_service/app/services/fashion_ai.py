import json
import logging
from typing import Any, Dict, List, Optional

from openai import AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)


client = (
    AsyncOpenAI(
        api_key=settings.GROQ_API_KEY,
        base_url="https://api.groq.com/openai/v1",
    )
    if settings.GROQ_API_KEY and "placeholder" not in settings.GROQ_API_KEY
    else None
)


async def generate_personalized_outfit_recommendations(
    user_profile: Dict[str, Any],
    occasion: str,
    budget: float,
    preferences: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Generate personalized ethnic outfit recommendations for the AI stylist feature."""
    if not client:
        return {
            "success": False,
            "error": "AI service unavailable. Set GROQ_API_KEY in analytics service environment.",
        }

    context = f"""
User Profile:
- Gender: {user_profile.get('gender', 'female')}
- Body Type: {user_profile.get('body_type', 'average')}
- Skin Tone: {user_profile.get('skin_tone', 'medium')}
- Age Group: {user_profile.get('age_group', '25-35')}
- Region: {user_profile.get('region', 'north_india')}
- Style Preferences: {', '.join(preferences or [])}
- Occasion: {occasion}
- Budget: INR {budget}
""".strip()

    region_garment_guide = """
=== COMPREHENSIVE COMBINATION MATRIX: REGION + GENDER + OCCASION ===

FEMALE + WEDDING:
- north_india: Lehenga choli (red, maroon, magenta) with heavy zari/zardozi, silk dupatta, full bridal jewellery set
- south_india: Kanjivaram silk saree (jewel tones, gold/silver zari borders), temple jewellery, bangles
- west_india: Paithani saree (imperial maroon, peacock blue, red gold borders) OR Chaniya choli with mirror work
- east_india: Jamdani or Garad silk saree (deep color, intricate weave), mangalsutra, bangles

FEMALE + FESTIVAL:
- north_india: Sharara suit (pastel/bright colors, block printed) OR Phulkari salwar (yellow, orange, pink)
- south_india: Pattu pavadai (bright silk, traditional patterns) OR Silk churidar (festive colors, floral motifs)
- west_india: Ghagra choli with mirror/sequin work (yellow, orange, turquoise) OR Bandhani saree (tie-dye patterns)
- east_india: Mekhela chador (bright Assamese patterns) OR Tant cotton saree (festive colors, handwoven)

FEMALE + OFFICE:
- north_india: Cotton salwar kameez (muted tones: navy, grey, cream, beige) with minimal embroidery
- south_india: Cotton saree (Chettinad, earth tones) with plain silk blouse, minimal jewellery
- west_india: Salwar suit (professional cuts, muted colors, minimal embellishment)
- east_india: Cotton saree (Tant, muted tones) with simple blouse, minimal accessories

FEMALE + PARTY:
- north_india: Lehenga choli (jewel tones, embellished) with crop top option, modern jewellery
- south_india: Silk saree (bold colors, draped contemporary) OR Anarkali suit (glamorous cut, embellished)
- west_india: Chaniya choli (sequins, bold colors) with statement accessories
- east_india: Jamdani saree (draped modern) OR Anarkali in regional silk (bold, embellished)

FEMALE + CASUAL:
- north_india: Salwar kameez (cotton, pastel, simple block print) OR Churidar suit (light colors)
- south_india: Cotton saree (Kerala kasavu style) OR Salwar with cotton dupatta (pastels, simple patterns)
- west_india: Ghagra (cotton, pastel colors, minimal embroidery) OR simple salwar kameez
- east_india: Mekhela chador (cotton, light colors) OR Tant saree (pastel, simple patterns), no heavy jewellery

MALE + WEDDING:
- north_india: Sherwani with churidar (ivory/cream/gold/maroon, heavy embroidery), traditional mojaris, turban
- south_india: Silk mundu with angavastram (traditional drape), formal shirt, Kerala style jewellery
- west_india: Maharaja style sherwani (jewel tones, embroidered), or Rajasthani angrakha with churidar
- east_india: Dhuti-panjabi (Bengali style, cream/ivory, embroidered collar), traditional footwear

MALE + FESTIVAL:
- north_india: Phulkari kurta-pajama (bright colors, embroidered) OR Kurta with traditional dhoti
- south_india: Mundu with shirt (bright traditional colors) OR Silk kurta-pajama (festive colors)
- west_india: Bandhani kurta-pajama (tie-dye, bright colors) OR Kurta with traditional Rajasthani motifs
- east_india: Assamese gamosa kurta set (traditional patterns, bright colors) OR Silk kurta (traditional weave)

MALE + OFFICE:
- ALL REGIONS: Plain cotton/linen kurta with formal dress trousers (grey, navy, cream, beige), NO embroidery
- Alternative: Kurta with subtle Nehru jacket (solid colors, minimal design)
- Alternative: Cotton kurta with blazer
- Strictly NO: Sherwani, Phulkari, Bandhgala, or any festive/wedding wear for office

MALE + PARTY:
- north_india: Kurta-pajama (jewel tones, subtle embroidery) with Nehru jacket or bandhgala
- south_india: Silk kurta-pajama (bold colors) OR Mundu with contemporary shirt
- west_india: Kurta with embroidered elements OR Bandhgala jacket with kurta
- east_india: Silk kurta (regional weave, bold colors) OR Contemporary styled dhoti-kurta

MALE + CASUAL:
- ALL REGIONS: Plain cotton kurta with Relaxed trousers/churidar (pastel/earth tones, minimal design)
- Alternative: Cotton kurta with comfortable churidar or loose pajama
- Alternative: Simple block-printed kurta with casual pants
- Minimal jewellery, simple footwear

BODY TYPE STYLING RULES (applies to all):
- slim: Layered looks (dupatta, overskirt, extended panels), embellished to add volume, structured fitted silhouettes
- average: Balanced cuts, slightly flared options, moderate embroidery, versatile drapes
- athletic (female): Flows and layers to soften angular frame, A-line cuts for lehengas/sarees, slightly loose fits
- curvy (female): Structured fits, side pleats in sarees, fitted blouses, vertical embroidery patterns
- broad_shoulders (male): Layered tops, slightly loose kurtas, patterns that draw eye downward, jackets over kurtas

AGE GROUP STYLING (mandatory variations):
- 18-25: Trendy cuts, bold colors, crop tops for lehengas, contemporary draping, bold statement jewellery
- 25-35: Classic + modern hybrid, structured silhouettes, silk/georgette, sophisticated minimal jewellery
- 35-45: Comfortable dignified fits, heavier fabrics (crepe/silk), richer jewellery, modest necklines, mature palettes (wine, teal, mustard)
- 45+: Graceful loose drapes, pastel/muted tones, minimal embellishment, breathable cotton/linen, simple elegant jewellery

COLOR PALETTE RULES:
- wedding: Rich jewel tones (ruby, sapphire, emerald), gold/metallic accents, dark reds, maroons
- festival: Bright optimistic (yellow, orange, bright pink, turquoise, lime), traditional regional colors
- office: Business professional (navy, grey, cream, beige, light mustard), minimal pattern
- party: Bold saturated (jewel tones, hot pink, bold purple), might include pastels dramatically
- casual: Soft pastels (blush, mint, pale yellow, cream) or earth tones (beige, olive, burnt sienna)

FABRIC RULES:
- wedding: Silk, silk-blend, crepe with embellishment capability (zari, zardozi, sequins)
- festival: Lightweight silk, cotton, georgette, allows for regional weaves (Phulkari, Bandhani, Ikat patterns)
- office: Cotton, linen, cotton-linen blends (breathable, professional look)
- party: Georgette, silk, velvet, materials that allow for embellishment
- casual: Cotton, linen, light silk, comfort-first

ACCESSORY RULES:
- wedding: Full bridal set (necklace, earrings, bangles, rings, tikka), traditional style matching occasion
- festival: Moderate jewellery, statement earrings/bangles, tilak appropriate to region
- office: Minimal jewellery (simple watch, small earrings, one ring), NO heavy pieces
- party: Statement jewellery, mixing traditional+modern, bold earrings/necklaces, chandelier style acceptable
- casual: Minimal jewellery, simple studs/bangles, comfort accessories like simple chains

PRICE GUIDANCE:
- Budget aware: Stay within 20% of user's budget for main garment, offer value options
- Wedding/party: Can use 70-80% of budget for main garment due to embellishment costs
- Office/casual: Keep to 50-60% of budget, prioritize comfort and durability

CRITICAL RULES FOR ALL RECOMMENDATIONS:
1. Each of 3 recommendations MUST use a DIFFERENT garment type
2. At least 2 MUST be region-specific (from the matrix above)
3. The third can be pan-India if it genuinely suits the occasion/age/body type better
4. NEVER repeat the same garment type across recommendations
5. NEVER suggest inappropriate garment types (no heavy bridal wear for office, no casual for wedding)
6. Age group MUST influence styling visibly in all 3 recommendations
7. Body type MUST influence fit/silhouette in all 3 recommendations
8. Gender must ALWAYS be respected (no cross-gender garments)
"""

    prompt = f"""
You are an expert ethnic fashion stylist with deep knowledge of Indian regional textiles, weaves, and occasion wear.
Create 3 outfit recommendations personalized to the profile below.

{context}

{region_garment_guide}

For each recommendation include:
1) outfit_name — give it a culturally evocative name (not just "Traditional Saree")
2) main_garment — be specific: e.g. "Kanjivaram silk saree" not just "saree"
3) complementary_items (array) — region-appropriate accessories and garment pieces
4) color_scheme — specific colors and fabric/print details
5) reasoning — explain WHY this garment suits this specific region + occasion + body type + skin tone
6) price_range — within the user's budget
7) image_query — 4-6 words for an image search (e.g. "kanjivaram silk saree temple jewellery", "rajasthani ghagra choli mirror work")

Return strict JSON with this shape:
{{
  "recommendations": [
    {{
      "outfit_name": "...",
      "main_garment": "...",
      "complementary_items": ["..."],
      "color_scheme": "...",
      "reasoning": "...",
      "price_range": "...",
      "image_query": "..."
    }}
  ]
}}
""".strip()

    try:
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a master ethnic fashion stylist with strong regional and occasion knowledge.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.6,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content or "{}"
        parsed = json.loads(raw)

        recommendations = parsed.get("recommendations", [])
        if not isinstance(recommendations, list):
            recommendations = []

        return {
            "success": True,
            "recommendations": recommendations,
        }
    except Exception as exc:
        logger.exception("Failed to generate outfit recommendations")
        return {
            "success": False,
            "error": str(exc),
        }


async def predict_size_and_fit(
    measurements: Dict[str, Any],
    garment_type: str,
    gender: str,
    fit_preference: str,
    brand_region: Optional[str] = None,
) -> Dict[str, Any]:
    """Predict the right size and fit for ethnic garments based on body measurements."""
    if not client:
        return {
            "success": False,
            "error": "AI service unavailable. Set GROQ_API_KEY in analytics service environment.",
        }

    measurement_lines = "\n".join(
        f"- {k.replace('_', ' ').title()}: {v} cm" for k, v in measurements.items() if v
    )

    prompt = f"""
You are an expert ethnic garment fitting specialist with deep knowledge of Indian sizing conventions.

CUSTOMER MEASUREMENTS:
{measurement_lines}
- Gender: {gender}

GARMENT REQUEST:
- Garment Type: {garment_type}
- Desired Fit: {fit_preference}
- Brand Region: {brand_region or 'generic Indian brand'}

INDIAN ETHNIC SIZING GUIDE (use this to determine size):
For females:
- Blouse/Choli/Churidar top: Based on bust measurement
  XS: bust 30-31", S: 32-33", M: 34-35", L: 36-37", XL: 38-39", XXL: 40-42"
- Lehenga/Skirt waist: Based on waist+hip
  XS: waist 24-25", S: 26-27", M: 28-29", L: 30-32", XL: 33-35", XXL: 36-38"
- Salwar/Churidar: Based on hip
- Saree: One size fits all (5.5m-6.5m), but blouse is sized by bust
For males:
- Kurta/Sherwani: Based on chest
  S: chest 34-36", M: 38-40", L: 42-44", XL: 46-48", XXL: 50-52"
- Pajama/Churidar/Dhoti: Based on waist

ALTERATION GUIDANCE: If measurements fall between sizes or the fit_preference is "fitted/loose", suggest specific alterations.

Return strict JSON:
{{
  "recommended_size": "M",
  "size_explanation": "Why this size was chosen",
  "fit_notes": "How the garment will fit with this size",
  "measurements_used": ["list of which measurements were key"],
  "alteration_suggestions": ["specific alteration if needed, or empty"],
  "sizing_confidence": "high | medium | low",
  "fit_tips": ["2-3 practical tips for wearing this garment type"],
  "size_chart": [
    {{"size": "S", "bust_cm": "...", "waist_cm": "...", "hip_cm": "..."}},
    {{"size": "M", "bust_cm": "...", "waist_cm": "...", "hip_cm": "..."}},
    {{"size": "L", "bust_cm": "...", "waist_cm": "...", "hip_cm": "..."}},
    {{"size": "XL", "bust_cm": "...", "waist_cm": "...", "hip_cm": "..."}}
  ]
}}
""".strip()

    try:
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a master ethnic garment fitting specialist. Provide precise size recommendations based on measurements.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content or "{}"
        parsed = json.loads(raw)

        return {"success": True, "result": parsed}
    except Exception as exc:
        logger.exception("Failed to predict size and fit")
        return {"success": False, "error": str(exc)}


async def forecast_fashion_trends(
    season: str,
    region: str,
    product_category: str,
    target_gender: str,
    price_segment: str,
) -> Dict[str, Any]:
    """Forecast upcoming ethnic fashion trends for merchandising and inventory planning."""
    if not client:
        return {
            "success": False,
            "error": "AI service unavailable. Set GROQ_API_KEY in analytics service environment.",
        }

    prompt = f"""
You are a senior fashion trend forecaster for Indian ethnic and fusion wear.

FORECAST INPUTS:
- Season: {season}
- Region: {region}
- Product Category: {product_category}
- Target Gender: {target_gender}
- Price Segment: {price_segment}

TASK:
Predict near-future trends for this exact combination. Focus on inventory-planning decisions for a CRM/retail business.

Return strict JSON with this shape:
{{
  "forecast_window": "next 3-4 months",
  "trend_direction": "rising | stable | declining",
  "top_colors": ["..."],
  "top_fabrics": ["..."],
  "top_cuts_silhouettes": ["..."],
  "top_motifs_embellishments": ["..."],
  "hero_products": [
    {{"name": "...", "why": "...", "expected_demand": "high|medium|low"}}
  ],
  "inventory_mix_recommendation": [
    {{"bucket": "core classics", "percentage": 0}},
    {{"bucket": "trend-led pieces", "percentage": 0}},
    {{"bucket": "experimental drops", "percentage": 0}}
  ],
  "buying_calendar": [
    {{"month": "...", "action": "..."}}
  ],
  "regional_notes": ["..."],
  "risk_alerts": ["..."],
  "markdown_risk_items": ["..."],
  "business_summary": "2-3 lines explaining inventory impact"
}}

RULES:
- Keep output actionable and business-focused.
- Ensure inventory_mix_recommendation percentages sum to 100.
- Include at least 4 items each in top_colors, top_fabrics, top_cuts_silhouettes, top_motifs_embellishments.
""".strip()

    try:
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert ethnic fashion trend forecaster with strong merchandising intelligence.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.4,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content or "{}"
        parsed = json.loads(raw)
        return {"success": True, "result": parsed}
    except Exception as exc:
        logger.exception("Failed to forecast fashion trends")
        return {"success": False, "error": str(exc)}


async def generate_design_copilot_concepts(
    collection_name: str,
    season: str,
    region: str,
    target_gender: str,
    product_category: str,
    inspiration_keywords: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Generate AI design concepts for merchandising and collection ideation."""
    if not client:
        return {
            "success": False,
            "error": "AI service unavailable. Set GROQ_API_KEY in analytics service environment.",
        }

    prompt = f"""
You are an AI Design Copilot for ethnic fashion merchandising teams.

INPUTS:
- Collection Name: {collection_name}
- Season: {season}
- Region Influence: {region}
- Target Gender: {target_gender}
- Product Category: {product_category}
- Inspiration Keywords: {', '.join(inspiration_keywords or [])}

TASK:
Create design concepts that are commercially viable and production-friendly.

Return strict JSON with this shape:
{{
  "collection_theme": "...",
  "storyline": "...",
  "color_palette": ["..."],
  "fabric_directions": ["..."],
  "embroidery_surface_ideas": ["..."],
  "silhouette_directions": ["..."],
  "capsule_products": [
    {{
      "product_name": "...",
      "design_concept": "...",
      "key_details": ["..."],
      "price_positioning": "entry | mid | premium"
    }}
  ],
  "visual_mood_keywords": ["..."],
  "merchandising_tips": ["..."],
  "manufacturing_notes": ["..."]
}}

RULES:
- Propose at least 6 capsule products.
- Keep ideas specific to Indian ethnic/fusion retail context.
- Ensure suggestions can be translated to production specs.
""".strip()

    try:
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a senior ethnic fashion designer and merchandising advisor.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.65,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content or "{}"
        parsed = json.loads(raw)
        return {"success": True, "result": parsed}
    except Exception as exc:
        logger.exception("Failed to generate design copilot concepts")
        return {"success": False, "error": str(exc)}


async def generate_dynamic_pricing_recommendation(
    product_name: str,
    category: str,
    current_price: float,
    cost_price: float,
    stock_units: int,
    demand_signal: str,
    season: str,
    competitor_prices: Optional[List[float]] = None,
) -> Dict[str, Any]:
    """Recommend dynamic pricing adjustments using demand, seasonality, competitor pricing, and stock."""
    if not client:
        return {
            "success": False,
            "error": "AI service unavailable. Set GROQ_API_KEY in analytics service environment.",
        }

    prompt = f"""
You are a pricing intelligence analyst for an ethnic fashion retail CRM.

INPUTS:
- Product Name: {product_name}
- Category: {category}
- Current Price: INR {current_price}
- Cost Price: INR {cost_price}
- Stock Units: {stock_units}
- Demand Signal: {demand_signal}
- Season: {season}
- Competitor Prices: {competitor_prices or []}

TASK:
Recommend the best next price and explain the rationale in margin-aware, sell-through-aware terms.

Return strict JSON with this shape:
{{
  "recommended_price": 0,
  "price_direction": "increase | maintain | decrease",
  "price_change_percent": 0,
  "margin_impact": "...",
  "sell_through_outlook": "...",
  "pricing_reasoning": ["..."],
  "competitor_positioning": "...",
  "markdown_strategy": "...",
  "urgency": "high | medium | low",
  "guardrails": ["..."]
}}

RULES:
- Never recommend pricing below cost.
- Be explicit about margin vs liquidation tradeoff.
- Use competitor prices when present.
""".strip()

    try:
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a retail pricing strategist for ethnic fashion businesses."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.25,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content or "{}"
        parsed = json.loads(raw)
        return {"success": True, "result": parsed}
    except Exception as exc:
        logger.exception("Failed to generate dynamic pricing recommendation")
        return {"success": False, "error": str(exc)}


async def generate_personalized_discovery_feed(
    customer_name: str,
    location: str,
    browsing_history: Optional[List[str]] = None,
    purchase_history: Optional[List[str]] = None,
    upcoming_occasions: Optional[List[str]] = None,
    preferred_categories: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Generate a personalized product discovery feed for repeat visits and conversion."""
    if not client:
        return {
            "success": False,
            "error": "AI service unavailable. Set GROQ_API_KEY in analytics service environment.",
        }

    prompt = f"""
You are a personalization engine for an ethnic fashion CRM and commerce experience.

CUSTOMER CONTEXT:
- Customer Name: {customer_name}
- Location: {location}
- Browsing History: {browsing_history or []}
- Purchase History: {purchase_history or []}
- Upcoming Occasions: {upcoming_occasions or []}
- Preferred Categories: {preferred_categories or []}

TASK:
Create a personalized home feed with compelling product/story modules tailored to the customer.

Return strict JSON with this shape:
{{
  "feed_strategy": "...",
  "hero_message": "...",
  "modules": [
    {{
      "title": "...",
      "module_type": "hero | recommendations | occasion_edit | restock_alert | regional_pick",
      "items": ["..."],
      "reason": "...",
      "cta": "..."
    }}
  ],
  "personalization_signals": ["..."],
  "conversion_hooks": ["..."]
}}

RULES:
- Create 4 to 6 modules.
- Tailor strongly to occasion calendar and location.
- Keep modules commerce-friendly and repeat-visit oriented.
""".strip()

    try:
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a CRM personalization expert for ethnic fashion retail."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.55,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content or "{}"
        parsed = json.loads(raw)
        return {"success": True, "result": parsed}
    except Exception as exc:
        logger.exception("Failed to generate discovery feed")
        return {"success": False, "error": str(exc)}


async def generate_product_content_bundle(
    product_name: str,
    category: str,
    fabric: str,
    color: str,
    embellishments: Optional[List[str]] = None,
    target_audience: str = "women festive shoppers",
    tone: str = "premium",
    languages: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Generate product titles, descriptions, SEO tags, captions, and multilingual copy."""
    if not client:
        return {
            "success": False,
            "error": "AI service unavailable. Set GROQ_API_KEY in analytics service environment.",
        }

    prompt = f"""
You are a product content generator for an ethnic fashion catalog team.

PRODUCT INPUT:
- Product Name: {product_name}
- Category: {category}
- Fabric: {fabric}
- Color: {color}
- Embellishments: {embellishments or []}
- Target Audience: {target_audience}
- Brand Tone: {tone}
- Languages: {languages or ['English']}

TASK:
Generate a complete product content bundle for catalog, SEO, and social use.

Return strict JSON with this shape:
{{
  "product_title": "...",
  "short_description": "...",
  "long_description": "...",
  "seo_keywords": ["..."],
  "social_caption": "...",
  "bullet_features": ["..."],
  "marketplace_title_variants": ["..."],
  "multilingual_copy": [
    {{"language": "English", "title": "...", "description": "..."}}
  ]
}}

RULES:
- Keep copy commercially strong and searchable.
- Include 6 to 10 SEO keywords.
- Ensure multilingual_copy includes all requested languages.
""".strip()

    try:
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a high-performing catalog copywriter for ethnic fashion brands."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.6,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content or "{}"
        parsed = json.loads(raw)
        return {"success": True, "result": parsed}
    except Exception as exc:
        logger.exception("Failed to generate product content bundle")
        return {"success": False, "error": str(exc)}


async def generate_support_assistant_response(
    customer_question: str,
    product_context: Optional[Dict[str, Any]] = None,
    size_context: Optional[Dict[str, Any]] = None,
    shipping_policy: Optional[str] = None,
    return_policy: Optional[str] = None,
) -> Dict[str, Any]:
    """Generate catalog-aware support responses for product, size, shipping, and styling queries."""
    if not client:
        return {
            "success": False,
            "error": "AI service unavailable. Set GROQ_API_KEY in analytics service environment.",
        }

    prompt = f"""
You are an AI customer support assistant for an ethnic fashion business.

QUESTION:
- Customer Question: {customer_question}

CATALOG CONTEXT:
- Product Context: {product_context or {}}
- Size Context: {size_context or {}}
- Shipping Policy: {shipping_policy or 'Standard shipping policy not provided'}
- Return Policy: {return_policy or 'Return policy not provided'}

TASK:
Answer clearly, accurately, and in a customer-friendly manner. Be helpful but do not invent unavailable policy details.
Act like a strong retail support agent who must both help the customer and guide the support team.

Return strict JSON with this shape:
{{
    "answer": "...",
    "customer_reply": "A polished customer-facing response in 3-6 sentences",
    "internal_summary": "1-2 sentence internal note for the support agent/CRM timeline",
  "answer_type": "product | size | shipping | returns | styling | mixed",
  "confidence": "high | medium | low",
    "missing_information": ["..."],
    "policy_used": ["..."],
  "follow_up_questions": ["..."],
  "recommended_actions": ["..."],
    "cross_sell_suggestions": ["..."],
    "size_guidance": "...",
    "shipping_guidance": "...",
  "escalation_needed": true,
  "escalation_reason": "..."
}}

RULES:
- If context is missing, acknowledge that and ask a precise follow-up.
- Escalation should be true only if the answer depends on unavailable or risky information.
- customer_reply must be natural, empathetic, and safe to send directly.
- internal_summary should be concise and operational.
- If there is a useful upsell/styling opportunity, include 1-3 cross_sell_suggestions. Otherwise return an empty list.
- For shipping promises, never overcommit beyond the policy/context provided.
""".strip()

    try:
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a careful and helpful support assistant for catalog-aware retail support."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.35,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content or "{}"
        parsed = json.loads(raw)
        return {"success": True, "result": parsed}
    except Exception as exc:
        logger.exception("Failed to generate support assistant response")
        return {"success": False, "error": str(exc)}


async def generate_visual_search_matches(
    image_description: Optional[str] = None,
    image_url: Optional[str] = None,
    target_category: Optional[str] = None,
    occasion: Optional[str] = None,
    budget: Optional[float] = None,
    region: Optional[str] = None,
    style_preferences: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Generate similar-style product discovery suggestions from visual cues."""
    if not client:
        return {
            "success": False,
            "error": "AI service unavailable. Set GROQ_API_KEY in analytics service environment.",
        }

    prompt = f"""
You are a visual search and style-similarity assistant for Indian ethnic fashion retail.

INPUTS:
- Image Description: {image_description or 'Not provided'}
- Image URL: {image_url or 'Not provided'}
- Target Category: {target_category or 'Not provided'}
- Occasion: {occasion or 'Not provided'}
- Budget: {budget if budget is not None else 'Not provided'}
- Region: {region or 'Not provided'}
- Style Preferences: {style_preferences or []}

TASK:
Infer style attributes from the visual description and return similar shopping directions for catalog search.

Return strict JSON with this shape:
{{
  "visual_signature": ["..."],
  "search_queries": ["..."],
  "similar_matches": [
    {{
      "match_name": "...",
      "category": "...",
      "key_attributes": ["..."],
      "price_band": "...",
      "similarity_reason": "...",
      "styling_tip": "..."
    }}
  ],
  "merchandising_filters": ["..."],
  "inventory_recommendation": "...",
  "confidence": "high | medium | low"
}}

RULES:
- Return 4 to 8 similar_matches.
- Keep recommendations within budget context when budget is provided.
- Keep category and occasion relevance high.
""".strip()

    try:
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a visual style-matching expert for ethnic fashion catalogs."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.45,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content or "{}"
        parsed = json.loads(raw)
        return {"success": True, "result": parsed}
    except Exception as exc:
        logger.exception("Failed to generate visual search matches")
        return {"success": False, "error": str(exc)}


async def generate_inventory_replenishment_plan(
    sku: str,
    product_name: str,
    category: str,
    current_stock: int,
    avg_weekly_sales: float,
    lead_time_days: int,
    season: str,
    region: str,
    current_open_po_units: int = 0,
    service_level: str = "medium",
) -> Dict[str, Any]:
    """Forecast SKU demand and recommend replenishment quantities to avoid stockouts and overstock."""
    if not client:
        return {
            "success": False,
            "error": "AI service unavailable. Set GROQ_API_KEY in analytics service environment.",
        }

    prompt = f"""
You are an inventory planning analyst for an ethnic fashion CRM.

INPUTS:
- SKU: {sku}
- Product Name: {product_name}
- Category: {category}
- Current Stock: {current_stock}
- Avg Weekly Sales: {avg_weekly_sales}
- Lead Time (days): {lead_time_days}
- Season: {season}
- Region: {region}
- Open PO Units: {current_open_po_units}
- Service Level Target: {service_level}

TASK:
Predict short-term demand and recommend purchase quantities for this SKU.

Return strict JSON with this shape:
{{
  "forecast_horizon": "next 4-8 weeks",
  "predicted_weekly_demand": [
    {{"week": "W1", "units": 0}},
    {{"week": "W2", "units": 0}},
    {{"week": "W3", "units": 0}},
    {{"week": "W4", "units": 0}}
  ],
  "total_predicted_demand": 0,
  "safety_stock_units": 0,
  "reorder_point_units": 0,
  "recommended_purchase_units": 0,
  "recommended_order_timing": "order now | order in X days",
  "stockout_risk": "high | medium | low",
  "overstock_risk": "high | medium | low",
  "reasoning": ["..."],
  "scenario_notes": ["..."],
  "actions": ["..."]
}}

RULES:
- Account for lead time and open purchase orders.
- Keep recommended_purchase_units >= 0.
- Highlight both stockout and overstock risks.
""".strip()

    try:
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a precise inventory replenishment planner for fashion retail SKUs.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.25,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content or "{}"
        parsed = json.loads(raw)
        return {"success": True, "result": parsed}
    except Exception as exc:
        logger.exception("Failed to generate inventory replenishment plan")
        return {"success": False, "error": str(exc)}
