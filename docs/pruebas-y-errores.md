# Pruebas y errores conocidos

> Resultados verificados el **2026-11-13** en Windows con PowerShell 5.1,
> Node 24.15.0, npm 11.12.1 y Python 3.12.1.

---

## 1. Resumen

| Suite | Comando | Resultado | Estado |
|---|---|---|---|
| Backend | `pytest -q` | 42 passed | Verificado |
| Web (principal): tests | `npm test -- --run` | 15 passed, 5 archivos | Verificado |
| Web (principal): build | `npm run build` | `index.html` + `recorder.html` | Verificado |
| App móvil: tipos | `npm run typecheck` | Sin errores | Verificado (opcional) |
| App móvil: tests | `npm test -- --runInBand` | 24 passed, 7 suites | Verificado (opcional) |
| Export Android | `npx expo export --platform android` | Bundle correcto | Verificado (opcional) |
| Cámara real en teléfono | Manual | No ejecutado | Pendiente |
| `image_base64` con MediaPipe | Manual | No ejecutado | Pendiente |
| TTS del navegador | Manual | No ejecutado | Pendiente |
| Docker Compose | `docker compose up` | No ejecutado | No verificable aquí |
| PostgreSQL real | Manual | No ejecutado en esta máquina | Pendiente |

No hay pruebas end-to-end en dispositivo ni pruebas de integración contra
PostgreSQL real. Las pruebas del backend usan SQLite.

---

## 2. Backend

### 2.1 Ejecutar

```powershell
cd backend
.venv\Scripts\Activate.ps1
pytest -q
```

Si el `.venv` del proyecto está roto, crear uno nuevo o usar un intérprete
temporal.

### 2.2 Cobertura actual

| Archivo | Pruebas | Qué cubre |
|---|---|---|
| `tests/test_auth.py` | 8 | Registro, duplicados, login, token inválido, `/me`, recuperación |
| `tests/test_ai.py` | 7 | Demo, landmarks, errores, autenticación, info |
| `tests/test_dataset.py` | 10 | Dataset, nombres de 1 carácter, muestras, alta en catálogo, entrenamiento |
| `tests/test_permissions.py` | 5 | Admin, `403`, gating de `demo_reset_token` |
| `tests/test_signs.py` | 4 | Auth, alias `/health`, fallback sin seed, `recognized` |
| `tests/test_translations.py` | 8 | Crear, listar, obtener, borrar, pertenencia, límites |
| **Total** | **42** | |

La prueba de regresión de `/api/signs` verifica que el fallback devuelve las 9
señas demo, que `created_at` no es nulo y que `display_name` está presente. Antes
de la corrección, ese caso producía `500` porque se devolvían objetos `Sign` sin
`created_at`.

`tests/test_signs.py` también agrega una seña que el modelo no conoce y comprueba
que `/api/signs` la devuelve con `recognized: false`.

### 2.3 Configuración de pruebas

`backend/tests/conftest.py` define:

```python
os.environ["DATABASE_URL"] = "sqlite:///./test_sl.db"
os.environ["SECRET_KEY"] = "clave-de-prueba"
os.environ["AI_MODEL_PATH"] = ""
os.environ["AI_MODEL_MODE"] = "demo"
os.environ["APP_ENV"] = "development"
os.environ["DEMO_MODE"] = "true"
os.environ["ADMIN_EMAILS"] = ""
```

Consecuencias:

- Se usa SQLite, no PostgreSQL.
- El modelo demo se entrena si no existe el `.pkl`.
- El archivo `backend/test_sl.db` puede quedar después de las pruebas. Está
  ignorado por Git (`*.db`).
- No se prueban restricciones `CHECK` propias de PostgreSQL.
- Los tests de permisos modifican `ADMIN_EMAILS` y `DEMO_MODE` con
  `monkeypatch`, por lo que no dependen del `.env` local.
- `APP_ENV`, `DEMO_MODE` y `ADMIN_EMAILS` se fijan a un entorno controlado
  antes de importar la app: configurar un administrador real en `backend/.env`
  ya no rompe la suite.

### 2.4 Qué no cubren las pruebas

- `image_base64` con MediaPipe real.
- TTS con gTTS.
- `/api/signs` con PostgreSQL sembrado.
- Concurrencia, límites de tasa y cargas grandes.
- Expiración real del JWT (solo token inválido).
- Entrenamiento en background (hoy es síncrono y bloquea el worker).

---

## 3. Web (cliente principal)

### 3.1 Ejecutar

```powershell
cd frontend
npm test -- --run
npm run build
```

### 3.2 Suites

| Archivo | Qué cubre |
|---|---|
| `src/hooks/__tests__/useCamera.test.js` | Estado de cámara y errores |
| `src/components/__tests__/CameraPanel.test.jsx` | Render, stream y estados |
| `src/components/__tests__/ResultPanel.test.jsx` | Resultado, confianza y avisos |
| `src/pages/__tests__/Home.test.jsx` | Inicio, textos y accesos |
| `src/pages/__tests__/Translator.test.jsx` | Demo, cámara, estabilidad y guardado |
| `src/services/__tests__/api.test.js` | Mensajes de error de la API (incluye 422) |
| **Total** | **19 pruebas en 6 archivos** |

Avisos normales:

- `Not implemented: HTMLMediaElement.prototype.play` (jsdom no implementa video).
- Advertencias de futuras flags de React Router.

Ninguno hace fallar la suite.

---

## 4. App móvil (opcional)

### 4.1 Ejecutar

```powershell
cd mobile
npm run typecheck
npm test -- --runInBand
```

`--runInBand` evita problemas de workers y hace la salida más legible en Windows.

### 4.2 Suites

| Archivo | Qué cubre |
|---|---|
| `tests/validation.test.ts` | Email, nombre, contraseña y confirmación |
| `tests/format.test.ts` | Fechas, porcentajes, tonos y nombres de seña |
| `tests/errors.test.ts` | `ApiError`, errores de red, timeout, 401, 503 |
| `tests/auth-service.test.ts` | Login form-urlencoded, registro, `/me` |
| `tests/theme.test.ts` | Resolución de tema claro/oscuro/sistema |
| `tests/TextField.test.tsx` | Render, error, hint y cambio de texto |
| `tests/SignResultCard.test.tsx` | Seña, traducción, confianza, guardado y advertencia |
| **Total** | **24 pruebas en 7 suites** |

### 4.3 Decisiones de prueba

- **RNTL 14:** `render` y `fireEvent` son asíncronos. Hay que usar `await` y las
  queries devueltas por `render`, no `screen`.
- **jest-expo:** se usa como preset. En esta ruta de Windows falla al resolver
  módulos nativos con `The "path" argument must be of type string. Received null`.
  La solución fue mockear en `jest.setup.ts`: `expo-constants`,
  `@expo/vector-icons`, `expo-secure-store` y AsyncStorage.
- **`@types/jest`:** sin él, TypeScript no reconoce `describe`, `it` ni `expect`.
  Se agregó `"types": ["jest", "node"]` a `tsconfig.json`.
- **Sin axios en `utils/errors.ts`:** se reemplazó el import por una comprobación
  estructural (`isAxiosError`) para que Jest no cargue módulos nativos.
- **Sin snapshots:** las pruebas verifican texto y comportamiento.

### 4.4 Qué no cubren las pruebas móviles

- Navegación completa entre pantallas.
- `AuthContext` con SecureStore real.
- `expo-camera`, permisos y captura.
- `expo-speech` en un dispositivo.
- Historial con backend real.
- Modo oscuro visual y tamaños de pantalla pequeños.

---

## 5. Export de Android (opcional)

```powershell
cd mobile
npx expo export --platform android --output-dir .expo-export-test
```

El bundle se genera correctamente. Esto **no** equivale a una app instalada ni a
una prueba en dispositivo.

---

## 6. Errores encontrados y correcciones

### 6.1 `/api/signs` devolvía 500 con la base vacía

**Síntoma:** `GET /api/signs` fallaba al no haber filas sembradas.

**Causa:** el fallback creaba modelos `Sign` sin `created_at`; `SignOut` exige un
`datetime` no nulo.

**Corrección:** el fallback construye `SignOut` con `created_at` explícito,
`id=0`, `display_name` y `recognized`. Se agregó `backend/tests/test_signs.py`.

**Estado:** corregido y verificado con 3 pruebas.

### 6.2 TypeScript no reconocía Jest

**Síntoma:** errores de tipos en `tests/*.test.ts` (`describe`, `it`, `expect`).

**Causa:** `@types/jest` no estaba incluido en `tsconfig`.

**Corrección:** `"types": ["jest", "node"]` en `mobile/tsconfig.json`.

**Estado:** corregido; `npm run typecheck` pasa.

### 6.3 `jest-expo` fallaba con una ruta nula

**Síntoma:** `TypeError: The "path" argument must be of type string. Received null`
al ejecutar Jest en esta ruta de Windows.

**Causa:** resolución de módulos nativos de Expo con una ruta que contiene
paréntesis y espacios.

**Corrección:** mocks en `mobile/jest.setup.ts`.

**Estado:** las 7 suites pasan. Es una solución de entorno de pruebas, no un
cambio de la app.

### 6.4 RNTL 14: `render`/`fireEvent` asíncronos

**Síntoma:** advertencias y fallos al usar `fireEvent` sin `await` o `screen`.

**Corrección:** usar `const view = await render(...)` y
`await fireEvent.press(...)`; consultar `view.getByText(...)`.

**Estado:** aplicado en `TextField.test.tsx` y `SignResultCard.test.tsx`.

### 6.5 `utils/errors.ts` cargaba axios en Jest

**Síntoma:** fallos de módulos nativos al importar axios en pruebas.

**Corrección:** comprobación estructural de `isAxiosError` sin importar axios.

**Estado:** corregido; `errors.test.ts` pasa.

### 6.6 `tsconfig` y archivos de Expo

**Síntoma:** faltaban tipos de Expo o se incluían archivos generados.

**Corrección:** se mantiene `extends: "expo/tsconfig.base"`, `strict: true` y se
incluyen `**/*.ts`, `**/*.tsx`, `.expo/types/**/*.ts` y `expo-env.d.ts`.

**Estado:** correcto.

---

## 7. Errores que pueden aparecer al ejecutar

| Error | Causa | Solución |
|---|---|---|
| `GET /health 404 Not Found` | La ruta oficial es `/api/health` | Usar `/api/health` (desde 2026-11-14 `/health` también responde) |
| `422` al guardar muestras | Nombre inválido o mano con menos de 21 puntos | Usar `A`–`Z`, `0`–`9` y `_` (se acepta 1 carácter); capturar la mano completa |
| `403` en `/api/ai/dataset`, `/samples` o `/train` | La cuenta no está en `ADMIN_EMAILS` | Agregar el email en el backend o usar una cuenta admin |
| `503` al analizar foto | `mediapipe` no instalado | `pip install -r requirements-optional.txt` o usar demo |
| `No se detectaron manos` | Foto sin mano visible o poca luz | Repetir la captura con la mano completa |
| `Cannot find module 'expo-constants'` en Jest | Módulo nativo no resuelto | Verificar `jest.setup.ts` |
| `The "path" argument must be of type string` | Bug de jest-expo en Windows | Usar los mocks existentes |
| `Network Error` en la app móvil | URL incorrecta o backend no accesible | Revisar `EXPO_PUBLIC_API_URL`, IP, firewall y `--host 0.0.0.0` |
| `401` al guardar | Token expirado | Volver a iniciar sesión |
| `HTMLMediaElement.play` en web | jsdom | Aviso no fatal |
| La cámara no abre en el celular | El navegador exige HTTPS fuera de `localhost` | Servir con HTTPS o probar en `localhost` |

---

## 8. Cómo agregar pruebas

### Backend

1. Crear `backend/tests/test_<tema>.py`.
2. Usar el fixture `client` de `conftest.py`.
3. Para rutas privadas, usar `auth_headers` o registrar un usuario.
4. Para permisos, modificar `settings` con `monkeypatch`.
5. Ejecutar `pytest -q`.

### Web

1. Crear `frontend/src/**/__tests__/<tema>.test.jsx`.
2. Mockear cámara, MediaPipe y servicios HTTP como en `Translator.test.jsx`.
3. Ejecutar `npm test -- --run`.

### App móvil (opcional)

1. Crear `mobile/tests/<tema>.test.ts` o `.tsx`.
2. Para componentes, usar `@testing-library/react-native` con `await`.
3. Mockear módulos nativos en `jest.setup.ts` si es necesario.
4. Ejecutar `npm test -- --runInBand`.

### Criterios mínimos antes de cerrar un cambio

```powershell
cd backend
pytest -q

cd ..\frontend
npm test -- --run
npm run build
```
