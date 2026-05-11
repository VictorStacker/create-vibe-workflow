import { cpSync, rmSync, existsSync } from 'node:fs';

// 清理旧文件（避免删除过的模板残留在 dist/）
if (existsSync('dist/templates')) rmSync('dist/templates', { recursive: true });
if (existsSync('dist/adapters')) rmSync('dist/adapters', { recursive: true });

cpSync('templates', 'dist/templates', { recursive: true });
cpSync('adapters', 'dist/adapters', { recursive: true });
console.log('Assets copied to dist/');
