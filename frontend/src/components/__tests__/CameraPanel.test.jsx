import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CameraPanel from "../CameraPanel.jsx";

const videoRef = { current: null };
const canvasRef = { current: null };

function renderPanel(props = {}) {
  const stream = props.stream === undefined ? null : props.stream;
  return render(
    <CameraPanel
      videoRef={videoRef}
      canvasRef={canvasRef}
      stream={stream}
      cameraOn={props.cameraOn ?? false}
      handsDetected={props.handsDetected ?? false}
      status={props.status ?? null}
    />
  );
}

describe("CameraPanel", () => {
  it("muestra el cover cuando la cámara está apagada y no adjunta stream", () => {
    renderPanel({ cameraOn: false });
    expect(screen.getByText(/activá la cámara para comenzar/i)).toBeInTheDocument();
    expect(videoRef.current).toBeInstanceOf(HTMLElement);
  });

  it("oculta el cover y muestra el estado cuando la cámara está encendida", () => {
    renderPanel({ cameraOn: true });
    expect(screen.queryByText(/activá la cámara para comenzar/i)).not.toBeInTheDocument();
    expect(screen.getByText(/sin manos en el encuadre/i)).toBeInTheDocument();
  });

  it("adjunta el stream al elemento de video", () => {
    const fakeStream = { id: "stream-1" };
    renderPanel({ cameraOn: true, stream: fakeStream });
    const video = videoRef.current;
    expect(video).toBeTruthy();
    expect(video.srcObject).toBe(fakeStream);
  });
});