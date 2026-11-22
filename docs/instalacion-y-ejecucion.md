# Instalación y ejecución

> Guía para levantar el backend, la base de datos y el **cliente web principal**
> desde cero en Windows, macOS o Linux. La app móvil es opcional. Los comandos de
> Windows usan PowerShell.

---

## 1. Requisitos

| Herramienta | Versión recomendada | Verificación |
|---|---|---|
| Python | 3.11, 3.12 o 3.13 | `python --version` |
| pip | Incluido con Python | `python -m pip --version` |
| Node.js | 20 o superior | `node --version` |
| npm | 10 o superior | `npm --version` |
| PostgreSQL | 14 o superior | `psql --version` |
| Docker | Opcional | `docker --version` |
| Git | Opcional | `git --version` |
| Expo Go o emulador | Opcional (solo app móvil) | `npx expo --version` |

En este proyecto se verificó con Node 24.15.0, npm 11.12.1 y Python 3.12.1.
Docker **no** está instalado en el entorno de referencia.

---

## 2. Backend

### 2.1 Crear el entorno virtual

Desde la raíz del proyecto:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Si PowerShell bloquea la activación:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.venv\Scripts\Activate.ps1
```

> **Importante:** el `.venv` que venía en el proyecto estaba roto: mezclaba
> binarios de Python 3.14 (`cp314`) con un intérprete 3.12, así que NumPy y
> scikit-learn fallaban con `ModuleNotFoundError`. Si ves ese error, renombrá el
> entorno viejo (`Rename-Item .venv .venv-roto`) y creá uno nuevo con los
> comandos de arriba. No borres el viejo hasta confirmar que el nuevo funciona.

Alternativa sin activar el entorno:

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

### 2.2 Configurar variables

```powershell
Copy-Item ..\.env.example .env
```

Editar `backend/.env`:

```ini
# PostgreSQL:
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sign_language
# Alternativa local sin PostgreSQL:
# DATABASE_URL=sqlite:///./sl_translator.db
SECRET_KEY=una-clave-larga-aleatoria
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000
AI_MODEL_PATH=
AI_MODEL_MODE=auto
AI_MIN_CONFIDENCE=0.45
TTS_LANGUAGE=es

# Entorno y herramientas internas
APP_ENV=development
DEMO_MODE=true
ADMIN_EMAILS=tu-email@example.com
```

- `APP_ENV=production` apaga los atajos de demo.
- `DEMO_MODE=false` rechaza `demo_sign` y oculta `demo_reset_token`.
- `ADMIN_EMAILS` es una lista separada por comas con acceso al grabador y al
  entrenamiento. Si queda vacía, en desarrollo entra cualquier usuario
  autenticado y en producción nadie.

El backend carga `.env` relativo al directorio desde el que se ejecuta. Si
arrancás desde `backend/`, el archivo correcto es `backend/.env`.

### 2.3 Base de datos

#### Opción A: PostgreSQL

```powershell
psql -U postgres -c "CREATE DATABASE sign_language;"
psql -U postgres -d sign_language -f ..\database\schema.sql
psql -U postgres -d sign_language -f ..\database\seed.sql
```

Si `psql` no está en el PATH, usá la ruta completa de instalación o abrí
pgAdmin y ejecutá los scripts desde ahí.

#### Opción B: SQLite (rápida, para desarrollo)

En `backend/.env`:

```ini
DATABASE_URL=sqlite:///./sl_translator.db
```

O solo para la sesión actual:

```powershell
$env:DATABASE_URL = "sqlite:///./sl_translator.db"
```

Con SQLite no hace falta crear la base: `create_all` crea las tablas. El
catálogo `/api/signs` devuelve las señas de la base (86 con el seed) o las 9
demo si está vacía, e incluye `recognized` para indicar cuáles reconoce el
modelo activo.

#### Opción C: Docker

```powershell
docker compose up -d db
```

Esto monta `database/schema.sql` y `database/seed.sql` en el contenedor de
PostgreSQL. No se verificó en el entorno de referencia.

### 2.4 Arrancar el backend

```powershell
cd backend
.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

Para acceder desde un teléfono físico:

```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Comprobaciones:

```powershell
Invoke-RestMethod http://localhost:8000/api/health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "ai_model": "demo",
  "database": "connected"
}
```

- Swagger: <http://localhost:8000/docs>
- ReDoc: <http://localhost:8000/redoc>
- OpenAPI: <http://localhost:8000/openapi.json>

La primera llamada al modelo puede demorar porque entrena el demo y lo guarda en
`backend/app/ai/models/demo_sign_model.pkl`.

---

## 3. Cliente web (principal)

### 3.1 Instalar y arrancar

```powershell
cd frontend
npm install
npm run dev
```

Abrir <http://localhost:5173>. Vite redirige `/api` a `http://localhost:8000`.

- La web ejecuta **MediaPipe en el navegador**: no necesita `mediapipe` en el
  backend ni `requirements-optional.txt`.
- Es responsive y funciona en computadora y en celular.
- El grabador interno queda en <http://localhost:5173/recorder.html>. Requiere
  una cuenta incluida en `ADMIN_EMAILS` (o cualquier cuenta en desarrollo si la
  lista está vacía).

### 3.2 Probar desde un teléfono en la misma red

1. Arrancar el backend escuchando en todas las interfaces:

   ```powershell
   cd backend
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

2. Arrancar Vite aceptando conexiones externas:

   ```powershell
   cd frontend
   npm run dev -- --host
   ```

3. Abrir `http://IP-LAN-DE-LA-PC:5173` en el navegador del teléfono.
4. Permitir el uso de la cámara. En algunos navegadores móviles la cámara solo
   funciona sobre HTTPS o `localhost`; si no aparece, probar con Chrome o servir
   la build con HTTPS.

### 3.3 Verificar el flujo

1. Registrarse o iniciar sesión.
2. En **Traductor**, permitir la cámara y presionar **📷 Iniciar traducción** →
   **▶ Traducir**.
3. Comprobar el panel de resultado, el botón de voz y el **Historial**.
4. Para probar sin cámara, usar **Probar sin cámara (demo)**.

Si el encuadre se ve negro, revisar **Fuente de video**: Chrome puede estar
usando la cámara IR de Windows Hello.

---

## 4. App móvil (opcional)

> La app Expo/React Native se conserva como cliente experimental. No es
> necesaria para usar el sistema: la web ya funciona en celular. Su camino de
> cámara envía una foto al backend y requiere `mediapipe` instalado en el
> servidor (`backend/requirements-optional.txt`).

### 4.1 Instalar dependencias

```powershell
cd mobile
npm install
```

### 4.2 Configurar la URL del backend

```powershell
Copy-Item .env.example .env
```

Editar `mobile/.env`:

```ini
EXPO_PUBLIC_API_URL=http://192.168.1.50:8000/api
```

Casos:

| Escenario | URL |
|---|---|
| Emulador Android | `http://10.0.2.2:8000/api` |
| Emulador iOS | `http://localhost:8000/api` |
| Teléfono físico en la misma red | `http://IP-LAN-DE-LA-PC:8000/api` |
| Producción | `https://api.tudominio.com/api` |

Si `EXPO_PUBLIC_API_URL` está vacía, la app intenta inferir la IP del host de
Expo (`Constants.expoConfig.hostUri`) y usa el puerto 8000. Si no puede, usa
`http://10.0.2.2:8000/api`.

### 4.3 Arrancar Expo

```powershell
npm start
```

Opciones: `a` (Android), `i` (iOS, requiere macOS), `w` (web limitada) o escanear
el QR con **Expo Go**. Si Expo Go no es compatible con SDK 58, crear un
development build con `npx expo run:android`.

### 4.4 Verificar la conexión

1. Iniciar sesión o registrarse.
2. En **Inicio**, comprobar que aparecen las señas y el modelo activo.
3. En **Traductor**, probar el modo demostración.
4. Si se usa la cámara, instalar primero las dependencias opcionales del backend:

   ```powershell
   cd backend
   pip install -r requirements-optional.txt
   ```

Si la app no conecta: verificar `--host 0.0.0.0`, la IP, el firewall de Windows y
que el teléfono y la PC estén en la misma red.

---

## 5. Docker Compose

```powershell
docker compose up --build
```

Servicios:

- PostgreSQL en `localhost:5432`.
- Backend en <http://localhost:8000>.
- Frontend web en <http://localhost>.

La app móvil opcional **no** se levanta con Docker: se ejecuta con Expo y se
conecta al backend publicado en el puerto 8000.

Riesgos conocidos de esta configuración:

- No se ejecutó en el entorno de referencia (Docker ausente).
- El `Dockerfile` del backend instala solo `requirements.txt`; la ruta
  `image_base64` seguirá sin `mediapipe`.
- El frontend usa `npm install` en lugar de `npm ci`.
- No hay `.dockerignore`, por lo que el contexto de build puede ser grande.

---

## 6. Pruebas

### Backend

```powershell
cd backend
.venv\Scripts\Activate.ps1
pytest -q
```

Resultado esperado: **42 passed**. Usa SQLite y no requiere PostgreSQL.

### Web (principal)

```powershell
cd frontend
npm test -- --run
npm run build
```

Resultado esperado: **15 passed** en 5 archivos y build correcto (genera
`index.html` y `recorder.html`).

### App móvil (opcional)

```powershell
cd mobile
npm run typecheck
npm test -- --runInBand
```

Resultado esperado: typecheck limpio y **24 passed** en 7 suites.

Detalle de pruebas y errores: [`pruebas-y-errores.md`](pruebas-y-errores.md).

---

## 7. Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `No module named app` | Se ejecutó `uvicorn` fuera de `backend/` | `cd backend` antes de arrancar |
| `ModuleNotFoundError: mediapipe` al usar cámara | Falta la dependencia opcional | `pip install mediapipe` en el venv del backend, o usar modo demo |
| `503` en `/api/ai/predict` con `image_base64` | MediaPipe no instalado o no detectó manos | Instalar MediaPipe; mejorar luz y encuadre |
| `500` en `/api/signs` | Versión anterior con fallback defectuoso | Actualizar el backend; el fallback ahora usa `SignOut` |
| `401` al iniciar sesión | Se envió JSON en vez de formulario | Usar `application/x-www-form-urlencoded` |
| `errno 111` o `connection refused` desde el teléfono | Backend escucha solo en `127.0.0.1` | Arrancar con `--host 0.0.0.0` |
| La app no conecta en emulador Android | `localhost` apunta al emulador | Usar `10.0.2.2` |
| `The path argument must be of type string. Received null` en Jest | Bug de jest-expo en esta ruta de Windows | Mantener los mocks de `jest.setup.ts` |
| `Cannot find module 'expo-constants'` en pruebas | Resolución nativa de Expo | Ya está mockeado en `jest.setup.ts` |
| `toHaveStyle` no aplica | RNTL no aplica estilos como DOM | Usar `toHaveStyle` con estilos resueltos o probar props |
| `HTMLMediaElement.prototype.play` en Vitest | jsdom no implementa video | Es un aviso no fatal de la web |
| `403` en `/api/ai/dataset`, `/samples` o `/train` | La cuenta no está en `ADMIN_EMAILS` | Agregar el email en el backend o usar una cuenta admin |
| La cámara no abre en el celular | El navegador exige HTTPS fuera de `localhost` | Servir la web con HTTPS o probar en `localhost` |
| SecureStore no disponible en web | Limitación de la plataforma | La app usa AsyncStorage como fallback |

---

## 8. Comandos útiles

| Objetivo | Comando |
|---|---|
| Ver salud del backend | `Invoke-RestMethod http://localhost:8000/api/health` |
| Ver Swagger | Abrir `http://localhost:8000/docs` |
| Ver IP LAN | `ipconfig` |
| Ver puertos en uso | `Get-NetTCPConnection -LocalPort 8000` |
| Detener un proceso en 8000 | `Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess` |
| Limpiar caché de Expo | `npx expo start -c` |
| Exportar bundle Android | `npx expo export --platform android` |
| Ver versión de Expo | `npx expo --version` |

> El comando para detener el proceso es destructivo para ese proceso. Verificá
> que sea el backend y no otra aplicación antes de ejecutarlo.
