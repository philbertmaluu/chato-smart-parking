@echo off
title Smart Parking System - Complete Installer Builder
color 0A

echo ============================================
echo   Smart Parking Complete Installer Builder
echo ============================================
echo.

cd /d "%~dp0"

:: Step 1: Check for Inno Setup
echo [1/6] Checking for Inno Setup...
where iscc >nul 2>&1
if errorlevel 1 goto :no_inno
echo Inno Setup found!
goto :check_php

:no_inno
echo.
echo ERROR: Inno Setup Compiler [iscc] not found!
echo.
echo Please download and install Inno Setup from:
echo https://jrsoftware.org/isdl.php
echo.
echo After installation, add to PATH or run from Inno Setup folder.
pause
exit /b 1

:check_php
:: Step 2: Download PHP if needed
echo.
echo [2/6] Setting up PHP runtime...
if exist "php-8.2.zip" goto :extract_php
echo Downloading PHP 8.2 portable...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri 'https://windows.php.net/downloads/releases/php-8.2.27-nts-Win32-vs16-x64.zip' -OutFile 'php-8.2.zip' -UseBasicParsing"

:extract_php
if exist "build\php\php.exe" goto :php_ready
echo Extracting PHP...
powershell -Command "Expand-Archive -Path 'php-8.2.zip' -DestinationPath 'build\php' -Force"
copy /Y "build\php\php.ini" "build\php\php.ini.bak" 2>nul

:php_ready
echo PHP runtime ready!

:: Step 3: Copy frontend
echo.
echo [3/6] Copying frontend application...
set "FRONTEND_EXE=..\smart-parking-front\src-tauri\target\release\Smart Parking System.exe"
if exist "%FRONTEND_EXE%" goto :copy_frontend
echo Frontend not built! Building now...
cd ..\smart-parking-front
call npm run desktop:build
cd ..\installer

:copy_frontend
xcopy /Y /E /I "%FRONTEND_EXE%" "build\frontend\" >nul
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

:: Step 5: Create production config using PowerShell
echo.
echo [5/6] Creating production configuration...
powershell -Command "$env = @'
APP_NAME=SmartParkingSystem
APP_ENV=production
APP_KEY=base64:Yi0E5da3nj65X/HW0YcYGyYbMOpDAhySk1JOR8FPeLw=
APP_DEBUG=false
APP_URL=http://127.0.0.1:8000
APP_TIMEZONE=Africa/Dar_es_Salaam

LOG_CHANNEL=daily
LOG_LEVEL=error

DB_CONNECTION=sqlite
DB_DATABASE=C:/ProgramData/SmartParking/database.sqlite

CACHE_DRIVER=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync

PRINTER_ENABLED=true
PRINTER_CONNECTION_TYPE=windows
PRINTER_SHARE_NAME=POS80C
PRINTER_AUTO_PRINT_ENTRY=true
PRINTER_AUTO_PRINT_EXIT=true

RECEIPT_COMPANY_NAME=Smart Parking System
RECEIPT_TAGLINE=Safe and Secure Parking
RECEIPT_FOOTER=Thank you for parking with us!
RECEIPT_CURRENCY=Tsh

SANCTUM_STATEFUL_DOMAINS=localhost,127.0.0.1
'@; $env | Out-File -FilePath 'build\backend\.env.production' -Encoding ASCII -NoNewline"
echo Configuration created!

:: Step 6: Build installer
echo.
echo [6/6] Building installer with Inno Setup...
iscc "SmartParkingComplete.iss"
if errorlevel 1 goto :build_failed

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
exit /b 0

:build_failed
echo.
echo ERROR: Installer build failed!
pause
exit /b 1
