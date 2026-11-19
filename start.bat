@echo off
set "ROOT=%~dp0"

start "Backend (uvicorn)" cmd /k "cd /d "%ROOT%backend" && call .venv\Scripts\activate.bat && uvicorn main:app --reload"
start "Frontend (npm)" cmd /k "cd /d "%ROOT%" && npm run dev"
