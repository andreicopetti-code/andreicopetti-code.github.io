# RESTORE_LIMPO_V1 — volta o app ao codigo estavel (nao mexe em node_modules/SDK)
$ErrorActionPreference = "Stop"
$root = "C:\Users\Andrei Copetti\Documents\02_EMPRESAS_E_PROJETOS\lingua_lab"
$zipUrl = "https://raw.githubusercontent.com/andreicopetti-code/andreicopetti-code.github.io/cursor/lingua-lab-bootstrap-zip-f957/downloads/lingua_lab-restore-limpo.zip"
$tmp = Join-Path $env:TEMP "lingua_lab_restore_limpo.zip"
$extract = Join-Path $env:TEMP "lingua_lab_restore_limpo"

if (-not (Test-Path $root)) { throw "Pasta nao encontrada: $root" }

Write-Host "==> Baixando restore limpo..."
Invoke-WebRequest $zipUrl -OutFile $tmp
if (Test-Path $extract) { Remove-Item $extract -Recurse -Force }
Expand-Archive $tmp -DestinationPath $extract -Force

$app = Get-ChildItem -Path $extract -Recurse -Filter "App.tsx" | Where-Object { $_.FullName -notmatch '\\node_modules\\' } | Select-Object -First 1
if (-not $app) { throw "Falha ao extrair App.tsx" }
$base = $app.Directory.FullName
Write-Host "==> Pacote em: $base"

Copy-Item (Join-Path $base "App.tsx") (Join-Path $root "App.tsx") -Force
Copy-Item (Join-Path $base "src\modules\cocina\theme.ts") (Join-Path $root "src\modules\cocina\theme.ts") -Force
Copy-Item (Join-Path $base "src\modules\cocina\types.ts") (Join-Path $root "src\modules\cocina\types.ts") -Force
Copy-Item (Join-Path $base "src\modules\cocina\images.ts") (Join-Path $root "src\modules\cocina\images.ts") -Force
Copy-Item (Join-Path $base "src\modules\cocina\lib\storage.ts") (Join-Path $root "src\modules\cocina\lib\storage.ts") -Force
Copy-Item (Join-Path $base "src\modules\cocina\data\items.json") (Join-Path $root "src\modules\cocina\data\items.json") -Force
Copy-Item (Join-Path $base "src\modules\cocina\screens\SplashScreen.tsx") (Join-Path $root "src\modules\cocina\screens\SplashScreen.tsx") -Force
Copy-Item (Join-Path $base "src\modules\cocina\screens\GameScreen.tsx") (Join-Path $root "src\modules\cocina\screens\GameScreen.tsx") -Force
Copy-Item (Join-Path $base "src\modules\cocina\screens\EndScreen.tsx") (Join-Path $root "src\modules\cocina\screens\EndScreen.tsx") -Force

# Limpa caches do Metro
if (Test-Path (Join-Path $root ".expo")) { Remove-Item (Join-Path $root ".expo") -Recurse -Force }
Get-ChildItem -Path $root -Filter ".metro-health-check*" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "OK. Arquivos restaurados."
Write-Host "Confira no PC (PowerShell do Expo) se aparece erro vermelho."
Write-Host "Subindo servidor limpo..."
Set-Location $root
npx expo start -c
