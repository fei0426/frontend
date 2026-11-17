<#
  校园通 StudyPal-AI —— Nginx 一键部署脚本（Windows / PowerShell 5+）

  作用：
    1. 检查前端打包产物 dist，没有就自动 npm run build
    2. 把本目录的 nginx.conf 写入 nginx 的 conf 目录，并自动替换静态根目录
    3. 校验配置并启动（已在运行则平滑 reload）

  用法（在仓库根目录执行）：
    powershell -ExecutionPolicy Bypass -File .\deploy\setup-nginx.ps1 -NginxHome D:\nginx

  -NginxHome   nginx 解压目录，默认 D:\nginx
  -SkipBuild   跳过自动构建（dist 已存在且确定是最新时可加）
#>
param(
    [string]$NginxHome = "D:\nginx",
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path $PSScriptRoot -Parent
$distDir  = Join-Path $repoRoot "dist"
$nginxExe = Join-Path $NginxHome "nginx.exe"

if (-not (Test-Path $nginxExe)) {
    throw "找不到 $nginxExe。请先解压 nginx，并用 -NginxHome 指定实际目录。"
}

# ---------- 1. 前端打包 ----------
if (-not (Test-Path (Join-Path $distDir "index.html"))) {
    if ($SkipBuild) { throw "dist 不存在，请先执行 npm run build 或去掉 -SkipBuild。" }
    Write-Host "[1/3] 未找到 dist，开始构建前端 ..."
    Push-Location $repoRoot
    npm run build
    if ($LASTEXITCODE -ne 0) { Pop-Location; throw "npm run build 失败" }
    Pop-Location
} else {
    Write-Host "[1/3] dist 已存在，跳过构建"
}

# ---------- 2. 生成配置 ----------
$template = Get-Content (Join-Path $PSScriptRoot "nginx.conf") -Raw -Encoding UTF8
$distForNginx = $distDir.Replace("\", "/")
$conf = [regex]::Replace($template, 'root\s+\S*dist\s*;', "root   $distForNginx;")

$destConf = Join-Path $NginxHome "conf\nginx.conf"
if (Test-Path $destConf) { Copy-Item $destConf "$destConf.bak" -Force }
[IO.File]::WriteAllText($destConf, $conf, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "[2/3] 配置已写入 $destConf"

# ---------- 3. 校验并启动 / 重载 ----------
Push-Location $NginxHome
& $nginxExe -t
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "nginx 配置校验失败，请查看上方错误" }

$running = @(Get-Process nginx -ErrorAction SilentlyContinue)
if ($running.Count -gt 0) {
    & $nginxExe -s reload
    Write-Host "[3/3] 检测到 nginx 正在运行，已平滑重载配置"
} else {
    Start-Process -FilePath $nginxExe -WorkingDirectory $NginxHome
    Start-Sleep -Seconds 2
    Write-Host "[3/3] nginx 已启动"
}
Pop-Location

Write-Host ""
Write-Host "验证地址："
Write-Host "  站点（静态）   http://localhost/"
Write-Host "  接口（反向）   http://localhost/api/v1/health"
Write-Host "  静态演示       http://localhost/static-demo.txt"
Write-Host "  正向代理       curl.exe -x http://127.0.0.1:8888 http://www.baidu.com/"
Write-Host ""
Write-Host "停止 nginx：cd $NginxHome; .\nginx.exe -s stop"
Write-Host "提示：访问 /api 前请先启动后端（默认 http://127.0.0.1:10086）"
