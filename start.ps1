$ErrorActionPreference = 'Stop'

Write-Host "Starting FreelanceCo on Windows..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $root 'backend'
$frontendPath = Join-Path $root 'frontend'

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js is not installed. Install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

Write-Host "Node version: $(node -v)" -ForegroundColor Green

if (-not (Test-Path (Join-Path $backendPath 'node_modules'))) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Push-Location $backendPath
    npm install
    Pop-Location
}

if (-not (Test-Path (Join-Path $frontendPath 'node_modules'))) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location $frontendPath
    npm install
    Pop-Location
}

Write-Host "Backend: http://localhost:8080" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop both" -ForegroundColor Yellow

$backendJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    npm run dev
} -ArgumentList $backendPath

Start-Sleep -Seconds 2

$frontendJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    npm run dev
} -ArgumentList $frontendPath

try {
    while ($true) {
        Receive-Job -Job $backendJob -Keep | Out-Host
        Receive-Job -Job $frontendJob -Keep | Out-Host
        Start-Sleep -Milliseconds 500
    }
} finally {
    Stop-Job -Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob, $frontendJob -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped servers." -ForegroundColor Cyan
}
