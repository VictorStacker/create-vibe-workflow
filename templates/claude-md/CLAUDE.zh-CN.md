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

## 核心原则

1. **流程归 superpowers** — 所有 brainstorming、plan、TDD、verify、debug 走 superpowers
2. **执行归 gstack** — 所有浏览器、QA、review、cso、ship、护栏 走 gstack
3. **独立 reviewer 通道** — 作者和审查者绝不在同一上下文互评
4. **证据优先** — 声明完成前必须有可验证的证据（verification-before-completion）
5. **遇到歧义先 brainstorm** — 花 5 分钟理清需求，省后面 5 小时返工
6. **会话恢复先读 todolist** — 新会话第一件事是检查 `todolist.md`

## 路由裁决表

| 任务 | 工具 |
|------|------|
| 验证需求 / 探讨想法 | `gstack /office-hours` |
| 把需求写成规格 | `/opsx:propose` |
| 方案设计 / 头脑风暴 | `superpowers brainstorming` |
| 写实施计划 | `superpowers writing-plans` |
| 进度追踪（自动） | `todolist-management` skill |
| 写代码（TDD） | `superpowers test-driven-development` |
| 调试 bug | `superpowers systematic-debugging` |
| 浏览器操作 / QA | `gstack /browse` / `/qa` |
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
