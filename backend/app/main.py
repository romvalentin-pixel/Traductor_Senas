"""
Punto de entrada del backend FastAPI.

Ejecutar localmente desde `backend/`:
    uvicorn app.main:app --reload --port 8000

Documentación automática (Swagger): http://localhost:8000/docs
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import app.models  # noqa: F401  (registra los modelos antes de create_all)
from app.api.router import api_router
from app.api.routes.health import health as health_check
from app.core.config import settings
from app.database.base import Base
from app.database.session import engine, get_db


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Crea las tablas si no existen (útil en desarrollo; en producción se usa
    # database/schema.sql + migraciones).
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "API REST del sistema de traducción de lenguaje de señas a texto y voz. "
        "Documentación generada automáticamente por FastAPI/OpenAPI."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# --- CORS -------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Rutas -------------------------------------------------------------
app.include_router(api_router)


@app.get("/", tags=["sistema"], summary="Información raíz")
def root() -> dict:
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/api/health",
    }


@app.get(
    "/health",
    tags=["sistema"],
    summary="Alias de /api/health",
    include_in_schema=False,
)
def health_alias(db: Session = Depends(get_db)) -> dict:
    """Alias corto de `/api/health`.

    Algunos clientes, extensiones y monitores piden `/health` directamente.
    Devuelve lo mismo que la ruta oficial para evitar un 404 confuso.
    """
    return health_check(db)