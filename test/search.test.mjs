import test from 'node:test';
import assert from 'node:assert/strict';
import { searchArchive } from '../lib/search.js';

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

test('rejects an empty query', () => {
  assert.throws(() => searchArchive({ query: '   ' }), /query/u);
});

test('returns an empty result for an impossible query', () => {
  const result = searchArchive({ query: '不存在词xyz987654321' });
  assert.equal(result.matched_sources, 0);
  assert.deepEqual(result.results, []);
});
