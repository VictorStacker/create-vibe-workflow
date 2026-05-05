# Create Vibe Workflow

一条命令，5 分钟拥有专业 AI 协作开发工作流。

面向非专业编程人员（Vibe Coder）的 Claude Code 编排插件——把需求→代码→审查→发布的全流程纪律，打包成一键安装。

## 为什么需要这个？

Claude Code 很强大，但"随意对话"模式下容易跑偏：忘了写测试、跳过代码审查、需求理解偏差、文档没人更新。

这个插件给你一套经过生产验证的 **9 步开发流程**，告诉 AI 什么时候该做什么、不该做什么。它在泉州佳希（魔方培训机构管理系统，21 个业务模块）中验证了几个月。

## 5 分钟上手

```bash
# 在你的项目目录下运行
npx create-vibe-workflow
```

回答几个问题：

```
? 项目名称: my-erp
? 技术栈: NestJS + Next.js（默认）
? 包含模块: [x] 9步工作流 [x] 代码规范 [x] Agent编排 [ ] TDD
? 编程经验: 非专业编程人员
```

安装完成，重启 Claude Code 即可使用。

## 会生成什么

```
你的项目/
├── .claude/
│   ├── rules/              ← 7 个规则文件（9步流程/代码规范/Git等）
│   │   ├── development-workflow.md
│   │   ├── coding-style.md
│   │   ├── git-workflow.md
│   │   ├── agents.md
│   │   ├── security.md
│   │   ├── testing.md
│   │   └── patterns.md
│   ├── hooks/              ← 自动化检查脚本
│   │   ├── post-commit-check.js
│   │   └── check-deps.js
│   └── settings.json       ← 依赖声明
└── CLAUDE.md              ← AI 协作配置（含 Skill routing）
```

## 9 步开发流程

```
① 需求澄清 → ② 计划拆分 → ③ 研究复用
→ ④ TodoList → ⑤ TDD开发 → ⑥ 代码审查
→ ⑦ 安全审查 → ⑧ 文档反写 → ⑨ 提交归档
```

每一步都有强制检查点，AI 不能跳过。

## 依赖的外部工具

本插件是"编排层"，需要以下组件配合（安装时会提示）：

| 组件 | 用途 | 必需 |
|------|------|------|
| [gstack](https://github.com/garrytan/gstack) | 审查/QA/发布流程 | ✅ |
| [Superpowers](https://github.com/anthropics/claude-code-superpowers) | TDD纪律/系统调试 | ✅ |
| [OpenSpec](https://github.com/anthropics/openspec) | 需求规格化 | ⚠️ 可选 |

## 命令参考

```bash
npx create-vibe-workflow            # 交互式安装（合并模式）
npx create-vibe-workflow --overwrite # 强制覆盖已有配置
npx create-vibe-workflow --uninstall # 清理生成的文件
```

## 常见问题

**Q: 安装后没有效果？**
A: 重启 Claude Code。如果依赖组件（gstack/superpowers）未安装，启动时会看到安装指引。

**Q: 我之前已经有 CLAUDE.md 和 .claude/ 配置怎么办？**
A: 安装器会自动备份到 `.claude/.backup/`，然后进入合并模式。已有的 CLAUDE.md 内容不会丢失。

**Q: 我不用 NestJS/Next.js 怎么办？**
A: 当前 v1 默认适配 NestJS + Next.js。选择"其他技术栈"可手动配置。v2 将支持更多技术栈。

## 开源协议

MIT License

---

## English Summary

One-command installer for a production-verified Claude Code development workflow. Designed for vibe coders (non-professional programmers) — structured 9-step process with enforced checkpoints, Chinese-first documentation, and cross-platform support.

```bash
npx create-vibe-workflow
```

Generates `.claude/rules/` (7 rule files), `.claude/hooks/` (auto-checks), and `CLAUDE.md` with skill routing. Declares dependencies on gstack + Superpowers without bundling them.
