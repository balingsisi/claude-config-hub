# Refine Enterprise React Framework

## 技术栈

- **Refine**: 企业级React框架
- **React 18+**: 前端框架
- **TypeScript**: 类型安全
- **Data Provider**: REST/GraphQL/Supabase/Strapi等
- **UI Library**: Ant Design/Material UI/Chakra UI等
- **Auth Provider**: 多种认证方案

## 项目结构

```
refine-app/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sider.tsx
│   │   │   └── Footer.tsx
│   │   └── ui/
│   ├── pages/
│   │   ├── posts/
│   │   │   ├── list.tsx
│   │   │   ├── create.tsx
│   │   │   ├── edit.tsx
│   │   │   └── show.tsx
│   │   ├── users/
│   │   └── dashboard/
│   ├── providers/
│   │   ├── dataProvider.ts
│   │   ├── authProvider.ts
│   │   └── accessControlProvider.ts
│   ├── resources/
│   │   └── index.ts
│   ├── interfaces/
│   │   └── index.d.ts
│   ├── utils/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── refine.config.js
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 代码模式

### 应用入口

```typescript
// src/App.tsx
import { Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import routerProvider from "@refinedev/react-router-v6";
import dataProvider from "./providers/dataProvider";
import authProvider from "./providers/authProvider";
import { resources } from "./resources";

import "@refinedev/antd/dist/reset.css";

function App() {
  return (
    <RefineKbarProvider>
      <Refine
        routerProvider={routerProvider}
        dataProvider={dataProvider}
        authProvider={authProvider}
        resources={resources}
        options={{
          syncWithLocation: true,
          warnWhenUnsavedChanges: true,
          useNewQueryKeys: true,
          projectId: "my-project-id",
        }}
      >
        <RefineKbar />
        {/* Routes */}
      </Refine>
    </RefineKbarProvider>
  );
}

export default App;
```

### 资源配置

```typescript
// src/resources/index.ts
import { ResourceProps } from "@refinedev/core";
import { PostList } from "../pages/posts/list";
import { PostCreate } from "../pages/posts/create";
import { PostEdit } from "../pages/posts/edit";
import { PostShow } from "../pages/posts/show";

export const resources: ResourceProps[] = [
  {
    name: "posts",
    list: "/posts",
    create: "/posts/create",
    edit: "/posts/edit/:id",
    show: "/posts/show/:id",
    meta: {
      canDelete: true,
      icon: "PostIcon",
      label: "Posts",
      dataProviderName: "default",
    },
  },
  {
    name: "users",
    list: "/users",
    show: "/users/show/:id",
    meta: {
      icon: "UserIcon",
      label: "Users",
    },
  },
  {
    name: "categories",
    list: "/categories",
    create: "/categories/create",
    edit: "/categories/edit/:id",
    meta: {
      label: "Categories",
    },
  },
];
```

### Data Provider

```typescript
// src/providers/dataProvider.ts
import { DataProvider } from "@refinedev/core";
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://api.example.com",
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const dataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters, sorters, meta }) => {
    const { current = 1, pageSize = 10 } = pagination ?? {};
    const params = {
      _start: (current - 1) * pageSize,
      _limit: pageSize,
    };

    if (sorters && sorters.length > 0) {
      params["_sort"] = sorters.map((s) => s.field).join(",");
      params["_order"] = sorters.map((s) => s.order).join(",");
    }

    const { data, headers } = await axiosInstance.get(`/${resource}`, {
      params,
    });

    return {
      data,
      total: parseInt(headers["x-total-count"] ?? "0"),
    };
  },

  getOne: async ({ resource, id, meta }) => {
    const { data } = await axiosInstance.get(`/${resource}/${id}`);
    return { data };
  },

  create: async ({ resource, variables, meta }) => {
    const { data } = await axiosInstance.post(`/${resource}`, variables);
    return { data };
  },

  update: async ({ resource, id, variables, meta }) => {
    const { data } = await axiosInstance.put(
      `/${resource}/${id}`,
      variables
    );
    return { data };
  },

  deleteOne: async ({ resource, id, meta }) => {
    const { data } = await axiosInstance.delete(`/${resource}/${id}`);
    return { data };
  },

  getMany: async ({ resource, ids, meta }) => {
    const { data } = await axiosInstance.get(`/${resource}`, {
      params: { id: ids },
    });
    return { data };
  },

  getApiUrl: () => axiosInstance.defaults.baseURL!,
};
```

### Auth Provider

```typescript
// src/providers/authProvider.ts
import { AuthProvider } from "@refinedev/core";

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      const response = await fetch("https://api.example.com/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        return {
          success: true,
          redirectTo: "/",
        };
      }

      return {
        success: false,
        error: {
          message: data.message || "Login failed",
          name: "LoginError",
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: "Network error",
          name: "NetworkError",
        },
      };
    }
  },

  logout: async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return {
      success: true,
      redirectTo: "/login",
    };
  },

  check: async () => {
    const token = localStorage.getItem("token");
    if (token) {
      return {
        authenticated: true,
      };
    }

    return {
      authenticated: false,
      redirectTo: "/login",
    };
  },

  getPermissions: async () => {
    const user = localStorage.getItem("user");
    if (user) {
      const { role } = JSON.parse(user);
      return role;
    }
    return null;
  },

  getIdentity: async () => {
    const user = localStorage.getItem("user");
    if (user) {
      return JSON.parse(user);
    }
    return null;
  },

  onError: async (error) => {
    if (error.status === 401) {
      return {
        logout: true,
      };
    }
    return { error };
  },
};
```

### List页面

```typescript
// src/pages/posts/list.tsx
import { useList } from "@refinedev/core";
import { List, Table, useTable } from "@refinedev/antd";
import { IPost } from "../../interfaces";

export const PostList: React.FC = () => {
  const { tableProps } = useTable<IPost>({
    syncWithLocation: true,
    filters: {
      permanent: [
        { field: "status", operator: "eq", value: "published" },
      ],
    },
    sorters: {
      initial: [{ field: "createdAt", order: "desc" }],
    },
  });

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" />
        <Table.Column dataIndex="title" title="Title" />
        <Table.Column
          dataIndex="status"
          title="Status"
          render={(value) => value.toUpperCase()}
        />
        <Table.Column
          dataIndex="createdAt"
          title="Created At"
          render={(value) => new Date(value).toLocaleDateString()}
        />
        <Table.Column
          title="Actions"
          dataIndex="actions"
          render={(_, record) => (
            <Space>
              <EditButton hideText size="small" recordItemId={record.id} />
              <ShowButton hideText size="small" recordItemId={record.id} />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
```

### Create页面

```typescript
// src/pages/posts/create.tsx
import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Select } from "antd";

export const PostCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm();

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: "Please enter a title" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Content"
          name="content"
          rules={[{ required: true }]}
        >
          <Input.TextArea rows={5} />
        </Form.Item>

        <Form.Item
          label="Category"
          name="categoryId"
          rules={[{ required: true }]}
        >
          <Select>
            <Select.Option value="1">Technology</Select.Option>
            <Select.Option value="2">Science</Select.Option>
            <Select.Option value="3">Art</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="Status" name="status" initialValue="draft">
          <Select>
            <Select.Option value="draft">Draft</Select.Option>
            <Select.Option value="published">Published</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Create>
  );
};
```

### Edit页面

```typescript
// src/pages/posts/edit.tsx
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select } from "antd";

export const PostEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm();

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label="Title" name="title">
          <Input />
        </Form.Item>

        <Form.Item label="Content" name="content">
          <Input.TextArea rows={5} />
        </Form.Item>

        <Form.Item label="Status" name="status">
          <Select>
            <Select.Option value="draft">Draft</Select.Option>
            <Select.Option value="published">Published</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Edit>
  );
};
```

### Show页面

```typescript
// src/pages/posts/show.tsx
import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography, Tag } from "antd";

const { Title, Text } = Typography;

export const PostShow: React.FC = () => {
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;
  const record = data?.data;

  return (
    <Show isLoading={isLoading}>
      <Title level={5}>ID</Title>
      <Text>{record?.id}</Text>

      <Title level={5}>Title</Title>
      <Text>{record?.title}</Text>

      <Title level={5}>Content</Title>
      <Text>{record?.content}</Text>

      <Title level={5}>Status</Title>
      <Tag color={record?.status === "published" ? "green" : "blue"}>
        {record?.status}
      </Tag>
    </Show>
  );
};
```

### Access Control

```typescript
// src/providers/accessControlProvider.ts
import { AccessControlProvider } from "@refinedev/core";

export const accessControlProvider: AccessControlProvider = {
  can: async ({ resource, action, params }) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = user.role;

    // 定义权限规则
    const permissions: Record<string, string[]> = {
      admin: ["*"],
      editor: ["list", "show", "create", "edit"],
      viewer: ["list", "show"],
    };

    const userPermissions = permissions[role] || [];
    
    if (userPermissions.includes("*")) {
      return { can: true };
    }

    const canPerform = userPermissions.includes(action);
    
    return {
      can: canPerform,
      reason: canPerform 
        ? undefined 
        : `You don't have permission to ${action} ${resource}`,
    };
  },

  options: {
    buttons: {
      enableAccessControl: true,
      hideIfUnauthorized: false,
      disableIfUnauthorized: true,
    },
  },
};
```

### 自定义Hooks

```typescript
// src/hooks/useCustomData.ts
import { useCustom } from "@refinedev/core";

export const usePostStats = () => {
  const { data, isLoading } = useCustom({
    url: "https://api.example.com/posts/stats",
    method: "get",
  });

  return {
    stats: data?.data,
    isLoading,
  };
};

// src/hooks/useNotification.ts
import { useNotification } from "@refinedev/core";

export const useCustomNotification = () => {
  const { open } = useNotification();

  const showSuccess = (message: string) => {
    open?.({
      type: "success",
      message,
    });
  };

  const showError = (message: string) => {
    open?.({
      type: "error",
      message,
    });
  };

  return { showSuccess, showError };
};
```

### Real-time订阅

```typescript
// src/providers/liveProvider.ts
import { LiveProvider } from "@refinedev/core";
import { Ably } from "ably";

const ably = new Ably.Realtime("YOUR_API_KEY");

export const liveProvider: LiveProvider = {
  subscribe: ({ channel, types, callback }) => {
    const ablyChannel = ably.channels.get(channel);
    
    const listener = (message: any) => {
      callback({
        type: message.name,
        channel: channel,
        date: new Date(),
        payload: message.data,
      });
    };

    types.forEach((type) => {
      ablyChannel.subscribe(type, listener);
    });

    return () => {
      types.forEach((type) => {
        ablyChannel.unsubscribe(type, listener);
      });
    };
  },

  publish: ({ channel, type, payload }) => {
    const ablyChannel = ably.channels.get(channel);
    ablyChannel.publish(type, payload);
  },
};

// 使用
import { useSubscription } from "@refinedev/core";

const PostList = () => {
  useSubscription({
    channel: "posts",
    onLiveEvent: (event) => {
      console.log("New event:", event);
    },
    types: ["created", "updated", "deleted"],
  });

  // ...
};
```

## 最佳实践

### 1. 类型定义

```typescript
// src/interfaces/index.d.ts
export interface IPost {
  id: string;
  title: string;
  content: string;
  status: "draft" | "published";
  categoryId: string;
  category?: ICategory;
  createdAt: string;
  updatedAt: string;
}

export interface ICategory {
  id: string;
  name: string;
  description?: string;
}

// 使用
const { data } = useList<IPost>({ resource: "posts" });
```

### 2. 错误处理

```typescript
// 在authProvider中
login: async ({ email, password }) => {
  try {
    const response = await authApi.login({ email, password });
    // ...
  } catch (error: any) {
    return {
      success: false,
      error: {
        message: error.response?.data?.message || "Login failed",
        name: "LoginError",
      },
    };
  }
}

// 在组件中
const { mutate, isLoading } = useCreate();

const handleCreate = () => {
  mutate(
    { resource: "posts", values: formData },
    {
      onSuccess: () => {
        notification.success({ message: "Created successfully" });
      },
      onError: (error) => {
        notification.error({ 
          message: error.message || "Failed to create" 
        });
      },
    }
  );
};
```

### 3. 搜索和过滤

```typescript
// src/pages/posts/list.tsx
export const PostList: React.FC = () => {
  const { tableProps, filters, setFilters } = useTable<IPost>({
    filters: {
      initial: [
        { field: "q", operator: "contains", value: "" },
      ],
    },
  });

  return (
    <List>
      <Filter
        filters={filters}
        setFilters={setFilters}
      />
      <Table {...tableProps} rowKey="id">
        {/* columns */}
      </Table>
    </List>
  );
};

// Filter组件
const Filter: React.FC<{ filters: any; setFilters: any }> = ({
  filters,
  setFilters,
}) => {
  return (
    <Form layout="inline">
      <Form.Item>
        <Input
          placeholder="Search..."
          value={filters.find((f: any) => f.field === "q")?.value}
          onChange={(e) =>
            setFilters([
              { field: "q", operator: "contains", value: e.target.value },
            ])
          }
        />
      </Form.Item>
    </Form>
  );
};
```

### 4. 关联数据

```typescript
// 使用useMany获取关联数据
export const PostList: React.FC = () => {
  const { tableProps } = useTable<IPost>();

  // 获取所有分类
  const categoryIds = tableProps?.dataSource?.map((post) => post.categoryId);
  const { data: categories } = useMany<ICategory>({
    resource: "categories",
    ids: categoryIds || [],
    queryOptions: {
      enabled: !!categoryIds && categoryIds.length > 0,
    },
  });

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="categoryId"
          title="Category"
          render={(value) =>
            categories?.data?.find((cat) => cat.id === value)?.name
          }
        />
      </Table>
    </List>
  );
};
```

### 5. 乐观更新

```typescript
// src/pages/posts/like.tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const LikeButton: React.FC<{ postId: string }> = ({ postId }) => {
  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: (id: string) => axios.post(`/posts/${id}/like`),
    onMutate: async (id) => {
      // 取消进行中的请求
      await queryClient.cancelQueries(["posts", id]);

      // 保存旧数据
      const previousPost = queryClient.getQueryData(["posts", id]);

      // 乐观更新
      queryClient.setQueryData(["posts", id], (old: any) => ({
        ...old,
        likes: old.likes + 1,
      }));

      return { previousPost };
    },
    onError: (err, id, context) => {
      // 回滚
      queryClient.setQueryData(["posts", id], context.previousPost);
    },
    onSettled: (id) => {
      // 重新获取数据
      queryClient.invalidateQueries(["posts", id]);
    },
  });

  return <Button onClick={() => mutate(postId)}>Like</Button>;
};
```

## 常用命令

```bash
# 创建新项目
npm create refine-app@latest -- -o refine-antd

# 开发
npm run dev

# 构建
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint

# 格式化代码
npm run format

# 测试
npm run test

# 添加UI库
npm install @refinedev/antd antd

# 添加路由
npm install @refinedev/react-router-v6 react-router-dom

# 添加图标
npm install @ant-design/icons
```

## 部署配置

### Vite配置

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
```

### Docker部署

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

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
        proxy_pass http://api-server:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Vercel部署

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://api.example.com/$1" }
  ],
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "3000:80"
    environment:
      - API_URL=https://api.example.com
    depends_on:
      - api

  api:
    image: your-api:latest
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://db:5432/mydb
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: mydb
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### 环境变量

```bash
# .env
VITE_API_URL=https://api.example.com
VITE_APP_NAME=My App
VITE_ENABLE_REALTIME=true
```

```typescript
// 使用环境变量
const dataProvider = simpleRestProvider(import.meta.env.VITE_API_URL);
```

### Kubernetes部署

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: refine-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: refine
  template:
    metadata:
      labels:
        app: refine
    spec:
      containers:
      - name: refine
        image: refine-app:latest
        ports:
        - containerPort: 80
        env:
        - name: API_URL
          value: "https://api.example.com"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
---
apiVersion: v1
kind: Service
metadata:
  name: refine-service
spec:
  selector:
    app: refine
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
```
