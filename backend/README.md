# Backend — Traductor de Lenguaje de Señas

API REST construida con **Python 3.11 + FastAPI + SQLAlchemy + PostgreSQL**.

## Requisitos

- Python 3.11 o superior.
- PostgreSQL 14+ (o alternativa: usar SQLite con la variable `DATABASE_URL`).
- Internet para instalar dependencias.

## Instalación

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Configuración

Copiá `../.env.example` a `.env` (en la carpeta `backend` si corrés local) y
ajustá las variables. Mínimo:

```ini
DATABASE_URL=postgresql://postgres:clave@localhost:5432/sign_language
SECRET_KEY=una-clave-larga-y-secreta
```

> Para pruebas sin PostgreSQL: `DATABASE_URL=sqlite:///./sl_translator.db`

## Ejecutar

```powershell
uvicorn app.main:app --reload --port 8000
```

Documentación automática:

- Swagger UI: <http://localhost:8000/docs>
- ReDoc: <http://localhost:8000/redoc>
- OpenAPI: <http://localhost:8000/openapi.json>
- Health: <http://localhost:8000/api/health>

## Base de datos

Creá la base y aplicá el esquema (una única vez):

```powershell
psql -U postgres -c "CREATE DATABASE sign_language;"
psql -U postgres -d sign_language -f ../database/schema.sql
psql -U postgres -d sign_language -f ../database/seed.sql
```

> En desarrollo el backend crea las tablas automáticamente al iniciar
> (`Base.metadata.create_all`).

## Tests

```powershell
pytest
```

## Estructura

```
app/
├── api/        # Rutas REST + dependencias (auth, traducciones, IA, sistema)
├── core/       # Configuración (env) y seguridad (JWT/Bcrypt)
├── database/   # Motor, sesión y base declarativa
├── models/     # Modelos SQLAlchemy (users, translations, signs, feedback)
├── schemas/    # Esquemas Pydantic
├── services/   # Lógica de negocio (auth, traducción, IA, TTS, imagen)
├── ai/         # Landmarks, plantillas demo y clasificador
└── main.py     # Bootstrap de FastAPI
```