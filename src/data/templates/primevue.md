# PrimeVue UI 组件库模板

## 技术栈

- **PrimeVue**: Vue 3 UI 组件库
- **Vue 3**: 渐进式 JavaScript 框架
- **TypeScript**: 类型支持
- **Vite**: 下一代前端构建工具
- **PrimeIcons**: 图标库
- **Tailwind CSS**: 原子化 CSS 框架（可选）

## 项目结构

```
primevue-app/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── AppLayout.vue
│   │   │   ├── AppHeader.vue
│   │   │   ├── AppSidebar.vue
│   │   │   └── AppFooter.vue
│   │   ├── Forms/
│   │   │   ├── UserForm.vue
│   │   │   └── SearchForm.vue
│   │   ├── Tables/
│   │   │   ├── DataTable.vue
│   │   │   └── EditTable.vue
│   │   └── Dialogs/
│   │       ├── ConfirmDialog.vue
│   │       └── FormDialog.vue
│   ├── composables/
│   │   ├── usePrimeToast.ts
│   │   └── useConfirm.ts
│   ├── views/
│   │   ├── Dashboard.vue
│   │   ├── Users.vue
│   │   └── Settings.vue
│   ├── router/
│   │   └── index.ts
│   ├── stores/
│   │   └── user.ts
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
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import Tooltip from 'primevue/tooltip';

import App from './App.vue';
import router from './router';

import 'primeicons/primeicons.css';
import './styles/main.css';

const app = createApp(App);

// PrimeVue 配置
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark-mode',
      cssLayer: false
    }
  },
  ripple: true,
  inputVariant: 'filled'
});

// 服务
app.use(ToastService);
app.use(ConfirmationService);

// 指令
app.directive('tooltip', Tooltip);

// 路由
app.use(router);

app.mount('#app');
```

### App 组件

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import AppLayout from './components/Layout/AppLayout.vue';

const confirm = useConfirm();
const toast = useToast();
</script>

<template>
  <AppLayout>
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </AppLayout>
  
  <Toast position="top-right" />
  <ConfirmDialog />
  <DynamicDialog />
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
import AppHeader from './AppHeader.vue';
import AppSidebar from './AppSidebar.vue';
import AppFooter from './AppFooter.vue';

const sidebarVisible = ref(true);

const toggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value;
};
</script>

<template>
  <div class="app-layout flex h-screen">
    <!-- Sidebar -->
    <AppSidebar :visible="sidebarVisible" />
    
    <!-- Main Content -->
    <div class="flex-1 flex flex-col">
      <AppHeader @toggle-sidebar="toggleSidebar" />
      
      <main class="flex-1 overflow-y-auto p-6 bg-gray-50">
        <slot />
      </main>
      
      <AppFooter />
    </div>
  </div>
</template>
```

```vue
<!-- src/components/Layout/AppSidebar.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

interface Props {
  visible: boolean;
}

defineProps<Props>();

const router = useRouter();
const expandedMenus = ref<string[]>([]);

const menuItems = [
  {
    label: '仪表盘',
    icon: 'pi pi-home',
    to: '/dashboard'
  },
  {
    label: '用户管理',
    icon: 'pi pi-users',
    items: [
      { label: '用户列表', to: '/users' },
      { label: '角色管理', to: '/roles' },
      { label: '权限设置', to: '/permissions' }
    ]
  },
  {
    label: '系统设置',
    icon: 'pi pi-cog',
    items: [
      { label: '基本设置', to: '/settings' },
      { label: '日志管理', to: '/logs' }
    ]
  }
];

const toggleMenu = (label: string) => {
  const index = expandedMenus.value.indexOf(label);
  if (index > -1) {
    expandedMenus.value.splice(index, 1);
  } else {
    expandedMenus.value.push(label);
  }
};
</script>

<template>
  <aside 
    :class="[
      'sidebar bg-white border-r border-gray-200 transition-all duration-300',
      visible ? 'w-64' : 'w-0 overflow-hidden'
    ]"
  >
    <div class="p-4 border-b border-gray-200">
      <h1 class="text-xl font-bold text-primary">管理系统</h1>
    </div>
    
    <nav class="p-2">
      <template v-for="item in menuItems" :key="item.label">
        <!-- 有子菜单 -->
        <template v-if="item.items">
          <button
            @click="toggleMenu(item.label)"
            class="w-full flex items-center justify-between px-4 py-3 rounded hover:bg-gray-100"
          >
            <div class="flex items-center gap-3">
              <i :class="item.icon"></i>
              <span>{{ item.label }}</span>
            </div>
            <i 
              :class="[
                'pi pi-chevron-down transition-transform',
                expandedMenus.includes(item.label) && 'rotate-180'
              ]"
            ></i>
          </button>
          
          <div v-show="expandedMenus.includes(item.label)" class="ml-4">
            <router-link
              v-for="subItem in item.items"
              :key="subItem.label"
              :to="subItem.to"
              class="block px-4 py-2 rounded hover:bg-gray-100"
              active-class="bg-primary-50 text-primary"
            >
              {{ subItem.label }}
            </router-link>
          </div>
        </template>
        
        <!-- 无子菜单 -->
        <router-link
          v-else
          :to="item.to"
          class="flex items-center gap-3 px-4 py-3 rounded hover:bg-gray-100"
          active-class="bg-primary-50 text-primary"
        >
          <i :class="item.icon"></i>
          <span>{{ item.label }}</span>
        </router-link>
      </template>
    </nav>
  </aside>
</template>
```

### 数据表格

```vue
<!-- src/components/Tables/DataTable.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { FilterMatchMode } from 'primevue/api';
import { useToast } from 'primevue/usetoast';
import type { User } from '@/types';

const toast = useToast();

const users = ref<User[]>([]);
const selectedUsers = ref<User[]>([]);
const loading = ref(false);
const totalRecords = ref(0);

// 过滤器
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  email: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// 分页
const lazyParams = ref({
  first: 0,
  rows: 10,
  sortField: 'createdAt',
  sortOrder: -1
});

// 列定义
const columns = [
  { field: 'name', header: '姓名', sortable: true },
  { field: 'email', header: '邮箱', sortable: true },
  { field: 'role', header: '角色', sortable: true },
  { field: 'status', header: '状态', sortable: true },
  { field: 'createdAt', header: '创建时间', sortable: true }
];

// 加载数据
const loadLazyData = async () => {
  loading.value = true;
  
  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...lazyParams.value,
        filters: filters.value
      })
    });
    
    const data = await response.json();
    users.value = data.users;
    totalRecords.value = data.total;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: '错误',
      detail: '加载数据失败',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

// 页面变化
const onPage = (event: any) => {
  lazyParams.value = event;
  loadLazyData();
};

// 排序
const onSort = (event: any) => {
  lazyParams.value = event;
  loadLazyData();
};

// 过滤
const onFilter = () => {
  lazyParams.value.first = 0;
  loadLazyData();
};

// 删除选中
const deleteSelected = () => {
  // 确认对话框
  // ...
};

onMounted(() => {
  loadLazyData();
});
</script>

<template>
  <div class="card">
    <Toolbar>
      <template #start>
        <Button
          label="新增"
          icon="pi pi-plus"
          class="mr-2"
          @click="$emit('create')"
        />
        <Button
          label="删除选中"
          icon="pi pi-trash"
          severity="danger"
          outlined
          :disabled="!selectedUsers.length"
          @click="deleteSelected"
        />
      </template>
      
      <template #end>
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="filters.global.value"
            placeholder="搜索..."
            @input="onFilter"
          />
        </IconField>
      </template>
    </Toolbar>
    
    <DataTable
      v-model:selection="selectedUsers"
      :value="users"
      :loading="loading"
      :total-records="totalRecords"
      :lazy="true"
      :paginator="true"
      :rows="lazyParams.rows"
      :first="lazyParams.first"
      :rows-per-page-options="[10, 20, 50]"
      :sort-field="lazyParams.sortField"
      :sort-order="lazyParams.sortOrder"
      :filters="filters"
      filter-display="menu"
      data-key="id"
      responsive-layout="scroll"
      @page="onPage"
      @sort="onSort"
      @filter="onFilter"
    >
      <Column selection-mode="multiple" header-style="width: 3rem" />
      
      <Column
        v-for="col in columns"
        :key="col.field"
        :field="col.field"
        :header="col.header"
        :sortable="col.sortable"
      >
        <template #body="{ data }">
          <template v-if="col.field === 'status'">
            <Tag
              :value="data.status"
              :severity="data.status === 'active' ? 'success' : 'danger'"
            />
          </template>
          <template v-else-if="col.field === 'createdAt'">
            {{ new Date(data.createdAt).toLocaleDateString('zh-CN') }}
          </template>
          <template v-else>
            {{ data[col.field] }}
          </template>
        </template>
        
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            placeholder="搜索..."
            @input="filterCallback"
          />
        </template>
      </Column>
      
      <Column header="操作" frozen align-frozen="right">
        <template #body="{ data }">
          <Button
            icon="pi pi-pencil"
            severity="info"
            text
            rounded
            @click="$emit('edit', data)"
          />
          <Button
            icon="pi pi-trash"
            severity="danger"
            text
            rounded
            @click="$emit('delete', data)"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>
```

### 表单组件

```vue
<!-- src/components/Forms/UserForm.vue -->
<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { required, email, minLength } from '@vuelidate/validators';
import { useToast } from 'primevue/usetoast';
import type { User } from '@/types';

interface Props {
  user?: User;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  submit: [data: any];
  cancel: [];
}>();

const toast = useToast();

// 表单数据
const formData = reactive({
  name: props.user?.name || '',
  email: props.user?.email || '',
  role: props.user?.role || 'user',
  status: props.user?.status || 'active',
  password: '',
  confirmPassword: ''
});

// 验证规则
const rules = {
  name: { required, minLength: minLength(2) },
  email: { required, email },
  role: { required },
  password: props.user ? {} : { required, minLength: minLength(6) },
  confirmPassword: {
    required: !props.user,
    sameAs: (value: string) => value === formData.password
  }
};

const v$ = useVuelidate(rules, formData);

// 角色选项
const roleOptions = [
  { label: '管理员', value: 'admin' },
  { label: '用户', value: 'user' },
  { label: '访客', value: 'guest' }
];

// 状态选项
const statusOptions = [
  { label: '启用', value: 'active' },
  { label: '禁用', value: 'inactive' }
];

// 提交
const handleSubmit = async () => {
  const isvalid = await v$.value.$validate();
  
  if (!isValid) {
    toast.add({
      severity: 'warn',
      summary: '验证失败',
      detail: '请检查表单填写',
      life: 3000
    });
    return;
  }
  
  emit('submit', formData);
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="grid grid-cols-2 gap-4">
    <!-- 姓名 -->
    <div class="field col-span-2">
      <label for="name" class="block mb-2 font-medium">
        姓名 <span class="text-red-500">*</span>
      </label>
      <InputText
        id="name"
        v-model="formData.name"
        :invalid="v$.name.$error"
        class="w-full"
        placeholder="请输入姓名"
      />
      <small v-if="v$.name.$error" class="text-red-500">
        <template v-if="v$.name.required.$invalid">姓名必填</template>
        <template v-else-if="v$.name.minLength.$invalid">姓名至少2个字符</template>
      </small>
    </div>
    
    <!-- 邮箱 -->
    <div class="field col-span-2">
      <label for="email" class="block mb-2 font-medium">
        邮箱 <span class="text-red-500">*</span>
      </label>
      <InputText
        id="email"
        v-model="formData.email"
        type="email"
        :invalid="v$.email.$error"
        class="w-full"
        placeholder="请输入邮箱"
      />
      <small v-if="v$.email.$error" class="text-red-500">
        <template v-if="v$.email.required.$invalid">邮箱必填</template>
        <template v-else-if="v$.email.email.$invalid">邮箱格式不正确</template>
      </small>
    </div>
    
    <!-- 角色 -->
    <div class="field">
      <label for="role" class="block mb-2 font-medium">
        角色 <span class="text-red-500">*</span>
      </label>
      <Select
        id="role"
        v-model="formData.role"
        :options="roleOptions"
        option-label="label"
        option-value="value"
        placeholder="选择角色"
        class="w-full"
      />
    </div>
    
    <!-- 状态 -->
    <div class="field">
      <label for="status" class="block mb-2 font-medium">
        状态
      </label>
      <Select
        id="status"
        v-model="formData.status"
        :options="statusOptions"
        option-label="label"
        option-value="value"
        placeholder="选择状态"
        class="w-full"
      />
    </div>
    
    <!-- 密码 -->
    <div class="field">
      <label for="password" class="block mb-2 font-medium">
        密码 <span v-if="!user" class="text-red-500">*</span>
      </label>
      <Password
        id="password"
        v-model="formData.password"
        :feedback="true"
        toggle-mask
        :invalid="v$.password.$error"
        class="w-full"
        input-class="w-full"
        placeholder="请输入密码"
      />
      <small v-if="v$.password.$error" class="text-red-500">
        <template v-if="v$.password.required.$invalid">密码必填</template>
        <template v-else-if="v$.password.minLength.$invalid">密码至少6位</template>
      </small>
    </div>
    
    <!-- 确认密码 -->
    <div class="field">
      <label for="confirmPassword" class="block mb-2 font-medium">
        确认密码 <span v-if="!user" class="text-red-500">*</span>
      </label>
      <Password
        id="confirmPassword"
        v-model="formData.confirmPassword"
        :feedback="false"
        toggle-mask
        :invalid="v$.confirmPassword.$error"
        class="w-full"
        input-class="w-full"
        placeholder="请再次输入密码"
      />
      <small v-if="v$.confirmPassword.$error" class="text-red-500">
        两次密码不一致
      </small>
    </div>
    
    <!-- 按钮 -->
    <div class="field col-span-2 flex justify-end gap-2">
      <Button
        label="取消"
        severity="secondary"
        outlined
        @click="emit('cancel')"
      />
      <Button
        label="保存"
        type="submit"
        icon="pi pi-check"
      />
    </div>
  </form>
</template>
```

### 对话框

```vue
<!-- src/components/Dialogs/FormDialog.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue';
import UserForm from '../Forms/UserForm.vue';
import type { User } from '@/types';

interface Props {
  visible: boolean;
  user?: User;
  loading?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:visible': [value: boolean];
  submit: [data: any];
}>();

const dialogVisible = ref(props.visible);

watch(() => props.visible, (val) => {
  dialogVisible.value = val;
});

watch(dialogVisible, (val) => {
  emit('update:visible', val);
});

const handleSubmit = (data: any) => {
  emit('submit', data);
};
</script>

<template>
  <Dialog
    v-model:visible="dialogVisible"
    :header="user ? '编辑用户' : '新增用户'"
    :style="{ width: '600px' }"
    :modal="true"
    :closable="!loading"
    :close-on-escape="!loading"
  >
    <UserForm
      :user="user"
      @submit="handleSubmit"
      @cancel="dialogVisible = false"
    />
    
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="取消"
          severity="secondary"
          outlined
          :disabled="loading"
          @click="dialogVisible = false"
        />
        <Button
          label="保存"
          icon="pi pi-check"
          :loading="loading"
          autofocus
        />
      </div>
    </template>
  </Dialog>
</template>
```

### Composables

```ts
// src/composables/usePrimeToast.ts
import { useToast } from 'primevue/usetoast';

export function usePrimeToast() {
  const toast = useToast();

  const showSuccess = (message: string, summary = '成功') => {
    toast.add({
      severity: 'success',
      summary,
      detail: message,
      life: 3000
    });
  };

  const showError = (message: string, summary = '错误') => {
    toast.add({
      severity: 'error',
      summary,
      detail: message,
      life: 5000
    });
  };

  const showInfo = (message: string, summary = '提示') => {
    toast.add({
      severity: 'info',
      summary,
      detail: message,
      life: 3000
    });
  };

  const showWarn = (message: string, summary = '警告') => {
    toast.add({
      severity: 'warn',
      summary,
      detail: message,
      life: 4000
    });
  };

  return {
    showSuccess,
    showError,
    showInfo,
    showWarn
  };
}
```

```ts
// src/composables/useConfirm.ts
import { useConfirm } from 'primevue/useconfirm';

export function usePrimeConfirm() {
  const confirm = useConfirm();

  const confirmDelete = (message: string, accept: () => void) => {
    confirm.require({
      message,
      header: '确认删除',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '删除',
      rejectLabel: '取消',
      acceptClass: 'p-button-danger',
      accept,
      reject: () => {}
    });
  };

  const confirmAction = (
    message: string,
    accept: () => void,
    header = '确认操作'
  ) => {
    confirm.require({
      message,
      header,
      icon: 'pi pi-question-circle',
      acceptLabel: '确定',
      rejectLabel: '取消',
      accept,
      reject: () => {}
    });
  };

  return {
    confirmDelete,
    confirmAction
  };
}
```

### 图表集成

```vue
<!-- src/components/Charts/DashboardChart.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Chart from 'primevue/chart';

const chartData = ref<any>(null);
const chartOptions = ref<any>(null);

const setChartData = () => {
  return {
    labels: ['一月', '二月', '三月', '四月', '五月', '六月'],
    datasets: [
      {
        label: '用户增长',
        data: [65, 59, 80, 81, 56, 55],
        fill: false,
        borderColor: '#42A5F5',
        tension: 0.4
      },
      {
        label: '活跃用户',
        data: [28, 48, 40, 19, 86, 27],
        fill: false,
        borderColor: '#FFA726',
        tension: 0.4
      }
    ]
  };
};

const setChartOptions = () => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true
      }
    }
  };
};

onMounted(() => {
  chartData.value = setChartData();
  chartOptions.value = setChartOptions();
});
</script>

<template>
  <div class="card">
    <h3 class="mb-4">数据统计</h3>
    <Chart
      type="line"
      :data="chartData"
      :options="chartOptions"
      class="h-[400px]"
    />
  </div>
</template>
```

## 最佳实践

### 1. 主题定制

```ts
// src/themes/custom.ts
import { definePreset } from '@primevue/themes';
import Aura from '@primevue/themes/aura';

const MyPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{indigo.50}',
      100: '{indigo.100}',
      200: '{indigo.200}',
      300: '{indigo.300}',
      400: '{indigo.400}',
      500: '{indigo.500}',
      600: '{indigo.600}',
      700: '{indigo.700}',
      800: '{indigo.800}',
      900: '{indigo.900}',
      950: '{indigo.950}'
    }
  },
  components: {
    button: {
      borderRadius: '8px'
    },
    inputtext: {
      borderRadius: '8px'
    }
  }
});

export default MyPreset;
```

### 2. 全局过滤器

```ts
// src/filters/index.ts
import { FilterMatchMode } from 'primevue/api';

export const globalFilters = {
  init: () => {
    FilterMatchMode.CONTAINS = 'contains';
    FilterMatchMode.STARTS_WITH = 'startsWith';
    FilterMatchMode.ENDS_WITH = 'endsWith';
    FilterMatchMode.EQUALS = 'equals';
    FilterMatchMode.NOT_EQUALS = 'notEquals';
    FilterMatchMode.IN = 'in';
    FilterMatchMode.LESS_THAN = 'lt';
    FilterMatchMode.LESS_THAN_OR_EQUAL_TO = 'lte';
    FilterMatchMode.GREATER_THAN = 'gt';
    FilterMatchMode.GREATER_THAN_OR_EQUAL_TO = 'gte';
    FilterMatchMode.BETWEEN = 'between';
    FilterMatchMode.DATE_IS = 'dateIs';
    FilterMatchMode.DATE_IS_NOT = 'dateIsNot';
    FilterMatchMode.DATE_BEFORE = 'dateBefore';
    FilterMatchMode.DATE_AFTER = 'dateAfter';
  }
};
```

### 3. 权限指令

```ts
// src/directives/permission.ts
import { DirectiveBinding } from 'vue';

export const permissionDirective = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding;
    const permissions = localStorage.getItem('permissions')?.split(',') || [];
    
    if (!permissions.includes(value)) {
      el.style.display = 'none';
    }
  }
};

// 注册
app.directive('permission', permissionDirective);

// 使用
<Button v-permission="'user:delete'" label="删除" />
```

### 4. 表格导出

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

### 5. 文件上传

```vue
<script setup lang="ts">
import { ref } from 'vue';
import FileUpload from 'primevue/fileupload';
import ProgressBar from 'primevue/progressbar';
import { usePrimeToast } from '@/composables/usePrimeToast';

const { showSuccess, showError } = usePrimeToast();
const uploadedFiles = ref<any[]>([]);
const progress = ref(0);

const onUpload = async (event: any) => {
  try {
    const response = JSON.parse(event.xhr.response);
    uploadedFiles.value.push(response.file);
    showSuccess('文件上传成功');
  } catch (error) {
    showError('文件上传失败');
  }
};

const onProgress = (event: any) => {
  progress.value = event.progress;
};

const onError = () => {
  showError('文件上传失败');
};
</script>

<template>
  <FileUpload
    mode="advanced"
    name="file"
    url="/api/upload"
    accept="image/*,.pdf"
    :max-file-size="10000000"
    :multiple="true"
    :auto="true"
    @upload="onUpload"
    @progress="onProgress"
    @error="onError"
  >
    <template #empty>
      <p>拖拽文件到此处或点击上传</p>
    </template>
    
    <template #content>
      <div v-if="progress > 0 && progress < 100" class="my-2">
        <ProgressBar :value="progress" />
      </div>
      
      <div v-for="file in uploadedFiles" :key="file.id" class="p-2">
        {{ file.name }}
      </div>
    </template>
  </FileUpload>
</template>
```

## 常用命令

### 开发

```bash
# 安装依赖
npm install primevue primeicons @primevue/themes
npm install -D @types/node

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
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
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

### 1. 按需导入

```ts
// src/plugins/primevue.ts
import { defineAsyncComponent } from 'vue';

export function registerPrimeComponents(app: any) {
  const components = import.meta.glob('primevue/**/index.vue');
  
  for (const [path, component] of Object.entries(components)) {
    const name = path.split('/')[1];
    app.component(
      `P${name}`,
      defineAsyncComponent(component as any)
    );
  }
}
```

### 2. 虚拟滚动

```vue
<DataTable
  :value="largeDataset"
  :virtual-scroller-options="{ itemSize: 46 }"
  scroll-height="400px"
  scrollable
>
  <!-- columns -->
</DataTable>
```

### 3. 懒加载

```vue
<TabView lazy>
  <TabPanel header="标签1">
    <!-- 内容不会立即渲染 -->
  </TabPanel>
</TabView>
```
