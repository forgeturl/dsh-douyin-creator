import { readFileSync } from 'node:fs';

const CHUNKS_URL = new URL('../data/knowledge_chunks.jsonl', import.meta.url);
const UNITS_URL = new URL('../data/knowledge_units.jsonl', import.meta.url);
const SUMMARY_URL = new URL('../data/archive_summary.json', import.meta.url);

const SOURCE_KIND_PRIORITY = new Map([
  ['official_web', 3],
  ['official_pdf_attachment', 2],
  ['official_video_transcript', 1],
]);

const KNOWN_TERMS = [
  '2秒跳出率', '5秒留存', '平均播放时长', '完播率', '发布时间', '账号权重', '流量池',
  '冷启动', 'dou+', '搜索流量', '搜索', '标题', '封面', '关键词', '粉丝黏性', '涨粉',
  '关注', '优质内容', '内容质量', '获得感', '原创', '搬运', '混剪', '二创', '限流',
  '审核', '健康分', '违规', '治理', 'aigc', 'ai生成', 'ai内容', 'ai配音', 'ai起号',
  '热点', '财经', '谣言', '直播', '电商', '同城', 'douyin',
];

const SEARCH_INTENTS = [
  {
    id: 'traffic-pool-myth',
    label: '流量池与账号权重',
    test: /流量池|八级|晋级|账号权重/u,
    terms: ['推荐系统', '冷启动', '低粉作者', '多目标'],
    suggestions: ['冷启动与DOU+', '推荐算法多目标', '低粉作者推荐'],
  },
  {
    id: 'low-traffic-diagnosis',
    label: '低流量诊断',
    test: /没流量|没有流量|低播放|播放低|流量差|不推荐|推荐异常|疑似限流/u,
    terms: ['作品与账号重要数据指标', '2秒跳出率', '平均播放时长', '原创规则', '推荐算法护栏'],
    suggestions: ['作品与账号重要数据指标', '2秒跳出率', '平台治理推荐护栏'],
  },
  {
    id: 'retention',
    label: '留存与观看质量',
    test: /2\s*秒|5\s*秒|跳出|留存|完播|播放时长/u,
    terms: ['2秒跳出率', '平均播放时长', '完播率', '多目标'],
    suggestions: ['2秒跳出率', '作品重要数据指标', '中长视频多目标'],
  },
  {
    id: 'posting-time',
    label: '发布时间',
    test: /几点发|什么时候发|发布时间|最佳时间|必爆/u,
    terms: ['发布时间', '受众', '数据指标'],
    suggestions: ['发布时间 视频长度 垂直度', '作品数据指标'],
  },
  {
    id: 'search-traffic',
    label: '搜索流量',
    test: /搜索流量|搜索排名|搜不到|关键词|查询词|怎么做.*搜索/u,
    terms: ['抖音搜索', '查询词', '精准文字描述', '视频描述'],
    suggestions: ['抖音搜索如何工作', '精准文字描述', '搜索查询词'],
  },
  {
    id: 'cold-start-and-dou-plus',
    label: '冷启动与DOU+',
    test: /dou\s*\+|豆荚|投放|加热|新号|新账号|冷启动/iu,
    terms: ['DOU+', '冷启动', '新账号', '自然流量'],
    suggestions: ['冷启动与DOU+', '自然流量 潜在用户'],
  },
  {
    id: 'aigc',
    label: 'AI 内容与标识',
    test: /aigc|ai.*标识|ai生成|ai内容|ai配音|ai起号/iu,
    terms: ['AIGC标识', 'AI内容', 'AI起号', '同质化'],
    suggestions: ['AI内容标识', 'AI起号治理', 'AIGC滥用'],
  },
  {
    id: 'originality',
    label: '原创与二创',
    test: /搬运|混剪|二创|原创/u,
    terms: ['原创', '简单加工', '背景解读', '叙事重构'],
    suggestions: ['原创规则', '混剪审核与推荐机制'],
  },
  {
    id: 'quality',
    label: '优质内容',
    test: /优质|内容质量|获得感|惊喜感|表达力|感染力/u,
    terms: ['优质内容', '获得感', '信息增益', '精选'],
    suggestions: ['优质内容', '获得感 惊喜感', '抖音精选内容指南'],
  },
  {
    id: 'followers',
    label: '涨粉与关注',
    test: /涨粉|掉粉|粉丝|关注|黏性|粘性|追更/u,
    terms: ['关注', '追更', '长期预期', '个人风格'],
    suggestions: ['掉粉 涨粉 冷启动', '关注页', '追更'],
  },
  {
    id: 'governance',
    label: '审核与治理',
    test: /违规|封禁|限流|审核|健康分|治理|推荐资格/u,
    terms: ['平台治理', '推荐护栏', '健康分', '审核'],
    suggestions: ['平台治理推荐护栏', '账号健康分', '视频审核'],
  },
  {
    id: 'hotspot-and-finance',
    label: '热点与财经事实风险',
    test: /热点|财经|谣言|事实核查|翻车/u,
    terms: ['热点治理', '虚假信息', '恶意营销号', '谣言'],
    suggestions: ['热点信息治理', '恶意营销号', '谣言治理'],
  },
];

let cachedChunks;
let cachedUnits;
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
  cachedUnits ??= readJsonLines(UNITS_URL);
  cachedSummary ??= JSON.parse(readFileSync(SUMMARY_URL, 'utf8'));
  return { chunks: cachedChunks, units: cachedUnits, summary: cachedSummary };
}

function analyzeQuery(query) {
  const normalized = normalize(query).trim();
  if (!normalized) return {
    terms: [], directTermCount: 0, intents: [], suggestions: [],
  };

  const terms = new Set([normalized]);
  for (const term of normalized.split(/[\s,，。！？；;、/|：:?]+/u)) {
    if (term.length >= 2) terms.add(term);
  }
  for (const term of KNOWN_TERMS) {
    if (normalized.includes(term)) terms.add(term);
  }
  const directTermCount = terms.size;

  const intents = SEARCH_INTENTS.filter((intent) => intent.test.test(normalized));
  const suggestions = new Set();
  for (const intent of intents) {
    intent.terms.forEach((term) => terms.add(normalize(term)));
    intent.suggestions.forEach((suggestion) => suggestions.add(suggestion));
  }

  return {
    terms: [...terms],
    directTermCount,
    intents: intents.map(({ id, label }) => ({ id, label })),
    suggestions: [...suggestions].slice(0, 6),
  };
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

function scoreChunk(chunk, analysis) {
  const { terms, directTermCount } = analysis;
  const title = normalize(chunk.title);
  const text = normalize(chunk.text);
  const metadata = normalize(`${chunk.publisher} ${chunk.category} ${chunk.kind}`);
  let score = 0;

  terms.forEach((term, index) => {
    const termBoost = index === 0 ? 2 : index < directTermCount ? 5 : 1;
    score += countOccurrences(title, term) * 18 * termBoost;
    score += countOccurrences(text, term) * 5 * termBoost;
    score += countOccurrences(metadata, term) * 4 * termBoost;
  });

  return score;
}

function matchedTerms(chunk, terms) {
  const haystack = normalize(`${chunk.title} ${chunk.text} ${chunk.publisher} ${chunk.category} ${chunk.kind}`);
  return terms.filter((term) => haystack.includes(term)).slice(0, 8);
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
  const analysis = analyzeQuery(query);
  if (!analysis.terms.length) {
    throw new TypeError('query 必须是非空字符串');
  }

  const { chunks, summary } = loadData();
  const requestedCategory = normalize(category).trim();
  const requestedKind = normalize(sourceKind).trim();
  const bestBySource = new Map();

  for (const chunk of chunks) {
    if (requestedCategory && normalize(chunk.category) !== requestedCategory) continue;
    if (requestedKind && normalize(chunk.kind) !== requestedKind) continue;

    const score = scoreChunk(chunk, analysis);
    if (score <= 0) continue;

    const previous = bestBySource.get(chunk.id);
    if (!previous || score > previous.score) {
      bestBySource.set(chunk.id, { chunk, score });
    }
  }

  const ranked = [...bestBySource.values()]
    .sort((left, right) => (
      right.score - left.score
      || (SOURCE_KIND_PRIORITY.get(right.chunk.kind) ?? 0) - (SOURCE_KIND_PRIORITY.get(left.chunk.kind) ?? 0)
      || left.chunk.title.localeCompare(right.chunk.title, 'zh-CN')
    ));

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
    excerpt: excerptFor(chunk.text, analysis.terms),
    matched_terms: matchedTerms(chunk, analysis.terms),
    score,
  }));

  return {
    query: String(query).trim(),
    search_terms: analysis.terms,
    matched_intents: analysis.intents,
    suggested_queries: analysis.suggestions,
    snapshot: '2026-08-13 至 2026-08-14',
    built_at: summary.built_at,
    matched_sources: ranked.length,
    returned_sources: results.length,
    current_information_warning: '涉及当前规则、入口或政策时，请继续核对最新官方来源。',
    evidence_boundary: '检索结果只提供官方材料证据；推断、运营建议和账号结论必须分层表达。',
    results,
  };
}

export function readArchiveSource({ sourceId, startChunk = 1, chunkLimit = 2 } = {}) {
  if (typeof sourceId !== 'string' || !sourceId.trim()) {
    throw new TypeError('sourceId 必须是非空字符串');
  }
  if (!Number.isInteger(startChunk) || startChunk < 1) {
    throw new TypeError('startChunk 必须是大于等于 1 的整数');
  }
  if (!Number.isInteger(chunkLimit) || chunkLimit < 1 || chunkLimit > 3) {
    throw new TypeError('chunkLimit 必须是 1 到 3 的整数');
  }

  const { chunks, units } = loadData();
  const requestedId = sourceId.trim();
  const unit = units.find((item) => item.id === requestedId);
  if (!unit) throw new RangeError(`未找到资料 ID：${requestedId}`);

  const sourceChunks = chunks
    .filter((chunk) => chunk.id === requestedId)
    .sort((left, right) => left.chunk_index - right.chunk_index);
  const offset = startChunk - 1;
  if (offset >= sourceChunks.length) {
    throw new RangeError(`startChunk 超出范围；该资料共 ${sourceChunks.length} 个切片`);
  }

  const selected = sourceChunks.slice(offset, offset + chunkLimit).map((chunk) => ({
    chunk_number: chunk.chunk_index,
    chunk_id: chunk.chunk_id,
    text: chunk.text,
  }));
  const nextStart = offset + selected.length < sourceChunks.length
    ? offset + selected.length + 1
    : null;

  return {
    source_id: unit.id,
    title: unit.title,
    source_kind: unit.kind,
    category: unit.category,
    authority_tier: unit.authority_tier,
    publisher: unit.publisher,
    published_at: unit.published_at,
    retrieved_at: unit.retrieved_at,
    source_url: unit.source_url,
    total_chunks: sourceChunks.length,
    start_chunk: startChunk,
    returned_chunks: selected.length,
    next_start_chunk: nextStart,
    transcript_warning: unit.kind === 'official_video_transcript'
      ? '该资料为机器转写。关键数字、否定词和规则边界应回听音频或结合官方正式文本复核。'
      : null,
    current_information_warning: '涉及当前规则、入口或政策时，请继续核对最新官方来源。',
    chunks: selected,
  };
}

export function renderSearchResult(value) {
  const lines = [
    `检索“${value.query}”：匹配 ${value.matched_sources} 份资料，返回 ${value.returned_sources} 份。`,
    '',
    `> 资料快照：${value.snapshot}。${value.current_information_warning}`,
  ];

  if (value.matched_intents?.length) {
    lines.push('', `识别问题方向：${value.matched_intents.map((intent) => intent.label).join('、')}`);
  }

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
      `- 命中词：${result.matched_terms.join('、') || '语义扩展命中'}`,
      `- 证据摘要：${result.excerpt}`,
    );
  });

  if (value.suggested_queries?.length) {
    lines.push('', `可继续检索：${value.suggested_queries.join('；')}`);
  }
  lines.push('', `> 证据边界：${value.evidence_boundary}`);
  return lines.join('\n');
}

export function renderSourceResult(value) {
  const published = value.published_at || '未标注';
  const lines = [
    `# ${value.title}`,
    '',
    `- 资料 ID：${value.source_id}`,
    `- 来源：${value.publisher} · ${value.source_kind} · ${published}`,
    `- 官方链接：${value.source_url}`,
    `- 当前切片：${value.start_chunk} 起，共返回 ${value.returned_chunks}/${value.total_chunks} 个`,
    '',
    `> ${value.current_information_warning}`,
  ];

  if (value.transcript_warning) lines.push('', `> ${value.transcript_warning}`);
  value.chunks.forEach((chunk) => {
    lines.push('', `## 原文切片 ${chunk.chunk_number}`, '', chunk.text);
  });
  if (value.next_start_chunk !== null) {
    lines.push('', `> 还有后续内容：将 startChunk 设为 ${value.next_start_chunk} 继续读取。`);
  }
  return lines.join('\n');
}
