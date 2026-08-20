# dsh-douyin-creator

一个面向 DeepSeek Harness 的抖音自媒体证据插件：先检索抖音官方公开材料，再做选题、脚本审查、数据诊断和周计划。

它不是“爆款公式库”，也不承诺流量、涨粉或收益。公开包只包含文字索引、检索工具、Skill 和评测，不包含原始视频、音频、图片、GIF 或 PDF。

## 当前状态

- 版本：`0.1.0` MVP
- 资料快照：2026-08-13 至 2026-08-14；索引最后构建于 2026-08-21
- 知识单元：73；切片：231
- DeepSeek Harness 目前仍处于开发预览阶段，后续接口可能变化

涉及“当前、最新、今天、现在入口、现行政策”等问题时，必须继续核对最新官方网页，不能只依赖本地快照。

## 能做什么

插件注册一个工具：

- `douyin_official_search`：按关键词检索官方资料，返回资料 ID、标题、官方链接、发布时间、证据摘要和快照提示。

同时注册四个窄职责 Skill：

- `douyin-topic-evaluation`：评估选题与抖音机制、搜索需求、风险的关系。
- `douyin-script-review`：审查脚本中的平台机制、事实、数字和因果边界。
- `douyin-data-diagnosis`：用账号自身基线诊断流量，不虚构统一阈值。
- `douyin-weekly-plan`：把证据、假设、动作和复盘指标组成一周实验计划。

## 安装

本地开发安装：

```bash
dsh plugin --profile web add /absolute/path/to/dsh-douyin-creator
```

发布到 GitHub 后，可以固定到具体提交安装：

```bash
dsh plugin --profile web add github:<your-account>/dsh-douyin-creator#<commit-sha>
```

插件没有安装期构建脚本，运行所需的 `index.js` 已直接提交，避免 Git 安装时触发额外构建权限。

## 使用

可以直接让 Harness 调用工具：

```text
请先用 douyin_official_search 检索“推荐 多目标 内容质量”，
再区分官方公开、合理推断和运营建议，评估这条选题。
```

也可以显式调用 Skill：

```text
/douyin-script-review
```

推荐的答案证据层级：

1. 官方公开：原文直接支持。
2. 合理推断：由公开机制推导，但官方未承诺。
3. 运营建议：可测试、可复盘的动作。
4. 账号结论：仅在用户给出数据后形成，并说明样本、时间窗和不确定性。

禁止把固定多级流量池、统一账号权重分、永久指标权重、通用留存合格线、保证热门公式或通用最佳发布时间写成官方结论。

## 数据与体积边界

`data/` 只分发以下文字文件：

- `knowledge_units.jsonl`
- `knowledge_chunks.jsonl`
- `source_manifest.jsonl`
- `archive_summary.json`

仓库校验会拒绝音频、视频、图片、GIF、SVG 和 PDF，并将非 Git 文件总大小限制在 5 MiB 以内。官方链接保留在每条记录的 `source_url` 中。

## 本地验证

```bash
npm test
npm run pack:check
```

`npm test` 会验证检索、索引计数、Skill 元数据、Harness 清单、媒体零文件和包体积上限。`npm run pack:check` 用于检查最终 npm 包清单与体积。

## GitHub 仓库建议

- 仓库名：`dsh-douyin-creator`
- 描述：`Evidence-backed Douyin creator workflows for DeepSeek Harness`
- Topics：`deepseek-harness`、`dsh-plugin`、`douyin`、`creator-tools`、`agent-skills`
- 默认分支：`main`
- 首个里程碑：`v0.1.0-mvp`

首次公开前，建议再完成一次第三方材料分发权审查。代码和 Skill 可以采用 MIT；`data/` 中的第三方公开文本不应被 MIT 重新授权。

## 贡献

新增平台事实时，请提供官方原文链接、发布时间、检索时间和资料类型。转写材料只能作为补充；关键数字、否定词和规则边界应回听或用正式文本复核。
