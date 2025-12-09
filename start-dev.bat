@echo off
REM Start both backend and frontend in development mode

echo.
echo ========================================
echo   Starting DevScope Development Servers
echo ========================================
echo.

REM Start backend in a new window
echo Starting backend server...
start "DevScope Backend" cmd /k "cd backend && github-api.exe"

REM Wait a bit for backend to start
timeout /t 3 /nobreak > nul

REM Start frontend in a new window
echo Starting frontend server...
start "DevScope Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   DevScope is starting!
echo ========================================
echo.
echo Backend:  http://localhost:8080
echo Frontend: http://localhost:3000
echo.
echo Both servers are running in separate windows.
echo Close those windows to stop the servers.
echo.
pause
