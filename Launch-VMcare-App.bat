@echo off
title VMcare Rural Healthcare App Launcher
echo ========================================================
echo       VMcare - Rural Healthcare Triage App
echo               Desktop Application Mode
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Backend API Server (Port 5000)...
netstat -ano | findstr :5000 | findstr LISTENING >nul
if %errorlevel% neq 0 (
    echo [Backend] Starting Express / MongoDB Server...
    cd server
    start "VMcare Backend Server" /min cmd /c "npm run dev"
    cd ..
    timeout /t 3 /nobreak >nul
) else (
    echo [Backend] Already active on http://localhost:5000
)

echo [2/3] Checking Frontend Dev Server (Port 5173)...
netstat -ano | findstr :5173 | findstr LISTENING >nul
if %errorlevel% neq 0 (
    echo [Frontend] Starting Vite App Dev Server...
    cd client
    start "VMcare Frontend Server" /min cmd /c "npm run dev"
    cd ..
    timeout /t 4 /nobreak >nul
) else (
    echo [Frontend] Already active on http://localhost:5173
)

echo [3/3] Launching VMcare Desktop App Window...
echo.

:: Try Microsoft Edge App Mode (Standard on all Windows 10/11)
where msedge >nul 2>nul
if %errorlevel% equ 0 (
    start msedge --app=http://localhost:5173/ --window-size=1280,880 --app-id=vmcare-rural-app
    goto :done
)

:: Try Google Chrome App Mode
where chrome >nul 2>nul
if %errorlevel% equ 0 (
    start chrome --app=http://localhost:5173/ --window-size=1280,880
    goto :done
)

:: Fallback to default browser
start http://localhost:5173/

:done
echo VMcare Application launched successfully!
echo You can keep this window open or close it.
timeout /t 3 >nul
exit
