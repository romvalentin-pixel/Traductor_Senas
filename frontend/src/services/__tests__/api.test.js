import { describe, expect, it } from "vitest";

import { formatApiDetail } from "../api.js";

describe("formatApiDetail", () => {
  it("devuelve el mensaje cuando detail es un string", () => {
    expect(formatApiDetail("La seña ya existe")).toBe("La seña ya existe");
  });

  it("resume los errores de validación 422 de FastAPI", () => {
    const detail = [
      {
        type: "string_too_short",
        loc: ["body", "sign"],
        msg: "String should have at least 1 character",
      },
      {
        type: "value_error",
        loc: ["body", "samples"],
        msg: "Value error, Cada muestra debe tener 21 landmarks",
      },
    ];

    expect(formatApiDetail(detail)).toBe(
      "sign: String should have at least 1 character · " +
        "samples: Value error, Cada muestra debe tener 21 landmarks"
    );
  });

  it("ignora entradas sin mensaje", () => {
    expect(formatApiDetail([{ loc: ["body", "sign"] }])).toBeNull();
  });

  it("devuelve null si no hay detail", () => {
    expect(formatApiDetail(null)).toBeNull();
    expect(formatApiDetail(undefined)).toBeNull();
    expect(formatApiDetail("")).toBeNull();
    expect(formatApiDetail([])).toBeNull();
  });
});
