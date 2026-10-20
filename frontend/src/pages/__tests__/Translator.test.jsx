import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppProvider } from "../../context/AppContext.jsx";
import Translator from "../Translator.jsx";

// Mocks de hooks de hardware
vi.mock("../../hooks/useCamera.js", () => ({
  useCamera: () => ({
    videoRef: { current: null },
    stream: null,
    devices: [],
    refreshDevices: vi.fn(),
    error: null,
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
  }),
}));

vi.mock("../../hooks/useHandTracking.js", () => ({
  useHandTracking: () => ({
    hands: [],
    ready: true,
    loading: false,
    error: null,
  }),
}));

// Mocks de servicios
const predictMock = vi.fn();
const listSignsMock = vi.fn();
const aiInfoMock = vi.fn();
const createTranslationMock = vi.fn();

vi.mock("../../services/ai.js", () => ({
  listSigns: (language) => listSignsMock(language),
  predict: (payload) => predictMock(payload),
  aiInfo: () => aiInfoMock(),
}));

vi.mock("../../services/translation.js", () => ({
  createTranslation: (payload) => createTranslationMock(payload),
}));

const SIGNS = [
  { id: 1, name: "HOLA", description: null, language: "es-AR" },
  { id: 2, name: "GRACIAS", description: null, language: "es-AR" },
];

beforeEach(() => {
  predictMock.mockReset();
  listSignsMock.mockResolvedValue(SIGNS);
  aiInfoMock.mockResolvedValue({ signs: ["HOLA", "GRACIAS"] });
  createTranslationMock.mockResolvedValue({ id: 1 });
});

function renderTranslator() {
  return render(
    <AppProvider>
      <Translator />
    </AppProvider>
  );
}

describe("Página Traductor", () => {
  it("muestra el panel de cámara con estado inicial", async () => {
    renderTranslator();
    expect(screen.getByRole("heading", { name: /traductor/i })).toBeInTheDocument();
    expect(await screen.findByText(/activá la cámara para comenzar/i)).toBeInTheDocument();
  });

  it("carga el vocabulario y permite probar una seña demo", async () => {
    predictMock.mockResolvedValue({
      sign: "HOLA",
      translated_text: "Hola",
      confidence: 0.99,
      model: "demo",
      processing_time_ms: 2,
    });

    renderTranslator();
    expect(listSignsMock).toHaveBeenCalled();

    // Espera a que cargue el vocabulario
    await screen.findByText(/vocabulario disponible/i);
    expect(screen.getAllByText("HOLA").length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole("button", { name: /predecir \(demo\)/i }));

    await waitFor(() => {
      expect(predictMock).toHaveBeenCalledWith({
        demo_sign: "HOLA",
        language: "es-AR",
      });
    });
  });

  it("muestra un error claro si el backend no responde", async () => {
    predictMock.mockRejectedValue(
      Object.assign(new Error("El servidor no respondió correctamente"), { status: 500 })
    );

    renderTranslator();
    await screen.findByText(/vocabulario disponible/i);

    await userEvent.click(screen.getByRole("button", { name: /predecir \(demo\)/i }));

    expect(
      await screen.findByText(/error en el modelo de ia/i)
    ).toBeInTheDocument();
  });

  it("el botón de borrar limpia el resultado", async () => {
    predictMock.mockResolvedValue({
      sign: "SI",
      translated_text: "Sí",
      confidence: 0.97,
      model: "demo",
    });

    renderTranslator();
    await screen.findByText(/vocabulario disponible/i);
    await userEvent.click(screen.getByRole("button", { name: /predecir \(demo\)/i }));

    expect(await screen.findByText("Sí")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /borrar resultado/i }));
    expect(screen.getByText(/en espera/i)).toBeInTheDocument();
  });
});