@echo off
title Imagine Hack — Launcher
cd /d "%~dp0"

echo =========================================
echo  Imagine Hack — Starting all services
echo =========================================
echo.

rem ---- Frontend: Next.js (port 3000) ----
echo [1/2] Starting Next.js dev server...
start "Next.js" cmd /c "cd /d "%~dp0" && title Next.js && npm run dev"

rem ---- Backend: Python Telegram bot (port 8765) ----
echo [2/2] Starting Telegram bot...
start "Bot" cmd /c "cd /d "%~dp0" && title Telegram Bot && python -m backend.integrations.telegram.bot"

echo.
echo Both services launched in separate windows.
echo Close those windows to stop each service.
echo.
echo   Frontend: http://localhost:3000
echo   Bot HTTP: http://localhost:8765
echo.
pause
