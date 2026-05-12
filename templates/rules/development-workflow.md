# 开发工作流（9 层架构）

> 每层都有明确的负责工具，不重叠、不冲突。
> **superpowers 管思考，gstack 管执行，本工具管衔接，Matt Pocock 技能管追问。**

## 五工具分工

> 基于以下开源项目：superpowers (Jesse Vincent) · gstack (Garry Tan) · OpenSpec (Fission AI) · ECC (Affaan Mustafa) · mattpocock-skills (Matt Pocock)

```
superpowers（大脑）    gstack（手脚）     本工具（衔接）       Matt Pocock（补充）
─────────────────    ───────────────    ─────────────       ─────────────────
brainstorming         /office-hours     /opsx:propose        grill-me（追问）
writing-plans         /browse + /qa     /opsx:explore        to-prd（对话→PRD）
TDD + subagent-dev    /review + /cso    /opsx:archive        caveman（精简）
verification          /ship             todolist skill       diagnose（调试）
systematic-debugging  /context-save     architecture-gate    improve-arch（重构）
                       /careful /guard   rules + memory       grill-with-docs
                                        hooks + 路由表
```

## 9 层完整链路

```
层1: 需求验证  → /office-hours                  "值不值得做？"
层2: 想法追问  → grill-me                       "具体怎么做？问清楚"
层3: 需求规格  → /opsx:propose                  "写成规格文档"
层4: 方案设计  → superpowers brainstorming      "技术怎么实现？"
层5: 计划拆分  → superpowers writing-plans      "拆成几步？"
层6: 编码测试  → superpowers TDD + subagent     "实际干活"
       🚧 TDD 铁律：写代码前必加载 TDD skill
层7: 浏览器验证 → gstack /browse + /qa          "看到真的页面"
层8: 审查安全  → arch-gate → /review → /cso     "架构还对吗？代码呢？安全吗？"
       🚧 提交前总闸：6 项检查清单全通过才能 commit/ship
层9: 发布归档  → gstack /ship → /opsx:archive    "上线 + 记录"
```

### 层1-3 详解：需求澄清三步走

这是 vibe coder 最容易踩坑的阶段——需求不清晰就直接写代码，做出来没人要。

```
/office-hours          grill-me               /opsx:propose
"这需求真的存在吗？"    "具体长什么样？"       "写成文档，锁定"
     ↓                      ↓                      ↓
 验证真伪                 追问细节               结构化输出
 最小切口                 边界情况               proposal.md
 用户痛点                 优先级排序             design.md
                         约束条件               tasks.md
```

**三个步骤问的问题性质不同，不能合并：**
- /office-hours 问**市场问题**（有没有人需要？最小切口是什么？）
- grill-me 问**产品问题**（具体怎么做？边界情况？优先级？）
- /opsx:propose 做**文档化**（把答案写成规格，锁定基线）

合并成一步会让 AI 同时处理市场验证和产品设计——两个视角打架，哪个都做不好。

## 路由裁决表

| 任务 | 默认工具 | 备选 |
|------|---------|------|
| 验证需求/探讨想法 | `gstack /office-hours` | `/opsx:explore` |
| 追问需求细节 | `grill-me` skill（自动） | — |
| 对话整理成 PRD | `to-prd` skill | — |
| 把需求写成规格 | `/opsx:propose` | — |
| 方案设计/头脑风暴 | `superpowers brainstorming` | — |
| 写实施计划 | `superpowers writing-plans` | — |
| 生成/更新 todolist | `todolist-management` skill（自动） | — |
| 写代码 | `superpowers test-driven-development` | `subagent-driven-development` |
| 调试 bug | `superpowers systematic-debugging` | `/browse`（看真实页面） |
| 浏览器操作/QA | `gstack /browse` / `/qa` | — |
| 架构一致性检查 | `architecture-gate` skill（自动） | — |
| 代码审查 | `gstack /review` | — |
| 安全审查 | `gstack /cso` | — |
| 完成前自检 | `superpowers verification-before-completion` | — |
| 收尾分支 | `superpowers finishing-a-development-branch` | — |
| 发布 | `gstack /ship` | — |
| 归档 | `/opsx:archive` | — |
| 保存进度 | `gstack /context-save` | — |
| 恢复进度 | `gstack /context-restore` + 读 `todolist.md` | — |
| 危险操作防护 | `gstack /careful` / `/guard` | — |

## 阶段强制执行机制

**todolist.md 的"阶段追踪"区块是唯一的进度权威来源。**

```
每次对话开始时（铁律）：
  ① 读 todolist.md
  ② 找到"当前阶段"行（标记 ← 当前 的那行）
  ③ 从该阶段开始，禁止跳到下层
  ④ 阶段完成 → 勾选 [] → [x] → 更新"当前阶段" → 继续下层
```

## 各层详解

### 层1: 需求验证 — gstack /office-hours

**目的**：在投入时间之前，确认要解决的问题是真实存在的。

- YC 六问：用户现在怎么解决的？痛点有多深？最小切口是什么？
- 产出：决策记录（做/不做/最小实验）
- **跳过条件**：纯技术任务（Bug修复、重构、依赖升级）

### 层2: 想法追问 — grill-me skill

**目的**：把模糊想法追问成具体需求，在写规格前问清楚。

- 逐层深入，一次一个问题，不轰炸
- 追问维度：功能范围、用户角色、边界情况、优先级、约束条件
- 产出：结构化需求总结（P0/P1/边界情况/待确认）
- **自动触发**：/office-hours 确认值得做之后，/opsx:propose 之前

### 层3: 需求规格 — /opsx:propose

**目的**：把追问清楚的需求写成结构化文档，vibe coder 能看懂、能审。

- 产出：`openspec/changes/<name>/` 目录下的 proposal.md + design.md + tasks.md
- 写的是**做什么、为什么做**，不是技术实现细节
- 可选：to-prd skill 自动整理对话内容为 PRD
- **跳过条件**：单文件小修小改（<50行）

### 层4: 方案设计 — superpowers brainstorming

**目的**：2-3 种技术方案对比，选最优路径。

- 一次只问一个问题
- 产出设计文档到 `docs/superpowers/specs/`
- **HARD GATE**: 设计批准前不写任何代码

### 层5: 计划拆分 — superpowers writing-plans

**目的**：把设计拆成 bite-size 任务。

- 每个任务 2-5 分钟可完成
- 每个任务有明确的文件路径和验证命令
- 完成后自动触发 todolist-management skill 生成 `todolist.md`

### 层6: 编码测试 — superpowers TDD + subagent-driven-development

**目的**：RED → GREEN → REFACTOR，有测试的代码。

> **铁律：实现任何 OpenSpec 任务前，必须先调用 `superpowers:test-driven-development` skill。**
> 禁止直接写实现代码——先有测试，后有实现。此规则不可跳过、不可推迟、不可"先写完再补"。

**触发条件** — agent 看到以下任一种话术时，必须先加载 TDD skill：
- "实现任务 N"、"完成 XXX 功能"、"开始写代码"、"加一个 XX 方法/类/模块"
- 任何会产出 `.ts`/`.tsx`/`.js`/`.py`/`.go` 等实现文件的动作

**agent 自检** — 每次要写实现代码前，问自己：
> "我当前是否已加载 TDD skill？" → 没加载 = 立即调用 `Skill` 工具加载

- 铁律：没有失败测试前不写实现代码
- subagent-driven-development 派独立子代理执行每个任务

### 层7: 浏览器验证 — gstack /browse + /qa

**目的**：看到真实页面，不是凭空说"应该没问题"。

- `/browse` 打开真实 Chromium，截图验证
- `/qa` 端到端测试，发现 bug 自动修
- 非前端项目可跳过

### 层8: 审查安全 — architecture-gate → /review → /cso

**目的**：三层审查，从架构到代码到安全，逐层收紧。

- **8a architecture-gate**: 模块边界 / 依赖方向 / 模式一致性（三问检查）
- **8b /review**: SQL 安全性、信任边界、副作用、错误处理
- **8c /cso**: 密钥考古、供应链、OWASP Top 10（仅 auth/finance/system 模块）

### 🚧 提交前强制检查清单（总闸）

> **铁律：执行 git commit 或 /ship 发布前，必须逐项确认以下清单，全部通过才能提交。**
> 缺一项补一项，不可跳过、不可推迟、不可"先提交再补"。

**触发条件** — agent 看到以下任一种话术或动作时，必须先过清单：
- "提交"、"commit"、"发布"、"/ship"、"push"、"创建 PR"
- 任何会产出 git commit 的操作

**agent 自检** — 每次要执行 git commit 或 /ship 前，逐项确认：

| # | 检查项 | 通过标准 | 未通过时 |
|---|--------|----------|----------|
| 1 | TDD | TDD skill 已加载 + 测试通过 + 覆盖率 ≥80% | 先跑 TDD 流程 |
| 2 | 代码审查 | `/review` 已通过 + 无 CRITICAL 问题 | 立即运行 `/review` |
| 3 | 架构检查 | `architecture-gate` skill 已通过 | 立即运行 `architecture-gate` |
| 4 | 安全审查 | `/cso` 已通过（仅 auth/finance/system 模块） | 立即运行 `/cso` |
| 5 | 文档反写 | 改了什么文档就同步了什么 | 补文档 |
| 6 | 进度追踪 | `todolist.md` 中对应任务已勾选 | 更新 todolist |

> **全部通过 = 可以提交。任何一项未通过 = 先补该项，再重新检查。**

### 层9: 发布归档 — gstack /ship → /opsx:archive

**目的**：标准化发布 + 结构化归档。

- `/ship`: 自动 merge base → test → review → bump → changelog → push → PR
- `/opsx:archive`: 变更移至 `archive/YYYY-MM-DD-<name>/`

## 会话恢复流程

1. 读 `todolist.md` — 找到第一个未勾选的 P0 任务
2. 读 `git log -1` — 确认上次提交状态
3. 运行 `gstack /context-restore` — 恢复上次上下文（如果有）
4. 从第一个未完成 P0 开始继续

## 经验反写触发规则

| 触发条件 | 写入位置 |
|----------|----------|
| 遇到报错并解决 | `memory/troubleshooting.md` |
| 发现项目特有模式 | `memory/dev-notes.md` |
| 用户确认"功能正确了" | `.claude/skills/{project}-{topic}/SKILL.md` |
| 技术决策变更 | `memory/MEMORY.md` |
