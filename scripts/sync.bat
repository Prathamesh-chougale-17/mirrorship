@echo off
REM Mirrorship Data Sync Script for Windows
REM This script can be run manually or via Windows Task Scheduler

echo 🚀 Starting Mirrorship data sync...

REM Check if Node.js is available
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed
    exit /b 1
)

REM Check if the sync script exists
if not exist "scripts\sync-data.js" (
    echo ❌ Sync script not found at scripts\sync-data.js
    exit /b 1
)

REM Load environment variables from .env if it exists
if exist ".env" (
    echo 📋 Loading environment variables from .env
    for /f "usebackq tokens=1,2 delims==" %%G in (".env") do (
        if not "%%G"=="" if not "%%G:~0,1%"=="#" set %%G=%%H
    )
)

REM Check required environment variables
if "%MONGODB_URI%"=="" (
    echo ❌ MONGODB_URI environment variable is required
    exit /b 1
)

REM Run the sync script
echo 🔄 Running data sync...
node scripts\sync-data.js

if %ERRORLEVEL% EQU 0 (
    echo ✅ Data sync completed successfully!
    REM Optional: Log the sync time
    echo %date% %time%: Data sync completed >> sync.log
) else (
    echo ❌ Data sync failed!
    exit /b 1
)