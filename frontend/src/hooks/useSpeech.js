import { useCallback } from "react";
import { useApp } from "../context/AppContext.jsx";

/**
 * Síntesis de voz nativa del navegador (Web Speech API, sin conexión).
 * Fallback a la reproducción del audio generado por el backend (gTTS).
 */
export function useSpeech() {
  const { speechRate } = useApp();

  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  const speak = useCallback(
    (text) => {
      if (!text) return;
      if (isSupported) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "es-AR";
        utterance.rate = speechRate;
        const voices = window.speechSynthesis.getVoices();
        const esVoice = voices.find((v) => v.lang.toLowerCase().startsWith("es"));
        if (esVoice) utterance.voice = esVoice;
        window.speechSynthesis.speak(utterance);
        return true;
      }
      return false;
    },
    [isSupported, speechRate]
  );

  const stop = useCallback(() => {
    if (isSupported) window.speechSynthesis.cancel();
  }, [isSupported]);

  return { speak, stop, isSupported };
}