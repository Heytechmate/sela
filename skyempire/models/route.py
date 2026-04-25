from sqlalchemy import Column, Integer, Float, String, Boolean
from database import Base

class Airport(Base):
    __tablename__ = "airports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String, unique=True)
    name = Column(String)
    city = Column(String)
    country = Column(String)
    lat = Column(Float)
    lon = Column(Float)
    size = Column(String, default="medium")  # small, medium, large, hub


class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    owner = Column(String, default="player")  # player or competitor name
    from_code = Column(String)
    to_code = Column(String)
    from_city = Column(String)
    to_city = Column(String)
    distance_km = Column(Integer)
    active = Column(Boolean, default=False)
    aircraft_id = Column(Integer, nullable=True)
    daily_flights = Column(Integer, default=2)
    ticket_price = Column(Float, default=300.0)
    demand_base = Column(Float, default=0.80)
    profit_per_day = Column(Float, default=0.0)
    pax_per_day = Column(Integer, default=0)
    season_modifier = Column(Float, default=1.0)