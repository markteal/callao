@echo off
echo ========================================
echo    Callao Personal Cloud Web Interface
echo ========================================
echo.

echo 📋 Note: This requires Node.js to be installed
echo    If you get errors, install Node.js from https://nodejs.org (LTS version)
echo    Then be sure you have the dependencies in the node_modules subdir
echo    If node_modules does not exist or needs updating, run npm install
echo.

echo 🚀 Starting Callao web interface...
echo.
echo   Web Interface: http://localhost:5173           
echo   Python Server: http://localhost:11777          
echo.
echo The web interface will can be run on 5173 your browser.
echo Keep this window open while using Callao.
echo.
echo Press Ctrl+C to stop the web interface.
echo.

REM Start the development server
call npm run dev