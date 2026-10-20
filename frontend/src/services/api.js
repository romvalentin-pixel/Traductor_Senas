// Cliente HTTP compartido. Adjunta el JWT automáticamente y normaliza las
// respuestas (devuelve el body directamente) y los errores.

import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL,
  timeout: 20000,
});

/**
 * Convierte el `detail` de FastAPI en un mensaje legible.
 *
 * FastAPI devuelve un string para errores de negocio y una lista de objetos
 * `{loc, msg}` para errores de validación (422). Antes se mostraba
 * "No se pudo conectar con el servidor" en ambos casos, lo que confundía.
 */
export function formatApiDetail(detail) {
  if (!detail) return null;
  if (typeof detail === "string") return detail.trim() || null;

  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (!item || typeof item !== "object") return null;
        const loc = Array.isArray(item.loc)
          ? item.loc.filter((part) => !["body", "query", "path"].includes(part))
          : [];
        const field = loc.join(".");
        const msg = item.msg || item.message || "";
        if (!msg) return null;
        return field ? `${field}: ${msg}` : msg;
      })
      .filter(Boolean);
    if (parts.length) return parts.join(" · ");
    return null;
  }

  if (typeof detail === "object") {
    try {
      return JSON.stringify(detail);
    } catch {
      return null;
    }
  }
  return null;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sl_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;

    // Sin respuesta del servidor: problema de red, backend apagado o CORS.
    let message = "No se pudo conectar con el servidor.";
    if (error.response) {
      message =
        formatApiDetail(detail) ||
        `El servidor respondió con un error ${status ?? "desconocido"}.`;
    }

    if (status === 401) {
      // Credenciales inválidas o token expirado
      if (location.pathname !== "/login") {
        localStorage.removeItem("sl_token");
        localStorage.removeItem("sl_user");
      }
    }
    const wrapped = new Error(message);
    wrapped.status = status;
    wrapped.detail = detail;
    return Promise.reject(wrapped);
  }
);

export default api;
export { baseURL };
