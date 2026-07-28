$ErrorActionPreference = "Stop"
$root = "C:\Users\Andrei Copetti\Documents\02_EMPRESAS_E_PROJETOS\lingua_lab"
$zipUrl = "https://raw.githubusercontent.com/andreicopetti-code/andreicopetti-code.github.io/cursor/lingua-lab-bootstrap-zip-f957/downloads/lingua_lab-v4.zip"
$tmpZip = Join-Path $env:TEMP "lingua_lab_v4.zip"
$extract = Join-Path $env:TEMP "lingua_lab_v4"

Write-Host ""
Write-Host "=== APLICAR V4: cardapio organizado + categoria Rodizio ==="
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
Copy-Item (Join-Path $base "src\modules\cocina\lib\srs.ts") (Join-Path $root "src\modules\cocina\lib\srs.ts") -Force
Copy-Item (Join-Path $base "src\modules\cocina\lib\game.ts") (Join-Path $root "src\modules\cocina\lib\game.ts") -Force
Copy-Item (Join-Path $base "src\modules\cocina\data\items.json") (Join-Path $root "src\modules\cocina\data\items.json") -Force
Copy-Item (Join-Path $base "src\modules\cocina\screens\SplashScreen.tsx") (Join-Path $root "src\modules\cocina\screens\SplashScreen.tsx") -Force
Copy-Item (Join-Path $base "src\modules\cocina\screens\GameScreen.tsx") (Join-Path $root "src\modules\cocina\screens\GameScreen.tsx") -Force
Copy-Item (Join-Path $base "src\modules\cocina\screens\EndScreen.tsx") (Join-Path $root "src\modules\cocina\screens\EndScreen.tsx") -Force

New-Item -ItemType Directory -Force -Path (Join-Path $root "assets\cocina") | Out-Null
Copy-Item (Join-Path $base "assets\cocina\*") (Join-Path $root "assets\cocina\") -Force
Remove-Item (Join-Path $root "assets\cocina\cat-expressoes.png") -Force -ErrorAction SilentlyContinue

Write-Host "[3] Limpando cache Metro..."
if (Test-Path ".\.expo") { Remove-Item ".\.expo" -Recurse -Force }

Write-Host ""
Write-Host "OK. Mudancas aplicadas:"
Write-Host "  - Corrigidas 2 frases que apareciam soltas em categorias de vocabulario"
Write-Host "  - 'expressoes' + 'frases uteis' viraram uma unica categoria: 'frases e expressoes'"
Write-Host "  - Nova categoria 'Rodizio' (ultimo botao): mistura palavras e frases de TODAS as categorias"
Write-Host "  - 'falsas amigas' ocupa o lugar onde estava 'expressoes' no grid"
Write-Host "  - Novo icone de 'utensilios' (garfo, faca e colher cruzados)"
Write-Host "  - Cardapio continua em 12 botoes = 6 linhas exatas, sem sobreposicao"
Write-Host ""
Write-Host "Sobre o '1/100' em vegetais: NAO e um bug. O progresso de cada palavra"
Write-Host "fica salvo no celular pelo texto da propria palavra (nao pela categoria)."
Write-Host "Se voce ja acertou 1 palavra dessa categoria 3x antes, ela continua contando."
Write-Host "Para zerar tudo, apague o app do Expo Go e reinstale (ou peca um botao de reset)."
Write-Host ""
Write-Host "[4] Subindo Expo..."
npx expo start -c
