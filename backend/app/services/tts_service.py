"""
Servicio de Text-to-Speech (TTS).

Genera audio MP3 de un texto usando gTTS (Google Text-to-Speech). Requiere
conexión a internet. La alternativa sin red es la síntesis nativa del navegador
(Web Speech API), ya integrada en el frontend.
"""

from __future__ import annotations

import io

from fastapi import HTTPException, status

from app.core.config import settings


def synthesize_text(text: str, lang: str | None = None) -> bytes:
    """Devuelve el audio MP3 en memoria para `text`."""
    lang = lang or settings.TTS_LANGUAGE
    try:
        from gtts import gTTS

        buffer = io.BytesIO()
        tts = gTTS(text=text, lang=lang)
        tts.write_to_fp(buffer)
        buffer.seek(0)
        return buffer.getvalue()
    except Exception as exc:  # sin conexión, problemas de red, etc.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                f"No se pudo generar el audio (motor TTS no disponible): {exc}"
            ),
        ) from exc