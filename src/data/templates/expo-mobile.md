# Expo 移动应用开发模板

## 技术栈

- **框架**: Expo SDK 50+
- **核心**: React Native 0.73+
- **导航**: Expo Router / React Navigation
- **状态管理**: Zustand / Jotai / Redux Toolkit
- **样式**: NativeWind (Tailwind) / StyleSheet / Tamagui
- **网络**: TanStack Query / SWR
- **存储**: AsyncStorage / SecureStore / SQLite
- **UI 组件**: Tamagui / NativeBase / 自定义

## 项目结构

```
expo-app/
├── app/                    # Expo Router 路由
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx       # 首页
│   │   ├── explore.tsx
│   │   └── profile.tsx
│   ├── modal.tsx
│   └── _layout.tsx
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   └── features/
│       ├── UserAvatar.tsx
│       └── PostCard.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useTheme.ts
│   └── useNotifications.ts
├── services/
│   ├── api.ts
│   ├── auth.ts
│   └── storage.ts
├── stores/
│   ├── authStore.ts
│   └── settingsStore.ts
├── utils/
│   ├── constants.ts
│   └── helpers.ts
├── assets/
│   ├── images/
│   ├── fonts/
│   └── icons/
├── app.json
├── eas.json
├── package.json
└── tsconfig.json
```

## 代码模式

### 路由配置 (Expo Router)

```typescript
// app/_layout.tsx - 根布局
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen 
            name="modal" 
            options={{ presentation: 'modal' }} 
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// app/(tabs)/_layout.tsx - Tab 导航
import { Tabs } from 'expo-router';
import { Home, Search, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#3b82f6' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: '发现',
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
```

### 页面组件

```typescript
// app/(tabs)/index.tsx
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from 'expo-router';
import { PostCard } from '@/components/features/PostCard';
import { fetchPosts } from '@/services/api';

export default function HomeScreen() {
  const navigation = useNavigation();
  
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  });

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={data?.posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          isLoading ? (
            <Text className="text-center mt-10">加载中...</Text>
          ) : (
            <Text className="text-center mt-10 text-gray-500">暂无内容</Text>
          )
        }
      />
    </View>
  );
}
```

### 状态管理 (Zustand)

```typescript
// stores/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => 
        set({ user, token, isAuthenticated: true }),
      logout: () => 
        set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### API 服务

```typescript
// services/api.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
});

// 请求拦截器
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// API 函数
export const fetchPosts = () => api.get('/posts');
export const fetchPost = (id: string) => api.get(`/posts/${id}`);
export const createPost = (data: CreatePostDto) => api.post('/posts', data);
export const updatePost = (id: string, data: UpdatePostDto) => 
  api.put(`/posts/${id}`, data);
export const deletePost = (id: string) => api.delete(`/posts/${id}`);
```

### UI 组件

```typescript
// components/ui/Button.tsx
import { Pressable, Text, ActivityIndicator } from 'react-native';
import { cn } from '@/utils/cn';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className,
}: ButtonProps) {
  const baseStyles = 'rounded-lg items-center justify-center flex-row';
  
  const variantStyles = {
    primary: 'bg-blue-500',
    secondary: 'bg-gray-200',
    outline: 'border-2 border-blue-500 bg-transparent',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5',
    md: 'px-4 py-2.5',
    lg: 'px-6 py-3.5',
  };

  const textStyles = {
    primary: 'text-white font-semibold',
    secondary: 'text-gray-800 font-semibold',
    outline: 'text-blue-500 font-semibold',
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isLoading}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        disabled && 'opacity-50',
        className
      )}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#3b82f6'} />
      ) : (
        <Text className={textStyles[variant]}>{title}</Text>
      )}
    </Pressable>
  );
}
```

### 自定义 Hook

```typescript
// hooks/useNotifications.ts
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';

export function useNotifications() {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const router = useRouter();

  useEffect(() => {
    // 前台收到通知
    notificationListener.current = 
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('收到通知:', notification);
      });

    // 点击通知
    responseListener.current = 
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data.screen) {
          router.push(data.screen as string);
        }
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current!
      );
      Notifications.removeNotificationSubscription(responseListener.current!);
    };
  }, []);

  const scheduleNotification = async (
    title: string,
    body: string,
    seconds: number
  ) => {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: { seconds },
    });
  };

  return { scheduleNotification };
}
```

## 最佳实践

### 1. 性能优化

```typescript
// 使用 memo 避免不必要渲染
import { memo } from 'react';

export const PostCard = memo(({ post }: { post: Post }) => {
  return (
    <View className="p-4 border-b border-gray-200">
      <Text className="font-semibold">{post.title}</Text>
      <Text className="text-gray-600">{post.excerpt}</Text>
    </View>
  );
});

// FlatList 优化
<FlatList
  data={posts}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
  initialNumToRender={10}
  maxToRenderPerBatch={5}
  windowSize={5}
  removeClippedSubviews={true}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### 2. 错误边界

```typescript
// components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';
import { View, Text, Button } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-lg font-bold mb-2">出错了</Text>
          <Text className="text-gray-600 mb-4">
            {this.state.error?.message}
          </Text>
          <Button 
            title="重试" 
            onPress={() => this.setState({ hasError: false })} 
          />
        </View>
      );
    }
    return this.props.children;
  }
}
```

### 3. 环境配置

```typescript
// .env.development
EXPO_PUBLIC_API_URL=https://api-dev.example.com
EXPO_PUBLIC_APP_NAME=MyApp Dev

// .env.production
EXPO_PUBLIC_API_URL=https://api.example.com
EXPO_PUBLIC_APP_NAME=MyApp

// 使用环境变量
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
```

### 4. 深色模式

```typescript
// hooks/useTheme.ts
import { useColorScheme } from 'react-native';
import { useColorScheme as useNavColorScheme } from 'nativewind';

export function useTheme() {
  const { colorScheme, setColorScheme } = useNavColorScheme();
  const systemColorScheme = useColorScheme();
  
  const isDark = colorScheme === 'dark';
  
  const toggleTheme = () => {
    setColorScheme(isDark ? 'light' : 'dark');
  };

  return { colorScheme, isDark, toggleTheme };
}

// 组件中使用
function Card() {
  const { isDark } = useTheme();
  
  return (
    <View className={cn(
      'p-4 rounded-lg',
      isDark ? 'bg-gray-800' : 'bg-white'
    )}>
      {/* ... */}
    </View>
  );
}
```

### 5. 安全存储

```typescript
// services/secureStorage.ts
import * as SecureStore from 'expo-secure-store';

export async function saveSecure(key: string, value: string) {
  await SecureStore.setItemAsync(key, value);
}

export async function getSecure(key: string) {
  return await SecureStore.getItemAsync(key);
}

export async function deleteSecure(key: string) {
  await SecureStore.deleteItemAsync(key);
}

// 使用示例
await saveSecure('refreshToken', token);
const token = await getSecure('refreshToken');
```

## 常用命令

```bash
# 创建项目
npx create-expo-app@latest my-app -t expo-template-blank-typescript

# 安装依赖
npx expo install expo-router expo-status-bar
npx expo install @react-native-async-storage/async-storage
npx expo install expo-secure-store expo-notifications
npx expo install expo-image-picker expo-camera

# 开发
npx expo start
npx expo start --clear       # 清除缓存
npx expo start --tunnel      # 使用隧道（远程调试）

# 运行
npx expo run:ios
npx expo run:android

# 构建 (EAS)
eas build --platform ios --profile development
eas build --platform android --profile preview

# 提交
eas submit --platform ios --latest
eas submit --platform android --latest

# 更新 (OTA)
eas update --branch production --message "修复登录问题"

# 代码检查
npx tsc --noEmit
npx eslint . --ext .ts,.tsx
```

## 部署配置

### app.json

```json
{
  "expo": {
    "name": "MyApp",
    "slug": "my-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "myapp",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#3b82f6"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.company.myapp",
      "infoPlist": {
        "NSCameraUsageDescription": "需要相机权限来拍照"
      }
    },
    "android": {
      "package": "com.company.myapp",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#3b82f6"
      },
      "permissions": ["CAMERA", "READ_EXTERNAL_STORAGE"]
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      [
        "expo-image-picker",
        { "photosPermission": "需要访问相册来选择图片" }
      ]
    ],
    "extra": {
      "eas": { "projectId": "your-project-id" }
    }
  }
}
```

### eas.json

```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true },
      "android": { "buildType": "apk" }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "ios": { "simulator": false }
    },
    "production": {
      "distribution": "store",
      "ios": { "autoIncrement": true },
      "android": { "buildType": "app-bundle" }
    }
  },
  "submit": {
    "production": {
      "ios": { "appleId": "your@email.com" },
      "android": { "serviceAccountKeyPath": "./google-key.json" }
    }
  }
}
```

### CI/CD (GitHub Actions)

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npx tsc --noEmit
      
      - name: Build iOS
        run: eas build --platform ios --profile preview --non-interactive
      
      - name: Build Android
        run: eas build --platform android --profile preview --non-interactive
      
      - name: Submit to stores
        if: github.ref == 'refs/heads/main'
        run: |
          eas submit --platform ios --latest --non-interactive
          eas submit --platform android --latest --non-interactive
```

## 常见问题

1. **Metro bundler 缓存问题** → `npx expo start --clear`
2. **iOS 证书过期** → 使用 EAS 自动管理或手动更新
3. **推送通知不工作** → 检查权限和证书配置
4. **深色模式闪烁** → 在 `_layout.tsx` 中提前设置主题
5. **Android 包体积过大** → 启用 Hermes，使用 `npx expo-optimize`

## 扩展资源

- [Expo 官方文档](https://docs.expo.dev/)
- [Expo Router 文档](https://docs.expo.dev/router/introduction/)
- [React Native 目录](https://reactnative.directory/)
- [EAS Build 文档](https://docs.expo.dev/build/introduction/)
- [NativeWind 文档](https://www.nativewind.dev/)
