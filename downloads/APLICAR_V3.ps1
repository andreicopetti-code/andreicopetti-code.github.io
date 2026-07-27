$ErrorActionPreference = "Stop"
$root = "C:\Users\Andrei Copetti\Documents\02_EMPRESAS_E_PROJETOS\lingua_lab"
$zipUrl = "https://raw.githubusercontent.com/andreicopetti-code/andreicopetti-code.github.io/cursor/lingua-lab-bootstrap-zip-f957/downloads/lingua_lab-v3.zip"
$tmpZip = Join-Path $env:TEMP "lingua_lab_v3.zip"
$extract = Join-Path $env:TEMP "lingua_lab_v3"

Write-Host ""
Write-Host "=== APLICAR V3: vegetais, frases uteis, sem sobreposicao ==="
Write-Host ""

if (-not (Test-Path $root)) { throw "Pasta nao encontrada: $root" }
Set-Location $root

Write-Host "[1] Baixando pacote..."
Invoke-WebRequest $zipUrl -OutFile $tmpZip -UseBasicParsing
if (Test-Path $extract) { Remove-Item $extract -Recurse -Force }
Expand-Archive $tmpZip -DestinationPath $extract -Force

$base = $extract
if (-not (Test-Path (Join-Path $base "App.tsx"))) { throw "Zip invalido" }

Write-Host "[2] Copiando arquivos..."
Copy-Item (Join-Path $base "App.tsx") (Join-Path $root "App.tsx") -Force
Copy-Item (Join-Path $base "src\modules\cocina\theme.ts") (Join-Path $root "src\modules\cocina\theme.ts") -Force
Copy-Item (Join-Path $base "src\modules\cocina\types.ts") (Join-Path $root "src\modules\cocina\types.ts") -Force
Copy-Item (Join-Path $base "src\modules\cocina\images.ts") (Join-Path $root "src\modules\cocina\images.ts") -Force
Copy-Item (Join-Path $base "src\modules\cocina\lib\storage.ts") (Join-Path $root "src\modules\cocina\lib\storage.ts") -Force
Copy-Item (Join-Path $base "src\modules\cocina\data\items.json") (Join-Path $root "src\modules\cocina\data\items.json") -Force
Copy-Item (Join-Path $base "src\modules\cocina\screens\SplashScreen.tsx") (Join-Path $root "src\modules\cocina\screens\SplashScreen.tsx") -Force
Copy-Item (Join-Path $base "src\modules\cocina\screens\GameScreen.tsx") (Join-Path $root "src\modules\cocina\screens\GameScreen.tsx") -Force
Copy-Item (Join-Path $base "src\modules\cocina\screens\EndScreen.tsx") (Join-Path $root "src\modules\cocina\screens\EndScreen.tsx") -Force

New-Item -ItemType Directory -Force -Path (Join-Path $root "assets\cocina") | Out-Null
Copy-Item (Join-Path $base "assets\cocina\*") (Join-Path $root "assets\cocina\") -Force
Remove-Item (Join-Path $root "assets\cocina\cat-verduras.png") -Force -ErrorAction SilentlyContinue

Write-Host "[3] Limpando cache Metro..."
if (Test-Path ".\.expo") { Remove-Item ".\.expo" -Recurse -Force }

Write-Host ""
Write-Host "OK. Mudancas aplicadas:"
Write-Host "  - verduras -> vegetais"
Write-Host "  - nova categoria: frases uteis (12 categorias, 6 linhas exatas)"
Write-Host "  - grid recalcula altura medindo a tela; nao pode mais sobrepor o botao"
Write-Host ""
Write-Host "[4] Subindo Expo..."
npx expo start -c
