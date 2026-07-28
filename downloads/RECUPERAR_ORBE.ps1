$ErrorActionPreference = "Stop"
$parent = "C:\Users\Andrei Copetti\Documents\02_EMPRESAS_E_PROJETOS"
$root = Join-Path $parent "lingua_lab"
$zipUrl = "https://raw.githubusercontent.com/andreicopetti-code/andreicopetti-code.github.io/cursor/lingua-lab-bootstrap-zip-f957/downloads/lingua_lab-ORBE-COMPLETO.zip"
$tmpZip = Join-Path $env:TEMP "lingua_lab_ORBE_COMPLETO.zip"
$extract = Join-Path $env:TEMP "lingua_lab_ORBE_COMPLETO"
$stamp = Get-Date -Format "yyyyMMdd-HHmm"
$backup = Join-Path $parent "lingua_lab_backup_$stamp"

Write-Host ""
Write-Host "=== RECUPERAR ORBE (projeto COMPLETO) ==="
Write-Host ""

# CRITICAL: leave the locked folder before rename
Set-Location $parent

Write-Host "1) Baixando projeto completo (~7 MB)..."
Invoke-WebRequest $zipUrl -OutFile $tmpZip -UseBasicParsing

Write-Host "2) Extraindo..."
if (Test-Path $extract) { Remove-Item $extract -Recurse -Force }
Expand-Archive $tmpZip -DestinationPath $extract -Force
$fresh = Join-Path $extract "lingua_lab"
if (-not (Test-Path $fresh)) { throw "Zip invalido: pasta lingua_lab nao encontrada" }

Write-Host "3) Backup da pasta antiga..."
if (Test-Path $root) {
  if (Test-Path $backup) { Remove-Item $backup -Recurse -Force }
  # robocopy then remove is more reliable than Rename-Item when Explorer/IDE holds locks
  try {
    Rename-Item -Path $root -NewName ("lingua_lab_backup_$stamp") -ErrorAction Stop
    Write-Host "   Backup: $backup"
  } catch {
    Write-Host "   Rename falhou (pasta em uso). Copiando para backup e limpando..."
    New-Item -ItemType Directory -Force -Path $backup | Out-Null
    robocopy $root $backup /E /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
    # delete contents of root, keep folder name
    Get-ChildItem -Path $root -Force | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   Backup: $backup"
  }
}

Write-Host "4) Instalando projeto limpo..."
if (-not (Test-Path $root)) {
  Move-Item $fresh $root
} else {
  # root folder still exists empty/partial — copy fresh into it
  robocopy $fresh $root /E /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
}

Set-Location $root

Write-Host "5) npm install (espere)..."
npm install
if ($LASTEXITCODE -ne 0) { throw "npm install falhou" }

Write-Host ""
Write-Host "6) Antes de escanear:"
Write-Host "   - Feche o Expo Go (apps recentes)"
Write-Host "   - Limpe cache do Expo Go"
Write-Host "   - Mesma Wi-Fi"
Write-Host ""
Write-Host "7) Subindo Expo..."
npx expo start -c
