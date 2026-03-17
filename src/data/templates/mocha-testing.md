# Mocha Testing 模板

## 技术栈

- **测试框架**: Mocha 10.x
- **断言库**: Chai (expect/assert/should)
- **Mock/Stub**: Sinon.js
- **覆盖率**: NYC (Istanbul)
- **浏览器测试**: Karma + Mocha
- **异步支持**: 原生 Promise/async-await
- **类型支持**: @types/mocha, @types/chai

## 项目结构

```
mocha-testing/
├── src/                       # 源代码
│   ├── modules/              # 模块
│   ├── utils/                # 工具函数
│   └── services/             # 服务层
├── test/                     # 测试目录
│   ├── unit/                 # 单元测试
│   ├── integration/          # 集成测试
│   ├── e2e/                  # 端到端测试
│   ├── fixtures/             # 测试数据
│   ├── mocks/                # Mock 数据
│   ├── helpers/              # 测试工具
│   └── setup.js              # 测试配置
├── .mocharc.json             # Mocha 配置
├── package.json
└── tsconfig.json
```

## 代码模式

### Mocha 配置

```javascript
// .mocharc.json
{
  "extension": ["ts"],
  "spec": "test/**/*.spec.ts",
  "require": [
    "ts-node/register",
    "test/setup.ts"
  ],
  "recursive": true,
  "timeout": 10000,
  "ui": "bdd",
  "reporter": "spec",
  "slow": 75,
  "bail": false,
  "watch": false,
  "parallel": false,
  "retries": 0,
  "delay": false,
  "exit": true,
  "forbidOnly": false,
  "forbidPending": false,
  "check-leaks": true,
  "trace-warnings": true,
  "file": []
}

// .mocharc.js (替代方案)
module.exports = {
  extension: ['ts', 'js'],
  spec: ['test/**/*.spec.ts', 'test/**/*.test.js'],
  require: ['ts-node/register', 'test/setup.ts'],
  recursive: true,
  timeout: 10000,
  ui: 'bdd',
  reporter: 'spec',
  slow: 75,
  bail: process.env.CI === 'true',
  parallel: process.env.CI !== 'true',
  retries: process.env.CI === 'true' ? 2 : 0,
  exit: true,
  checkLeaks: true,
  forbidOnly: process.env.CI === 'true',
};

// test/setup.ts
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import chaiSubset from 'chai-subset';
import sinonChai from 'sinon-chai';

// 扩展 Chai
use(chaiAsPromised);
use(chaiSubset);
use(sinonChai);

// 全局配置
before(() => {
  // 全局 setup
  console.log('Starting tests...');
});

after(() => {
  // 全局 cleanup
  console.log('All tests completed.');
});

// 导出供其他文件使用
export { expect };
```

### 单元测试

```typescript
// test/unit/utils/helpers.spec.ts
import { expect } from 'chai';
import {
  formatDate,
  debounce,
  throttle,
  deepClone,
  groupBy,
  sleep,
} from '@/utils/helpers';

describe('Helpers', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00');
      expect(formatDate(date, 'YYYY-MM-DD')).to.equal('2024-01-15');
    });

    it('should handle different formats', () => {
      const date = new Date('2024-12-25T15:45:30');
      expect(formatDate(date, 'MM/DD/YYYY')).to.equal('12/25/2024');
      expect(formatDate(date, 'DD-MM-YYYY HH:mm')).to.equal('25-12-2024 15:45');
    });

    it('should throw on invalid date', () => {
      expect(() => formatDate(new Date('invalid'), 'YYYY-MM-DD')).to.throw();
    });

    // 参数化测试
    const testCases = [
      { date: '2024-01-15', pattern: 'YYYY-MM-DD', expected: '2024-01-15' },
      { date: '2024-12-25', pattern: 'MM/DD/YYYY', expected: '12/25/2024' },
      { date: '2024-06-30', pattern: 'DD-MM-YYYY', expected: '30-06-2024' },
    ];

    testCases.forEach(({ date, pattern, expected }) => {
      it(`should format ${date} with ${pattern} pattern`, () => {
        expect(formatDate(new Date(date), pattern)).to.equal(expected);
      });
    });
  });

  describe('debounce', () => {
    let clock: sinon.SinonFakeTimers;

    beforeEach(() => {
      clock = sinon.useFakeTimers();
    });

    afterEach(() => {
      clock.restore();
    });

    it('should debounce function calls', () => {
      const fn = sinon.spy();
      const debouncedFn = debounce(fn, 300);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(fn).to.not.have.been.called;

      clock.tick(300);

      expect(fn).to.have.been.calledOnce;
    });

    it('should pass the latest arguments', () => {
      const fn = sinon.spy();
      const debouncedFn = debounce(fn, 300);

      debouncedFn('first');
      debouncedFn('second');
      debouncedFn('third');

      clock.tick(300);

      expect(fn).to.have.been.calledWith('third');
    });
  });

  describe('throttle', () => {
    let clock: sinon.SinonFakeTimers;

    beforeEach(() => {
      clock = sinon.useFakeTimers();
    });

    afterEach(() => {
      clock.restore();
    });

    it('should throttle function calls', () => {
      const fn = sinon.spy();
      const throttledFn = throttle(fn, 300);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(fn).to.have.been.calledOnce;

      clock.tick(300);
      throttledFn();

      expect(fn).to.have.been.calledTwice;
    });
  });

  describe('deepClone', () => {
    it('should deep clone object', () => {
      const obj = {
        name: 'John',
        age: 30,
        address: {
          city: 'New York',
          country: 'USA',
        },
        hobbies: ['reading', 'coding'],
      };

      const cloned = deepClone(obj);

      expect(cloned).to.deep.equal(obj);
      expect(cloned).to.not.equal(obj);
      expect(cloned.address).to.not.equal(obj.address);
      expect(cloned.hobbies).to.not.equal(obj.hobbies);
    });

    it('should handle null and undefined', () => {
      expect(deepClone(null)).to.equal(null);
      expect(deepClone(undefined)).to.equal(undefined);
    });
  });

  describe('groupBy', () => {
    it('should group array by key', () => {
      const users = [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
        { name: 'Charlie', age: 25 },
      ];

      const grouped = groupBy(users, 'age');

      expect(grouped).to.deep.equal({
        25: [
          { name: 'Alice', age: 25 },
          { name: 'Charlie', age: 25 },
        ],
        30: [{ name: 'Bob', age: 30 }],
      });
    });
  });

  describe('sleep', () => {
    let clock: sinon.SinonFakeTimers;

    beforeEach(() => {
      clock = sinon.useFakeTimers();
    });

    afterEach(() => {
      clock.restore();
    });

    it('should sleep for specified time', async () => {
      const start = Date.now();
      const sleepPromise = sleep(1000);

      await clock.tickAsync(1000);
      await sleepPromise;

      expect(Date.now() - start).to.be.at.least(1000);
    });
  });
});
```

### 使用 Sinon 进行 Mock

```typescript
// test/unit/services/userService.spec.ts
import { expect } from 'chai';
import sinon from 'sinon';
import { UserService } from '@/services/userService';
import { UserRepository } from '@/repositories/userRepository';

describe('UserService', () => {
  let userService: UserService;
  let userRepository: sinon.SinonStubbedInstance<UserRepository>;

  beforeEach(() => {
    userRepository = sinon.createStubInstance(UserRepository);
    userService = new UserService(userRepository);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser = { id: '1', name: 'John', email: 'john@example.com' };
      userRepository.findById.resolves(mockUser);

      const result = await userService.getUserById('1');

      expect(result).to.deep.equal(mockUser);
      expect(userRepository.findById).to.have.been.calledOnceWith('1');
    });

    it('should throw error when user not found', async () => {
      userRepository.findById.resolves(null);

      await expect(userService.getUserById('999'))
        .to.be.rejectedWith('User not found');
    });

    it('should handle repository errors', async () => {
      userRepository.findById.rejects(new Error('Database error'));

      await expect(userService.getUserById('1'))
        .to.be.rejectedWith('Database error');
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const newUser = { name: 'Jane', email: 'jane@example.com' };
      const createdUser = { id: '2', ...newUser };
      userRepository.create.resolves(createdUser);

      const result = await userService.createUser(newUser);

      expect(result).to.deep.equal(createdUser);
      expect(userRepository.create).to.have.been.calledOnceWith(newUser);
    });

    it('should validate email format', async () => {
      const invalidUser = { name: 'Jane', email: 'invalid-email' };

      await expect(userService.createUser(invalidUser))
        .to.be.rejectedWith('Invalid email format');
      
      expect(userRepository.create).to.not.have.been.called;
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updates = { name: 'Updated Name' };
      const updatedUser = { id: '1', name: 'Updated Name', email: 'john@example.com' };
      userRepository.update.resolves(updatedUser);

      const result = await userService.updateUser('1', updates);

      expect(result).to.deep.equal(updatedUser);
      expect(userRepository.update).to.have.been.calledOnceWith('1', updates);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      userRepository.delete.resolves(true);

      const result = await userService.deleteUser('1');

      expect(result).to.be.true;
      expect(userRepository.delete).to.have.been.calledOnceWith('1');
    });
  });
});

// 使用 Spy
describe('EventEmitter', () => {
  it('should call event handler', () => {
    const emitter = new EventEmitter();
    const handler = sinon.spy();

    emitter.on('test', handler);
    emitter.emit('test', 'data');

    expect(handler).to.have.been.calledOnce;
    expect(handler).to.have.been.calledWith('data');
  });

  it('should call multiple handlers', () => {
    const emitter = new EventEmitter();
    const handler1 = sinon.spy();
    const handler2 = sinon.spy();

    emitter.on('test', handler1);
    emitter.on('test', handler2);
    emitter.emit('test');

    expect(handler1).to.have.been.calledOnce;
    expect(handler2).to.have.been.calledOnce;
  });
});

// 使用 Stub
describe('API Client', () => {
  it('should stub fetch call', async () => {
    const fetchStub = sinon.stub(global, 'fetch');
    fetchStub.resolves({
      ok: true,
      json: async () => ({ data: 'test' }),
    } as Response);

    const result = await fetchData();

    expect(result).to.deep.equal({ data: 'test' });
    expect(fetchStub).to.have.been.calledOnce;

    fetchStub.restore();
  });
});

// 使用 Mock
describe('OrderProcessor', () => {
  it('should process order correctly', () => {
    const mock = sinon.mock(paymentGateway);

    mock.expects('processPayment').once().withArgs(100).resolves({ success: true });
    mock.expects('sendConfirmation').once().resolves();

    await orderProcessor.process({ amount: 100 });

    mock.verify();
    mock.restore();
  });
});
```

### 集成测试

```typescript
// test/integration/api.spec.ts
import { expect } from 'chai';
import request from 'supertest';
import { app } from '@/app';
import { setupDatabase, cleanupDatabase } from '../helpers/database';

describe('API Integration Tests', () => {
  before(async () => {
    await setupDatabase();
  });

  after(async () => {
    await cleanupDatabase();
  });

  describe('GET /api/users', () => {
    it('should return all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).to.be.an('array');
      expect(response.body.length).to.be.greaterThan(0);
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/users?role=admin')
        .expect(200);

      expect(response.body).to.be.an('array');
      response.body.forEach((user: any) => {
        expect(user.role).to.equal('admin');
      });
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const newUser = {
        name: 'Test User',
        email: 'test@example.com',
      };

      const response = await request(app)
        .post('/api/users')
        .send(newUser)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).to.include(newUser);
      expect(response.body).to.have.property('id');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({})
        .expect(400);

      expect(response.body).to.have.property('error');
    });

    it('should reject duplicate email', async () => {
      const user = {
        name: 'Duplicate',
        email: 'duplicate@example.com',
      };

      await request(app).post('/api/users').send(user).expect(201);
      
      await request(app)
        .post('/api/users')
        .send(user)
        .expect(409);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user', async () => {
      const response = await request(app)
        .put('/api/users/1')
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(response.body.name).to.equal('Updated Name');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .put('/api/users/999')
        .send({ name: 'Updated' })
        .expect(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user', async () => {
      await request(app)
        .delete('/api/users/1')
        .expect(204);
    });
  });

  describe('Authentication', () => {
    let authToken: string;

    before(async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'password123',
        });

      authToken = response.body.token;
    });

    it('should access protected route with token', async () => {
      await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should reject request without token', async () => {
      await request(app)
        .get('/api/profile')
        .expect(401);
    });
  });
});
```

### 异步测试

```typescript
// test/async/async.spec.ts
import { expect } from 'chai';

describe('Async Tests', () => {
  // 使用 async/await
  it('should handle async operation', async () => {
    const result = await asyncFunction();
    expect(result).to.equal('success');
  });

  // 使用 Promise
  it('should handle promise', () => {
    return asyncFunction().then((result) => {
      expect(result).to.equal('success');
    });
  });

  // 使用 done callback
  it('should handle callback', (done) => {
    asyncCallback((error, result) => {
      if (error) done(error);
      expect(result).to.equal('success');
      done();
    });
  });

  // 测试 Promise rejection
  it('should handle promise rejection', async () => {
    await expect(failingAsyncFunction())
      .to.be.rejectedWith('Error message');
  });

  // 测试超时
  it('should timeout after specified time', async function () {
    this.timeout(5000); // 设置超时为 5 秒

    await longRunningOperation();
  }).timeout(5000); // 另一种设置方式

  // 测试慢速操作
  it('should mark slow tests', async function () {
    this.slow(1000); // 超过 1 秒标记为慢

    await slowOperation();
  });
});
```

### Hooks 和生命周期

```typescript
// test/hooks/hooks.spec.ts
import { expect } from 'chai';

describe('Hooks Example', () => {
  let database: any;

  // 所有测试前执行一次
  before(() => {
    console.log('Setting up test suite...');
    database = createDatabase();
  });

  // 所有测试后执行一次
  after(() => {
    console.log('Tearing down test suite...');
    database.close();
  });

  // 每个测试前执行
  beforeEach(() => {
    database.clear();
  });

  // 每个测试后执行
  afterEach(() => {
    // 清理操作
  });

  describe('Database Operations', () => {
    let user: any;

    beforeEach(() => {
      user = database.createUser({ name: 'Test' });
    });

    it('should create user', () => {
      expect(user.name).to.equal('Test');
    });

    it('should update user', () => {
      database.updateUser(user.id, { name: 'Updated' });
      expect(database.getUser(user.id).name).to.equal('Updated');
    });
  });

  // 嵌套 describe
  describe('Nested Hooks', () => {
    before(() => {
      console.log('Nested before');
    });

    beforeEach(() => {
      console.log('Nested beforeEach');
    });

    it('test 1', () => {});
    it('test 2', () => {});
  });
});

// 动态生成测试
describe('Dynamic Tests', () => {
  const testCases = [
    { input: 1, expected: 2 },
    { input: 2, expected: 4 },
    { input: 3, expected: 6 },
  ];

  testCases.forEach(({ input, expected }) => {
    it(`should double ${input} to ${expected}`, () => {
      expect(double(input)).to.equal(expected);
    });
  });
});

// 延迟执行
describe('Delayed Tests', function () {
  this.delay(); // 延迟执行直到 run() 被调用

  it('will not run immediately', () => {
    // 这个测试不会立即运行
  });
});

// 在外部触发运行
// setTimeout(() => {
//   mocha.run();
// }, 1000);
```

### 浏览器测试

```html
<!-- test/browser/index.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Mocha Browser Tests</title>
  <link rel="stylesheet" href="https://unpkg.com/mocha/mocha.css">
</head>
<body>
  <div id="mocha"></div>
  
  <script src="https://unpkg.com/chai/chai.js"></script>
  <script src="https://unpkg.com/mocha/mocha.js"></script>
  
  <script>
    mocha.setup('bdd');
    const expect = chai.expect;
  </script>
  
  <!-- 测试文件 -->
  <script src="test.bundle.js"></script>
  
  <script>
    mocha.run();
  </script>
</body>
</html>
```

```typescript
// test/browser/dom.spec.ts
import { expect } from 'chai';

describe('DOM Tests', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should create element', () => {
    const element = document.createElement('button');
    element.textContent = 'Click me';
    container.appendChild(element);

    const button = container.querySelector('button');
    expect(button).to.not.be.null;
    expect(button?.textContent).to.equal('Click me');
  });

  it('should handle click event', () => {
    const button = document.createElement('button');
    let clicked = false;

    button.addEventListener('click', () => {
      clicked = true;
    });

    container.appendChild(button);
    button.click();

    expect(clicked).to.be.true;
  });

  it('should update DOM', () => {
    container.innerHTML = '<span class="text">Hello</span>';
    
    const span = container.querySelector('.text') as HTMLSpanElement;
    span.textContent = 'World';

    expect(span.textContent).to.equal('World');
  });
});
```

## 最佳实践

### 1. 测试组织

```typescript
// 使用 describe 嵌套组织测试
describe('UserService', () => {
  describe('create', () => {
    it('should create user with valid data', () => {});
    it('should throw error with invalid email', () => {});
    it('should hash password', () => {});
  });

  describe('update', () => {
    it('should update user name', () => {});
    it('should not update email to existing one', () => {});
  });

  describe('delete', () => {
    it('should soft delete user', () => {});
    it('should cascade delete related data', () => {});
  });
});

// 使用 context (describe 的别名)
describe('Calculator', () => {
  context('when adding numbers', () => {
    it('should return sum', () => {});
  });

  context('when dividing by zero', () => {
    it('should throw error', () => {});
  });
});

// 使用 skip 和 only
describe.skip('Feature not ready', () => {
  it('should work when implemented', () => {});
});

describe('Critical Feature', () => {
  it.only('must pass', () => {});
});
```

### 2. 断言风格

```typescript
// BDD 风格 (推荐)
import { expect } from 'chai';

expect(result).to.equal(5);
expect(array).to.include(3);
expect(object).to.have.property('name');

// TDD 风格
import { assert } from 'chai';

assert.equal(result, 5);
assert.include(array, 3);
assert.property(object, 'name');

// Should 风格
import 'chai/register-should';

result.should.equal(5);
array.should.include(3);
object.should.have.property('name');

// 链式断言
expect(result)
  .to.be.a('number')
  .and.to.be.greaterThan(0)
  .and.to.be.lessThan(100);

// 深度相等
expect(obj1).to.deep.equal(obj2);

// 部分匹配
expect(obj).to.containSubset({
  name: 'John',
  age: 30,
});

// 类型检查
expect(value).to.be.a('string');
expect(array).to.be.an('array');
expect(nullValue).to.be.null;
expect(undefinedValue).to.be.undefined;
```

### 3. 测试数据管理

```typescript
// test/fixtures/user.ts
export const userFixtures = {
  basic: {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
  },

  admin: {
    id: '2',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'ADMIN',
  },

  withPosts: {
    id: '3',
    name: 'Author',
    email: 'author@example.com',
    posts: [
      { id: 'p1', title: 'Post 1' },
      { id: 'p2', title: 'Post 2' },
    ],
  },
};

// Factory 函数
export const createUser = (overrides = {}) => ({
  id: Math.random().toString(),
  name: 'Test User',
  email: 'test@example.com',
  ...overrides,
});

// 使用
it('should create user', () => {
  const user = createUser({ name: 'Custom Name' });
  expect(user.name).to.equal('Custom Name');
});

// Faker.js 生成数据
import { faker } from '@faker-js/faker';

export const generateUser = () => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  avatar: faker.image.avatar(),
});
```

## 常用命令

```bash
# Mocha CLI 命令

# 运行所有测试
npm test

# 运行特定文件
npm test -- test/unit/utils.spec.ts

# 运行匹配模式的测试
npm test -- --grep "UserService"

# 监听模式
npm test -- --watch

# 并行运行
npm test -- --parallel

# 指定 reporter
npm test -- --reporter spec
npm test -- --reporter list
npm test -- --reporter json

# 生成覆盖率报告
nyc npm test

# 增加超时时间
npm test -- --timeout 10000

# 失败时停止
npm test -- --bail

# 仅运行标记为 only 的测试
npm test -- --grep "only"

# 显示慢测试
npm test -- --slow 100

# 递归运行
npm test -- --recursive

# 指定文件扩展名
npm test -- --extension ts

# 要求的文件
npm test -- --require ts-node/register

# 使用配置文件
npm test -- --config .mocharc.json

# 输出详细日志
npm test -- --verbose

# 重新运行失败的测试
npm test -- --forbid-only

# 检查内存泄漏
npm test -- --check-leaks
```

## 部署配置

### CI/CD 集成

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Run tests with coverage
        run: nyc npm test

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: coverage/
```

### Package.json 脚本

```json
{
  "scripts": {
    "test": "mocha",
    "test:watch": "mocha --watch",
    "test:coverage": "nyc npm test",
    "test:debug": "mocha --inspect-brk",
    "test:parallel": "mocha --parallel",
    "test:unit": "mocha test/unit/**/*.spec.ts",
    "test:integration": "mocha test/integration/**/*.spec.ts",
    "test:e2e": "mocha test/e2e/**/*.spec.ts"
  },
  "devDependencies": {
    "mocha": "^10.0.0",
    "chai": "^4.3.0",
    "@types/mocha": "^10.0.0",
    "@types/chai": "^4.3.0",
    "sinon": "^17.0.0",
    "@types/sinon": "^17.0.0",
    "nyc": "^15.1.0",
    "ts-node": "^10.9.0",
    "supertest": "^6.3.0",
    "@types/supertest": "^6.0.0",
    "chai-as-promised": "^8.0.0",
    "chai-subset": "^1.6.0",
    "sinon-chai": "^4.0.0"
  }
}
```

### NYC 配置

```json
// .nycrc.json
{
  "extends": "@istanbuljs/nyc-config-typescript",
  "all": true,
  "check-coverage": true,
  "reporter": ["text", "lcov", "html"],
  "report-dir": "./coverage",
  "exclude": [
    "test/**",
    "node_modules/**",
    "**/*.d.ts",
    "**/*.spec.ts",
    "**/*.test.ts"
  ],
  "branches": 80,
  "lines": 80,
  "functions": 80,
  "statements": 80,
  "watermarks": {
    "lines": [80, 95],
    "functions": [80, 95],
    "branches": [80, 95],
    "statements": [80, 95]
  }
}
```

## 参考资源

- [Mocha 官方文档](https://mochajs.org/)
- [Chai 官方文档](https://www.chaijs.com/)
- [Sinon.js 官方文档](https://sinonjs.org/)
- [NYC (Istanbul) 官方文档](https://istanbul.js.org/)
- [Mocha GitHub](https://github.com/mochajs/mocha)
