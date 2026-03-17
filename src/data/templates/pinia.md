# Pinia - Vue 3官方状态管理库

## 技术栈

- **核心**: Pinia 2.x
- **Vue版本**: Vue 3.x
- **类型支持**: TypeScript
- **DevTools**: Vue DevTools集成
- **持久化**: pinia-plugin-persistedstate (可选)

## 项目结构

```
src/
├── stores/
│   ├── index.ts           # Store初始化
│   ├── auth.ts            # 认证store
│   ├── user.ts            # 用户store
│   ├── cart.ts            # 购物车store
│   └── ui.ts              # UI状态store
├── composables/
│   └── useAuth.ts         # 组合式函数
├── types/
│   └── store.ts           # 类型定义
└── main.ts                # 应用入口
```

## 代码模式

### 1. Store初始化

```typescript
// stores/index.ts
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

export default pinia
```

```typescript
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import pinia from './stores'

const app = createApp(App)
app.use(pinia)
app.mount('#app')
```

### 2. Setup Store模式 (推荐)

```typescript
// stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types/store'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const userName = computed(() => user.value?.name ?? 'Guest')
  const userPermissions = computed(() => user.value?.permissions ?? [])

  // Actions
  async function login(credentials: { email: string; password: string }) {
    loading.value = true
    try {
      const response = await authAPI.login(credentials)
      user.value = response.user
      token.value = response.token
      return { success: true }
    } catch (error) {
      return { success: false, error }
    } finally {
      loading.value = false
    }
  }

  function logout() {
    user.value = null
    token.value = null
  }

  function updateUser(userData: Partial<User>) {
    if (user.value) {
      user.value = { ...user.value, ...userData }
    }
  }

  return {
    // State
    user,
    token,
    loading,
    // Getters
    isAuthenticated,
    userName,
    userPermissions,
    // Actions
    login,
    logout,
    updateUser
  }
})
```

### 3. Options Store模式

```typescript
// stores/user.ts
import { defineStore } from 'pinia'
import type { User } from '@/types/store'

interface UserState {
  users: User[]
  currentUser: User | null
  loading: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    users: [],
    currentUser: null,
    loading: false
  }),

  getters: {
    getUserById: (state) => (id: string) => {
      return state.users.find(user => user.id === id)
    },
    userCount: (state) => state.users.length,
    activeUsers: (state) => state.users.filter(user => user.isActive)
  },

  actions: {
    async fetchUsers() {
      this.loading = true
      try {
        const response = await userAPI.getUsers()
        this.users = response.data
      } catch (error) {
        console.error('Failed to fetch users:', error)
      } finally {
        this.loading = false
      }
    },

    async createUser(userData: Partial<User>) {
      try {
        const response = await userAPI.createUser(userData)
        this.users.push(response.data)
        return response.data
      } catch (error) {
        console.error('Failed to create user:', error)
        throw error
      }
    },

    updateUser(id: string, userData: Partial<User>) {
      const index = this.users.findIndex(u => u.id === id)
      if (index !== -1) {
        this.users[index] = { ...this.users[index], ...userData }
      }
    }
  }
})
```

### 4. 在组件中使用

```vue
<template>
  <div>
    <div v-if="authStore.loading">Loading...</div>
    <div v-else-if="authStore.isAuthenticated">
      Welcome, {{ authStore.userName }}
      <button @click="handleLogout">Logout</button>
    </div>
    <form v-else @submit.prevent="handleLogin">
      <input v-model="email" type="email" />
      <input v-model="password" type="password" />
      <button type="submit">Login</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const email = ref('')
const password = ref('')

async function handleLogin() {
  const result = await authStore.login({ email: email.value, password: password.value })
  if (!result.success) {
    alert('Login failed')
  }
}

function handleLogout() {
  authStore.logout()
}
</script>
```

### 5. 组合多个Store

```typescript
// stores/cart.ts
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])

  const authStore = useAuthStore()

  const total = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )

  function addItem(product: Product) {
    if (!authStore.isAuthenticated) {
      throw new Error('Must be logged in to add items')
    }

    const existing = items.value.find(i => i.productId === product.id)
    if (existing) {
      existing.quantity++
    } else {
      items.value.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1
      })
    }
  }

  return { items, total, addItem }
})
```

## 最佳实践

### 1. 状态设计

- ✅ 扁平化状态结构
- ✅ 使用Setup Store获得更好的类型推导
- ✅ 分离业务逻辑和UI状态
- ✅ 合理使用组合式API
- ✅ 保持Store职责单一

```typescript
// stores/ui.ts - UI状态分离
export const useUIStore = defineStore('ui', () => {
  const sidebarOpen = ref(false)
  const theme = ref<'light' | 'dark'>('light')
  const notifications = ref<Notification[]>([])

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function addNotification(notification: Omit<Notification, 'id'>) {
    const id = Date.now()
    notifications.value.push({ ...notification, id })
    setTimeout(() => removeNotification(id), 5000)
  }

  function removeNotification(id: number) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  return {
    sidebarOpen,
    theme,
    notifications,
    toggleSidebar,
    addNotification,
    removeNotification
  }
})
```

### 2. TypeScript支持

```typescript
// types/store.ts
export interface User {
  id: string
  name: string
  email: string
  permissions: string[]
}

// 完整类型推导
const authStore = useAuthStore()
// authStore.user 自动推导为 User | null
// authStore.userName 自动推导为 ComputedRef<string>
```

### 3. 持久化配置

```typescript
// stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  // ... store定义
}, {
  persist: {
    key: 'auth-store',
    storage: localStorage,
    paths: ['token', 'user'], // 只持久化特定字段
    beforeRestore: (ctx) => {
      console.log('Restoring', ctx.store.$id)
    }
  }
})
```

### 4. 插件和中间件

```typescript
// stores/plugins/logger.ts
import type { PiniaPluginContext } from 'pinia'

export function loggerPlugin({ store }: PiniaPluginContext) {
  store.$onAction(({ name, args, after, onError }) => {
    console.log(`Action ${name} started with`, args)

    after((result) => {
      console.log(`Action ${name} finished with`, result)
    })

    onError((error) => {
      console.error(`Action ${name} failed with`, error)
    })
  })
}

// stores/index.ts
const pinia = createPinia()
pinia.use(loggerPlugin)
```

### 5. 测试策略

```typescript
// __tests__/auth.spec.ts
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with null user', () => {
    const store = useAuthStore()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('logs in successfully', async () => {
    const store = useAuthStore()
    await store.login({ email: 'test@example.com', password: '123' })
    expect(store.isAuthenticated).toBe(true)
  })

  it('logs out correctly', () => {
    const store = useAuthStore()
    store.user = { id: '1', name: 'Test' }
    store.logout()
    expect(store.user).toBeNull()
  })
})
```

## 常用命令

```bash
# 安装
npm install pinia

# 持久化插件
npm install pinia-plugin-persistedstate

# 测试工具
npm install @pinia/testing -D
```

## 部署配置

### 1. SSR配置

```typescript
// server.ts
import { createPinia } from 'pinia'
import { renderToString } from 'vue/server-renderer'
import { createApp } from './app'

export async function render(url: string) {
  const { app, router } = createApp()

  const pinia = createPinia()
  app.use(pinia)

  await router.push(url)
  await router.isReady()

  const state = JSON.stringify(pinia.state.value)

  const html = await renderToString(app)

  return { html, state }
}
```

```typescript
// client.ts
import { createPinia } from 'pinia'

const pinia = createPinia()
app.use(pinia)

// 水合服务端状态
if (window.__PINIA_STATE__) {
  pinia.state.value = window.__PINIA_STATE__
}
```

### 2. Nuxt集成

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
  pinia: {
    storesDirs: ['./stores/**']
  }
})
```

### 3. 插件开发

```typescript
// plugins/pinia-init.ts
import { useAuthStore } from '@/stores/auth'

export default defineNuxtPlugin((nuxtApp) => {
  const authStore = useAuthStore(nuxtApp.$pinia)

  // 初始化逻辑
  if (authStore.token) {
    authStore.fetchCurrentUser()
  }
})
```

## 关键特性

- 🎯 **轻量级**: 极小的bundle大小（约1KB）
- 📦 **模块化**: 每个Store独立，无嵌套
- 🔧 **TypeScript**: 完整的类型支持
- 🛠️ **DevTools**: 完整的Vue DevTools集成
- ⚡ **组合式API**: 支持Setup语法
- 💾 **持久化**: 内置插件支持
- 🌐 **SSR友好**: 支持服务端渲染
