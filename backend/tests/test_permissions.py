"""Permisos de las herramientas internas y gating del modo demostración."""

from __future__ import annotations

import uuid

from app.core.config import settings


def _register_and_login(client, email: str) -> dict:
    client.post(
        "/api/auth/register",
        json={"nombre": "Usuario Permisos", "email": email, "password": "clave123"},
    )
    token = client.post(
        "/api/auth/login", data={"username": email, "password": "clave123"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _email(prefix: str = "perm") -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10]}@example.com"


def test_is_admin_open_in_development(client):
    """Sin ADMIN_EMAILS configurado, en desarrollo cualquier usuario entra."""
    headers = _register_and_login(client, _email())
    assert client.get("/api/auth/me", headers=headers).json()["is_admin"] is True


def test_non_admin_cannot_use_recorder_endpoints(client, monkeypatch):
    monkeypatch.setattr(settings, "ADMIN_EMAILS", "admin@example.com")
    headers = _register_and_login(client, _email("no-admin"))

    assert client.get("/api/auth/me", headers=headers).json()["is_admin"] is False
    assert client.get("/api/ai/dataset", headers=headers).status_code == 403
    assert client.post("/api/ai/train", headers=headers).status_code == 403


def test_admin_can_use_recorder_endpoints(client, monkeypatch):
    email = _email("admin")
    monkeypatch.setattr(settings, "ADMIN_EMAILS", f"otro@example.com,{email}")
    headers = _register_and_login(client, email)

    assert client.get("/api/ai/dataset", headers=headers).status_code == 200


def test_forgot_password_hides_token_when_demo_is_off(client, monkeypatch):
    email = _email("reset")
    _register_and_login(client, email)
    monkeypatch.setattr(settings, "DEMO_MODE", False)

    resp = client.post("/api/auth/forgot-password", json={"email": email})
    assert resp.status_code == 200
    assert resp.json()["demo_reset_token"] is None


def test_forgot_password_returns_token_in_development(client):
    email = _email("reset-dev")
    _register_and_login(client, email)

    resp = client.post("/api/auth/forgot-password", json={"email": email})
    assert resp.status_code == 200
    assert resp.json()["demo_reset_token"]
