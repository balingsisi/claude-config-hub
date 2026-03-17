# Quasar Framework - Vue 3 跨平台应用框架

## 技术栈

- **核心**: Quasar Framework 2.x
- **Vue版本**: Vue 3.x
- **构建工具**: Vite / Webpack
- **类型支持**: TypeScript
- **样式**: Sass/SCSS + Material Design
- **平台**: SPA, SSR, PWA, Mobile App, Desktop App, Browser Extension

## 项目结构

```
src/
├── boot/                   # 启动文件
│   ├── axios.ts           # Axios配置
│   └── auth.ts            # 认证初始化
├── components/
│   ├── layout/
│   │   ├── MainLayout.vue # 主布局
│   │   └── Header.vue     # 头部组件
│   └── common/
│       └── DataCard.vue   # 数据卡片
├── composables/
│   ├── useAuth.ts         # 认证逻辑
│   └── useNotify.ts       # 通知逻辑
├── pages/
│   ├── index.vue          # 首页
│   └── dashboard.vue      # 仪表板
├── router/
│   └── routes.ts          # 路由配置
├── stores/
│   ├── index.ts           # Store初始化
│   └── user.ts            # 用户Store
├── css/
│   ├── app.scss           # 全局样式
│   └── quasar.variables.scss # Quasar变量
├── App.vue                # 根组件
└── main.ts                # 应用入口
```

## 代码模式

### 1. Quasar配置

```typescript
// quasar.config.ts
import { configure } from 'quasar/wrappers'

export default configure(function (ctx) {
  return {
    boot: ['axios', 'auth'],
    css: ['app.scss'],
    extras: ['roboto-font', 'material-icons'],
    build: {
      vueRouterMode: 'history',
      extendViteConf(viteConf) {
        viteConf.resolve = viteConf.resolve || {}
        viteConf.resolve.alias = {
          ...viteConf.resolve.alias,
          '@': '/src'
        }
      }
    },
    devServer: {
      open: true,
      port: 9000
    },
    framework: {
      config: {
        brand: {
          primary: '#1976D2',
          secondary: '#424242',
          accent: '#82B1FF',
          positive: '#21BA45',
          negative: '#C10015',
          info: '#31CCEC',
          warning: '#F2C037'
        },
        notify: {
          position: 'top-right',
          timeout: 3000
        }
      },
      iconSet: 'material-icons',
      lang: 'en-US',
      components: [
        'QBtn', 'QCard', 'QInput', 'QTable',
        'QDialog', 'QLayout', 'QHeader', 'QDrawer',
        'QPageContainer', 'QPage', 'QToolbar', 'QToolbarTitle',
        'QIcon', 'QAvatar', 'QBadge', 'QChip',
        'QForm', 'QField', 'QSelect', 'QCheckbox',
        'QToggle', 'QRadio', 'QSlider', 'QRange',
        'QSpinner', 'QProgressBar', 'QLinearProgress',
        'QSeparator', 'QSpace', 'QTabs', 'QTab',
        'QRouteTab', 'QTabPanels', 'QTabPanel',
        'QList', 'QItem', 'QItemSection', 'QItemLabel',
        'QExpansionItem', 'QMarkupTable', 'QTh', 'QTr', 'QTd'
      ],
      directives: ['Ripple', 'ClosePopup', 'Intersection']
    },
    animations: ['fadeIn', 'fadeOut', 'slideInRight', 'slideOutRight'],
    ssr: {
      pwa: false
    },
    pwa: {
      workboxMode: 'generateSW',
      injectPwaMetaTags: true,
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json'
    },
    capacitor: {
      hideSplashscreen: true
    },
    electron: {
      bundler: 'packager'
    }
  }
})
```

### 2. 主布局组件

```vue
<!-- src/components/layout/MainLayout.vue -->
<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />
        <q-toolbar-title>
          <q-avatar>
            <img src="~assets/logo.svg" />
          </q-avatar>
          Quasar App
        </q-toolbar-title>
        <q-space />
        <q-btn flat round icon="notifications">
          <q-badge color="red" floating>3</q-badge>
          <q-menu>
            <q-list style="min-width: 300px">
              <q-item v-for="n in 3" :key="n" clickable v-close-popup>
                <q-item-section avatar>
                  <q-avatar color="primary" text-color="white">
                    {{ n }}
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>Notification {{ n }}</q-item-label>
                  <q-item-label caption>Some description here</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        <q-btn flat round>
          <q-avatar size="36px">
            <img :src="userAvatar" />
          </q-avatar>
          <q-menu>
            <q-list style="min-width: 150px">
              <q-item clickable v-close-popup to="/profile">
                <q-item-section avatar>
                  <q-icon name="person" />
                </q-item-section>
                <q-item-section>Profile</q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup @click="logout">
                <q-item-section avatar>
                  <q-icon name="logout" />
                </q-item-section>
                <q-item-section>Logout</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      :width="260"
      :breakpoint="1024"
      elevated
      class="bg-grey-2"
    >
      <q-scroll-area class="fit">
        <q-list>
          <q-item-label header>Navigation</q-item-label>
          <q-item
            v-for="link in menuLinks"
            :key="link.title"
            :to="link.link"
            clickable
            v-ripple
          >
            <q-item-section avatar>
              <q-icon :name="link.icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ link.title }}</q-item-label>
              <q-item-label caption>{{ link.caption }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition
          enter-active-class="animated fadeIn"
          leave-active-class="animated fadeOut"
          mode="out-in"
        >
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/user'

const $q = useQuasar()
const authStore = useAuthStore()
const leftDrawerOpen = ref(false)

const userAvatar = computed(() => authStore.user?.avatar || 'https://cdn.quasar.dev/logo-v2/svg/logo.svg')

const menuLinks = [
  { title: 'Dashboard', caption: 'Overview', icon: 'dashboard', link: '/dashboard' },
  { title: 'Users', caption: 'Manage users', icon: 'people', link: '/users' },
  { title: 'Settings', caption: 'App settings', icon: 'settings', link: '/settings' }
]

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function logout() {
  $q.dialog({
    title: 'Confirm Logout',
    message: 'Are you sure you want to logout?',
    cancel: true,
    persistent: true
  }).onOk(() => {
    authStore.logout()
    window.location.href = '/login'
  })
}
</script>
```

### 3. 数据表格页面

```vue
<!-- src/pages/users.vue -->
<template>
  <q-page padding>
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6">Users Management</div>
      </q-card-section>
    </q-card>

    <q-card>
      <q-table
        v-model:selected="selected"
        v-model:pagination="pagination"
        :rows="users"
        :columns="columns"
        :loading="loading"
        :filter="filter"
        row-key="id"
        selection="multiple"
        flat
        @request="onRequest"
      >
        <template #top>
          <q-input
            v-model="filter"
            dense
            debounce="300"
            placeholder="Search..."
            class="q-mr-md"
            style="min-width: 250px"
          >
            <template #append>
              <q-icon name="search" />
            </template>
          </q-input>
          <q-space />
          <q-btn
            color="primary"
            icon="add"
            label="Add User"
            @click="openDialog()"
          />
          <q-btn
            v-if="selected.length > 0"
            color="negative"
            icon="delete"
            label="Delete Selected"
            class="q-ml-sm"
            @click="deleteSelected"
          />
        </template>

        <template #body-cell-avatar="{ row }">
          <q-td>
            <q-avatar size="32px">
              <img :src="row.avatar" />
            </q-avatar>
          </q-td>
        </template>

        <template #body-cell-status="{ row }">
          <q-td>
            <q-badge
              :color="row.status === 'active' ? 'positive' : 'negative'"
              :label="row.status"
            />
          </q-td>
        </template>

        <template #body-cell-actions="{ row }">
          <q-td>
            <q-btn flat round icon="edit" size="sm" @click="openDialog(row)" />
            <q-btn flat round icon="delete" size="sm" color="negative" @click="deleteUser(row)" />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ editingUser ? 'Edit User' : 'Add User' }}</div>
        </q-card-section>

        <q-card-section>
          <q-form ref="formRef" @submit="saveUser">
            <q-input
              v-model="formData.name"
              label="Name"
              :rules="[val => !!val || 'Name is required']"
              class="q-mb-md"
            />
            <q-input
              v-model="formData.email"
              label="Email"
              type="email"
              :rules="[val => !!val || 'Email is required', val => isValidEmail(val) || 'Invalid email']"
              class="q-mb-md"
            />
            <q-select
              v-model="formData.role"
              label="Role"
              :options="roleOptions"
              :rules="[val => !!val || 'Role is required']"
              class="q-mb-md"
            />
            <q-select
              v-model="formData.status"
              label="Status"
              :options="statusOptions"
              :rules="[val => !!val || 'Status is required']"
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Save" @click="saveUser" :loading="saving" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import type { QTableColumn, QForm } from 'quasar'

interface User {
  id: number
  name: string
  email: string
  role: string
  status: string
  avatar: string
}

const $q = useQuasar()
const loading = ref(false)
const saving = ref(false)
const users = ref<User[]>([])
const selected = ref<User[]>([])
const filter = ref('')
const showDialog = ref(false)
const editingUser = ref<User | null>(null)
const formRef = ref<QForm>()

const pagination = ref({
  sortBy: 'name',
  descending: false,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0
})

const formData = ref({
  name: '',
  email: '',
  role: '',
  status: 'active'
})

const columns: QTableColumn[] = [
  { name: 'avatar', label: '', field: 'avatar', align: 'left' },
  { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
  { name: 'email', label: 'Email', field: 'email', align: 'left', sortable: true },
  { name: 'role', label: 'Role', field: 'role', align: 'left', sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'center' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' }
]

const roleOptions = ['Admin', 'Editor', 'Viewer']
const statusOptions = ['active', 'inactive']

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function onRequest(props: any) {
  loading.value = true
  const { page, rowsPerPage, sortBy, descending } = props.pagination
  const { filter } = props

  try {
    const response = await fetchUsers({ page, rowsPerPage, sortBy, descending, filter })
    users.value = response.data
    pagination.value.rowsNumber = response.total
    pagination.value.page = page
    pagination.value.rowsPerPage = rowsPerPage
    pagination.value.sortBy = sortBy
    pagination.value.descending = descending
  } finally {
    loading.value = false
  }
}

function openDialog(user?: User) {
  if (user) {
    editingUser.value = user
    formData.value = { ...user }
  } else {
    editingUser.value = null
    formData.value = { name: '', email: '', role: '', status: 'active' }
  }
  showDialog.value = true
}

async function saveUser() {
  const valid = await formRef.value?.validate()
  if (!valid) return

  saving.value = true
  try {
    if (editingUser.value) {
      await updateUser(editingUser.value.id, formData.value)
      $q.notify({ type: 'positive', message: 'User updated successfully' })
    } else {
      await createUser(formData.value)
      $q.notify({ type: 'positive', message: 'User created successfully' })
    }
    showDialog.value = false
    onRequest({ pagination: pagination.value, filter: filter.value })
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Operation failed' })
  } finally {
    saving.value = false
  }
}

function deleteUser(user: User) {
  $q.dialog({
    title: 'Confirm Delete',
    message: `Delete user "${user.name}"?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await deleteUserApi(user.id)
    $q.notify({ type: 'positive', message: 'User deleted' })
    onRequest({ pagination: pagination.value, filter: filter.value })
  })
}

function deleteSelected() {
  $q.dialog({
    title: 'Confirm Delete',
    message: `Delete ${selected.value.length} selected users?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await Promise.all(selected.value.map(u => deleteUserApi(u.id)))
    $q.notify({ type: 'positive', message: 'Users deleted' })
    selected.value = []
    onRequest({ pagination: pagination.value, filter: filter.value })
  })
}

onMounted(() => {
  onRequest({ pagination: pagination.value, filter: '' })
})
</script>
```

### 4. Boot Files

```typescript
// src/boot/axios.ts
import { boot } from 'quasar/wrappers'
import axios from 'axios'
import { useAuthStore } from '@/stores/user'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000
})

api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      authStore.logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { axios, api }
```

```typescript
// src/boot/auth.ts
import { boot } from 'quasar/wrappers'
import { useAuthStore } from '@/stores/user'

export default boot(async ({ router }) => {
  const authStore = useAuthStore()

  // 尝试从本地存储恢复会话
  await authStore.initialize()

  router.beforeEach((to, from, next) => {
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      next({ name: 'login', query: { redirect: to.fullPath } })
    } else if (to.meta.guestOnly && authStore.isAuthenticated) {
      next({ name: 'dashboard' })
    } else {
      next()
    }
  })
})
```

### 5. Store

```typescript
// src/stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/boot/axios'
import { LocalStorage } from 'quasar'

interface User {
  id: number
  name: string
  email: string
  avatar?: string
  role: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(LocalStorage.getItem('token'))

  const isAuthenticated = computed(() => !!token.value)
  const userName = computed(() => user.value?.name ?? 'Guest')

  async function initialize() {
    if (token.value) {
      try {
        const { data } = await api.get('/user/me')
        user.value = data
      } catch {
        logout()
      }
    }
  }

  async function login(credentials: { email: string; password: string }) {
    const { data } = await api.post('/auth/login', credentials)
    token.value = data.token
    user.value = data.user
    LocalStorage.set('token', data.token)
    return data
  }

  function logout() {
    user.value = null
    token.value = null
    LocalStorage.remove('token')
  }

  async function updateProfile(userData: Partial<User>) {
    const { data } = await api.put('/user/me', userData)
    user.value = data
    return data
  }

  return {
    user,
    token,
    isAuthenticated,
    userName,
    initialize,
    login,
    logout,
    updateProfile
  }
})
```

## 最佳实践

### 1. 响应式设计

```vue
<script setup lang="ts">
import { useQuasar } from 'quasar'

const $q = useQuasar()
const { lt } = $q.screen

// 响应式值
const drawerWidth = computed(() => lt.md ? 280 : 300)
const showLabels = computed(() => !lt.sm)
</script>

<template>
  <q-drawer :width="drawerWidth">
    <!-- ... -->
  </q-drawer>
</template>
```

### 2. 主题配置

```scss
// src/css/quasar.variables.scss
$primary   : #1976D2;
$secondary : #424242;
$accent    : #82B1FF;

$dark      : #1d1d1d;
$dark-page : #121212;

$positive  : #21BA45;
$negative  : #C10015;
$info      : #31CCEC;
$warning   : #F2C037;
```

### 3. 国际化

```typescript
// src/boot/i18n.ts
import { boot } from 'quasar/wrappers'
import { createI18n } from 'vue-i18n'
import messages from 'src/i18n'

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages
})

export default boot(({ app }) => {
  app.use(i18n)
})

export { i18n }
```

### 4. 组合式API模式

```typescript
// src/composables/useNotify.ts
import { useQuasar } from 'quasar'

export function useNotify() {
  const $q = useQuasar()

  function success(message: string) {
    $q.notify({ type: 'positive', message })
  }

  function error(message: string) {
    $q.notify({ type: 'negative', message, timeout: 5000 })
  }

  function warning(message: string) {
    $q.notify({ type: 'warning', message })
  }

  function info(message: string) {
    $q.notify({ type: 'info', message })
  }

  return { success, error, warning, info }
}
```

### 5. 平台检测

```typescript
import { Platform } from 'quasar'

if (Platform.is.mobile) {
  // 移动端逻辑
}

if (Platform.is.electron) {
  // Electron特有逻辑
}

if (Platform.is.capacitor) {
  // Capacitor特有逻辑
}
```

## 常用命令

```bash
# 创建项目
npm create quasar@latest

# 开发 - SPA
quasar dev

# 开发 - SSR
quasar dev -m ssr

# 开发 - PWA
quasar dev -m pwa

# 开发 - 移动端
quasar dev -m capacitor -T android
quasar dev -m capacitor -T ios

# 开发 - 桌面端
quasar dev -m electron

# 构建
quasar build
quasar build -m ssr
quasar build -m pwa
quasar build -m capacitor -T android
quasar build -m electron

# 添加平台
quasar mode add ssr
quasar mode add pwa
quasar mode add capacitor
quasar mode add electron
```

## 部署配置

### 1. PWA配置

```typescript
// quasar.config.ts
pwa: {
  workboxMode: 'generateSW',
  injectPwaMetaTags: true,
  swFilename: 'sw.js',
  manifestFilename: 'manifest.json',
  extendManifestJson (manifest) {
    manifest.name = 'My App'
    manifest.short_name = 'MyApp'
    manifest.description = 'A Quasar PWA'
    manifest.display = 'standalone'
  }
}
```

### 2. Capacitor配置

```typescript
// quasar.config.ts
capacitor: {
  hideSplashscreen: true,
  iosStatusBarPadding: true,
  backgroundColor: '#1976D2'
}

// capacitor.config.json
{
  "appId": "com.example.app",
  "appName": "My App",
  "webDir": "www",
  "server": {
    "androidScheme": "https"
  }
}
```

### 3. Electron配置

```typescript
// quasar.config.ts
electron: {
  bundler: 'packager',
  packager: {
    asar: true,
    icon: 'src-electron/icons/icon',
    targetPlatform: ['darwin', 'win32', 'linux']
  }
}
```

## 关键特性

- 🚀 **跨平台**: 一套代码，多平台部署
- 📦 **80+ 组件**: 丰富的Material Design组件
- 🔧 **高度可配置**: 灵活的配置系统
- ⚡ **性能优化**: Tree-shaking、代码分割
- 🌙 **暗色主题**: 内置深色模式
- 📱 **响应式**: 完整的移动端支持
- 🌐 **国际化**: i18n内置支持
- 🎨 **图标库**: Material Icons, Font Awesome, MDI等
- 📄 **SSR**: 服务端渲染支持
- 📲 **PWA**: 渐进式Web应用支持
