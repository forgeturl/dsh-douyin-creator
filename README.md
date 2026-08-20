<div align="center">

[中文](README.md) · [English](README.en.md)

<img src="https://raw.githubusercontent.com/forgeturl/dsh-douyin-creator/main/docs/images/hero.svg" alt="先查官方资料，再做抖音内容" width="100%">

# dsh-douyin-creator

**让 DeepSeek 在给出抖音运营建议前，先查抖音官方资料。**

[![CI](https://github.com/forgeturl/dsh-douyin-creator/actions/workflows/ci.yml/badge.svg)](https://github.com/forgeturl/dsh-douyin-creator/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-22.19%2B_%7C_24%2B-339933?logo=nodedotjs&logoColor=white)](package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![DeepSeek Harness](https://img.shields.io/badge/DeepSeek_Harness-plugin-5B67F1)](https://github.com/deepseek-ai/deepseek-harness)

</div>

这是一个面向 DeepSeek Harness 的抖音自媒体证据插件。它把抖音官方公开的推荐、分发、搜索、治理和技术资料变成可检索的知识库，再用于选题评估、脚本审查、数据诊断和内容周计划。

如果你不想再靠“八级流量池”“账号权重”“万能发布时间”这类未经官方证实的说法做内容决策，它会帮你把建议拆成可追溯的官方资料、明确的推断边界和可复盘的运营实验。

## 30 秒上手

```bash
# 安装
dsh plugin --profile web add github:forgeturl/dsh-douyin-creator#main

# 确认插件已经进入配置
dsh --profile web --dump-config

# 启动 DeepSeek Harness Web UI
dsh web
```

然后直接粘贴：

```text
请先用 douyin_official_search 检索“推荐算法 内容质量”，
再区分官方公开、合理推断和运营建议，评估我的选题。
```

> 生产或团队环境建议把 `#main` 换成具体 commit SHA，避免上游更新造成结果漂移。DeepSeek Harness 仍处于开发预览阶段，命令或插件接口后续可能变化。

### 真实 Web UI 加载结果

下图来自隔离的 DeepSeek Harness `0.1.0-rc.7` 环境：插件通过 tarball 安装后，在插件列表中显示为 **已启用**。验证过程没有使用维护者的 API Key 或现有 DSH 配置。

<img src="https://raw.githubusercontent.com/forgeturl/dsh-douyin-creator/main/docs/images/plugin-loaded.webp" alt="DeepSeek Harness 插件列表中 douyin-creator 已启用" width="100%">

## 它能帮你做什么

| 你的问题 | 插件的处理方式 |
| --- | --- |
| 这个选题值不值得做？ | 检索推荐、搜索、内容质量和治理资料，再给出可测试的选题判断 |
| 脚本有没有伪算法或事实风险？ | 检查平台机制、数字、因果关系、封面和口播中的高风险表达 |
| 播放低到底该查什么？ | 同时检查内容、受众、搜索、原创和治理信号，不简单归因于“账号权重” |
| 下周应该发什么？ | 把内容假设、作品安排、观察指标和停止条件组成一周实验 |
| 官方到底说过什么？ | 返回资料 ID、标题、发布时间、官方链接和相关证据摘要 |

## 真实资料，分层结论

下面不是虚构的产品界面，而是用插件当前索引中的真实资料制作的检索结果说明图。每条结果都能回到资料 ID 和官方链接。

<img src="https://raw.githubusercontent.com/forgeturl/dsh-douyin-creator/main/docs/images/evidence-result.svg" alt="douyin_official_search 真实检索数据示例" width="100%">

插件要求回答区分四层：

1. **官方公开**：原文直接支持的机制、规则或产品说明。
2. **合理推断**：依据公开机制推导，但官方没有直接承诺。
3. **运营建议**：可测试、可复盘的选题、脚本、发布或诊断动作。
4. **账号结论**：只有拿到账号样本、时间窗和统计口径后才能形成。

它不会把固定多级流量池、统一账号权重分、永久指标权重、全赛道留存合格线、保证热门公式或通用最佳发布时间写成抖音官方结论。

## 真实运营实践

维护者已经把这套工具和工作流用于抖音号《商道人物志》的实际运营。截至 **2026 年 8 月**，账号接近 **6 万粉丝**，实践效果显著。

这是维护者的单账号实践，不代表所有账号都能复制相同结果，也不构成对播放、涨粉或收益的保证。

## 一个工具，四个窄职责 Skill

| 名称 | 作用 |
| --- | --- |
| `douyin_official_search` | 检索 73 个知识单元、231 个切片，返回资料 ID、官方链接、日期和证据摘要 |
| `douyin-topic-evaluation` | 评估选题与用户需求、搜索机会、内容价值和治理风险 |
| `douyin-script-review` | 审查平台机制、事实、数字、因果边界，并返回可直接替换的文案 |
| `douyin-data-diagnosis` | 使用账号自身基线诊断内容、受众、搜索、原创和治理信号 |
| `douyin-weekly-plan` | 把证据、假设、发布动作和指标组织成一周实验计划 |

也可以显式调用 Skill：

```text
/douyin-script-review
```

## 兼容性与资料时效

| 项目 | 当前状态 |
| --- | --- |
| 插件版本 | `0.1.0` MVP |
| Node.js | `^22.19.0` 或 `>=24.0.0` |
| DeepSeek Harness | 已用 `0.1.0-rc.7` 完成安装、配置合成和加载验证 |
| 资料快照 | 2026-08-13 至 2026-08-14 |
| 索引构建 | 2026-08-21 |
| 知识规模 | 73 个知识单元；231 个切片 |
| 分发媒体 | npm 包内 0 个图片、音频或视频文件；README 图不随包下载 |

涉及“当前、最新、今天、现在入口、现行政策”等问题时，必须继续核对最新官方网页，不能只依赖本地快照。

## 安装、更新与移除

从 GitHub 安装：

```bash
dsh plugin --profile web add github:forgeturl/dsh-douyin-creator#main
```

本地开发安装：

```bash
dsh plugin --profile web add /absolute/path/to/dsh-douyin-creator
```

插件已经提交运行所需的 `index.js`，Git 安装时不需要执行构建脚本。更新和移除请使用 Harness 当前版本提供的 `plugin` 子命令；执行前可以先运行 `dsh plugin --help` 核对当前语法。

## 数据与下载体积

公开 npm 包只分发运行代码、四个 Skill 和以下文字数据：

- `knowledge_units.jsonl`
- `knowledge_chunks.jsonl`
- `source_manifest.jsonl`
- `archive_summary.json`

仓库只允许 `docs/images/` 下受控的 SVG/WebP 说明图；单文件不超过 300 KiB、合计不超过 600 KiB，并明确排除 GIF、视频、音频、PDF 和高分辨率 PNG/JPG。README 图片不进入 npm 包。

## 开发与验证

```bash
npm test
npm run pack:check
```

测试会检查检索、中文可读输出、索引计数、Skill 元数据、Harness 清单、媒体边界和双语 README。`pack:check` 用于核对最终 npm 包清单与体积。

## 参与项目

- 贡献规范：[CONTRIBUTING.md](CONTRIBUTING.md)
- 安全问题：[SECURITY.md](SECURITY.md)
- 版本记录：[CHANGELOG.md](CHANGELOG.md)
- 许可证：[MIT](LICENSE)；第三方公开资料的权利说明见 [NOTICE.md](NOTICE.md)

欢迎提交新的官方资料、可复现问题和小而清晰的 Skill 改进。新增平台事实必须带官方原文链接、发布时间、检索时间和资料类型；机器转写只能作为补充证据。
