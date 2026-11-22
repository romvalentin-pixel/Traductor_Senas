import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCamera } from "../useCamera.js";

function installMediaDevices() {
  const track1 = { kind: "video", label: "cam", stop: vi.fn() };
  const track2 = { kind: "audio", label: "mic", stop: vi.fn() };
  const media = {
    id: "media-1",
    getTracks: () => [track1, track2],
    getVideoTracks: () => [track1],
  };
  const mediaDevices = {
    getUserMedia: vi.fn().mockResolvedValue(media),
    enumerateDevices: vi.fn().mockResolvedValue([
      { kind: "videoinput", deviceId: "cam-1", label: "Cámara principal" },
    ]),
  };
  Object.defineProperty(window.navigator, "mediaDevices", {
    value: mediaDevices,
    configurable: true,
  });
  return { mediaDevices, media, track1, track2 };
}

describe("useCamera", () => {
  let fake;

  beforeEach(() => {
    fake = installMediaDevices();
  });

  afterEach(() => {
    delete window.navigator.mediaDevices;
  });

  it("expone el stream al arrancar y stop() lo libera sin cortes previos", async () => {
    const video = document.createElement("video");
    video.play = vi.fn().mockReturnValue(Promise.resolve());

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      // simulamos que el componente ya montó el <video> en el ref
      result.current.videoRef.current = video;
      const ok = await result.current.start();
      expect(ok).toBe(true);
    });

    expect(fake.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);
    expect(result.current.stream).toBe(fake.media);
    expect(fake.track1.stop).not.toHaveBeenCalled();

    // un re-render sin stop() no debe cortar el stream
    await act(async () => {});
    expect(result.current.stream).toBe(fake.media);
    expect(fake.track1.stop).not.toHaveBeenCalled();

    // stop() explícito sí detiene tracks y limpia el video
    act(() => {
      result.current.stop();
    });
    expect(fake.track1.stop).toHaveBeenCalledOnce();
    expect(fake.track2.stop).toHaveBeenCalledOnce();
    expect(video.srcObject).toBeNull();
    expect(result.current.stream).toBeNull();
  });
});