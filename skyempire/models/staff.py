from sqlalchemy import Column, Integer, Float, String, Boolean
from database import Base

class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String)
    emoji = Column(String, default="👤")
    role = Column(String)
    category = Column(String, default="general")  # pilot, engineer, cabin, management
    skill = Column(Float, default=50.0)
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    morale = Column(Float, default=100.0)
    salary = Column(Float, default=5000.0)
    hired = Column(Boolean, default=False)
    owner = Column(String, default="player")
    fatigue = Column(Float, default=0.0)
    speciality = Column(String, nullable=True)
    bonus_effect = Column(String, nullable=True)
    hire_day = Column(Integer, nullable=True)


class StaffTraining(Base):
    __tablename__ = "staff_training"

    id = Column(Integer, primary_key=True, autoincrement=True)
    staff_id = Column(Integer)
    training_type = Column(String)
    cost = Column(Float)
    duration_days = Column(Integer)
    progress = Column(Integer, default=0)
    completed = Column(Boolean, default=False)
    started_day = Column(Integer)
    skill_gain = Column(Float, default=10.0)