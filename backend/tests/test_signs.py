"""Pruebas del catálogo de señas y su fallback sin datos sembrados."""

from __future__ import annotations

import uuid

from app.ai.demo_templates import DEMO_SIGNS


def _headers(client) -> dict:
    email = f"signs-{uuid.uuid4().hex[:10]}@example.com"
    client.post(
        "/api/auth/register",
        json={"nombre": "Catálogo", "email": email, "password": "clave123"},
    )
    token = client.post(
        "/api/auth/login", data={"username": email, "password": "clave123"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_health_alias_short_path(client):
    """`/health` responde igual que `/api/health` para clientes que usan la ruta corta."""
    resp = client.get("/health")
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["status"] in {"ok", "degraded"}
    assert "database" in body


def test_signs_requires_auth(client):
    resp = client.get("/api/signs")
    assert resp.status_code == 401


def test_signs_fallback_without_seed(client):
    """Con la BD de pruebas vacía debe devolver el vocabulario demo, no 500."""
    resp = client.get("/api/signs", headers=_headers(client))
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert [item["name"] for item in body] == DEMO_SIGNS
    assert all(item["created_at"] for item in body)
    assert all(item["display_name"] for item in body)
    assert all(item["recognized"] for item in body)


def test_signs_marks_signs_missing_from_model(client):
    """Una seña del catálogo sin entrenar se marca como no reconocida."""
    from app.database.session import SessionLocal
    from app.models.sign import Sign

    with SessionLocal() as db:
        db.add(Sign(name="NUEVA_SIN_ENTRENAR", language="es-AR"))
        db.commit()
    try:
        body = client.get("/api/signs", headers=_headers(client)).json()
        nueva = next(item for item in body if item["name"] == "NUEVA_SIN_ENTRENAR")
        assert nueva["recognized"] is False
        assert nueva["display_name"] == "Nueva Sin Entrenar"
    finally:
        with SessionLocal() as db:
            db.query(Sign).filter(Sign.name == "NUEVA_SIN_ENTRENAR").delete()
            db.commit()
