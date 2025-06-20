@echo off
echo Installing Callao Personal Cloud File Server...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

REM Create virtual environment (optional but recommended)
echo Creating virtual environment...
python -m venv callao_env

REM Activate virtual environment
echo Activating virtual environment...
call callao_env\Scripts\activate.bat

REM Install requirements (none needed for basic version)
echo Installing requirements...
pip install --upgrade pip

REM Create desktop shortcut
echo Creating desktop shortcut...
set DESKTOP=%USERPROFILE%\Desktop
set CURRENT_DIR=%~dp0
echo @echo off > "%DESKTOP%\Callao Server.bat"
echo cd /d "%CURRENT_DIR%" >> "%DESKTOP%\Callao Server.bat"
echo call callao_env\Scripts\activate.bat >> "%DESKTOP%\Callao Server.bat"
echo python callao_server.py >> "%DESKTOP%\Callao Server.bat"
echo pause >> "%DESKTOP%\Callao Server.bat"

REM Create start menu shortcut
set STARTMENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs
mkdir "%STARTMENU%\Callao" 2>nul
copy "%DESKTOP%\Callao Server.bat" "%STARTMENU%\Callao\Callao Server.bat"

echo.
echo ✅ Installation completed successfully!
echo.
echo 📁 Server files location: %CURRENT_DIR%
echo 🖥️  Desktop shortcut created: Callao Server.bat
echo 📋 Start menu shortcut created in Callao folder
echo.
echo To start the server:
echo 1. Double-click "Callao Server.bat" on your desktop
echo 2. Or run: python callao_server.py
echo.
echo Default settings:
echo - Port: 11777
echo - Drive: G:\
echo - Login: admin / admin123
echo.
echo Configure your router for port forwarding to access remotely.
echo.
pause