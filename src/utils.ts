// 核心工具函数 — 导出供测试使用

import { readFileSync } from 'node:fs';

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
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

/**
 * 合并 CLAUDE.md 内容
 * - 如果已有文件包含 WORKFLOW 标记，替换标记区间
 * - 否则追加到末尾
 */
export function appendCLAUDEmd(existingContent: string, newContent: string): string {
  const markerStart = '<!-- WORKFLOW-START -->';
  const markerEnd = '<!-- WORKFLOW-END -->';

  if (existingContent.includes(markerStart)) {
    const before = existingContent.substring(0, existingContent.indexOf(markerStart));
    const after = existingContent.substring(
      existingContent.indexOf(markerEnd) + markerEnd.length,
    );
    const workflowSection = newContent.substring(
      newContent.indexOf(markerStart),
      newContent.indexOf(markerEnd) + markerEnd.length,
    );
    return before + workflowSection + after;
  }

  return existingContent + '\n' + newContent;
}

/**
 * 深度合并 settings.json
 * - meta 键不被覆盖
 * - 嵌套对象递归合并
 * - 数组和基本类型直接替换
 */
export function mergeSettingsJson(existing: Record<string, unknown>, newSettings: Record<string, unknown>): string {
  const merged = deepMerge(existing, newSettings);
  return JSON.stringify(merged, null, 2) + '\n';
}

// ────────────────────────────────────────────────
// Skill 解析
// ────────────────────────────────────────────────

export type ProjectType = 'web' | 'api' | 'fullstack' | 'other';

export interface SkillManifest {
  version: number;
  domains: Record<string, {
    always?: boolean;
    manual?: boolean;
    projectTypes?: string[];
    needsDb?: boolean;
    userLevel?: string;
    label: string;
    desc: string;
    skills: string[];
  }>;
}

export interface SkillSelectionInput {
  projectType: ProjectType;
  needsDb: boolean;
  userLevel: 'vibe-coder' | 'developer';
  selectedDomains: string[];
}

export function resolveSelectedSkills(input: SkillSelectionInput, manifest: SkillManifest): string[] {
  const skills = new Set<string>();

  for (const [domainKey, domain] of Object.entries(manifest.domains)) {
    if (domain.always) {
      if (input.selectedDomains.includes(domainKey)) {
        domain.skills.forEach(s => skills.add(s));
      }
      continue;
    }

    if (domain.manual) {
      if (input.selectedDomains.includes(domainKey)) {
        domain.skills.forEach(s => skills.add(s));
      }
      continue;
    }

    if (domain.projectTypes && input.selectedDomains.includes(domainKey)) {
      if (domain.projectTypes.includes(input.projectType)) {
        domain.skills.forEach(s => skills.add(s));
      }
      continue;
    }

    if (domain.needsDb && input.needsDb && input.selectedDomains.includes(domainKey)) {
      domain.skills.forEach(s => skills.add(s));
      continue;
    }

    if (domain.userLevel && input.userLevel === domain.userLevel && input.selectedDomains.includes(domainKey)) {
      domain.skills.forEach(s => skills.add(s));
      continue;
    }
  }

  return [...skills].sort();
}

export function getSkillTemplateDir(skillName: string, manifest: SkillManifest): string {
  for (const [domainKey, domain] of Object.entries(manifest.domains)) {
    if (domain.skills.includes(skillName)) {
      return domainKey;
    }
  }
  return 'workflow';
}

export function loadSkillManifest(templatesDir: string): SkillManifest {
  const manifestPath = `${templatesDir}/skills/skill-manifest.json`;
  return JSON.parse(readFileSync(manifestPath, 'utf-8'));
}

export function getRecommendedDomains(projectType: ProjectType, needsDb: boolean, userLevel: 'vibe-coder' | 'developer'): string[] {
  const domains: string[] = ['workflow'];

  if (projectType === 'web' || projectType === 'fullstack') {
    domains.push('frontend', 'testing');
  }
  if (projectType === 'api' || projectType === 'fullstack') {
    domains.push('backend');
    if (needsDb) domains.push('database');
    if (!domains.includes('testing')) domains.push('testing');
  }
  if (projectType === 'other') {
    domains.push('testing');
  }
  if (userLevel === 'developer') {
    domains.push('advanced');
  }

  return domains;
}

// ────────────────────────────────────────────────
// Codex 适配
// ────────────────────────────────────────────────

/**
 * Skill → Codex YAML frontmatter 触发描述映射
 * description 写成触发条件（Codex 用此自动匹配），而非摘要
 */
const SKILL_CODEX_DESCRIPTIONS: Record<string, string> = {
  'tdd-workflow': 'Use when writing new features, fixing bugs, or refactoring code — enforces test-driven development with RED-GREEN-REFACTOR cycle and 80% coverage',
  'verification-loop': 'Use before claiming work is complete, fixed, or passing — runs build, type check, lint, tests, security scan, and diff review',
  'security-review': 'Use when adding authentication, handling user input, working with secrets, creating API endpoints, or implementing payment features',
  'coding-standards': 'Use when writing any TypeScript/JavaScript code — enforces immutability, file organization, error handling, naming conventions',
  'search-first': 'Use before writing any custom implementation — search for existing tools, libraries, and patterns first',
  'strategic-compact': 'Use at logical boundaries during long sessions — suggests manual context compaction to preserve context through task phases',
  'frontend-patterns': 'Use when building UI components or pages — component composition, state management, performance optimization patterns',
  'backend-patterns': 'Use when designing APIs, services, or data access layers — Repository pattern, Service layer, middleware, caching strategies',
  'postgres-patterns': 'Use when writing SQL, designing schemas, creating indexes, or optimizing queries for PostgreSQL',
  'database-migrations': 'Use when adding or modifying database schema — safe migration patterns, zero-downtime changes, rollback strategies',
  'e2e-testing': 'Use when writing end-to-end tests with Playwright — Page Object Model, selector strategies, CI integration',
  'docker-patterns': 'Use when creating Dockerfiles or docker-compose.yml — multi-stage builds, security hardening, service orchestration',
  'deployment-patterns': 'Use when setting up CI/CD pipelines, deployment strategies, health checks, or monitoring',
  'caveman': 'Use when the user asks for extremely concise communication — reduces token usage by ~75%',
  'diagnose': 'Use when debugging difficult bugs or performance regressions — strict observe-hypothesize-verify-fix-confirm loop',
  'improve-codebase-architecture': 'Use when analyzing codebase structure for friction points — depth and seam analysis, refactoring priority matrix',
  'grill-with-docs': 'Use when reviewing a plan or design document — adversarial review against documentation, assumption checking',
};

/** 命令名 → Codex skill 名映射（仅本工具独有的命令） */
const COMMAND_TO_CODEX_SKILL: Record<string, string> = {
  'propose': 'opsx-propose',
  'archive': 'opsx-archive',
  'explore': 'opsx-explore',
};

/** 命令 → Codex 触发描述 */
const COMMAND_CODEX_DESCRIPTIONS: Record<string, string> = {
  'propose': 'Use when starting a new feature or change — creates proposal.md, design.md, and tasks.md in human-readable format for review',
  'archive': 'Use when all tasks in a change are complete — moves the change to archive with date prefix',
  'explore': 'Use when thinking through a problem, investigating code, or comparing options — read-only exploration mode, no code changes',
};

/**
 * 为 skill 内容生成 Codex YAML frontmatter
 */
export function generateCodexSkillFrontmatter(skillName: string): string {
  const desc = SKILL_CODEX_DESCRIPTIONS[skillName] || `Use when working with ${skillName}`;
  return [
    '---',
    `name: ${skillName}`,
    `description: ${desc}`,
    '---',
    '',
  ].join('\n');
}

/**
 * 获取命令对应的 Codex skill 名
 */
export function getCodexSkillName(commandName: string): string {
  return COMMAND_TO_CODEX_SKILL[commandName] || commandName;
}

/**
 * 获取 Codex skill 的描述（触发词）
 */
export function getCodexSkillDescription(name: string, isCommand: boolean): string {
  if (isCommand) return COMMAND_CODEX_DESCRIPTIONS[name] || `Use ${name} command`;
  return SKILL_CODEX_DESCRIPTIONS[name] || `Use when working with ${name}`;
}

/**
 * 为 Codex 构建带 YAML frontmatter 的 skill 内容
 */
export function wrapCodexSkillContent(skillName: string, rawContent: string, isCommand: boolean): string {
  const desc = getCodexSkillDescription(skillName, isCommand);
  const codexName = isCommand ? getCodexSkillName(skillName) : skillName;
  const frontmatter = [
    '---',
    `name: ${codexName}`,
    `description: ${desc}`,
    '---',
    '',
  ].join('\n');
  return frontmatter + rawContent;
}
