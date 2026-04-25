from sqlalchemy import Column, Integer, Float, String, Boolean
from database import Base

class Aircraft(Base):
    __tablename__ = "aircraft"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String)
    model = Column(String)
    emoji = Column(String, default="✈")
    owner = Column(String, default="player")  # player or competitor name
    seats = Column(Integer)
    range_km = Column(Integer)
    speed_kmh = Column(Integer)
    daily_cost = Column(Float)
    condition = Column(Float, default=100.0)
    age_days = Column(Integer, default=0)
    status = Column(String, default="idle")  # idle, flying, maintenance
    route_id = Column(Integer, nullable=True)
    fuel_efficiency = Column(String, default="Good")
    aircraft_type = Column(String, default="Narrowbody")


class AircraftCatalog(Base):
    __tablename__ = "aircraft_catalog"

    id = Column(Integer, primary_key=True, autoincrement=True)
    model = Column(String)
    manufacturer = Column(String)
    emoji = Column(String, default="✈")
    seats = Column(Integer)
    range_km = Column(Integer)
    speed_kmh = Column(Integer)
    price = Column(Float)
    daily_cost = Column(Float)
    fuel_efficiency = Column(String)
    aircraft_type = Column(String)
    min_level = Column(Integer, default=1)