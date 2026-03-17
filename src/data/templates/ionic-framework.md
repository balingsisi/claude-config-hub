# Ionic Framework 跨平台移动开发模板

## 技术栈

- **Ionic 7**: 跨平台移动框架
- **Angular 17**: 前端框架（或 React/Vue）
- **Capacitor**: 原生运行时
- **TypeScript**: 类型支持
- **RxJS**: 响应式编程
- **Ionic Native**: 原生功能插件

## 项目结构

```
ionic-app/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── header/
│   │   │   └── footer/
│   │   ├── pages/
│   │   │   ├── home/
│   │   │   │   ├── home.page.ts
│   │   │   │   ├── home.page.html
│   │   │   │   └── home.page.scss
│   │   │   ├── login/
│   │   │   ├── profile/
│   │   │   ├── settings/
│   │   │   └── tabs/
│   │   ├── services/
│   │   │   ├── api.service.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── storage.service.ts
│   │   │   └── theme.service.ts
│   │   ├── guards/
│   │   │   ├── auth.guard.ts
│   │   │   └── no-auth.guard.ts
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts
│   │   ├── models/
│   │   │   ├── user.model.ts
│   │   │   └── response.model.ts
│   │   ├── pipes/
│   │   │   └── safe-html.pipe.ts
│   │   ├── app.component.ts
│   │   ├── app.component.html
│   │   ├── app.module.ts
│   │   └── app-routing.module.ts
│   ├── assets/
│   │   ├── icon/
│   │   └── images/
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   ├── theme/
│   │   └── variables.scss
│   ├── global.scss
│   └── index.html
├── android/
├── ios/
├── capacitor.config.ts
├── ionic.config.json
├── angular.json
├── package.json
└── tsconfig.json
```

## 代码模式

### 应用模块

```typescript
// src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar } from '@capacitor/status-bar';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// 服务
import { AuthService } from './services/auth.service';
import { ApiService } from './services/api.service';
import { StorageService } from './services/storage.service';

// 拦截器
import { AuthInterceptor } from './interceptors/auth.interceptor';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    HttpClientModule,
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    AuthService,
    ApiService,
    StorageService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

### 路由配置

```typescript
// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { NoAuthGuard } from './guards/no-auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then(m => m.LoginPageModule),
    canActivate: [NoAuthGuard],
  },
  {
    path: 'tabs',
    loadChildren: () => import('./pages/tabs/tabs.module').then(m => m.TabsPageModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'profile',
    loadChildren: () => import('./pages/profile/profile.module').then(m => m.ProfilePageModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'settings',
    loadChildren: () => import('./pages/settings/settings.module').then(m => m.SettingsPageModule),
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
```

### 认证服务

```typescript
// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { StorageService } from './storage.service';
import { User } from '../models/user.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private storage: StorageService,
    private router: Router
  ) {
    this.loadStoredUser();
  }

  private async loadStoredUser() {
    const user = await this.storage.get('user');
    const token = await this.storage.get('token');
    
    if (user && token) {
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    }
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap(async (response) => {
        const { token, user } = response;
        
        await this.storage.set('token', token);
        await this.storage.set('user', user);
        
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      }),
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

  register(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/register`, data).pipe(
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

  async logout(): Promise<void> {
    await this.storage.remove('token');
    await this.storage.remove('user');
    
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    
    this.router.navigate(['/login']);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  async getToken(): Promise<string | null> {
    return await this.storage.get('token');
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }
}
```

### API 服务

```typescript
// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private storage: StorageService
  ) {}

  // GET 请求
  get<T>(endpoint: string, params?: any): Observable<T> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach((key) => {
        httpParams = httpParams.set(key, params[key]);
      });
    }

    return this.http.get<T>(`${this.apiUrl}/${endpoint}`, { params: httpParams }).pipe(
      retry(2),
      catchError((error) => {
        throw error;
      })
    );
  }

  // POST 请求
  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, data).pipe(
      catchError((error) => {
        throw error;
      })
    );
  }

  // PUT 请求
  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${endpoint}`, data).pipe(
      catchError((error) => {
        throw error;
      })
    );
  }

  // DELETE 请求
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`).pipe(
      catchError((error) => {
        throw error;
      })
    );
  }

  // 上传文件
  upload<T>(endpoint: string, file: File): Observable<T> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, formData).pipe(
      catchError((error) => {
        throw error;
      })
    );
  }
}
```

### 存储服务

```typescript
// src/app/services/storage.service.ts
import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  // 保存数据
  async set(key: string, value: any): Promise<void> {
    await Preferences.set({
      key,
      value: JSON.stringify(value),
    });
  }

  // 获取数据
  async get(key: string): Promise<any> {
    const { value } = await Preferences.get({ key });
    return value ? JSON.parse(value) : null;
  }

  // 删除数据
  async remove(key: string): Promise<void> {
    await Preferences.remove({ key });
  }

  // 清空所有数据
  async clear(): Promise<void> {
    await Preferences.clear();
  }

  // 获取所有键
  async keys(): Promise<string[]> {
    const { keys } = await Preferences.keys();
    return keys;
  }
}
```

### 认证拦截器

```typescript
// src/app/interceptors/auth.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { StorageService } from '../services/storage.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private storage: StorageService,
    private router: Router
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return from(this.storage.get('token')).pipe(
      switchMap((token) => {
        if (token) {
          request = request.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`,
            },
          });
        }

        return next.handle(request).pipe(
          catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
              this.storage.clear();
              this.router.navigate(['/login']);
            }

            return throwError(() => error);
          })
        );
      })
    );
  }
}
```

### 登录页面

```typescript
// src/app/pages/login/login.page.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  loginForm: FormGroup;
  isSubmitting = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    this.isSubmitting = true;

    const loading = await this.loadingController.create({
      message: '登录中...',
    });
    await loading.present();

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe(
      async () => {
        await loading.dismiss();
        this.router.navigate(['/tabs/home']);
      },
      async (error) => {
        await loading.dismiss();
        this.isSubmitting = false;

        const toast = await this.toastController.create({
          message: error.error?.message || '登录失败，请重试',
          duration: 3000,
          color: 'danger',
        });
        await toast.present();
      }
    );
  }

  async loginWithGoogle() {
    // Google 登录逻辑
  }

  async loginWithApple() {
    // Apple 登录逻辑
  }
}
```

```html
<!-- src/app/pages/login/login.page.html -->
<ion-content [fullscreen]="true" class="ion-padding">
  <div class="login-container">
    <ion-icon name="logo-ionic" class="logo-icon"></ion-icon>
    
    <h1>欢迎回来</h1>
    <p>登录您的账户</p>

    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
      <ion-item>
        <ion-icon name="mail-outline" slot="start"></ion-icon>
        <ion-input
          formControlName="email"
          type="email"
          placeholder="邮箱地址"
          required
        ></ion-input>
      </ion-item>
      
      <ion-item>
        <ion-icon name="lock-closed-outline" slot="start"></ion-icon>
        <ion-input
          formControlName="password"
          type="password"
          placeholder="密码"
          required
        ></ion-input>
      </ion-item>

      <ion-button
        expand="block"
        type="submit"
        [disabled]="loginForm.invalid || isSubmitting"
        class="login-button"
      >
        登录
      </ion-button>
    </form>

    <div class="social-login">
      <p>或使用以下方式登录</p>
      
      <ion-button expand="block" fill="outline" (click)="loginWithGoogle()">
        <ion-icon name="logo-google" slot="start"></ion-icon>
        Google 登录
      </ion-button>
      
      <ion-button expand="block" fill="outline" (click)="loginWithApple()">
        <ion-icon name="logo-apple" slot="start"></ion-icon>
        Apple 登录
      </ion-button>
    </div>

    <p class="register-link">
      还没有账户？ <a routerLink="/register">立即注册</a>
    </p>
  </div>
</ion-content>
```

### Tabs 页面

```typescript
// src/app/pages/tabs/tabs.page.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
})
export class TabsPage {
  constructor() {}
}
```

```html
<!-- src/app/pages/tabs/tabs.page.html -->
<ion-tabs>
  <ion-tab-bar slot="bottom">
    <ion-tab-button tab="home">
      <ion-icon name="home-outline"></ion-icon>
      <ion-label>首页</ion-label>
    </ion-tab-button>

    <ion-tab-button tab="explore">
      <ion-icon name="search-outline"></ion-icon>
      <ion-label>探索</ion-label>
    </ion-tab-button>

    <ion-tab-button tab="notifications">
      <ion-icon name="notifications-outline"></ion-icon>
      <ion-label>通知</ion-label>
    </ion-tab-button>

    <ion-tab-button tab="profile">
      <ion-icon name="person-outline"></ion-icon>
      <ion-label>我的</ion-label>
    </ion-tab-button>
  </ion-tab-bar>
</ion-tabs>
```

### 首页

```typescript
// src/app/pages/home/home.page.ts
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { LoadingController, RefreshController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  items: any[] = [];
  isLoading = false;

  constructor(
    private api: ApiService,
    private loadingController: LoadingController,
    private refreshController: RefreshController
  ) {}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData(event?: any) {
    if (!event) {
      this.isLoading = true;
      const loading = await this.loadingController.create({
        message: '加载中...',
      });
      await loading.present();
    }

    this.api.get('items').subscribe(
      (response: any) => {
        this.items = response.data;
        
        if (event) {
          event.target.complete();
        } else {
          this.loadingController.dismiss();
        }
        
        this.isLoading = false;
      },
      (error) => {
        console.error('加载数据失败', error);
        
        if (event) {
          event.target.complete();
        } else {
          this.loadingController.dismiss();
        }
        
        this.isLoading = false;
      }
    );
  }

  async doRefresh(event: any) {
    await this.loadData(event);
  }
}
```

```html
<!-- src/app/pages/home/home.page.html -->
<ion-header>
  <ion-toolbar>
    <ion-title>首页</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content [fullscreen]="true">
  <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
    <ion-refresher-content></ion-refresher-content>
  </ion-refresher>

  <ion-list *ngIf="!isLoading">
    <ion-item *ngFor="let item of items" [routerLink]="['/item', item.id]">
      <ion-thumbnail slot="start">
        <img [src]="item.image" alt="Item" />
      </ion-thumbnail>
      <ion-label>
        <h2>{{ item.title }}</h2>
        <p>{{ item.description }}</p>
      </ion-label>
    </ion-item>
  </ion-list>

  <ion-infinite-scroll threshold="100px" (ionInfinite)="loadMore($event)">
    <ion-infinite-scroll-content
      loadingSpinner="bubbles"
      loadingText="加载更多..."
    ></ion-infinite-scroll-content>
  </ion-infinite-scroll>
</ion-content>
```

## 最佳实践

### 1. 原生功能

```typescript
// 相机
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

async takePhoto() {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.Uri,
    source: CameraSource.Camera,
  });
  
  return image.webPath;
}

// 地理位置
import { Geolocation } from '@capacitor/geolocation';

async getCurrentPosition() {
  const coordinates = await Geolocation.getCurrentPosition();
  return coordinates.coords;
}

// 通知
import { LocalNotifications } from '@capacitor/local-notifications';

async scheduleNotification() {
  await LocalNotifications.schedule({
    notifications: [
      {
        title: '提醒',
        body: '这是本地通知',
        id: 1,
        schedule: { at: new Date(Date.now() + 1000 * 60) },
      },
    ],
  });
}
```

### 2. 主题定制

```scss
// src/theme/variables.scss
:root {
  --ion-color-primary: #3880ff;
  --ion-color-secondary: #3dc2ff;
  --ion-color-tertiary: #5260ff;
  --ion-color-success: #2dd36f;
  --ion-color-warning: #ffc409;
  --ion-color-danger: #eb445a;
  
  --ion-background-color: #ffffff;
  --ion-text-color: #000000;
}

@media (prefers-color-scheme: dark) {
  :root {
    --ion-background-color: #1a1a1a;
    --ion-text-color: #ffffff;
  }
}
```

### 3. 懒加载

```typescript
// 懒加载模块
{
  path: 'profile',
  loadChildren: () => import('./pages/profile/profile.module').then(m => m.ProfilePageModule)
}
```

## 常用命令

### 开发

```bash
# 创建项目
ionic start myApp tabs

# 运行在浏览器
ionic serve

# 运行在 iOS
ionic cap run ios

# 运行在 Android
ionic cap run android

# 构建生产版本
ionic build --prod

# 添加平台
ionic cap add ios
ionic cap add android

# 同步原生项目
ionic cap sync

# 打开原生 IDE
ionic cap open ios
ionic cap open android
```

### Capacitor

```bash
# 安装插件
npm install @capacitor/camera
npm install @capacitor/geolocation

# 更新原生项目
npx cap update
```

## 部署配置

### capacitor.config.ts

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'My Ionic App',
  webDir: 'www',
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#3880ff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#ffffff',
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#3880ff',
    },
  },
  ios: {
    contentInset: 'automatic',
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
```

### package.json

```json
{
  "name": "ionic-app",
  "version": "1.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ionic serve",
    "build": "ionic build",
    "test": "ng test",
    "lint": "ng lint",
    "ios": "ionic cap run ios",
    "android": "ionic cap run android"
  },
  "dependencies": {
    "@angular/common": "^17.0.0",
    "@angular/core": "^17.0.0",
    "@capacitor/core": "^5.0.0",
    "@capacitor/camera": "^5.0.0",
    "@capacitor/geolocation": "^5.0.0",
    "@capacitor/preferences": "^5.0.0",
    "@ionic/angular": "^7.0.0",
    "rxjs": "^7.0.0"
  },
  "devDependencies": {
    "@angular/cli": "^17.0.0",
    "@capacitor/cli": "^5.0.0",
    "@ionic/cli": "^7.0.0",
    "typescript": "^5.0.0"
  }
}
```

### 环境配置

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
};

// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.example.com',
};
```
