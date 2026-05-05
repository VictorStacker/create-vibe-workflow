# Git Workflow

## Commit Message Format
```
<type>: <description>

<optional body>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci

## Commit 粒度规范

一个 commit = todolist.md 中的一个子任务，满足：
- 代码可编译通过
- 相关测试通过
- 变更文件 1-8 个，行数 50-300 行
- 超过 500 行应继续拆分

### 典型 commit 序列（后端模块）

```
feat: 添加{模块}Zod schema          # shared schema
feat: 实现 {Module}Service           # service 层
test: 添加 {Module}Service 单元测试   # 测试
feat: 实现 {Module}Controller        # controller
feat: 注册 {Module}Module            # module
docs: 同步{模块}治理文档              # 文档反写
```

### 典型 commit 序列（前端页面）

```
feat: 实现{模块}列表页    # 列表
feat: 实现{模块}详情页    # 详情
feat: 实现{模块}表单      # 表单
docs: 同步{模块}治理文档   # 文档反写
```

## Pull Request Workflow

When creating PRs:
1. Analyze full commit history (not just latest commit)
2. Use `git diff [base-branch]...HEAD` to see all changes
3. Draft comprehensive PR summary
4. Include test plan with TODOs
5. Push with `-u` flag if new branch
