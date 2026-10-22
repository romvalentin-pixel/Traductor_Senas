import type { AuthResponse, RegisterInput, User } from '../types/api';
import { normalizeEmail } from '../utils/validation';
import { http } from './http';

export async function register(payload: RegisterInput): Promise<User> {
  return http.post<User>('/auth/register', {
    nombre: payload.nombre.trim(),
    email: normalizeEmail(payload.email),
    password: payload.password,
  });
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  // El backend usa OAuth2 Password Flow: form-urlencoded, no JSON.
  const body = `username=${encodeURIComponent(normalizeEmail(email))}&password=${encodeURIComponent(
    password
  )}`;
  return http.post<AuthResponse>('/auth/login', body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
}

export async function me(): Promise<User> {
  return http.get<User>('/auth/me');
}

export async function forgotPassword(email: string): Promise<import('../types/api').ForgotPasswordResponse> {
  return http.post('/auth/forgot-password', { email: normalizeEmail(email) });
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<import('../types/api').ResetPasswordResponse> {
  return http.post('/auth/reset-password', {
    token: token.trim(),
    new_password: newPassword,
  });
}
