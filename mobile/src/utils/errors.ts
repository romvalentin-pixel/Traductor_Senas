interface AxiosLikeError {
  isAxiosError: true;
  code?: string;
  response?: {
    status?: number;
    data?: { detail?: unknown };
  };
}

function isAxiosLikeError(error: unknown): error is AxiosLikeError {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { isAxiosError?: unknown }).isAxiosError === true
  );
}

export class ApiError extends Error {
  status?: number;
  detail?: unknown;

  constructor(message: string, status?: number, detail?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

function detailToMessage(detail: unknown): string | undefined {
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === 'object' && item && 'msg' in item) {
          return String((item as { msg: unknown }).msg);
        }
        return undefined;
      })
      .filter((item): item is string => Boolean(item));
    if (messages.length > 0) return messages.join('. ');
  }
  return undefined;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (isAxiosLikeError(error)) {
    const status = error.response?.status;
    const detail = detailToMessage(error.response?.data?.detail);
    if (detail) return detail;
    if (error.code === 'ECONNABORTED') {
      return 'La operación tardó demasiado. Verificá la conexión e intentá de nuevo.';
    }
    if (!error.response) {
      return 'No se pudo conectar con el servidor. Revisá la URL de la API y tu red.';
    }
    if (status === 401) return 'Tu sesión venció. Iniciá sesión nuevamente.';
    if (status === 403) return 'No tenés permisos para realizar esta acción.';
    if (status === 404) return 'El recurso solicitado no existe.';
    if (status === 422) return 'Los datos enviados no son válidos.';
    if (status && status >= 500) {
      return 'El servidor tuvo un problema. Intentá de nuevo en unos instantes.';
    }
    return `Error del servidor (${status ?? 'desconocido'}).`;
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Ocurrió un error inesperado.';
}

export function isVisionUnavailable(error: unknown): boolean {
  return error instanceof ApiError && error.status === 503;
}
