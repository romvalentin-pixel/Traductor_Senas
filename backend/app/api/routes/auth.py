"""Rutas de autenticación: /api/auth/*"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.database.session import get_db
from app.schemas.token import Token
from app.schemas.user import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    UserCreate,
    UserOut,
)
from app.services import auth_service

router = APIRouter()


@router.post(
    "/register",
    response_model=UserOut,
    status_code=201,
    summary="Registrar un usuario",
)
def register(data: UserCreate, db: Session = Depends(get_db)) -> UserOut:
    return auth_service.register_user(db, data)


@router.post(
    "/login",
    response_model=Token,
    summary="Iniciar sesión (OAuth2 password flow)",
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> dict:
    user = auth_service.authenticate_user(db, form_data.username, form_data.password)
    return {**auth_service.issue_token(user), "token_type": "bearer", "user": user}


@router.get(
    "/me",
    response_model=UserOut,
    summary="Usuario autenticado",
)
def me(current_user: UserOut = Depends(get_current_user)) -> UserOut:
    return current_user


@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse,
    summary="Solicitar recuperación de contraseña",
)
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
) -> ForgotPasswordResponse:
    _user, token = auth_service.request_password_reset(db, payload.email)
    # En producción el código viaja por correo y nunca se expone en la respuesta.
    show_token = settings.DEMO_MODE and not settings.is_production
    return ForgotPasswordResponse(
        message=(
            "Si el email está registrado, vas a recibir un código de recuperación."
            if not show_token
            else (
                "Si el email está registrado, se generó un código de recuperación. "
                "En producción se enviaría por correo."
            )
        ),
        demo_reset_token=token if show_token else None,
        expires_in_minutes=(
            auth_service.RESET_TOKEN_EXPIRE_MINUTES if (token and show_token) else None
        ),
    )


@router.post(
    "/reset-password",
    summary="Restablecer contraseña con código de recuperación",
)
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    auth_service.reset_password(db, payload.token, payload.new_password)
    return {"message": "Contraseña actualizada. Ya podés iniciar sesión."}