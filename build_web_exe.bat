@echo off
setlocal

cd /d "%~dp0"

echo ========================================
echo Building War Conquest Web EXE
echo ========================================

echo [1/3] Installing/upgrading build tools...
py -m pip install --upgrade pip pyinstaller
if errorlevel 1 goto :fail

echo [2/3] Building executable...
py -m PyInstaller --noconfirm --clean --onefile --name WarConquestWeb --add-data "web;web" web_launcher.py
if errorlevel 1 goto :fail

echo [3/3] Done.
echo.
echo EXE created at:
echo   dist\WarConquestWeb.exe
echo.
echo Double-click dist\WarConquestWeb.exe to play.
goto :end

:fail
echo.
echo Build failed. See errors above.
exit /b 1

:end
pause
