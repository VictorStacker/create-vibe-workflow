---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---
# 代码模式规范（Patterns）

> 本文件定义项目中应遵循的通用代码模式。保持一致性比"最好"更重要。

## API 响应格式

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    total: number
    page: number
    limit: number
  }
}
```

## 自定义 Hook 模式（前端）

```typescript
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}
```

## Repository 模式（后端）

```typescript
interface Repository<T, CreateDto, UpdateDto> {
  findAll(filters?: FilterOptions): Promise<T[]>
  findById(id: string): Promise<T | null>
  findByUnique(field: keyof T, value: unknown): Promise<T | null>
  create(data: CreateDto): Promise<T>
  update(id: string, data: UpdateDto): Promise<T>
  softDelete?(id: string): Promise<T>   // 可选：软删除
  delete(id: string): Promise<void>
}
```

## Service 层模式

```typescript
@Injectable()  // NestJS 示例，其他框架类似
export class UserService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly logger: LoggerService,
  ) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    // 1. 校验
    const exists = await this.userRepo.findByEmail(dto.email)
    if (exists) throw new ConflictException('用户已存在')

    // 2. 业务逻辑
    const hashedPassword = await hash(dto.password, 10)

    // 3. 持久化
    const user = await this.userRepo.create({
      ...dto,
      password: hashedPassword,
    })

    this.logger.info('用户创建成功', { userId: user.id })
    return user
  }
}
```

## 错误处理统一模式

```typescript
// 自定义业务错误类
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// 常用快捷错误
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` (${id})` : ''} 不存在`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(details: string) {
    super(details, 400, 'VALIDATION_ERROR');
  }
}

// 使用示例
if (!user) throw new NotFoundError('User', userId);
```
