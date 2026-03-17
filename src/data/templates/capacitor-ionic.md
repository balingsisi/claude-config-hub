# Capacitor + Ionic 移动应用模板

## 项目概述

使用 Capacitor 和 Ionic 构建跨平台移动应用的现代化模板，支持 iOS、Android 和 Web 三端统一开发。

## 技术栈

- **框架**: Ionic Framework 7+ / React / Vue / Angular
- **运行时**: Capacitor 5+
- **语言**: TypeScript 5
- **样式**: Ionic CSS Components / CSS Variables
- **路由**: Ionic Router / React Router / Vue Router
- **状态管理**: React Context / Pinia / NgRx
- **原生插件**: Capacitor Community Plugins
- **构建工具**: Vite / Angular CLI
- **测试**: Jest / Cypress / Ionic Test Utils

## 项目结构

```
capacitor-ionic-app/
├── src/                      # 源代码
│   ├── app/                 # 应用主模块
│   │   ├── App.tsx         # 根组件
│   │   └── App.test.tsx    # 根组件测试
│   ├── pages/              # 页面组件
│   │   ├── Home.tsx
│   │   ├── Home.css
│   │   ├── Settings.tsx
│   │   └── Profile.tsx
│   ├── components/         # 可复用组件
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── CustomCard.tsx
│   ├── services/           # 业务服务
│   │   ├── api.ts         # API 请求
│   │   ├── auth.ts        # 认证服务
│   │   └── storage.ts     # 本地存储
│   ├── hooks/              # 自定义 Hooks
│   │   ├── useAuth.ts
│   │   └── useCamera.ts
│   ├── utils/              # 工具函数
│   │   ├── validators.ts
│   │   └── helpers.ts
│   ├── theme/              # 主题配置
│   │   ├── variables.css  # CSS 变量
│   │   └── custom.css     # 自定义样式
│   ├── types/              # TypeScript 类型
│   │   └── index.ts
│   └── main.tsx           # 应用入口
├── public/                  # 静态资源
│   └── assets/
│       ├── icon/
│       └── splash/
├── android/                 # Android 原生项目
│   ├── app/
│   └── capacitor.config.json
├── ios/                     # iOS 原生项目
│   ├── App/
│   └── capacitor.config.json
├── capacitor.config.ts      # Capacitor 配置
├── ionic.config.json        # Ionic CLI 配置
├── package.json
├── tsconfig.json
└── vite.config.ts          # Vite 配置
```

## 代码模式

### 1. 应用入口配置

```typescript
// src/main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 2. 根组件与路由

```typescript
// src/app/App.tsx
import React, { useEffect, useState } from 'react';
import { 
  IonApp, 
  IonRouterOutlet, 
  IonSplitPane,
  IonMenu,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenuToggle
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route } from 'react-router-dom';
import { 
  homeOutline, 
  settingsOutline, 
  personOutline,
  logOutOutline 
} from 'ionicons/icons';

import Home from '../pages/Home';
import Settings from '../pages/Settings';
import Profile from '../pages/Profile';

const menuItems = [
  { title: '首页', url: '/home', icon: homeOutline },
  { title: '个人资料', url: '/profile', icon: personOutline },
  { title: '设置', url: '/settings', icon: settingsOutline },
];

const App: React.FC = () => {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    // 检查认证状态
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('authToken');
    setIsAuth(!!token);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsAuth(false);
    window.location.href = '/home';
  };

  return (
    <IonApp>
      <IonReactRouter>
        <IonSplitPane contentId="main">
          {/* 侧边菜单 */}
          <IonMenu contentId="main" type="overlay">
            <IonContent>
              <IonList>
                {menuItems.map((item, index) => (
                  <IonMenuToggle key={index} autoHide={false}>
                    <IonItem 
                      routerLink={item.url} 
                      routerDirection="root"
                      lines="none"
                      detail={false}
                    >
                      <IonIcon slot="start" icon={item.icon} />
                      <IonLabel>{item.title}</IonLabel>
                    </IonItem>
                  </IonMenuToggle>
                ))}
                
                {isAuth && (
                  <IonMenuToggle autoHide={false}>
                    <IonItem 
                      button 
                      onClick={handleLogout}
                      lines="none"
                      detail={false}
                    >
                      <IonIcon slot="start" icon={logOutOutline} />
                      <IonLabel>退出登录</IonLabel>
                    </IonItem>
                  </IonMenuToggle>
                )}
              </IonList>
            </IonContent>
          </IonMenu>

          {/* 主内容区域 */}
          <IonRouterOutlet id="main">
            <Route path="/" exact>
              <Redirect to="/home" />
            </Route>
            <Route path="/home" exact component={Home} />
            <Route path="/profile" exact component={Profile} />
            <Route path="/settings" exact component={Settings} />
          </IonRouterOutlet>
        </IonSplitPane>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
```

### 3. 页面组件示例

```typescript
// src/pages/Home.tsx
import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonList,
  IonItem,
  IonLabel,
  IonSkeletonText,
  IonAlert,
} from '@ionic/react';
import { cameraOutline, refreshOutline } from 'ionicons/icons';
import { useCamera } from '../hooks/useCamera';
import { ApiService } from '../services/api';
import { Post } from '../types';

const Home: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const { takePhoto } = useCamera();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async (event?: CustomEvent<RefresherEventDetail>) => {
    try {
      const data = await ApiService.getPosts();
      setPosts(data);
    } catch (error) {
      console.error('Failed to load posts:', error);
      setShowAlert(true);
    } finally {
      setLoading(false);
      event?.detail.complete();
    }
  };

  const loadMore = async (event: CustomEvent<void>) => {
    const morePosts = await ApiService.getPosts(posts.length);
    setPosts([...posts, ...morePosts]);
    (event.target as HTMLIonInfiniteScrollElement).complete();
  };

  const handleRefresh = (event: CustomEvent<RefresherEventDetail>) => {
    loadPosts(event);
  };

  const handleCameraClick = async () => {
    const photo = await takePhoto();
    if (photo) {
      // 处理照片
      console.log('Photo taken:', photo.webPath);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>首页</IonTitle>
          <IonButton slot="end" fill="clear" onClick={handleCameraClick}>
            <IonIcon icon={cameraOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">首页</IonTitle>
          </IonToolbar>
        </IonHeader>

        {/* 下拉刷新 */}
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingIcon={refreshOutline}
            pullingText="下拉刷新"
            refreshingSpinner="circles"
            refreshingText="正在刷新..."
          />
        </IonRefresher>

        {/* 加载状态 */}
        {loading ? (
          <IonList>
            {[...Array(5)].map((_, i) => (
              <IonItem key={i}>
                <IonLabel>
                  <h3>
                    <IonSkeletonText animated style={{ width: '60%' }} />
                  </h3>
                  <p>
                    <IonSkeletonText animated style={{ width: '40%' }} />
                  </p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        ) : (
          <>
            {/* 内容卡片 */}
            {posts.map((post) => (
              <IonCard key={post.id} routerLink={`/post/${post.id}`}>
                <IonCardHeader>
                  <IonCardTitle>{post.title}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>{post.excerpt}</IonCardContent>
              </IonCard>
            ))}

            {/* 无限滚动 */}
            <IonInfiniteScroll onIonInfinite={loadMore} threshold="100px">
              <IonInfiniteScrollContent
                loadingSpinner="bubbles"
                loadingText="加载更多..."
              />
            </IonInfiniteScroll>
          </>
        )}

        {/* 错误提示 */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="错误"
          message="加载数据失败，请重试"
          buttons={['确定']}
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;
```

### 4. 自定义 Hooks

```typescript
// src/hooks/useCamera.ts
import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

export interface Photo {
  filepath: string;
  webviewPath?: string;
  base64?: string;
}

export function useCamera() {
  const [photos, setPhotos] = useState<Photo[]>([]);

  const takePhoto = async (): Promise<Photo | null> => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 100,
      });

      const fileName = new Date().getTime() + '.jpeg';
      
      // 保存到文件系统
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: photo.base64 || '',
        directory: Directory.Data,
      });

      const newPhoto: Photo = {
        filepath: fileName,
        webviewPath: photo.webPath,
        base64: photo.base64,
      };

      setPhotos((prev) => [newPhoto, ...prev]);
      
      return newPhoto;
    } catch (error) {
      console.error('Error taking photo:', error);
      return null;
    }
  };

  const deletePhoto = async (photo: Photo) => {
    try {
      await Filesystem.deleteFile({
        path: photo.filepath,
        directory: Directory.Data,
      });
      
      setPhotos((prev) => prev.filter((p) => p.filepath !== photo.filepath));
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  const loadSaved = async () => {
    try {
      const { value } = await Preferences.get({ key: 'photos' });
      if (value) {
        const savedPhotos = JSON.parse(value) as Photo[];
        
        // 重新加载照片
        for (const photo of savedPhotos) {
          const file = await Filesystem.readFile({
            path: photo.filepath,
            directory: Directory.Data,
          });
          photo.base64 = `data:image/jpeg;base64,${file.data}`;
        }
        
        setPhotos(savedPhotos);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  return {
    photos,
    takePhoto,
    deletePhoto,
    loadSaved,
  };
}

// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { Preferences } from '@capacitor/preferences';
import { ApiService } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { value: token } = await Preferences.get({ key: 'authToken' });
      if (token) {
        const userData = await ApiService.getCurrentUser();
        setUser(userData);
      }
    } catch (err) {
      setError('认证失败');
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { token, user: userData } = await ApiService.login(email, password);
      await Preferences.set({ key: 'authToken', value: token });
      setUser(userData);
      return true;
    } catch (err) {
      setError('登录失败，请检查邮箱和密码');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await Preferences.remove({ key: 'authToken' });
      setUser(null);
    } catch (err) {
      setError('退出登录失败');
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { token, user: userData } = await ApiService.register(email, password, name);
      await Preferences.set({ key: 'authToken', value: token });
      setUser(userData);
      return true;
    } catch (err) {
      setError('注册失败，请重试');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    error,
    login,
    logout,
    register,
    checkAuth,
  };
}
```

### 5. API 服务

```typescript
// src/services/api.ts
import { Preferences } from '@capacitor/preferences';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.example.com';

class ApiServiceClass {
  private async getHeaders(): Promise<HeadersInit> {
    const { value: token } = await Preferences.get({ key: 'authToken' });
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '请求失败');
    }
    
    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });
    
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    
    return this.handleResponse<T>(response);
  }

  // 认证相关
  async login(email: string, password: string) {
    return this.post<{ token: string; user: any }>('/auth/login', {
      email,
      password,
    });
  }

  async register(email: string, password: string, name: string) {
    return this.post<{ token: string; user: any }>('/auth/register', {
      email,
      password,
      name,
    });
  }

  async getCurrentUser() {
    return this.get<any>('/auth/me');
  }

  // 帖子相关
  async getPosts(offset = 0, limit = 10) {
    return this.get<any[]>(`/posts?offset=${offset}&limit=${limit}`);
  }

  async getPost(id: string) {
    return this.get<any>(`/posts/${id}`);
  }

  async createPost(data: { title: string; content: string }) {
    return this.post<any>('/posts', data);
  }
}

export const ApiService = new ApiServiceClass();
```

### 6. 主题配置

```css
/* src/theme/variables.css */
:root {
  /* 主色调 */
  --ion-color-primary: #3880ff;
  --ion-color-primary-rgb: 56, 128, 255;
  --ion-color-primary-contrast: #ffffff;
  --ion-color-primary-contrast-rgb: 255, 255, 255;
  --ion-color-primary-shade: #3171e0;
  --ion-color-primary-tint: #4c8dff;

  /* 次要色调 */
  --ion-color-secondary: #5260ff;
  --ion-color-secondary-rgb: 82, 96, 255;
  --ion-color-secondary-contrast: #ffffff;
  --ion-color-secondary-contrast-rgb: 255, 255, 255;
  --ion-color-secondary-shade: #4854e0;
  --ion-color-secondary-tint: #636fff;

  /* 成功色 */
  --ion-color-success: #2dd36f;
  --ion-color-success-rgb: 45, 211, 111;
  --ion-color-success-contrast: #000000;
  --ion-color-success-contrast-rgb: 0, 0, 0;
  --ion-color-success-shade: #28ba62;
  --ion-color-success-tint: #42d77d;

  /* 警告色 */
  --ion-color-warning: #ffc409;
  --ion-color-warning-rgb: 255, 196, 9;
  --ion-color-warning-contrast: #000000;
  --ion-color-warning-contrast-rgb: 0, 0, 0;
  --ion-color-warning-shade: #e0ac08;
  --ion-color-warning-tint: #ffca22;

  /* 危险色 */
  --ion-color-danger: #eb445a;
  --ion-color-danger-rgb: 235, 68, 90;
  --ion-color-danger-contrast: #ffffff;
  --ion-color-danger-contrast-rgb: 255, 255, 255;
  --ion-color-danger-shade: #cf3c4f;
  --ion-color-danger-tint: #ed576b;

  /* 中等色 */
  --ion-color-medium: #92949c;
  --ion-color-medium-rgb: 146, 148, 156;
  --ion-color-medium-contrast: #000000;
  --ion-color-medium-contrast-rgb: 0, 0, 0;
  --ion-color-medium-shade: #808289;
  --ion-color-medium-tint: #9d9fa6;

  /* 浅色 */
  --ion-color-light: #f4f5f8;
  --ion-color-light-rgb: 244, 245, 248;
  --ion-color-light-contrast: #000000;
  --ion-color-light-contrast-rgb: 0, 0, 0;
  --ion-color-light-shade: #d7d8da;
  --ion-color-light-tint: #f5f6f9;

  /* 字体 */
  --ion-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
    'Helvetica Neue', Arial, sans-serif;
}

/* 暗色主题 */
@media (prefers-color-scheme: dark) {
  :root {
    --ion-color-primary: #428cff;
    --ion-color-primary-rgb: 66,140,255;
    --ion-color-primary-contrast: #ffffff;
    --ion-color-primary-contrast-rgb: 255,255,255;
    --ion-color-primary-shade: #3a7be0;
    --ion-color-primary-tint: #5598ff;

    --ion-background-color: #1f1f1f;
    --ion-background-color-rgb: 31,31,31;

    --ion-text-color: #ffffff;
    --ion-text-color-rgb: 255,255,255;

    --ion-toolbar-background: #1f1f1f;
    --ion-item-background: #1e1e1e;
  }
}

/* 自定义样式 */
/* src/theme/custom.css */
ion-card {
  --background: var(--ion-color-light);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

ion-card-header {
  padding-bottom: 0;
}

ion-card-title {
  font-size: 1.2rem;
  font-weight: 600;
}

ion-item {
  --padding-start: 16px;
  --padding-end: 16px;
  --inner-padding-end: 0;
}

ion-button {
  --border-radius: 8px;
  text-transform: none;
  font-weight: 500;
}

ion-searchbar {
  --background: var(--ion-color-light);
  --border-radius: 12px;
  --box-shadow: none;
}
```

### 7. Capacitor 配置

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'My Ionic App',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#3880ff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    Camera: {
      permissions: {
        camera: '需要访问相机以拍照',
        photos: '需要访问相册以上传照片',
      },
    },
    Geolocation: {
      permissions: {
        location: '需要访问位置以提供本地化服务',
      },
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    preferredContentMode: 'mobile',
  },
};

export default config;
```

## 最佳实践

### 1. 原生插件集成

```typescript
// src/plugins/geolocation.ts
import { Geolocation, Position } from '@capacitor/geolocation';

export class LocationService {
  private static watchId: string | null = null;

  static async getCurrentPosition(): Promise<Position> {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });
      return position;
    } catch (error) {
      console.error('Error getting location:', error);
      throw error;
    }
  }

  static startWatching(
    callback: (position: Position) => void,
    errorCallback?: (error: any) => void
  ) {
    this.watchId = Geolocation.watchPosition(
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
      (position, error) => {
        if (error && errorCallback) {
          errorCallback(error);
          return;
        }
        if (position) {
          callback(position);
        }
      }
    );
  }

  static async stopWatching() {
    if (this.watchId) {
      await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
    }
  }
}

// src/plugins/notifications.ts
import { PushNotifications, Token, PushNotificationSchema } from '@capacitor/push-notifications';

export class NotificationService {
  static async init() {
    // 请求权限
    const result = await PushNotifications.requestPermissions();
    
    if (result.receive === 'granted') {
      // 注册推送通知
      await PushNotifications.register();
    }

    // 监听注册成功
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token: ' + token.value);
      // 发送 token 到服务器
    });

    // 监听注册失败
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    // 监听推送通知
    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('Push received: ' + JSON.stringify(notification));
      }
    );

    // 监听通知点击
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action) => {
        console.log('Push action performed: ' + JSON.stringify(action));
        // 处理通知点击
      }
    );
  }
}
```

### 2. 性能优化

```typescript
// 使用虚拟滚动优化长列表
import { IonVirtualScroll, IonItem, IonLabel } from '@ionic/react';

const VirtualList: React.FC = () => {
  const items = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
  }));

  return (
    <IonContent>
      <IonVirtualScroll
        items={items}
        renderItem={(item: any) => (
          <IonItem>
            <IonLabel>{item.name}</IonLabel>
          </IonItem>
        )}
      />
    </IonContent>
  );
};

// 懒加载组件
import React, { lazy, Suspense } from 'react';

const LazyPage = lazy(() => import('../pages/LazyPage'));

const App: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyPage />
    </Suspense>
  );
};

// 图片优化
import { IonImg } from '@ionic/react';

<IonImg
  src="https://example.com/image.jpg"
  alt="Description"
  onIonImgWillLoad={() => console.log('Image will load')}
  onIonImgDidLoad={() => console.log('Image loaded')}
  onIonError={(e) => console.error('Image error', e)}
/>
```

### 3. 响应式设计

```typescript
// src/hooks/usePlatform.ts
import { useIonBreakpoint } from '@ionic/react';
import { isPlatform } from '@ionic/react';

export function usePlatform() {
  const breakpoint = useIonBreakpoint();
  
  return {
    isMobile: breakpoint === 'xs' || breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: breakpoint === 'lg' || breakpoint === 'xl',
    isIOS: isPlatform('ios'),
    isAndroid: isPlatform('android'),
    isWeb: isPlatform('desktop') || isPlatform('mobileweb'),
    isHybrid: isPlatform('hybrid'),
    breakpoint,
  };
}

// 使用示例
const MyComponent: React.FC = () => {
  const { isMobile, isIOS } = usePlatform();
  
  return (
    <div>
      {isMobile ? <MobileLayout /> : <DesktopLayout />}
      {isIOS && <IOSSpecificFeature />}
    </div>
  );
};
```

### 4. 本地存储

```typescript
// src/services/storage.ts
import { Preferences } from '@capacitor/preferences';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

export class StorageService {
  // 普通存储
  static async set(key: string, value: any): Promise<void> {
    await Preferences.set({
      key,
      value: JSON.stringify(value),
    });
  }

  static async get<T>(key: string): Promise<T | null> {
    const { value } = await Preferences.get({ key });
    return value ? JSON.parse(value) : null;
  }

  static async remove(key: string): Promise<void> {
    await Preferences.remove({ key });
  }

  static async clear(): Promise<void> {
    await Preferences.clear();
  }

  // 安全存储（敏感数据）
  static async setSecure(key: string, value: string): Promise<void> {
    await SecureStoragePlugin.set({ key, value });
  }

  static async getSecure(key: string): Promise<string | null> {
    try {
      const { value } = await SecureStoragePlugin.get({ key });
      return value;
    } catch {
      return null;
    }
  }

  static async removeSecure(key: string): Promise<void> {
    await SecureStoragePlugin.delete({ key });
  }
}
```

### 5. 错误处理

```typescript
// src/utils/errorHandler.ts
import { isPlatform } from '@ionic/react';
import { Toast } from '@capacitor/toast';

export class ErrorHandler {
  static async handleError(error: any, context?: string) {
    console.error(`Error ${context ? `in ${context}:` : ':'}`, error);

    const message = this.getErrorMessage(error);
    
    // 显示错误提示
    if (isPlatform('hybrid')) {
      await Toast.show({
        text: message,
        duration: 'long',
        position: 'bottom',
      });
    } else {
      // Web 端使用 alert
      alert(message);
    }
  }

  private static getErrorMessage(error: any): string {
    if (error.message) {
      return error.message;
    }
    
    if (error.status === 401) {
      return '未授权，请重新登录';
    }
    
    if (error.status === 404) {
      return '请求的资源不存在';
    }
    
    if (error.status === 500) {
      return '服务器错误，请稍后重试';
    }
    
    if (!navigator.onLine) {
      return '网络连接已断开';
    }
    
    return '发生未知错误，请重试';
  }
}

// 全局错误捕获
window.addEventListener('error', (event) => {
  ErrorHandler.handleError(event.error, 'Global Error');
});

window.addEventListener('unhandledrejection', (event) => {
  ErrorHandler.handleError(event.reason, 'Unhandled Promise');
});
```

## 常用命令

### 开发命令
```bash
# 安装依赖
npm install

# 启动开发服务器
ionic serve

# 启动开发服务器（指定平台）
ionic serve --platform=ios
ionic serve --platform=android

# 实时重载
ionic serve --lab

# 构建生产版本
ionic build

# 类型检查
npm run type-check
```

### Capacitor 命令
```bash
# 添加平台
ionic cap add ios
ionic cap add android

# 同步原生项目
ionic cap sync

# 打开 IDE
ionic cap open ios
ionic cap open android

# 运行在设备
ionic cap run ios
ionic cap run android

# 实时重载到设备
ionic cap run ios --livereload
ionic cap run android --livereload

# 复制 Web 资源
ionic cap copy

# 更新插件
npm install @capacitor/plugin-name
ionic cap sync
```

### 原生插件
```bash
# 安装常用插件
npm install @capacitor/camera
npm install @capacitor/geolocation
npm install @capacitor/push-notifications
npm install @capacitor/share
npm install @capacitor/browser
npm install @capacitor/keyboard

# 同步插件
ionic cap sync
```

### 测试命令
```bash
# 运行单元测试
npm test

# 运行 E2E 测试
npm run e2e

# 测试覆盖率
npm run test:coverage

# Lint 检查
npm run lint
```

## 部署配置

### iOS 配置

```xml
<!-- ios/App/App/Info.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDisplayName</key>
  <string>My App</string>
  
  <key>CFBundleIdentifier</key>
  <string>com.example.app</string>
  
  <key>NSCameraUsageDescription</key>
  <string>需要访问相机以拍照</string>
  
  <key>NSPhotoLibraryUsageDescription</key>
  <string>需要访问相册以上传照片</string>
  
  <key>NSLocationWhenInUseUsageDescription</key>
  <string>需要访问位置以提供本地化服务</string>
  
  <key>UIBackgroundModes</key>
  <array>
    <string>remote-notification</string>
  </array>
</dict>
</plist>
```

### Android 配置

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.app">

    <!-- 权限 -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">
        
        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### 环境变量配置

```bash
# .env.development
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=My App Dev
VITE_ENABLE_DEBUG=true

# .env.production
VITE_API_URL=https://api.example.com
VITE_APP_NAME=My App
VITE_ENABLE_DEBUG=false
```

### CI/CD 配置

```yaml
# .github/workflows/build.yml
name: Build and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build web
        run: npm run build
      
      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: web-build
          path: dist/

  build-ios:
    runs-on: macos-latest
    needs: build-web
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Download web build
        uses: actions/download-artifact@v3
        with:
          name: web-build
          path: dist/
      
      - name: Sync iOS
        run: npx cap sync ios
      
      - name: Build iOS
        run: |
          cd ios/App
          xcodebuild -workspace App.xcworkspace -scheme App -configuration Release -sdk iphoneos -archivePath build/App.xcarchive archive
          xcodebuild -exportArchive -archivePath build/App.xcarchive -exportOptionsPlist ExportOptions.plist -exportPath build/

  build-android:
    runs-on: ubuntu-latest
    needs: build-web
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Download web build
        uses: actions/download-artifact@v3
        with:
          name: web-build
          path: dist/
      
      - name: Sync Android
        run: npx cap sync android
      
      - name: Build Android
        run: |
          cd android
          ./gradlew assembleRelease
```

## 调试技巧

### iOS 调试
```bash
# 查看日志
ionic cap run ios --livereload --consolelogs

# Safari 开发者工具
# Safari -> 开发 -> 模拟器 -> 网页检查器

# Xcode 控制台
# 在 Xcode 中打开项目，运行并查看控制台输出
```

### Android 调试
```bash
# 查看日志
ionic cap run android --livereload --consolelogs

# Chrome DevTools
# chrome://inspect/#devices

# ADB 日志
adb logcat | grep -i "chromium"
```

### Web 调试
```bash
# 启动开发服务器
ionic serve

# 浏览器开发者工具
# F12 -> 开发者工具
```

## 性能优化清单

- [ ] 启用生产模式构建
- [ ] 压缩图片资源
- [ ] 使用虚拟滚动处理长列表
- [ ] 实现懒加载
- [ ] 启用 Gzip 压缩
- [ ] 使用 Service Worker 缓存
- [ ] 优化 API 请求（分页、缓存）
- [ ] 减少 HTTP 请求
- [ ] 使用 CDN 加速静态资源
- [ ] 启用原生功能预加载

## 参考资源

- [Ionic Framework 文档](https://ionicframework.com/docs)
- [Capacitor 文档](https://capacitorjs.com/docs)
- [Ionic React 文档](https://ionicframework.com/docs/react)
- [Capacitor 插件市场](https://capacitorjs.com/docs/plugins)
- [Ionic 社区](https://forum.ionicframework.com/)
- [Capacitor GitHub](https://github.com/ionic-team/capacitor)
