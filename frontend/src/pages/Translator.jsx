import { useCallback, useEffect, useRef, useState } from "react";
import CameraPanel from "../components/CameraPanel.jsx";
import ResultPanel from "../components/ResultPanel.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import Loader from "../components/Loader.jsx";
import { useCamera } from "../hooks/useCamera.js";
import { useHandTracking } from "../hooks/useHandTracking.js";
import { useSpeech } from "../hooks/useSpeech.js";
import { useApp } from "../context/AppContext.jsx";
import { aiInfo, listSigns, predict } from "../services/ai.js";
import { createTranslation } from "../services/translation.js";

const MIN_CONFIDENCE_TO_KEEP = 0.5;
const PREDICT_INTERVAL_MS = 450;
// Cuadros consecutivos con la misma seña antes de mostrarla. Evita que un
// movimiento suelto cambie el resultado y dispare el habla.
const STABLE_FRAMES = 2;

export default function Translator() {
  const { visualDetection, autoSpeak = true } = useApp();
  const { speak } = useSpeech();

  const canvasRef = useRef(null);

  const {
    videoRef: camVideoRef,
    stream: cameraStream,
    devices,
    refreshDevices,
    error: cameraError,
    start: startCamera,
    stop: stopCamera,
  } = useCamera();

  const [cameraActive, setCameraActive] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [autosave, setAutosave] = useState(true);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  const [result, setResult] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [signs, setSigns] = useState([]);
  const [modelSigns, setModelSigns] = useState([]);
  const [demoSign, setDemoSign] = useState("");
  const [demoRunning, setDemoRunning] = useState(false);

  const { hands, ready, loading: detectionLoading, error: detectionError } = useHandTracking(
    camVideoRef,
    canvasRef,
    { enabled: cameraActive && translating, visual: visualDetection }
  );

  const hasHands = hands.length > 0;

  // Catálogo de señas y clases que el modelo puede reconocer
  useEffect(() => {
    listSigns()
      .then((data) => setSigns(data))
      .catch(() => setSigns([]));

    aiInfo()
      .then((info) => {
        const available = Array.isArray(info?.signs) ? info.signs : [];
        setModelSigns(available);
        if (available.length > 0) setDemoSign(available[0]);
      })
      .catch(() => setModelSigns([]));
  }, []);

  const lastPredictRef = useRef(0);
  const predictingRef = useRef(false);
  const lastSavedSignRef = useRef("");
  const lastSpokenSignRef = useRef("");
  const candidateRef = useRef({ sign: "", count: 0 });

  const saveToHistory = useCallback(
    (res) => {
      setSaving(true);
      createTranslation({
        sign_detected: res.sign,
        translated_text: res.translated_text,
        confidence: res.confidence,
        language: "es-AR",
      })
        .catch((err) => setApiError(`No se pudo guardar en el historial: ${err.message}`))
        .finally(() => setSaving(false));
    },
    []
  );

  // Bucle de predicción sobre los landmarks detectados
  useEffect(() => {
    if (!cameraActive || !translating) return;
    if (hands.length === 0) {
      candidateRef.current = { sign: "", count: 0 };
      return;
    }

    const now = Date.now();
    if (now - lastPredictRef.current < PREDICT_INTERVAL_MS) return;
    lastPredictRef.current = now;
    if (predictingRef.current) return;
    predictingRef.current = true;

    predict({ landmarks: hands, language: "es-AR" })
      .then((res) => {
        // Confirmación por cuadros consecutivos: una sola predicción aislada
        // no alcanza para cambiar lo que se muestra.
        if (candidateRef.current.sign === res.sign) {
          candidateRef.current.count += 1;
        } else {
          candidateRef.current = { sign: res.sign, count: 1 };
        }
        if (candidateRef.current.count < STABLE_FRAMES) return;

        setResult(res);
        setApiError(null);
        if (autoSpeak && res.sign && res.sign !== lastSpokenSignRef.current) {
          lastSpokenSignRef.current = res.sign;
          speak(res.translated_text);
        }
        if (autosave && res.confidence >= MIN_CONFIDENCE_TO_KEEP) {
          if (res.sign !== lastSavedSignRef.current) {
            lastSavedSignRef.current = res.sign;
            saveToHistory(res);
          }
        }
      })
      .catch((err) => setApiError(`El servidor no respondió correctamente: ${err.message}`))
      .finally(() => {
        predictingRef.current = false;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hands, cameraActive, translating, autosave, autoSpeak, saveToHistory, speak]);

  // ---- Acciones de la barra ----
  async function handleStart() {
    setApiError(null);
    if (!cameraActive) {
      const ok = await startCamera();
      if (ok) {
        setCameraActive(true);
        setTranslating(true);
      }
    } else {
      setCameraActive(false);
      stopCamera();
      setTranslating(false);
      setResult(null);
    }
  }

  function handleToggleTranslate() {
    setTranslating((t) => !t);
  }

  async function handleDeviceChange(e) {
    const id = e.target.value;
    setSelectedDeviceId(id);
    if (!cameraActive) return;
    // reinicia la cámara con el nuevo dispositivo sin cortar el flujo
    setApiError(null);
    stopCamera();
    const ok = await startCamera(id);
    if (!ok) {
      setCameraActive(false);
      setTranslating(false);
    }
  }

  function handleClear() {
    setResult(null);
    lastSavedSignRef.current = "";
    lastSpokenSignRef.current = "";
    candidateRef.current = { sign: "", count: 0 };
  }

  async function handleDemoPredict() {
    if (!demoSign) return;
    setDemoRunning(true);
    setApiError(null);
    setCameraActive(false);
    stopCamera();
    setTranslating(false);
    try {
      const res = await predict({ demo_sign: demoSign, language: "es-AR" });
      setResult(res);
      if (autoSpeak) {
        lastSpokenSignRef.current = res.sign;
        speak(res.translated_text);
      }
      if (autosave && res.confidence >= MIN_CONFIDENCE_TO_KEEP && res.sign !== lastSavedSignRef.current) {
        lastSavedSignRef.current = res.sign;
        saveToHistory(res);
      }
    } catch (err) {
      setApiError(`Error en el modelo de IA: ${err.message}`);
    } finally {
      setDemoRunning(false);
    }
  }

  const cameraStatus =
    cameraActive && !ready
      ? "Cargando detector de manos…"
      : cameraActive && ready && !translating
      ? "Cámara activa — presioná ▶ Traducir para comenzar"
      : cameraActive && ready && translating
      ? hasHands
        ? "✓ Manos detectadas"
        : "Sin manos en el encuadre…"
      : undefined;

  const lowConfidenceMsg =
    result && result.confidence < 0.45
      ? `Confianza demasiado baja (${Math.round(result.confidence * 100)}%). Repetí la seña con mejor iluminación y encuadre.`
      : null;

  // Para la demo solo ofrecemos las clases que el modelo realmente conoce.
  const demoOptions = modelSigns.length > 0 ? modelSigns : signs.map((s) => s.name);
  const hasPendingSigns = signs.some((s) => s.recognized === false);

  return (
    <>
      <div className="page-title">
        <h1>Traductor</h1>
        <p className="page-subtitle">
          Realizá una seña frente a la cámara y mirá la traducción en vivo.
        </p>
      </div>

      <ErrorMessage message={cameraError?.message} onRetry={handleStart} />
      <ErrorMessage message={detectionError?.message} onRetry={() => window.location.reload()} />
      <ErrorMessage message={apiError} />

      {detectionLoading && <Loader label="Cargando modelo de manos…" />}

      <div className="traductor-grid">
        <CameraPanel
          videoRef={camVideoRef}
          canvasRef={canvasRef}
          stream={cameraStream}
          cameraOn={cameraActive}
          deviceCount={devices.length}
          handsDetected={hasHands}
          status={cameraStatus}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <ResultPanel result={result} lowConfidenceMsg={lowConfidenceMsg} />

          {saving && <Loader label="Guardando en el historial…" />}

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Acciones</h3>
            <div className="buttons-row">
              <button type="button" className="btn btn-success" disabled={cameraActive} onClick={handleStart}>
                {cameraActive ? "Cámara activa" : "📷 Iniciar traducción"}
              </button>
              <button type="button" className="btn btn-danger" disabled={!cameraActive} onClick={handleStart}>
                🛑 Detener
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!cameraActive}
                onClick={handleToggleTranslate}
              >
                {cameraActive && translating ? "⏸ Pausar traducción" : "▶ Traducir"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleClear} disabled={!result}>
                🗑 Borrar resultado
              </button>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Fuente de video</h3>
            <p className="muted" style={{ margin: "0 0 0.75rem" }}>
              Si el encuadre se ve negro sin imagen, Chrome puede estar usando la
              cámara equivocada (p. ej. la IR de Windows Hello). Elegí otra y se
              reinicia sola.
            </p>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <select
                className="select"
                value={selectedDeviceId}
                onChange={handleDeviceChange}
                disabled={devices.length === 0}
                style={{ flex: 1, minWidth: 180 }}
                aria-label="Fuente de video"
              >
                <option value="">Cámara predeterminada</option>
                {devices.map((d, i) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Cámara ${i + 1}`}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={refreshDevices}
                title="Refrescar lista de cámaras"
              >
                ↻
              </button>
            </div>
            {devices.length === 0 && (
              <p className="muted" style={{ marginBottom: 0 }}>
                No se detectaron cámaras. Revisá que el navegador tenga permiso
                de cámara (icono 🔒 en la barra de direcciones).
              </p>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Guardado automático</h3>
            <div className="switch-row">
              <span>Guardar cada traducción en el Historial</span>
              <label className="switch">
                <input type="checkbox" checked={autosave} onChange={(e) => setAutosave(e.target.checked)} />
                <span className="slider" />
              </label>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Probar sin cámara (demo)</h3>
            <p className="muted" style={{ margin: "0 0 0.75rem" }}>
              Elegí una seña del vocabulario y el backend generará sus landmarks
              de demostración para recorrer todo el flujo.
            </p>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <select
                className="select"
                value={demoSign}
                onChange={(e) => setDemoSign(e.target.value)}
                style={{ flex: 1, minWidth: 160 }}
              >
                {demoOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!demoSign || demoRunning}
                onClick={handleDemoPredict}
              >
                {demoRunning ? <span className="spinner" /> : "Predecir (demo)"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {signs.length > 0 && (
        <div className="card" style={{ marginTop: "1.25rem" }}>
          <h3 style={{ marginTop: 0 }}>Vocabulario disponible ({signs.length})</h3>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {signs.map((s) => (
              <span
                key={s.name}
                className={`badge ${s.recognized === false ? "badge-warning" : "badge-success"}`}
                title={s.recognized === false ? "Todavía no entrenada" : undefined}
              >
                {s.display_name || s.name}
              </span>
            ))}
          </div>
          {hasPendingSigns && (
            <p className="muted" style={{ marginBottom: 0 }}>
              Las señas en amarillo están en el catálogo pero todavía no fueron
              entrenadas: el modelo no las va a reconocer hasta que se graben
              muestras y se entrene.
            </p>
          )}
        </div>
      )}
    </>
  );
}