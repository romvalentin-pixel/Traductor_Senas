"""
Captura y normalización de landmarks para el dataset.

Ejecutar desde la raíz del proyecto. Este script:
- normaliza una mano al vector de 63 features (mismo contrato que el backend),
- y captura muestras reales desde la cámara con MediaPipe (server-side).

Uso de captura:
    python -m ai.preprocessing.landmarks       # asistente interactivo
"""

from __future__ import annotations

import json
import pathlib
import sys

# Habilita importar los módulos compartidos del backend (misma lógica).
BACKEND = pathlib.Path(__file__).resolve().parents[2] / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

import numpy as np  # noqa: E402

from app.ai.landmarks import normalize_hand  # noqa: E402

DATASET_DIR = pathlib.Path(__file__).resolve().parents[1] / "dataset" / "argentine"


def landmark_json_to_features(sample: dict) -> list[list[float]]:
    """Convierte las manos de una muestra JSON en vectores de 63 features."""
    return [normalize_hand(hand) for hand in sample["hands"]]


def save_sample(sign: str, hands: list[list[list[float]]], index: int) -> pathlib.Path:
    """Guarda una muestra JSON en el dataset (estructura por seña)."""
    sign_dir = DATASET_DIR / sign
    sign_dir.mkdir(parents=True, exist_ok=True)
    path = sign_dir / f"sample_{index:04d}.json"
    path.write_text(
        json.dumps(
            {"sign": sign, "language": "es-AR", "hands": hands},
            indent=2,
        ),
        encoding="utf-8",
    )
    return path


def load_samples(sign: str, dataset_dir: pathlib.Path = DATASET_DIR) -> list[dict]:
    """Carga todas las muestras JSON de una seña."""
    sign_dir = dataset_dir / sign
    samples = []
    if not sign_dir.exists():
        return samples
    for file in sorted(sign_dir.glob("*.json")):
        samples.append(json.loads(file.read_text(encoding="utf-8")))
    return samples


def capture_from_webcam(sign: str, samples: int = 120, max_hands: int = 1) -> None:
    """Captura `samples` frames con la cámara y guarda los landmarks."""
    try:
        import cv2
        import mediapipe as mp
    except ImportError:
        print(
            "Necesitás instalar: pip install opencv-python mediapipe "
            "(ver ai/requirements-ai.txt)"
        )
        return

    hands = mp.solutions.hands.Hands(
        static_image_mode=False,
        max_num_hands=max_hands,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    )
    cap = cv2.VideoCapture(0)
    collected = 0
    print(f"Capturando {samples} muestras de '{sign}'. Presioná ESC para salir.")

    while collected < samples:
        ret, frame = cap.read()
        if not ret:
            continue
        frame = cv2.flip(frame, 1)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = hands.process(rgb)
        h, w, _ = frame.shape

        if result.multi_hand_landmarks:
            hand_points = []
            for lm in result.multi_hand_landmarks[0].landmark:
                hand_points.append([lm.x, lm.y, lm.z])
            save_sample(sign, [hand_points], collected)
            collected += 1

        status = f"(no detectada)" if not result.multi_hand_landmarks else ""
        cv2.putText(
            frame,
            f"{sign} - {collected}/{samples} {status}",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.9,
            (0, 255, 0),
            2,
        )
        cv2.imshow("Captura de landmarks", frame)
        if cv2.waitKey(1) & 0xFF == 27:
            break

    cap.release()
    cv2.destroyAllWindows()
    print(f"Guardadas {collected} muestras en {DATASET_DIR / sign}")


if __name__ == "__main__":
    sign = input("Seña a capturar (ej. HOLA): ").strip().upper()
    if not sign:
        raise SystemExit("Seña no indicada")
    capture_from_webcam(sign)