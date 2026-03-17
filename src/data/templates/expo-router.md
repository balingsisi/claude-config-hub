# Expo Router 模板

## 技术栈

- **框架**: Expo SDK 51+
- **路由**: Expo Router (文件系统路由)
- **运行时**: React Native
- **导航**: React Navigation (底层)
- **状态管理**: Zustand / Jotai
- **数据获取**: TanStack Query
- **样式**: NativeWind (Tailwind CSS) / StyleSheet
- **类型**: TypeScript

## 项目结构

```
expo-router-app/
├── app/                      # 路由目录 (文件即路由)
│   ├── _layout.tsx          # 根布局
│   ├── index.tsx            # 首页 /
│   ├── (tabs)/              # Tab 组
│   │   ├── _layout.tsx      # Tab 布局
│   │   ├── index.tsx        # Tab 首页
│   │   ├── explore.tsx      # /explore
│   │   └── profile.tsx      # /profile
│   ├── (auth)/              # Auth 组
│   │   ├── _layout.tsx
│   │   ├── login.tsx        # /login
│   │   └── register.tsx     # /register
│   ├── modal.tsx            # /modal (Modal)
│   ├── user/
│   │   └── [id].tsx         # /user/123 (动态路由)
│   └── posts/
│       ├── index.tsx        # /posts
│       └── [postId].tsx     # /posts/123
├── components/
│   ├── ui/                  # 通用 UI 组件
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Input.tsx
│   └── features/            # 功能组件
│       ├── UserCard.tsx
│       └── PostList.tsx
├── hooks/
│   ├── useAuth.ts
│   └── useTheme.ts
├── lib/
│   ├── api.ts              # API 客户端
│   └── storage.ts          # 本地存储
├── stores/
│   ├── authStore.ts
│   └── userStore.ts
├── types/
│   └── index.ts
├── assets/
│   ├── images/
│   └── fonts/
├── app.json                # Expo 配置
├── package.json
└── tsconfig.json
```

## 代码模式

### 根布局

```typescript
// app/_layout.tsx
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#f5f5f5" },
            headerTintColor: "#333",
            headerTitleStyle: { fontWeight: "bold" },
          }}
        >
          <Stack.Screen name="index" options={{ title: "Home" }} />
          <Stack.Screen 
            name="modal" 
            options={{ 
              presentation: "modal",
              title: "Modal" 
            }} 
          />
        </Stack>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
```

### Tab 导航

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";
          
          switch (route.name) {
            case "index":
              iconName = focused ? "home" : "home-outline";
              break;
            case "explore":
              iconName = focused ? "search" : "search-outline";
              break;
            case "profile":
              iconName = focused ? "person" : "person-outline";
              break;
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "gray",
        headerShown: true,
      })}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: "Home",
          tabBarLabel: "首页"
        }} 
      />
      <Tabs.Screen 
        name="explore" 
        options={{ 
          title: "Explore",
          tabBarLabel: "探索"
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: "Profile",
          tabBarLabel: "我的"
        }} 
      />
    </Tabs>
  );
}
```

### 动态路由

```typescript
// app/user/[id].tsx
import { useLocalSearchParams, useGlobalSearchParams, Stack } from "expo-router";
import { View, Text, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { fetchUser } from "@/lib/api";

export default function UserScreen() {
  // useLocalSearchParams - 仅当前屏幕参数
  // useGlobalSearchParams - 全局参数（跨屏幕共享）
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["user", id],
    queryFn: () => fetchUser(id),
  });

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Error loading user</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: user?.name || "User",
          headerBackTitle: "Back"
        }} 
      />
      <View className="flex-1 p-4">
        <Text className="text-2xl font-bold">{user?.name}</Text>
        <Text className="text-gray-600">{user?.email}</Text>
      </View>
    </>
  );
}
```

### 导航方法

```typescript
// 使用 router 进行导航
import { router, Link, useNavigation } from "expo-router";
import { Pressable, Text } from "react-native";

// 1. 编程式导航
export function NavigationExample() {
  const navigation = useNavigation();

  const handleNavigate = () => {
    // 推入新屏幕
    router.push("/user/123");
    
    // 替换当前屏幕
    router.replace("/login");
    
    // 返回上一屏幕
    router.back();
    
    // 返回根屏幕
    router.dismissAll();
    
    // 导航到 Tab
    router.push("/(tabs)/explore");
  };

  return (
    <Pressable onPress={handleNavigate}>
      <Text>Go to User</Text>
    </Pressable>
  );
}

// 2. 声明式导航 (Link 组件)
export function LinkExample() {
  return (
    <>
      {/* 基本链接 */}
      <Link href="/about">About Us</Link>
      
      {/* 带参数的链接 */}
      <Link href={{ pathname: "/user/[id]", params: { id: "123" } }}>
        View User
      </Link>
      
      {/* 替换模式 */}
      <Link href="/login" replace>
        Go to Login
      </Link>
      
      {/* 自定义样式 */}
      <Link 
        href="/settings"
        className="bg-blue-500 p-4 rounded-lg"
      >
        <Text className="text-white">Settings</Text>
      </Link>
    </>
  );
}
```

### 查询参数

```typescript
// app/search.tsx
import { useLocalSearchParams, router } from "expo-router";
import { View, TextInput, FlatList } from "react-native";
import { useState, useEffect } from "react";

export default function SearchScreen() {
  const { q, category } = useLocalSearchParams<{ q?: string; category?: string }>();
  const [searchQuery, setSearchQuery] = useState(q || "");

  // 更新 URL 参数
  const updateSearch = (query: string) => {
    setSearchQuery(query);
    router.setParams({ q: query });
  };

  return (
    <View className="flex-1 p-4">
      <TextInput
        value={searchQuery}
        onChangeText={updateSearch}
        placeholder="Search..."
        className="border border-gray-300 p-3 rounded-lg"
      />
      {/* 搜索结果 */}
    </View>
  );
}
```

### Modal 和 Sheet

```typescript
// app/_layout.tsx - 配置 Modal
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="modal" 
        options={{ 
          presentation: "modal",      // 标准 modal
          // presentation: "transparentModal", // 透明 modal
          // presentation: "formSheet",        // iOS form sheet
          // presentation: "fullScreenModal",  // 全屏 modal
          headerShown: true
        }} 
      />
    </Stack>
  );
}

// app/modal.tsx - Modal 内容
import { View, Text, Button } from "react-native";
import { router } from "expo-router";

export default function ModalScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-white p-6">
      <Text className="text-xl font-bold mb-4">Modal Content</Text>
      <Button title="Close" onPress={() => router.back()} />
    </View>
  );
}
```

### 认证流程

```typescript
// app/(auth)/_layout.tsx
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";

export default function AuthLayout() {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // 如果已登录，重定向到主页面
    if (isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated]);

  return <Slot />;
}

// 使用认证守卫
// app/(app)/_layout.tsx
export default function AppLayout() {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, segments, isLoading]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <Slot />;
}
```

### 深度链接

```typescript
// app.json
{
  "expo": {
    "scheme": "myapp",
    "web": {
      "bundler": "metro"
    }
  }
}

// 使用深度链接
// myapp://user/123
// myapp://posts/456

// app/_layout.tsx
import { Linking } from "react-native";
import { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    // 处理初始 URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log("Initial URL:", url);
        // expo-router 会自动处理
      }
    });

    // 监听 URL 变化
    const subscription = Linking.addEventListener("url", ({ url }) => {
      console.log("Opened from URL:", url);
    });

    return () => subscription.remove();
  }, []);

  return <Stack>...</Stack>;
}
```

## 最佳实践

### 1. 命名规范

```
app/
├── (groups)/          # 括号 = 路由组（不影响 URL）
├── _layout.tsx        # 下划线 = 特殊文件
├── [id].tsx           # 方括号 = 动态参数
├── [[...slug]].tsx    # 双括号 = 可选捕获所有
└── +not-found.tsx     # 加号 = 特殊路由
```

### 2. 共享布局

```typescript
// app/(app)/_layout.tsx
export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="settings" 
        options={{ headerShown: true, title: "Settings" }}
      />
    </Stack>
  );
}

// app/(app)/settings/index.tsx
// 和 app/(app)/settings/profile.tsx 共享同一个布局
```

### 3. 数据预加载

```typescript
// app/posts/[postId].tsx
import { useQuery } from "@tanstack/react-query";

// 预加载函数
export async function generateStaticParams() {
  const posts = await fetchAllPosts();
  return posts.map((post) => ({ postId: post.id }));
}

export default function PostScreen() {
  const { postId } = useLocalSearchParams();
  
  const { data } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => fetchPost(postId),
    // 使用 staleTime 避免重复请求
    staleTime: 5 * 60 * 1000,
  });

  return <PostContent post={data} />;
}
```

### 4. 错误边界

```typescript
// app/_layout.tsx
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <View className="flex-1 justify-center items-center p-4">
      <Text className="text-red-500 text-lg mb-4">Something went wrong:</Text>
      <Text className="mb-4">{error.message}</Text>
      <Button title="Try again" onPress={resetErrorBoundary} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Stack>...</Stack>
    </ErrorBoundary>
  );
}
```

### 5. 主题配置

```typescript
// app/_layout.tsx
import { useColorScheme } from "react-native";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";

const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#007AFF",
    background: "#FFFFFF",
    card: "#F5F5F5",
    text: "#333333",
  },
};

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: "#0A84FF",
    background: "#000000",
    card: "#1C1C1E",
    text: "#FFFFFF",
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? CustomDarkTheme : LightTheme}>
      <Stack>...</Stack>
    </ThemeProvider>
  );
}
```

## 常用命令

```bash
# 创建项目
npx create-expo-app@latest --template tabs

# 启动开发服务器
npx expo start

# 清除缓存
npx expo start -c

# 在特定平台运行
npx expo start --ios
npx expo start --android
npx expo start --web

# 生成原生目录
npx expo prebuild

# 构建应用
eas build --platform ios
eas build --platform android

# 提交到商店
eas submit --platform ios
eas submit --platform android

# 更新 OTA
eas update --branch production --message "Fix bug"

# 运行 TypeScript 检查
npx tsc --noEmit

# Lint
npx expo lint
```

## 部署配置

### EAS 配置

```json
// eas.json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "APP_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### App 配置

```json
// app.json
{
  "expo": {
    "name": "My App",
    "slug": "my-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "myapp",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.myapp.mobile",
      "config": {
        "usesNonExemptEncryption": false
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.myapp.mobile"
    },
    "web": {
      "bundler": "metro",
      "output": "single"
    },
    "plugins": [
      "expo-router",
      "expo-font",
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow $(PRODUCT_NAME) to access your photos."
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

### 环境变量

```typescript
// app.config.ts
import { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      environment: process.env.NODE_ENV,
    },
  };
};

// 使用环境变量
import Constants from "expo-constants";

const apiUrl = Constants.expoConfig?.extra?.apiUrl;
```

```bash
# .env
EXPO_PUBLIC_API_URL=https://api.example.com
NODE_ENV=production
```

### CI/CD (GitHub Actions)

```yaml
# .github/workflows/build.yml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
          
      - run: npm ci
      
      - run: eas build --platform ios --profile production --non-interactive
      
      - run: eas build --platform android --profile production --non-interactive
```
