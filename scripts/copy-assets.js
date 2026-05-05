import { cpSync } from 'node:fs';

cpSync('templates', 'dist/templates', { recursive: true });
cpSync('adapters', 'dist/adapters', { recursive: true });
console.log('Assets copied to dist/');
