"""Servicio de traducciones: CRUD del historial y consulta de catálogo."""

from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.translation import Translation
from app.models.user import User
from app.schemas.translation import TranslationCreate


class TranslationNotFound(HTTPException):
    pass


def create_translation(db: Session, user: User, data: TranslationCreate) -> Translation:
    translation = Translation(
        user_id=user.id,
        sign_detected=data.sign_detected.strip().upper(),
        translated_text=data.translated_text.strip(),
        confidence=data.confidence,
        language=data.language,
    )
    db.add(translation)
    db.commit()
    db.refresh(translation)
    return translation


def get_user_translation(db: Session, user: User, translation_id: int) -> Translation:
    translation = (
        db.query(Translation)
        .filter(Translation.id == translation_id, Translation.user_id == user.id)
        .first()
    )
    if not translation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Traducción no encontrada",
        )
    return translation


def list_user_translations(
    db: Session,
    user: User,
    limit: int = 50,
    language: str | None = None,
) -> list[Translation]:
    query = db.query(Translation).filter(Translation.user_id == user.id)
    if language:
        query = query.filter(Translation.language == language)
    return (
        query.order_by(Translation.created_at.desc(), Translation.id.desc())
        .limit(min(limit, 200))
        .all()
    )


def delete_translation(db: Session, user: User, translation_id: int) -> None:
    translation = get_user_translation(db, user, translation_id)
    db.delete(translation)
    db.commit()