# Angular 19 模板

## 技术栈
- **Angular 19** - 最新版本，Standalone 组件默认
- **TypeScript 5.6** - 完整类型支持
- **RxJS 7.8** - 响应式编程
- **Zoneless Change Detection** - 新的变化检测机制（可选）
- **Signals** - 响应式状态管理
- **Hydration** - 服务端渲染水合
- **Angular DevTools** - 调试工具

## 项目结构
```
angular-19-project/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── header/
│   │   │   │   ├── header.component.ts
│   │   │   │   └── header.component.html
│   │   │   └── footer/
│   │   │       └── footer.component.ts
│   │   ├── pages/
│   │   │   ├── home/
│   │   │   │   ├── home.component.ts
│   │   │   │   └── home.component.html
│   │   │   └── dashboard/
│   │   │       ├── dashboard.component.ts
│   │   │       └── dashboard.component.html
│   │   ├── services/
│   │   │   ├── user.service.ts
│   │   │   └── auth.service.ts
│   │   ├── models/
│   │   │   └── user.model.ts
│   │   ├── guards/
│   │   │   └── auth.guard.ts
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts
│   │   ├── signals/
│   │   │   ├── counter.signal.ts
│   │   │   └── user.signal.ts
│   │   ├── app.component.ts
│   │   ├── app.component.html
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── assets/
│   ├── styles/
│   │   └── styles.scss
│   ├── index.html
│   └── main.ts
├── angular.json
├── tsconfig.json
└── package.json
```

## 代码模式

### Standalone 组件（默认）
```typescript
// src/app/components/header/header.component.ts
import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  // 使用新的 input() 函数（Angular 17.3+）
  title = input<string>('My App');
  
  // 使用 output() 函数
  menuClick = output<void>();
  
  // 使用 signals
  isLoggedIn = signal(false);
  userName = signal<string | null>(null);
  
  // Computed signal
  greeting = computed(() => {
    const name = this.userName();
    return name ? `Hello, ${name}!` : 'Welcome!';
  });

  onMenuClick() {
    this.menuClick.emit();
  }

  toggleLogin() {
    this.isLoggedIn.update(value => !value);
  }
}
```

### Signals 状态管理
```typescript
// src/app/signals/counter.signal.ts
import { signal, computed, effect } from '@angular/core';

export class CounterStore {
  // 可写 signal
  private count = signal(0);
  private step = signal(1);
  
  // 只读 signal
  readonly currentCount = this.count.asReadonly();
  
  // Computed signal
  readonly doubleCount = computed(() => this.count() * 2);
  readonly isEven = computed(() => this.count() % 2 === 0);
  
  constructor() {
    // Effect - 自动追踪依赖
    effect(() => {
      console.log(`Count changed to: ${this.count()}`);
    });
  }
  
  // Actions
  increment() {
    this.count.update(value => value + this.step());
  }
  
  decrement() {
    this.count.update(value => value - this.step());
  }
  
  setStep(newStep: number) {
    this.step.set(newStep);
  }
  
  reset() {
    this.count.set(0);
    this.step.set(1);
  }
}

// src/app/signals/user.signal.ts
import { Injectable, signal, computed } from '@angular/core';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserStore {
  private user = signal<User | null>(null);
  private loading = signal(false);
  private error = signal<string | null>(null);
  
  // Public readonly signals
  readonly currentUser = this.user.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly errorMessage = this.error.asReadonly();
  
  // Computed
  readonly isLoggedIn = computed(() => this.user() !== null);
  readonly userName = computed(() => this.user()?.name ?? 'Guest');
  
  async login(email: string, password: string) {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const user = await response.json();
      this.user.set(user);
    } catch (err) {
      this.error.set('Login failed');
    } finally {
      this.loading.set(false);
    }
  }
  
  logout() {
    this.user.set(null);
  }
}
```

### 新的控制流语法
```typescript
// src/app/pages/dashboard/dashboard.component.ts
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <!-- 新的内置控制流语法 -->
    
    <!-- @if -->
    @if (isLoggedIn()) {
      <div class="welcome">
        Welcome back, {{ userName() }}!
      </div>
    } @else if (isLoading()) {
      <div class="loading">Loading...</div>
    } @else {
      <div class="login-prompt">
        Please log in to continue
      </div>
    }
    
    <!-- @switch -->
    @switch (status()) {
      @case ('loading') {
        <div>Loading...</div>
      }
      @case ('error') {
        <div>Error occurred</div>
      }
      @default {
        <div>Content loaded</div>
      }
    }
    
    <!-- @for -->
    <ul>
      @for (item of items(); track item.id) {
        <li>
          {{ item.name }}
          @if (item.isNew) {
            <span class="badge">New</span>
          }
        </li>
      } @empty {
        <li>No items found</li>
      }
    </ul>
    
    <!-- @defer - 延迟加载 -->
    @defer (on viewport) {
      <heavy-component />
    } @placeholder {
      <div>Scroll to load...</div>
    } @loading {
      <div>Loading component...</div>
    } @error {
      <div>Failed to load</div>
    }
    
    <!-- @defer 条件 -->
    @defer (on idle) {
      <analytics-dashboard />
    }
    
    @defer (on viewport; prefetch on idle) {
      <image-gallery [images]="images()" />
    }
    
    @defer (on interaction) {
      <tooltip-component />
    }
  `
})
export class DashboardComponent {
  isLoggedIn = signal(false);
  isLoading = signal(false);
  userName = signal('John');
  status = signal<'loading' | 'error' | 'success'>('success');
  items = signal<Item[]>([]);
}
```

### 新的表单 API
```typescript
// src/app/components/forms/user-form.component.ts
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <!-- 非空断言 -->
      <div>
        <label for="name">Name</label>
        <input 
          id="name"
          formControlName="name"
          type="text"
        />
        @if (form.get('name')?.errors?.['required']) {
          <span class="error">Name is required</span>
        }
        @if (form.get('name')?.errors?.['minlength']) {
          <span class="error">Min 2 characters</span>
        }
      </div>
      
      <div>
        <label for="email">Email</label>
        <input 
          id="email"
          formControlName="email"
          type="email"
        />
        @if (form.get('email')?.errors?.['email']) {
          <span class="error">Invalid email</span>
        }
      </div>
      
      <!-- 表单组 -->
      <div formGroupName="address">
        <input formControlName="street" placeholder="Street" />
        <input formControlName="city" placeholder="City" />
      </div>
      
      <!-- 表单数组 -->
      <div formArrayName="phones">
        @for (phone of phones.controls; track $index) {
          <div [formGroupName]="$index">
            <input formControlName="number" placeholder="Phone" />
            <button type="button" (click)="removePhone($index)">Remove</button>
          </div>
        }
        <button type="button" (click)="addPhone()">Add Phone</button>
      </div>
      
      <button type="submit" [disabled]="form.invalid">
        Submit
      </button>
    </form>
  `
})
export class UserFormComponent {
  form: FormGroup;
  
  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      address: this.fb.group({
        street: [''],
        city: ['']
      }),
      phones: this.fb.array([
        this.fb.group({
          number: ['']
        })
      ])
    });
  }
  
  get phones() {
    return this.form.get('phones') as FormArray;
  }
  
  addPhone() {
    this.phones.push(
      this.fb.group({
        number: ['']
      })
    );
  }
  
  removePhone(index: number) {
    this.phones.removeAt(index);
  }
  
  onSubmit() {
    if (this.form.valid) {
      console.log(this.form.value);
    }
  }
}

// 模板驱动表单（新语法）
@Component({
  selector: 'app-simple-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <form #form="ngForm" (ngSubmit)="onSubmit(form)">
      <input 
        [(ngModel)]="user.name"
        name="name"
        required
        minlength="2"
      />
      
      <input 
        [(ngModel)]="user.email"
        name="email"
        required
        email
      />
      
      <button type="submit" [disabled]="form.invalid">
        Submit
      </button>
    </form>
  `
})
export class SimpleFormComponent {
  user = signal({
    name: '',
    email: ''
  });
  
  onSubmit(form: NgForm) {
    console.log(form.value);
  }
}
```

### HTTP 客户端
```typescript
// src/app/services/user.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private usersUrl = 'api/users';
  
  // 使用 signal 存储数据
  users = signal<User[]>([]);
  loading = signal(false);
  
  constructor(private http: HttpClient) {}
  
  getUsers(): Observable<User[]> {
    this.loading.set(true);
    
    return this.http.get<User[]>(this.usersUrl).pipe(
      tap({
        next: (users) => {
          this.users.set(users);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      })
    );
  }
  
  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.usersUrl}/${id}`);
  }
  
  createUser(user: Omit<User, 'id'>): Observable<User> {
    return this.http.post<User>(this.usersUrl, user).pipe(
      tap((newUser) => {
        this.users.update(users => [...users, newUser]);
      })
    );
  }
  
  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.usersUrl}/${id}`, user).pipe(
      tap((updatedUser) => {
        this.users.update(users =>
          users.map(u => u.id === id ? updatedUser : u)
        );
      })
    );
  }
  
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.usersUrl}/${id}`).pipe(
      tap(() => {
        this.users.update(users =>
          users.filter(u => u.id !== id)
        );
      })
    );
  }
}

// 使用
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (userService.loading()) {
      <div>Loading...</div>
    } @else {
      <ul>
        @for (user of userService.users(); track user.id) {
          <li>{{ user.name }}</li>
        }
      </ul>
    }
  `
})
export class UserListComponent implements OnInit {
  constructor(protected userService: UserService) {}
  
  ngOnInit() {
    this.userService.getUsers().subscribe();
  }
}
```

### 路由配置
```typescript
// src/app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component')
      .then(m => m.HomeComponent),
    title: 'Home'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    canActivate: [() => inject(AuthService).isLoggedIn()],
    title: 'Dashboard'
  },
  {
    path: 'users',
    loadComponent: () => import('./pages/users/users.component')
      .then(m => m.UsersComponent),
    children: [
      {
        path: ':id',
        loadComponent: () => import('./pages/user-detail/user-detail.component')
          .then(m => m.UserDetailComponent)
      }
    ]
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component')
      .then(m => m.NotFoundComponent)
  }
];

// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient()
  ]
};

// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
```

### Guards（函数式 Guards）
```typescript
// src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isLoggedIn()) {
    return true;
  }
  
  return router.parseUrl('/login');
};

// 新的 functional guard with data
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requiredRole = route.data['role'];
  
  if (authService.hasRole(requiredRole)) {
    return true;
  }
  
  return router.parseUrl('/unauthorized');
};

// 使用
{
  path: 'admin',
  loadComponent: () => import('./admin.component'),
  canActivate: [authGuard, roleGuard],
  data: { role: 'admin' }
}
```

### Interceptors
```typescript
// src/app/interceptors/auth.interceptor.ts
import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpInterceptorFn
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

// 函数式 Interceptor（Angular 19 推荐）
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();
  
  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }
  
  return next(req);
};

// Loading Interceptor
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  
  loadingService.show();
  
  return next(req).pipe(
    finalize(() => loadingService.hide())
  );
};

// 配置
// app.config.ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        loadingInterceptor
      ])
    )
  ]
};
```

### Hydration 和 SSR
```typescript
// src/main.ts (浏览器)
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { provideClientHydration } from '@angular/platform-browser';

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...appConfig.providers,
    provideClientHydration()
  ]
});

// server.ts (服务端)
import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');
  
  const commonEngine = new CommonEngine();
  
  server.set('view engine', 'html');
  server.set('views', browserDistFolder);
  
  server.get('*.*', express.static(browserDistFolder, {
    maxAge: '1y'
  }));
  
  server.get('*', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;
    
    commonEngine
      .render({
        bootstrap: AppServerModule,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err));
  });
  
  return server;
}
```

## 最佳实践

### 1. 使用 Signals 代替 RxJS（简单状态）
```typescript
// ✅ 好：简单状态使用 signals
export class CounterComponent {
  count = signal(0);
  
  increment() {
    this.count.update(v => v + 1);
  }
}

// ✅ 好：异步操作使用 RxJS
export class UserComponent {
  users$ = this.http.get<User[]>('/api/users');
  
  constructor(private http: HttpClient) {}
}

// ✅ 好：转换 RxJS 为 Signal
import { toSignal } from '@angular/core/rxjs-interop';

export class UserComponent {
  users$ = this.http.get<User[]>('/api/users');
  users = toSignal(this.users$, { initialValue: [] });
}
```

### 2. 延迟加载组件
```typescript
// 使用 @defer 延迟加载
@defer (on viewport) {
  <heavy-chart [data]="chartData()" />
} @placeholder {
  <div class="chart-placeholder">Scroll to load chart</div>
}

// 路由级延迟加载
{
  path: 'admin',
  loadComponent: () => import('./admin/admin.component')
    .then(m => m.AdminComponent)
}
```

### 3. OnPush 变化检测
```typescript
@Component({
  selector: 'app-user-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `...`
})
export class UserCardComponent {
  // 使用 signals 自动优化更新
  user = input.required<User>();
}
```

## 常用命令

### 开发
```bash
# 创建新项目
ng new my-app --standalone

# 生成组件
ng generate component user-list --standalone

# 生成服务
ng generate service user

# 启动开发服务器
ng serve

# 构建
ng build

# 测试
ng test

# 代码格式化
ng lint
```

### SSR
```bash
# 添加 SSR 支持
ng add @nguniversal/express-engine

# 构建 SSR
ng build && ng run my-app:server

# 运行 SSR
node dist/my-app/server/main.js
```

## 部署配置

### package.json
```json
{
  "name": "angular-19-project",
  "version": "1.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test",
    "serve:ssr": "node dist/angular-19-project/server/server.mjs"
  },
  "dependencies": {
    "@angular/animations": "^19.0.0",
    "@angular/common": "^19.0.0",
    "@angular/compiler": "^19.0.0",
    "@angular/core": "^19.0.0",
    "@angular/forms": "^19.0.0",
    "@angular/platform-browser": "^19.0.0",
    "@angular/platform-browser-dynamic": "^19.0.0",
    "@angular/platform-server": "^19.0.0",
    "@angular/router": "^19.0.0",
    "@angular/ssr": "^19.0.0",
    "express": "^4.18.2",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^19.0.0",
    "@angular/cli": "^19.0.0",
    "@angular/compiler-cli": "^19.0.0",
    "@types/express": "^4.17.17",
    "@types/jasmine": "~5.1.0",
    "@types/node": "^20.11.0",
    "jasmine-core": "~5.1.0",
    "karma": "~6.4.0",
    "karma-chrome-launcher": "~3.2.0",
    "karma-coverage": "~2.2.0",
    "karma-jasmine": "~5.1.0",
    "karma-jasmine-html-reporter": "~2.1.0",
    "typescript": "~5.6.0"
  }
}
```

### angular.json
```json
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "angular-19-project": {
      "projectType": "application",
      "schematics": {
        "@schematics/angular:component": {
          "standalone": true,
          "style": "scss"
        }
      },
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:application",
          "options": {
            "outputPath": "dist/angular-19-project",
            "index": "src/index.html",
            "browser": "src/main.ts",
            "polyfills": ["zone.js"],
            "tsConfig": "tsconfig.app.json",
            "inlineStyleLanguage": "scss",
            "assets": ["src/favicon.ico", "src/assets"],
            "styles": ["src/styles.scss"],
            "scripts": []
          },
          "configurations": {
            "production": {
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "500kb",
                  "maximumError": "1mb"
                },
                {
                  "type": "anyComponentStyle",
                  "maximumWarning": "2kb",
                  "maximumError": "4kb"
                }
              ],
              "outputHashing": "all"
            },
            "development": {
              "optimization": false,
              "extractLicenses": false,
              "sourceMap": true
            }
          },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "@angular-devkit/build-angular:dev-server",
          "configurations": {
            "production": {
              "buildTarget": "angular-19-project:build:production"
            },
            "development": {
              "buildTarget": "angular-19-project:build:development"
            }
          },
          "defaultConfiguration": "development"
        }
      }
    }
  }
}
```

### Dockerfile
```dockerfile
# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine

COPY --from=builder /app/dist/angular-19-project/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### GitHub Actions
```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test -- --no-watch --no-progress --browsers=ChromeHeadlessNoSandbox
      
      - name: Build
        run: npm run build
      
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist
```
