import { describe, it, expect } from 'vitest';
import {
  isObject, deepMerge, appendCLAUDEmd, mergeSettingsJson,
  resolveSelectedSkills, getSkillTemplateDir, getRecommendedDomains,
} from '../src/utils.js';
import type { SkillManifest, SkillSelectionInput } from '../src/utils.js';

// ────────────────────────────────────────────────
// isObject
// ────────────────────────────────────────────────
describe('isObject', () => {
  it('should return true for plain objects', () => {
    expect(isObject({})).toBe(true);
    expect(isObject({ a: 1 })).toBe(true);
  });

  it('should return false for arrays', () => {
    expect(isObject([1, 2, 3])).toBe(false);
    expect(isObject([])).toBe(false);
  });

  it('should return false for null', () => {
    expect(isObject(null)).toBe(false);
  });

  it('should return false for primitives', () => {
    expect(isObject('string')).toBe(false);
    expect(isObject(42)).toBe(false);
    expect(isObject(true)).toBe(false);
    expect(isObject(undefined)).toBe(false);
  });
});

// ────────────────────────────────────────────────
// deepMerge
// ────────────────────────────────────────────────
describe('deepMerge', () => {
  it('should shallow clone target', () => {
    const target = { a: 1 };
    const result = deepMerge(target, { b: 2 });
    expect(result).toEqual({ a: 1, b: 2 });
    expect(result).not.toBe(target); // 新对象
  });

  it('should overwrite primitive values', () => {
    expect(deepMerge({ a: 1 }, { a: 2 })).toEqual({ a: 2 });
  });

  it('should recursively merge nested objects', () => {
    const target = { nested: { x: 1, y: 2 } };
    const source = { nested: { y: 3, z: 4 } };
    expect(deepMerge(target, source)).toEqual({
      nested: { x: 1, y: 3, z: 4 },
    });
  });

  it('should replace arrays (not merge)', () => {
    const target = { items: [1, 2] };
    const source = { items: [3, 4] };
    expect(deepMerge(target, source)).toEqual({ items: [3, 4] });
  });

  it('should skip meta key', () => {
    const target = { meta: { old: true }, data: 1 };
    const source = { meta: { new: true }, data: 2, extra: 3 };
    expect(deepMerge(target, source)).toEqual({
      meta: { old: true }, // 不被覆盖
      data: 2,
      extra: 3,
    });
  });

  it('should add new keys from source', () => {
    expect(deepMerge({ a: 1 }, { b: 2, c: 3 })).toEqual({
      a: 1,
      b: 2,
      c: 3,
    });
  });

  it('should handle empty objects', () => {
    expect(deepMerge({}, {})).toEqual({});
    expect(deepMerge({ a: 1 }, {})).toEqual({ a: 1 });
    expect(deepMerge({}, { b: 2 })).toEqual({ b: 2 });
  });

  it('should handle 3-level deep nesting', () => {
    const target = { l1: { l2: { l3: { a: 1, b: 2 } } } };
    const source = { l1: { l2: { l3: { b: 3, c: 4 } } } };
    expect(deepMerge(target, source)).toEqual({
      l1: { l2: { l3: { a: 1, b: 3, c: 4 } } },
    });
  });

  it('should handle source value being null (overwrite)', () => {
    expect(deepMerge({ a: { nested: true } }, { a: null })).toEqual({
      a: null,
    });
  });
});

// ────────────────────────────────────────────────
// appendCLAUDEmd
// ────────────────────────────────────────────────
describe('appendCLAUDEmd', () => {
  const WORKFLOW_SECTION = `<!-- WORKFLOW-START -->
## AI 协作工具链
Workflow content here.
<!-- WORKFLOW-END -->`;

  it('should return newContent when existing has no markers', () => {
    const existing = '# My Project\n\nSome custom content.';
    const result = appendCLAUDEmd(existing, WORKFLOW_SECTION);
    expect(result).toBe(existing + '\n' + WORKFLOW_SECTION);
  });

  it('should replace workflow section when markers exist in existing', () => {
    const existing = `# My Project\n<!-- WORKFLOW-START -->\nOld workflow content\n<!-- WORKFLOW-END -->\nSome footer`;
    const result = appendCLAUDEmd(existing, WORKFLOW_SECTION);
    expect(result).toContain('Workflow content here.');
    expect(result).not.toContain('Old workflow content');
    expect(result).toContain('Some footer'); // 标记外的内容保留
  });

  it('should preserve content before WORKFLOW-START', () => {
    const existing = '# Header\n<!-- WORKFLOW-START -->\nOld\n<!-- WORKFLOW-END -->';
    const result = appendCLAUDEmd(existing, WORKFLOW_SECTION);
    expect(result.startsWith('# Header\n')).toBe(true);
  });

  it('should preserve content after WORKFLOW-END', () => {
    const existing = `<!-- WORKFLOW-START -->\nOld\n<!-- WORKFLOW-END -->\n## Footer`;
    const result = appendCLAUDEmd(existing, WORKFLOW_SECTION);
    expect(result).toContain('## Footer');
  });

  it('should handle empty existing content', () => {
    const result = appendCLAUDEmd('', WORKFLOW_SECTION);
    expect(result).toBe('\n' + WORKFLOW_SECTION);
  });

  it('should handle multiple occurrences (use first marker pair)', () => {
    const existing = `<!-- WORKFLOW-START -->First<!-- WORKFLOW-END -->
some text
<!-- WORKFLOW-START -->Second<!-- WORKFLOW-END -->`;
    const result = appendCLAUDEmd(existing, WORKFLOW_SECTION);
    // indexOf 取第一个 START/END，所以只有第一组被替换
    expect(result.indexOf('Workflow content here.')).toBeGreaterThan(0);
    expect(result).not.toContain('First');
  });
});

// ────────────────────────────────────────────────
// mergeSettingsJson
// ────────────────────────────────────────────────
describe('mergeSettingsJson', () => {
  it('should merge two settings objects', () => {
    const existing = {
      meta: { generatedBy: 'old' },
      dependencies: { required: ['gstack'] },
    };
    const newSettings = {
      meta: { generatedBy: 'new' },
      dependencies: { required: ['gstack', 'superpowers'], optional: ['openspec'] },
      workflow: { version: 'v2' },
    };
    const result = JSON.parse(mergeSettingsJson(existing, newSettings));
    expect(result.meta.generatedBy).toBe('old'); // meta 不被覆盖
    expect(result.dependencies.required).toEqual(['gstack', 'superpowers']);
    expect(result.dependencies.optional).toEqual(['openspec']);
    expect(result.workflow.version).toBe('v2');
  });

  it('should produce valid JSON with trailing newline', () => {
    const result = mergeSettingsJson({}, { a: 1 });
    expect(result.endsWith('\n')).toBe(true);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('should pretty-print with 2-space indent', () => {
    const result = mergeSettingsJson({ nested: { a: 1 } }, { nested: { b: 2 } });
    expect(result).toContain('  '); // 包含缩进
    const parsed = JSON.parse(result);
    expect(parsed.nested).toEqual({ a: 1, b: 2 });
  });

  it('should handle empty existing settings', () => {
    const result = JSON.parse(mergeSettingsJson({}, { foo: 'bar' }));
    expect(result).toEqual({ foo: 'bar' });
  });

  it('should handle completely disjoint keys', () => {
    const existing = { a: 1, b: 2 };
    const source = { c: 3, d: 4 };
    const result = JSON.parse(mergeSettingsJson(existing, source));
    expect(result).toEqual({ a: 1, b: 2, c: 3, d: 4 });
  });
});

// ────────────────────────────────────────────────
// resolveSelectedSkills
// ────────────────────────────────────────────────
const TEST_MANIFEST: SkillManifest = {
  version: 1,
  domains: {
    workflow: { always: true, label: 'workflow', desc: '', skills: ['tdd-workflow', 'coding-standards'] },
    frontend: { projectTypes: ['web', 'fullstack'], label: 'frontend', desc: '', skills: ['frontend-patterns'] },
    backend: { projectTypes: ['api', 'fullstack'], label: 'backend', desc: '', skills: ['backend-patterns'] },
    database: { needsDb: true, label: 'database', desc: '', skills: ['postgres-patterns', 'database-migrations'] },
    testing: { projectTypes: ['web', 'api', 'fullstack'], label: 'testing', desc: '', skills: ['e2e-testing'] },
    devops: { manual: true, label: 'devops', desc: '', skills: ['docker-patterns', 'deployment-patterns'] },
    advanced: { userLevel: 'developer', label: 'advanced', desc: '', skills: ['caveman', 'diagnose'] },
  },
};

describe('resolveSelectedSkills', () => {
  it('should always include workflow skills', () => {
    const input: SkillSelectionInput = {
      projectType: 'other', needsDb: false, userLevel: 'vibe-coder',
      selectedDomains: ['workflow'],
    };
    const result = resolveSelectedSkills(input, TEST_MANIFEST);
    expect(result).toContain('tdd-workflow');
    expect(result).toContain('coding-standards');
  });

  it('should include frontend skills for web project', () => {
    const input: SkillSelectionInput = {
      projectType: 'web', needsDb: false, userLevel: 'vibe-coder',
      selectedDomains: ['workflow', 'frontend', 'testing'],
    };
    const result = resolveSelectedSkills(input, TEST_MANIFEST);
    expect(result).toContain('frontend-patterns');
    expect(result).toContain('e2e-testing');
  });

  it('should include backend skills for fullstack project', () => {
    const input: SkillSelectionInput = {
      projectType: 'fullstack', needsDb: true, userLevel: 'vibe-coder',
      selectedDomains: ['workflow', 'frontend', 'backend', 'database', 'testing'],
    };
    const result = resolveSelectedSkills(input, TEST_MANIFEST);
    expect(result).toContain('backend-patterns');
    expect(result).toContain('postgres-patterns');
    expect(result).toContain('database-migrations');
    expect(result).toContain('frontend-patterns');
  });

  it('should NOT include database skills when needsDb is false', () => {
    const input: SkillSelectionInput = {
      projectType: 'api', needsDb: false, userLevel: 'vibe-coder',
      selectedDomains: ['workflow', 'backend', 'database', 'testing'],
    };
    const result = resolveSelectedSkills(input, TEST_MANIFEST);
    expect(result).toContain('backend-patterns');
    expect(result).not.toContain('postgres-patterns');
    expect(result).not.toContain('database-migrations');
  });

  it('should include advanced skills for developer level', () => {
    const input: SkillSelectionInput = {
      projectType: 'fullstack', needsDb: true, userLevel: 'developer',
      selectedDomains: ['workflow', 'frontend', 'backend', 'database', 'testing', 'advanced'],
    };
    const result = resolveSelectedSkills(input, TEST_MANIFEST);
    expect(result).toContain('caveman');
    expect(result).toContain('diagnose');
  });

  it('should NOT include advanced skills for vibe-coder', () => {
    const input: SkillSelectionInput = {
      projectType: 'fullstack', needsDb: true, userLevel: 'vibe-coder',
      selectedDomains: ['workflow', 'frontend', 'backend', 'database', 'testing', 'advanced'],
    };
    const result = resolveSelectedSkills(input, TEST_MANIFEST);
    expect(result).not.toContain('caveman');
    expect(result).not.toContain('diagnose');
  });

  it('should include devops only when manually selected', () => {
    const input: SkillSelectionInput = {
      projectType: 'fullstack', needsDb: true, userLevel: 'vibe-coder',
      selectedDomains: ['workflow', 'devops'],
    };
    const result = resolveSelectedSkills(input, TEST_MANIFEST);
    expect(result).toContain('docker-patterns');
    expect(result).toContain('deployment-patterns');
  });

  it('should NOT include devops when not selected', () => {
    const input: SkillSelectionInput = {
      projectType: 'fullstack', needsDb: true, userLevel: 'vibe-coder',
      selectedDomains: ['workflow'],
    };
    const result = resolveSelectedSkills(input, TEST_MANIFEST);
    expect(result).not.toContain('docker-patterns');
  });

  it('should return sorted unique skills', () => {
    const input: SkillSelectionInput = {
      projectType: 'web', needsDb: false, userLevel: 'vibe-coder',
      selectedDomains: ['workflow', 'frontend', 'testing'],
    };
    const result = resolveSelectedSkills(input, TEST_MANIFEST);
    expect(result).toEqual([...result].sort()); // already sorted
    expect(new Set(result).size).toBe(result.length); // no duplicates
  });
});

// ────────────────────────────────────────────────
// getSkillTemplateDir
// ────────────────────────────────────────────────
describe('getSkillTemplateDir', () => {
  it('should return correct domain for known skill', () => {
    expect(getSkillTemplateDir('tdd-workflow', TEST_MANIFEST)).toBe('workflow');
    expect(getSkillTemplateDir('frontend-patterns', TEST_MANIFEST)).toBe('frontend');
    expect(getSkillTemplateDir('backend-patterns', TEST_MANIFEST)).toBe('backend');
    expect(getSkillTemplateDir('postgres-patterns', TEST_MANIFEST)).toBe('database');
    expect(getSkillTemplateDir('e2e-testing', TEST_MANIFEST)).toBe('testing');
    expect(getSkillTemplateDir('docker-patterns', TEST_MANIFEST)).toBe('devops');
    expect(getSkillTemplateDir('caveman', TEST_MANIFEST)).toBe('advanced');
  });

  it('should return workflow for unknown skill', () => {
    expect(getSkillTemplateDir('nonexistent-skill', TEST_MANIFEST)).toBe('workflow');
  });
});

// ────────────────────────────────────────────────
// getRecommendedDomains
// ────────────────────────────────────────────────
describe('getRecommendedDomains', () => {
  it('web project should recommend workflow + frontend + testing', () => {
    const result = getRecommendedDomains('web', false, 'vibe-coder');
    expect(result).toContain('workflow');
    expect(result).toContain('frontend');
    expect(result).toContain('testing');
    expect(result).not.toContain('backend');
    expect(result).not.toContain('database');
  });

  it('api project with db should recommend workflow + backend + database + testing', () => {
    const result = getRecommendedDomains('api', true, 'vibe-coder');
    expect(result).toContain('backend');
    expect(result).toContain('database');
    expect(result).toContain('testing');
    expect(result).not.toContain('frontend');
  });

  it('fullstack with db should recommend all non-manual domains', () => {
    const result = getRecommendedDomains('fullstack', true, 'vibe-coder');
    expect(result).toContain('frontend');
    expect(result).toContain('backend');
    expect(result).toContain('database');
    expect(result).toContain('testing');
  });

  it('developer level should include advanced', () => {
    const vibeResult = getRecommendedDomains('web', false, 'vibe-coder');
    const devResult = getRecommendedDomains('web', false, 'developer');
    expect(vibeResult).not.toContain('advanced');
    expect(devResult).toContain('advanced');
  });

  it('other project type should only have workflow + testing', () => {
    const result = getRecommendedDomains('other', false, 'vibe-coder');
    expect(result).toEqual(['workflow', 'testing']);
  });
});
