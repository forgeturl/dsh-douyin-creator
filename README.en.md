<div align="center">

[中文](README.md) · English

<img src="https://raw.githubusercontent.com/forgeturl/dsh-douyin-creator/main/docs/images/hero.svg" alt="Check official sources before creating for Douyin" width="100%">

# dsh-douyin-creator

**Make DeepSeek check official Douyin sources before giving creator advice.**

[![CI](https://github.com/forgeturl/dsh-douyin-creator/actions/workflows/ci.yml/badge.svg)](https://github.com/forgeturl/dsh-douyin-creator/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-22.19%2B_%7C_24%2B-339933?logo=nodedotjs&logoColor=white)](package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![DeepSeek Harness](https://img.shields.io/badge/DeepSeek_Harness-plugin-5B67F1)](https://github.com/deepseek-ai/deepseek-harness)

</div>

`dsh-douyin-creator` is an evidence plugin for creators using DeepSeek Harness. It turns official public material about Douyin recommendation, distribution, search, governance, and technology into a searchable knowledge base for topic evaluation, script review, traffic diagnosis, and weekly planning.

It is designed for creators who want traceable sources and testable experiments instead of unsupported claims about fixed traffic pools, universal account scores, or guaranteed posting times.

## One-click setup for non-technical users

You do not need to preinstall DSH, Node.js, Git, or developer tools, and administrator access is not required. Download and extract the complete project, then:

- Windows: double-click [`Windows-双击安装并启动.cmd`](Windows-双击安装并启动.cmd)
- macOS: double-click [`macOS-双击安装并启动.command`](macOS-双击安装并启动.command)

The installer prepares a compatible portable Node.js runtime, chooses a reachable registry, installs and checks the plugin, and opens the Web UI. It falls back from the official services to an alternative mirror, keeps downloads in a retryable cache, and verifies the Node.js archive with SHA-256. It neither reads nor modifies API keys or global npm settings.

A first install has many dependencies and can take 5–15 minutes on a slow connection. The illustrated Chinese guide is available in [`普通客户使用教程.md`](普通客户使用教程.md).

## Command-line setup for developers

With Node.js `22.19+` or `24+`, you do not need a globally installed `dsh` command; copy these two lines:

```bash
# One-command plugin installation
npx --yes github:forgeturl/dsh-douyin-creator#main

# Start the DeepSeek Harness Web UI
npx --yes @deepseek-ai/dsh@0.1.0-rc.7 web
```

The command installer checks the Node.js version before asking DeepSeek Harness to install the plugin, and it does not modify your API key. If your shell still reports `dsh: command not found`, use the `npx` commands above instead of configuring a global PATH.

Then paste this prompt:

```text
First use douyin_official_search to search for “推荐算法 内容质量”.
Then separate official facts, reasonable inferences, and operational advice
before evaluating my topic idea.
```

> For production or team use, replace `#main` with a commit SHA to make installs reproducible. DeepSeek Harness is still in developer preview, so commands and plugin APIs may change.

### Verified Web UI loading

The screenshot below comes from an isolated DeepSeek Harness `0.1.0-rc.7` environment. After installing the tarball, the plugin appears in the plugin list as **enabled**. The verification used neither the maintainer's API key nor an existing DSH configuration.

<img src="https://raw.githubusercontent.com/forgeturl/dsh-douyin-creator/main/docs/images/plugin-loaded.webp" alt="douyin-creator enabled in the DeepSeek Harness plugin list" width="100%">

### Real model-and-tool end-to-end verification

On 2026-08-30, we completed a real Web UI conversation with **DeepSeek-V4-Flash** in an isolated profile. The model actually invoked `douyin-data-diagnosis`, `douyin_official_search`, and `douyin_official_source_read`, then returned clickable official Douyin sources and the four evidence layers. This was more than a static code or “enabled” status check.

<img src="https://raw.githubusercontent.com/forgeturl/dsh-douyin-creator/main/docs/images/tutorial-real-tool-calls.webp" alt="DeepSeek Harness invoking a skill, official search, and source reading" width="100%">

<img src="https://raw.githubusercontent.com/forgeturl/dsh-douyin-creator/main/docs/images/tutorial-real-source-links.webp" alt="Source IDs, official links, and layered conclusions in the real response" width="100%">

The API key remained only in an isolated local test configuration and was never written to the repository, conversation, or screenshots. See the [acceptance test report](docs/验收测试报告.md) for the full test scope and remaining remote-only boundaries.

## What it helps with

| Your question | What the plugin does |
| --- | --- |
| Is this topic worth making? | Checks recommendation, search, content-quality, and governance sources, then proposes a testable judgment |
| Does this script contain fake algorithm claims? | Reviews platform claims, numbers, causality, cover copy, and spoken copy |
| Why did a post underperform? | Checks content, audience, search, originality, and governance signals instead of blaming an “account score” |
| What should I publish next week? | Turns hypotheses, production tasks, metrics, and stopping rules into a weekly experiment |
| What did Douyin actually publish? | Returns source IDs, titles, dates, official URLs, and relevant excerpts |
| I am starting from scratch. What should I make? | Builds an account card, three content pillars, and three first-week MVP posts |
| I need the original context, not just an excerpt. | Reads the indexed source by ID with pagination and transcript/freshness warnings |

## Real sources, layered conclusions

The image below is not a fabricated product interface. It is an explanation built from real records in the current plugin index, with source IDs and official URLs preserved.

<img src="https://raw.githubusercontent.com/forgeturl/dsh-douyin-creator/main/docs/images/evidence-result.svg" alt="Real indexed result example from douyin_official_search" width="100%">

Answers are separated into four layers:

1. **Officially published** — directly supported by an official source.
2. **Reasonable inference** — derived from public mechanisms but not promised by Douyin.
3. **Operational advice** — a testable and reviewable creator action.
4. **Account-specific conclusion** — only valid when the user provides a defined sample, time window, and metric basis.

The plugin must not present fixed traffic-pool ladders, universal account scores, permanent metric weights, universal retention thresholds, guaranteed viral formulas, or a universal best posting time as official Douyin claims.

## Real creator practice

The maintainer uses this workflow to operate the Douyin account 《商道人物志》. As of **August 2026**, the account is approaching **60,000 followers**, with meaningful results in day-to-day practice.

This is one maintainer-operated account, not a promise that other accounts will reproduce the same views, followers, or revenue.

## Two tools and five focused skills

| Name | Purpose |
| --- | --- |
| `douyin_official_search` | Searches 73 knowledge units and 231 chunks, returning source IDs, official URLs, dates, and evidence excerpts |
| `douyin_official_source_read` | Reads source context by ID with pagination and transcript warnings |
| `douyin-creator-onboarding` | Builds a beginner account card, content pillars, and first-week MVP posts |
| `douyin-topic-evaluation` | Evaluates audience needs, search opportunity, content value, and governance risk |
| `douyin-script-review` | Reviews platform claims, facts, numbers, and causality, then provides replacement-ready copy |
| `douyin-data-diagnosis` | Uses the account's own baseline to diagnose content, audience, search, originality, and governance signals |
| `douyin-weekly-plan` | Organizes evidence, hypotheses, publishing actions, and metrics into a weekly experiment |

You can also invoke a skill explicitly:

```text
/douyin-script-review
```

## Compatibility and data freshness

| Item | Status |
| --- | --- |
| Plugin version | `0.2.0` |
| Node.js | `^22.19.0` or `>=24.0.0` |
| DeepSeek Harness | Install, configuration composition, plugin loading, real model calls, and tool calls verified with `0.1.0-rc.7` |
| Source snapshot | 2026-08-13 to 2026-08-14 |
| Index build | 2026-08-21 |
| Knowledge base | 73 knowledge units; 231 chunks |
| Distributed media | Zero image, audio, or video files in the npm package; README visuals are not downloaded with it |

Questions about current policies, interfaces, or rules must still be checked against the latest official pages rather than answered only from this snapshot.

## Install and develop

Non-technical users should start with the Windows/macOS double-click launchers in the repository root. Developers can use the following command instead (no global `dsh` required):

```bash
npx --yes github:forgeturl/dsh-douyin-creator#main
```

Or use the `npx` invocation recommended by DeepSeek Harness directly:

```bash
npx --yes @deepseek-ai/dsh@0.1.0-rc.7 plugin --profile web add 'github:forgeturl/dsh-douyin-creator#main'
```

Install a local checkout:

```bash
npx --yes @deepseek-ai/dsh@0.1.0-rc.7 plugin --profile web add /absolute/path/to/dsh-douyin-creator
```

The runtime `index.js` is committed, so a Git install does not need a build step. Use the `plugin` subcommands provided by your installed Harness version to update or remove the plugin; run `npx --yes @deepseek-ai/dsh@0.1.0-rc.7 plugin --help` first to confirm the current syntax.

## Download-size boundary

The public npm package contains runtime code, five skills, and text-only knowledge data. The illustrated guide and double-click installers ship with the GitHub/customer ZIP. Repository visuals are limited to bounded SVG/WebP files under `docs/images/`; each must stay below 300 KiB and their combined size below 600 KiB. GIF, video, audio, PDF, and high-resolution PNG/JPG files are rejected. README visuals are excluded from the npm package.

## Verify locally

```bash
npm test
npm run pack:check
```

The checks cover natural-language search, source reading, readable output, index counts, skill metadata, the Harness manifest, one-click installers, media boundaries, and reciprocal README language links.

## Contributing

- Contribution guide: [CONTRIBUTING.md](CONTRIBUTING.md)
- Security policy: [SECURITY.md](SECURITY.md)
- Changelog: [CHANGELOG.md](CHANGELOG.md)
- License: [MIT](LICENSE); see [NOTICE.md](NOTICE.md) for third-party source rights

Official-source additions and focused skill improvements are welcome. Every platform fact must include an official URL, publication date, retrieval date, and source type. Machine transcripts are supplementary evidence only.
