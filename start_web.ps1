$ErrorActionPreference = "Continue"
$workDir = $PSScriptRoot
Set-Location -Path $workDir

# Thư mục log
$logDir = Join-Path $workDir "logs"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}
$logFile = Join-Path $logDir "website.log"
$errFile = Join-Path $logDir "website-error.log"

function Log-Message([string]$msg) {
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
    Write-Output $line
    Add-Content -Path $logFile -Value $line -Encoding utf8 -ErrorAction SilentlyContinue
}

Log-Message "=== NRO WEB SERVICE DA KHOI TAO ==="
Log-Message "Dang kiem tra trang thai CSDL MySQL..."

# Đợi MySQL chạy và chấp nhận kết nối trên port 3306 (tối đa 120 giây)
$timeout = 120
$startTime = [DateTime]::UtcNow
$mysqlReady = $false

while (([DateTime]::UtcNow - $startTime).TotalSeconds -lt $timeout) {
    $svc = Get-Service -Name "MySQL" -ErrorAction SilentlyContinue
    if ($svc -and $svc.Status -ne "Running") {
        try {
            Start-Service -Name "MySQL" -ErrorAction SilentlyContinue
            Log-Message "Dang bat service MySQL..."
        } catch {}
    }
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $connect = $tcp.BeginConnect("127.0.0.1", 3306, $null, $null)
        $wait = $connect.AsyncWaitHandle.WaitOne(2000, $false)
        if ($wait -and $tcp.Connected) {
            $tcp.EndConnect($connect)
            $tcp.Close()
            $mysqlReady = $true
            break
        }
        $tcp.Close()
    } catch {}
    Start-Sleep -Seconds 2
}

if (-not $mysqlReady) {
    Log-Message "[LOI] MySQL khong san sang sau $timeout giay. Khong the khoi dong Website!"
    exit 1
}

Log-Message "MySQL da san sang (Port 3306 UP). Bat dau khoi chay Website Node.js tren port 80..."

# Dọn dẹp tiến trình cũ nếu còn chiếm port 80
$oldConns = Get-NetTCPConnection -LocalPort 80 -ErrorAction SilentlyContinue
foreach ($c in $oldConns) {
    try {
        Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
        Log-Message "Da dung tien trinh cu PID $($c.OwningProcess) dang chiem port 80."
    } catch {}
}

# Đường dẫn Node
$nodeExe = "node"
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCmd) {
    $nodeExe = $nodeCmd.Source
} elseif (Test-Path "C:\Program Files\nodejs\node.exe") {
    $nodeExe = "C:\Program Files\nodejs\node.exe"
}

while ($true) {
    Log-Message "Khoi dong Web server ($nodeExe index.js)..."
    
    $p = Start-Process -FilePath $nodeExe `
        -ArgumentList "index.js" `
        -WorkingDirectory $workDir `
        -PassThru `
        -RedirectStandardOutput $logFile `
        -RedirectStandardError $errFile
        
    $p.WaitForExit()
    Log-Message "[CANH BAO] Website da dung (Exit code: $($p.ExitCode)). Khoi dong lai sau 3 giay..."
    Start-Sleep -Seconds 3
}
