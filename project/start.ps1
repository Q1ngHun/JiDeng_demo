# =====================================================================
#  家灯 JiaDeng · 一键启动
#  流程：检查 Python → 安装依赖 → 检查/构建 H5 → 处理端口 → 启动后端
#
#  用法：
#    powershell -ExecutionPolicy Bypass -File start.ps1
#    powershell -ExecutionPolicy Bypass -File start.ps1 -Port 8010
#    powershell -ExecutionPolicy Bypass -File start.ps1 -CheckOnly
#    powershell -ExecutionPolicy Bypass -File start.ps1 -NoBrowser
# =====================================================================
param(
    [int]$Port = 0,
    [switch]$CheckOnly,
    [switch]$NoBrowser
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
Write-Host "  家灯 JiaDeng · 家庭照护协作 App" -ForegroundColor White
Write-Host "  给守护家庭的人" -ForegroundColor DarkGray
Write-Host ""

# ---------- 1. Python ----------
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
    Fail "没有找到 Python 3.9+" "请安装 https://www.python.org/downloads/，安装时勾选 Add Python to PATH"
}
Write-Ok "$pythonVersion（$python）"

# ---------- 2. 依赖 ----------
Write-Step "检查后端依赖（fastapi / uvicorn / sqlalchemy / reportlab）"
& $python -c "import fastapi, uvicorn, sqlalchemy, reportlab, multipart" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Ok "缺少依赖，正在安装，大约 1–3 分钟…"
    & $python -m pip install --disable-pip-version-check -r (Join-Path $root "backend\requirements.txt")
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "官方源较慢，改用清华镜像重试…"
        & $python -m pip install --disable-pip-version-check -i https://pypi.tuna.tsinghua.edu.cn/simple -r (Join-Path $root "backend\requirements.txt")
    }
    & $python -c "import fastapi, uvicorn, sqlalchemy, reportlab, multipart" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Fail "后端依赖安装失败" "请检查网络后重试，或手动执行：$python -m pip install -r backend\requirements.txt"
    }
}
Write-Ok "依赖就绪"

# ---------- 3. 前端构建 ----------
Write-Step "检查前端构建产物"
$dist = Join-Path $root "frontend\dist\build\h5\index.html"
if (Test-Path $dist) {
    Write-Ok "已找到 H5 构建产物"
    if ((Test-Path (Join-Path $root "frontend\package.json")) -and -not (Test-Path (Join-Path $root "frontend\node_modules"))) {
        Write-Warn "前端依赖未安装：HBuilderX 运行或重新构建前请执行 cd frontend && npm install"
    }
} else {
    $npmPath = $null
    $npmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($npmCmd) { $npmPath = $npmCmd.Source }
    if (-not $npmPath) {
        # Node.js 已安装但当前进程 PATH 尚未刷新时，直接从默认安装目录找 npm
        $candidate = Join-Path $env:ProgramFiles "nodejs\npm.cmd"
        if (Test-Path $candidate) {
            $npmPath = $candidate
            $env:Path = (Split-Path $candidate) + ";" + $env:Path
        }
    }
    if (-not $npmPath) {
        Write-Warn "前端还没有构建，且本机没有 Node.js；本次只启动后端接口与设计原型"
    } else {
        Write-Ok "未找到构建产物，正在构建（首次约 1–3 分钟）…"
        Push-Location (Join-Path $root "frontend")
        try {
            if (-not (Test-Path "node_modules")) {
                & $npmPath install --no-audit --no-fund
                if ($LASTEXITCODE -ne 0) { throw "npm install 失败" }
            }
            & $npmPath run build:h5
            if ($LASTEXITCODE -ne 0) { throw "npm run build:h5 失败" }
            Write-Ok "前端构建完成"
        } catch {
            Write-Warn "前端构建失败：$($_.Exception.Message)；本次只启动后端"
        } finally {
            Pop-Location
        }
    }
}

# ---------- 4. 端口 ----------
$preferred = 8000
if ($Port -gt 0) {
    $preferred = $Port
} elseif ($env:JIADENG_PORT) {
    $preferred = [int]$env:JIADENG_PORT
}

Write-Step "检查端口 $preferred"
$owner = Get-PortOwner $preferred

if ($CheckOnly) {
    if ($owner -eq 0) {
        Write-Ok "端口 $preferred 可用"
    } elseif (Test-JiaDeng $preferred) {
        Write-Ok "端口 $preferred 已有家灯服务（启动时会自动重启）"
    } else {
        Write-Warn "端口 $preferred 被其他程序占用（启动时会自动改用下一个空闲端口）"
    }
    Write-Ok "检查完成（-CheckOnly 不启动服务）"
    exit 0
}

if ($owner -ne 0) {
    if (Test-JiaDeng $preferred) {
        Write-Ok "检测到已有家灯服务（PID $owner），正在重启以加载最新代码…"
        try {
            Stop-Process -Id $owner -Force -ErrorAction Stop
        } catch {
            Write-Warn "无法停止旧服务：$($_.Exception.Message)"
        }
        if (-not (Wait-PortFree $preferred)) {
            Write-Warn "旧服务没有释放端口，将改用其他端口"
        }
    } else {
        Write-Warn "端口 $preferred 被其他程序占用"
    }
}

$listenPort = $preferred
if ((Get-PortOwner $listenPort) -ne 0) {
    if ($Port -gt 0) {
        Fail "端口 $Port 已被占用" "换一个端口：start.ps1 -Port 8010"
    }
    $listenPort = 0
    for ($p = $preferred + 1; $p -le $preferred + 10; $p++) {
        if ((Get-PortOwner $p) -eq 0) {
            $listenPort = $p
            break
        }
    }
    if ($listenPort -eq 0) {
        Fail "$preferred-$($preferred + 10) 端口都被占用" "请先关闭占用端口的程序，或执行 停止服务.bat"
    }
    Write-Warn "改用空闲端口 $listenPort"
}
Write-Ok "使用端口 $listenPort"

# ---------- 5. 后端代码预检 ----------
Write-Step "检查后端代码"
Push-Location (Join-Path $root "backend")
$oldEap = $ErrorActionPreference
$ErrorActionPreference = "Continue"
& $python -c "import main"
$importCode = $LASTEXITCODE
$ErrorActionPreference = $oldEap
Pop-Location
if ($importCode -ne 0) {
    Fail "后端代码无法导入" "请查看上方报错；常见原因是依赖未装好、数据库被占用或配置有误"
}
Write-Ok "后端代码检查通过"

# ---------- 6. 启动 ----------
Write-Step "启动服务"
$url = "http://127.0.0.1:$listenPort"
Write-Host "      地址：$url" -ForegroundColor Cyan
Write-Host "      账号：13800000001 / 123456（王芳 · 主理子女）" -ForegroundColor Cyan
Write-Host "      爸爸：13800000003 / 123456（关怀版）" -ForegroundColor Cyan
Write-Host "      按 Ctrl+C 停止服务" -ForegroundColor DarkGray

Push-Location (Join-Path $root "backend")
$exitCode = 0
try {
    if ($NoBrowser) {
        & $python main.py --port $listenPort --no-browser
    } else {
        & $python main.py --port $listenPort
    }
    $exitCode = $LASTEXITCODE
} catch {
    # Ctrl+C / 关闭窗口时 PowerShell 会中断管道，按正常停止处理
    $exitCode = 0
} finally {
    Pop-Location
}

if ($exitCode -ne 0) {
    Write-Host "`n  x 服务异常退出（退出码 $exitCode）" -ForegroundColor Red
    Write-Host "    常见原因：端口被占用、依赖缺失、数据库被锁定。" -ForegroundColor DarkGray
    Write-Host "    可先运行：powershell -ExecutionPolicy Bypass -File start.ps1 -CheckOnly" -ForegroundColor DarkGray
    Write-Host ""
    exit 1
}
