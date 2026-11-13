# Bitácora del proyecto

> Reconstrucción cronológica de lo que se hizo en el Traductor de Lenguaje de
> Señas, desde el punto de partida hasta el estado actual. Se armó a partir de
> `docs/archivo/`, `CHANGELOG.md`, `docs/analisis-limpieza-y-mejoras.md` y las
> verificaciones ejecutadas.
>
> Las fechas son las que quedaron registradas en la documentación. Lo anterior al
> **2026-10-22** no tiene fecha exacta: se describe como “punto de partida”.
>
> La **bitácora original**, escrita mientras el proyecto se construía desde cero
> (con la depuración de cámara hasta `camfix-v4`), se conserva en
> [`archivo/bitacora-v1-original.md`](archivo/bitacora-v1-original.md).

---

## 1. Fase 0 — Punto de partida (antes del 2026-10-22)

El proyecto ya existía como sistema académico con dos piezas principales:

| Pieza | Estado inicial |
|---|---|
| **Backend** | FastAPI + SQLAlchemy con registro, login JWT, predicción, historial, catálogo, TTS y salud |
| **Web** | React + Vite con login, registro, traductor con MediaPipe en el navegador, historial y configuración |
| **IA** | Modo demostración con 9 plantillas sintéticas; script de entrenamiento |
| **Base de datos** | Esquema PostgreSQL, seed del catálogo y soporte SQLite para pruebas |
| **Docker** | `docker-compose.yml` con PostgreSQL, backend y web |
| **App móvil** | Todavía no existía |
| **Grabador** | Era una ruta interna de la web (`/grabar-senas`), visible en el menú |
| **Permisos** | No había rol de administrador |

Problemas conocidos en ese momento:

- `GET /api/signs` devolvía **500** si la base estaba vacía.
- El modelo demo no reconocía LSA real: solo validaba el flujo técnico.
- La grabación estaba mezclada con la app pública.
- No había dataset real ni forma cómoda de cargar señas nuevas.

---

## 2. 2026-10-22 — Auditoría y migración a la app móvil

### 2.1 Auditoría

Se revisó todo el proyecto (`mobile/`, `backend/`, `frontend/`, `ai/`,
`database/`, `docs/`, Docker y pruebas) y se documentó en
[`archivo/auditoria-proyecto.md`](archivo/auditoria-proyecto.md).

Hallazgos principales:

- El backend funcionaba y tenía pruebas.
- El flujo demo de IA estaba completo de punta a punta.
- Faltaba probar cámara, TTS y `image_base64` en un dispositivo real.
- El `.venv` del backend estaba roto (apuntaba a un Python inexistente).
- Docker y PostgreSQL real no estaban disponibles en la máquina de trabajo.

### 2.2 Corrección del catálogo

Se corrigió el fallback de `/api/signs` para devolver `SignOut` con
`created_at`, `id=0` y `description=null` cuando la base está vacía. Se agregó
`backend/tests/test_signs.py` como prueba de regresión.

### 2.3 Creación de `mobile/`

Se creó una app Expo + React Native + TypeScript con:

- login, registro y restauración de sesión;
- inicio con estadísticas;
- traductor con modo demo y captura de foto;
- resultado con confianza, voz y guardado;
- historial con actualización y eliminación;
- configuración de tema, idioma, velocidad y autoguardado.

Fases ejecutadas:

| Fase | Trabajo | Resultado |
|---|---|---|
| 0 | Auditoría | Documento de auditoría |
| 1 | Corrección del backend | `/api/signs` sin `500` + prueba |
| 2 | Base de la app móvil | Expo, navegación, servicios, contextos |
| 3 | Pantallas | Flujo completo de la app |
| 4 | Pruebas y verificación | Typecheck, 24 pruebas, export Android |
| 5 | Documentación | README, docs y guías |

### 2.4 Decisiones de esa etapa

Quedaron registradas en
[`archivo/decisiones-tecnicas.md`](archivo/decisiones-tecnicas.md):

- Crear la app móvil con Expo en lugar de Flutter o React Native CLI.
- Conservar el backend FastAPI y sus contratos.
- **No** intentar ejecutar MediaPipe dentro de React Native.
- Usar dos caminos: demo (`demo_sign`) y foto (`image_base64`).
- Guardar el JWT en `expo-secure-store`.
- Usar `expo-speech` para la voz y `AsyncStorage` para preferencias.
- Mantener el frontend web como cliente legado.
- Documentar los límites reales en lugar de prometer reconocimiento de LSA.

### 2.5 Resultados

| Suite | Resultado |
|---|---|
| Backend | 24 pruebas |
| App móvil | 24 pruebas en 7 suites |
| Web | 15 pruebas |
| Export Android | Bundle correcto |
| Cámara/TTS en dispositivo | No verificado |

---

## 3. 2026-11-11 — Separación del grabador de señas

El objetivo fue sacar la grabación de la app pública: el usuario final no debe
cargar señas; eso lo hace el equipo desde una herramienta aparte.

### 3.1 Cambios de producto

- La ruta `/grabar-senas` dejó de estar en el menú público.
- Se creó una **segunda entrada de Vite**: `recorder.html`.
- El grabador tiene su propio login, su propio header y no comparte navbar ni
  rutas con la app pública.
- `/grabar-senas` redirige a `/recorder.html` por compatibilidad.

### 3.2 Auto-catálogo

Al guardar muestras, `POST /api/ai/samples` llama a
`ensure_catalog_sign(db, sign, language)`:

1. Guarda los JSON en `ai/dataset/argentine/<SEÑA>/`.
2. Si la seña no existe en la tabla `signs`, la inserta.
3. Devuelve `catalog_added: true/false`.
4. La seña aparece automáticamente en el Traductor, sin editar SQL.

También se mejoró la presentación de nombres: `BUENAS_NOCHES` se muestra como
“Buenas Noches”.

### 3.3 Lo que quedó pendiente en esa etapa

El grabador estaba oculto del menú, pero **cualquier usuario autenticado podía
abrirlo**. La protección real por administrador llegó después.

Documento de esa etapa:
[`archivo/cambios-grabador-de-senas.md`](archivo/cambios-grabador-de-senas.md).

---

## 4. 2026-11-13 — Limpieza, foco en la web y permisos

### 4.1 Decisión de producto

Se definió que la **web es el cliente principal**:

- Corre MediaPipe en el navegador.
- Funciona en computadora y en celular.
- No depende de una app nativa ni de publicar en tiendas.

`mobile/` se conservó como cliente **opcional y experimental**, sin borrar el
trabajo de React Native ni sus pruebas.

### 4.2 Seguridad y administración

Se agregaron:

- `APP_ENV` (`development` / `production`).
- `DEMO_MODE` para habilitar o cortar los atajos de demostración.
- `ADMIN_EMAILS` con los emails que pueden usar el grabador y entrenar.
- Propiedad `is_admin` en el usuario y campo `is_admin` en `/auth/me`.
- Dependencia `get_current_admin`, que devuelve `403` si la cuenta no es admin.

Consecuencias:

- `GET /api/ai/dataset`, `POST /api/ai/samples` y `POST /api/ai/train` son
  **solo para administradores**.
- `/recorder.html` muestra “Sin acceso al grabador” si la cuenta no es admin.
- `demo_reset_token` solo se devuelve con `DEMO_MODE=true` y fuera de
  producción.
- `demo_sign` se rechaza si `DEMO_MODE=false`.

### 4.3 Catálogo y reconocimiento

- `/api/signs` devuelve `display_name` y `recognized`.
- El catálogo tiene **86 señas**; el modelo demo conoce **9**.
- La web marca en amarillo las señas que todavía no fueron entrenadas.
- El selector de demo solo ofrece las clases que el modelo realmente conoce.
- El Traductor exige **2 cuadros consecutivos** con la misma seña antes de
  mostrarla, guardarla o pronunciarla.

### 4.4 Limpieza de código y dependencias

Se eliminó o movió lo que no se usaba:

- Módulo de feedback (`models/feedback.py`, `schemas/feedback.py`, relación
  `Translation.feedback` y tabla `translation_feedback`).
- `frontend/src/hooks/useAuth.js` (duplicaba el acceso a `AppContext`).
- `BUILD_TAG` y su badge en la navbar.
- `ai/training/train_demo.py` (quedó un solo script: `train_model.py`).
- `package-lock.json` huérfano de la raíz.
- `version: "3.9"` de `docker-compose.yml`.
- `opencv-python-headless` y `mediapipe` pasaron a
  `backend/requirements-optional.txt`; el Dockerfile ya no instala OpenCV.

También se corrigieron detalles del cliente web:

- `Login` redirige con `<Navigate>` en vez de navegar durante el render.
- `Register` importa `login` de forma estática.
- `ForgotPassword` usa `Link` y solo muestra el código si existe.
- `index.html` incluye `theme-color` y `color-scheme`.

### 4.5 Documentación

- Se creó [`README.md`](README.md) como índice de documentación.
- Se creó [`../CHANGELOG.md`](../CHANGELOG.md).
- Se actualizaron `README.md`, `architecture.md`, `api.md`, `database.md`,
  `instalacion-y-ejecucion.md`, `pruebas-y-errores.md`, `guia-de-uso.md` y
  `como-agregar-mas-senas.md`.
- Los documentos históricos se movieron a `docs/archivo/` en lugar de borrarse.
- Se corrigieron los enlaces relativos de los documentos archivados.

### 4.6 Verificación final

| Suite | Resultado |
|---|---|
| Backend `pytest -q` | **40 passed** |
| Web `npm test -- --run` | **15 passed** en 5 archivos |
| Web `npm run build` | OK (`index.html` + `recorder.html`) |
| Enlaces de documentación | Sin enlaces rotos |

Desglose del backend: auth 8, IA 7, dataset 9, permisos 5, catálogo 3,
traducciones 8.

### 4.7 Puesta a punto del entorno local

Al preparar la prueba del grabador se detectó que `backend/.venv` tenía
binarios de Python 3.14 (`cp314`) dentro de un entorno con Python 3.12, por lo
que NumPy y scikit-learn no importaban. Se hizo lo siguiente:

- Se renombró el entorno roto a `backend/.venv-roto-20261113` (no se borró).
- Se creó un `backend/.venv` nuevo con Python 3.12.1.
- Se instalaron las dependencias de `backend/requirements.txt`.
- Se configuró `backend/.env` para desarrollo local con SQLite y las variables
  `APP_ENV`, `DEMO_MODE` y `ADMIN_EMAILS`.
- Se verificó `/api/health`, el registro, el login con `is_admin: true`, el
  catálogo y `/api/ai/dataset`.
- Se eliminó la cuenta de prueba usada para la verificación.

> El entorno viejo se conserva solo por precaución. Una vez confirmado que todo
> funciona, se puede borrar `backend/.venv-roto-20261113`.

### 4.8 (2026-11-14) Alias `/health` y tests independientes del `.env`

Al arrancar el backend aparecía `GET /health 404 Not Found`. La ruta real es
`/api/health`; alguien (navegador, extensión o monitor) pedía la corta. Se
agregó `GET /health` como alias de la misma función, sin mostrarla en Swagger.

También se detectó que los tests fallaban si `backend/.env` tenía un
`ADMIN_EMAILS` configurado: `conftest.py` ahora fija `APP_ENV=development`,
`DEMO_MODE=true` y `ADMIN_EMAILS=""` antes de importar la app, así la suite no
depende de la configuración local. Se sumó una prueba del alias y el total pasó
a **41 pruebas**.

### 4.9 (2026-11-15) Error 422 al guardar muestras

Al grabar una seña, el grabador mostraba “No se pudieron guardar las muestras:
No se pudo conectar con el servidor”, pero el backend registraba
`POST /api/ai/samples 422 Unprocessable Entity`. El mensaje era engañoso: el
cliente HTTP solo usaba `detail` cuando era un string, y los errores de
validación de FastAPI llegan como lista.

Cambios:

- `frontend/src/services/api.js` ahora traduce los errores 422 a un mensaje
  legible (`sign: ... · samples: ...`) y distingue “sin respuesta del servidor”
  de “el servidor respondió con error”.
- El grabador **normaliza el nombre antes de enviarlo** (`BUENAS NOCHES` →
  `BUENAS_NOCHES`) y avisa si no se capturó ninguna mano.
- Se aceptan nombres de **1 carácter** (`A`, `B`, `C`) para grabar el alfabeto
  LSA. Antes el backend exigía 2 y devolvía 422 con nombres de una letra.
- Se agregaron pruebas: una del backend para nombres de un carácter y cuatro
  del formateo de errores en la web.

Resultado: **42 pruebas backend** y **19 pruebas web**.

---

## 5. Estado actual

| Componente | Estado |
|---|---|
| Backend FastAPI | Funcional; 42 pruebas |
| Web (cliente principal) | Funcional; 19 pruebas + build |
| App móvil Expo | Opcional/experimental; typecheck + 24 pruebas |
| Modelo de IA | Demo con 9 clases sintéticas |
| Catálogo | 86 señas; `recognized` indica cuáles conoce el modelo |
| Grabador | `/recorder.html`, solo administradores |
| Entrenamiento | `POST /api/ai/train` o `ai/training/train_model.py` |
| Base de datos | PostgreSQL o SQLite; sin migraciones Alembic |
| Docker Compose | Configurado, no verificado en esta máquina |
| Git | Inicializado el 2026-11-15; 8 commits y 8 etiquetas (`v0.1.0`–`v1.0.0`), sin remoto todavía |

Flujo real hoy:

1. El equipo entra a `/recorder.html` con una cuenta admin.
2. Graba 3–5 repeticiones de una seña (ideal 150+ muestras).
3. La seña se registra sola en el catálogo.
4. El equipo toca “Entrenar” y el backend recarga el modelo.
5. La seña aparece en el Traductor y, si el modelo la aprendió, la cámara la
   reconoce.

---

## 6. Línea de tiempo resumida

| Fecha | Hito | Resultado |
|---|---|---|
| Antes del 2026-10-22 | Backend + web + IA demo + base + Docker | Sistema funcional en modo demo |
| 2026-10-22 | Auditoría, fix de `/api/signs`, creación de `mobile/` | 24 pruebas backend, 24 móvil, 15 web |
| 2026-11-11 | Grabador separado en `/recorder.html` + auto-catálogo | La seña aparece sola en la app |
| 2026-11-13 | Web como cliente principal, permisos admin y limpieza | 40 pruebas backend, 15 web, build OK |
| 2026-11-14 | Alias `/health` y tests independientes del `.env` | 41 pruebas backend |
| 2026-11-15 | Fix del 422 al guardar muestras y nombres de 1 letra | 42 pruebas backend, 19 web |
| 2026-11-15 | Bitácora original archivada, guía de publicación e historial de Git | 8 commits y etiquetas `v0.1.0`–`v1.0.0` |

---

## 7. Pendientes y próximos pasos

Ordenados por impacto:

1. **Integrar un dataset real de LSA** (por ejemplo LSA64) al formato
   `ai/dataset/argentine/<SEÑA>/*.json`. Requiere definir la ruta y la
   estructura de los videos.
2. **Mejorar el modelo**: dos manos, ventana temporal para señas con movimiento
   y normalización de rotación.
3. **Hacer asíncrono `/api/ai/train`** para no bloquear al worker durante el
   entrenamiento.
4. **Probar en un teléfono físico**: cámara, TTS y permisos en navegadores
   móviles (fuera de `localhost` suele hacer falta HTTPS).
5. **Evaluar seguridad de producción**: JWT en cookie `httpOnly`, CORS
   restringido y `APP_ENV=production` con `DEMO_MODE=false`.
6. **Migraciones de base de datos** (Alembic) si el esquema va a seguir
   cambiando.
7. **Verificar Docker Compose y PostgreSQL real** en una máquina con Docker.

---

## 8. Cómo probar el flujo de administrador

Resumen; el paso a paso completo está en
[`como-agregar-mas-senas.md`](como-agregar-mas-senas.md).

1. En `backend/.env`, configurar:

   ```ini
   APP_ENV=development
   DEMO_MODE=true
   ADMIN_EMAILS=tu-email@example.com
   ```

2. Reiniciar el backend.
3. Crear o usar una cuenta con ese email.
4. Abrir `http://localhost:5173/recorder.html` e iniciar sesión.
5. Grabar la seña y tocar **“Entrenar con las muestras guardadas”**.
6. Verificar en el Traductor que la seña aparece y se reconoce.

Si `ADMIN_EMAILS` queda vacío en desarrollo, cualquier usuario autenticado es
administrador. En producción, la lista es obligatoria.

---

## 9. Historial de versiones (Git)

El 2026-11-15 se inicializó Git con un historial **reconstruido** a partir de
esta bitácora: ocho commits agrupados por área, cada uno con su etiqueta.

| Etiqueta | Fecha | Contenido |
|---|---|---|
| `v0.1.0` | 2026-10-08 | Estructura, `.gitignore`, `.gitattributes` y diseño |
| `v0.2.0` | 2026-10-10 | `database/schema.sql` y `seed.sql` |
| `v0.3.0` | 2026-10-14 | `backend/`: API, JWT, TTS y pruebas |
| `v0.4.0` | 2026-10-17 | `ai/`: features, modelo demo y entrenamiento |
| `v0.5.0` | 2026-10-20 | `frontend/`: traductor, historial y configuración |
| `v0.6.0` | 2026-10-22 | Docker Compose y `mobile/` |
| `v0.7.0` | 2026-11-13 | Bitácora, pruebas, guías y documentos históricos |
| `v1.0.0` | 2026-11-15 | Bitácora original, guía de publicación y estado verificado |

Las fechas son aproximadas y los commits **no** son una copia exacta del código
de cada fecha. Solo `v1.0.0` está verificado con las suites actuales.

- Cómo subirlo, crear releases y volver a una versión anterior:
  [`subir-a-github.md`](subir-a-github.md).
- Script que genera el historial:
  [`../scripts/crear-historial-git.ps1`](../scripts/crear-historial-git.ps1).
- Bitácora original desde cero:
  [`archivo/bitacora-v1-original.md`](archivo/bitacora-v1-original.md).
