<!-- WORKFLOW-START -->
<!-- 此区域由 create-vibe-workflow 自动生成，重跑 CLI 时会更新 -->

## AI 协作工具链

本项目由两个核心插件 + 本工具衔接：

```
superpowers（大脑 — 怎么想）
  brainstorming / writing-plans / TDD / verification / debugging

gstack（手脚 — 怎么干）
  /office-hours / /browse / /qa / /review / /cso / /ship / /context-save

本工具（衔接 — 不透支不冲突）
  /opsx:propose（人话规格）/ /opsx:explore（只读探索）/ /opsx:archive（归档）
  todolist-management（进度追踪 + 中断恢复）
  rules + domain skills + memory + hooks
```

## 开工前铁律（每次对话必须执行）

**AI 在说任何话、做任何事之前，必须先读 `todolist.md`。**

1. 读到 → 检查"当前阶段" → 从该阶段开始，不得跳步
2. 没读到（文件不存在）→ 询问用户："要开始新功能吗？还是继续之前的工作？"
3. 想跳到下一层 → 先确认上层已完成（[x]）→ 更新阶段追踪 → 再前进
4. **上层未完成时跳过它直接写代码 = 违规**

## 核心原则

1. **流程归 superpowers** — brainstorming、plan、TDD、verify、debug
2. **执行归 gstack** — browser、QA、review、cso、ship、护栏
3. **独立 reviewer** — 作者和审查者不在同一上下文互评
4. **证据优先** — 声明完成前必须有可验证证据
5. **歧义先 brainstorm** — 5 分钟理清需求，省 5 小时返工
6. **阶段不跳步** — 9 层按序推进，todolist 阶段追踪强制约束

## 路由裁决表

| 任务 | 工具 |
|------|------|
| 验证需求 / 探讨想法 | `gstack /office-hours` |
| 追问需求细节 | `grill-me` skill（自动） |
| 对话整理成 PRD | `to-prd` skill |
| 把需求写成规格 | `/opsx:propose` |
| 方案设计 / 头脑风暴 | `superpowers brainstorming` |
| 写实施计划 | `superpowers writing-plans` |
| 进度追踪（自动） | `todolist-management` skill |
| 写代码（TDD） | `superpowers test-driven-development` |
| 调试 bug | `superpowers systematic-debugging` |
| 浏览器操作 / QA | `gstack /browse` / `/qa` |
| 架构一致性（自动） | `architecture-gate` skill |
| 代码审查 | `gstack /review` |
| 安全审查 | `gstack /cso` |
| 完成前自检 | `superpowers verification-before-completion` |
| 收尾分支 | `superpowers finishing-a-development-branch` |
| 发布 | `gstack /ship` |
| 归档 | `/opsx:archive` |
| 保存 / 恢复进度 | `gstack /context-save` / `/context-restore` |
| 危险操作防护 | `gstack /careful` / `/guard` |

## 技术栈

- 语言: <%= LANGUAGE %>
- 项目类型: <%= PROJECT_TYPE %>
- 数据库: <%= NEEDS_DB === 'true' ? '是' : '否' %>

## 已安装技能

<%= SELECTED_SKILLS.join(', ') %>

<!-- WORKFLOW-END -->
