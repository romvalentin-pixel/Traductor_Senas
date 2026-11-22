"""Rutas de IA: /api/ai/*"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.ai import (
    AIInfo,
    DatasetResponse,
    PredictRequest,
    PredictResponse,
    SampleBatchRequest,
    SampleBatchResponse,
    TrainResponse,
)
from app.services import ai_service, dataset_service

router = APIRouter()


@router.post(
    "/predict",
    response_model=PredictResponse,
    summary="Clasificar una seña a partir de landmarks",
)
def predict(
    payload: PredictRequest,
    _current_user: User = Depends(get_current_user),
) -> PredictResponse:
    return ai_service.predict(payload.model_dump())


@router.get(
    "/info",
    response_model=AIInfo,
    summary="Información del modelo de IA activo",
)
def info() -> AIInfo:
    return AIInfo(**ai_service.ai_info())


# ---------------------------------------------------------------------------
#  Dataset de señas reales
# ---------------------------------------------------------------------------


@router.get(
    "/dataset",
    response_model=DatasetResponse,
    summary="Muestras reales capturadas por seña",
)
def dataset(
    _admin: User = Depends(get_current_admin),
) -> DatasetResponse:
    return DatasetResponse(**dataset_service.dataset_summary())


@router.post(
    "/samples",
    response_model=SampleBatchResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Guardar landmarks capturados de una seña",
)
def save_samples(
    payload: SampleBatchRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> SampleBatchResponse:
    try:
        result = dataset_service.save_samples(
            payload.sign,
            payload.samples,
            language=payload.language,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    # La seña queda disponible en el catálogo de la app automáticamente.
    try:
        result["catalog_added"] = dataset_service.ensure_catalog_sign(
            db, result["sign"], payload.language
        )
    except Exception:  # noqa: BLE001 - el catálogo no debe romper la captura
        result["catalog_added"] = False

    return SampleBatchResponse(**result)


@router.post(
    "/train",
    response_model=TrainResponse,
    summary="Entrenar el modelo con las muestras guardadas",
)
def train(
    _admin: User = Depends(get_current_admin),
) -> TrainResponse:
    try:
        result = dataset_service.train_model()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:  # pragma: no cover - depende de sklearn
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"No se pudo entrenar el modelo: {exc}",
        ) from exc
    return TrainResponse(**result)
