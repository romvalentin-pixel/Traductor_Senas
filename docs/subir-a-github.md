# Subir el proyecto a GitHub por partes

Guía para publicar el repositorio, mostrar el avance por etapas y volver a
versiones anteriores. El proyecto se inicializó con Git el **2026-11-15** con un
historial reconstruido a partir de la bitácora.

> **Importante:** este repositorio **todavía no tiene remoto**. Los commits y
> las etiquetas existen solo en tu computadora hasta que hagas el `push`.

---

## 1. Qué se versiona y qué no

El `.gitignore` de la raíz deja afuera todo lo que no debe publicarse:

| Se versiona | No se versiona |
|---|---|
| Código de `backend/`, `frontend/`, `mobile/`, `ai/` | `.env` reales (raíz y `backend/`) |
| `database/schema.sql` y `seed.sql` | `.venv/` y `.venv-roto-20261113/` |
| Documentación de `docs/` y `README.md` | `node_modules/`, `dist/`, cachés |
| `requirements.txt`, `package.json`, `package-lock.json` | `*.db`, `*.sqlite3` |
| `docker-compose.yml` y los `Dockerfile` | `*.pkl` (modelo entrenado) |
| `.env.example` (plantillas sin secretos) | `ai/dataset/argentine/*/*.json` (muestras) |
| | `docs/material/*.pdf` (libro de 26 MB) |

Antes de cualquier `push`, comprobá que no se cuele un secreto:

```powershell
git status --short
git ls-files | Select-String -Pattern '\.env$|\.venv|node_modules|\.pkl$|\.db$'
```

El segundo comando **no debe devolver nada**. Si devuelve algo, revisá
`.gitignore` antes de continuar.

---

## 2. Revisar el historial reconstruido

```powershell
git log --oneline --decorate --graph
git tag -n
```

Vas a ver ocho commits, cada uno con su etiqueta:

| Etiqueta | Fecha | Contenido |
|---|---|---|
| `v0.1.0` | 2026-10-08 | Estructura, `.gitignore`, `.gitattributes` y diseño (arquitectura, base de datos, API) |
| `v0.2.0` | 2026-10-10 | `database/schema.sql` y `database/seed.sql` |
| `v0.3.0` | 2026-10-14 | `backend/` completo: API, JWT, TTS y pruebas |
| `v0.4.0` | 2026-10-17 | `ai/`: features, modelo demo y entrenamiento |
| `v0.5.0` | 2026-10-20 | `frontend/`: traductor, historial y configuración |
| `v0.6.0` | 2026-10-22 | `docker-compose.yml` y `mobile/` (cliente Expo opcional) |
| `v0.7.0` | 2026-11-13 | Bitácora, pruebas, guías y documentos históricos |
| `v1.0.0` | 2026-11-15 | Bitácora original, guía de publicación y estado verificado |

Cómo se armó:

- Los commits agrupan los archivos **por área** (base, backend, IA, web, etc.).
- Las fechas son las de la etapa documentada en
  [`bitacora.md`](bitacora.md); son **aproximadas**.
- **No** son una copia exacta del código de esa fecha: son un recorrido
  reconstruido para mostrar el avance. Solo `v1.0.0` está verificado con las
  suites actuales (42 pruebas backend, 19 web y build OK).
- El script que lo genera está en
  [`../scripts/crear-historial-git.ps1`](../scripts/crear-historial-git.ps1).

---

## 3. Verificar la identidad de Git

```powershell
git --version
git config --global user.name
git config --global user.email
```

Si falta la identidad:

```powershell
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

Si querés una identidad distinta solo para este proyecto:

```powershell
git config user.name "Tu Nombre"
git config user.email "tu@email.com"
```

---

## 4. Crear el repositorio en GitHub

### Opción A — GitHub CLI

```powershell
gh auth login
gh repo create traductor-lsa --private --source=. --remote=origin
```

No agregues `--push` todavía: primero conviene revisar qué se va a subir.

### Opción B — desde la web

1. Entrá a <https://github.com/new>.
2. Nombre sugerido: `traductor-lsa`.
3. Elegí **Private** mientras revisás el contenido.
4. **No** marques “Add a README”, “Add .gitignore” ni “Choose a license”: el
   repositorio local ya los tiene y se generarían conflictos.
5. Copiá la URL del repositorio.

Conectá el remoto:

```powershell
git remote add origin https://github.com/TU-USUARIO/traductor-lsa.git
git remote -v
```

> **Antes de hacerlo público:** revisá que no haya datos personales, correos de
> compañeros, muestras de manos ni el PDF del señario. Si el repositorio va a
> ser público, cambiá `--private` por `--public` solo cuando estés seguro.

---

## 5. Subir todo de una vez (recomendado)

```powershell
git push -u origin main
git push origin --tags
```

Verificar:

```powershell
git status
git log --oneline --decorate -8
git ls-remote --tags origin
```

En GitHub, la pestaña **Code** debe mostrar `main` y el selector de ramas debe
listar las ocho etiquetas. La pestaña **Releases** todavía está vacía: las
etiquetas no crean releases por sí solas (ver sección 7).

---

## 6. Subir “por partes”

Git no permite subir un commit aislado sin sus antecesores: al hacer `push` de
una rama se envían todos los commits de los que depende. Para mostrar el avance
por etapas hay varios caminos válidos.

### 6.1 Por ramas (lo más claro para una presentación)

Crear una rama por etapa desde su etiqueta y subirla:

```powershell
git switch -c etapa/backend v0.3.0
git push -u origin etapa/backend

git switch main
git switch -c etapa/web v0.5.0
git push -u origin etapa/web
```

Después podés abrir un Pull Request por rama:

```powershell
gh pr create --base main --head etapa/backend --fill
```

Así GitHub muestra cada etapa como un cambio separado, con su discusión y su
diff, sin reescribir `main`.

### 6.2 Por etiquetas

Si preferís no subir todas juntas:

```powershell
git push origin v0.1.0
git push origin v0.2.0
git push origin v0.3.0
# ...
git push origin v1.0.0
```

Cada etiqueta queda visible en el selector de ramas y en **Tags**.

### 6.3 Por releases

Las releases se crean sobre etiquetas ya subidas (sección 7). Es la forma más
cómoda de que el docente vea “versión por versión” con notas y, si hace falta,
un ZIP descargable.

### 6.4 Subir solo una parte del proyecto

Si querés publicar primero el backend y después el resto, partí de la primera
etapa y traé solo las carpetas que quieras mostrar:

```powershell
git switch -c publicacion/backend v0.1.0
git checkout main -- backend database
git commit -m "feat(backend): publicar backend y base de datos"
git push -u origin publicacion/backend
```

Después podés repetir con `frontend`, `ai` o `mobile` en la misma rama, o abrir
un Pull Request contra `main` cuando esté completo.

No borres commits de `main` para “simular” etapas: eso reescribe el historial y
complica el trabajo en equipo.

---

## 7. Publicar versiones (Releases)

Con las etiquetas ya subidas:

```powershell
gh release create v0.3.0 --title "v0.3.0 - Backend y API REST" --notes "API FastAPI con JWT, TTS y pruebas."
gh release create v1.0.0 --title "v1.0.0 - Entrega actual" --notes-file docs/bitacora.md
```

Desde la web:

1. Entrá a **Releases → Draft a new release**.
2. Elegí la etiqueta existente.
3. Escribí un título y notas breves.
4. Adjuntá solo archivos que puedan distribuirse (no `.env`, no modelos
   entrenados con datos personales).
5. Publicá.

Sugerencia de notas por versión:

| Versión | Notas |
|---|---|
| `v0.1.0` | Diseño y documentación inicial |
| `v0.2.0` | Esquema de base de datos y vocabulario |
| `v0.3.0` | Backend, autenticación y TTS |
| `v0.4.0` | Módulo de IA y modelo demo |
| `v0.5.0` | Cliente web con MediaPipe |
| `v0.6.0` | Docker y cliente móvil opcional |
| `v0.7.0` | Bitácora, pruebas y guías |
| `v1.0.0` | Estado actual: grabador con permisos, 42 pruebas backend y 19 web |

---

## 8. Volver a una versión vieja

Solo para mirar o comparar. **No** trabajes en “detached HEAD” sin crear una
rama.

```powershell
# Ver el proyecto como estaba en una etapa
git switch --detach v0.3.0
git log --oneline -3

# Volver a la versión actual
git switch main
```

Otras formas útiles:

```powershell
# Ver un archivo tal como estaba en una etiqueta
git show v0.3.0:README.md

# Comparar dos etapas
git diff v0.3.0 v1.0.0 --stat

# Abrir una copia de una etapa en otra carpeta, sin tocar la actual
git worktree add ..\traductor-v0.3 v0.3.0
```

Para borrar esa copia temporal:

```powershell
git worktree remove ..\traductor-v0.3
```

En GitHub, el selector de ramas y etiquetas (arriba a la izquierda del listado
de archivos) permite navegar el código de cualquier versión. **Code → Compare**
compara dos etiquetas.

---

## 9. Actualizar el repositorio después del primer push

```powershell
git status
git diff
git add -A
git commit -m "fix(web): corregir mensaje de error al guardar muestras"
git push
```

Si el cambio merece una versión nueva:

```powershell
git tag -a v1.0.1 -m "Correccion de mensajes de error"
git push origin v1.0.1
```

Convención de mensajes:

```text
tipo(alcance): descripción breve en imperativo
```

Tipos: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `style`.

---

## 10. Checklist antes de publicar

- [ ] `git status` no muestra `.env`, `.venv`, `node_modules`, `*.pkl` ni `*.db`.
- [ ] `git ls-files` no incluye secretos ni el PDF del señario.
- [ ] Las pruebas pasan (`pytest` en `backend/`, `npm test -- --run` en `frontend/`).
- [ ] `npm run build` funciona en `frontend/`.
- [ ] El `README.md` describe el estado real.
- [ ] La bitácora y el `CHANGELOG.md` están al día.
- [ ] Decidiste si el repositorio será privado o público.
- [ ] Si es público, revisaste correos, nombres y datos de terceros.

---

## 11. Errores frecuentes

| Error | Causa | Solución |
|---|---|---|
| `fatal: not a git repository` | No se inicializó Git | `git init -b main` (o correr el script de la sección 12) |
| `src refspec main does not match any` | No hay commits en `main` | Hacer el primer commit |
| `remote origin already exists` | El remoto ya estaba agregado | `git remote set-url origin URL` |
| `failed to push some refs` | El remoto tiene cambios | `git pull --rebase` y resolver |
| `Permission denied (publickey)` | SSH mal configurado | Usar HTTPS o cargar la clave SSH |
| `GH013` / secreto detectado | GitHub bloqueó el push | Rotar el secreto y limpiar el historial |
| `file is 123 MB; this exceeds GitHub's file size limit` | Archivo demasiado grande | Excluirlo o usar Git LFS (límite 100 MB por archivo) |
| `RPC failed; HTTP 400` con archivos grandes | Buffer de HTTP chico | `git config http.postBuffer 524288000` |
| `LF will be replaced by CRLF` | Saltos de línea | Es un aviso; `.gitattributes` ya normaliza |
| `node_modules` aparece como untracked | `.gitignore` mal aplicado | `git rm -r --cached node_modules` y verificar |

Si subiste un secreto por error: **rotá la clave primero** y después limpiá el
historial (`git filter-repo`). Borrarlo en un commit nuevo no alcanza.

---

## 12. Regenerar el historial desde cero

El script [`../scripts/crear-historial-git.ps1`](../scripts/crear-historial-git.ps1)
crea los ocho commits y las etiquetas con las fechas de cada etapa.

```powershell
# Desde la raíz del proyecto
.\scripts\crear-historial-git.ps1
```

Si ya existe `.git`, el script se detiene para no romper nada. Para rehacerlo
desde cero hay que borrar `.git` **a propósito**:

```powershell
Remove-Item -Recurse -Force .git
.\scripts\crear-historial-git.ps1
```

El script también acepta `-Force`, que hace ese borrado por vos:

```powershell
.\scripts\crear-historial-git.ps1 -Force
```

> Borrar `.git` elimina el historial local. No lo hagas si ya hiciste `push` o
> si tenés ramas que no están en GitHub.

---

## 13. Entregar sin GitHub (opcional)

Git permite empaquetar todo el historial en un solo archivo:

```powershell
git bundle create entrega-traductor-lsa.bundle --all
```

El docente (o vos en otra máquina) puede clonarlo:

```powershell
git clone entrega-traductor-lsa.bundle traductor-lsa
cd traductor-lsa
git log --oneline --decorate
```

El `.bundle` está excluido por `.gitignore`, así que no se sube por accidente.
