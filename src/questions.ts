import inquirer from 'inquirer';
import type { ProjectType } from './utils.js';
import { getRecommendedDomains } from './utils.js';

export type TechStackType = 'nestjs-nextjs' | 'next-only' | 'node-api' | 'other';
export type LanguageType = 'TypeScript' | 'JavaScript' | 'Python' | 'Go' | 'Rust' | 'Java' | '其他';

export interface UserConfig {
  projectName: string;
  techStack: TechStackType;
  userLevel: 'vibe-coder' | 'developer';
  modules: string[];
  language: 'zh-CN';
  overwrite: boolean;
  targetDir: string;
  projectType: ProjectType;
  needsDb: boolean;
  selectedDomains: string[];
  tool: 'claude' | 'codex';
}

/** 支持的适配器映射（techStack → 模板子目录） */
export const ADAPTER_MAP: Record<string, string> = {
  'nestjs-nextjs': 'CLAUDE.zh-CN.md',
  'next-only': 'next-only/CLAUDE.zh-CN.md',
  'node-api': 'node-api/CLAUDE.zh-CN.md',
};

export function getClaudeMdTemplate(techStack: string): string | null {
  return ADAPTER_MAP[techStack] ?? null;
}

export function getSkillsRecommendPath(techStack: string): string | null {
  const knownAdapters = ['nestjs-nextjs', 'next-only', 'node-api'];
  if (knownAdapters.includes(techStack)) {
    return `${techStack}/skills.recommend.json`;
  }
  return null;
}

/** 领域标签（用于 checkbox 展示） */
const DOMAIN_LABELS: Record<string, string> = {
  workflow: '工作流核心 — 9步流程 + TDD + 安全审查 + 编码规范（必选）',
  frontend: '前端开发 — 组件/状态/性能/无障碍模式',
  backend: '后端开发 — API设计/仓储模式/服务层/缓存/认证模式',
  database: '数据库 — PostgreSQL 索引/迁移/查询优化/多租户',
  testing: '测试 — E2E 自动化测试（Playwright）',
  devops: 'DevOps — Docker 多阶段构建 + CI/CD 部署策略',
  advanced: '进阶技能 — 诊断循环/架构审计/精简沟通（仅专业开发者）',
};

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
      name: 'projectType',
      message: '你的项目类型？',
      choices: [
        {
          name: '网页应用（有界面，浏览器中运行）',
          value: 'web',
        },
        {
          name: 'API 服务（后端接口，无界面）',
          value: 'api',
        },
        {
          name: '全栈应用（前后端都有）',
          value: 'fullstack',
        },
        {
          name: '不确定 / 其他',
          value: 'other',
        },
      ],
    },
    {
      type: 'list',
      name: 'language',
      message: '主要用什么语言/框架？',
      choices: [
        { name: 'TypeScript / JavaScript', value: 'TypeScript' },
        { name: 'Python', value: 'Python' },
        { name: 'Go', value: 'Go' },
        { name: 'Rust', value: 'Rust' },
        { name: 'Java', value: 'Java' },
        { name: '其他 / 不确定', value: '其他' },
      ],
    },
    {
      type: 'confirm',
      name: 'needsDb',
      message: '需要数据库吗？',
      default: true,
      when: (answers: Record<string, unknown>) =>
        answers.projectType === 'api' || answers.projectType === 'fullstack',
    },
    {
      type: 'list',
      name: 'techStack',
      message: '选择具体技术栈（用于 CLAUDE.md 模板）：',
      choices: [
        { name: 'NestJS + Next.js（全栈，默认推荐）', value: 'nestjs-nextjs' },
        { name: 'Next.js only（纯前端）', value: 'next-only' },
        { name: 'Node.js API（纯后端 Express/Fastify）', value: 'node-api' },
        { name: '其他技术栈（手动配置）', value: 'other' },
      ],
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
    {
      type: 'checkbox',
      name: 'selectedDomains',
      message: '确认要安装的技能包（空格勾选/取消）：',
      choices: (answers: Record<string, unknown>) => {
        const projectType = (answers.projectType as ProjectType) || 'other';
        const needsDb = Boolean(answers.needsDb);
        const userLevel = (answers.userLevel as 'vibe-coder' | 'developer') || 'vibe-coder';
        const recommended = getRecommendedDomains(projectType, needsDb, userLevel);

        const allDomains: { name: string; value: string; checked: boolean }[] = [];
        for (const [key, label] of Object.entries(DOMAIN_LABELS)) {
          let checked = false;
          if (key === 'workflow') checked = true; // 必选
          else if (recommended.includes(key)) checked = true; // 推荐预勾
          allDomains.push({ name: label, value: key, checked });
        }
        return allDomains;
      },
    },
    {
      type: 'checkbox',
      name: 'modules',
      message: '选择额外模块：',
      choices: [
        { name: 'Agent 编排（并行 agent / 分工模式）', value: 'agents', checked: true },
        { name: 'TDD 工作流（强制先写测试再写代码）', value: 'tdd', checked: false },
      ],
    },
  ]);

  return {
    ...answers,
    needsDb: answers.needsDb ?? false,
    language: 'zh-CN',
    overwrite: false,
    targetDir: '',
    tool: 'claude', // CLI 传入 --codex 时会被覆盖
  } as UserConfig;
}
