"""
Entrena el clasificador de señas con muestras reales capturadas desde la web.

Estructura del dataset (una carpeta por seña):

    ai/dataset/argentine/
        HOLA/
            sample_20260101_120000_ab12cd34.json
            ...
        GRACIAS/
            ...

Cada JSON contiene una o más manos con 21 landmarks (x, y, z). Las muestras se
normalizan al mismo vector de 63 features que usa el backend.

El modelo entrenado se guarda en `ai/models/sign_model.pkl` con el formato
{"model", "signs", "translations"} y el backend lo usa automáticamente en modo
`auto` (o si `AI_MODEL_PATH` apunta a ese archivo).

Uso por consola (desde la raíz del proyecto):

    python ai/training/train_model.py

También se puede invocar desde la API (`POST /api/ai/train`).
"""

from __future__ import annotations

import json
import pathlib
import pickle
import sys
from typing import Any

import numpy as np

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]
BACKEND = REPO_ROOT / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from app.ai.demo_templates import DEMO_SIGNS, make_template  # noqa: E402
from app.ai.landmarks import normalize_hand  # noqa: E402
from app.ai.translations import translate_sign  # noqa: E402

DATASET_DIR = REPO_ROOT / "ai" / "dataset" / "argentine"
MODEL_OUT = REPO_ROOT / "ai" / "models" / "sign_model.pkl"

# Mínimo de muestras reales para no depender de la plantilla demo.
MIN_REAL_SAMPLES = 20
TEMPLATES_PER_SIGN = 150
NOISE_LEVEL = 0.03


def load_real_samples() -> dict[str, list[list[float]]]:
    """Carga las muestras reales del dataset agrupadas por seña."""
    data: dict[str, list[list[float]]] = {}
    if not DATASET_DIR.exists():
        return data

    for sign_dir in sorted(DATASET_DIR.iterdir(), key=lambda p: p.name):
        if not sign_dir.is_dir():
            continue
        sign = sign_dir.name.strip().upper()
        features: list[list[float]] = []
        for file in sorted(sign_dir.glob("*.json")):
            try:
                sample = json.loads(file.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                continue
            for hand in sample.get("hands", []):
                try:
                    features.append(normalize_hand(hand))
                except ValueError:
                    continue
        if features:
            data[sign] = features
    return data


def _demo_samples(sign: str, rng: np.random.Generator) -> list[list[float]]:
    """Genera muestras sintéticas para una seña del modo demo."""
    base = np.asarray(make_template(sign), dtype=float)
    samples: list[list[float]] = []
    for _ in range(TEMPLATES_PER_SIGN):
        noisy = base + rng.normal(0, NOISE_LEVEL, size=base.shape)
        noisy[:, 2] = base[:, 2] + rng.normal(
            0, NOISE_LEVEL * 0.5, size=base.shape[0]
        )
        samples.append(normalize_hand(noisy.tolist()))
    return samples


def build_dataset(
    seed: int = 42,
) -> tuple[np.ndarray, np.ndarray, dict[str, int], list[str]]:
    """
    Construye X, y combinando muestras reales y plantillas demo.

    - Si una seña tiene >= MIN_REAL_SAMPLES muestras reales, se usan solo esas.
    - Si es una seña demo con pocas muestras reales, se completan con la
      plantilla sintética (así el modo demostración sigue funcionando).
    - Si es una seña nueva con pocas muestras reales, se omite y se avisa.
    """
    rng = np.random.default_rng(seed)
    real = load_real_samples()
    classes = sorted(set(real) | set(DEMO_SIGNS))

    X: list[list[float]] = []
    y: list[str] = []
    counts: dict[str, int] = {}
    skipped: list[str] = []

    for sign in classes:
        real_features = real.get(sign, [])
        if len(real_features) >= MIN_REAL_SAMPLES:
            X.extend(real_features)
            y.extend([sign] * len(real_features))
            counts[sign] = len(real_features)
            continue

        if sign in DEMO_SIGNS:
            demo_features = _demo_samples(sign, rng)
            X.extend(demo_features)
            y.extend([sign] * len(demo_features))
            # Sumamos también las muestras reales que haya (aunque sean pocas).
            X.extend(real_features)
            y.extend([sign] * len(real_features))
            counts[sign] = len(demo_features) + len(real_features)
            continue

        skipped.append(f"{sign} ({len(real_features)} muestras)")

    if skipped:
        print(
            "[aviso] Señas omitidas por no tener suficientes muestras reales "
            f"(mínimo {MIN_REAL_SAMPLES}): " + ", ".join(skipped)
        )

    if not X:
        raise ValueError(
            "No hay muestras para entrenar. Grabá al menos "
            f"{MIN_REAL_SAMPLES} muestras de una seña nueva o usá el modo demo."
        )

    # Aumentación: espejar la mano (x -> -x) sobre features normalizadas.
    augmented_X = []
    for feature in X:
        mirrored = list(feature)
        for i in range(0, len(mirrored), 3):
            mirrored[i] = -mirrored[i]
        augmented_X.append(mirrored)
    X.extend(augmented_X)
    y.extend(y)

    return np.asarray(X, dtype=float), np.asarray(y), counts, sorted(set(y))


def train() -> dict[str, Any]:
    """Entrena y guarda el modelo. Devuelve un resumen serializable."""
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.metrics import accuracy_score
    from sklearn.model_selection import cross_val_score, train_test_split

    X, y, counts, classes = build_dataset()
    print(f"Dataset: {X.shape[0]} muestras, {len(classes)} clases")

    min_class = min(counts.values())
    if min_class < 2:
        raise ValueError(
            "Cada seña necesita al menos 2 muestras para entrenar. "
            f"La clase con menos muestras tiene {min_class}."
        )

    clf = RandomForestClassifier(
        n_estimators=300,
        max_depth=30,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1,
    )

    cv_folds = min(5, min_class)
    cv_scores = cross_val_score(clf, X, y, cv=cv_folds, scoring="accuracy")
    print(f"Validación cruzada ({cv_folds} folds): {cv_scores.mean():.3f}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    clf.fit(X_train, y_train)
    accuracy = float(accuracy_score(y_test, clf.predict(X_test)))
    print(f"Precisión en test: {accuracy:.3f}")

    # Reentrenamos con todo el dataset para aprovechar todas las muestras.
    clf.fit(X, y)
    trained_classes = [str(c) for c in clf.classes_]

    MODEL_OUT.parent.mkdir(parents=True, exist_ok=True)
    blob = {
        "model": clf,
        "signs": trained_classes,
        "translations": {sign: translate_sign(sign) for sign in trained_classes},
    }
    with open(MODEL_OUT, "wb") as fh:
        pickle.dump(blob, fh)

    print(f"Modelo guardado en: {MODEL_OUT}")
    return {
        "ok": True,
        "model_path": str(MODEL_OUT),
        "classes": trained_classes,
        "samples": int(X.shape[0]),
        "accuracy": round(accuracy, 4),
        "cv_mean": round(float(cv_scores.mean()), 4),
        "message": (
            "Modelo entrenado correctamente. "
            "Ya está activo en el backend (modo auto)."
        ),
    }


if __name__ == "__main__":
    result = train()
    print(json.dumps(result, ensure_ascii=True, indent=2))
