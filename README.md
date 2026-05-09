# Create Vibe Workflow

[English](#english) | **中文**

> 我在实际项目中验证过的 Claude Code 完整工作流配置。一条命令安装全部：规则 + 技能 + 命令 + 记忆系统。
> 面向非专业编程人员——用自然语言写代码。

---

## 我的工作流怎么来的

我用这套配置开发了完整的生产系统（21 个业务模块，生产运行数月）。

四个开源项目各自独立开发，部分模块存在重叠冲突。我做了以下整合：

- 以 **gstack** 为主干（PR 审查 / 发布流程 / 安全审计）
- 用 **Superpowers** 补充（TDD 纪律 / 方案探索 / 验证）
- 用 **OpenSpec** 管需求（规格化 / 任务拆解 / 变更归档）
- 从 **everything-claude-code** 中选取规则模板和 hooks

**去重、消冲突、整合成一套一致配置**——就是本工具。

---

## 快速开始

```bash
npx create-vibe-workflow
```

交互式问答 → 重启 Claude Code → 全部生效。

| 参数 | 说明 |
|------|------|
| （无） | 交互式安装（检测已有配置自动合并） |
| `--overwrite` | 强制覆盖已有配置 |
| `--uninstall` | 按安装清单清理所有生成文件 |
| `--check` | 健康检查：列出每个文件状态 |

---

## 安装后生成的文件

```
你的项目/
├── .claude/
│   ├── rules/                              ← 10 个规则文件
│   │   ├── development-workflow.md         # 9步流程 + 命令对应表
│   │   ├── coding-style.md                 # 编码规范
│   │   ├── git-workflow.md                 # Git 提交规范
│   │   ├── agents.md                       # Agent 编排指南
│   │   ├── security.md                     # 安全检查清单
│   │   ├── testing.md                      # 测试规范（TDD）
│   │   ├── patterns.md                     # 设计模式
│   │   ├── performance.md                  # 性能优化指南
│   │   ├── hooks.md                        # Hook 配置指南
│   │   └── memory.md                       # 记忆系统使用规则
│   ├── skills/                             ← 16 个技能（按项目领域筛选）
│   │   ├── tdd-workflow/                   # TDD 红绿重构
│   │   ├── verification-loop/              # 6 阶段验证
│   │   ├── security-review/                # 安全检查
│   │   ├── coding-standards/               # 编码标准
│   │   ├── search-first/                   # 先搜索再编码
│   │   ├── strategic-compact/              # 策略压缩
│   │   ├── frontend-patterns/              # 前端通用模式
│   │   ├── backend-patterns/               # 后端通用模式
│   │   ├── postgres-patterns/              # PostgreSQL 模式
│   │   ├── database-migrations/            # 数据库迁移
│   │   ├── e2e-testing/                    # E2E 测试
│   │   ├── docker-patterns/                # Docker 模式
│   │   ├── deployment-patterns/            # 部署策略
│   │   ├── caveman/                        # 极简沟通（专业开发者）
│   │   ├── diagnose/                       # 诊断循环（专业开发者）
│   │   ├── improve-codebase-architecture/  # 架构审计（专业开发者）
│   │   └── grill-with-docs/                # 文档审查（专业开发者）
│   ├── commands/                           ← 12 个命令（4 个来源）
│   │   ├── gstack/                         # office-hours / review / cso / ship
│   │   ├── opsx/                           # propose / apply / archive / explore
│   │   ├── superpowers/                    # brainstorm / tdd / verify
│   │   └── workflow/                       # plan
│   ├── memory/                             ← 记忆系统
│   │   ├── MEMORY.md                       # 4 类型记忆索引
│   │   ├── dev-notes.md                    # 开发笔记
│   │   └── troubleshooting.md              # 故障排除记录
│   ├── hooks/
│   │   ├── post-commit-check.js            # 提交后文档反写提醒
│   │   └── check-deps.mjs                  # 依赖组件检测
│   ├── settings.json                       # 工作流配置 + hooks
│   ├── skills-lock.json                    # 外部技能版本锁定
│   └── skills.recommend.json              # 技术栈推荐技能
└── CLAUDE.md                               ← AI 协作配置
```

---

## 9 步开发流程 + 对应命令

| 步骤 | 名称 | 命令 | 可跳过？ |
|------|------|------|----------|
| ①-a | 需求验证 | `/office-hours` | 仅纯技术任务 |
| ①-b | 需求规格化 | `/opsx:propose` | 仅纯技术任务 |
| ①-c | 方案探索 | `/brainstorm` | 明确方案时 |
| ② | 计划拆分 | `/plan` | <50行小修改 |
| ③ | 研究复用 | search-first skill | 已有明确模式 |
| ④ | TodoList | 手动确认 | **不可跳过** |
| ⑤-a | TDD 开发 | `/tdd` | **不可跳过** |
| ⑤-b | 完成验证 | `/verify` | **不可跳过** |
| ⑥ | 代码审查 | `/review` | 仅文档变更 |
| ⑦ | 安全审查 | `/cso` | 非敏感模块 |
| ⑧ | 文档反写 | post-commit hook | **不可跳过** |
| ⑨-a | 发布 | `/ship` | **不可跳过** |
| ⑨-b | 归档 | `/opsx:archive` | **不可跳过** |

---

## 我用的技能组合

这些是本工具依赖的外部项目（安装后 Claude Code 会提示缺少的组件）：

| 工具 | 用途 | 安装 |
|------|------|------|
| **gstack** | PR 审查 / 安全审计 / 发布流程 / 需求验证 | [garrytan/gstack](https://github.com/garrytan/gstack) |
| **Superpowers** | TDD 纪律 / 方案探索 / 验证循环 | [obra/superpowers](https://github.com/obra/superpowers) |
| **OpenSpec** | 需求规格化 / 变更追踪 | [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) |
| **everything-claude-code** | 规则模板 / hooks 基础 | [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) |
| **本工具** | 一键安装上述整合配置 | 见下方 |

> 以上外部组件**不强制安装**也能用——核心流程和命令都是独立实现的。

---

## 命令说明

本工具生成的 12 个命令分为四组：

**需求 & 规划（5 个）**

| 命令 | 用途 |
|------|------|
| `/office-hours` | 验证需求：值不值得做、最小切口是什么 |
| `/opsx:propose` | 规格化：proposal + design + tasks |
| `/brainstorm` | 方案探索：2-3 方案对比、设计文档 |
| `/plan` | 计划拆分：P0/P1 子任务、todolist.md |
| `/opsx:explore` | 探索模式：随时思考、不写代码 |

**开发 & 验证（2 个）**

| 命令 | 用途 |
|------|------|
| `/tdd` | TDD 执行：RED→GREEN→REFACTOR |
| `/verify` | 完成前验证：编译→测试→lint→安全→diff |

**审查 & 安全（2 个）**

| 命令 | 用途 |
|------|------|
| `/review` | 代码审查：SQL/信任边界/副作用/错误处理 |
| `/cso` | 安全审计：密钥/供应链/CI/CD/OWASP/STRIDE |

**发布 & 归档（3 个）**

| 命令 | 用途 |
|------|------|
| `/ship` | 发布：merge→verify→review→version→PR |
| `/opsx:apply` | 实现：逐任务执行并标记完成 |
| `/opsx:archive` | 归档：变更移至 archive/ |

---

## 交互流程

安装时依次回答：

```
① 项目名称
② 项目类型？（网页 / API / 全栈 / 不确定）
③ 主要语言？（TypeScript / Python / Go / ...）
④ 需要数据库吗？
⑤ 编程经验？（Vibe Coder / 专业开发者）
⑥ 确认技能包（可调整勾选）
```

技能包按项目类型自动推荐，也可手动选择：

| 领域 | 何时推荐 | 包含技能 |
|------|---------|---------|
| 工作流核心 | 始终 | 6 个（tdd/verify/security/coding/search/compact） |
| 前端开发 | 网页/全栈 | 1 个（frontend-patterns，框架无关） |
| 后端开发 | API/全栈 | 1 个（backend-patterns，框架无关） |
| 数据库 | 有 DB | 2 个（postgres/migrations） |
| 测试 | 所有类型 | 1 个（e2e-testing） |
| DevOps | 手动勾选 | 2 个（docker/deployment） |
| 进阶 | 专业开发者 | 4 个（caveman/diagnose/architecture/grill-docs） |

---

## 记忆系统

整合四项目的记忆机制，分三层：

| 层级 | 机制 | 触发 |
|------|------|------|
| L1 工作记忆 | `/context-save` → `/context-restore` | 手动 |
| L2 项目记忆 | 4 类 memory 文件（user/feedback/project/reference） | AI 自动判断 |
| L3 变更归档 | `openspec/changes/archive/` 时间线 | 功能完成时 |

---

## 开发

```bash
npm install
npm test           # vitest 单元测试
npm run build      # tsc + copy-assets
npm run dev        # tsx 直接运行
```

---

## License

[MIT](./LICENSE)

---

<a name="english"></a>

# Create Vibe Workflow

**[中文](#)** | English

> Battle-tested Claude Code workflow config I use in production. One command installs everything: rules + skills + commands + memory system.

## What This Does

Claude Code is powerful, but free-form conversation goes off the rails. This tool installs a **9-step enforced development process** with **16 curated skills**, **12 workflow commands**, and a **three-layer memory system** — into your project's `.claude/` config.

Validated in a **21-module production system** over several months.

## Quick Start

```bash
npx create-vibe-workflow
```

Restart Claude Code after installation.

## The 9-Step Workflow

| Step | Command | Skip? |
|------|---------|-------|
| ①-a Validate | `/office-hours` | Tech tasks only |
| ①-b Specify | `/opsx:propose` | Tech tasks only |
| ①-c Design | `/brainstorm` | When clear |
| ② Plan | `/plan` | <50 line changes |
| ⑤-a TDD | `/tdd` | **Never** |
| ⑤-b Verify | `/verify` | **Never** |
| ⑥ Review | `/review` | Doc-only changes |
| ⑦ Security | `/cso` | Non-sensitive |
| ⑧ Doc sync | post-commit hook | **Never** |
| ⑨-a Ship | `/ship` | **Never** |
| ⑨-b Archive | `/opsx:archive` | **Never** |

## The Skill Stack

| Tool | Role |
|------|------|
| **gstack** | PR review / security / ship / office-hours |
| **Superpowers** | TDD / brainstorm / verify |
| **OpenSpec** | Spec-driven dev / change tracking |
| **everything-claude-code** | Rule templates / hooks |
| **This tool** | One-command installer |

None are required — core workflows are standalone.

## Commands

```bash
npx create-vibe-workflow              # Interactive install (merge mode)
npx create-vibe-workflow --overwrite  # Force overwrite
npx create-vibe-workflow --uninstall  # Clean up generated files
npx create-vibe-workflow --check      # Health check
```

## Contributing

PRs welcome.

```bash
npm install && npm test && npm run build
```

## License

[MIT](./LICENSE)
