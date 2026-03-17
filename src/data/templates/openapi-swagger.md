# OpenAPI/Swagger API 规范模板

## 技术栈

- **OpenAPI Specification**: 3.1.0 (最新稳定版)
- **Swagger UI**: 5.x - 交互式 API 文档
- **Swagger Codegen**: 3.x - 代码生成
- **Swagger Editor**: 在线编辑器
- **OpenAPI Generator**: 多语言代码生成
- **Redoc**: 美观的文档生成

## 项目结构

```
api-project/
├── openapi/
│   ├── openapi.yaml          # 主规范文件
│   ├── components/
│   │   ├── schemas/          # 数据模型
│   │   │   ├── User.yaml
│   │   │   ├── Product.yaml
│   │   │   └── Error.yaml
│   │   ├── parameters/       # 可复用参数
│   │   │   ├── PathId.yaml
│   │   │   └── Pagination.yaml
│   │   ├── responses/        # 可复用响应
│   │   │   ├── NotFound.yaml
│   │   │   └── Unauthorized.yaml
│   │   ├── requestBodies/    # 请求体
│   │   │   └── UserCreate.yaml
│   │   ├── headers/          # 自定义头部
│   │   ├── examples/         # 示例数据
│   │   └── securitySchemes/  # 安全方案
│   ├── paths/                # API 路径
│   │   ├── users.yaml
│   │   ├── users-{id}.yaml
│   │   └── products.yaml
│   └── webhooks/             # Webhook 定义
├── docs/
│   └── swagger-ui/           # Swagger UI 定制
├── generated/                # 生成的代码
├── tests/
│   └── contract/             # 契约测试
├── .spectral.yaml            # Spectral 规则配置
├── package.json
└── README.md
```

## 代码模式

### 1. OpenAPI 规范文件

```yaml
# openapi/openapi.yaml
openapi: 3.1.0
info:
  title: Sample API
  version: 1.0.0
  description: |
    这是一个示例 API 文档
  contact:
    name: API Support
    email: support@example.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.example.com/v1
    description: Production server
  - url: https://staging-api.example.com/v1
    description: Staging server
  - url: http://localhost:3000/v1
    description: Development server

tags:
  - name: users
    description: 用户相关操作
  - name: products
    description: 产品相关操作

paths:
  $ref: './paths/index.yaml'

components:
  $ref: './components/index.yaml'
```

### 2. 数据模型定义

```yaml
# openapi/components/schemas/User.yaml
type: object
required:
  - id
  - email
  - createdAt
properties:
  id:
    type: string
    format: uuid
    description: 用户唯一标识符
    example: "123e4567-e89b-12d3-a456-426614174000"
  email:
    type: string
    format: email
    description: 用户邮箱
    example: "user@example.com"
  username:
    type: string
    minLength: 3
    maxLength: 50
    pattern: '^[a-zA-Z0-9_-]+$'
    description: 用户名
    example: "johndoe"
  fullName:
    type: string
    description: 用户全名
    example: "John Doe"
  avatar:
    type: string
    format: uri
    description: 头像 URL
  role:
    type: string
    enum: [user, admin, moderator]
    default: user
    description: 用户角色
  isActive:
    type: boolean
    default: true
    description: 是否激活
  createdAt:
    type: string
    format: date-time
    description: 创建时间
  updatedAt:
    type: string
    format: date-time
    description: 更新时间

# 继承示例
UserCreate:
  type: object
  required:
    - email
    - password
  properties:
    email:
      $ref: '#/properties/email'
    password:
      type: string
      format: password
      minLength: 8
    username:
      $ref: '#/properties/username'
    fullName:
      $ref: '#/properties/fullName'

UserUpdate:
  type: object
  properties:
    username:
      $ref: '#/properties/username'
    fullName:
      $ref: '#/properties/fullName'
    avatar:
      $ref: '#/properties/avatar'
```

### 3. 路径定义

```yaml
# openapi/paths/users.yaml
get:
  tags:
    - users
  summary: 获取用户列表
  description: 返回分页的用户列表
  operationId: getUsers
  parameters:
    - $ref: '../components/parameters/Pagination.yaml#/page'
    - $ref: '../components/parameters/Pagination.yaml#/limit'
    - name: search
      in: query
      description: 搜索关键词
      required: false
      schema:
        type: string
    - name: role
      in: query
      description: 按角色筛选
      required: false
      schema:
        type: string
        enum: [user, admin, moderator]
  responses:
    '200':
      description: 成功返回用户列表
      content:
        application/json:
          schema:
            type: object
            required:
              - data
              - pagination
            properties:
              data:
                type: array
                items:
                  $ref: '../components/schemas/User.yaml'
              pagination:
                $ref: '../components/schemas/Pagination.yaml'
          example:
            data:
              - id: "123e4567-e89b-12d3-a456-426614174000"
                email: "user@example.com"
                username: "johndoe"
            pagination:
              page: 1
              limit: 20
              total: 100
    '400':
      $ref: '../components/responses/BadRequest.yaml'
    '401':
      $ref: '../components/responses/Unauthorized.yaml'
  security:
    - bearerAuth: []

post:
  tags:
    - users
  summary: 创建新用户
  description: 创建一个新的用户账户
  operationId: createUser
  requestBody:
    required: true
    content:
      application/json:
        schema:
          $ref: '../components/schemas/User.yaml#/UserCreate'
        examples:
          basic:
            summary: 基本用户创建
            value:
              email: "newuser@example.com"
              password: "SecurePass123"
          withProfile:
            summary: 带完整资料
            value:
              email: "newuser@example.com"
              password: "SecurePass123"
              username: "newuser"
              fullName: "New User"
  responses:
    '201':
      description: 用户创建成功
      content:
        application/json:
          schema:
            $ref: '../components/schemas/User.yaml'
    '400':
      $ref: '../components/responses/BadRequest.yaml'
    '409':
      description: 邮箱或用户名已存在
      content:
        application/json:
          schema:
            $ref: '../components/schemas/Error.yaml'
```

### 4. 可复用组件

```yaml
# openapi/components/parameters/Pagination.yaml
page:
  name: page
  in: query
  description: 页码（从 1 开始）
  required: false
  schema:
    type: integer
    minimum: 1
    default: 1

limit:
  name: limit
  in: query
  description: 每页数量
  required: false
  schema:
    type: integer
    minimum: 1
    maximum: 100
    default: 20

# openapi/components/responses/Unauthorized.yaml
description: 未授权访问
content:
  application/json:
    schema:
      $ref: '../schemas/Error.yaml'
    example:
      error: "Unauthorized"
      message: "需要登录才能访问此资源"
      statusCode: 401

# openapi/components/securitySchemes/index.yaml
bearerAuth:
  type: http
  scheme: bearer
  bearerFormat: JWT
  description: JWT 认证

apiKey:
  type: apiKey
  in: header
  name: X-API-Key
  description: API 密钥认证

oauth2:
  type: oauth2
  flows:
    authorizationCode:
      authorizationUrl: https://auth.example.com/oauth/authorize
      tokenUrl: https://auth.example.com/oauth/token
      scopes:
        read: 读权限
        write: 写权限
        admin: 管理员权限
```

### 5. TypeScript 类型生成

```typescript
// generated/types.ts
/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface components {
  schemas: {
    User: {
      id: string;
      email: string;
      username?: string;
      fullName?: string;
      avatar?: string;
      role?: 'user' | 'admin' | 'moderator';
      isActive?: boolean;
      createdAt: string;
      updatedAt?: string;
    };
    UserCreate: {
      email: string;
      password: string;
      username?: string;
      fullName?: string;
    };
    Error: {
      error: string;
      message: string;
      statusCode: number;
    };
  };
}

export type User = components['schemas']['User'];
export type UserCreate = components['schemas']['UserCreate'];
export type Error = components['schemas']['Error'];
```

### 6. API 客户端使用

```typescript
// src/api/client.ts
import createClient from 'openapi-fetch';
import type { paths } from './generated/schema';

const client = createClient<paths>({
  baseUrl: process.env.API_URL,
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

// 使用示例
async function getUsers(page = 1, limit = 20) {
  const { data, error } = await client.GET('/users', {
    params: {
      query: { page, limit },
    },
  });

  if (error) {
    console.error('Failed to fetch users:', error);
    return null;
  }

  return data;
}

async function createUser(userData: UserCreate) {
  const { data, error } = await client.POST('/users', {
    body: userData,
  });

  if (error) {
    // TypeScript 知道 error 的类型
    if (error.statusCode === 409) {
      throw new Error('用户已存在');
    }
    throw new Error(error.message);
  }

  return data;
}
```

## 最佳实践

### 1. 规范组织

```yaml
# ✅ 好的做法 - 使用引用拆分文件
paths:
  /users:
    $ref: './paths/users.yaml'
  /users/{id}:
    $ref: './paths/users-{id}.yaml'

# ❌ 避免 - 所有内容在一个文件
paths:
  /users:
    get:
      # ... 200 行代码
  /users/{id}:
    get:
      # ... 200 行代码

# ✅ 使用组件复用
responses:
  '404':
    $ref: './components/responses/NotFound.yaml'

# ❌ 重复定义
responses:
  '404':
    description: 资源未找到
    content:
      application/json:
        schema:
          type: object
          properties:
            error:
              type: string
```

### 2. 版本管理

```yaml
# 使用语义化版本
info:
  version: 1.2.0

# 破坏性变更使用新版本
info:
  version: 2.0.0

# 向后兼容的变更使用次版本
info:
  version: 1.3.0

# 使用版本前缀
servers:
  - url: https://api.example.com/v1
  - url: https://api.example.com/v2
```

### 3. 描述和文档

```yaml
# ✅ 详细描述
paths:
  /users/{id}:
    get:
      summary: 获取单个用户
      description: |
        根据用户 ID 获取详细信息。
        
        ## 权限要求
        - 需要登录
        - 只能查看自己的信息（除非是管理员）
        
        ## 缓存
        - 响应缓存 5 分钟
      operationId: getUserById

# ✅ 提供示例
content:
  application/json:
    schema:
      $ref: '#/components/schemas/User'
    examples:
      regularUser:
        summary: 普通用户
        value:
          id: "123"
          email: "user@example.com"
          role: "user"
      adminUser:
        summary: 管理员
        value:
          id: "456"
          email: "admin@example.com"
          role: "admin"
```

### 4. 验证和测试

```javascript
// .spectral.yaml - API 规范检查规则
extends:
  - spectral:oas
  - spectral:recommended

rules:
  # 自定义规则
  info-matches-api-team:
    description: Info 必须包含 API 团队联系信息
    given: $.info.contact
    then:
      - field: name
        function: truthy
      - field: email
        function: truthy
    severity: error

  # 操作必须有 operationId
  operation-operationId:
    description: 所有操作必须有 operationId
    given: $.paths.*.*.operationId
    then:
      function: truthy
    severity: error

  # 响应必须包含示例
  response-example:
    description: 响应应该包含示例
    given: $.paths.*.*.responses.*.content.*.example
    then:
      function: truthy
    severity: warn
```

### 5. 契约测试

```typescript
// tests/contract/api.test.ts
import { pactum } from 'pactum';
import { like, eachLike } from 'pactum-match';

describe('API Contract Tests', () => {
  before(() => {
    pactum.request.setBaseUrl('http://localhost:3000/v1');
  });

  it('GET /users should return paginated list', async () => {
    await pactum
      .spec()
      .get('/users')
      .withQueryParams({ page: 1, limit: 20 })
      .expectStatus(200)
      .expectJsonMatch({
        data: eachLike({
          id: like('123e4567-e89b-12d3-a456-426614174000'),
          email: like('user@example.com'),
        }),
        pagination: {
          page: 1,
          limit: 20,
          total: like(100),
        },
      });
  });

  it('POST /users should create user', async () => {
    await pactum
      .spec()
      .post('/users')
      .withJson({
        email: 'newuser@example.com',
        password: 'SecurePass123',
      })
      .expectStatus(201)
      .expectJsonMatch({
        id: like('123e4567-e89b-12d3-a456-426614174000'),
        email: 'newuser@example.com',
      });
  });
});
```

## 常用命令

### 开发命令

```bash
# 安装工具
npm install -D @apidevtools/swagger-cli
npm install -D openapi-typescript
npm install -D @openapitools/openapi-generator-cli
npm install -D @stoplight/spectral-cli

# 验证 OpenAPI 规范
swagger-cli validate openapi/openapi.yaml

# 生成 TypeScript 类型
npx openapi-typescript openapi/openapi.yaml -o src/api/generated/schema.ts

# 生成 API 客户端
openapi-generator-cli generate \
  -i openapi/openapi.yaml \
  -g typescript-fetch \
  -o src/api/generated

# 运行 Spectral 检查
npx spectral lint openapi/openapi.yaml

# 合并多个文件
swagger-cli bundle openapi/openapi.yaml --outfile dist/openapi.yaml

# 启动 Swagger UI
npx swagger-ui-watcher openapi/openapi.yaml
```

### 代码生成命令

```bash
# 生成多种语言客户端
openapi-generator-cli generate -i openapi.yaml -g python -o ./client/python
openapi-generator-cli generate -i openapi.yaml -g java -o ./client/java
openapi-generator-cli generate -i openapi.yaml -g csharp -o ./client/csharp
openapi-generator-cli generate -i openapi.yaml -g go -o ./client/go

# 生成服务端存根
openapi-generator-cli generate -i openapi.yaml -g nodejs-express-server -o ./server

# 生成文档
openapi-generator-cli generate -i openapi.yaml -g html2 -o ./docs
```

### 测试命令

```bash
# 运行契约测试
npm run test:contract

# 使用 Dredd 进行 API 测试
dredd openapi/openapi.yaml http://localhost:3000

# 使用 Postman/Newman
newman run postman-collection.json -e environment.json

# 生成 Mock 服务器
prism mock openapi/openapi.yaml
```

## 部署配置

### 1. Swagger UI 部署

```yaml
# docker-compose.yml
version: '3.8'

services:
  swagger-ui:
    image: swaggerapi/swagger-ui:v5.9.0
    container_name: swagger-ui
    ports:
      - "8080:8080"
    environment:
      SWAGGER_JSON_URL: /api/openapi.yaml
      BASE_URL: /docs
    volumes:
      - ./openapi:/usr/share/nginx/html/api
    restart: unless-stopped

  swagger-editor:
    image: swaggerapi/swagger-editor
    container_name: swagger-editor
    ports:
      - "8081:8080"
    environment:
      URL: /api/openapi.yaml
    volumes:
      - ./openapi:/usr/share/nginx/html/api
    restart: unless-stopped
```

### 2. Redoc 部署

```yaml
# redocly.yaml
theme:
  openapi:
    htmlTemplate: ./docs/index.html
    theme:
      colors:
        primary:
          main: '#32329f'
      typography:
        fontSize: '15px'
        fontFamily: '"Roboto", sans-serif'
      sidebar:
        width: '260px'
    generateCodeSamples:
      languages:
        - lang: curl
        - lang: JavaScript
        - lang: Node.js
        - lang: Python

# 构建
npx @redocly/cli build-docs openapi/openapi.yaml -o docs/api.html
```

### 3. Nginx 配置

```nginx
# /etc/nginx/conf.d/api-docs.conf
server {
    listen 80;
    server_name docs.example.com;

    # Swagger UI
    location /swagger {
        alias /usr/share/nginx/html/swagger-ui;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Redoc
    location /redoc {
        alias /usr/share/nginx/html/redoc;
        index index.html;
    }

    # OpenAPI YAML
    location /openapi.yaml {
        alias /var/www/api/openapi.yaml;
        add_header Content-Type application/yaml;
    }

    # API Mock Server (Prism)
    location /mock/ {
        proxy_pass http://localhost:4010/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. CI/CD 集成

```yaml
# .github/workflows/api-docs.yml
name: API Documentation

on:
  push:
    paths:
      - 'openapi/**'
  pull_request:
    paths:
      - 'openapi/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Validate OpenAPI Spec
        run: |
          npm install -g @apidevtools/swagger-cli
          swagger-cli validate openapi/openapi.yaml

      - name: Lint with Spectral
        run: |
          npm install -g @stoplight/spectral-cli
          spectral lint openapi/openapi.yaml

  generate-types:
    runs-on: ubuntu-latest
    needs: validate
    steps:
      - uses: actions/checkout@v4

      - name: Generate TypeScript Types
        run: |
          npm install -D openapi-typescript
          npx openapi-typescript openapi/openapi.yaml -o src/types/api.ts

      - name: Commit Generated Types
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add src/types/api.ts
          git diff --quiet && git diff --staged --quiet || git commit -m "chore: update API types"

  deploy-docs:
    runs-on: ubuntu-latest
    needs: validate
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Build Redoc
        run: |
          npm install -g @redocly/cli
          redocly build-docs openapi/openapi.yaml -o docs/api.html

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
```

### 5. Mock 服务器

```bash
# 使用 Prism 启动 Mock 服务器
npm install -g @stoplight/prism-cli

# 启动 Mock 服务器
prism mock openapi/openapi.yaml

# 带动态响应
prism mock openapi/openapi.yaml --dynamic

# 指定端口
prism mock openapi/openapi.yaml --port 4010 --host 0.0.0.0
```

## 相关资源

- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
- [Swagger Documentation](https://swagger.io/docs/)
- [OpenAPI Generator](https://openapi-generator.tech/)
- [Spectral](https://stoplight.io/open-source/spectral)
- [Redoc](https://redocly.com/redoc)
- [Prism Mock Server](https://stoplight.io/open-source/prism)
