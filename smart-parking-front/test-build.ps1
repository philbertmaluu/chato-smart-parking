Write-Host "Testing Next.js static export build..." -ForegroundColor Cyan
$isTauriTest = $true
Set-Item -Path "env:NEXT_PUBLIC_TAURI_BUILD" -Value "true"

Write-Host "Step 1: Running prebuild..." -ForegroundColor Yellow
node scripts/prebuild-tauri.js

Write-Host "Step 2: Running Next.js build..." -ForegroundColor Yellow
npm run build

Write-Host "Build complete. Checking output..." -ForegroundColor Cyan
$indexPath = Join-Path $PSScriptRoot "out" "index.html"

if (Test-Path $indexPath) {
  Write-Host "✓ Success: out/index.html exists" -ForegroundColor Green
  Write-Host ""
  Write-Host "File details:" -ForegroundColor Yellow
  Get-Item $indexPath | Format-Table Name, Length, LastWriteTime
  
  Write-Host ""
  Write-Host "First 30 lines of index.html:" -ForegroundColor Yellow
  Get-Content $indexPath | Select-Object -First 30 | ForEach-Object { Write-Host $_ }
} else {
  Write-Host "❌ Failed: out/index.html not found" -ForegroundColor Red
  Write-Host ""
  Write-Host "Contents of out/ directory:" -ForegroundColor Yellow
  if (Test-Path (Join-Path $PSScriptRoot "out")) {
    Get-ChildItem -Path (Join-Path $PSScriptRoot "out") -Force | Format-Table Name, Length, LastWriteTime
  } else {
    Write-Host "out/ directory does not exist!"
  }
}
