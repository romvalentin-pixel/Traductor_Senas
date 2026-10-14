"""Esquemas Pydantic (validación de entradas y salidas)."""

from app.schemas.ai import AIInfo, PredictRequest, PredictResponse
from app.schemas.sign import SignOut
from app.schemas.token import Token, TokenPayload
from app.schemas.translation import TranslationCreate, TranslationOut
from app.schemas.user import UserCreate, UserLogin, UserOut

__all__ = [
    "UserCreate",
    "UserLogin",
    "UserOut",
    "Token",
    "TokenPayload",
    "SignOut",
    "TranslationCreate",
    "TranslationOut",
    "PredictRequest",
    "PredictResponse",
    "AIInfo",
]
