"""
Procesamiento de imágenes con OpenCV.

Ruta PRINCIPAL del sistema: las manos se detectan en el navegador con MediaPipe
y el backend recibe solamente los landmarks (enfoque eficiente documentado en
docs/architecture.md).

Este módulo habilita una ruta ALTERNATIVA en el servidor: si el cliente envía
un frame en base64 (`image_base64`), el backend lo decodifica con OpenCV y, si
el paquete `mediapipe` está instalado, extrae los landmarks para clasificar.

Funciones:
- `decode_base64_image`   : base64 -> imagen OpenCV.
- `preprocess_image`      : redimensiona a un ancho máximo (rendimiento).
- `hand_landmarks_from_image`: usos de MediaPipe server-side.
"""

from __future__ import annotations

import base64
import io
from typing import Any

import cv2
import numpy as np


class ImageProcessingError(Exception):
    """Error al procesar una imagen."""


def decode_base64_image(image_b64: str) -> np.ndarray:
    """Decodifica una imagen en base64 (JPG/PNG) a un arreglo OpenCV (BGR)."""
    try:
        raw = base64.b64decode(image_b64)
        arr = np.frombuffer(raw, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    except Exception as exc:
        raise ImageProcessingError("No se pudo decodificar la imagen base64") from exc
    if img is None:
        raise ImageProcessingError("La imagen base64 no es un formato válido")
    return img


def preprocess_image(image: np.ndarray, max_width: int = 640) -> np.ndarray:
    """Escala la imagen para mantener un ancho máximo (reduce cómputo)."""
    h, w = image.shape[:2]
    if w <= max_width:
        return image
    scale = max_width / float(w)
    new_size = (int(w * scale), int(h * scale))
    return cv2.resize(image, new_size, interpolation=cv2.INTER_AREA)


def _load_hand_landmarker():
    """Carga MediaPipe Hands (server-side) de forma opcional."""
    try:
        import mediapipe as mp

        return mp.solutions.hands.Hands(
            static_image_mode=True,
            max_num_hands=2,
            min_detection_confidence=0.5,
        )
    except ImportError as exc:
        raise ImageProcessingError(
            "MediaPipe (server-side) no está instalado. "
            "Instálalo con:  pip install mediapipe  "
            "o usa la detección desde el navegador (recomendado)."
        ) from exc


def hand_landmarks_from_image(image: np.ndarray) -> list[list[list[float]]]:
    """
    Extrae los landmarks de las manos de una imagen usando MediaPipe server-side.
    Devuelve una lista de manos: cada mano tiene 21 landmarks de 3 coordenadas.
    """
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    hands = _load_hand_landmarker()
    results = hands.process(image_rgb)

    hands_list: list[list[list[float]]] = []
    if not results.multi_hand_landmarks:
        return hands_list

    h, w = image_rgb.shape[:2]
    for hand_landmarks in results.multi_hand_landmarks:
        hand_points = []
        for lm in hand_landmarks.landmark:
            hand_points.append([lm.x, lm.y, lm.z])
        hands_list.append(hand_points)
    return hands_list