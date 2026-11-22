# Frontend web del Traductor de Lenguaje de Señas

> Cliente **principal** del sistema. Es una aplicación React + Vite que corre
> MediaPipe en el navegador y funciona en computadora y celular. La app Expo
> (`../mobile/`) se conserva como cliente opcional.

```dockerfile
# build: genera el bundle estático con Node
# runtime: lo sirve nginx y redirige /api al backend
```

Uso dentro de `docker-compose.yml` (carpeta raíz).

## Desarrollo local

```powershell
cd frontend
npm install
npm run dev
```

El *dev server* corre en <http://localhost:5173> y redirige `/api` al backend
(debe estar ejecutándose en <http://localhost:8000>).

El grabador interno queda en <http://localhost:5173/recorder.html> y requiere
una cuenta incluida en `ADMIN_EMAILS`.

## Build de producción + preview

```powershell
npm run build
npm run preview
```

El build genera dos entradas: `index.html` (app pública) y `recorder.html`
(herramienta interna).

## Tests

```powershell
npm test -- --run
```

Resultado actual: **19 pruebas en 6 archivos**.

## Variables de entorno

Copiá `.env.example` a `.env` del frontend si querés apuntar a otro backend
(`VITE_API_URL`). Por defecto usa el proxy `/api`.

## Estructura

- `src/pages/` — Inicio, Traductor, Historial, Configuración, auth.
- `src/recorder/` — entrada y login de la herramienta interna.
- `src/hooks/` — cámara, MediaPipe y voz.
- `src/services/` — HTTP, auth, IA y traducciones.
- `src/context/` — sesión y preferencias.
