# Download Visual C++ Redistributable for bundling
param(
    [string]$OutputPath = "resources\vcredist_x64.exe"
)

$ErrorActionPreference = "Stop"

Write-Host "`n=== Downloading Visual C++ Redistributable ===`n"

$downloadUrl = "https://aka.ms/vs/17/release/vc_redist.x64.exe"
$outputFile = Join-Path $PSScriptRoot "..\$OutputPath"

# Create resources directory if it doesn't exist
$resourcesDir = Split-Path $outputFile -Parent
if (-not (Test-Path $resourcesDir)) {
    New-Item -ItemType Directory -Path $resourcesDir -Force | Out-Null
    Write-Host "✓ Created resources directory"
}

# Check if file already exists
if (Test-Path $outputFile) {
    $fileInfo = Get-Item $outputFile
    $fileSizeMB = [math]::Round($fileInfo.Length / 1MB, 2)
    Write-Host "✓ VC++ Redistributable already exists: $($fileInfo.Name) ($fileSizeMB MB)"
    Write-Host "  Location: $outputFile"
    
    # Verify file size (should be around 26-30 MB)
    if ($fileInfo.Length -lt 20MB -or $fileInfo.Length -gt 35MB) {
        Write-Host "⚠ Warning: File size seems incorrect. Re-downloading..." -ForegroundColor Yellow
        Remove-Item $outputFile -Force
    } else {
        Write-Host "✓ File size looks correct. Skipping download.`n" -ForegroundColor Green
        exit 0
    }
}

Write-Host "Downloading from: $downloadUrl"
Write-Host "Saving to: $outputFile`n"

try {
    # Use Invoke-WebRequest to download
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $downloadUrl -OutFile $outputFile -UseBasicParsing
    
    $fileInfo = Get-Item $outputFile
    $fileSizeMB = [math]::Round($fileInfo.Length / 1MB, 2)
    
    if ($fileInfo.Length -lt 20MB) {
        throw "Downloaded file is too small ($fileSizeMB MB). Download may have failed."
    }
    
    Write-Host "✓ Download complete!" -ForegroundColor Green
    Write-Host "  File: $($fileInfo.Name)"
    Write-Host "  Size: $fileSizeMB MB"
    Write-Host "  Location: $outputFile`n"
    
} catch {
    Write-Host "✗ Download failed: $_" -ForegroundColor Red
    Write-Host "`nPlease download manually from:" -ForegroundColor Yellow
    Write-Host "  $downloadUrl" -ForegroundColor Cyan
    Write-Host "`nAnd save to: $outputFile`n" -ForegroundColor Yellow
    exit 1
}

