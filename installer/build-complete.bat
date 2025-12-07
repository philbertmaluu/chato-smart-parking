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
if errorlevel 1 goto :check_inno_path
echo Inno Setup found!
set "ISCC=iscc"
goto :check_php

:check_inno_path
:: Check common installation paths
if exist "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" (
    echo Inno Setup found at default location!
    set "ISCC=C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
    goto :check_php
)
if exist "C:\Program Files\Inno Setup 6\ISCC.exe" (
    echo Inno Setup found at default location!
    set "ISCC=C:\Program Files\Inno Setup 6\ISCC.exe"
    goto :check_php
)

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
echo [3/6] Building and copying frontend application...
echo Building frontend with latest changes...
cd ..\smart-parking-front
call npm run desktop:build
cd ..\installer

:: Copy frontend executable (rename app.exe to Smart Parking System.exe)
set "FRONTEND_EXE=..\smart-parking-front\src-tauri\target\release\app.exe"
if not exist "build\frontend" mkdir "build\frontend"
if exist "%FRONTEND_EXE%" (
    copy /Y "%FRONTEND_EXE%" "build\frontend\Smart Parking System.exe" >nul
    echo Frontend copied!
) else (
    echo ERROR: Frontend executable not found at %FRONTEND_EXE%!
    pause
    exit /b 1
)
if exist "..\smart-parking-front\src-tauri\icons\icon.ico" copy /Y "..\smart-parking-front\src-tauri\icons\icon.ico" "build\frontend\" >nul 2>&1
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
powershell -NoProfile -ExecutionPolicy Bypass -Command "$content = 'APP_NAME=SmartParkingSystem'; $content += \"`r`nAPP_ENV=production\"; $content += \"`r`nAPP_KEY=base64:Yi0E5da3nj65X/HW0YcYGyYbMOpDAhySk1JOR8FPeLw=\"; $content += \"`r`nAPP_DEBUG=false\"; $content += \"`r`nAPP_URL=http://127.0.0.1:8000\"; $content += \"`r`nAPP_TIMEZONE=Africa/Dar_es_Salaam\"; $content += \"`r`n\"; $content += \"`r`nLOG_CHANNEL=daily\"; $content += \"`r`nLOG_LEVEL=error\"; $content += \"`r`n\"; $content += \"`r`nDB_CONNECTION=sqlite\"; $content += \"`r`nDB_DATABASE=C:/ProgramData/SmartParking/database.sqlite\"; $content += \"`r`n\"; $content += \"`r`nCACHE_DRIVER=file\"; $content += \"`r`nSESSION_DRIVER=file\"; $content += \"`r`nQUEUE_CONNECTION=sync\"; $content += \"`r`n\"; $content += \"`r`n# Printer Configuration\"; $content += \"`r`nPRINTER_ENABLED=true\"; $content += \"`r`nPRINTER_CONNECTION_TYPE=windows\"; $content += \"`r`nPRINTER_SHARE_NAME=POS80C\"; $content += \"`r`nPRINTER_AUTO_PRINT_ENTRY=true\"; $content += \"`r`nPRINTER_AUTO_PRINT_EXIT=true\"; $content += \"`r`n\"; $content += \"`r`n# Receipt Settings\"; $content += \"`r`nRECEIPT_COMPANY_NAME=SmartParkingSystem\"; $content += \"`r`nRECEIPT_TAGLINE=SafeAndSecureParking\"; $content += \"`r`nRECEIPT_FOOTER=ThankYouForParkingWithUs\"; $content += \"`r`nRECEIPT_CURRENCY=Tsh\"; $content += \"`r`n\"; $content += \"`r`n# Authentication\"; $content += \"`r`nSANCTUM_STATEFUL_DOMAINS=localhost,127.0.0.1\"; $content += \"`r`n\"; $content += \"`r`n# Camera Detection (if needed)\"; $content += \"`r`nCAMERA_ENABLED=false\"; $content += \"`r`nCAMERA_IP=192.168.0.109\"; $content += \"`r`nCAMERA_COMPUTER_ID=1\"; $content += \"`r`nCAMERA_GATE_ID=1\"; $content += \"`r`nCAMERA_HTTP_PORT=80\"; $content += \"`r`nCAMERA_USERNAME=admin\"; $content += \"`r`nCAMERA_PASSWORD=Password123!\"; $content += \"`r`n\"; $content += \"`r`n# Receipt Tax Configuration\"; $content += \"`r`nRECEIPT_TAX_RATE=18.0\"; $content += \"`r`n\"; $content += \"`r`n# Gate Control (if needed)\"; $content += \"`r`nGATE_CONTROL_ENABLED=false\"; [System.IO.File]::WriteAllText('build\backend\.env.production', $content, [System.Text.Encoding]::ASCII)"
echo Configuration created!

:: Step 5.5: Create startup scripts
echo.
echo [5.5/6] Creating startup scripts...
(
echo @echo off
echo title Smart Parking - Camera Detection Scheduler
echo cd /d "%%~dp0backend"
echo.
echo :: Set PHP path
echo set PATH=%%~dp0php;%%PATH%%
echo.
echo echo Starting Laravel Scheduler for Camera Detection...
echo echo This will fetch camera detections every 2 seconds
echo echo Press Ctrl+C to stop
echo echo.
echo.
echo :loop
echo "%%~dp0php\php.exe" artisan schedule:run
echo timeout /t 1 /nobreak ^>nul
echo goto loop
) > "build\start-scheduler.bat"

(
echo @echo off
echo title Smart Parking - Backend Server
echo cd /d "%%~dp0"
echo.
echo :: Set PHP path
echo set PATH=%%~dp0php;%%PATH%%
echo.
echo :: Start scheduler in background ^(for camera detection^)
echo echo Starting camera detection scheduler...
echo start /min "Smart Parking Scheduler" cmd /c "%%~dp0start-scheduler.bat"
echo.
echo :: Wait a moment for scheduler to initialize
echo timeout /t 2 /nobreak ^>nul
echo.
echo :: Start Laravel server
echo cd backend
echo "%%~dp0php\php.exe" artisan serve --host=127.0.0.1 --port=8000
echo.
echo :: If server stops, pause to show error
echo pause
) > "build\start-backend.bat"

echo Startup scripts created!

:: Step 6: Build installer
echo.
echo [6/6] Building installer with Inno Setup...
"%ISCC%" "SmartParkingComplete.iss"
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
