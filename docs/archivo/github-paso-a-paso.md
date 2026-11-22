# Git y GitHub paso a paso

> **Estado actual:** el proyecto **no está inicializado como repositorio Git**
> (no existe `.git`). Este documento explica cómo hacerlo, pero **no ejecutes
> `git init` ni `git push` sin autorización** del responsable del proyecto.

---

## 1. Antes de empezar

Verificá:

```powershell
git --version
git config --global user.name
git config --global user.email
```

Si faltan:

```powershell
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

No cambies la configuración global si el proyecto exige otra identidad; en ese
caso usá configuración local dentro del repositorio.

---

## 2. Revisar qué se va a versionar

El `.gitignore` de la raíz excluye:

- `.env` y secretos;
- `.venv/`, `__pycache__/` y cachés de Python;
- `*.pkl` (modelos generados);
- `*.db` y `*.sqlite3`;
- `node_modules/`, `dist/`, `coverage/`;
- archivos de IDE y del sistema.

**Nunca** deben subirse:

- `backend/.env`, `mobile/.env`, `frontend/.env`;
- tokens, contraseñas o claves;
- bases de datos con datos reales;
- fotos o datos personales;
- modelos entrenados con datos sensibles sin autorización.

Antes de cada commit:

```powershell
git status
git diff --stat
```

Y si hay archivos preparados:

```powershell
git diff --cached
```

---

## 3. Inicializar el repositorio

> Requiere autorización explícita.

```powershell
git init
git branch -M main
```

Comprobar que `.env` y `node_modules` no aparezcan como “untracked”:

```powershell
git status --short
```

Si aparecen, revisar `.gitignore` antes de continuar.

---

## 4. Primer commit

Agregar solo lo necesario:

```powershell
git add README.md .gitignore docker-compose.yml .env.example
git add backend database docs ai
git add mobile
git add frontend
```

Revisar:

```powershell
git status
git diff --cached --stat
```

Commit inicial:

```powershell
git commit -m "chore: estado inicial del traductor LSA con cliente movil"
```

Si el proyecto tenía un commit previo, no uses `--amend` para “arreglar” un
commit ya publicado; creá uno nuevo.

---

## 5. Crear el repositorio en GitHub

### Opción A: GitHub CLI

```powershell
gh auth login
gh repo create traductor-lsa --private --source=. --remote=origin --push
```

Para un repositorio público, cambiar `--private` por `--public` solo si el
contenido puede publicarse (revisar licencias, datos y documentación).

### Opción B: web + remoto manual

1. Crear el repositorio vacío en <https://github.com/new>.
2. No inicializarlo con README, `.gitignore` ni licencia.
3. Conectar:

```powershell
git remote add origin https://github.com/USUARIO/traductor-lsa.git
git push -u origin main
```

Si usás SSH:

```powershell
git remote add origin git@github.com:USUARIO/traductor-lsa.git
git push -u origin main
```

---

## 6. Flujo de trabajo recomendado

```text
main            versión estable
  └── feat/...  nueva funcionalidad
  └── fix/...   corrección
  └── docs/...  documentación
```

Crear una rama:

```powershell
git switch -c feat/mejoras-traductor
```

Trabajar, probar y commitear:

```powershell
cd backend
pytest -q

cd ..\mobile
npm run typecheck
npm test -- --runInBand

cd ..
git add mobile backend docs
git commit -m "feat(mobile): mejorar captura de camara"
git push -u origin feat/mejoras-traductor
```

Abrir un Pull Request:

```powershell
gh pr create --fill --base main
```

Revisar el diff completo, no solo el último commit:

```powershell
git log --oneline main..HEAD
git diff main...HEAD
```

---

## 7. Mensajes de commit

Formato sugerido:

```text
tipo(alcance): descripción breve en imperativo
```

Tipos:

| Tipo | Uso |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de error |
| `docs` | Documentación |
| `test` | Pruebas |
| `refactor` | Cambio interno sin alterar comportamiento |
| `chore` | Configuración, dependencias, mantenimiento |
| `style` | Formato, sin cambio lógico |

Ejemplos:

```text
feat(mobile): agregar autoguardado de traducciones
fix(backend): devolver SignOut en fallback de /api/signs
docs: actualizar arquitectura y guia de instalacion
test(mobile): cubrir errores de red y timeout
```

No mezcles en un mismo commit cambios no relacionados.

---

## 8. Verificar antes de publicar

Checklist:

- [ ] `git status` no muestra `.env`, `.venv`, `node_modules`, `*.pkl` ni `*.db`.
- [ ] No hay claves, tokens ni contraseñas en el diff.
- [ ] Las pruebas pasan.
- [ ] El README refleja el estado real.
- [ ] Los cambios de API están documentados.
- [ ] No se eliminaron archivos sin autorización.
- [ ] El commit tiene un mensaje claro.

Comandos:

```powershell
git status
git diff --cached
git log --oneline -5
```

---

## 9. Si se subió un secreto por error

1. **Rotar** la clave o contraseña de inmediato.
2. Eliminar el archivo del repositorio y del historial si es necesario.
3. No alcanza con borrarlo en un commit nuevo: sigue en el historial.
4. Usar `git filter-repo` o la herramienta recomendada por GitHub.
5. Avisar al equipo y revisar accesos.

Nunca publiques un `.env` real para “probar”.

---

## 10. Releases y entrega

Versión sugerida:

```text
v1.0.0  entrega académica inicial
v1.1.0  mejoras de cámara o documentación
```

Crear una etiqueta:

```powershell
git tag -a v1.0.0 -m "Entrega inicial: backend, app movil y documentacion"
git push origin v1.0.0
```

En GitHub:

1. Ir a **Releases**.
2. Crear una release desde la etiqueta.
3. Describir cambios, límites y comandos de ejecución.
4. Adjuntar solo artefactos que puedan distribuirse.

Para publicar la app móvil se necesita EAS Build o un build nativo; el código del
repositorio no es una app instalable por sí solo.

---

## 11. Integración continua opcional

Un flujo mínimo de GitHub Actions podría ejecutar:

```yaml
# .github/workflows/ci.yml (ejemplo, no creado aún)
name: CI

on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install -r backend/requirements.txt
      - run: pytest -q
        working-directory: backend

  mobile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
        working-directory: mobile
      - run: npm run typecheck
        working-directory: mobile
      - run: npm test -- --runInBand
        working-directory: mobile
```

Ya existe `mobile/package-lock.json`; antes de activar el flujo, confirmar que
`npm ci` funciona en el entorno de CI. El workflow no se creó en esta etapa.

---

## 12. Errores frecuentes

| Error | Causa | Solución |
|---|---|---|
| `fatal: not a git repository` | No se inicializó | `git init` con autorización |
| `src refspec main does not match any` | No hay commit en `main` | Hacer el primer commit |
| `failed to push some refs` | El remoto tiene cambios | `git pull --rebase` y resolver |
| `Permission denied (publickey)` | SSH mal configurado | Usar HTTPS o cargar la clave SSH |
| `GH013` o secreto detectado | GitHub bloquea el push | Rotar el secreto y limpiar el historial |
| `LF will be replaced by CRLF` | Configuración de saltos de línea | Es un aviso; definir `.gitattributes` si hace falta |
| `node_modules` incluido | `.gitignore` mal aplicado | `git rm -r --cached node_modules` y verificar |

---

## 13. Lo que no debe hacer un agente automático

- No ejecutar `git init`, `git push`, `git reset --hard`, `git clean -fd` ni
  `git filter-repo` sin autorización.
- No hacer `force push` a `main`.
- No reescribir historia compartida.
- No commitear secretos “temporalmente”.
- No borrar el frontend legado ni archivos grandes sin confirmación.
