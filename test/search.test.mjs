import test from 'node:test';
import assert from 'node:assert/strict';
import { renderSearchResult, searchArchive } from '../lib/search.js';

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
  assert.equal(result.returned_sources, 1);
  assert.equal(result.results[0].source_kind, 'official_video_transcript');
});

test('renders a readable evidence summary', () => {
  const value = searchArchive({ query: '推荐算法 内容质量', limit: 1 });
  const rendered = renderSearchResult(value);
  assert.match(rendered, /资料 ID：/u);
  assert.match(rendered, /官方链接：https:\/\//u);
  assert.match(rendered, /证据边界：/u);
});

test('rejects an empty query', () => {
  assert.throws(() => searchArchive({ query: '   ' }), /query/u);
});

test('returns an empty result for an impossible query', () => {
  const result = searchArchive({ query: '不存在词xyz987654321' });
  assert.equal(result.matched_sources, 0);
  assert.deepEqual(result.results, []);
});
