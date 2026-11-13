# Referencia LSA64 (dataset argentino)

> Fuente: [LSA64: A Dataset for Argentinian Sign Language](https://facundoq.github.io/datasets/lsa64/) (Facundo Quiroga et al.).  
> **Licencia:** CC BY-NC-SA 4.0 — uso académico/educativo/personal permitido; no comercial; obras derivadas bajo misma licencia; citar el dataset/artículo. Ver detalles en la fuente.

## Resumen del dataset
- 3200 videos: 10 sujetos × 5 repeticiones × 64 clases.
- 64 signos seleccionados del léxico común de LSA (verbos y sustantivos).
- Grabado en dos sesiones (exterior/luz natural y interior/luz artificial). El sujeto 10 cambió entre sesiones, pero las clases son disjuntas entre sesiones.
- Sujetos con ropa negra, fondo blanco, guantes fluorescentes; cámara Sony HDR-CX240, 1920×1080, 60 fps.
- Versiones disponibles: raw, cut/segmentada temporalmente, preprocesada (posiciones de manos/cabeza en Matlab + videos de manos segmentadas).

## Clases (64)

| ID | Nombre (según LSA64) | Manos | ID | Nombre (según LSA64) | Manos |
|---:|---|:---:|---:|---|:---:|
| 01 | Opaque | R | 33 | Hungry | R |
| 02 | Red | R | 34 | Map | B |
| 03 | Green | R | 35 | Coin | B |
| 04 | Yellow | R | 36 | Music | B |
| 05 | Bright | R | 37 | Ship | R |
| 06 | Light-blue | R | 38 | None | R |
| 07 | Colors | R | 39 | Name | R |
| 08 | Pink | R | 40 | Patience | R |
| 09 | Women | R | 41 | Perfume | R |
| 10 | Enemy | R | 42 | Deaf | R |
| 11 | Son | R | 43 | Trap | B |
| 12 | Man | R | 44 | Rice | B |
| 13 | Away | R | 45 | Barbecue | B |
| 14 | Drawer | R | 46 | Candy | R |
| 15 | Born | R | 47 | Chewing-gum | R |
| 16 | Learn | R | 48 | Spaghetti | B |
| 17 | Call | R | 49 | Yogurt | B |
| 18 | Skimmer | R | 50 | Accept | B |
| 19 | Bitter | R | 51 | Thanks | B |
| 20 | Sweet milk | R | 52 | Shut down | R |
| 21 | Milk | R | 53 | Appear | B |
| 22 | Water | R | 54 | To land | B |
| 23 | Food | R | 55 | Catch | B |
| 24 | Argentina | R | 56 | Help | B |
| 25 | Uruguay | R | 57 | Dance | B |
| 26 | Country | R | 58 | Bathe | B |
| 27 | Last name | R | 59 | Buy | R |
| 28 | Where | R | 60 | Copy | B |
| 29 | Mock | B | 61 | Run | B |
| 30 | Birthday | R | 62 | Realize | R |
| 31 | Breakfast | B | 63 | Give | B |
| 32 | Photo | B | 64 | Find | R |

`R` = mano derecha, `B` = ambas manos.

## Cómo usarlo con este proyecto

### Si tus videos “sin nombre” son de LSA64
- Revisá el **patrón de nombres de archivo** del dataset que tenés. LSA64 suele organizarse por clase/sujeto/repetición; con la convención correcta podés recuperar la etiqueta (ID/nombre) automáticamente.
- Si me pasás la **ruta** y unos ejemplos de nombres de archivo, te armo el mapeo a estas 64 clases.

### Si tus videos son otro dataset
- LSA64 no etiqueta automáticamente videos ajenos. Podés usar esta tabla como **vocabulario objetivo** para etiquetar manualmente o con una herramienta de apoyo.
- Alternativamente, podés descargar LSA64 (respetando licencia) y usarlo como fuente etiquetada.

### Integración técnica en este repo (importante)
- Este proyecto clasifica **63 features** (21 landmarks × 3, una mano) con el pipeline actual (`backend/app/ai/*`, `ai/training/*`).
- LSA64 incluye signos de **dos manos (B)** y fue grabado con guantes fluorescentes/condiciones controladas. Adaptarlo requiere:
  1. Definir estrategia para dos manos (el backend actual toma la mano más prominente / contrato de 63 features).
  2. Extraer landmarks (MediaPipe) desde los videos, etiquetar según clase LSA64.
  3. Generar `dataset.csv` compatible y entrenar con `ai/training/train_model.py`.
  4. Cargar el `.pkl` con `AI_MODEL_PATH`.
- La versión *preprocesada* de LSA64 trae posiciones de manos/cabeza en Matlab, **no** el mismo formato de 21 landmarks MediaPipe usado aquí; puede servir como referencia, pero no es plug-and-play.

## Cita
Ronchetti, Franco; Quiroga, Facundo; Estrebou, Cesar; Lanzarini, Laura; Rosete, Alejandro. *LSA64: A Dataset of Argentinian Sign Language*. XXII CACIC, 2016.
