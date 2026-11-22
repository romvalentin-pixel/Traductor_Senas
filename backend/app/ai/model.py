"""
Clasificador de señas.

Estrategia (según `AI_MODEL_MODE`):
1. `demo`: usa siempre `app/ai/models/demo_sign_model.pkl`.
2. `trained`: usa `AI_MODEL_PATH` o `ai/models/sign_model.pkl`.
3. `auto` (por defecto): si existe un modelo entrenado (`AI_MODEL_PATH` o
   `ai/models/sign_model.pkl`) lo usa; si no, cae al modelo demo.
4. Si el modelo demo no existe, se entrena en caliente con las plantillas
   sintéticas de `demo_templates.py` y se persiste en disco.

Por qué RandomForest para el modo demo:
- Se entrena en segundos en CPU con poquísimos datos.
- Entrega probabilidades por clase (base del nivel de confianza).
- Es robusto al ruido y al sobreajuste con datos sintéticos.
- Es interpretable y fácil de reemplazar por una red neuronal con datos reales
  (el contrato de 63 features no cambia).
"""

from __future__ import annotations

import os
import pickle
from typing import Any

import numpy as np

from app.ai.demo_templates import is_demo_sign, make_template
from app.ai.landmarks import normalize_hand, pick_most_prominent_hand
from app.ai.translations import translate_sign
from app.core.config import settings

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
DEMO_MODEL_PATH = os.path.join(MODELS_DIR, "demo_sign_model.pkl")

# repo/backend/app/ai/model.py -> repo
_REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
DEFAULT_TRAINED_MODEL_PATH = os.path.join(_REPO_ROOT, "ai", "models", "sign_model.pkl")

TEMPLATES_PER_SIGN = 150
NOISE_LEVEL = 0.03


class SignClassifier:
    """Interfaz única de predicción. Reutilizable con modelos entrenados."""

    def __init__(self) -> None:
        self._model: Any = None
        self._classes: list[str] = []
        self._translations: dict[str, str] = {}
        self.mode: str = "unavailable"
        self._load()

    # ------------------------------------------------------------------
    # Carga / entrenamiento
    # ------------------------------------------------------------------
    def reload(self) -> None:
        """Vuelve a cargar el modelo desde disco (p. ej. tras entrenar)."""
        self._load()

    def _load_trained(self, path: str) -> bool:
        if not path or not os.path.exists(path):
            return False
        with open(path, "rb") as fh:
            blob = pickle.load(fh)
        self._model = blob["model"] if isinstance(blob, dict) else blob
        if isinstance(blob, dict) and blob.get("signs"):
            self._classes = [str(c) for c in blob["signs"]]
        else:
            self._classes = [str(c) for c in self._model.classes_]
        self._translations = (
            {str(k): str(v) for k, v in blob.get("translations", {}).items()}
            if isinstance(blob, dict)
            else {}
        )
        self.mode = "trained"
        return True

    def _load(self) -> None:
        mode = (settings.AI_MODEL_MODE or "auto").strip().lower()

        if mode != "demo":
            # 1) Ruta explícita configurada en AI_MODEL_PATH.
            if self._load_trained(settings.AI_MODEL_PATH.strip()):
                return
            # 2) Modelo entrenado por la pantalla "Grabar señas".
            if self._load_trained(DEFAULT_TRAINED_MODEL_PATH):
                return

        if os.path.exists(DEMO_MODEL_PATH):
            with open(DEMO_MODEL_PATH, "rb") as fh:
                blob = pickle.load(fh)
            self._model = blob["model"]
            self._classes = [str(c) for c in blob["signs"]]
            self._translations = {}
            self.mode = "demo"
            return

        self.mode = "demo"
        self._train_and_save_demo()

    def _train_and_save_demo(self) -> None:
        from sklearn.ensemble import RandomForestClassifier  # import tardío

        X, y = self._generate_demo_dataset(
            templates_per_sign=TEMPLATES_PER_SIGN,
            noise=NOISE_LEVEL,
        )
        clf = RandomForestClassifier(
            n_estimators=150,
            max_depth=24,
            random_state=42,
            class_weight="balanced",
            n_jobs=1,
        )
        clf.fit(X, y)
        self._model = clf
        self._classes = [str(c) for c in clf.classes_]

        os.makedirs(MODELS_DIR, exist_ok=True)
        with open(DEMO_MODEL_PATH, "wb") as fh:
            pickle.dump({"model": clf, "signs": self._classes}, fh)

    def _generate_demo_dataset(
        self,
        templates_per_sign: int,
        noise: float,
        seed: int = 42,
    ) -> tuple[np.ndarray, np.ndarray]:
        from app.ai.demo_templates import DEMO_SIGNS

        rng = np.random.default_rng(seed)
        X: list[list[float]] = []
        y: list[str] = []
        for sign in DEMO_SIGNS:
            base = np.asarray(make_template(sign), dtype=float)
            # Copias exactas: anclan el centro de cada clase (punto de la plantilla)
            for _ in range(8):
                X.append(normalize_hand(base.tolist()))
                y.append(sign)
            for _ in range(templates_per_sign):
                noisy = base + rng.normal(0, noise, size=base.shape)
                noisy[:, 2] = base[:, 2] + rng.normal(0, noise * 0.5, size=base.shape[0])
                X.append(normalize_hand(noisy.tolist()))
                y.append(sign)
        return np.asarray(X, dtype=float), np.asarray(y)

    # ------------------------------------------------------------------
    # Predicción
    # ------------------------------------------------------------------
    def predict_from_landmarks(self, landmarks: list[list[list[float]]]) -> dict[str, Any]:
        """
        Clasifica las manos detectadas. Si hay varias manos se elige la más
        prominente (la de mayor tamaño).
        """
        if not landmarks:
            raise ValueError("No se detectaron manos en el frame")
        hand = pick_most_prominent_hand(landmarks)
        features = normalize_hand(hand.tolist())
        proba = self._model.predict_proba([features])[0]
        idx = int(np.argmax(proba))
        sign = self._classes[idx]
        return {
            "sign": sign,
            "translated_text": self._translations.get(sign) or translate_sign(sign),
            "confidence": float(proba[idx]),
            "model": self.mode,
        }

    def predict_demo_sign(self, sign: str) -> dict[str, Any]:
        """Predice usando la plantilla de demostración de `sign` (sin cámara)."""
        if not is_demo_sign(sign):
            raise ValueError(
                f"seña demo desconocida '{sign}'. Disponibles: {self.available_signs()}"
            )
        template = make_template(sign)
        proba = self._model.predict_proba([normalize_hand(template)])[0]
        idx = int(np.argmax(proba))
        cls = self._classes[idx]
        return {
            "sign": cls,
            "translated_text": self._translations.get(cls) or translate_sign(cls),
            "confidence": float(proba[idx]),
            "model": self.mode,
        }

    def available_signs(self) -> list[str]:
        return list(self._classes)

    def info(self) -> dict[str, Any]:
        return {
            "model": self.mode,
            "signs": self.available_signs(),
            "features": settings.AI_FEATURES,
            "min_confidence": settings.AI_MIN_CONFIDENCE,
        }