@echo off
chcp 65001 >nul
title Khởi động lại NRO Web
cd /d "%~dp0"

:: Tự động yêu cầu quyền Administrator nếu chưa có
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [THONG BAO] Dang yeu cau quyen Administrator...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo ========================================================
echo            DANG KHOI DONG LAI NRO WEB SERVER            
echo ========================================================
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
    "Write-Host '[1/4] Dang dung Scheduled Task NRO Web...' -ForegroundColor Yellow; " ^
    "Stop-ScheduledTask -TaskName 'NRO Web' -ErrorAction SilentlyContinue; " ^
    "Start-Sleep -Seconds 1; " ^
    "Write-Host '[2/4] Dang dung tien trinh web cu (Port 80, Node, Launcher)...' -ForegroundColor Yellow; " ^
    "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'start_web\.ps1' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }; " ^
    "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'index\.js' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }; " ^
    "$conns = Get-NetTCPConnection -LocalPort 80 -ErrorAction SilentlyContinue; " ^
    "foreach ($c in $conns) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue }; " ^
    "Start-Sleep -Seconds 2; " ^
    "Write-Host '[3/4] Dang khoi dong lai Web Service...' -ForegroundColor Yellow; " ^
    "$task = Get-ScheduledTask -TaskName 'NRO Web' -ErrorAction SilentlyContinue; " ^
    "if ($task) { " ^
    "    Start-ScheduledTask -TaskName 'NRO Web'; " ^
    "} else { " ^
    "    Start-Process powershell.exe -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"' + $PWD + '\start_web.ps1\"' -WindowStyle Hidden; " ^
    "}; " ^
    "Write-Host '[4/4] Dang kiem tra trang thai Web (Port 80)...' -ForegroundColor Yellow; " ^
    "$ready = $false; " ^
    "for ($i = 0; $i -lt 15; $i++) { " ^
    "    Start-Sleep -Seconds 1; " ^
    "    $conn = Get-NetTCPConnection -LocalPort 80 -State Listen -ErrorAction SilentlyContinue; " ^
    "    if ($conn) { $ready = $true; break; } " ^
    "}; " ^
    "if ($ready) { " ^
    "    Write-Host '========================================================' -ForegroundColor Green; " ^
    "    Write-Host '   KHOI DONG LAI WEB THANH CONG! PORT 80 DANG HOAT DONG  ' -ForegroundColor Green; " ^
    "    Write-Host '========================================================' -ForegroundColor Green; " ^
    "} else { " ^
    "    Write-Host '========================================================' -ForegroundColor Red; " ^
    "    Write-Host '   CANH BAO: Web dang khoi dong, vui long kiem tra logs. ' -ForegroundColor Red; " ^
    "    Write-Host '========================================================' -ForegroundColor Red; " ^
    "}"

echo.
echo Cua so se tu dong dong sau 5 giay...
timeout /t 5 >nul
