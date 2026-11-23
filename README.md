# Traductor de Lenguaje de Señas a Texto y Voz

Sistema académico y funcional para traducir **Lengua de Señas Argentina (LSA)**
a **texto y voz**. El cliente principal es la **aplicación web** (React + Vite),
que corre MediaPipe en el navegador y funciona tanto en computadora como en
celular. La app móvil Expo/React Native se conserva como cliente **opcional y
experimental**.

Repositorio: <https://github.com/romvalentin-pixel/Traductor_Senas>.
El historial incluye commits reconstruidos por áreas; sus fechas anteriores son
aproximadas y no representan necesariamente versiones históricas exactas.

### Integrantes

- Romano Jesús Valentín
- Salomón Riveras José Alejandro
- Varela Miguel Marcelo

> **Alcance real:** el reconocimiento incluido es un **modo demostración** con
> plantillas sintéticas de 9 señas. No debe presentarse como un modelo entrenado
> con LSA real. El flujo (login, traducción, historial) está implementado y
> cubierto por pruebas; la cámara requiere un dispositivo con permisos.

---

## 1. Estado del proyecto

| Componente | Estado | Verificación |
|---|---|---|
| Backend FastAPI | Funcional | `pytest`: **42 pruebas aprobadas** |
| Web (React + Vite) | Funcional | `vitest`: **19 pruebas** + `vite build` |
| App móvil Expo (opcional) | Experimental | `typecheck` sin errores; **24 pruebas** en 7 suites |
| Modelo de IA | Modo demo | 9 señas sintéticas; no hay dataset real incluido |
| Catálogo | 86 señas | El modelo solo reconoce las 9 entrenadas (marcadas en la UI) |
| Cámara en teléfono físico | No verificada en este entorno | Requiere dispositivo/emulador |
| Ruta `image_base64` | Opcional, no operativa por defecto | Requiere `mediapipe` en el backend |
| Docker Compose | Configurado, no verificado | Docker no está instalado en este entorno |
| PostgreSQL real | No verificado en esta máquina | Las pruebas usan SQLite |

Detalle de la limpieza y los límites:
[`docs/analisis-limpieza-y-mejoras.md`](docs/analisis-limpieza-y-mejoras.md).

---

## 2. Qué hace el sistema

1. El usuario se registra o inicia sesión.
2. Abre el Traductor y permite el acceso a la cámara, o elige una seña de
   demostración para probar sin cámara.
3. La web detecta la mano con MediaPipe **en el navegador** y envía los 21
   landmarks al backend, que clasifica la seña y devuelve `sign`,
   `translated_text` y `confidence`.
4. La web muestra el resultado, permite escucharlo con la voz del navegador y
   guardarlo en el historial.
5. El historial se consulta, se reproduce y se puede eliminar.

### Cómo traduce cada cliente

| Cliente | Qué envía | Requisito | Estado |
|---|---|---|---|
| **Web (principal)** | `landmarks` 21×3 por frame | Navegador con cámara; MediaPipe corre en el cliente | Verificado en desarrollo |
| **App móvil (opcional)** | `image_base64` de una foto | `expo-camera` + `mediapipe` en el backend | Implementado; no verificado |
| **Demo (sin cámara)** | `demo_sign` | Backend y sesión | Verificado |

La web ejecuta MediaPipe **en el navegador** y manda solo los landmarks: es el
camino que funciona hoy y el que se usa en computadora y celular. La app móvil no
puede ejecutar esa biblioteca dentro de React Native, así que manda una foto; si
`mediapipe` no está instalado, el backend responde `503` y la app lo explica.

---

## 3. Arquitectura

```text
Web (React + Vite)  ← cliente principal, corre en PC y celular
  Login / Registro
  Traductor (MediaPipe en el navegador)
  Historial
  Configuración (tema, voz, idioma, autoguardado)
  /recorder.html  ← herramienta interna de grabación (sin menú público)
        |
        | HTTPS/HTTP + JWT (JSON; login form-urlencoded)
        v
Backend FastAPI
  /api/auth/*        registro, login, usuario actual
  /api/ai/*          predicción, dataset y entrenamiento
  /api/translation/* historial y TTS
  /api/signs         catálogo (con fallback demo)
        |
        +--> PostgreSQL / SQLite (SQLAlchemy 2)
        |
        +--> Modelo IA (RandomForest demo o .pkl entrenado)
```

La app móvil (`mobile/`) consume la misma API como cliente opcional. No se
eliminó para no romper el trabajo de React Native ni sus pruebas.

La web incluye una **herramienta interna de grabación** (`/recorder.html`) que
captura 21 landmarks por frame con MediaPipe en el navegador y guarda las
muestras para entrenar el modelo real. Es una página aparte, con login propio,
sin enlace en el menú y protegida por el permiso de administrador. Al guardar una
seña, queda registrada sola en el catálogo y aparece en la app (ver
[`docs/como-agregar-mas-senas.md`](docs/como-agregar-mas-senas.md)).

Documentación técnica completa:
[`docs/architecture.md`](docs/architecture.md).

---

## 4. Estructura del repositorio

```text
.
├── frontend/               Cliente web principal (React + Vite)
│   ├── src/
│   │   ├── components/     Componentes reutilizables
│   │   ├── context/        Sesión y preferencias
│   │   ├── hooks/          Cámara, MediaPipe, voz
│   │   ├── pages/          Inicio, Traductor, Historial, Configuración
│   │   ├── recorder/       Herramienta interna (/recorder.html)
│   │   ├── services/       HTTP, auth, IA, traducciones
│   │   └── styles/         CSS global y temas
│   ├── recorder.html       Entrada separada del grabador
│   └── vite.config.js      Build multi-página
├── backend/                FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── api/            Rutas y dependencias
│   │   ├── ai/             Landmarks, plantillas demo y clasificador
│   │   ├── core/           Configuración y seguridad
│   │   ├── models/         users, translations, signs
│   │   ├── schemas/        Pydantic
│   │   └── services/       Auth, IA, dataset, traducciones, TTS, imagen
│   └── tests/              42 pruebas pytest
├── mobile/                 App Expo opcional / experimental
├── ai/                     Pipeline de captura/entrenamiento
├── database/               schema.sql + seed.sql
├── docs/                   Documentación (ver docs/README.md)
├── docker-compose.yml      PostgreSQL + backend + frontend web
└── README.md
```

---

## 5. Requisitos

- **Node.js 20+** (probado con Node 24) y npm.
- **Python 3.11–3.13** (probado con 3.12).
- **PostgreSQL 14+** o SQLite para pruebas.
- Un navegador actualizado con cámara para el modo en vivo.
- Docker solo si se usa `docker-compose.yml` (no es obligatorio).

Para la **app móvil opcional** hacen falta además **Expo Go** (o un
emulador/dispositivo) y, si se usa su modo cámara, `mediapipe` en el backend
(`backend/requirements-optional.txt`). La app usa **Expo SDK 58**, React Native
0.88, React 19 y TypeScript 6.

El backend usa FastAPI, SQLAlchemy 2, Pydantic 2 y scikit-learn. OpenCV y
MediaPipe son dependencias **opcionales** para procesar `image_base64`.

---

## 6. Inicio rápido

> El cliente principal es la **web**. La app móvil es opcional; para la mayoría
> de las pruebas alcanza con backend + web.

### 6.1 Backend

Desde la raíz del proyecto:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item ..\.env.example .env   # ajustar DATABASE_URL y SECRET_KEY
uvicorn app.main:app --reload --port 8000
```

Comprobaciones:

- Swagger: <http://localhost:8000/docs>
- Salud: <http://localhost:8000/api/health>
- Si no hay PostgreSQL, usar SQLite antes de arrancar:

```powershell
$env:DATABASE_URL = "sqlite:///./sl_translator.db"
uvicorn app.main:app --reload --port 8000
```

El backend crea las tablas al iniciar y entrena el modelo demo la primera vez.
El catálogo `/api/signs` devuelve las señas de la base (86 en el seed) o las 9
demo si la base está vacía, e indica con `recognized` cuáles puede reconocer el
modelo activo.

### 6.2 Cliente web (principal)

```powershell
cd frontend
npm install
npm run dev
```

Abrir <http://localhost:5173>. Vite redirige `/api` al backend local.
El grabador interno queda en <http://localhost:5173/recorder.html>.

### 6.3 App móvil (opcional)

```powershell
cd mobile
npm install
Copy-Item .env.example .env
npm start
```

Luego elegir `a` (Android), `i` (iOS en macOS) o escanear el QR con Expo Go.
La URL del backend se configura en `mobile/.env`:

```ini
EXPO_PUBLIC_API_URL=http://192.168.1.50:8000/api
```

- **Emulador Android:** `http://10.0.2.2:8000/api`.
- **Teléfono físico:** usar la IP LAN de la computadora y el mismo Wi-Fi.
- **Sin variable:** la app intenta inferir el host de Expo y usar el puerto
  8000; si no puede, usa `10.0.2.2`.

### 6.4 PostgreSQL manual

```powershell
psql -U postgres -c "CREATE DATABASE sign_language;"
psql -U postgres -d sign_language -f database\schema.sql
psql -U postgres -d sign_language -f database\seed.sql
```

Guía ampliada, con problemas frecuentes:
[`docs/instalacion-y-ejecucion.md`](docs/instalacion-y-ejecucion.md).

---

## 7. Variables de entorno

### Backend (`backend/.env`)

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `DATABASE_URL` | Conexión SQLAlchemy | `postgresql://postgres:postgres@localhost:5432/sign_language` |
| `SECRET_KEY` | Firma de JWT | valor inseguro de ejemplo |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Expiración del token | `60` |
| `CORS_ORIGINS` | Orígenes web permitidos, separados por coma | `localhost:5173`, etc. |
| `AI_MODEL_PATH` | Ruta a un `.pkl` entrenado | vacío (usa `ai/models/sign_model.pkl` si existe) |
| `AI_MODEL_MODE` | `auto`, `demo` o `trained` | `auto` |
| `AI_MIN_CONFIDENCE` | Umbral informado por `/api/ai/info` | `0.45`; **el backend no filtra predicciones** |
| `TTS_LANGUAGE` | Idioma de gTTS | `es` |
| `APP_ENV` | `development` o `production` | `development` |
| `DEMO_MODE` | Habilita `demo_sign` y el token de recuperación visible | `true` |
| `ADMIN_EMAILS` | Emails con acceso al grabador y al entrenamiento, separados por coma | vacío (en desarrollo: cualquier usuario; en producción: nadie) |

### App móvil (`mobile/.env`)

| Variable | Descripción |
|---|---|
| `EXPO_PUBLIC_API_URL` | URL completa del backend, incluyendo `/api` |

### Cliente web (`frontend/.env`)

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL de la API; por defecto `/api` con proxy de Vite |

---

## 8. API resumida

Todas las rutas usan el prefijo `/api`. Los endpoints privados requieren
`Authorization: Bearer <JWT>`.

| Método | Ruta | Auth | Uso |
|---|---|---|---|
| GET | `/health` | No | Estado del backend y la base |
| POST | `/auth/register` | No | Crear usuario |
| POST | `/auth/login` | No | Login OAuth2 form-urlencoded |
| GET | `/auth/me` | Sí | Usuario actual (`is_admin`) |
| POST | `/auth/forgot-password` | No | Generar código de recuperación |
| POST | `/auth/reset-password` | No | Cambiar contraseña con código |
| POST | `/ai/predict` | Sí | Clasificar `demo_sign`, `landmarks` o `image_base64` |
| GET | `/ai/info` | No | Modelo, clases, features y umbral informado |
| GET | `/ai/dataset` | Admin | Muestras capturadas por seña |
| POST | `/ai/samples` | Admin | Guardar landmarks de una seña |
| POST | `/ai/train` | Admin | Entrenar con las muestras guardadas |
| GET | `/signs` | Sí | Catálogo con `display_name` y `recognized`; fallback demo si la BD está vacía |
| POST | `/translation` | Sí | Guardar traducción |
| GET | `/translation/history` | Sí | Historial (`limit` 1–200) |
| GET | `/translation/{id}` | Sí | Traducción propia |
| DELETE | `/translation/{id}` | Sí | Eliminar propia |
| GET | `/translation/{id}/speak` | Sí | Audio MP3 con gTTS |

Contrato detallado, ejemplos y errores:
[`docs/api.md`](docs/api.md).

### Ejemplo rápido con PowerShell

```powershell
$body = '{"nombre":"Ana","email":"ana@demo.com","password":"clave123"}'
Invoke-RestMethod -Method Post -Uri http://localhost:8000/api/auth/register `
  -ContentType 'application/json' -Body $body

$login = Invoke-RestMethod -Method Post -Uri http://localhost:8000/api/auth/login `
  -Body @{ username = 'ana@demo.com'; password = 'clave123' }
$headers = @{ Authorization = "Bearer $($login.access_token)" }

Invoke-RestMethod -Method Post -Uri http://localhost:8000/api/ai/predict `
  -Headers $headers -ContentType 'application/json' `
  -Body (@{ demo_sign = 'HOLA'; language = 'es-AR' } | ConvertTo-Json)
```

---

## 9. Pruebas

### Backend

```powershell
cd backend
.venv\Scripts\Activate.ps1
pytest -q
```

Resultado actual: **42 passed** (auth, IA, dataset/captura, permisos,
traducciones y catálogo). Usa SQLite por medio de `backend/tests/conftest.py`;
no requiere PostgreSQL.

### Web (principal)

```powershell
cd frontend
npm test -- --run
```

Resultado actual: **19 pruebas aprobadas en 6 archivos** y `npm run build` OK.
Emite un aviso no fatal de jsdom por `HTMLMediaElement.play`; no afecta el
resultado.

### App móvil (opcional)

```powershell
cd mobile
npm run typecheck
npm test -- --runInBand
```

Resultado actual: **typecheck limpio** y **24 pruebas aprobadas en 7 suites**.
Las pruebas cubren validación, formato, errores, servicio de auth, tema,
`TextField` y `SignResultCard`.

Más detalles y errores conocidos:
[`docs/pruebas-y-errores.md`](docs/pruebas-y-errores.md).

---

## 10. Modelo de IA y límites

- El contrato de entrada es **21 landmarks × 3 coordenadas = 63 features por
  mano**. Si llegan dos manos, el backend elige la más prominente; no usa 126
  features.
- `normalize_hand()` centra en la muñeca y escala por el máximo absoluto. Es
  invariante a posición y escala, **no a rotación**.
- El modo demo entrena un `RandomForestClassifier` con 150 muestras ruidosas y
  8 copias exactas por cada una de las 9 clases.
- `AI_MODEL_MODE` **sí** selecciona el modelo: `demo` fuerza el clasificador
  sintético, `trained` exige un `.pkl` entrenado y `auto` usa el entrenado si
  existe o cae al demo.
- `AI_MIN_CONFIDENCE` se informa en `/api/ai/info`, pero **no se aplica en el
  servidor**. La web usa `0.5` para autoguardar y `0.45` para advertir.
- Un modelo entrenado con LSA real se genera grabando muestras en la herramienta
  interna **Grabador de señas** (`/recorder.html`) y entrenando con
  `POST /api/ai/train` o `python ai\training\train_model.py`. El backend lo toma
  en modo `auto` desde `ai/models/sign_model.pkl`; no hay dataset real incluido.

Pipeline y uso: [`ai/README.md`](ai/README.md).

---

## 11. Seguridad

- Contraseñas con **BCrypt** y JWT HS256.
- Endpoints privados protegidos con `OAuth2PasswordBearer`.
- Grabador y entrenamiento protegidos por `ADMIN_EMAILS` (`is_admin` en
  `/auth/me`). Sin lista configurada, solo se abren en desarrollo.
- El token de recuperación **no se devuelve** en la respuesta si
  `DEMO_MODE=false` o `APP_ENV=production`.
- Validación de entrada con Pydantic y validación de formularios en la web.
- En web, el JWT se guarda en `localStorage` (riesgo de XSS: no cargar scripts
  de terceros). En móvil se usa `expo-secure-store`.
- La app **no guarda fotos** en el dispositivo; la imagen se envía al backend
  para el análisis y no se persiste en la base.
- No se registran tokens ni contraseñas en logs.
- `SECRET_KEY` de ejemplo debe cambiarse en cualquier despliegue.
- En producción: usar HTTPS, restringir CORS y no exponer `/api/ai/info` si no
  corresponde.

---

## 12. Limitaciones conocidas

1. El modelo demo no reconoce LSA real; solo valida el flujo técnico.
2. El catálogo tiene 86 señas pero el modelo solo reconoce 9: la web marca las
   pendientes en amarillo.
3. La clasificación usa **un cuadro y una mano** (la más prominente): no modela
   movimiento, secuencias temporales ni dos manos.
4. La app móvil captura **una foto**, no video en tiempo real. Su ruta
   `image_base64` requiere `mediapipe` del lado del servidor; no está en
   `requirements.txt` y devuelve `503` sin él (ver `requirements-optional.txt`).
5. `AI_MODEL_MODE=trained` falla si no existe un `.pkl` entrenado; no hay dataset
   real incluido.
6. `AI_MIN_CONFIDENCE` no se aplica en el backend.
7. No hay migraciones Alembic; se usa `create_all` o `schema.sql`.
8. No se verificaron cámara, TTS ni export nativo en un dispositivo físico.
9. Docker Compose no se ejecutó en este entorno.
10. El entrenamiento corre dentro del request (`/api/ai/train`) y bloquea al
    worker mientras dura.

---

## 13. Documentación

- [Índice de documentación](docs/README.md)
- [Instalación y ejecución](docs/instalacion-y-ejecucion.md)
- [Guía de uso](docs/guia-de-uso.md)
- [Arquitectura](docs/architecture.md)
- [API REST](docs/api.md)
- [Base de datos](docs/database.md)
- [Cómo agregar o cargar más señas](docs/como-agregar-mas-senas.md)
- [Pruebas y errores](docs/pruebas-y-errores.md)
- [Bitácora del proyecto](docs/bitacora.md)
- [Análisis de limpieza y mejoras](docs/analisis-limpieza-y-mejoras.md)
- [Referencia LSA64](docs/lsa64-referencia.md)
- [App móvil (opcional)](mobile/README.md)
- [Pipeline de IA](ai/README.md)
- [Cambios del proyecto](CHANGELOG.md)

Los documentos históricos (auditoría, plan de migración, guía de GitHub y
cambios del grabador) quedaron archivados en [`docs/archivo/`](docs/archivo/).
La bitácora original, escrita mientras el proyecto se construía desde cero,
está en [`docs/archivo/bitacora-v1-original.md`](docs/archivo/bitacora-v1-original.md).

---

## 14. Versiones del repositorio

El proyecto se versionó con Git el **2026-11-15**. El historial reconstruido
tiene ocho etapas, desde `v0.1.0` (diseño inicial) hasta `v1.0.0` (estado actual
verificado):

```powershell
git log --oneline --decorate --graph
git tag -n
```

Las fechas de estas etapas son aproximadas y no representan instantáneas
históricas exactas. El repositorio también conserva el historial anterior de
GitHub y los cambios posteriores a la reconstrucción.

---

## Licencia y uso educativo

Proyecto con fines **educativos y de demostración**. El modelo incluido usa
plantillas sintéticas; la precisión real requiere entrenar con un dataset de LSA
y validar con personas usuarias de la lengua.
