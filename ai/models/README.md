# Modelos

Carpeta donde se guardan los clasificadores serializados.

| Archivo | Contenido | Generado por |
|---|---|---|
| `sign_model.pkl` | Modelo entrenado (real o demo) — blob `{model, signs}` | `ai/training/train_model.py` o `POST /api/ai/train` |
| `demo_sign_model.pkl` | Modelo demo (auto-generado por el backend si falta) | `backend/app/ai/model.py` |

El backend busca primero `AI_MODEL_PATH` y, si no está, usa
`ai/models/sign_model.pkl`; si tampoco existe, cae al modelo demo.

El script `ai/training/train_model.py` combina las muestras reales de
`ai/dataset/argentine/` con las 9 plantillas demo. El endpoint
`POST /api/ai/train` hace lo mismo desde el backend y recarga el modelo en
caliente. Requiere una cuenta incluida en `ADMIN_EMAILS`.

> Los `.pkl` no se versionan en git (ver `.gitignore`). Se regeneran con el
> script de entrenamiento o desde el grabador interno.
