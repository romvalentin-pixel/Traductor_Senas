import {
  hasErrors,
  normalizeEmail,
  validateEmail,
  validateLoginForm,
  validateName,
  validatePassword,
  validateRegisterForm,
} from '../src/utils/validation';

describe('validación de formularios', () => {
  it('normaliza el email quitando espacios y pasando a minúsculas', () => {
    expect(normalizeEmail('  Usuario@Ejemplo.COM ')).toBe('usuario@ejemplo.com');
  });

  it('acepta emails válidos y rechaza inválidos', () => {
    expect(validateEmail('persona@dominio.com')).toBeUndefined();
    expect(validateEmail('sin-arroba.com')).toBe('Ingresá un email válido.');
    expect(validateEmail('')).toBe('Ingresá tu email.');
  });

  it('valida el largo mínimo del nombre y la contraseña', () => {
    expect(validateName('  Ana ')).toBeUndefined();
    expect(validateName('Al')).toBe('El nombre debe tener al menos 3 caracteres.');
    expect(validatePassword('123456')).toBeUndefined();
    expect(validatePassword('123')).toBe(
      'La contraseña debe tener al menos 6 caracteres.'
    );
  });

  it('detecta contraseñas que no coinciden', () => {
    const errors = validateRegisterForm(
      'Ana Pérez',
      'ana@ejemplo.com',
      'secreto1',
      'secreto2'
    );
    expect(errors.confirm).toBe('Las contraseñas no coinciden.');
    expect(hasErrors(errors)).toBe(true);
  });

  it('marca un login vacío como inválido', () => {
    const errors = validateLoginForm('', '');
    expect(errors.email).toBe('Ingresá tu email.');
    expect(errors.password).toBe('Ingresá tu contraseña.');
    expect(hasErrors(errors)).toBe(true);
  });

  it('considera válido un registro completo', () => {
    const errors = validateRegisterForm(
      'Ana Pérez',
      'ana@ejemplo.com',
      'secreto1',
      'secreto1'
    );
    expect(hasErrors(errors)).toBe(false);
  });
});
