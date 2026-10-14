"""Pruebas de traducciones: creación, historial, consulta y eliminación."""

from __future__ import annotations

import uuid

from app.ai.translations import translate_sign

VALID_TRANSLATION = {
    "sign_detected": "HOLA",
    "translated_text": "Hola",
    "confidence": 0.94,
    "language": "es-AR",
}


def _email() -> str:
    return f"tr-{uuid.uuid4().hex[:10]}@example.com"


def _register_and_login(client) -> dict:
    email = _email()
    client.post(
        "/api/auth/register",
        json={"nombre": "Traductor", "email": email, "password": "clave123"},
    )
    token = client.post(
        "/api/auth/login", data={"username": email, "password": "clave123"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_requires_auth(client):
    resp = client.post("/api/translation", json=VALID_TRANSLATION)
    assert resp.status_code == 401


def test_create_and_get(client):
    headers = _register_and_login(client)
    created = client.post("/api/translation", json=VALID_TRANSLATION, headers=headers)
    assert created.status_code == 201
    body = created.json()
    assert body["sign_detected"] == "HOLA"
    assert body["translated_text"] == "Hola"
    assert body["confidence"] == 0.94

    fetched = client.get(f"/api/translation/{body['id']}", headers=headers)
    assert fetched.status_code == 200
    assert fetched.json()["id"] == body["id"]


def test_create_invalid_confidence(client):
    headers = _register_and_login(client)
    payload = {**VALID_TRANSLATION, "confidence": 1.5}
    resp = client.post("/api/translation", json=payload, headers=headers)
    assert resp.status_code == 422


def test_history(client):
    headers = _register_and_login(client)
    client.post(
        "/api/translation", json={**VALID_TRANSLATION, "sign_detected": "SI"}, headers=headers
    )
    client.post(
        "/api/translation", json={**VALID_TRANSLATION, "sign_detected": "NO"}, headers=headers
    )
    resp = client.get("/api/translation/history", headers=headers)
    assert resp.status_code == 200
    signs = [item["sign_detected"] for item in resp.json()]
    assert signs == ["NO", "SI"]  # orden descendente por fecha


def test_history_requires_auth(client):
    resp = client.get("/api/translation/history")
    assert resp.status_code == 401


def test_delete(client):
    headers = _register_and_login(client)
    created = client.post("/api/translation", json=VALID_TRANSLATION, headers=headers).json()
    resp = client.delete(f"/api/translation/{created['id']}", headers=headers)
    assert resp.status_code == 200
    gone = client.get(f"/api/translation/{created['id']}", headers=headers)
    assert gone.status_code == 404


def test_cannot_access_other_user_translation(client):
    created = client.post(
        "/api/translation",
        json=VALID_TRANSLATION,
        headers=_register_and_login(client),
    ).json()

    other = _register_and_login(client)
    resp = client.get(f"/api/translation/{created['id']}", headers=other)
    assert resp.status_code == 404

    resp = client.delete(f"/api/translation/{created['id']}", headers=other)
    assert resp.status_code == 404


def test_translate_unknown_sign_replaces_underscores():
    """Una seña nueva sin traducción fija se muestra legible."""
    assert translate_sign("BUENAS_NOCHES") == "Buenas Noches"
