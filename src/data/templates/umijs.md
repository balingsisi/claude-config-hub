# UmiJS 企业级前端开发模板

## 技术栈

- **UmiJS 4**: 企业级前端框架
- **React 18**: 用户界面库
- **TypeScript**: 类型支持
- **Umi Max**: 增强功能集
- **Dva**: 状态管理
- **Umi Request**: 请求库
- **Ant Design**: UI 组件库

## 项目结构

```
umijs-project/
├── config/
│   ├── config.ts          # Umi 配置
│   ├── routes.ts          # 路由配置
│   ├── proxy.ts           # 代理配置
│   └── theme.ts           # 主题配置
├── src/
│   ├── pages/
│   │   ├── index/
│   │   │   ├── index.tsx
│   │   │   ├── index.less
│   │   │   └── components/
│   │   ├── users/
│   │   │   ├── index.tsx
│   │   │   └── $id.tsx
│   │   ├── 404.tsx
│   │   └── document.ejs
│   ├── models/
│   │   ├── global.ts
│   │   ├── user.ts
│   │   └── common.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── user.ts
│   │   └── typings.d.ts
│   ├── components/
│   │   ├── Header/
│   │   ├── Footer/
│   │   └── Layout/
│   ├── utils/
│   │   ├── request.ts
│   │   ├── format.ts
│   │   └── storage.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useRequest.ts
│   ├── assets/
│   │   └── images/
│   ├── locales/
│   │   ├── zh-CN/
│   │   └── en-US/
│   ├── access.ts          # 权限配置
│   ├── app.tsx            # 运行时配置
│   └── global.less        # 全局样式
├── mock/
│   ├── user.ts
│   └── api.ts
├── .env                   # 环境变量
├── .umirc.ts             # 简易配置
└── package.json
```

## 代码模式

### 配置文件

```ts
// config/config.ts
import { defineConfig } from '@umijs/max';
import routes from './routes';
import proxy from './proxy';
import theme from './theme';

export default defineConfig({
  // 路由配置
  routes,
  
  // 代理配置
  proxy,
  
  // 主题配置
  theme,
  
  // 插件配置
  plugins: [
    '@umijs/plugins/dist/model',
    '@umijs/plugins/dist/request',
    '@umijs/plugins/dist/access',
    '@umijs/plugins/dist/initial-state',
    '@umijs/plugins/dist/locale',
    '@umijs/plugins/dist/layout',
  ],
  
  // 模型配置
  model: {},
  
  // 请求配置
  request: {
    dataField: 'data',
  },
  
  // 国际化
  locale: {
    default: 'zh-CN',
    baseSeparator: '-',
    antd: true,
  },
  
  // 布局
  layout: {
    title: 'UmiJS 企业级应用',
    locale: true,
  },
  
  // Ant Design
  antd: {},
  
  // 权限
  access: {},
  
  // 初始状态
  initialState: {},
  
  // 构建配置
  hash: true,
  history: { type: 'hash' },
  base: '/',
  publicPath: '/',
  
  // 性能优化
  codeSplitting: {
    jsStrategy: 'granularChunks',
  },
  
  // 开发配置
  fastRefresh: true,
  mfsu: {},
  
  // CSS
  lessLoader: {
    modifyVars: theme,
  },
});
```

### 路由配置

```ts
// config/routes.ts
export default [
  {
    path: '/login',
    layout: false,
    component: '@/pages/login',
  },
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: '/home',
    name: '首页',
    icon: 'home',
    component: '@/pages/home',
  },
  {
    path: '/users',
    name: '用户管理',
    icon: 'user',
    access: 'canAdmin',
    routes: [
      {
        path: '/users/list',
        name: '用户列表',
        component: '@/pages/users/list',
      },
      {
        path: '/users/:id',
        name: '用户详情',
        component: '@/pages/users/detail',
        hideInMenu: true,
      },
    ],
  },
  {
    path: '/settings',
    name: '系统设置',
    icon: 'setting',
    access: 'canAdmin',
    component: '@/pages/settings',
  },
  {
    path: '*',
    layout: false,
    component: '@/pages/404',
  },
];
```

### 数据模型（Dva）

```ts
// src/models/user.ts
import type { Effect, Reducer } from 'umi';
import { queryCurrentUser, login, logout } from '@/services/user';

export interface UserModelState {
  currentUser?: API.CurrentUser;
  status?: 'ok' | 'error';
  type?: string;
}

export interface UserModelType {
  namespace: 'user';
  state: UserModelState;
  effects: {
    fetchCurrent: Effect;
    login: Effect;
    logout: Effect;
  };
  reducers: {
    saveCurrentUser: Reducer<UserModelState>;
    changeLoginStatus: Reducer<UserModelState>;
  };
}

const UserModel: UserModelType = {
  namespace: 'user',

  state: {
    currentUser: undefined,
    status: undefined,
    type: undefined,
  },

  effects: {
    *fetchCurrent(_, { call, put }) {
      const response = yield call(queryCurrentUser);
      yield put({
        type: 'saveCurrentUser',
        payload: response,
      });
    },

    *login({ payload }, { call, put }) {
      const response = yield call(login, payload);
      yield put({
        type: 'changeLoginStatus',
        payload: response,
      });
      
      if (response.status === 'ok') {
        const user = yield call(queryCurrentUser);
        yield put({
          type: 'saveCurrentUser',
          payload: user,
        });
      }
    },

    *logout(_, { call, put }) {
      yield call(logout);
      yield put({
        type: 'saveCurrentUser',
        payload: undefined,
      });
    },
  },

  reducers: {
    saveCurrentUser(state, { payload }) {
      return {
        ...state,
        currentUser: payload || {},
      };
    },

    changeLoginStatus(state, { payload }) {
      return {
        ...state,
        status: payload.status,
        type: payload.type,
      };
    },
  },
};

export default UserModel;
```

### 请求封装

```ts
// src/utils/request.ts
import { request as umiRequest, RequestConfig } from '@umijs/max';
import { message } from 'antd';
import { history } from '@umijs/max';

const codeMessage: Record<number, string> = {
  200: '服务器成功返回请求的数据。',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）。',
  204: '删除数据成功。',
  400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
  401: '用户没有权限（令牌、用户名、密码错误）。',
  403: '用户得到授权，但是访问是被禁止的。',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
  406: '请求的格式不可得。',
  410: '请求的资源被永久删除，且不会再得到的。',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '服务器发生错误，请检查服务器。',
  502: '网关错误。',
  503: '服务不可用，服务器暂时过载或维护。',
  504: '网关超时。',
};

// 响应拦截器
umiRequest.interceptors.response.use(
  (response: any) => {
    const { status } = response;
    
    if (status === 200) {
      return response.data;
    }
    
    const errorText = codeMessage[status] || response.statusText;
    message.error(errorText);
    
    if (status === 401) {
      history.push('/login');
    }
    
    return Promise.reject(new Error(errorText));
  },
  (error: any) => {
    const { response } = error;
    
    if (response && response.status) {
      const errorText = codeMessage[response.status] || response.statusText;
      message.error(errorText);
      
      if (response.status === 401) {
        history.push('/login');
      }
    }
    
    if (!response) {
      message.error('网络异常，请检查网络连接');
    }
    
    return Promise.reject(error);
  }
);

// 请求拦截器
umiRequest.interceptors.request.use(
  (url: string, options: any) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      return {
        url,
        options: {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
          },
        },
      };
    }
    
    return { url, options };
  }
);

// 导出请求方法
export const request = umiRequest;

export const get = <T>(url: string, params?: any, options?: RequestConfig) => {
  return request<T>(url, {
    method: 'GET',
    params,
    ...options,
  });
};

export const post = <T>(url: string, data?: any, options?: RequestConfig) => {
  return request<T>(url, {
    method: 'POST',
    data,
    ...options,
  });
};

export const put = <T>(url: string, data?: any, options?: RequestConfig) => {
  return request<T>(url, {
    method: 'PUT',
    data,
    ...options,
  });
};

export const del = <T>(url: string, options?: RequestConfig) => {
  return request<T>(url, {
    method: 'DELETE',
    ...options,
  });
};
```

### 服务层

```ts
// src/services/user.ts
import { request } from '@umijs/max';

// 登录
export async function login(body: API.LoginParams) {
  return request<API.LoginResult>('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
  });
}

// 退出登录
export async function logout() {
  return request<Record<string, any>>('/api/auth/logout', {
    method: 'POST',
  });
}

// 获取当前用户
export async function queryCurrentUser() {
  return request<API.CurrentUser>('/api/user/current', {
    method: 'GET',
  });
}

// 获取用户列表
export async function queryUsers(params: API.PageParams) {
  return request<API.UserList>('/api/users', {
    method: 'GET',
    params,
  });
}

// 获取用户详情
export async function queryUserDetail(id: string) {
  return request<API.User>(`/api/users/${id}`, {
    method: 'GET',
  });
}

// 创建用户
export async function createUser(data: API.CreateUserParams) {
  return request<API.User>('/api/users', {
    method: 'POST',
    data,
  });
}

// 更新用户
export async function updateUser(id: string, data: API.UpdateUserParams) {
  return request<API.User>(`/api/users/${id}`, {
    method: 'PUT',
    data,
  });
}

// 删除用户
export async function deleteUser(id: string) {
  return request(`/api/users/${id}`, {
    method: 'DELETE',
  });
}
```

### 权限配置

```ts
// src/access.ts
export default function access(initialState: { currentUser?: API.CurrentUser }) {
  const { currentUser } = initialState || {};
  
  return {
    canAdmin: currentUser && currentUser.access === 'admin',
    canUser: currentUser && currentUser.access,
    isLogin: !!currentUser,
  };
}
```

### 运行时配置

```ts
// src/app.tsx
import { history } from '@umijs/max';
import { message } from 'antd';
import type { RequestConfig } from '@umijs/max';
import { queryCurrentUser } from '@/services/user';
import defaultSettings from '../config/defaultSettings';

// 运行时布局配置
export const layout = () => {
  return {
    logo: 'https://img.alicdn.com/tfs/TB1YHEpwUT1gK0jSZFhXXaAtVXa-28-27.svg',
    menu: {
      locale: true,
    },
    logout: () => {
      localStorage.removeItem('token');
      history.push('/login');
    },
  };
};

// 初始状态
export async function getInitialState(): Promise<{
  currentUser?: API.CurrentUser;
  settings?: typeof defaultSettings;
}> {
  const token = localStorage.getItem('token');
  
  if (token) {
    try {
      const currentUser = await queryCurrentUser();
      return {
        currentUser,
        settings: defaultSettings,
      };
    } catch (error) {
      history.push('/login');
    }
  }
  
  return {
    settings: defaultSettings,
  };
}

// 请求配置
export const request: RequestConfig = {
  timeout: 10000,
  errorConfig: {
    // 错误抛出
    errorThrower: (res) => {
      const { success, data, errorCode, errorMessage } = res as any;
      if (!success) {
        const error: any = new Error(errorMessage);
        error.name = 'BizError';
        error.info = { errorCode, errorMessage, data };
        throw error;
      }
    },
    // 错误接收及处理
    errorHandler: (error: any, opts: any) => {
      if (opts?.skipErrorHandler) throw error;
      
      if (error.name === 'BizError') {
        const errorInfo = error.info;
        if (errorInfo) {
          const { errorMessage, errorCode } = errorInfo;
          message.error(errorMessage);
        }
      } else if (error.response) {
        message.error(`响应状态码: ${error.response.status}`);
      } else if (error.request) {
        message.error('没有收到响应');
      } else {
        message.error('请求发送失败');
      }
    },
  },
  // 请求拦截器
  requestInterceptors: [
    (config: any) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
  ],
  // 响应拦截器
  responseInterceptors: [
    (response: any) => {
      const { data } = response as unknown as any;
      return data;
    },
  ],
};
```

### 页面示例

```tsx
// src/pages/users/list/index.tsx
import { PageContainer } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { Button, Space, Popconfirm, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { history, useAccess } from '@umijs/max';
import { queryUsers, deleteUser } from '@/services/user';
import { useRequest } from '@umijs/max';

const UserList: React.FC = () => {
  const access = useAccess();
  const actionRef = useRef<any>();

  const columns: ProColumns<API.User>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      hideInSearch: true,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      copyable: true,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      copyable: true,
    },
    {
      title: '角色',
      dataIndex: 'role',
      valueEnum: {
        admin: { text: '管理员', status: 'Success' },
        user: { text: '普通用户', status: 'Default' },
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueEnum: {
        active: { text: '启用', status: 'Success' },
        inactive: { text: '禁用', status: 'Default' },
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      hideInSearch: true,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 180,
      render: (_, record) => (
        <Space>
          <a onClick={() => history.push(`/users/${record.id}`)}>详情</a>
          {access.canAdmin && (
            <>
              <a onClick={() => history.push(`/users/${record.id}/edit`)}>编辑</a>
              <Popconfirm
                title="确定删除此用户吗？"
                onConfirm={() => handleDelete(record.id)}
              >
                <a style={{ color: 'red' }}>删除</a>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch (error) {
      message.error('删除失败');
    }
  };

  return (
    <PageContainer>
      <ProTable<API.User>
        columns={columns}
        actionRef={actionRef}
        request={async (params) => {
          const { current, pageSize, ...rest } = params;
          const response = await queryUsers({
            page: current,
            pageSize,
            ...rest,
          });
          
          return {
            data: response.data,
            total: response.total,
            success: true,
          };
        }}
        rowKey="id"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
        }}
        search={{
          labelWidth: 'auto',
        }}
        dateFormatter="string"
        headerTitle="用户列表"
        toolBarRender={() => [
          access.canAdmin && (
            <Button
              key="create"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => history.push('/users/create')}
            >
              新建用户
            </Button>
          ),
        ]}
      />
    </PageContainer>
  );
};

export default UserList;
```

## 最佳实践

### 1. 按需加载

```ts
// config/config.ts
export default {
  dynamicImport: {},
  // 或指定预加载
  dynamicImport: {
    loading: '@/components/Loading',
  },
};
```

### 2. 权限控制

```tsx
import { Access, useAccess } from '@umijs/max';

const Page: React.FC = () => {
  const access = useAccess();
  
  return (
    <div>
      <Access accessible={access.canAdmin}>
        <Button>仅管理员可见</Button>
      </Access>
      
      <Access
        accessible={access.isLogin}
        fallback={<div>请先登录</div>}
      >
        <UserContent />
      </Access>
    </div>
  );
};
```

### 3. 国际化

```tsx
// 使用
import { FormattedMessage, useIntl, setLocale } from '@umijs/max';

const Component: React.FC = () => {
  const intl = useIntl();
  
  return (
    <div>
      <FormattedMessage id="welcome" />
      {intl.formatMessage({ id: 'hello' })}
      <button onClick={() => setLocale('en-US', false)}>
        切换英文
      </button>
    </div>
  );
};

// 定义
// locales/zh-CN.ts
export default {
  welcome: '欢迎',
  hello: '你好 {name}',
};
```

### 4. 环境变量

```ts
// .env
UMI_ENV=prod
API_URL=https://api.example.com

// 使用
const apiUrl = process.env.API_URL;
```

## 常用命令

### 开发

```bash
# 创建项目
npx create-umi myapp

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 预览
npm run preview

# 代码检查
npm run lint

# 测试
npm run test
```

### 调试

```bash
# 开启调试
umi dev

# 分析构建
ANALYZE=1 umi build

# 查看 webpack 配置
umi webpack
```

## 部署配置

### package.json

```json
{
  "name": "umijs-project",
  "version": "1.0.0",
  "scripts": {
    "dev": "umi dev",
    "build": "umi build",
    "preview": "umi preview",
    "postinstall": "umi setup",
    "lint": "eslint src --ext .ts,.tsx",
    "test": "umi test"
  },
  "dependencies": {
    "@ant-design/pro-components": "^2.0.0",
    "@umijs/max": "^4.0.0",
    "antd": "^5.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@umijs/lint": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Dockerfile

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

```nginx
server {
  listen 80;
  server_name localhost;
  
  root /usr/share/nginx/html;
  index index.html;
  
  location / {
    try_files $uri $uri/ /index.html;
  }
  
  location /api {
    proxy_pass http://backend:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

### 环境配置

```env
# .env
NODE_ENV=production
UMI_ENV=prod
API_URL=https://api.example.com
APP_TITLE=企业级应用
```
