import assert from 'node:assert/strict';
import test from 'node:test';

import { apply, inject, name } from '../index.js';

test('loads the plugin entry without runtime package dependencies', async () => {
  let tool;
  const skills = [];
  const ctx = {
    tools: {
      register(definition) {
        tool = definition;
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
  assert.equal(tool.name, 'douyin_official_search');
  assert.equal(tool.parameters.type, 'object');
  assert.deepEqual(tool.parameters.required, ['query']);
  assert.equal(tool.isConcurrencySafe({ query: '推荐算法' }), true);
  assert.equal(skills.length, 4);

  const result = await tool.execute({ query: '推荐算法 内容质量', limit: 2 });
  assert.equal(result.returned_sources, 2);
  assert.match(tool.output.render({}, result)[0].text, /资料 ID/u);

  await assert.rejects(tool.execute({ query: '推荐算法', limit: 11 }), /limit/u);
  await assert.rejects(tool.execute({ query: '推荐算法', extra: true }), /不支持的参数/u);
});
