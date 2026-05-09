---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---

# Hooks 配置指南

> 本文件定义如何通过 `.claude/settings.json` 配置 Claude Code 的 PostToolUse 和 Stop hooks。
> 具体依赖声明见 `.claude/settings.json`（由 `create-vibe-workflow` 生成）。

## 什么是 Hooks

Hooks 是 Claude Code 在工具调用前后触发的自动化脚本，用于：

- **PostToolUse hooks**: 在工具使用后自动执行（如自动格式化代码）
- **Stop hooks**: 在会话停止/结束时执行（如最终检查）

Hooks 在 `.claude/settings.json` 中配置，脚本存放在 `.claude/hooks/` 目录。

## PostToolUse Hooks

在每次工具调用后触发。适用于自动化质量检查。

### 配置结构

```jsonc
// .claude/settings.json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": {
          "tool_name": "$<工具名>",
          "scope": "project"  // 或 "user" / "global"
        },
        "command": "node .claude/hooks/<脚本名>",
        "description": "描述这个 hook 的作用"
      }
    ]
  }
}
```

### matcher 字段说明

| 字段 | 说明 | 示例 |
|------|------|------|
| `tool_name` | 匹配的工具名称 | `Bash`、`Edit`、`Write` |
| `scope` | 作用域 | `project`（项目级）、`user`（用户级）、`global`（全局） |

### Stop Hooks

在会话停止时触发。适用于清理、审计等一次性操作。

```jsonc
// .claude/settings.json
{
  "hooks": {
    "Stop": [
      {
        "matcher": {
          "scope": "project"
        },
        "command": "node .claude/hooks/<脚本名>",
        "description": "描述这个 hook 的作用"
      }
    ]
  }
}
```

## 本项目生成的 Hooks

本模板生成了以下两个 hook 脚本（在 `.claude/hooks/` 目录）：

| 脚本 | 类型 | 触发时机 | 作用 |
|------|------|----------|------|
| `post-commit-check.js` | PostToolUse | 每次 Bash 工具调用后 | 检测到 `git commit` 命令后提示文档反写检查清单 |
| `check-deps.mjs` | PostToolUse | 每次工具调用后 | 检查 git 配置是否满足项目规范 |

## 自定义 Hooks 示例

### 示例 1：PostToolUse — 自动格式化

编辑 TypeScript 文件后自动运行 Prettier：

```jsonc
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": {
          "tool_name": "Edit",
          "scope": "project"
        },
        "command": "npx prettier --write --ignore-unknown .claude/hooks/post-commit-check.js",
        "description": "编辑文件后自动格式化"
      }
    ]
  }
}
```

### 示例 2：PostToolUse — 每次 Bash 后检查 TypeScript 编译

```jsonc
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": {
          "tool_name": "Bash",
          "scope": "project"
        },
        "command": "npx tsc --noEmit 2>&1 | head -30",
        "description": "Bash 命令后检查 TypeScript 编译"
      }
    ]
  }
}
```

### 示例 3：Stop — 格式化所有文件

```jsonc
{
  "hooks": {
    "Stop": [
      {
        "matcher": {
          "scope": "project"
        },
        "command": "npx prettier --write \"src/**/*.{ts,tsx,js,jsx,json}\"",
        "description": "会话结束时格式化所有源文件"
      }
    ]
  }
}
```

## 最佳实践

1. **Hook 脚本要轻量**: hook 在每次工具调用后触发，脚本执行时间不宜超过 1 秒
2. **避免副作用**: hook 脚本应该只读或只写格式化相关的内容，不要修改业务逻辑
3. **合理使用 matcher**: 精确匹配工具名，避免不必要的触发
4. **静默执行**: hook 脚本不应该输出大量日志到终端，除非有错误
5. **错误不影响主流程**: hook 脚本执行失败不应阻断主工具调用

## 故障排查

| 现象 | 可能原因 | 解决 |
|------|----------|------|
| Hook 未触发 | matcher 不匹配或路径错误 | 检查 `tool_name` 和脚本路径 |
| Hook 输出乱码 | 脚本编码问题 | 确保脚本使用 UTF-8 编码 |
| Hook 执行缓慢 | 脚本中存在耗时操作 | 简化脚本逻辑 |
| Hook 报错但未被注意 | 错误被静默吞掉 | 在脚本中添加 `console.error` 输出 |
