#!/bin/bash
#
# deploydemo.sh - 演示环境一键部署脚本（standalone 复用版）
# 复用本地 deploy.sh 构建好的 .next/standalone 产物，复制到 /dev/shm 后替换 IP，
# 再上传到远程演示服务器。全程不重新构建、不停止本地 PM2、不破坏本地 .next。
#
set -euo pipefail

# ==================== 演示环境配置（可通过环境变量覆盖） ====================
DEMO_HOST="${DEMO_HOST:-demo2.zhiyu.com.cn}"
DEMO_USER="${DEMO_USER:-root}"
DEMO_PASS="${DEMO_PASS:-lEL9cHcBQMjCEqp6}"
OLD_IP="${OLD_IP:-111.170.170.202}"

# ==================== 项目配置（每个项目只需改这里） ====================
SITE_NAME="evaluation"
PORT=13105
EXT_PORT=3005

# ==================== 自动推导 ====================
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REMOTE_BASE="/var/www"
REMOTE_DIR="$REMOTE_BASE/$SITE_NAME"
STANDALONE_DIR="$SCRIPT_DIR/.next/standalone"
DEMO_PKG_DIR="/dev/shm/${SITE_NAME}-demo-pkg"
DATA_DIR="$SCRIPT_DIR/data"
SSH_PORT="${SSH_PORT:-22}"

# 安全提示
if [ -z "${DEMO_PASS:-}" ]; then
  echo "❌ 错误：未设置 DEMO_PASS 环境变量且脚本默认密码为空"
  exit 1
fi

# 检查 sshpass
if ! command -v sshpass &>/dev/null; then
  echo "❌ 未检测到 sshpass，请先安装："
  echo "   Debian/Ubuntu: sudo apt-get install -y sshpass"
  echo "   macOS:         brew install hudochenkov/sshpass/sshpass"
  exit 1
fi

# 通过环境变量传密码，避免出现在进程列表
export SSHPASS="$DEMO_PASS"
SSH_CMD="sshpass -e ssh"
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=15 -o ServerAliveInterval=60 -o ServerAliveCountMax=3 -p $SSH_PORT"

cd "$SCRIPT_DIR"

# ==================== 主流程 ====================
echo ""
echo "🚀 启动演示环境部署: [$SITE_NAME] -> https://$DEMO_HOST:$EXT_PORT"
echo ""

# ── 0. 确保本地 standalone 产物已存在 ─────────────────────────────────
if [ ! -f "$STANDALONE_DIR/server.js" ]; then
  echo "❌ 本地 standalone 产物不存在：$STANDALONE_DIR/server.js"
  echo "   请先运行 ./deploy.sh 完成本地构建，再执行本脚本。"
  exit 1
fi

# ── 1. 复制 standalone 产物到 /dev/shm ────────────────────────────────
echo "[1/4] 复制本地 standalone 产物到 $DEMO_PKG_DIR ..."
rm -rf "$DEMO_PKG_DIR"
mkdir -p "$DEMO_PKG_DIR"
rsync -a --delete --exclude='*.map' "$STANDALONE_DIR/" "$DEMO_PKG_DIR/"

# 同时复制 data 目录中的配置（如平台链接等），确保运行时读取到的是 demo 配置
if [ -d "$DATA_DIR" ]; then
  echo "      同步 data 目录..."
  mkdir -p "$DEMO_PKG_DIR/data"
  rsync -a --delete "$DATA_DIR/" "$DEMO_PKG_DIR/data/"
fi

# ── 2. 替换源码 IP 为演示域名 ─────────────────────────────────────────
echo ""
echo "[2/4] 替换产物中的旧 IP ($OLD_IP -> $DEMO_HOST) ..."
OLD_PATTERN=$(sed 's/\./\\./g' <<< "$OLD_IP")
REPLACED_COUNT=0

mapfile -t files < <(grep -rlF "$OLD_IP" "$DEMO_PKG_DIR" 2>/dev/null || true)
for f in "${files[@]}"; do
  if [ -f "$f" ]; then
    sed -i "s/$OLD_PATTERN/$DEMO_HOST/g" "$f"
    REPLACED_COUNT=$((REPLACED_COUNT + 1))
  fi
done
echo "      已替换 $REPLACED_COUNT 个文件"

RESIDUAL=$(grep -rlF "$OLD_IP" "$DEMO_PKG_DIR" 2>/dev/null | wc -l || true)
if [ "${RESIDUAL:-0}" -ne 0 ]; then
  echo "⚠️  警告：仍有 $RESIDUAL 个文件包含旧 IP"
fi

# ── 3. 上传并部署到演示服务器 ─────────────────────────────────────────
echo ""
echo "[3/4] 上传并部署到演示服务器 $DEMO_HOST ..."

$SSH_CMD $SSH_OPTS "$DEMO_USER@$DEMO_HOST" \
  "rm -rf $REMOTE_DIR && mkdir -p $REMOTE_DIR && chown $DEMO_USER:$DEMO_USER $REMOTE_DIR"

rsync -az --delete \
  -e "$SSH_CMD $SSH_OPTS" \
  --timeout=300 \
  --exclude='*.map' \
  --exclude='*.log' \
  --exclude='logs/' \
  "$DEMO_PKG_DIR/" \
  "$DEMO_USER@$DEMO_HOST:$REMOTE_DIR/"

# ── 4. 远程启动服务 ───────────────────────────────────────────────────
echo ""
echo "[4/4] 远程启动服务 ..."

$SSH_CMD $SSH_OPTS "$DEMO_USER@$DEMO_HOST" \
  "export SITE_NAME='$SITE_NAME'; export PORT='$PORT'; export REMOTE_DIR='$REMOTE_DIR'; bash -s" << 'REMOTE_EOF'
  set -e
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

  NODE_BIN=$(command -v node || echo "/usr/local/bin/node")
  if [ ! -x "$NODE_BIN" ]; then
    echo "❌ 远程服务器未找到 node，请先安装 Node.js"
    exit 1
  fi

  if ! command -v pm2 &>/dev/null; then
    echo ">>> 远程安装 pm2..."
    "$NODE_BIN" "$(command -v npm || echo '/usr/local/bin/npm')" install -g pm2
  fi

  pm2 delete "$SITE_NAME" &>/dev/null || true

  cd "$REMOTE_DIR"

  PORT="$PORT" HOSTNAME="0.0.0.0" pm2 start server.js \
    --name "$SITE_NAME" \
    --interpreter "$NODE_BIN" \
    --restart-delay 3000

  pm2 save > /dev/null

  nginx -t 2>/dev/null && systemctl reload nginx 2>/dev/null || true
REMOTE_EOF

$SSH_CMD $SSH_OPTS "$DEMO_USER@$DEMO_HOST" \
  "pm2 restart '$SITE_NAME' --update-env" >/dev/null 2>&1 || true

# ── 5. 清理临时产物 ───────────────────────────────────────────────────
rm -rf "$DEMO_PKG_DIR"

echo ""
echo "✨ [$SITE_NAME] 演示环境部署完成！"
echo "   访问地址: https://$DEMO_HOST:$EXT_PORT"
echo ""
