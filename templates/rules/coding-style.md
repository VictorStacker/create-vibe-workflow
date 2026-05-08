---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---
# TypeScript / JavaScript 编码规范

> 本文件是项目的代码风格规范。所有生成的代码都应遵循这些规则。

## 类型系统

### 公共 API
- 导出函数、共享工具类、公共类方法必须添加参数和返回类型
- 局部变量让 TypeScript 自动推断
- 重复的内联对象形状应提取为命名类型或接口

```typescript
// ❌ 导出函数没有显式类型
export function formatUser(user) {
  return `${user.firstName} ${user.lastName}`
}

// ✅ 显式类型
interface User { firstName: string; lastName: string }
export function formatUser(user: User): string {
  return `${user.firstName} ${user.lastName}`
}
```

### Interface vs Type
- 可能需要扩展或实现的对象形状 → 用 `interface`
- 联合、交叉、元组、映射类型 → 用 `type`
- 优先用字符串字面量联合代替 `enum`（除非需要互操作性）

### 禁止 `any`
- 应用代码中避免使用 `any`
- 外部/不可信输入用 `unknown`，然后安全收窄
- 依赖调用者决定类型的场景用泛型

```typescript
// ❌ any 破坏了类型安全
function getErrorMessage(error: any) { return error.message }

// ✅ unknown 强制安全收窄
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Unexpected error'
}
```

## 不可变性

使用展开运算符进行不可变更新：

```typescript
// ❌ 直接修改（Mutation）
function updateUser(user: User, name: string): User {
  user.name = name
  return user
}

// ✅ 不可变更新
function updateUser(user: Readonly<User>, name: string): User {
  return { ...user, name }
}
```

## 错误处理

使用 async/await + try-catch + 安全的错误收窄：

```typescript
async function loadUser(userId: string): Promise<User> {
  try {
    return await riskyOperation(userId)
  } catch (error: unknown) {
    logger.error('操作失败', error)
    throw new Error(getErrorMessage(error))
  }
}
```

> **业务层统一错误类（AppError / NotFoundError / ValidationError）及使用示例见 `.claude/rules/patterns.md` § 错误处理统一模式**
> 本节专注底层错误收窄技巧，patterns.md 定义上层错误分类体系。

## 输入校验

使用 Zod 做 schema 驱动的校验，并从 schema 推断类型：

```typescript
import { z } from 'zod'

const userSchema = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(150)
})

type UserInput = z.infer<typeof userSchema>
const validated: UserInput = userSchema.parse(input)
```

## 命名规范

| 类别 | 规范 | 示例 |
|------|------|------|
| 文件名 | kebab-case | `user-service.ts` |
| 变量/函数 | camelCase | `getUserById` |
| 类/接口/类型 | PascalCase | `UserService` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 枚举值 | UPPER_SNAKE_CASE | `Role.ADMIN` |
| Boolean 前缀 | is/has/can/should | `isActive`, `hasPermission` |

## 文件组织

```
src/
├── modules/
│   └── {module-name}/
│       ├── {module}.module.ts     # 模块入口
│       ├── {module}.controller.ts # 路由处理
│       ├── {module}.service.ts    # 业务逻辑
│       ├── {module}.schema.ts     # Zod 校验
│       ├── dto/                   # 数据传输对象
│       └── entities/              # 实体定义
├── shared/                        # 跨模块共享代码
│   ├── utils/
│   ├── types/
│   └── constants/
└── config/                        # 配置
```

## 日志

- **禁止**在生产代码中使用 `console.log`
- 使用结构化日志库（如 winston / pino）
- 日志级别：error > warn > info > debug

## 注释规范

```typescript
/**
 * 根据用户 ID 获取用户信息。
 *
 * @param userId - 用户唯一标识符
 * @returns 用户对象，不存在时返回 null
 * @throws {ValidationError} 当 userId 格式无效时抛出
 */
async function getUserById(userId: string): Promise<User | null> {
  // ...
}

// TODO(victor): 这里的缓存策略需要优化 — 后续改为 Redis
const CACHE_TTL = 3600;
```
