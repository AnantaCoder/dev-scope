@echo off
REM Quick start script for DevScope

echo.
echo ========================================
echo   DevScope - Quick Start
echo ========================================
echo.

REM Check if .env exists
if not exist ".env" (
    echo [ERROR] .env file not found!
    echo Please copy .env.example to .env and configure it.
    echo.
    echo Run: copy .env.example .env
    echo Then edit .env with your GitHub OAuth credentials.
    pause
    exit /b 1
)

REM Check if frontend/.env.local exists
if not exist "frontend\.env.local" (
    echo [INFO] Creating frontend/.env.local...
    echo NEXT_PUBLIC_API_URL=http://localhost:8080 > frontend\.env.local
)

echo [1/4] Installing backend dependencies...
cd backend
go mod download
if errorlevel 1 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo [2/4] Building backend...
go build -o github-api.exe ./cmd/main.go
if errorlevel 1 (
    echo [ERROR] Failed to build backend
    pause
    exit /b 1
)

echo.
echo [3/4] Installing frontend dependencies...
cd ..\frontend
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)

echo.
echo [4/4] Setup complete!
echo.
echo ========================================
echo   Ready to start DevScope!
echo ========================================
echo.
echo To start the application:
echo   1. Open a terminal and run: cd backend ^&^& github-api.exe
echo   2. Open another terminal and run: cd frontend ^&^& npm run dev
echo   3. Open http://localhost:3000 in your browser
echo.
echo OR use the start-dev.bat script to start both servers
echo.
pause
