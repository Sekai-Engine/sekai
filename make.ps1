Write-Host "检查构建依赖..."

$npmCheck = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmCheck) {
    Write-Host "❌ 未找到 npm,请先安装Node.js"
    exit 1
}

$cargoCheck = Get-Command cargo -ErrorAction SilentlyContinue
if (-not $cargoCheck) {
    Write-Host "❌ 未找到Cargo,请先安装 Rust。"
    exit 1
}

$wgetCheck = Get-Command wget -ErrorAction SilentlyContinue
if (-not $wgetCheck) {
    Write-Host "❌ 未找到 wget。"
    exit 1
}

Write-Host "✅ 所有依赖已就绪。"

npm install
npm run tauri build
Copy-Item "src-tauri\target\release\sekai.exe" -Destination ".\" -Force

Write-Host "构建结束"
