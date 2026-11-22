"""Modelo `translations` (historial)."""

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.database.base import Base


class Translation(Base):
    __tablename__ = "translations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sign_detected = Column(String(100), nullable=False, index=True)
    translated_text = Column(Text, nullable=False)
    confidence = Column(Float, nullable=False, default=0.0)
    language = Column(String(10), nullable=False, default="es-AR", index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    user = relationship("User", back_populates="translations")