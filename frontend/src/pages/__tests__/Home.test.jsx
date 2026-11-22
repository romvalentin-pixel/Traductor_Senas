import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppProvider } from "../../context/AppContext.jsx";
import Home from "../Home.jsx";

function renderWithProviders(ui) {
  return render(
    <AppProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </AppProvider>
  );
}

describe("Página de Inicio", () => {
  it("muestra el título y la explicación del sistema", () => {
    renderWithProviders(<Home />);
    expect(
      screen.getByRole("heading", { name: /traductor de lenguaje de señas/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/lengua de señas argentina/i)).toBeInTheDocument();
  });

  it("tiene el botón de comenzar traducción", () => {
    renderWithProviders(<Home />);
    expect(screen.getByRole("link", { name: /comenzar traducción/i })).toBeInTheDocument();
  });

  it("muestra los pasos de uso", () => {
    renderWithProviders(<Home />);
    expect(screen.getByText(/permite la cámara/i)).toBeInTheDocument();
    expect(screen.getByText(/lectura y voz/i)).toBeInTheDocument();
  });
});