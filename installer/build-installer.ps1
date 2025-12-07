# Smart Parking System - Windows Installer Build Script
# This script builds the complete installer package

param(
    [string]$Version = "1.1.0",
    [switch]$SkipFrontend,
    [switch]$SkipBackend,
    [switch]$SkipPhp
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$BuildDir = Join-Path $ScriptDir "build"
$OutputDir = Join-Path $ScriptDir "output"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Smart Parking System Installer Builder" -ForegroundColor Cyan
Write-Host "  Version: $Version" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Create directories
New-Item -ItemType Directory -Force -Path $BuildDir | Out-Null
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
New-Item -ItemType Directory -Force -Path "$BuildDir\backend" | Out-Null
New-Item -ItemType Directory -Force -Path "$BuildDir\php" | Out-Null
New-Item -ItemType Directory -Force -Path "$BuildDir\frontend" | Out-Null

# Step 1: Download portable PHP if not exists
if (-not $SkipPhp) {
    Write-Host "`n[1/5] Setting up PHP runtime..." -ForegroundColor Yellow
    $PhpZip = Join-Path $ScriptDir "php-8.2.zip"
    $PhpDir = Join-Path $BuildDir "php"
    
    if (-not (Test-Path "$PhpDir\php.exe")) {
        if (-not (Test-Path $PhpZip)) {
            Write-Host "Downloading PHP 8.2 (portable)..."
            $PhpUrl = "https://windows.php.net/downloads/releases/php-8.2.27-nts-Win32-vs16-x64.zip"
            Invoke-WebRequest -Uri $PhpUrl -OutFile $PhpZip -UseBasicParsing
        }
        Write-Host "Extracting PHP..."
        Expand-Archive -Path $PhpZip -DestinationPath $PhpDir -Force
        
        # Configure PHP
        $PhpIni = @"
[PHP]
extension_dir = "ext"
extension=curl
extension=fileinfo
extension=mbstring
extension=openssl
extension=pdo_mysql
extension=pdo_sqlite
extension=sqlite3
extension=zip

[Date]
date.timezone = Africa/Dar_es_Salaam

[Session]
session.save_path = "C:\ProgramData\SmartParking\sessions"
"@
        $PhpIni | Out-File -FilePath "$PhpDir\php.ini" -Encoding UTF8
    }
    Write-Host "PHP runtime ready!" -ForegroundColor Green
}

# Step 2: Build Laravel Backend
if (-not $SkipBackend) {
    Write-Host "`n[2/5] Building Laravel backend..." -ForegroundColor Yellow
    $BackendSrc = Join-Path $RootDir "smart-parking-api"
    $BackendDst = Join-Path $BuildDir "backend"
    
    # Copy backend files (excluding dev files)
    $excludeDirs = @(".git", "node_modules", "tests", "storage\logs", ".idea", ".vscode")
    $excludeFiles = @(".env", ".env.example", "phpunit.xml", ".gitignore", ".gitattributes")
    
    Write-Host "Copying backend files..."
    
    # Use robocopy for efficient copying
    $robocopyExclude = $excludeDirs -join " "
    robocopy $BackendSrc $BackendDst /E /XD .git node_modules tests .idea .vscode storage\framework\cache storage\framework\sessions storage\framework\views storage\logs /XF .env .env.example phpunit.xml .gitignore .gitattributes *.log /NFL /NDL /NJH /NJS /NC /NS
    
    # Create necessary directories
    New-Item -ItemType Directory -Force -Path "$BackendDst\storage\app\public" | Out-Null
    New-Item -ItemType Directory -Force -Path "$BackendDst\storage\framework\cache" | Out-Null
    New-Item -ItemType Directory -Force -Path "$BackendDst\storage\framework\sessions" | Out-Null
    New-Item -ItemType Directory -Force -Path "$BackendDst\storage\framework\views" | Out-Null
    New-Item -ItemType Directory -Force -Path "$BackendDst\storage\logs" | Out-Null
    New-Item -ItemType Directory -Force -Path "$BackendDst\bootstrap\cache" | Out-Null
    
    # Create production .env template
    $EnvTemplate = @"
APP_NAME=SmartParkingSystem
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=http://127.0.0.1:8000
APP_TIMEZONE=Africa/Dar_es_Salaam

LOG_CHANNEL=daily
LOG_LEVEL=error

DB_CONNECTION=sqlite
DB_DATABASE=C:\ProgramData\SmartParking\database.sqlite

CACHE_DRIVER=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync

# Printer Configuration
PRINTER_ENABLED=true
PRINTER_CONNECTION_TYPE=windows
PRINTER_SHARE_NAME=POS80C
PRINTER_AUTO_PRINT_ENTRY=true
PRINTER_AUTO_PRINT_EXIT=true

# Receipt Settings
RECEIPT_COMPANY_NAME=SmartParkingSystem
RECEIPT_TAGLINE=SafeAndSecureParking
RECEIPT_FOOTER=ThankYouForParkingWithUs
RECEIPT_CURRENCY=Tsh

# Authentication
SANCTUM_STATEFUL_DOMAINS=localhost,127.0.0.1

# Camera Detection (optional)
CAMERA_ENABLED=false
CAMERA_IP=192.168.0.109
CAMERA_COMPUTER_ID=1
CAMERA_GATE_ID=1
CAMERA_HTTP_PORT=80
CAMERA_USERNAME=admin
CAMERA_PASSWORD=Password123!

# Gate Control (optional)
GATE_CONTROL_ENABLED=false
"@
    $EnvTemplate | Out-File -FilePath "$BackendDst\.env.production" -Encoding UTF8
    
    Write-Host "Backend build complete!" -ForegroundColor Green
}

# Step 3: Build Frontend (Tauri)
if (-not $SkipFrontend) {
    Write-Host "`n[3/5] Building Tauri frontend..." -ForegroundColor Yellow
    $FrontendDir = Join-Path $RootDir "smart-parking-front"
    
    Push-Location $FrontendDir
    
    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing npm dependencies..."
        npm install
    }
    
    # Always rebuild to ensure latest changes are included
    Write-Host "Building Tauri application with latest changes..."
    Write-Host "This includes camera detection improvements (entry drawer with detected plates)"
    npm run desktop:build
    
    Pop-Location
    
    # Copy the built executable
    $TauriOutput = Join-Path $FrontendDir "src-tauri\target\release"
    if (Test-Path "$TauriOutput\Smart Parking System.exe") {
        Copy-Item "$TauriOutput\Smart Parking System.exe" "$BuildDir\frontend\" -Force
    }
    
    # Also copy the NSIS installer if created
    $NsisOutput = Join-Path $FrontendDir "src-tauri\target\release\bundle\nsis"
    if (Test-Path $NsisOutput) {
        Copy-Item "$NsisOutput\*.exe" $OutputDir -Force
    }
    
    Write-Host "Frontend build complete!" -ForegroundColor Green
}

# Step 4: Create startup scripts
Write-Host "`n[4/5] Creating startup scripts..." -ForegroundColor Yellow

# Scheduler startup script (for camera detection)
$SchedulerScript = @'
@echo off
title Smart Parking - Camera Detection Scheduler
cd /d "%~dp0backend"

:: Set PHP path
set PATH=%~dp0php;%PATH%

echo Starting Laravel Scheduler for Camera Detection...
echo This will fetch camera detections every 2 seconds
echo Press Ctrl+C to stop
echo.

:loop
"%~dp0php\php.exe" artisan schedule:run
timeout /t 1 /nobreak >nul
goto loop
'@
$SchedulerScript | Out-File -FilePath "$BuildDir\start-scheduler.bat" -Encoding ASCII

# Backend startup script
$BackendStartScript = @'
@echo off
title Smart Parking - Backend Server
cd /d "%~dp0"

:: Set PHP path
set PATH=%~dp0php;%PATH%

:: Start scheduler in background (for camera detection)
echo Starting camera detection scheduler...
start /min "Smart Parking Scheduler" cmd /c "%~dp0start-scheduler.bat"

:: Wait a moment for scheduler to initialize
timeout /t 2 /nobreak >nul

:: Start Laravel server
cd backend
"%~dp0php\php.exe" artisan serve --host=127.0.0.1 --port=8000

:: If server stops, pause to show error
pause
'@
$BackendStartScript | Out-File -FilePath "$BuildDir\start-backend.bat" -Encoding ASCII

# Main launcher script
$LauncherScript = @'
@echo off
title Smart Parking System
cd /d "%~dp0"

:: Check if first run - setup database
if not exist "C:\ProgramData\SmartParking\database.sqlite" (
    echo First run detected. Setting up database...
    mkdir "C:\ProgramData\SmartParking" 2>nul
    mkdir "C:\ProgramData\SmartParking\sessions" 2>nul
    copy "backend\.env.production" "backend\.env"
    
    :: Generate app key
    set PATH=%~dp0php;%PATH%
    cd backend
    php artisan key:generate --force
    php artisan migrate --force
    php artisan db:seed --force
    cd ..
    echo Database setup complete!
)

:: Start backend server in background
start /min "" cmd /c "start-backend.bat"

:: Wait for backend to start
echo Starting backend server...
timeout /t 3 /nobreak >nul

:: Start frontend
echo Starting Smart Parking System...
start "" "frontend\Smart Parking System.exe"

exit
'@
$LauncherScript | Out-File -FilePath "$BuildDir\SmartParking.bat" -Encoding ASCII

Write-Host "Startup scripts created!" -ForegroundColor Green

# Step 5: Create Inno Setup script
Write-Host "`n[5/5] Creating installer script..." -ForegroundColor Yellow

$InnoScript = @"
; Smart Parking System Installer
; Inno Setup Script

#define MyAppName "Smart Parking System"
#define MyAppVersion "$Version"
#define MyAppPublisher "Smart Parking"
#define MyAppURL "https://smartparking.com"
#define MyAppExeName "SmartParking.bat"

[Setup]
AppId={{8A2B3C4D-5E6F-7A8B-9C0D-1E2F3A4B5C6D}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
DefaultDirName={autopf}\SmartParking
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
LicenseFile=
OutputDir=output
OutputBaseFilename=SmartParkingSetup-{#MyAppVersion}
SetupIconFile=build\frontend\icon.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked; OnlyBelowVersion: 6.1; Check: not IsAdminInstallMode

[Files]
Source: "build\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "C:\ProgramData\SmartParking"
"@
$InnoScript | Out-File -FilePath "$ScriptDir\SmartParking.iss" -Encoding UTF8

Write-Host "Installer script created!" -ForegroundColor Green

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  Build Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "`nNext steps:"
Write-Host "1. Download and install Inno Setup from: https://jrsoftware.org/isinfo.php"
Write-Host "2. Open 'installer\SmartParking.iss' in Inno Setup"
Write-Host "3. Click 'Build > Compile' to create the installer"
Write-Host "4. The installer will be in 'installer\output\'"
Write-Host "`nAlternatively, run: iscc SmartParking.iss"

