# VueUse 模板

## 技术栈

### 核心技术
- **VueUse**: Vue Composition API 工具集
- **Vue 3**: Composition API
- **TypeScript**: 类型安全
- **Vite**: 构建工具

### 常用模块
- **@vueuse/core**: 核心函数
- **@vueuse/router**: Vue Router 集成
- **@vueuse/firebase**: Firebase 集成
- **@vueuse/rxjs**: RxJS 集成
- **@vueuse/integrations**: 第三方库集成

### 开发工具
- **Vue DevTools**: 浏览器调试
- **Volar**: VSCode 插件
- **ESLint + Prettier**: 代码规范

## 项目结构

```
vueuse-project/
├── src/
│   ├── composables/
│   │   ├── useUser.ts           # 自定义用户 composable
│   │   ├── useApi.ts            # API 请求封装
│   │   ├── useAuth.ts           # 认证逻辑
│   │   ├── useLocalStorage.ts   # 本地存储
│   │   ├── useDebounce.ts       # 防抖
│   │   └── useWebSocket.ts      # WebSocket
│   ├── components/
│   │   ├── UserList.vue
│   │   ├── SearchInput.vue
│   │   ├── ThemeToggle.vue
│   │   ├── InfiniteScroll.vue
│   │   └── MouseTracker.vue
│   ├── views/
│   │   ├── Home.vue
│   │   ├── Dashboard.vue
│   │   └── Settings.vue
│   ├── stores/
│   │   └── user.ts              # Pinia store
│   ├── utils/
│   │   └── helpers.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.vue
│   └── main.ts
├── public/
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 核心代码模式

### 1. 响应式状态管理

```typescript
// src/composables/useUser.ts
import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

// 持久化用户状态
const user = useStorage<User | null>('user', null, localStorage, {
  mergeDefaults: true,
})

export function useUser() {
  const isLoggedIn = computed(() => !!user.value)
  
  const login = async (credentials: any) => {
    // 登录逻辑
    user.value = await fetchUser(credentials)
  }
  
  const logout = () => {
    user.value = null
  }

  return {
    user,
    isLoggedIn,
    login,
    logout,
  }
}
```

### 2. 浏览器 API 封装

```typescript
// src/composables/useTheme.ts
import { usePreferredDark, useStorage } from '@vueuse/core'
import { computed, watch } from 'vue'

export function useTheme() {
  const preferredDark = usePreferredDark()
  const theme = useStorage<'light' | 'dark' | 'auto'>('theme', 'auto')

  const isDark = computed(() => {
    return theme.value === 'auto' ? preferredDark.value : theme.value === 'dark'
  })

  watch(isDark, (dark) => {
    document.documentElement.classList.toggle('dark', dark)
  }, { immediate: true })

  const toggleTheme = () => {
    theme.value = isDark.value ? 'light' : 'dark'
  }

  return {
    theme,
    isDark,
    toggleTheme,
  }
}
```

```vue
<!-- src/components/ThemeToggle.vue -->
<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import { useDark, useToggle } from '@vueuse/core'

const { isDark, toggleTheme } = useTheme()

// 或者使用 VueUse 内置函数
const isDark2 = useDark()
const toggleDark = useToggle(isDark2)
</script>

<template>
  <button @click="toggleTheme" class="theme-toggle">
    {{ isDark ? '🌙' : '☀️' }}
  </button>
</template>
```

### 3. 网络请求与状态

```typescript
// src/composables/useApi.ts
import { useFetch, createFetch } from '@vueuse/core'
import { ref, computed } from 'vue'

// 创建自定义 fetch 实例
const useApiFetch = createFetch({
  baseUrl: 'https://api.example.com',
  options: {
    async beforeFetch({ options }) {
      const token = localStorage.getItem('token')
      if (token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        }
      }
      return { options }
    },
    async afterFetch(ctx) {
      if (ctx.response.status === 401) {
        // 处理未授权
        localStorage.removeItem('token')
      }
      return ctx
    },
  },
})

export function useUsers() {
  const { data, error, isFetching, execute } = useApiFetch('/users').json()

  return {
    users: data,
    error,
    loading: isFetching,
    refetch: execute,
  }
}
```

### 4. 防抖与节流

```vue
<!-- src/components/SearchInput.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDebounceFn, useThrottleFn } from '@vueuse/core'

const searchQuery = ref('')
const results = ref([])

// 防抖搜索
const debouncedSearch = useDebounceFn(async (query: string) => {
  if (query.length < 2) {
    results.value = []
    return
  }
  
  const response = await fetch(`/api/search?q=${query}`)
  results.value = await response.json()
}, 300)

watch(searchQuery, (newQuery) => {
  debouncedSearch(newQuery)
})
</script>

<template>
  <div>
    <input
      v-model="searchQuery"
      type="text"
      placeholder="搜索..."
      class="search-input"
    />
    <ul v-if="results.length > 0">
      <li v-for="result in results" :key="result.id">
        {{ result.name }}
      </li>
    </ul>
  </div>
</template>
```

### 5. 鼠标与滚动跟踪

```vue
<!-- src/components/MouseTracker.vue -->
<script setup lang="ts">
import { useMouse, useMouseInElement, useWindowScroll } from '@vueuse/core'

const { x, y, sourceType } = useMouse()
const targetRef = ref<HTMLElement>()
const { x: elX, y: elY, isOutside } = useMouseInElement(targetRef)
const { x: scrollX, y: scrollY } = useWindowScroll()
</script>

<template>
  <div class="mouse-tracker">
    <p>鼠标位置: {{ x }}, {{ y }}</p>
    <p>滚动位置: {{ scrollX }}, {{ scrollY }}</p>
    <div
      ref="targetRef"
      class="target-element"
      :class="{ outside: isOutside }"
    >
      <p>元素内鼠标: {{ elX }}, {{ elY }}</p>
      <p>{{ isOutside ? '鼠标在外面' : '鼠标在里面' }}</p>
    </div>
  </div>
</template>

<style scoped>
.target-element {
  width: 300px;
  height: 200px;
  background: lightblue;
  transition: background 0.3s;
}

.target-element.outside {
  background: lightcoral;
}
</style>
```

### 6. 响应式断点

```typescript
// src/composables/useBreakpoints.ts
import { useBreakpoints } from '@vueuse/core'

export function useBreakpointsCustom() {
  const breakpoints = useBreakpoints({
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  })

  const isMobile = breakpoints.smaller('md')
  const isTablet = breakpoints.between('md', 'lg')
  const isDesktop = breakpoints.greater('lg')

  return {
    isMobile,
    isTablet,
    isDesktop,
    breakpoints,
  }
}
```

```vue
<!-- 使用示例 -->
<script setup lang="ts">
import { useBreakpointsCustom } from '@/composables/useBreakpoints'

const { isMobile, isTablet, isDesktop } = useBreakpointsCustom()
</script>

<template>
  <div>
    <div v-if="isMobile">移动端视图</div>
    <div v-else-if="isTablet">平板视图</div>
    <div v-else>桌面视图</div>
  </div>
</template>
```

### 7. 无限滚动

```vue
<!-- src/components/InfiniteScroll.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useInfiniteScroll } from '@vueuse/core'

const posts = ref<any[]>([])
const page = ref(1)
const loading = ref(false)

const loadMore = async () => {
  if (loading.value) return
  
  loading.value = true
  const response = await fetch(`/api/posts?page=${page.value}`)
  const newPosts = await response.json()
  
  posts.value = [...posts.value, ...newPosts]
  page.value++
  loading.value = false
}

useInfiniteScroll(
  window,
  () => {
    loadMore()
  },
  { distance: 100 }
)
</script>

<template>
  <div>
    <div v-for="post in posts" :key="post.id" class="post">
      {{ post.title }}
    </div>
    <div v-if="loading" class="loading">加载中...</div>
  </div>
</template>
```

### 8. WebSocket 连接

```typescript
// src/composables/useWebSocket.ts
import { useWebSocket } from '@vueuse/core'

export function useChat() {
  const { status, data, send, open, close } = useWebSocket(
    'wss://chat.example.com/ws',
    {
      autoReconnect: {
        retries: 3,
        delay: 1000,
        onFailed: () => {
          console.error('WebSocket 连接失败')
        },
      },
      heartbeat: {
        message: 'ping',
        interval: 30000,
      },
    }
  )

  const sendMessage = (message: string) => {
    send(JSON.stringify({ type: 'message', content: message }))
  }

  return {
    status,
    data,
    sendMessage,
    open,
    close,
  }
}
```

### 9. 剪贴板与权限

```vue
<!-- src/components/CopyButton.vue -->
<script setup lang="ts">
import { useClipboard, usePermission } from '@vueuse/core'
import { ref } from 'vue'

const props = defineProps<{ text: string }>()

const { copy, copied, isSupported } = useClipboard()
const permissionRead = usePermission('clipboard-read')
const permissionWrite = usePermission('clipboard-write')

const handleCopy = async () => {
  if (!isSupported.value) {
    alert('浏览器不支持剪贴板 API')
    return
  }
  
  await copy(props.text)
}
</script>

<template>
  <button
    @click="handleCopy"
    :disabled="!isSupported"
    class="copy-button"
  >
    {{ copied ? '已复制!' : '复制' }}
  </button>
</template>
```

### 10. 页面可见性与焦点

```typescript
// src/composables/usePageState.ts
import { useDocumentVisibility, useWindowFocus, useTitle } from '@vueuse/core'
import { watch } from 'vue'

export function usePageState() {
  const visibility = useDocumentVisibility()
  const focused = useWindowFocus()
  const title = useTitle()

  // 页面隐藏时暂停操作
  watch(visibility, (current) => {
    if (current === 'hidden') {
      console.log('页面隐藏')
      // 暂停视频、动画等
    } else {
      console.log('页面可见')
    }
  })

  // 窗口失去焦点时
  watch(focused, (isFocused) => {
    if (!isFocused) {
      title.value = '(1) 新消息!'
    } else {
      title.value = 'My App'
    }
  })

  return {
    visibility,
    focused,
    title,
  }
}
```

## 最佳实践

### 1. 组合式函数设计

```typescript
// ✅ 好的做法：返回响应式引用
export function useCounter() {
  const count = ref(0)
  const increment = () => count.value++
  
  return {
    count,
    increment,
  }
}

// ❌ 避免：返回普通值
export function useCounter() {
  let count = 0
  const increment = () => count++
  
  return {
    count, // 失去响应性
    increment,
  }
}
```

### 2. 共享状态管理

```typescript
// ✅ 好的做法：模块级单例
const globalState = ref(0)

export function useGlobalCounter() {
  return {
    count: globalState,
    increment: () => globalState.value++,
  }
}

// ❌ 避免：每次调用创建新状态
export function useGlobalCounter() {
  const count = ref(0) // 每次都是新的
  return { count }
}
```

### 3. 清理副作用

```typescript
// ✅ 好的做法：提供清理函数
export function useEventListener(target, event, callback) {
  onMounted(() => {
    target.addEventListener(event, callback)
  })
  
  onUnmounted(() => {
    target.removeEventListener(event, callback)
  })
}

// 或使用 watchEffect 自动清理
export function useWindowSize() {
  const width = ref(window.innerWidth)
  const height = ref(window.innerHeight)
  
  useEventListener(window, 'resize', () => {
    width.value = window.innerWidth
    height.value = window.innerHeight
  })
  
  return { width, height }
}
```

### 4. TypeScript 类型化

```typescript
// ✅ 好的做法：明确类型
interface UseFetchReturn<T> {
  data: Ref<T | null>
  error: Ref<Error | null>
  isFetching: Ref<boolean>
}

export function useCustomFetch<T>(url: string): UseFetchReturn<T> {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const isFetching = ref(false)
  
  // ...
  
  return { data, error, isFetching }
}

// 使用
const { data } = useCustomFetch<User[]>('/users')
```

### 5. 条件性使用

```typescript
// ✅ 好的做法：检查环境
export function useGeolocation() {
  const coords = ref<GeolocationCoordinates | null>(null)
  
  if (!navigator.geolocation) {
    return {
      coords,
      supported: false,
    }
  }
  
  // 使用地理定位
  return {
    coords,
    supported: true,
  }
}
```

## 常用 VueUse 函数

### 状态
- `useStorage` - 响应式本地存储
- `useLocalStorage` - localStorage 快捷方式
- `useSessionStorage` - sessionStorage 快捷方式
- `useGlobalState` - 跨组件共享状态

### 浏览器
- `useDark` - 深色模式
- `useToggle` - 切换布尔值
- `useTitle` - 页面标题
- `useFavicon` - 网站图标
- `useClipboard` - 剪贴板
- `usePermission` - 权限查询

### 感知
- `useMouse` - 鼠标位置
- `useMouseInElement` - 元素内鼠标
- `useWindowScroll` - 窗口滚动
- `useElementSize` - 元素尺寸
- `useElementVisibility` - 元素可见性
- `useResizeObserver` - 尺寸变化监听

### 网络
- `useFetch` - 数据获取
- `useAxios` - Axios 集成
- `useWebSocket` - WebSocket 连接
- `useEventSource` - Server-Sent Events

### 时间
- `useTimestamp` - 时间戳
- `useNow` - 当前时间
- `useDateFormat` - 日期格式化
- `useTimeAgo` - 相对时间

### 动画
- `useTransition` - 过渡动画
- `useInterval` - 定时器
- `useTimeout` - 延时器
- `useRafFn` - requestAnimationFrame

### 工具
- `useDebounceFn` - 防抖函数
- `useThrottleFn` - 节流函数
- `useMemoize` - 函数记忆
- `useAsyncState` - 异步状态

## 常用命令

### 安装

```bash
# 安装核心库
pnpm add @vueuse/core

# 安装特定集成
pnpm add @vueuse/router
pnpm add @vueuse/firebase
pnpm add @vueuse/rxjs

# 安装所有包
pnpm add @vueuse/core @vueuse/components @vueuse/router
```

### 开发

```bash
# 启动开发服务器
pnpm dev

# 类型检查
pnpm type-check

# 构建
pnpm build

# 预览
pnpm preview
```

### 代码质量

```bash
# ESLint
pnpm lint

# Prettier
pnpm format

# 测试
pnpm test
```

## 部署配置

### 1. Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vueuse: ['@vueuse/core'],
        },
      },
    },
  },
})
```

### 2. TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"]
}
```

### 3. 自动导入配置

```typescript
// vite.config.ts
import AutoImport from 'unplugin-auto-import/vite'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router', '@vueuse/core'],
      dts: 'src/auto-imports.d.ts',
    }),
  ],
})
```

### 4. 环境变量

```bash
# .env
VITE_API_URL=https://api.example.com
VITE_WS_URL=wss://ws.example.com
```

### 5. Docker 部署

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 6. Tree-shaking 优化

```typescript
// ✅ 按需导入
import { useMouse, useDark } from '@vueuse/core'

// ❌ 导入全部
import * as VueUse from '@vueuse/core'

// 使用解构导入减小包体积
import {
  useStorage,
  useDark,
  useToggle,
} from '@vueuse/core'
```

## 相关资源

- [VueUse 官方文档](https://vueuse.org/)
- [VueUse GitHub](https://github.com/vueuse/vueuse)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Vue 3 文档](https://vuejs.org/)
- [Vite 文档](https://vitejs.dev/)
