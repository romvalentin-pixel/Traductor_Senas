"""Rutas de traducciones: /api/translation/*"""

from __future__ import annotations

import io

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.translation import TranslationCreate, TranslationOut
from app.services import translation_service, tts_service

router = APIRouter()


@router.post(
    "",
    response_model=TranslationOut,
    status_code=201,
    summary="Guardar una traducción en el historial",
)
def create_translation(
    data: TranslationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TranslationOut:
    return translation_service.create_translation(db, current_user, data)


@router.get(
    "/history",
    response_model=list[TranslationOut],
    summary="Historial de traducciones del usuario",
)
def history(
    limit: int = Query(default=50, ge=1, le=200),
    language: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[TranslationOut]:
    return translation_service.list_user_translations(db, current_user, limit, language)


@router.get(
    "/{translation_id}",
    response_model=TranslationOut,
    summary="Obtener una traducción por id",
)
def get_translation(
    translation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TranslationOut:
    return translation_service.get_user_translation(db, current_user, translation_id)


@router.get(
    "/{translation_id}/speak",
    summary="Audio TTS de la traducción",
    responses={200: {"content": {"audio/mpeg": {}}}},
)
def speak_translation(
    translation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    translation = translation_service.get_user_translation(db, current_user, translation_id)
    audio = tts_service.synthesize_text(translation.translated_text)
    return StreamingResponse(
        io.BytesIO(audio),
        media_type="audio/mpeg",
        headers={"Content-Disposition": "inline; filename=traduccion.mp3"},
    )


@router.delete(
    "/{translation_id}",
    summary="Eliminar una traducción",
)
def delete_translation(
    translation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    translation_service.delete_translation(db, current_user, translation_id)
    return {"message": f"Traducción {translation_id} eliminada"}