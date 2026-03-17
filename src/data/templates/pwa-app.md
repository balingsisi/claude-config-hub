# Progressive Web App (PWA) Template

## 技术栈

### 核心框架
- **Vite PWA** - PWA 插件
- **Workbox** - Service Worker 工具库
- **React/Vue/Svelte** - 前端框架（可选）

### PWA 特性
- **Service Worker** - 离线缓存
- **Web App Manifest** - 应用清单
- **Push Notifications** - 推送通知
- **Background Sync** - 后台同步

### 缓存策略
- **Cache First** - 缓存优先
- **Network First** - 网络优先
- **Stale While Revalidate** - 缓存+后台更新
- **Network Only** - 仅网络

### 工具链
- **vite-plugin-pwa** - Vite PWA 插件
- **workbox-window** - Workbox 客户端
- **TypeScript** - 类型安全

## 项目结构

```
pwa-app/
├── public/
│   ├── icons/              # PWA 图标
│   │   ├── icon-72x72.png
│   │   ├── icon-96x96.png
│   │   ├── icon-128x128.png
│   │   ├── icon-144x144.png
│   │   ├── icon-152x152.png
│   │   ├── icon-192x192.png
│   │   ├── icon-384x384.png
│   │   └── icon-512x512.png
│   ├── favicon.ico
│   ├── manifest.json       # Web App Manifest
│   ├── robots.txt
│   └── sw.js              # Service Worker (可选)
├── src/
│   ├── components/         # UI 组件
│   │   ├── InstallPrompt.tsx
│   │   ├── NotificationPermission.tsx
│   │   └── OfflineIndicator.tsx
│   ├── hooks/             # PWA Hooks
│   │   ├── usePWA.ts
│   │   ├── useNotifications.ts
│   │   ├── useOffline.ts
│   │   └── useBackgroundSync.ts
│   ├── workers/           # Web Workers
│   │   └── sync-worker.ts
│   ├── utils/             # 工具函数
│   │   ├── cache.ts
│   │   ├── push-notifications.ts
│   │   └── storage.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── vite.config.ts         # Vite 配置
├── tsconfig.json
├── package.json
└── .env                   # 环境变量
```

## 代码模式

### Vite PWA 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'My PWA App',
        short_name: 'PWA App',
        description: 'My Progressive Web Application',
        theme_color: '#007bff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.example\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'unsplash-images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
});
```

### Web App Manifest

```json
// public/manifest.json
{
  "name": "My PWA Application",
  "short_name": "PWA App",
  "description": "A modern Progressive Web Application",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#007bff",
  "orientation": "portrait-primary",
  "scope": "/",
  "lang": "en-US",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/screenshot1.png",
      "sizes": "1280x720",
      "type": "image/png",
      "label": "Home Screen"
    },
    {
      "src": "/screenshots/screenshot2.png",
      "sizes": "1280x720",
      "type": "image/png",
      "label": "Feature Showcase"
    }
  ],
  "shortcuts": [
    {
      "name": "New Post",
      "short_name": "New",
      "description": "Create a new post",
      "url": "/new",
      "icons": [{ "src": "/icons/new-post.png", "sizes": "192x192" }]
    },
    {
      "name": "Profile",
      "short_name": "Profile",
      "description": "View your profile",
      "url": "/profile",
      "icons": [{ "src": "/icons/profile.png", "sizes": "192x192" }]
    }
  ],
  "categories": ["productivity", "utilities"],
  "prefer_related_applications": false,
  "related_applications": [
    {
      "platform": "play",
      "url": "https://play.google.com/store/apps/details?id=com.example.app",
      "id": "com.example.app"
    },
    {
      "platform": "itunes",
      "url": "https://apps.apple.com/app/example-app/id123456789"
    }
  ]
}
```

### Service Worker 注册

```typescript
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { registerSW } from 'virtual:pwa-register';

// 注册 Service Worker
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
  onRegistered(registration) {
    console.log('SW Registered:', registration);
  },
  onRegisterError(error) {
    console.error('SW registration error:', error);
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### PWA Hooks

```typescript
// src/hooks/usePWA.ts
import { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function usePWA() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return {
    needRefresh,
    offlineReady,
    updateServiceWorker,
    close,
  };
}
```

```typescript
// src/hooks/useOffline.ts
import { useState, useEffect } from 'react';

export function useOffline() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOffline;
}
```

```typescript
// src/hooks/useNotifications.ts
import { useState, useEffect } from 'react';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) return false;

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') return;

    const notification = new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  };

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
  };
}
```

### UI 组件

```typescript
// src/components/InstallPrompt.tsx
import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="install-prompt">
      <div className="prompt-content">
        <h3>Install App</h3>
        <p>Install this application on your device for a better experience.</p>
        <div className="prompt-actions">
          <button onClick={handleInstall}>Install</button>
          <button onClick={handleDismiss}>Not Now</button>
        </div>
      </div>
    </div>
  );
}
```

```typescript
// src/components/OfflineIndicator.tsx
import React from 'react';
import { useOffline } from '../hooks/useOffline';

export function OfflineIndicator() {
  const isOffline = useOffline();

  if (!isOffline) return null;

  return (
    <div className="offline-indicator">
      <span>⚠️</span>
      <span>You are currently offline</span>
    </div>
  );
}
```

```typescript
// src/components/NotificationPermission.tsx
import React from 'react';
import { useNotifications } from '../hooks/useNotifications';

export function NotificationPermission() {
  const { isSupported, permission, requestPermission } = useNotifications();

  if (!isSupported || permission === 'granted') return null;

  return (
    <div className="notification-permission">
      <p>Enable notifications to receive updates</p>
      <button onClick={requestPermission}>Enable Notifications</button>
    </div>
  );
}
```

### 缓存策略

```typescript
// src/utils/cache.ts
const CACHE_NAME = 'my-pwa-cache-v1';

// 缓存资源
export async function cacheResources(resources: string[]) {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(resources);
}

// 从缓存中获取资源
export async function getCachedResource(request: Request): Promise<Response | undefined> {
  const cache = await caches.open(CACHE_NAME);
  return await cache.match(request);
}

// 缓存单个资源
export async function cacheResource(request: Request, response: Response) {
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response);
}

// 清除旧缓存
export async function clearOldCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter((name) => name !== CACHE_NAME)
      .map((name) => caches.delete(name))
  );
}

// 缓存优先策略
export async function cacheFirst(request: Request): Promise<Response> {
  const cached = await getCachedResource(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    await cacheResource(request, response.clone());
  }
  return response;
}

// 网络优先策略
export async function networkFirst(request: Request): Promise<Response> {
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cacheResource(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await getCachedResource(request);
    if (cached) return cached;
    throw error;
  }
}

// Stale While Revalidate 策略
export async function staleWhileRevalidate(request: Request): Promise<Response> {
  const cached = await getCachedResource(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cacheResource(request, response.clone());
    }
    return response;
  });

  return cached || fetchPromise;
}
```

### 推送通知

```typescript
// src/utils/push-notifications.ts
export async function subscribeToPush(vapidPublicKey: string) {
  if (!('serviceWorker' in navigator)) return null;

  const registration = await navigator.serviceWorker.ready;
  
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  // 发送订阅到服务器
  await fetch('/api/push/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return subscription;
}

export async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    await subscription.unsubscribe();
    
    // 通知服务器
    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// 辅助函数：将 Base64 字符串转换为 Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
```

### 后台同步

```typescript
// src/workers/sync-worker.ts
// 注册后台同步
export async function registerBackgroundSync(tag: string) {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  
  if ('sync' in registration) {
    await (registration as any).sync.register(tag);
  }
}

// 周期性后台同步
export async function registerPeriodicSync(tag: string, minInterval: number) {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  
  if ('periodicSync' in registration) {
    const status = await navigator.permissions.query({
      name: 'periodic-background-sync' as any,
    });

    if (status.state === 'granted') {
      await (registration as any).periodicSync.register(tag, {
        minInterval,
      });
    }
  }
}

// 取消周期性同步
export async function unregisterPeriodicSync(tag: string) {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  
  if ('periodicSync' in registration) {
    await (registration as any).periodicSync.unregister(tag);
  }
}
```

## 最佳实践

### 1. 缓存策略选择

```typescript
// ✅ 静态资源：缓存优先
{
  urlPattern: /\.(?:js|css|html|png|jpg|svg|woff2)$/,
  handler: 'CacheFirst',
  options: {
    cacheName: 'static-resources',
    expiration: {
      maxEntries: 100,
      maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
    },
  },
}

// ✅ API 请求：网络优先
{
  urlPattern: /^https:\/\/api\.example\.com\/.*/i,
  handler: 'NetworkFirst',
  options: {
    cacheName: 'api-cache',
    networkTimeoutSeconds: 10,
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 60 * 60 * 24, // 24 hours
    },
  },
}

// ✅ 图片资源：Stale While Revalidate
{
  urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
  handler: 'StaleWhileRevalidate',
  options: {
    cacheName: 'images-cache',
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
    },
  },
}
```

### 2. 离线页面

```typescript
// src/components/OfflinePage.tsx
import React from 'react';

export function OfflinePage() {
  return (
    <div className="offline-page">
      <div className="offline-content">
        <h1>🙁 You're Offline</h1>
        <p>It seems you've lost your internet connection.</p>
        <p>Some features may not be available.</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    </div>
  );
}
```

### 3. 性能优化

```typescript
// ✅ 预缓存关键资源
workbox.precaching.precacheAndRoute([
  { url: '/', revision: '123456' },
  { url: '/index.html', revision: '123456' },
  { url: '/styles/main.css', revision: '123456' },
  { url: '/scripts/main.js', revision: '123456' },
]);

// ✅ 延迟加载非关键资源
const lazyLoad = (selector: string) => {
  const elements = document.querySelectorAll(selector);
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const element = entry.target as HTMLImageElement;
        element.src = element.dataset.src || '';
        observer.unobserve(element);
      }
    });
  });

  elements.forEach((element) => observer.observe(element));
};

lazyLoad('img[data-src]');
```

### 4. 安全考虑

```typescript
// ✅ 使用 HTTPS
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
  location.href = location.href.replace('http:', 'https:');
}

// ✅ 验证推送订阅
export async function validateSubscription(subscription: PushSubscription) {
  const response = await fetch('/api/push/validate', {
    method: 'POST',
    body: JSON.stringify(subscription),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.ok;
}

// ✅ 清理敏感数据
export async function clearSensitiveData() {
  const cache = await caches.open('sensitive-data');
  await caches.delete('sensitive-data');
  localStorage.clear();
  sessionStorage.clear();
}
```

### 5. 测试策略

```typescript
// src/tests/pwa.test.ts
import { describe, it, expect, vi } from 'vitest';

describe('PWA Features', () => {
  it('should register service worker', async () => {
    const registerSpy = vi.spyOn(navigator.serviceWorker, 'register');
    // ... 触发注册
    expect(registerSpy).toHaveBeenCalled();
  });

  it('should cache resources', async () => {
    const cache = await caches.open('test-cache');
    await cache.add('/test.html');
    const response = await cache.match('/test.html');
    expect(response).toBeDefined();
  });

  it('should handle offline mode', () => {
    // 模拟离线
    Object.defineProperty(navigator, 'onLine', { value: false });
    // ... 测试离线逻辑
  });
});
```

## 常用命令

### 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 运行测试
npm test

# Lighthouse 审计
npm run lighthouse
```

### PWA 工具

```bash
# 生成图标
npx pwa-asset-generator ./logo.png ./public/icons

# 验证 manifest
npx pwabuilder-manifest-validation

# 测试 PWA
npx @popeindustries/lighthouse

# Workbox CLI
npx workbox wizard
npx workbox generateSW workbox-config.js
npx workbox injectManifest workbox-config.js
```

### Lighthouse 命令

```bash
# 运行 Lighthouse
lighthouse https://example.com --view

# 生成报告
lighthouse https://example.com --output html --output-path ./report.html

# 仅检查 PWA
lighthouse https://example.com --only-categories=pwa

# CI 模式
lighthouse https://example.com --output json --output-path ./report.json --chrome-flags="--headless"
```

## 部署配置

### 1. HTTPS 配置

```nginx
# nginx.conf
server {
  listen 443 ssl http2;
  server_name example.com;

  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;
  ssl_protocols TLSv1.2 TLSv1.3;

  root /var/www/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /sw.js {
    add_header Cache-Control "no-cache";
    proxy_cache_bypass $http_pragma;
    proxy_cache_revalidate on;
    expires off;
    access_log off;
  }

  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}

server {
  listen 80;
  server_name example.com;
  return 301 https://$server_name$request_uri;
}
```

### 2. GitHub Pages 部署

```yaml
# .github/workflows/deploy-pwa.yml
name: Deploy PWA to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 3. Vercel 部署

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### 4. Netlify 部署

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 5. AWS S3 + CloudFront 部署

```bash
# 构建应用
npm run build

# 同步到 S3
aws s3 sync dist/ s3://my-pwa-bucket --delete

# 设置正确的 MIME 类型
aws s3 sync dist/ s3://my-pwa-bucket \
  --delete \
  --exclude "*" \
  --include "*.js" \
  --content-type "application/javascript"

aws s3 sync dist/ s3://my-pwa-bucket \
  --delete \
  --exclude "*" \
  --include "*.css" \
  --content-type "text/css"

# 使 CloudFront 缓存失效
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

### 6. Firebase 部署

```bash
# 安装 Firebase CLI
npm install -g firebase-tools

# 初始化
firebase init hosting

# 构建
npm run build

# 部署
firebase deploy
```

```json
// firebase.json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/sw.js",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      }
    ]
  }
}
```

## 总结

PWA 是构建现代 Web 应用的最佳实践，特别适合：
- **移动优先应用** - 原生应用般的体验
- **离线应用** - 在无网络环境下工作
- **快速加载** - 缓存策略优化性能
- **可安装** - 添加到主屏幕

关键优势：
✅ 跨平台（一次开发，处处运行）
✅ 离线功能
✅ 推送通知
✅ 后台同步
✅ 应用商店独立
✅ SEO 友好

适用场景：
- 移动端 Web 应用
- 离线优先应用
- 内容型应用
- 电商应用
- 社交媒体应用
- 工具类应用
- 新闻阅读应用
