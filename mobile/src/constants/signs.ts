import type { Sign } from '../types/api';

// Copia local del vocabulario demo del backend. Se usa solo si el endpoint
// /api/signs no responde (por ejemplo, backend apagado o sin autenticación).
export const FALLBACK_SIGNS: Sign[] = [
  { id: 0, name: 'HOLA', description: null, language: 'es-AR', created_at: '' },
  { id: 0, name: 'GRACIAS', description: null, language: 'es-AR', created_at: '' },
  { id: 0, name: 'SI', description: null, language: 'es-AR', created_at: '' },
  { id: 0, name: 'NO', description: null, language: 'es-AR', created_at: '' },
  { id: 0, name: 'ADIOS', description: null, language: 'es-AR', created_at: '' },
  { id: 0, name: 'POR_FAVOR', description: null, language: 'es-AR', created_at: '' },
  { id: 0, name: 'BUENOS_DIAS', description: null, language: 'es-AR', created_at: '' },
  { id: 0, name: 'BUENAS_TARDES', description: null, language: 'es-AR', created_at: '' },
  { id: 0, name: 'AYUDA', description: null, language: 'es-AR', created_at: '' },
];
