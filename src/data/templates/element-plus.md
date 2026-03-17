# Element Plus - Vue 3企业级UI组件库

## 技术栈

- **核心**: Element Plus 2.x
- **Vue版本**: Vue 3.x
- **语言**: TypeScript
- **构建工具**: Vite / Webpack
- **图标**: @element-plus/icons-vue
- **主题**: SCSS变量定制

## 项目结构

```
src/
├── assets/
│   └── styles/
│       ├── element/
│       │   ├── index.scss      # Element Plus主样式
│       │   └── variables.scss  # 主题变量覆盖
│       └── global.scss         # 全局样式
├── components/
│   ├── Layout/
│   │   └── index.vue           # 布局组件
│   └── common/
│       └── SearchBar.vue       # 业务组件
├── views/
│   └── Dashboard.vue
├── plugins/
│   └── element.ts              # Element Plus配置
└── main.ts
```

## 代码模式

### 1. 完整引入

```typescript
// main.ts
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus)
app.mount('#app')
```

### 2. 按需引入 (推荐)

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()]
    }),
    Components({
      resolvers: [ElementPlusResolver()]
    })
  ]
})
```

```typescript
// plugins/element.ts
import type { App } from 'vue'
import {
  ElButton,
  ElInput,
  ElForm,
  ElFormItem,
  ElMessage,
  ElMessageBox
  // ...按需导入
} from 'element-plus'

export default function (app: App) {
  app.use(ElButton)
  app.use(ElInput)
  app.use(ElForm)
  app.use(ElFormItem)

  // 全局方法
  app.config.globalProperties.$message = ElMessage
  app.config.globalProperties.$msgbox = ElMessageBox
}
```

### 3. 主题定制

```scss
// assets/styles/element/variables.scss
@forward 'element-plus/theme-chalk/src/common/var.scss' with (
  $colors: (
    'primary': (
      'base': #409eff,
    ),
  ),
  $font-size: (
    'extra-large': 20px,
    'large': 18px,
    'medium': 16px,
    'base': 14px,
    'small': 13px,
    'extra-small': 12px,
  ),
  $button: (
    'border-radius': 4px,
  )
);
```

```scss
// assets/styles/element/index.scss
@use './variables.scss' as *;
@use 'element-plus/theme-chalk/src/index.scss' as *;

// 自定义样式覆盖
.el-button {
  font-weight: 500;
}
```

### 4. 表单组件

```vue
<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="120px"
    class="demo-form"
  >
    <el-form-item label="用户名" prop="username">
      <el-input
        v-model="formData.username"
        placeholder="请输入用户名"
        clearable
      />
    </el-form-item>

    <el-form-item label="邮箱" prop="email">
      <el-input
        v-model="formData.email"
        type="email"
        placeholder="请输入邮箱"
      />
    </el-form-item>

    <el-form-item label="角色" prop="role">
      <el-select v-model="formData.role" placeholder="请选择角色">
        <el-option label="管理员" value="admin" />
        <el-option label="普通用户" value="user" />
      </el-select>
    </el-form-item>

    <el-form-item label="状态" prop="status">
      <el-switch v-model="formData.status" />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="handleSubmit">提交</el-button>
      <el-button @click="handleReset">重置</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'

const formRef = ref<FormInstance>()

const formData = reactive({
  username: '',
  email: '',
  role: '',
  status: false
})

const rules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
})

async function handleSubmit() {
  if (!formRef.value) return

  await formRef.value.validate((valid) => {
    if (valid) {
      console.log('Submit:', formData)
      ElMessage.success('提交成功')
    }
  })
}

function handleReset() {
  formRef.value?.resetFields()
}
</script>
```

### 5. 表格组件

```vue
<template>
  <div class="table-container">
    <el-table
      :data="tableData"
      style="width: 100%"
      :border="true"
      :stripe="true"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="姓名" width="120" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column prop="role" label="角色" width="100">
        <template #default="{ row }">
          <el-tag :type="row.role === 'admin' ? 'danger' : 'success'">
            {{ row.role }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-switch v-model="row.status" @change="handleStatusChange(row)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button
            size="small"
            type="danger"
            @click="handleDelete(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :total="total"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

onMounted(async () => {
  await fetchTableData()
})

async function fetchTableData() {
  const { data } = await api.getUsers({
    page: currentPage.value,
    size: pageSize.value
  })
  tableData.value = data.list
  total.value = data.total
}

function handleSelectionChange(val: any[]) {
  console.log('Selection:', val)
}

function handleEdit(row: any) {
  console.log('Edit:', row)
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm('确定要删除该用户吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await api.deleteUser(row.id)
    ElMessage.success('删除成功')
    await fetchTableData()
  } catch (error) {
    console.log('取消删除')
  }
}

function handleStatusChange(row: any) {
  console.log('Status changed:', row)
}

function handleSizeChange(val: number) {
  pageSize.value = val
  fetchTableData()
}

function handleCurrentChange(val: number) {
  currentPage.value = val
  fetchTableData()
}
</script>
```

## 最佳实践

### 1. 全局配置

```typescript
// main.ts
import { createApp } from 'vue'
import ElementPlus from 'element-plus'

const app = createApp(App)
app.use(ElementPlus, {
  size: 'default', // small / default / large
  zIndex: 3000
})
```

### 2. 国际化

```typescript
// main.ts
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
// 或 en from 'element-plus/dist/locale/en.mjs'

app.use(ElementPlus, {
  locale: zhCn
})
```

### 3. 自定义指令

```typescript
// directives/permission.ts
import type { Directive } from 'vue'
import { useAuthStore } from '@/stores/auth'

export const permission: Directive = {
  mounted(el, binding) {
    const authStore = useAuthStore()
    const { value } = binding

    if (!authStore.userPermissions.includes(value)) {
      el.parentNode?.removeChild(el)
    }
  }
}
```

```vue
<template>
  <el-button v-permission="'admin'">管理员按钮</el-button>
</template>
```

### 4. 封装业务组件

```vue
<!-- components/common/SearchBar.vue -->
<template>
  <div class="search-bar">
    <el-input
      v-model="searchValue"
      :placeholder="placeholder"
      clearable
      @clear="handleSearch"
      @keyup.enter="handleSearch"
    >
      <template #append>
        <el-button :icon="Search" @click="handleSearch" />
      </template>
    </el-input>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'

interface Props {
  modelValue: string
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请输入关键词'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'search': [value: string]
}>()

const searchValue = ref(props.modelValue)

watch(searchValue, (val) => {
  emit('update:modelValue', val)
})

function handleSearch() {
  emit('search', searchValue.value)
}
</script>
```

### 5. 响应式设计

```vue
<template>
  <el-row :gutter="20">
    <el-col :xs="24" :sm="12" :md="8" :lg="6">
      <el-card>Card 1</el-card>
    </el-col>
    <el-col :xs="24" :sm="12" :md="8" :lg="6">
      <el-card>Card 2</el-card>
    </el-col>
    <el-col :xs="24" :sm="12" :md="8" :lg="6">
      <el-card>Card 3</el-card>
    </el-col>
    <el-col :xs="24" :sm="12" :md="8" :lg="6">
      <el-card>Card 4</el-card>
    </el-col>
  </el-row>
</template>
```

## 常用命令

```bash
# 安装
npm install element-plus

# 图标库
npm install @element-plus/icons-vue

# 按需导入插件
npm install -D unplugin-vue-components unplugin-auto-import

# 主题工具
npm install -D sass
```

## 部署配置

### 1. CDN引入

```html
<head>
  <link rel="stylesheet" href="//unpkg.com/element-plus/dist/index.css" />
  <script src="//unpkg.com/vue@3/dist/vue.global.js"></script>
  <script src="//unpkg.com/element-plus"></script>
</head>

<script>
  const app = Vue.createApp()
  app.use(ElementPlus)
  app.mount('#app')
</script>
```

### 2. Vite优化配置

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'element-plus': ['element-plus'],
          'element-icons': ['@element-plus/icons-vue']
        }
      }
    }
  }
})
```

### 3. 主题在线生成

使用Element Plus官方主题编辑器：
https://element-plus.org/zh-CN/theme-editor.html

```typescript
// 生成的主题文件
import generatedTheme from './element-theme'

app.use(ElementPlus, {
  ...generatedTheme
})
```

### 4. 暗黑模式

```typescript
// assets/styles/dark.scss
@forward 'element-plus/theme-chalk/src/common/var.scss' with (
  $colors: (
    'primary': (
      'base': #409eff,
    ),
  ),
  $bg-color: (
    'page': #0a0a0a,
  )
);
```

```typescript
// main.ts
import './assets/styles/dark.scss'

// 动态切换
function toggleDark() {
  const html = document.documentElement
  html.classList.toggle('dark')
}
```

## 关键特性

- 🎨 **丰富的组件**: 60+高质量组件
- 🌐 **国际化**: 内置多语言支持
- 🎨 **主题定制**: 灵活的SCSS变量系统
- 📱 **响应式**: 完整的响应式布局
- 🔧 **TypeScript**: 完整的类型定义
- ⚡ **按需加载**: Tree-shaking支持
- 🛠️ **开发工具**: 主题编辑器、图标库
