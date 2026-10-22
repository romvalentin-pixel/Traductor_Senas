import {
  confidencePercent,
  confidenceTone,
  formatSignName,
} from '../src/utils/format';

describe('formato de resultados', () => {
  it('convierte la confianza en porcentaje y la limita entre 0 y 100', () => {
    expect(confidencePercent(0.876)).toBe(88);
    expect(confidencePercent(-1)).toBe(0);
    expect(confidencePercent(2)).toBe(100);
  });

  it('clasifica la confianza en colores', () => {
    expect(confidenceTone(0.9)).toBe('success');
    expect(confidenceTone(0.6)).toBe('warning');
    expect(confidenceTone(0.2)).toBe('danger');
  });

  it('reemplaza guiones bajos por espacios en el nombre de la seña', () => {
    expect(formatSignName('BUENOS_DIAS')).toBe('BUENOS DIAS');
    expect(formatSignName('HOLA')).toBe('HOLA');
  });
});
