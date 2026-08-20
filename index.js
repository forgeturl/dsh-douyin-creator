import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineTool } from '@deepseek-ai/dsh-tools';
import { searchArchive } from './lib/search.js';

export const name = 'dsh-douyin-creator';
export const inject = ['tools', 'skills'];

const SKILLS = [
  {
    name: 'douyin-topic-evaluation',
    description: '基于抖音官方公开材料评估自媒体选题、搜索需求、内容价值和治理风险。',
    whenToUse: '用户要评估抖音选题、热点方向、内容价值、搜索机会或是否值得做时。',
  },
  {
    name: 'douyin-script-review',
    description: '审查抖音脚本中的平台机制、事实、数字、因果边界和可验证改法。',
    whenToUse: '用户提供脚本、口播稿、字幕、封面文案或分镜，并要求审核或优化时。',
  },
  {
    name: 'douyin-data-diagnosis',
    description: '使用账号自身基线诊断抖音作品流量，区分内容、受众、搜索、原创和治理信号。',
    whenToUse: '用户询问播放低、留存差、搜索流量少、推荐异常或提供作品数据求诊断时。',
  },
  {
    name: 'douyin-weekly-plan',
    description: '把官方证据、内容假设、发布动作和复盘指标组织成一周可验证实验计划。',
    whenToUse: '用户要制定抖音周计划、内容排期、选题组合或增长实验时。',
  },
];

function skillContent(name) {
  const url = new URL(`./skills/${name}/SKILL.md`, import.meta.url);
  const raw = readFileSync(url, 'utf8');
  return raw.replace(/^---\s*[\s\S]*?\n---\s*/u, '').trim();
}

function registerSkills(ctx) {
  for (const skill of SKILLS) {
    const directoryUrl = new URL(`./skills/${skill.name}/`, import.meta.url);
    ctx.skills.register({
      ...skill,
      source: 'runtime',
      content: skillContent(skill.name),
      resourceBase: {
        kind: 'directory',
        path: fileURLToPath(directoryUrl),
      },
    });
  }
}

export async function apply(ctx) {
  ctx.tools.register(defineTool({
    name: 'douyin_official_search',
    description: '检索抖音官方公开资料文字快照。用于回答推荐、分发、搜索、治理、隐私和技术机制问题；不提供爆款保证。',
    parameters: {
      query: {
        type: 'string',
        description: '检索词，例如“多目标推荐 内容质量”或“搜索 用户需求”。',
        required: true,
      },
      limit: {
        type: 'number',
        description: '返回资料数量，1 到 10，默认 5。',
        required: false,
      },
      category: {
        type: 'string',
        description: '可选的精确分类，例如 01_recommendation_core。',
        required: false,
      },
      sourceKind: {
        type: 'string',
        description: '可选的精确资料类型：official_web 或 official_video。',
        required: false,
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: true,
      },
      render(_args, value) {
        return [{
          type: 'text',
          text: JSON.stringify(value, null, 2),
        }];
      },
    },
    async execute(args) {
      return searchArchive(args);
    },
  }));

  registerSkills(ctx);
}
