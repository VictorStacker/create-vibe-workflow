import inquirer from 'inquirer';

export interface UserConfig {
  projectName: string;
  techStack: 'nestjs-nextjs' | 'other';
  userLevel: 'vibe-coder' | 'developer';
  modules: string[];
  language: 'zh-CN';
  overwrite: boolean;
  targetDir: string;
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
        { name: 'NestJS + Next.js（默认推荐）', value: 'nestjs-nextjs' },
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
