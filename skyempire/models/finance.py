from sqlalchemy import Column, Integer, Float, String, Boolean
from database import Base

class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, autoincrement=True)
    amount = Column(Float)
    remaining = Column(Float)
    interest_rate = Column(Float, default=0.05)
    daily_payment = Column(Float)
    taken_on_day = Column(Integer)
    due_on_day = Column(Integer)
    paid_off = Column(Boolean, default=False)
    loan_type = Column(String, default="standard")  # standard, emergency, expansion


class Stock(Base):
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    airline_name = Column(String)
    current_price = Column(Float, default=10.0)
    previous_price = Column(Float, default=10.0)
    change_pct = Column(Float, default=0.0)
    shares_owned = Column(Integer, default=0)
    total_shares = Column(Integer, default=1_000_000)
    high_52w = Column(Float, default=10.0)
    low_52w = Column(Float, default=10.0)
    volatile = Column(Boolean, default=False)


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    day = Column(Integer)
    description = Column(String)
    amount = Column(Float)
    category = Column(String, default="general")  # revenue, cost, loan, stock, staff
    balance_after = Column(Float)