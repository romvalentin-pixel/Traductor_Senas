# Plan de migración al cliente móvil

> Estado: **migración funcional completada en código**; quedan verificaciones
> físicas y decisiones de alcance.

---

## 1. Objetivo

Pasar de un cliente web React + Vite a una app móvil React Native/Expo sin
romper el backend FastAPI, la base de datos ni el pipeline de IA. El flujo debía
seguir siendo real: autenticación, traducción, voz e historial.

---

## 2. Alcance

### Incluido

- App móvil Android/iOS con Expo.
- Login, registro y restauración de sesión.
- Inicio con estadísticas.
- Traductor con modo demo y captura de foto.
- Resultado con confianza, voz y guardado.
- Historial con actualización y eliminación.
- Configuración de tema, idioma, velocidad y autoguardado.
- Pruebas, typecheck y documentación.

### Excluido de esta etapa

- MediaPipe en tiempo real dentro de React Native.
- Entrenamiento con un dataset real de LSA.
- Publicación en App Store/Google Play.
- Refresh tokens.
- Migraciones Alembic.
- Eliminación del cliente web legado.

---

## 3. Fases

### Fase 0: auditoría

**Objetivo:** conocer el estado real antes de tocar código.

Actividades:

- Inventario de archivos y dependencias.
- Lectura de rutas, servicios, modelos, esquemas y pruebas.
- Ejecución de pruebas existentes.
- Reproducción del bug de `/api/signs`.
- Identificación de límites de MediaPipe.

Entregable: [`auditoria-proyecto.md`](auditoria-proyecto.md).

**Estado:** completada.

### Fase 1: corrección del backend

**Objetivo:** eliminar el bloqueo del catálogo.

Actividades:

- Corregir el fallback de `/api/signs` para devolver `SignOut`.
- Agregar `backend/tests/test_signs.py`.
- Ejecutar toda la suite.

Resultado: 24 pruebas aprobadas.

**Estado:** completada.

### Fase 2: base de la app móvil

**Objetivo:** crear el proyecto y la infraestructura.

Actividades:

- `mobile/` con Expo + TypeScript.
- Tema, configuración, tipos de API y navegación.
- Servicios HTTP, auth, IA, traducciones y almacenamiento.
- Contextos de sesión y preferencias.
- Componentes reutilizables.

**Estado:** completada.

### Fase 3: pantallas

**Objetivo:** implementar el flujo completo.

Actividades:

- Login y registro con validación.
- Inicio con estadísticas y avisos.
- Traductor demo/cámara con permisos, resultado, voz y autoguardado.
- Historial con refresco y eliminación.
- Configuración de tema, voz, idioma y autoguardado.

**Estado:** completada.

### Fase 4: pruebas y verificación estática

**Objetivo:** asegurar que el código compila y que la lógica crítica está
cubierta.

Actividades:

- Typecheck estricto.
- Pruebas de utilidades, servicios y componentes.
- Ajustes de entorno Jest/jest-expo.
- Export del bundle Android.

Resultados:

- `npm run typecheck`: sin errores.
- `npm test -- --runInBand`: 24 pruebas, 7 suites.
- `npx expo export --platform android`: correcto.

**Estado:** completada.

### Fase 5: documentación

**Objetivo:** dejar el proyecto comprensible y defendible.

Actividades:

- README actualizado.
- Arquitectura, API, base de datos y auditoría actualizadas.
- Guías de instalación, uso, pruebas, decisiones y Git.
- README de la app móvil.

**Estado:** completada.

### Fase 6: verificación en dispositivo

**Objetivo:** validar lo que no se puede probar en el entorno de desarrollo.

Actividades pendientes:

1. Instalar Expo Go o development build en un teléfono.
2. Probar login/registro contra el backend en la LAN.
3. Probar modo demo.
4. Probar permiso de cámara, captura y análisis.
5. Instalar `mediapipe` en el backend y verificar `image_base64`.
6. Probar `expo-speech` con voces en español.
7. Medir latencia y consumo de batería.
8. Probar en Android e iOS si es posible.

**Estado:** pendiente; requiere dispositivo y, para la foto, una dependencia
adicional en el backend.

### Fase 7: decisiones de alcance

Pendientes:

- ¿Se elimina o archiva el frontend web?
- ¿Se publica la app o se entrega solo el repositorio?
- ¿Se implementa tiempo real?
- ¿Se entrena un modelo con LSA real?
- ¿Se agregan migraciones y refresh tokens?

**Estado:** pendiente de definición con el responsable del proyecto.

---

## 4. Entregables

| Entregable | Ubicación | Estado |
|---|---|---|
| App móvil | `mobile/` | Completa en código |
| Backend corregido | `backend/` | Completo y probado |
| Prueba de regresión de catálogo | `backend/tests/test_signs.py` | Aprobada |
| README | `README.md` | Actualizado |
| Arquitectura | `docs/architecture.md` | Actualizada |
| API | `docs/api.md` | Actualizada |
| Base de datos | `docs/database.md` | Actualizada |
| Auditoría | `docs/auditoria-proyecto.md` | Actualizada |
| Instalación | `docs/instalacion-y-ejecucion.md` | Nueva |
| Pruebas | `docs/pruebas-y-errores.md` | Nueva |
| Decisiones | `docs/decisiones-tecnicas.md` | Nueva |
| Guía de uso | `docs/guia-de-uso.md` | Nueva |
| Git/GitHub | `docs/github-paso-a-paso.md` | Nueva |
| README móvil | `mobile/README.md` | Nuevo |

---

## 5. Criterios de aceptación

### Código

- [x] La app compila con TypeScript estricto.
- [x] Login, registro y restauración de sesión implementados.
- [x] Traducción demo funcionando contra el backend.
- [x] Captura de foto y envío de `image_base64` implementados.
- [x] Manejo de error `503` cuando falta MediaPipe.
- [x] Voz con `expo-speech`.
- [x] Historial con carga, refresco y eliminación.
- [x] Tema claro/oscuro/sistema.
- [x] Preferencias persistentes.

### Calidad

- [x] 24 pruebas de backend aprobadas.
- [x] 24 pruebas móviles aprobadas.
- [x] 15 pruebas del cliente web aprobadas.
- [x] Typecheck móvil limpio.
- [x] Export Android correcto.
- [ ] Prueba en dispositivo físico.
- [ ] Prueba de `image_base64` con MediaPipe real.
- [ ] Prueba de TTS en dispositivo.

### Documentación

- [x] README con estado real.
- [x] Arquitectura con diagramas y decisiones.
- [x] API con contratos y errores.
- [x] Base de datos con relaciones reales.
- [x] Limitaciones visibles.
- [x] Instrucciones de instalación y pruebas.
- [x] Guía de Git/GitHub.

---

## 6. Riesgos del plan

| Riesgo | Mitigación |
|---|---|
| El teléfono no alcanza el backend | Usar IP LAN, `--host 0.0.0.0` y probar `/api/health` desde el navegador del teléfono |
| MediaPipe no instala en el servidor | Mantener modo demo y documentar el 503 |
| La cámara frontal refleja la mano | Probar cámara trasera y documentar el efecto |
| Expo Go no soporta SDK 58 | Crear development build con `npx expo run:android` |
| El modelo demo no reconoce LSA real | No presentarlo como producto final; entrenar con dataset |
| Cambios de esquema sin migraciones | Usar `schema.sql` y planificar Alembic |
| Diferencias iOS/Android | Probar en ambos; evitar APIs específicas de una plataforma |
| El frontend legado confunde el alcance | Aclarar en README que el cliente nuevo es `mobile/` |

---

## 7. Orden recomendado para continuar

1. Verificar la app en un Android físico con Expo Go.
2. Instalar `mediapipe` en un entorno aparte y probar `image_base64`.
3. Medir latencia con fotos de distinta resolución.
4. Decidir si se elimina el frontend web.
5. Definir si se busca tiempo real y, en ese caso, elegir VisionCamera o WebView.
6. Entrenar un modelo con muestras reales y validarlo con personas usuarias.
7. Agregar migraciones, refresh tokens y feedback si el proyecto crece.

---

## 8. Rollback

La migración **no modificó el backend salvo el fallback de `/api/signs`**. Si la
app móvil no se usa:

- El cliente web sigue funcionando.
- El backend y la base no dependen de `mobile/`.
- Se puede archivar `mobile/` sin afectar el flujo web.
- La corrección de `/api/signs` es compatible con ambos clientes y debe
  conservarse.
