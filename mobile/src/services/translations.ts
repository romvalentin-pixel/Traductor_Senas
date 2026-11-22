import type { CreateTranslationInput, Translation } from '../types/api';
import { http } from './http';

export async function createTranslation(payload: CreateTranslationInput): Promise<Translation> {
  return http.post<Translation>('/translation', payload);
}

export async function getHistory(limit = 100, language?: string): Promise<Translation[]> {
  return http.get<Translation[]>('/translation/history', {
    params: language ? { limit, language } : { limit },
  });
}

export async function getTranslation(id: number): Promise<Translation> {
  return http.get<Translation>(`/translation/${id}`);
}

export async function deleteTranslation(id: number): Promise<{ message: string }> {
  return http.delete<{ message: string }>(`/translation/${id}`);
}
