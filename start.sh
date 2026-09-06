#!/bin/bash
# 旅游攻略编译器 - 一键启动脚本

echo ""
echo "=========================================="
echo "   旅游攻略编译器 启动中..."
echo "=========================================="
echo ""

# 配置 Node.js 路径
export PATH="/Users/karliesun/.local/bin/bin:$PATH"

# 切换到项目目录
cd "$(dirname "$0")"

# 检查 node 是否可用
if ! command -v node &> /dev/null; then
  echo "错误: 找不到 Node.js"
  echo "路径: /Users/karliesun/.local/bin/bin/node"
  read -p "按回车键退出..."
  exit 1
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
  echo "[1/2] 首次运行，正在安装依赖 (约 16 秒)..."
  npm install
  if [ $? -ne 0 ]; then
    echo "依赖安装失败"
    read -p "按回车键退出..."
    exit 1
  fi
else
  echo "[1/2] 依赖已安装，跳过"
fi

echo "[2/2] 启动服务..."
echo ""

# 启动服务
node server/index.js
