$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$env:PLAYWRIGHT_BROWSERS_PATH = ".pw-browsers"
$port = 3102
$env:PLAYWRIGHT_BASE_URL = "http://127.0.0.1:$port"
$logDir = Join-Path $root ".next"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$processEnv = [Environment]::GetEnvironmentVariables("Process")
if ($processEnv.Contains("Path") -and $processEnv.Contains("PATH")) {
  [Environment]::SetEnvironmentVariable("PATH", $null, "Process")
}

& npm.cmd run build
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

$server = Start-Process `
  -FilePath "node" `
  -ArgumentList @("./node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", "$port") `
  -WorkingDirectory $root `
  -PassThru `
  -WindowStyle Hidden `
  -RedirectStandardOutput (Join-Path $logDir "playwright-server.out.log") `
  -RedirectStandardError (Join-Path $logDir "playwright-server.err.log")

try {
  $ready = $false
  for ($i = 0; $i -lt 60; $i++) {
    try {
      $response = Invoke-WebRequest -Uri "$env:PLAYWRIGHT_BASE_URL/register" -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -lt 500) {
        $ready = $true
        break
      }
    } catch {
      Start-Sleep -Milliseconds 500
    }
  }

  if (-not $ready) {
    throw "Next dev server did not become ready for Playwright."
  }

  & (Join-Path $root "node_modules\.bin\playwright.cmd") test @args
  $exitCode = $LASTEXITCODE
} finally {
  if ($server -and -not $server.HasExited) {
    Stop-Process -Id $server.Id -Force
  }
}

exit $exitCode
