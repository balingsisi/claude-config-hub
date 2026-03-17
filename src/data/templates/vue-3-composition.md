# Vue 3 Composition API 模板

## 技术栈

- **框架**: Vue 3.4+
- **构建工具**: Vite 5.x
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **HTTP 客户端**: Axios / Fetch
- **UI 库**: Element Plus / Naive UI / PrimeVue（可选）
- **类型**: TypeScript 5.x
- **测试**: Vitest + Vue Test Utils

## 项目结构

```
vue-3-composition/
├── src/
│   ├── components/           # 组件
│   │   ├── common/          # 通用组件
│   │   │   ├── Button.vue
│   │   │   ├── Input.vue
│   │   │   └── Modal.vue
│   │   ├── layout/          # 布局组件
│   │   │   ├── Header.vue
│   │   │   ├── Footer.vue
│   │   │   └── Sidebar.vue
│   │   └── features/        # 功能组件
│   │       ├── UserCard.vue
│   │       └── PostList.vue
│   ├── composables/         # 组合式函数
│   │   ├── useAuth.ts
│   │   ├── useFetch.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useDebounce.ts
│   │   ├── useThrottle.ts
│   │   └── useIntersectionObserver.ts
│   ├── views/               # 页面视图
│   │   ├── Home.vue
│   │   ├── Login.vue
│   │   ├── Register.vue
│   │   └── Dashboard.vue
│   ├── stores/              # Pinia 状态管理
│   │   ├── index.ts
│   │   ├── user.ts
│   │   ├── app.ts
│   │   └── cart.ts
│   ├── router/              # 路由配置
│   │   ├── index.ts
│   │   └── guards.ts
│   ├── services/            # API 服务
│   │   ├── api.ts
│   │   ├── user.service.ts
│   │   └── post.service.ts
│   ├── utils/               # 工具函数
│   │   ├── helpers.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   ├── types/               # 类型定义
│   │   ├── user.ts
│   │   ├── post.ts
│   │   └── api.ts
│   ├── assets/              # 静态资源
│   │   ├── styles/
│   │   └── images/
│   ├── App.vue              # 根组件
│   └── main.ts              # 入口文件
├── public/                  # 公共资源
├── tests/                   # 测试文件
│   ├── unit/
│   └── e2e/
├── .env                     # 环境变量
├── vite.config.ts          # Vite 配置
├── tsconfig.json           # TypeScript 配置
└── package.json
```

## 代码模式

### 基础配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    vue({
      script: {
        defineModel: true,
        propsDestructure: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
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
  build: {
    target: 'es2015',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue', 'vue-router', 'pinia'],
          vendor: ['axios', 'lodash-es'],
        },
      },
    },
  },
});

// src/main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import App from './App.vue';
import './assets/styles/main.css';

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount('#app');

// src/App.vue
<script setup lang="ts">
import { RouterView } from 'vue-router';
import Header from '@/components/layout/Header.vue';
import Footer from '@/components/layout/Footer.vue';
</script>

<template>
  <div id="app">
    <Header />
    <main class="main-content">
      <RouterView v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>
    <Footer />
  </div>
</template>

<style scoped>
.main-content {
  min-height: calc(100vh - 120px);
}

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

### 组合式函数（Composables）

```typescript
// src/composables/useAuth.ts
import { ref, computed, readonly } from 'vue';
import { defineStore } from 'pinia';
import { userService } from '@/services/user.service';
import type { User, LoginCredentials, RegisterData } from '@/types/user';

export const useAuth = () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isAdmin = computed(() => user.value?.role === 'admin');

  const login = async (credentials: LoginCredentials) => {
    try {
      loading.value = true;
      error.value = null;

      const response = await userService.login(credentials);
      
      user.value = response.user;
      token.value = response.token;
      
      localStorage.setItem('token', response.token);
      
      return response;
    } catch (err: any) {
      error.value = err.message || 'Login failed';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      loading.value = true;
      error.value = null;

      const response = await userService.register(data);
      
      user.value = response.user;
      token.value = response.token;
      
      localStorage.setItem('token', response.token);
      
      return response;
    } catch (err: any) {
      error.value = err.message || 'Registration failed';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const logout = () => {
    user.value = null;
    token.value = null;
    localStorage.removeItem('token');
  };

  const fetchUser = async () => {
    if (!token.value) return;

    try {
      loading.value = true;
      user.value = await userService.getProfile();
    } catch (err: any) {
      logout();
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  return {
    user: readonly(user),
    token: readonly(token),
    loading: readonly(loading),
    error: readonly(error),
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    fetchUser,
  };
};

// src/composables/useFetch.ts
import { ref, watchEffect, toValue } from 'vue';
import type { Ref } from 'vue';

interface UseFetchOptions<T> {
  immediate?: boolean;
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useFetch<T>(
  url: string | Ref<string> | (() => string),
  options: UseFetchOptions<T> = {}
) {
  const {
    immediate = true,
    initialData,
    onSuccess,
    onError,
  } = options;

  const data = ref<T | undefined>(initialData) as Ref<T | undefined>;
  const error = ref<Error | null>(null);
  const loading = ref(false);

  const execute = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(toValue(url));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const json = await response.json();
      data.value = json;
      
      onSuccess?.(json);
    } catch (err: any) {
      error.value = err;
      onError?.(err);
    } finally {
      loading.value = false;
    }
  };

  if (immediate) {
    watchEffect(() => {
      execute();
    });
  }

  return {
    data,
    error,
    loading,
    execute,
  };
}

// src/composables/useLocalStorage.ts
import { ref, watch } from 'vue';
import type { Ref } from 'vue';

export function useLocalStorage<T>(key: string, defaultValue: T): Ref<T> {
  const storedValue = localStorage.getItem(key);
  const data = ref<T>(
    storedValue ? JSON.parse(storedValue) : defaultValue
  ) as Ref<T>;

  watch(
    data,
    (newValue) => {
      localStorage.setItem(key, JSON.stringify(newValue));
    },
    { deep: true }
  );

  return data;
}

// src/composables/useDebounce.ts
import { ref, watch } from 'vue';
import type { Ref } from 'vue';

export function useDebounce<T>(value: Ref<T>, delay = 300): Ref<T> {
  const debouncedValue = ref(value.value) as Ref<T>;
  let timeout: ReturnType<typeof setTimeout>;

  watch(value, (newValue) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      debouncedValue.value = newValue;
    }, delay);
  });

  return debouncedValue;
}

// src/composables/useThrottle.ts
import { ref, watch } from 'vue';
import type { Ref } from 'vue';

export function useThrottle<T>(value: Ref<T>, delay = 300): Ref<T> {
  const throttledValue = ref(value.value) as Ref<T>;
  let lastExecuted = 0;

  watch(value, (newValue) => {
    const now = Date.now();
    
    if (now - lastExecuted >= delay) {
      throttledValue.value = newValue;
      lastExecuted = now;
    }
  });

  return throttledValue;
}

// src/composables/useIntersectionObserver.ts
import { ref, onMounted, onUnmounted } from 'vue';

export function useIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit = {}
) {
  const target = ref<HTMLElement | null>(null);
  let observer: IntersectionObserver | null = null;

  onMounted(() => {
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback();
        }
      });
    }, options);

    if (target.value) {
      observer.observe(target.value);
    }
  });

  onUnmounted(() => {
    if (observer) {
      observer.disconnect();
    }
  });

  return target;
}
```

### Pinia 状态管理

```typescript
// src/stores/user.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { userService } from '@/services/user.service';
import type { User, LoginCredentials, RegisterData } from '@/types/user';

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));
  const loading = ref(false);

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isAdmin = computed(() => user.value?.role === 'admin');
  const userName = computed(() => user.value?.name || 'Guest');

  // Actions
  async function login(credentials: LoginCredentials) {
    loading.value = true;
    try {
      const response = await userService.login(credentials);
      user.value = response.user;
      token.value = response.token;
      localStorage.setItem('token', response.token);
      return response;
    } finally {
      loading.value = false;
    }
  }

  async function register(data: RegisterData) {
    loading.value = true;
    try {
      const response = await userService.register(data);
      user.value = response.user;
      token.value = response.token;
      localStorage.setItem('token', response.token);
      return response;
    } finally {
      loading.value = false;
    }
  }

  async function fetchProfile() {
    if (!token.value) return;
    
    loading.value = true;
    try {
      user.value = await userService.getProfile();
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    user.value = null;
    token.value = null;
    localStorage.removeItem('token');
  }

  async function updateProfile(data: Partial<User>) {
    loading.value = true;
    try {
      user.value = await userService.updateProfile(data);
    } finally {
      loading.value = false;
    }
  }

  return {
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    userName,
    login,
    register,
    fetchProfile,
    logout,
    updateProfile,
  };
});

// src/stores/cart.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Product } from '@/types/product';

export const useCartStore = defineStore('cart', () => {
  // State
  const items = ref<Array<{ product: Product; quantity: number }>>([]);

  // Getters
  const totalItems = computed(() => 
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  );

  const totalPrice = computed(() => 
    items.value.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  );

  const isEmpty = computed(() => items.value.length === 0);

  // Actions
  function addItem(product: Product, quantity = 1) {
    const existingItem = items.value.find(item => item.product.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      items.value.push({ product, quantity });
    }
  }

  function removeItem(productId: string) {
    const index = items.value.findIndex(item => item.product.id === productId);
    if (index !== -1) {
      items.value.splice(index, 1);
    }
  }

  function updateQuantity(productId: string, quantity: number) {
    const item = items.value.find(item => item.product.id === productId);
    if (item) {
      if (quantity <= 0) {
        removeItem(productId);
      } else {
        item.quantity = quantity;
      }
    }
  }

  function clearCart() {
    items.value = [];
  }

  return {
    items,
    totalItems,
    totalPrice,
    isEmpty,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  };
});
```

### 组件示例

```vue
<!-- src/views/Login.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import Input from '@/components/common/Input.vue';
import Button from '@/components/common/Button.vue';
import type { LoginCredentials } from '@/types/user';

const router = useRouter();
const userStore = useUserStore();

const form = ref<LoginCredentials>({
  email: '',
  password: '',
});

const errors = ref({
  email: '',
  password: '',
});

const isValid = computed(() => 
  form.value.email && form.value.password && !errors.value.email && !errors.value.password
);

const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  errors.value.email = emailRegex.test(form.value.email) ? '' : 'Invalid email format';
};

const validatePassword = () => {
  errors.value.password = form.value.password.length >= 8 ? '' : 'Password must be at least 8 characters';
};

const handleSubmit = async () => {
  validateEmail();
  validatePassword();

  if (!isValid.value) return;

  try {
    await userStore.login(form.value);
    router.push('/dashboard');
  } catch (error: any) {
    alert(error.message || 'Login failed');
  }
};
</script>

<template>
  <div class="login-container">
    <form @submit.prevent="handleSubmit" class="login-form">
      <h2>Login</h2>

      <Input
        v-model="form.email"
        type="email"
        label="Email"
        :error="errors.email"
        @blur="validateEmail"
      />

      <Input
        v-model="form.password"
        type="password"
        label="Password"
        :error="errors.password"
        @blur="validatePassword"
      />

      <Button type="submit" :loading="userStore.loading" :disabled="!isValid">
        Login
      </Button>

      <p class="register-link">
        Don't have an account?
        <router-link to="/register">Register</router-link>
      </p>
    </form>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
}

.login-form {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.login-form h2 {
  margin-bottom: 1.5rem;
  text-align: center;
}

.register-link {
  margin-top: 1rem;
  text-align: center;
}

.register-link a {
  color: #42b883;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}
</style>

<!-- src/components/features/UserCard.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import type { User } from '@/types/user';
import Button from '@/components/common/Button.vue';

interface Props {
  user: User;
  showActions?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true,
});

const emit = defineEmits<{
  edit: [user: User];
  delete: [userId: string];
}>();

const avatarUrl = computed(() => 
  props.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(props.user.name)}&background=random`
);

const handleEdit = () => {
  emit('edit', props.user);
};

const handleDelete = () => {
  if (confirm('Are you sure you want to delete this user?')) {
    emit('delete', props.user.id);
  }
};
</script>

<template>
  <div class="user-card">
    <img :src="avatarUrl" :alt="user.name" class="avatar" />
    
    <div class="user-info">
      <h3>{{ user.name }}</h3>
      <p class="email">{{ user.email }}</p>
      <p v-if="user.bio" class="bio">{{ user.bio }}</p>
    </div>

    <div v-if="showActions" class="actions">
      <Button variant="primary" size="small" @click="handleEdit">
        Edit
      </Button>
      <Button variant="danger" size="small" @click="handleDelete">
        Delete
      </Button>
    </div>
  </div>
</template>

<style scoped>
.user-card {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.user-card:hover {
  transform: translateY(-2px);
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 1rem;
}

.user-info {
  flex: 1;
}

.user-info h3 {
  margin: 0 0 0.25rem;
  font-size: 1.1rem;
}

.email {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.bio {
  margin: 0.5rem 0 0;
  color: #888;
  font-size: 0.85rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
}
</style>

<!-- src/components/features/PostList.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useFetch } from '@/composables/useFetch';
import { useIntersectionObserver } from '@/composables/useIntersectionObserver';
import type { Post } from '@/types/post';

const posts = ref<Post[]>([]);
const page = ref(1);
const hasMore = ref(true);

const { loading, error, execute } = useFetch(
  () => `/api/posts?page=${page.value}&limit=10`,
  {
    immediate: false,
    onSuccess: (data: { posts: Post[]; hasMore: boolean }) => {
      posts.value.push(...data.posts);
      hasMore.value = data.hasMore;
    },
  }
);

const loadMore = async () => {
  if (loading.value || !hasMore.value) return;
  
  page.value++;
  await execute();
};

const loadMoreTrigger = useIntersectionObserver(loadMore);

onMounted(() => {
  execute();
});
</script>

<template>
  <div class="post-list">
    <div v-if="error" class="error">
      Failed to load posts: {{ error.message }}
    </div>

    <div v-for="post in posts" :key="post.id" class="post-item">
      <h3>{{ post.title }}</h3>
      <p>{{ post.excerpt }}</p>
      <span class="date">{{ new Date(post.createdAt).toLocaleDateString() }}</span>
    </div>

    <div v-if="loading" class="loading">
      Loading...
    </div>

    <div ref="loadMoreTrigger" class="load-more-trigger"></div>

    <div v-if="!hasMore && posts.length > 0" class="no-more">
      No more posts
    </div>
  </div>
</template>

<style scoped>
.post-list {
  max-width: 800px;
  margin: 0 auto;
}

.post-item {
  padding: 1.5rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.post-item h3 {
  margin: 0 0 0.5rem;
  font-size: 1.3rem;
}

.post-item p {
  margin: 0 0 0.5rem;
  color: #666;
}

.date {
  font-size: 0.85rem;
  color: #999;
}

.loading,
.no-more {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error {
  padding: 1rem;
  background: #fee;
  border-radius: 8px;
  color: #c00;
}

.load-more-trigger {
  height: 20px;
}
</style>
```

### 路由配置

```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/stores/user';
import Home from '@/views/Home.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresGuest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { requiresGuest: true },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// src/router/guards.ts
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();

  // 如果有 token 但没有用户信息，尝试获取
  if (userStore.token && !userStore.user) {
    await userStore.fetchProfile();
  }

  const isAuthenticated = userStore.isAuthenticated;

  // 需要认证的路由
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } });
    return;
  }

  // 仅限游客的路由
  if (to.meta.requiresGuest && isAuthenticated) {
    next({ name: 'Home' });
    return;
  }

  next();
});

export default router;
```

### API 服务

```typescript
// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// src/services/user.service.ts
import api from './api';
import type { User, LoginCredentials, RegisterData } from '@/types/user';

export const userService = {
  async login(credentials: LoginCredentials) {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async register(data: RegisterData) {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await api.get('/user/profile');
    return response.data;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put('/user/profile', data);
    return response.data;
  },

  async getUsers(): Promise<User[]> {
    const response = await api.get('/users');
    return response.data;
  },
};
```

## 最佳实践

### 1. 组件命名和组织

```vue
<!-- 使用 PascalCase 命名组件 -->
<!-- UserCard.vue -->
<script setup lang="ts">
// 使用 Composition API
import { ref, computed } from 'vue';

// Props 使用 TypeScript 类型
interface Props {
  title: string;
  count?: number;
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
});

// Emits 使用类型化事件
const emit = defineEmits<{
  update: [value: number];
  delete: [id: string];
}>();
</script>
```

### 2. 响应式数据管理

```typescript
// 使用 ref 用于原始值
const count = ref(0);

// 使用 reactive 用于对象
const state = reactive({
  user: null,
  loading: false,
  error: null,
});

// 使用 computed 用于派生数据
const doubleCount = computed(() => count.value * 2);

// 使用 readonly 保护数据
const readonlyState = readonly(state);
```

### 3. 组件通信

```vue
<!-- 父组件 -->
<template>
  <ChildComponent
    :data="parentData"
    @update="handleUpdate"
  />
</template>

<!-- 子组件 -->
<script setup lang="ts">
const props = defineProps<{
  data: string;
}>();

const emit = defineEmits<{
  update: [newValue: string];
}>();

const handleInput = (event: Event) => {
  emit('update', (event.target as HTMLInputElement).value);
};
</script>
```

### 4. 生命周期钩子

```typescript
import { onMounted, onUnmounted, onUpdated } from 'vue';

onMounted(() => {
  console.log('Component mounted');
  // 初始化操作
});

onUpdated(() => {
  console.log('Component updated');
  // 更新后操作
});

onUnmounted(() => {
  console.log('Component unmounted');
  // 清理操作
});
```

## 常用命令

```bash
# 开发
npm run dev

# 构建
npm run build

# 预览
npm run preview

# 测试
npm run test

# 测试覆盖率
npm run test:coverage

# 类型检查
npm run type-check

# Lint
npm run lint

# 格式化
npm run format
```

## 参考资源

- [Vue 3 官方文档](https://vuejs.org/)
- [Vue Router](https://router.vuejs.org/)
- [Pinia](https://pinia.vuejs.org/)
- [Vite](https://vitejs.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Vue 3 Composition API RFC](https://github.com/vuejs/rfcs/blob/master/active-rfcs/0013-composition-api.md)
