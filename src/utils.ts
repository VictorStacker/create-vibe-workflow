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
