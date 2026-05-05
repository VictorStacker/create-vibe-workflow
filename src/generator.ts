import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ejs from 'ejs';
import chalk from 'chalk';
import type { UserConfig } from './questions.js';

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
  const merged = deepMerge(existing, newSettings);
  return JSON.stringify(merged, null, 2) + '\n';
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (key === 'meta') continue;
    if (isObject(source[key]) && isObject(result[key])) {
      result[key] = deepMerge(
        result[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>,
      );
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function appendCLAUDEmd(existingPath: string, newContent: string): string {
  if (!fs.existsSync(existingPath)) return newContent;

  const existing = fs.readFileSync(existingPath, 'utf-8');
  const markerStart = '<!-- WORKFLOW-START -->';
  const markerEnd = '<!-- WORKFLOW-END -->';

  if (existing.includes(markerStart)) {
    const before = existing.substring(0, existing.indexOf(markerStart));
    const after = existing.substring(existing.indexOf(markerEnd) + markerEnd.length);
    const workflowSection = newContent.substring(
      newContent.indexOf(markerStart),
      newContent.indexOf(markerEnd) + markerEnd.length,
    );
    return before + workflowSection + after;
  }

  return existing + '\n' + newContent;
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

  // CLAUDE.md
  console.log(chalk.dim('\n📄 生成 CLAUDE.md...'));
  const claudeTemplate = path.join(TEMPLATES_DIR, 'claude-md', 'CLAUDE.zh-CN.md');
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

  // Skills recommend (if nestjs-nextjs adapter)
  if (config.techStack === 'nestjs-nextjs') {
    const skillsRecPath = path.resolve(__dirname, '..', 'adapters', 'nestjs-nextjs', 'skills.recommend.json');
    if (fs.existsSync(skillsRecPath)) {
      const target = path.join(claudeDir, 'skills.recommend.json');
      fs.copyFileSync(skillsRecPath, target);
      manifestFiles.push(target);
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

export async function uninstall(targetDir: string): Promise<void> {
  const manifestPath = path.join(targetDir, '.claude', '.generated-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.log(chalk.yellow('⚠️  未找到安装清单，无法自动卸载'));
    console.log(chalk.dim('请手动删除 .claude/ 目录及相关文件'));
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
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
