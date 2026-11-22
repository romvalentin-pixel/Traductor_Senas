export interface User {
  id: number;
  nombre: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterInput {
  nombre: string;
  email: string;
  password: string;
}

export interface ForgotPasswordResponse {
  message: string;
  demo_reset_token?: string | null;
  expires_in_minutes?: number | null;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface Sign {
  id: number;
  name: string;
  description: string | null;
  language: string;
  created_at: string;
}

export interface PredictionRequest {
  landmarks?: number[][][];
  image_base64?: string;
  demo_sign?: string;
  language?: string;
}

export interface Prediction {
  sign: string;
  translated_text: string;
  confidence: number;
  model: string;
  processing_time_ms?: number;
}

export interface Translation {
  id: number;
  user_id: number;
  sign_detected: string;
  translated_text: string;
  confidence: number;
  language: string;
  created_at: string;
}

export interface CreateTranslationInput {
  sign_detected: string;
  translated_text: string;
  confidence: number;
  language: string;
}

export interface HealthResponse {
  status: string;
  ai_model: string;
  database: string;
}

export interface AIInfo {
  model: string;
  signs: string[];
  features: number;
  min_confidence: number;
}
