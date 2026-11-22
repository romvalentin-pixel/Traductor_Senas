"""Configuración compartida de pytest para el backend."""

import os

# Importante: configurar el entorno ANTES de importar la app.
os.environ["DATABASE_URL"] = "sqlite:///./test_sl.db"
os.environ["SECRET_KEY"] = "clave-de-prueba"
os.environ["AI_MODEL_PATH"] = ""  # usa el modo demo
os.environ["AI_MODEL_MODE"] = "demo"  # evita cargar un modelo entrenado local
# Entorno controlado: los tests no deben depender del `backend/.env` real.
# Los casos de permisos cambian ADMIN_EMAILS con monkeypatch.
os.environ["APP_ENV"] = "development"
os.environ["DEMO_MODE"] = "true"
os.environ["ADMIN_EMAILS"] = ""

import uuid  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.ai.demo_templates import DEMO_SIGNS  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


def _unique_email(domain: str = "example.com") -> str:
    return f"user-{uuid.uuid4().hex[:12]}@{domain}"


@pytest.fixture
def auth_headers(client: TestClient) -> dict:
    """Registra y loguea un usuario; devuelve headers con el JWT."""
    email = _unique_email()
    password = "clave123"
    client.post(
        "/api/auth/register",
        json={"nombre": "Usuario Prueba", "email": email, "password": password},
    )
    resp = client.post(
        "/api/auth/login",
        data={"username": email, "password": password},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def demo_sign() -> str:
    return DEMO_SIGNS[0]