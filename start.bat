
@echo off
cd /d "%~dp0"
echo ====================================
echo   AI Business Analysis Platform
echo ====================================
echo.

echo [1/3] Installing Python dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo.
    echo [Warning] Python dep issue, but continue...
    echo.
) else (
    echo [OK] Python ready
    echo.
)

echo [2/3] Installing Node.js dependencies...
if not exist "node_modules" (
    echo First run, installing npm packages...
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] npm install failed!
        pause
        exit /b 1
    )
    echo [OK] Node.js ready
    echo.
) else (
    echo [OK] Node.js exists
    echo.
)

echo [3/3] Starting server...
echo.
echo ====================================
echo   Server starting...
echo   Open browser: http://localhost:5174/
echo   Press Ctrl+C to stop
echo ====================================
echo.

npm run dev

pause
