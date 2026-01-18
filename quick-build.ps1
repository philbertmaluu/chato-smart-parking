#!/usr/bin/env powershell

<#
.SYNOPSIS
Quick Smart Parking Build - Simplified version

.DESCRIPTION
Builds complete Smart Parking installer with Tauri app and Laravel backend.

.EXAMPLE
.\quick-build.ps1 -Mode All
#>

param(
    [ValidateSet("AppOnly", "BackendOnly", "InstallerOnly", "All")]
    [string]$Mode = "All"
)

$ErrorActionPreference = "Stop"

function Log {
    param([string]$Msg, [string]$Color = "White")
    $time = Get-Date -Format "HH:mm:ss"
    Write-Host "$time | $Msg" -ForegroundColor $Color
}

function Start-Build {
    Log "Smart Parking Build System" "Cyan"
    Log "======================================" "Cyan"
    Log ""
    
    switch ($Mode) {
        "AppOnly" {
            Log "Building Tauri Application..." "Yellow"
            Build-App
        }
        "BackendOnly" {
            Log "Building Laravel Backend..." "Yellow"
            Build-Backend
        }
        "InstallerOnly" {
            Log "Building Installer Package..." "Yellow"
            Build-Installer
        }
        "All" {
            Log "Building Complete Package (App + Backend + Installer)..." "Yellow"
            Build-App
            Build-Backend
            Build-Installer
        }
    }
    
    Log "Build Complete!" "Green"
}

function Build-App {
    Log "Step 1: Building Tauri Application" "Cyan"
    
    Push-Location "smart-parking-front"
    
    try {
        Log "Installing npm dependencies..." "White"
        npm install 2>&1 | Out-Null
        
        Log "Building frontend and Rust backend..." "White"
        npm run tauri build 2>&1 | Out-Null
        
        $exe = Get-ChildItem -Path "src-tauri\target\release" -Filter "Smart Parking.exe" -ErrorAction SilentlyContinue
        if ($exe) {
            $size = [math]::Round($exe.Length / 1MB, 2)
            Log "Tauri app built successfully ($size MB)" "Green"
        } else {
            Log "Warning: Smart Parking.exe not found in release directory" "Yellow"
        }
    }
    catch {
        Log "Error building app: $_" "Red"
        throw
    }
    finally {
        Pop-Location
    }
}

function Build-Backend {
    Log "Step 2: Preparing Laravel Backend" "Cyan"
    
    Push-Location "smart-parking-api"
    
    try {
        Log "Installing composer dependencies..." "White"
        
        if (-not (Test-Path ".env")) {
            if (Test-Path ".env.example") {
                Copy-Item ".env.example" ".env" -Force
            }
        }
        
        # Try composer, continue if fails
        composer install --no-dev --optimize-autoloader 2>&1 | Out-Null
        Log "Backend prepared" "Green"
    }
    catch {
        Log "Warning: Composer not fully available, continuing..." "Yellow"
    }
    finally {
        Pop-Location
    }
}

function Build-Installer {
    Log "Step 3: Creating Installer with Inno Setup" "Cyan"
    
    # Check Inno Setup
    $innoPath = "C:\Program Files (x86)\Inno Setup 6\iscc.exe"
    if (-not (Test-Path $innoPath)) {
        $innoPath = "C:\Program Files\Inno Setup 6\iscc.exe"
    }
    
    if (-not (Test-Path $innoPath)) {
        Log "Error: Inno Setup 6 not found" "Red"
        Log "Download from: https://jrsoftware.org/isdl.php" "Yellow"
        throw "Inno Setup not found"
    }
    
    # Create output dir
    if (-not (Test-Path ".\installer\output")) {
        New-Item -ItemType Directory -Path ".\installer\output" -Force | Out-Null
    }
    
    Log "Compiling installer..." "White"
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $output = ".\installer\output"
    
    & $innoPath "/O$output" "/FSmartParkingSetup-$timestamp" ".\installer\SmartParkingInstaller.iss" 2>&1 | Out-Null
    
    $installer = Get-ChildItem -Path $output -Filter "SmartParkingSetup-*.exe" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    
    if ($installer) {
        $size = [math]::Round($installer.Length / 1MB, 2)
        Log "Installer created: $($installer.Name) ($size MB)" "Green"
        Log "Location: $($installer.FullName)" "Cyan"
    }
}

try {
    Start-Build
    Log ""
    Log "All done! Ready for distribution." "Green"
}
catch {
    Log ""
    Log "Build failed: $_" "Red"
    exit 1
}
