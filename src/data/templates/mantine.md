# Mantine UI 组件库模板

## 技术栈

- **Mantine**: React 全功能 UI 库
- **React 18**: 用户界面库
- **TypeScript**: 类型支持
- **Vite**: 下一代前端构建工具
- **Emotion**: CSS-in-JS 解决方案
- **Tabler Icons**: 图标库

## 项目结构

```
mantine-app/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── AppHeader.tsx
│   │   │   ├── AppNavbar.tsx
│   │   │   └── AppFooter.tsx
│   │   ├── Forms/
│   │   │   ├── UserForm.tsx
│   │   │   └── SearchForm.tsx
│   │   ├── Tables/
│   │   │   ├── DataTable.tsx
│   │   │   └── EditableTable.tsx
│   │   └── Charts/
│   │       ├── LineChart.tsx
│   │       └── BarChart.tsx
│   ├── hooks/
│   │   ├── useNotifications.ts
│   │   └── useModals.ts
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Users.tsx
│   │   └── Settings.tsx
│   ├── routes/
│   │   └── index.tsx
│   ├── stores/
│   │   └── userStore.ts
│   ├── utils/
│   │   └── api.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
│   └── favicon.ico
├── index.html
├── vite.config.ts
├── package.json
└── tsconfig.json
```

## 代码模式

### 应用入口

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import App from './App';
import routes from './routes';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/charts/styles.css';
import './styles/global.css';

const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'Inter, system-ui, sans-serif',
  headings: {
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  defaultRadius: 'md',
  components: {
    Button: {
      defaultProps: {
        size: 'sm',
      },
    },
    TextInput: {
      defaultProps: {
        size: 'sm',
      },
    },
  },
});

const router = createBrowserRouter(routes);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" />
      <ModalsProvider>
        <RouterProvider router={router} />
      </ModalsProvider>
    </MantineProvider>
  </React.StrictMode>
);
```

### App 组件

```tsx
// src/App.tsx
import { AppShell, Burger, Group, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import AppNavbar from './components/Layout/AppNavbar';
import AppHeader from './components/Layout/AppHeader';

export default function App() {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppHeader opened={opened} toggle={toggle} />
      <AppNavbar opened={opened} />
      
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
```

### 布局组件

```tsx
// src/components/Layout/AppHeader.tsx
import { Group, Burger, Text, Avatar, Menu, UnstyledButton, rem } from '@mantine/core';
import { IconLogout, IconSettings, IconUser } from '@tabler/icons-react';

interface AppHeaderProps {
  opened: boolean;
  toggle: () => void;
}

export default function AppHeader({ opened, toggle }: AppHeaderProps) {
  return (
    <AppShell.Header>
      <Group h="100%" px="md" justify="space-between">
        <Group>
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Text size="xl" fw={700}>
            管理系统
          </Text>
        </Group>

        <Menu shadow="md" width={200}>
          <Menu.Target>
            <UnstyledButton>
              <Group gap="xs">
                <Avatar color="blue" radius="xl" size="sm">
                  JD
                </Avatar>
                <Text size="sm">John Doe</Text>
              </Group>
            </UnstyledButton>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>账户</Menu.Label>
            <Menu.Item leftSection={<IconUser style={{ width: rem(14), height: rem(14) }} />}>
              个人信息
            </Menu.Item>
            <Menu.Item leftSection={<IconSettings style={{ width: rem(14), height: rem(14) }} />}>
              设置
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              color="red"
              leftSection={<IconLogout style={{ width: rem(14), height: rem(14) }} />}
            >
              退出登录
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </AppShell.Header>
  );
}
```

```tsx
// src/components/Layout/AppNavbar.tsx
import { AppShell, NavLink, ScrollArea, Group, ThemeIcon } from '@mantine/core';
import {
  IconHome,
  IconUsers,
  IconSettings,
  IconChartBar,
  IconFileText,
} from '@tabler/icons-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface AppNavbarProps {
  opened: boolean;
}

const navItems = [
  {
    label: '仪表盘',
    icon: IconHome,
    href: '/dashboard',
  },
  {
    label: '用户管理',
    icon: IconUsers,
    href: '/users',
    children: [
      { label: '用户列表', href: '/users/list' },
      { label: '角色管理', href: '/users/roles' },
      { label: '权限设置', href: '/users/permissions' },
    ],
  },
  {
    label: '数据分析',
    icon: IconChartBar,
    href: '/analytics',
  },
  {
    label: '文档管理',
    icon: IconFileText,
    href: '/documents',
  },
  {
    label: '系统设置',
    icon: IconSettings,
    href: '/settings',
  },
];

export default function AppNavbar({ opened }: AppNavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [active, setActive] = useState(location.pathname);

  const handleNavClick = (href: string) => {
    setActive(href);
    navigate(href);
  };

  return (
    <AppShell.Navbar p="md">
      <AppShell.Section>
        <Group mb="md">
          <ThemeIcon size="lg" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
            <IconHome size={20} />
          </ThemeIcon>
          <Text size="lg" fw={700}>
            MyApp
          </Text>
        </Group>
      </AppShell.Section>

      <AppShell.Section grow component={ScrollArea}>
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            label={item.label}
            leftSection={<item.icon size={16} stroke={1.5} />}
            active={active === item.href}
            onClick={() => handleNavClick(item.href)}
            variant="filled"
          >
            {item.children?.map((child) => (
              <NavLink
                key={child.label}
                label={child.label}
                active={active === child.href}
                onClick={() => handleNavClick(child.href)}
              />
            ))}
          </NavLink>
        ))}
      </AppShell.Section>

      <AppShell.Section>
        <Text size="xs" c="dimmed" ta="center">
          © 2024 MyApp. All rights reserved.
        </Text>
      </AppShell.Section>
    </AppShell.Navbar>
  );
}
```

### 数据表格

```tsx
// src/components/Tables/DataTable.tsx
import { useState } from 'react';
import {
  Table,
  ScrollArea,
  UnstyledButton,
  Group,
  Text,
  Center,
  TextInput,
  rem,
  keys,
  Button,
  Badge,
  ActionIcon,
  Menu,
} from '@mantine/core';
import {
  IconSelector,
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconPencil,
  IconTrash,
  IconDotsVertical,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface RowData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface ThProps {
  children: React.ReactNode;
  reversed: boolean;
  sorted: boolean;
  onSort(): void;
}

function Th({ children, reversed, sorted, onSort }: ThProps) {
  const Icon = sorted ? (reversed ? IconChevronUp : IconChevronDown) : IconSelector;
  return (
    <Table.Th className="th">
      <UnstyledButton onClick={onSort} className="control">
        <Group justify="space-between">
          <Text fw={500} fz="sm">
            {children}
          </Text>
          <Center className="icon">
            <Icon style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
          </Center>
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
}

function filterData(data: RowData[], search: string) {
  const query = search.toLowerCase().trim();
  return data.filter((item) =>
    keys(data[0]).some((key) => item[key].toLowerCase().includes(query))
  );
}

function sortData(
  data: RowData[],
  payload: { sortBy: keyof RowData | null; reversed: boolean; search: string }
) {
  const { sortBy } = payload;

  if (!sortBy) {
    return filterData(data, payload.search);
  }

  return filterData(
    [...data].sort((a, b) => {
      if (payload.reversed) {
        return b[sortBy].localeCompare(a[sortBy]);
      }

      return a[sortBy].localeCompare(b[sortBy]);
    }),
    payload.search
  );
}

const data: RowData[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'active',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'User',
    status: 'active',
    createdAt: '2024-01-20',
  },
  // ... more data
];

export default function DataTable() {
  const [search, setSearch] = useState('');
  const [sortedData, setSortedData] = useState(data);
  const [sortBy, setSortBy] = useState<keyof RowData | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);

  const setSorting = (field: keyof RowData) => {
    const reversed = field === sortBy ? !reverseSortDirection : false;
    setReverseSortDirection(reversed);
    setSortBy(field);
    setSortedData(sortData(data, { sortBy: field, reversed, search }));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    setSearch(value);
    setSortedData(sortData(data, { sortBy, reversed: reverseSortDirection, search: value }));
  };

  const handleDelete = (id: string) => {
    notifications.show({
      title: '删除确认',
      message: `删除用户 ID: ${id}`,
      color: 'red',
    });
  };

  const rows = sortedData.map((row) => (
    <Table.Tr key={row.id}>
      <Table.Td>{row.name}</Table.Td>
      <Table.Td>{row.email}</Table.Td>
      <Table.Td>{row.role}</Table.Td>
      <Table.Td>
        <Badge color={row.status === 'active' ? 'green' : 'red'}>
          {row.status}
        </Badge>
      </Table.Td>
      <Table.Td>{row.createdAt}</Table.Td>
      <Table.Td>
        <Group gap={0} justify="flex-end">
          <ActionIcon variant="subtle" color="gray">
            <IconPencil size={16} stroke={1.5} />
          </ActionIcon>
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray">
                <IconDotsVertical size={16} stroke={1.5} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item>查看详情</Menu.Item>
              <Menu.Item>编辑</Menu.Item>
              <Menu.Divider />
              <Menu.Item color="red" onClick={() => handleDelete(row.id)}>
                删除
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <ScrollArea>
      <TextInput
        placeholder="搜索..."
        mb="md"
        leftSection={<IconSearch style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
        value={search}
        onChange={handleSearchChange}
      />
      
      <Table horizontalSpacing="md" verticalSpacing="xs" miw={700} layout="fixed">
        <Table.Tbody>
          <Table.Tr>
            <Th
              sorted={sortBy === 'name'}
              reversed={reverseSortDirection}
              onSort={() => setSorting('name')}
            >
              姓名
            </Th>
            <Th
              sorted={sortBy === 'email'}
              reversed={reverseSortDirection}
              onSort={() => setSorting('email')}
            >
              邮箱
            </Th>
            <Th
              sorted={sortBy === 'role'}
              reversed={reverseSortDirection}
              onSort={() => setSorting('role')}
            >
              角色
            </Th>
            <Th
              sorted={sortBy === 'status'}
              reversed={reverseSortDirection}
              onSort={() => setSorting('status')}
            >
              状态
            </Th>
            <Th
              sorted={sortBy === 'createdAt'}
              reversed={reverseSortDirection}
              onSort={() => setSorting('createdAt')}
            >
              创建时间
            </Th>
            <Table.Th />
          </Table.Tr>
        </Table.Tbody>
        <Table.Tbody>
          {rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={6}>
                <Text fw={500} ta="center">
                  没有找到数据
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
```

### 表单组件

```tsx
// src/components/Forms/UserForm.tsx
import { useForm, zodResolver } from '@mantine/form';
import {
  TextInput,
  PasswordInput,
  Select,
  Button,
  Group,
  Box,
  Checkbox,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2, '姓名至少2个字符'),
  email: z.string().email('邮箱格式不正确'),
  role: z.enum(['admin', 'user', 'guest']),
  password: z.string().min(6, '密码至少6位'),
  confirmPassword: z.string(),
  birthDate: z.date(),
  agreeToTerms: z.literal(true),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次密码不一致',
  path: ['confirmPassword'],
});

interface UserFormProps {
  onSubmit: (values: any) => void;
  initialValues?: any;
}

export default function UserForm({ onSubmit, initialValues }: UserFormProps) {
  const form = useForm({
    validate: zodResolver(schema),
    initialValues: initialValues || {
      name: '',
      email: '',
      role: 'user',
      password: '',
      confirmPassword: '',
      birthDate: null,
      agreeToTerms: false,
    },
    transformValues: (values) => ({
      ...values,
      birthDate: values.birthDate?.toISOString(),
    }),
  });

  const handleSubmit = (values: any) => {
    onSubmit(values);
    notifications.show({
      title: '成功',
      message: '表单提交成功',
      color: 'green',
    });
  };

  return (
    <Box component="form" maw={400} onSubmit={form.onSubmit(handleSubmit)}>
      <TextInput
        withAsterisk
        label="姓名"
        placeholder="请输入姓名"
        {...form.getInputProps('name')}
        mb="sm"
      />

      <TextInput
        withAsterisk
        label="邮箱"
        placeholder="your@email.com"
        {...form.getInputProps('email')}
        mb="sm"
      />

      <Select
        withAsterisk
        label="角色"
        data={[
          { value: 'admin', label: '管理员' },
          { value: 'user', label: '用户' },
          { value: 'guest', label: '访客' },
        ]}
        {...form.getInputProps('role')}
        mb="sm"
      />

      <PasswordInput
        withAsterisk
        label="密码"
        placeholder="请输入密码"
        {...form.getInputProps('password')}
        mb="sm"
      />

      <PasswordInput
        withAsterisk
        label="确认密码"
        placeholder="请再次输入密码"
        {...form.getInputProps('confirmPassword')}
        mb="sm"
      />

      <DateInput
        label="出生日期"
        placeholder="选择日期"
        {...form.getInputProps('birthDate')}
        mb="sm"
      />

      <Checkbox
        label="我同意服务条款"
        {...form.getInputProps('agreeToTerms', { type: 'checkbox' })}
        mb="md"
      />

      <Group justify="flex-end" mt="md">
        <Button variant="default" type="reset">
          重置
        </Button>
        <Button type="submit">提交</Button>
      </Group>
    </Box>
  );
}
```

### 模态框

```tsx
// src/components/Dialogs/FormModal.tsx
import { Button, Group, Modal, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import UserForm from '../Forms/UserForm';

interface FormModalProps {
  opened: boolean;
  onClose: () => void;
  title?: string;
}

export default function FormModal({ opened, onClose, title = '新增用户' }: FormModalProps) {
  const handleSubmit = (values: any) => {
    console.log('Form submitted:', values);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text size="lg" fw={700}>{title}</Text>}
      size="md"
      centered
    >
      <UserForm onSubmit={handleSubmit} />
    </Modal>
  );
}

// 使用示例
function Example() {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Button onClick={open}>新增用户</Button>
      <FormModal opened={opened} onClose={close} />
    </>
  );
}
```

### Hooks

```tsx
// src/hooks/useNotifications.ts
import { notifications } from '@mantine/notifications';

export function useNotifications() {
  const showSuccess = (message: string, title = '成功') => {
    notifications.show({
      title,
      message,
      color: 'green',
    });
  };

  const showError = (message: string, title = '错误') => {
    notifications.show({
      title,
      message,
      color: 'red',
    });
  };

  const showWarning = (message: string, title = '警告') => {
    notifications.show({
      title,
      message,
      color: 'yellow',
    });
  };

  const showInfo = (message: string, title = '提示') => {
    notifications.show({
      title,
      message,
      color: 'blue',
    });
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}
```

### 图表集成

```tsx
// src/components/Charts/LineChart.tsx
import { LineChart } from '@mantine/charts';
import { Card, Text } from '@mantine/core';

const data = [
  { date: 'Mar 1', users: 1000, active: 800 },
  { date: 'Mar 2', users: 1200, active: 950 },
  { date: 'Mar 3', users: 1500, active: 1100 },
  { date: 'Mar 4', users: 1800, active: 1400 },
  { date: 'Mar 5', users: 2000, active: 1600 },
  { date: 'Mar 6', users: 2200, active: 1800 },
  { date: 'Mar 7', users: 2500, active: 2000 },
];

export default function UserGrowthChart() {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Text size="lg" fw={500} mb="md">
        用户增长趋势
      </Text>
      <LineChart
        h={300}
        data={data}
        dataKey="date"
        series={[
          { name: 'users', color: 'blue.6' },
          { name: 'active', color: 'teal.6' },
        ]}
        curveType="monotone"
        connectNulls
      />
    </Card>
  );
}
```

## 最佳实践

### 1. 主题定制

```tsx
// src/theme.ts
import { createTheme, MantineColorsTuple, overrideColorTheme } from '@mantine/core';

const myColor: MantineColorsTuple = [
  '#e6f6ff',
  '#d6ecff',
  '#b5dbff',
  '#8ec8ff',
  '#61b2ff',
  '#399fff',
  '#1c8bff',
  '#0078e6',
  '#006acc',
  '#005bb3',
];

export const theme = createTheme({
  colors: {
    myColor,
  },
  primaryColor: 'myColor',
  fontFamily: 'Inter, sans-serif',
  defaultRadius: 'md',
  components: {
    Button: {
      styles: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
});
```

### 2. 权限控制

```tsx
// src/components/Permission/Can.tsx
import { useAuth } from '@/hooks/useAuth';

interface CanProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Can({ permission, children, fallback = null }: CanProps) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// 使用
<Can permission="user:delete">
  <Button color="red">删除</Button>
</Can>
```

### 3. 数据导出

```tsx
// src/utils/export.ts
import { utils, writeFile } from 'xlsx';

export function exportToExcel(data: any[], filename: string) {
  const worksheet = utils.json_to_sheet(data);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  
  writeFile(workbook, `${filename}.xlsx`);
}

export function exportToCSV(data: any[], filename: string) {
  const worksheet = utils.json_to_sheet(data);
  const csv = utils.sheet_to_csv(worksheet);
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}
```

### 4. 文件上传

```tsx
// src/components/FileUpload.tsx
import { FileButton, Button, Group, Text, List, rem } from '@mantine/core';
import { IconUpload, IconX, IconCheck } from '@tabler/icons-react';
import { useState } from 'react';

export default function FileUpload() {
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (selectedFiles: File[] | null) => {
    if (selectedFiles) {
      setFiles(selectedFiles);
    }
  };

  return (
    <>
      <FileButton onChange={handleFileChange} accept="image/png,image/jpeg" multiple>
        {(props) => (
          <Button leftSection={<IconUpload size={14} />} {...props}>
            上传文件
          </Button>
        )}
      </FileButton>

      {files.length > 0 && (
        <List size="sm" mt="md">
          {files.map((file, index) => (
            <List.Item key={index}>{file.name}</List.Item>
          ))}
        </List>
      )}
    </>
  );
}
```

### 5. 懒加载

```tsx
// src/components/LazyComponent.tsx
import { useIntersection } from '@mantine/hooks';
import { useState, useEffect } from 'react';

export default function LazyComponent({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const { ref, entry } = useIntersection({
    threshold: 0.1,
  });

  useEffect(() => {
    if (entry?.isIntersecting && !loaded) {
      setLoaded(true);
    }
  }, [entry?.isIntersecting, loaded]);

  return (
    <div ref={ref}>
      {loaded ? children : <div style={{ height: 400 }}>Loading...</div>}
    </div>
  );
}
```

## 常用命令

### 开发

```bash
# 安装依赖
npm install @mantine/core @mantine/hooks @mantine/notifications @mantine/modals @mantine/dates @mantine/charts @tabler/icons-react dayjs recharts

# 开发模式
npm run dev

# 构建
npm run build

# 预览
npm run preview

# 类型检查
npm run type-check
```

### Vite 配置

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
```

## 部署配置

### Docker

```dockerfile
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

### 环境变量

```env
# .env.example
VITE_API_URL=https://api.example.com
VITE_APP_TITLE=管理系统
```

## 性能优化

### 1. 按需加载

```tsx
import { lazy, Suspense } from 'react';
import { LoadingOverlay } from '@mantine/core';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Users = lazy(() => import('./pages/Users'));

function App() {
  return (
    <Suspense fallback={<LoadingOverlay visible />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
      </Routes>
    </Suspense>
  );
}
```

### 2. 虚拟滚动

```tsx
import { useVirtualList } from '@mantine/hooks';

function VirtualList({ items }: { items: string[] }) {
  const virtualList = useVirtualList({
    count: items.length,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => 40,
  });

  return (
    <div ref={viewportRef} style={{ height: 400, overflow: 'auto' }}>
      <div style={{ height: virtualList.totalSize }}>
        {virtualList.virtualItems.map((item) => (
          <div key={item.index} style={{ transform: `translateY(${item.start}px)` }}>
            {items[item.index]}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3. 防抖和节流

```tsx
import { useDebouncedValue, useThrottledValue } from '@mantine/hooks';

function Search() {
  const [value, setValue] = useState('');
  const [debouncedValue] = useDebouncedValue(value, 200);

  useEffect(() => {
    // 执行搜索
  }, [debouncedValue]);

  return <TextInput value={value} onChange={(e) => setValue(e.target.value)} />;
}
```
