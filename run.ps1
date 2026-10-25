# Cinelytics PowerShell Launcher
$rootDir = $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting CineLytics Movie Dashboard  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Start Backend in separate window
Write-Host "[1/2] Starting Backend on http://127.0.0.1:8001 ..." -ForegroundColor Green
Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd /d `"$rootDir\backend`" && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8001"

# 2. Start Frontend in separate window
Write-Host "[2/2] Starting Frontend on http://localhost:5173 ..." -ForegroundColor Green
Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd /d `"$rootDir\frontend`" && npm.cmd run dev"

Write-Host ""
Write-Host "Both servers launched successfully!" -ForegroundColor Yellow
Write-Host "  API Docs: http://127.0.0.1:8001/docs" -ForegroundColor White
Write-Host "  Web App : http://localhost:5173" -ForegroundColor White
