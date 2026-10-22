import axios, { AxiosRequestConfig } from 'axios';

import { API_BASE_URL, API_TIMEOUT_MS } from '../constants/config';
import { ApiError } from '../utils/errors';

let accessToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { Accept: 'application/json' },
});

client.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;
    const message =
      typeof detail === 'string' && detail.trim()
        ? detail
        : error.response
          ? `Error del servidor (${status ?? 'desconocido'}).`
          : 'No se pudo conectar con el servidor.';

    if (status === 401 && accessToken) {
      unauthorizedHandler?.();
    }

    return Promise.reject(new ApiError(message, status, detail));
  }
);

export const http = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return client.get(url, config) as unknown as Promise<T>;
  },
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return client.post(url, data, config) as unknown as Promise<T>;
  },
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return client.delete(url, config) as unknown as Promise<T>;
  },
};

export { API_BASE_URL };
