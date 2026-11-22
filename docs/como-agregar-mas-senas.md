# Cómo agregar o cargar más señas

> Guía práctica para **enseñarle una seña nueva al modelo** usando la
> herramienta interna **“Grabador de señas”** (`/recorder.html`). También explica
> las tres capas que conviven en el proyecto y las limitaciones actuales.
>
> Esa herramienta **no es parte de la app pública**: no está en el menú y no la
> ve el usuario final. Al guardar una seña, queda registrada sola en el catálogo
> y aparece en el Traductor.

---

## 1. Las tres capas (no son lo mismo)

| Capa | Dónde vive | Para qué sirve | ¿Reconoce tu mano real? |
|---|---|---|---|
| **Catálogo** | Tabla `signs` (BD) + `database/seed.sql` + fallback en `backend/app/api/routes/health.py` | Lista de nombres que la app muestra (Traductor, Historial, móvil) | No, es solo una lista |
| **Modelo demo** | `backend/app/ai/demo_templates.py` + `backend/app/ai/models/demo_sign_model.pkl` | Genera landmarks sintéticos y entrena un clasificador de prueba | No: valida el flujo técnico |
| **Modelo real** | Muestras en `ai/dataset/argentine/<SEÑA>/*.json` → `ai/models/sign_model.pkl` | Clasifica los 21 puntos de tu mano | **Sí**, si grabás y entrenás bien |

Regla mental:

- Si querés que la seña **aparezca en la lista** → se agrega sola al catálogo al guardarla.
- Si querés que el botón **Demostración** la muestre → plantilla demo.
- Si querés que la cámara **la reconozca con tu mano** → grabarla y entrenar.

---

## 2. Qué son “los puntos” (landmarks)

MediaPipe detecta **21 puntos** por mano (muñeca, nudillos, falanges y puntas de
los dedos). Cada punto tiene 3 coordenadas `(x, y, z)`, así que una mano queda
descripta por **21 × 3 = 63 números**.

El backend:

1. Toma **una sola mano**: la más grande/prominente del encuadre.
2. La **normaliza**: centra en la muñeca y escala por el tamaño de la mano, para
   que no importe la distancia a la cámara ni la posición en pantalla.
3. Le pasa esos 63 números al clasificador.

Vos no tenés que escribir coordenadas a mano: el grabador las captura desde la
cámara del navegador (MediaPipe corre en el navegador, no en el servidor).

---

## 3. Camino recomendado: herramienta “Grabador de señas”

### Configurar la cuenta administradora

El grabador y el entrenamiento están protegidos por `ADMIN_EMAILS`. Pasos:

1. Elegí el email con el que vas a entrar (el mismo de tu cuenta del sistema).
2. Abrí `backend/.env` (si no existe, copiá `.env.example` de la raíz a
   `backend/.env`).
3. Agregá o editá estas líneas:

   ```ini
   APP_ENV=development
   DEMO_MODE=true
   ADMIN_EMAILS=tu-email@example.com
   ```

   - Podés poner varios emails separados por coma.
   - El email debe coincidir exactamente con el de la cuenta (no importan
     mayúsculas; se compara en minúsculas).
4. **Reiniciá el backend** para que lea el `.env` (Ctrl+C y volver a arrancar
   `uvicorn`). La configuración se carga al iniciar el proceso.
5. Creá la cuenta en la app pública (`/register`) con ese email, o iniciá sesión
   si ya existe.
6. Abrí `http://localhost:5173/recorder.html` e iniciá sesión ahí.

Si ves **“Sin acceso al grabador”**, revisá:

- que el email sea exactamente el de `ADMIN_EMAILS`;
- que hayas reiniciado el backend después de editar `.env`;
- que `uvicorn` se haya iniciado desde `backend/` (es donde está el `.env`).

> **Atajo en desarrollo:** si `ADMIN_EMAILS` está vacío y `APP_ENV` no es
> `production`, cualquier usuario autenticado es administrador. Sirve para
> probar rápido, pero para un despliegue real configurá la lista.

### Requisitos previos

1. Backend y frontend levantados (por ejemplo `http://localhost:8000` y
   `http://localhost:5173`).
2. Abrir **`http://localhost:5173/recorder.html`** directamente. No hay link en
   el menú de la app: es una página aparte, solo para el equipo.
3. Iniciar sesión con la cuenta administradora configurada arriba.
4. Navegador con permiso de cámara. Chrome suele andar mejor que otros.
5. Buena luz, fondo quieto y la mano **completa** dentro del encuadre.

### Paso a paso

1. Entrá a `/recorder.html` (herramienta interna).
2. Escribí el **nombre de la seña** en MAYÚSCULAS, sin espacios. Si necesitás
   separar palabras, usá guiones bajos: `BUENAS_NOCHES`, `PERDON`, `COMO_ESTAS`.
   También se acepta **una sola letra** (`A`, `B`, `C`) para grabar el alfabeto.
   - Ese nombre es la etiqueta que va a devolver el modelo.
   - Podés elegir uno existente del catálogo o inventar uno nuevo.
3. Activá la cámara y esperá a que aparezca “Manos detectadas”.
4. Ajustá **“Muestras por grabación”** (por defecto 60). Cada muestra es un
   frame con los 21 puntos de ese instante.
5. Hacé la seña de forma **estable** y tocá **Grabar muestra**. La barra avanza
   mientras se capturan frames cada 100 ms.
6. Al llegar al objetivo, las muestras se guardan solas en:
   `ai/dataset/argentine/<SEÑA>/sample_<fecha>_<id>.json`
   - Además, la seña se registra automáticamente en el catálogo (`signs`), así
     que **ya aparece en el Traductor** sin tocar SQL. La respuesta incluye
     `catalog_added: true` la primera vez y `false` si ya existía.
7. **Repetí la grabación 3–5 veces** con la misma seña, variando un poco la
   posición, el ángulo y la distancia. El total recomendado es **150+ muestras
   por seña** (el mínimo técnico para una seña nueva es 20).
8. Tocá **“Entrenar con las muestras guardadas”**. El backend:
   - combina tus muestras reales con las 9 plantillas demo,
   - aumenta datos espejando la mano,
   - entrena un `RandomForestClassifier`,
   - guarda `ai/models/sign_model.pkl` y **recarga el modelo en caliente**.
9. Verificá en **Traductor** que la seña se reconozca. Si no aparece o confunde,
   grabá más repeticiones y volvé a entrenar.

> El panel **“Dataset actual”** muestra cuántas muestras hay por seña. En verde
> cuando llega a 150; en amarillo cuando todavía es poco.

### Cómo grabar bien (esto define la calidad)

- Una sola mano por seña (el modelo actual es de una mano).
- Mantené la seña quieta durante la captura; si la movés mucho, las muestras
  salen borrosas/mezcladas.
- No cambies la cámara ni el zoom entre repeticiones de la misma seña.
- Grabá con distintas personas si podés: mejora la generalización.
- Señas que dependen del movimiento (trayectoria) **no están soportadas**: el
  modelo mira una foto de la mano, no una secuencia.

---

## 4. Alternativa por consola

Si preferís no usar el navegador, podés entrenar con lo que ya esté guardado en
`ai/dataset/argentine/`:

```powershell
# desde la raíz del proyecto, con un entorno que tenga numpy y scikit-learn
python ai\training\train_model.py
```

El script imprime las clases, la validación cruzada y la precisión estimada, y
escribe el mismo `ai/models/sign_model.pkl`.

Para inspeccionar el dataset sin entrenar:

```powershell
Invoke-RestMethod http://localhost:8000/api/ai/dataset -Headers @{ Authorization = "Bearer <token>" }
```

---

## 5. Cómo elige el backend qué modelo usar

`backend/app/ai/model.py` respeta `AI_MODEL_MODE` (`backend/.env`):

| `AI_MODEL_MODE` | Comportamiento |
|---|---|
| `auto` (por defecto) | Usa `AI_MODEL_PATH` si existe; si no, `ai/models/sign_model.pkl`; si no, el demo |
| `trained` | Solo modelos entrenados (`AI_MODEL_PATH` o `ai/models/sign_model.pkl`) |
| `demo` | Fuerza el modelo de demostración (lo usan los tests) |

`GET /api/ai/info` devuelve `model: "trained"` o `model: "demo"` y la lista de
señas activas. Si dice `demo` después de entrenar, revisá que el `.pkl` exista y
que `AI_MODEL_MODE` no esté en `demo`.

`AI_MIN_CONFIDENCE` se informa en `/api/ai/info`, pero la decisión de aceptar o
descartar una predicción la toma el cliente (web/móvil).

---

## 6. El catálogo se actualiza solo (y cómo forzarlo a mano)

Cuando guardás muestras desde `/recorder.html`, el backend registra la seña en la
tabla `signs` si todavía no existe (`POST /api/ai/samples` →
`catalog_added: true`). Por eso **no hace falta insertar SQL** para que la seña
aparezca en el Traductor.

Si querés dejarla también en el seed (para instalaciones nuevas), agregala a
`database/seed.sql` y ejecutá el `INSERT`:

```sql
INSERT INTO signs (name, description, language)
VALUES ('BUENAS_NOCHES', 'Saludo usado al despedirse por la noche.', 'es-AR')
ON CONFLICT (name, language) DO NOTHING;
```

Si la tabla está vacía, `GET /api/signs` cae al fallback de `DEMO_SIGNS`
(`backend/app/ai/demo_templates.py`).

---

## 7. Agregar una seña al modo demo (solo para pruebas)

1. Agregá el nombre a `DEMO_SIGNS` en `backend/app/ai/demo_templates.py`.
2. Creá la plantilla `_<nombre>()` con 21 landmarks `[x, y, z]` (copiá una
   existente y ajustala).
3. Registrala en el mapa `templates` de `make_template()`.
4. Borrá `backend/app/ai/models/demo_sign_model.pkl` y reiniciá el backend para
   que se regenere.

> Las plantillas demo son sintéticas: sirven para probar el flujo, no para
> reconocer LSA real.

---

## 8. Endpoints nuevos

| Método | Ruta | Acceso | Para qué |
|---|---|---|---|
| `GET` | `/api/ai/dataset` | Admin | Resumen de muestras por seña |
| `POST` | `/api/ai/samples` | Admin | Guardar un lote de manos (21×3) para una seña |
| `POST` | `/api/ai/train` | Admin | Entrenar con lo guardado y recargar el modelo |
| `GET` | `/api/ai/info` | Público | Modelo activo, clases y features |
| `POST` | `/api/ai/predict` | Usuario | Clasificar `landmarks` (o `demo_sign`) |

Los endpoints de dataset, muestras y entrenamiento requieren JWT **y** una cuenta
con `is_admin: true` (email en `ADMIN_EMAILS`); si no, devuelven `403`.

---

## 9. Limitaciones actuales

- **Una mano**: si la seña usa dos, el sistema toma solo la más grande.
- **Sin movimiento**: no hay features temporales; señas dinámicas no se
  reconocen bien.
- **Sin rotación normalizada**: manos muy rotadas pueden confundir.
- **Dataset chico = overfitting**: con pocas muestras el modelo “memoriza”.
- **Cámara móvil**: el móvil manda `image_base64` y el backend necesita
  `mediapipe` instalado server-side; hoy no está en `requirements.txt`. La
  pantalla web no tiene ese problema porque MediaPipe corre en el navegador.
- **LSA64**: si vas a usar el dataset público, respetá su licencia y su
  estructura; hay que convertirlo al formato JSON de `ai/dataset/argentine/`.

---

## 10. Checklist rápido

- [ ] Cuenta incluida en `ADMIN_EMAILS` (o lista vacía en desarrollo).
- [ ] Nombre canónico definido (`BUENAS_NOCHES`, `PERDON`, …).
- [ ] Cámara activa y mano completa en el encuadre.
- [ ] 3–5 grabaciones de la misma seña (ideal 150+ muestras totales).
- [ ] `POST /api/ai/train` (o el botón “Entrenar”) sin errores.
- [ ] `/api/ai/info` muestra la seña y `model: "trained"`.
- [ ] Probada en el Traductor (el catálogo se actualizó solo al guardar).
- [ ] (Opcional) Fila agregada también en `database/seed.sql` para instalaciones nuevas.

---

## 11. Archivos clave

- `frontend/recorder.html` — entrada HTML de la herramienta interna.
- `frontend/src/recorder/main.jsx` — monta la herramienta (sin React Router).
- `frontend/src/recorder/RecorderApp.jsx` — login propio y aviso de uso interno.
- `frontend/src/pages/RecordSigns.jsx` — pantalla de grabación reutilizada.
- `frontend/src/services/ai.js` — `listDataset`, `saveSamples`, `trainModel`.
- `backend/app/api/routes/ai.py` — endpoints de dataset/entrenamiento.
- `backend/app/services/dataset_service.py` — guardado, resumen y alta automática en el catálogo.
- `backend/app/schemas/ai.py` — validación de nombres y lotes 21×3.
- `backend/app/ai/model.py` — selección/carga del modelo (`AI_MODEL_MODE`).
- `backend/app/ai/landmarks.py` — normalización a 63 features.
- `ai/training/train_model.py` — entrenamiento real + demo.
- `ai/dataset/argentine/` — muestras JSON por seña (ignorado por git).
- `ai/models/sign_model.pkl` — modelo entrenado que usa el backend.
- `database/schema.sql` y `database/seed.sql` — catálogo persistente.
- `mobile/src/constants/signs.ts` — fallback local de la app móvil.
