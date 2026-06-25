$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$env:PLAYWRIGHT_BROWSERS_PATH = ".pw-browsers"
$port = 3101

$processEnv = [Environment]::GetEnvironmentVariables("Process")
if ($processEnv.Contains("Path") -and $processEnv.Contains("PATH")) {
  [Environment]::SetEnvironmentVariable("PATH", $null, "Process")
}

if (-not (Test-Path (Join-Path $root ".next\BUILD_ID"))) {
  & npm.cmd run build
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}

$server = Start-Process `
  -FilePath "node" `
  -ArgumentList @("./node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", "$port") `
  -WorkingDirectory $root `
  -PassThru `
  -WindowStyle Hidden `
  -RedirectStandardOutput (Join-Path $root ".next\register-audit-server.out.log") `
  -RedirectStandardError (Join-Path $root ".next\register-audit-server.err.log")

try {
  $ready = $false
  for ($i = 0; $i -lt 60; $i++) {
    try {
      $response = Invoke-WebRequest -Uri "http://127.0.0.1:$port/register" -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -lt 500) {
        $ready = $true
        break
      }
    } catch {
      Start-Sleep -Milliseconds 500
    }
  }

  if (-not $ready) {
    throw "Register audit server did not become ready."
  }

  $nodeScript = @"
const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:$port/register', { waitUntil: 'networkidle' });
  await page.screenshot({ path: '.next/register-audit.png', fullPage: true });
  const boxes = await page.evaluate(() => {
    const pick = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, transform: style.transform };
    };
    return {
      hero: pick('.hero-visual'),
      metric: pick('.metric-float'),
      card: pick('.registration-card'),
      community: pick('.community-visual'),
    };
  });
  console.log(JSON.stringify(boxes, null, 2));
  await browser.close();
})();
"@
  $nodeScript | node -
} finally {
  if ($server -and -not $server.HasExited) {
    Stop-Process -Id $server.Id -Force
  }
}

Write-Output "Saved .next/register-audit.png"
