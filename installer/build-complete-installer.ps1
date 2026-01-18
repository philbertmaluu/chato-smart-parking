#!/usr/bin/env powershell

<#
.SYNOPSIS
Build Complete Smart Parking Installer with Tauri + Laravel Backend

.DESCRIPTION
Creates a standalone .exe installer that includes:
- Tauri desktop application
- Bundled Laravel backend
- SQLite database
- PHP runtime
- All dependencies

.EXAMPLE
.\build-complete-installer.ps1 -BuildType Release -All

#>

param(
    [ValidateSet("Debug", "Release")]
    [string]$BuildType = "Release",
    
    [switch]$BuildApp,
    [switch]$BuildBackend,
    [switch]$BuildInstaller,
    [switch]$SignInstaller,
    [switch]$CleanBuild,
    [switch]$All
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Create output directory
$OutputDir = ".\installer\output"
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

function Write-Log {
    param([string]$Message, [string]$Level = "Info")
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    $symbols = @{
        Info = "[*]"; Success = "[+]"; Error = "[!]"; Warning = "[!]"
    }
    
    $color = @{
        Info = "Cyan"; Success = "Green"; Error = "Red"; Warning = "Yellow"
    }
    
    Write-Host "$timestamp $($symbols[$Level]) $Message" -ForegroundColor $color[$Level]
}

function Test-Prerequisites {
    Write-Log "Checking prerequisites..." "Info"
    
    # Check Rust
    try {
        $rustVersion = rustc --version 2>$null
        Write-Log "Found Rust: $rustVersion" "Success"
    } catch {
        throw "Rust not found. Install from: https://rustup.rs/"
    }
    
    # Check Node.js
    try {
        $nodeVersion = node --version 2>$null
        Write-Log "Found Node.js: $nodeVersion" "Success"
    } catch {
        throw "Node.js not found. Install from: https://nodejs.org/"
    }
    
    # Check npm
    try {
        $npmVersion = npm --version 2>$null
        Write-Log "Found npm: $npmVersion" "Success"
    } catch {
        throw "npm not found"
    }
    
    # Check Composer
    try {
        $composerVersion = composer --version 2>$null
        Write-Log "Found Composer: $composerVersion" "Success"
    } catch {
        Write-Log "Composer not found - continuing anyway" "Warning"
    }
    
    # Check Inno Setup
    $innoPath = "C:\Program Files (x86)\Inno Setup 6\iscc.exe"
    if (Test-Path $innoPath) {
        Write-Log "Found Inno Setup 6" "Success"
    } else {
        Write-Log "Inno Setup 6 not found at $innoPath" "Warning"
        Write-Log "Download from: https://jrsoftware.org/isdl.php" "Info"
    }
    
    Write-Log "Prerequisites check complete" "Success"
}

function Build-TauriApp {
    Write-Log "Building Tauri Application ($BuildType mode)..." "Info"
    
    Push-Location ".\smart-parking-front"
    
    try {
        # Clean if requested
        if ($CleanBuild) {
            Write-Log "Cleaning build artifacts..." "Info"
            if (Test-Path "src-tauri\target") {
                Remove-Item "src-tauri\target" -Recurse -Force -ErrorAction SilentlyContinue
            }
        }
        
        # Install dependencies
        Write-Log "Installing npm dependencies..." "Info"
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed with exit code $LASTEXITCODE"
        }
        
        # Build Tauri app
        Write-Log "Compiling Tauri application..." "Info"
        npm run tauri build
        
        if ($LASTEXITCODE -ne 0) {
            throw "Tauri build failed with exit code $LASTEXITCODE"
        }
        
        # Verify executable exists
        $exePath = Get-ChildItem -Path "src-tauri\target\release" -Filter "Smart Parking.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
        if (-not $exePath) {
            throw "Could not find Smart Parking.exe after build"
        }
        
        Write-Log "Tauri app built successfully" "Success"
        return $exePath.FullName
    }
    finally {
        Pop-Location
    }
}

function Build-LaravelBackend {
    Write-Log "Preparing Laravel Backend..." "Info"
    
    Push-Location ".\smart-parking-api"
    
    try {
        # Install composer dependencies (production only)
        Write-Log "Installing composer dependencies..." "Info"
        composer install --no-dev --optimize-autoloader --prefer-dist
        
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Composer install had issues but continuing..." "Warning"
        }
        
        # Create env file if needed
        if (-not (Test-Path ".env")) {
            Write-Log "Creating .env file..." "Info"
            if (Test-Path ".env.example") {
                Copy-Item ".env.example" ".env" -Force
            }
        }
        
        Write-Log "Laravel backend prepared" "Success"
    }
    catch {
        Write-Log "Laravel preparation warning: $_" "Warning"
    }
    finally {
        Pop-Location
    }
}

function Build-Installer {
    Write-Log "Creating Installer with Inno Setup..." "Info"
    
    # Find Inno Setup compiler
    $innoPath = "C:\Program Files (x86)\Inno Setup 6\iscc.exe"
    if (-not (Test-Path $innoPath)) {
        $innoPath = "C:\Program Files\Inno Setup 6\iscc.exe"
    }
    
    if (-not (Test-Path $innoPath)) {
        throw "Inno Setup 6 not found. Install from: https://jrsoftware.org/isdl.php"
    }
    
    # Run Inno Setup compiler
    Write-Log "Running Inno Setup compiler..." "Info"
    $scriptPath = ".\installer\SmartParkingInstaller.iss"
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $outputName = "SmartParkingSetup-$timestamp"
    
    & $innoPath "/O$OutputDir" "/F$outputName" $scriptPath
    
    if ($LASTEXITCODE -ne 0) {
        throw "Inno Setup compilation failed"
    }
    
    # Find created installer
    $installerFile = Get-ChildItem -Path $OutputDir -Filter "SmartParkingSetup-*.exe" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    
    if (-not $installerFile) {
        throw "Could not find created installer"
    }
    
    $sizeMB = [Math]::Round($installerFile.Length / 1MB, 2)
    Write-Log "Installer created: $($installerFile.Name) ($sizeMB MB)" "Success"
    
    return $installerFile.FullName
}

function Create-Portable {
    Write-Log "Creating Portable Package..." "Info"
    
    $portableDir = ".\installer\SmartParking-Portable"
    
    # Clean and create
    if (Test-Path $portableDir) {
        Remove-Item $portableDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $portableDir -Force | Out-Null
    
    # Copy executable
    $tauriExe = Get-ChildItem -Path ".\smart-parking-front\src-tauri\target\release" -Filter "Smart Parking.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($tauriExe) {
        Copy-Item $tauriExe.FullName "$portableDir\SmartParking.exe" -Force
        Write-Log "Copied application executable" "Success"
    }
    
    # Copy backend
    if (Test-Path ".\smart-parking-api") {
        Write-Log "Copying backend files..." "Info"
        Copy-Item ".\smart-parking-api" "$portableDir\backend" -Recurse -Force -Exclude @("node_modules", "vendor\*\tests", "vendor\*\docs")
        Write-Log "Copied Laravel backend" "Success"
    }
    
    # Create data directory
    New-Item -ItemType Directory -Path "$portableDir\data" -Force | Out-Null
    
    # Create start script
    $batchFile = "$portableDir\start.bat"
    @"
@echo off
echo Smart Parking - Portable Edition
if not exist data mkdir data
cd /d "%~dp0"
start SmartParking.exe
exit /b 0
"@ | Set-Content $batchFile -Encoding ASCII
    
    Write-Log "Portable package created" "Success"
    return $portableDir
}

function Show-Summary {
    param([string]$InstallerPath, [string]$PortablePath)
    
    Write-Host "`n" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "    BUILD COMPLETE" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    
    if ($InstallerPath) {
        Write-Host "`nInstaller Package:" -ForegroundColor Yellow
        Write-Host "  File: $(Split-Path $InstallerPath -Leaf)" -ForegroundColor Green
        Write-Host "  Location: $InstallerPath" -ForegroundColor Green
        
        $size = [Math]::Round((Get-Item $InstallerPath).Length / 1MB, 2)
        Write-Host "  Size: $size MB" -ForegroundColor Green
    }
    
    if ($PortablePath -and (Test-Path $PortablePath)) {
        Write-Host "`nPortable Package:" -ForegroundColor Yellow
        Write-Host "  Location: $PortablePath" -ForegroundColor Green
        Write-Host "  Usage: Extract folder and run start.bat" -ForegroundColor Green
    }
    
    Write-Host "`nNext Steps:" -ForegroundColor Yellow
    Write-Host "  1. Test installer on clean Windows machine" -ForegroundColor White
    Write-Host "  2. Verify app launches and database initializes" -ForegroundColor White
    Write-Host "  3. Test detection flow completely" -ForegroundColor White
    Write-Host "  4. Ready for distribution" -ForegroundColor White
    
    Write-Host "`n========================================`n" -ForegroundColor Cyan
}

# Main
try {
    Write-Host "`n"
    Write-Host "Smart Parking - Complete Installer Builder" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    # Determine what to build
    if ($All) {
        $BuildApp = $true
        $BuildBackend = $true
        $BuildInstaller = $true
    }
    
    if (-not ($BuildApp -or $BuildBackend -or $BuildInstaller)) {
        Write-Log "No targets specified. Use: -All -BuildApp -BuildBackend -BuildInstaller" "Warning"
        exit 0
    }
    
    # Run phases
    Test-Prerequisites
    
    $installerPath = $null
    $portablePath = $null
    
    if ($BuildApp) {
        Build-TauriApp
    }
    
    if ($BuildBackend) {
        Build-LaravelBackend
    }
    
    if ($BuildInstaller) {
        $installerPath = Build-Installer
        $portablePath = Create-Portable
    }
    
    Show-Summary -InstallerPath $installerPath -PortablePath $portablePath
}
catch {
    Write-Log "Build failed: $_" "Error"
    exit 1
}
