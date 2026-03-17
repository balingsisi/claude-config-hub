# Capacitor 模板

跨平台移动应用框架，使用 Web 技术（HTML/CSS/JS）构建原生 iOS、Android 和 Progressive Web Apps。

## 技术栈

- **框架**: Capacitor 5.x
- **前端**: React / Vue / Angular / Vanilla JS
- **语言**: TypeScript / JavaScript
- **样式**: Tailwind CSS / CSS Modules / Styled Components
- **原生桥接**: Capacitor Plugins
- **构建工具**: Vite / Webpack
- **状态管理**: Pinia / Zustand / Redux

## 项目结构

```
capacitor-app/
├── src/                      # Web 源代码
│   ├── main.tsx              # 应用入口
│   ├── App.tsx               # 根组件
│   ├── components/           # 组件目录
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Camera.tsx
│   │   └── Geolocation.tsx
│   ├── pages/                # 页面组件
│   │   ├── Home.tsx
│   │   ├── Profile.tsx
│   │   ├── Settings.tsx
│   │   └── Camera.tsx
│   ├── hooks/                # 自定义 Hooks
│   │   ├── useCamera.ts
│   │   ├── useGeolocation.ts
│   │   └── useShare.ts
│   ├── services/             # 服务层
│   │   ├── api.ts
│   │   ├── storage.ts
│   │   └── auth.ts
│   ├── utils/                # 工具函数
│   │   ├── helpers.ts
│   │   └── validators.ts
│   ├── types/                # TypeScript 类型
│   │   └── index.ts
│   └── styles/               # 样式文件
│       └── index.css
├── public/                   # 静态资源
│   └── assets/
│       ├── icon.png
│       └── splash.png
├── android/                  # Android 原生项目
│   ├── app/
│   ├── build.gradle
│   └── capacitor.build.gradle
├── ios/                      # iOS 原生项目
│   ├── App/
│   ├── App.xcworkspace
│   └── Podfile
├── capacitor.config.ts       # Capacitor 配置
├── package.json
├── vite.config.ts            # Vite 配置
├── tsconfig.json
└── README.md
```

## 核心代码模式

### 1. Capacitor 配置 (capacitor.config.ts)

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'My App',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#3B82F6',
      showSpinner: true,
      spinnerColor: '#FFFFFF'
    },
    Camera: {
      saveToGallery: true
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  },
  android: {
    buildOptions: {
      keystorePath: 'android.keystore',
      keystorePassword: process.env.KEYSTORE_PASSWORD,
      keystoreAlias: 'my-key',
      keystoreAliasPassword: process.env.KEY_ALIAS_PASSWORD,
      signingType: 'apksigner'
    }
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'My App'
  }
};

export default config;
```

### 2. 应用入口 (src/main.tsx)

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';

// 初始化 Capacitor 插件
async function initializeApp() {
  try {
    // 设置状态栏
    await StatusBar.setStyle({ style: Style.Dark });
    
    // 隐藏启动画面
    await SplashScreen.hide();
    
    // 键盘事件监听
    Keyboard.addListener('keyboardWillShow', (info) => {
      console.log('Keyboard will show', info.keyboardHeight);
    });
    
    Keyboard.addListener('keyboardWillHide', () => {
      console.log('Keyboard will hide');
    });
  } catch (error) {
    console.error('初始化失败:', error);
  }
}

// 渲染应用
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 初始化
initializeApp();
```

### 3. 相机 Hook (src/hooks/useCamera.ts)

```typescript
import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';

export interface Photo {
  filepath: string;
  webviewPath?: string;
  dataUrl?: string;
}

export function useCamera() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const takePhoto = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 100,
        saveToGallery: true,
        correctOrientation: true
      });

      const fileName = `${Date.now()}.jpeg`;
      
      // 保存到文件系统
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: photo.base64String || '',
        directory: Directory.Data
      });

      const newPhoto: Photo = {
        filepath: fileName,
        webviewPath: photo.webPath,
        dataUrl: `data:image/jpeg;base64,${photo.base64String}`
      };

      setPhotos(prev => [newPhoto, ...prev]);
      return newPhoto;
    } catch (err) {
      setError('拍照失败，请重试');
      console.error('Camera error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        quality: 80
      });

      const newPhoto: Photo = {
        filepath: `${Date.now()}.jpeg`,
        webviewPath: photo.webPath,
        dataUrl: `data:image/jpeg;base64,${photo.base64String}`
      };

      setPhotos(prev => [newPhoto, ...prev]);
      return newPhoto;
    } catch (err) {
      setError('选择图片失败');
      console.error('Pick image error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deletePhoto = async (filepath: string) => {
    try {
      await Filesystem.deleteFile({
        path: filepath,
        directory: Directory.Data
      });
      setPhotos(prev => prev.filter(p => p.filepath !== filepath));
    } catch (err) {
      console.error('Delete photo error:', err);
    }
  };

  const loadSavedPhotos = async () => {
    try {
      const { files } = await Filesystem.readdir({
        path: '',
        directory: Directory.Data
      });

      const loadedPhotos = await Promise.all(
        files.map(async (file) => {
          const { data } = await Filesystem.readFile({
            path: file.name,
            directory: Directory.Data
          });
          
          return {
            filepath: file.name,
            dataUrl: `data:image/jpeg;base64,${data}`
          };
        })
      );

      setPhotos(loadedPhotos);
    } catch (err) {
      console.error('Load photos error:', err);
    }
  };

  return {
    photos,
    loading,
    error,
    takePhoto,
    pickImage,
    deletePhoto,
    loadSavedPhotos
  };
}
```

### 4. 地理位置Hook (src/hooks/useGeolocation.ts)

```typescript
import { useState, useEffect } from 'react';
import { Geolocation, Position } from '@capacitor/geolocation';

export interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  timestamp: number | null;
  loading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    timestamp: null,
    loading: false,
    error: null
  });

  const [watching, setWatching] = useState(false);

  const getCurrentPosition = async () => {
    setLocation(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const position: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
        loading: false,
        error: null
      });

      return position;
    } catch (err: any) {
      const errorMsg = err.message || '获取位置失败';
      setLocation(prev => ({
        ...prev,
        loading: false,
        error: errorMsg
      }));
      return null;
    }
  };

  const startWatching = async () => {
    if (watching) return;

    setWatching(true);
    
    try {
      await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        },
        (position, err) => {
          if (err) {
            setLocation(prev => ({
              ...prev,
              error: err.message
            }));
            return;
          }

          if (position) {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
              loading: false,
              error: null
            });
          }
        }
      );
    } catch (err) {
      console.error('Watch position error:', err);
      setWatching(false);
    }
  };

  const stopWatching = async () => {
    try {
      await Geolocation.clearWatch({ id: 'geolocation' });
      setWatching(false);
    } catch (err) {
      console.error('Clear watch error:', err);
    }
  };

  const checkPermissions = async () => {
    try {
      const permissions = await Geolocation.checkPermissions();
      return permissions;
    } catch (err) {
      console.error('Check permissions error:', err);
      return null;
    }
  };

  const requestPermissions = async () => {
    try {
      const permissions = await Geolocation.requestPermissions();
      return permissions;
    } catch (err) {
      console.error('Request permissions error:', err);
      return null;
    }
  };

  return {
    ...location,
    watching,
    getCurrentPosition,
    startWatching,
    stopWatching,
    checkPermissions,
    requestPermissions
  };
}
```

### 5. 分享Hook (src/hooks/useShare.ts)

```typescript
import { useState } from 'react';
import { Share } from '@capacitor/share';

export function useShare() {
  const [sharing, setSharing] = useState(false);

  const share = async (options: {
    title?: string;
    text?: string;
    url?: string;
    files?: string[];
  }) => {
    setSharing(true);
    
    try {
      await Share.share({
        title: options.title || '分享',
        text: options.text,
        url: options.url,
        dialogTitle: '分享到'
      });
      
      return true;
    } catch (err: any) {
      if (err.message !== 'User cancelled') {
        console.error('Share error:', err);
      }
      return false;
    } finally {
      setSharing(false);
    }
  };

  const shareImage = async (imagePath: string, text?: string) => {
    setSharing(true);
    
    try {
      await Share.share({
        files: [imagePath],
        text: text
      });
      
      return true;
    } catch (err) {
      console.error('Share image error:', err);
      return false;
    } finally {
      setSharing(false);
    }
  };

  const canShare = async () => {
    try {
      const result = await Share.canShare();
      return result.value;
    } catch (err) {
      return false;
    }
  };

  return {
    sharing,
    share,
    shareImage,
    canShare
  };
}
```

### 6. 本地存储服务 (src/services/storage.ts)

```typescript
import { Preferences } from '@capacitor/preferences';

export class StorageService {
  static async set(key: string, value: any): Promise<void> {
    await Preferences.set({
      key,
      value: JSON.stringify(value)
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

  static async keys(): Promise<string[]> {
    const { keys } = await Preferences.keys();
    return keys;
  }
}

// 使用示例
// await StorageService.set('user', { id: 1, name: 'John' });
// const user = await StorageService.get<User>('user');
```

### 7. 推送通知服务 (src/services/notifications.ts)

```typescript
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';

export class NotificationService {
  static async init() {
    // 请求权限
    const permStatus = await PushNotifications.requestPermissions();
    
    if (permStatus.receive === 'granted') {
      // 注册推送通知
      await PushNotifications.register();
    }

    // 监听注册成功
    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token: ' + token.value);
      // 将 token 发送到服务器
    });

    // 监听注册失败
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error: ' + JSON.stringify(error));
    });

    // 监听推送通知
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received: ' + JSON.stringify(notification));
      // 显示本地通知
      this.showLocalNotification(notification.title || '', notification.body || '');
    });

    // 监听通知点击
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push action: ' + JSON.stringify(action));
      // 处理点击事件
    });
  }

  static async showLocalNotification(title: string, body: string) {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Date.now(),
          title,
          body,
          schedule: { at: new Date(Date.now() + 100) }
        }
      ]
    });
  }

  static async getDeliveredNotifications() {
    const { notifications } = await PushNotifications.getDeliveredNotifications();
    return notifications;
  }

  static async removeAllDeliveredNotifications() {
    await PushNotifications.removeAllDeliveredNotifications();
  }
}
```

### 8. 相机组件 (src/components/Camera.tsx)

```typescript
import React from 'react';
import { useCamera, Photo } from '../hooks/useCamera';

interface CameraProps {
  onPhotoTaken?: (photo: Photo) => void;
}

export const Camera: React.FC<CameraProps> = ({ onPhotoTaken }) => {
  const { photos, loading, error, takePhoto, pickImage } = useCamera();

  const handleTakePhoto = async () => {
    const photo = await takePhoto();
    if (photo && onPhotoTaken) {
      onPhotoTaken(photo);
    }
  };

  const handlePickImage = async () => {
    const photo = await pickImage();
    if (photo && onPhotoTaken) {
      onPhotoTaken(photo);
    }
  };

  return (
    <div className="camera-container">
      <div className="buttons">
        <button onClick={handleTakePhoto} disabled={loading}>
          {loading ? '处理中...' : '拍照'}
        </button>
        <button onClick={handlePickImage} disabled={loading}>
          选择图片
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="photos-grid">
        {photos.map((photo, index) => (
          <div key={index} className="photo-item">
            <img 
              src={photo.webviewPath || photo.dataUrl} 
              alt={`Photo ${index}`}
              className="photo"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 最佳实践

### 1. 平台检测和适配

```typescript
import { Capacitor } from '@capacitor/core';

// 检测平台
const platform = Capacitor.getPlatform(); // 'web' | 'ios' | 'android'
const isNative = Capacitor.isNativePlatform();

// 根据平台适配
if (platform === 'ios') {
  // iOS 特定代码
} else if (platform === 'android') {
  // Android 特定代码
} else {
  // Web 代码
}

// 安全区域适配（iOS）
import { SafeArea } from '@capacitor-community/safe-area';

const { insets } = await SafeArea.getSafeAreaInsets();
// 使用 insets.top, insets.bottom 等
```

### 2. 错误处理

```typescript
import { CapacitorException } from '@capacitor/core';

async function safeCall<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof CapacitorException) {
      console.error('Capacitor error:', error.message);
      // 处理 Capacitor 特定错误
    } else {
      console.error('Unexpected error:', error);
    }
    return null;
  }
}

// 使用
const photo = await safeCall(() => Camera.getPhoto({ ... }));
```

### 3. 权限管理

```typescript
import { Geolocation } from '@capacitor/geolocation';

async function checkAndRequestPermissions() {
  // 检查权限
  const permissions = await Geolocation.checkPermissions();
  
  if (permissions.location === 'denied') {
    // 权限被拒绝，引导用户到设置
    alert('请在设置中允许访问位置');
    return false;
  }
  
  if (permissions.location === 'prompt') {
    // 请求权限
    const requestResult = await Geolocation.requestPermissions();
    return requestResult.location === 'granted';
  }
  
  return true;
}
```

### 4. 网络状态监听

```typescript
import { Network } from '@capacitor/network';

// 监听网络状态变化
Network.addListener('networkStatusChange', (status) => {
  console.log('Network status changed', status);
  if (!status.connected) {
    alert('网络已断开');
  }
});

// 获取当前网络状态
const status = await Network.getStatus();
console.log('Network connected:', status.connected);
console.log('Connection type:', status.connectionType);
```

### 5. 应用生命周期

```typescript
import { App } from '@capacitor/app';

// 监听应用状态
App.addListener('appStateChange', ({ isActive }) => {
  console.log('App state changed. Is active:', isActive);
  if (isActive) {
    // 应用恢复到前台
    refreshData();
  }
});

// 监听后退按钮（Android）
App.addListener('backButton', ({ canGoBack }) => {
  if (canGoBack) {
    window.history.back();
  } else {
    App.exitApp();
  }
});

// 监听 URL 打开
App.addListener('appUrlOpen', (event) => {
  console.log('App opened with URL:', event.url);
  // 处理深度链接
});
```

### 6. 样式适配

```css
/* iOS 安全区域 */
@supports (padding-top: env(safe-area-inset-top)) {
  .header {
    padding-top: env(safe-area-inset-top);
  }
  
  .footer {
    padding-bottom: env(safe-area-inset-bottom);
  }
}

/* Android 状态栏 */
.header {
  padding-top: var(--status-bar-height, 24px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 16px;
  }
}

/* 触摸优化 */
button, a {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

/* 禁用长按菜单 */
* {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

/* 允许文本选择 */
input, textarea {
  -webkit-user-select: auto;
  user-select: auto;
}
```

## 常用命令

### 开发

```bash
# 创建新项目
npm create @capacitor/app@latest my-app

# 添加平台
npx cap add android
npx cap add ios

# 同步 Web 资源到原生项目
npx cap sync

# 打开原生 IDE
npx cap open android  # 打开 Android Studio
npx cap open ios      # 打开 Xcode

# 运行开发服务器
npm run dev

# 构建 Web 应用
npm run build

# 复制 Web 资源
npx cap copy

# 更新原生依赖
npx cap update

# 运行在设备/模拟器
npx cap run android
npx cap run ios
npx cap run android -l  # Live reload
npx cap run ios --livereload --external

# 安装插件
npm install @capacitor/camera
npx cap sync
```

### 生产构建

```bash
# Android APK 构建
cd android
./gradlew assembleRelease

# Android Bundle 构建
./gradlew bundleRelease

# iOS 构建
# 在 Xcode 中 Product > Archive

# 签名配置
npx cap build android --androidreleasetools --keystorepath=my-release-key.jks --keystorepassword=**** --keystorealias=my-key --keystorealiaspassword=****

# 复制构建产物
cp android/app/build/outputs/apk/release/app-release.apk ./my-app.apk
```

## 部署配置

### Android 配置 (android/app/build.gradle)

```gradle
android {
    compileSdkVersion 33
    buildToolsVersion "33.0.0"

    defaultConfig {
        applicationId "com.example.app"
        minSdkVersion 22
        targetSdkVersion 33
        versionCode 1
        versionName "1.0.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }

    signingConfigs {
        release {
            storeFile file('my-release-key.jks')
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias 'my-key'
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
}

dependencies {
    implementation project(':capacitor-android')
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.coordinatorlayout:coordinatorlayout:1.2.0'
}
```

### iOS 配置 (ios/App/App/Info.plist)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>zh_CN</string>
    <key>CFBundleDisplayName</key>
    <string>My App</string>
    <key>CFBundleIdentifier</key>
    <string>com.example.app</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    
    <!-- 权限描述 -->
    <key>NSCameraUsageDescription</key>
    <string>需要访问相机以拍照</string>
    <key>NSPhotoLibraryUsageDescription</key>
    <string>需要访问相册以选择照片</string>
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>需要访问位置以提供基于位置的服务</string>
    
    <!-- 后台模式 -->
    <key>UIBackgroundModes</key>
    <array>
        <string>remote-notification</string>
        <string>location</string>
    </array>
</dict>
</plist>
```

### Vite 配置 (vite.config.ts)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          capacitor: ['@capacitor/core', '@capacitor/app']
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  }
});
```

### Fastlane 配置 (ios/fastlane/Fastfile)

```ruby
default_platform(:ios)

platform :ios do
  desc "Build and upload to TestFlight"
  lane :beta do
    build_app(
      scheme: "App",
      workspace: "App.xcworkspace",
      export_method: "app-store",
      output_directory: "./build"
    )
    
    upload_to_testflight(
      skip_waiting_for_build_processing: true
    )
  end
  
  desc "Build and upload to App Store"
  lane :release do
    build_app(
      scheme: "App",
      workspace: "App.xcworkspace",
      export_method: "app-store",
      output_directory: "./build"
    )
    
    upload_to_app_store(
      force: true,
      submit_for_review: true
    )
  end
end
```

### GitHub Actions CI/CD

```yaml
name: Build and Deploy

on:
  push:
    branches: [ main ]

jobs:
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '17'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build web app
        run: npm run build
      
      - name: Sync Capacitor
        run: npx cap sync android
      
      - name: Build Android APK
        run: |
          cd android
          ./gradlew assembleRelease
      
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: app-release.apk
          path: android/app/build/outputs/apk/release/app-release.apk

  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build web app
        run: npm run build
      
      - name: Sync Capacitor
        run: npx cap sync ios
      
      - name: Build iOS
        run: |
          cd ios
          pod install
          xcodebuild -workspace App.xcworkspace -scheme App -configuration Release -sdk iphoneos -archivePath build/App.xcarchive archive
```

## 常用插件列表

```typescript
// 核心插件
import { Core } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Keyboard } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';

// 功能插件
import { Camera } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Share } from '@capacitor/share';
import { Filesystem } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';

// 通知插件
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';

// 第三方插件
import { SplashScreen } from '@capacitor/splash-screen';
import { Browser } from '@capacitor/browser';
import { Device } from '@capacitor/device';
import { Clipboard } from '@capacitor/clipboard';

// 社区插件
import { CameraPreview } from '@capacitor-community/camera-preview';
import { SafeArea } from '@capacitor-community/safe-area';
import { Sqlite } from '@capacitor-community/sqlite';
```

## 参考资料

- [Capacitor 官方文档](https://capacitorjs.com/)
- [Capacitor 插件市场](https://capacitorjs.com/docs/plugins)
- [Ionic Framework](https://ionicframework.com/)
- [React Native 对比](https://capacitorjs.com/compare)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design Guidelines](https://material.io/design)
