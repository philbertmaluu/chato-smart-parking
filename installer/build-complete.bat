@echo off
title Smart Parking System - Complete Installer Builder
color 0A
setlocal EnableDelayedExpansion

echo ============================================
echo   Smart Parking Complete Installer Builder
echo ============================================
echo.

cd /d "%~dp0"

:: Step 1: Check for Inno Setup
echo [1/6] Checking for Inno Setup...
where iscc >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Inno Setup Compiler (iscc) not found!
    echo.
    echo Please download and install Inno Setup from:
    echo https://jrsoftware.org/isdl.php
    echo.
    echo After installation, add to PATH or run from Inno Setup folder.
    pause
    exit /b 1
)
echo Inno Setup found!

:: Step 2: Download PHP if needed
echo.
echo [2/6] Setting up PHP runtime...
if not exist "php-8.2.zip" (
    echo Downloading PHP 8.2 portable...
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri 'https://windows.php.net/downloads/releases/php-8.2.27-nts-Win32-vs16-x64.zip' -OutFile 'php-8.2.zip' -UseBasicParsing"
)

if not exist "build\php\php.exe" (
    echo Extracting PHP...
    powershell -Command "Expand-Archive -Path 'php-8.2.zip' -DestinationPath 'build\php' -Force"
    copy /Y "build\php\php.ini" "build\php\php.ini.bak" 2>nul
)
echo PHP runtime ready!

:: Step 3: Copy frontend
echo.
echo [3/6] Copying frontend application...
if not exist "..\smart-parking-front\src-tauri\target\release\Smart Parking System.exe" (
    echo Frontend not built! Building now...
    cd ..\smart-parking-front
    call npm run desktop:build
    cd ..\installer
)
xcopy /Y /E /I "..\smart-parking-front\src-tauri\target\release\Smart Parking System.exe" "build\frontend\" >nul
xcopy /Y "..\smart-parking-front\src-tauri\icons\icon.ico" "build\frontend\" >nul 2>&1
echo Frontend copied!

:: Step 4: Copy backend
echo.
echo [4/6] Copying backend application...
if exist "build\backend" rmdir /S /Q "build\backend"
mkdir "build\backend"

:: Use robocopy for efficient copying (exclude dev files)
robocopy "..\smart-parking-api" "build\backend" /E /XD .git node_modules tests .idea .vscode "storage\logs" "storage\framework\cache" "storage\framework\sessions" "storage\framework\views" /XF .env *.log phpunit.xml .gitignore .gitattributes /NFL /NDL /NJH /NJS /NC /NS >nul

:: Create required directories
mkdir "build\backend\storage\app\public" 2>nul
mkdir "build\backend\storage\framework\cache" 2>nul
mkdir "build\backend\storage\framework\sessions" 2>nul
mkdir "build\backend\storage\framework\views" 2>nul
mkdir "build\backend\storage\logs" 2>nul
mkdir "build\backend\bootstrap\cache" 2>nul

echo Backend copied!

:: Step 5: Create production config
echo.
echo [5/6] Creating production configuration...
(
echo APP_NAME="Smart Parking System"
echo APP_ENV=production
echo APP_KEY=
echo APP_DEBUG=false
echo APP_URL=http://127.0.0.1:8000
echo APP_TIMEZONE=Africa/Dar_es_Salaam
echo.
echo LOG_CHANNEL=daily
echo LOG_LEVEL=error
echo.
echo DB_CONNECTION=sqlite
echo DB_DATABASE=C:\ProgramData\SmartParking\database.sqlite
echo.
echo CACHE_DRIVER=file
echo SESSION_DRIVER=file
echo QUEUE_CONNECTION=sync
echo.
echo PRINTER_ENABLED=true
echo PRINTER_CONNECTION_TYPE=windows
echo PRINTER_SHARE_NAME=POS80C
echo PRINTER_AUTO_PRINT_ENTRY=true
echo PRINTER_AUTO_PRINT_EXIT=true
echo.
echo RECEIPT_COMPANY_NAME="Smart Parking System"
echo RECEIPT_TAGLINE="Safe and Secure Parking"
echo RECEIPT_FOOTER="Thank you for parking with us!"
echo RECEIPT_CURRENCY=Tsh
echo.
echo SANCTUM_STATEFUL_DOMAINS=localhost,127.0.0.1
) > "build\backend\.env.production"
echo Configuration created!

:: Step 6: Build installer
echo.
echo [6/6] Building installer with Inno Setup...
iscc "SmartParkingComplete.iss"

if errorlevel 1 (
    echo.
    echo ERROR: Installer build failed!
    pause
    exit /b 1
)

echo.
echo ============================================
echo   BUILD COMPLETE!
echo ============================================
echo.
echo Installer location:
dir /B "output\SmartParkingSetup*.exe"
echo.
echo Full path: %~dp0output\
echo.
pause

