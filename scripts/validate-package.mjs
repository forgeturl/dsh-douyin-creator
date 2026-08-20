import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mediaExtensions = new Set([
  '.mp4', '.mov', '.mkv', '.avi', '.webm',
  '.mp3', '.wav', '.m4a', '.aac', '.flac',
  '.gif', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.pdf',
]);
const allowedReadmeMediaExtensions = new Set(['.svg', '.webp']);
const readmeMediaRoot = path.join(root, 'docs', 'images');
const maxReadmeMediaFileBytes = 300 * 1024;
const maxReadmeMediaTotalBytes = 600 * 1024;

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '.npm-cache') continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else files.push(absolute);
  }
  return files;
}

async function readJsonLines(relativePath) {
  const raw = await readFile(path.join(root, relativePath), 'utf8');
  return raw.split(/\r?\n/u).filter(Boolean).map((line) => JSON.parse(line));
}

const files = await walk(root);
const mediaFiles = files.filter((file) => mediaExtensions.has(path.extname(file).toLowerCase()));
const invalidMedia = mediaFiles.filter((file) => {
  const extension = path.extname(file).toLowerCase();
  return path.dirname(file) !== readmeMediaRoot || !allowedReadmeMediaExtensions.has(extension);
});
assert.deepEqual(invalidMedia, [], `只允许 docs/images 下受控的 SVG/WebP：${invalidMedia.join(', ')}`);

let readmeMediaBytes = 0;
for (const file of mediaFiles) {
  const bytes = (await stat(file)).size;
  assert.ok(bytes <= maxReadmeMediaFileBytes, `README 单个媒体超过 300 KiB：${file} (${bytes} bytes)`);
  readmeMediaBytes += bytes;
}
assert.ok(readmeMediaBytes <= maxReadmeMediaTotalBytes, `README 媒体总量超过 600 KiB：${readmeMediaBytes} bytes`);

let totalBytes = 0;
for (const file of files) totalBytes += (await stat(file)).size;
assert.ok(totalBytes < 5 * 1024 * 1024, `公开包源码超过 5 MiB：${totalBytes} bytes`);

const [units, chunks, manifest] = await Promise.all([
  readJsonLines('data/knowledge_units.jsonl'),
  readJsonLines('data/knowledge_chunks.jsonl'),
  readJsonLines('data/source_manifest.jsonl'),
]);
const summary = JSON.parse(await readFile(path.join(root, 'data/archive_summary.json'), 'utf8'));
assert.equal(units.length, 73, '知识单元数量应为 73');
assert.equal(chunks.length, 231, '知识切片数量应为 231');
assert.equal(manifest.length, 73, '资料清单数量应为 73');
assert.equal(summary.knowledge_units, units.length);
assert.equal(summary.knowledge_chunks, chunks.length);
assert.ok(units.every((unit) => /^https:\/\//u.test(unit.source_url)), '每个知识单元都应保留 HTTPS 官方链接');

const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
assert.equal(packageJson.dsh?.bundle?.patch, './cordis.patch.yml');
assert.equal(packageJson.main, './index.js');
assert.equal(packageJson.bin?.['dsh-douyin-creator'], './bin/install.mjs');
assert.equal(packageJson.engines?.node, '^22.19.0 || >=24.0.0');
assert.equal(packageJson.repository?.url, 'git+https://github.com/forgeturl/dsh-douyin-creator.git');
assert.equal(packageJson.publishConfig?.access, 'public');
assert.equal(packageJson.dependencies, undefined, '插件运行时应保持零第三方依赖');
assert.equal(packageJson.peerDependencies, undefined, '插件不应要求用户额外安装 peer 依赖');
assert.ok(packageJson.files.every((entry) => !entry.startsWith('docs')), 'npm files 不得包含 README 图片目录');

const installer = await readFile(path.join(root, 'bin', 'install.mjs'), 'utf8');
assert.match(installer, /@deepseek-ai\/dsh@0\.1\.0-rc\.7/u);
assert.match(installer, /major === 22 && minor >= 19/u);

const [readmeZh, readmeEn] = await Promise.all([
  readFile(path.join(root, 'README.md'), 'utf8'),
  readFile(path.join(root, 'README.en.md'), 'utf8'),
]);
assert.match(readmeZh, /\[English\]\(README\.en\.md\)/u);
assert.match(readmeEn, /\[中文\]\(README\.md\)/u);

const skillDirectories = (await readdir(path.join(root, 'skills'), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory());
assert.equal(skillDirectories.length, 4, '应包含四个窄职责 Skill');
for (const directory of skillDirectories) {
  const content = await readFile(path.join(root, 'skills', directory.name, 'SKILL.md'), 'utf8');
  assert.match(content, /^---\nname: [a-z0-9-]+\ndescription: .+\nwhenToUse: .+\n---\n/u);
  assert.match(content, new RegExp(`^name: ${directory.name}$`, 'mu'));
}

console.log(JSON.stringify({
  ok: true,
  files: files.length,
  total_bytes: totalBytes,
  knowledge_units: units.length,
  knowledge_chunks: chunks.length,
  forbidden_media_files: invalidMedia.length,
  readme_media_files: mediaFiles.length,
  readme_media_bytes: readmeMediaBytes,
  skills: skillDirectories.length,
}, null, 2));
