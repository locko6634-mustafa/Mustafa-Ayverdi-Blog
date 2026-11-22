# Blog yerel sunucusu (Windows / PowerShell 5.1). Kullanim:
#   powershell -ExecutionPolicy Bypass -File .\sunucu_baslat.ps1 [-Port 8000] [-NoBrowser]
param(
    [int]$Port = 0,
    [switch]$NoBrowser
)
$ErrorActionPreference = 'Stop'
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$bindHost = '127.0.0.1'

# Port: -Port, yoksa PORT ortam degiskeni, yoksa 8000
if ($Port -eq 0) {
    $envPort = $env:PORT
    if ($envPort) {
        if ($envPort -notmatch '^[0-9]{1,5}$') {
            [Console]::Error.WriteLine('Hata: PORT gecersiz. 1-65535 arasinda bir sayi olmali.')
            exit 1
        }
        $Port = [int]$envPort
    } else {
        $Port = 8000
    }
}
if ($Port -lt 1 -or $Port -gt 65535) {
    [Console]::Error.WriteLine('Hata: Port gecersiz. 1-65535 arasinda bir sayi olmali.')
    exit 1
}

# Python: once py launcher, sonra python, sonra python3
$pyArgs = @()
$pyCmd = Get-Command py -ErrorAction SilentlyContinue
if ($pyCmd) {
    $pyArgs = @('-3')
} else {
    $pyCmd = Get-Command python -ErrorAction SilentlyContinue
    if (-not $pyCmd) { $pyCmd = Get-Command python3 -ErrorAction SilentlyContinue }
}
if (-not $pyCmd) {
    [Console]::Error.WriteLine('Hata: Python bulunamadi. Python kurulumunu ve PATH ayarini kontrol edin.')
    exit 1
}
$python = $pyCmd.Source

function Test-PortListening {
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $ar = $client.BeginConnect($bindHost, $Port, $null, $null)
        if ($ar.AsyncWaitHandle.WaitOne(500, $false) -and $client.Connected) {
            $client.EndConnect($ar)
            return $true
        }
        return $false
    } catch {
        return $false
    } finally {
        $client.Close()
    }
}

# Porttaki sunucu bu blogu mu servis ediyor? (index.html canonical isareti)
$siteMarker = '<link rel="canonical" href="https://mustafaayverdi.com/">'
function Test-ServesThisBlog {
    try {
        $r = Invoke-WebRequest -Uri "http://${bindHost}:${Port}/index.html" -UseBasicParsing -TimeoutSec 2
        return ([string]$r.Content).Contains($siteMarker)
    } catch {
        return $false
    }
}

if (Test-PortListening) {
    if (Test-ServesThisBlog) {
        Write-Host "Blog sunucusu zaten calisiyor: http://${bindHost}:${Port}/" -ForegroundColor Yellow
        exit 0
    }
    [Console]::Error.WriteLine("Hata: Port $Port baska bir uygulama tarafindan kullaniliyor (bu blog yanit vermiyor). Farkli port icin: -Port 8080")
    exit 1
}

Write-Host 'Yerel sunucu baslatiliyor...' -ForegroundColor Cyan
$argList = $pyArgs + @("`"$projectDir\yerel_sunucu.py`"", "$Port", $bindHost, "`"$projectDir`"")
$proc = Start-Process -FilePath $python -ArgumentList $argList -WorkingDirectory $projectDir -WindowStyle Hidden -PassThru

# Portun dinlendigini ve surecin yasadigini dogrula (en fazla ~5 sn)
$ready = $false
for ($i = 0; $i -lt 25; $i++) {
    if ($proc.HasExited) { break }
    if (Test-PortListening) { $ready = $true; break }
    Start-Sleep -Milliseconds 200
}
if ($ready) {
    Start-Sleep -Milliseconds 500
    if ($proc.HasExited) { $ready = $false }
}
if (-not $ready) {
    if (-not $proc.HasExited) { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue }
    [Console]::Error.WriteLine("Hata: Sunucu baslatilamadi (port $Port baska bir surec tarafindan alinmis olabilir).")
    exit 1
}

Write-Host "Sunucu baslatildi: http://${bindHost}:${Port}/ (PID: $($proc.Id))" -ForegroundColor Green
Write-Host "Proje koku: $projectDir (yalniz yayinlanan dosyalar servis edilir)" -ForegroundColor Green
Write-Host "Durdurmak icin: Stop-Process -Id $($proc.Id)" -ForegroundColor Cyan

if (-not $NoBrowser -and $env:NO_OPEN -ne '1') {
    Start-Process "http://${bindHost}:${Port}/index.html"
}
