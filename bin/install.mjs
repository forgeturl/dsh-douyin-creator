#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DSH_PACKAGE = '@deepseek-ai/dsh@0.1.0-rc.7';
const DEFAULT_PROFILE = 'web';
const DEFAULT_REF = 'main';
const PACKAGE_NAME = 'dsh-douyin-creator';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function printHelp() {
  console.log(`安装 dsh-douyin-creator / Install dsh-douyin-creator

用法 / Usage:
  npx --yes github:forgeturl/dsh-douyin-creator#main [选项]

选项 / Options:
  --profile <name>  DSH 配置名称，默认 web
  --ref <git-ref>   插件 Git 分支、标签或 commit，默认 main
  --doctor          只检查 Node、npm、插件数据和 DSH 配置，不执行安装
  -h, --help        显示帮助

普通客户 / For non-technical users:
  macOS：双击 installers/macos/安装并启动.command
  Windows：双击 installers/windows/安装并启动.cmd
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
let doctorOnly = false;

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
  if (arg === '--doctor') {
    doctorOnly = true;
    continue;
  }
  fail(`未知参数 ${arg} / unknown option ${arg}`);
}

const [major, minor] = process.versions.node.split('.').map(Number);
const nodeSupported = (major === 22 && minor >= 19) || major >= 24;
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function resolveDshHome() {
  const configured = process.env.DSH_HOME?.trim();
  return configured ? path.resolve(configured) : path.join(homedir(), '.dsh');
}

function readJson(filename) {
  try {
    return JSON.parse(readFileSync(filename, 'utf8'));
  } catch {
    return null;
  }
}

function runDoctor() {
  const checks = [];
  const add = (ok, label, detail, fix = '') => checks.push({ ok, label, detail, fix });

  add(
    nodeSupported,
    'Node.js',
    `v${process.versions.node}`,
    '请使用双击安装器自动安装便携 Node.js 24。',
  );

  const npxVersion = spawnSync(npxCommand, ['--version'], { encoding: 'utf8' });
  add(
    npxVersion.status === 0,
    'npm / npx',
    npxVersion.status === 0 ? `npx ${npxVersion.stdout.trim()}` : '不可用',
    '请重新运行双击安装器修复便携 Node.js。',
  );

  const summary = readJson(path.join(ROOT, 'data', 'archive_summary.json'));
  const dataReady = summary?.knowledge_units === 73 && summary?.knowledge_chunks === 231;
  add(
    dataReady,
    '官方资料索引',
    dataReady ? `${summary.knowledge_units} 份资料，${summary.knowledge_chunks} 个切片` : '缺失或数量异常',
    '请重新下载完整安装包。',
  );

  const profileManifestPath = path.join(resolveDshHome(), 'profiles', profile, 'package.json');
  const manifest = readJson(profileManifestPath);
  const dependency = manifest?.dependencies?.[PACKAGE_NAME];
  const bundles = manifest?.dsh?.profile?.bundles;
  add(
    typeof dependency === 'string' && dependency.length > 0,
    `DSH ${profile} 配置中的插件`,
    dependency || '未安装',
    '请重新运行双击安装器，或运行本命令但不要加 --doctor。',
  );
  add(
    Array.isArray(bundles) && bundles.includes(PACKAGE_NAME),
    '插件启用状态',
    Array.isArray(bundles) && bundles.includes(PACKAGE_NAME) ? '已加入 bundle 列表' : '未启用',
    '请重新运行双击安装器。',
  );

  console.log(`\n环境自检 / Environment doctor (${profile})\n`);
  for (const check of checks) {
    console.log(`${check.ok ? '[通过]' : '[失败]'} ${check.label}：${check.detail}`);
    if (!check.ok && check.fix) console.log(`       修复：${check.fix}`);
  }
  console.log(`\nDSH 配置目录：${resolveDshHome()}`);
  console.log('自检不会读取、显示或修改 API Key。\n');

  return checks.every((check) => check.ok);
}

if (doctorOnly) {
  process.exit(runDoctor() ? 0 : 1);
}

if (!nodeSupported) {
  fail(
    `当前 Node.js ${process.versions.node} 不兼容；请先安装 Node.js 22.19+ 或 24+，然后重新运行本命令。\n` +
    'Current Node.js is unsupported; install Node.js 22.19+ or 24+, then retry.\n' +
    '下载 / Download: https://nodejs.org/zh-cn/download',
  );
}

const pluginSource = `github:forgeturl/dsh-douyin-creator#${ref}`;

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
