# Angular PWA 应用模板

## 项目概述

Angular PWA (Progressive Web App) 是使用 Angular 框架构建的渐进式 Web 应用，具有离线访问、推送通知、后台同步等原生应用特性，同时保持 Web 应用的可访问性和可发现性。

## 技术栈

- **框架**: Angular 17+ (Standalone Components)
- **语言**: TypeScript 5.3+
- **PWA**: Angular Service Worker
- **样式**: SCSS + Angular Material / Tailwind CSS
- **状态管理**: NgRx / Signals
- **路由**: Angular Router
- **HTTP**: HttpClient
- **测试**: Jasmine + Karma + Playwright

## 项目结构

```
angular-pwa-app/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── api.service.ts
│   │   │   │   ├── storage.service.ts
│   │   │   │   ├── notification.service.ts
│   │   │   │   └── offline.service.ts
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts
│   │   │   │   └── offline.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts
│   │   │   │   ├── cache.interceptor.ts
│   │   │   │   └── error.interceptor.ts
│   │   │   └── core.module.ts
│   │   ├── features/
│   │   │   ├── home/
│   │   │   │   ├── home.component.ts
│   │   │   │   ├── home.component.html
│   │   │   │   └── home.component.scss
│   │   │   ├── products/
│   │   │   │   ├── products.component.ts
│   │   │   │   ├── products.component.html
│   │   │   │   ├── product-detail.component.ts
│   │   │   │   ├── products.service.ts
│   │   │   │   └── products.resolver.ts
│   │   │   ├── cart/
│   │   │   │   ├── cart.component.ts
│   │   │   │   ├── cart.service.ts
│   │   │   │   └── cart-item.component.ts
│   │   │   ├── auth/
│   │   │   │   ├── login.component.ts
│   │   │   │   ├── register.component.ts
│   │   │   │   └── auth.service.ts
│   │   │   └── settings/
│   │   │       ├── settings.component.ts
│   │   │       └── settings.service.ts
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── header/
│   │   │   │   ├── footer/
│   │   │   │   ├── loading-spinner/
│   │   │   │   └── offline-banner/
│   │   │   ├── directives/
│   │   │   │   └── lazy-load.directive.ts
│   │   │   └── pipes/
│   │   │       ├── safe-url.pipe.ts
│   │   │       └── currency.pipe.ts
│   │   ├── store/
│   │   │   ├── app.state.ts
│   │   │   ├── auth/
│   │   │   │   ├── auth.actions.ts
│   │   │   │   ├── auth.reducer.ts
│   │   │   │   └── auth.selectors.ts
│   │   │   └── cart/
│   │   │       ├── cart.actions.ts
│   │   │       ├── cart.reducer.ts
│   │   │       └── cart.selectors.ts
│   │   ├── app.component.ts
│   │   ├── app.component.html
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   └── manifest.webmanifest
│   ├── assets/
│   │   ├── icons/
│   │   └── images/
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   ├── styles/
│   │   ├── _variables.scss
│   │   ├── _mixins.scss
│   │   └── styles.scss
│   ├── index.html
│   ├── main.ts
│   └── polyfills.ts
├── angular.json
├── ngsw-config.json              # Service Worker 配置
├── tsconfig.json
├── package.json
└── README.md
```

## 核心代码模式

### 1. 应用配置 (Standalone)

```typescript
// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideRouterStore } from '@ngrx/router-store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { cacheInterceptor } from './core/interceptors/cache.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { reducers, metaReducers } from './store/app.state';
import { AuthEffects } from './store/auth/auth.effects';
import { CartEffects } from './store/cart/cart.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideAnimations(),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        authInterceptor,
        cacheInterceptor,
        errorInterceptor,
      ])
    ),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideStore(reducers, { metaReducers }),
    provideEffects([AuthEffects, CartEffects]),
    provideRouterStore(),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: !isDevMode(),
    }),
  ],
};
```

### 2. PWA Manifest

```json
// src/manifest.webmanifest
{
  "name": "Angular PWA App",
  "short_name": "PWA App",
  "description": "A Progressive Web App built with Angular",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1976d2",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "assets/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "shortcuts": [
    {
      "name": "Products",
      "short_name": "Products",
      "description": "View products",
      "url": "/products",
      "icons": [{ "src": "assets/icons/products-icon.png", "sizes": "96x96" }]
    },
    {
      "name": "Cart",
      "short_name": "Cart",
      "description": "View shopping cart",
      "url": "/cart",
      "icons": [{ "src": "assets/icons/cart-icon.png", "sizes": "96x96" }]
    }
  ],
  "screenshots": [
    {
      "src": "assets/screenshots/home.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    },
    {
      "src": "assets/screenshots/mobile.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ]
}
```

### 3. Service Worker 配置

```json
// ngsw-config.json
{
  "$schema": "./node_modules/@angular/service-worker/config/schema.json",
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": [
          "/favicon.ico",
          "/index.html",
          "/manifest.webmanifest",
          "/*.css",
          "/*.js"
        ],
        "versionedFiles": [
          "/*.worker.js"
        ]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/assets/**",
          "/*.(svg|cur|jpg|jpeg|png|apng|webp|avif|gif|otf|ttf|woff|woff2)"
        ]
      }
    },
    {
      "name": "fonts",
      "resources": {
        "urls": [
          "https://fonts.googleapis.com/**",
          "https://fonts.gstatic.com/**"
        ]
      }
    }
  ],
  "dataGroups": [
    {
      "name": "api-cached",
      "urls": [
        "/api/products/**",
        "/api/categories/**"
      ],
      "cacheConfig": {
        "maxSize": 100,
        "maxAge": "1h",
        "timeout": "10s",
        "strategy": "freshness"
      }
    },
    {
      "name": "api-network",
      "urls": [
        "/api/auth/**",
        "/api/orders/**"
      ],
      "cacheConfig": {
        "maxSize": 0,
        "maxAge": "0u",
        "strategy": "freshness"
      }
    },
    {
      "name": "api-offline",
      "urls": [
        "/api/user/**"
      ],
      "cacheConfig": {
        "maxSize": 50,
        "maxAge": "1d",
        "timeout": "5s",
        "strategy": "performance"
      }
    }
  ],
  "navigationUrls": [
    "/**",
    "!/**/*.*",
    "!/**/*__*",
    "!/**/*__*/**"
  ]
}
```

### 4. 离线服务

```typescript
// src/app/core/services/offline.service.ts
import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { first } from 'rxjs/operators';
import { Network } from '@ngx-pwa/offline';

@Injectable({ providedIn: 'root' })
export class OfflineService {
  private isOnline$ = this.network.online;

  constructor(
    private swUpdate: SwUpdate,
    private network: Network,
    private snackBar: MatSnackBar
  ) {
    this.checkForUpdates();
    this.monitorConnection();
  }

  isOnline(): Observable<boolean> {
    return this.isOnline$;
  }

  private checkForUpdates(): void {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe((event) => {
        if (event.type === 'VERSION_READY') {
          const snack = this.snackBar.open(
            '有新版本可用',
            '立即更新',
            { duration: 6000 }
          );

          snack.onAction().subscribe(() => {
            this.swUpdate.activateUpdate().then(() => {
              window.location.reload();
            });
          });
        }

        if (event.type === 'VERSION_INSTALLATION_FAILED') {
          this.snackBar.open('安装失败，请刷新页面', '刷新', {
            duration: 3000,
          });
        }
      });

      // 每6小时检查一次更新
      interval(6 * 60 * 60 * 1000).subscribe(() => {
        this.swUpdate.checkForUpdate();
      });
    }
  }

  private monitorConnection(): void {
    this.network.online.subscribe((online) => {
      if (!online) {
        this.snackBar.open('网络连接已断开', '关闭', {
          duration: 5000,
          panelClass: ['offline-snackbar'],
        });
      } else {
        this.snackBar.open('网络已恢复', '关闭', {
          duration: 3000,
          panelClass: ['online-snackbar'],
        });
      }
    });
  }

  async forceUpdate(): Promise<void> {
    if (this.swUpdate.isEnabled) {
      await this.swUpdate.checkForUpdate();
    }
  }
}
```

### 5. 缓存拦截器

```typescript
// src/app/core/interceptors/cache.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';

interface CacheEntry {
  response: HttpResponse<any>;
  timestamp: number;
}

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 5 * 60 * 1000; // 5分钟

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // 只缓存 GET 请求
    if (req.method !== 'GET') {
      return next.handle(req);
    }

    // 检查缓存
    const cachedResponse = this.getFromCache(req);
    if (cachedResponse) {
      return of(cachedResponse);
    }

    // 发送请求并缓存响应
    return next.handle(req).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          this.addToCache(req, event);
        }
      })
    );
  }

  private getFromCache(req: HttpRequest<any>): HttpResponse<any> | null {
    const url = req.urlWithParams;
    const cached = this.cache.get(url);

    if (!cached) {
      return null;
    }

    // 检查是否过期
    const isExpired = Date.now() - cached.timestamp > this.TTL;
    if (isExpired) {
      this.cache.delete(url);
      return null;
    }

    return cached.response;
  }

  private addToCache(req: HttpRequest<any>, response: HttpResponse<any>): void {
    const url = req.urlWithParams;
    this.cache.set(url, {
      response,
      timestamp: Date.now(),
    });

    // 清理过期缓存
    this.cleanExpiredCache();
  }

  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [url, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.cache.delete(url);
      }
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}
```

### 6. 推送通知服务

```typescript
// src/app/core/services/notification.service.ts
import { Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly VAPID_PUBLIC_KEY = environment.vapidPublicKey;

  constructor(
    private swPush: SwPush,
    private http: HttpClient
  ) {}

  async requestPermission(): Promise<boolean> {
    if (!this.swPush.isEnabled) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  }

  async subscribeToNotifications(): Promise<PushSubscription | null> {
    if (!this.swPush.isEnabled) {
      return null;
    }

    try {
      const subscription = await this.swPush.requestSubscription({
        serverPublicKey: this.VAPID_PUBLIC_KEY,
      });

      // 发送订阅到服务器
      await this.http.post('/api/notifications/subscribe', subscription).toPromise();

      return subscription;
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      return null;
    }
  }

  async unsubscribeFromNotifications(): Promise<void> {
    if (!this.swPush.isEnabled) {
      return;
    }

    try {
      const subscription = await this.swPush.subscription.toPromise();
      if (subscription) {
        await subscription.unsubscribe();
        await this.http.post('/api/notifications/unsubscribe', {}).toPromise();
      }
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
    }
  }

  listenToNotifications(): Observable<any> {
    return this.swPush.notificationClicks;
  }

  listenToMessages(): Observable<any> {
    return this.swPush.messages;
  }
}
```

### 7. 后台同步服务

```typescript
// src/app/core/services/sync.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IndexedDBService } from './indexeddb.service';
import { NetworkService } from './network.service';

interface SyncItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  endpoint: string;
  data: any;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class SyncService {
  private syncQueue: SyncItem[] = [];
  private isSyncing = false;

  constructor(
    private http: HttpClient,
    private db: IndexedDBService,
    private network: NetworkService
  ) {
    this.loadQueue();
    this.registerSyncEvent();
  }

  async addToQueue(item: Omit<SyncItem, 'id' | 'timestamp'>): Promise<void> {
    const syncItem: SyncItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    this.syncQueue.push(syncItem);
    await this.saveQueue();

    // 如果在线，立即同步
    if (this.network.isOnline) {
      this.sync();
    }
  }

  private async sync(): Promise<void> {
    if (this.isSyncing || !this.network.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;

    try {
      const itemsToSync = [...this.syncQueue];

      for (const item of itemsToSync) {
        try {
          switch (item.action) {
            case 'create':
              await this.http.post(item.endpoint, item.data).toPromise();
              break;
            case 'update':
              await this.http.put(`${item.endpoint}/${item.id}`, item.data).toPromise();
              break;
            case 'delete':
              await this.http.delete(`${item.endpoint}/${item.id}`).toPromise();
              break;
          }

          // 同步成功，从队列中移除
          const index = this.syncQueue.findIndex(i => i.id === item.id);
          if (index > -1) {
            this.syncQueue.splice(index, 1);
          }
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
          // 继续同步下一个项目
        }
      }

      await this.saveQueue();
    } finally {
      this.isSyncing = false;
    }
  }

  private async loadQueue(): Promise<void> {
    this.syncQueue = await this.db.get<SyncItem[]>('syncQueue') || [];
  }

  private async saveQueue(): Promise<void> {
    await this.db.set('syncQueue', this.syncQueue);
  }

  private registerSyncEvent(): void {
    // 监听网络恢复事件
    this.network.online$.subscribe((online) => {
      if (online) {
        this.sync();
      }
    });

    // 注册后台同步（如果支持）
    if ('sync' in (self as any).registration) {
      (self as any).registration.sync.register('background-sync');
    }
  }
}
```

### 8. NgRx 状态管理

```typescript
// src/app/store/auth/auth.actions.ts
import { createAction, props } from '@ngrx/store';
import { User } from '../../core/models/user.model';

export const login = createAction(
  '[Auth] Login',
  props<{ email: string; password: string }>()
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ user: User; token: string }>()
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>()
);

export const logout = createAction('[Auth] Logout');

export const logoutSuccess = createAction('[Auth] Logout Success');

export const checkAuth = createAction('[Auth] Check Auth');

export const loadUserFromStorage = createAction(
  '[Auth] Load User from Storage',
  props<{ user: User; token: string }>()
);
```

```typescript
// src/app/store/auth/auth.reducer.ts
import { createReducer, on } from '@ngrx/store';
import * as AuthActions from './auth.actions';
import { User } from '../../core/models/user.model';

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
};

export const authReducer = createReducer(
  initialState,

  on(AuthActions.login, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(AuthActions.loginSuccess, (state, { user, token }) => ({
    ...state,
    user,
    token,
    loading: false,
    error: null,
  })),

  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    user: null,
    token: null,
    loading: false,
    error,
  })),

  on(AuthActions.logout, (state) => ({
    ...state,
    loading: true,
  })),

  on(AuthActions.logoutSuccess, () => initialState),

  on(AuthActions.loadUserFromStorage, (state, { user, token }) => ({
    ...state,
    user,
    token,
  }))
);
```

```typescript
// src/app/store/auth/auth.selectors.ts
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectUser = createSelector(
  selectAuthState,
  (state: AuthState) => state.user
);

export const selectToken = createSelector(
  selectAuthState,
  (state: AuthState) => state.token
);

export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (state: AuthState) => !!state.token && !!state.user
);

export const selectAuthLoading = createSelector(
  selectAuthState,
  (state: AuthState) => state.loading
);

export const selectAuthError = createSelector(
  selectAuthState,
  (state: AuthState) => state.error
);
```

### 9. 离线守卫

```typescript
// src/app/core/guards/offline.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { NetworkService } from '../services/network.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class OfflineGuard implements CanActivate {
  constructor(
    private network: NetworkService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  canActivate(): boolean {
    if (!this.network.isOnline) {
      this.snackBar.open(
        '此功能需要网络连接',
        '关闭',
        { duration: 3000 }
      );
      this.router.navigate(['/offline']);
      return false;
    }

    return true;
  }
}
```

### 10. 路由配置

```typescript
// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { offlineGuard } from './core/guards/offline.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    title: '首页',
  },
  {
    path: 'products',
    loadComponent: () => import('./features/products/products.component').then(m => m.ProductsComponent),
    title: '产品列表',
  },
  {
    path: 'products/:id',
    loadComponent: () => import('./features/products/product-detail.component').then(m => m.ProductDetailComponent),
    title: '产品详情',
    resolve: {
      product: productsResolver,
    },
  },
  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent),
    title: '购物车',
    canActivate: [offlineGuard],
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent),
    title: '登录',
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent),
    title: '注册',
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
    title: '设置',
    canActivate: [authGuard],
  },
  {
    path: 'offline',
    loadComponent: () => import('./features/offline/offline.component').then(m => m.OfflineComponent),
    title: '离线',
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: '页面未找到',
  },
];
```

## 最佳实践

### 1. 预加载策略

```typescript
// src/app/core/preloading/custom-preloading-strategy.ts
import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CustomPreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // 预加载标记为 preload: true 的路由
    if (route.data && route.data['preload']) {
      return load();
    }

    // 在空闲时预加载所有路由
    if ('requestIdleCallback' in window) {
      return new Observable((observer) => {
        const id = (window as any).requestIdleCallback(() => {
          load().subscribe(observer);
        });
        return () => (window as any).cancelIdleCallback(id);
      });
    }

    return of(null);
  }
}
```

### 2. 图片懒加载

```typescript
// src/app/shared/directives/lazy-load.directive.ts
import { Directive, ElementRef, OnInit } from '@angular/core';

@Directive({
  selector: 'img[appLazyLoad]',
  standalone: true,
})
export class LazyLoadDirective implements OnInit {
  constructor(private el: ElementRef<HTMLImageElement>) {}

  ngOnInit(): void {
    const img = this.el.nativeElement;
    const src = img.src;

    // 支持原生懒加载
    if ('loading' in HTMLImageElement.prototype) {
      img.loading = 'lazy';
    } else {
      // 使用 Intersection Observer
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            img.src = src;
            observer.unobserve(img);
          }
        });
      });

      observer.observe(img);
    }
  }
}
```

### 3. 性能优化

```typescript
// 启用生产模式优化
import { enableProdMode } from '@angular/core';

if (environment.production) {
  enableProdMode();
}

// 路由预加载
provideRouter(routes, withPreloading(PreloadAllModules))

// HTTP 缓存
provideHttpClient(
  withInterceptors([cacheInterceptor])
)

// Service Worker
provideServiceWorker('ngsw-worker.js', {
  enabled: environment.production,
})
```

### 4. 离线数据存储

```typescript
// src/app/core/services/indexeddb.service.ts
import { Injectable } from '@angular/core';
import { openDB, IDBPDatabase } from 'idb';

@Injectable({ providedIn: 'root' })
export class IndexedDBService {
  private db: IDBPDatabase | null = null;
  private readonly DB_NAME = 'pwa-app-db';
  private readonly DB_VERSION = 1;

  async init(): Promise<void> {
    this.db = await openDB(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // 创建存储
        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cart')) {
          db.createObjectStore('cart', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id' });
        }
      },
    });
  }

  async get<T>(storeName: string, key: string): Promise<T | undefined> {
    if (!this.db) await this.init();
    return this.db!.get(storeName, key);
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) await this.init();
    return this.db!.getAll(storeName);
  }

  async set(storeName: string, value: any): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put(storeName, value);
  }

  async delete(storeName: string, key: string): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.delete(storeName, key);
  }

  async clear(storeName: string): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.clear(storeName);
  }
}
```

## 常用命令

```bash
# 创建 PWA 项目
ng new my-pwa-app --routing --style=scss
cd my-pwa-app
ng add @angular/pwa

# 添加 Service Worker
ng add @angular/pwa --project=my-pwa-app

# 开发
ng serve
ng serve --configuration=production  # 启用 Service Worker

# 构建
ng build
ng build --configuration=production

# 测试
ng test
ng e2e

# Lint
ng lint

# 分析包大小
ng build --stats-json
npx webpack-bundle-analyzer dist/my-pwa-app/stats.json

# 性能审计
npx lighthouse http://localhost:4200 --view

# 生成图标
npx pwa-asset-generator ./src/assets/logo.png ./src/assets/icons
```

## 部署配置

### 环境变量

```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.example.com',
  vapidPublicKey: 'YOUR_VAPID_PUBLIC_KEY',
};
```

### Nginx 配置

```nginx
# nginx.conf
server {
  listen 80;
  server_name example.com;
  root /var/www/html;
  index index.html;

  # PWA 支持
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Service Worker
  location /ngsw-worker.js {
    add_header Cache-Control "no-cache";
    proxy_cache_bypass $http_pragma;
    proxy_cache_revalidate on;
    expires off;
    access_log off;
  }

  # 静态资源缓存
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # Manifest
  location /manifest.webmanifest {
    add_header Content-Type application/manifest+json;
  }

  # HTTPS 重定向
  if ($scheme != https) {
    return 301 https://$server_name$request_uri;
  }
}
```

### Firebase 部署

```json
// firebase.json
{
  "hosting": {
    "public": "dist/my-pwa-app",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/ngsw-worker.js",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

### Docker 部署

```dockerfile
# Dockerfile
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=production

FROM nginx:alpine
COPY --from=builder /app/dist/my-pwa-app /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 参考资源

- [Angular PWA 文档](https://angular.io/guide/service-worker-intro)
- [Angular Service Worker](https://angular.io/guide/service-worker-getting-started)
- [Web.dev PWA](https://web.dev/progressive-web-apps/)
- [NgRx 文档](https://ngrx.io/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

---

**最后更新**: 2026-03-17
