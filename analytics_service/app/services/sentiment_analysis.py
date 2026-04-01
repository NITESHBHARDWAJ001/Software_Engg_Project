from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import logging

logger = logging.getLogger(__name__)

def analyze_text_sentiment(text: str) -> dict:
    """
    Analyzes the sentiment of a given block of text using VADER NLP.
    Returns polarity score (-1.0 to 1.0) and a high-level label.
    """
    analyzer = SentimentIntensityAnalyzer()
    if not text or len(text.strip()) == 0:
        return {"score": 0.0, "label": "Neutral"}
        
    scores = analyzer.polarity_scores(text)
    compound = scores['compound']
    
    if compound >= 0.05:
        label = "Positive"
    elif compound <= -0.05:
        label = "Negative"
    else:
        label = "Neutral"
        
    logger.debug(f"Sentiment Analysis yielded {label} ({compound}) for text snippet.")
    
    return {
        "score": compound,
        "label": label,
        "details": scores
    }
