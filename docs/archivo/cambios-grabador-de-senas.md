# Cambios: grabador de señas separado de la app

> Documento de cambios y explicación de lo nuevo. Resume cómo se separó la
> grabación de señas de la aplicación pública, cómo se cargan las señas y cómo
> aparecen automáticamente en la app.

Fecha: 2026-11-11

---

## 1. Objetivo

Antes, la pantalla **“Grabar señas”** era una ruta más de la app web
(`/grabar-senas`), aparecía en el menú y cualquier usuario con sesión podía
entrar. La idea era que:

- El **usuario final no cargue señas**: solo use el Traductor y el Historial.
- La carga la haga **el equipo** (vos y tus compañeros) desde una herramienta
  aparte.
- Las señas grabadas por el equipo **aparezcan solas en la página**, sin editar
  SQL a mano.
- La herramienta **no se mezcle** con la app pública: sin link en el menú, sin
  navbar, con su propia entrada y su propio login.

---

## 2. Antes y después

| Aspecto | Antes | Ahora |
|---|---|---|
| Dónde se grababa | Ruta React `/grabar-senas` dentro de la app | Página independiente `/recorder.html` |
| Menú de la app | Tenía el link “Grabar señas” | Ya no tiene link |
| Layout | Usaba el `Layout` público (navbar, tema, etc.) | Tiene su propio header, sin navbar |
| Login | Reutilizaba la sesión de la app | Tiene login propio (misma API de auth) |
| Catálogo | Había que insertar SQL para que la seña aparezca | Se registra automáticamente al guardar muestras |
| Texto de la seña nueva | `BUENAS_NOCHES` se mostraba tal cual | Se muestra “Buenas Noches” |
| Build | Una sola entrada (`index.html`) | Dos entradas (`index.html` + `recorder.html`) |

La app pública sigue funcionando igual: login, Traductor, Historial,
Configuración, auto-habla y recuperación de contraseña no se tocaron.

---

## 3. Cómo quedó la arquitectura

```text
┌──────────────────────────────────────────────┐
│ App pública (index.html)                     │
│  React Router + Layout + navbar              │
│  /  /login  /register  /traductor            │
│  /historial  /configuracion                  │
│  (sin link ni ruta de grabación)             │
└──────────────────────────────────────────────┘
                    │
                    │  mismas APIs /api/*
                    ▼
┌──────────────────────────────────────────────┐
│ Backend FastAPI                              │
│  /api/auth/*        login / registro         │
│  /api/signs         catálogo de la app       │
│  /api/ai/dataset    resumen de muestras      │
│  /api/ai/samples    guardar + alta catálogo  │
│  /api/ai/train      entrenar + recargar      │
└──────────────────────────────────────────────┘
                    ▲
                    │  mismas APIs /api/*
┌──────────────────────────────────────────────┐
│ Herramienta interna (recorder.html)          │
│  Entrada Vite propia, sin React Router       │
│  Login propio + header “herramienta interna” │
│  Reutiliza la pantalla RecordSigns           │
└──────────────────────────────────────────────┘
```

Puntos clave:

- `recorder.html` es una **segunda entrada de Vite**, no una ruta de React
  Router. Por eso no comparte navbar ni el árbol de rutas de la app.
- La herramienta **reutiliza** `RecordSigns.jsx` para no duplicar la lógica de
  cámara, MediaPipe, progreso, dataset y entrenamiento.
- Ambas páginas hablan con el **mismo backend** y la misma base de datos.

---

## 4. Archivos nuevos

| Archivo | Para qué sirve |
|---|---|
| `frontend/recorder.html` | HTML de la herramienta. Tiene `noindex, nofollow` para que no se indexe. |
| `frontend/src/recorder/main.jsx` | Monta `RecorderApp` con los estilos globales y los del grabador. |
| `frontend/src/recorder/RecorderApp.jsx` | Login propio, header interno, aviso de uso y render de `RecordSigns`. |
| `frontend/src/recorder/recorder.css` | Estilos del shell/header de la herramienta. |
| `docs/cambios-grabador-de-senas.md` | Este documento. |

---

## 5. Archivos modificados

### Frontend

| Archivo | Cambio |
|---|---|
| `frontend/vite.config.js` | Build multi-página: entradas `main` y `recorder`. Usa `fileURLToPath` para resolver rutas en ESM. |
| `frontend/src/App.jsx` | Se quitó la ruta de grabación del `Layout`. `/grabar-senas` ahora redirige a `/recorder.html` por compatibilidad. |
| `frontend/src/components/Layout.jsx` | Se eliminó el link “Grabar señas” del menú y su condición de visibilidad. |
| `frontend/src/pages/RecordSigns.jsx` | Mensajes de auto-catálogo, nota de herramienta interna y textos actualizados. |
| `frontend/src/services/ai.js` | Sin cambios de contrato: ya tenía `listDataset`, `saveSamples` y `trainModel`. |

### Backend

| Archivo | Cambio |
|---|---|
| `backend/app/api/routes/ai.py` | `POST /api/ai/samples` recibe la sesión de BD y llama a `ensure_catalog_sign`. |
| `backend/app/services/dataset_service.py` | Nueva función `ensure_catalog_sign(db, sign, language)`: inserta la seña en `signs` si no existe. |
| `backend/app/schemas/ai.py` | `SampleBatchResponse` ahora incluye `catalog_added: bool`. |
| `backend/app/ai/translations.py` | El fallback reemplaza guiones bajos por espacios (`BUENAS_NOCHES` → “Buenas Noches”). |

### Tests y documentación

| Archivo | Cambio |
|---|---|
| `backend/tests/test_dataset.py` | Test de auto-catálogo y fixture que deja `signs` limpia. |
| `backend/tests/test_translations.py` | Test de traducción de señas nuevas con guiones bajos. |
| `docs/como-agregar-mas-senas.md` | URL nueva, uso interno, auto-catálogo y archivos clave. |
| `README.md` | Referencias a la herramienta, conteo de tests y enlace a este documento. |
| `ai/README.md` | Referencias a `/recorder.html` y al auto-catálogo. |
| `ai/dataset/README.md` | Referencias a `/recorder.html` y al auto-catálogo. |
| `.gitignore` | Ignora muestras (`ai/dataset/argentine/*/*.json`), modelos (`*.pkl`) y datasets grandes. |

---

## 6. Cómo se usa la herramienta

### Desarrollo

1. Levantar el backend:

   ```powershell
   cd backend
   .venv\Scripts\Activate.ps1
   $env:DATABASE_URL = "sqlite:///./sl_translator.db"
   uvicorn app.main:app --reload --port 8000
   ```

2. Levantar el frontend:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

3. Abrir **<http://localhost:5173/recorder.html>** directamente.
   No hay link en el menú: es una URL interna.

4. Iniciar sesión con una cuenta del sistema (la herramienta tiene su propio
   formulario de login).

5. Grabar:
   - Escribir el nombre en MAYÚSCULAS (`BUENAS_NOCHES`, `PERDON`, …).
   - Activar la cámara y esperar “Manos detectadas”.
   - Elegir cuántas muestras por grabación (20–150).
   - Grabar 3–5 repeticiones de la misma seña.
   - Tocar **“Entrenar con las muestras guardadas”**.

6. Abrir la app pública (`/`) y verificar que la seña aparece en el Traductor.

### Producción / build

`npm run build` genera dos HTML:

```text
frontend/dist/index.html      -> app pública
frontend/dist/recorder.html   -> herramienta interna
```

El `nginx.conf` actual ya sirve cualquier archivo existente con
`try_files $uri $uri/ /index.html`, así que `/recorder.html` funciona sin
cambios adicionales. No hace falta tocar el Dockerfile.

---

## 7. Auto-catálogo: cómo aparece la seña en la app

Antes había que insertar SQL en `database/seed.sql` para que la seña figure en
la lista. Ahora, al guardar muestras:

1. `POST /api/ai/samples` guarda los JSON en
   `ai/dataset/argentine/<SEÑA>/sample_<fecha>_<id>.json`.
2. El endpoint llama a `ensure_catalog_sign(db, sign, language)`.
3. Si la seña no existe en la tabla `signs`, la inserta con una descripción
   genérica.
4. La respuesta incluye `catalog_added`:
   - `true`: la seña se agregó recién.
   - `false`: ya existía en el catálogo.

Ejemplo real de respuesta:

```json
{
  "sign": "PRUEBA_CATALOGO_DEV",
  "saved": 1,
  "total_for_sign": 1,
  "dataset_dir": "C:\\...\\ai\\dataset\\argentine",
  "catalog_added": true
}
```

La pantalla muestra el mensaje correspondiente:

- “La seña se agregó al catálogo y ya aparece en la app.”
- “La seña ya estaba en el catálogo de la app.”

Detalles de implementación:

- El alta es **resiliente**: si falla el catálogo, la captura no se rompe y
  `catalog_added` queda en `false`.
- La comparación es por `name` + `language`, así que no duplica si grabás la
  misma seña varias veces.
- El nombre se normaliza igual que en el dataset: mayúsculas, sin espacios,
  solo `A-Z`, `0-9` y `_`.
- El catálogo aparece **al guardar**. Para que la **cámara la reconozca** hace
  falta entrenar (`POST /api/ai/train` o el botón “Entrenar”).

### Texto legible

Las señas nuevas sin traducción fija ahora se muestran legibles:

```text
BUENAS_NOCHES -> "Buenas Noches"
```

Antes se mostraba `BUENAS_NOCHES` tal cual porque `translate_sign()` solo
capitalizaba la primera letra de cada palabra.

---

## 8. Endpoints involucrados

| Método | Ruta | Auth | Qué hace |
|---|---|---|---|
| `POST` | `/api/auth/login` | No | Login (form-urlencoded) |
| `GET` | `/api/auth/me` | Sí | Valida la sesión de la herramienta |
| `GET` | `/api/signs` | Sí | Catálogo que ve la app |
| `GET` | `/api/ai/dataset` | Sí | Resumen de muestras por seña |
| `POST` | `/api/ai/samples` | Sí | Guarda muestras y da de alta la seña |
| `POST` | `/api/ai/train` | Sí | Entrena y recarga el modelo |
| `GET` | `/api/ai/info` | No | Modelo activo, clases y features |

---

## 9. Compatibilidad

- **`/grabar-senas`** sigue existiendo, pero solo como redirección: muestra un
  aviso y hace `window.location.replace("/recorder.html")`. Así no se rompen
  links viejos ni marcadores.
- La redirección está **fuera del `Layout`**, así que no muestra la navbar
  pública.
- El resto de las rutas de la app no cambió.
- Auto-habla y recuperación de contraseña siguen funcionando.

---

## 10. Pruebas y verificación

| Comprobación | Resultado |
|---|---|
| `pytest -q` (backend) | **34 passed** |
| `npm test` (frontend) | **15 passed** |
| `npm run build` (frontend) | OK, genera `dist/index.html` y `dist/recorder.html` |
| Verificación en navegador | `/recorder.html` carga, muestra login propio y, con sesión, la pantalla de grabación; sin navbar |
| Verificación end-to-end | `POST /api/ai/samples` devolvió `catalog_added: true` y el catálogo pasó de 86 a 87 señas |

Pruebas nuevas:

- `test_samples_endpoint_registers_sign_in_catalog`: guarda una seña, verifica
  que aparece en `/api/signs`, que el segundo guardado devuelve
  `catalog_added: false` y limpia la fila.
- `test_translate_unknown_sign_replaces_underscores`: verifica
  `BUENAS_NOCHES` → “Buenas Noches”.

Nota: los tests usan `AI_MODEL_MODE=demo` y SQLite (`backend/test_sl.db`). La
fixture autouse de `test_dataset.py` deja la tabla `signs` vacía porque el test
del fallback del catálogo depende de eso.

---

## 11. Seguridad y alcance

- `recorder.html` **no está linkeada** en la app y tiene `noindex, nofollow`.
- Igual es una URL alcanzable: cualquiera que la conozca y tenga una cuenta
  válida puede usarla. Si hace falta, en producción se puede restringir por
  red, por rol de usuario o con una regla de nginx.
- La herramienta usa el mismo JWT que la app; no se agregó un sistema de
  permisos nuevo.
- No se eliminó `frontend/` legado ni se cambió el esquema de la base.

---

## 12. Limitaciones y pendientes

- **Una mano**: el modelo usa 21×3 = 63 features y elige la mano más
  prominente. Señas de dos manos requieren otro modelo.
- **Sin movimiento**: el modelo mira una foto de la mano; señas dinámicas no se
  reconocen bien.
- **Cámara móvil**: el móvil manda `image_base64` y el backend necesita
  `mediapipe` server-side, que hoy no está en `requirements.txt`. La
  herramienta web no tiene ese problema porque MediaPipe corre en el navegador.
- **LSA64**: falta que el usuario copie los videos y confirme la versión y la
  estructura. Hay que respetar la licencia y convertir al formato JSON de
  `ai/dataset/argentine/`.
- **Catálogo vs. modelo**: guardar una seña la hace aparecer en la lista, pero
  no la vuelve reconocible hasta entrenar.

---

## 13. Checklist para el equipo

- [ ] Backend y frontend levantados.
- [ ] Abrir `/recorder.html` y loguearse.
- [ ] Grabar 3–5 repeticiones por seña (ideal 150+ muestras totales).
- [ ] Confirmar el mensaje “La seña se agregó al catálogo…”.
- [ ] Tocar “Entrenar” y esperar el resultado.
- [ ] Verificar `/api/ai/info` con la seña y `model: "trained"`.
- [ ] Abrir el Traductor y probar la seña nueva.
- [ ] (Opcional) Agregar la fila a `database/seed.sql` para instalaciones nuevas.
