# SPLASH_COMPACT_V1 — layout, frases úteis, vegetais, Sair, imagens leves
$ErrorActionPreference = "Stop"
$root = "C:\Users\Andrei Copetti\Documents\02_EMPRESAS_E_PROJETOS\lingua_lab"
$zipUrl = "https://raw.githubusercontent.com/andreicopetti-code/andreicopetti-code.github.io/cursor/lingua-lab-bootstrap-zip-f957/downloads/lingua_lab-splash-v2.zip"
$tmp = Join-Path $env:TEMP "lingua_lab_splash_v2.zip"
$extract = Join-Path $env:TEMP "lingua_lab_splash_v2"

Write-Host "==> Baixando pacote..."
Invoke-WebRequest $zipUrl -OutFile $tmp
if (Test-Path $extract) { Remove-Item $extract -Recurse -Force }
Expand-Archive $tmp -DestinationPath $extract -Force

$base = $extract
if (Test-Path (Join-Path $extract "lingua_lab_layout_fix")) {
  $base = Join-Path $extract "lingua_lab_layout_fix"
}

New-Item -ItemType Directory -Force -Path (Join-Path $root "assets\cocina") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $root "src\modules\cocina\screens") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $root "src\modules\cocina\data") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $root "src\modules\cocina\lib") | Out-Null

# Replace cocina icons with light set (faster open)
Remove-Item (Join-Path $root "assets\cocina\*") -Force -ErrorAction SilentlyContinue
Copy-Item (Join-Path $base "assets\cocina\*") (Join-Path $root "assets\cocina\") -Force

Copy-Item (Join-Path $base "App.tsx") (Join-Path $root "App.tsx") -Force
Copy-Item (Join-Path $base "src\modules\cocina\theme.ts") (Join-Path $root "src\modules\cocina\theme.ts") -Force
Copy-Item (Join-Path $base "src\modules\cocina\images.ts") (Join-Path $root "src\modules\cocina\images.ts") -Force
Copy-Item (Join-Path $base "src\modules\cocina\lib\storage.ts") (Join-Path $root "src\modules\cocina\lib\storage.ts") -Force
Copy-Item (Join-Path $base "src\modules\cocina\data\items.json") (Join-Path $root "src\modules\cocina\data\items.json") -Force
Copy-Item (Join-Path $base "src\modules\cocina\screens\SplashScreen.tsx") (Join-Path $root "src\modules\cocina\screens\SplashScreen.tsx") -Force
Copy-Item (Join-Path $base "src\modules\cocina\screens\GameScreen.tsx") (Join-Path $root "src\modules\cocina\screens\GameScreen.tsx") -Force
Copy-Item (Join-Path $base "src\modules\cocina\screens\EndScreen.tsx") (Join-Path $root "src\modules\cocina\screens\EndScreen.tsx") -Force

Write-Host "OK. Arquivos aplicados."
Write-Host "Reinicie o Expo com cache limpo:"
Write-Host '  cd "' $root '"'
Write-Host "  npx expo start -c"
