---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/**/*.jsx"
---
# 测试规范（Testing）

> 所有代码都必须有测试覆盖。没有测试的代码 = 不可信的代码。

## 最低覆盖率要求：**80%**

| 类型 | 覆盖率目标 | 说明 |
|------|-----------|------|
| 行覆盖率 (Lines) | ≥ 80% | 每行代码都被执行过 |
| 分支覆盖率 (Branches) | ≥ 75% | 每个 if/else 分支都走到 |
| 函数覆盖率 (Functions) | ≥ 80% | 每个函数都被调用过 |
| 语句覆盖率 (Statements) | ≥ 80% | 每条语句都执行过 |

## 测试类型（全部必需）

1. **单元测试** — 针对独立函数、工具类、组件
2. **集成测试** — 针对 API 端点、数据库操作
3. **E2E 测试** — 关键用户流程（推荐使用 Playwright）

## TDD 工作流（强制）

| 步骤 | 操作 | 预期状态 |
|------|------|----------|
| 1 | 先写测试代码 | 🔴 RED（失败） |
| 2 | 运行测试 | 应该**失败** |
| 3 | 编写最小实现代码 | 🟢 GREEN（通过） |
| 4 | 运行测试 | 应该**通过** |
| 5 | 重构代码（不改测试） | ⚡ IMPROVE（改进） |
| 6 | 验证覆盖率 | 达到 **80%+** |

> **禁止跳过步骤 1-2 直接写实现。**
>
> TDD 在 9 步工作流中为第⑤步，完整流程（含跳过条件 / 完成标志）见 `.claude/rules/development-workflow.md`

## 测试文件组织

```
src/
├── modules/
│   └── user/
│       ├── user.service.ts
│       ├── user.service.test.ts      # 并列放置（单元测试）
│       └── dto/
├── __tests__/                        # 集成 / E2E 测试
│   ├── integration/
│   │   └── user.api.test.ts
│   └── e2e/
│       └── auth-flow.spec.ts
```

## 命名规范

```
{filename}.test.ts          # Vitest 单元/集成测试
{filename}.spec.ts          # E2E 测试（Playwright）
it('should {expected behavior} when {condition}')  # 测试用例名称
describe('{UnitUnderTest}', () => {})             # 测试分组
```

## Agent 支持

- **e2e-testing** — Playwright E2E 测试专家
- **tdd-workflow** — TDD 工作流执行助手

## 反模式（禁止）

```typescript
// ❌ 使用 any 绕过类型检查
expect((result as any).foo).toBe('bar')

// ❌ 测试实现细节而非行为
expect(service.internalMethod).toHaveBeenCalled()

// ✅ 测试公开行为
expect(result.data).toEqual(expectedData)
```
