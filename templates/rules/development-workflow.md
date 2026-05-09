# 开发工作流（9 步完整流程）

> 每个环节都必须执行（除非标注了跳过条件）。
> **完成标志 = 该环节产出的可验证产物**，没有产物 = 没做完。

## 完整链路（含命令对应）

```
① 需求澄清  📋 /office-hours → /opsx:propose → /brainstorm
② 计划拆分  📐 /plan
③ 研究复用  🔍 search-first skill
④ TodoList   📝 手写 todolist.md
⑤ TDD开发   🧪 /tdd → 完成时 /verify
⑥ 代码审查  🔎 /review
⑦ 安全审查  🛡️ /cso
⑧ 文档反写  📄 每 commit 后检查 (post-commit hook)
⑨ 提交归档  🚀 /ship → /opsx:archive
```

## 命令速查

| 步骤 | 命令 | 用途 | 来源 |
|------|------|------|------|
| ①-a | `/office-hours` | 需求验证：值不值得做、最小切口 | gstack |
| ①-b | `/opsx:propose` | 需求规格化：proposal + design + tasks | OpenSpec |
| ①-c | `/brainstorm` | 方案探索：多方案对比、设计文档 | Superpowers |
| ② | `/plan` | 计划拆分：P0/P1 子任务、写入 todolist.md | — |
| ③ | (search-first skill) | 研究复用：GitHub/npm/Context7 搜索 | — |
| ④ | (手动) | TodoList 编写 | — |
| ⑤-a | `/tdd` | TDD 执行：RED→GREEN→REFACTOR | Superpowers |
| ⑤-b | `/verify` | 完成前验证：编译/测试/lint/安全扫描/diff | Superpowers |
| ⑥ | `/review` | 代码审查：SQL/信任边界/副作用/错误处理 | gstack |
| ⑦ | `/cso` | 安全审查：密钥/供应链/CI/CD/OWASP/STRIDE | gstack |
| ⑧ | (post-commit hook) | 文档反写提醒 | — |
| ⑨-a | `/ship` | 发布：merge→test→review→version→PR | gstack |
| ⑨-b | `/opsx:archive` | 归档：变更移至 archive/ | OpenSpec |

> 命令是独立的 markdown 文件，位于 `.claude/commands/` 目录，重启 Claude Code 后即可使用。

## 开发前必读文档

| 顺序 | 文档 | 提取什么 |
|------|------|----------|
| 1 | `docs/PRD.md` | 用户故事 + 验收标准 + P0/P1 划分 |
| 2 | `docs/database-schema.md` | 表结构 + FK + 枚举 + 约束（有数据库时） |
| 3 | `docs/api-design.md` | 端点 + 请求/响应格式 + 权限（有 API 时） |
| 4 | `docs/security.md` | 权限矩阵（有认证时） |
| 5 | `docs/ui-ux-spec.md` | 页面线框图 + 组件规范（有前端时） |
| 6 | 相邻已完成模块代码 | 复用实现模式 |

缺少信息？**先补设计文档，再写代码。**

---

## 各环节

### ① 需求澄清

```
/office-hours → 验证需求 → /opsx:propose → 规格化 → /brainstorm → 方案设计
```

- **动作**: 先验证需求合理性（/office-hours），再结构化规格（/opsx:propose），最后设计技术方案（/brainstorm）
- **新功能必须走完整三步**：验证 → 规格 → 方案
- **/office-hours**: 用六个强制性问题验证需求真伪——用户现在怎么解决的？痛点有多深？最小切口是什么？
- **/opsx:propose**: 产出 proposal.md（做什么+为什么）、design.md（怎么做）、tasks.md（任务清单）
- **/brainstorm**: 探索 2-3 种方案、选最佳路径、写设计文档
- ✅ **完成标志**: 设计文档已提交 + 明确了做什么/不做什么/P0P1 划分
- **跳过条件**: 纯技术任务（重构、升级依赖等），可直接从 /plan 开始

### ② 计划拆分

```
/plan → todolist.md
```

- **动作**: 将设计文档拆分为可独立提交的子任务（每个 50-300 行）
- **P0 优先策略**: 新模块只先实现 P0，P1 完整列出放"后续"区
- **/plan** 命令自动生成 todolist.md，每个子任务对应一个独立 commit
- ✅ **完成标志**: todolist.md 已更新，每个子任务对应一个 commit
- **跳过条件**: 单文件小修改（<50 行）

### ③ 研究复用
- **动作**: GitHub code search → npm → 项目内相邻模块代码
- **search-first skill** 提供结构化搜索流程：并行搜索 → 评估（复用/扩展/组合/自建）→ 决定
- ✅ **完成标志**: 确认了实现模式（复用现有 or 新写）
- **跳过条件**: 已有明确模式可复用

### ④ TodoList 编写
- **动作**: 将子任务写入 `todolist.md`（若 /plan 已生成则确认）
- **粒度**: 一个子任务 = 一个可独立 commit 的变更
- ✅ **完成标志**: `todolist.md` 已更新，包含所有 P0 + P1 任务
- **不可跳过**

### ⑤ TDD 开发

```
/tdd (循环) → 所有任务完成 → /verify (一次性)
```

- **动作**: RED → GREEN → REFACTOR，覆盖率 ≥80%
- **/tdd** 命令强制执行 TDD 纪律：先写失败测试 → 最简实现 → 重构
- **按任务清单逐项实现**，每完成一项标记 done
- **所有 P0 任务完成后**，运行 `/verify`：编译→类型检查→Lint→测试→安全扫描→Diff 审查
- ✅ **完成标志**: /verify 全部通过 + 覆盖率 ≥80%
- **不可跳过**
> 完整 TDD 工作流（含测试文件组织 / 命名规范 / 反模式）见 `.claude/rules/testing.md`

### ⑥ 代码审查

```
/review
```

- **动作**: 运行 `/review`，检查 5 维度——SQL 安全性、LLM 信任边界、条件副作用、错误处理、安全
- **问题分级**: CRITICAL（必须修）> HIGH（应该修）> MEDIUM（可修）> LOW（风格偏好）
- ✅ **完成标志**: 无 CRITICAL/HIGH 问题
- **不可跳过**（纯文档/配置变更除外）

### ⑦ 安全审查

```
/cso
```

- **动作**: 运行 `/cso`，5 阶段审计——密钥考古 → 依赖供应链 → CI/CD 管道 → OWASP Top 10 → STRIDE 威胁建模
- **两种模式**: 日常（零噪音，高置信度门槛）和全面（月度深度扫描）
- ✅ **完成标志**: 无 CRITICAL 安全问题
- **触发条件**: 仅 auth / finance / system 模块
- **跳过条件**: 非安全敏感模块

### ⑧ 文档反写（**每个 commit 后立即执行，不可跳过**）

> 这是最容易遗漏的环节。**代码改了但文档没同步 = 技术债。**

post-commit hook 会在每次 commit 后自动提醒检查以下对应关系：

| 改了什么 | 必须同步到 |
|----------|-----------|
| DB schema（新表/改字段） | `docs/database-schema.md` |
| API 端点（新增/修改） | `docs/api-design.md` |
| 权限（新角色/新资源） | `docs/security.md` |
| 新功能/新模块（不在 PRD 中） | `docs/PRD.md` |
| 新增/修改模块 | `docs/modules/{module}.md` |
| 模块间依赖变化 | `docs/architecture.md` |
| 业务模块状态变化 | `CLAUDE.md` 业务模块表 |
| 模块进度变化 | `PROGRESS.md` |
| 完成了 todolist 中的子任务 | `todolist.md` 删除/勾选 |
| 模块完成/里程碑 | `memory/MEMORY.md` |

✅ **完成标志**: `git diff` 中包含对应的文档文件变更

### ⑨ 提交归档

```
/ship → PR 合并后 → /opsx:archive
```

- **/ship 命令自动执行**: merge base → `/verify` → `/review` → bump version → update changelog → commit → push → create PR
- **如果 verify 失败或 review 发现 CRITICAL 问题，/ship 自动中止**
- PR 合并后运行 `/opsx:archive` 将变更移至 `openspec/changes/archive/YYYY-MM-DD-<name>/`
- 小改动（<50行）可直接 `git commit`（遵循 `git-workflow.md` 格式和粒度规范）
- ✅ **完成标志**: PR 已创建（或 commit 成功）+ 变更已归档
- **不可跳过**

---

## 经验反写触发规则

| 触发条件 | 写入位置 |
|----------|----------|
| 遇到报错并解决 | `memory/troubleshooting.md` |
| 发现项目特有模式 | `memory/dev-notes.md` |
| 用户确认"功能正确了" | `.claude/skills/{project}-{topic}/SKILL.md` |
| 技术决策变更 | `memory/MEMORY.md` 已决策事项 |
