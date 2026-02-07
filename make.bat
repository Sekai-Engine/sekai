@echo off
setlocal

echo 检查构建依赖...

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未找到 npm,请先安装Node.js
    exit /b 1
)

where cargo >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未找到Cargo,请先安装 Rust。
    exit /b 1
)

where curl >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未找到 curl。
    exit /b 1
)

echo ✅ 所有依赖已就绪。

npm install
npm run tauri build
copy /y "src-tauri\target\release\sekai.exe" ".\" >nul 2>&1

echo 构建结束
