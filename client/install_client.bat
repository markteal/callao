@echo off
echo Installing Callao Personal Cloud Client...
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
python -m venv callao_client_env

REM Activate virtual environment
echo Activating virtual environment...
call callao_client_env\Scripts\activate.bat

REM Install requirements
echo Installing requirements...
pip install --upgrade pip
pip install requests

REM Create desktop shortcut
echo Creating desktop shortcut...
set DESKTOP=%USERPROFILE%\Desktop
set CURRENT_DIR=%~dp0
echo @echo off > "%DESKTOP%\Callao Client.bat"
echo cd /d "%CURRENT_DIR%" >> "%DESKTOP%\Callao Client.bat"
echo call callao_client_env\Scripts\activate.bat >> "%DESKTOP%\Callao Client.bat"
echo python callao_client.py >> "%DESKTOP%\Callao Client.bat"

REM Create start menu shortcut
set STARTMENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs
mkdir "%STARTMENU%\Callao" 2>nul
copy "%DESKTOP%\Callao Client.bat" "%STARTMENU%\Callao\Callao Client.bat"

echo.
echo ✅ Installation completed successfully!
echo.
echo 📁 Client files location: %CURRENT_DIR%
echo 🖥️  Desktop shortcut created: Callao Client.bat
echo 📋 Start menu shortcut created in Callao folder
echo.
echo To start the client:
echo 1. Double-click "Callao Client.bat" on your desktop
echo 2. Or run: python callao_client.py
echo.
echo Make sure your Callao server is running before connecting!
echo.
pause