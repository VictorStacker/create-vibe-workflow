# Create Vibe Workflow

[English](#english) | **中文**

> 这是我在实际项目中验证过的 Claude Code 工作流配置。
> 如果你喜欢这套组合，可以直接用，也可以按需调整。

---

## 这是我的工作流

我用 Claude Code 开发了完整的生产系统（21 个业务模块，生产运行数月）。

这套配置的核心思路：**让 AI 按纪律做事，而不是随意对话。**

9 个强制步骤，每步都有检查点，AI 不能跳过。

---

## 快速开始

```bash
# 在你的项目目录运行
npx create-vibe-workflow
```

交互式问答后，重启 Claude Code 即可生效。

---

## 我用的技能组合

这套工作流依赖以下几个工具/技能的配合使用：

| 工具 | 用途 | 安装链接 |
|------|------|----------|
| **gstack** | PR 审查 / 代码质量检查 / 发布前检查清单 | [github.com/garrytan/gstack](https://github.com/garrytan/gstack) |
| **Superpowers** | TDD 红绿重构 / 调试工具 / Agent 增强指令 | [github.com/obra/superpowers](https://github.com/obra/superpowers) |
| **OpenSpec** | 需求规格化 / Spec驱动开发 / 变更追踪 | [github.com/Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) |
| **everything-claude-code** | 完整规则集 / hooks / 常用命令合集 | [github.com/affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) |
| **本工具 (create-vibe-workflow)** | 一键安装上述配置的 CLI | 见下方 |

> **不强制安装**以上技能也能用，核心 9 步流程不依赖它们。
> 但装上之后体验完整很多，我自己是全部启用的。

### 关于这四个项目的取舍

这四个项目各自独立开发，**部分模块存在重叠或冲突**——比如多个项目都定义了 Git 提交规范、代码审查规则、或 TDD 流程。直接全部安装会导致规则互相覆盖、AI 行为不一致。

我做了以下取舍：

- 以 **gstack** 为主干，负责 PR 审查和发布前检查
- 用 **Superpowers** 补充 TDD 红绿重构和调试能力
- 用 **OpenSpec** 管需求规格化（与 9 步流程的第①②步对接）
- 从 **everything-claude-code** 中选取不冲突的 hooks 和命令模板

这套工作流（`create-vibe-workflow`）就是把上述组合**去重、消冲突、整合成一套一致配置**后的产物。

> 如果你打算自己搭配，建议先了解每个项目的完整内容，注意规则文件层面的潜在冲突。

---

## 安装后生成的文件

```
你的项目/
├── .claude/
│   ├── rules/                          ← 7 个规则文件
│   │   ├── development-workflow.md     # 9步开发流程（核心）
│   │   ├── coding-style.md             # TypeScript 编码规范
│   │   ├── git-workflow.md             # Git 提交规范
│   │   ├── agents.md                   # Agent 编排指南
│   │   ├── security.md                 # 安全检查清单
│   │   ├── testing.md                  # 测试规范（TDD）
│   │   └── patterns.md                 # 设计模式（Repository/Service）
│   ├── hooks/                          ← 自动化检查脚本
│   │   ├── post-commit-check.js        # 提交后文档反写提醒
│   │   └── check-deps.mjs              # 依赖检测
│   ├── settings.json                   # 依赖声明
│   └── skills.recommend.json           # 按技术栈推荐的技能
└── CLAUDE.md                           ← AI 协作配置
```

---

## 9 步开发流程

| 步骤 | 名称 | 可跳过？ | 完成标志 |
|------|------|----------|----------|
| ① | 需求澄清 | 仅纯技术任务 | 用户故事/P0P1 划分已确认 |
| ② | 计划拆分 | <50行小修改 | 子任务列表（每项=1个commit） |
| ③ | 研究复用 | 已有明确模式 | 确认实现方案 |
| ④ | TodoList编写 | **不可跳过** | `todolist.md` 已更新 |
| ⑤ | TDD开发 | **不可跳过** | 测试通过 + 编译通过 |
| ⑥ | 代码审查 | 仅文档变更 | CRITICAL/HIGH 问题已修复 |
| ⑦ | 安全审查 | 非敏感模块 | 无 CRITICAL 安全问题 |
| ⑧ | 文档反写 | **不可跳过** | `git diff` 含文档变更 |
| ⑨ | 提交归档 | **不可跳过** | PR 已创建或 commit 成功 |

---

## 支持的技术栈

| 技术栈 | 说明 |
|--------|------|
| `NestJS + Next.js` | 全栈（默认） |
| `Next.js only` | 纯前端 |
| `Node.js API` | 纯后端 Express/Fastify |
| `其他` | 通用基础模板 |

---

## 命令

```bash
npx create-vibe-workflow              # 交互式安装（合并已有配置）
npx create-vibe-workflow --overwrite  # 强制覆盖
npx create-vibe-workflow --uninstall  # 清理所有生成的文件
npx create-vibe-workflow --check      # 健康检查
```

---

## 常见问题

**Q: 安装后没效果？**
A: 重启 Claude Code，或运行 `--check` 排查。

**Q: 已有 CLAUDE.md 怎么办？**
A: 自动备份到 `.claude/.backup/`，然后合并，不会丢内容。

**Q: 如何卸载？**
A: 运行 `--uninstall`，清单丢失也有 fallback 清理。

---

## 开发

```bash
npm install
npm test      # 运行测试
npm run build # 构建
```

---

## License

[MIT](./LICENSE)

---

<a name="english"></a>

# Create Vibe Workflow

**[中文](#)** | English

> This is the Claude Code workflow I use in production.
> If you like this setup, feel free to use it or adapt it.

## What This Does

Claude Code is powerful, but free-form conversation can go off the rails.
This tool installs a **9-step enforced development process** into your project's `.claude/` config, so the AI follows discipline instead of guessing.

Validated in a **21-module production system** over several months.

## Quick Start

```bash
npx create-vibe-workflow
```

Restart Claude Code after installation.

## The Skill Stack I Use

These are the tools/skills I combine in my actual workflow:

| Tool | What It Does | Install |
|------|-------------|---------|
| **gstack** | PR review / code quality checks / pre-ship checklist | [garrytan/gstack](https://github.com/garrytan/gstack) |
| **Superpowers** | TDD red-green-refactor / debugging tools / agent boost | [obra/superpowers](https://github.com/obra/superpowers) |
| **OpenSpec** | Spec-driven development / change tracking | [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) |
| **everything-claude-code** | Complete rule set / hooks / common commands | [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) |
| **This tool** | One-command installer for the above | see below |

> None of these are **required** — the core 9-step process works without them.
> But the full experience is much better with all of them enabled (which is how I run it).

### How I Combined These

These four projects are developed independently, and **some modules overlap or conflict** — for instance, multiple projects define Git commit conventions, code review rules, or TDD processes. Installing all of them raw would cause rule conflicts and inconsistent AI behavior.

Here's how I reconciled them:

- **gstack** as the backbone: PR review and pre-ship checklist
- **Superpowers** for TDD red-green-refactor and debugging
- **OpenSpec** for requirement spec (feeds into steps ①② of the 9-step process)
- Selected non-conflicting hooks and command templates from **everything-claude-code**

This tool (`create-vibe-workflow`) is the result of **deduplicating, resolving conflicts, and merging into one consistent config**.

> If you plan to mix these yourself, review each project's full content first — watch for rule-level conflicts.

## Commands

```bash
npx create-vibe-workflow              # Interactive install (merge mode)
npx create-vibe-workflow --overwrite  # Force overwrite
npx create-vibe-workflow --uninstall  # Clean up generated files
npx create-vibe-workflow --check      # Health check
```

## Contributing

PRs welcome — especially new tech stack adapters (Vue, Python, Go, etc.).

```bash
npm install
npm test
npm run build
```

## License

[MIT](./LICENSE)
