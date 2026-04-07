#!/bin/bash

set -e  # 遇到错误立即退出

echo "检查构建依赖..."

if ! command -v npm &> /dev/null; then
    echo "❌ 未找到 npm,请先安装Node.js"
    exit 1
fi

# 检查 Rust 和 Cargo
if ! command -v cargo &> /dev/null; then
	echo "❌ 未找到Cargo,请先安装 Rust。"
    exit 1
fi

echo "✅ 所有依赖已就绪。"

npm install
npm run tauri build || true
mkdir -p bin
mv ./src-tauri/target/release/sekai ./bin/

echo "构建结束"

