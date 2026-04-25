from sqlalchemy import Column, Integer, Float, String, Boolean
from database import Base

class Competitor(Base):
    __tablename__ = "competitors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String)
    hub = Column(String)
    emoji = Column(String, default="🛩")
    balance = Column(Float, default=40_000_000.0)
    reputation = Column(Float, default=3.0)
    fleet_size = Column(Integer, default=3)
    route_count = Column(Integer, default=2)
    total_pax = Column(Integer, default=0)
    aggression = Column(Float, default=0.5)  # 0.0 passive to 1.0 aggressive
    strategy = Column(String, default="balanced")  # balanced, budget, luxury, expansion
    stock_price = Column(Float, default=10.0)
    alliance = Column(String, nullable=True)
    active = Column(Boolean, default=True)
    founded_day = Column(Integer, default=1)