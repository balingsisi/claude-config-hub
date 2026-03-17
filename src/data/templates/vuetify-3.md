# Vuetify 3 - Vue 3 Material Design 组件库

## 技术栈

- **核心**: Vuetify 3.x
- **Vue版本**: Vue 3.x
- **构建工具**: Vite 5.x
- **类型支持**: TypeScript
- **样式**: SCSS + Material Design 3
- **图标**: @mdi/font (Material Design Icons)

## 项目结构

```
src/
├── plugins/
│   └── vuetify.ts         # Vuetify配置
├── components/
│   ├── layout/
│   │   ├── AppLayout.vue  # 主布局
│   │   ├── AppBar.vue     # 顶部导航
│   │   └── AppDrawer.vue  # 侧边栏
│   └── common/
│       ├── DataTable.vue  # 数据表格
│       └── FormDialog.vue # 表单对话框
├── composables/
│   ├── useSnackbar.ts     # 消息提示
│   └── useConfirm.ts      # 确认对话框
├── types/
│   └── index.ts           # 类型定义
├── styles/
│   └── settings.scss      # 自定义样式
├── App.vue                # 根组件
└── main.ts                # 应用入口
```

## 代码模式

### 1. Vuetify配置

```typescript
// plugins/vuetify.ts
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi }
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#1976D2',
          secondary: '#424242',
          accent: '#82B1FF',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107',
          background: '#F5F5F5'
        }
      },
      dark: {
        dark: true,
        colors: {
          primary: '#2196F3',
          secondary: '#424242',
          accent: '#FF4081',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107',
          background: '#121212'
        }
      }
    }
  },
  defaults: {
    VCard: {
      rounded: 'lg',
      elevation: 2
    },
    VBtn: {
      rounded: 'lg',
      variant: 'flat'
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable'
    }
  }
})

export default vuetify
```

```typescript
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'

const app = createApp(App)
app.use(vuetify)
app.mount('#app')
```

### 2. 布局组件

```vue
<!-- components/layout/AppLayout.vue -->
<template>
  <v-app>
    <AppBar />
    <AppDrawer v-model="drawer" />
    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
    <v-footer app>
      <span>&copy; {{ new Date().getFullYear() }}</span>
    </v-footer>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppBar from './AppBar.vue'
import AppDrawer from './AppDrawer.vue'

const drawer = ref(true)
</script>
```

```vue
<!-- components/layout/AppBar.vue -->
<template>
  <v-app-bar color="primary" density="comfortable">
    <v-app-bar-nav-icon @click="toggleDrawer" />
    <v-toolbar-title>{{ title }}</v-toolbar-title>
    <v-spacer />
    <v-btn icon="mdi-theme-light-dark" @click="toggleTheme" />
    <v-btn icon="mdi-account" />
  </v-app-bar>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { useTheme } from 'vuetify'

const emit = defineEmits<{
  (e: 'toggle-drawer'): void
}>()

defineProps<{ title: string }>()

const theme = useTheme()

function toggleDrawer() {
  emit('toggle-drawer')
}

function toggleTheme() {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
}
</script>
```

### 3. 数据表格组件

```vue
<!-- components/common/DataTable.vue -->
<template>
  <v-data-table-server
    v-model:items-per-page="itemsPerPage"
    :headers="headers"
    :items="items"
    :items-length="totalItems"
    :loading="loading"
    item-value="id"
    class="elevation-1"
    @update:options="loadItems"
  >
    <template #top>
      <v-toolbar flat>
        <v-toolbar-title>{{ title }}</v-toolbar-title>
        <v-spacer />
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Search"
          single-line
          hide-details
          density="compact"
          class="mr-4"
          style="max-width: 300px"
        />
        <v-btn color="primary" @click="$emit('create')">
          <v-icon start>mdi-plus</v-icon>
          Add New
        </v-btn>
      </v-toolbar>
    </template>

    <template #item.actions="{ item }">
      <v-btn icon="mdi-pencil" size="small" variant="text" @click="$emit('edit', item)" />
      <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="$emit('delete', item)" />
    </template>

    <template #item.status="{ item }">
      <v-chip :color="getStatusColor(item.status)" size="small">
        {{ item.status }}
      </v-chip>
    </template>
  </v-data-table-server>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  title: string
  headers: any[]
  fetchData: (options: any) => Promise<{ items: any[]; total: number }>
}

const props = defineProps<Props>()

defineEmits<{
  (e: 'create'): void
  (e: 'edit', item: any): void
  (e: 'delete', item: any): void
}>()

const items = ref<any[]>([])
const loading = ref(false)
const totalItems = ref(0)
const itemsPerPage = ref(10)
const search = ref('')

async function loadItems({ page, itemsPerPage, sortBy }: any) {
  loading.value = true
  try {
    const result = await props.fetchData({ page, itemsPerPage, sortBy, search: search.value })
    items.value = result.items
    totalItems.value = result.total
  } finally {
    loading.value = false
  }
}

watch(search, () => loadItems({ page: 1, itemsPerPage: itemsPerPage.value }))

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    active: 'success',
    pending: 'warning',
    inactive: 'error'
  }
  return colors[status] || 'default'
}
</script>
```

### 4. 表单对话框

```vue
<!-- components/common/FormDialog.vue -->
<template>
  <v-dialog v-model="dialog" max-width="600" persistent>
    <v-card>
      <v-card-title>
        <span class="text-h5">{{ title }}</span>
      </v-card-title>
      <v-card-text>
        <v-form ref="formRef" v-model="valid" @submit.prevent="submit">
          <slot :model="model" :rules="rules" />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">Cancel</v-btn>
        <v-btn color="primary" :loading="loading" :disabled="!valid" @click="submit">
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  modelValue: boolean
  title: string
  initialData?: Record<string, any>
  saveHandler: (data: any) => Promise<void>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}>()

const dialog = ref(props.modelValue)
const valid = ref(false)
const loading = ref(false)
const formRef = ref()
const model = ref<Record<string, any>>({})

const rules = {
  required: (v: any) => !!v || 'This field is required',
  email: (v: string) => /.+@.+\..+/.test(v) || 'Invalid email',
  minLength: (min: number) => (v: string) => v?.length >= min || `Min ${min} characters`
}

watch(() => props.modelValue, (val) => {
  dialog.value = val
  if (val && props.initialData) {
    model.value = { ...props.initialData }
  }
})

watch(dialog, (val) => {
  emit('update:modelValue', val)
})

function close() {
  dialog.value = false
  model.value = {}
}

async function submit() {
  const { valid: isValid } = await formRef.value?.validate()
  if (!isValid) return

  loading.value = true
  try {
    await props.saveHandler(model.value)
    emit('saved')
    close()
  } finally {
    loading.value = false
  }
}
</script>
```

### 5. Composables

```typescript
// composables/useSnackbar.ts
import { ref } from 'vue'

interface SnackbarOptions {
  message: string
  color?: 'success' | 'error' | 'warning' | 'info'
  timeout?: number
}

const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('info')
const snackbarTimeout = ref(3000)

export function useSnackbar() {
  function show(options: SnackbarOptions) {
    snackbarMessage.value = options.message
    snackbarColor.value = options.color || 'info'
    snackbarTimeout.value = options.timeout || 3000
    snackbar.value = true
  }

  function success(message: string) {
    show({ message, color: 'success' })
  }

  function error(message: string) {
    show({ message, color: 'error', timeout: 5000 })
  }

  function warning(message: string) {
    show({ message, color: 'warning' })
  }

  function info(message: string) {
    show({ message, color: 'info' })
  }

  return {
    snackbar,
    snackbarMessage,
    snackbarColor,
    snackbarTimeout,
    show,
    success,
    error,
    warning,
    info
  }
}
```

```typescript
// composables/useConfirm.ts
import { ref } from 'vue'

interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  color?: string
}

const showDialog = ref(false)
const options = ref<ConfirmOptions>({
  title: '',
  message: ''
})
let resolvePromise: ((value: boolean) => void) | null = null

export function useConfirm() {
  function confirm(confirmOptions: ConfirmOptions): Promise<boolean> {
    options.value = {
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      color: 'primary',
      ...confirmOptions
    }
    showDialog.value = true
    return new Promise((resolve) => {
      resolvePromise = resolve
    })
  }

  function accept() {
    showDialog.value = false
    resolvePromise?.(true)
    resolvePromise = null
  }

  function cancel() {
    showDialog.value = false
    resolvePromise?.(false)
    resolvePromise = null
  }

  return {
    showDialog,
    options,
    confirm,
    accept,
    cancel
  }
}
```

## 最佳实践

### 1. 主题定制

```scss
// styles/settings.scss
@use 'vuetify/settings' with (
  $color-pack: true,
  $rounded: (
    0: 0,
    'sm': 4px,
    null: 8px,
    'lg': 12px,
    'xl': 16px
  ),
  $button-border-radius: 8px,
  $card-border-radius: 12px
);

// 自义CSS变量
:root {
  --v-layout-padding: 16px;
  --v-card-padding: 20px;
}
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ styles: { configFile: 'src/styles/settings.scss' } })
  ]
})
```

### 2. 组件懒加载

```typescript
// plugins/vuetify-lazy.ts
import { lazyComponent } from 'vuetify/directives/lazy'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('lazy', lazyComponent)
})
```

```vue
<template>
  <v-lazy v-model="isActive" :options="{ threshold: 0.5 }">
    <v-card>
      <!-- 内容 -->
    </v-card>
  </v-lazy>
</template>
```

### 3. 响应式布局

```vue
<script setup lang="ts">
import { useDisplay } from 'vuetify'

const { mobile, mdAndUp, lgAndUp } = useDisplay()

// 使用响应式值
const cols = computed(() => mobile.value ? 12 : 6)
</script>

<template>
  <v-row>
    <v-col :cols="cols">
      <v-card>...</v-card>
    </v-col>
  </v-row>
</template>
```

### 4. 表单验证

```typescript
// composables/useValidation.ts
export function useValidation() {
  const rules = {
    required: (v: any) => !!v || 'This field is required',
    email: (v: string) => /.+@.+\..+/.test(v) || 'Invalid email format',
    phone: (v: string) => /^\d{10}$/.test(v) || 'Invalid phone number',
    minLength: (min: number) => (v: string) => 
      v?.length >= min || `Minimum ${min} characters required`,
    maxLength: (max: number) => (v: string) => 
      v?.length <= max || `Maximum ${max} characters allowed`,
    password: (v: string) => 
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(v) || 
      'Password must contain uppercase, lowercase, and number'
  }

  return { rules }
}
```

### 5. 全局组件注册

```typescript
// plugins/components.ts
import type { Plugin } from 'vue'
import DataTable from '@/components/common/DataTable.vue'
import FormDialog from '@/components/common/FormDialog.vue'

export const componentsPlugin: Plugin = {
  install(app) {
    app.component('DataTable', DataTable)
    app.component('FormDialog', FormDialog)
  }
}
```

## 常用命令

```bash
# 创建项目
npm create vuetify@latest

# 安装依赖
npm install vuetify @mdi/font

# 开发
npm run dev

# 构建
npm run build

# 图标库
npm install @mdi/font
```

## 部署配置

### 1. Nuxt集成

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['vuetify-nuxt-module'],
  vuetify: {
    vuetifyOptions: {
      theme: {
        defaultTheme: 'light'
      }
    }
  }
})
```

### 2. SSR配置

```typescript
// server.ts
import { renderToString } from 'vue/server-renderer'
import { createVuetify } from 'vuetify'
import { createApp } from './app'

export async function render(url: string) {
  const { app, router } = createApp()
  const vuetify = createVuetify({ ssr: true })
  
  app.use(vuetify)
  await router.push(url)
  await router.isReady()

  const html = await renderToString(app)
  return html
}
```

### 3. Vite优化

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vuetify': ['vuetify'],
          'vuetify-components': ['vuetify/components'],
          'vuetify-directives': ['vuetify/directives']
        }
      }
    }
  }
})
```

## 关键特性

- 🎨 **80+ 组件**: 丰富的Material Design组件库
- 🌙 **暗色主题**: 内置深色模式支持
- 📱 **响应式**: 完整的移动端适配
- 🌐 **国际化**: 内置i18n支持
- 🎯 **TypeScript**: 完整类型定义
- ⚡ **Tree-shakable**: 按需导入组件
- 🔧 **高度可定制**: 主题、样式、默认值
- 📦 **Vite支持**: 官方Vite插件
