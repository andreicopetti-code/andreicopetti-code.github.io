$ErrorActionPreference = "Stop"
$parent = "C:\Users\Andrei Copetti\Documents\02_EMPRESAS_E_PROJETOS"
$test = Join-Path $parent "orbe_teste"
$zipUrl = "https://raw.githubusercontent.com/andreicopetti-code/andreicopetti-code.github.io/cursor/lingua-lab-bootstrap-zip-f957/downloads/orbe-teste.zip"
$tmpZip = Join-Path $env:TEMP "orbe-teste.zip"
$extract = Join-Path $env:TEMP "orbe-teste-extract"

Write-Host ""
Write-Host "==================================================="
Write-Host " TESTE DE CONEXAO - projeto NOVO e separado"
Write-Host " NAO toca na pasta lingua_lab"
Write-Host "==================================================="
Write-Host ""

# --- 1. Ambiente ---
Write-Host "[1] Ambiente"
Write-Host ("    node    : " + (node -v))
Write-Host ("    npm     : " + (npm -v))

# --- 2. IP da rede local ---
Write-Host ""
Write-Host "[2] IP do PC na rede local"
$ips = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } |
  Select-Object -ExpandProperty IPAddress
foreach ($ip in $ips) { Write-Host "    $ip" }
$mainIp = $ips | Select-Object -First 1

# --- 3. Firewall ---
Write-Host ""
Write-Host "[3] Regras de firewall para Node.js"
$rules = Get-NetFirewallRule -ErrorAction SilentlyContinue |
  Where-Object { $_.DisplayName -like "*Node.js*" -or $_.DisplayName -like "*node*" }
if ($rules) {
  foreach ($r in $rules) {
    Write-Host ("    " + $r.DisplayName + " | Enabled=" + $r.Enabled + " | Action=" + $r.Action + " | Dir=" + $r.Direction)
  }
} else {
  Write-Host "    Nenhuma regra encontrada para node.exe."
  Write-Host "    Se o teste falhar, rode UMA VEZ um PowerShell como ADMINISTRADOR e cole:"
  Write-Host '      New-NetFirewallRule -DisplayName "Expo Metro 8081" -Direction Inbound -LocalPort 8081 -Protocol TCP -Action Allow'
}

# --- 4. Baixar projeto de teste ---
Write-Host ""
Write-Host "[4] Baixando projeto de teste (73 KB)..."
Invoke-WebRequest $zipUrl -OutFile $tmpZip -UseBasicParsing
if (Test-Path $extract) { Remove-Item $extract -Recurse -Force }
Expand-Archive $tmpZip -DestinationPath $extract -Force

$found = Get-ChildItem -Path $extract -Recurse -Filter "App.tsx" | Select-Object -First 1
if (-not $found) { throw "Zip invalido" }
$src = $found.Directory.FullName

if (Test-Path $test) { Remove-Item $test -Recurse -Force }
New-Item -ItemType Directory -Force -Path $test | Out-Null
Copy-Item (Join-Path $src "*") $test -Recurse -Force

Set-Location $test
Write-Host "    Projeto de teste em: $test"

# --- 5. Instalar ---
Write-Host ""
Write-Host "[5] npm install (1-2 minutos)..."
npm install --silent
if ($LASTEXITCODE -ne 0) { throw "npm install falhou" }

# --- 6. Preparar celular ---
Write-Host ""
Write-Host "==================================================="
Write-Host " FACA AGORA NO CELULAR (antes de subir o servidor)"
Write-Host "==================================================="
Write-Host ""
Write-Host " 1) Desligue os DADOS MOVEIS (4G/5G)."
Write-Host "    O celular tem que usar a MESMA Wi-Fi do PC."
Write-Host ""
Write-Host " 2) Configuracoes do Android > Apps > Expo Go >"
Write-Host "    Armazenamento > Limpar cache."
Write-Host ""
Write-Host " 3) Feche o Expo Go (remova dos apps recentes)."
Write-Host ""
Write-Host "Pressione ENTER quando terminar os 3 passos..."
Read-Host | Out-Null

# --- 7. Subir servidor ---
Write-Host ""
Write-Host "==================================================="
Write-Host " DEPOIS QUE O QR APARECER, NESTA ORDEM:"
Write-Host "==================================================="
Write-Host ""
if ($mainIp) {
  Write-Host " A) No navegador do CELULAR (Chrome), abra:"
  Write-Host ""
  Write-Host ("       http://" + $mainIp + ":8081")
  Write-Host ""
  Write-Host "    Aparece texto/JSON  -> rede OK, siga para o B"
  Write-Host "    Nao abre / da erro  -> FIREWALL ou rede = causa da tela azul"
  Write-Host "                           (nao adianta escanear o QR)"
  Write-Host ""
}
Write-Host " B) Abra o Expo Go e escaneie o QR desta janela."
Write-Host "    Esperado: tela creme com 'ORBE / Conexao OK'"
Write-Host ""
Write-Host " C) Olhe ESTA janela depois de escanear."
Write-Host "    Se aparecer 'Android Bundled ...' -> o celular baixou o app."
Write-Host "    Se nao aparecer NADA -> o celular nao chega no servidor."
Write-Host ""
Write-Host "Subindo servidor..."
Write-Host ""
npx expo start -c
