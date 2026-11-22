"""Pruebas del dataset de señas y los endpoints de captura/entrenamiento."""

from __future__ import annotations

import uuid
from pathlib import Path

import pytest

from app.services import dataset_service

HAND = [[i * 0.01, (i % 5) * 0.02, 0.0] for i in range(21)]


def _headers(client) -> dict:
    email = f"ds-{uuid.uuid4().hex[:10]}@example.com"
    client.post(
        "/api/auth/register",
        json={"nombre": "Usuario Dataset", "email": email, "password": "clave123"},
    )
    token = client.post(
        "/api/auth/login", data={"username": email, "password": "clave123"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def dataset_dir(tmp_path: Path, monkeypatch) -> Path:
    """Redirige el dataset a un directorio temporal por prueba."""
    target = tmp_path / "argentine"
    monkeypatch.setattr(dataset_service, "DATASET_DIR", target)
    return target


@pytest.fixture(autouse=True)
def _clean_catalog():
    """Deja la tabla `signs` vacía: el test de fallback depende de eso."""
    yield
    from app.database.session import SessionLocal
    from app.models.sign import Sign

    with SessionLocal() as db:
        db.query(Sign).delete()
        db.commit()


def test_save_samples_writes_json(dataset_dir: Path):
    result = dataset_service.save_samples("prueba nueva", [HAND] * 3)

    assert result["sign"] == "PRUEBA_NUEVA"
    assert result["saved"] == 3
    assert result["total_for_sign"] == 3
    files = list((dataset_dir / "PRUEBA_NUEVA").glob("*.json"))
    assert len(files) == 3


def test_save_samples_accepts_single_letter(dataset_dir: Path):
    """Las letras del alfabeto LSA son señas válidas de un carácter."""
    result = dataset_service.save_samples("a", [HAND])

    assert result["sign"] == "A"
    assert result["saved"] == 1


def test_save_samples_rejects_bad_sign(dataset_dir: Path):
    with pytest.raises(ValueError):
        dataset_service.save_samples("!!!", [HAND])


def test_save_samples_rejects_bad_hand(dataset_dir: Path):
    with pytest.raises(ValueError):
        dataset_service.save_samples("PRUEBA", [HAND[:10]])


def test_dataset_summary_counts(dataset_dir: Path):
    dataset_service.save_samples("HOLA", [HAND])
    dataset_service.save_samples("HOLA", [HAND] * 2)
    dataset_service.save_samples("GRACIAS", [HAND])

    summary = dataset_service.dataset_summary()
    counts = {item["sign"]: item["count"] for item in summary["classes"]}
    assert counts == {"GRACIAS": 1, "HOLA": 3}
    assert summary["total_samples"] == 4


def test_dataset_endpoint_requires_auth(client):
    assert client.get("/api/ai/dataset").status_code == 401


def test_dataset_endpoint_returns_summary(client, dataset_dir: Path):
    dataset_service.save_samples("HOLA", [HAND] * 2)
    resp = client.get("/api/ai/dataset", headers=_headers(client))
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_samples"] == 2
    assert body["classes"][0]["sign"] == "HOLA"


def test_samples_endpoint_validates_payload(client, dataset_dir: Path):
    headers = _headers(client)

    bad = client.post(
        "/api/ai/samples",
        json={"sign": "HOLA", "samples": [[[0.0, 0.0]]]},
        headers=headers,
    )
    assert bad.status_code == 422

    ok = client.post(
        "/api/ai/samples",
        json={"sign": "HOLA", "samples": [HAND] * 2},
        headers=headers,
    )
    assert ok.status_code == 201, ok.text
    assert ok.json()["saved"] == 2


def test_samples_endpoint_registers_sign_in_catalog(client, dataset_dir: Path):
    """Al guardar, la seña aparece en el catálogo que consume la app."""
    from app.database.session import SessionLocal
    from app.models.sign import Sign

    headers = _headers(client)
    payload = {"sign": "PRUEBA_CATALOGO", "samples": [HAND]}

    first = client.post("/api/ai/samples", json=payload, headers=headers)
    assert first.status_code == 201, first.text
    assert first.json()["catalog_added"] is True

    signs = client.get("/api/signs", headers=headers).json()
    assert any(item["name"] == "PRUEBA_CATALOGO" for item in signs)

    second = client.post("/api/ai/samples", json=payload, headers=headers)
    assert second.status_code == 201
    assert second.json()["catalog_added"] is False

    # Limpieza: el test de fallback del catálogo espera la tabla vacía.
    with SessionLocal() as db:
        db.query(Sign).filter(Sign.name == "PRUEBA_CATALOGO").delete()
        db.commit()


def test_train_endpoint_calls_service(client, monkeypatch):
    headers = _headers(client)
    fake = {
        "ok": True,
        "model_path": "ai/models/sign_model.pkl",
        "classes": ["HOLA"],
        "samples": 10,
        "accuracy": 0.9,
        "cv_mean": 0.9,
        "message": "ok",
    }
    monkeypatch.setattr(dataset_service, "train_model", lambda: fake)

    resp = client.post("/api/ai/train", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["classes"] == ["HOLA"]
