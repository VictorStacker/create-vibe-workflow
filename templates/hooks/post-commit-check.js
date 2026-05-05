#!/usr/bin/env node

// Post-commit 文档反写检查
// 通过 Claude Code PostToolUse hook 触发

const input = process.argv[2] || '{}';
let toolCall;
try {
  toolCall = JSON.parse(input);
} catch {
  process.exit(0);
}

if (toolCall.tool_name !== 'Bash') process.exit(0);

const commandInput = typeof toolCall.input === 'string'
  ? toolCall.input
  : JSON.stringify(toolCall.input || '');

if (!commandInput.includes('git commit')) process.exit(0);

console.log('⚠️  【第⑧步 文档反写检查】commit 完成，请逐条检查：');
console.log('  □ DB schema 变更?    → docs/database-schema.md');
console.log('  □ API 端点变更?      → docs/api-design.md');
console.log('  □ 权限变更?          → docs/security.md');
console.log('  □ 新功能不在 PRD 中? → docs/PRD.md');
console.log('  □ 新增/修改模块?     → docs/modules/{module}.md');
console.log('  □ 模块依赖变化?      → docs/architecture.md');
console.log('  □ 模块状态变化?      → CLAUDE.md + PROGRESS.md');
console.log('  □ todolist 任务完成? → todolist.md 删除/勾选');
console.log('  □ 里程碑完成?        → memory/MEMORY.md');
