# React Admin 管理后台模板

## 技术栈

- **React 18**: 用户界面库
- **React Admin**: 管理后台框架
- **Material UI**: UI 组件库
- **TypeScript**: 类型支持
- **React Router**: 路由管理
- **React Query**: 数据获取和缓存
- **Simple REST**: 数据提供者

## 项目结构

```
react-admin-app/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Dashboard/
│   │   │   └── index.tsx
│   │   ├── Layout/
│   │   │   ├── AppBar.tsx
│   │   │   ├── Menu.tsx
│   │   │   └── Layout.tsx
│   │   └── CustomFields/
│   │       ├── DateField.tsx
│   │       └── StatusField.tsx
│   ├── resources/
│   │   ├── users/
│   │   │   ├── UserList.tsx
│   │   │   ├── UserEdit.tsx
│   │   │   ├── UserCreate.tsx
│   │   │   ├── UserShow.tsx
│   │   │   └── index.tsx
│   │   ├── posts/
│   │   │   ├── PostList.tsx
│   │   │   ├── PostEdit.tsx
│   │   │   ├── PostCreate.tsx
│   │   │   └── index.tsx
│   │   └── comments/
│   │       └── CommentList.tsx
│   ├── providers/
│   │   ├── dataProvider.ts
│   │   ├── authProvider.ts
│   │   └── i18nProvider.ts
│   ├── hooks/
│   │   ├── useCustom.ts
│   │   └── useAuthProvider.ts
│   ├── utils/
│   │   ├── format.ts
│   │   └── validation.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── index.tsx
│   └── theme.ts
├── .env
├── package.json
└── tsconfig.json
```

## 代码模式

### 应用入口

```tsx
// src/App.tsx
import { Admin } from 'react-admin';
import jsonServerProvider from 'ra-data-json-server';
import { Resource } from 'react-admin';
import polyglotI18nProvider from 'ra-i18n-polyglot';

import { Layout } from './components/Layout/Layout';
import { Dashboard } from './components/Dashboard';
import { authProvider } from './providers/authProvider';
import { dataProvider } from './providers/dataProvider';
import { theme } from './theme';

// 资源
import { UserList, UserEdit, UserCreate, UserShow } from './resources/users';
import { PostList, PostEdit, PostCreate } from './resources/posts';
import { CommentList } from './resources/comments';

// 国际化
import englishMessages from 'ra-language-english';
import chineseMessages from 'ra-language-chinese';

const i18nProvider = polyglotI18nProvider(
  (locale) => {
    if (locale === 'zh') return chineseMessages;
    return englishMessages;
  },
  'en',
  [
    { locale: 'en', name: 'English' },
    { locale: 'zh', name: '中文' },
  ]
);

const App = () => (
  <Admin
    title="My Admin"
    dataProvider={dataProvider}
    authProvider={authProvider}
    i18nProvider={i18nProvider}
    layout={Layout}
    dashboard={Dashboard}
    theme={theme}
    requireAuth
  >
    <Resource
      name="users"
      list={UserList}
      edit={UserEdit}
      create={UserCreate}
      show={UserShow}
      recordRepresentation={(record) => `${record.name} (${record.email})`}
    />
    <Resource
      name="posts"
      list={PostList}
      edit={PostEdit}
      create={PostCreate}
    />
    <Resource
      name="comments"
      list={CommentList}
    />
  </Admin>
);

export default App;
```

### 数据提供者

```tsx
// src/providers/dataProvider.ts
import { DataProvider, fetchUtils } from 'react-admin';
import { stringify } from 'query-string';

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const httpClient = (url: string, options: any = {}) => {
  if (!options.headers) {
    options.headers = new Headers({ Accept: 'application/json' });
  }
  
  const token = localStorage.getItem('token');
  if (token) {
    options.headers.set('Authorization', `Bearer ${token}`);
  }
  
  return fetchUtils.fetchJson(url, options);
};

export const dataProvider: DataProvider = {
  // 获取列表
  getList: async (resource, params) => {
    const { page, perPage } = params.pagination || { page: 1, perPage: 10 };
    const { field, order } = params.sort || { field: 'id', order: 'ASC' };
    
    const query = {
      sort: JSON.stringify([field, order]),
      range: JSON.stringify([(page - 1) * perPage, page * perPage - 1]),
      filter: JSON.stringify(params.filter),
    };
    
    const url = `${apiUrl}/${resource}?${stringify(query)}`;
    
    const { json, headers } = await httpClient(url);
    
    return {
      data: json,
      total: parseInt(headers.get('content-range')?.split('/')?.pop() || '0', 10),
    };
  },

  // 获取单条
  getOne: async (resource, params) => {
    const url = `${apiUrl}/${resource}/${params.id}`;
    const { json } = await httpClient(url);
    
    return { data: json };
  },

  // 获取多条
  getMany: async (resource, params) => {
    const query = {
      filter: JSON.stringify({ id: params.ids }),
    };
    
    const url = `${apiUrl}/${resource}?${stringify(query)}`;
    const { json } = await httpClient(url);
    
    return { data: json };
  },

  // 获取关联
  getManyReference: async (resource, params) => {
    const { page, perPage } = params.pagination || { page: 1, perPage: 10 };
    const { field, order } = params.sort || { field: 'id', order: 'ASC' };
    
    const query = {
      sort: JSON.stringify([field, order]),
      range: JSON.stringify([(page - 1) * perPage, page * perPage - 1]),
      filter: JSON.stringify({
        ...params.filter,
        [params.target]: params.id,
      }),
    };
    
    const url = `${apiUrl}/${resource}?${stringify(query)}`;
    
    const { json, headers } = await httpClient(url);
    
    return {
      data: json,
      total: parseInt(headers.get('content-range')?.split('/')?.pop() || '0', 10),
    };
  },

  // 创建
  create: async (resource, params) => {
    const url = `${apiUrl}/${resource}`;
    const { json } = await httpClient(url, {
      method: 'POST',
      body: JSON.stringify(params.data),
    });
    
    return { data: json };
  },

  // 更新
  update: async (resource, params) => {
    const url = `${apiUrl}/${resource}/${params.id}`;
    const { json } = await httpClient(url, {
      method: 'PUT',
      body: JSON.stringify(params.data),
    });
    
    return { data: json };
  },

  // 更新多条
  updateMany: async (resource, params) => {
    const responses = await Promise.all(
      params.ids.map((id) =>
        httpClient(`${apiUrl}/${resource}/${id}`, {
          method: 'PUT',
          body: JSON.stringify(params.data),
        })
      )
    );
    
    return { data: responses.map(({ json }) => json.id) };
  },

  // 删除
  delete: async (resource, params) => {
    const url = `${apiUrl}/${resource}/${params.id}`;
    const { json } = await httpClient(url, {
      method: 'DELETE',
    });
    
    return { data: json };
  },

  // 删除多条
  deleteMany: async (resource, params) => {
    const responses = await Promise.all(
      params.ids.map((id) =>
        httpClient(`${apiUrl}/${resource}/${id}`, {
          method: 'DELETE',
        })
      )
    );
    
    return { data: responses.map(({ json }) => json.id) };
  },
};
```

### 认证提供者

```tsx
// src/providers/authProvider.ts
import { AuthProvider } from 'react-admin';

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export const authProvider: AuthProvider = {
  // 登录
  login: async ({ username, password }) => {
    const request = new Request(`${apiUrl}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: username, password }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    });
    
    const response = await fetch(request);
    
    if (response.status < 200 || response.status >= 300) {
      throw new Error(response.statusText);
    }
    
    const { token, user } = await response.json();
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('permissions', user.role);
    
    return Promise.resolve();
  },

  // 检查错误
  checkError: ({ status }) => {
    if (status === 401 || status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('permissions');
      return Promise.reject();
    }
    return Promise.resolve();
  },

  // 检查认证
  checkAuth: () => {
    return localStorage.getItem('token')
      ? Promise.resolve()
      : Promise.reject();
  },

  // 登出
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
    return Promise.resolve();
  },

  // 获取身份
  getIdentity: () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return Promise.resolve({
        id: user.id,
        fullName: user.name,
        avatar: user.avatar,
      });
    } catch (error) {
      return Promise.reject(error);
    }
  },

  // 获取权限
  getPermissions: () => {
    const role = localStorage.getItem('permissions');
    return role ? Promise.resolve(role) : Promise.reject();
  },
};
```

### 用户资源

```tsx
// src/resources/users/UserList.tsx
import {
  List,
  Datagrid,
  TextField,
  EmailField,
  DateField,
  BooleanField,
  ReferenceField,
  EditButton,
  DeleteButton,
  ShowButton,
  FilterList,
  FilterListItem,
  SearchInput,
  SelectInput,
  useListContext,
} from 'react-admin';
import { Card, CardContent, Box, Chip } from '@mui/material';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import PeopleIcon from '@mui/icons-material/People';

// 筛选器
const UserFilter = [
  <SearchInput source="q" alwaysOn />,
  <SelectInput
    source="role"
    choices={[
      { id: 'admin', name: 'Admin' },
      { id: 'user', name: 'User' },
      { id: 'editor', name: 'Editor' },
    ]}
  />,
  <SelectInput
    source="status"
    choices={[
      { id: 'active', name: 'Active' },
      { id: 'inactive', name: 'Inactive' },
    ]}
  />,
];

// 侧边栏筛选
const UserFilterSidebar = () => (
  <Box sx={{ minWidth: 200 }}>
    <List>
      <FilterList label="角色" icon={<PeopleIcon />}>
        <FilterListItem
          label="管理员"
          value={{ role: 'admin' }}
        />
        <FilterListItem
          label="用户"
          value={{ role: 'user' }}
        />
        <FilterListItem
          label="编辑"
          value={{ role: 'editor' }}
        />
      </FilterList>
      
      <FilterList label="状态" icon={<AccessibilityNewIcon />}>
        <FilterListItem
          label="激活"
          value={{ status: 'active' }}
        />
        <FilterListItem
          label="未激活"
          value={{ status: 'inactive' }}
        />
      </FilterList>
    </List>
  </Box>
);

export const UserList = () => (
  <List
    filters={UserFilter}
    aside={<UserFilterSidebar />}
    sort={{ field: 'createdAt', order: 'DESC' }}
  >
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="name" />
      <EmailField source="email" />
      <TextField source="role" />
      <BooleanField source="status" label="Active" />
      <DateField source="createdAt" showTime />
      <EditButton />
      <ShowButton />
      <DeleteButton />
    </Datagrid>
  </List>
);
```

```tsx
// src/resources/users/UserEdit.tsx
import {
  Edit,
  SimpleForm,
  TextInput,
  SelectInput,
  BooleanInput,
  DateInput,
  ReferenceInput,
  AutocompleteInput,
  useRecordContext,
} from 'react-admin';
import { Grid, Typography } from '@mui/material';

const UserTitle = () => {
  const record = useRecordContext();
  return <span>User: {record ? `"${record.name}"` : ''}</span>;
};

export const UserEdit = () => (
  <Edit title={<UserTitle />}>
    <SimpleForm>
      <Typography variant="h6" gutterBottom>
        基本信息
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextInput source="name" fullWidth required />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextInput source="email" fullWidth required type="email" />
        </Grid>
      </Grid>
      
      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        角色和权限
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <SelectInput
            source="role"
            fullWidth
            choices={[
              { id: 'admin', name: 'Admin' },
              { id: 'user', name: 'User' },
              { id: 'editor', name: 'Editor' },
            ]}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <BooleanInput source="status" label="Active" />
        </Grid>
      </Grid>
      
      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        其他信息
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextInput source="phone" fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <DateInput source="birthday" fullWidth />
        </Grid>
      </Grid>
      
      <TextInput source="address" fullWidth multiline rows={3} />
    </SimpleForm>
  </Edit>
);
```

```tsx
// src/resources/users/UserCreate.tsx
import {
  Create,
  SimpleForm,
  TextInput,
  SelectInput,
  BooleanInput,
  useNotify,
  useRedirect,
} from 'react-admin';
import { Grid } from '@mui/material';

export const UserCreate = () => {
  const notify = useNotify();
  const redirect = useRedirect();

  const onSuccess = (data: any) => {
    notify('User created successfully');
    redirect('list', 'users');
  };

  return (
    <Create mutationOptions={{ onSuccess }}>
      <SimpleForm>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextInput source="name" fullWidth required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextInput source="email" fullWidth required type="email" />
          </Grid>
        </Grid>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextInput source="password" fullWidth required type="password" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <SelectInput
              source="role"
              fullWidth
              defaultValue="user"
              choices={[
                { id: 'admin', name: 'Admin' },
                { id: 'user', name: 'User' },
                { id: 'editor', name: 'Editor' },
              ]}
            />
          </Grid>
        </Grid>
        
        <BooleanInput source="status" defaultValue={true} label="Active" />
      </SimpleForm>
    </Create>
  );
};
```

```tsx
// src/resources/users/UserShow.tsx
import {
  Show,
  SimpleShowLayout,
  TextField,
  EmailField,
  DateField,
  BooleanField,
  ReferenceManyField,
  Datagrid,
  Pagination,
  useRecordContext,
} from 'react-admin';
import { Card, CardContent, Typography, Grid, Box, Chip } from '@mui/material';

const UserTitle = () => {
  const record = useRecordContext();
  return <span>User: {record ? `"${record.name}"` : ''}</span>;
};

export const UserShow = () => (
  <Show title={<UserTitle />}>
    <SimpleShowLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          用户详情
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              ID
            </Typography>
            <TextField source="id" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              姓名
            </Typography>
            <TextField source="name" />
          </Grid>
        </Grid>
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              邮箱
            </Typography>
            <EmailField source="email" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              角色
            </Typography>
            <Chip
              label={<TextField source="role" />}
              size="small"
              color="primary"
            />
          </Grid>
        </Grid>
      </Box>
      
      <Typography variant="h6" gutterBottom>
        用户的文章
      </Typography>
      
      <ReferenceManyField
        reference="posts"
        target="userId"
        pagination={<Pagination />}
      >
        <Datagrid>
          <TextField source="id" />
          <TextField source="title" />
          <DateField source="createdAt" />
        </Datagrid>
      </ReferenceManyField>
    </SimpleShowLayout>
  </Show>
);
```

### 自定义仪表板

```tsx
// src/components/Dashboard/index.tsx
import {
  List,
  Datagrid,
  TextField,
  DateField,
  useGetList,
  useGetMany,
} from 'react-admin';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  LinearProgress,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import ArticleIcon from '@mui/icons-material/Article';
import CommentIcon from '@mui/icons-material/Comment';

// 统计卡片
const StatCard = ({ title, value, icon, color }: any) => (
  <Card>
    <CardContent>
      <Grid container spacing={2} alignItems="center">
        <Grid item>
          <Box
            sx={{
              backgroundColor: `${color}.light`,
              borderRadius: '50%',
              p: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {icon}
          </Box>
        </Grid>
        <Grid item>
          <Typography color="textSecondary" variant="body2">
            {title}
          </Typography>
          <Typography variant="h4">{value}</Typography>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

export const Dashboard = () => {
  const { data: users, isLoading: usersLoading } = useGetList('users', {
    pagination: { page: 1, perPage: 1 },
  });
  
  const { data: posts, isLoading: postsLoading } = useGetList('posts', {
    pagination: { page: 1, perPage: 1 },
  });
  
  const { data: comments, isLoading: commentsLoading } = useGetList('comments', {
    pagination: { page: 1, perPage: 1 },
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        仪表板
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="用户总数"
            value={users?.total || 0}
            icon={<PeopleIcon color="primary" />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="文章总数"
            value={posts?.total || 0}
            icon={<ArticleIcon color="secondary" />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="评论总数"
            value={comments?.total || 0}
            icon={<CommentIcon color="success" />}
            color="success"
          />
        </Grid>
      </Grid>
      
      <Typography variant="h5" gutterBottom>
        最新用户
      </Typography>
      
      <Card>
        <CardContent>
          <List resource="users" pagination={false} perPage={5} sort={{ field: 'createdAt', order: 'DESC' }}>
            <Datagrid>
              <TextField source="id" />
              <TextField source="name" />
              <TextField source="email" />
              <TextField source="role" />
              <DateField source="createdAt" />
            </Datagrid>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};
```

## 最佳实践

### 1. 自定义字段

```tsx
// 自定义状态字段
import { useRecordContext } from 'react-admin';
import { Chip } from '@mui/material';

const StatusField = ({ source }: any) => {
  const record = useRecordContext();
  const status = record?.[source];
  
  const colors = {
    active: 'success',
    inactive: 'default',
    pending: 'warning',
  };
  
  return (
    <Chip
      label={status}
      color={colors[status as keyof typeof colors] || 'default'}
      size="small"
    />
  );
};
```

### 2. 权限控制

```tsx
import { usePermissions } from 'react-admin';

const UserList = () => {
  const { permissions } = usePermissions();
  
  return (
    <List>
      <Datagrid>
        <TextField source="name" />
        {permissions === 'admin' && <EditButton />}
      </Datagrid>
    </List>
  );
};
```

### 3. 批量操作

```tsx
import { BulkDeleteButton, BulkExportButton } from 'react-admin';

const UserBulkActionButtons = () => (
  <>
    <BulkExportButton />
    <BulkDeleteButton />
  </>
);

const UserList = () => (
  <List>
    <Datagrid bulkActionButtons={<UserBulkActionButtons />}>
      {/* ... */}
    </Datagrid>
  </List>
);
```

## 常用命令

### 开发

```bash
# 创建项目
npm create vite@latest my-admin -- --template react-ts

# 安装依赖
npm install react-admin ra-data-json-server @mui/material @mui/icons

# 开发模式
npm run dev

# 构建
npm run build

# 预览
npm run preview
```

## 部署配置

### package.json

```json
{
  "name": "react-admin-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-admin": "^5.0.0",
    "ra-data-json-server": "^5.0.0",
    "@mui/material": "^5.0.0",
    "@mui/icons-material": "^5.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
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

### 环境配置

```env
# .env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_TITLE=My Admin Panel
```
