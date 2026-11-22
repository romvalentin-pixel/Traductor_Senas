import api from "./api.js";

/**
 * Clasifica una seña.
 * @param {{landmarks: number[][][], demo_sign?: string}} payload
 */
export function predict(payload) {
  return api.post("/ai/predict", payload);
}

export function aiInfo() {
  return api.get("/ai/info");
}

export function listSigns(language = "es-AR") {
  return api.get("/signs", { params: { language } });
}

export function listDataset() {
  return api.get("/ai/dataset");
}

export function saveSamples({ sign, samples, language = "es-AR" }) {
  return api.post("/ai/samples", { sign, samples, language });
}

export function trainModel() {
  return api.post("/ai/train");
}