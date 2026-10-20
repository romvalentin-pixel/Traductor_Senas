import { useCallback, useEffect, useState } from "react";
import { getHistory, deleteTranslation } from "../services/translation.js";
import { useSpeech } from "../hooks/useSpeech.js";
import ErrorMessage from "../components/ErrorMessage.jsx";
import Loader from "../components/Loader.jsx";

function formatDate(value) {
  const date = new Date(value);
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function History() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { speak, isSupported } = useSpeech();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHistory({ limit: 100 });
      setItems(data);
    } catch (err) {
      setError(err.message || "No se pudo cargar el historial");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id) {
    try {
      await deleteTranslation(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err.message || "No se pudo eliminar el registro");
    }
  }

  return (
    <>
      <div className="page-title" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
        <div>
          <h1>Historial</h1>
          <p className="page-subtitle">Tus traducciones guardadas, con fecha, seña y confianza.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={load}>
          ⟳ Actualizar
        </button>
      </div>

      <ErrorMessage message={error} onRetry={load} />
      {loading && <Loader label="Cargando historial…" />}

      {!loading && items.length === 0 && (
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2.2rem" }}>🗂</div>
          <p className="muted">
            Todavía no tenés traducciones guardadas. Andá al <a href="/traductor">Traductor</a>.
          </p>
        </div>
      )}

      {items.length > 0 && (
        <div className="card" style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Fecha y hora</th>
                <th>Seña</th>
                <th>Traducción</th>
                <th>Confianza</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const pct = Math.round(item.confidence * 100);
                const badge =
                  item.confidence >= 0.75 ? "success" : item.confidence >= 0.45 ? "warning" : "danger";
                return (
                  <tr key={item.id} className="fade-in">
                    <td className="muted">{formatDate(item.created_at)}</td>
                    <td><b>{item.sign_detected}</b></td>
                    <td>{item.translated_text}</td>
                    <td>
                      <span className={`badge badge-${badge}`}>{pct}%</span>
                    </td>
                    <td>
                      <div className="buttons-row" style={{ margin: 0 }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          disabled={!isSupported}
                          onClick={() => speak(item.translated_text)}
                          title="Reproducir con voz"
                        >
                          🔊
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => handleDelete(item.id)}
                          title="Eliminar registro"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}