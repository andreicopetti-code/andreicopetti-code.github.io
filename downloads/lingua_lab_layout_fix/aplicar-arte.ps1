# ART_ASSETS_V1 — apply Splash art + category icons into lingua_lab
$ErrorActionPreference = "Stop"
$root = "C:\Users\Andrei Copetti\Documents\02_EMPRESAS_E_PROJETOS\lingua_lab"
$zipUrl = "https://raw.githubusercontent.com/andreicopetti-code/andreicopetti-code.github.io/cursor/lingua-lab-bootstrap-zip-f957/downloads/lingua_lab-layout-fix.zip"
$tmp = Join-Path $env:TEMP "lingua_lab_art_pack.zip"
$extract = Join-Path $env:TEMP "lingua_lab_art_pack"

Write-Host "Baixando pacote..."
Invoke-WebRequest $zipUrl -OutFile $tmp
if (Test-Path $extract) { Remove-Item $extract -Recurse -Force }
Expand-Archive $tmp -DestinationPath $extract -Force

# Zip may extract flat (assets/, src/) or nested
$base = $extract
if (Test-Path (Join-Path $extract "lingua_lab_layout_fix")) {
  $base = Join-Path $extract "lingua_lab_layout_fix"
}

New-Item -ItemType Directory -Force -Path (Join-Path $root "assets\cocina") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $root "src\modules\cocina\screens") | Out-Null

Copy-Item (Join-Path $base "assets\cocina\*") (Join-Path $root "assets\cocina\") -Force
Copy-Item (Join-Path $base "src\modules\cocina\images.ts") (Join-Path $root "src\modules\cocina\images.ts") -Force
Copy-Item (Join-Path $base "src\modules\cocina\screens\SplashScreen.tsx") (Join-Path $root "src\modules\cocina\screens\SplashScreen.tsx") -Force
Copy-Item (Join-Path $base "src\modules\cocina\screens\GameScreen.tsx") (Join-Path $root "src\modules\cocina\screens\GameScreen.tsx") -Force

Write-Host "OK. Arquivos aplicados em $root"
Write-Host "Agora rode: cd `"$root`"; npx expo start -c"
