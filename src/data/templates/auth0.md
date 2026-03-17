# Auth0 身份认证集成模板

## 技术栈

- **Auth0**: 企业级身份认证服务
- **Express**: Node.js Web 框架
- **TypeScript**: 类型支持
- **express-jwt**: JWT 验证
- **jwks-rsa**: RSA 公钥获取
- **dotenv**: 环境变量管理

## 项目结构

```
auth0-integration/
├── src/
│   ├── config/
│   │   ├── auth0.ts          # Auth0 配置
│   │   └── index.ts          # 配置聚合
│   ├── middleware/
│   │   ├── auth.ts           # 认证中间件
│   │   ├── rbac.ts           # 角色权限控制
│   │   └── error.ts          # 错误处理
│   ├── routes/
│   │   ├── index.ts
│   │   ├── auth.routes.ts    # 认证路由
│   │   ├── api.routes.ts     # API 路由
│   │   └── public.routes.ts  # 公开路由
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   └── user.controller.ts
│   ├── services/
│   │   ├── auth0.service.ts  # Auth0 API 调用
│   │   └── user.service.ts
│   ├── types/
│   │   └── index.d.ts
│   └── app.ts
├── public/
│   └── index.html
├── .env.example
├── package.json
└── tsconfig.json
```

## 代码模式

### 应用入口

```ts
// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFound } from './middleware/error';
import routes from './routes';
import logger from './utils/logger';

const app = express();

// 安全中间件
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 限流
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api', limiter);

// 静态文件
app.use(express.static('public'));

// 路由
app.use('/api', routes);

// 错误处理
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`🚀 服务器运行在 http://localhost:${PORT}`);
});

export default app;
```

### Auth0 配置

```ts
// src/config/auth0.ts
export const auth0Config = {
  domain: process.env.AUTH0_DOMAIN!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  audience: process.env.AUTH0_AUDIENCE!,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256']
};

// Auth0 Management API 配置
export const managementConfig = {
  domain: process.env.AUTH0_DOMAIN!,
  clientId: process.env.AUTH0_MANAGEMENT_CLIENT_ID!,
  clientSecret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET!
};
```

### 认证中间件

```ts
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { expressjwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import { auth0Config } from '../config/auth0';
import { ApiError } from '../utils/apiError';

// JWT 验证中间件
export const checkJwt = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${auth0Config.domain}/.well-known/jwks.json`
  }),
  audience: auth0Config.audience,
  issuer: auth0Config.issuer,
  algorithms: auth0Config.algorithms
});

// 扩展 Request 类型
export interface AuthRequest extends Request {
  auth?: {
    sub: string;
    [key: string]: any;
  };
}

// 获取用户信息
export const getUserInfo = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.auth) {
      throw new ApiError(401, '未认证');
    }

    // 从 Auth0 获取用户详细信息
    const response = await fetch(`https://${auth0Config.domain}/userinfo`, {
      headers: {
        Authorization: `Bearer ${req.headers.authorization?.split(' ')[1]}`
      }
    });

    if (!response.ok) {
      throw new ApiError(401, '获取用户信息失败');
    }

    const userInfo = await response.json();
    req.user = userInfo;
    next();
  } catch (error) {
    next(error);
  }
};
```

### 角色权限控制

```ts
// src/middleware/rbac.ts
import { AuthRequest, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';

// 检查用户角色
export const checkRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userRoles = req.auth?.['https://myapp.com/roles'] || [];
      
      const hasRole = allowedRoles.some(role => userRoles.includes(role));
      
      if (!hasRole) {
        throw new ApiError(403, '没有权限执行此操作');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// 检查权限
export const checkPermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userPermissions = req.auth?.['https://myapp.com/permissions'] || [];
      
      if (!userPermissions.includes(permission)) {
        throw new ApiError(403, '没有所需权限');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};
```

### Auth0 服务

```ts
// src/services/auth0.service.ts
import axios from 'axios';
import { managementConfig } from '../config/auth0';

export class Auth0Service {
  private managementApi = `https://${managementConfig.domain}/api/v2`;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  // 获取 Management API Token
  private async getManagementToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const response = await axios.post(
      `https://${managementConfig.domain}/oauth/token`,
      {
        client_id: managementConfig.clientId,
        client_secret: managementConfig.clientSecret,
        audience: `${this.managementApi}/`,
        grant_type: 'client_credentials'
      }
    );

    this.accessToken = response.data.access_token;
    this.tokenExpiresAt = Date.now() + (response.data.expires_in * 1000) - 60000;
    
    return this.accessToken!;
  }

  // 获取用户列表
  async getUsers(page = 0, perPage = 50) {
    const token = await this.getManagementToken();
    const response = await axios.get(
      `${this.managementApi}/users`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, per_page: perPage }
      }
    );
    return response.data;
  }

  // 获取单个用户
  async getUser(userId: string) {
    const token = await this.getManagementToken();
    const response = await axios.get(
      `${this.managementApi}/users/${userId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  }

  // 创建用户
  async createUser(userData: {
    email: string;
    password: string;
    connection: string;
    email_verified?: boolean;
  }) {
    const token = await this.getManagementToken();
    const response = await axios.post(
      `${this.managementApi}/users`,
      userData,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  }

  // 更新用户
  async updateUser(userId: string, userData: any) {
    const token = await this.getManagementToken();
    const response = await axios.patch(
      `${this.managementApi}/users/${userId}`,
      userData,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  }

  // 删除用户
  async deleteUser(userId: string) {
    const token = await this.getManagementToken();
    await axios.delete(
      `${this.managementApi}/users/${userId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
  }

  // 分配角色
  async assignRoles(userId: string, roleIds: string[]) {
    const token = await this.getManagementToken();
    await axios.post(
      `${this.managementApi}/users/${userId}/roles`,
      { roles: roleIds },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
  }

  // 移除角色
  async removeRoles(userId: string, roleIds: string[]) {
    const token = await this.getManagementToken();
    await axios.delete(
      `${this.managementApi}/users/${userId}/roles`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: { roles: roleIds }
      }
    );
  }

  // 获取用户角色
  async getUserRoles(userId: string) {
    const token = await this.getManagementToken();
    const response = await axios.get(
      `${this.managementApi}/users/${userId}/roles`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  }
}
```

### 控制器

```ts
// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { Auth0Service } from '../services/auth0.service';
import { ApiResponse } from '../utils/response';

export class AuthController {
  private auth0Service: Auth0Service;

  constructor() {
    this.auth0Service = new Auth0Service();
  }

  // 获取用户信息
  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(ApiResponse.success(req.user));
    } catch (error) {
      next(error);
    }
  };

  // 获取所有用户（管理员）
  getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 0, perPage = 50 } = req.query;
      const users = await this.auth0Service.getUsers(Number(page), Number(perPage));
      res.json(ApiResponse.success(users));
    } catch (error) {
      next(error);
    }
  };

  // 创建用户（管理员）
  createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.auth0Service.createUser({
        email: req.body.email,
        password: req.body.password,
        connection: 'Username-Password-Authentication',
        email_verified: false
      });
      res.status(201).json(ApiResponse.success(user, '用户创建成功'));
    } catch (error) {
      next(error);
    }
  };

  // 更新用户
  updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.id;
      const user = await this.auth0Service.updateUser(userId, req.body);
      res.json(ApiResponse.success(user, '用户更新成功'));
    } catch (error) {
      next(error);
    }
  };

  // 删除用户
  deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.id;
      await this.auth0Service.deleteUser(userId);
      res.json(ApiResponse.success(null, '用户删除成功'));
    } catch (error) {
      next(error);
    }
  };
}
```

### 路由

```ts
// src/routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { checkJwt, getUserInfo } from '../middleware/auth';
import { checkRole } from '../middleware/rbac';

const router = Router();
const authController = new AuthController();

// 公开路由
router.get('/login', (req, res) => {
  res.redirect(`https://${process.env.AUTH0_DOMAIN}/authorize?` +
    `response_type=code&` +
    `client_id=${process.env.AUTH0_CLIENT_ID}&` +
    `redirect_uri=${process.env.CALLBACK_URL}&` +
    `scope=openid profile email`);
});

router.get('/callback', (req, res) => {
  // 处理 Auth0 回调
  res.redirect('/');
});

router.post('/logout', (req, res) => {
  res.redirect(`https://${process.env.AUTH0_DOMAIN}/v2/logout?` +
    `client_id=${process.env.AUTH0_CLIENT_ID}&` +
    `returnTo=${process.env.LOGOUT_URL}`);
});

// 需要认证的路由
router.get('/profile', checkJwt, getUserInfo, authController.getProfile);

// 管理员路由
router.get('/users', 
  checkJwt, 
  checkRole('admin'), 
  authController.getUsers
);

router.post('/users', 
  checkJwt, 
  checkRole('admin'), 
  authController.createUser
);

router.patch('/users/:id', 
  checkJwt, 
  checkRole('admin'), 
  authController.updateUser
);

router.delete('/users/:id', 
  checkJwt, 
  checkRole('admin'), 
  authController.deleteUser
);

export default router;
```

### 前端登录页面

```html
<!-- public/index.html -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Auth0 登录</title>
  <script src="https://cdn.auth0.com/js/auth0-spa-js/2.0/auth0-spa-js.js"></script>
</head>
<body>
  <div id="app">
    <h1>Auth0 身份认证</h1>
    <button id="login" onclick="login()">登录</button>
    <button id="logout" onclick="logout()" style="display:none">登出</button>
    <div id="user-info" style="display:none">
      <h2>用户信息</h2>
      <pre id="profile"></pre>
    </div>
  </div>

  <script>
    let auth0 = null;

    // 初始化 Auth0
    async function initAuth0() {
      auth0 = await auth0.createAuth0Client({
        domain: 'YOUR_AUTH0_DOMAIN',
        clientId: 'YOUR_CLIENT_ID',
        authorizationParams: {
          redirect_uri: window.location.origin
        }
      });

      // 处理回调
      if (window.location.search.includes('code=') && 
          window.location.search.includes('state=')) {
        await auth0.handleRedirectCallback();
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      await updateUI();
    }

    // 登录
    async function login() {
      await auth0.loginWithRedirect();
    }

    // 登出
    async function logout() {
      await auth0.logout({
        logoutParams: {
          returnTo: window.location.origin
        }
      });
    }

    // 更新 UI
    async function updateUI() {
      const isAuthenticated = await auth0.isAuthenticated();
      
      document.getElementById('login').style.display = 
        isAuthenticated ? 'none' : 'block';
      document.getElementById('logout').style.display = 
        isAuthenticated ? 'block' : 'none';
      document.getElementById('user-info').style.display = 
        isAuthenticated ? 'block' : 'none';

      if (isAuthenticated) {
        const user = await auth0.getUser();
        document.getElementById('profile').textContent = 
          JSON.stringify(user, null, 2);
      }
    }

    // 页面加载时初始化
    window.addEventListener('load', initAuth0);
  </script>
</body>
</html>
```

## 最佳实践

### 1. 自定义 Claims

```ts
// Auth0 Rules / Actions 中添加自定义 claims
function (user, context, callback) {
  const namespace = 'https://myapp.com/';
  
  // 添加角色
  context.idToken[namespace + 'roles'] = user.roles || [];
  
  // 添加权限
  context.idToken[namespace + 'permissions'] = user.permissions || [];
  
  // 添加组织 ID
  context.idToken[namespace + 'org_id'] = user.org_id;
  
  callback(null, user, context);
}
```

### 2. 组织支持

```ts
// 登录时指定组织
await auth0.loginWithRedirect({
  authorizationParams: {
    organization: 'org_123'
  }
});

// 后端验证组织
export const checkOrganization = (orgId: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userOrgId = req.auth?.['https://myapp.com/org_id'];
    
    if (userOrgId !== orgId) {
      return next(new ApiError(403, '无权访问此组织'));
    }
    
    next();
  };
};
```

### 3. MFA 强制执行

```ts
// Auth0 Action: 强制 MFA
exports.onExecutePostLogin = async (event) => {
  if (event.user.email.endsWith('@company.com')) {
    return {
      command: {
        type: 'multifactor',
        options: {
          provider: 'any',
          audience: [],
          rememberBrowser: false
        }
      }
    };
  }
};
```

### 4. 刷新 Token

```ts
// 前端自动刷新
async function getAccessToken() {
  try {
    const token = await auth0.getTokenSilently();
    return token;
  } catch (error) {
    if (error.error === 'login_required') {
      await login();
    }
    throw error;
  }
}

// 后端验证
import { expressjwt } from 'express-jwt';

export const refreshToken = async (req: Request, res: Response) => {
  const { refresh_token } = req.body;
  
  const response = await axios.post(
    `https://${auth0Config.domain}/oauth/token`,
    {
      grant_type: 'refresh_token',
      client_id: auth0Config.clientId,
      client_secret: auth0Config.clientSecret,
      refresh_token
    }
  );
  
  res.json(response.data);
};
```

### 5. Hook 用户创建

```ts
// Auth0 Action: 用户创建后触发
exports.onExecutePostUserRegistration = async (event) => {
  // 同步到数据库
  await fetch('https://api.myapp.com/users/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth0_id: event.user.user_id,
      email: event.user.email,
      name: event.user.name
    })
  });
};
```

## 常用命令

### 开发

```bash
# 安装依赖
npm install express express-jwt jwks-rsa axios dotenv
npm install -D @types/express @types/node ts-node nodemon

# 开发模式
npm run dev

# 构建
npm run build
```

### Auth0 CLI

```bash
# 安装 Auth0 CLI
brew install auth0/auth0/auth0

# 登录
auth0 login

# 创建应用
auth0 apps create

# 创建 API
auth0 apis create

# 创建用户
auth0 users create

# 查看用户
auth0 users list
```

## 部署配置

### 环境变量

```env
# .env.example
PORT=3000
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_AUDIENCE=https://api.myapp.com
AUTH0_MANAGEMENT_CLIENT_ID=management-client-id
AUTH0_MANAGEMENT_CLIENT_SECRET=management-client-secret
CORS_ORIGIN=http://localhost:3000
CALLBACK_URL=http://localhost:3000/callback
LOGOUT_URL=http://localhost:3000
```

### Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist
COPY public ./public

EXPOSE 3000

CMD ["node", "dist/app.js"]
```

## 安全建议

1. **永远不要在前端暴露 Client Secret**
2. **使用 RS256 算法签名 JWT**
3. **设置适当的 Token 过期时间**
4. **实施 Rate Limiting**
5. **使用 HTTPS**
6. **验证 Token 的 Audience 和 Issuer**
7. **定期轮换 Client Secret**
8. **启用 MFA for 敏感操作**
9. **记录和监控认证事件**
10. **使用 Auth0 Logs 检测异常行为**
