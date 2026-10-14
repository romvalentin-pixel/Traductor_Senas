"""Esquemas del módulo de IA."""

from __future__ import annotations

import re

from pydantic import BaseModel, Field, field_validator

# Cada mano son 21 landmarks con 3 coordenadas (x, y, z)
LANDMARK_COUNT = 21
COORD_COUNT = 3


class PredictRequest(BaseModel):
    landmarks: list[list[list[float]]] = Field(
        default_factory=list,
        description=(
            "Manos detectadas por MediaPipe. Cada mano es una lista de 21 "
            "landmarks, y cada landmark es [x, y, z]."
        ),
    )
    language: str = Field(default="es-AR", min_length=2, max_length=10)
    image_base64: str | None = Field(
        default=None,
        description=(
            "Opcional. Ruta alternativa server-side: imagen JPEG/PNG en base64. "
            "Requiere `mediapipe` instalado en el backend."
        ),
    )
    demo_sign: str | None = Field(
        default=None,
        description=(
            "Opcional. Si se indica una seña del catálogo (p. ej. 'HOLA'), el "
            "backend genera landmarks de demostración para probar el flujo sin "
            "cámara."
        ),
    )

    @field_validator("landmarks")
    @classmethod
    def _validate_landmarks(cls, value: list[list[list[float]]]) -> list[list[list[float]]]:
        if not value:
            return value
        for hand in value:
            if len(hand) != LANDMARK_COUNT:
                raise ValueError(
                    f"Cada mano debe tener {LANDMARK_COUNT} landmarks "
                    f"(recibidos: {len(hand)})"
                )
            for point in hand:
                if len(point) != COORD_COUNT:
                    raise ValueError(
                        f"Cada landmark debe tener {COORD_COUNT} coordenadas "
                        f"(x, y, z)"
                    )
        return value


class PredictResponse(BaseModel):
    sign: str
    translated_text: str
    confidence: float = Field(ge=0.0, le=1.0)
    model: str = "demo"
    processing_time_ms: float


class AIInfo(BaseModel):
    model: str
    signs: list[str]
    features: int
    min_confidence: float


# ---------------------------------------------------------------------------
#  Captura de muestras reales (dataset) y entrenamiento
# ---------------------------------------------------------------------------

_SIGN_NAME_RE = re.compile(r"^[A-Z0-9_]{1,40}$")


def normalize_sign_name(value: str) -> str:
    """Normaliza el nombre de una seña: MAYÚSCULAS y guiones bajos."""
    sign = re.sub(r"\s+", "_", value.strip().upper())
    sign = re.sub(r"[^A-Z0-9_]", "", sign)
    if not _SIGN_NAME_RE.match(sign):
        raise ValueError(
            "El nombre de la seña debe tener entre 1 y 40 caracteres: "
            "letras A-Z, números y guiones bajos (ej. A, HOLA, BUENAS_NOCHES)."
        )
    return sign


class SampleBatchRequest(BaseModel):
    """Frames (landmarks) capturados para una seña."""

    sign: str = Field(min_length=1, max_length=40)
    samples: list[list[list[float]]] = Field(
        min_length=1,
        description=(
            "Lista de manos capturadas. Cada elemento es una mano con 21 "
            "landmarks [x, y, z]."
        ),
    )
    language: str = Field(default="es-AR", min_length=2, max_length=10)

    @field_validator("sign")
    @classmethod
    def _validate_sign(cls, value: str) -> str:
        return normalize_sign_name(value)

    @field_validator("samples")
    @classmethod
    def _validate_samples(
        cls, value: list[list[list[float]]]
    ) -> list[list[list[float]]]:
        for hand in value:
            if len(hand) != LANDMARK_COUNT:
                raise ValueError(
                    f"Cada muestra debe tener {LANDMARK_COUNT} landmarks "
                    f"(recibidos: {len(hand)})"
                )
            for point in hand:
                if len(point) != COORD_COUNT:
                    raise ValueError(
                        f"Cada landmark debe tener {COORD_COUNT} coordenadas "
                        f"(x, y, z)"
                    )
        return value


class SampleBatchResponse(BaseModel):
    sign: str
    saved: int
    total_for_sign: int
    dataset_dir: str
    catalog_added: bool = False


class DatasetSign(BaseModel):
    sign: str
    count: int


class DatasetResponse(BaseModel):
    classes: list[DatasetSign]
    total_samples: int
    dataset_dir: str


class TrainResponse(BaseModel):
    ok: bool
    model_path: str
    classes: list[str]
    samples: int
    accuracy: float | None = None
    cv_mean: float | None = None
    message: str