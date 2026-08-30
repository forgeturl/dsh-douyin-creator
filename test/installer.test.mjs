import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('macOS one-click installer is syntactically valid and recoverable', async () => {
  const filename = path.join(root, 'installers', 'macos', '安装并启动.command');
  const content = await readFile(filename, 'utf8');
  const syntax = spawnSync('bash', ['-n', filename], { encoding: 'utf8' });

  assert.equal(syntax.status, 0, syntax.stderr);
  assert.match(content, /node-v\$\{NODE_VERSION\}-darwin-/u);
  assert.match(content, /SHASUMS256/u);
  assert.match(content, /registry\.npmjs\.org/u);
  assert.match(content, /registry\.npmmirror\.com/u);
  assert.match(content, /npm_config_cache/u);
  assert.match(content, /pnpm@\$PNPM_VERSION/u);
  assert.match(content, /PNPM_CONFIG_STORE_DIR/u);
  assert.match(content, /PNPM_CONFIG_CACHE_DIR/u);
  assert.match(content, /--package="\$DSH_PACKAGE" dlx dsh/u);
  assert.match(content, /dirname "\$PNPM_BIN"/u);
  assert.match(content, /DSH_SKIP_LAUNCH/u);
  assert.match(content, /run_with_heartbeat/u);
  assert.match(content, /5 到 15 分钟/u);
  assert.doesNotMatch(content, /sudo\s/u);
  assert.doesNotMatch(content, /npm\s+config\s+set/u);
});

test('Windows one-click installer uses portable Node and verified downloads', async () => {
  const wrapper = await readFile(path.join(root, 'installers', 'windows', '安装并启动.cmd'), 'utf8');
  const content = await readFile(path.join(root, 'installers', 'windows', 'install.ps1'), 'utf8');

  assert.match(wrapper, /ExecutionPolicy Bypass/u);
  assert.match(content, /Get-FileHash -Algorithm SHA256/u);
  assert.match(content, /node-v\$NodeVersion-win-/u);
  assert.match(content, /registry\.npmjs\.org/u);
  assert.match(content, /registry\.npmmirror\.com/u);
  assert.match(content, /DSH_SKIP_LAUNCH/u);
  assert.match(content, /pnpm@\$PnpmVersion/u);
  assert.match(content, /PNPM_CONFIG_STORE_DIR/u);
  assert.match(content, /PNPM_CONFIG_CACHE_DIR/u);
  assert.match(content, /--package=\$DshPackage/u);
  assert.match(content, /Split-Path -Parent \$PnpmBin/u);
  assert.match(content, /DSH_INSTALL_STATUS_FILE/u);
  assert.match(content, /Set-InstallerPhase 'complete'/u);
  assert.match(content, /5 到 15 分钟/u);
  assert.doesNotMatch(content, /winget|choco|-Verb\s+RunAs/u);
  assert.doesNotMatch(content, /npm\s+config\s+set/u);
});

test('top-level double-click launchers point to bundled installers', async () => {
  const [mac, windows] = await Promise.all([
    readFile(path.join(root, 'macOS-双击安装并启动.command'), 'utf8'),
    readFile(path.join(root, 'Windows-双击安装并启动.cmd'), 'utf8'),
  ]);
  assert.match(mac, /installers\/macos\/安装并启动\.command/u);
  assert.match(windows, /installers\\windows\\安装并启动\.cmd/u);
});
