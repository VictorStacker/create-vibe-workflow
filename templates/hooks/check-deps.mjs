#!/usr/bin/env node

// 依赖检测 — Claude Code PreToolUse hook
// 检查外部依赖组件是否已安装，缺失时打印中文安装指引

import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const homeDir = homedir();
const skillsDir = join(homeDir, '.claude', 'skills');

const REQUIRED = [
  { name: 'gstack', dir: 'gstack', install: 'https://github.com/garrytan/gstack' },
  { name: 'superpowers', dir: 'superpowers', install: 'https://github.com/obra/superpowers' },
];

const OPTIONAL = [
  { name: 'openspec', dir: 'openspec', install: 'https://github.com/Fission-AI/OpenSpec' },
  { name: 'everything-claude-code', dir: 'everything-claude-code', install: 'https://github.com/affaan-m/everything-claude-code' },
];

const missing = [];
const missingOptional = [];

for (const dep of REQUIRED) {
  if (!existsSync(join(skillsDir, dep.dir))) {
    missing.push(dep);
  }
}

for (const dep of OPTIONAL) {
  if (!existsSync(join(skillsDir, dep.dir))) {
    missingOptional.push(dep);
  }
}

if (missing.length === 0 && missingOptional.length === 0) {
  process.exit(0);
}

console.log('');
console.log('══════════════════════════════════════════');
console.log('  ⚠️  工作流依赖检查');
console.log('══════════════════════════════════════════');

if (missing.length > 0) {
  console.log('');
  console.log('❌ 缺少必要组件（工作流核心功能将不可用）：');
  for (const dep of missing) {
    console.log(`  • ${dep.name} — 安装: ${dep.install}`);
  }
}

if (missingOptional.length > 0) {
  console.log('');
  console.log('⚠️  缺少可选组件（部分高级功能不可用）：');
  for (const dep of missingOptional) {
    console.log(`  • ${dep.name} — 安装: ${dep.install}`);
  }
}

console.log('');
console.log('安装后可重启 Claude Code 以启用完整工作流。');
console.log('══════════════════════════════════════════');
console.log('');
