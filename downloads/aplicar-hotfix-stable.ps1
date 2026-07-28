# HOTFIX_STABLE_V1 — reabre o app sem depender de PNG (evita tela azul)
$ErrorActionPreference = "Stop"
$root = "C:\Users\Andrei Copetti\Documents\02_EMPRESAS_E_PROJETOS\lingua_lab"
$zipUrl = "https://raw.githubusercontent.com/andreicopetti-code/andreicopetti-code.github.io/cursor/lingua-lab-bootstrap-zip-f957/downloads/lingua_lab-hotfix-stable.zip"
$tmp = Join-Path $env:TEMP "lingua_lab_hotfix_stable.zip"
$extract = Join-Path $env:TEMP "lingua_lab_hotfix_stable"

Write-Host "==> Baixando hotfix..."
Invoke-WebRequest $zipUrl -OutFile $tmp
if (Test-Path $extract) { Remove-Item $extract -Recurse -Force }
Expand-Archive $tmp -DestinationPath $extract -Force

$app = Get-ChildItem -Path $extract -Recurse -Filter "App.tsx" | Select-Object -First 1
if (-not $app) { throw "App.tsx nao encontrado no zip extraido" }
$base = $app.Directory.FullName
Write-Host "==> Pasta do pacote: $base"

New-Item -ItemType Directory -Force -Path (Join-Path $root "src\modules\cocina\screens") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $root "src\modules\cocina\data") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $root "src\modules\cocina\lib") | Out-Null

Copy-Item (Join-Path $base "App.tsx") (Join-Path $root "App.tsx") -Force
Copy-Item (Join-Path $base "src\modules\cocina\theme.ts") (Join-Path $root "src\modules\cocina\theme.ts") -Force
Copy-Item (Join-Path $base "src\modules\cocina\types.ts") (Join-Path $root "src\modules\cocina\types.ts") -Force
Copy-Item (Join-Path $base "src\modules\cocina\lib\storage.ts") (Join-Path $root "src\modules\cocina\lib\storage.ts") -Force
Copy-Item (Join-Path $base "src\modules\cocina\data\items.json") (Join-Path $root "src\modules\cocina\data\items.json") -Force
Copy-Item (Join-Path $base "src\modules\cocina\screens\SplashScreen.tsx") (Join-Path $root "src\modules\cocina\screens\SplashScreen.tsx") -Force
Copy-Item (Join-Path $base "src\modules\cocina\screens\GameScreen.tsx") (Join-Path $root "src\modules\cocina\screens\GameScreen.tsx") -Force
Copy-Item (Join-Path $base "src\modules\cocina\screens\EndScreen.tsx") (Join-Path $root "src\modules\cocina\screens\EndScreen.tsx") -Force

# Neutraliza images.ts antigo (se existir) para nao quebrar o Metro
$images = Join-Path $root "src\modules\cocina\images.ts"
@"
/** Disabled in hotfix — Splash/Game use emoji icons */
export const ORBE_WIZARD = null;
export const CAT_IMAGE: Record<string, unknown> = {};
"@ | Set-Content -Path $images -Encoding UTF8

Write-Host "OK hotfix aplicado."
Write-Host "Agora no PowerShell:"
Write-Host "  cd `"$root`""
Write-Host "  npx expo start -c"
