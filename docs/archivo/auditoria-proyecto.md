# Auditoría del proyecto

> Fecha de la auditoría inicial: **2026-10-22**
> Actualización: misma fecha, después de la corrección del backend, la creación
> de la app móvil y la ejecución de pruebas.
> Alcance: `mobile/`, `backend/`, `frontend/`, `ai/`, `database/`, `docs/`,
> configuración Docker y pruebas.

---

## 1. Método

1. Inventario de archivos, excluyendo `node_modules`, `.venv`, cachés y
   artefactos de build.
2. Lectura de configuración, rutas, servicios, modelos, esquemas, pantallas,
   hooks, scripts de IA y pruebas.
3. Ejecución de pruebas de backend, app móvil y cliente web.
4. Verificación de tipos de la app móvil.
5. Export del bundle Android con Expo.
6. Reproducción y corrección del fallo de `/api/signs` con una base SQLite vacía.
7. Clasificación de hallazgos:
   - **Verificado:** se ejecutó o se leyó el archivo exacto.
   - **No verificado:** requiere dispositivo, Docker o servicio externo.
   - **Limitación:** comportamiento conocido y documentado.

### Entorno

| Herramienta | Versión / estado |
|---|---|
| Windows | PowerShell 5.1 |
| Node.js | 24.15.0 |
| npm | 11.12.1 |
| Python | 3.12.1 (sistema: también 3.13.0) |
| Git | 2.53.0 |
| Docker | **no instalado** |
| `backend/.venv` | **roto**: apunta a `C:\Python314\python.exe` |
| Venv de pruebas | `%TEMP%\opencode\sl-venv` con Python 3.12 |

---

## 2. Resultado general

El proyecto **no es un prototipo vacío**. El backend funciona, las pruebas pasan
y el flujo de demostración de IA está implementado de punta a punta. La app móvil
fue creada y cubre autenticación, demo, foto, voz, historial y configuración.

Lo que **no** está demostrado:

- Reconocimiento real de LSA: el modelo incluido usa plantillas sintéticas.
- Cámara y TTS en un teléfono físico.
- Ruta `image_base64` con `mediapipe` instalado.
- Docker Compose y PostgreSQL real en esta máquina.
- Publicación de la app en tiendas.

El bug de `/api/signs` fue corregido y tiene prueba de regresión.

---

## 3. Pruebas ejecutadas

| Suite | Comando | Resultado | Estado |
|---|---|---|---|
| Backend | `pytest -q` | **24 passed** | Verificado |
| App móvil: tipos | `npm run typecheck` | Sin errores | Verificado |
| App móvil: Jest | `npm test -- --runInBand` | **24 passed / 7 suites** | Verificado |
| Cliente web | `npm test -- --run` | **15 passed / 5 archivos** | Verificado |
| Export Android | `npx expo export --platform android` | Bundle correcto | Verificado |
| Docker Compose | `docker compose up` | No ejecutado | No verificado |
| Cámara en dispositivo | Manual | No ejecutado | No verificado |
| MediaPipe `image_base64` | Manual | No ejecutado | No verificado |
| TTS nativo | Manual | No ejecutado | No verificado |
| PostgreSQL real | Manual | No ejecutado | No verificado |

### Desglose del backend

| Archivo | Pruebas |
|---|---|
| `test_auth.py` | 8 |
| `test_ai.py` | 7 |
| `test_translations.py` | 7 |
| `test_signs.py` | 2 |
| **Total** | **24** |

### Desglose móvil

| Archivo | Tema |
|---|---|
| `validation.test.ts` | Formularios |
| `format.test.ts` | Fechas y porcentajes |
| `errors.test.ts` | Errores de red/API |
| `auth-service.test.ts` | Login y registro |
| `theme.test.ts` | Tema |
| `TextField.test.tsx` | Campo de texto |
| `SignResultCard.test.tsx` | Tarjeta de resultado |

---

## 4. Cambios realizados

| Cambio | Archivos | Verificación |
|---|---|---|
| Fallback de `/api/signs` devuelve `SignOut` con `created_at` | `backend/app/api/routes/health.py` | Prueba de regresión |
| Prueba de catálogo sin seed | `backend/tests/test_signs.py` | 2 passed |
| App móvil completa | `mobile/**` | Typecheck + 24 tests + export |
| Servicios HTTP con JWT y normalización de errores | `mobile/src/services/**` | Tests de auth/errors |
| Sesión segura | `mobile/src/context/AuthContext.tsx`, `storage.ts` | Revisión de código |
| Tema claro/oscuro | `mobile/src/constants/theme.ts`, `useTheme` | Test de tema |
| Documentación actualizada | `README.md`, `docs/**`, `mobile/README.md` | Revisión |

---

## 5. Inventario y estado

| Componente | Estado | Archivos | Observaciones | Riesgo |
|---|---|---|---|---|
| App móvil | Funcional en desarrollo | `mobile/src/**` | Expo 58, RN 0.88, TS 6 | Medio: falta prueba física |
| Autenticación móvil | Implementada | `AuthContext`, `services/auth.ts` | Login form-urlencoded, SecureStore | Bajo |
| Traductor demo | Implementado | `TranslatorScreen`, `services/ai.ts` | Requiere backend | Bajo |
| Cámara móvil | Implementada, no probada | `TranslatorScreen`, `expo-camera` | Envía `image_base64` | Alto: depende de MediaPipe |
| Voz móvil | Implementada, no probada | `useSpeech` | `expo-speech` | Bajo/Medio |
| Historial móvil | Implementado | `HistoryScreen`, `useTranslationHistory` | Refresco y borrado | Bajo |
| Configuración | Implementada | `SettingsScreen`, `SettingsContext` | Tema, voz, idioma, autosave | Bajo |
| Navegación | Implementada | `navigation/**` | Stack + tabs | Bajo |
| Backend | Funcional | `backend/app/**` | 24 pruebas | Bajo |
| `/api/signs` | Corregido | `health.py` | Fallback con `id=0` | Bajo |
| `/api/ai/predict` | Funcional | `ai.py`, `ai_service.py` | No aplica umbral | Bajo |
| `image_base64` | No operativo por defecto | `image_processor.py` | Falta `mediapipe` | Medio |
| TTS gTTS | Implementado | `tts_service.py` | Requiere internet | Bajo |
| Modelo demo | Funcional | `app/ai/**` | 9 clases sintéticas | Alto para uso real |
| PostgreSQL | Esquema correcto | `database/schema.sql` | Sin migraciones | Bajo |
| Feedback | Modelo/tabla sin endpoints | `models/feedback.py` | Trabajo futuro | Bajo |
| Frontend web | Funcional, legado | `frontend/**` | 15 pruebas | Bajo |
| Docker | Configurado, no verificado | `docker-compose.yml` | Sin `.dockerignore` | Medio |
| Git | **No inicializado** | — | No hay `.git` | Bajo |
| Documentación | Actualizada | `README.md`, `docs/**` | Distingue verificado/no verificado | Bajo |

---

## 6. Hallazgos del backend

### 6.1 Lo que funciona

- Registro con BCrypt y email único.
- Login OAuth2 con JWT y usuario en la respuesta.
- `/api/auth/me` protegido.
- Predicción con `demo_sign`, `landmarks` e `image_base64`.
- Historial con pertenencia por usuario.
- Eliminación y TTS.
- `/api/signs` con fallback demo.
- `/api/health` consulta la base.

### 6.2 Problemas y límites

1. **`AI_MODEL_MODE` no se usa.** `SignClassifier._load()` decide por la
   existencia de `AI_MODEL_PATH` o del `.pkl` demo. La variable del `.env` no
   cambia el comportamiento.
2. **`AI_MIN_CONFIDENCE` no se aplica en el servidor.** Se informa en
   `/api/ai/info`, pero la predicción siempre devuelve la clase más probable.
3. **`image_base64` no está lista por defecto.** `mediapipe` no está en
   `requirements.txt`; sin él, el endpoint devuelve `503`. No hay prueba
   automática de esta ruta.
4. **Dos manos no se usan como 126 features.** Se elige la más prominente.
5. **Rutas relativas del modelo.** `AI_MODEL_PATH` se resuelve respecto del
   directorio desde el que se ejecuta Uvicorn, no de la raíz del proyecto.
6. **Feedback incompleto.** Hay modelo y tabla, pero no endpoints.
7. **`/api/ai/info` es público.** Coherente con la documentación, pero revisar
   si se expone a internet.
8. **Sin migraciones.** `create_all` en desarrollo y `schema.sql` en producción.
9. **El fallback de `/api/signs` usa `id=0`.** Es correcto para lectura, pero no
   debe usarse para escritura.
10. **`test_sl.db` puede quedar en `backend/`.** Está ignorado por Git.

---

## 7. Hallazgos de la app móvil

### 7.1 Lo que funciona (verificado por pruebas)

- Validación de formularios.
- Login form-urlencoded y registro.
- Normalización de errores de red, timeout y API.
- Tema claro/oscuro/sistema.
- Render de campos y tarjeta de resultado.
- Typecheck estricto.

### 7.2 Límites y riesgos

1. **Sin prueba en dispositivo.** Cámara, permisos, orientación, TTS y
   SecureStore real no están verificados.
2. **Cámara frontal con `mirror`.** Puede reflejar la imagen y afectar la
   geometría de la mano.
3. **Foto única.** No hay traducción en vivo.
4. **Dependencia de MediaPipe server-side.** Si falta, la cámara no traduce.
5. **Sin refresh token.** El JWT expira a los 60 minutos.
6. **Autoguardado con umbral local.** La lógica de confianza no está en el
   backend.
7. **Web limitada.** SecureStore cae a AsyncStorage; no es el objetivo principal.
8. **Historial sin paginación.** Pide hasta 100 elementos.
9. **No hay soporte offline** para predicción ni historial.
10. **No hay pruebas de navegación completa.**

---

## 8. Hallazgos del cliente web legado

- 15 pruebas pasan.
- `Login.jsx` llama a `navigate()` durante el render cuando ya está
  autenticado; conviene moverlo a `useEffect`.
- Usa `localStorage` para el token; aceptable para el cliente legado, no para
  móvil.
- La cámara y MediaPipe dependen del navegador.
- El endpoint `/speak` no se usa realmente; se usa Web Speech API.
- Emite un aviso no fatal de jsdom por `HTMLMediaElement.play`.
- No se eliminó para no romper Docker ni las pruebas existentes.

---

## 9. IA y datos

- El modo demo entrena un `RandomForestClassifier` con 9 clases, 150 muestras
  ruidosas y 8 copias exactas por clase.
- `normalize_hand()` centra en la muñeca y escala por el máximo absoluto.
  Invariancia a traslación y escala; **no** a rotación.
- `pick_most_prominent_hand()` elige la mano con mayor extensión.
- No hay dataset real incluido.
- La precisión del modo demo **no demuestra** capacidad de reconocer LSA.
- La tabla `signs` no tiene FK desde `translations`; la relación es lógica por
  nombre.
- `schema.sql` define `CHECK` de confianza y formato de email; `create_all` no
  los replica en SQLite.

---

## 10. Seguridad

Bien:

- BCrypt y JWT.
- Endpoints privados.
- Pydantic y validación móvil.
- SecureStore en móvil.
- La foto no se persiste.
- No se piden permisos innecesarios.

A mejorar:

- Cambiar `SECRET_KEY` de ejemplo.
- Usar HTTPS en producción.
- Restringir CORS.
- Evaluar refresh tokens y revocación.
- No exponer `/api/ai/info` si no es necesario.
- Revisar logs para no filtrar datos.

---

## 11. Riesgos de la migración

| Riesgo | Impacto | Mitigación | Estado |
|---|---|---|---|
| MediaPipe no corre en RN | Alto | Foto al backend o WebView/VisionCamera | Mitigado parcialmente |
| Cámara no probada | Alto | Probar en dispositivo | Pendiente |
| `mediapipe` ausente | Medio | Modo demo y error claro | Mitigado |
| URL del backend | Medio | `EXPO_PUBLIC_API_URL`, LAN, `10.0.2.2` | Documentado |
| HTTP sin TLS | Medio | HTTPS en producción | Pendiente |
| Token expirado | Bajo | Interceptor 401 | Implementado |
| Modelo demo | Alto | No presentarlo como real | Documentado |
| Frontend legado | Bajo | Aclarar alcance | Documentado |
| Sin Git | Bajo | Guía paso a paso | Pendiente de autorización |

---

## 12. Pendientes

- Probar la app en Android/iOS físico.
- Verificar permisos y captura de cámara.
- Instalar `mediapipe` y probar `image_base64`.
- Verificar TTS con voces en español.
- Verificar Docker Compose.
- Verificar PostgreSQL real.
- Medir latencia y batería.
- Decidir el futuro del frontend web.
- Inicializar Git solo con autorización.
- Evaluar modelo real, tiempo real, refresh tokens y migraciones.

---

## 13. Documentos relacionados

- [Arquitectura](../architecture.md)
- [API](../api.md)
- [Base de datos](../database.md)
- [Instalación y ejecución](../instalacion-y-ejecucion.md)
- [Pruebas y errores](../pruebas-y-errores.md)
- [Decisiones técnicas](decisiones-tecnicas.md)
- [Plan de migración](plan-de-migracion.md)
- [Guía de uso](../guia-de-uso.md)
- [Git y GitHub](github-paso-a-paso.md)
