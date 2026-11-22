import { PREDICT_TIMEOUT_MS } from '../constants/config';
import type { AIInfo, Prediction, PredictionRequest, Sign } from '../types/api';
import { http } from './http';

export async function predict(payload: PredictionRequest): Promise<Prediction> {
  return http.post<Prediction>('/ai/predict', payload, { timeout: PREDICT_TIMEOUT_MS });
}

export async function aiInfo(): Promise<AIInfo> {
  return http.get<AIInfo>('/ai/info');
}

export async function listSigns(language = 'es-AR'): Promise<Sign[]> {
  return http.get<Sign[]>('/signs', { params: { language } });
}
