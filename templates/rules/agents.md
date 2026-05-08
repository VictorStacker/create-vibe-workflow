# Agent 编排（Agent Orchestration）

## 可用 Agent

位于 `~/.claude/agents/`：

| Agent | 用途 | 使用场景 |
|-------|------|----------|
| planner | 实现计划制定 | 复杂功能、重构方案 |
| architect | 系统设计 | 架构决策、技术选型 |
| tdd-guide | 测试驱动开发指导 | 新功能、Bug 修复 |
| code-reviewer | 代码审查 | 写完代码后执行 |
| security-reviewer | 安全分析 | 提交前检查 |
| build-error-resolver | 构建错误修复 | 编译/构建失败时 |
| e2e-runner | E2E 测试 | 关键用户流程验证 |
| refactor-cleaner | 死代码清理 | 代码维护、优化 |
| doc-updater | 文档更新 | 同步文档变更 |

## 即时使用规则

无需用户额外提示，以下场景自动触发：
1. **复杂功能请求** → 使用 **planner** agent
2. **代码刚写完/修改后** → 使用 **code-reviewer** agent
3. **Bug 修复或新功能** → 使用 **tdd-guide** agent
4. **架构决策** → 使用 **architect** agent

## 并行任务执行

**始终**对独立操作使用并行 Task 执行：

```markdown
# ✅ 推荐：并行执行
同时启动 3 个 agent：
1. Agent 1: 安全审查（auth 模块）
2. Agent 2: 性能审查（缓存系统）
3. Agent 3: 类型检查（工具函数）

# ❌ 不推荐：不必要的串行
先等 agent 1，再 agent 2，再 agent 3
```

## 多视角分析

对于复杂问题，使用分角色子 agent：
- 事实核查者（Factual reviewer）
- 高级工程师（Senior engineer）
- 安全专家（Security expert）
- 一致性检查员（Consistency reviewer）
- 冗余检测器（Redundancy checker）
