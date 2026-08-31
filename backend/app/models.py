from sqlalchemy import Column, Integer, String, Float
from .db import Base

class Word(Base):
    __tablename__ = "words"
    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, unique=True, index=True, nullable=False)
    pos = Column(String, nullable=True)
    definition = Column(String, nullable=True)
    example = Column(String, nullable=True)
    level = Column(String, index=True, nullable=False)  # Beginner/Intermediate/Advanced
    zipf = Column(Float, nullable=True)
    frequency = Column(Integer, nullable=True)
