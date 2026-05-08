import inquirer from 'inquirer';

export type TechStackType = 'nestjs-nextjs' | 'next-only' | 'node-api' | 'other';

export interface UserConfig {
  projectName: string;
  techStack: TechStackType;
  userLevel: 'vibe-coder' | 'developer';
  modules: string[];
  language: 'zh-CN';
  overwrite: boolean;
  targetDir: string;
}

/** 支持的适配器映射（techStack → 模板子目录） */
export const ADAPTER_MAP: Record<string, string> = {
  'nestjs-nextjs': 'CLAUDE.zh-CN.md',           // 使用默认模板 templates/claude-md/
  'next-only': 'next-only/CLAUDE.zh-CN.md',
  'node-api': 'node-api/CLAUDE.zh-CN.md',
};

/**
 * 获取指定技术栈对应的 CLAUDE.md 模板路径（相对于 templates/claude-md/）
 * 返回 null 表示使用默认模板
 */
export function getClaudeMdTemplate(techStack: string): string | null {
  return ADAPTER_MAP[techStack] ?? null;
}

/**
 * 获取指定技术栈对应的 skills.recommend.json 路径（相对于 adapters/）
 * 返回 null 表示该技术栈没有推荐技能文件
 */
export function getSkillsRecommendPath(techStack: string): string | null {
  const knownAdapters = ['nestjs-nextjs', 'next-only', 'node-api'];
  if (knownAdapters.includes(techStack)) {
    return `${techStack}/skills.recommend.json`;
  }
  return null;
}

export async function askQuestions(): Promise<UserConfig> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: '项目名称：',
      default: 'my-project',
      validate: (input: string) => {
        if (!input.trim()) return '项目名称不能为空';
        if (!/^[a-zA-Z0-9_-]+$/.test(input)) return '项目名称只能包含字母、数字、- 和 _';
        return true;
      },
    },
    {
      type: 'list',
      name: 'techStack',
      message: '选择技术栈：',
      choices: [
        { name: 'NestJS + Next.js（全栈，默认推荐）', value: 'nestjs-nextjs' },
        { name: 'Next.js only（纯前端）', value: 'next-only' },
        { name: 'Node.js API（纯后端 Express/Fastify）', value: 'node-api' },
        { name: '其他技术栈（手动配置）', value: 'other' },
      ],
    },
    {
      type: 'checkbox',
      name: 'modules',
      message: '选择要安装的模块：',
      choices: [
        { name: '9 步开发工作流（必选）', value: 'workflow', checked: true },
        { name: '代码规范（coding-style / security / testing）', value: 'coding-standards', checked: true },
        { name: 'Agent 编排（并行 agent / 分工模式）', value: 'agents', checked: true },
        { name: 'TDD 工作流（强制先写测试再写代码）', value: 'tdd', checked: false },
      ],
      validate: (input: string[]) => {
        if (!input.includes('workflow')) return '9 步工作流是必选项';
        return true;
      },
    },
    {
      type: 'list',
      name: 'userLevel',
      message: '你的编程经验水平？',
      choices: [
        { name: '非专业编程人员（Vibe Coder）— 我用自然语言描述需求', value: 'vibe-coder' },
        { name: '专业开发者 — 我懂代码，但想让 AI 更有纪律', value: 'developer' },
      ],
    },
  ]);

  return {
    ...answers,
    language: 'zh-CN',
    overwrite: false,
    targetDir: '',
  } as UserConfig;
}
