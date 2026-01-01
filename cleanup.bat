@echo off
echo Cleaning up ports 3000 and 3005...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3005 ^| findstr LISTENING') do (
    echo Killing process %%a on port 3005...
    taskkill /f /pid %%a
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo Killing process %%a on port 3000...
    taskkill /f /pid %%a
)

echo Cleanup complete.
timeout /t 3
