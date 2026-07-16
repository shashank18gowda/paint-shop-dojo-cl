@echo off
:: Adds the Paintshop Print Agent to Windows Startup so it starts automatically on login.
:: Run this once per machine — no admin rights required.

setlocal
set "AGENT_DIR=%~dp0"
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "LAUNCHER=%STARTUP%\paintshop-print-agent.bat"

echo [1/2] Writing startup launcher...
(
  echo @echo off
  echo cd /d "%AGENT_DIR%"
  echo node src\index.js
) > "%LAUNCHER%"

if errorlevel 1 (
  echo ERROR: Could not write to Startup folder.
  pause & exit /b 1
)
echo     Created: %LAUNCHER%

echo [2/2] Starting agent now...
start "Paintshop Print Agent" /min cmd /c "%LAUNCHER%"

echo.
echo Done! The print agent is running and will start automatically on next login.
echo To test: open the app and try printing.
pause
