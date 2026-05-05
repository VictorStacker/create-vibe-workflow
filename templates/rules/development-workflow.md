# Development Workflow（9 环节完整流程）

> 每个环节都必须执行（除非标注了跳过条件）。
> 完成标志 = 该环节产出的可验证产物，没有产物 = 没做完。

## 完整链路

```
① 需求澄清 ──── OpenSpec /opsx:propose
② 计划拆分 ──── gstack /plan-ceo-review /plan-eng-review（可选）
③ 研究复用
④ TodoList编写
⑤ TDD开发 ──── Superpowers 强制执行 TDD 纪律
⑥ 代码审查 ──── code-reviewer agent（自动）
⑦ 安全审查 ──── gstack /cso（可选）+ security-reviewer（自动）
⑧ 文档反写
⑨ 提交归档 ──── gstack /ship（跑测试+生成PR）→ OpenSpec /opsx:archive
```

> 工具说明详见 `CLAUDE.md` § AI 协作工具链

---

## 开发前必读文档

| 顺序 | 文档 | 提取什么 |
|------|------|----------|
| 1 | `docs/PRD.md` | 用户故事 + 验收标准 + P0/P1 划分 |
| 2 | `docs/database-schema.md` | 表结构 + FK + 枚举 + 约束（有数据库时） |
| 3 | `docs/api-design.md` | 端点 + 请求/响应格式 + 权限（有 API 时） |
| 4 | `docs/security.md` | 权限矩阵（有认证时） |
| 5 | `docs/ui-ux-spec.md` | 页面线框图 + 组件规范（有前端时） |
| 6 | 相邻已完成模块代码 | 复用实现模式 |

缺少信息？先补设计文档，再写代码。

---

## 各环节

### ① 需求澄清
- 动作: 对照 PRD 确认功能边界和优先级
- **新功能必须先用 OpenSpec**: `/opsx:propose 你的需求描述` → 生成结构化规格 + 任务清单
- **复杂需求可选 gstack**: `/office-hours` 验证想法，`/plan-ceo-review` 挑战假设
- ✅ 完成标志: OpenSpec 任务清单已生成 + 明确了做什么、不做什么、P0/P1 划分
- 跳过条件: 纯技术任务（重构、升级依赖等）

### ② 计划拆分
- 动作: 拆分为可独立提交的子任务（每个 50-300 行）
- 复杂功能使用 **planner** agent
- **P0 优先策略**：新模块只先实现 P0，P1 完整列出放待开发区
- ✅ 完成标志: 有明确的子任务列表，每个子任务对应一个 commit
- 跳过条件: 单文件小修改（<50 行）

### ③ 研究复用
- 动作: GitHub code search → Context7 → npm → 相邻模块代码
- ✅ 完成标志: 确认了实现模式（复用现有 or 新写）
- 跳过条件: 已有明确模式可复用

### ④ TodoList 编写
- 动作: 将子任务写入 `todolist.md`
- 粒度: 一个子任务 = 一个可独立 commit 的变更
- ✅ 完成标志: `todolist.md` 已更新，包含所有 P0 + P1 任务
- **不可跳过**

### ⑤ TDD 开发
- 动作: RED → GREEN → REFACTOR，覆盖率 ≥80%
- **Superpowers 强制执行**: `tdd-workflow` skill 确保先写测试再写代码，禁止跳过
- **按 OpenSpec 任务清单逐项实现**，每完成一项标记 done
- ✅ 完成标志: 测试通过 + 编译通过
- **不可跳过**

### ⑥ 代码审查
- 动作: 使用 **code-reviewer** agent
- ✅ 完成标志: CRITICAL/HIGH 问题已修复
- **不可跳过**（纯文档/配置变更除外）

### ⑦ 安全审查
- 动作: 使用 **security-reviewer** agent
- ✅ 完成标志: 无 CRITICAL 安全问题
- 触发: 仅 auth / finance / system 模块
- 跳过条件: 非安全敏感模块

### ⑧ 文档反写（每个 commit 后立即执行，不可跳过）

> 这是最容易遗漏的环节。代码改了但文档没同步 = 技术债。
> 小功能/临时需求可能不在 PRD 中，反写是唯一让文档跟上代码的机会。

**逐条检查，改了哪个就同步哪个：**

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

✅ 完成标志: `git diff` 中包含对应的文档文件变更

### ⑨ 提交归档
- 动作: `/ship` → 自动跑全量测试 + 检查覆盖率 + 生成 PR 描述 + push + 创建 PR
- PR merge 后执行 `/opsx:archive` 将变更移至 archive
- 小改动（<50行）可直接 `git commit`（遵循 `git-workflow.md` 格式和粒度规范）
- ✅ 完成标志: PR 已创建（或 commit 成功）+ OpenSpec 已归档
- **不可跳过**

---

## 经验反写触发规则

| 触发条件 | 写入位置 |
|----------|----------|
| 遇到报错并解决 | `memory/troubleshooting.md` |
| 发现项目特有模式 | `memory/dev-notes.md` |
| 用户确认"功能正确了" | `.claude/skills/{project}-{topic}/SKILL.md` |
| 技术决策变更 | `memory/MEMORY.md` 已决策事项 |
