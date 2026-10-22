export type ConfidenceTone = 'success' | 'warning' | 'danger';

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha desconocida';
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function confidencePercent(confidence: number): number {
  const clamped = Math.max(0, Math.min(1, confidence));
  return Math.round(clamped * 100);
}

export function confidenceTone(confidence: number): ConfidenceTone {
  if (confidence >= 0.75) return 'success';
  if (confidence >= 0.45) return 'warning';
  return 'danger';
}

export function formatSignName(sign: string): string {
  return sign.replace(/_/g, ' ');
}
