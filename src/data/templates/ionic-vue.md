# Ionic Vue 跨平台移动应用模板

## 项目概述

Ionic Vue 是使用 Vue.js 和 Ionic Framework 构建跨平台移动应用的解决方案。通过 Capacitor 将 Web 应用打包为原生 iOS 和 Android 应用，同时支持 Progressive Web App。

## 技术栈

- **框架**: Ionic 8.x + Vue 3.4+
- **语言**: TypeScript 5.3+
- **路由**: Vue Router 4.x
- **状态管理**: Pinia
- **样式**: Ionic CSS Components + CSS Variables
- **原生桥接**: Capacitor 6.x
- **构建工具**: Vite 5.x
- **测试**: Vitest + Cypress

## 项目结构

```
ionic-vue-app/
├── src/
│   ├── main.ts                    # 应用入口
│   ├── App.vue                    # 根组件
│   ├── router/
│   │   └── index.ts               # 路由配置
│   ├── views/                     # 页面组件
│   │   ├── HomePage.vue
│   │   ├── TabsPage.vue
│   │   ├── Tab1Page.vue
│   │   ├── Tab2Page.vue
│   │   ├── Tab3Page.vue
│   │   ├── DetailPage.vue
│   │   ├── LoginPage.vue
│   │   ├── RegisterPage.vue
│   │   └── SettingsPage.vue
│   ├── components/                # 可复用组件
│   │   ├── ExploreContainer.vue
│   │   ├── UserCard.vue
│   │   └── LoadingSpinner.vue
│   ├── composables/               # 组合式函数
│   │   ├── useAuth.ts
│   │   ├── useCamera.ts
│   │   ├── useGeolocation.ts
│   │   └── useStorage.ts
│   ├── stores/                    # Pinia 状态管理
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   └── settings.ts
│   ├── services/                  # API 服务
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   └── user.service.ts
│   ├── types/                     # TypeScript 类型
│   │   ├── user.ts
│   │   └── api.ts
│   ├── theme/
│   │   └── variables.css          # Ionic 主题变量
│   └── assets/                    # 静态资源
│       ├── icon/
│       └── images/
├── public/
│   └── index.html
├── android/                       # Android 原生项目
├── ios/                           # iOS 原生项目
├── capacitor.config.ts            # Capacitor 配置
├── ionic.config.json              # Ionic 配置
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 核心代码模式

### 1. Ionic Vue 应用入口

```typescript
// src/main.ts
import { createApp } from 'vue';
import { IonicVue } from '@ionic/vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/* Theme variables */
import './theme/variables.css';

/* Capacitor plugins */
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

const app = createApp(App)
  .use(IonicVue)
  .use(createPinia())
  .use(router);

router.isReady().then(async () => {
  app.mount('#app');
  
  // 初始化 Capacitor 插件
  if (import.meta.env.VITE_PLATFORM !== 'web') {
    await StatusBar.setStyle({ style: Style.Dark });
    await SplashScreen.hide();
  }
});
```

### 2. 路由配置（带 Tabs）

```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '@/views/TabsPage.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/tab1',
  },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/tabs/tab1',
      },
      {
        path: 'tab1',
        name: 'Tab1',
        component: () => import('@/views/Tab1Page.vue'),
      },
      {
        path: 'tab2',
        name: 'Tab2',
        component: () => import('@/views/Tab2Page.vue'),
      },
      {
        path: 'tab3',
        name: 'Tab3',
        component: () => import('@/views/Tab3Page.vue'),
      },
    ],
  },
  {
    path: '/detail/:id',
    name: 'Detail',
    component: () => import('@/views/DetailPage.vue'),
    props: true,
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginPage.vue'),
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/RegisterPage.vue'),
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/SettingsPage.vue'),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } });
  } else {
    next();
  }
});

export default router;
```

### 3. Tabs 页面布局

```vue
<!-- src/views/TabsPage.vue -->
<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="tab1" href="/tabs/tab1">
          <ion-icon :icon="homeOutline" />
          <ion-label>首页</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab2" href="/tabs/tab2">
          <ion-icon :icon="searchOutline" />
          <ion-label>搜索</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab3" href="/tabs/tab3">
          <ion-icon :icon="personOutline" />
          <ion-label>我的</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { 
  IonPage, 
  IonTabs, 
  IonTabBar, 
  IonTabButton, 
  IonIcon, 
  IonLabel,
  IonRouterOutlet 
} from '@ionic/vue';
import { homeOutline, searchOutline, personOutline } from 'ionicons/icons';
</script>
```

### 4. 列表页面（带无限滚动）

```vue
<!-- src/views/Tab1Page.vue -->
<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>首页</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="doRefresh">
            <ion-icon :icon="refreshOutline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" ref="content">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">首页</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-list>
        <ion-item 
          v-for="item in items" 
          :key="item.id"
          @click="goToDetail(item.id)"
          button
          detail
        >
          <ion-avatar slot="start">
            <img :src="item.avatar" :alt="item.title" />
          </ion-avatar>
          <ion-label>
            <h2>{{ item.title }}</h2>
            <p>{{ item.description }}</p>
          </ion-label>
        </ion-item>
      </ion-list>

      <ion-infinite-scroll
        @ionInfinite="loadMore"
        threshold="100px"
        :disabled="!hasMore"
      >
        <ion-infinite-scroll-content
          loading-spinner="bubbles"
          loading-text="加载中..."
        ></ion-infinite-scroll-content>
      </ion-infinite-scroll>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonButtons,
  IonButton,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from '@ionic/vue';
import { refreshOutline } from 'ionicons/icons';

interface Item {
  id: string;
  title: string;
  description: string;
  avatar: string;
}

const router = useRouter();
const content = ref();
const items = ref<Item[]>([]);
const page = ref(1);
const hasMore = ref(true);
const loading = ref(false);

const fetchItems = async (pageNum: number) => {
  loading.value = true;
  try {
    const response = await fetch(`/api/items?page=${pageNum}&limit=20`);
    const data = await response.json();
    
    if (pageNum === 1) {
      items.value = data.items;
    } else {
      items.value.push(...data.items);
    }
    
    hasMore.value = data.hasMore;
  } catch (error) {
    console.error('Failed to fetch items:', error);
  } finally {
    loading.value = false;
  }
};

const loadMore = async (event: CustomEvent) => {
  if (!hasMore.value || loading.value) {
    (event.target as any).complete();
    return;
  }

  page.value++;
  await fetchItems(page.value);
  (event.target as any).complete();
};

const handleRefresh = async (event: CustomEvent) => {
  page.value = 1;
  await fetchItems(1);
  event.target.complete();
};

const doRefresh = () => {
  content.value.$el.scrollToTop(500);
  page.value = 1;
  fetchItems(1);
};

const goToDetail = (id: string) => {
  router.push({ name: 'Detail', params: { id } });
};

onMounted(() => {
  fetchItems(1);
});
</script>
```

### 5. 表单页面（带验证）

```vue
<!-- src/views/LoginPage.vue -->
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>登录</ion-title>
        <ion-buttons slot="start">
          <ion-back-button default-href="/"></ion-back-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form @submit.prevent="handleLogin">
        <ion-list>
          <ion-item>
            <ion-label position="floating">邮箱</ion-label>
            <ion-input
              v-model="form.email"
              type="email"
              required
              @ionBlur="validateEmail"
            ></ion-input>
          </ion-item>
          <ion-text v-if="errors.email" color="danger">
            <p class="ion-padding-start">{{ errors.email }}</p>
          </ion-text>

          <ion-item>
            <ion-label position="floating">密码</ion-label>
            <ion-input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              required
              @ionBlur="validatePassword"
            ></ion-input>
            <ion-button fill="clear" slot="end" @click="showPassword = !showPassword">
              <ion-icon :icon="showPassword ? eyeOffOutline : eyeOutline"></ion-icon>
            </ion-button>
          </ion-item>
          <ion-text v-if="errors.password" color="danger">
            <p class="ion-padding-start">{{ errors.password }}</p>
          </ion-text>
        </ion-list>

        <div class="ion-padding">
          <ion-button
            expand="block"
            type="submit"
            :disabled="!isFormValid || loading"
          >
            <ion-spinner v-if="loading" name="crescent"></ion-spinner>
            <span v-else>登录</span>
          </ion-button>

          <ion-button
            expand="block"
            fill="clear"
            router-link="/register"
            class="ion-margin-top"
          >
            没有账号？立即注册
          </ion-button>
        </div>
      </form>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonText,
  IonSpinner,
  toastController,
} from '@ionic/vue';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const form = ref({
  email: '',
  password: '',
});

const errors = ref({
  email: '',
  password: '',
});

const showPassword = ref(false);
const loading = ref(false);

const isFormValid = computed(() => {
  return form.value.email && 
         form.value.password && 
         !errors.value.email && 
         !errors.value.password;
});

const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!form.value.email) {
    errors.value.email = '请输入邮箱';
  } else if (!emailRegex.test(form.value.email)) {
    errors.value.email = '请输入有效的邮箱地址';
  } else {
    errors.value.email = '';
  }
};

const validatePassword = () => {
  if (!form.value.password) {
    errors.value.password = '请输入密码';
  } else if (form.value.password.length < 6) {
    errors.value.password = '密码至少6位';
  } else {
    errors.value.password = '';
  }
};

const handleLogin = async () => {
  validateEmail();
  validatePassword();

  if (!isFormValid.value) return;

  loading.value = true;
  try {
    await authStore.login(form.value.email, form.value.password);
    
    const toast = await toastController.create({
      message: '登录成功',
      duration: 2000,
      color: 'success',
      position: 'top',
    });
    await toast.present();

    router.push({ path: '/tabs/tab1', replace: true });
  } catch (error: any) {
    const toast = await toastController.create({
      message: error.message || '登录失败',
      duration: 3000,
      color: 'danger',
      position: 'top',
    });
    await toast.present();
  } finally {
    loading.value = false;
  }
};
</script>
```

### 6. Auth Store（Pinia）

```typescript
// src/stores/auth.ts
import { defineStore } from 'pinia';
import { Preferences } from '@capacitor/preferences';
import { authService } from '@/services/auth.service';
import type { User } from '@/types/user';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    loading: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    userName: (state) => state.user?.name || '未登录',
    userEmail: (state) => state.user?.email || '',
  },

  actions: {
    async login(email: string, password: string) {
      this.loading = true;
      try {
        const response = await authService.login({ email, password });
        
        this.user = response.user;
        this.token = response.token;

        // 持久化存储
        await Preferences.set({
          key: 'auth_token',
          value: response.token,
        });
        await Preferences.set({
          key: 'user_data',
          value: JSON.stringify(response.user),
        });

        return response;
      } catch (error) {
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      try {
        await authService.logout();
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        this.user = null;
        this.token = null;

        await Preferences.remove({ key: 'auth_token' });
        await Preferences.remove({ key: 'user_data' });
      }
    },

    async loadStoredAuth() {
      try {
        const { value: token } = await Preferences.get({ key: 'auth_token' });
        const { value: userData } = await Preferences.get({ key: 'user_data' });

        if (token && userData) {
          this.token = token;
          this.user = JSON.parse(userData);

          // 验证 token 是否有效
          const user = await authService.getCurrentUser();
          this.user = user;
        }
      } catch (error) {
        console.error('Load stored auth error:', error);
        await this.logout();
      }
    },

    async updateProfile(data: Partial<User>) {
      if (!this.user) return;

      const updated = await authService.updateProfile(data);
      this.user = { ...this.user, ...updated };

      await Preferences.set({
        key: 'user_data',
        value: JSON.stringify(this.user),
      });
    },
  },
});
```

### 7. Camera Composable

```typescript
// src/composables/useCamera.ts
import { ref } from 'vue';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { toastController } from '@ionic/vue';

export interface Photo {
  filepath: string;
  webviewPath: string;
  dataUrl?: string;
}

export function useCamera() {
  const photos = ref<Photo[]>([]);
  const loading = ref(false);

  const takePhoto = async () => {
    loading.value = true;
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 90,
        saveToGallery: true,
        correctOrientation: true,
      });

      const fileName = `${Date.now()}.jpeg`;
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: photo.base64String || '',
        directory: Directory.Data,
      });

      const newPhoto: Photo = {
        filepath: fileName,
        webviewPath: photo.webPath || '',
        dataUrl: `data:image/jpeg;base64,${photo.base64String}`,
      };

      photos.value.unshift(newPhoto);
      return newPhoto;
    } catch (error: any) {
      const toast = await toastController.create({
        message: '拍照失败',
        duration: 2000,
        color: 'danger',
      });
      await toast.present();
      return null;
    } finally {
      loading.value = false;
    }
  };

  const pickFromGallery = async () => {
    loading.value = true;
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        quality: 90,
      });

      const newPhoto: Photo = {
        filepath: `${Date.now()}.jpeg`,
        webviewPath: photo.webPath || '',
        dataUrl: `data:image/jpeg;base64,${photo.base64String}`,
      };

      photos.value.unshift(newPhoto);
      return newPhoto;
    } catch (error: any) {
      const toast = await toastController.create({
        message: '选择图片失败',
        duration: 2000,
        color: 'danger',
      });
      await toast.present();
      return null;
    } finally {
      loading.value = false;
    }
  };

  const deletePhoto = async (filepath: string) => {
    try {
      await Filesystem.deleteFile({
        path: filepath,
        directory: Directory.Data,
      });
      photos.value = photos.value.filter(p => p.filepath !== filepath);
    } catch (error) {
      console.error('Delete photo error:', error);
    }
  };

  return {
    photos,
    loading,
    takePhoto,
    pickFromGallery,
    deletePhoto,
  };
}
```

### 8. API 服务

```typescript
// src/services/api.ts
import { Preferences } from '@capacitor/preferences';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.example.com';

class ApiService {
  private async getHeaders(): Promise<HeadersInit> {
    const { value: token } = await Preferences.get({ key: 'auth_token' });
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: await this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }
}

export const api = new ApiService();
```

### 9. Capacitor 配置

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.ionicvue',
  appName: 'Ionic Vue App',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#3880ff',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#3880ff',
    },
    Camera: {
      saveToGallery: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  android: {
    buildOptions: {
      keystorePath: 'android.keystore',
      keystorePassword: process.env.KEYSTORE_PASSWORD,
      keystoreAlias: 'my-key',
      keystoreAliasPassword: process.env.KEY_ALIAS_PASSWORD,
    },
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
  },
};

export default config;
```

### 10. 主题变量

```css
/* src/theme/variables.css */
:root {
  /* Primary */
  --ion-color-primary: #3880ff;
  --ion-color-primary-rgb: 56, 128, 255;
  --ion-color-primary-contrast: #ffffff;
  --ion-color-primary-contrast-rgb: 255, 255, 255;
  --ion-color-primary-shade: #3171e0;
  --ion-color-primary-tint: #4c8dff;

  /* Secondary */
  --ion-color-secondary: #3dc2ff;
  --ion-color-secondary-rgb: 61, 194, 255;
  --ion-color-secondary-contrast: #ffffff;
  --ion-color-secondary-contrast-rgb: 255, 255, 255;
  --ion-color-secondary-shade: #36abe0;
  --ion-color-secondary-tint: #50c8ff;

  /* Tertiary */
  --ion-color-tertiary: #5260ff;
  --ion-color-tertiary-rgb: 82, 96, 255;
  --ion-color-tertiary-contrast: #ffffff;
  --ion-color-tertiary-contrast-rgb: 255, 255, 255;
  --ion-color-tertiary-shade: #4854e0;
  --ion-color-tertiary-tint: #636fff;

  /* Success */
  --ion-color-success: #2dd36f;
  --ion-color-success-rgb: 45, 211, 111;
  --ion-color-success-contrast: #ffffff;
  --ion-color-success-contrast-rgb: 255, 255, 255;
  --ion-color-success-shade: #28ba62;
  --ion-color-success-tint: #42d77d;

  /* Warning */
  --ion-color-warning: #ffc409;
  --ion-color-warning-rgb: 255, 196, 9;
  --ion-color-warning-contrast: #000000;
  --ion-color-warning-contrast-rgb: 0, 0, 0;
  --ion-color-warning-shade: #e0ac08;
  --ion-color-warning-tint: #ffca22;

  /* Danger */
  --ion-color-danger: #eb445a;
  --ion-color-danger-rgb: 235, 68, 90;
  --ion-color-danger-contrast: #ffffff;
  --ion-color-danger-contrast-rgb: 255, 255, 255;
  --ion-color-danger-shade: #cf3c4f;
  --ion-color-danger-tint: #ed576b;

  /* Dark */
  --ion-color-dark: #222428;
  --ion-color-dark-rgb: 34, 36, 40;
  --ion-color-dark-contrast: #ffffff;
  --ion-color-dark-contrast-rgb: 255, 255, 255;
  --ion-color-dark-shade: #1e2023;
  --ion-color-dark-tint: #383a3e;

  /* Medium */
  --ion-color-medium: #92949c;
  --ion-color-medium-rgb: 146, 148, 156;
  --ion-color-medium-contrast: #ffffff;
  --ion-color-medium-contrast-rgb: 255, 255, 255;
  --ion-color-medium-shade: #808289;
  --ion-color-medium-tint: #9d9fa6;

  /* Light */
  --ion-color-light: #f4f5f8;
  --ion-color-light-rgb: 244, 245, 248;
  --ion-color-light-contrast: #000000;
  --ion-color-light-contrast-rgb: 0, 0, 0;
  --ion-color-light-shade: #d7d8da;
  --ion-color-light-tint: #f5f6f9;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --ion-color-primary: #428cff;
    --ion-color-primary-rgb: 66,140,255;
    
    --ion-background-color: #1f1f1f;
    --ion-background-color-rgb: 31,31,31;

    --ion-text-color: #ffffff;
    --ion-text-color-rgb: 255,255,255;

    --ion-toolbar-background: #1f1f1f;
    --ion-item-background: #1e1e1e;
  }
}
```

## 最佳实践

### 1. 平台检测

```typescript
import { Capacitor } from '@capacitor/core';

const platform = Capacitor.getPlatform(); // 'web' | 'ios' | 'android'
const isNative = Capacitor.isNativePlatform();

if (isNative) {
  // 原生平台特定代码
} else {
  // Web 平台代码
}
```

### 2. 错误处理

```typescript
import { toastController } from '@ionic/vue';

async function showError(message: string) {
  const toast = await toastController.create({
    message,
    duration: 3000,
    color: 'danger',
    position: 'top',
  });
  await toast.present();
}

// 使用
try {
  await someAsyncOperation();
} catch (error) {
  await showError('操作失败，请重试');
}
```

### 3. 加载状态

```typescript
import { loadingController } from '@ionic/vue';

async function withLoading(message: string, fn: () => Promise<any>) {
  const loading = await loadingController.create({
    message,
    spinner: 'crescent',
  });
  
  await loading.present();
  
  try {
    return await fn();
  } finally {
    await loading.dismiss();
  }
}

// 使用
await withLoading('加载中...', async () => {
  await fetchData();
});
```

### 4. 生命周期钩子

```typescript
import { onIonViewWillEnter, onIonViewDidEnter, onIonViewWillLeave, onIonViewDidLeave } from '@ionic/vue';

// 页面即将进入
onIonViewWillEnter(() => {
  console.log('Page will enter');
});

// 页面已经进入
onIonViewDidEnter(() => {
  console.log('Page did enter');
  // 可以安全地执行 DOM 操作
});

// 页面即将离开
onIonViewWillLeave(() => {
  console.log('Page will leave');
});

// 页面已经离开
onIonViewDidLeave(() => {
  console.log('Page did leave');
});
```

## 常用命令

```bash
# 创建项目
npm create ionic-vue-app@latest my-app
# 或
ionic start my-app tabs --type vue

# 开发
ionic serve
ionic serve --lab  # 在浏览器中查看 iOS/Android 预览

# 添加平台
ionic cap add android
ionic cap add ios

# 构建
ionic build
ionic build --prod

# 同步
ionic cap sync
ionic cap sync android
ionic cap sync ios

# 打开原生 IDE
ionic cap open android
ionic cap open ios

# 运行
ionic cap run android -l
ionic cap run ios -l

# 测试
npm run test
npm run test:e2e

# Lint
npm run lint
```

## 部署配置

### 环境变量

```bash
# .env.development
VITE_API_URL=http://localhost:3000/api
VITE_PLATFORM=web

# .env.production
VITE_API_URL=https://api.example.com
VITE_PLATFORM=native
```

### Vite 配置

```typescript
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
    port: 8100,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          ionic: ['@ionic/vue', '@ionic/vue-router'],
        },
      },
    },
  },
});
```

### iOS 配置 (Info.plist)

```xml
<key>NSCameraUsageDescription</key>
<string>需要访问相机以拍照</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>需要访问相册以选择照片</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>需要访问位置以提供基于位置的服务</string>
```

### Android 配置 (AndroidManifest.xml)

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

## 参考资源

- [Ionic Vue 文档](https://ionicframework.com/docs/vue/overview)
- [Capacitor 文档](https://capacitorjs.com/docs)
- [Vue 3 文档](https://vuejs.org/)
- [Pinia 文档](https://pinia.vuejs.org/)
- [Ionic Icons](https://ionic.io/ionicons)

---

**最后更新**: 2026-03-17
