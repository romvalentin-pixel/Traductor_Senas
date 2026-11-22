import { useCallback, useEffect, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

// Conexiones estándar entre landmarks (para dibujar el esqueleto de la mano).
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],           // pulgar
  [0, 5], [5, 6], [6, 7], [7, 8],           // índice
  [5, 9], [9, 10], [10, 11], [11, 12],      // medio
  [9, 13], [13, 14], [14, 15], [15, 16],    // anular
  [13, 17], [17, 18], [18, 19], [19, 20],   // meñique
  [0, 17],
];

let landmarkerPromise = null;

async function createLandmarker(delegate) {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );
  return HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      delegate,
    },
    runningMode: "VIDEO",
    numHands: 2,
  });
}

/**
 * Carga (una única vez) el HandLandmarker de MediaPipe desde el CDN.
 * Intenta primero con GPU y, si WebGL no está disponible, cae a CPU.
 * El modelo se descarga la primera vez y luego queda en caché del navegador.
 */
export function loadHandLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = createLandmarker("GPU").catch(() => createLandmarker("CPU"));
  }
  return landmarkerPromise;
}

function drawHand(ctx, landmarks, w, h) {
  // MediaPipe entrega cada landmark como objeto {x, y, z}
  // Puntos
  for (const lm of landmarks) {
    ctx.beginPath();
    ctx.arc(lm.x * w, lm.y * h, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "#22d3ee";
    ctx.fill();
  }
  // Conexiones
  ctx.strokeStyle = "#facc15";
  ctx.lineWidth = 3;
  for (const [a, b] of HAND_CONNECTIONS) {
    const pa = landmarks[a];
    const pb = landmarks[b];
    if (!pa || !pb) continue;
    ctx.beginPath();
    ctx.moveTo(pa.x * w, pa.y * h);
    ctx.lineTo(pb.x * w, pb.y * h);
    ctx.stroke();
  }
}

/**
 * Procesa el video en un bucle de animación y extrae los landmarks.
 *
 * - Solo predice cada N frames (control de frecuencia) para no saturar la CPU.
 * - Dibuja el esqueleto sobre el canvas SOLO si `visual` está activado.
 * - Llama a onUpdate(hands) con cada detección: cada mano es una lista de
 *   21 landmarks [x, y, z].
 *
 * @returns { hands, ready, loading, error }
 */
export function useHandTracking(videoRef, canvasRef, { enabled = false, visual = true } = {}) {
  const [hands, setHands] = useState([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const videoRefRef = useRef(videoRef);
  videoRefRef.current = videoRef;
  const canvasRefRef = useRef(canvasRef);
  canvasRefRef.current = canvasRef;
  const visualRef = useRef(visual);
  visualRef.current = visual;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    if (!enabled) {
      setHands([]);
      setReady(false);
      return undefined;
    }

    let cancelled = false;
    let rafId = 0;
    let lastVideoTime = -1;
    let frameCount = 0;
    let errorShown = false;

    setLoading(true);
    setError(null);

    loadHandLandmarker()
      .then((landmarker) => {
        if (cancelled) return;
        setReady(true);

        const loop = () => {
          if (cancelled) return;
          const video = videoRefRef.current?.current;
          const canvas = canvasRefRef.current?.current;
          if (video && canvas && video.readyState >= 2 && video.currentTime !== lastVideoTime) {
            lastVideoTime = video.currentTime;

            // El canvas sigue el tamaño intrínseco del video
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
            }

            const w = canvas.width;
            const h = canvas.height;
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(video, 0, 0, w, h);

            frameCount += 1;
            // Throttling: clasificar solo cada 3 frames
            if (frameCount % 3 === 0) {
              try {
                const results = landmarker.detectForVideo(video, performance.now());
                const detected = (results?.landmarks || []).map((hand) =>
                  hand.map((lm) => [lm.x, lm.y, lm.z])
                );
                if (visualRef.current) {
                  for (const hand of results?.landmarks || []) {
                    drawHand(ctx, hand, w, h);
                  }
                }
                setHands(detected);
              } catch (err) {
                if (!errorShown) {
                  errorShown = true;
                  setError(
                    new Error(
                      `El detector de manos falló al procesar el video: ${err?.message || "error desconocido"}`
                    )
                  );
                }
              }
            }
          }
          rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            new Error(
              "No se pudo inicializar el detector de manos (MediaPipe). Verificá la conexión a internet."
            )
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      setReady(false);
      setLoading(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { hands, ready, loading, error };
}