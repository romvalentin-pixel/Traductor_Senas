import { useCallback, useEffect, useRef, useState } from "react";
import CameraPanel from "../components/CameraPanel.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import Loader from "../components/Loader.jsx";
import { useCamera } from "../hooks/useCamera.js";
import { useHandTracking } from "../hooks/useHandTracking.js";
import { listDataset, listSigns, saveSamples, trainModel } from "../services/ai.js";

const DEFAULT_TARGET = 60;
const CAPTURE_INTERVAL_MS = 100;
const RECOMMENDED_PER_SIGN = 150;

/** Normaliza el nombre igual que el backend: MAYÚSCULAS, sin espacios raros. */
export function normalizeSignName(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "")
    .slice(0, 40);
}

/** Elige la mano más grande (misma lógica que usa el backend al predecir). */
function pickProminentHand(hands) {
  if (!hands?.length) return null;
  let best = hands[0];
  let bestScale = -1;
  for (const hand of hands) {
    const wrist = hand[0];
    let scale = 0;
    for (const point of hand) {
      scale = Math.max(
        scale,
        Math.abs(point[0] - wrist[0]),
        Math.abs(point[1] - wrist[1]),
        Math.abs(point[2] - wrist[2])
      );
    }
    if (scale > bestScale) {
      bestScale = scale;
      best = hand;
    }
  }
  return best;
}

export default function RecordSigns() {
  const canvasRef = useRef(null);
  const {
    videoRef,
    stream,
    devices,
    error: cameraError,
    start: startCamera,
    stop: stopCamera,
  } = useCamera();

  const [cameraActive, setCameraActive] = useState(false);
  const [sign, setSign] = useState("");
  const [target, setTarget] = useState(DEFAULT_TARGET);
  const [recording, setRecording] = useState(false);
  const [collected, setCollected] = useState(0);
  const [saving, setSaving] = useState(false);
  const [training, setTraining] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [dataset, setDataset] = useState(null);
  const [catalog, setCatalog] = useState([]);

  const { hands, ready, loading: detectionLoading, error: detectionError } =
    useHandTracking(videoRef, canvasRef, {
      enabled: cameraActive,
      visual: true,
    });

  const handsRef = useRef([]);
  handsRef.current = hands;
  const collectedRef = useRef([]);
  const pendingSignRef = useRef("");
  const timerRef = useRef(null);
  const finishingRef = useRef(false);

  const refreshDataset = useCallback(async () => {
    try {
      const data = await listDataset();
      setDataset(data);
    } catch (err) {
      setError(`No se pudo leer el dataset: ${err.message}`);
    }
  }, []);

  useEffect(() => {
    refreshDataset();
    listSigns()
      .then((data) => setCatalog(data))
      .catch(() => setCatalog([]));
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [refreshDataset]);

  const finishRecording = useCallback(
    async (samples) => {
      if (finishingRef.current) return;
      finishingRef.current = true;
      setRecording(false);
      setSaving(true);
      setError(null);
      setMessage(null);
      const cleanSign = pendingSignRef.current || normalizeSignName(sign);
      if (!samples.length) {
        setError("No se capturó ninguna mano. Probá de nuevo con la mano en el encuadre.");
        setSaving(false);
        finishingRef.current = false;
        return;
      }
      try {
        const result = await saveSamples({ sign: cleanSign, samples });
        const catalogNote = result.catalog_added
          ? "La seña se agregó al catálogo y ya aparece en la app."
          : "La seña ya estaba en el catálogo de la app.";
        setMessage(
          `Guardadas ${result.saved} muestras de ${result.sign}. ` +
            `Total de esa seña: ${result.total_for_sign}. ${catalogNote}`
        );
        await refreshDataset();
      } catch (err) {
        setError(`No se pudieron guardar las muestras: ${err.message}`);
      } finally {
        setSaving(false);
        finishingRef.current = false;
        collectedRef.current = [];
        setCollected(0);
      }
    },
    [refreshDataset, sign]
  );

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecording(false);
  }, []);

  const startRecording = useCallback(() => {
    const clean = normalizeSignName(sign);
    if (!clean) {
      setError(
        "Escribí el nombre de la seña antes de grabar (ej. A, HOLA, BUENAS_NOCHES)."
      );
      return;
    }
    if (!cameraActive) {
      setError("Primero activá la cámara.");
      return;
    }
    setError(null);
    setMessage(null);
    setSign(clean);
    pendingSignRef.current = clean;
    collectedRef.current = [];
    setCollected(0);
    setRecording(true);

    timerRef.current = window.setInterval(() => {
      const hand = pickProminentHand(handsRef.current);
      if (!hand) return;
      collectedRef.current = [...collectedRef.current, hand];
      setCollected(collectedRef.current.length);
      if (collectedRef.current.length >= target) {
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        void finishRecording(collectedRef.current);
      }
    }, CAPTURE_INTERVAL_MS);
  }, [cameraActive, finishRecording, sign, target]);

  async function handleStartCamera() {
    setError(null);
    const ok = await startCamera();
    setCameraActive(Boolean(ok));
  }

  function handleStopCamera() {
    stopRecording();
    stopCamera();
    setCameraActive(false);
  }

  async function handleTrain() {
    setTraining(true);
    setError(null);
    setMessage(null);
    try {
      const result = await trainModel();
      setMessage(
        `Modelo entrenado con ${result.samples} muestras y ${result.classes.length} clases. ` +
          `Precisión estimada: ${Math.round((result.accuracy || 0) * 100)}%. ` +
          "Ya podés probarlo en el Traductor."
      );
      await refreshDataset();
    } catch (err) {
      setError(`No se pudo entrenar: ${err.message}`);
    } finally {
      setTraining(false);
    }
  }

  const hasHands = hands.length > 0;
  const canRecord = cameraActive && !recording && !saving && Boolean(sign.trim());
  const progress = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;
  const totalSamples = dataset?.total_samples ?? 0;

  return (
    <>
      <div className="page-title">
        <h1>Grabar señas</h1>
        <p className="page-subtitle">
          Capturá los puntos de la mano (21 landmarks) para enseñarle una seña nueva al
          modelo. Al guardar, la seña se agrega sola al catálogo y aparece en la app.
        </p>
      </div>

      <ErrorMessage message={cameraError?.message} onRetry={handleStartCamera} />
      <ErrorMessage message={detectionError?.message} onRetry={() => window.location.reload()} />
      <ErrorMessage message={error} />
      {message && <div className="alert alert-success">{message}</div>}
      {detectionLoading && <Loader label="Cargando detector de manos…" />}

      <div className="traductor-grid">
        <CameraPanel
          videoRef={videoRef}
          canvasRef={canvasRef}
          stream={stream}
          cameraOn={cameraActive}
          deviceCount={devices.length}
          handsDetected={hasHands}
          status={
            cameraActive && !ready
              ? "Cargando detector de manos…"
              : cameraActive && recording
                ? `Grabando ${collected}/${target}…`
                : cameraActive && hasHands
                  ? "Manos detectadas"
                  : cameraActive
                    ? "Poné la mano en el encuadre"
                    : undefined
          }
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>1. Elegí la seña</h3>
            <div className="form-group">
              <label htmlFor="sign-name">Nombre de la seña</label>
              <input
                id="sign-name"
                type="text"
                className="input"
                value={sign}
                onChange={(e) => setSign(e.target.value.toUpperCase())}
                placeholder="Ej. BUENAS_NOCHES"
                list="sign-catalog"
                maxLength={40}
                disabled={recording || saving}
              />
              <datalist id="sign-catalog">
                {catalog.map((item) => (
                  <option key={item.id} value={item.name} />
                ))}
              </datalist>
              <p className="muted" style={{ marginBottom: 0 }}>
                Usá mayúsculas y guiones bajos en vez de espacios. También se acepta una
                sola letra (ej. A, B, C) para el alfabeto. Este nombre será la etiqueta
                que devuelva el modelo.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="sample-target">Muestras por grabación: {target}</label>
              <input
                id="sample-target"
                type="range"
                min="20"
                max="150"
                step="10"
                value={target}
                onChange={(e) => setTarget(parseInt(e.target.value, 10))}
                disabled={recording || saving}
                style={{ width: "100%" }}
              />
              <p className="muted" style={{ marginBottom: 0 }}>
                Recomendado: {RECOMMENDED_PER_SIGN}+ muestras por seña en total. Podés
                grabar varias veces la misma seña.
              </p>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>2. Grabá los puntos</h3>
            <div className="buttons-row">
              <button
                type="button"
                className="btn btn-success"
                onClick={handleStartCamera}
                disabled={cameraActive || recording || saving}
              >
                Activar cámara
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleStopCamera}
                disabled={!cameraActive || recording || saving}
              >
                Detener cámara
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={startRecording}
                disabled={!canRecord}
              >
                {recording ? "Grabando…" : "Grabar muestra"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={stopRecording}
                disabled={!recording}
              >
                Cancelar
              </button>
            </div>

            <div style={{ marginTop: "0.9rem" }}>
              <div className="progress-track" style={{ height: 10, borderRadius: 999, background: "var(--surface-alt, #e5e7eb)" }}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: "#22c55e",
                    transition: "width 0.1s linear",
                  }}
                />
              </div>
              <p className="muted" style={{ marginBottom: 0 }}>
                {saving
                  ? "Guardando muestras…"
                  : recording
                    ? `Capturadas ${collected} de ${target}. Mantené la seña estable.`
                    : "Cuando termines, las muestras se guardan automáticamente."}
              </p>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>3. Entrená el modelo</h3>
            <p className="muted">
              El entrenamiento combina tus muestras reales con las señas demo. Tarda unos
              segundos y se activa sin reiniciar el backend.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={handleTrain}
              disabled={training || saving || recording || totalSamples === 0}
            >
              {training ? <Loader label="Entrenando…" /> : "Entrenar con las muestras guardadas"}
            </button>
            <p className="muted" style={{ marginBottom: 0, marginTop: "0.6rem" }}>
              Total de muestras guardadas: <strong>{totalSamples}</strong>
            </p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "1.25rem" }}>
        <h3 style={{ marginTop: 0 }}>Dataset actual</h3>
        {!dataset || dataset.classes.length === 0 ? (
          <p className="muted" style={{ marginBottom: 0 }}>
            Todavía no hay muestras reales. Grabá una seña para empezar.
          </p>
        ) : (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {dataset.classes.map((item) => (
              <span
                key={item.sign}
                className={`badge ${item.count >= RECOMMENDED_PER_SIGN ? "badge-success" : "badge-warning"}`}
                title={`${item.count} muestras`}
              >
                {item.sign}: {item.count}
              </span>
            ))}
          </div>
        )}
        <p className="muted" style={{ marginBottom: 0, marginTop: "0.75rem" }}>
          Se guarda en <code>ai/dataset/argentine/&lt;SEÑA&gt;/*.json</code> y el modelo en{" "}
          <code>ai/models/sign_model.pkl</code>.
        </p>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h3 style={{ marginTop: 0 }}>Cómo grabar bien (importante)</h3>
        <ul className="muted" style={{ margin: 0, paddingLeft: "1.2rem" }}>
          <li>Usá una sola mano y que se vea completa, con buena luz y fondo quieto.</li>
          <li>Mantené la seña estable durante la grabación; no muevas la cámara.</li>
          <li>Grabá varias repeticiones por seña (3–5) y variá un poco la posición.</li>
          <li>El proyecto usa 21 puntos × 3 coordenadas = 63 features por mano.</li>
          <li>
            Al guardar, la seña se registra sola en el catálogo y aparece en la app; para
            que la cámara la reconozca, después tocá “Entrenar”.
          </li>
          <li>
            Si la seña usa dos manos, hoy el sistema toma solo la mano más grande: el
            reconocimiento de dos manos requiere otro modelo.
          </li>
        </ul>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h3 style={{ marginTop: 0 }}>Herramienta interna</h3>
        <p className="muted" style={{ marginBottom: 0 }}>
          Esta página es independiente de la app pública y no está enlazada en su menú.
          Cuando termines de cargar y entrenar, abrí{" "}
          <a href="/traductor">el Traductor</a> para ver las señas nuevas.
        </p>
      </div>
    </>
  );
}
