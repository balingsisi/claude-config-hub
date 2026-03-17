# PWA Studio 渐进式Web应用模板

## 技术栈

- **核心框架**: Vite + PWA Plugin / Next.js PWA
- **Service Worker**: Workbox / Vite PWA
- **缓存策略**: Cache First / Network First / Stale While Revalidate
- **推送通知**: Web Push API
- **后台同步**: Background Sync API
- **清单文件**: Web App Manifest
- **安装提示**: A2HS (Add to Home Screen)
- **类型**: TypeScript

## 项目结构

```
pwa-studio/
├── public/
│   ├── icons/               # PWA 图标
│   │   ├── icon-72x72.png
│   │   ├── icon-96x96.png
│   │   ├── icon-128x128.png
│   │   ├── icon-144x144.png
│   │   ├── icon-152x152.png
│   │   ├── icon-192x192.png
│   │   ├── icon-384x384.png
│   │   └── icon-512x512.png
│   ├── favicon.ico
│   ├── manifest.json        # Web App Manifest
│   ├── robots.txt
│   └── sw.js                # Service Worker
├── src/
│   ├── components/
│   │   ├── InstallPrompt.tsx    # 安装提示组件
│   │   ├── OfflineIndicator.tsx # 离线指示器
│   │   └── NotificationPermission.tsx
│   ├── hooks/
│   │   ├── usePWA.ts           # PWA 状态钩子
│   │   ├── useOffline.ts       # 离线状态
│   │   └── useNotification.ts  # 通知钩子
│   ├── workers/
│   │   ├── sw.ts               # Service Worker 源码
│   │   └── sync.ts             # 后台同步
│   ├── utils/
│   │   ├── cache.ts            # 缓存工具
│   │   └── notification.ts     # 通知工具
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── vite.config.ts
├── tsconfig.json
└── package.json
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
      includeAssets: ['favicon.ico', 'icons/*.png', 'robots.txt'],
      manifest: {
        name: 'My PWA App',
        short_name: 'PWA App',
        description: 'A Progressive Web Application',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
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
            purpose: 'maskable',
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
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /^https:\/\/cdn\.example\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  build: {
    sourcemap: true,
  },
});
```

### Web App Manifest

```json
// public/manifest.json
{
  "name": "My PWA Application",
  "short_name": "PWA App",
  "description": "A modern Progressive Web Application with offline support",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#3b82f6",
  "background_color": "#ffffff",
  "categories": ["productivity", "utilities"],
  "lang": "zh-CN",
  "dir": "ltr",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/maskable-icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/home.png",
      "sizes": "1280x720",
      "type": "image/png",
      "label": "Home Screen"
    },
    {
      "src": "/screenshots/dashboard.png",
      "sizes": "1280x720",
      "type": "image/png",
      "label": "Dashboard"
    }
  ],
  "shortcuts": [
    {
      "name": "Dashboard",
      "short_name": "Dashboard",
      "description": "Go to Dashboard",
      "url": "/dashboard",
      "icons": [{ "src": "/icons/dashboard-icon.png", "sizes": "96x96" }]
    },
    {
      "name": "New Post",
      "short_name": "New Post",
      "description": "Create a new post",
      "url": "/posts/new",
      "icons": [{ "src": "/icons/new-post-icon.png", "sizes": "96x96" }]
    }
  ],
  "share_target": {
    "action": "/share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [
        {
          "name": "images",
          "accept": ["image/*"]
        }
      ]
    }
  },
  "related_applications": [],
  "prefer_related_applications": false
}
```

### Service Worker 源码

```typescript
// src/workers/sw.ts
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import {
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
} from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// 清理旧缓存
cleanupOutdatedCaches();

// 预缓存资源（由 Vite PWA 自动注入）
declare let __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
precacheAndRoute(self.__WB_MANIFEST);

// API 请求 - Network First
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24, // 24 hours
      }),
    ],
    networkTimeoutSeconds: 10,
  })
);

// 静态资源 - Cache First
registerRoute(
  ({ request }) =>
    request.destination === 'image' ||
    request.destination === 'style' ||
    request.destination === 'font',
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  })
);

// 第三方库 - Stale While Revalidate
registerRoute(
  ({ url }) => url.origin === 'https://cdn.jsdelivr.net',
  new StaleWhileRevalidate({
    cacheName: 'cdn-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// 后台同步
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'sync-posts') {
    event.waitUntil(syncPosts());
  }
});

async function syncPosts() {
  try {
    const db = await openIndexedDB();
    const unsyncedPosts = await getUnsyncedPosts(db);

    for (const post of unsyncedPosts) {
      await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
      });
      await markPostAsSynced(db, post.id);
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// 推送通知
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  const data = event.data.json();

  const options: NotificationOptions = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// 通知点击
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const url = event.notification.data.url;

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // 如果已有窗口，聚焦它
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // 否则打开新窗口
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// IndexedDB 辅助函数
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('pwa-db', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('posts')) {
        db.createObjectStore('posts', { keyPath: 'id' });
      }
    };
  });
}

async function getUnsyncedPosts(db: IDBDatabase): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('posts', 'readonly');
    const store = transaction.objectStore('posts');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const allPosts = request.result;
      const unsynced = allPosts.filter((post: any) => !post.synced);
      resolve(unsynced);
    };
  });
}

async function markPostAsSynced(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('posts', 'readwrite');
    const store = transaction.objectStore('posts');
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const post = getRequest.result;
      post.synced = true;
      const putRequest = store.put(post);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

// 类型声明
interface SyncEvent extends Event {
  tag: string;
  waitUntil(promise: Promise<any>): void;
}

interface PushEvent extends Event {
  data: PushMessageData | null;
  waitUntil(promise: Promise<any>): void;
}

interface NotificationEvent extends Event {
  notification: Notification;
  waitUntil(promise: Promise<any>): void;
}
```

### PWA Hooks

```typescript
// src/hooks/usePWA.ts
import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    // 检查是否已安装
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // 监听安装提示
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // 监听应用已安装
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // 注册 Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        // 检查更新
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                setNeedRefresh(true);
              }
              if (
                newWorker.state === 'installed' &&
                !navigator.serviceWorker.controller
              ) {
                setOfflineReady(true);
              }
            });
          }
        });
      });
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsInstallable(false);
    }

    setDeferredPrompt(null);
    return outcome === 'accepted';
  }, [deferredPrompt]);

  const updateServiceWorker = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    }
    window.location.reload();
  }, []);

  return {
    isInstallable,
    isInstalled,
    needRefresh,
    offlineReady,
    install,
    updateServiceWorker,
  };
}

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

// src/hooks/useNotification.ts
import { useState, useCallback } from 'react';

export function useNotification() {
  const [permission, setPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, []);

  const showNotification = useCallback(
    async (title: string, options?: NotificationOptions) => {
      if (permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) return null;
      }

      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        return registration.showNotification(title, options);
      }

      return new Notification(title, options);
    },
    [permission, requestPermission]
  );

  const subscribeToPush = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return null;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.VITE_VAPID_PUBLIC_KEY,
    });

    // 发送订阅到服务器
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });

    return subscription;
  }, []);

  return {
    permission,
    requestPermission,
    showNotification,
    subscribeToPush,
  };
}
```

### PWA 组件

```typescript
// src/components/InstallPrompt.tsx
import { useState } from 'react';
import { usePWA } from '../hooks/usePWA';

export function InstallPrompt() {
  const { isInstallable, isInstalled, install } = usePWA();
  const [showPrompt, setShowPrompt] = useState(true);

  if (isInstalled || !isInstallable || !showPrompt) return null;

  const handleInstall = async () => {
    const accepted = await install();
    if (accepted) {
      setShowPrompt(false);
    }
  };

  return (
    <div className="install-prompt">
      <div className="install-prompt-content">
        <h3>安装应用</h3>
        <p>将此应用安装到您的设备以获得更好的体验</p>
        <div className="install-prompt-actions">
          <button onClick={handleInstall} className="btn-primary">
            安装
          </button>
          <button onClick={() => setShowPrompt(false)} className="btn-secondary">
            稍后
          </button>
        </div>
      </div>
    </div>
  );
}

// src/components/OfflineIndicator.tsx
import { useOffline } from '../hooks/useOffline';

export function OfflineIndicator() {
  const isOffline = useOffline();

  if (!isOffline) return null;

  return (
    <div className="offline-indicator">
      <span className="offline-icon">📡</span>
      <span>您当前处于离线状态</span>
    </div>
  );
}

// src/components/UpdatePrompt.tsx
import { usePWA } from '../hooks/usePWA';

export function UpdatePrompt() {
  const { needRefresh, updateServiceWorker } = usePWA();

  if (!needRefresh) return null;

  return (
    <div className="update-prompt">
      <div className="update-prompt-content">
        <p>有新版本可用</p>
        <button onClick={updateServiceWorker} className="btn-primary">
          更新
        </button>
      </div>
    </div>
  );
}

// src/components/NotificationPermission.tsx
import { useNotification } from '../hooks/useNotification';

export function NotificationPermission() {
  const { permission, requestPermission } = useNotification();

  if (permission === 'granted') return null;

  return (
    <div className="notification-permission">
      <p>启用通知以接收重要更新</p>
      <button onClick={requestPermission} className="btn-primary">
        启用通知
      </button>
    </div>
  );
}
```

### 离线数据存储

```typescript
// src/utils/cache.ts
export class OfflineStorage {
  private dbName = 'offline-data';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建对象存储
        if (!db.objectStoreNames.contains('posts')) {
          const postsStore = db.createObjectStore('posts', { keyPath: 'id' });
          postsStore.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts', { keyPath: 'id', autoIncrement: true });
        }

        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('expiry', 'expiry', { unique: false });
        }
      };
    });
  }

  async savePost(post: any): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('posts', 'readwrite');
      const store = transaction.objectStore('posts');
      const request = store.put({ ...post, synced: false });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getPosts(): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('posts', 'readonly');
      const store = transaction.objectStore('posts');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async deletePost(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('posts', 'readwrite');
      const store = transaction.objectStore('posts');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async setCache(key: string, value: any, ttl: number = 3600000): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('cache', 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put({
        key,
        value,
        expiry: Date.now() + ttl,
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getCache<T>(key: string): Promise<T | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('cache', 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        // 检查是否过期
        if (result.expiry < Date.now()) {
          // 删除过期缓存
          this.deleteCache(key);
          resolve(null);
          return;
        }

        resolve(result.value);
      };
    });
  }

  async deleteCache(key: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('cache', 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearExpiredCache(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('cache', 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('expiry');
      const range = IDBKeyRange.upperBound(Date.now());
      const request = index.openCursor(range);

      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  }
}

export const offlineStorage = new OfflineStorage();
```

## 最佳实践

### 1. 缓存策略选择

```typescript
// 根据资源类型选择策略
const cacheStrategies = {
  // 静态资源：Cache First
  images: 'CacheFirst',
  fonts: 'CacheFirst',
  styles: 'StaleWhileRevalidate',

  // API：Network First
  api: 'NetworkFirst',
  user_data: 'NetworkFirst',

  // CDN：Stale While Revalidate
  libraries: 'StaleWhileRevalidate',
};
```

### 2. 优雅降级

```typescript
// 离线时提供备用内容
async function fetchWithFallback(url: string) {
  try {
    const response = await fetch(url);
    return response;
  } catch (error) {
    // 从缓存获取
    const cache = await caches.open('fallback-cache');
    const cachedResponse = await cache.match(url);
    if (cachedResponse) {
      return cachedResponse;
    }
    // 返回离线页面
    return caches.match('/offline.html');
  }
}
```

### 3. 更新提示

```typescript
// 让用户控制更新
if (needRefresh) {
  const shouldUpdate = confirm('发现新版本，是否更新？');
  if (shouldUpdate) {
    updateServiceWorker();
  }
}
```

### 4. 后台同步

```typescript
// 注册后台同步
async function syncData() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-posts');
  }
}
```

## 常用命令

```bash
# 开发
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview

# 生成 PWA 图标
npx pwa-asset-generator ./logo.png ./public/icons

# 检查 PWA 合规性
npx lighthouse http://localhost:3000 --view --preset=desktop

# 测试 Service Worker
npx workbox-cli wizard

# 分析 Manifest
npx pwa-asset-generator --help
```

## 部署配置

### Vercel 部署

```json
// vercel.json
{
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }
      ]
    },
    {
      "source": "/manifest.json",
      "headers": [
        { "key": "Content-Type", "value": "application/manifest+json" }
      ]
    }
  ]
}
```

### Netlify 部署

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

[[headers]]
  for = "/manifest.json"
  [headers.values]
    Content-Type = "application/manifest+json"
```

### Nginx 配置

```nginx
# nginx.conf
server {
  listen 80;
  server_name example.com;

  root /var/www/pwa;
  index index.html;

  # Service Worker 不缓存
  location /sw.js {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
  }

  # Manifest
  location /manifest.json {
    add_header Content-Type "application/manifest+json";
  }

  # 静态资源长期缓存
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # SPA 路由
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

## 参考资源

- [Vite PWA 插件](https://vite-pwa-org.netlify.app/)
- [Workbox 文档](https://developer.chrome.com/docs/workbox/)
- [MDN PWA 指南](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev PWA](https://web.dev/progressive-web-apps/)
- [PWA Asset Generator](https://github.com/nickvision/pwa-asset-generator)
