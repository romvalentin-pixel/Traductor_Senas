"""
Servicio de IA: punto de entrada único hacia el clasificador.

El clasificador se carga de forma perezosa (lazy singleton) para que el arranque
del servidor no dependa del tiempo de entrenamiento del modelo demo.
"""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException, status

from app.ai.model import SignClassifier
from app.core.config import settings
from app.schemas.ai import PredictResponse

_classifier: SignClassifier | None = None


def get_classifier() -> SignClassifier:
    global _classifier
    if _classifier is None:
        _classifier = SignClassifier()
    return _classifier


def reload_classifier() -> SignClassifier:
    """Recarga el modelo desde disco (tras entrenar nuevas muestras)."""
    global _classifier
    _classifier = SignClassifier()
    return _classifier


def predict(payload: dict[str, Any]) -> PredictResponse:
    """
    Ejecuta la predicción. Si `demo_sign` viene indicado, genera la plantilla
    de demostración (útil para probar el flujo sin cámara).
    """
    classifier = get_classifier()
    import time

    start = time.perf_counter()

    try:
        if payload.get("demo_sign"):
            if not settings.DEMO_MODE:
                raise ValueError(
                    "El modo demostración está desactivado en este entorno."
                )
            result = classifier.predict_demo_sign(payload["demo_sign"])
        elif payload.get("landmarks"):
            result = classifier.predict_from_landmarks(payload["landmarks"])
        elif payload.get("image_base64"):
            from app.services.image_processor import (
                ImageProcessingError,
                decode_base64_image,
                hand_landmarks_from_image,
                preprocess_image,
            )

            try:
                image = decode_base64_image(payload["image_base64"])
                image = preprocess_image(image)
                hands = hand_landmarks_from_image(image)
                if not hands:
                    raise ValueError("No se detectaron manos en la imagen")
                result = classifier.predict_from_landmarks(hands)
            except ImageProcessingError as exc:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=str(exc),
                ) from exc
        else:
            raise ValueError("Enviá landmarks, image_base64 o demo_sign")
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
    return PredictResponse(
        sign=result["sign"],
        translated_text=result["translated_text"],
        confidence=result["confidence"],
        model=result["model"],
        processing_time_ms=elapsed_ms,
    )


def ai_info() -> dict[str, Any]:
    return get_classifier().info()