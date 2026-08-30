import assert from 'node:assert/strict';
import test from 'node:test';

import { apply, inject, name } from '../index.js';

test('loads the plugin entry without runtime package dependencies', async () => {
  const tools = [];
  const skills = [];
  const ctx = {
    tools: {
      register(definition) {
        tools.push(definition);
      },
    },
    skills: {
      register(definition) {
        skills.push(definition);
      },
    },
  };

  await apply(ctx);

  assert.equal(name, 'dsh-douyin-creator');
  assert.deepEqual(inject, ['tools', 'skills']);
  assert.deepEqual(tools.map((tool) => tool.name), [
    'douyin_official_search',
    'douyin_official_source_read',
  ]);
  assert.equal(skills.length, 5);

  const searchTool = tools[0];
  assert.equal(searchTool.parameters.type, 'object');
  assert.deepEqual(searchTool.parameters.required, ['query']);
  assert.equal(searchTool.isConcurrencySafe({ query: '推荐算法' }), true);

  const result = await searchTool.execute({ query: '推荐算法 内容质量', limit: 2 });
  assert.equal(result.returned_sources, 2);
  assert.match(searchTool.output.render({}, result)[0].text, /资料 ID/u);

  await assert.rejects(searchTool.execute({ query: '推荐算法', limit: 11 }), /limit/u);
  await assert.rejects(searchTool.execute({ query: '推荐算法', extra: true }), /不支持的参数/u);

  const sourceTool = tools[1];
  const source = await sourceTool.execute({ sourceId: result.results[0].source_id, chunkLimit: 1 });
  assert.equal(source.source_id, result.results[0].source_id);
  assert.match(sourceTool.output.render({}, source)[0].text, /原文切片/u);
  await assert.rejects(sourceTool.execute({ sourceId: source.source_id, chunkLimit: 4 }), /chunkLimit/u);
});
