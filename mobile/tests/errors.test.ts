import { ApiError, getErrorMessage, isVisionUnavailable } from '../src/utils/errors';

describe('errores de la API', () => {
  it('devuelve el mensaje de un ApiError', () => {
    expect(getErrorMessage(new ApiError('No autorizado', 401))).toBe('No autorizado');
  });

  it('detecta cuando la ruta de visión no está disponible', () => {
    expect(isVisionUnavailable(new ApiError('MediaPipe no instalado', 503))).toBe(true);
    expect(isVisionUnavailable(new ApiError('Datos inválidos', 400))).toBe(false);
    expect(isVisionUnavailable(new Error('otro'))).toBe(false);
  });

  it('usa un mensaje genérico para errores desconocidos', () => {
    expect(getErrorMessage(undefined)).toBe('Ocurrió un error inesperado.');
  });
});
