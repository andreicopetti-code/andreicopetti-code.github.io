$ErrorActionPreference = "Stop"
$root = "C:\Users\Andrei Copetti\Documents\02_EMPRESAS_E_PROJETOS\lingua_lab"
$zipUrl = "https://raw.githubusercontent.com/andreicopetti-code/andreicopetti-code.github.io/cursor/lingua-lab-bootstrap-zip-f957/downloads/lingua_lab-volta-bom.zip"
$tmp = Join-Path $env:TEMP "lingua_lab_volta_bom.zip"
$extract = Join-Path $env:TEMP "lingua_lab_volta_bom"

Write-Host "=== ENGENHARIA REVERSA: voltar ao ultimo estado que ABRIU ==="
Write-Host "Estado: Splash com mago + icones PNG (antes do splash-v2 e do conectar)."
Write-Host "NAO apaga node_modules. NAO usa tunnel."
Write-Host ""

if (-not (Test-Path $root)) { throw "Pasta nao encontrada: $root" }
Set-Location $root

Write-Host "1) Baixando pacote bom..."
Invoke-WebRequest $zipUrl -OutFile $tmp -UseBasicParsing
if (Test-Path $extract) { Remove-Item $extract -Recurse -Force }
Expand-Archive $tmp -DestinationPath $extract -Force

$app = Get-ChildItem -Path $extract -Recurse -Filter "App.tsx" | Select-Object -First 1
if (-not $app) { throw "App.tsx nao encontrado no zip" }
$base = $app.Directory.FullName
Write-Host "   Pacote em: $base"

Write-Host "2) Copiando arquivos..."
Copy-Item (Join-Path $base "App.tsx") (Join-Path $root "App.tsx") -Force
Copy-Item (Join-Path $base "package.json") (Join-Path $root "package.json") -Force
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

# sanity checks
$must = @(
  "App.tsx",
  "src\modules\cocina\images.ts",
  "src\modules\cocina\screens\SplashScreen.tsx",
  "assets\cocina\orbe-wizard.png",
  "assets\cocina\cat-verduras.png",
  "assets\cocina\cat-alimentos.png"
)
foreach ($m in $must) {
  $p = Join-Path $root $m
  if (-not (Test-Path $p)) { throw "Faltou arquivo apos copia: $m" }
  Write-Host "   check $m"
}

Write-Host "3) Limpando cache Metro..."
if (Test-Path ".\.expo") { Remove-Item ".\.expo" -Recurse -Force }

Write-Host "4) Subindo Expo (rede local)..."
Write-Host "   Mesma Wi-Fi no PC e no celular. Escaneie o QR no Expo Go."
npx expo start -c
