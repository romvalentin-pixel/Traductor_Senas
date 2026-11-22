# Estructura de datos del dataset

Cada muestra es un archivo JSON con una (o varias) manos detectadas por MediaPipe.

## Ubicación

```
ai/dataset/
├── argentine/              # Dataset LSA (a completar)
│   ├── HOLA/sample_0001.json
│   ├── GRACIAS/sample_0001.json
│   └── ...
└── README.md               # este archivo
```

## Formato de una muestra

```json
{
  "sign": "HOLA",
  "language": "es-AR",
  "creator": "voluntario-01",
  "hands": [
    [
      [0.5123, 0.8432, 0.0],
      [0.5012, 0.7712, -0.02],
      "... 21 landmarks con (x, y, z) ..."
    ]
  ]
}
```

- `hands`: lista de manos detectadas en el frame. Cada mano tiene **21
  landmarks** y cada landmark **3 coordenadas** (x, y, z) normalizadas de
  MediaPipe.
- Guardar entre 100 y 300 muestras por seña repartidas entre varios voluntarios
  mejora notablemente la generalización.

## Cómo se llenan estas carpetas

La herramienta interna **Grabador de señas** (`/recorder.html`) escribe
automáticamente:

```
ai/dataset/argentine/<SEÑA>/sample_<AAAAMMDD_HHMMSS>_<id>.json
```

con `"source": "web-recorder"`. Al guardar, la seña también se registra sola en
el catálogo (`signs`) y aparece en la app. Después se entrena con
`POST /api/ai/train` o `python ai\training\train_model.py`. Guía completa en
`docs/como-agregar-mas-senas.md`.

## Recomendaciones para un dataset LSA útil

1. Grabar a distintas personas, posiciones de cámara y fondos.
2. Registrar la seña estática y su movimiento (tomar varios frames seguidos).
3. Incluir tanto seña aislada como en secuencia.
4. Etiquetar con el nombre canónico (`SIGNS`) y el dialecto (`es-AR`).