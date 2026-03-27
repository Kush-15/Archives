@echo off
setlocal

REM Clean stale Django/custom server processes to avoid port conflicts and hanging instances.
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -like 'python*' -and ($_.CommandLine -match 'manage.py runserver' -or $_.CommandLine -match 'runserver.py') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }" >nul 2>nul

REM Local development defaults.
set USE_REMOTE_DB=0
set RUNSERVER_REMOTE_DB=0

.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000 --noreload
endlocal
pause
