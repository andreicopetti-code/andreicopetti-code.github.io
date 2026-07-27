$ErrorActionPreference = "Stop"
$parent = "C:\Users\Andrei Copetti\Documents\02_EMPRESAS_E_PROJETOS"
$root = Join-Path $parent "lingua_lab"
$zipUrl = "https://raw.githubusercontent.com/andreicopetti-code/andreicopetti-code.github.io/cursor/lingua-lab-bootstrap-zip-f957/downloads/lingua_lab-ORBE-COMPLETO.zip"
$tmpZip = Join-Path $env:TEMP "lingua_lab_ORBE_COMPLETO.zip"
$extract = Join-Path $env:TEMP "lingua_lab_ORBE_COMPLETO"
$stamp = Get-Date -Format "yyyyMMdd-HHmm"

Write-Host ""
Write-Host "=== RECUPERAR ORBE (projeto COMPLETO do zero) ==="
Write-Host "Substitui a pasta inteira por uma copia limpa que eu testei."
Write-Host "A pasta atual vai para: lingua_lab_backup_$stamp"
Write-Host ""

if (-not (Test-Path $parent)) { throw "Pasta pai nao existe: $parent" }

Write-Host "1) Baixando projeto completo (~7 MB)..."
Invoke-WebRequest $zipUrl -OutFile $tmpZip -UseBasicParsing

Write-Host "2) Extraindo..."
if (Test-Path $extract) { Remove-Item $extract -Recurse -Force }
Expand-Archive $tmpZip -DestinationPath $extract -Force

$fresh = Join-Path $extract "lingua_lab"
if (-not (Test-Path $fresh)) { throw "Zip invalido: pasta lingua_lab nao encontrada" }

Write-Host "3) Backup da pasta quebrada..."
if (Test-Path $root) {
  $backup = Join-Path $parent "lingua_lab_backup_$stamp"
  Rename-Item $root $backup
  Write-Host "   Backup em: $backup"
}

Write-Host "4) Instalando projeto limpo..."
Move-Item $fresh $root
Set-Location $root

Write-Host "5) npm install (espere terminar)..."
npm install
if ($LASTEXITCODE -ne 0) { throw "npm install falhou" }

Write-Host ""
Write-Host "6) ANTES de escanear no celular:"
Write-Host "   - Feche o Expo Go (remova dos apps recentes)"
Write-Host "   - PC e celular na MESMA Wi-Fi"
Write-Host "   - Se der tela azul de novo: Configuracoes > Apps > Expo Go > Limpar cache"
Write-Host ""
Write-Host "7) Subindo Expo (rede local, SEM tunnel)..."
Write-Host ""
npx expo start -c
