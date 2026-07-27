$ErrorActionPreference = "Stop"
$root = "C:\Users\Andrei Copetti\Documents\02_EMPRESAS_E_PROJETOS\lingua_lab"
$base = "https://raw.githubusercontent.com/andreicopetti-code/andreicopetti-code.github.io/cursor/lingua-lab-bootstrap-zip-f957/downloads/lingua_lab_restore_limpo"

function Get-File([string]$rel) {
  $url = "$base/$($rel.Replace('\','/'))"
  $dest = Join-Path $root $rel
  $dir = Split-Path $dest -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  Write-Host "  baixando $rel"
  Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing
}

Write-Host "=== CONSERTAR lingua_lab ==="
if (-not (Test-Path $root)) { throw "Pasta nao existe: $root" }
Set-Location $root

Write-Host "1) Baixando arquivos estaveis..."
Get-File "App.tsx"
Get-File "package.json"
Get-File "src\modules\cocina\theme.ts"
Get-File "src\modules\cocina\types.ts"
Get-File "src\modules\cocina\images.ts"
Get-File "src\modules\cocina\lib\storage.ts"
Get-File "src\modules\cocina\data\items.json"
Get-File "src\modules\cocina\screens\SplashScreen.tsx"
Get-File "src\modules\cocina\screens\GameScreen.tsx"
Get-File "src\modules\cocina\screens\EndScreen.tsx"

Write-Host "2) Limpando cache..."
if (Test-Path ".\.expo") { Remove-Item ".\.expo" -Recurse -Force }
if (Test-Path ".\node_modules") {
  Write-Host "3) Reinstalando dependencias (necessario; espere)..."
  Remove-Item ".\node_modules" -Recurse -Force
}
if (Test-Path ".\package-lock.json") { Remove-Item ".\package-lock.json" -Force }

Write-Host "4) npm install..."
npm install
if ($LASTEXITCODE -ne 0) { throw "npm install falhou" }

Write-Host "5) Subindo Expo..."
npx expo start -c --tunnel
