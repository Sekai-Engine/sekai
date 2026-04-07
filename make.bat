@echo off
chcp 65001 >nul 2>&1  :: 设置 UTF-8 编码
echo 检查构建依赖...

where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 未找到 npm，请先安装 Node.js
    exit /b 1
)

where cargo >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 未找到 Cargo，请先安装 Rust
    exit /b 1
)
echo ✅ 所有依赖已就绪。

call npm install

call npm run tauri build
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️ Tauri 构建失败，但继续处理...
)

if not exist "bin" mkdir bin
move /Y "src-tauri\target\release\sekai.exe" "bin\"

echo 构建结束
pause
