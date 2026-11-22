"""Rutas de salud y catálogo de señas."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.ai.demo_templates import DEMO_SIGNS
from app.ai.translations import translate_sign
from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.sign import Sign
from app.models.user import User
from app.schemas.sign import SignOut
from app.services import ai_service

router = APIRouter()


@router.get(
    "/health",
    summary="Estado del servicio",
)
def health(db: Session = Depends(get_db)) -> dict:
    try:
        db.execute(text("SELECT 1"))
        database_status = "connected"
    except Exception:
        database_status = "unavailable"
    return {
        "status": "ok" if database_status == "connected" else "degraded",
        "ai_model": ai_service.ai_info().get("model", "unavailable"),
        "database": database_status,
    }


@router.get(
    "/signs",
    response_model=list[SignOut],
    summary="Catálogo de señas soportadas",
)
def list_signs(
    language: str = Query(default="es-AR", min_length=2, max_length=10),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[SignOut]:
    # Clases que el modelo activo sabe reconocer. Si el modelo no se pudo
    # cargar, no marcamos nada como pendiente para no romper el catálogo.
    try:
        model_signs = set(ai_service.ai_info().get("signs") or [])
    except Exception:  # noqa: BLE001 - el catálogo no debe depender del modelo
        model_signs = set()

    def to_out(
        *,
        sign_id: int,
        name: str,
        description: str | None,
        created_at: datetime,
    ) -> SignOut:
        return SignOut(
            id=sign_id,
            name=name,
            display_name=translate_sign(name),
            description=description,
            language=language,
            created_at=created_at,
            recognized=(name in model_signs) if model_signs else True,
        )

    signs = db.query(Sign).filter(Sign.language == language).order_by(Sign.name).all()
    if signs:
        return [
            to_out(
                sign_id=sign.id,
                name=sign.name,
                description=sign.description,
                created_at=sign.created_at,
            )
            for sign in signs
        ]

    # Fallback: si la BD no fue sembrada, mostramos el vocabulario del modelo.
    now = datetime.now(timezone.utc)
    return [
        to_out(sign_id=0, name=name, description=None, created_at=now)
        for name in DEMO_SIGNS
    ]