<!-- WORKFLOW-START -->
<!-- 此区域由 create-vibe-workflow 自动生成，重跑 CLI 时会更新 -->

## AI 协作工具链

本项目使用多层 AI 工具协作体系，确保代码质量和开发纪律：

```
你的业务需求
  ↓
① 需求规格化 — 把想法变成结构化需求
  ↓
② 计划审查 — 拆解任务、验证假设、识别风险
  ↓
③ 流程纪律 — TDD / 文档反写 / 安全检查 / 代码审查
```

### 标准开发流程

> 完整 9 步流程（含各步骤完成标志 / 跳过条件）见 `.claude/rules/development-workflow.md`

### 常用命令

| 场景 | 命令 | 说明 |
|------|------|------|
| 开发新功能 | 从第①步开始 | 先澄清需求，再拆计划 |
| 修 Bug | 先写复现步骤 → ⑤→⑥ | 遵循 TDD + 审查流程 |
| 代码审查 | 第⑥步 | 写完代码立即执行 |
| 安全检查 | 第⑦步 | 敏感模块必须执行 |
| 提交代码 | 第⑧→⑨步 | 同步文档后再提交 |

## 技术栈

- **语言**: TypeScript 5.x (strict mode)
- **前端**: Next.js 15 (App Router) + shadcn/ui + Tailwind CSS
- **后端**: NestJS 11 (REST API)
- **数据库**: PostgreSQL 16+ + Drizzle ORM
- **校验**: Zod（前后端共享 schema）
- **测试**: Vitest (单元) + Playwright (E2E)

## 项目约定

| 约定 | 说明 |
|------|------|
| 代码风格 | 见 `.claude/rules/coding-style.md` |
| Git 规范 | 见 `.claude/rules/git-workflow.md` |
| 测试要求 | 见 `.claude/rules/testing.md` |
| 安全标准 | 见 `.claude/rules/security.md`（仅 auth/finance/system 模块强制执行） |
| 设计模式 | 统一使用 Repository + Service 层 |

<!-- WORKFLOW-END -->
