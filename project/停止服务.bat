@echo off
chcp 65001 >nul
title 家灯 JiaDeng · 停止服务

powershell -NoProfile -ExecutionPolicy Bypass -Command "$stopped = @(); foreach ($p in 8000..8010) { $conns = @(Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue); foreach ($c in $conns) { $procId = [int]$c.OwningProcess; $isJia = $false; try { $r = Invoke-RestMethod ('http://127.0.0.1:' + $p + '/api/health') -TimeoutSec 1 -ErrorAction Stop; if ($r.data.app -like '*JiaDeng*') { $isJia = $true } } catch {}; $proc = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $procId) -ErrorAction SilentlyContinue; if ($isJia -or ($proc -and $proc.Name -match '^python' -and $proc.CommandLine -match 'main\.py')) { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue; $stopped += $p } } }; if ($stopped.Count -gt 0) { Write-Host ('Server stopped on port(s): ' + (($stopped | Sort-Object -Unique) -join ', ')) } else { Write-Host 'Server is not running on ports 8000-8010.' }"

echo.
ping 127.0.0.1 -n 4 >nul
exit /b 0
