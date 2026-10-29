@echo off
title Stop NRO Web
cd /d "%~dp0"

echo Dang dung Scheduled Task "NRO Web"...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Stop-ScheduledTask -TaskName 'NRO Web' -ErrorAction SilentlyContinue"

echo Dang dung cac tien trinh tren port 80...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$conns = Get-NetTCPConnection -LocalPort 80 -ErrorAction SilentlyContinue; foreach ($c in $conns) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue; Write-Output ('Da tat PID ' + $c.OwningProcess) }; Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'index\.js' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; Write-Output ('Da tat Node PID ' + $_.ProcessId) }"

echo Da dung Web thanh cong.
ping 127.0.0.1 -n 4 >nul
