# API REST

> Backend FastAPI del Traductor de Lenguaje de Señas.
> Swagger: `http://localhost:8000/docs` · ReDoc: `http://localhost:8000/redoc`

---

## 1. Convenciones

- Base local: `http://localhost:8000`
- Prefijo de todas las rutas: `/api`
- Formato: JSON, excepto el login (`application/x-www-form-urlencoded`) y el
  audio TTS (`audio/mpeg`).
- Endpoints privados: `Authorization: Bearer <JWT>`.
- Errores de negocio: `{"detail": "mensaje"}`.
- Errores de validación de FastAPI: `422` con `detail` como lista de objetos
  (`loc`, `msg`, `type`). El cliente web convierte esa lista en un mensaje legible.
- Expiración del JWT: `ACCESS_TOKEN_EXPIRE_MINUTES` (60 por defecto).

---

## 2. Resumen de endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/health` | No | Estado del backend y la base |
| GET | `/health` | No | Alias corto de `/api/health` |
| POST | `/api/auth/register` | No | Registrar usuario |
| POST | `/api/auth/login` | No | Login OAuth2 y JWT |
| GET | `/api/auth/me` | Sí | Usuario autenticado (`is_admin`) |
| POST | `/api/auth/forgot-password` | No | Generar código de recuperación |
| POST | `/api/auth/reset-password` | No | Cambiar contraseña con código |
| POST | `/api/ai/predict` | Sí | Clasificar una seña |
| GET | `/api/ai/info` | No | Información del modelo |
| GET | `/api/ai/dataset` | Admin | Resumen de muestras guardadas |
| POST | `/api/ai/samples` | Admin | Guardar muestras de una seña |
| POST | `/api/ai/train` | Admin | Entrenar y recargar el modelo |
| GET | `/api/signs` | Sí | Catálogo (`display_name`, `recognized`) |
| POST | `/api/translation` | Sí | Guardar traducción |
| GET | `/api/translation/history` | Sí | Historial del usuario |
| GET | `/api/translation/{id}` | Sí | Traducción por id |
| DELETE | `/api/translation/{id}` | Sí | Eliminar traducción |
| GET | `/api/translation/{id}/speak` | Sí | Audio MP3 con gTTS |

---

## 3. Salud

### `GET /api/health`

| Campo | Valor |
|---|---|
| Autenticación | No |
| Respuesta | `200` siempre si el proceso está vivo |

```json
{
  "status": "ok",
  "ai_model": "demo",
  "database": "connected"
}
```

Si la base no responde:

```json
{
  "status": "degraded",
  "ai_model": "demo",
  "database": "unavailable"
}
```

Notas:

- **No devuelve 503** cuando la base falla; devuelve `200` con
  `database: "unavailable"`.
- La primera llamada puede tardar si el clasificador entrena el modelo demo.
- `GET /health` (sin `/api`) es un alias de esta ruta, para clientes que
  consultan la ruta corta. No aparece en Swagger.

---

## 4. Autenticación

### `POST /api/auth/register`

| Campo | Valor |
|---|---|
| Autenticación | No |
| Body | JSON |
| Éxito | `201 Created` |

```json
{
  "nombre": "Ana Pérez",
  "email": "ana@example.com",
  "password": "clave123"
}
```

Reglas:

- `nombre`: 3–100 caracteres, se recorta.
- `email`: formato válido; se guarda en minúsculas.
- `password`: 6–128 caracteres.

Respuesta:

```json
{
  "id": 1,
  "nombre": "Ana Pérez",
  "email": "ana@example.com",
  "created_at": "2026-10-22T10:00:00Z",
  "is_admin": false
}
```

Errores:

| Código | Caso |
|---|---|
| `409` | Email ya registrado |
| `422` | Datos inválidos (nombre, email o contraseña) |

### `POST /api/auth/login`

| Campo | Valor |
|---|---|
| Autenticación | No |
| Content-Type | `application/x-www-form-urlencoded` |
| Campos | `username` (email) y `password` |
| Éxito | `200 OK` |

El cliente web construye el cuerpo con `encodeURIComponent` y envía:

```text
username=ana%40example.com&password=clave123
```

Respuesta:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "nombre": "Ana Pérez",
    "email": "ana@example.com",
    "created_at": "2026-10-22T10:00:00Z",
    "is_admin": false
  }
}
```

Errores:

| Código | Caso |
|---|---|
| `401` | Email o contraseña incorrectos |
| `422` | Faltan campos del formulario |

### `GET /api/auth/me`

| Campo | Valor |
|---|---|
| Autenticación | Requerida |
| Respuesta | Usuario actual |

```json
{
  "id": 1,
  "nombre": "Ana Pérez",
  "email": "ana@example.com",
  "created_at": "2026-10-22T10:00:00Z",
  "is_admin": false
}
```

Errores: `401` si el token falta, es inválido o expiró.

### `POST /api/auth/forgot-password`

| Campo | Valor |
|---|---|
| Autenticación | No |
| Body | `{"email": "ana@example.com"}` |
| Éxito | `200 OK` |

```json
{
  "message": "Si el email está registrado, se generó un código de recuperación.",
  "demo_reset_token": "abc123...",
  "expires_in_minutes": 30
}
```

`demo_reset_token` **solo** se devuelve con `DEMO_MODE=true` y
`APP_ENV` distinto de `production`. En producción debe viajar por correo y el
campo llega en `null`.

### `POST /api/auth/reset-password`

| Campo | Valor |
|---|---|
| Autenticación | No |
| Body | `{"token": "abc123...", "new_password": "nueva123"}` |
| Éxito | `200 OK` |

Errores: `400` si el código no existe, expiró o la contraseña no cumple las
reglas.

---

## 5. Predicción de IA

### `POST /api/ai/predict`

| Campo | Valor |
|---|---|
| Autenticación | Requerida |
| Body | JSON |
| Éxito | `200 OK` |

El cuerpo debe incluir **exactamente uno** de estos caminos:

1. `demo_sign`: seña del catálogo demo (sin cámara).
2. `landmarks`: manos detectadas por MediaPipe.
3. `image_base64`: foto JPEG/PNG codificada en base64 (procesamiento en servidor).

#### Camino A: demostración

```json
{
  "demo_sign": "HOLA",
  "language": "es-AR"
}
```

Clases disponibles: `HOLA`, `GRACIAS`, `SI`, `NO`, `ADIOS`, `POR_FAVOR`,
`BUENOS_DIAS`, `BUENAS_TARDES`, `AYUDA`.

#### Camino B: landmarks

```json
{
  "language": "es-AR",
  "landmarks": [
    [
      [0.5000, 0.8500, 0.0000],
      [0.4300, 0.7000, 0.0000],
      "... 21 puntos en total, cada uno con [x, y, z] ..."
    ]
  ]
}
```

- `landmarks` es una lista de manos.
- Cada mano debe tener **21 puntos**.
- Cada punto debe tener **3 coordenadas**.
- Si hay varias manos, el backend usa la más prominente.
- No se aceptan vectores planos de 63 números; el esquema exige `[mano][punto][coord]`.

#### Camino C: imagen

```json
{
  "image_base64": "/9j/4AAQSkZJRgABAQ...",
  "language": "es-AR"
}
```

- Acepta JPEG o PNG en base64.
- OpenCV decodifica y redimensiona a un ancho máximo de 640 px.
- Requiere `mediapipe` instalado en el backend.
- Si no hay manos o `mediapipe` falta, devuelve error explicativo.

#### Respuesta

```json
{
  "sign": "HOLA",
  "translated_text": "Hola",
  "confidence": 0.94,
  "model": "demo",
  "processing_time_ms": 3.21
}
```

#### Errores

| Código | Caso |
|---|---|
| `400` | No se envió ningún camino válido; seña demo desconocida; sin manos |
| `401` | Sin token o token inválido |
| `422` | Landmarks con forma incorrecta o campos inválidos |
| `503` | `image_base64` sin `mediapipe` o error de decodificación de imagen |

Notas:

- `confidence` está en `[0, 1]`.
- El backend **no aplica** `AI_MIN_CONFIDENCE`; devuelve siempre la clase más
  probable. El cliente decide si guarda o advierte.
- `processing_time_ms` mide solo el trabajo del servicio de IA.

### `GET /api/ai/info`

| Campo | Valor |
|---|---|
| Autenticación | No |
| Respuesta | Metadatos del modelo |

```json
{
  "model": "demo",
  "signs": [
    "HOLA",
    "GRACIAS",
    "SI",
    "NO",
    "ADIOS",
    "POR_FAVOR",
    "BUENOS_DIAS",
    "BUENAS_TARDES",
    "AYUDA"
  ],
  "features": 63,
  "min_confidence": 0.45
}
```

`min_confidence` es informativo: refleja `AI_MIN_CONFIDENCE`, pero el backend no
filtra predicciones con ese valor.

---

## 6. Catálogo de señas

### `GET /api/signs`

| Campo | Valor |
|---|---|
| Autenticación | Requerida |
| Query | `language` (2–10 caracteres, por defecto `es-AR`) |
| Respuesta | Lista de señas |

```json
[
  {
    "id": 1,
    "name": "HOLA",
    "display_name": "Hola",
    "description": "Saludo estándar.",
    "language": "es-AR",
    "created_at": "2026-10-22T10:00:00Z",
    "recognized": true
  }
]
```

- `display_name` es el texto legible de la seña.
- `recognized` indica si el modelo activo puede reconocerla. Las señas cargadas
  pero no entrenadas devuelven `false` y la web las muestra en amarillo.

Si no hay filas para el idioma pedido, devuelve el vocabulario demo con:

- `id: 0` para todas las señas,
- `description: null`,
- `created_at` con la hora actual,
- `display_name` calculado y `recognized` según el modelo.

Esto evita el `500` que existía antes de la corrección. El fallback **no**
inserta filas en la base.

Errores: `401` sin token; `422` si `language` no cumple la longitud.

---

## 7. Historial

### `POST /api/translation`

| Campo | Valor |
|---|---|
| Autenticación | Requerida |
| Body | JSON |
| Éxito | `201 Created` |

```json
{
  "sign_detected": "HOLA",
  "translated_text": "Hola",
  "confidence": 0.94,
  "language": "es-AR"
}
```

El servicio guarda `sign_detected` en mayúsculas y recorta los textos.

Respuesta:

```json
{
  "id": 12,
  "user_id": 1,
  "sign_detected": "HOLA",
  "translated_text": "Hola",
  "confidence": 0.94,
  "language": "es-AR",
  "created_at": "2026-10-22T10:05:00Z"
}
```

Errores: `401` sin token; `422` por longitudes o `confidence` fuera de `[0, 1]`.

### `GET /api/translation/history`

| Campo | Valor |
|---|---|
| Autenticación | Requerida |
| Query | `limit` (1–200, por defecto 50), `language` (opcional) |
| Respuesta | Lista ordenada por fecha descendente e id descendente |

```json
[
  {
    "id": 12,
    "user_id": 1,
    "sign_detected": "HOLA",
    "translated_text": "Hola",
    "confidence": 0.94,
    "language": "es-AR",
    "created_at": "2026-10-22T10:05:00Z"
  }
]
```

La web solicita `limit=100` y filtra por usuario en el backend.

### `GET /api/translation/{id}`

Devuelve una traducción solo si pertenece al usuario autenticado.

- `200`: objeto de traducción.
- `401`: sin token.
- `404`: no existe o pertenece a otro usuario.

### `DELETE /api/translation/{id}`

```json
{
  "message": "Traducción 12 eliminada"
}
```

- `200`: eliminada.
- `401`: sin token.
- `404`: no existe o pertenece a otro usuario.

### `GET /api/translation/{id}/speak`

| Campo | Valor |
|---|---|
| Autenticación | Requerida |
| Respuesta | `audio/mpeg` |
| Cabecera | `Content-Disposition: inline; filename=traduccion.mp3` |

Genera el audio con gTTS. Requiere conexión a internet en el servidor.

Errores:

- `401`: sin token.
- `404`: traducción inexistente o de otro usuario.
- `503`: gTTS no disponible (sin red, error del motor).

La web usa la Web Speech API del navegador; este endpoint queda como
alternativa para clientes que necesiten audio del servidor.

---

## 8. Ejemplos completos

### PowerShell

```powershell
$base = "http://localhost:8000/api"

$register = @{
  nombre = "Ana"
  email = "ana@demo.com"
  password = "clave123"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "$base/auth/register" `
  -ContentType "application/json" -Body $register

$login = Invoke-RestMethod -Method Post -Uri "$base/auth/login" `
  -Body @{ username = "ana@demo.com"; password = "clave123" }

$headers = @{ Authorization = "Bearer $($login.access_token)" }

Invoke-RestMethod -Method Post -Uri "$base/ai/predict" `
  -Headers $headers -ContentType "application/json" `
  -Body (@{ demo_sign = "GRACIAS"; language = "es-AR" } | ConvertTo-Json)

Invoke-RestMethod -Method Post -Uri "$base/translation" `
  -Headers $headers -ContentType "application/json" `
  -Body (@{
    sign_detected = "GRACIAS"
    translated_text = "Gracias"
    confidence = 0.92
    language = "es-AR"
  } | ConvertTo-Json)

Invoke-RestMethod -Method Get -Uri "$base/translation/history?limit=10" `
  -Headers $headers
```

### cURL

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=ana@demo.com&password=clave123"
```

---

## 9. Códigos de error

| Código | Significado |
|---|---|
| `400` | Petición inválida para la lógica del endpoint |
| `401` | Credenciales o token inválidos/expirados |
| `403` | Sin permisos (reservado) |
| `404` | Recurso inexistente o de otro usuario |
| `409` | Conflicto, por ejemplo email duplicado |
| `422` | Validación de Pydantic fallida |
| `503` | Dependencia externa no disponible (MediaPipe o gTTS) |

---

## 10. Mapa con el cliente web

| Función de la web | Endpoint |
|---|---|
| Iniciar sesión | `POST /api/auth/login` |
| Registrarse | `POST /api/auth/register` |
| Restaurar sesión | `GET /api/auth/me` |
| Recuperar contraseña | `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` |
| Catálogo y modelo | `GET /api/signs`, `GET /api/ai/info` |
| Seña en vivo (landmarks) | `POST /api/ai/predict` con `landmarks` |
| Seña demo | `POST /api/ai/predict` con `demo_sign` |
| Guardar | `POST /api/translation` |
| Historial | `GET /api/translation/history` |
| Eliminar | `DELETE /api/translation/{id}` |
| Escuchar | Web Speech API local; alternativa `GET /api/translation/{id}/speak` |
| Grabador interno | `GET /api/ai/dataset`, `POST /api/ai/samples`, `POST /api/ai/train` (admin) |

La app móvil opcional consume los mismos endpoints. Su modo cámara usa
`image_base64` y requiere `mediapipe` en el servidor.
