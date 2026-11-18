# =====================================================================
#  家灯 JiaDeng · 开发模式
#  后端 8000 + 前端 vite 5173（热更新），需要本机安装 Node.js 18+
#
#  用法：
#    powershell -ExecutionPolicy Bypass -File 开发模式.ps1
#    powershell -ExecutionPolicy Bypass -File 开发模式.ps1 -Port 8010
# =====================================================================
param(
    [int]$Port = 0
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
try {
    chcp 65001 > $null
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
} catch { }
$env:PYTHONIOENCODING = "utf-8"
$env:PYTHONUTF8 = "1"

function Write-Step($text) { Write-Host "`n[家灯] $text" -ForegroundColor Yellow }
function Write-Ok($text) { Write-Host "      $text" -ForegroundColor Green }
function Write-Warn($text) { Write-Host "  ! $text" -ForegroundColor Yellow }
function Fail($text, $detail = "") {
    Write-Host "`n  x $text" -ForegroundColor Red
    if ($detail) { Write-Host "    $detail" -ForegroundColor DarkGray }
    Write-Host ""
    exit 1
}

function Test-PythonExe($exe) {
    if (-not $exe -or -not (Test-Path $exe)) { return $null }
    try {
        $out = (& $exe -c "import sys; print('%d.%d' % sys.version_info[:2])" 2>$null | Out-String).Trim()
        if ($LASTEXITCODE -eq 0 -and $out -match '^3\.(\d+)$' -and [int]$matches[1] -ge 9) {
            return $out
        }
    } catch { }
    return $null
}

function Get-PortOwner($port) {
    try {
        $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction Stop | Select-Object -First 1
        if ($conn) { return [int]$conn.OwningProcess }
    } catch {
        $row = netstat -ano | Select-String -Pattern ":$port\s" | Select-Object -First 1
        if ($row -and ($row.Line -match '\s+(\d+)\s*$')) { return [int]$matches[1] }
    }
    return 0
}

function Test-JiaDeng($port) {
    try {
        $res = Invoke-RestMethod -Uri "http://127.0.0.1:$port/api/health" -TimeoutSec 2 -ErrorAction Stop
        if ($res -and $res.code -eq 0 -and $res.data -and "$($res.data.app)" -like "*JiaDeng*") {
            return $true
        }
    } catch { }
    return $false
}

function Wait-PortFree($port, $timeoutMs = 5000) {
    $deadline = (Get-Date).AddMilliseconds($timeoutMs)
    while ((Get-Date) -lt $deadline) {
        if ((Get-PortOwner $port) -eq 0) { return $true }
        Start-Sleep -Milliseconds 250
    }
    return ((Get-PortOwner $port) -eq 0)
}

Write-Host ""
Write-Host "  家灯 JiaDeng · 开发模式" -ForegroundColor White
Write-Host "  后端 + 前端热更新" -ForegroundColor DarkGray
Write-Host ""

# ---------- Node ----------
Write-Step "检查 Node.js"
$nodePath = $null
$nodeCmd = Get-Command node -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
if ($nodeCmd) { $nodePath = $nodeCmd.Source }
if (-not $nodePath) {
    # Node.js 已安装但当前进程 PATH 尚未刷新时，直接从默认安装目录找
    $candidate = Join-Path $env:ProgramFiles "nodejs\node.exe"
    if (Test-Path $candidate) {
        $nodePath = $candidate
        $env:Path = (Split-Path $candidate) + ";" + $env:Path
    }
}
if (-not $nodePath) {
    Fail "开发模式需要 Node.js 18+" "请安装：https://nodejs.org/"
}
$nodeVersion = (& $nodePath -v 2>$null | Out-String).Trim()
if ($nodeVersion -match '^v(\d+)\.' -and [int]$matches[1] -lt 18) {
    Fail "Node.js 版本过低（$nodeVersion）" "Vite 5 需要 Node.js 18+，请升级后重试"
}
Write-Ok $nodeVersion

$npmPath = $null
$npmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue | Select-Object -First 1
if ($npmCmd) { $npmPath = $npmCmd.Source }
if (-not $npmPath) {
    $candidate = Join-Path $env:ProgramFiles "nodejs\npm.cmd"
    if (Test-Path $candidate) { $npmPath = $candidate }
}
if (-not $npmPath) {
    Fail "没有找到 npm" "请重新安装 Node.js 并确保勾选 npm"
}

# ---------- Python ----------
Write-Step "检查 Python"
$python = $null
$pythonVersion = $null
$seen = @{}
foreach ($name in @("python", "python3", "py")) {
    $cmd = Get-Command $name -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $cmd -or -not $cmd.Source) { continue }
    $exe = $cmd.Source
    if ($seen.ContainsKey($exe)) { continue }
    $seen[$exe] = $true
    $ver = Test-PythonExe $exe
    if ($ver) {
        $python = $exe
        $pythonVersion = $ver
        break
    }
}
if (-not $python) {
    Fail "没有找到 Python 3.9+" "请安装 https://www.python.org/downloads/"
}
Write-Ok "$pythonVersion（$python）"

# ---------- 依赖 ----------
Write-Step "检查后端依赖"
& $python -c "import fastapi, uvicorn, sqlalchemy, reportlab, multipart" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Ok "缺少依赖，正在安装，大约 1–3 分钟…"
    & $python -m pip install --disable-pip-version-check -r (Join-Path $root "backend\requirements.txt")
    if ($LASTEXITCODE -ne 0) {
        & $python -m pip install --disable-pip-version-check -i https://pypi.tuna.tsinghua.edu.cn/simple -r (Join-Path $root "backend\requirements.txt")
    }
    & $python -c "import fastapi, uvicorn, sqlalchemy, reportlab, multipart" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Fail "后端依赖安装失败" "请检查网络后重试"
    }
}
Write-Ok "依赖就绪"

# ---------- 端口 ----------
if ($Port -le 0) {
    if ($env:JIADENG_PORT) { $Port = [int]$env:JIADENG_PORT } else { $Port = 8000 }
}
Write-Step "检查端口 $Port"
$owner = Get-PortOwner $Port
if ($owner -ne 0) {
    if (Test-JiaDeng $Port) {
        Write-Ok "检测到已有家灯服务（PID $owner），正在重启…"
        try {
            Stop-Process -Id $owner -Force -ErrorAction Stop
        } catch {
            Write-Warn "无法停止旧服务：$($_.Exception.Message)"
        }
        if (-not (Wait-PortFree $Port)) {
            Fail "端口 $Port 没有释放" "请执行 停止服务.bat，或换一个端口：开发模式.ps1 -Port 8010"
        }
    } else {
        Fail "端口 $Port 被其他程序占用" "请先关闭占用程序，或换一个端口：开发模式.ps1 -Port 8010"
    }
}
Write-Ok "使用端口 $Port"

# vite 代理通过 JIADENG_PORT 读取后端端口
$env:JIADENG_PORT = "$Port"

# ---------- 启动后端 ----------
Write-Step "启动后端"
$backendDir = Join-Path $root "backend"
$logOut = Join-Path $backendDir "data\dev-backend.log"
$logErr = Join-Path $backendDir "data\dev-backend.err.log"
$backend = Start-Process -FilePath $python `
    -ArgumentList @("main.py", "--no-browser", "--port", "$Port") `
    -WorkingDirectory $backendDir `
    -WindowStyle Hidden `
    -RedirectStandardOutput $logOut `
    -RedirectStandardError $logErr `
    -PassThru

$healthy = $false
for ($i = 0; $i -lt 60; $i++) {
    $backend.Refresh()
    if ($backend.HasExited) { break }
    if (Test-JiaDeng $Port) {
        $healthy = $true
        break
    }
    Start-Sleep -Milliseconds 500
}

if (-not $healthy) {
    if (-not $backend.HasExited) {
        Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "`n  后端日志：" -ForegroundColor DarkGray
    if (Test-Path $logErr) { Get-Content $logErr -Tail 20 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray } }
    if (Test-Path $logOut) { Get-Content $logOut -Tail 20 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray } }
    Fail "后端没有在 30 秒内启动" "日志：$logOut"
}
Write-Ok "后端已启动：http://127.0.0.1:$Port"
Write-Ok "后端日志：$logOut"

# ---------- 启动前端 ----------
Push-Location (Join-Path $root "frontend")
$viteExit = 0
try {
    if (-not (Test-Path "node_modules")) {
        Write-Ok "首次运行，正在安装前端依赖，大约 1–3 分钟…"
        & $npmPath install --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { throw "npm install 失败" }
    }
    Write-Host ""
    Write-Host "[家灯] 前端开发服务器：http://127.0.0.1:5173" -ForegroundColor Green
    Write-Host "      按 Ctrl+C 同时停止前后端" -ForegroundColor DarkGray
    Write-Host ""
    & $npmPath run dev:h5
    $viteExit = $LASTEXITCODE
} catch {
    Write-Host "`n  x $($_.Exception.Message)" -ForegroundColor Red
    $viteExit = 1
} finally {
    Pop-Location
    $backend.Refresh()
    if (-not $backend.HasExited) {
        Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
    }
}

if ($viteExit -ne 0) {
    exit 1
}
