"""Esquemas de traducciones (historial)."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TranslationCreate(BaseModel):
    sign_detected: str = Field(min_length=1, max_length=100)
    translated_text: str = Field(min_length=1, max_length=2000)
    confidence: float = Field(ge=0.0, le=1.0)
    language: str = Field(default="es-AR", min_length=2, max_length=10)


class TranslationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    sign_detected: str
    translated_text: str
    confidence: float
    language: str
    created_at: datetime