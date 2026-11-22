import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Gestiona el acceso a la cámara del navegador.
 *
 * - Enumera los dispositivos de video disponibles (hay laptops con 2+ cámaras,
 *   p. ej. la IR de Windows Hello da video negro en Chrome; por eso se puede
 *   elegir el dispositivo desde la UI).
 * - El stream se guarda en un ref (streamRef) para que `stop` sea estable:
 *   de otro modo, al actualizar el estado `stream`, la limpieza del effect
 *   terminaba cortando el stream recién asignado (video en negro).
 *
 * Errores manejados:
 * - NotFoundError        -> cámara no disponible
 * - NotAllowedError      -> usuario no dio permiso
 * - OverconstrainedError -> cámara con restricciones incompatibles
 *
 * @returns { videoRef, stream, devices, refreshDevices, error, start, stop }
 */
export function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState(null);

  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const all = await navigator.mediaDevices.enumerateDevices();
      const cams = all.filter((d) => d.kind === "videoinput");
      setDevices(cams);
    } catch {
      setDevices([]);
    }
  }, []);

  useEffect(() => {
    refreshDevices();
  }, [refreshDevices]);

  const stop = useCallback(() => {
    const current = streamRef.current;
    if (current) {
      current.getTracks().forEach((track) => track.stop());
    }
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
  }, []);

  const start = useCallback(
    async (deviceId) => {
      setError(null);
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new DOMException("Cámara no soportada por este navegador", "NotFoundError");
        }
        const videoConstraints = {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        };
        if (deviceId && typeof deviceId === "string" && deviceId.trim() !== "") {
          videoConstraints.deviceId = { exact: deviceId.trim() };
        } else {
          videoConstraints.facingMode = "user";
        }
        const media = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });
        streamRef.current = media;
        // El <video> es responsabilidad del panel (CameraPanel): él adjunta el
        // stream y reintenta el play(). Aquí solo dejamos el stream listo.
        setStream(media);
        // después del primer permiso los nombres de los dispositivos quedan disponibles
        refreshDevices();
        return true;
      } catch (err) {
        let message = "No se pudo acceder a la cámara.";
        if (err.name === "NotFoundError" || err.name === "OverconstrainedError") {
          message = "No se encontró ninguna cámara disponible en el dispositivo.";
        } else if (err.name === "NotAllowedError") {
          message = "Permiso denegado. Permití el acceso a la cámara en el navegador.";
        } else if (err.code === 20) {
          message = "Permiso denegado. Permití el acceso a la cámara en el navegador.";
        } else if (err.name === "NotReadableError") {
          message =
            "La cámara está siendo usada por otra aplicación (Zoom, Teams, etc.) o está bloqueada por Windows. Cerrá esa app o liberá el dispositivo e intentá de nuevo.";
        }
        setError(new Error(message));
        return false;
      }
    },
    [refreshDevices]
  );

  // Solo se corta el stream al desmontar el componente
  useEffect(() => () => stop(), [stop]);

  return { videoRef, stream, devices, refreshDevices, error, start, stop };
}