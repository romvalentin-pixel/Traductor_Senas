# Traductor LSA — App móvil

Aplicación **Expo + React Native + TypeScript** para traducir Lengua de Señas
Argentina a texto y voz. Consume el backend FastAPI del repositorio.

> **Estado:** flujo de demostración implementado y probado en Jest (typecheck y
> 24 pruebas). La cámara y el TTS no se verificaron en un dispositivo físico en
> este entorno.
>
> **Alcance:** el modelo incluido es de demostración (9 señas sintéticas). No es
> un reconocedor de LSA real.

---

## 1. Funcionalidades

- Registro e inicio de sesión con JWT.
- Sesión persistente en almacenamiento seguro.
- Inicio con estadísticas del modelo y del historial.
- Traducción por seña de demostración.
- Traducción por foto con `expo-camera`.
- Resultado con confianza, modelo y tiempo de procesamiento.
- Voz con `expo-speech`.
- Guardado manual o automático.
- Historial con actualización, reproducción y eliminación.
- Tema claro, oscuro o del sistema.
- Configuración de idioma de voz, velocidad y autoguardado.

---

## 2. Requisitos

- Node.js 20+ (probado con 24.15.0).
- npm 10+.
- Backend FastAPI accesible desde el teléfono o emulador.
- Expo Go compatible con SDK 58 o un development build.

La app usa:

| Dependencia | Versión |
|---|---|
| Expo | 58.0.17 |
| React Native | 0.88.0 |
| React | 19.3.0 |
| TypeScript | 6.0.3 |
| React Navigation | 7.x |
| expo-camera | 58.0.12 |
| expo-speech | 58.0.3 |
| expo-secure-store | 58.0.2 |
| AsyncStorage | 2.2.0 |

---

## 3. Instalación

```powershell
cd mobile
npm install
Copy-Item .env.example .env
```

Editar `.env`:

```ini
EXPO_PUBLIC_API_URL=http://192.168.1.50:8000/api
```

Si se deja vacío, la app intenta inferir la IP del host de Expo y usa el puerto
8000. En emulador Android, el fallback es `http://10.0.2.2:8000/api`.

Arrancar:

```powershell
npm start
```

- `a`: Android.
- `i`: iOS (macOS).
- `w`: web de desarrollo.
- Escanear el QR con Expo Go.

Si Expo Go no es compatible:

```powershell
npx expo run:android
```

---

## 4. Scripts

| Comando | Qué hace |
|---|---|
| `npm start` | Inicia el servidor de desarrollo Expo |
| `npm run android` | Abre Android |
| `npm run ios` | Abre iOS (macOS) |
| `npm run web` | Abre la versión web |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Jest |
| `npm test -- --runInBand` | Jest en serie, recomendado en Windows |
| `npm run test:watch` | Jest en modo watch |

---

## 5. Estructura

```text
mobile/
├── App.tsx                     SafeArea + Settings + Auth + navegación
├── index.ts                    Punto de entrada de Expo
├── app.json                    Nombre, permisos y plugins
├── jest.setup.ts               Mocks de módulos nativos
├── tsconfig.json               TypeScript estricto
├── src/
│   ├── components/             UI reutilizable
│   ├── constants/
│   │   ├── config.ts           URL, umbrales y claves
│   │   ├── signs.ts            Vocabulario local de respaldo
│   │   └── theme.ts            Tokens de color, spacing y radius
│   ├── context/
│   │   ├── AuthContext.tsx     Sesión y autenticación
│   │   └── SettingsContext.tsx Preferencias
│   ├── hooks/                  useAuth, useTheme, useSpeech, etc.
│   ├── navigation/             AppNavigator, AuthNavigator, MainTabs
│   ├── screens/
│   │   ├── auth/               Login, Register
│   │   └── main/               Home, Translator, History, Settings
│   ├── services/
│   │   ├── http.ts             Axios + JWT + errores
│   │   ├── auth.ts             Login/registro/me
│   │   ├── ai.ts               Predicción/info/catálogo
│   │   ├── translations.ts     Historial
│   │   └── storage.ts          SecureStore + fallback web
│   ├── types/                  API y navegación
│   └── utils/                  errors, format, validation
└── tests/                      7 suites, 24 pruebas
```

---

## 6. Flujo

```text
App
├── AuthProvider
│   ├── Lee token de SecureStore
│   ├── Valida con GET /auth/me
│   └── Decide AuthNavigator o MainTabs
├── SettingsProvider
│   └── Carga tema, idioma, voz y autoguardado
└── NavigationContainer
    ├── Auth: Login / Register
    └── Main: Inicio / Traductor / Historial / Configuración
```

### Traducción

1. **Demo:** `POST /ai/predict` con `demo_sign`.
2. **Cámara:** `expo-camera` → base64 → `POST /ai/predict` con `image_base64`.
3. Resultado en `SignResultCard`.
4. Voz local con `expo-speech`.
5. Guardado con `POST /translation` si la confianza es suficiente.

### Sesión

- Login: `application/x-www-form-urlencoded` con `username` y `password`.
- Token en SecureStore; en web se usa AsyncStorage como fallback.
- Un `401` posterior al login cierra la sesión.
- Sin red, se conserva la sesión guardada si existe un usuario local.

---

## 7. Configuración

`src/constants/config.ts`:

| Constante | Valor | Uso |
|---|---|---|
| `API_BASE_URL` | `.env` o inferida | URL del backend |
| `API_TIMEOUT_MS` | 30 s | Peticiones generales |
| `PREDICT_TIMEOUT_MS` | 45 s | Predicción con imagen |
| `MIN_CONFIDENCE_TO_SAVE` | 0.5 | Autoguardado |
| `MIN_CONFIDENCE_WARNING` | 0.45 | Advertencia visual |
| `CAMERA_PICTURE_QUALITY` | 0.45 | Tamaño de la foto |
| `DEFAULT_LANGUAGE` | `es-AR` | Idioma inicial |

`app.json` declara:

- Permiso `CAMERA` en Android.
- `NSCameraUsageDescription` en iOS.
- `recordAudioAndroid: false`.
- Plugin de `expo-secure-store`.
- `newArchEnabled: true`.

La app no solicita ubicación, contactos ni micrófono.

---

## 8. Diseño

- Tokens en `src/constants/theme.ts`.
- `useTheme` resuelve claro/oscuro/sistema.
- Componentes: `Screen`, `Card`, `AppButton`, `TextField`, `Chip`, `Badge`,
  `ConfidenceBar`, `HistoryItem`, `ActionCard`, `StatCard`.
- `Screen` maneja safe area, scroll y teclado.
- Se usan roles y etiquetas de accesibilidad en botones principales.

---

## 9. Pruebas

```powershell
npm run typecheck
npm test -- --runInBand
```

Resultado actual:

```text
Test Suites: 7 passed, 7 total
Tests:       24 passed, 24 total
```

Cobertura:

- Validación de formularios.
- Formato de fechas, porcentajes y nombres.
- Errores de red, timeout y `ApiError`.
- Login form-urlencoded y registro.
- Tema claro/oscuro/sistema.
- `TextField`.
- `SignResultCard`.

### Entorno Jest

`jest.setup.ts` mockea:

- `expo-constants`
- `@expo/vector-icons`
- `expo-secure-store`
- `@react-native-async-storage/async-storage`

Esto evita un bug de `jest-expo` en esta ruta de Windows:
`The "path" argument must be of type string. Received null`.

`tsconfig.json` incluye `"types": ["jest", "node"]` para que TypeScript reconozca
los globales de Jest.

### RNTL 14

`render` y `fireEvent` son asíncronos:

```ts
const view = await render(<TextField label="Email" value="" onChangeText={() => {}} />);
await fireEvent.changeText(view.getByPlaceholderText('...'), 'hola');
expect(view.getByText('...')).toBeTruthy();
```

---

## 10. Limitaciones

- El modelo demo no reconoce LSA real.
- La cámara captura una foto; no hay video en tiempo real.
- `image_base64` requiere `mediapipe` en el backend; sin él devuelve `503`.
- No se probó en dispositivo físico.
- No hay refresh token; el JWT expira a los 60 minutos por defecto.
- La versión web es solo para desarrollo; SecureStore no está disponible.
- La cámara frontal puede reflejar la imagen y afectar la geometría.
- El historial no tiene paginación por cursor; pide hasta 100 elementos.
- No hay soporte offline para traducciones.

---

## 11. Problemas frecuentes

| Problema | Solución |
|---|---|
| No conecta con el backend | Revisar `EXPO_PUBLIC_API_URL`, IP LAN y firewall |
| `localhost` no funciona en Android | Usar `10.0.2.2` |
| `401` inmediato | Verificar credenciales y que el backend use la misma base |
| `503` al analizar foto | Instalar MediaPipe en el backend o usar demo |
| La cámara no abre | Revisar permiso en el sistema |
| Expo Go incompatible | `npx expo run:android` |
| Jest falla por ruta nula | Mantener los mocks de `jest.setup.ts` |
| No se escucha la voz | Revisar volumen, idioma y voces del sistema |
| El texto se corta en pantallas chicas | Probar en dispositivo; ajustar estilos |

---

## 12. Relación con el backend

| Acción | Endpoint |
|---|---|
| Login | `POST /api/auth/login` |
| Registro | `POST /api/auth/register` |
| Validar sesión | `GET /api/auth/me` |
| Inicio | `GET /api/ai/info`, `GET /api/signs`, `GET /api/translation/history` |
| Demo | `POST /api/ai/predict` con `demo_sign` |
| Foto | `POST /api/ai/predict` con `image_base64` |
| Guardar | `POST /api/translation` |
| Historial | `GET /api/translation/history` |
| Eliminar | `DELETE /api/translation/{id}` |

Contratos completos: [`../docs/api.md`](../docs/api.md).

---

## 13. Documentación del proyecto

- [README principal](../README.md)
- [Arquitectura](../docs/architecture.md)
- [API](../docs/api.md)
- [Instalación y ejecución](../docs/instalacion-y-ejecucion.md)
- [Pruebas y errores](../docs/pruebas-y-errores.md)
- [Guía de uso](../docs/guia-de-uso.md)
- [Decisiones técnicas (archivo)](../docs/archivo/decisiones-tecnicas.md)
