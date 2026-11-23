# Documentación

Índice de la documentación vigente del proyecto. El cliente principal es la
**web** (`frontend/`, React + Vite); la app Expo (`mobile/`) es un cliente
opcional. El backend es FastAPI con PostgreSQL o SQLite.

---

## 1. Empezar acá

| Documento | Para qué sirve |
|---|---|
| [`../README.md`](../README.md) | Estado del proyecto, alcance real, inicio rápido y limitaciones |
| [`instalacion-y-ejecucion.md`](instalacion-y-ejecucion.md) | Levantar backend, base de datos, web y (opcional) app móvil |
| [`guia-de-uso.md`](guia-de-uso.md) | Uso de la aplicación web: cuenta, traductor, historial y configuración |

---

## 2. Documentación técnica

| Documento | Contenido |
|---|---|
| [`architecture.md`](architecture.md) | Arquitectura, componentes, tecnologías, flujos y decisiones |
| [`api.md`](api.md) | Contrato de la API REST, autenticación y ejemplos |
| [`database.md`](database.md) | Esquema, tablas, índices y datos iniciales |
| [`pruebas-y-errores.md`](pruebas-y-errores.md) | Suites, comandos, cobertura y errores conocidos |
| [`como-agregar-mas-senas.md`](como-agregar-mas-senas.md) | Grabador interno, dataset y entrenamiento de señas nuevas |
| [`lsa64-referencia.md`](lsa64-referencia.md) | Referencia del dataset público LSA64 |
| [`../ai/README.md`](../ai/README.md) | Pipeline de captura, features y entrenamiento |
| [`../mobile/README.md`](../mobile/README.md) | App Expo opcional (cliente experimental) |

---

## 3. Estado y cambios

| Documento | Contenido |
|---|---|
| [`bitacora.md`](bitacora.md) | Cronología del proyecto: punto de partida, auditoría, móvil, grabador y limpieza |
| [`analisis-limpieza-y-mejoras.md`](analisis-limpieza-y-mejoras.md) | Diagnóstico y plan de limpieza; marca qué fases ya se aplicaron |
| [`../CHANGELOG.md`](../CHANGELOG.md) | Resumen de cambios relevantes del proyecto |

---

## 4. Documentación histórica

Estos documentos describen etapas anteriores. Se conservan como registro y
**no** reflejan necesariamente el estado actual:

- [`archivo/auditoria-proyecto.md`](archivo/auditoria-proyecto.md)
- [`archivo/bitacora-v1-original.md`](archivo/bitacora-v1-original.md) — bitácora original desde cero (v1.0, 2026-10-22)
- [`archivo/plan-de-migracion.md`](archivo/plan-de-migracion.md)
- [`archivo/github-paso-a-paso.md`](archivo/github-paso-a-paso.md)
- [`archivo/cambios-grabador-de-senas.md`](archivo/cambios-grabador-de-senas.md)
- [`archivo/inicio-del-sistema-y-docker.md`](archivo/inicio-del-sistema-y-docker.md)
- [`archivo/decisiones-tecnicas.md`](archivo/decisiones-tecnicas.md)

---

## 5. Convenciones

- **Seña:** nombre canónico en MAYÚSCULAS (`HOLA`, `BUENAS_NOCHES`).
- **Muestra:** un cuadro con 21 landmarks `(x, y, z)` de una mano.
- **Grabador:** herramienta interna `/recorder.html`, sin enlace en el menú.
- **Catálogo:** tabla `signs`; `/api/signs` marca con `recognized` si el modelo
  activo puede reconocer cada seña.
- **Modelo demo:** 9 clases sintéticas para validar el flujo, no LSA real.
