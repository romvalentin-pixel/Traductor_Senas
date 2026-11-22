"""
Mapeo seña -> texto traducido (español rioplatense, LSA).

Si un modelo entrenado devuelve una seña que no está en este diccionario,
se usa el nombre de la seña con la primera letra en mayúscula.
"""

from __future__ import annotations

SIGN_TRANSLATIONS: dict[str, str] = {
    "HOLA": "Hola",
    "GRACIAS": "Gracias",
    "SI": "Sí",
    "NO": "No",
    "ADIOS": "Adiós",
    "POR_FAVOR": "Por favor",
    "BUENOS_DIAS": "Buenos días",
    "BUENAS_TARDES": "Buenas tardes",
    "AYUDA": "Ayuda",
}


def translate_sign(sign: str) -> str:
    """Traduce el nombre interno de una seña a su texto legible."""
    return SIGN_TRANSLATIONS.get(sign, sign.replace("_", " ").title())