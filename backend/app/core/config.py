"""
Configuración central del backend.

Las variables se cargan desde variables de entorno y/o el archivo `backend/.env`.
Nunca se almacenan secretos en el código.
"""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Aplicación ---
    APP_NAME: str = "Traductor de Lenguaje de Señas"
    APP_VERSION: str = "1.0.0"
    # development | production. En producción se apagan los atajos de demo.
    APP_ENV: str = "development"
    DEBUG: bool = False
    API_PREFIX: str = "/api"

    # --- Herramientas internas ---
    # Permite el atajo de demo (token de recuperación visible, seña sintética).
    # En producción debe quedar en false.
    DEMO_MODE: bool = True
    # Emails con acceso al grabador de señas y al entrenamiento.
    # Si está vacío, en desarrollo cualquier usuario autenticado puede usarlos
    # y en producción nadie (hay que configurar la lista).
    ADMIN_EMAILS: str = ""

    # --- Base de datos ---
    DATABASE_URL: str = (
        "postgresql://postgres:postgres@localhost:5432/sign_language"
    )

    # --- Seguridad / JWT ---
    SECRET_KEY: str = "cambiar-esta-clave-en-produccion"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # --- CORS ---
    CORS_ORIGINS: str = (
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
    )

    # --- IA ---
    # Ruta a un modelo entrenado. Si se deja vacío se usa el modelo demo.
    AI_MODEL_PATH: str = ""
    AI_MODEL_MODE: str = "auto"  # auto | demo | trained
    AI_MIN_CONFIDENCE: float = 0.45
    AI_FEATURES: int = 63  # 21 landmarks x 3 coordenadas

    # --- Text-to-Speech ---
    TTS_LANGUAGE: str = "es"

    @property
    def cors_origins_list(self) -> list[str]:
        """Convierte la cadena CORS_ORIGINS en una lista."""
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.strip().lower() == "production"

    @property
    def admin_emails_list(self) -> list[str]:
        return [e.strip().lower() for e in self.ADMIN_EMAILS.split(",") if e.strip()]

    def is_admin_email(self, email: str | None) -> bool:
        """True si el email puede usar las herramientas internas."""
        email = (email or "").strip().lower()
        admins = self.admin_emails_list
        if admins:
            return email in admins
        # Sin lista configurada: abierto en desarrollo, cerrado en producción.
        return not self.is_production


settings = Settings()