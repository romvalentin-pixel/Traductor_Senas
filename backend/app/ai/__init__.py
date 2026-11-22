"""Módulo de inteligencia artificial del backend.

Compuesto por:
- `landmarks.py`      : normalización de landmarks de MediaPipe.
- `demo_templates.py` : plantillas sintéticas de señas para el modo demostración.
- `translations.py`   : mapeo seña -> texto traducido.
- `model.py`          : clasificador (RandomForest) cargado/entrenado en caliente.
"""

__all__ = ["landmarks", "demo_templates", "translations", "model"]