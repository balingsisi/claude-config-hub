# NativeScript 移动应用模板

## 项目概述

NativeScript 是使用 JavaScript/TypeScript 构建原生 iOS 和 Android 应用的框架。直接访问原生 API，提供真正的原生性能和用户体验。

## 技术栈

- **框架**: NativeScript 8.6+
- **框架集成**: Angular / Vue 3 / React / Svelte / Solid
- **语言**: TypeScript 5
- **UI 组件**: NativeScript Core / nativescript-ui
- **状态管理**: NgRx / Pinia / MobX
- **导航**: NativeScript Router
- **样式**: CSS / SCSS
- **原生插件**: @nativescript/* 社区插件

## 项目结构

```
nativescript-app/
├── app/
│   ├── App_Resources/          # 原生资源
│   │   ├── Android/
│   │   │   ├── src/main/
│   │   │   │   ├── res/
│   │   │   │   │   ├── drawable/
│   │   │   │   │   ├── mipmap/
│   │   │   │   │   └── values/
│   │   │   │   └── AndroidManifest.xml
│   │   │   └── app.gradle
│   │   └── iOS/
│   │       ├── Assets.xcassets/
│   │       ├── Info.plist
│   │       └── LaunchScreen.storyboard
│   ├── components/              # 可复用组件
│   │   ├── ActionBar.ts
│   │   ├── Button.ts
│   │   └── Card.ts
│   ├── pages/                   # 页面
│   │   ├── Home.ts
│   │   ├── Home.xml             # UI 模板（可选）
│   │   ├── Home.scss            # 样式
│   │   ├── Detail.ts
│   │   └── Settings.ts
│   ├── models/                  # 数据模型
│   │   └── User.ts
│   ├── services/                # 业务服务
│   │   ├── api.service.ts
│   │   ├── auth.service.ts
│   │   └── storage.service.ts
│   ├── utils/                   # 工具函数
│   │   ├── validators.ts
│   │   └── helpers.ts
│   ├── routers/                 # 路由配置
│   │   └── index.ts
│   ├── AppRoot.ts               # 根组件
│   ├── app.ts                   # 应用入口
│   ├── app.scss                 # 全局样式
│   └── _app_config.ts           # 应用配置
├── platforms/                   # 平台特定代码（自动生成）
├── node_modules/
├── nativescript.config.ts       # NativeScript 配置
├── package.json
├── tsconfig.json
└── webpack.config.js
```

## 核心配置

### 1. NativeScript 配置

```typescript
// nativescript.config.ts
import { Config } from '@nativescript/core'

export default {
  id: 'com.company.myapp',
  appPath: 'app',
  appResourcesPath: 'app/App_Resources',
  
  // Android 配置
  android: {
    v8Flags: '--expose_gc',
    markingMode: 'none',
    codeCache: true,
    snapshotIn: './snapshots/android',
    snapshotOut: './snapshots/android'
  },
  
  // iOS 配置
  ios: {
    discardUncaughtJsExceptions: false
  },
  
  // 模式
  mode: 'development',  // 或 'production'
  
  // UI 配置
  cssParser: 'css-tree',  // 或 'rework'
  
  // Profiling
  profiling: {
    startup: true,
    memory: true
  }
} as Config
```

### 2. 应用入口

```typescript
// app/app.ts
import { Application, Frame } from '@nativescript/core'
import { AppRoot } from './AppRoot'

// 初始化应用
Application.run({
  create: () => {
    // 创建根 Frame
    const frame = new Frame()
    
    // 设置默认页面
    frame.navigate({
      moduleName: 'pages/Home',
      clearHistory: true
    })
    
    return frame
  }
})

// 或使用声明式方式
import { createApp } from '@nativescript/vue'
import App from './App.vue'

const app = createApp(App)
app.start()
```

```typescript
// app/AppRoot.ts
import { Frame } from '@nativescript/core'

export function AppRoot() {
  return {
    create: () => {
      const frame = new Frame()
      frame.navigate('pages/Home')
      return frame
    }
  }
}
```

### 3. 页面组件

```typescript
// app/pages/Home.ts
import { Page, Observable, fromObject } from '@nativescript/core'
import { authService } from '../services/auth.service'

export function onNavigatingTo(args) {
  const page = <Page>args.object
  const context = fromObject({
    user: null,
    isLoading: true,
    items: []
  })
  
  page.bindingContext = context
  
  // 加载数据
  loadData(context)
}

async function loadData(context) {
  try {
    context.set('isLoading', true)
    
    const user = await authService.getCurrentUser()
    const items = await fetchItems()
    
    context.set('user', user)
    context.set('items', items)
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    context.set('isLoading', false)
  }
}

export function onItemTap(args) {
  const item = args.view.bindingContext
  Frame.topmost().navigate({
    moduleName: 'pages/Detail',
    context: { itemId: item.id }
  })
}

export function onRefresh(args) {
  const page = args.object.page
  loadData(page.bindingContext)
  args.object.notifyPullToRefreshFinished()
}
```

```xml
<!-- app/pages/Home.xml -->
<Page 
  navigatingTo="onNavigatingTo"
  class="page">
  
  <ActionBar title="首页" class="action-bar">
    <ActionItem 
      ios.position="right"
      android.position="actionBar"
      tap="onSettingsTap">
      <Label text="⚙️" class="action-item" />
    </ActionItem>
  </ActionBar>
  
  <GridLayout rows="auto, *" class="content">
    <!-- 加载状态 -->
    <ActivityIndicator 
      busy="{{ isLoading }}"
      row="0"
      class="activity-indicator" />
    
    <!-- 下拉刷新 -->
    <ListView 
      items="{{ items }}"
      itemTap="onItemTap"
      row="1"
      pullToRefresh="true"
      refresh="onRefresh">
      
      <ListView.itemTemplate>
        <GridLayout columns="auto, *, auto" class="item">
          <Image 
            src="{{ thumbnail }}"
            width="60"
            height="60"
            col="0"
            class="thumbnail" />
          
          <StackLayout col="1" class="info">
            <Label text="{{ title }}" class="title" />
            <Label text="{{ subtitle }}" class="subtitle" />
          </StackLayout>
          
          <Label 
            text="›"
            col="2"
            class="arrow" />
        </GridLayout>
      </ListView.itemTemplate>
    </ListView>
  </GridLayout>
</Page>
```

```scss
/* app/pages/Home.scss */
.page {
  background-color: #f5f5f5;
}

.action-bar {
  background-color: #3B82F6;
  color: white;
}

.content {
  padding: 16;
}

.activity-indicator {
  width: 40;
  height: 40;
  color: #3B82F6;
}

.item {
  padding: 12;
  background-color: white;
  margin-bottom: 8;
  border-radius: 8;
}

.thumbnail {
  border-radius: 8;
  margin-right: 12;
}

.info {
  vertical-align: center;
}

.title {
  font-size: 16;
  font-weight: bold;
  color: #1F2937;
  margin-bottom: 4;
}

.subtitle {
  font-size: 14;
  color: #6B7280;
}

.arrow {
  font-size: 24;
  color: #9CA3AF;
  vertical-align: center;
}
```

### 4. 路由配置

```typescript
// app/routers/index.ts
import { Frame } from '@nativescript/core'

export class Router {
  private static frame: Frame
  
  static setFrame(frame: Frame) {
    this.frame = frame
  }
  
  static navigate(page: string, context?: any) {
    this.frame.navigate({
      moduleName: `pages/${page}`,
      context,
      animated: true,
      transition: {
        name: 'slide',
        duration: 300
      }
    })
  }
  
  static goBack() {
    this.frame.goBack()
  }
  
  static replace(page: string) {
    this.frame.navigate({
      moduleName: `pages/${page}`,
      clearHistory: true
    })
  }
  
  static modal(page: string, context?: any): Promise<any> {
    return this.frame.currentPage.showModal(`pages/${page}`, {
      context,
      closeCallback: (result) => {
        return result
      },
      fullscreen: false,
      animated: true
    })
  }
}

// 使用
Router.navigate('Detail', { id: 123 })
Router.goBack()
```

### 5. 服务层

```typescript
// app/services/api.service.ts
import { Http } from '@nativescript/core'

export class ApiService {
  private baseUrl = 'https://api.example.com'
  
  async get<T>(endpoint: string, params?: any): Promise<T> {
    try {
      const response = await Http.request({
        url: `${this.baseUrl}${endpoint}`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        },
        params
      })
      
      if (response.statusCode !== 200) {
        throw new Error(`HTTP ${response.statusCode}`)
      }
      
      return response.content.toJSON() as T
    } catch (error) {
      console.error('API 请求失败:', error)
      throw error
    }
  }
  
  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await Http.request({
      url: `${this.baseUrl}${endpoint}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      content: JSON.stringify(data)
    })
    
    return response.content.toJSON() as T
  }
  
  private getToken(): string {
    // 从本地存储获取 token
    return ApplicationSettings.getString('token', '')
  }
}

export const apiService = new ApiService()
```

```typescript
// app/services/storage.service.ts
import { ApplicationSettings } from '@nativescript/core'

export class StorageService {
  set(key: string, value: any): void {
    ApplicationSettings.setString(key, JSON.stringify(value))
  }
  
  get<T>(key: string, defaultValue?: T): T | null {
    const value = ApplicationSettings.getString(key)
    return value ? JSON.parse(value) : defaultValue || null
  }
  
  remove(key: string): void {
    ApplicationSettings.remove(key)
  }
  
  clear(): void {
    ApplicationSettings.clear()
  }
}

export const storageService = new StorageService()
```

### 6. 原生插件使用

```typescript
// 使用相机插件
import { Camera } from '@nativescript/camera'

export async function takePhoto() {
  const isAvailable = await Camera.isAvailable()
  if (!isAvailable) {
    alert('相机不可用')
    return
  }
  
  const image = await Camera.takePicture({
    width: 800,
    height: 600,
    keepAspectRatio: true,
    saveToGallery: true
  })
  
  return image
}

// 使用地理位置插件
import { Geolocation } from '@nativescript/geolocation'

export async function getCurrentLocation() {
  const isEnabled = await Geolocation.isEnabled()
  if (!isEnabled) {
    await Geolocation.enableLocationRequest()
  }
  
  const location = await Geolocation.getCurrentLocation({
    desiredAccuracy: 3,  // 高精度
    updateDistance: 10,
    maximumAge: 20000,
    timeout: 20000
  })
  
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    altitude: location.altitude
  }
}

// 使用推送通知
import { Push } from '@nativescript/push'

export async function initPushNotifications() {
  Push.register({
    onMessageReceived: (message) => {
      console.log('收到推送:', message)
    },
    onTokenReceived: (token) => {
      console.log('设备 Token:', token)
    }
  })
}
```

### 7. UI 组件

```typescript
// app/components/Button.ts
import { Button } from '@nativescript/core'

export class PrimaryButton extends Button {
  constructor() {
    super()
    
    this.className = 'primary-button'
    this.borderRadius = 8
    this.padding = '12 24'
    this.fontSize = 16
    this.color = 'white'
    this.backgroundColor = '#3B82F6'
  }
  
  onLoaded() {
    super.onLoaded()
    
    // 添加点击效果
    this.on(Button.tapEvent, () => {
      this.animate({
        scale: { x: 0.95, y: 0.95 },
        duration: 100
      }).then(() => {
        this.animate({
          scale: { x: 1, y: 1 },
          duration: 100
        })
      })
    })
  }
}
```

### 8. 动画

```typescript
// app/utils/animations.ts
import { View } from '@nativescript/core'

export function fadeIn(view: View, duration: number = 300) {
  view.opacity = 0
  return view.animate({
    opacity: 1,
    duration
  })
}

export function slideIn(view: View, direction: 'left' | 'right' | 'up' | 'down' = 'right') {
  const translations = {
    left: { x: -view.width, y: 0 },
    right: { x: view.width, y: 0 },
    up: { x: 0, y: view.height },
    down: { x: 0, y: -view.height }
  }
  
  view.translateX = translations[direction].x
  view.translateY = translations[direction].y
  
  return view.animate({
    translate: { x: 0, y: 0 },
    duration: 300,
    curve: 'easeOut'
  })
}

export function scaleIn(view: View) {
  view.scaleX = 0
  view.scaleY = 0
  
  return view.animate({
    scale: { x: 1, y: 1 },
    duration: 300,
    curve: 'spring'
  })
}

// 组合动画
export async function cardEnterAnimation(card: View) {
  card.opacity = 0
  card.translateY = 50
  
  await card.animate({
    opacity: 1,
    translate: { x: 0, y: 0 },
    duration: 400,
    curve: 'easeOut'
  })
}
```

## 最佳实践

### 1. 性能优化

```typescript
// 使用 ListView 的虚拟化
<ListView items="{{ items }}" itemTap="onItemTap">
  <ListView.itemTemplate>
    <!-- 保持模板简单 -->
    <GridLayout columns="auto, *" class="item">
      <Image src="{{ image }}" width="40" height="40" />
      <Label text="{{ title }}" col="1" />
    </GridLayout>
  </ListView.itemTemplate>
</ListViewView>

// 避免复杂的绑定表达式
// ❌ 不好
<Label text="{{ 'Price: $' + price + ' (' + discount + '% off)' }}" />

// ✅ 好 - 在 ViewModel 中计算
<Label text="{{ formattedPrice }}" />
```

```typescript
// 使用纯函数优化绑定
import { Observable } from '@nativescript/core'

class ViewModel extends Observable {
  private _items: any[] = []
  
  get items() {
    return this._items
  }
  
  set items(value: any[]) {
    if (this._items !== value) {
      this._items = value
      this.notifyPropertyChange('items', value)
    }
  }
  
  // 使用 computed 属性
  get formattedPrice() {
    return `$${this.price} (${this.discount}% off)`
  }
}
```

### 2. 内存管理

```typescript
// 页面销毁时清理资源
export function onUnloaded(args) {
  const page = <Page>args.object
  
  // 移除事件监听
  page.off('navigatingTo')
  
  // 清理定时器
  if (page.timer) {
    clearInterval(page.timer)
    page.timer = null
  }
  
  // 取消订阅
  if (page.subscription) {
    page.subscription.unsubscribe()
    page.subscription = null
  }
}

// 使用 WeakRef 避免内存泄漏
import { WeakRef } from '@nativescript/core'

class MyService {
  private pageRef: WeakRef<Page>
  
  setPage(page: Page) {
    this.pageRef = new WeakRef(page)
  }
  
  updatePage() {
    const page = this.pageRef.get()
    if (page) {
      // 更新页面
    }
  }
}
```

### 3. 错误处理

```typescript
// 全局错误处理
import { Application, Frame } from '@nativescript/core'

Application.on(Application.uncaughtErrorEvent, (args) => {
  const error = args.error
  
  console.error('未捕获的错误:', error)
  
  // 跳转到错误页面
  Frame.topmost().navigate({
    moduleName: 'pages/Error',
    context: { error: error.message }
  })
})

// 异步错误处理
Application.on(Application.discardedErrorEvent, (args) => {
  console.error('丢弃的错误:', args.error)
})
```

### 4. 类型安全

```typescript
// 定义严格的类型
interface User {
  id: string
  name: string
  email: string
}

interface PageContext {
  userId: string
  mode: 'view' | 'edit'
}

// 类型安全的页面导航
export function navigateToDetail(userId: string) {
  const context: PageContext = {
    userId,
    mode: 'view'
  }
  
  Frame.topmost().navigate({
    moduleName: 'pages/Detail',
    context
  })
}

// 在目标页面中使用
export function onNavigatingTo(args) {
  const page = <Page>args.object
  const context = page.navigationContext as PageContext
  
  // TypeScript 知道 context 的类型
  console.log(context.userId)
  console.log(context.mode)
}
```

## 常用命令

```bash
# 安装 CLI
npm install -g nativescript

# 创建项目
ns create myApp --vue  # 或 --angular, --react, --typescript

# 添加平台
ns platform add android
ns platform add ios

# 开发
ns run android
ns run ios

# 调试
ns debug android
ns debug ios

# 构建
ns build android --release
ns build ios --release

# 生成应用资源（图标、启动画面）
ns resources generate icons <path-to-icon.png>
ns resources generate splashes <path-to-image.png>

# 清理
ns clean app
ns platform clean android

# 插件
ns plugin add @nativescript/camera
ns plugin add @nativescript/geolocation
```

## 部署配置

### Android (Google Play)

```gradle
// app/App_Resources/Android/app.gradle
android {
  defaultConfig {
    minSdkVersion 21
    targetSdkVersion 34
    versionCode 1
    versionName "1.0.0"
  }
  
  signingConfigs {
    release {
      storeFile file("my-release-key.jks")
      storePassword System.getenv("KEYSTORE_PASSWORD")
      keyAlias "my-key-alias"
      keyPassword System.getenv("KEY_PASSWORD")
    }
  }
  
  buildTypes {
    release {
      signingConfig signingConfigs.release
      minifyEnabled true
      proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
  }
}
```

```bash
# 构建 AAB (Android App Bundle)
ns build android --release --aab

# 上传到 Google Play
# 使用 Google Play Console 或 fastlane
```

### iOS (App Store)

```xml
<!-- app/App_Resources/iOS/Info.plist -->
<key>CFBundleShortVersionString</key>
<string>1.0.0</string>
<key>CFBundleVersion</key>
<string>1</string>
<key>MinimumOSVersion</key>
<string>13.0</string>
<key>UIRequiredDeviceCapabilities</key>
<array>
  <string>armv7</string>
</array>
```

```bash
# 构建 iOS
ns build ios --release

# 使用 Xcode 打开项目
open platforms/ios/MyApp.xcworkspace

# 或使用 fastlane
fastlane ios release
```

## 资源

- [NativeScript 官方文档](https://docs.nativescript.org/)
- [NativeScript Market](https://market.nativescript.org/)
- [NativeScript 示例](https://github.com/NativeScript/nativescript-app-templates)
- [NativeScript Discord](https://discord.gg/RgmpGky)
