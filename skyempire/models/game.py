from sqlalchemy import Column, Integer, Float, String, Boolean
from database import Base

class GameState(Base):
    __tablename__ = "game_state"

    id = Column(Integer, primary_key=True, default=1)
    day = Column(Integer, default=1)
    speed = Column(String, default="normal")  # paused, normal, fast

class PlayerAirline(Base):
    __tablename__ = "player_airline"

    id = Column(Integer, primary_key=True, default=1)
    name = Column(String, default="SkyEmpire Airlines")
    hub = Column(String, default="DOH")
    balance = Column(Float, default=50_000_000.0)
    reputation = Column(Float, default=3.0)
    level = Column(Integer, default=1)
    xp = Column(Integer, default=0)
    total_revenue = Column(Float, default=0.0)
    total_costs = Column(Float, default=0.0)
    total_pax = Column(Integer, default=0)
    alliance = Column(String, nullable=True)
    founded_day = Column(Integer, default=1)
    loan_balance = Column(Float, default=0.0)
    stock_price = Column(Float, default=10.0)
    stock_shares = Column(Integer, default=1_000_000)