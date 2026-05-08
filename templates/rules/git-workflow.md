# Git 工作流规范（Git Workflow）

## Commit Message 格式

```
<type>(<scope>): <subject>

<body>
```

### Type 类型

| Type | 说明 |
|------|------|
| `feat` | 新功能 (feature) |
| `fix` | Bug 修复 (bugfix) |
| `refactor` | 重构（不增加功能、不修复 bug） |
| `docs` | 文档变更 |
| `test` | 测试相关变更 |
| `chore` | 构建过程/辅助工具变动 |
| `perf` | 性能优化 |
| `ci` | CI/CD 配置变更 |

### 格式要求

- **subject**：不超过 50 字符，使用中文或英文，不要结尾加句号
- **body**：解释 what 和 why（不是 how），每行不超过 72 字符
- 使用祈使语气（"添加" 而不是 "添加了"）

```bash
# ✅ 好的提交信息
feat(user): 添加用户注册接口

- 支持 email + 用户名两种注册方式
- 注册后自动发送验证邮件
- 包含 Zod schema 校验

# ❌ 不好的提交信息
fix: 修了个bug
随便改了点东西
```

## Commit 粒度规范

> 一个 commit = todolist.md 中的一个子任务

每个 commit 应满足：
- 代码可编译通过
- 相关测试通过
- 变更文件数：1-8 个
- 代码行数：50-300 行
- ⚠️ **超过 500 行应继续拆分**

### 典型 commit 序列 — 后端模块

```
feat: 添加{模块}Zod schema          # 共享校验层
feat: 实现 {Module}Service           # 业务逻辑层
test: 添加 {Module}Service 单元测试   # 测试覆盖
feat: 实现 {Module}Controller        # API 控制器
feat: 注册 {Module}Module            # 模块注册
docs: 同步{模块}设计文档              # 文档反写
```

### 典型 commit 序列 — 前端页面

```
feat: 实现{模块}列表页    # 列表视图
feat: 实现{模块}详情页    # 详情视图
feat: 实现{模块}表单      # 创建/编辑表单
docs: 同步{模块}设计文档   # 文档反写
```

## 分支策略

```
main ──────────────────────────────── 生产环境
  ├── develop ────────────────────── 开发集成分支
  │     ├── feature/user-register    功能分支
  │     └── feature/payment-integrate
  └── hotfix/critical-fix-001       紧急修复分支（直接合并 main）
```

- `feature/*` — 新功能开发，从 develop 创建，完成后 PR 回 develop
- `hotfix/*` — 紧急线上修复，从 main 创建，完成后 PR 回 main + cherry-pick 到 develop
- PR 标题格式与 commit message 一致

## Pull Request 工作流

创建 PR 时：
1. 分析**完整提交历史**（不只是最新一个 commit）
2. 使用 `git diff [base-branch]...HEAD` 查看所有变更
3. 编写全面的 PR 摘要（包括做了什么、为什么、怎么验证）
4. 包含带 TODO 的测试计划
5. 新分支首次推送时使用 `-u` 标志

## Git Hooks 配置建议

| Hook | 用途 | 建议工具 |
|------|------|----------|
| pre-commit | lint + format | Husky + lint-staged / simple-git-hooks |
| commit-msg | message 格式校验 | commitlint |
| pre-push | 全量测试通过 | vitest / npm test |
