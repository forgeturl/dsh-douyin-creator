#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const DSH_PACKAGE = '@deepseek-ai/dsh@0.1.0-rc.7';
const DEFAULT_PROFILE = 'web';
const DEFAULT_REF = 'main';

function printHelp() {
  console.log(`安装 dsh-douyin-creator / Install dsh-douyin-creator

用法 / Usage:
  npx --yes github:forgeturl/dsh-douyin-creator#main [选项]

选项 / Options:
  --profile <name>  DSH 配置名称，默认 web
  --ref <git-ref>   插件 Git 分支、标签或 commit，默认 main
  -h, --help        显示帮助
`);
}

function fail(message) {
  console.error(`\n安装未完成：${message}`);
  console.error(`Installation stopped: ${message}\n`);
  process.exit(1);
}

function readOption(args, index, option) {
  const value = args[index + 1];
  if (!value || value.startsWith('-')) fail(`${option} 缺少参数 / requires a value`);
  return value;
}

const args = process.argv.slice(2);
let profile = DEFAULT_PROFILE;
let ref = DEFAULT_REF;

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === '-h' || arg === '--help') {
    printHelp();
    process.exit(0);
  }
  if (arg === '--profile') {
    profile = readOption(args, index, arg);
    index += 1;
    continue;
  }
  if (arg === '--ref') {
    ref = readOption(args, index, arg);
    index += 1;
    continue;
  }
  fail(`未知参数 ${arg} / unknown option ${arg}`);
}

const [major, minor] = process.versions.node.split('.').map(Number);
const nodeSupported = (major === 22 && minor >= 19) || major >= 24;
if (!nodeSupported) {
  fail(
    `当前 Node.js ${process.versions.node} 不兼容；请先安装 Node.js 22.19+ 或 24+，然后重新运行本命令。\n` +
    'Current Node.js is unsupported; install Node.js 22.19+ or 24+, then retry.\n' +
    '下载 / Download: https://nodejs.org/zh-cn/download',
  );
}

const pluginSource = `github:forgeturl/dsh-douyin-creator#${ref}`;
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

console.log(`\n正在安装 ${pluginSource} 到 DSH ${profile} 配置…`);
console.log(`Installing ${pluginSource} into DSH profile ${profile}…\n`);

const result = spawnSync(
  npxCommand,
  ['--yes', DSH_PACKAGE, 'plugin', '--profile', profile, 'add', pluginSource],
  { stdio: 'inherit' },
);

if (result.error) fail(`无法运行 npx：${result.error.message} / could not run npx`);
if (result.status !== 0) process.exit(result.status ?? 1);

console.log(`
安装成功。启动 Web UI：
  npx --yes ${DSH_PACKAGE} web

Installed. Start the Web UI with:
  npx --yes ${DSH_PACKAGE} web
`);
