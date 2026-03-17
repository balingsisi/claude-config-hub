# ts-pattern 模式匹配模板

## 技术栈

- **ts-pattern**: TypeScript 模式匹配库
- **TypeScript**: 类型支持
- **Functional Programming**: 函数式编程风格
- **Exhaustiveness Checking**: 完备性检查

## 项目结构

```
ts-pattern-app/
├── src/
│   ├── patterns/
│   │   ├── matching.ts        # 模式匹配示例
│   │   ├── guards.ts          # 类型守卫
│   │   └── combinators.ts     # 组合器
│   ├── use-cases/
│   │   ├── state-machine.ts   # 状态机
│   │   ├── api-response.ts    # API 响应处理
│   │   ├── event-handling.ts  # 事件处理
│   │   └── form-validation.ts # 表单验证
│   ├── utils/
│   │   └── helpers.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

## 代码模式

### 基础匹配

```typescript
// src/patterns/matching.ts
import { match, P } from 'ts-pattern';

// 基础值匹配
const result = match(3)
  .with(1, () => 'one')
  .with(2, () => 'two')
  .with(3, () => 'three')
  .otherwise(() => 'unknown');

console.log(result); // 'three'

// 多值匹配
const getResult = (value: number) =>
  match(value)
    .with(P.union(1, 2, 3), () => 'low')
    .with(P.union(4, 5, 6), () => 'medium')
    .with(P.union(7, 8, 9), () => 'high')
    .otherwise(() => 'unknown');

// 范围匹配
const classifyAge = (age: number) =>
  match(age)
    .with(P.when((n) => n < 13), () => 'child')
    .with(P.when((n) => n >= 13 && n < 20), () => 'teenager')
    .with(P.when((n) => n >= 20 && n < 60), () => 'adult')
    .with(P.when((n) => n >= 60), () => 'senior')
    .exhaustive();
```

### 对象匹配

```typescript
// src/patterns/matching.ts
import { match, P } from 'ts-pattern';

type User = {
  id: string;
  name: string;
  role: 'admin' | 'user' | 'guest';
  status: 'active' | 'inactive' | 'banned';
  email?: string;
};

const getAccessLevel = (user: User) =>
  match(user)
    .with(
      { role: 'admin', status: 'active' },
      () => 'full_access'
    )
    .with(
      { role: 'admin', status: 'inactive' },
      () => 'admin_inactive'
    )
    .with(
      { role: 'user', status: 'active' },
      () => 'standard_access'
    )
    .with(
      { role: 'user', status: 'inactive' },
      () => 'user_inactive'
    )
    .with(
      { status: 'banned' },
      () => 'no_access'
    )
    .with(
      { role: 'guest' },
      () => 'guest_access'
    )
    .exhaustive();

// 部分匹配
const hasEmail = (user: User) =>
  match(user)
    .with({ email: P.string }, () => true)
    .otherwise(() => false);
```

### 数组匹配

```typescript
// src/patterns/matching.ts
import { match, P } from 'ts-pattern';

// 数组长度匹配
const describeArray = (arr: number[]) =>
  match(arr)
    .with([], () => 'empty')
    .with([P._], () => 'one element')
    .with([P._, P._], () => 'two elements')
    .with([P._, P._, P._], () => 'three elements')
    .otherwise(() => 'many elements');

// 数组内容匹配
const describeTuple = (tuple: [string, number, boolean]) =>
  match(tuple)
    .with(['admin', P._, true], ([, , active]) => `Admin is active: ${active}`)
    .with(['user', P.number.gt(18), true], ([, age]) => `Adult user, age ${age}`)
    .with(['guest', P._, false], () => 'Guest not active')
    .exhaustive();

// 数组包含匹配
const hasAdmin = (roles: string[]) =>
  match(roles)
    .with(P.array(P.union('admin', 'superadmin')), () => true)
    .otherwise(() => false);

// 数组首尾匹配
const processList = (list: number[]) =>
  match(list)
    .with([1, ...P.array(P.number)], () => 'starts with 1')
    .with([...P.array(P.number), 10], () => 'ends with 10')
    .with([1, ...P.array(P.number), 10], () => 'starts with 1 and ends with 10')
    .otherwise(() => 'other');
```

### 类型守卫

```typescript
// src/patterns/guards.ts
import { match, P } from 'ts-pattern';

// 自定义守卫
const isString = (value: unknown): value is string =>
  typeof value === 'string';

const isNumber = (value: unknown): value is number =>
  typeof value === 'number';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

// 使用守卫
const processValue = (value: unknown) =>
  match(value)
    .when(isString, (s) => `String: ${s}`)
    .when(isNumber, (n) => `Number: ${n}`)
    .when(isObject, (obj) => `Object: ${JSON.stringify(obj)}`)
    .otherwise(() => 'Unknown type');

// P.when 条件
const validateAge = (age: number) =>
  match(age)
    .with(P.when((n) => n < 0), () => 'Invalid age')
    .with(P.when((n) => n >= 0 && n < 18), () => 'Minor')
    .with(P.when((n) => n >= 18 && n < 65), () => 'Adult')
    .with(P.when((n) => n >= 65), () => 'Senior')
    .exhaustive();

// P.not 否定匹配
const isNotAdmin = (user: { role: string }) =>
  match(user)
    .with({ role: P.not('admin') }, () => true)
    .otherwise(() => false);
```

### 状态机

```typescript
// src/use-cases/state-machine.ts
import { match, P } from 'ts-pattern';

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: string }
  | { status: 'error'; error: Error };

type Action =
  | { type: 'FETCH' }
  | { type: 'SUCCESS'; data: string }
  | { type: 'ERROR'; error: Error }
  | { type: 'RESET' };

const reducer = (state: State, action: Action): State =>
  match([state, action])
    .with(
      [{ status: 'idle' }, { type: 'FETCH' }],
      () => ({ status: 'loading' })
    )
    .with(
      [{ status: 'loading' }, { type: 'SUCCESS' }],
      ([, action]) => ({ status: 'success', data: action.data })
    )
    .with(
      [{ status: 'loading' }, { type: 'ERROR' }],
      ([, action]) => ({ status: 'error', error: action.error })
    )
    .with(
      [{ status: P.union('success', 'error') }, { type: 'RESET' }],
      () => ({ status: 'idle' })
    )
    .with(
      [P._, { type: 'FETCH' }],
      () => state // 忽略重复 fetch
    )
    .otherwise(() => state);

// 使用状态机
let state: State = { status: 'idle' };

state = reducer(state, { type: 'FETCH' });
console.log(state); // { status: 'loading' }

state = reducer(state, { type: 'SUCCESS', data: 'Hello' });
console.log(state); // { status: 'success', data: 'Hello' }
```

### API 响应处理

```typescript
// src/use-cases/api-response.ts
import { match, P } from 'ts-pattern';

type ApiResponse<T> =
  | { status: 'success'; data: T }
  | { status: 'error'; error: { code: string; message: string } }
  | { status: 'loading' };

const handleResponse = <T>(response: ApiResponse<T>) =>
  match(response)
    .with({ status: 'loading' }, () => ({
      isLoading: true,
      data: null,
      error: null,
    }))
    .with({ status: 'success' }, (res) => ({
      isLoading: false,
      data: res.data,
      error: null,
    }))
    .with(
      { status: 'error', error: { code: P.union('401', '403') } },
      (res) => ({
        isLoading: false,
        data: null,
        error: 'Authentication error',
      })
    )
    .with(
      { status: 'error', error: { code: '404' } },
      (res) => ({
        isLoading: false,
        data: null,
        error: 'Not found',
      })
    )
    .with({ status: 'error' }, (res) => ({
      isLoading: false,
      data: null,
      error: res.error.message,
    }))
    .exhaustive();

// HTTP 状态码处理
const handleHttpError = (statusCode: number) =>
  match(statusCode)
    .with(200, () => 'OK')
    .with(201, () => 'Created')
    .with(400, () => 'Bad Request')
    .with(401, () => 'Unauthorized')
    .with(403, () => 'Forbidden')
    .with(404, () => 'Not Found')
    .with(500, () => 'Internal Server Error')
    .with(P.when((n) => n >= 400 && n < 500), () => 'Client Error')
    .with(P.when((n) => n >= 500), () => 'Server Error')
    .otherwise(() => 'Unknown');
```

### 事件处理

```typescript
// src/use-cases/event-handling.ts
import { match, P } from 'ts-pattern';

type Event =
  | { type: 'click'; x: number; y: number }
  | { type: 'keydown'; key: string; ctrl: boolean }
  | { type: 'scroll'; direction: 'up' | 'down' }
  | { type: 'submit'; formId: string };

const handleEvent = (event: Event) =>
  match(event)
    .with(
      { type: 'click', x: P.when((x) => x < 100), y: P.when((y) => y < 100) },
      (e) => console.log('Click in top-left corner', e.x, e.y)
    )
    .with(
      { type: 'click' },
      (e) => console.log('Click at', e.x, e.y)
    )
    .with(
      { type: 'keydown', key: 's', ctrl: true },
      () => console.log('Save shortcut')
    )
    .with(
      { type: 'keydown', key: P.union('Enter', 'Space') },
      () => console.log('Confirm action')
    )
    .with(
      { type: 'keydown' },
      (e) => console.log('Key pressed:', e.key)
    )
    .with(
      { type: 'scroll', direction: 'up' },
      () => console.log('Scrolling up')
    )
    .with(
      { type: 'scroll', direction: 'down' },
      () => console.log('Scrolling down')
    )
    .with(
      { type: 'submit', formId: P.string },
      (e) => console.log('Form submitted:', e.formId)
    )
    .exhaustive();
```

### 表单验证

```typescript
// src/use-cases/form-validation.ts
import { match, P } from 'ts-pattern';

type FormData = {
  email: string;
  password: string;
  age: number;
  terms: boolean;
};

type ValidationError = {
  field: string;
  message: string;
};

const validateForm = (data: FormData): ValidationError[] => {
  const errors: ValidationError[] = [];

  match(data.email)
    .with('', () => errors.push({ field: 'email', message: 'Email is required' }))
    .with(P.when((email) => !email.includes('@')), () =>
      errors.push({ field: 'email', message: 'Invalid email format' })
    )
    .otherwise(() => {});

  match(data.password)
    .with('', () => errors.push({ field: 'password', message: 'Password is required' }))
    .with(P.when((pwd) => pwd.length < 8), () =>
      errors.push({ field: 'password', message: 'Password must be at least 8 characters' })
    )
    .otherwise(() => {});

  match(data.age)
    .with(P.when((age) => age < 0), () =>
      errors.push({ field: 'age', message: 'Age cannot be negative' })
    )
    .with(P.when((age) => age < 18), () =>
      errors.push({ field: 'age', message: 'Must be at least 18 years old' })
    )
    .otherwise(() => {});

  match(data.terms)
    .with(false, () => errors.push({ field: 'terms', message: 'Must accept terms' }))
    .otherwise(() => {});

  return errors;
};
```

### 组合器

```typescript
// src/patterns/combinators.ts
import { match, P } from 'ts-pattern';

// P.union 联合类型
type Color = 'red' | 'green' | 'blue' | 'yellow';

const isPrimaryColor = (color: Color) =>
  match(color)
    .with(P.union('red', 'green', 'blue'), () => true)
    .otherwise(() => false);

// P.intersection 交集
const isAdultUser = (user: { age: number; role: string }) =>
  match(user)
    .with(
      { age: P.when((n) => n >= 18), role: 'user' },
      () => true
    )
    .otherwise(() => false);

// P.optional 可选属性
type Config = {
  apiUrl?: string;
  timeout?: number;
  retries?: number;
};

const getConfig = (config: Config) =>
  match(config)
    .with({ apiUrl: P.string, timeout: P.number }, (c) => ({
      url: c.apiUrl,
      timeout: c.timeout,
      retries: c.retries ?? 3,
    }))
    .with({ apiUrl: P.string }, (c) => ({
      url: c.apiUrl,
      timeout: 5000,
      retries: c.retries ?? 3,
    }))
    .otherwise(() => ({
      url: 'http://localhost:3000',
      timeout: 5000,
      retries: 3,
    }));

// P.array 数组匹配
const processItems = (items: (string | number)[]) =>
  match(items)
    .with(P.array(P.string), (arr) => `All strings: ${arr.join(', ')}`)
    .with(P.array(P.number), (arr) => `All numbers: ${arr.join(', ')}`)
    .otherwise(() => 'Mixed types');

// P.select 提取值
const extractEmail = (user: { id: string; email: string; name: string }) =>
  match(user)
    .with({ email: P.select() }, (email) => email)
    .otherwise(() => null);

// 多个 P.select
const extractUserInfo = (user: {
  id: string;
  name: string;
  email: string;
}) =>
  match(user)
    .with(
      { name: P.select('name'), email: P.select('email') },
      ({ name, email }) => ({ name, email })
    )
    .otherwise(() => null);
```

### 完备性检查

```typescript
// src/patterns/exhaustive.ts
import { match, P } from 'ts-pattern';

type Status = 'pending' | 'approved' | 'rejected' | 'cancelled';

// exhaustive() 确保所有情况都被处理
const getStatusMessage = (status: Status) =>
  match(status)
    .with('pending', () => 'Your request is pending')
    .with('approved', () => 'Your request has been approved')
    .with('rejected', () => 'Your request has been rejected')
    .with('cancelled', () => 'Your request has been cancelled')
    .exhaustive(); // 如果有遗漏，TypeScript 会报错

// 非完备匹配使用 otherwise
const getStatusCategory = (status: Status) =>
  match(status)
    .with('pending', () => 'in-progress')
    .with('approved', () => 'completed')
    .otherwise(() => 'terminal');
```

## 最佳实践

### 1. 模式复用

```typescript
// src/patterns/reusable.ts
import { match, P } from 'ts-pattern';

// 定义可复用的模式
const AdminPattern = { role: 'admin' } as const;
const ActiveUserPattern = { status: 'active', role: 'user' } as const;
const EmailPattern = P.when((email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

const hasAccess = (user: { role: string; status: string }) =>
  match(user)
    .with(AdminPattern, () => true)
    .with(ActiveUserPattern, () => true)
    .otherwise(() => false);
```

### 2. 类型安全

```typescript
// 使用 P.infer 推断类型
import { match, P } from 'ts-pattern';

const pattern = { type: 'user', id: P.string } as const;
type UserPattern = P.infer<typeof pattern>;
// { type: 'user', id: string }
```

### 3. 性能优化

```typescript
// 对于频繁调用的匹配，可以缓存
const createMatcher = <T extends string>() => {
  const cache = new Map<string, string>();

  return (value: T) => {
    if (cache.has(value)) {
      return cache.get(value)!;
    }

    const result = match(value)
      .with('a', () => 'A')
      .with('b', () => 'B')
      .otherwise(() => 'Unknown');

    cache.set(value, result);
    return result;
  };
};
```

### 4. 调试

```typescript
// 使用 run 侧效应
import { match, P } from 'ts-pattern';

const result = match(value)
  .with(
    P._,
    (v) => {
      console.log('Debug:', v);
      return 'processed';
    }
  )
  .run();
```

## 常用命令

```bash
# 安装
npm install ts-pattern

# 安装类型定义（TypeScript 项目已包含）
npm install --save-dev @types/node
```

## 部署配置

### package.json

```json
{
  "name": "ts-pattern-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest"
  },
  "dependencies": {
    "ts-pattern": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "ts-node": "^10.9.0",
    "vitest": "^1.0.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## 资源

- [ts-pattern 官方文档](https://github.com/gvergnaud/ts-pattern)
- [Pattern Matching in TypeScript](https://dev.to/gvergnaud/introducing-pattern-matching-in-typescript-435)
- [Functional Programming Patterns](https://github.com/gvergnaud/ts-pattern#recipes)
