from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
import datetime
from app.db.database import Base

class Competitor(Base):
    __tablename__ = "competitors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    url = Column(String, unique=True)
    products = relationship("Product", back_populates="competitor")

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
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    product = relationship("Product", back_populates="price_history")

class TrendReport(Base):
    __tablename__ = "trend_reports"
    id = Column(Integer, primary_key=True, index=True)
    generated_at = Column(DateTime, default=datetime.datetime.utcnow)
    report_data = Column(JSON)
