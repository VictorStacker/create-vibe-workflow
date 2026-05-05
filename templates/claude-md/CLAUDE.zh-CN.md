<!-- WORKFLOW-START -->
<!-- 此区域由 create-vibe-workflow 自动生成，重跑 CLI 时会更新 -->

## AI 协作工具链

本项目使用多层 AI 工具协作体系：

```
你的业务需求
  ↓
① OpenSpec ─── 把想法变成结构化的需求规格和任务清单
  ↓
② gstack ───── 虚拟团队角色审查（CEO审查/设计审查/工程审查）
  ↓
③ Superpowers ─ 强制执行正确的开发流程（TDD/系统调试/验证）
```

### 标准开发流程

```
① 需求澄清（OpenSpec）→ ② 计划拆分 → ③ 研究复用
→ ④ TodoList编写 → ⑤ TDD开发 → ⑥ 代码审查
→ ⑦ 安全审查 → ⑧ 文档反写 → ⑨ 提交归档
```

### 常用命令

| 场景 | 命令 |
|------|------|
| 开发新功能 | `/opsx:propose` 开始 |
| 修 Bug | 自动触发 `systematic-debugging` |
| 审查代码 | `/review` |
| 验收功能 | `/qa` |
| 准备发布 | `/ship` |
| 安全审查 | `/cso` |

## 技术栈

- 语言: TypeScript 5.x (strict mode)
- 前端: Next.js 15 (App Router) + shadcn/ui + Tailwind CSS
- 后端: NestJS 11 (REST API)
- 数据库: PostgreSQL 16+ + Drizzle ORM
- 校验: Zod（前后端共享 schema）
- 测试: Vitest (单元) + Playwright (E2E)

<!-- WORKFLOW-END -->
