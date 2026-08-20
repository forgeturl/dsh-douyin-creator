import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const forbiddenExtensions = new Set([
  '.mp4', '.mov', '.mkv', '.avi', '.webm',
  '.mp3', '.wav', '.m4a', '.aac', '.flac',
  '.gif', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.pdf',
]);

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
const forbidden = files.filter((file) => forbiddenExtensions.has(path.extname(file).toLowerCase()));
assert.deepEqual(forbidden, [], `媒体文件不得进入公开包：${forbidden.join(', ')}`);

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
  media_files: forbidden.length,
  skills: skillDirectories.length,
}, null, 2));
