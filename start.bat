@echo off
set "ROOT=%~dp0"

rem Server ide predvolene na porte 8000. Ak je obsadeny (napr. iny program alebo
rem Docker kontajner, chyba WinError 10013), pouzije sa port 8001.
set "API_PORT=8000"
powershell -NoProfile -Command "try { $l = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, 8000); $l.Start(); $l.Stop(); exit 0 } catch { exit 1 }"
if errorlevel 1 (
  set "API_PORT=8001"
  echo Port 8000 je obsadeny, server pobezi na porte 8001.
)

start "Backend (uvicorn)" cmd /k "cd /d "%ROOT%backend" && call .venv\Scripts\activate.bat && uvicorn main:app --reload --port %API_PORT%"
start "Frontend (npm)" cmd /k "cd /d "%ROOT%" && set API_PORT=%API_PORT%&& npm run dev"
