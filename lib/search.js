import { readFileSync } from 'node:fs';

const CHUNKS_URL = new URL('../data/knowledge_chunks.jsonl', import.meta.url);
const SUMMARY_URL = new URL('../data/archive_summary.json', import.meta.url);

let cachedChunks;
let cachedSummary;

function normalize(value) {
  return String(value ?? '').normalize('NFKC').toLocaleLowerCase('zh-CN');
}

function readJsonLines(url) {
  return readFileSync(url, 'utf8')
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function loadData() {
  cachedChunks ??= readJsonLines(CHUNKS_URL);
  cachedSummary ??= JSON.parse(readFileSync(SUMMARY_URL, 'utf8'));
  return { chunks: cachedChunks, summary: cachedSummary };
}

function queryTerms(query) {
  const normalized = normalize(query).trim();
  if (!normalized) return [];

  const terms = new Set([normalized]);
  for (const term of normalized.split(/[\s,，。；;、/|]+/u)) {
    if (term.length >= 2) terms.add(term);
  }
  return [...terms];
}

function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  let count = 0;
  let offset = 0;
  while (count < 5) {
    const index = haystack.indexOf(needle, offset);
    if (index < 0) break;
    count += 1;
    offset = index + Math.max(needle.length, 1);
  }
  return count;
}

function scoreChunk(chunk, terms) {
  const title = normalize(chunk.title);
  const text = normalize(chunk.text);
  const metadata = normalize(`${chunk.publisher} ${chunk.category} ${chunk.kind}`);
  let score = 0;

  terms.forEach((term, index) => {
    const exactBoost = index === 0 ? 2 : 1;
    score += countOccurrences(title, term) * 18 * exactBoost;
    score += countOccurrences(text, term) * 5 * exactBoost;
    score += countOccurrences(metadata, term) * 4 * exactBoost;
  });

  return score;
}

function excerptFor(text, terms, maxLength = 420) {
  const normalizedText = normalize(text);
  const positions = terms
    .map((term) => normalizedText.indexOf(term))
    .filter((position) => position >= 0);
  const firstMatch = positions.length ? Math.min(...positions) : 0;
  const start = Math.max(0, firstMatch - 90);
  const end = Math.min(text.length, start + maxLength);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';
  return `${prefix}${text.slice(start, end).replace(/\s+/gu, ' ').trim()}${suffix}`;
}

function boundedLimit(limit) {
  const parsed = Number(limit);
  if (!Number.isFinite(parsed)) return 5;
  return Math.min(10, Math.max(1, Math.trunc(parsed)));
}

export function searchArchive({ query, limit = 5, category, sourceKind } = {}) {
  const terms = queryTerms(query);
  if (!terms.length) {
    throw new TypeError('query 必须是非空字符串');
  }

  const { chunks, summary } = loadData();
  const requestedCategory = normalize(category).trim();
  const requestedKind = normalize(sourceKind).trim();
  const bestBySource = new Map();

  for (const chunk of chunks) {
    if (requestedCategory && normalize(chunk.category) !== requestedCategory) continue;
    if (requestedKind && normalize(chunk.kind) !== requestedKind) continue;

    const score = scoreChunk(chunk, terms);
    if (score <= 0) continue;

    const previous = bestBySource.get(chunk.id);
    if (!previous || score > previous.score) {
      bestBySource.set(chunk.id, { chunk, score });
    }
  }

  const ranked = [...bestBySource.values()]
    .sort((left, right) => right.score - left.score || left.chunk.title.localeCompare(right.chunk.title, 'zh-CN'));

  const results = ranked.slice(0, boundedLimit(limit)).map(({ chunk, score }) => ({
    source_id: chunk.id,
    chunk_id: chunk.chunk_id,
    title: chunk.title,
    source_kind: chunk.kind,
    category: chunk.category,
    authority_tier: chunk.authority_tier,
    publisher: chunk.publisher,
    published_at: chunk.published_at,
    retrieved_at: chunk.retrieved_at,
    source_url: chunk.source_url,
    excerpt: excerptFor(chunk.text, terms),
    score,
  }));

  return {
    query: String(query).trim(),
    snapshot: '2026-08-13 至 2026-08-14',
    built_at: summary.built_at,
    matched_sources: ranked.length,
    returned_sources: results.length,
    current_information_warning: '涉及当前规则、入口或政策时，请继续核对最新官方来源。',
    evidence_boundary: '检索结果只提供官方材料证据；推断、运营建议和账号结论必须分层表达。',
    results,
  };
}

export function renderSearchResult(value) {
  const lines = [
    `检索“${value.query}”：匹配 ${value.matched_sources} 份资料，返回 ${value.returned_sources} 份。`,
    '',
    `> 资料快照：${value.snapshot}。${value.current_information_warning}`,
  ];

  if (!value.results.length) {
    lines.push('', '没有找到匹配资料。请缩短关键词，或换用平台机制、搜索、治理等近义词。');
  }

  value.results.forEach((result, index) => {
    const published = result.published_at || '未标注';
    lines.push(
      '',
      `### ${index + 1}. ${result.title}`,
      `- 资料 ID：${result.source_id}`,
      `- 来源：${result.publisher} · ${result.source_kind} · ${published}`,
      `- 官方链接：${result.source_url}`,
      `- 证据摘要：${result.excerpt}`,
    );
  });

  lines.push('', `> 证据边界：${value.evidence_boundary}`);
  return lines.join('\n');
}
