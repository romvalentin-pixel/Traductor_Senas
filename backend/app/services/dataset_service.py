"""
Dataset de señas reales: guardado de muestras y entrenamiento.

Cada muestra es una mano con 21 landmarks (x, y, z) tal como la entrega
MediaPipe en el navegador. Se guarda como JSON en:

    ai/dataset/argentine/<SIGNO>/sample_<timestamp>_<id>.json

El entrenamiento combina esas muestras reales con las plantillas sintéticas
del modo demo para no romper la demostración. El modelo resultante se guarda
en `ai/models/sign_model.pkl` y el backend lo usa automáticamente al recargar.
"""

from __future__ import annotations

import json
import os
import re
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np

# repo/backend/app/services/dataset_service.py -> repo
REPO_ROOT = Path(__file__).resolve().parents[3]
DATASET_DIR = REPO_ROOT / "ai" / "dataset" / "argentine"
MODEL_PATH = REPO_ROOT / "ai" / "models" / "sign_model.pkl"

_SIGN_NAME_RE = re.compile(r"^[A-Z0-9_]{1,40}$")


def _normalize_sign(sign: str) -> str:
    value = re.sub(r"\s+", "_", str(sign).strip().upper())
    value = re.sub(r"[^A-Z0-9_]", "", value)
    if not _SIGN_NAME_RE.match(value):
        raise ValueError(
            "Nombre de seña inválido. Usá entre 1 y 40 caracteres: "
            "letras A-Z, números y guiones bajos (ej. A, HOLA, BUENAS_NOCHES)."
        )
    return value


def _validate_hand(hand: list[list[float]]) -> list[list[float]]:
    arr = np.asarray(hand, dtype=float)
    if arr.ndim != 2 or arr.shape != (21, 3):
        raise ValueError(
            f"Cada muestra debe ser una mano de 21 landmarks x 3 coordenadas; "
            f"se recibió {arr.shape}"
        )
    if not np.all(np.isfinite(arr)):
        raise ValueError("La muestra contiene valores no finitos")
    return [[float(x), float(y), float(z)] for x, y, z in arr]


def save_samples(
    sign: str,
    samples: list[list[list[float]]],
    language: str = "es-AR",
) -> dict[str, Any]:
    """Guarda un lote de muestras (manos) para una seña."""
    normalized = _normalize_sign(sign)
    if not samples:
        raise ValueError("No se recibieron muestras para guardar")

    sign_dir = DATASET_DIR / normalized
    sign_dir.mkdir(parents=True, exist_ok=True)

    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    saved = 0
    for hand in samples:
        valid = _validate_hand(hand)
        filename = f"sample_{stamp}_{uuid.uuid4().hex[:8]}.json"
        payload = {
            "sign": normalized,
            "language": language,
            "hands": [valid],
            "source": "web-recorder",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        (sign_dir / filename).write_text(
            json.dumps(payload, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        saved += 1

    return {
        "sign": normalized,
        "saved": saved,
        "total_for_sign": count_samples(normalized),
        "dataset_dir": str(DATASET_DIR),
    }


def count_samples(sign: str) -> int:
    """Cuenta las muestras JSON guardadas para una seña."""
    sign_dir = DATASET_DIR / _normalize_sign(sign)
    if not sign_dir.exists():
        return 0
    return sum(1 for _ in sign_dir.glob("*.json"))


def dataset_summary() -> dict[str, Any]:
    """Devuelve las clases del dataset con su cantidad de muestras."""
    classes: list[dict[str, Any]] = []
    if DATASET_DIR.exists():
        for sign_dir in sorted(DATASET_DIR.iterdir(), key=lambda p: p.name):
            if not sign_dir.is_dir():
                continue
            count = sum(1 for _ in sign_dir.glob("*.json"))
            if count:
                classes.append({"sign": sign_dir.name.upper(), "count": count})

    return {
        "classes": classes,
        "total_samples": sum(item["count"] for item in classes),
        "dataset_dir": str(DATASET_DIR),
    }


def train_model() -> dict[str, Any]:
    """
    Entrena el clasificador con las muestras reales + plantillas demo.

    Se ejecuta en el mismo proceso del backend para reutilizar scikit-learn y
    recargar el clasificador sin reiniciar el servidor.
    """
    # Permite importar `ai.training.train_model` desde el repo.
    if str(REPO_ROOT) not in sys.path:
        sys.path.insert(0, str(REPO_ROOT))

    from ai.training.train_model import train  # import tardío

    result = train()
    # Recarga el singleton para que las predicciones usen el modelo nuevo.
    from app.services import ai_service

    ai_service.reload_classifier()
    return result


def remove_sign_samples(sign: str) -> int:
    """Borra las muestras de una seña. Devuelve cuántos archivos eliminó."""
    sign_dir = DATASET_DIR / _normalize_sign(sign)
    if not sign_dir.exists():
        return 0
    removed = 0
    for file in sign_dir.glob("*.json"):
        try:
            os.remove(file)
            removed += 1
        except OSError:
            continue
    try:
        sign_dir.rmdir()
    except OSError:
        pass
    return removed


def ensure_catalog_sign(db, sign: str, language: str = "es-AR") -> bool:
    """
    Registra la seña en el catálogo (`signs`) si todavía no existe.

    Así, cuando el equipo graba una seña nueva con la herramienta separada,
    aparece automáticamente en el Traductor y en el resto de la app sin tocar
    SQL a mano. Devuelve `True` si la insertó.
    """
    from app.models.sign import Sign

    normalized = _normalize_sign(sign)
    existing = (
        db.query(Sign)
        .filter(Sign.name == normalized, Sign.language == language)
        .first()
    )
    if existing:
        return False

    db.add(
        Sign(
            name=normalized,
            description="Seña capturada con la herramienta de grabación.",
            language=language,
        )
    )
    try:
        db.commit()
    except Exception:
        db.rollback()
        return False
    return True
