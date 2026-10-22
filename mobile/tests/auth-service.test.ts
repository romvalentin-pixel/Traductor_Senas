import { http } from '../src/services/http';
import { login, me, register } from '../src/services/auth';

jest.mock('../src/services/http', () => ({
  http: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockedHttp = http as unknown as {
  get: jest.Mock;
  post: jest.Mock;
};

describe('servicio de autenticación', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('envía el login como formulario OAuth2 codificado', async () => {
    mockedHttp.post.mockResolvedValue({ access_token: 'token' });

    await login('  Persona@Ejemplo.com ', 'clave con espacios');

    expect(mockedHttp.post).toHaveBeenCalledWith(
      '/auth/login',
      'username=persona%40ejemplo.com&password=clave%20con%20espacios',
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
  });

  it('normaliza el email y recorta el nombre al registrarse', async () => {
    mockedHttp.post.mockResolvedValue({ id: 1 });

    await register({
      nombre: '  Ana Pérez  ',
      email: '  ANA@EJEMPLO.COM ',
      password: 'secreto1',
    });

    expect(mockedHttp.post).toHaveBeenCalledWith('/auth/register', {
      nombre: 'Ana Pérez',
      email: 'ana@ejemplo.com',
      password: 'secreto1',
    });
  });

  it('consulta el usuario autenticado', async () => {
    mockedHttp.get.mockResolvedValue({ id: 1, email: 'ana@ejemplo.com' });

    await me();

    expect(mockedHttp.get).toHaveBeenCalledWith('/auth/me');
  });
});
