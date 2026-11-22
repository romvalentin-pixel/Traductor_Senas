"""
Preprocesamiento de landmarks de MediaPipe.

MediaPipe Hands devuelve, por cada mano, 21 landmarks con coordenadas (x, y, z)
normalizadas respecto de la imagen. `normalize_hand` convierte esas posiciones
en un vector de 63 features invariante a la posición y al tamaño de la mano en
pantalla: centra en la muñeca y escala por el tamaño de la mano.

Este es el mismo contrato de datos usado por el pipeline de entrenamiento en
`ai/training/train_demo.py`.
"""

from __future__ import annotations

import numpy as np

LANDMARK_COUNT = 21
COORD_COUNT = 3
FEATURES = LANDMARK_COUNT * COORD_COUNT


def validate_hand(hand: list | tuple | np.ndarray) -> np.ndarray:
    """Valida que `hand` tenga forma (21, 3) y la devuelve como ndarray."""
    arr = np.asarray(hand, dtype=float)
    if arr.ndim != 2 or arr.shape != (LANDMARK_COUNT, COORD_COUNT):
        raise ValueError(
            f"Una mano debe tener {LANDMARK_COUNT} landmarks de "
            f"{COORD_COUNT} coordenadas; se recibió {arr.shape}"
        )
    if not np.all(np.isfinite(arr)):
        raise ValueError("Los landmarks contienen valores no finitos")
    return arr


def normalize_hand(hand: list | tuple | np.ndarray) -> list[float]:
    """Devuelve el vector de 63 features (centrado en la muñeca y escalado)."""
    arr = validate_hand(hand)
    wrist = arr[0]
    centered = arr - wrist
    scale = float(np.abs(centered).max())
    if scale < 1e-6:
        scale = 1.0
    normalized = (centered / scale).reshape(-1)
    return normalized.tolist()


def pick_most_prominent_hand(hands: list[list[list[float]]]) -> np.ndarray:
    """Elige la mano con mayor tamaño (la más cercana a la cámara)."""
    best, best_scale = None, -1.0
    for hand in hands:
        arr = validate_hand(hand)
        scale = float(np.abs(arr - arr[0]).max())
        if scale > best_scale:
            best, best_scale = arr, scale
    return best