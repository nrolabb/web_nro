@echo off
chcp 65001 >nul
title Dừng NRO Web Server
cd /d "%~dp0"

:: Tự động yêu cầu quyền Administrator nếu chưa có
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [THONG BAO] Dang yeu cau quyen Administrator...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo ========================================================
echo              DANG DUNG NRO WEB SERVER                   
echo ========================================================
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
    "Write-Host '[1/2] Dang dung Scheduled Task NRO Web...' -ForegroundColor Yellow; " ^
    "Stop-ScheduledTask -TaskName 'NRO Web' -ErrorAction SilentlyContinue; " ^
    "Start-Sleep -Seconds 1; " ^
    "Write-Host '[2/2] Dang dong cac tien trinh tren port 80 va script launcher...' -ForegroundColor Yellow; " ^
    "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'start_web\.ps1' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }; " ^
    "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'index\.js' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }; " ^
    "$conns = Get-NetTCPConnection -LocalPort 80 -ErrorAction SilentlyContinue; " ^
    "foreach ($c in $conns) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue }; " ^
    "Start-Sleep -Seconds 1; " ^
    "Write-Host '========================================================' -ForegroundColor Green; " ^
    "Write-Host '            DA DUNG WEB SERVER THANH CONG!              ' -ForegroundColor Green; " ^
    "Write-Host '========================================================' -ForegroundColor Green;"

echo.
echo Cua so se tu dong dong sau 3 giay...
timeout /t 3 >nul
