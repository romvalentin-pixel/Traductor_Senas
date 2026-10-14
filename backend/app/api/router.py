"""Agregador de rutas de la API."""

from fastapi import APIRouter

from app.api.routes import ai, auth, health, translations

api_router = APIRouter()

api_router.include_router(health.router, prefix="/api", tags=["sistema", "señas"])
api_router.include_router(auth.router, prefix="/api/auth", tags=["auth"])
api_router.include_router(ai.router, prefix="/api/ai", tags=["ia"])
api_router.include_router(translations.router, prefix="/api/translation", tags=["traducciones"])