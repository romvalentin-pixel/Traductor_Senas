import { useSpeech } from "../hooks/useSpeech.js";

/**
 * Muestra el resultado de la traducción: seña, texto, confianza y acciones.
 *
 * @param {Object} props
 * @param {Object|null} props.result { sign, translated_text, confidence, model, processing_time_ms }
 * @param {string|null} props.lowConfidenceMsg
 */
export default function ResultPanel({ result, lowConfidenceMsg }) {
  const { speak, isSupported } = useSpeech();

  if (!result) {
    return (
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>Seña detectada</h2>
          <span className="badge badge-warning">En espera</span>
        </div>
        <p className="muted" style={{ marginTop: "0.75rem" }}>
          Hacé una seña frente a la cámara para ver el resultado, o usá
          «Probar sin cámara» para una demostración.
        </p>
      </div>
    );
  }

  const confidencePercent = Math.round(result.confidence * 100);
  const confidenceStatus =
    result.confidence >= 0.75 ? "success" : result.confidence >= 0.45 ? "warning" : "danger";

  return (
    <div className="card fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Seña detectada</h2>
        <span className={`badge badge-${confidenceStatus}`}>{confidencePercent}%</span>
      </div>

      <div style={{ margin: "1rem 0 0.25rem" }}>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Seña: {result.sign}
        </div>
        <div className="sign-result">{result.translated_text}</div>
      </div>

      <div className="confidence-bar">
        <div className="confidence-fill" style={{ width: `${confidencePercent}%` }} />
      </div>
      <div className="muted" style={{ fontSize: "0.85rem", display: "flex", justifyContent: "space-between" }}>
        <span>Confianza: {confidencePercent}%</span>
        {result.model && <span>Modelo: {result.model}</span>}
      </div>

      {lowConfidenceMsg && <div className="alert alert-warning">{lowConfidenceMsg}</div>}

      <div className="buttons-row">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!isSupported}
          onClick={() => speak(result.translated_text)}
          title={isSupported ? "Reproducir con voz" : "Tu navegador no soporta síntesis de voz"}
        >
          🔊 Voz
        </button>
      </div>
    </div>
  );
}