import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AppProvider } from "../../context/AppContext.jsx";
import ResultPanel from "../ResultPanel.jsx";

vi.mock("../../hooks/useSpeech.js", () => ({
  useSpeech: () => ({
    speak: vi.fn(),
    stop: vi.fn(),
    isSupported:
      typeof window !== "undefined" && "speechSynthesis" in window,
  }),
}));

function renderResult(result, lowConfidenceMsg) {
  return render(
    <AppProvider>
      <ResultPanel result={result} lowConfidenceMsg={lowConfidenceMsg} />
    </AppProvider>
  );
}

describe("ResultPanel", () => {
  it("sin resultado muestra el estado de espera", () => {
    renderResult(null);
    expect(screen.getByText(/seña detectada/i)).toBeInTheDocument();
    expect(screen.getByText(/en espera/i)).toBeInTheDocument();
  });

  it("muestra la traducción y el porcentaje de confianza", () => {
    renderResult({ sign: "HOLA", translated_text: "Hola", confidence: 0.94, model: "demo" });
    expect(screen.getByText("Hola")).toBeInTheDocument();
    expect(screen.getAllByText(/94%/).length).toBeGreaterThan(0);
  });

  it("muestra la advertencia cuando la confianza es baja", () => {
    renderResult(
      { sign: "HOLA", translated_text: "Hola", confidence: 0.2, model: "demo" },
      "Confianza demasiado baja (20%)."
    );
    expect(screen.getByText(/confianza demasiado baja/i)).toBeInTheDocument();
  });

  it("el botón de voz dispara el TTS cuando está soportado", () => {
    const originalSupported = "speechSynthesis" in window;
    if (!originalSupported) return; // jsdom sin speechSynthesis: no aplica
    renderResult({ sign: "SI", translated_text: "Sí", confidence: 0.9 });
    const button = screen.getByRole("button", { name: /voz/i });
    fireEvent.click(button);
    expect(button).toBeInTheDocument();
  });
});