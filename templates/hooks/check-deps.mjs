#!/usr/bin/env node

// 依赖检测 — Claude Code SessionStart hook
// 检查 superpowers + gstack 是否已安装，缺失时打印安装命令
// 用户可以直接在 Claude Code 中运行这些命令

import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const homeDir = homedir();
const skillsDir = join(homeDir, '.claude', 'skills');
const pluginsDir = join(homeDir, '.claude', 'plugins', 'cache');

// superpowers — 检查插件缓存（支持多种可能的路径）
const spPaths = [
  join(pluginsDir, 'superpowers-marketplace'),
  join(skillsDir, 'superpowers'),
];
const spInstalled = spPaths.some(p => existsSync(p));

// gstack — 检查 skills 目录
const gsPaths = [
  join(skillsDir, 'gstack'),
  join(pluginsDir, 'gstack-marketplace'),
];
const gsInstalled = gsPaths.some(p => existsSync(p));

// OpenSpec — 可选，检查全局 npm 安装
const opPaths = [
  join(homeDir, '.npm-global', 'node_modules', '@fission-ai', 'openspec'),
  join(homeDir, 'node_modules', '@fission-ai', 'openspec'),
];
const opInstalled = opPaths.some(p => existsSync(p));

const required = [];
if (!spInstalled) required.push({
  name: 'superpowers',
  check: spPaths[0],
  installCmd: 'claude plugin install superpowers@superpowers-marketplace',
  desc: '大脑 — brainstorming / writing-plans / TDD / verification / debugging',
});
if (!gsInstalled) required.push({
  name: 'gstack',
  check: gsPaths[0],
  installCmd: 'claude plugin marketplace add gstack && claude plugin install gstack',
  desc: '手脚 — /office-hours / /browse / /qa / /review / /cso / /ship',
});

const optional = [];
if (!opInstalled) optional.push({
  name: 'OpenSpec',
  check: opPaths[0],
  installCmd: 'npm install -g @fission-ai/openspec@latest',
  desc: '可选 — /opsx:propose 命令依赖它创建变更目录结构',
});

if (required.length === 0 && optional.length === 0) {
  process.exit(0);
}

console.log('');
console.log('══════════════════════════════════════════════');
console.log('  🚀 Create Vibe Workflow — 依赖检测');
console.log('══════════════════════════════════════════════');

if (required.length > 0) {
  console.log('');
  console.log('❌ 缺少核心组件（工作流无法正常运行）：');
  console.log('');
  for (const dep of required) {
    console.log(`  📦 ${dep.name} — ${dep.desc}`);
    console.log(`     安装: ${dep.installCmd}`);
    console.log('');
  }
  console.log('  请在 Claude Code 中运行上面的安装命令。');
  console.log('  安装后重启 Claude Code 即可启用完整工作流。');
}

if (optional.length > 0) {
  console.log('');
  console.log('⚠️  缺少可选组件：');
  console.log('');
  for (const dep of optional) {
    console.log(`  📦 ${dep.name} — ${dep.desc}`);
    console.log(`     安装: ${dep.installCmd}`);
    console.log('');
  }
  console.log('  不安装也可正常使用，但 /opsx:propose 功能受限。');
}

console.log('══════════════════════════════════════════════');
console.log('');

// 如果核心组件缺失，延迟退出让用户看到信息
if (required.length > 0) {
  // 不阻塞，但打印醒目的安装指引
  console.log('👉 复制上面的命令，直接粘贴到 Claude Code 中即可开始安装');
  console.log('');
}
