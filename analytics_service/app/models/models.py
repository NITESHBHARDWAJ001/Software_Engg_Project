from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
import datetime
from app.db.database import Base


def utc_now() -> datetime.datetime:
    return datetime.datetime.now(datetime.UTC)

class Organization(Base):
    __tablename__ = "organizations"
    org_id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True, nullable=True)
    slug = Column(String, unique=True, index=True, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

class StockContextEntry(Base):
    __tablename__ = "stock_context_entries"
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(String, index=True)
    source_mode = Column(String, default="AUTO")
    sku = Column(String, index=True)
    name = Column(String, index=True)
    category = Column(String, index=True)
    current_stock = Column(Integer, default=0)
    note = Column(Text, nullable=True)
    captured_at = Column(DateTime, default=utc_now, index=True)

class Competitor(Base):
    __tablename__ = "competitors"
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(String, index=True)
    name = Column(String, index=True)
    url = Column(String)
    products = relationship("Product", back_populates="competitor")
    social_posts = relationship("SocialPostSentiment", back_populates="competitor", cascade="all, delete-orphan")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    competitor_id = Column(Integer, ForeignKey("competitors.id"))
    name = Column(String, index=True)
    category = Column(String)
    url = Column(String, unique=True)
    image_url = Column(String)
    
    competitor = relationship("Competitor", back_populates="products")
    price_history = relationship("ProductPriceHistory", back_populates="product", cascade="all, delete-orphan")

class ProductPriceHistory(Base):
    __tablename__ = "product_price_history"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    price = Column(Float)
    currency = Column(String, default="USD")
    recorded_at = Column(DateTime, default=utc_now)
    
    product = relationship("Product", back_populates="price_history")

class TrendReport(Base):
    __tablename__ = "trend_reports"
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(String, index=True)
    generated_at = Column(DateTime, default=utc_now)
    report_data = Column(JSON)

class SocialPostSentiment(Base):
    __tablename__ = "social_post_sentiments"
    id = Column(Integer, primary_key=True, index=True)
    competitor_id = Column(Integer, ForeignKey("competitors.id"))
    post_url = Column(String)
    content_text = Column(Text)
    sentiment_score = Column(Float)
    sentiment_label = Column(String)
    analyzed_at = Column(DateTime, default=utc_now)
    
    competitor = relationship("Competitor", back_populates="social_posts")
