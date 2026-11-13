# Análisis: qué sacar, qué sobra y cómo mejorarlo

> Revisión del proyecto completo (`backend/`, `frontend/`, `mobile/`, `ai/`, `docs/`)
> con foco en tres cosas: código muerto o redundante, señales de "hecho por IA"
> y qué haría falta para que funcione bien en computadora **y** en móvil.
>
> Este documento es el diagnóstico original. Las fases 0, 1 y 2 ya se aplicaron;
> el estado de cada punto se resume en la sección 0. Lo que sigue se conserva
> como registro del razonamiento y de lo que queda pendiente.

---

## 1. Resumen

El proyecto no está mal: el backend está ordenado, hay tests, hay Docker y la
herramienta de grabación quedó bien separada. El problema principal es que hoy
hay **dos productos a medio terminar** (web y móvil) compartiendo un backend, y
que el camino que realmente funciona (MediaPipe en el navegador) está etiquetado
como "legado", mientras que el camino que no funciona (foto → backend) está
etiquetado como "cliente principal".

A eso se suma mucho andamiaje de demostración mezclado con el camino real, y
documentación/comentarios generados en bloque que ya no coinciden con el código.

Prioridad real, de mayor a menor impacto:

1. Decidir si el producto es **una web responsive/PWA** o **web + app nativa**.
2. Hacer que el catálogo coincida con lo que el modelo reconoce.
3. Sacar el andamiaje de demo y el token de reseteo de la respuesta HTTP.
4. Limpiar código muerto y consolidar documentación.

---

## 0. Estado de implementación

| Fase | Trabajo | Estado |
|---|---|---|
| 0 | Feedback muerto, `package-lock.json`, `BUILD_TAG`, `useAuth`, `train_demo.py`, `version` del compose, token de reseteo | **Aplicado** |
| 1 | Consolidar documentación, un solo script de entrenamiento, requirements opcionales | **Aplicado** |
| 2 | `display_name` + `recognized`, filtro de estabilidad, rol admin para grabador y `/train` | **Aplicado** |
| 3 | Decidir web-only vs web+nativa | **Decidido:** web principal; `mobile/` se conserva como cliente opcional |
| 4 | Calidad del modelo: dos manos, ventana temporal, dataset real | **Pendiente** |

Detalle de los cambios en [`../CHANGELOG.md`](../CHANGELOG.md) y estado actual en
[`../README.md`](../README.md).

---

## 2. Qué sacar (código muerto o redundante)

### 2.1 La app móvil como segundo cliente

- `mobile/` tiene ~65.000 archivos (casi todo `node_modules`) y una app Expo
  completa, pero su camino de reconocimiento manda **una foto en base64** al
  backend, y el backend necesita `mediapipe` del lado servidor, que **no está
  instalado**. Es decir: en móvil el reconocimiento no funciona hoy.
- El cliente web sí funciona porque corre MediaPipe **en el navegador**
  (`useHandTracking`), y ese mismo cliente ya abre en un celular.
- Mantener dos clientes duplica auth, tema, servicios HTTP, tipografías,
  mensajes de error y tests para una capacidad que hoy solo existe en uno.

**Decisión aplicada:** la **web** es el cliente principal y `mobile/` se conserva
como cliente opcional/experimental. No se borró para no perder el trabajo de
React Native ni sus pruebas. El camino de imagen sigue disponible como opción y
requiere `mediapipe` server-side (`backend/requirements-optional.txt`).

Las alternativas que se evaluaron fueron:

- **Opción A:** una sola web responsive + PWA instalable y archivar `mobile/`.
- **Opción B:** mantener Expo con tracking en el dispositivo (VisionCamera + ML
  Kit / MediaPipe Tasks) y borrar el camino foto → backend.

### 2.2 Feedback que no existe

`backend/app/models/feedback.py`, `backend/app/schemas/feedback.py` y la relación
`Translation.feedback` existen, se exportan en `models/__init__.py` y
`schemas/__init__.py`, pero **no hay endpoint ni UI que los use**. O se
implementa `POST /api/translation/{id}/feedback`, o se borra todo el módulo.

**Estado:** se eliminó el módulo, la relación y la tabla `translation_feedback`.

### 2.3 Archivos sueltos

- `package-lock.json` en la raíz: lockfile vacío sin `package.json` que lo
  respalde. Borrar.
- `frontend/src/components/Layout.jsx`: `const BUILD_TAG = "camfix-v4"` y el
  badge que lo muestra en la navbar. Es un resto de depuración; borrar.
- `docker-compose.yml`: `version: "3.9"` está obsoleto en Compose v2. Borrar la
  línea.
- `.env` en la raíz con credenciales de Postgres: correcto que esté ignorado,
  pero conviene que solo exista `.env.example` y que el `.env` real se genere
  localmente.

**Estado:** se borraron el lockfile, el `BUILD_TAG` y su CSS, y la línea
`version` del compose. `mobile/` se mantiene como cliente opcional.

### 2.4 Tres formas de entrenar y dos ubicaciones de modelo

- `ai/training/train_demo.py`
- `ai/training/train_model.py`
- entrenamiento en caliente dentro de `backend/app/ai/model.py`

Y dos modelos: `backend/app/ai/models/demo_sign_model.pkl` y
`ai/models/sign_model.pkl`.

**Recomendación:** un solo script (`ai/training/train_model.py`), un solo
directorio de modelos (`ai/models/`, configurable con `AI_MODEL_PATH`) y un solo
endpoint `POST /api/ai/train`. El modo demo puede seguir existiendo, pero como
fallback explícito, no como tercera vía de entrenamiento.

**Estado:** se eliminó `train_demo.py`; `train_model.py` y `POST /api/ai/train`
son las dos vías vigentes y comparten el mismo formato de modelo.

### 2.5 Autenticación duplicada en el frontend

`frontend/src/hooks/useAuth.js` lee el estado de `AppContext`, pero las páginas
`Login` y `Register` usan ambos. Hay dos formas de preguntar "¿está logueado?".
Dejar solo `AppContext` (o solo el hook) y borrar el otro.

**Estado:** se eliminó `useAuth.js`; las páginas usan `useApp` directamente.

### 2.6 Andamiaje de demo en el camino real

- `POST /api/ai/predict` acepta `demo_sign` y genera una pose sintética.
- El Traductor tiene "Probar sin cámara".
- `GET /api/signs` cae a `DEMO_SIGNS` (9 señas) si la tabla está vacía.
- `POST /api/auth/forgot-password` devuelve **`demo_reset_token` en la respuesta
  HTTP**. Esto es lo más grave de la lista: cualquiera que conozca un email
  puede resetear la contraseña. Debe quedar detrás de `APP_ENV=dev` o,
  directamente, fuera.

**Recomendación:** mover todo esto detrás de un flag `DEMO_MODE` que en
producción esté apagado, y sacar el token de la respuesta siempre.

**Estado:** se agregó `DEMO_MODE` y `APP_ENV`. El token solo se devuelve en
desarrollo con `DEMO_MODE=true`; `demo_sign` se rechaza si el flag está apagado.
El catálogo ahora marca con `recognized` lo que el modelo no conoce.

### 2.7 Documentación redundante

`docs/` tiene 15 archivos y ~3.100 líneas. Varios se pisan entre sí y algunos
contradicen el código:

| Archivo | Qué se hizo |
|---|---|
| `auditoria-proyecto.md` | Archivado en `docs/archivo/`. |
| `plan-de-migracion.md` | Archivado en `docs/archivo/`. |
| `github-paso-a-paso.md` | Archivado en `docs/archivo/`; el repo no es git. |
| `cambios-grabador-de-senas.md` | Archivado; su contenido se resumió en `CHANGELOG.md`. |
| `inicio-del-sistema-y-docker.md` + `instalacion-y-ejecucion.md` | Se conserva `instalacion-y-ejecucion.md`; el otro quedó archivado. |
| `architecture.md` + `decisiones-tecnicas.md` | `architecture.md` es el documento vigente; el otro quedó archivado. |
| `api.md`, `database.md`, `pruebas-y-errores.md`, `guia-de-uso.md` | Conservados y actualizados. |
| `como-agregar-mas-senas.md` | Conservado y actualizado. |

Objetivo: 5–6 documentos vigentes, no 15. El índice está en
[`README.md`](README.md) y los históricos en [`archivo/`](archivo/).

### 2.8 Tres fuentes de verdad para el esquema

- `Base.metadata.create_all()` al arrancar.
- `database/schema.sql`.
- `database/seed.sql`.

Sin Alembic, cualquier cambio de columna deja las tres desincronizadas.
**Recomendación:** Alembic para migraciones y dejar `seed.sql` solo como datos
iniciales. Si no querés migraciones todavía, al menos borrar `schema.sql` y
documentar que `create_all` es la fuente.

### 2.9 Dependencias pesadas para funciones opcionales

`psycopg2-binary`, `opencv-python-headless` y `gtts` están en
`requirements.txt` aunque el camino por defecto (SQLite + MediaPipe en el
navegador + voz del navegador) no las usa. Pasarlas a extras
(`requirements-postgres.txt`, `requirements-imagen.txt`) o a un solo
`requirements.txt` con comentarios claros de qué se pierde sin ellas.

### 2.10 Estilos mezclados

`global.css` tiene 529 líneas y, al mismo tiempo, `Layout.jsx` y
`ResultPanel.jsx` usan `style={{...}}` inline. Elegir uno: clases CSS (mejor para
temas y responsive) o CSS-in-JS. Mezclarlos hace que el modo oscuro se rompa en
algunos paneles.

---

## 3. Señales de "hecho por IA" (y cómo sacarlas)

No es un problema de estilo: es lo que hace que el proyecto se sienta inflado y
difícil de mantener.

1. **Comentarios que repiten el código.** Casi todos los archivos empiezan con un
   docstring que explica lo obvio ("Servicio de traducciones: CRUD del historial
   y consulta de catálogo") y tienen banners `# ====`. Regla: comentar el *por
   qué*, no el *qué*. Un archivo de 20 líneas no necesita 6 de docstring.
2. **`BUILD_TAG` visible en la UI.** Es el detalle que más "delata" que es un
   proyecto en construcción.
3. **IA falsa.** `demo_templates.py` genera poses sintéticas de la mano y se
   presenta como el modelo. Eso está bien como *fixture de tests*, pero no como
   funcionalidad principal. Hoy el catálogo tiene 86 señas y el modelo conoce 9:
   el usuario ve 86 y solo 9 pueden funcionar.
4. **Documentos que se auto-auditan.** "Auditoría del proyecto", "plan de
   migración", "decisiones técnicas" con tablas y emojis. Un README + un
   CHANGELOG cuentan lo mismo sin la puesta en escena.
5. **Nombres que derivaron.** La misma cosa se llama `grabar-senas`, `recorder`,
   `RecordSigns`, `capture` y `samples` según el archivo. Fijar un glosario:
   *seña*, *muestra*, *grabador*, *catálogo*.
6. **Parches sobre parches.** `translations.py` reemplaza `_` por espacio para
   mostrar `BUENOS_NOCHES` como "Buenos Noches". Eso indica que falta una
   columna `display_name` en `signs`. El parche funciona, pero es deuda.
7. **Tono de "todo listo".** El README dice que el cliente principal es el
   móvil, pero el móvil no reconoce señas. Eso es lo primero que nota alguien
   que clona el repo.

---

## 4. Qué mejorar para que sirva en computadora y en móvil

### 4.1 Un solo producto

La web ya corre en ambos. Si el objetivo es "que se pueda usar en los dos", la
opción más barata y sólida es:

- Web responsive (ya está el `@media` en `global.css`).
- PWA: `manifest.json` + service worker + ícono, para instalarla en el celular.
- MediaPipe en el navegador (ya funciona).
- Backend solo para auth, catálogo, historial y modelo.

La app nativa solo se justifica si necesitás cámara trasera estable, notificación
o publicación en stores. Si no, es mantenimiento duplicado.

### 4.2 Catálogo coherente con el modelo

Hoy `GET /api/signs` devuelve todo lo que hay en la tabla (86) y el modelo
reconoce 9. Cambios concretos:

- Agregar `display_name` a `signs` y dejar de reemplazar guiones bajos.
- Agregar `status` (`draft` / `published`) y que el grabador cree en `draft`.
- Exponer en `/api/signs` un campo `recognized` o filtrar por las clases del
  modelo, y mostrar en la UI "todavía no entrenada" en vez de dejar que el
  usuario intente una seña que nunca va a salir.
- Test que verifique `clases_del_modelo ⊆ signs.published`.

**Estado:** `/api/signs` devuelve `display_name` y `recognized`; la web muestra
las señas no entrenadas en amarillo. No se agregó todavía la columna `status`.

### 4.3 Estabilidad del reconocimiento

Predecir cada 450 ms está bien, pero hoy **una sola predicción cambia el
resultado y dispara el auto-habla**. Agregar:

- Confirmación por N cuadros consecutivos de la misma clase.
- Un pequeño `debounce` para el habla (no repetir la misma seña en < 2 s).
- Umbral distinto para mostrar y para guardar.

**Estado:** el Traductor exige 2 cuadros consecutivos (`STABLE_FRAMES = 2`).
El debounce del habla sigue siendo por cambio de seña; no hay temporizador de 2 s.

### 4.4 El límite real del modelo

63 features = **una mano, un cuadro**. La LSA usa dos manos y movimiento. Antes
de pulir la UI conviene decidir si el alcance es "señas estáticas de una mano"
(aceptable para un MVP) o si se va a secuencias. Si es lo segundo, el contrato de
features cambia y hay que versionarlo.

### 4.5 Seguridad

- **Aplicado:** `demo_reset_token` solo se devuelve en desarrollo con
  `DEMO_MODE=true`.
- **Aplicado:** `POST /api/ai/train`, `/ai/dataset` y `/ai/samples` son
  admin-only (`ADMIN_EMAILS`). Sigue siendo síncrono y bloquea al worker.
- **Aplicado:** `/recorder.html` exige `is_admin` y muestra "Sin acceso" si no
  lo es.
- **Pendiente:** JWT en `localStorage` en la web es vulnerable a XSS. Evaluar
  cookie `httpOnly` o tokens cortos.
- **Pendiente:** revisar `CORS_ORIGINS` por defecto: no debería incluir `*` con
  credenciales.

### 4.6 Tests que faltan

Los 34 + 15 + tests de móvil cubren bien utilidades y caminos felices, pero no
lo que más se rompe:

- Contrato de features (63 floats, selección de mano).
- Un E2E: login → predecir → guardar historial.
- Catálogo vs clases del modelo.
- Que el token de reseteo no viaje en la respuesta.

### 4.7 Accesibilidad e idioma

- `aria-live` en el panel de resultado (hoy el cambio de texto no se anuncia).
- Camino alternativo por teclado para el modo demo.
- Respetar `prefers-reduced-motion` (hay `fade-in` y animaciones).
- El campo `language` existe en todas las tablas pero solo se usa `es-AR`.
  Decidir: o se soporta más de un idioma, o se simplifica.

---

## 5. Plan sugerido

| Fase | Trabajo | Riesgo | Valor | Estado |
|---|---|---|---|---|
| 0 (1–2 h) | Borrar feedback muerto, `package-lock.json` raíz, `BUILD_TAG`, `useAuth` duplicado, `train_demo.py`, `version` del compose. Sacar `demo_reset_token`. | Bajo | Alto | Aplicado |
| 1 (1 día) | Consolidar docs, un solo script de entrenamiento, requirements por extra. | Bajo | Medio | Aplicado |
| 2 (2–3 días) | `display_name` + `status` en `signs`, `/signs` con `recognized`, filtro de estabilidad, rol admin para grabador y `/train`. | Medio | Alto | Aplicado (sin `status`) |
| 3 (1–2 semanas) | Decidir web-only vs web+nativa. | Alto | Muy alto | Decidido: web principal; móvil opcional |
| 4 | Calidad del modelo: dos manos, ventana temporal, dataset real. | Alto | Muy alto | Pendiente |

---

## 6. Qué NO sacar

- `docs/como-agregar-mas-senas.md`: es el documento más útil del repo.
- La herramienta `/recorder.html` separada de la app pública: buena decisión.
- MediaPipe en el navegador: es el único camino de reconocimiento que funciona.
- Los tests existentes: sirven, hay que ampliarlos, no borrarlos.
- El catálogo de 86 señas: es contenido valioso; el problema es que no está
  conectado al modelo, no que sobre.

---

## 7. La decisión que destrababa todo

La pregunta era:

> **¿La app móvil nativa es un requisito real o fue una forma de "tener una app"?**

**Respuesta:** no es un requisito. El profesor la sugirió como opción, no era
obligatoria. Por eso:

- El cliente principal es la **web responsive**, que corre en computadora y
  celular.
- `mobile/` se conserva como cliente opcional/experimental, sin borrar el trabajo
  de React Native ni sus pruebas.
- El esfuerzo siguiente conviene ponerlo en que el modelo reconozca más de 9
  señas y en la calidad del dataset, no en duplicar clientes.

Casi todo lo demás (limpieza, docs, seguridad) se hizo en paralelo sin esperar
esa respuesta.
