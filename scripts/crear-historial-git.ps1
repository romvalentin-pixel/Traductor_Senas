#requires -Version 5.1
<#
.SYNOPSIS
    Crea el historial de Git del proyecto por etapas.

.DESCRIPTION
    Inicializa el repositorio, crea ocho commits agrupados por área y etiqueta
    cada uno con una versión (v0.1.0 ... v1.0.0).

    Las fechas son las de la bitácora y son aproximadas. Los commits no son una
    copia exacta del código de cada fecha: son un recorrido reconstruido para
    mostrar el avance. Solo la última versión está verificada con las suites.

    Si ya existe .git, el script se detiene para no romper el historial.

.EXAMPLE
    .\scripts\crear-historial-git.ps1

.EXAMPLE
    # Rehacer el historial desde cero (borra .git a propósito)
    Remove-Item -Recurse -Force .git
    .\scripts\crear-historial-git.ps1
#>
[CmdletBinding()]
param(
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw 'Git no está instalado o no está en el PATH.'
}

if (Test-Path -LiteralPath '.git') {
    if (-not $Force) {
        throw 'Ya existe .git. No se vuelve a crear el historial. Usá -Force solo si querés borrarlo y rehacerlo.'
    }
    Remove-Item -LiteralPath '.git' -Recurse -Force
}

git init -b main | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'git init falló.' }

git config core.autocrlf false | Out-Null

function New-Stage {
    param(
        [Parameter(Mandatory)][string]$Tag,
        [Parameter(Mandatory)][string]$Date,
        [Parameter(Mandatory)][string]$Message,
        [string[]]$Paths = @()
    )

    if ($Paths.Count -gt 0) {
        git add -- @Paths
        if ($LASTEXITCODE -ne 0) { throw "git add falló en $Tag" }
    }

    $env:GIT_AUTHOR_DATE = $Date
    $env:GIT_COMMITTER_DATE = $Date
    git commit -m $Message | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "git commit falló en $Tag" }

    git tag -a $Tag -m $Message
    if ($LASTEXITCODE -ne 0) { throw "git tag falló en $Tag" }

    Write-Host ("[{0}] {1}" -f $Tag, $Message)
}

# 1. Diseño y documentación inicial
New-Stage -Tag 'v0.1.0' -Date '2026-10-08T12:00:00-03:00' `
    -Message 'docs: estructura y documentacion inicial' `
    -Paths '.gitignore', '.gitattributes', '.env.example', 'docs/architecture.md', 'docs/database.md', 'docs/api.md'

# 2. Base de datos
New-Stage -Tag 'v0.2.0' -Date '2026-10-10T12:00:00-03:00' `
    -Message 'feat(db): esquema SQL y vocabulario inicial' `
    -Paths 'database'

# 3. Backend y API REST
New-Stage -Tag 'v0.3.0' -Date '2026-10-14T12:00:00-03:00' `
    -Message 'feat(backend): API REST, JWT, TTS y pruebas' `
    -Paths 'backend'

# 4. Módulo de IA
New-Stage -Tag 'v0.4.0' -Date '2026-10-17T12:00:00-03:00' `
    -Message 'feat(ai): landmarks, modelo demo y entrenamiento' `
    -Paths 'ai'

# 5. Cliente web
New-Stage -Tag 'v0.5.0' -Date '2026-10-20T12:00:00-03:00' `
    -Message 'feat(web): traductor con MediaPipe e historial' `
    -Paths 'frontend'

# 6. Docker y cliente móvil opcional
New-Stage -Tag 'v0.6.0' -Date '2026-10-22T12:00:00-03:00' `
    -Message 'chore(deploy): Docker Compose y cliente Expo opcional' `
    -Paths 'docker-compose.yml', 'mobile'

# 7. Documentación, pruebas y documentos históricos
New-Stage -Tag 'v0.7.0' -Date '2026-11-13T12:00:00-03:00' `
    -Message 'docs: bitacora, pruebas y guias de uso' `
    -Paths @(
        'docs/bitacora.md',
        'docs/pruebas-y-errores.md',
        'docs/analisis-limpieza-y-mejoras.md',
        'docs/lsa64-referencia.md',
        'docs/guia-de-uso.md',
        'docs/instalacion-y-ejecucion.md',
        'docs/como-agregar-mas-senas.md',
        'docs/material/README.md',
        'docs/archivo/auditoria-proyecto.md',
        'docs/archivo/cambios-grabador-de-senas.md',
        'docs/archivo/decisiones-tecnicas.md',
        'docs/archivo/github-paso-a-paso.md',
        'docs/archivo/inicio-del-sistema-y-docker.md',
        'docs/archivo/plan-de-migracion.md'
    )

# 8. Estado actual: bitácora original y guía de publicación
New-Stage -Tag 'v1.0.0' -Date '2026-11-15T12:00:00-03:00' `
    -Message 'docs: bitacora original y guia de publicacion' `
    -Paths @(
        'README.md',
        'CHANGELOG.md',
        'docs/README.md',
        'docs/archivo/bitacora-v1-original.md',
        'scripts/crear-historial-git.ps1'
    )

Write-Host ''
Write-Host 'Historial creado. Revisá el resultado con:'
Write-Host '  git log --oneline --decorate --graph'
Write-Host '  git tag -n'
Write-Host ''
Write-Host 'Para publicarlo:'
Write-Host '  git remote add origin https://github.com/TU-USUARIO/traductor-lsa.git'
Write-Host '  git push -u origin main'
Write-Host '  git push origin --tags'
