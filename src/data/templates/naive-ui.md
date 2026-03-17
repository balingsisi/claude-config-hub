# Naive UI 组件库模板

## 技术栈

- **Naive UI**: Vue 3 UI 组件库
- **Vue 3**: 渐进式 JavaScript 框架
- **TypeScript**: 类型支持
- **Vite**: 下一代前端构建工具
- **Vue Router**: 官方路由
- **Pinia**: 状态管理
- **VueUse**: Vue Composition 工具集

## 项目结构

```
naive-ui-app/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── AppLayout.vue
│   │   │   ├── AppHeader.vue
│   │   │   ├── AppSidebar.vue
│   │   │   └── AppContent.vue
│   │   ├── Forms/
│   │   │   ├── UserForm.vue
│   │   │   └── SearchForm.vue
│   │   ├── Tables/
│   │   │   ├── DataTable.vue
│   │   │   └── EditableTable.vue
│   │   └── Common/
│   │       ├── PageHeader.vue
│   │       └── EmptyState.vue
│   ├── composables/
│   │   ├── useMessage.ts
│   │   ├── useDialog.ts
│   │   └── useLoading.ts
│   ├── views/
│   │   ├── Dashboard.vue
│   │   ├── Users.vue
│   │   └── Settings.vue
│   ├── router/
│   │   └── index.ts
│   ├── stores/
│   │   ├── user.ts
│   │   └── app.ts
│   ├── utils/
│   │   ├── request.ts
│   │   └── storage.ts
│   ├── App.vue
│   └── main.ts
├── public/
│   └── favicon.ico
├── index.html
├── vite.config.ts
├── package.json
└── tsconfig.json
```

## 代码模式

### 应用入口

```ts
// src/main.ts
import { createApp } from 'vue';
import naive from 'naive-ui';
import { createPinia } from 'pinia';
import router from './router';

import App from './App.vue';

const app = createApp(App);

app.use(naive);
app.use(createPinia());
app.use(router);

app.mount('#app');
```

### App 组件

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { NConfigProvider, NMessageProvider, NDialogProvider, NNotificationProvider } from 'naive-ui';
import { computed } from 'vue';
import AppLayout from './components/Layout/AppLayout.vue';

// 主题配置
const themeOverrides = computed(() => ({
  common: {
    primaryColor: '#18a058',
    primaryColorHover: '#36ad6a',
    primaryColorPressed: '#0c7a43',
  },
}));
</script>

<template>
  <NConfigProvider :theme-overrides="themeOverrides">
    <NMessageProvider>
      <NDialogProvider>
        <NNotificationProvider>
          <AppLayout>
            <router-view v-slot="{ Component }">
              <transition name="fade" mode="out-in">
                <component :is="Component" />
              </transition>
            </router-view>
          </AppLayout>
        </NNotificationProvider>
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

### 布局组件

```vue
<!-- src/components/Layout/AppLayout.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { NLayout, NLayoutHeader, NLayoutSider, NLayoutContent, NLayoutFooter } from 'naive-ui';
import AppHeader from './AppHeader.vue';
import AppSidebar from './AppSidebar.vue';

const collapsed = ref(false);

const handleCollapse = (collapsed: boolean) => {
  collapsed.value = collapsed;
};
</script>

<template>
  <NLayout has-sider position="absolute">
    <NLayoutSider
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :width="240"
      :collapsed="collapsed"
      show-trigger
      @collapse="handleCollapse(true)"
      @expand="handleCollapse(false)"
    >
      <AppSidebar :collapsed="collapsed" />
    </NLayoutSider>

    <NLayout>
      <NLayoutHeader bordered>
        <AppHeader />
      </NLayoutHeader>

      <NLayoutContent :native-scrollbar="false" content-style="padding: 24px;">
        <slot />
      </NLayoutContent>

      <NLayoutFooter bordered>
        <div class="text-center py-2 text-gray-500 text-sm">
          © 2024 MyApp. All rights reserved.
        </div>
      </NLayoutFooter>
    </NLayout>
  </NLayout>
</template>
```

```vue
<!-- src/components/Layout/AppSidebar.vue -->
<script setup lang="ts">
import { h, computed } from 'vue';
import { NMenu, NIcon } from 'naive-ui';
import { RouterLink, useRoute } from 'vue-router';
import {
  HomeOutline,
  PeopleOutline,
  SettingsOutline,
  AnalyticsOutline,
  DocumentOutline,
} from '@vicons/ionicons5';

interface Props {
  collapsed: boolean;
}

defineProps<Props>();

const route = useRoute();

function renderIcon(icon: any) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

const menuOptions = [
  {
    label: () => h(RouterLink, { to: '/dashboard' }, { default: () => '仪表盘' }),
    key: '/dashboard',
    icon: renderIcon(HomeOutline),
  },
  {
    label: '用户管理',
    key: 'users',
    icon: renderIcon(PeopleOutline),
    children: [
      {
        label: () => h(RouterLink, { to: '/users/list' }, { default: () => '用户列表' }),
        key: '/users/list',
      },
      {
        label: () => h(RouterLink, { to: '/users/roles' }, { default: () => '角色管理' }),
        key: '/users/roles',
      },
      {
        label: () => h(RouterLink, { to: '/users/permissions' }, { default: () => '权限设置' }),
        key: '/users/permissions',
      },
    ],
  },
  {
    label: () => h(RouterLink, { to: '/analytics' }, { default: () => '数据分析' }),
    key: '/analytics',
    icon: renderIcon(AnalyticsOutline),
  },
  {
    label: () => h(RouterLink, { to: '/documents' }, { default: () => '文档管理' }),
    key: '/documents',
    icon: renderIcon(DocumentOutline),
  },
  {
    label: () => h(RouterLink, { to: '/settings' }, { default: () => '系统设置' }),
    key: '/settings',
    icon: renderIcon(SettingsOutline),
  },
];

const activeKey = computed(() => {
  return route.path;
});
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-center h-16 border-b border-gray-200">
      <h1 v-if="!collapsed" class="text-xl font-bold text-primary">管理系统</h1>
      <n-icon v-else size="24" color="#18a058">
        <HomeOutline />
      </n-icon>
    </div>

    <NMenu
      :collapsed="collapsed"
      :collapsed-width="64"
      :collapsed-icon-size="22"
      :options="menuOptions"
      :value="activeKey"
      :indent="20"
    />
  </div>
</template>
```

```vue
<!-- src/components/Layout/AppHeader.vue -->
<script setup lang="ts">
import { h, ref } from 'vue';
import { NDropdown, NButton, NAvatar, NSpace, NBadge, NIcon } from 'naive-ui';
import { NotificationsOutline, PersonOutline, LogOutOutline } from '@vicons/ionicons5';

const userOptions = [
  {
    label: '个人信息',
    key: 'profile',
    icon: () => h(NIcon, null, { default: () => h(PersonOutline) }),
  },
  {
    type: 'divider',
    key: 'd1',
  },
  {
    label: '退出登录',
    key: 'logout',
    icon: () => h(NIcon, null, { default: () => h(LogOutOutline) }),
  },
];

const handleSelect = (key: string) => {
  if (key === 'logout') {
    // 退出登录逻辑
  }
};
</script>

<template>
  <div class="flex items-center justify-between h-16 px-6">
    <div class="flex items-center gap-4">
      <n-breadcrumb>
        <n-breadcrumb-item>首页</n-breadcrumb-item>
        <n-breadcrumb-item>仪表盘</n-breadcrumb-item>
      </n-breadcrumb>
    </div>

    <NSpace align="center">
      <NBadge :value="5" :max="99">
        <NButton quaternary circle>
          <template #icon>
            <NIcon :size="20">
              <NotificationsOutline />
            </NIcon>
          </template>
        </NButton>
      </NBadge>

      <NDropdown :options="userOptions" @select="handleSelect">
        <div class="flex items-center gap-2 cursor-pointer">
          <NAvatar round size="small" src="https://example.com/avatar.jpg" />
          <span>John Doe</span>
        </div>
      </NDropdown>
    </NSpace>
  </div>
</template>
```

### 数据表格

```vue
<!-- src/components/Tables/DataTable.vue -->
<script setup lang="ts">
import { ref, h } from 'vue';
import {
  NDataTable,
  NButton,
  NSpace,
  NTag,
  NInput,
  NIcon,
  useMessage,
  DataTableColumns,
} from 'naive-ui';
import { CreateOutline, TrashOutline } from '@vicons/ionicons5';
import type { RowData } from 'naive-ui/es/data-table/src/interface';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

const message = useMessage();
const loading = ref(false);
const searchValue = ref('');
const checkedRowKeys = ref<string[]>([]);

const data = ref<User[]>([
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
]);

const columns: DataTableColumns<User> = [
  {
    type: 'selection',
  },
  {
    title: '姓名',
    key: 'name',
    sorter: (row1, row2) => row1.name.localeCompare(row2.name),
  },
  {
    title: '邮箱',
    key: 'email',
  },
  {
    title: '角色',
    key: 'role',
  },
  {
    title: '状态',
    key: 'status',
    render(row) {
      return h(
        NTag,
        {
          type: row.status === 'active' ? 'success' : 'error',
        },
        {
          default: () => (row.status === 'active' ? '启用' : '禁用'),
        }
      );
    },
  },
  {
    title: '创建时间',
    key: 'createdAt',
    sorter: (row1, row2) => new Date(row1.createdAt).getTime() - new Date(row2.createdAt).getTime(),
  },
  {
    title: '操作',
    key: 'actions',
    render(row) {
      return h(
        NSpace,
        {},
        {
          default: () => [
            h(
              NButton,
              {
                size: 'small',
                onClick: () => handleEdit(row),
              },
              {
                icon: () => h(NIcon, null, { default: () => h(CreateOutline) }),
              }
            ),
            h(
              NButton,
              {
                size: 'small',
                type: 'error',
                onClick: () => handleDelete(row),
              },
              {
                icon: () => h(NIcon, null, { default: () => h(TrashOutline) }),
              }
            ),
          ],
        }
      );
    },
  },
];

const handleEdit = (row: User) => {
  message.info(`编辑用户: ${row.name}`);
};

const handleDelete = (row: User) => {
  message.warning(`删除用户: ${row.name}`);
};

const handleSearch = () => {
  // 搜索逻辑
};

const handleCheckedRowKeysChange = (keys: string[]) => {
  checkedRowKeys.value = keys;
};
</script>

<template>
  <div class="space-y-4">
    <NSpace justify="space-between">
      <NSpace>
        <NButton type="primary">新增用户</NButton>
        <NButton
          type="error"
          :disabled="checkedRowKeys.length === 0"
        >
          批量删除
        </NButton>
      </NSpace>

      <NInput
        v-model:value="searchValue"
        placeholder="搜索..."
        clearable
        @update:value="handleSearch"
      >
        <template #prefix>
          <NIcon>
            <SearchOutline />
          </NIcon>
        </template>
      </NInput>
    </NSpace>

    <NDataTable
      :columns="columns"
      :data="data"
      :loading="loading"
      :row-key="(row: User) => row.id"
      :checked-row-keys="checkedRowKeys"
      @update:checked-row-keys="handleCheckedRowKeysChange"
      :pagination="{
        pageSize: 10,
      }"
    />
  </div>
</template>
```

### 表单组件

```vue
<!-- src/components/Forms/UserForm.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import {
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NDatePicker,
  NButton,
  NSpace,
  useMessage,
  FormInst,
  FormRules,
} from 'naive-ui';

interface Props {
  initialValues?: any;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  submit: [values: any];
  cancel: [];
}>();

const message = useMessage();
const formRef = ref<FormInst | null>(null);

const formValue = ref({
  name: props.initialValues?.name || '',
  email: props.initialValues?.email || '',
  role: props.initialValues?.role || 'user',
  birthDate: props.initialValues?.birthDate || null,
});

const rules: FormRules = {
  name: [
    {
      required: true,
      message: '请输入姓名',
      trigger: ['blur', 'input'],
    },
    {
      min: 2,
      message: '姓名至少2个字符',
      trigger: ['blur', 'input'],
    },
  ],
  email: [
    {
      required: true,
      message: '请输入邮箱',
      trigger: ['blur', 'input'],
    },
    {
      type: 'email',
      message: '邮箱格式不正确',
      trigger: ['blur', 'input'],
    },
  ],
  role: {
    required: true,
    message: '请选择角色',
    trigger: ['blur', 'change'],
  },
};

const roleOptions = [
  {
    label: '管理员',
    value: 'admin',
  },
  {
    label: '用户',
    value: 'user',
  },
  {
    label: '访客',
    value: 'guest',
  },
];

const handleSubmit = () => {
  formRef.value?.validate((errors) => {
    if (!errors) {
      emit('submit', formValue.value);
      message.success('表单提交成功');
    } else {
      message.error('表单验证失败');
    }
  });
};

const handleReset = () => {
  formRef.value?.restoreValidation();
  formValue.value = {
    name: '',
    email: '',
    role: 'user',
    birthDate: null,
  };
};
</script>

<template>
  <NForm
    ref="formRef"
    :model="formValue"
    :rules="rules"
    label-placement="left"
    label-width="auto"
  >
    <NFormItem label="姓名" path="name">
      <NInput v-model:value="formValue.name" placeholder="请输入姓名" />
    </NFormItem>

    <NFormItem label="邮箱" path="email">
      <NInput v-model:value="formValue.email" placeholder="请输入邮箱" />
    </NFormItem>

    <NFormItem label="角色" path="role">
      <NSelect
        v-model:value="formValue.role"
        :options="roleOptions"
        placeholder="选择角色"
      />
    </NFormItem>

    <NFormItem label="出生日期" path="birthDate">
      <NDatePicker
        v-model:value="formValue.birthDate"
        type="date"
        placeholder="选择日期"
      />
    </NFormItem>

    <NSpace justify="end">
      <NButton @click="handleReset">重置</NButton>
      <NButton type="primary" @click="handleSubmit">提交</NButton>
    </NSpace>
  </NForm>
</template>
```

### Composables

```ts
// src/composables/useMessage.ts
import { useMessage } from 'naive-ui';

export function useMessageNotification() {
  const message = useMessage();

  const showSuccess = (content: string) => {
    message.success(content);
  };

  const showError = (content: string) => {
    message.error(content);
  };

  const showWarning = (content: string) => {
    message.warning(content);
  };

  const showInfo = (content: string) => {
    message.info(content);
  };

  const showLoading = (content: string) => {
    return message.loading(content);
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
  };
}
```

```ts
// src/composables/useDialog.ts
import { useDialog } from 'naive-ui';

export function useConfirmDialog() {
  const dialog = useDialog();

  const confirm = (
    title: string,
    content: string,
    onConfirm: () => void,
    type: 'error' | 'warning' | 'info' | 'success' = 'warning'
  ) => {
    dialog[type]({
      title,
      content,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: onConfirm,
    });
  };

  const confirmDelete = (content: string, onConfirm: () => void) => {
    confirm('确认删除', content, onConfirm, 'error');
  };

  return {
    confirm,
    confirmDelete,
  };
}
```

### 路由配置

```ts
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import { NProgress } from 'naive-ui';

const routes = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: {
      title: '仪表盘',
      requiresAuth: true,
    },
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('@/views/Users.vue'),
    meta: {
      title: '用户管理',
      requiresAuth: true,
    },
    children: [
      {
        path: 'list',
        name: 'UserList',
        component: () => import('@/views/users/UserList.vue'),
      },
      {
        path: 'roles',
        name: 'Roles',
        component: () => import('@/views/users/Roles.vue'),
      },
    ],
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue'),
    meta: {
      title: '系统设置',
      requiresAuth: true,
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫
router.beforeEach((to, from, next) => {
  NProgress.start();

  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - MyApp`;
  }

  // 权限检查
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('token');
    if (!token) {
      next('/login');
      return;
    }
  }

  next();
});

router.afterEach(() => {
  NProgress.done();
});

export default router;
```

### 状态管理

```ts
// src/stores/user.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUserStore = defineStore('user', () => {
  const user = ref<any>(null);
  const token = ref<string | null>(null);
  const permissions = ref<string[]>([]);

  const setUser = (userData: any) => {
    user.value = userData;
  };

  const setToken = (tokenValue: string) => {
    token.value = tokenValue;
    localStorage.setItem('token', tokenValue);
  };

  const setPermissions = (permissionList: string[]) => {
    permissions.value = permissionList;
  };

  const logout = () => {
    user.value = null;
    token.value = null;
    permissions.value = [];
    localStorage.removeItem('token');
  };

  const hasPermission = (permission: string): boolean => {
    return permissions.value.includes(permission);
  };

  return {
    user,
    token,
    permissions,
    setUser,
    setToken,
    setPermissions,
    logout,
    hasPermission,
  };
});
```

## 最佳实践

### 1. 主题定制

```ts
// src/theme.ts
import { GlobalThemeOverrides } from 'naive-ui';

export const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#18a058',
    primaryColorHover: '#36ad6a',
    primaryColorPressed: '#0c7a43',
    primaryColorSuppl: '#36ad6a',
  },
  Button: {
    borderRadiusMedium: '8px',
  },
  Input: {
    borderRadius: '8px',
  },
  Card: {
    borderRadius: '12px',
  },
};
```

### 2. 权限指令

```ts
// src/directives/permission.ts
import { Directive } from 'vue';
import { useUserStore } from '@/stores/user';

export const permission: Directive = {
  mounted(el, binding) {
    const userStore = useUserStore();
    const permission = binding.value;

    if (!userStore.hasPermission(permission)) {
      el.style.display = 'none';
    }
  },
};

// 注册
app.directive('permission', permission);

// 使用
<n-button v-permission="'user:delete'" type="error">删除</n-button>
```

### 3. 数据导出

```ts
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

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { NUpload, NButton, useMessage, UploadFileInfo } from 'naive-ui';

const message = useMessage();
const fileList = ref<UploadFileInfo[]>([]);

const handleBeforeUpload = (data: { file: UploadFileInfo }) => {
  if (data.file.file?.size && data.file.file.size > 10485760) {
    message.error('文件大小不能超过10MB');
    return false;
  }
  return true;
};

const handleFinish = ({ file, event }: { file: UploadFileInfo; event?: ProgressEvent }) => {
  const response = JSON.parse((event?.target as XMLHttpRequest).response);
  file.url = response.url;
  message.success('文件上传成功');
};

const handleError = () => {
  message.error('文件上传失败');
};
</script>

<template>
  <NUpload
    v-model:file-list="fileList"
    action="/api/upload"
    :max="5"
    :before-upload="handleBeforeUpload"
    @finish="handleFinish"
    @error="handleError"
  >
    <NButton>上传文件</NButton>
  </NUpload>
</template>
```

### 5. 虚拟滚动

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { NVirtualList } from 'naive-ui';

const items = ref(
  Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    text: `Item ${i}`,
  }))
);

const itemSize = 50;
</script>

<template>
  <div style="height: 400px;">
    <NVirtualList
      :items="items"
      :item-size="itemSize"
      item-resizable
    >
      <template #default="{ item }">
        <div :style="{ height: `${itemSize}px` }" class="flex items-center px-4 border-b">
          {{ item.text }}
        </div>
      </template>
    </NVirtualList>
  </div>
</template>
```

## 常用命令

### 开发

```bash
# 安装依赖
npm install naive-ui @vicons/ionicons5 vue-router pinia vueuse

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
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
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

### 1. 按需引入

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers';

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [NaiveUiResolver()],
    }),
  ],
});
```

### 2. 代码分割

```ts
const routes = [
  {
    path: '/dashboard',
    component: () => import(/* webpackChunkName: "dashboard" */ '@/views/Dashboard.vue'),
  },
];
```

### 3. 防抖和节流

```ts
import { useDebounceFn, useThrottleFn } from '@vueuse/core';

const handleSearch = useDebounceFn((value: string) => {
  // 搜索逻辑
}, 300);

const handleClick = useThrottleFn(() => {
  // 点击逻辑
}, 1000);
```
