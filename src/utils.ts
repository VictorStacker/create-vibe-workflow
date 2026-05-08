// 核心工具函数 — 导出供测试使用

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
