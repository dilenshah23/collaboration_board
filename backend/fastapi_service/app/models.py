from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .database import Base


class Card(Base):
    __tablename__ = 'cards_card'

    id = Column(Integer, primary_key=True, index=True)
    board_id = Column(Integer, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    position = Column(Integer, default=0)
    column = Column(String(50), nullable=False, default='todo')
    created_by = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assignments = relationship('CardAssignment', back_populates='card', cascade='all, delete-orphan')


class CardAssignment(Base):
    __tablename__ = 'cards_cardassignment'

    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(Integer, ForeignKey('cards_card.id'), nullable=False)
    user_id = Column(Integer, nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)

    card = relationship('Card', back_populates='assignments')
