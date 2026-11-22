# Guía de uso de la aplicación web

> Guía para la persona que usa el sistema, no para quien instala el servidor.
> Si todavía no está configurado, ver
> [`instalacion-y-ejecucion.md`](instalacion-y-ejecucion.md).

---

## 1. Qué necesitás

- Un navegador actualizado (Chrome, Edge, Firefox o Safari) en computadora o
  celular.
- Cámara si vas a usar el modo en vivo. El modo demostración no la necesita.
- Una cuenta de usuario.
- Conexión con el backend (en desarrollo, la misma red que la PC).

La aplicación **no reemplaza a un intérprete** ni constituye una herramienta de
accesibilidad certificada. El modelo incluido es una demostración educativa.

---

## 2. Crear una cuenta

1. Abrí la web y tocá **Crear una cuenta**.
2. Completá:
   - **Nombre:** al menos 3 caracteres.
   - **Email:** un correo válido.
   - **Contraseña:** al menos 6 caracteres.
   - **Repetir contraseña:** debe coincidir.
3. Tocá **Crear cuenta**.

Si el email ya existe, la web muestra el error del servidor. Si no hay conexión,
revisá la URL del backend y la red.

---

## 3. Iniciar sesión

1. Ingresá tu email y contraseña.
2. Tocá **Entrar**.
3. La sesión se guarda en el almacenamiento del navegador y se valida al volver
   a abrir la página.
4. Si el token venció, tendrás que iniciar sesión otra vez.

La web guarda el token en `localStorage`. Es aceptable para un proyecto
académico, pero no cargues scripts de terceros en la misma página.

---

## 4. Pantalla de inicio

Muestra una explicación del sistema, los pasos de uso y el botón **Comenzar
traducción**. Si ya tenés sesión, el botón lleva directo al Traductor; si no, al
registro.

El menú superior incluye **Inicio**, **Traductor**, **Historial** y
**Configuración**. Historial y Configuración solo aparecen con sesión iniciada.

---

## 5. Traducir una seña

Abrí **Traductor**. Hay dos formas de probar.

### 5.1 Cámara en vivo (recomendado)

1. Tocá **📷 Iniciar traducción** y aceptá el permiso de cámara.
2. Esperá a que cargue el detector de manos.
3. Ubicá la mano completa dentro del encuadre, con buena luz.
4. Tocá **▶ Traducir**.
5. El panel de resultado se actualiza cuando la misma seña se detecta en **2
   cuadros consecutivos**. Esto evita que un movimiento suelto cambie el texto o
   dispare la voz.
6. Podés pausar con **⏸ Pausar traducción** o detener con **🛑 Detener**.

MediaPipe corre **en el navegador**: la imagen de la cámara no se envía al
servidor, solo los 21 puntos de la mano. La web funciona en computadora y en
celular.

Si el encuadre se ve negro, revisá **Fuente de video**: Chrome puede estar usando
la cámara infrarroja de Windows Hello. Elegí otra cámara en la lista.

### 5.2 Probar sin cámara (demo)

1. Bajá hasta **Probar sin cámara (demo)**.
2. Elegí una seña del vocabulario.
3. Tocá **Predecir (demo)**.

El backend genera los landmarks sintéticos de esa seña. Sirve para comprobar el
flujo completo sin cámara. Solo aparecen las señas que el modelo activo conoce.

---

## 6. Resultado y confianza

El panel de resultado muestra:

- **Seña detectada:** nombre interno de la seña.
- **Traducción:** texto legible.
- **Confianza:** porcentaje.
- **Modelo:** `demo` o `trained`.
- **Tiempo:** milisegundos de procesamiento.

Interpretación de la confianza:

| Confianza | Indicador | Significado |
|---|---|---|
| 75% o más | Verde | Predicción relativamente alta |
| 45% a 74% | Amarillo | Revisar antes de confiar |
| Menos de 45% | Rojo | Muy baja; repetir la seña |

El backend no descarta predicciones por confianza. La web:

- autoguarda si la confianza es **50% o más** y el autoguardado está activo;
- advierte si es **menor a 45%**;
- permite guardar manualmente aunque sea baja.

En el catálogo, las señas en **amarillo** están cargadas pero todavía no fueron
entrenadas: el modelo no las va a reconocer hasta que se graben muestras y se
entrene de nuevo.

---

## 7. Escuchar la traducción

1. Tocá el botón de voz en el resultado o en el historial.
2. La web usa la síntesis de voz del navegador (Web Speech API).
3. Volvé a tocar para detener o cambiar el texto.

La voz depende de las voces instaladas en el sistema. Si no se escucha, subí el
volumen, revisá que el dispositivo no esté en silencio o cambiá la velocidad en
**Configuración**. La web no pide permiso de micrófono porque no graba audio.

---

## 8. Guardar y ver el historial

### Guardar

- Con **Guardado automático** activo, las traducciones con confianza suficiente
  se guardan solas.
- Si está desactivado, usá el botón de guardar del resultado.
- El botón cambia a **Guardada** cuando la operación termina.

### Historial

1. Abrí **Historial** en el menú.
2. Tocá **⟳ Actualizar** para recargar.
3. Cada fila muestra fecha, seña, traducción y confianza.
4. Tocá 🔊 para escuchar o 🗑 para eliminar.

El historial es por usuario. No se comparte con otras cuentas.

---

## 9. Configuración

### Idioma

- Español (Argentina), Español (México) o Español (general).
- El idioma de voz no cambia el vocabulario del modelo; el catálogo actual es
  `es-AR`.

### Voz (TTS)

- **Velocidad de reproducción:** de 0.5x a 2.0x.
- **Reproducir automáticamente la seña detectada:** si está activo, la seña se
  pronuncia sola cuando se estabiliza.

### Detección visual

- **Dibujar puntos de referencia (landmarks):** solo controla el dibujo en
  pantalla. Los landmarks se envían igual al servidor.

### Apariencia

- **Tema oscuro:** se guarda en este dispositivo.

---

## 10. Recuperar la contraseña

1. En el inicio de sesión, tocá **¿Olvidaste tu contraseña?**.
2. Ingresá tu email.
3. En desarrollo, la respuesta incluye un **código de recuperación** que se
   muestra en pantalla. En producción ese código debe enviarse por correo y no
   aparece en la respuesta.
4. Tocá **Ya tengo un código**, ingresá el código y la nueva contraseña.

---

## 11. Privacidad

- El token se guarda en el almacenamiento del navegador.
- Las preferencias (tema, idioma, velocidad) se guardan localmente.
- La cámara se procesa en el navegador; solo se envían los landmarks.
- El historial se guarda en la base del servidor asociado a tu cuenta.
- No se solicita ubicación, contactos ni micrófono.

---

## 12. Problemas frecuentes

| Problema | Qué hacer |
|---|---|
| “No se pudo conectar con el servidor” | Revisar la red, la URL del backend y que esté encendido |
| “Tu sesión venció” | Volver a iniciar sesión |
| La cámara no abre | Conceder permiso; en celular puede requerir HTTPS |
| El video se ve negro | Cambiar la **Fuente de video** (cámara IR de Windows Hello) |
| “Sin manos en el encuadre” | Mejorar la luz, centrar la mano y acercarla |
| “Confianza demasiado baja” | Repetir la seña más estable y con mejor encuadre |
| No se guardó automáticamente | La confianza fue menor a 50%; guardar manualmente |
| No se escucha la voz | Subir volumen, cambiar velocidad o probar otra voz del sistema |
| El historial no se actualiza | Tocar **⟳ Actualizar** y revisar la conexión |
| `403` en el grabador | La cuenta no está en `ADMIN_EMAILS` |

---

## 13. Limitaciones que debés conocer

- El modelo demo **no reconoce LSA real**: usa 9 plantillas sintéticas.
- El catálogo tiene 86 señas, pero el modelo solo reconoce las entrenadas.
- El modelo actual usa **una mano y un cuadro**: no interpreta movimiento ni dos
  manos.
- La confianza del modelo demo no es una medida de precisión real.
- La web no sustituye a una persona intérprete.
- La disponibilidad de voces depende del navegador y del sistema operativo.

---

## 14. App móvil (opcional)

La app Expo/React Native sigue disponible como cliente experimental. Su modo
cámara envía una foto al backend y necesita `mediapipe` instalado en el servidor.
Para la mayoría de los casos alcanza con la web, que ya funciona en celular. Ver
[`../mobile/README.md`](../mobile/README.md).
