"""Servicio de autenticación: registro, login y verificación de tokens."""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.user import UserCreate

RESET_TOKEN_EXPIRE_MINUTES = 30


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email.lower()).first()


def register_user(db: Session, data: UserCreate) -> User:
    email = data.email.lower()
    if get_user_by_email(db, email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El email ya está registrado",
        )
    user = User(
        nombre=data.nombre.strip(),
        email=email,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def issue_token(user: User) -> dict:
    token = create_access_token(subject=str(user.email))
    return {
        "access_token": token,
        "token_type": "bearer",
    }


def request_password_reset(db: Session, email: str) -> tuple[User | None, str | None]:
    """Genera un token de recuperación si el usuario existe.

    Devuelve (usuario, token). Si el usuario no existe devuelve (None, None)
    para que la ruta responda con un mensaje genérico sin revelar cuentas.
    """
    user = get_user_by_email(db, email)
    if not user:
        return None, None
    token = secrets.token_urlsafe(32)
    user.password_reset_token = token
    user.password_reset_expires = datetime.now(timezone.utc) + timedelta(
        minutes=RESET_TOKEN_EXPIRE_MINUTES
    )
    db.add(user)
    db.commit()
    return user, token


def reset_password(db: Session, token: str, new_password: str) -> User:
    user = (
        db.query(User)
        .filter(User.password_reset_token == token.strip())
        .first()
    )
    if not user or not user.password_reset_expires:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El enlace o código de recuperación no es válido.",
        )
    expires = user.password_reset_expires
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        user.password_reset_token = None
        user.password_reset_expires = None
        db.add(user)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El código de recuperación expiró. Solicitá uno nuevo.",
        )
    user.password_hash = hash_password(new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    db.add(user)
    db.commit()
    db.refresh(user)
    return user