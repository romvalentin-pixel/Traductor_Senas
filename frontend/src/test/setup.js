import "@testing-library/jest-dom";
import { afterEach, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom (con url opaca) no expone localStorage completo; usamos un polyfill en memoria.
function createStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

if (!window.localStorage || typeof window.localStorage.clear !== "function") {
  Object.defineProperty(window, "localStorage", {
    value: createStorage(),
    configurable: true,
  });
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});