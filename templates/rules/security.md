---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---
# 安全规范（Security）

> 安全是特性，不是事后补救。
> **触发条件**: 仅 auth / finance / system 模块（或涉及用户数据、支付、权限的代码变更）。
> **跳过条件**: 非安全敏感模块（纯 UI 调整、文档修改、重构不涉数据流等）。
> 完整触发/跳过规则见 `development-workflow.md` 第 ⑦ 步。

## 密钥管理

```typescript
// ❌ 硬编码密钥（绝对禁止）
const apiKey = "sk-proj-xxxxx"

// ✅ 使用环境变量
const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) {
  throw new Error('OPENAI_API_KEY not configured')
}
```

## 提交前强制检查清单

- [ ] 无硬编码密钥（API Key、密码、Token）
- [ ] 所有用户输入已校验（Zod schema）
- [ ] SQL 注入防护（参数化查询 / ORM 内置防护）
- [ ] XSS 防护（HTML 净化 / 转义输出）
- [ ] CSRF 保护已启用（有表单提交时）
- [ ] 身份认证/授权已验证
- [ ] 所有端点已限流
- [ ] 错误消息不泄露敏感数据（不返回堆栈、内部路径等）

## 常见安全漏洞防范

| 漏洞 | 防范方式 |
|------|----------|
| SQL 注入 | 使用 ORM / 参数化查询 |
| XSS | 输出转义、CSP 头、HTML Sanitizer |
| CSRF | SameSite Cookie、CSRF Token |
| SSRF | 白名单域名 + 不响应内网 IP |
| IDOR (越权) | 每次操作验证资源所有权 |
| 敏感数据泄露 | 日志脱敏、错误信息泛化 |

## Agent 支持

- 使用 **security-review** skill 进行全面的安全审计
