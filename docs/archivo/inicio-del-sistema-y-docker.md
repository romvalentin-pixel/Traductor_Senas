# Cómo iniciar todo el sistema

> Guía práctica para levantar el proyecto en tu PC: backend, app móvil, cliente web legado y opción con Docker.

## 1. Qué componentes tiene el proyecto

| Componente | Carpeta | Tecnología | Para qué sirve |
|---|---|---|---|
| **Backend / API** | `backend/` | FastAPI + SQLAlchemy | Autenticación, predicción de señas, historial, TTS, salud |
| **App móvil** | `mobile/` | Expo + React Native + TypeScript | Cliente principal para usar en celular/emulador |
| **Cliente web legado** | `frontend/` | React + Vite | Interfaz web anterior; útil para comparar y para Docker |
| **Base de datos** | PostgreSQL o SQLite | SQLAlchemy | Usuarios, traducciones, catálogo de señas |
| **Docker Compose** | `docker-compose.yml` | Docker | Levanta PostgreSQL + backend + frontend web |

> **Importante:** La app móvil **no** se levanta con Docker. Se ejecuta aparte con `npm start` (Expo), porque necesita Metro Bundler y acceso a cámara/permisos del dispositivo.

## 2. Requisitos

- **Node.js 20+** y npm (para `mobile/` y `frontend/`).
- **Python 3.11–3.13** (para `backend/`).
- **PostgreSQL 14+** (opcional; podés usar SQLite en desarrollo).
- **Docker Desktop** (opcional; solo si querés usar `docker compose`).
- **Expo Go** o emulador/dispositivo para la app móvil.

## 3. Inicio rápido (sin Docker)

Necesitás **dos terminales** como mínimo: una para el backend y otra para el cliente que quieras usar.

### 3.1 Backend

Desde la raíz del proyecto:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item ..\.env.example .env
```

Editar `backend/.env` si hace falta. Para desarrollo rápido sin PostgreSQL, podés usar SQLite:

```powershell
$env:DATABASE_URL = "sqlite:///./sl_translator.db"
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Si querés probar desde un celular físico en la misma red, usá:

```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Comprobaciones:

- Salud: http://localhost:8000/api/health
- Documentación: http://localhost:8000/docs

**Problema común:** si el `.venv` está roto (por ejemplo, apunta a un Python que no existe en tu PC), borrá `backend/.venv` y crealo de nuevo con los comandos de arriba.

### 3.2 App móvil (cliente principal)

En otra terminal:

```powershell
cd mobile
npm install
Copy-Item .env.example .env
```

Editá `mobile/.env`:

```ini
EXPO_PUBLIC_API_URL=http://IP-DE-TU-PC:8000/api
```

Guía rápida de URL:

| Dónde corrés la app | URL recomendada |
|---|---|
| Emulador Android | `http://10.0.2.2:8000/api` |
| Emulador iOS (macOS) | `http://localhost:8000/api` |
| Celular físico (misma Wi‑Fi) | `http://IP-LAN-DE-TU-PC:8000/api` |

Para ver tu IP en Windows: `ipconfig` (buscá la IPv4 de Wi‑Fi/Ethernet).

Arrancar Expo:

```powershell
npm start
```

Luego: `a` para Android, `i` para iOS (macOS), o escanear el QR con **Expo Go**. Si hay problemas de caché: `npx expo start --clear`.

### 3.3 Cliente web legado (opcional)

En otra terminal:

```powershell
cd frontend
npm install
npm run dev
```

Abrir: http://localhost:5173

Vite redirige `/api` al backend en `http://localhost:8000`, así que el backend debe estar corriendo.

## 4. Cómo iniciarlo con Docker

Docker es la forma más fácil de levantar **PostgreSQL + backend + frontend web** con un solo comando.

### 4.1 Requisitos Docker

- Docker Desktop instalado y en ejecución.
- `docker --version` y `docker compose version` funcionando.

### 4.2 Configurar variables

En la raíz del proyecto:

```powershell
Copy-Item .env.example .env
```

Abrí `.env` y cambiá al menos:

```ini
SECRET_KEY=una-clave-larga-y-aleatoria
```

El resto puede quedar con valores por defecto para desarrollo local.

### 4.3 Levantar servicios

Desde la raíz (donde está `docker-compose.yml`):

```powershell
docker compose up --build
```

La primera vez tarda más porque descarga imágenes e instala dependencias.

Servicios que quedan disponibles:

| Servicio | URL / Puerto |
|---|---|
| Frontend web legado | http://localhost |
| Backend API | http://localhost:8000 |
| Swagger | http://localhost:8000/docs |
| PostgreSQL | `localhost:5432` |

Para correr en segundo plano:

```powershell
docker compose up -d
```

Para ver logs:

```powershell
docker compose logs -f
```

Para detener:

```powershell
docker compose down
```

Para detener y borrar también el volumen de datos de PostgreSQL (borra usuarios/historial guardados en ese volumen):

```powershell
docker compose down -v
```

> **Cuidado:** `docker compose down -v` elimina los datos del volumen `pgdata`.

### 4.4 Usar la app móvil junto con Docker

Aunque uses Docker, la app móvil se levanta aparte:

```powershell
cd mobile
npm install
Copy-Item .env.example .env
npm start
```

En `mobile/.env`, apuntá al backend que expone Docker en el puerto 8000:

- Emulador Android: `http://10.0.2.2:8000/api`
- Celular físico: `http://IP-DE-TU-PC:8000/api`

El backend en Docker ya publica `8000:8000`, así que la app móvil puede conectarse igual que en el modo sin Docker.

## 5. Orden recomendado para probar

1. Levantar **backend** (manual o Docker).
2. Verificar `GET /api/health`.
3. Levantar **mobile** o **frontend**.
4. Registrarte / iniciar sesión.
5. Probar una traducción en modo **Demostración** (no depende de cámara ni MediaPipe).
6. Revisar que se guarde en **Historial**.

## 6. Problemas frecuentes

| Problema | Causa común | Solución |
|---|---|---|
| `npm install` falla en la raíz | No hay `package.json` en la raíz | Entrá a `mobile/` o `frontend/` antes de correr `npm install` |
| Backend no arranca / error de imports en `.venv` | Entorno virtual roto o dependencias corruptas | Borrar `backend/.venv`, recrearlo e instalar `requirements.txt` |
| App móvil no conecta al backend | URL incorrecta o backend solo en `127.0.0.1` | Usar IP LAN, verificar `EXPO_PUBLIC_API_URL`, arrancar backend con `--host 0.0.0.0` |
| `503` al usar cámara/imagen | Falta `mediapipe` en el backend | Usar modo Demostración o instalar `mediapipe` en el entorno del backend |
| Docker no levanta | Docker Desktop apagado o puerto ocupado | Abrir Docker Desktop; revisar puertos 80/8000/5432 |
| Cambios de modelo de usuario (reset de contraseña) no aplican en SQLite existente | `create_all` no altera tablas viejas | Para desarrollo, borrar el `.db` SQLite y dejar que se recree; para producción usar migraciones |

## 7. Comandos útiles

```powershell
# Ver salud del backend
Invoke-RestMethod http://localhost:8000/api/health

# IP de tu PC (Windows)
ipconfig

# Limpiar caché de Expo
cd mobile
npx expo start --clear

# Docker: estado
docker compose ps
```
