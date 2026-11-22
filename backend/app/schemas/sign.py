"""Esquemas de señas (catálogo)."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SignOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    display_name: str | None = None
    description: str | None = None
    language: str
    created_at: datetime
    # Indica si el modelo activo puede reconocer esta seña. El catálogo puede
    # tener señas cargadas que todavía no fueron entrenadas.
    recognized: bool = True