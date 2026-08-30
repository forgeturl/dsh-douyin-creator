#!/bin/bash

set -u

NODE_VERSION="24.20.0"
PNPM_VERSION="11.19.0"
DSH_PACKAGE="@deepseek-ai/dsh@0.1.0-rc.7"
PROFILE="web"
OFFICIAL_NODE_BASE="https://nodejs.org/dist/v${NODE_VERSION}"
MIRROR_NODE_BASE="https://registry.npmmirror.com/-/binary/node/v${NODE_VERSION}"
OFFICIAL_NPM_REGISTRY="https://registry.npmjs.org"
MIRROR_NPM_REGISTRY="https://registry.npmmirror.com"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
RUNTIME_ROOT="${DSH_CREATOR_RUNTIME_ROOT:-$HOME/Library/Application Support/dsh-douyin-creator}"
CACHE_ROOT="$RUNTIME_ROOT/cache"
NODE_ROOT="$RUNTIME_ROOT/node-v${NODE_VERSION}"
PNPM_ROOT="$RUNTIME_ROOT/pnpm-v${PNPM_VERSION}"
LOG_FILE="$RUNTIME_ROOT/install.log"

mkdir -p "$CACHE_ROOT"
touch "$LOG_FILE"
printf '\n[%s] installer started\n' "$(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"

pause_before_exit() {
  if [ "${DSH_NONINTERACTIVE:-0}" = "1" ]; then
    return
  fi
  printf '\n按回车键关闭此窗口…'
  read -r _unused
}

fail() {
  printf '\n安装未完成：%s\n' "$1"
  printf '日志位置：%s\n' "$LOG_FILE"
  printf '[failed] %s\n' "$1" >> "$LOG_FILE"
  pause_before_exit
  exit 1
}

node_is_compatible() {
  "$1" -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit((a===22&&b>=19)||a>=24?0:1)" >/dev/null 2>&1
}

download_file() {
  local output="$1"
  shift
  local url
  for url in "$@"; do
    printf '正在下载：%s\n' "$url"
    if curl --fail --location --retry 3 --retry-all-errors --connect-timeout 15 --max-time 600 \
      --output "$output.part" "$url"; then
      mv "$output.part" "$output"
      return 0
    fi
  done
  return 1
}

run_with_heartbeat() {
  local label="$1"
  shift
  "$@" &
  local process_id=$!
  local elapsed=0
  while kill -0 "$process_id" >/dev/null 2>&1; do
    sleep 15
    elapsed=$((elapsed + 15))
    if kill -0 "$process_id" >/dev/null 2>&1; then
      printf '%s仍在进行（已等待 %s 秒），请不要关闭窗口…\n' "$label" "$elapsed"
    fi
  done
  wait "$process_id"
}

install_portable_node() {
  local machine
  machine="$(uname -m)"
  local node_arch
  case "$machine" in
    arm64) node_arch="arm64" ;;
    x86_64) node_arch="x64" ;;
    *) fail "暂不支持此 Mac 架构：$machine" ;;
  esac

  local archive="node-v${NODE_VERSION}-darwin-${node_arch}.tar.gz"
  local archive_path="$CACHE_ROOT/$archive"
  local sums_path="$CACHE_ROOT/SHASUMS256-v${NODE_VERSION}.txt"

  if [ ! -f "$archive_path" ]; then
    download_file "$archive_path" \
      "$OFFICIAL_NODE_BASE/$archive" \
      "$MIRROR_NODE_BASE/$archive" \
      || fail "Node.js 下载失败，请检查网络后重新双击；已下载内容会保留。"
  else
    printf '复用已下载的 Node.js 安装包。\n'
  fi

  download_file "$sums_path" \
    "$OFFICIAL_NODE_BASE/SHASUMS256.txt" \
    "$MIRROR_NODE_BASE/SHASUMS256.txt" \
    || fail "无法下载 Node.js 校验文件。"

  local expected actual
  expected="$(awk -v filename="$archive" '$2 == filename { print $1 }' "$sums_path")"
  actual="$(shasum -a 256 "$archive_path" | awk '{ print $1 }')"
  if [ -z "$expected" ] || [ "$expected" != "$actual" ]; then
    fail "Node.js 安装包校验失败；请删除 $archive_path 后重试。"
  fi

  local extract_root="$RUNTIME_ROOT/node-extract-v${NODE_VERSION}"
  if [ -d "$extract_root" ]; then
    find "$extract_root" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
  else
    mkdir -p "$extract_root"
  fi
  tar -xzf "$archive_path" -C "$extract_root" || fail "Node.js 解压失败。"
  local extracted="$extract_root/node-v${NODE_VERSION}-darwin-${node_arch}"
  [ -x "$extracted/bin/node" ] || fail "Node.js 解压后缺少可执行文件。"
  if [ -d "$NODE_ROOT" ]; then
    find "$NODE_ROOT" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
  else
    mkdir -p "$NODE_ROOT"
  fi
  cp -R "$extracted/." "$NODE_ROOT/"
  printf '便携 Node.js 已安装到：%s\n' "$NODE_ROOT"
}

printf '\n=== 抖音官方资料创作助手：一键安装 ===\n'
printf '本安装器不会修改系统 Node.js，也不会读取或写入你的 API Key。\n\n'

NODE_BIN=""
if command -v node >/dev/null 2>&1 && node_is_compatible "$(command -v node)"; then
  NODE_BIN="$(command -v node)"
  printf '使用现有 Node.js：%s\n' "$("$NODE_BIN" -v)"
elif [ -x "$NODE_ROOT/bin/node" ] && node_is_compatible "$NODE_ROOT/bin/node"; then
  NODE_BIN="$NODE_ROOT/bin/node"
  printf '使用已缓存的便携 Node.js：%s\n' "$("$NODE_BIN" -v)"
else
  printf '没有发现兼容的 Node.js，将安装免管理员权限的便携版本。\n'
  install_portable_node
  NODE_BIN="$NODE_ROOT/bin/node"
fi

NODE_BIN_DIR="$(dirname "$NODE_BIN")"
export PATH="$NODE_BIN_DIR:$PATH"
export npm_config_cache="$CACHE_ROOT/npm"
NPM_BIN="$NODE_BIN_DIR/npm"
NPX_BIN="$NODE_BIN_DIR/npx"
[ -x "$NPM_BIN" ] || NPM_BIN="$(command -v npm 2>/dev/null || true)"
[ -x "$NPX_BIN" ] || NPX_BIN="$(command -v npx 2>/dev/null || true)"
[ -n "$NPM_BIN" ] && [ -n "$NPX_BIN" ] || fail "没有找到 npm/npx。"

NPM_REGISTRY=""
for registry in "${DSH_NPM_REGISTRY:-}" "$OFFICIAL_NPM_REGISTRY" "$MIRROR_NPM_REGISTRY"; do
  [ -n "$registry" ] || continue
  printf '正在测试软件源：%s\n' "$registry"
  if "$NPM_BIN" view "$DSH_PACKAGE" version --registry="$registry" --fetch-retries=2 --fetch-timeout=30000 >/dev/null 2>&1; then
    NPM_REGISTRY="$registry"
    break
  fi
done
[ -n "$NPM_REGISTRY" ] || fail "官方源和备用镜像都无法访问，请连接网络后重试。"
printf '使用软件源：%s\n' "$NPM_REGISTRY"

PNPM_BIN="$PNPM_ROOT/node_modules/.bin/pnpm"
if [ -x "$PNPM_BIN" ]; then
  printf '复用已缓存的快速安装工具：pnpm %s\n' "$("$PNPM_BIN" --version)"
else
  printf '正在准备快速安装工具，避免 npm 长时间解析 DSH 依赖…\n'
  run_with_heartbeat "准备安装工具" "$NPM_BIN" install \
    --prefix "$PNPM_ROOT" \
    --no-audit \
    --no-fund \
    --ignore-scripts \
    --registry="$NPM_REGISTRY" \
    "pnpm@$PNPM_VERSION" \
    || fail "快速安装工具准备失败，请重新双击，缓存会继续使用。"
fi
[ -x "$PNPM_BIN" ] || fail "快速安装工具准备后缺少可执行文件。"
export PNPM_HOME="$RUNTIME_ROOT/pnpm-bin"
export PNPM_CONFIG_REGISTRY="$NPM_REGISTRY"
export PNPM_CONFIG_CACHE_DIR="$CACHE_ROOT/pnpm-cache"
export PNPM_CONFIG_STORE_DIR="$CACHE_ROOT/pnpm-store"
mkdir -p "$PNPM_HOME" "$PNPM_CONFIG_CACHE_DIR" "$PNPM_CONFIG_STORE_DIR"
export PATH="$(dirname "$PNPM_BIN"):$PATH"

printf '\n正在制作本地插件安装包，避免再次访问 GitHub…\n'
PACK_OUTPUT="$(cd "$PLUGIN_DIR" && "$NPM_BIN" pack --silent --pack-destination "$CACHE_ROOT")" \
  || fail "本地插件打包失败。"
PACKAGE_FILE="$(printf '%s\n' "$PACK_OUTPUT" | tail -n 1)"
PACKAGE_PATH="$CACHE_ROOT/$PACKAGE_FILE"
[ -f "$PACKAGE_PATH" ] || fail "没有找到本地插件安装包。"

printf '\n正在安装 DeepSeek Harness 与插件。首次安装依赖较多，弱网下可能需要 5 到 15 分钟。\n'
printf '即使一段时间没有新文字，也请保持窗口打开；失败后重试会继续复用缓存。\n'
run_with_heartbeat "安装" "$PNPM_BIN" --package="$DSH_PACKAGE" dlx dsh \
  plugin --profile "$PROFILE" add "$PACKAGE_PATH" \
  || fail "DeepSeek Harness 或插件安装失败；请重新双击，缓存会继续使用。"

printf '\n正在执行环境自检…\n'
"$NODE_BIN" "$PLUGIN_DIR/bin/install.mjs" --doctor --profile "$PROFILE" \
  || fail "环境自检未通过。"

if [ "${DSH_SKIP_LAUNCH:-0}" = "1" ]; then
  printf '\n安装与自检已完成；按测试设置跳过网页启动。\n'
  exit 0
fi

printf '\n安装完成，正在启动网页。关闭本窗口会停止服务。\n'
(
  for _attempt in $(seq 1 60); do
    if curl --silent --fail --max-time 2 http://127.0.0.1:3080/ >/dev/null 2>&1; then
      open http://127.0.0.1:3080/
      exit 0
    fi
    sleep 1
  done
) &

"$PNPM_BIN" --package="$DSH_PACKAGE" dlx dsh web
status=$?
printf '\n服务已停止，退出码：%s\n' "$status"
printf '下次仍可双击本文件启动或修复安装。\n'
pause_before_exit
exit "$status"
