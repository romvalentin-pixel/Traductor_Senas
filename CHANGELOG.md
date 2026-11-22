# Changelog

Cambios relevantes del proyecto. Desde el 2026-11-15 el repositorio local usa
Git y tiene etiquetas de versión (`v0.1.0`–`v1.0.0`); todavía no hay un remoto
publicado en GitHub.

## 2026-11-15 — Bitácora original, guía de GitHub e historial de Git

### Documentación

- Se archivó la **bitácora original** (v1.0, escrita mientras el proyecto se
  construía desde cero, con la depuración de cámara hasta `camfix-v4`) en
  `docs/archivo/bitacora-v1-original.md`. Se conserva sin cambios y se enlaza
  desde `docs/bitacora.md` y `docs/README.md`.
- Nueva guía `docs/subir-a-github.md`: qué se versiona, cómo crear el remoto,
  subir por ramas, etiquetas o releases, y cómo volver a una versión vieja.
- Nuevo `docs/material/README.md` que explica por qué el PDF del señario LSA
  queda solo en local.
- `README.md` y `docs/bitacora.md` suman la tabla de versiones y el estado del
  repositorio.

### Repositorio

- Se inicializó Git con un historial **reconstruido** de 8 commits agrupados por
  área y 8 etiquetas: `v0.1.0` (diseño) a `v1.0.0` (estado actual).
- `.gitignore` ampliado: `.venv*/`, PDFs de `docs/material/`, `*.bundle`,
  logs y cachés de herramientas.
- Nuevo `.gitattributes` para normalizar saltos de línea y marcar binarios.
- Nuevo `scripts/crear-historial-git.ps1` que reproduce el historial.
- **Sin remoto todavía**: falta crear el repositorio en GitHub y hacer `push`.

## 2026-11-15 — Fix del 422 al guardar muestras

### Backend

- Los nombres de seña ahora aceptan **1 carácter** (`A`, `B`, `C`) además de
  los de 2 a 40. El alfabeto LSA son señas válidas y antes devolvían `422`.
  Afecta a `SampleBatchRequest` y a `dataset_service._normalize_sign`.
- Nueva prueba `test_save_samples_accepts_single_letter`; la prueba de nombre
  inválido usa `!!!` en lugar de `x` (que ahora es válido).

### Web

- `src/services/api.js` expone `formatApiDetail()` y muestra los errores de
  validación 422 como texto legible en vez de “No se pudo conectar con el
  servidor”. También distingue fallo de red de respuesta HTTP con error.
- El grabador normaliza el nombre antes de enviarlo y avisa si no se capturó
  ninguna mano.
- Nueva suite `src/services/__tests__/api.test.js` con 4 pruebas.

### Documentación

- `docs/como-agregar-mas-senas.md` aclara que se acepta una sola letra.
- Conteos actualizados a **42 pruebas backend** y **19 pruebas web** en
  `README.md`, `docs/pruebas-y-errores.md`, `docs/instalacion-y-ejecucion.md`,
  `docs/architecture.md`, `frontend/README.md` y `docs/bitacora.md`.

## 2026-11-14 — Alias `/health` y tests deterministas

### Backend

- Se agregó `GET /health` como alias de `GET /api/health`, para que clientes,
  extensiones y monitores que consultan la ruta corta no reciban `404`.
  No aparece en Swagger (`include_in_schema=False`).
- `backend/tests/conftest.py` ahora fija `APP_ENV`, `DEMO_MODE` y `ADMIN_EMAILS`
  antes de importar la app. Así los tests no dependen del `backend/.env` real:
  si configurás un administrador, la suite ya no falla por `403`.

### Documentación

- `docs/api.md` documenta el alias `/health`.
- Conteo de pruebas actualizado a **41** en `README.md`, `CHANGELOG.md`,
  `docs/bitacora.md`, `docs/pruebas-y-errores.md` y
  `docs/instalacion-y-ejecucion.md`.

## 2026-11-13 — Limpieza y enfoque en la web

### Producto y documentación

- Se define la **web (React + Vite)** como cliente principal: corre MediaPipe en
  el navegador y funciona en computadora y celular.
- `mobile/` (Expo/React Native) queda como cliente **opcional y experimental**.
  No se eliminó para conservar ese trabajo y sus pruebas.
- Se consolidó la documentación: nuevo [`docs/README.md`](docs/README.md) como
  índice y este `CHANGELOG.md`.
- Los documentos históricos se movieron a `docs/archivo/` en lugar de borrarse.
- `README.md`, `docs/architecture.md`, `docs/instalacion-y-ejecucion.md`,
  `docs/pruebas-y-errores.md`, `docs/guia-de-uso.md` y `docs/api.md` se
  actualizaron al estado real.

### Seguridad y permisos

- Nuevas variables `APP_ENV`, `DEMO_MODE` y `ADMIN_EMAILS`.
- `GET /api/ai/dataset`, `POST /api/ai/samples` y `POST /api/ai/train` requieren
  un usuario administrador (`403` si no lo es).
- El grabador `/recorder.html` muestra "Sin acceso" si la cuenta no es admin.
- `demo_reset_token` solo se devuelve con `DEMO_MODE=true` y fuera de
  producción. En producción el código debe enviarse por correo.
- `demo_sign` se rechaza si `DEMO_MODE=false`.
- `/api/auth/me` y el login exponen `is_admin`.

### Catálogo y reconocimiento

- `/api/signs` devuelve `display_name` y `recognized`.
- Las señas del catálogo que el modelo no conoce se muestran en amarillo en el
  Traductor ("todavía no entrenada").
- El selector de demo solo ofrece las clases que el modelo realmente conoce.
- El Traductor exige **2 cuadros consecutivos** con la misma seña antes de
  mostrarla, guardarla o pronunciarla.

### Limpieza de código

- Eliminados el módulo de feedback (`models/feedback.py`, `schemas/feedback.py`,
  relación `Translation.feedback` y tabla `translation_feedback`).
- Eliminados `ai/training/train_demo.py`, `frontend/src/hooks/useAuth.js`, el
  `BUILD_TAG` de la navbar y su CSS, y el `package-lock.json` huérfano de la raíz.
- `Login`, `Register` y `ProtectedRoute` usan directamente `useApp`.
- `Login` redirige con `<Navigate>` en vez de navegar durante el render.
- `Register` importa `login` de forma estática.
- `ForgotPassword` usa `Link` y solo muestra el código si existe.
- Se quitó `version: "3.9"` de `docker-compose.yml`.
- `opencv-python-headless` y `mediapipe` pasaron a
  `backend/requirements-optional.txt`; el `Dockerfile` ya no instala paquetes de
  OpenCV.

### Pruebas

- Backend: **40 pruebas** (se agregaron permisos y catálogo con `recognized`).
  El 2026-11-14 se sumó una prueba del alias `/health` y quedaron **41**.
- Web: **15 pruebas** y `npm run build` correcto.
- App móvil: sin cambios de código; se mantienen sus 24 pruebas y el typecheck.
