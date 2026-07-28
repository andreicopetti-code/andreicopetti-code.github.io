$ErrorActionPreference = "Stop"
$root = "C:\Users\Andrei Copetti\Documents\02_EMPRESAS_E_PROJETOS\lingua_lab"
$url = "https://raw.githubusercontent.com/andreicopetti-code/andreicopetti-code.github.io/cursor/lingua-lab-bootstrap-zip-f957/downloads/lingua_lab_teste_minimo/App.tsx"

Write-Host "=== TESTE MINIMO ORBE ==="
Write-Host "Troca SOH o App.tsx por uma tela simples (sem imagens, sem Cocina)."
Write-Host "Objetivo: provar que o Expo Go ainda funciona."
Write-Host ""

if (-not (Test-Path $root)) { throw "Pasta nao encontrada: $root" }
Set-Location $root

# backup
Copy-Item ".\App.tsx" ".\App.tsx.bak-antes-teste" -Force -ErrorAction SilentlyContinue

Write-Host "Baixando App minimo..."
Invoke-WebRequest $url -OutFile ".\App.tsx" -UseBasicParsing

if (Test-Path ".\.expo") { Remove-Item ".\.expo" -Recurse -Force }

Write-Host ""
Write-Host "Subindo Expo SEM tunnel. Mesma Wi-Fi. Escaneie o QR."
Write-Host "Voce deve ver: ORBE / App vivo"
Write-Host ""
npx expo start -c
