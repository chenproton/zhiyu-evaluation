#!/bin/bash
#
# deploydemo.sh - 演示环境一键部署脚本
# 将本项目构建后部署到 demo2.zhiyu.com.cn，并把跳转链接中的 IP 替换为演示服务器 IP
#
set -euo pipefail

# ==================== 演示环境配置（可通过环境变量覆盖） ====================
DEMO_HOST="${DEMO_HOST:-demo2.zhiyu.com.cn}"
DEMO_USER="${DEMO_USER:-root}"
DEMO_PASS="${DEMO_PASS:-lEL9cHcBQMjCEqp6}"
OLD_IP="${OLD_IP:-111.170.170.202}"

# ==================== 项目配置（每个项目只需改这里） ====================
SITE_NAME="evaluation"
PORT=3005

# ==================== 自动推导 ====================
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REMOTE_BASE="/var/www"
REMOTE_DIR="$REMOTE_BASE/$SITE_NAME"
STANDALONE_DIR="$SCRIPT_DIR/.next/standalone"
STATIC_DIR="$SCRIPT_DIR/.next/static"
PUBLIC_DIR="$SCRIPT_DIR/public"
SERVER_DIR="$SCRIPT_DIR/.next/server"
SSH_PORT="${SSH_PORT:-22}"

# 本地构建产物备份目录（放在 /tmp 下，避免污染源码）
LOCAL_BUILD_BACKUP_DIR="/tmp/${SITE_NAME}-local-build-backup"

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
SCP_CMD="sshpass -e scp"
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=15 -o ServerAliveInterval=60 -o ServerAliveCountMax=3 -p $SSH_PORT"

cd "$SCRIPT_DIR"

# ==================== IP 替换与还原 ====================
backup_files=()

replace_ip() {
  local old="$1" new="$2"
  local files
  local old_pattern
  old_pattern=$(sed 's/\./\\./g' <<< "$old")

  mapfile -t files < <(grep -rlF \
    --exclude-dir=.git \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    --exclude-dir=dist \
    --exclude='*.demo-bak' \
    --exclude='deploydemo.sh' \
    --exclude='deploy.sh' \
    --exclude='deploycom.sh' \
    --exclude='deploy.ps1' \
    --exclude='*.tar.gz' \
    "$old" . 2>/dev/null || true)

  for f in "${files[@]}"; do
    if [ -f "$f" ]; then
      cp "$f" "$f.demo-bak"
      backup_files+=("$f")
      sed -i "s/$old_pattern/$new/g" "$f"
      echo "  已替换: $f"
    fi
  done
}

restore_ip() {
  if [ ${#backup_files[@]} -eq 0 ]; then
    return 0
  fi
  echo ""
  echo ">>> 还原源码中的 IP 配置..."
  for f in "${backup_files[@]}"; do
    mv "$f.demo-bak" "$f"
    echo "  已还原: $f"
  done
}

backup_local_build() {
  if [ -d "$SCRIPT_DIR/.next" ]; then
    echo ">>> 备份本地构建产物到 $LOCAL_BUILD_BACKUP_DIR ..."
    rm -rf "$LOCAL_BUILD_BACKUP_DIR"
    cp -a "$SCRIPT_DIR/.next" "$LOCAL_BUILD_BACKUP_DIR"
  fi
}

restore_local_build() {
  if [ -n "${LOCAL_BUILD_BACKUP_DIR:-}" ] && [ -d "$LOCAL_BUILD_BACKUP_DIR" ]; then
    echo ""
    echo ">>> 还原本地构建产物..."
    rm -rf "$SCRIPT_DIR/.next"
    cp -a "$LOCAL_BUILD_BACKUP_DIR" "$SCRIPT_DIR/.next"
    rm -rf "$LOCAL_BUILD_BACKUP_DIR"
    # 重启本地 PM2 服务
    if command -v pm2 &>/dev/null; then
      pm2 restart "$SITE_NAME" --update-env >/dev/null 2>&1 || true
    fi
  fi
}

# 脚本退出时还原源码 IP 和本地构建产物
trap 'restore_ip; restore_local_build' EXIT

# 清理上次残留的备份文件
find . -maxdepth 3 -name '*.demo-bak' -type f -delete 2>/dev/null || true

# ==================== 主流程 ====================
echo ""
echo "🚀 启动演示环境部署: [$SITE_NAME] -> http://$DEMO_HOST:$PORT"
echo ""

echo "[1/5] 替换源码中的旧 IP ($OLD_IP -> $DEMO_HOST)..."
replace_ip "$OLD_IP" "$DEMO_HOST"

echo ""
echo "[1.5/5] 备份本地构建产物..."
backup_local_build

echo ""
echo "[2/5] 清理旧构建..."
rm -rf "$STANDALONE_DIR" "$STATIC_DIR" "$SERVER_DIR"

echo ""
echo "[3/5] 安装依赖并构建（使用 webpack 以绕过 Turbopack standalone 问题）..."
if [ ! -d "node_modules" ] || [ "${FORCE_INSTALL:-0}" = "1" ]; then
  pnpm install --prefer-offline --no-frozen-lockfile
else
  echo "node_modules 已存在，跳过依赖安装（设置 FORCE_INSTALL=1 可强制重新安装）"
fi
pnpm exec next build --webpack

echo ""
echo "[4/5] 组装 standalone 产物..."
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

# 同时替换 data 目录中的 IP（如平台链接配置等），确保 standalone 产物中也生效
if [ -d "$SCRIPT_DIR/data" ]; then
  echo ">>> 替换 data 目录中的 IP..."
  replace_ip "$OLD_IP" "$DEMO_HOST"
fi

echo ""
echo "[5/5] 上传并部署到演示服务器 $DEMO_HOST..."

# 远程清扫
$SSH_CMD $SSH_OPTS "$DEMO_USER@$DEMO_HOST" \
  "rm -rf $REMOTE_DIR && mkdir -p $REMOTE_DIR && chown $DEMO_USER:$DEMO_USER $REMOTE_DIR"

# 同步产物
rsync -az --delete \
  -e "$SSH_CMD $SSH_OPTS" \
  --timeout=300 \
  --exclude='*.map' \
  --exclude='*.log' \
  --exclude='logs/' \
  "$STANDALONE_DIR/" \
  "$DEMO_USER@$DEMO_HOST:$REMOTE_DIR/"

# 远程启动
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

  # 自动安装 pm2（未安装时）
  if ! command -v pm2 &>/dev/null; then
    echo ">>> 远程安装 pm2..."
    "$NODE_BIN" "$(command -v npm || echo '/usr/local/bin/npm')" install -g pm2
  fi

  # 彻底删除旧进程防止残留
  pm2 delete "$SITE_NAME" &>/dev/null || true

  cd "$REMOTE_DIR"

  # 启动新进程
  PORT="$PORT" HOSTNAME="0.0.0.0" pm2 start server.js \
    --name "$SITE_NAME" \
    --interpreter "$NODE_BIN" \
    --restart-delay 3000

  pm2 save > /dev/null
REMOTE_EOF

# 尝试远程刷新后等待服务就绪
$SSH_CMD $SSH_OPTS "$DEMO_USER@$DEMO_HOST" \
  "pm2 restart '$SITE_NAME' --update-env" >/dev/null 2>&1 || true

echo ""
echo "✨ [$SITE_NAME] 演示环境部署完成！"
echo "   访问地址: http://$DEMO_HOST:$PORT"
echo ""
