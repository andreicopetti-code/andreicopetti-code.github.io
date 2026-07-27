$ErrorActionPreference = "Stop"
$parent = "C:\Users\Andrei Copetti\Documents\02_EMPRESAS_E_PROJETOS"
$root = Join-Path $parent "lingua_lab"
$zipUrl = "https://raw.githubusercontent.com/andreicopetti-code/andreicopetti-code.github.io/cursor/lingua-lab-bootstrap-zip-f957/downloads/lingua_lab-ORBE-COMPLETO.zip"
$tmpZip = Join-Path $env:TEMP "lingua_lab_ORBE_COMPLETO.zip"
$extract = Join-Path $env:TEMP "lingua_lab_ORBE_COMPLETO"
$stamp = Get-Date -Format "yyyyMMdd-HHmm"
$backup = Join-Path $parent "lingua_lab_backup_$stamp"

Write-Host ""
Write-Host "=== RECUPERAR ORBE V2 (rapido) ==="
Write-Host "O backup NAO inclui node_modules (e reinstalavel)."
Write-Host ""

# Sair da pasta para nao travar o rename
Set-Location $parent

Write-Host "[1] Baixando projeto completo (~7 MB)..."
Invoke-WebRequest $zipUrl -OutFile $tmpZip -UseBasicParsing

Write-Host "[2] Extraindo..."
if (Test-Path $extract) { Remove-Item $extract -Recurse -Force }
Expand-Archive $tmpZip -DestinationPath $extract -Force
$fresh = Join-Path $extract "lingua_lab"
if (-not (Test-Path $fresh)) { throw "Zip invalido" }

if (Test-Path $root) {
  Write-Host "[3] Tentando renomear pasta antiga (instantaneo)..."
  $renamed = $false
  try {
    Rename-Item -Path $root -NewName ("lingua_lab_backup_$stamp") -ErrorAction Stop
    $renamed = $true
    Write-Host "    OK -> $backup"
  } catch {
    Write-Host "    Rename falhou: pasta em uso."
    Write-Host ""
    Write-Host "    ALGO ESTA SEGURANDO A PASTA. Feche o que estiver aberto:"
    Write-Host "      - Cursor / VS Code com o projeto lingua_lab"
    Write-Host "      - Janelas do Explorer dentro de lingua_lab"
    Write-Host "      - Outro PowerShell com Expo rodando"
    Write-Host ""
    Write-Host "    Tentando de novo em 10s..."
    Start-Sleep -Seconds 10
    try {
      Rename-Item -Path $root -NewName ("lingua_lab_backup_$stamp") -ErrorAction Stop
      $renamed = $true
      Write-Host "    OK na segunda tentativa -> $backup"
    } catch {
      Write-Host "    Ainda em uso. Usando backup SEM node_modules (mais rapido)..."
    }
  }

  if (-not $renamed) {
    New-Item -ItemType Directory -Force -Path $backup | Out-Null
    # Backup do codigo apenas; node_modules e .expo sao descartaveis
    robocopy $root $backup /E /XD node_modules .expo .git /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
    Write-Host "    Backup do codigo em: $backup"
    Write-Host "    Limpando pasta atual (pode levar 1-2 min por causa do node_modules)..."
    Get-ChildItem -Path $root -Force | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
  }
}

Write-Host "[4] Instalando projeto limpo..."
if (-not (Test-Path $root)) {
  Move-Item $fresh $root
} else {
  robocopy $fresh $root /E /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
}

Set-Location $root

Write-Host "[5] npm install (lockfile SDK 54 incluido, deve ser rapido)..."
npm install
if ($LASTEXITCODE -ne 0) { throw "npm install falhou" }

Write-Host ""
Write-Host "[6] No celular: dados moveis OFF, mesma Wi-Fi, feche o Expo Go."
Write-Host "    Esperado: ORBE / La Cocina Portena"
Write-Host ""
npx expo start -c
