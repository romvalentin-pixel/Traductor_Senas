import { useEffect, useRef, useState } from "react";

/**
 * Panel de la cámara: muestra el video, superpone el canvas de landmarks
 * y presenta el estado (detectando / sin manos).
 *
 * El `<video>` se vincula al stream aquí (por efecto sobre `stream`), así la
 * conexión cámara→video no depende del momento en que arrancó el hook.
 * Si pasados ~2,5 s el video no recibe frames (videoWidth === 0), muestra un
 * aviso: suele ser que Chrome eligió la cámara equivocada (p. ej. la IR de
 * Windows Hello) o que otra app la tiene ocupada.
 *
 * @param {Object} props
 * @param {Ref} props.videoRef   ref del <video>
 * @param {Ref} props.canvasRef  ref del <canvas> de overlay
 * @param {MediaStream|null} props.stream   stream de la cámara
 * @param {boolean} props.cameraOn si la cámara está activa (el video se muestra)
 * @param {boolean} props.handsDetected
 * @param {string|null} props.status  mensaje de estado
 */
export default function CameraPanel({
  videoRef,
  canvasRef,
  stream,
  cameraOn,
  handsDetected,
  status,
  deviceCount = 0,
}) {
  const videoElRef = useRef(null);
  const canvasElRef = useRef(null);
  const [noVideo, setNoVideo] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (typeof videoRef === "object" && videoRef) videoRef.current = videoElRef.current;
    if (typeof canvasRef === "object" && canvasRef) canvasRef.current = canvasElRef.current;
  }, [videoRef, canvasRef]);

  useEffect(() => {
    const video = videoElRef.current;
    if (!video) return undefined;
    if (!stream) {
      video.srcObject = null;
      return undefined;
    }
    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }
    // Un único dueño del play. Chrome puede rechazar el play() inmediato con
    // AbortError (play pendiente del autoPlay); reintentamos hasta tener frames.
    const ensurePlay = () => {
      try {
        const p = video.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      } catch {
        // algunos entornos (test) no implementan play()
      }
    };
    ensurePlay();
    const retryTimer = window.setInterval(() => {
      if (video.videoWidth > 0 && !video.paused) {
        window.clearInterval(retryTimer);
        return;
      }
      ensurePlay();
    }, 350);
    return () => window.clearInterval(retryTimer);
  }, [stream]);

  const buildDiag = () => {
    const v = videoElRef.current;
    if (!v) return "video: n/a";
    const connected = v.srcObject ? "sí" : "no";
    const size = v.videoWidth > 0 ? `${v.videoWidth}x${v.videoHeight}` : "0x0";
    const paused = v.paused ? "sí" : "no";
    return `stream:${connected} ready:${v.readyState} ${size} pausado:${paused} cámaras:${deviceCount}`;
  };

  useEffect(() => {
    if (!cameraOn) {
      setNoVideo(false);
      return undefined;
    }
    const startedAt = Date.now();
    let lastLogged = "";
    const timer = setInterval(() => {
      // fuerza re-render para que el diagnóstico en vivo esté actualizado
      setTick((t) => t + 1);
      const video = videoElRef.current;
      const hasFrames = video && video.videoWidth > 0;
      if (hasFrames) {
        setNoVideo(false);
      } else if (Date.now() - startedAt > 2500) {
        setNoVideo(true);
      }
      const diagText = buildDiag();
      if (diagText !== lastLogged) {
        lastLogged = diagText;
        console.log("[SL-cam]", diagText);
      }
    }, 500);
    return () => {
      clearInterval(timer);
      setNoVideo(false);
    };
  }, [cameraOn, stream]);

  const diag = buildDiag();

  return (
    <div className="camera-box" aria-label="Cámara">
      <video ref={videoElRef} playsInline autoPlay muted />
      <canvas ref={canvasElRef} aria-hidden="true" />
      {!cameraOn && (
        <div className="camera-cover">
          <div style={{ fontSize: "2.4rem" }}>🎥</div>
          <p style={{ margin: 0 }}>
            Activá la cámara para comenzar a traducir.
          </p>
        </div>
      )}
      {cameraOn && noVideo && (
        <div className="camera-warning" role="status">
          ⚠️ No llega video desde esta cámara. Probá con otra «Fuente de video»,
          cerrá apps que la usen (Zoom, Teams…) y revisá en Windows:
          Configuración → Privacidad y seguridad → Cámara.
        </div>
      )}
      {cameraOn && (
        <div className="camera-status">
          {status ||
            (handsDetected
              ? "✓ Manos detectadas"
              : "Sin manos en el encuadre…")}
          {!handsDetected && (
            <span className="diag-inline"> · {diag}</span>
          )}
        </div>
      )}
      {cameraOn && (
        <div className="camera-diag" data-testid="camera-diag">
          {diag}
        </div>
      )}
    </div>
  );
}