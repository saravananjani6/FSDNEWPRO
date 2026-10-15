# VMcare Rural Healthcare Desktop App Launcher (PowerShell)
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "       VMcare - Rural Healthcare Triage App             " -ForegroundColor Green
Write-Host "             Desktop Application Mode                   " -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$workspace = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Verify / Launch Backend
$backendPort = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
if (-not $backendPort) {
    Write-Host "[1/3] Starting Backend Server on port 5000..." -ForegroundColor Yellow
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$workspace\server'; npm run dev" -WindowStyle Minimized
    Start-Sleep -Seconds 3
} else {
    Write-Host "[1/3] Backend is already running on port 5000." -ForegroundColor Green
}

# 2. Verify / Launch Frontend
$frontendPort = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if (-not $frontendPort) {
    Write-Host "[2/3] Starting Frontend App Server on port 5173..." -ForegroundColor Yellow
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$workspace\client'; npm run dev" -WindowStyle Minimized
    Start-Sleep -Seconds 4
} else {
    Write-Host "[2/3] Frontend is already running on port 5173." -ForegroundColor Green
}

# 3. Launch Standalone Native App Window
Write-Host "[3/3] Opening VMcare Desktop App Window..." -ForegroundColor Cyan

# Safely close any previous VMcare app window instance so stale cache is dropped
Get-CimInstance Win32_Process -Filter "Name = 'msedge.exe'" -ErrorAction SilentlyContinue | 
    Where-Object { $_.CommandLine -like "*localhost:5173*" } | 
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

$cacheBuster = Get-Date -Format 'yyyyMMddHHmmss'
$targetUrl = "http://localhost:5173/?v=$cacheBuster"

$edgeCmd = Get-Command msedge -ErrorAction SilentlyContinue
$edgePath = if ($edgeCmd) { $edgeCmd.Source } else { $null }

$chromeCmd = Get-Command chrome -ErrorAction SilentlyContinue
$chromePath = if ($chromeCmd) { $chromeCmd.Source } else { $null }

if ($edgePath) {
    Start-Process msedge -ArgumentList "--app=$targetUrl", "--window-size=1280,880", "--app-id=vmcare-rural-app"
} elseif ($chromePath) {
    Start-Process chrome -ArgumentList "--app=$targetUrl", "--window-size=1280,880"
} else {
    Start-Process $targetUrl
}

Write-Host ""
Write-Host "VMcare App successfully opened in standalone window mode!" -ForegroundColor Green
Write-Host "Tip: Press Ctrl + F5 inside the app window at any time to force reload." -ForegroundColor Gray
