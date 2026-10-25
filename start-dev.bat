@echo off
rem ── Cinelytics dev launcher (Windows) ─────────────────────────────
rem Starts the FastAPI backend (:8001) and the Vite dev server together.
setlocal
cd /d "%~dp0"

echo [Cinelytics] starting backend on http://127.0.0.1:8001 ...
start "Cinelytics API" cmd /k "cd backend && .venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8001"

echo [Cinelytics] starting frontend dev server ...
start "Cinelytics Web" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers launched in separate windows.
echo   API  : http://127.0.0.1:8001/docs
echo Web  : http://localhost:5173  (or 5174 if 5173 was busy)
endlocal
