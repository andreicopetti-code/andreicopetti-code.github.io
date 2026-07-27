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

# --- 6. Instrucoes ---
Write-Host ""
Write-Host "==================================================="
Write-Host " ANTES DE ESCANEAR - faca estes 2 testes no celular"
Write-Host "==================================================="
Write-Host ""
Write-Host " A) Wi-Fi: desligue os dados moveis (4G/5G) do celular."
Write-Host "    O celular precisa estar na MESMA Wi-Fi do PC."
Write-Host ""
if ($mainIp) {
  Write-Host " B) No NAVEGADOR do celular (Chrome), abra:"
  Write-Host ""
  Write-Host ("       http://" + $mainIp + ":8081")
  Write-Host ""
  Write-Host "    - Se aparecer texto/JSON  -> rede OK"
  Write-Host "    - Se der erro / nao abrir -> FIREWALL ou rede (causa da tela azul)"
}
Write-Host ""
Write-Host " C) No Expo Go: Configuracoes do Android > Apps > Expo Go >"
Write-Host "    Armazenamento > Limpar cache."
Write-Host ""
Write-Host "Pressione ENTER para subir o servidor de teste..."
Read-Host | Out-Null

Write-Host ""
Write-Host "[6] Subindo Expo do PROJETO DE TESTE..."
Write-Host "    Esperado no celular: tela creme com 'ORBE / Conexao OK'"
Write-Host ""
npx expo start -c
