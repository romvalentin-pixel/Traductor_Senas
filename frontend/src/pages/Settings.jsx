import { useApp } from "../context/AppContext.jsx";

export default function Settings() {
  const app = useApp();
  const {
    theme,
    setTheme,
    language,
    setLanguage,
    speechRate,
    setSpeechRate,
    visualDetection,
    setVisualDetection,
  } = app;
  const autoSpeak = app.autoSpeak !== false;
  const setAutoSpeak =
    typeof app.setAutoSpeak === "function"
      ? app.setAutoSpeak
      : (v) => {
          try {
            localStorage.setItem("sl_autoSpeak", v ? "1" : "0");
          } catch {}
          window.location.reload();
        };

  return (
    <>
      <div className="page-title">
        <h1>Configuración</h1>
        <p className="page-subtitle">Preferencias de idioma, voz, detección y apariencia.</p>
      </div>

      <div className="grid-two">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Idioma</h3>
          <div className="form-group">
            <label htmlFor="language">Idioma de la traducción</label>
            <select
              id="language"
              className="select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="es-AR">Español (Argentina)</option>
              <option value="es-MX">Español (México)</option>
              <option value="es">Español (general)</option>
            </select>
            <p className="muted" style={{ marginBottom: 0 }}>
              La arquitectura permite agregar otros lenguajes (ej. ASL) en el
              catálogo de <code>signs</code>.
            </p>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Voz (TTS)</h3>
          <div className="form-group">
            <label htmlFor="rate">Velocidad de reproducción: {speechRate.toFixed(1)}x</label>
            <input
              id="rate"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>
          <div className="switch-row" style={{ marginTop: "0.5rem" }}>
            <span>Reproducir automáticamente la seña detectada</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={autoSpeak}
                onChange={(e) => setAutoSpeak(e.target.checked)}
              />
              <span className="slider" />
            </label>
          </div>
          <p className="muted" style={{ marginBottom: 0 }}>
            {autoSpeak
              ? "Activado: cuando la IA detecta una seña (cámara o demo), se pronuncia automáticamente."
              : "Desactivado: la traducción solo se pronuncia al tocar el botón de voz."}{" "}
            Se usa la síntesis de voz del navegador (sin conexión). El backend también
            expone un endpoint TTS (<code>/api/translation/{"{id}"}/speak</code>).
          </p>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Detección visual</h3>
          <div className="switch-row">
            <span>Dibujar puntos de referencia (landmarks) sobre la mano</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={visualDetection}
                onChange={(e) => setVisualDetection(e.target.checked)}
              />
              <span className="slider" />
            </label>
          </div>
          <p className="muted" style={{ marginBottom: 0 }}>
            Los landmarks se envían igual al servidor; esta opción solo controla el
            dibujo en pantalla.
          </p>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Apariencia</h3>
          <div className="switch-row">
            <span>Tema oscuro</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={theme === "dark"}
                onChange={(e) => setTheme(e.target.checked ? "dark" : "light")}
              />
              <span className="slider" />
            </label>
          </div>
          <p className="muted" style={{ marginBottom: 0 }}>
            El tema se guarda en este dispositivo.
          </p>
        </div>
      </div>
    </>
  );
}