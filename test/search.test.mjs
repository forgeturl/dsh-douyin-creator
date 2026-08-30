import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readArchiveSource,
  renderSearchResult,
  renderSourceResult,
  searchArchive,
} from '../lib/search.js';

test('returns ranked official sources with links', () => {
  const result = searchArchive({ query: '推荐算法', limit: 3 });
  assert.equal(result.returned_sources, 3);
  assert.ok(result.matched_sources >= result.returned_sources);
  assert.ok(result.results.every((item) => item.source_url.startsWith('https://')));
  assert.ok(result.results.every((item) => item.source_id && item.excerpt));
});

test('deduplicates multiple chunks from the same source', () => {
  const result = searchArchive({ query: '内容质量', limit: 10 });
  const ids = result.results.map((item) => item.source_id);
  assert.equal(new Set(ids).size, ids.length);
});

test('supports exact category filters and bounded limits', () => {
  const result = searchArchive({
    query: '推荐',
    category: '01_recommendation_core',
    limit: 100,
  });
  assert.ok(result.returned_sources <= 10);
  assert.ok(result.results.every((item) => item.category === '01_recommendation_core'));
});

test('supports the actual video transcript source kind', () => {
  const result = searchArchive({
    query: '2秒跳出率',
    sourceKind: 'official_video_transcript',
  });
  assert.ok(result.returned_sources >= 1);
  assert.equal(result.results[0].source_id, '7506120433238822181');
  assert.equal(result.results[0].source_kind, 'official_video_transcript');
});

test('renders a readable evidence summary', () => {
  const value = searchArchive({ query: '推荐算法 内容质量', limit: 1 });
  const rendered = renderSearchResult(value);
  assert.match(rendered, /资料 ID：/u);
  assert.match(rendered, /官方链接：https:\/\//u);
  assert.match(rendered, /证据边界：/u);
});

test('expands common natural-language creator questions', () => {
  const cases = [
    ['2秒跳出率60%合格吗', '留存与观看质量'],
    ['为什么我的视频没流量', '低流量诊断'],
    ['每天几点发必爆', '发布时间'],
    ['AI内容标识入口在哪里', 'AI 内容与标识'],
    ['新号要不要投DOU+', '冷启动与DOU+'],
    ['怎么做抖音搜索流量', '搜索流量'],
  ];

  for (const [query, intent] of cases) {
    const result = searchArchive({ query, limit: 2 });
    assert.ok(result.returned_sources > 0, `${query} 应返回资料`);
    assert.ok(result.matched_intents.some((item) => item.label === intent));
    assert.ok(result.search_terms.length > 1);
  }
});

test('reads an official source by id with bounded pagination', () => {
  const search = searchArchive({ query: '2秒跳出率', limit: 1 });
  const source = readArchiveSource({
    sourceId: search.results[0].source_id,
    startChunk: 1,
    chunkLimit: 1,
  });
  assert.equal(source.source_id, search.results[0].source_id);
  assert.equal(source.returned_chunks, 1);
  assert.ok(source.total_chunks >= 1);
  assert.match(renderSourceResult(source), /官方链接：https:\/\//u);
  assert.throws(
    () => readArchiveSource({ sourceId: source.source_id, chunkLimit: 4 }),
    /chunkLimit/u,
  );
  assert.throws(() => readArchiveSource({ sourceId: 'missing-source' }), /未找到资料 ID/u);
});

test('rejects an empty query', () => {
  assert.throws(() => searchArchive({ query: '   ' }), /query/u);
});

test('returns an empty result for an impossible query', () => {
  const result = searchArchive({ query: '不存在词xyz987654321' });
  assert.equal(result.matched_sources, 0);
  assert.deepEqual(result.results, []);
});
