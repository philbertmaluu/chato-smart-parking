@echo off
title Smart Parking System - Installer Builder
color 0A

echo ============================================
echo   Smart Parking System Installer Builder
echo ============================================
echo.

:: Check for required tools
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

where cargo >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Rust/Cargo is not installed!
    echo Please install Rust from https://rustup.rs
    pause
    exit /b 1
)

echo [1/4] Building Next.js frontend...
cd /d "%~dp0..\smart-parking-front"
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)

echo.
echo [2/4] Building Tauri desktop app...
call npm run desktop:build
if %errorlevel% neq 0 (
    echo ERROR: Tauri build failed!
    pause
    exit /b 1
)

echo.
echo [3/4] Copying installer files...
cd /d "%~dp0"

:: Create output directory
if not exist "output" mkdir output

:: Copy the NSIS installer from Tauri build
set "TAURI_OUTPUT=%~dp0..\smart-parking-front\src-tauri\target\release\bundle\nsis"
if exist "%TAURI_OUTPUT%\*.exe" (
    copy "%TAURI_OUTPUT%\*.exe" "output\" /Y
    echo Tauri NSIS installer copied!
)

:: Copy MSI if exists
set "MSI_OUTPUT=%~dp0..\smart-parking-front\src-tauri\target\release\bundle\msi"
if exist "%MSI_OUTPUT%\*.msi" (
    copy "%MSI_OUTPUT%\*.msi" "output\" /Y
    echo Tauri MSI installer copied!
)

echo.
echo [4/4] Build complete!
echo.
echo ============================================
echo   Installers are in: installer\output\
echo ============================================
echo.

dir output\*.exe output\*.msi 2>nul

echo.
pause

