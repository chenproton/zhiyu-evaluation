#!/bin/bash
#
# deploy.sh - Next.js Standalone 本地构建发布脚本
#
set -euo pipefail

# ==================== 配置区 ====================
SITE_NAME="evaluation"
PORT=3005

# ==================== 自动推导 ====================
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
STANDALONE_DIR="$SCRIPT_DIR/.next/standalone"
STATIC_DIR="$SCRIPT_DIR/.next/static"
PUBLIC_DIR="$SCRIPT_DIR/public"
SERVER_DIR="$SCRIPT_DIR/.next/server"

# ==================== 主入口 ====================

echo ""
echo "🚀 启动本地 standalone 构建发布: [$SITE_NAME] -> port $PORT"
echo ""

cd "$SCRIPT_DIR"

# ── 1. 清理旧构建 ──────────────────────────────────────────────────────
echo "[1/4] 清理旧构建..."
rm -rf "$STANDALONE_DIR" "$STATIC_DIR" "$SERVER_DIR"

# ── 2. 安装依赖 ───────────────────────────────────────────────────────
if [ ! -d "node_modules" ] || [ "${FORCE_INSTALL:-0}" = "1" ]; then
  echo "[2/4] 安装依赖..."
  pnpm install --prefer-offline --no-frozen-lockfile
else
  echo "[2/4] node_modules 已存在，跳过依赖安装（设置 FORCE_INSTALL=1 可强制重新安装）"
fi

# ── 3. 构建 ───────────────────────────────────────────────────────────
echo "[3/4] 本地构建中（使用 webpack 以绕过 Turbopack standalone 问题）..."
pnpm exec next build --webpack

# ── 4. 组装 standalone 产物 ───────────────────────────────────────────
echo "[4/4] 组装 standalone 产物..."

# 修复 Next.js 16 + Turbopack standalone 输出不完整的问题
# 将完整 server 目录复制到 standalone
if [ -d "$SERVER_DIR" ]; then
  mkdir -p "$STANDALONE_DIR/.next/server"
  rsync -a --delete --exclude="*.map" "$SERVER_DIR/" "$STANDALONE_DIR/.next/server/"
fi

if [ -d "$STATIC_DIR" ]; then
  mkdir -p "$STANDALONE_DIR/.next/static"
  rsync -a --delete --exclude="*.map" "$STATIC_DIR/" "$STANDALONE_DIR/.next/static/"
fi

if [ -d "$PUBLIC_DIR" ]; then
  mkdir -p "$STANDALONE_DIR/public"
  rsync -a --delete --exclude="*.map" "$PUBLIC_DIR/" "$STANDALONE_DIR/public/"
fi

# ── 5. PM2 启动 ───────────────────────────────────────────────────────
echo ""
echo "[5/4] 本地 PM2 启动服务..."

# 先清理可能存在的残留 PM2 进程和端口占用
pm2 delete "$SITE_NAME" &>/dev/null || true
PM2_PID=$(lsof -t -i:"$PORT" 2>/dev/null || true)
if [ -n "$PM2_PID" ]; then
  echo "   发现端口 $PORT 被占用，正在清理..."
  kill -9 "$PM2_PID" 2>/dev/null || true
fi
sleep 1

# 使用 ecosystem.config.js 启动，配置集中管理
pm2 start ecosystem.config.js --env production

pm2 save > /dev/null

echo ""
echo "✨ [$SITE_NAME] 本地发布完成！"
echo "   访问地址: http://localhost:$PORT"
echo ""
