# Create Vibe Workflow

> 我在生产系统（21 个业务模块、数月稳定运行）中验证过的 Claude Code 工作流。
> 一条命令安装。面向非专业编程人员——用自然语言写代码。

---

## 为什么做这个

装了十几个 Claude Code 插件后，发现它们功能严重重叠——写计划有四五个 skill 在抢，做代码审查有三个版本，调试模式两套并行。结果每次启动随机匹配一个 skill，行为完全不可复现。

仔细审查五个核心项目（superpowers、gstack、OpenSpec、ECC、Matt Pocock skills）后发现：**它们各管一层，互不重叠，但需要一个人来做"衔接"**——写路由表让它们不打架，提取规则让它们有纪律，补充独有能力让流程完整。

这就是本工具的定位：**不做插件的插件，做插件之间的胶水。**

---

## 一分钟上手

```bash
npx create-vibe-workflow       # 终端运行
# 重启 Claude Code → 自动检测缺失组件 → 粘贴安装命令 → 完成
```

| 参数 | 说明 |
|------|------|
| （无） | 交互式安装 |
| `--overwrite` | 强制覆盖 |
| `--uninstall` | 清理所有生成文件 |
| `--check` | 健康检查 |
| `--codex` | 生成 Codex CLI 配置 |

---

## 设计思路：五个工具，九层架构

### 取舍逻辑

| 工具 | 定位 | 我们取什么 | 我们不要什么 |
|------|------|-----------|-------------|
| **superpowers** | 大脑（怎么想） | 14 个 skill — 全部保留 | 不重复造替代品 |
| **gstack** | 手脚（怎么干） | 45 个命令 — 全部保留 | 不写山寨版 |
| **OpenSpec** | 规格化语言 | 变更追踪格式 + archive 命令 | 不装 CLI，不套外壳 |
| **ECC** | 基础设施 | rules + hooks 精华 | 不装 ECC，好东西已提取 |
| **Matt Pocock** | 追问+诊断 | grill-me / to-prd / caveman / diagnose | 不装完整仓库，只提取 6 个精华 skill |

核心原则：**插件不在多，在配合。更少的组件，更清晰的边界。**

### 九层架构

```
层1: 需求验证  → /office-hours                  "值不值得做？"
层2: 想法追问  → grill-me                       "具体怎么做？问清楚"
层3: 需求规格  → /opsx:propose                  "写成规格"
层4: 计划拆分  → superpowers writing-plans     "拆成几步？"
层5: 进度追踪  → todolist-management（自动）   "做到哪了？断了能接上"
层6: 编码测试  → superpowers TDD + subagent    "实际干活"
层7: 浏览器验证 → gstack /browse + /qa         "看到真的页面"
层8: 审查安全  → arch-gate → /review → /cso    "架构还对不对？代码呢？安全吗？"
层9: 发布归档  → gstack /ship → /opsx:archive  "上线 + 记录"
```

每层一个负责方，不重叠，不冲突。superpowers 和 gstack 像接力赛一样交替工作。

---

## 安装后生成的文件

```
你的项目/
├── .claude/
│   ├── rules/                              ← 10 个规则
│   │   ├── development-workflow.md         # 9 层架构 + 路由裁决表
│   │   ├── coding-style.md                 # 编码规范
│   │   ├── git-workflow.md                 # Git 提交规范
│   │   ├── agents.md                       # Agent 编排
│   │   ├── security.md                     # 安全检查清单
│   │   ├── testing.md                      # 测试规范（TDD）
│   │   ├── patterns.md                     # 设计模式
│   │   ├── performance.md                  # 性能优化
│   │   ├── hooks.md                        # Hook 配置
│   │   └── memory.md                       # 记忆系统规则
│   ├── skills/                             ← 18 个领域技能
│   │   ├── tdd-workflow/                   # TDD 红绿重构
│   │   ├── verification-loop/              # 6 阶段验证
│   │   ├── architecture-gate/              # 架构一致性检查
│   │   ├── todolist-management/            # 进度追踪 + 中断恢复
│   │   ├── security-review/                # 安全检查
│   │   ├── coding-standards/               # 编码标准
│   │   ├── search-first/                   # 先搜索再编码
│   │   ├── strategic-compact/              # 策略压缩
│   │   ├── frontend-patterns/              # 前端模式（框架无关）
│   │   ├── backend-patterns/               # 后端模式（框架无关）
│   │   ├── postgres-patterns/              # PostgreSQL 模式
│   │   ├── database-migrations/            # 安全迁移
│   │   ├── e2e-testing/                    # E2E 测试
│   │   ├── docker-patterns/                # Docker 模式
│   │   ├── deployment-patterns/            # 部署策略
│   │   ├── caveman/                        # 极简沟通
│   │   ├── diagnose/                       # 诊断循环
│   │   ├── improve-codebase-architecture/  # 架构审计
│   │   └── grill-with-docs/                # 文档审查
│   ├── commands/opsx/                      ← 3 个衔接命令
│   │   ├── propose.md                      # 人话规格（vibe coder 能审）
│   │   ├── explore.md                      # 只读探索模式
│   │   └── archive.md                      # 结构化变更归档
│   ├── memory/                             ← 三层记忆系统
│   │   ├── MEMORY.md                       # 4 类型记忆索引
│   │   ├── dev-notes.md                    # 开发笔记
│   │   └── troubleshooting.md              # 故障排除
│   ├── hooks/
│   │   ├── post-commit-check.js            # 文档反写提醒
│   │   └── check-deps.mjs                  # 自动检测 + 安装指引
│   ├── settings.json                       # 工作流配置 + hooks
│   ├── skills-lock.json                    # 外部技能版本锁定
│   └── skills.recommend.json               # 技术栈推荐技能
└── CLAUDE.md                               ← AI 协作配置 + 路由裁决表
```

---

## 交互流程

```
① 项目名称
② 项目类型？（网页 / API / 全栈 / 不确定）
③ 主要语言？（TypeScript / Python / Go / ...）
④ 需要数据库吗？
⑤ 编程经验？（Vibe Coder / 专业开发者）
⑥ 确认技能包（按类型自动推荐，可调整）
```

| 领域 | 推荐条件 | 技能数 |
|------|---------|--------|
| 工作流核心 | 始终 | 7 个 |
| 前端开发 | 网页/全栈 | 1 个（框架无关） |
| 后端开发 | API/全栈 | 1 个（框架无关） |
| 数据库 | 有 DB | 2 个 |
| 测试 | 所有类型 | 1 个 |
| DevOps | 手动勾选 | 2 个 |
| 进阶 | 专业开发者 | 4 个 |

---

## 路由裁决表

AI 遇到以下任务时，严格走指定工具：

| 任务 | 工具 |
|------|------|
| 验证需求 | `gstack /office-hours` |
| 追问细节 | `grill-me` skill |
| 对话→PRD | `to-prd` skill |
| 写成规格 | `/opsx:propose` |
| 方案设计 / 头脑风暴 | `superpowers brainstorming` |
| 写实施计划 | `superpowers writing-plans` |
| 进度追踪（自动） | `todolist-management` skill |
| 写代码（TDD） | `superpowers test-driven-development` |
| 调试 bug | `superpowers systematic-debugging` |
| 浏览器操作 / QA | `gstack /browse` / `/qa` |
| 架构一致性（自动） | `architecture-gate` skill |
| 代码审查 | `gstack /review` |
| 安全审查 | `gstack /cso` |
| 完成前自检 | `superpowers verification-before-completion` |
| 收尾分支 | `superpowers finishing-a-development-branch` |
| 发布 | `gstack /ship` |
| 归档 | `/opsx:archive` |
| 保存 / 恢复进度 | `gstack /context-save` / `/context-restore` |
| 危险操作防护 | `gstack /careful` / `/guard` |

---

## todolist：中断恢复机制

todolist-management skill 自动在 `writing-plans` 完成后生成 `todolist.md`：

- P0/P1 checkbox 格式，P0 不超过 7 个
- 每个任务完成自动勾选
- 新会话启动自动读取未完成任务
- 会话中断后无缝接着做

这是 superpowers 和 gstack 都没做好的事。

---

## 记忆系统

| 层级 | 来源 | 机制 |
|------|------|------|
| L1 工作记忆 | gstack | `/context-save` → `/context-restore` |
| L2 项目记忆 | Superpowers | 4 类 frontmatter（user/feedback/project/reference） |
| L3 变更归档 | OpenSpec | `openspec/changes/archive/` 时间线 |

---

## 核心原则

1. **流程归 superpowers** — brainstorming、plan、TDD、verify、debug
2. **执行归 gstack** — browser、QA、review、cso、ship、护栏
3. **独立 reviewer 通道** — 作者和审查者绝不在同一上下文互评
4. **证据优先** — 声明完成前必须有可验证的证据
5. **遇到歧义先 brainstorm** — 花 5 分钟理清需求，省 5 小时返工
6. **会话恢复先读 todolist** — 新会话第一件事检查 `todolist.md`

---

## 支持的技术栈和工具

| 维度 | 选项 |
|------|------|
| Claude Code | 默认输出 |
| Codex CLI | `--codex` 标志 |
| NestJS + Next.js | 全栈模板 |
| Next.js only | 纯前端模板 |
| Node.js API | 纯后端模板 |
| TypeScript / Python / Go / Rust / Java | 语言适配 |

---

## 开发

```bash
npm install
npm test           # vitest
npm run build      # tsc + copy-assets
npm run dev        # tsx 直接运行
```

## License

[MIT](./LICENSE)
