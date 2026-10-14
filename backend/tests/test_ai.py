"""Pruebas del módulo de IA: clasificación, confianza y manejo de errores."""

from __future__ import annotations

import uuid

from app.ai.demo_templates import DEMO_SIGNS, make_template


def _email() -> str:
    return f"ai-{uuid.uuid4().hex[:10]}@example.com"


def _headers(client) -> dict:
    email = _email()
    client.post(
        "/api/auth/register",
        json={"nombre": "Usuario IA", "email": email, "password": "clave123"},
    )
    token = client.post(
        "/api/auth/login", data={"username": email, "password": "clave123"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_predict_requires_auth(client):
    resp = client.post("/api/ai/predict", json={"landmarks": []})
    assert resp.status_code == 401


def test_predict_demo_sign(client):
    """El modo demo debe devolver una clase válida y confianza en [0, 1]."""
    for sign in DEMO_SIGNS:
        resp = client.post(
            "/api/ai/predict",
            json={"demo_sign": sign},
            headers=_headers(client),
        )
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["sign"] == sign
        assert body["translated_text"]
        assert 0.0 <= body["confidence"] <= 1.0
        assert body["model"] in ("demo", "trained")


def test_predict_with_landmarks(client):
    """El modelo debe aceptar landmarks reales (formato MediaPipe 21x3)."""
    hand = make_template("GRACIAS")
    resp = client.post(
        "/api/ai/predict",
        json={"landmarks": [hand]},
        headers=_headers(client),
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["sign"] in DEMO_SIGNS
    assert 0.0 <= body["confidence"] <= 1.0


def test_predict_no_hands(client):
    resp = client.post(
        "/api/ai/predict",
        json={"landmarks": []},
        headers=_headers(client),
    )
    assert resp.status_code == 400


def test_predict_invalid_landmarks(client):
    resp = client.post(
        "/api/ai/predict",
        json={"landmarks": [[[0.5, 0.5]]]},  # landmark de 2 coords
        headers=_headers(client),
    )
    assert resp.status_code == 422


def test_predict_unknown_demo_sign(client):
    resp = client.post(
        "/api/ai/predict",
        json={"demo_sign": "DESCONOCIDA"},
        headers=_headers(client),
    )
    assert resp.status_code == 400


def test_ai_info(client):
    resp = client.get("/api/ai/info")
    assert resp.status_code == 200
    body = resp.json()
    assert body["features"] == 63
    assert set(body["signs"]) == set(DEMO_SIGNS)