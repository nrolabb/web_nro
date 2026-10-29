@echo off
chcp 65001 >nul
title Khởi động NRO Web Server
cd /d "%~dp0"

:: Tự động yêu cầu quyền Administrator nếu chưa có
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [THONG BAO] Dang yeu cau quyen Administrator...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo ========================================================
echo            DANG KHOI DONG NRO WEB SERVER                
echo ========================================================
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
    "$conn = Get-NetTCPConnection -LocalPort 80 -State Listen -ErrorAction SilentlyContinue; " ^
    "if ($conn) { " ^
    "    Write-Host '[!] Web server da dang chay tren port 80 roi!' -ForegroundColor Cyan; " ^
    "} else { " ^
    "    Write-Host '[*] Dang khoi chay NRO Web Service...' -ForegroundColor Yellow; " ^
    "    $task = Get-ScheduledTask -TaskName 'NRO Web' -ErrorAction SilentlyContinue; " ^
    "    if ($task) { " ^
    "        Start-ScheduledTask -TaskName 'NRO Web'; " ^
    "    } else { " ^
    "        Start-Process powershell.exe -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"' + $PWD + '\start_web.ps1\"' -WindowStyle Hidden; " ^
    "    }; " ^
    "    Write-Host '[*] Dang cho Web khoi dong...' -ForegroundColor Yellow; " ^
    "    $ready = $false; " ^
    "    for ($i = 0; $i -lt 15; $i++) { " ^
    "        Start-Sleep -Seconds 1; " ^
    "        $conn = Get-NetTCPConnection -LocalPort 80 -State Listen -ErrorAction SilentlyContinue; " ^
    "        if ($conn) { $ready = $true; break; } " ^
    "    }; " ^
    "    if ($ready) { " ^
    "        Write-Host '========================================================' -ForegroundColor Green; " ^
    "        Write-Host '         KHOI DONG WEB THANH CONG (PORT 80 UP)         ' -ForegroundColor Green; " ^
    "        Write-Host '========================================================' -ForegroundColor Green; " ^
    "    } else { " ^
    "        Write-Host '========================================================' -ForegroundColor Red; " ^
    "        Write-Host '   CANH BAO: Web chua len sau 15 giay, vui long check log.' -ForegroundColor Red; " ^
    "        Write-Host '========================================================' -ForegroundColor Red; " ^
    "    } " ^
    "}"

echo.
echo Cua so se tu dong dong sau 5 giay...
timeout /t 5 >nul
