# Decisiones técnicas

> Registro de las decisiones tomadas durante la auditoría y la migración al
> cliente móvil. Cada decisión incluye contexto, alternativa, costo y estado.

---

## 1. Resumen

| N.º | Decisión | Estado |
|---|---|---|
| D1 | Crear la app móvil con Expo + React Native + TypeScript | Aplicada |
| D2 | Conservar el backend FastAPI y sus contratos | Aplicada |
| D3 | No portar MediaPipe web a React Native | Aplicada |
| D4 | Usar dos caminos: demo y foto (`image_base64`) | Aplicada |
| D5 | Guardar JWT en `expo-secure-store` | Aplicada |
| D6 | Usar AsyncStorage para preferencias | Aplicada |
| D7 | Navegación con React Navigation 7 | Aplicada |
| D8 | TTS local con `expo-speech` | Aplicada |
| D9 | Umbral de confianza en el cliente | Aplicada |
| D10 | Sistema de tema por tokens | Aplicada |
| D11 | Corregir `/api/signs` y agregar regresión | Aplicada |
| D12 | Mantener el frontend web legado | Aplicada |
| D13 | No introducir un motor de IA en el dispositivo | Diferida |
| D14 | No usar Docker para la app móvil | Aplicada |
| D15 | Documentar límites y verificación real | Aplicada |

---

## D1. App móvil con Expo + React Native + TypeScript

**Contexto:** el cliente web no es portable a móvil: usa DOM, `<video>`,
`<canvas>`, `getUserMedia`, WebGL y `speechSynthesis`.

**Decisión:** crear `mobile/` con Expo SDK 58, React Native 0.88, React 19 y
TypeScript 6.

**Motivos:**

- Un solo código para Android/iOS.
- `expo-camera`, `expo-speech` y `expo-secure-store` cubren las necesidades sin
  escribir módulos nativos.
- TypeScript permite modelar el contrato de la API y detectar errores antes de
  ejecutar.
- Expo simplifica las pruebas en un dispositivo con Expo Go.

**Alternativas descartadas:**

- **Flutter:** válido, pero implicaba otro lenguaje y reescribir toda la lógica.
- **React Native CLI puro:** más control, pero más configuración nativa para un
  proyecto académico.
- **WebView:** reutiliza el cliente web, pero pierde la experiencia nativa y
  complica permisos y almacenamiento.

**Costo:** dependencia del ecosistema Expo y de la versión de SDK compatible con
Expo Go.

---

## D2. Conservar el backend FastAPI

**Contexto:** el backend ya implementa autenticación, IA, historial, catálogo y
TTS, con pruebas.

**Decisión:** no reescribir el backend; adaptar el cliente móvil a sus contratos.

**Motivos:**

- Los endpoints cubren el flujo completo.
- Las pruebas de backend ya existen.
- El modelo se puede reemplazar sin tocar la app.
- El contrato HTTP es estable y documentable.

**Consecuencia:** la app debe respetar detalles no obvios:

- Login con `application/x-www-form-urlencoded`.
- Predicción con JWT.
- `/api/signs` requiere autenticación.
- `image_base64` requiere MediaPipe server-side.

---

## D3. No portar MediaPipe web a React Native

**Contexto:** el cliente web usa `@mediapipe/tasks-vision`, que depende de
WebAssembly, WebGL y APIs del DOM. No existe una versión oficial directa para
React Native.

**Decisión:** no intentar ejecutar MediaPipe dentro de la app móvil en esta
etapa.

**Alternativas evaluadas:**

| Alternativa | Ventaja | Problema |
|---|---|---|
| WebView con MediaPipe web | Reutiliza código | No es nativo; permisos y rendimiento limitados |
| VisionCamera + módulo nativo | Mejor rendimiento | Build nativo complejo; requisitos de versiones |
| TensorFlow Lite en dispositivo | Offline | Requiere convertir y validar el modelo |
| Detección en el backend | Simple y real | Latencia, ancho de banda y dependencia de `mediapipe` |

**Decisión actual:** detección en el backend para la foto capturada.

**Trabajo futuro:** si se necesita tiempo real, evaluar VisionCamera o TFLite.

---

## D4. Dos caminos de traducción: demo y foto

**Contexto:** se necesita un flujo real sin prometer reconocimiento en vivo.

**Decisión:**

1. **Demo:** el usuario elige una de las 9 señas y el backend genera sus
   landmarks. No requiere cámara.
2. **Foto:** la app captura una imagen con `expo-camera` y la envía como
   `image_base64`. El backend extrae landmarks con MediaPipe.

**Motivos:**

- El modo demo permite probar login, resultado, voz e historial en cualquier
  dispositivo.
- La foto es un camino real y acotado, sin streaming.
- Si falta MediaPipe, se muestra un error claro en lugar de una traducción falsa.

**Costo:** la foto no es tiempo real y depende de la calidad de la imagen y de la
instalación del backend.

---

## D5. JWT en `expo-secure-store`

**Contexto:** el token da acceso a la cuenta y al historial. En web se usaba
`localStorage`.

**Decisión:** guardar token y usuario en SecureStore en Android/iOS.

**Motivos:**

- Keychain/Keystore protegen el token frente a accesos casuales.
- Evita usar AsyncStorage para credenciales.
- SecureStore no está disponible en web; se usa AsyncStorage como fallback de
  desarrollo.

**Consecuencia:** la app no funciona con la misma seguridad en web; el fallback
es solo para pruebas.

---

## D6. Preferencias en AsyncStorage

**Contexto:** tema, idioma, velocidad de voz y autoguardado no son secretos.

**Decisión:** usar AsyncStorage para preferencias y SecureStore solo para la
sesión.

**Motivos:**

- AsyncStorage es simple y suficiente para datos no sensibles.
- Evita mezclar secretos con configuración.
- La carga inicial es rápida y tolerante a errores.

**Consecuencia:** si se corrompe una preferencia, se usa el valor por defecto.

---

## D7. React Navigation 7

**Contexto:** se necesita autenticación (stack) y navegación principal (tabs).

**Decisión:**

- `AppNavigator`: stack raíz (`Auth` o `Main`).
- `AuthNavigator`: login y registro.
- `MainTabs`: Inicio, Traductor, Historial y Configuración.

**Motivos:**

- Separación clara entre sesión y app.
- Deep linking y gestos nativos.
- Tema integrado con React Navigation.
- El splash de sesión evita mostrar pantallas incorrectas mientras se valida el
  token.

**Alternativa descartada:** Expo Router. Es válido, pero la estructura por
archivos no era necesaria para este tamaño y se prefirió un stack explícito.

---

## D8. TTS local con `expo-speech`

**Contexto:** el backend ofrece gTTS, pero requiere internet y una llamada HTTP.

**Decisión:** usar `expo-speech` en el dispositivo; dejar gTTS como alternativa
en el backend.

**Motivos:**

- Funciona sin conexión.
- Menor latencia.
- Usa las voces del sistema.
- No requiere descargar audio ni manejar archivos temporales.

**Consecuencia:** la calidad y disponibilidad de voces en español depende del
dispositivo. La app permite elegir entre `es-AR`, `es-MX` y `es`.

---

## D9. Umbral de confianza en el cliente

**Contexto:** el backend devuelve la clase más probable y no aplica
`AI_MIN_CONFIDENCE`.

**Decisión:**

- Autoguardar solo si `confidence >= 0.5`.
- Mostrar advertencia si `confidence < 0.45`.
- Permitir guardado manual aunque la confianza sea baja.

**Motivos:**

- Evita llenar el historial con predicciones dudosas.
- No oculta resultados al usuario.
- Mantiene el backend simple y compatible con la web.

**Consecuencia:** la lógica de negocio de confianza está duplicada en el cliente.
Si se aplica en el servidor, hay que ajustar la app y la documentación.

---

## D10. Tema por tokens

**Contexto:** la app debe soportar claro, oscuro y modo sistema.

**Decisión:** `src/constants/theme.ts` define colores, radios y espaciados;
`useTheme` resuelve el tema y todos los componentes consumen tokens.

**Motivos:**

- Consistencia visual.
- Sin CSS global ni hojas superpuestas.
- Fácil de probar (`resolveColors` es una función pura).
- Integración con `NavigationContainer` y `StatusBar`.

**Consecuencia:** cada componente necesita `useTheme`; no se pueden usar colores
hardcodeados sin romper el modo oscuro.

---

## D11. Corregir `/api/signs`

**Contexto:** con la base vacía, el fallback devolvía `500` porque `created_at`
era `None` en objetos `Sign` no persistidos.

**Decisión:** devolver `SignOut` con `id=0`, `description=None` y `created_at`
actual; agregar una prueba de regresión.

**Motivos:**

- El catálogo debe funcionar sin seed.
- Es preferible un fallback explícito a un error 500.
- La prueba evita regresiones.

**Consecuencia:** los ids del fallback no son reales; la app no debe usarlos para
operaciones de escritura.

---

## D12. Mantener el frontend web legado

**Contexto:** el repositorio incluye `frontend/`, Docker y pruebas web.

**Decisión:** no eliminar el frontend web durante esta etapa.

**Motivos:**

- Evita romper `docker-compose.yml` y las 15 pruebas existentes.
- Sirve como referencia del flujo con MediaPipe en navegador.
- Permite comparar comportamiento.

**Consecuencia:** hay dos clientes y documentación duplicada. Si el objetivo pasa
a ser “solo móvil”, se puede archivar o eliminar el frontend en una etapa
posterior, con autorización explícita.

---

## D13. Sin motor de IA en el dispositivo

**Contexto:** el modelo es un `.pkl` de scikit-learn.

**Decisión:** no ejecutar el modelo en el teléfono en esta etapa.

**Motivos:**

- scikit-learn no corre directamente en React Native.
- Convertir a TFLite/ONNX requiere validación y cambios en el pipeline.
- El objetivo es conservar el backend y validar el flujo.

**Trabajo futuro:** exportar el modelo a TFLite, medir latencia y precisión, y
reevaluar la privacidad si la imagen ya no sale del dispositivo.

---

## D14. App móvil fuera de Docker

**Contexto:** Docker Compose levanta PostgreSQL, backend y frontend web.

**Decisión:** la app móvil se ejecuta con Expo, no dentro de Docker.

**Motivos:**

- Expo necesita acceder a la cámara y a la red del dispositivo.
- Los emuladores y teléfonos no consumen contenedores de UI fácilmente.
- El backend sigue siendo el mismo servicio.

**Consecuencia:** para probar la app hay que levantar el backend por separado y
configurar la URL LAN.

---

## D15. Documentar límites y verificación real

**Contexto:** la documentación anterior afirmaba cosas que el código no cumplía
(63–126 features, `/api/signs` sin bug, frontend React como único cliente).

**Decisión:** actualizar la documentación y distinguir:

- **Verificado:** se ejecutó o se leyó el código exacto.
- **No verificado:** requiere dispositivo, Docker o servicio externo.
- **Limitación:** comportamiento conocido que no se oculta.

**Motivos:**

- Un proyecto académico debe poder defenderse con evidencia.
- Evita prometer reconocimiento de LSA real sin dataset.
- Facilita la revisión por parte de docentes y usuarios.

---

## 6. Decisiones pendientes

| Tema | Opciones | Criterio |
|---|---|---|
| Tiempo real | VisionCamera, WebView, TFLite | Medir latencia y complejidad de build |
| Modelo real | Dataset LSA propio, modelo público | Licencia, consentimiento y calidad |
| `AI_MODEL_MODE` | Implementarlo o eliminarlo | Evitar configuración engañosa |
| Umbral en servidor | Aplicar `AI_MIN_CONFIDENCE` | Cambiar contrato y pruebas |
| Refresh token | Implementar rotación | Seguridad y duración de sesión |
| Migraciones | Alembic | Cambios de esquema seguros |
| Frontend legado | Archivar o eliminar | Confirmar alcance del entregable |
| Feedback | Endpoints y UI | Uso real para reentrenamiento |
| Accesibilidad | Pruebas con lectores de pantalla | Inclusión real |
