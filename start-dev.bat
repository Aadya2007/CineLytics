@echo off
rem -- Cinelytics dev launcher (Windows) --
rem Starts the FastAPI backend (:8001) and the Vite dev server together.
setlocal
cd /d "%~dp0"

echo [1/2] Starting backend on http://127.0.0.1:8001 ...
start "Cinelytics Backend (API)" cmd /k "cd /d ""%~dp0backend"" && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8001"

echo [2/2] Starting frontend dev server on http://localhost:5173 ...
start "Cinelytics Frontend (Web)" cmd /k "cd /d ""%~dp0frontend"" && npm.cmd run dev"

echo.
echo ========================================================
echo   Both servers launched in separate windows!
echo   - Backend API  : http://127.0.0.1:8001/docs
echo   - Frontend App : http://localhost:5173
echo ========================================================
echo.
echo Press any key to close this launcher window (servers will keep running)...
pause >nul
endlocal
