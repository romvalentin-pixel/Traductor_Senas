"""
Plantillas sintéticas para el modo DEMOSTRACIÓN.

Cada seña se representa mediante una "pose" de la mano definida por:
- `curls`: qué tanto se cierra cada dedo (índice, medio, anular, meñique).
- `thumb_raise`: qué tan levantado está el pulgar.
- `spread`: separación lateral entre los dedos.
- `palm`: ligera rotación de profundidad (z) de toda la mano.

La geometría imita el formato de MediaPipe Hands (21 landmarks, y crece hacia
abajo): la muñeca está abajo y las puntas de los dedos arriba.

IMPORTANTE: son plantillas de demostración con fines educativos. Para una
precisión real se entrena un clasificador con muestras reales de LSA usando el
pipeline de `ai/training/`.
"""

from __future__ import annotations

from typing import Literal

# Índices de landmarks de MediaPipe Hands
WRIST = 0
INDEX = (5, 6, 7, 8)     # MCP, PIP, DIP, TIP
MIDDLE = (9, 10, 11, 12)
RING = (13, 14, 15, 16)
PINKY = (17, 18, 19, 20)
THUMB = (1, 2, 3, 4)     # CMC, MCP, IP, TIP

FINGERS: dict[str, tuple[int, int, int, int]] = {
    "index": INDEX,
    "middle": MIDDLE,
    "ring": RING,
    "pinky": PINKY,
}

# Desplazamiento lateral de cada dedo (ancho de la mano extendida).
_FINGER_X = {
    "index": -0.10,
    "middle": -0.033,
    "ring": 0.033,
    "pinky": 0.10,
}

DEMO_SIGNS: list[str] = [
    "HOLA",
    "GRACIAS",
    "SI",
    "NO",
    "ADIOS",
    "POR_FAVOR",
    "BUENOS_DIAS",
    "BUENAS_TARDES",
    "AYUDA",
]


def _lerp(a: tuple[float, float, float], b: tuple[float, float, float], t: float):
    """Interpola linealmente entre dos puntos 3D."""
    return (
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
    )


def _build(
    curls: tuple[float, float, float, float],
    thumb_raise: float = 1.0,
    spread: float = 1.0,
    z_scale: float = 1.0,
) -> list[list[float]]:
    """
    Construye una mano de 21 landmarks.

    curls: cierre de (índice, medio, anular, meñique); 0 = extendido, 1 = cerrado.
    z_scale: escala la profundidad de la mano respecto de la muñeca
             (> 1 = dedos más cerca de la cámara, < 1 = palma hacia atrás).
    """
    lm: list[list[float]] = [[0.0, 0.0, 0.0]] * 21
    # -- Muñeca (origen del sistema de profundidad) --
    lm[WRIST] = [0.5, 0.85, 0.0]

    # -- Dedos índice, medio, anular, meñique --
    for (name, (mcp, pip, dip, tip)), curl in zip(FINGERS.items(), curls):
        fx = 0.5 + _FINGER_X[name] * (0.8 + 0.2 * spread)
        base = (fx, 0.60, 0.0)

        # Posición extendida (dedo recto hacia arriba)
        ext_pip = (fx, 0.42, -0.03)
        ext_dip = (fx, 0.27, -0.05)
        ext_tip = (fx, 0.15, -0.07)

        # Posición cerrada (dedo curvado hacia la palma)
        curl_tip = (fx * 1.02 + 0.01, 0.48, 0.05)
        curl_dip = (fx + 0.005, 0.54, 0.03)
        curl_pip = (fx, 0.53, 0.02)

        lm[mcp] = list(base)
        lm[pip] = list(_lerp(ext_pip, curl_pip, curl))
        lm[dip] = list(_lerp(ext_dip, curl_dip, curl))
        lm[tip] = list(_lerp(ext_tip, curl_tip, curl))

    # -- Pulgar --
    tcu = 1.0 - thumb_raise  # qué tan cruzado sobre la palma (0 = arriba)
    cmc, mcp_t, ip_t, tip_t = THUMB
    lm[cmc] = [0.43, 0.70, 0.0]
    lm[mcp_t] = [0.41, 0.60, -0.01]
    lm[ip_t] = list(_lerp((0.40, 0.47, -0.03), (0.44, 0.58, 0.02), tcu))
    lm[tip_t] = list(_lerp((0.38, 0.26, -0.06), (0.50, 0.55, 0.03), tcu))

    # -- Toda la mano: escala de profundidad respecto de la muñeca --
    wrist_z = lm[WRIST][2]
    for i in range(21):
        lm[i][2] = wrist_z + (lm[i][2] - wrist_z) * z_scale

    return [[round(v, 4) for v in point] for point in lm]


# Parámetros de pose por seña (modo demostración)
_SIGN_PARAMS = {
    "HOLA": dict(curls=(0.00, 0.00, 0.00, 0.00), thumb_raise=1.00, spread=1.15, z_scale=0.9),
    "GRACIAS": dict(curls=(0.45, 0.50, 0.55, 0.60), thumb_raise=0.85, spread=0.80, z_scale=0.9),
    "SI": dict(curls=(1.00, 1.00, 1.00, 1.00), thumb_raise=1.00, spread=0.60, z_scale=0.95),
    "NO": dict(curls=(0.00, 0.00, 0.00, 0.00), thumb_raise=0.15, spread=0.42, z_scale=1.60),
    "ADIOS": dict(curls=(0.00, 0.00, 0.00, 0.00), thumb_raise=0.60, spread=1.40, z_scale=0.85),
    "POR_FAVOR": dict(curls=(0.50, 0.50, 0.55, 0.50), thumb_raise=0.80, spread=0.85, z_scale=0.95),
    "BUENOS_DIAS": dict(curls=(0.05, 0.00, 0.00, 0.05), thumb_raise=1.00, spread=1.00, z_scale=1.80),
    "BUENAS_TARDES": dict(curls=(0.05, 0.00, 0.00, 0.05), thumb_raise=1.00, spread=1.00, z_scale=0.30),
    "AYUDA": dict(curls=(0.20, 0.20, 0.15, 0.12), thumb_raise=0.95, spread=0.52, z_scale=1.10),
}


def is_demo_sign(sign: str) -> bool:
    return sign in _SIGN_PARAMS


def make_template(sign: str) -> list[list[float]]:
    """Devuelve la plantilla de landmarks de 21 puntos para una seña demo."""
    sign = sign.upper()
    if sign not in _SIGN_PARAMS:
        raise KeyError(
            f"La seña '{sign}' no existe en el modo demo. "
            f"Disponibles: {', '.join(DEMO_SIGNS)}"
        )
    return _build(**_SIGN_PARAMS[sign])


def demo_signs() -> list[str]:
    return list(DEMO_SIGNS)