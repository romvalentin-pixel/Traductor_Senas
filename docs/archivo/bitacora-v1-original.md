> **Documento histórico — versión 1.0 (2026-10-22).**
>
> Esta es la bitácora original, escrita mientras el proyecto se construía desde
> cero: entorno, base de datos, backend, IA, web, Docker y la depuración de la
> cámara hasta la etiqueta `camfix-v4`.
>
> Se conserva **sin cambios** como registro de esa etapa. Los conteos (22
> pruebas backend, 15 web), las rutas (`D:\...`) y la etiqueta `camfix-v4`
> corresponden a ese momento y ya no reflejan el estado actual. La bitácora
> vigente es [`../bitacora.md`](../bitacora.md).
>
> Archivada el 2026-11-15.

---

# Bitácora del Proyecto — Traductor de Lenguaje de Señas (LSA → Texto y Voz)

**Documento:** registro cronológico y técnico de la construcción, desde cero, del sistema.
**Versión del documento:** 1.0
**Estado del proyecto:** funcional y verificado (backend 22/22 tests, frontend 15/15 tests, build OK).
**Etiqueta de build del frontend:** `camfix-v4` (visible arriba a la derecha en la aplicación).

---

## 1. Resumen ejecutivo

Se construyó un sistema **cliente-servidor** que traduce **Lengua de Señas Argentina (LSA)** a **texto y voz**, con una arquitectura pensada para correr tanto en local como con Docker.

La detección de manos se hace **en el navegador** con **MediaPipe Hands** (landmarks), y el **reconocimiento** de la seña se hace en el **backend** con un clasificador **RandomForest**, que devuelve la seña, el texto traducido y un porcentaje de confianza. Las traducciones se persisten en **PostgreSQL** (con SQLAlchemy) y se pueden escuchar con **TTS** (Web Speech API en el cliente y `gTTS` en el servidor).

Se entregaron además: base de datos normalizada, API REST documentada, módulo de IA con pipeline de entrenamiento, interfaz React con 6 pantallas, empaquetado Docker y documentación técnica.

---

## 2. Objetivo y alcance

### 2.1 Objetivo general
Desarrollar un sistema completo que permita a una persona realizar una seña frente a la cámara y obtener su traducción en texto (y opcionalmente en voz), guardando un historial de traducciones por usuario.

### 2.2 Objetivos específicos
- Capturar y normalizar los landmarks de la mano en el navegador (sin enviar video al servidor).
- Clasificar la seña con un modelo de IA entrenable.
- Exponer una API REST segura con autenticación JWT.
- Persistir usuarios, traducciones, vocabulario y feedback.
- Ofrecer una UI usable (cámara, resultado, confianza, historial, configuración).
- Empaquetar todo para despliegue reproducible.

### 2.3 Alcance entregado
- **9 señas demo**: `HOLA`, `GRACIAS`, `SI`, `NO`, `ADIOS`, `POR_FAVOR`, `BUENOS_DIAS`, `BUENAS_TARDES`, `AYUDA`.
- Reconocimiento con modelo **demo** entrenado en caliente con plantillas sintéticas + **pipeline** para entrenar con muestras reales.
- TTS cliente (Web Speech) y servidor (`gTTS`).
- Autenticación con registro/login (OAuth2 Password Flow + JWT + BCrypt).
- Historial con borrado y feedback.

### 2.4 Fuera de alcance (por ahora)
- Dataset real de LSA a gran escala (el pipeline está listo, faltan muestras).
- Traducción de secuencias/frases continuas (hoy es seña a seña).
- Reconocimiento de lenguaje de señas de otros países (la arquitectura es parametrizable por idioma).

---

## 3. Stack tecnológico y decisiones de arquitectura

| Capa | Tecnología | Por qué se eligió |
|---|---|---|
| Frontend | React 18 + Vite 6 | Rápido, HMR, ecosistema; build liviano |
| Detección de manos | `@mediapipe/tasks-vision` (HandLandmarker) | Corre en el navegador; no se transmite video (privacidad + ancho de banda) |
| Backend | FastAPI + Uvicorn | Tipado con Pydantic, OpenAPI automático, async |
| Autenticación | OAuth2 Password Flow + JWT + BCrypt | Estándar, stateless, compatible con Swagger |
| ORM / BD | SQLAlchemy 2 + PostgreSQL 16 | Modelo relacional normalizado; SQLite solo para tests |
| IA | scikit-learn (RandomForest) + NumPy | Robusto, interpretable, entrena rápido |
| TTS | Web Speech API (cliente) / `gTTS` (servidor) | Offline en el navegador + alternativa server-side |
| Despliegue | Docker + docker-compose + Nginx | Reproducibilidad con un comando |

### Decisiones clave
- **Landmarks en el cliente**: el servidor recibe **63 números** (21 puntos × 3 coordenadas) por mano, no imágenes. Menos carga, más privacidad.
- **Normalización de landmarks**: se centra en la muñeca y se escala por el tamaño de la mano; se incluye `z_scale` para cancelar el offset absoluto de profundidad.
- **Modelo demo autocontenido**: si no hay `sign_model.pkl` real, el backend entrena un RandomForest con plantillas sintéticas al primer uso, para que el sistema funcione recién clonado.
- **Dos rutas de modelo**: `backend/app/ai/models/demo_sign_model.pkl` (demo, se genera solo) y `ai/models/sign_model.pkl` (entrenamiento real).

---

## 4. Estructura del repositorio

```
Sistema de traduccion de lenguaje de señas/
├─ README.md                     # Guía de instalación, uso y entrenamiento
├─ docker-compose.yml            # db (postgres) + backend + frontend (nginx)
├─ .env.example                  # Variables de entorno de ejemplo
├─ .gitignore
├─ docs/
│  ├─ architecture.md            # Arquitectura y flujos
│  ├─ database.md                # Modelo entidad-relación
│  ├─ api.md                     # Documentación de los 13 endpoints
│  └─ bitacora.md                # ESTE documento
├─ database/
│  ├─ schema.sql                 # DDL (users, translations, signs, feedback)
│  └─ seed.sql                   # Datos iniciales (vocabulario)
├─ backend/
│  ├─ Dockerfile
│  ├─ requirements.txt
│  ├─ pytest.ini
│  └─ app/
│     ├─ main.py                 # Bootstrap FastAPI (CORS + create_all)
│     ├─ api/                    # router + deps + routes (auth, ai, translations, health)
│     ├─ models/                 # Modelos SQLAlchemy
│     ├─ schemas/                # Esquemas Pydantic
│     ├─ services/               # Lógica de negocio (auth, traducciones, TTS)
│     ├─ core/                   # Configuración y seguridad (JWT, BCrypt)
│     ├─ database/               # Sesión y Base
│     └─ ai/                     # landmarks, demo_templates, translations, model
├─ ai/
│  ├─ training/train_demo.py     # Pipeline de entrenamiento / validación
│  └─ preprocessing/landmarks.py # Captura con cámara (OpenCV + MediaPipe)
├─ frontend/
│  ├─ Dockerfile
│  ├─ nginx.conf
│  ├─ package.json / vite.config.js
│  └─ src/
│     ├─ main.jsx / App.jsx
│     ├─ context/AppContext.jsx
│     ├─ services/ (api, auth, translation, ai)
│     ├─ hooks/ (useAuth, useCamera, useHandTracking, useSpeech)
│     ├─ components/ (Layout, CameraPanel, ResultPanel, Loader, ErrorMessage, ProtectedRoute)
│     ├─ pages/ (Home, Login, Register, Translator, History, Settings)
│     └─ styles/global.css
└─ backend/tests/ (conftest, test_auth, test_translations, test_ai)
```

---

## 5. Bitácora cronológica de desarrollo

### Fase 0 — Preparación del entorno
- Se relevó el entorno local: Python 3.14 y Node 25 disponibles.
- Se definió la raíz del proyecto en `D:\Sistema de traduccion de lenguaje de señas`.
- Se creó la estructura de carpetas y se fijaron convenciones de nombres y estilo.

### Fase 1 — Documentación y diseño (antes de codificar)
- `docs/architecture.md`: arquitectura cliente-servidor, diagramas de flujo y justificación de tecnologías.
- `docs/database.md`: modelo entidad-relación normalizado (3FN), claves, restricciones e índices.
- `docs/api.md`: contrato de los endpoints con ejemplos JSON y errores esperados.
- **Decisión**: documentar primero para evitar retrabajo en el modelo de datos y la API.

### Fase 2 — Base de datos
- `database/schema.sql` con cuatro tablas:
  - `users` (credenciales, email único, rol, timestamps).
  - `translations` (seña, texto, confianza, idioma, FK a usuario).
  - `signs` (vocabulario: nombre, descripción, idioma).
  - `translation_feedback` (valoración del usuario sobre una traducción).
- Índices en las columnas de consulta (fecha, usuario), `CHECK` de rango de confianza y `UNIQUE` donde corresponde.
- `database/seed.sql` con el vocabulario demo.

### Fase 3 — Backend / API REST
- `app/main.py`: creación de la app, CORS y `create_all` en el `lifespan`.
- Seguridad: `core/` con configuración y utilidades JWT/BCrypt; `api/deps.py` con dependencias de usuario actual.
- Rutas implementadas (13 endpoints):
  - `GET /api/health`
  - `POST /api/auth/register`, `POST /api/auth/login` (form-urlencoded), `GET /api/auth/me`
  - `POST /api/ai/predict`, `GET /api/ai/info`
  - `POST /api/translation`, `GET /api/translation/history`, `GET /api/translation/{id}`, `DELETE /api/translation/{id}`, `GET /api/translation/{id}/speak`
  - `GET /api/signs`
- Servicios: autenticación, traducciones (CRUD + orden por fecha), TTS.
- **Incidencias resueltas** (ver sección 7): doble prefijo de routers, orden del historial, validación de nombres.

### Fase 4 — Módulo de IA
- `ai/landmarks.py`: normalización (centrado en muñeca + escalado) y armado del vector de 63 features.
- `ai/demo_templates.py`: generación geométrica de 9 señas demo con parámetros de "curls", pulgar, apertura y `z_scale`.
- `ai/model.py`: carga/entrenamiento del clasificador; persistencia del modelo demo.
- `ai/training/train_demo.py`: pipeline independiente con **validación cruzada** y **split de test**.
- `ai/preprocessing/landmarks.py`: captura de muestras reales con cámara (OpenCV + MediaPipe) para construir un dataset propio.
- **Resultado**: modelo demo entrenado en caliente; pipeline real validado (CV ≈ 0.999, test ≈ 0.965 en el set sintético).

### Fase 5 — Frontend React
- Vite con proxy `/api → :8000`.
- Contexto global (`AppContext`) para sesión, tema y preferencias (persistencia en `localStorage`).
- Servicios API (`api.js` con Axios, `auth.js`, `translation.js`, `ai.js`).
- Hooks:
  - `useAuth`: sesión/login/registro.
  - `useCamera`: acceso a cámara (`getUserMedia`), enumeración de dispositivos, errores claros.
  - `useHandTracking`: carga de MediaPipe, bucle de detección con throttling y dibujo del esqueleto.
  - `useSpeech`: TTS con Web Speech API.
- Componentes: `Layout`, `CameraPanel`, `ResultPanel`, `Loader`, `ErrorMessage`, `ProtectedRoute`.
- Páginas: Inicio, Traductor (cámara + demo sin cámara + autoguardado), Historial, Configuración, Login, Registro.
- Tema claro/oscuro y diseño responsive.

### Fase 6 — Docker
- `docker-compose.yml`: PostgreSQL 16 + backend (Uvicorn) + frontend (Nginx).
- `backend/Dockerfile` y `frontend/Dockerfile` multi-stage.
- `frontend/nginx.conf` con SPA fallback y proxy `/api`.

### Fase 7 — Verificación y pruebas
- **Backend**: suite `pytest` con SQLite en memoria/archivo y headers JWT (22 tests).
- **Frontend**: suite `Vitest` + Testing Library (15 tests) y `npm run build`.
- **Smoke test real**: servidor Uvicorn levantado, recorrido `health → register → login → predict (HOLA, conf 1.0) → guardar → historial`.

### Fase 8 — Depuración de la cámara (la saga más larga)
Esta fase consumió varias iteraciones y se documenta en detalle porque el síntoma ("cuadro negro" + "Sin manos en el encuadre") tuvo **varias causas encadenadas**:

1. **Portada oscura que tapaba el video**: la superposición de "activá la cámara" dependía de `cameraActive && translating`. Al presionar solo "Iniciar", la cámara prendía pero la portada seguía visible. → Se desacopló: la portada depende solo de si la cámara está prendida.
2. **El video se apagaba solo** (causa raíz del negro): `useCamera` usaba `useEffect(() => stop, [stop])` y `stop` dependía de `stream`. Al llegar el stream, la limpieza del efecto anterior cortaba el stream recién asignado y detenía las tracks. → El stream pasó a un `ref` estable y la limpieza solo ocurre al desmontar.
3. **Arranque "falso positivo"**: `start()` se tragaba el error de `getUserMedia` y el componente marcaba la cámara como activa igual. → `start()` devuelve `true/false` y solo se activa si hubo permiso real.
4. **Cámara equivocada / sin frames**: en Windows 11 Chrome puede elegir la cámara IR (Windows Hello) o una ocupada. → Se agregó **selector "Fuente de video"** (`enumerateDevices`), reinicio automático al cambiar, aviso si no llegan frames y mensaje específico para `NotReadableError`.
5. **MediaPipe sin fallback**: se usaba solo GPU. → Fallback automático **GPU → CPU**.
6. **Carrera de `play()`**: se llamaba `play()` dos veces (hook + panel) justo tras asignar `srcObject`; Chrome lo rechaza a veces con `AbortError` y el video quedaba pausado. → **Un único dueño** del `play()` en el panel, con **reintento cada 350 ms** hasta tener frames.
7. **Versión vieja en ejecución**: durante varias pruebas se estaba viendo un build anterior, por lo que ningún arreglo "aparecía". → Se agregó el marcador visible **`camfix-v4`** en la barra de navegación para verificar al instante qué versión corre.
8. **TypeError al dibujar la mano (`.for is not iterable`)**: `drawHand` desestructuraba los landmarks como arrays `[x, y]`, pero MediaPipe los entrega como objetos `{x, y, z}`. → Se corrigió el dibujo para usar `lm.x` / `lm.y`; además el bucle de detección ahora captura errores de runtime y los muestra en pantalla en lugar de morir en silencio.

**Resultado final de la fase**: la cámara se ve, el esqueleto de la mano se dibuja en tiempo real y el sistema traduce las señas.

---

## 6. Registro de incidencias y soluciones

| # | Síntoma | Causa | Solución | Archivo(s) |
|---|---------|-------|----------|------------|
| 1 | Rutas `/api/api/...` (404) | Prefijo duplicado al incluir routers | Un único prefijo por router | `backend/app/api/router.py` |
| 2 | Test de auth fallaba por nombre corto | Validación mínima de 3 caracteres | Nombre de prueba "Usuario IA" | `backend/tests/test_auth.py` |
| 3 | Historial en orden inestable | Solo ordenaba por `created_at` | `ORDER BY created_at DESC, id DESC` | servicio de traducciones |
| 4 | Predicciones erráticas por profundidad | `palm` usaba z absoluto | Se reemplazó por `z_scale` (relativo) | `backend/app/ai/demo_templates.py` |
| 5 | Clases `np.str_` rompían serialización | Tipo NumPy en labels | `str()` al construir clases | `backend/app/ai/model.py` |
| 6 | Tests tocaban la BD real | Configuración tardía del entorno | `DATABASE_URL=sqlite` en `conftest.py` **antes** de importar la app | `backend/tests/conftest.py` |
| 7 | Modelo demo obsoleto entre corridas | `.pkl` cacheado | Borrar `demo_sign_model.pkl` y `test_sl.db` al cambiar la lógica | `backend/app/ai/models/` |
| 8 | Build fallaba en `Settings.jsx` | `{{'{id}'}}` interpretado como expresión JSX | `{"{id}"}` como expresión de cadena | `frontend/src/pages/Settings.jsx` |
| 9 | Tests fallaban por `localStorage` incompleto | jsdom parcial | Polyfill en memoria en el setup de tests | `frontend/src/test/setup.js` |
| 10 | `getByText("HOLA")` ambiguo | Texto repetido (badge + opción) | `getAllByText(...).length > 0` | tests de Translator |
| 11 | Imports rotos en `Home.test.jsx` | Rutas relativas incorrectas | Rutas corregidas (`../`, `../../`) | `frontend/src/pages/__tests__/Home.test.jsx` |
| 12 | Aviso React por atributo duplicado | `<video muted muted={true}>` | Se dejó un solo `muted` | `frontend/src/components/CameraPanel.jsx` |
| 13 | Cuadro negro con la cámara encendida | Portada ligada a `cameraActive && translating` | Portada depende solo de cámara encendida | `Translator.jsx`, `CameraPanel.jsx` |
| 14 | El stream se cortaba al iniciar | `stop` inestable en la limpieza del effect | `streamRef` + `stop` estable; limpieza solo al desmontar | `frontend/src/hooks/useCamera.js` |
| 15 | Cámara "activa" sin permiso | `start()` silenciaba el error | `start()` devuelve booleano; estado condicionado | `useCamera.js`, `Translator.jsx` |
| 16 | Video negro con algunas cámaras | GPU/WebGL o cámara equivocada | Fallback GPU→CPU + selector de dispositivo + aviso sin frames | `useHandTracking.js`, `CameraPanel.jsx` |
| 17 | Video pausado pese a tener stream | Doble `play()` rechazado con `AbortError` | Único dueño del `play()` + reintento hasta tener frames | `CameraPanel.jsx` |
| 18 | "No aparece nada de lo que arreglás" | Se ejecutaba un build anterior | Marcador `camfix-v4` visible + reconstruir Docker | `Layout.jsx` |
| 19 | `El detector de manos falló: .for is not iterable` | `drawHand` esperaba arrays, MediaPipe da objetos | Dibujo con `lm.x`/`lm.y`; try/catch con error visible | `useHandTracking.js` |

---

## 7. Pruebas y verificación

### 7.1 Backend
```powershell
cd "D:\Sistema de traduccion de lenguaje de señas\backend"
.\.venv\Scripts\python.exe -m pytest
# Resultado: 22 passed
```
Cobertura funcional: registro/login/me, CRUD de traducciones, historial, borrado, predicción IA (demo y landmarks), info del modelo, salud.

### 7.2 Frontend
```powershell
cd "D:\Sistema de traduccion de lenguaje de señas\frontend"
npm test        # Vitest + Testing Library → 15 passed
npm run build   # build de producción OK
```

### 7.3 Prueba de humo de la API (servidor real)
Secuencia validada manualmente:
```
GET  /api/health                → ok, db conectada, modelo demo
POST /api/auth/register         → 201
POST /api/auth/login            → token JWT
POST /api/ai/predict (demo)     → HOLA, confianza 1.0
POST /api/translation           → guardado
GET  /api/translation/history   → 1 registro
```

### 7.4 Prueba de cámara (manual, navegador)
- Permiso de cámara concedido → se ve el video.
- Mano en el encuadre → se dibuja el esqueleto y el estado pasa a "✓ Manos detectadas".
- Cambio de "Fuente de video" → reinicia la cámara sin recargar.
- Sin cámara → el modo "Probar sin cámara (demo)" recorre todo el flujo.

---

## 8. Cómo ejecutar el proyecto

### 8.1 Opción A — Docker (recomendada)
```powershell
cd "D:\Sistema de traduccion de lenguaje de señas"
Copy-Item .env.example .env   # completar SECRET_KEY y credenciales
docker compose up --build -d
# Frontend: http://localhost
# API docs: http://localhost:8000/docs
```
> Si modificás código del **frontend** con Docker, hay que reconstruir: `docker compose up --build -d`. Verificar la etiqueta `camfix-v4` en la barra de navegación.

### 8.2 Opción B — Local (desarrollo)
```powershell
# Backend
cd "D:\Sistema de traduccion de lenguaje de señas\backend"
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
$env:DATABASE_URL="sqlite:///./sl_translator.db"   # o el DSN de PostgreSQL
uvicorn app.main:app --reload --port 8000

# Frontend (otra terminal)
cd "D:\Sistema de traduccion de lenguaje de señas\frontend"
npm install
npm run dev
# http://localhost:5173  (proxy /api → :8000)
```

### 8.3 Entrenamiento del modelo
```powershell
cd "D:\Sistema de traduccion de lenguaje de señas\ai"
python training/train_demo.py          # entrena y valida; guarda ai/models/sign_model.pkl
python preprocessing/landmarks.py      # captura de muestras reales con cámara (dataset propio)
```

### 8.4 Solución de problemas de cámara
- **Requiere contexto seguro**: `http://localhost` u **HTTPS**. Por IP en HTTP el navegador bloquea la cámara.
- **Windows 11**: Configuración → Privacidad y seguridad → **Cámara** → habilitar acceso y el del navegador.
- **Cámara ocupada** por Zoom/Teams/otra pestaña → cerrarla.
- **Notebooks con obturador físico** → abrirlo.
- **Varias cámaras** → usar el selector "Fuente de video".
- Si el pill muestra `pausado:no` con resolución (ej. `1280x720`) pero se ve negro, el dispositivo entrega frames negros (driver/obturador/privacidad), no es la app.

---

## 9. Estado actual, limitaciones y próximos pasos

### 9.1 Estado actual
- ✅ Sistema completo y funcional (cámara → landmarks → IA → texto → voz → historial).
- ✅ Backend 22/22 tests y frontend 15/15 tests; build de producción OK.
- ✅ Docker listo y documentación técnica (arquitectura, BD, API y esta bitácora).

### 9.2 Limitaciones conocidas
- El modelo por defecto es **demo** (9 señas sintéticas); la precisión real depende de entrenar con LSA real.
- Se reconoce **una seña por vez**, no frases continuas.
- La primera carga de MediaPipe requiere **internet** (descarga del modelo y el WASM desde CDN).
- El TTS del servidor (`gTTS`) requiere conexión; el del cliente (Web Speech) depende del sistema.

### 9.3 Próximos pasos sugeridos
1. Construir un **dataset real de LSA** con `ai/preprocessing/landmarks.py` (varias personas, iluminación variada) y reentrenar.
2. Agregar **migraciones Alembic** en lugar de `create_all`.
3. Secuencias/frases: modelo temporal (LSTM/Transformer) sobre ventanas de landmarks.
4. Empaquetar MediaPipe **localmente** (vendorizar el modelo) para uso 100 % offline.
5. Tests end-to-end (Playwright) del flujo de cámara.
6. Pantalla de **feedback** para mejorar el modelo con correcciones del usuario.

---

## 10. Anexos

### 10.1 Vocabulario demo (9 señas)
`HOLA`, `GRACIAS`, `SI`, `NO`, `ADIOS`, `POR_FAVOR`, `BUENOS_DIAS`, `BUENAS_TARDES`, `AYUDA`.

### 10.2 Endpoints (13)
| Método | Ruta | Auth |
|---|---|---|
| GET | `/api/health` | No |
| POST | `/api/auth/register` | No |
| POST | `/api/auth/login` | No |
| GET | `/api/auth/me` | Sí |
| POST | `/api/ai/predict` | Sí |
| GET | `/api/ai/info` | No |
| POST | `/api/translation` | Sí |
| GET | `/api/translation/history` | Sí |
| GET | `/api/translation/{id}` | Sí |
| DELETE | `/api/translation/{id}` | Sí |
| GET | `/api/translation/{id}/speak` | Sí |
| GET | `/api/signs` | Sí |

### 10.3 Modelo de datos (resumen)
- `users`: id, nombre, email (único), password_hash, rol, created_at.
- `translations`: id, user_id (FK), sign_detected, translated_text, confidence, language, created_at.
- `signs`: id, name, description, language.
- `translation_feedback`: id, translation_id (FK), rating, comment, created_at.

### 10.4 Formato de features del modelo
- 21 landmarks × (x, y, z) = **63 features** por mano.
- Normalización: trasladar a la muñeca (punto 0) y escalar por tamaño de mano; `z_scale` relativo para cancelar el offset de profundidad.

### 10.5 Variables de entorno principales
- `DATABASE_URL` (PostgreSQL o SQLite para pruebas)
- `SECRET_KEY` (firma JWT)
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `CORS_ORIGINS`
- `VITE_API_URL` (frontend, opcional por proxy)

---

## 11. Historial de versiones del documento

| Versión | Cambio |
|---|---|
| 1.0 | Bitácora inicial: incluye todas las fases, incidencias y la depuración completa de cámara hasta `camfix-v4`. |
