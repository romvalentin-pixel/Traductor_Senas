"""Pruebas de autenticación: registro, login y usuario autenticado."""

from __future__ import annotations

import uuid


def _email() -> str:
    return f"auth-{uuid.uuid4().hex[:10]}@example.com"


def test_register_ok(client):
    resp = client.post(
        "/api/auth/register",
        json={"nombre": "Marta Gómez", "email": _email(), "password": "clave123"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["nombre"] == "Marta Gómez"
    assert "password_hash" not in body
    assert "created_at" in body


def test_register_duplicate_email(client):
    email = _email()
    payload = {"nombre": "Repetida", "email": email, "password": "clave123"}
    assert client.post("/api/auth/register", json=payload).status_code == 201
    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code == 409


def test_register_invalid_email(client):
    resp = client.post(
        "/api/auth/register",
        json={"nombre": "Invalido", "email": "no-es-un-email", "password": "clave123"},
    )
    assert resp.status_code == 422


def test_register_short_password(client):
    resp = client.post(
        "/api/auth/register",
        json={"nombre": "Corta", "email": _email(), "password": "123"},
    )
    assert resp.status_code == 422


def test_login_ok(client):
    email = _email()
    client.post(
        "/api/auth/register",
        json={"nombre": "Login", "email": email, "password": "clave123"},
    )
    resp = client.post("/api/auth/login", data={"username": email, "password": "clave123"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["email"] == email


def test_login_wrong_password(client):
    email = _email()
    client.post(
        "/api/auth/register",
        json={"nombre": "Login", "email": email, "password": "clave123"},
    )
    resp = client.post("/api/auth/login", data={"username": email, "password": "incorrecta"})
    assert resp.status_code == 401


def test_me_without_token(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401


def test_me_with_token(client, auth_headers):
    resp = client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"].endswith("@example.com")