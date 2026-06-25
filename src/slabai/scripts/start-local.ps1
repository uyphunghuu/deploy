$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$logDir = Join-Path $root ".next"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

if (-not (Test-Path (Join-Path $root ".next\BUILD_ID"))) {
  & npm.cmd run build
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}

$existing = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($existing) {
  Write-Output "SLABAI already appears to be serving at http://127.0.0.1:3000"
  exit 0
}

$serverCommand = "Set-Location -LiteralPath '$root'; node ./node_modules/next/dist/bin/next start -H 127.0.0.1 *> .next/local-server.combined.log"
$server = Start-Process `
  -FilePath "powershell" `
  -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $serverCommand) `
  -WorkingDirectory $root `
  -PassThru `
  -WindowStyle Hidden

$server.Id | Out-File -FilePath (Join-Path $logDir "local-server.pid") -Encoding ascii

$ready = $false
for ($i = 0; $i -lt 60; $i++) {
  try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:3000/register" -UseBasicParsing -TimeoutSec 2
    if ($response.StatusCode -lt 500) {
      $ready = $true
      break
    }
  } catch {
    Start-Sleep -Milliseconds 500
  }
}

if (-not $ready) {
  if ($server -and -not $server.HasExited) {
    Stop-Process -Id $server.Id -Force
  }
  throw "SLABAI local server did not become ready."
}

Write-Output "SLABAI is running at http://127.0.0.1:3000"
