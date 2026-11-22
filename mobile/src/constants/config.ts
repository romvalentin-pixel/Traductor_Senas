import Constants from 'expo-constants';

function inferDevelopmentApiUrl(): string {
  // En desarrollo, Expo conoce la IP del host que sirve el bundle. Usarla
  // evita tener que editar la URL cada vez que cambia la red Wi-Fi.
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];
  if (host) return `http://${host}:8000/api`;
  // Emulador Android sin hostUri: 10.0.2.2 apunta a la máquina anfitriona.
  return 'http://10.0.2.2:8000/api';
}

const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_BASE_URL = (configuredUrl || inferDevelopmentApiUrl()).replace(/\/+$/, '');

export const API_TIMEOUT_MS = 30_000;
export const PREDICT_TIMEOUT_MS = 45_000;

// El backend no aplica AI_MIN_CONFIDENCE: el cliente decide qué guardar.
export const MIN_CONFIDENCE_TO_SAVE = 0.5;
export const MIN_CONFIDENCE_WARNING = 0.45;

export const CAMERA_PICTURE_QUALITY = 0.45;
export const DEFAULT_LANGUAGE = 'es-AR';

export const SECURE_TOKEN_KEY = 'sl_token';
export const SECURE_USER_KEY = 'sl_user';

export const STORAGE_KEYS = {
  language: 'sl_language',
  speechRate: 'sl_speech_rate',
  autosave: 'sl_autosave',
  autoSpeak: 'sl_auto_speak',
  themeMode: 'sl_theme_mode',
} as const;

export const LANGUAGES = [
  { value: 'es-AR', label: 'Español (Argentina)' },
  { value: 'es-MX', label: 'Español (México)' },
  { value: 'es', label: 'Español (general)' },
] as const;

export const APP_INFO = {
  name: 'Traductor LSA',
  version: '1.0.0',
  description:
    'Traducción de Lengua de Señas Argentina a texto y voz con un modelo de Machine Learning.',
} as const;
