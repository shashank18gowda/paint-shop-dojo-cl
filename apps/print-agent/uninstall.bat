@echo off
setlocal
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "LAUNCHER=%STARTUP%\paintshop-print-agent.bat"

echo Removing Paintshop Print Agent from startup...

if exist "%LAUNCHER%" (
  del "%LAUNCHER%"
  echo     Removed: %LAUNCHER%
) else (
  echo     Not found in startup — already removed.
)

echo Stopping any running instances...
taskkill /F /FI "WINDOWTITLE eq Paintshop Print Agent" >nul 2>&1

echo Done.
pause
