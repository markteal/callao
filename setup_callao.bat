@echo off
echo ========================================
echo    Callao Personal Cloud File Server
echo         Complete Setup Script
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo.
    echo Please install Python 3.10+ from https://python.org
    echo Make sure to check "Add Python to PATH" during installation
    echo Make sure to check "tcl/tk and IDLE" during installation
    echo Make sure to "pip" during installation
    echo.
    pause
    exit /b 1
)

echo ✅ Python found! Setting up Callao...
echo.

REM Note about tkinter requirement
echo 📋 Note: tkinter for Python is required for the client interface
echo    If not installed with Python, run the Python installer
echo    Make sure to check "tcl/tk and IDLE" during installation
echo.

REM Note about Node.js requirement
echo 📋 Note: Node.js is required for the web interface
echo    If not installed, download from https://nodejs.org (LTS version)
echo    Make sure to check "Add to PATH" during installation
echo.

REM Setup Server
echo [1/4] Setting up Callao Server...
cd /d "%~dp0server"
call install_server.bat

REM Setup Client  
echo.
echo [2/4] Setting up Callao Client...
cd /d "%~dp0client"
call install_client.bat

REM Setup Web Interface
echo.
echo [3/4] Setting up Web Interface...
cd /d "%~dp0"
call npm install

REM Create unified shortcuts
echo.
echo [4/4] Creating shortcuts...
set DESKTOP=%USERPROFILE%\Desktop
set STARTMENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Callao

REM Create start menu folder
mkdir "%STARTMENU%" 2>nul

REM Create server shortcut
echo @echo off > "%STARTMENU%\Start Callao Server.bat"
echo echo Starting Callao Server... >> "%STARTMENU%\Start Callao Server.bat"
echo cd /d "%~dp0server" >> "%STARTMENU%\Start Callao Server.bat"
echo call callao_env\Scripts\activate.bat >> "%STARTMENU%\Start Callao Server.bat"
echo python callao_server.py >> "%STARTMENU%\Start Callao Server.bat"
echo pause >> "%STARTMENU%\Start Callao Server.bat"

REM Create web interface shortcut
echo @echo off > "%STARTMENU%\Start Callao Web Interface.bat"
echo echo Starting Callao Web Interface... >> "%STARTMENU%\Start Callao Web Interface.bat"
echo cd /d "%~dp0" >> "%STARTMENU%\Start Callao Web Interface.bat"
echo call start_callao_web.bat >> "%STARTMENU%\Start Callao Web Interface.bat"

REM Create client shortcut
echo @echo off > "%STARTMENU%\Start Callao Client.bat"
echo echo Starting Callao Client... >> "%STARTMENU%\Start Callao Client.bat"
echo cd /d "%~dp0client" >> "%STARTMENU%\Start Callao Client.bat"
echo call callao_client_env\Scripts\activate.bat >> "%STARTMENU%\Start Callao Client.bat"
echo python callao_client.py >> "%STARTMENU%\Start Callao Client.bat"

REM Create desktop shortcuts
echo @echo off > "%DESKTOP%\Callao Server.bat"
echo title Callao Personal Cloud Server >> "%DESKTOP%\Callao Server.bat"
echo echo ========================================= >> "%DESKTOP%\Callao Server.bat"
echo echo    Callao Personal Cloud File Server >> "%DESKTOP%\Callao Server.bat"
echo echo ========================================= >> "%DESKTOP%\Callao Server.bat"
echo echo. >> "%DESKTOP%\Callao Server.bat"
echo echo Starting server... >> "%DESKTOP%\Callao Server.bat"
echo cd /d "%~dp0server" >> "%DESKTOP%\Callao Server.bat"
echo call callao_env\Scripts\activate.bat >> "%DESKTOP%\Callao Server.bat"
echo python callao_server.py >> "%DESKTOP%\Callao Server.bat"

echo @echo off > "%DESKTOP%\Callao Web Interface.bat"
echo title Callao Web Interface >> "%DESKTOP%\Callao Web Interface.bat"
echo cd /d "%~dp0" >> "%DESKTOP%\Callao Web Interface.bat"
echo call start_callao_web.bat >> "%DESKTOP%\Callao Web Interface.bat"

echo @echo off > "%DESKTOP%\Callao Client.bat"
echo title Callao Client >> "%DESKTOP%\Callao Client.bat"
echo echo ========================================= >> "%DESKTOP%\Callao Client.bat"
echo echo        Callao Client Application >> "%DESKTOP%\Callao Client.bat"
echo echo ========================================= >> "%DESKTOP%\Callao Client.bat"
echo echo. >> "%DESKTOP%\Callao Client.bat"
echo echo Starting client... >> "%DESKTOP%\Callao Client.bat"
echo cd /d "%~dp0client" >> "%DESKTOP%\Callao Client.bat"
echo call callao_client_env\Scripts\activate.bat >> "%DESKTOP%\Callao Client.bat"
echo python callao_client.py >> "%DESKTOP%\Callao Client.bat"

echo.
echo ========================================
echo ✅ CALLAO SETUP COMPLETED SUCCESSFULLY!
echo ========================================
echo.
echo 🛡️  Server: Callao Server.bat (Desktop)
echo 🌐 Web Interface: Callao Web Interface.bat (Desktop)
echo 💻 Client: Callao Client.bat (Desktop)
echo 📋 Start Menu: Programs → Callao
echo.
echo QUICK START GUIDE:
echo ==================
echo 1. Start the SERVER: Double-click "Callao Server.bat"
echo 2. Start the WEB INTERFACE: Double-click "Callao Web Interface.bat"
echo 3. Open browser to: http://localhost:5173
echo 4. Login with: admin / admin123
echo.
echo ALTERNATIVE ACCESS:
echo ==================
echo • Python Server Status: http://localhost:11777
echo • Desktop Client: Double-click "Callao Client.bat"
echo.
echo REMOTE ACCESS SETUP:
echo ===================
echo • Configure port forwarding on router (port 11777)
echo • Use your public IP address to connect remotely
echo • Consider Dynamic DNS for permanent address
echo.
echo For help, see README_WEB_SETUP.md
echo.
pause