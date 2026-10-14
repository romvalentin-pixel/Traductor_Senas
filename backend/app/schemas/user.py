"""Esquemas de usuario."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserCreate(BaseModel):
    nombre: str = Field(min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)

    @field_validator("nombre")
    @classmethod
    def _strip_nombre(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 3:
            raise ValueError("El nombre debe tener al menos 3 caracteres")
        return value


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    email: EmailStr
    created_at: datetime
    is_admin: bool = False


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    message: str
    # Modo demostración: sin servicio de email, el token se devuelve para poder
    # completar el flujo. En producción esto debe enviarse por correo y no exponerse.
    demo_reset_token: str | None = None
    expires_in_minutes: int | None = None


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=20, max_length=256)
    new_password: str = Field(min_length=6, max_length=128)