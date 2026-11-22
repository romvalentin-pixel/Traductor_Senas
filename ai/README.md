# Módulo de IA

Pipeline de datos y entrenamiento independiente del backend. Permite reproducir
el modelo de demostración y entrenar un clasificador con un dataset real de
Lengua de Señas Argentina (LSA) capturado desde la web.

> **Estado real:** no hay dataset real incluido. El modelo que usa el backend por
> defecto es de demostración, entrenado con plantillas sintéticas de 9 señas. La
> precisión de ese modelo **no representa** la precisión sobre LSA real.

---

## 1. Estructura

```text
ai/
├── dataset/            Muestras de landmarks por seña (JSON)
│   └── argentine/      Estructura preparada para LSA
├── models/             Modelos serializados (.pkl)
├── preprocessing/      Normalización de landmarks (y captura opcional)
├── training/           Scripts de entrenamiento
└── requirements-ai.txt
```

---

## 2. Contrato de datos

Cada muestra representa **una mano** con 21 landmarks de MediaPipe:

```json
{
  "sign": "HOLA",
  "language": "es-AR",
  "hands": [
    [
      [0.50, 0.85, 0.00],
      [0.43, 0.70, 0.00],
      "... 21 puntos en total ..."
    ]
  ]
}
```

- 21 landmarks × 3 coordenadas = **63 features** por mano.
- El backend elige la mano más prominente si recibe varias.
- `normalize_hand()` centra en la muñeca y escala por el máximo valor absoluto.
- La normalización es invariante a traslación y escala, pero **no a rotación**.

---

## 3. Instalar dependencias

Desde la raíz del proyecto:

```powershell
python -m venv .venv-ai
.venv-ai\Scripts\Activate.ps1
pip install -r ai\requirements-ai.txt
```

El entrenamiento usa NumPy y scikit-learn. La captura con cámara **no** necesita
MediaPipe server-side: la herramienta interna de grabación ejecuta MediaPipe en
el navegador.

---

## 4. Entrenar el modelo (demo o con muestras reales)

```powershell
python ai\training\train_model.py
```

El script:

1. Lee las muestras reales de `ai/dataset/argentine/<SEÑA>/` (si existen).
2. Para cada seña demo sin muestras suficientes, genera plantillas sintéticas.
3. Agrega ruido gaussiano y normaliza las muestras.
4. Entrena un `RandomForestClassifier`.
5. Guarda `ai/models/sign_model.pkl` con validación cruzada y reporte por clase.

Con el dataset vacío entrena las 9 clases demo. El backend también puede
entrenar y recargar el modelo con `POST /api/ai/train` (requiere admin).

Clases:

```text
HOLA, GRACIAS, SI, NO, ADIOS, POR_FAVOR, BUENOS_DIAS, BUENAS_TARDES, AYUDA
```

El backend también puede entrenar su propio demo en el primer arranque y
guardarlo en `backend/app/ai/models/demo_sign_model.pkl`.

---

## 5. Capturar un dataset real

La forma recomendada es la **herramienta interna “Grabador de señas”**
(`/recorder.html`): activa la cámara, captura 21 landmarks por frame y guarda un
JSON por muestra en `ai/dataset/argentine/<SEÑA>/`. Es una página aparte de la
app pública, con login propio y sin enlace en el menú. Al guardar, la seña se
registra sola en el catálogo y aparece en la app. Ver
`docs/como-agregar-mas-senas.md`.

Para entrenar con lo capturado (desde la raíz, con numpy y scikit-learn):

```powershell
python ai\training\train_model.py
```

El script:

1. Lee las muestras JSON del dataset y las normaliza a 63 features.
2. Combina las muestras reales con las plantillas demo (para no romper el modo
   demostración) y espeja la mano como aumento de datos.
3. Entrena un `RandomForestClassifier` y reporta validación cruzada/precisión.
4. Guarda `ai/models/sign_model.pkl` con `{"model", "signs", "translations"}`.

El mismo entrenamiento se puede disparar desde la API con `POST /api/ai/train`,
que además recarga el clasificador sin reiniciar el backend.

También existe `python -m ai.preprocessing.landmarks`, pero requiere `mediapipe`
instalado en el entorno local y no es necesario si usás el grabador web.

Para apuntar el backend a otro archivo:

```ini
# backend/.env
AI_MODEL_PATH=C:\ruta\completa\a\sign_model.pkl
AI_MODEL_MODE=auto
```

---

## 6. Cómo usa el backend el modelo

`backend/app/ai/model.py` respeta `AI_MODEL_MODE`:

1. `demo`: usa siempre `backend/app/ai/models/demo_sign_model.pkl`.
2. `trained`: usa `AI_MODEL_PATH` o `ai/models/sign_model.pkl`.
3. `auto` (por defecto): intenta `AI_MODEL_PATH`, luego
   `ai/models/sign_model.pkl`, y si no existen cae al demo.
4. Si el demo no existe, lo entrena en caliente y lo guarda.

`AI_MIN_CONFIDENCE` se informa en `/api/ai/info`, pero **no se aplica** en el
servidor. La app web/móvil decide si guarda o advierte.

---

## 7. Limitaciones

- No hay dataset real de LSA en el repositorio.
- Las plantillas sintéticas no cubren variaciones reales de las señas.
- La normalización no corrige rotación.
- No se usa la mano izquierda/derecha como feature.
- No hay validación con personas usuarias de LSA.
- El modelo demo sirve para probar el flujo, no para evaluar precisión.
- La ruta `image_base64` del backend requiere `mediapipe`, que no está en
  `requirements.txt`.

---

## 8. Trabajo futuro

- Recolectar un dataset con consentimiento y protocolo.
- Separar entrenamiento/validación/prueba por persona para evitar fuga de datos.
- Medir precisión, recall y matriz de confusión por clase.
- Probar robustez ante rotación, iluminación y distinta cámara.
- Evaluar aumento de datos y modelos alternativos.
- Considerar TFLite/ONNX para inferencia en dispositivo.
- Documentar licencia y privacidad del dataset.
