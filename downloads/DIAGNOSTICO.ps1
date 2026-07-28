$ErrorActionPreference = "Continue"
$root = "C:\Users\Andrei Copetti\Documents\02_EMPRESAS_E_PROJETOS\lingua_lab"
Write-Host "=== DIAGNOSTICO ORBE ==="
Set-Location $root

Write-Host "`n--- Node / npm ---"
node -v
npm -v

Write-Host "`n--- Expo ---"
if (Test-Path ".\node_modules\.bin\expo.cmd") {
  npx expo --version
} else {
  Write-Host "ERRO: node_modules ausente. Rode RECUPERAR_ORBE.ps1 primeiro."
}

Write-Host "`n--- package.json ---"
Get-Content .\package.json | Select-String '"expo"|"react-native"|"react"'

Write-Host "`n--- Arquivos criticos ---"
@(
  "App.tsx",
  "index.ts",
  "src\modules\cocina\screens\SplashScreen.tsx",
  "src\modules\cocina\images.ts",
  "assets\cocina\orbe-wizard.png"
) | ForEach-Object {
  $ok = Test-Path (Join-Path $root $_)
  Write-Host ("  [{0}] {1}" -f ($(if($ok){"OK"}else{"FALTA"})), $_)
}

Write-Host "`n--- IP local (celular precisa alcancar este IP) ---"
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.PrefixOrigin -ne "WellKnown" } | Select-Object IPAddress, InterfaceAlias | Format-Table -AutoSize

Write-Host "`n--- expo doctor ---"
npx expo-doctor 2>&1

Write-Host "`n--- Proximo passo ---"
Write-Host "1) Celular: Config > Apps > Expo Go > Limpar cache"
Write-Host "2) PC: npx expo start -c"
Write-Host "3) Escaneie QR. Se azul, copie TUDO que aparecer abaixo desta linha no PowerShell."
Write-Host ""
