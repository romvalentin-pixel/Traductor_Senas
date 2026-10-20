import api from "./api.js";

export function createTranslation(payload) {
  return api.post("/translation", payload);
}

export function getHistory({ limit = 50, language } = {}) {
  const params = { limit };
  if (language) params.language = language;
  return api.get("/translation/history", { params });
}

export function getTranslation(id) {
  return api.get(`/translation/${id}`);
}

export function deleteTranslation(id) {
  return api.delete(`/translation/${id}`);
}

/** URL para reproducir el audio TTS generado por el backend. */
export function speakUrl(id) {
  return `${api.defaults.baseURL}/translation/${id}/speak`;
}

/** Devuelve un objeto URL/Blob para reproducir el audio (JWT incluido). */
export async function fetchSpeech(id) {
  const token = localStorage.getItem("sl_token");
  const response = await fetch(`${api.defaults.baseURL}/translation/${id}/speak`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error("No se pudo generar el audio");
  return response.blob();
}