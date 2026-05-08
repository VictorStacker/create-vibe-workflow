import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ejs from 'ejs';
import chalk from 'chalk';
import type { UserConfig } from './questions.js';
import { getClaudeMdTemplate, getSkillsRecommendPath } from './questions.js';
import { appendCLAUDEmd as appendCLAUDEmdUtil, mergeSettingsJson } from './utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, '..', 'templates');

interface FileResult {
  path: string;
  status: 'created' | 'merged' | 'skipped' | 'error';
  error?: string;
}

const GENERATED_MANIFEST = '.claude/.generated-manifest.json';

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function backupExisting(targetDir: string) {
  const claudeDir = path.join(targetDir, '.claude');
  if (!fs.existsSync(claudeDir)) return;

  const backupDir = path.join(claudeDir, '.backup');
  ensureDir(backupDir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupTarget = path.join(backupDir, `backup-${timestamp}`);
  ensureDir(backupTarget);

  const entries = fs.readdirSync(claudeDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '.backup' || entry.name === '.generated-manifest.json') continue;
    const src = path.join(claudeDir, entry.name);
    const dest = path.join(backupTarget, entry.name);
    if (entry.isDirectory()) {
      fs.cpSync(src, dest, { recursive: true });
    } else {
      fs.copyFileSync(src, dest);
    }
  }

  console.log(chalk.dim(`  📦 已备份原有配置到 .claude/.backup/backup-${timestamp}`));
}

function renderTemplate(templatePath: string, vars: Record<string, unknown>): string {
  const raw = fs.readFileSync(templatePath, 'utf-8');
  try {
    return ejs.render(raw, vars);
  } catch (err) {
    throw new Error(`模板渲染失败: ${templatePath}\n${(err as Error).message}`);
  }
}

function writeFile(targetPath: string, content: string): void {
  ensureDir(path.dirname(targetPath));
  try {
    fs.writeFileSync(targetPath, content, 'utf-8');
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENOSPC') {
      throw new Error(`磁盘空间不足，无法写入: ${targetPath}\n请清理磁盘后重试，或使用 --overwrite 重新运行`);
    }
    if (code === 'EACCES' || code === 'EPERM') {
      throw new Error(`没有写入权限: ${targetPath}\n请检查目录权限后重试`);
    }
    throw err;
  }
}

function mergeSettings(existingPath: string, newContent: string): string {
  if (!fs.existsSync(existingPath)) return newContent;

  let existing: Record<string, unknown>;
  try {
    existing = JSON.parse(fs.readFileSync(existingPath, 'utf-8'));
  } catch {
    return newContent;
  }

  const newSettings = JSON.parse(newContent);
  return mergeSettingsJson(existing, newSettings);
}

// (appendCLAUDEmd 核心逻辑已移至 src/utils.ts 并导出为 appendCLAUDEmdUtil)
// 这里保留文件 I/O 包装
function appendCLAUDEmd(existingPath: string, newContent: string): string {
  if (!fs.existsSync(existingPath)) return newContent;
  const existing = fs.readFileSync(existingPath, 'utf-8');
  return appendCLAUDEmdUtil(existing, newContent);
}

export async function generate(config: UserConfig): Promise<FileResult[]> {
  const results: FileResult[] = [];
  const { targetDir, overwrite } = config;
  const claudeDir = path.join(targetDir, '.claude');
  const hasExisting = fs.existsSync(claudeDir);

  if (hasExisting && !overwrite) {
    console.log(chalk.yellow('⚠️  检测到已有的 .claude/ 目录，进入合并模式'));
    backupExisting(targetDir);
  } else if (hasExisting && overwrite) {
    console.log(chalk.yellow('⚠️  --overwrite：将覆盖已有配置'));
    backupExisting(targetDir);
  }

  const vars = {
    PROJECT_NAME: config.projectName,
    TECH_STACK: config.techStack,
    USER_LEVEL: config.userLevel,
    MODULES: config.modules.join(', '),
    LANGUAGE: config.language,
    GENERATED_AT: new Date().toISOString(),
  };

  const manifestFiles: string[] = [];

  // Rules
  const ruleFiles = ['development-workflow.md', 'coding-style.md', 'git-workflow.md', 'security.md', 'testing.md', 'patterns.md'];
  if (config.modules.includes('agents')) ruleFiles.push('agents.md');

  console.log(chalk.dim('\n📁 生成规则文件...'));
  for (const file of ruleFiles) {
    const templatePath = path.join(TEMPLATES_DIR, 'rules', file);
    try {
      const rendered = renderTemplate(templatePath, vars);
      const target = path.join(claudeDir, 'rules', file);
      writeFile(target, rendered);
      results.push({ path: target, status: 'created' });
      manifestFiles.push(target);
      console.log(chalk.dim(`  ✅ ${file}`));
    } catch (err) {
      const status: FileResult = { path: file, status: 'error', error: (err as Error).message };
      results.push(status);
      console.log(chalk.red(`  ❌ ${file} — ${(err as Error).message}`));
    }
  }

  // Hooks
  console.log(chalk.dim('\n🔧 生成 Hook 脚本...'));
  const hookFiles = ['post-commit-check.js', 'check-deps.mjs'];
  for (const file of hookFiles) {
    const templatePath = path.join(TEMPLATES_DIR, 'hooks', file);
    try {
      const rendered = renderTemplate(templatePath, vars);
      const target = path.join(claudeDir, 'hooks', file);
      writeFile(target, rendered);
      results.push({ path: target, status: 'created' });
      manifestFiles.push(target);
      console.log(chalk.dim(`  ✅ ${file}`));
    } catch (err) {
      results.push({ path: file, status: 'error', error: (err as Error).message });
      console.log(chalk.red(`  ❌ ${file} — ${(err as Error).message}`));
    }
  }

  // CLAUDE.md — 根据技术栈适配器选择模板
  console.log(chalk.dim('\n📄 生成 CLAUDE.md...'));
  const claudeMdRelative = getClaudeMdTemplate(config.techStack);
  const claudeTemplate = path.join(TEMPLATES_DIR, 'claude-md', claudeMdRelative || 'CLAUDE.zh-CN.md');
  try {
    const rendered = renderTemplate(claudeTemplate, vars);
    const target = path.join(targetDir, 'CLAUDE.md');
    const content = hasExisting && !overwrite ? appendCLAUDEmd(target, rendered) : rendered;
    writeFile(target, content);
    results.push({ path: target, status: hasExisting && !overwrite ? 'merged' : 'created' });
    manifestFiles.push(target);
    console.log(chalk.dim(`  ✅ CLAUDE.md (${hasExisting && !overwrite ? '合并' : '新建'})`));
  } catch (err) {
    results.push({ path: 'CLAUDE.md', status: 'error', error: (err as Error).message });
    console.log(chalk.red(`  ❌ CLAUDE.md — ${(err as Error).message}`));
  }

  // Settings
  console.log(chalk.dim('\n⚙️  生成配置文件...'));
  const settingsTemplate = path.join(TEMPLATES_DIR, 'settings', 'settings.template.json');
  try {
    const rendered = renderTemplate(settingsTemplate, vars);
    const target = path.join(claudeDir, 'settings.json');
    const content = hasExisting && !overwrite ? mergeSettings(target, rendered) : rendered;
    writeFile(target, content);
    results.push({ path: target, status: hasExisting && !overwrite ? 'merged' : 'created' });
    manifestFiles.push(target);
    console.log(chalk.dim(`  ✅ settings.json (${hasExisting && !overwrite ? '合并' : '新建'})`));
  } catch (err) {
    results.push({ path: 'settings.json', status: 'error', error: (err as Error).message });
    console.log(chalk.red(`  ❌ settings.json — ${(err as Error).message}`));
  }

  // Skills recommend (根据技术栈适配器加载)
  const skillsAdapter = getSkillsRecommendPath(config.techStack);
  if (skillsAdapter) {
    const skillsRecPath = path.resolve(__dirname, '..', 'adapters', skillsAdapter);
    if (fs.existsSync(skillsRecPath)) {
      const target = path.join(claudeDir, 'skills.recommend.json');
      fs.copyFileSync(skillsRecPath, target);
      manifestFiles.push(target);
      console.log(chalk.dim(`  ✅ skills.recommend.json (${config.techStack})`));
    }
  }

  // Generate manifest
  ensureDir(claudeDir);
  fs.writeFileSync(
    path.join(claudeDir, '.generated-manifest.json'),
    JSON.stringify(
      {
        generatedBy: 'create-vibe-workflow@0.1.0',
        generatedAt: new Date().toISOString(),
        files: manifestFiles,
      },
      null,
      2,
    ),
  );

  const succeeded = results.filter((r) => r.status !== 'error').length;
  const failed = results.filter((r) => r.status === 'error').length;
  if (failed > 0) {
    throw new Error(`${succeeded}/${results.length} 个文件写入成功，${failed} 个失败`);
  }

  return results;
}

// 已知的工作流生成文件模式（用于 fallback 清理）
const WORKFLOW_PATTERNS = [
  '.claude/rules/development-workflow.md',
  '.claude/rules/coding-style.md',
  '.claude/rules/git-workflow.md',
  '.claude/rules/security.md',
  '.claude/rules/testing.md',
  '.claude/rules/patterns.md',
  '.claude/rules/agents.md',
  '.claude/hooks/post-commit-check.js',
  '.claude/hooks/check-deps.mjs',
  '.claude/settings.json',
  '.claude/skills.recommend.json',
  '.claude/.generated-manifest.json',
];

/**
 * Fallback 清理：当 manifest 不存在或损坏时，
 * 基于已知的文件模式尝试清理工作流生成的文件。
 */
function fallbackCleanup(targetDir: string): void {
  const removed: string[] = [];
  const skipped: string[] = [];

  for (const pattern of WORKFLOW_PATTERNS) {
    const fullPath = path.join(targetDir, pattern);
    if (fs.existsSync(fullPath)) {
      try {
        fs.rmSync(fullPath, { recursive: true });
        removed.push(pattern);
      } catch {
        skipped.push(pattern);
      }
    }
  }

  // 尝试清理 CLAUDE.md 中的 workflow 标记区域
  const claudeMdPath = path.join(targetDir, 'CLAUDE.md');
  if (fs.existsSync(claudeMdPath)) {
    try {
      const content = fs.readFileSync(claudeMdPath, 'utf-8');
      const markerStart = '<!-- WORKFLOW-START -->';
      const markerEnd = '<!-- WORKFLOW-END -->';
      if (content.includes(markerStart) && content.includes(markerEnd)) {
        const before = content.substring(0, content.indexOf(markerStart));
        const after = content.substring(content.indexOf(markerEnd) + markerEnd.length);
        // 如果清理后内容为空或只有空白，删除文件；否则写回
        const cleaned = (before + after).trim();
        if (cleaned.length === 0) {
          fs.unlinkSync(claudeMdPath);
          removed.push('CLAUDE.md');
        } else {
          fs.writeFileSync(claudeMdPath, cleaned + '\n', 'utf-8');
          removed.push('CLAUDE.md (workflow section removed)');
        }
      }
    } catch {
      skipped.push('CLAUDE.md');
    }
  }

  if (removed.length > 0) {
    console.log(chalk.dim('\n  🧹 Fallback 清理已完成：'));
    for (const f of removed) {
      console.log(chalk.dim(`     ✅ ${f}`));
    }
  }
  if (skipped.length > 0) {
    console.log(chalk.yellow(`\n  ⚠️  以下文件无法自动清理（可能需要手动删除）：`));
    for (const f of skipped) {
      console.log(chalk.yellow(`     ❌ ${f}`));
    }
  }
}

export async function uninstall(targetDir: string): Promise<void> {
  const manifestPath = path.join(targetDir, '.claude', '.generated-manifest.json');

  if (!fs.existsSync(manifestPath)) {
    console.log(chalk.yellow('\n⚠️  未找到安装清单（.generated-manifest.json）'));
    console.log(chalk.dim('  尝试基于已知文件模式进行 fallback 清理...\n'));
    fallbackCleanup(targetDir);
    console.log(chalk.green('\n✅ Fallback 清理完成'));
    return;
  }

  // 尝试解析 manifest，如果损坏则 fallback
  let manifest: { files?: string[] };
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    if (!Array.isArray(manifest.files)) throw new Error('invalid manifest format');
  } catch {
    console.log(chalk.yellow('\n⚠️  安装清单已损坏，无法正常读取'));
    console.log(chalk.dim('  切换到 fallback 清理模式...\n'));
    fs.rmSync(manifestPath, { force: true });
    fallbackCleanup(targetDir);
    console.log(chalk.green('\n✅ Fallback 清理完成'));
    return;
  }

  // 正常卸载流程
  const backupDir = path.join(targetDir, '.claude', '.backup');
  ensureDir(backupDir);

  for (const file of manifest.files) {
    if (fs.existsSync(file)) {
      console.log(chalk.dim(`  🗑️  删除: ${file}`));
      fs.rmSync(file, { recursive: true });
    }
  }

  fs.rmSync(manifestPath);
  console.log(chalk.green('✅ 已清理所有生成的文件'));
}
