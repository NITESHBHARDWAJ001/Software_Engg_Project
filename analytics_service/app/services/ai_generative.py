import logging
from openai import AsyncOpenAI
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize client to Groq's free serverless endpoint which uses the openai SDK natively
client = AsyncOpenAI(
    api_key=settings.GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1"
) if "placeholder" not in settings.GROQ_API_KEY else None

async def generate_executive_summary(report_data: dict) -> str:
    if not client:
        return "AI Summary engine is disabled. Provide a valid GROQ_API_KEY in your environment to activate."
        
    prompt = f"You are a Chief Strategy Officer for an e-commerce platform. Analyze this raw competitor market data and provide a concise, 3-paragraph executive summary highlighting key opponent price shifts:\n\n{report_data}"
    
    try:
        response = await client.chat.completions.create(
            model="llama-3.1-8b-instant",  # Upgraded to Llama 3.1 model
            messages=[
                {"role": "system", "content": "You are a highly analytical e-commerce market strategist."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Failed to generate AI executive summary: {e}")
        return f"AI Generation Failed: {str(e)}"

async def generate_defensive_copy(negative_reviews: list) -> str:
    if not client:
        return "AI Copywriting engine is disabled. Provide a valid GROQ_API_KEY in your environment to activate."
        
    if not negative_reviews:
        return "No strictly negative competitor sentiment found to base defensive copywriting on."
        
    context = "\n".join([f"- {r.content_text}" for r in negative_reviews])
    prompt = f"Our competitors' customers are complaining heavily about these specific issues:\n{context}\n\nWrite a dynamic, high-converting, 2-line SEO-optimized ad copy for OUR brand that explicitly solves these exact pain points. Do NOT mention the competitor by name directly."
    
    try:
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",  # Upgraded to Llama 3.3 massive model
            messages=[
                {"role": "system", "content": "You are a world-class digital performance marketing copywriter."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Failed to generate defensive ad copy: {e}")
        return f"AI Generation Failed: {str(e)}"
