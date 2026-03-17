# fp-ts TypeScript 函数式编程模板

## 技术栈

- **fp-ts**: 2.x (TypeScript函数式编程库)
- **TypeScript**: 5.x
- **函数式概念**: Option, Either, Task, Reader, IO
- **测试**: Vitest

## 项目结构

```
src/
├── fp/                        # 函数式编程
│   ├── option/               # Option类型
│   │   ├── index.ts          # 导出
│   │   ├── operations.ts     # 操作函数
│   │   └── examples.ts       # 示例
│   ├── either/               # Either类型
│   │   ├── index.ts
│   │   ├── operations.ts
│   │   └── error.ts          # 错误处理
│   ├── task/                 # 异步操作
│   │   ├── index.ts
│   │   ├── task.ts           # Task类型
│   │   └── taskEither.ts     # TaskEither
│   ├── reader/               # 依赖注入
│   │   ├── index.ts
│   │   └── context.ts        # 上下文
│   ├── io/                   # 副作用
│   │   ├── index.ts
│   │   └── effects.ts        # 效果
│   ├── array/                # 数组操作
│   │   └── index.ts
│   ├── record/               # 记录操作
│   │   └── index.ts
│   ├── pipe/                 # 管道
│   │   └── index.ts
│   └── utils/                # 工具函数
│       ├── applicative.ts    # 应用函子
│       └── monad.ts          # 单子
├── domain/                   # 领域模型
│   ├── user/
│   ├── product/
│   └── order/
├── services/                 # 服务层
│   ├── api/
│   └── repository/
└── __tests__/               # 测试
    ├── fp/
    └── domain/
```

## 代码模式

### Option 类型

```typescript
// fp/option/operations.ts
import { Option, some, none, fromNullable, isSome, isNone, fold, map, chain, filter, getOrElse, match } from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';

// 创建Option
export function createOption<T>(value: T | null | undefined): Option<T> {
  return fromNullable(value);
}

// 安全访问
export function safeProperty<T, K extends keyof T>(obj: T, key: K): Option<T[K]> {
  return fromNullable(obj[key]);
}

// 链式操作
export function chainOptions() {
  const user = {
    id: 1,
    name: 'John',
    address: {
      street: '123 Main St',
      city: 'NYC',
    },
  };

  // 安全获取嵌套属性
  const getCity = (u: typeof user): Option<string> =>
    pipe(
      fromNullable(u.address),
      chain(addr => fromNullable(addr.city))
    );

  return getCity(user); // some('NYC')
}

// Option操作示例
export function optionOperations() {
  const opt = some(5);

  return {
    // 检查
    isSome: isSome(opt),        // true
    isNone: isNone(opt),        // false

    // 映射
    map: pipe(opt, map(x => x * 2)), // some(10)
    
    // 链式
    chain: pipe(
      opt,
      chain(x => x > 0 ? some(x * 2) : none)
    ), // some(10)

    // 过滤
    filter: pipe(
      opt,
      filter(x => x > 3)
    ), // some(5)

    // 折叠
    fold: pipe(
      opt,
      fold(
        () => 'No value',
        (value) => `Value: ${value}`
      )
    ), // 'Value: 5'

    // 模式匹配
    match: pipe(
      opt,
      match(
        () => 0,
        (value) => value
      )
    ), // 5

    // 默认值
    getOrElse: pipe(
      none,
      getOrElse(() => 0)
    ), // 0
  };
}

// 实际应用
interface User {
  id: number;
  name: string;
  email?: string;
}

export function findUser(id: number): Option<User> {
  const users: User[] = [
    { id: 1, name: 'John', email: 'john@example.com' },
    { id: 2, name: 'Jane' },
  ];
  
  return fromNullable(users.find(u => u.id === id));
}

export function getUserEmail(id: number): Option<string> {
  return pipe(
    findUser(id),
    chain(user => fromNullable(user.email))
  );
}

// 使用
const email1 = getUserEmail(1); // some('john@example.com')
const email2 = getUserEmail(2); // none
const email3 = getUserEmail(999); // none
```

### Either 类型

```typescript
// fp/either/error.ts
import { Either, left, right, isLeft, isRight, fold, map, mapLeft, chain, tryCatch } from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';

// 错误类型
export type AppError =
  | { type: 'ValidationError'; message: string }
  | { type: 'NotFoundError'; resource: string }
  | { type: 'NetworkError'; message: string }
  | { type: 'UnauthorizedError'; message: string };

// 创建Either
export type Result<T> = Either<AppError, T>;

export const success = <T>(value: T): Result<T> => right(value);
export const failure = <T>(error: AppError): Result<T> => left(error);

// 错误构造器
export const validationError = (message: string): AppError => ({
  type: 'ValidationError',
  message,
});

export const notFoundError = (resource: string): AppError => ({
  type: 'NotFoundError',
  resource,
});

export const networkError = (message: string): AppError => ({
  type: 'NetworkError',
  message,
});

// fp/either/operations.ts
// Either操作
export function eitherOperations() {
  const divide = (a: number, b: number): Either<string, number> =>
    b === 0 ? left('Division by zero') : right(a / b);

  const result1 = divide(10, 2); // right(5)
  const result2 = divide(10, 0); // left('Division by zero')

  // 处理结果
  const handle = (result: Either<string, number>) =>
    pipe(
      result,
      fold(
        (error) => `Error: ${error}`,
        (value) => `Result: ${value}`
      )
    );

  return {
    result1: handle(result1), // 'Result: 5'
    result2: handle(result2), // 'Error: Division by zero'
  };
}

// 验证示例
interface UserInput {
  email: string;
  password: string;
  age: number;
}

export function validateEmail(email: string): Either<string, string> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email)
    ? right(email)
    : left('Invalid email format');
}

export function validatePassword(password: string): Either<string, string> {
  return password.length >= 8
    ? right(password)
    : left('Password must be at least 8 characters');
}

export function validateAge(age: number): Either<string, number> {
  return age >= 18 && age <= 120
    ? right(age)
    : left('Age must be between 18 and 120');
}

// 组合验证
import { sequenceT } from 'fp-ts/Apply';
import { getValidation } from 'fp-ts/Either';
import { getSemigroup } from 'fp-ts/string';

const applicativeValidation = getValidation(getSemigroup());

export function validateUser(input: UserInput): Either<string[], UserInput> {
  return pipe(
    sequenceT(applicativeValidation)(
      validateEmail(input.email),
      validatePassword(input.password),
      validateAge(input.age)
    ),
    map(() => input)
  );
}

// 错误处理
export function handleError(error: AppError): string {
  switch (error.type) {
    case 'ValidationError':
      return `Validation failed: ${error.message}`;
    case 'NotFoundError':
      return `${error.resource} not found`;
    case 'NetworkError':
      return `Network error: ${error.message}`;
    case 'UnauthorizedError':
      return `Unauthorized: ${error.message}`;
    default:
      return 'Unknown error';
  }
}

// Try-Catch包装
export function safeParse<T>(json: string): Either<Error, T> {
  return tryCatch(
    () => JSON.parse(json) as T,
    (e) => e instanceof Error ? e : new Error('Parse error')
  );
}

// 使用示例
const parseResult = safeParse<{ name: string }>('{ "name": "John" }');
// right({ name: 'John' })

const parseError = safeParse('{ invalid json }');
// left(Error)
```

### Task 和 TaskEither

```typescript
// fp/task/taskEither.ts
import { TaskEither, tryCatch as taskTryCatch, of, chain, map, fold } from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { Task, of as taskOf } from 'fp-ts/Task';

// API请求
export type ApiResult<T> = TaskEither<Error, T>;

export function fetchJson<T>(url: string): ApiResult<T> {
  return taskTryCatch(
    async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json() as Promise<T>;
    },
    (reason) => reason instanceof Error ? reason : new Error(String(reason))
  );
}

// 组合API调用
interface User {
  id: number;
  name: string;
}

interface Post {
  id: number;
  userId: number;
  title: string;
}

export function getUserPosts(userId: number): ApiResult<Post[]> {
  return fetchJson<Post[]>(`https://api.example.com/users/${userId}/posts`);
}

export function getUserWithPosts(userId: number): ApiResult<{ user: User; posts: Post[] }> {
  return pipe(
    fetchJson<User>(`https://api.example.com/users/${userId}`),
    chain(user =>
      pipe(
        getUserPosts(userId),
        map(posts => ({ user, posts }))
      )
    )
  );
}

// 重试逻辑
export function retry<A>(
  task: TaskEither<Error, A>,
  maxRetries: number = 3
): TaskEither<Error, A> {
  const retryTask = (attempts: number): TaskEither<Error, A> =>
    pipe(
      task,
      fold(
        (error) =>
          attempts < maxRetries
            ? retryTask(attempts + 1)
            : taskOf(left(error)),
        (value) => taskOf(right(value))
      )
    );

  return retryTask(0);
}

// 超时
import { delay } from 'fp-ts/Task';

export function withTimeout<A>(
  task: TaskEither<Error, A>,
  ms: number
): TaskEither<Error, A> {
  return taskTryCatch(
    async () => {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), ms)
      );
      
      const result = await Promise.race([
        task(),
        timeoutPromise,
      ]);
      
      return result.right; // 如果到达这里，一定是成功的
    },
    (reason) => reason instanceof Error ? reason : new Error(String(reason))
  );
}

// 并发控制
import { sequenceT } from 'fp-ts/Apply';
import { taskEither } from 'fp-ts';

export function fetchAllUsers(userIds: number[]): ApiResult<User[]> {
  return pipe(
    userIds.map(id => fetchJson<User>(`/api/users/${id}`)),
    (tasks) => taskEither.sequenceArray(tasks)
  );
}

// 使用示例
async function example() {
  const result = await getUserWithPosts(1)();
  
  if (isRight(result)) {
    console.log('User:', result.right.user);
    console.log('Posts:', result.right.posts);
  } else {
    console.error('Error:', result.left.message);
  }
}
```

### Reader 类型（依赖注入）

```typescript
// fp/reader/context.ts
import { Reader, ask, of, map, chain } from 'fp-ts/Reader';
import { pipe } from 'fp-ts/function';

// 应用上下文
export interface AppContext {
  config: {
    apiUrl: string;
    timeout: number;
  };
  logger: {
    info: (msg: string) => void;
    error: (msg: string) => void;
  };
  db: {
    query: <T>(sql: string) => Promise<T[]>;
  };
}

// Reader工具
export const getContext = ask<AppContext>();

export const getConfig = pipe(
  getContext,
  map(ctx => ctx.config)
);

export const getLogger = pipe(
  getContext,
  map(ctx => ctx.logger)
);

export const getDb = pipe(
  getContext,
  map(ctx => ctx.db)
);

// 服务示例
export function logInfo(message: string): Reader<AppContext, void> {
  return pipe(
    getLogger,
    map(logger => logger.info(message))
  );
}

export function logError(message: string): Reader<AppContext, void> {
  return pipe(
    getLogger,
    map(logger => logger.error(message))
  );
}

export function queryDb<T>(sql: string): Reader<AppContext, Promise<T[]>> {
  return pipe(
    getDb,
    map(db => db.query<T>(sql))
  );
}

// 组合操作
export function getUserFromDb(id: number): Reader<AppContext, Promise<User | null>> {
  return pipe(
    getContext,
    chain(({ db, logger }) =>
      of(async () => {
        logger.info(`Fetching user ${id}`);
        try {
          const users = await db.query<User>(`SELECT * FROM users WHERE id = ${id}`);
          return users[0] || null;
        } catch (error) {
          logger.error(`Failed to fetch user ${id}`);
          throw error;
        }
      })
    )
  );
}

// 组合多个Reader
export function fetchAndValidateUser(id: number): Reader<AppContext, Promise<Either<string, User>>> {
  return pipe(
    getContext,
    chain(({ config, db, logger }) =>
      of(async () => {
        logger.info(`Validating user ${id}`);
        
        const users = await db.query<User>(
          `SELECT * FROM users WHERE id = ${id} AND active = true`
        );
        
        if (users.length === 0) {
          return left(`User ${id} not found or inactive`);
        }
        
        return right(users[0]);
      })
    )
  );
}

// 使用示例
const context: AppContext = {
  config: {
    apiUrl: 'https://api.example.com',
    timeout: 5000,
  },
  logger: {
    info: (msg) => console.log('[INFO]', msg),
    error: (msg) => console.error('[ERROR]', msg),
  },
  db: {
    query: async <T>(sql: string) => {
      console.log('Query:', sql);
      return [] as T[];
    },
  },
};

const result = getUserFromDb(1)(context);
```

### IO 类型（副作用）

```typescript
// fp/io/effects.ts
import { IO, of, map, chain, mapTo } from 'fp-ts/IO';
import { pipe } from 'fp-ts/function';

// 纯副作用包装
export function log(message: string): IO<void> {
  return of(console.log(message));
}

export function getRandom(): IO<number> {
  return of(Math.random());
}

export function getTimestamp(): IO<number> {
  return of(Date.now());
}

export function readLocalStorage(key: string): IO<string | null> {
  return of(localStorage.getItem(key));
}

export function writeLocalStorage(key: string, value: string): IO<void> {
  return of(localStorage.setItem(key, value));
}

// DOM操作
export function getElementById(id: string): IO<HTMLElement | null> {
  return of(document.getElementById(id));
}

export function setElementText(id: string, text: string): IO<void> {
  return pipe(
    getElementById(id),
    map(element => {
      if (element) {
        element.textContent = text;
      }
    })
  );
}

// 组合IO
export function greetUser(name: string): IO<void> {
  return pipe(
    getTimestamp,
    chain(timestamp =>
      pipe(
        log(`Hello, ${name}!`),
        chain(() => log(`Current time: ${new Date(timestamp).toISOString()}`))
      )
    )
  );
}

// 延迟执行
export function delayIO<A>(ms: number, io: IO<A>): IO<Promise<A>> {
  return of(
    new Promise<A>((resolve) => {
      setTimeout(() => resolve(io()), ms);
    })
  );
}

// 使用示例
const program = pipe(
  log('Starting...'),
  chain(() => getRandom),
  map(num => num * 100),
  chain(result => log(`Random: ${result}`)),
  chain(() => log('Done!'))
);

// 执行
program(); // 控制副作用执行时机
```

### 管道和组合

```typescript
// fp/pipe/index.ts
import { pipe, flow } from 'fp-ts/function';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';

// 管道示例
export function pipelineExamples() {
  const numbers = [1, 2, 3, 4, 5];

  // 使用pipe
  const result1 = pipe(
    numbers,
    A.filter(n => n > 2),
    A.map(n => n * 2),
    A.reduce(0, (sum, n) => sum + n)
  ); // 24

  // 使用flow（point-free风格）
  const transform = flow(
    A.filter((n: number) => n > 2),
    A.map(n => n * 2),
    A.reduce(0, (sum, n) => sum + n)
  );

  const result2 = transform(numbers); // 24

  return { result1, result2 };
}

// 复杂管道
interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
}

export function processTransactions(transactions: Transaction[]): number {
  return pipe(
    transactions,
    A.filter(t => t.type === 'credit'),
    A.map(t => t.amount),
    A.reduce(0, (sum, amount) => sum + amount)
  );
}

// Option管道
export function findAndTransform(data: number[]): O.Option<string> {
  return pipe(
    data,
    A.findFirst(n => n > 5),
    O.map(n => n * 2),
    O.filter(n => n < 20),
    O.map(n => `Result: ${n}`)
  );
}

// TaskEither管道
export function fetchProcessAndValidate(id: number): TE.TaskEither<Error, string> {
  return pipe(
    fetchJson<{ value: number }>(`/api/data/${id}`),
    TE.map(data => data.value),
    TE.chain(value =>
      value > 0
        ? TE.right(`Valid: ${value}`)
        : TE.left(new Error('Invalid value'))
    )
  );
}

// 组合多个操作
import { sequence } from 'fp-ts/Array';

export function processAllOptions(options: Array<O.Option<number>>): O.Option<number[]> {
  return pipe(
    options,
    sequence(O.Applicative)
  );
}

export function processAllEithers(eithers: Array<E.Either<string, number>>): E.Either<string, number[]> {
  return pipe(
    eithers,
    sequence(E.getApplicativeValidation(A.getSemigroup<string>()))
  );
}
```

### 数组和记录操作

```typescript
// fp/array/index.ts
import * as A from 'fp-ts/Array';
import { pipe } from 'fp-ts/function';

export function arrayExamples() {
  const numbers = [1, 2, 3, 4, 5];

  return {
    // 映射
    map: pipe(numbers, A.map(n => n * 2)), // [2, 4, 6, 8, 10]

    // 过滤
    filter: pipe(numbers, A.filter(n => n > 2)), // [3, 4, 5]

    // 折叠
    reduce: pipe(numbers, A.reduce(0, (sum, n) => sum + n)), // 15

    // 查找
    findFirst: pipe(numbers, A.findFirst(n => n > 3)), // some(4)
    findLast: pipe(numbers, A.findLast(n => n < 3)), // some(2)

    // 分割
    splitAt: pipe(numbers, A.splitAt(2)), // [[1,2], [3,4,5]]
    chunksOf: pipe(numbers, A.chunksOf(2)), // [[1,2], [3,4], [5]]

    // 排序
    sort: pipe([3, 1, 2], A.sort(A.Ord)), // [1, 2, 3]

    // 去重
    uniq: pipe([1, 1, 2, 2, 3], A.uniq(A.Eq)), // [1, 2, 3]

    // 拉链
    zip: pipe(
      [1, 2, 3],
      A.zip(['a', 'b', 'c'])
    ), // [[1, 'a'], [2, 'b'], [3, 'c']]

    // 展平
    flatten: pipe([[1, 2], [3, 4]], A.flatten), // [1, 2, 3, 4]

    // flatMap
    flatMap: pipe(
      [1, 2, 3],
      A.flatMap(n => [n, n * 2])
    ), // [1, 2, 2, 4, 3, 6]
  };
}

// fp/record/index.ts
import * as R from 'fp-ts/Record';
import { pipe } from 'fp-ts/function';

export function recordExamples() {
  const record = { a: 1, b: 2, c: 3 };

  return {
    // 映射
    map: pipe(record, R.map(n => n * 2)), // { a: 2, b: 4, c: 6 }

    // 映射键
    mapWithIndex: pipe(
      record,
      R.mapWithIndex((key, value) => `${key}:${value}`)
    ), // { a: 'a:1', b: 'b:2', c: 'c:3' }

    // 过滤
    filter: pipe(record, R.filter(n => n > 1)), // { b: 2, c: 3 }

    // 折叠
    reduce: pipe(
      record,
      R.reduce('', (acc, value) => acc + value)
    ), // '123'

    // 键/值数组
    keys: R.keys(record),       // ['a', 'b', 'c']
    values: R.values(record),   // [1, 2, 3]
    collect: R.collect((k, v) => `${k}=${v}`)(record), // ['a=1', 'b=2', 'c=3']

    // 转换
    toArray: R.toEntries(record), // [['a', 1], ['b', 2], ['c', 3]]
    fromArray: R.fromEntries([['x', 10], ['y', 20]]), // { x: 10, y: 20 }

    // 查找
    lookup: pipe(record, R.lookup('a')), // some(1)
    has: pipe(record, R.has('a')), // true

    // 修改
    insertAt: pipe(record, R.insertAt('d', 4)), // { a:1, b:2, c:3, d:4 }
    deleteAt: pipe(record, R.deleteAt('a')),    // { b:2, c:3 }
    updateAt: pipe(record, R.updateAt('a', 10)), // { a:10, b:2, c:3 }
    modifyAt: pipe(
      record,
      R.modifyAt('a', n => n * 2)
    ), // { a:2, b:2, c:3 }
  };
}
```

## 测试

```typescript
// __tests__/fp/option/operations.test.ts
import { describe, it, expect } from 'vitest';
import { some, none, isSome, isNone } from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import { createOption, chainOptions } from '@/fp/option/operations';

describe('Option Operations', () => {
  it('should create option from nullable', () => {
    expect(isSome(createOption('test'))).toBe(true);
    expect(isNone(createOption(null))).toBe(true);
    expect(isNone(createOption(undefined))).toBe(true);
  });

  it('should chain options', () => {
    const result = chainOptions();
    expect(isSome(result)).toBe(true);
  });

  it('should map over option', () => {
    const result = pipe(
      some(5),
      (opt) => opt,
      (opt) => (isSome(opt) ? some(opt.value * 2) : none)
    );
    
    expect(isSome(result)).toBe(true);
    if (isSome(result)) {
      expect(result.value).toBe(10);
    }
  });
});

// __tests__/fp/either/error.test.ts
import { describe, it, expect } from 'vitest';
import { isRight, isLeft } from 'fp-ts/Either';
import { validateEmail, validatePassword, validateAge } from '@/fp/either/error';

describe('Either Validation', () => {
  it('should validate email', () => {
    expect(isRight(validateEmail('test@example.com'))).toBe(true);
    expect(isLeft(validateEmail('invalid'))).toBe(true);
  });

  it('should validate password', () => {
    expect(isRight(validatePassword('12345678'))).toBe(true);
    expect(isLeft(validatePassword('short'))).toBe(true);
  });

  it('should validate age', () => {
    expect(isRight(validateAge(25))).toBe(true);
    expect(isLeft(validateAge(15))).toBe(true);
    expect(isLeft(validateAge(150))).toBe(true);
  });
});
```

## 配置文件

### package.json

```json
{
  "dependencies": {
    "fp-ts": "^2.16.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## 最佳实践

1. **使用pipe**: 链式调用使用pipe保持可读性
2. **不可变数据**: 所有操作返回新值
3. **类型安全**: 充分利用TypeScript类型系统
4. **错误处理**: 使用Either代替异常
5. **延迟执行**: 使用IO/Task包装副作用
6. **组合优于继承**: 使用函数组合
7. **纯函数优先**: 分离纯函数和副作用
8. **类型推断**: 让TypeScript推断类型
9. **文档化**: 为复杂函数添加类型签名
10. **测试**: 测试纯函数更容易
