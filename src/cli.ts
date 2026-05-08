#!/usr/bin/env node

import { askQuestions } from './questions.js';
import { generate } from './generator.js';
import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import { homedir } from 'node:os';

// ────────────────────────────────────────────────
// --check 健康检查
// ────────────────────────────────────────────────
async function healthCheck(targetDir: string): Promise<void> {
  console.log(chalk.cyan.bold('\n🔍 Create Vibe Workflow — 健康检查\n'));

  const claudeDir = path.join(targetDir, '.claude');
  const manifestPath = path.join(claudeDir, '.generated-manifest.json');

  // 1. 检查 .claude/ 目录是否存在
  if (!fs.existsSync(claudeDir)) {
    console.log(chalk.yellow('  状态: 未安装工作流'));
    console.log(chalk.dim('  运行 npx create-vibe-workflow 开始安装\n'));
    process.exit(0);
    return;
  }

  let manifest: Record<string, unknown> | null = null;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } catch {
    // manifest 不存在或损坏
  }

  const results: { name: string; status: 'ok' | 'missing' | 'outdated'; detail?: string }[] = [];

  // 2. 检查规则文件
  const expectedRules = [
    'development-workflow.md', 'coding-style.md', 'git-workflow.md',
    'security.md', 'testing.md', 'patterns.md',
  ];
  for (const rule of expectedRules) {
    const p = path.join(claudeDir, 'rules', rule);
    results.push({
      name: `.claude/rules/${rule}`,
      status: fs.existsSync(p) ? 'ok' : 'missing',
    });
  }

  // 3. 检查 hooks
  const expectedHooks = ['post-commit-check.js', 'check-deps.mjs'];
  for (const hook of expectedHooks) {
    const p = path.join(claudeDir, 'hooks', hook);
    results.push({
      name: `.claude/hooks/${hook}`,
      status: fs.existsSync(p) ? 'ok' : 'missing',
    });
  }

  // 4. CLAUDE.md
  const claudeMdPath = path.join(targetDir, 'CLAUDE.md');
  results.push({
    name: 'CLAUDE.md',
    status: fs.existsSync(claudeMdPath) ? 'ok' : 'missing',
  });

  // 5. settings.json
  const settingsPath = path.join(claudeDir, 'settings.json');
  results.push({
    name: '.claude/settings.json',
    status: fs.existsSync(settingsPath) ? 'ok' : 'missing',
  });

  // 6. 外部依赖检查
  const skillsDir = join(homedir(), '.claude', 'skills');
  const deps = [
    { name: 'gstack', dir: 'gstack' },
    { name: 'superpowers', dir: 'superpowers' },
    { name: 'openspec (可选)', dir: 'openspec', optional: true },
  ];
  for (const dep of deps as Array<{ name: string; dir: string; optional?: boolean }>) {
    const exists = fs.existsSync(join(skillsDir, dep.dir));
    results.push({
      name: `依赖: ${dep.name}`,
      status: exists ? 'ok' : dep.optional ? 'ok' : 'missing', // 可选缺失不算 error
      detail: exists ? undefined : dep.optional ? '(未安装，可选)' : '(未安装)',
    });
  }

  // 输出报告
  console.log(chalk.white.bold('  文件清单：\n'));
  const okCount = results.filter(r => r.status === 'ok').length;
  const missingCount = results.filter(r => r.status === 'missing').length;

  for (const r of results) {
    const icon = r.status === 'ok' ? chalk.green('✅') : chalk.red('❌');
    const detail = r.detail ? ` ${chalk.dim(r.detail)}` : '';
    console.log(`  ${icon} ${r.name}${detail}`);
  }

  // 版本信息
  if (manifest) {
    console.log(chalk.white.bold('\n  安装信息：\n'));
    console.log(`  ${chalk.dim('生成工具:')}: ${(manifest.generatedBy as string) ?? 'unknown'}`);
    console.log(`  ${chalk.dim('生成时间:')}: ${(manifest.generatedAt as string) ?? 'unknown'}`);
    const files = manifest.files as string[] | undefined;
    if (files) {
      console.log(`  ${chalk.dim('生成文件数:')}: ${files.length}`);
    }
  }

  // 总结
  console.log(chalk.white('\n  ───────────────────────────────────'));
  if (missingCount === 0) {
    console.log(chalk.green(`  ✅ 全部正常 (${okCount}/${results.length})`));
  } else {
    console.log(chalk.yellow(`  ⚠️  ${missingCount} 项缺失 (${okCount}/${results.length} 正常)`));
    console.log(chalk.dim('\n  运行 npx create-vibe-workflow --overwrite 补全缺失文件'));
  }
  console.log();

  process.exit(missingCount > 0 ? 1 : 0);
}

function join(...parts: string[]): string {
  return parts.join(path.sep); // Windows 兼容
}

async function main() {
  console.log(chalk.cyan.bold('\n🚀 Create Vibe Workflow\n'));
  console.log(chalk.dim('面向非专业编程人员的 Claude Code 开发工作流\n'));

  const args = process.argv.slice(2);
  const isUninstall = args.includes('--uninstall');
  const isOverwrite = args.includes('--overwrite');
  const isCheck = args.includes('--check');

  if (isCheck) {
    await healthCheck(process.cwd());
    return;
  }

  if (isUninstall) {
    const { uninstall } = await import('./generator.js');
    await uninstall(process.cwd());
    return;
  }

  try {
    const config = await askQuestions();
    config.overwrite = isOverwrite;
    config.targetDir = process.cwd();

    await generate(config);

    console.log(chalk.green.bold('\n✅ 安装完成！\n'));
    console.log(chalk.dim('已生成以下内容：'));
    console.log(chalk.white('  📁 .claude/rules/     — 开发工作流规则'));
    console.log(chalk.white('  📁 .claude/hooks/     — 自动化检查脚本'));
    console.log(chalk.white('  📄 CLAUDE.md          — 项目 AI 协作配置'));
    console.log(chalk.white('  ⚙️  .claude/settings.json — 依赖声明'));
    console.log();
    console.log(chalk.yellow('下一步：重启 Claude Code 即可使用新的工作流'));
    console.log(chalk.dim('如果尚未安装依赖组件（gstack / superpowers），'));
    console.log(chalk.dim('Claude Code 启动时会提示安装指引。\n'));
  } catch (err) {
    if (err instanceof Error && err.message === 'USER_CANCELLED') {
      console.log(chalk.dim('\n已取消'));
      process.exit(0);
    }
    console.error(chalk.red('\n❌ 安装失败\n'));
    console.error(chalk.red((err as Error).message));
    console.error();
    console.error(chalk.dim('常见问题：'));
    console.error(chalk.dim('  • 检查当前目录是否有写入权限'));
    console.error(chalk.dim('  • 检查磁盘空间是否充足'));
    console.error(chalk.dim('  • 如问题持续，请提交 Issue:'));
    console.error(chalk.dim('    https://github.com/VictorStacker/create-vibe-workflow/issues\n'));
    process.exit(1);
  }
}

main();
