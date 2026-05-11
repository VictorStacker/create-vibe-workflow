# 开发工作流（9 层架构）

> 每层都有明确的负责工具，不重叠、不冲突。
> **superpowers 管思考，gstack 管执行，本工具管衔接。**

## 四工具分工

```
superpowers（大脑）    gstack（手脚）     本工具（衔接）
─────────────────    ───────────────    ─────────────
brainstorming         /office-hours     /opsx:propose
writing-plans         /browse + /qa     /opsx:explore
TDD + subagent-dev    /review + /cso    /opsx:archive
verification          /ship             todolist skill
systematic-debugging  /context-save     rules + memory
                       /careful /guard   hooks + 路由表
```

## 9 层完整链路

```
层1: 需求验证  → gstack /office-hours         "值不值得做？"
层2: 需求规格  → /opsx:propose                "做什么？"（人话，能审）
层3: 方案设计  → superpowers brainstorming    "怎么实现？"（方案对比）
层4: 计划拆分  → superpowers writing-plans    "拆成几步？"
层5: 进度追踪  → todolist-management skill    "做到哪了？断了能接上"
层6: 编码测试  → superpowers TDD + subagent   "实际干活"
层7: 浏览器验证 → gstack /browse + /qa        "看到真的页面"
层8: 审查安全  → gstack /review + /cso        "代码对不对？安全吗？"
层9: 发布归档  → gstack /ship → /opsx:archive "上线 + 记录"
```

## 路由裁决表

AI 遇到以下任务时，严格走指定工具，不得随机匹配：

| 任务 | 默认工具 | 备选 |
|------|---------|------|
| 验证需求/探讨想法 | `gstack /office-hours` | `/opsx:explore` |
| 把需求写成规格 | `/opsx:propose` | — |
| 方案设计/头脑风暴 | `superpowers brainstorming` | — |
| 写实施计划 | `superpowers writing-plans` | — |
| 生成/更新 todolist | `todolist-management` skill（自动） | — |
| 写代码 | `superpowers test-driven-development` | `subagent-driven-development` |
| 调试 bug | `superpowers systematic-debugging` | `/browse`（看真实页面） |
| 浏览器操作/QA | `gstack /browse` / `/qa` | — |
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

用户说"开始写代码"但当前阶段是层3时：
  ❌ 不能直接写 → ✅ 先完成层3 brainstorming → 更新 → 层4 writing-plans → 更新 → 层5 开始写
```

**为什么需要这个**：vibe coder 不懂技术流程，容易直接说"写代码"。阶段追踪确保 AI 不会因为用户跳过需求验证就写出没人要的东西。

## 各层详解

### 层1: 需求验证 — gstack /office-hours

**目的**：在投入时间之前，确认要解决的问题是真实存在的。

- YC 六问：用户现在怎么解决的？痛点有多深？最小切口是什么？
- 产出：决策记录（做/不做/最小实验）
- **跳过条件**：纯技术任务（Bug修复、重构、依赖升级）

### 层2: 需求规格 — /opsx:propose

**目的**：把模糊想法变成人话文档，vibe coder 能看懂、能审。

- 产出：`openspec/changes/<name>/` 目录下的 proposal.md + design.md + tasks.md
- 写的是**做什么、为什么做**，不是技术实现细节
- **跳过条件**：单文件小修小改（<50行）

### 层3: 方案设计 — superpowers brainstorming

**目的**：2-3 种方案对比，选最优路径。

- 一次只问一个问题，不轰炸
- 产出设计文档到 `docs/superpowers/specs/`
- **HARD GATE**: 设计批准前不写任何代码

### 层4: 计划拆分 — superpowers writing-plans

**目的**：把设计拆成 bite-size 任务。

- 每个任务 2-5 分钟可完成
- 每个任务有明确的文件路径和验证命令
- 完成后自动触发 todolist-management skill 生成 `todolist.md`

### 层5: 进度追踪 — todolist-management skill

**目的**：保证会话中断后能无缝恢复，代码不会跑偏。

- writing-plans 完成后自动生成 `todolist.md`（P0/P1 checkbox 格式）
- 每个任务完成后自动标记 `[x]`
- 新会话启动时自动读取未完成任务
- P0 不超过 7 个

### 层6: 编码测试 — superpowers TDD + subagent-driven-development

**目的**：RED → GREEN → REFACTOR，有测试的代码。

- 铁律：没有失败测试前不写实现代码
- subagent-drive-development 派独立子代理执行每个任务
- 每个子代理完成后自动触发代码审查

### 层7: 浏览器验证 — gstack /browse + /qa

**目的**：看到真实页面，不是凭空说"应该没问题"。

- `/browse` 打开真实 Chromium，截图验证
- `/qa` 端到端测试，发现 bug 自动修
- 非前端项目可跳过

### 层8: 审查安全 — gstack /review + /cso

**目的**：独立审查，发现作者视角看不见的问题。

- `/review`: SQL 安全性、信任边界、副作用、错误处理
- `/cso`: 密钥考古、供应链、OWASP Top 10
- `/cso` 仅在 auth/finance/system 模块触发

### 层9: 发布归档 — gstack /ship → /opsx:archive

**目的**：标准化发布 + 结构化归档。

- `/ship`: 自动 merge base → test → review → bump → changelog → push → PR
- `/opsx:archive`: 变更移至 `archive/YYYY-MM-DD-<name>/`

## 会话恢复流程

当用户说"继续"、"接着做"、"继续上次的"：

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
