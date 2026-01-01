@echo off
call "%~dp0cleanup.bat"
echo Starting EuroCom...
start "EuroCom Backend" cmd /k "cd /d %~dp0server && npx prisma db push && npx prisma generate && npm run dev"
start "EuroCom Frontend" cmd /k "cd /d %~dp0client && npm run dev"
echo.
echo Both servers are starting in separate windows.
echo You can close this window now.
timeout /t 5
