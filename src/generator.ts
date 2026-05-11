import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ejs from 'ejs';
import chalk from 'chalk';
import type { UserConfig } from './questions.js';
import { getClaudeMdTemplate, getSkillsRecommendPath } from './questions.js';
import {
  appendCLAUDEmd as appendCLAUDEmdUtil,
  mergeSettingsJson,
  resolveSelectedSkills,
  getSkillTemplateDir,
  loadSkillManifest,
  wrapCodexSkillContent,
  getCodexSkillName,
} from './utils.js';

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

  // 解析技能列表
  let selectedSkills: string[] = [];
  try {
    const manifest = loadSkillManifest(TEMPLATES_DIR);
    selectedSkills = resolveSelectedSkills(
      {
        projectType: config.projectType,
        needsDb: config.needsDb,
        userLevel: config.userLevel,
        selectedDomains: config.selectedDomains,
      },
      manifest,
    );
  } catch {
    selectedSkills = [];
  }

  const vars = {
    PROJECT_NAME: config.projectName,
    TECH_STACK: config.techStack,
    USER_LEVEL: config.userLevel,
    MODULES: config.modules.join(', '),
    LANGUAGE: config.language,
    GENERATED_AT: new Date().toISOString(),
    PROJECT_TYPE: config.projectType,
    NEEDS_DB: config.needsDb ? 'true' : 'false',
    SELECTED_DOMAINS: config.selectedDomains,
    SELECTED_SKILLS: selectedSkills,
    SKILLS: selectedSkills.join(', '),
  };

  const manifestFiles: string[] = [];

  // ── Rules ──
  const ruleFiles = [
    'development-workflow.md', 'coding-style.md', 'git-workflow.md',
    'security.md', 'testing.md', 'patterns.md',
    'performance.md', 'hooks.md', 'memory.md',
  ];
  if (config.modules.includes('agents')) ruleFiles.push('agents.md');

  console.log(chalk.dim('\n📁 生成规则文件...'));
  for (const file of ruleFiles) {
    const templatePath = path.join(TEMPLATES_DIR, 'rules', file);
    if (!fs.existsSync(templatePath)) {
      console.log(chalk.dim(`  ⏭ ${file} (模板不存在)`));
      continue;
    }
    try {
      const rendered = renderTemplate(templatePath, vars);
      const target = path.join(claudeDir, 'rules', file);
      writeFile(target, rendered);
      results.push({ path: target, status: 'created' });
      manifestFiles.push(target);
      console.log(chalk.dim(`  ✅ ${file}`));
    } catch (err) {
      results.push({ path: file, status: 'error', error: (err as Error).message });
      console.log(chalk.red(`  ❌ ${file} — ${(err as Error).message}`));
    }
  }

  // ── Hooks ──
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

  // ── Skills ──
  if (selectedSkills.length > 0) {
    console.log(chalk.dim(`\n🧠 生成技能文件（${selectedSkills.length} 个）...`));
    let manifest: ReturnType<typeof loadSkillManifest> | null = null;
    try { manifest = loadSkillManifest(TEMPLATES_DIR); } catch { /* skip */ }

    const skillsTemplatesDir = path.join(TEMPLATES_DIR, 'skills');
    for (const skillName of selectedSkills) {
      const domainDir = manifest ? getSkillTemplateDir(skillName, manifest) : 'workflow';
      const templatePath = path.join(skillsTemplatesDir, domainDir, skillName, 'SKILL.md.ejs');
      if (!fs.existsSync(templatePath)) {
        console.log(chalk.dim(`  ⏭ ${skillName}/SKILL.md (模板不存在)`));
        continue;
      }
      try {
        const rendered = renderTemplate(templatePath, vars);
        const target = path.join(claudeDir, 'skills', skillName, 'SKILL.md');
        writeFile(target, rendered);
        results.push({ path: target, status: 'created' });
        manifestFiles.push(target);
        console.log(chalk.dim(`  ✅ ${skillName}/SKILL.md`));
      } catch (err) {
        results.push({ path: `skills/${skillName}`, status: 'error', error: (err as Error).message });
        console.log(chalk.red(`  ❌ ${skillName} — ${(err as Error).message}`));
      }
    }
  }

  // ── Commands ──
  {
    const commandsRoot = path.join(TEMPLATES_DIR, 'commands');
    if (fs.existsSync(commandsRoot)) {
      console.log(chalk.dim('\n📋 生成命令文件...'));
      const categories = fs.readdirSync(commandsRoot, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);
      for (const category of categories) {
        const categoryDir = path.join(commandsRoot, category);
        const files = fs.readdirSync(categoryDir).filter((f) => f.endsWith('.md.ejs'));
        if (files.length === 0) continue;
        for (const file of files) {
          const templatePath = path.join(categoryDir, file);
          try {
            const rendered = renderTemplate(templatePath, vars);
            const outName = file.replace(/\.ejs$/, '');
            const target = path.join(claudeDir, 'commands', category, outName);
            writeFile(target, rendered);
            results.push({ path: target, status: 'created' });
            manifestFiles.push(target);
            console.log(chalk.dim(`  ✅ commands/${category}/${outName}`));
          } catch (err) {
            results.push({ path: `commands/${category}/${file}`, status: 'error', error: (err as Error).message });
            console.log(chalk.red(`  ❌ commands/${category}/${file} — ${(err as Error).message}`));
          }
        }
      }
    }
  }

  // ── Memory ──
  {
    const memoryTemplatesDir = path.join(TEMPLATES_DIR, 'memory');
    if (fs.existsSync(memoryTemplatesDir)) {
      console.log(chalk.dim('\n📝 生成 Memory 文件...'));
      const memoryFiles = [
        { tpl: 'MEMORY.md.ejs', out: 'MEMORY.md' },
        { tpl: 'dev-notes.md.ejs', out: 'dev-notes.md' },
        { tpl: 'troubleshooting.md.ejs', out: 'troubleshooting.md' },
      ];
      for (const { tpl, out } of memoryFiles) {
        const templatePath = path.join(memoryTemplatesDir, tpl);
        if (!fs.existsSync(templatePath)) continue;
        const target = path.join(claudeDir, 'memory', out);

        // 合并模式下 memory 文件绝对不覆盖
        if (hasExisting && !overwrite && fs.existsSync(target)) {
          results.push({ path: target, status: 'skipped' });
          console.log(chalk.dim(`  ⏭ memory/${out} (已存在，跳过不覆盖)`));
          continue;
        }

        try {
          const rendered = renderTemplate(templatePath, vars);
          writeFile(target, rendered);
          results.push({ path: target, status: 'created' });
          manifestFiles.push(target);
          console.log(chalk.dim(`  ✅ memory/${out}`));
        } catch (err) {
          results.push({ path: `memory/${out}`, status: 'error', error: (err as Error).message });
          console.log(chalk.red(`  ❌ memory/${out} — ${(err as Error).message}`));
        }
      }

      // .gitkeep
      const gitkeepPath = path.join(claudeDir, 'memory', '.gitkeep');
      if (!fs.existsSync(gitkeepPath)) {
        writeFile(gitkeepPath, '');
        manifestFiles.push(gitkeepPath);
      }
    }
  }

  // ── CLAUDE.md ──
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

  // ── Settings ──
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

  // ── Skills recommend (适配器) ──
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

  // ── skills-lock.json ──
  {
    const lockTemplate = path.join(TEMPLATES_DIR, 'skills', 'skills-lock.template.json');
    if (fs.existsSync(lockTemplate)) {
      const target = path.join(claudeDir, 'skills-lock.json');
      if (!hasExisting || overwrite || !fs.existsSync(target)) {
        fs.copyFileSync(lockTemplate, target);
        manifestFiles.push(target);
      } else {
        console.log(chalk.dim('  ⏭ skills-lock.json (已存在，保留自定义配置)'));
      }
    }
  }

  // ── Manifest ──
  ensureDir(claudeDir);
  fs.writeFileSync(
    path.join(claudeDir, '.generated-manifest.json'),
    JSON.stringify(
      {
        generatedBy: 'create-vibe-workflow@0.3.0',
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

// ══════════════════════════════════════════════════
// Codex 生成
// ══════════════════════════════════════════════════

export async function generateForCodex(config: UserConfig): Promise<FileResult[]> {
  const results: FileResult[] = [];
  const { targetDir, overwrite } = config;
  const codexDir = path.join(targetDir, '.codex');
  const agentsDir = path.join(targetDir, '.agents');
  const memoryDir = path.join(targetDir, '.claude', 'memory');
  const hasExistingCodex = fs.existsSync(codexDir) || fs.existsSync(agentsDir);

  if (hasExistingCodex && !overwrite) {
    console.log(chalk.yellow('⚠️  检测到已有的 .codex/ 或 .agents/ 目录，进入合并模式'));
    backupExisting(path.join(targetDir, '.codex'));
    backupExisting(path.join(targetDir, '.agents'));
  } else if (hasExistingCodex && overwrite) {
    console.log(chalk.yellow('⚠️  --overwrite：将覆盖已有配置'));
  }

  // 解析技能列表
  let selectedSkills: string[] = [];
  try {
    const manifest = loadSkillManifest(TEMPLATES_DIR);
    selectedSkills = resolveSelectedSkills(
      { projectType: config.projectType, needsDb: config.needsDb,
        userLevel: config.userLevel, selectedDomains: config.selectedDomains },
      manifest,
    );
  } catch { selectedSkills = []; }

  const vars = {
    PROJECT_NAME: config.projectName, TECH_STACK: config.techStack,
    USER_LEVEL: config.userLevel, MODULES: config.modules.join(', '),
    LANGUAGE: config.language, GENERATED_AT: new Date().toISOString(),
    PROJECT_TYPE: config.projectType, NEEDS_DB: config.needsDb ? 'true' : 'false',
    SELECTED_DOMAINS: config.selectedDomains, SELECTED_SKILLS: selectedSkills,
    SKILLS: selectedSkills.join(', '),
  };

  const manifestFiles: string[] = [];

  // ── Skills (Codex: .agents/skills/ + YAML frontmatter) ──
  if (selectedSkills.length > 0) {
    console.log(chalk.dim(`\n🧠 生成 Codex 技能文件（${selectedSkills.length} 个）...`));
    let manifest: ReturnType<typeof loadSkillManifest> | null = null;
    try { manifest = loadSkillManifest(TEMPLATES_DIR); } catch { /* skip */ }

    const skillsTemplatesDir = path.join(TEMPLATES_DIR, 'skills');
    for (const skillName of selectedSkills) {
      const domainDir = manifest ? getSkillTemplateDir(skillName, manifest) : 'workflow';
      const templatePath = path.join(skillsTemplatesDir, domainDir, skillName, 'SKILL.md.ejs');
      if (!fs.existsSync(templatePath)) { continue; }
      try {
        const rawRendered = renderTemplate(templatePath, vars);
        const content = wrapCodexSkillContent(skillName, rawRendered, false);
        const target = path.join(agentsDir, 'skills', skillName, 'SKILL.md');
        writeFile(target, content);
        results.push({ path: target, status: 'created' });
        manifestFiles.push(target);
        console.log(chalk.dim(`  ✅ skills/${skillName}/SKILL.md`));
      } catch (err) {
        results.push({ path: `skills/${skillName}`, status: 'error', error: (err as Error).message });
      }
    }
  }

  // ── Commands → Codex Skills ──
  {
    const commandsRoot = path.join(TEMPLATES_DIR, 'commands');
    if (fs.existsSync(commandsRoot)) {
      console.log(chalk.dim('\n📋 命令 → Codex Skills...'));
      const categories = fs.readdirSync(commandsRoot, { withFileTypes: true })
        .filter(d => d.isDirectory()).map(d => d.name);
      for (const category of categories) {
        const categoryDir = path.join(commandsRoot, category);
        const files = fs.readdirSync(categoryDir).filter(f => f.endsWith('.md.ejs'));
        for (const file of files) {
          const templatePath = path.join(categoryDir, file);
          try {
            const rawRendered = renderTemplate(templatePath, vars);
            const cmdName = file.replace('.md.ejs', '');
            const codexName = getCodexSkillName(cmdName);
            const content = wrapCodexSkillContent(cmdName, rawRendered, true);
            const target = path.join(agentsDir, 'skills', codexName, 'SKILL.md');
            writeFile(target, content);
            results.push({ path: target, status: 'created' });
            manifestFiles.push(target);
            console.log(chalk.dim(`  ✅ skills/${codexName}/SKILL.md (from command ${cmdName})`));
          } catch (err) {
            results.push({ path: `skills/${file}`, status: 'error', error: (err as Error).message });
          }
        }
      }
    }
  }

  // ── Memory (shared, same as Claude Code) ──
  {
    const memoryTemplatesDir = path.join(TEMPLATES_DIR, 'memory');
    if (fs.existsSync(memoryTemplatesDir)) {
      console.log(chalk.dim('\n📝 生成 Memory 文件...'));
      const memoryFiles = [
        { tpl: 'MEMORY.md.ejs', out: 'MEMORY.md' },
        { tpl: 'dev-notes.md.ejs', out: 'dev-notes.md' },
        { tpl: 'troubleshooting.md.ejs', out: 'troubleshooting.md' },
      ];
      for (const { tpl, out } of memoryFiles) {
        const templatePath = path.join(memoryTemplatesDir, tpl);
        if (!fs.existsSync(templatePath)) continue;
        const target = path.join(memoryDir, out);
        if (hasExistingCodex && !overwrite && fs.existsSync(target)) continue;
        try {
          const rendered = renderTemplate(templatePath, vars);
          writeFile(target, rendered);
          results.push({ path: target, status: 'created' });
          manifestFiles.push(target);
          console.log(chalk.dim(`  ✅ memory/${out}`));
        } catch (err) { /* skip */ }
      }
      const gitkeepPath = path.join(memoryDir, '.gitkeep');
      if (!fs.existsSync(gitkeepPath)) { writeFile(gitkeepPath, ''); manifestFiles.push(gitkeepPath); }
    }
  }

  // ── AGENTS.md (with rules merged) ──
  console.log(chalk.dim('\n📄 生成 AGENTS.md（含规则内容）...'));
  const agentsTemplate = path.join(TEMPLATES_DIR, 'codex', 'agents.base.md.ejs');
  if (fs.existsSync(agentsTemplate)) {
    try {
      let agentsContent = renderTemplate(agentsTemplate, vars);

      // 拼接所有规则文件到 WORKFLOW-END 之前
      const ruleFiles = [
        'development-workflow.md', 'coding-style.md', 'git-workflow.md',
        'security.md', 'testing.md', 'patterns.md',
        'performance.md', 'hooks.md', 'memory.md',
      ];
      if (config.modules.includes('agents')) ruleFiles.push('agents.md');

      const rulesContentParts: string[] = [];
      for (const file of ruleFiles) {
        const rulePath = path.join(TEMPLATES_DIR, 'rules', file);
        if (fs.existsSync(rulePath)) {
          const ruleContent = renderTemplate(rulePath, vars);
          const ruleName = file.replace('.md', '');
          rulesContentParts.push(`\n## Rule: ${ruleName}\n\n${ruleContent}`);
        }
      }

      if (rulesContentParts.length > 0) {
        const markerEnd = '<!-- WORKFLOW-END -->';
        agentsContent = agentsContent.replace(
          markerEnd,
          rulesContentParts.join('\n') + '\n' + markerEnd,
        );
      }

      const target = path.join(targetDir, 'AGENTS.md');
      const content = hasExistingCodex && !overwrite
        ? appendCLAUDEmdUtil(fs.existsSync(target) ? fs.readFileSync(target, 'utf-8') : '', agentsContent)
        : agentsContent;
      writeFile(target, content);
      results.push({ path: target, status: hasExistingCodex && !overwrite ? 'merged' : 'created' });
      manifestFiles.push(target);
      console.log(chalk.dim(`  ✅ AGENTS.md (${hasExistingCodex && !overwrite ? '合并' : '新建'}, ${ruleFiles.length} rules 合并)`));
    } catch (err) {
      results.push({ path: 'AGENTS.md', status: 'error', error: (err as Error).message });
    }
  }

  // ── config.toml ──
  console.log(chalk.dim('\n⚙️  生成 Codex 配置...'));
  const configTomlTemplate = path.join(TEMPLATES_DIR, 'codex', 'config.toml.ejs');
  if (fs.existsSync(configTomlTemplate)) {
    try {
      const rendered = renderTemplate(configTomlTemplate, vars);
      const target = path.join(codexDir, 'config.toml');
      writeFile(target, rendered);
      results.push({ path: target, status: 'created' });
      manifestFiles.push(target);
      console.log(chalk.dim('  ✅ config.toml'));
    } catch (err) {
      results.push({ path: 'config.toml', status: 'error', error: (err as Error).message });
    }
  }

  // ── hooks.json ──
  console.log(chalk.dim('\n🔧 生成 Codex hooks...'));
  const hooksJson = JSON.stringify({
    PostToolUse: [{
      matcher: '^Bash$',
      hooks: [{
        type: 'command',
        command: process.platform === 'win32'
          ? 'echo ⚠️ 文档反写检查: 改了DB schema?→docs/database-schema.md 改了API?→docs/api-design.md 新功能?→docs/PRD.md'
          : 'bash -c \'echo \"⚠️ 文档反写检查: 改了DB schema?→docs/database-schema.md 改了API?→docs/api-design.md 新功能?→docs/PRD.md\"\'',
        timeout: 5,
        statusMessage: '文档反写检查',
      }],
    }],
  }, null, 2) + '\n';
  const hooksTarget = path.join(codexDir, 'hooks.json');
  writeFile(hooksTarget, hooksJson);
  results.push({ path: hooksTarget, status: 'created' });
  manifestFiles.push(hooksTarget);
  console.log(chalk.dim('  ✅ hooks.json'));

  // ── skills-lock.json ──
  {
    const lockTemplate = path.join(TEMPLATES_DIR, 'skills', 'skills-lock.template.json');
    if (fs.existsSync(lockTemplate)) {
      const target = path.join(agentsDir, 'skills-lock.json');
      if (!hasExistingCodex || overwrite || !fs.existsSync(target)) {
        fs.copyFileSync(lockTemplate, target);
        manifestFiles.push(target);
      }
    }
  }

  // ── Skills recommend ──
  const skillsAdapter = getSkillsRecommendPath(config.techStack);
  if (skillsAdapter) {
    const skillsRecPath = path.resolve(__dirname, '..', 'adapters', skillsAdapter);
    if (fs.existsSync(skillsRecPath)) {
      const target = path.join(agentsDir, 'skills.recommend.json');
      fs.copyFileSync(skillsRecPath, target);
      manifestFiles.push(target);
    }
  }

  // ── Manifest ──
  ensureDir(codexDir);
  fs.writeFileSync(
    path.join(codexDir, '.generated-manifest.json'),
    JSON.stringify({
      generatedBy: 'create-vibe-workflow@0.3.0',
      generatedAt: new Date().toISOString(),
      tool: 'codex',
      files: manifestFiles,
    }, null, 2),
  );

  const succeeded = results.filter(r => r.status !== 'error').length;
  const failed = results.filter(r => r.status === 'error').length;
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
  '.claude/rules/performance.md',
  '.claude/rules/hooks.md',
  '.claude/rules/memory.md',
  '.claude/hooks/post-commit-check.js',
  '.claude/hooks/check-deps.mjs',
  '.claude/settings.json',
  '.claude/skills.recommend.json',
  '.claude/skills-lock.json',
  '.claude/skills',
  '.claude/commands',
  '.claude/memory',
  '.claude/.generated-manifest.json',
];

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

  const claudeMdPath = path.join(targetDir, 'CLAUDE.md');
  if (fs.existsSync(claudeMdPath)) {
    try {
      const content = fs.readFileSync(claudeMdPath, 'utf-8');
      const markerStart = '<!-- WORKFLOW-START -->';
      const markerEnd = '<!-- WORKFLOW-END -->';
      if (content.includes(markerStart) && content.includes(markerEnd)) {
        const before = content.substring(0, content.indexOf(markerStart));
        const after = content.substring(content.indexOf(markerEnd) + markerEnd.length);
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
