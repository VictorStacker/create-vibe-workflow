#!/usr/bin/env node

import { askQuestions } from './questions.js';
import { generate } from './generator.js';
import chalk from 'chalk';

async function main() {
  console.log(chalk.cyan.bold('\n🚀 Create Vibe Workflow\n'));
  console.log(chalk.dim('面向非专业编程人员的 Claude Code 开发工作流\n'));

  const args = process.argv.slice(2);
  const isUninstall = args.includes('--uninstall');
  const isOverwrite = args.includes('--overwrite');

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
