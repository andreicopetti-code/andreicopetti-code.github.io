# SDK54_CONNECT_V1 — alinha o projeto ao Expo Go 54 e sobe o servidor
$ErrorActionPreference = "Stop"
$root = "C:\Users\Andrei Copetti\Documents\02_EMPRESAS_E_PROJETOS\lingua_lab"
$baseUrl = "https://raw.githubusercontent.com/andreicopetti-code/andreicopetti-code.github.io/cursor/lingua-lab-bootstrap-zip-f957/downloads/lingua_lab_conectar_expo54"

if (-not (Test-Path $root)) {
  throw "Pasta nao encontrada: $root"
}

Set-Location $root
Write-Host "==> Baixando package.json e App.tsx (SDK 54)..."
Invoke-WebRequest "$baseUrl/package.json" -OutFile (Join-Path $root "package.json")
Invoke-WebRequest "$baseUrl/App.tsx" -OutFile (Join-Path $root "App.tsx")

Write-Host "==> Limpando instalacao antiga..."
if (Test-Path (Join-Path $root "node_modules")) {
  Remove-Item (Join-Path $root "node_modules") -Recurse -Force
}
if (Test-Path (Join-Path $root "package-lock.json")) {
  Remove-Item (Join-Path $root "package-lock.json") -Force
}
if (Test-Path (Join-Path $root ".expo")) {
  Remove-Item (Join-Path $root ".expo") -Recurse -Force
}

Write-Host "==> Instalando dependencias (pode demorar)..."
npm install

Write-Host ""
Write-Host "OK. Agora escolha UMA opcao:"
Write-Host "  A) Mesma Wi-Fi PC + celular:  npx expo start -c"
Write-Host "  B) Se o QR nao conectar:       npx expo start -c --tunnel"
Write-Host ""
Write-Host "No Expo Go, escaneie o QR. Se pedir, use a camera do Expo Go (nao a do Android)."
Write-Host "Iniciando com TUNNEL (mais confiavel)..."
npx expo start -c --tunnel
