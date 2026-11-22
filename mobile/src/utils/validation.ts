export interface FieldErrors {
  nombre?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateName(nombre: string): string | undefined {
  const value = nombre.trim();
  if (!value) return 'Ingresá tu nombre.';
  if (value.length < 3) return 'El nombre debe tener al menos 3 caracteres.';
  if (value.length > 100) return 'El nombre no puede superar los 100 caracteres.';
  return undefined;
}

export function validateEmail(email: string): string | undefined {
  const value = normalizeEmail(email);
  if (!value) return 'Ingresá tu email.';
  if (!EMAIL_PATTERN.test(value)) return 'Ingresá un email válido.';
  return undefined;
}

export function validatePassword(password: string): string | undefined {
  if (!password) return 'Ingresá tu contraseña.';
  if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
  if (password.length > 128) return 'La contraseña no puede superar los 128 caracteres.';
  return undefined;
}

export function validateLoginForm(email: string, password: string): FieldErrors {
  return {
    email: validateEmail(email),
    password: password ? undefined : 'Ingresá tu contraseña.',
  };
}

export function validateRegisterForm(
  nombre: string,
  email: string,
  password: string,
  confirm: string
): FieldErrors {
  return {
    nombre: validateName(nombre),
    email: validateEmail(email),
    password: validatePassword(password),
    confirm:
      password !== confirm
        ? 'Las contraseñas no coinciden.'
        : confirm
          ? undefined
          : 'Repetí la contraseña.',
  };
}

export function validateForgotPasswordForm(email: string): FieldErrors {
  return { email: validateEmail(email) };
}

export function validateResetPasswordForm(
  token: string,
  password: string,
  confirm: string
): FieldErrors & { token?: string } {
  return {
    token: token.trim().length < 20 ? 'Ingresá el código de recuperación.' : undefined,
    password: validatePassword(password),
    confirm:
      password !== confirm
        ? 'Las contraseñas no coinciden.'
        : confirm
          ? undefined
          : 'Repetí la contraseña.',
  };
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}
