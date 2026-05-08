<!-- WORKFLOW-START -->
<!-- 此区域由 create-vibe-workflow 自动生成，重跑 CLI 时会更新 -->

## AI 协作工具链

本项目使用多层 AI 工具协作体系：

```
你的业务需求
  ↓
① 需求规格化 — 把想法变成结构化需求
  ↓
② 计划审查 — 拆解任务、验证假设
  ↓
③ 流程纪律 — TDD / 文档反写 / 安全检查
```

### 标准开发流程

```
① 需求澄清 → ② 计划拆分 → ③ 研究复用
→ ④ TodoList编写 → ⑤ TDD开发 → ⑥ 代码审查
→ ⑦ 安全审查 → ⑧ 文档反写 → ⑨ 提交归档
```

### 常用命令

| 场景 | 命令 |
|------|------|
| 开发新功能 | 从第①步开始，先写 PRD/用户故事 |
| 修 Bug | 先写复现步骤，再修 |
| 审查代码 | 每次写完代码后执行 |
| 提交代码 | 检查文档同步后提交 |

## 技术栈

- 语言: TypeScript 5.x (strict mode)
- 框架: Next.js 15 (App Router)
- UI: shadcn/ui + Tailwind CSS 4
- 样式: CSS Modules / Tailwind CSS
- 状态管理: React hooks + Server State (SWR/TanStack Query)
- 校验: Zod schema
- 测试: Vitest (单元) + Playwright (E2E)
- 部署: Vercel

<!-- WORKFLOW-END -->
