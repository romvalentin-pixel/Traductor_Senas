"""Modelo `signs` (catálogo de señas)."""

from sqlalchemy import Column, DateTime, Integer, String, Text, func

from app.database.base import Base


class Sign(Base):
    __tablename__ = "signs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    language = Column(String(10), nullable=False, default="es-AR", index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())