# PowerShell script to get Windows printer names
# Run this in PowerShell to find your printer name

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Available Windows Printers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Get-Printer | Format-Table -AutoSize Name, PrinterStatus, DriverName, PortName

Write-Host ""
Write-Host "To use a printer, copy the exact name from the 'Name' column above." -ForegroundColor Yellow
Write-Host "Example: 'POS-80C' or 'POS-80C (copy 1)'" -ForegroundColor Yellow
Write-Host ""

