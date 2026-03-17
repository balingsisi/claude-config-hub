# Tamagui 模板

## 技术栈

### 核心技术
- **Tamagui**: React Native Universal 样式系统
- **React Native**: 跨平台移动开发
- **Expo**: React Native 开发工具链
- **TypeScript**: 类型安全

### 样式特性
- **@tamagui/core**: 核心样式引擎
- **@tamagui/font-inter**: Inter 字体
- **@tamagui/theme-base**: 基础主题
- **@tamagui/toast**: Toast 通知
- **@tamagui/lucide-icons**: Lucide 图标

### 开发工具
- **Expo Router**: 文件系统路由
- **React Native Reanimated**: 动画库
- **React Native Gesture Handler**: 手势处理

## 项目结构

```
tamagui-app/
├── app/
│   ├── _layout.tsx              # 根布局
│   ├── index.tsx                # 首页
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── home.tsx
│   │   ├── explore.tsx
│   │   ├── notifications.tsx
│   │   └── profile.tsx
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── modal/
│   │   └── settings.tsx
│   └── user/
│       └── [id].tsx
├── components/
│   ├── ui/                      # UI 组件
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── Switch.tsx
│   │   ├── Sheet.tsx
│   │   └── Toast.tsx
│   ├── layout/
│   │   ├── Container.tsx
│   │   ├── Header.tsx
│   │   └── SafeArea.tsx
│   └── features/
│       ├── UserCard.tsx
│       ├── PostItem.tsx
│       └── SearchBar.tsx
├── tamagui/
│   ├── config.ts                # Tamagui 配置
│   ├── theme.ts                 # 主题配置
│   ├── tokens.ts                # 设计令牌
│   └── fonts.ts                 # 字体配置
├── hooks/
│   ├── useAuth.ts
│   ├── useToast.ts
│   └── useTheme.ts
├── lib/
│   ├── api.ts                   # API 客户端
│   └── utils.ts
├── types/
│   └── index.ts
├── assets/
│   ├── images/
│   └── fonts/
├── app.json
├── tamagui.config.ts
├── tsconfig.json
└── package.json
```

## 核心代码模式

### 1. Tamagui 配置

```typescript
// tamagui/config.ts
import { createTamagui, createTokens } from 'tamagui'
import { shorthands } from '@tamagui/shorthands'
import { createInterFont } from '@tamagui/font-inter'
import { createAnimations } from '@tamagui/animations-css'

const headingFont = createInterFont({
  size: {
    1: 12,
    2: 14,
    3: 16,
    4: 20,
    5: 24,
    6: 32,
    7: 40,
    8: 48,
    9: 64,
  },
  weight: {
    4: '400',
    5: '500',
    6: '600',
    7: '700',
  },
})

const bodyFont = createInterFont({
  size: {
    1: 11,
    2: 12,
    3: 13,
    4: 14,
    5: 16,
    6: 18,
    7: 20,
    8: 24,
    9: 28,
  },
  weight: {
    4: '400',
    5: '500',
    6: '600',
  },
})

const tokens = createTokens({
  size: {
    0: 0,
    0.25: 2,
    0.5: 4,
    0.75: 8,
    1: 16,
    1.5: 24,
    2: 32,
    2.5: 40,
    3: 48,
    3.5: 56,
    4: 64,
    true: 16,
  },
  space: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    '-0.5': -2,
    '-1': -4,
    '-2': -8,
    '-3': -12,
    '-4': -16,
  },
  radius: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    round: 1000,
  },
  zIndex: {
    0: 0,
    1: 100,
    2: 200,
    3: 300,
    4: 400,
    5: 500,
  },
  color: {
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
    background: '#FFFFFF',
    text: '#000000',
    primary: '#4F46E5',
    secondary: '#6366F1',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
})

const animations = createAnimations({
  fast: {
    type: 'timing',
    duration: 200,
  },
  medium: {
    type: 'timing',
    duration: 300,
  },
  slow: {
    type: 'timing',
    duration: 500,
  },
  bouncy: {
    type: 'spring',
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
})

const themes = {
  light: {
    background: '#FFFFFF',
    text: '#000000',
    primary: '#4F46E5',
    secondary: '#6366F1',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    border: '#E5E7EB',
    card: '#F9FAFB',
  },
  dark: {
    background: '#0F172A',
    text: '#F8FAFC',
    primary: '#818CF8',
    secondary: '#A5B4FC',
    success: '#34D399',
    warning: '#FCD34D',
    error: '#F87171',
    border: '#334155',
    card: '#1E293B',
  },
}

const config = createTamagui({
  defaultFont: 'body',
  shorthands,
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  themes,
  tokens,
  animations,
})

export type AppConfig = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config
```

### 2. 根布局

```tsx
// app/_layout.tsx
import { TamaguiProvider, Theme } from 'tamagui'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { useColorScheme } from 'react-native'
import config from '../tamagui/config'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const [loaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  })

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  if (!loaded) {
    return null
  }

  return (
    <TamaguiProvider config={config}>
      <Theme name={colorScheme === 'dark' ? 'dark' : 'light'}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
        </ThemeProvider>
      </Theme>
    </TamaguiProvider>
  )
}
```

### 3. 自定义 Button 组件

```tsx
// components/ui/Button.tsx
import { styled, GetProps, View } from 'tamagui'
import { forwardRef } from 'react'
import { ActivityIndicator } from 'react-native'

const ButtonFrame = styled(View, {
  name: 'Button',
  backgroundColor: '$primary',
  paddingVertical: 12,
  paddingHorizontal: 24,
  borderRadius: 8,
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
  pressStyle: {
    opacity: 0.8,
    scale: 0.98,
  },
  variants: {
    variant: {
      solid: {
        backgroundColor: '$primary',
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '$primary',
      },
      ghost: {
        backgroundColor: 'transparent',
      },
      destructive: {
        backgroundColor: '$error',
      },
    },
    size: {
      sm: {
        paddingVertical: 8,
        paddingHorizontal: 16,
      },
      md: {
        paddingVertical: 12,
        paddingHorizontal: 24,
      },
      lg: {
        paddingVertical: 16,
        paddingHorizontal: 32,
      },
    },
    disabled: {
      true: {
        opacity: 0.5,
        pointerEvents: 'none',
      },
    },
    fullWidth: {
      true: {
        width: '100%',
      },
    },
  } as const,
  defaultVariants: {
    variant: 'solid',
    size: 'md',
  },
})

const ButtonText = styled(View, {
  color: 'white',
  fontSize: 16,
  fontWeight: '600',
  variants: {
    variant: {
      solid: {
        color: 'white',
      },
      outline: {
        color: '$primary',
      },
      ghost: {
        color: '$primary',
      },
      destructive: {
        color: 'white',
      },
    },
    size: {
      sm: {
        fontSize: 14,
      },
      md: {
        fontSize: 16,
      },
      lg: {
        fontSize: 18,
      },
    },
  } as const,
})

interface ButtonProps extends GetProps<typeof ButtonFrame> {
  title: string
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = forwardRef<View, ButtonProps>(
  ({ title, loading, leftIcon, rightIcon, variant, size, ...props }, ref) => {
    return (
      <ButtonFrame ref={ref} variant={variant} size={size} {...props}>
        {loading ? (
          <ActivityIndicator color={variant === 'outline' ? '#4F46E5' : 'white'} />
        ) : (
          <>
            {leftIcon && <View marginRight={8}>{leftIcon}</View>}
            <ButtonText variant={variant} size={size}>
              {title}
            </ButtonText>
            {rightIcon && <View marginLeft={8}>{rightIcon}</View>}
          </>
        )}
      </ButtonFrame>
    )
  }
)
```

### 4. 自定义 Input 组件

```tsx
// components/ui/Input.tsx
import { styled, GetProps, View, Text } from 'tamagui'
import { forwardRef } from 'react'
import { TextInput as RNTextInput } from 'react-native'

const InputWrapper = styled(View, {
  name: 'InputWrapper',
  width: '100%',
  marginBottom: 16,
})

const InputLabel = styled(Text, {
  fontSize: 14,
  fontWeight: '500',
  marginBottom: 8,
  color: '$text',
})

const InputField = styled(RNTextInput, {
  name: 'Input',
  backgroundColor: '$card',
  borderWidth: 1,
  borderColor: '$border',
  borderRadius: 8,
  paddingHorizontal: 16,
  paddingVertical: 12,
  fontSize: 16,
  color: '$text',
  variants: {
    error: {
      true: {
        borderColor: '$error',
      },
    },
    disabled: {
      true: {
        opacity: 0.5,
      },
    },
  } as const,
})

const ErrorMessage = styled(Text, {
  fontSize: 12,
  color: '$error',
  marginTop: 4,
})

interface InputProps extends GetProps<typeof InputField> {
  label?: string
  error?: string
}

export const Input = forwardRef<RNTextInput, InputProps>(
  ({ label, error, ...props }, ref) => {
    return (
      <InputWrapper>
        {label && <InputLabel>{label}</InputLabel>}
        <InputField
          ref={ref}
          error={!!error}
          placeholderTextColor="#9CA3AF"
          {...props}
        />
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </InputWrapper>
    )
  }
)
```

### 5. Card 组件

```tsx
// components/ui/Card.tsx
import { styled, GetProps, View, Text } from 'tamagui'

const CardFrame = styled(View, {
  name: 'Card',
  backgroundColor: '$card',
  borderRadius: 12,
  padding: 16,
  borderWidth: 1,
  borderColor: '$border',
  variants: {
    elevated: {
      true: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      },
    },
    interactive: {
      true: {
        pressStyle: {
          scale: 0.98,
          opacity: 0.9,
        },
      },
    },
  } as const,
})

const CardHeader = styled(View, {
  marginBottom: 12,
})

const CardTitle = styled(Text, {
  fontSize: 18,
  fontWeight: '700',
  color: '$text',
})

const CardDescription = styled(Text, {
  fontSize: 14,
  color: '$text',
  opacity: 0.7,
  marginTop: 4,
})

const CardContent = styled(View, {
  marginVertical: 12,
})

const CardFooter = styled(View, {
  marginTop: 12,
  flexDirection: 'row',
  justifyContent: 'flex-end',
})

interface CardProps extends GetProps<typeof CardFrame> {
  title?: string
  description?: string
}

export const Card = ({ title, description, children, ...props }: CardProps) => {
  return (
    <CardFrame {...props}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </CardFrame>
  )
}

export { CardFrame, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
```

### 6. Toast 通知

```tsx
// components/ui/Toast.tsx
import { useToastController, useToastState } from '@tamagui/toast'
import { YStack, Text, View } from 'tamagui'

export const Toast = () => {
  const currentToast = useToastState()

  if (!currentToast) return null

  return (
    <View
      position="absolute"
      bottom={50}
      left={0}
      right={0}
      alignItems="center"
      zIndex={1000}
    >
      <View
        backgroundColor={currentToast.type === 'error' ? '$error' : '$success'}
        paddingHorizontal={20}
        paddingVertical={12}
        borderRadius={8}
        shadowColor="#000"
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={0.25}
        shadowRadius={8}
        elevation={5}
      >
        <Text color="white" fontSize={14} fontWeight="600">
          {currentToast.title}
        </Text>
        {currentToast.message && (
          <Text color="white" fontSize={12} marginTop={4}>
            {currentToast.message}
          </Text>
        )}
      </View>
    </View>
  )
}

// 使用示例
export const useToastNotification = () => {
  const toast = useToastController()

  const showSuccess = (title: string, message?: string) => {
    toast.show(title, {
      message,
      type: 'success',
      duration: 3000,
    })
  }

  const showError = (title: string, message?: string) => {
    toast.show(title, {
      message,
      type: 'error',
      duration: 4000,
    })
  }

  return { showSuccess, showError }
}
```

### 7. 主题切换

```tsx
// hooks/useTheme.ts
import { useTheme as useTamaguiTheme } from 'tamagui'
import { useColorScheme } from 'react-native'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface ThemeState {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)

export function useTheme() {
  const { theme, setTheme } = useThemeStore()
  const systemColorScheme = useColorScheme()
  const tamaguiTheme = useTamaguiTheme()

  const resolvedTheme = theme === 'system' ? systemColorScheme : theme
  const isDark = resolvedTheme === 'dark'

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  return {
    theme,
    resolvedTheme,
    isDark,
    setTheme,
    toggleTheme,
    colors: tamaguiTheme,
  }
}
```

### 8. 页面示例

```tsx
// app/(tabs)/home.tsx
import { View, Text, ScrollView, YStack, XStack } from 'tamagui'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { User } from '@tamagui/lucide-icons'

export default function HomeScreen() {
  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding={16} space={16}>
        <Text fontSize={24} fontWeight="700" color="$text">
          欢迎回来
        </Text>

        <XStack space={12}>
          <Card flex={1} elevated>
            <Text fontSize={14} color="$text" opacity={0.7}>
              今日订单
            </Text>
            <Text fontSize={32} fontWeight="700" color="$text" marginTop={8}>
              128
            </Text>
          </Card>

          <Card flex={1} elevated>
            <Text fontSize={14} color="$text" opacity={0.7}>
              总收入
            </Text>
            <Text fontSize={32} fontWeight="700" color="$success" marginTop={8}>
              ¥8,420
            </Text>
          </Card>
        </XStack>

        <Card title="用户列表" description="最近的活跃用户">
          {users.map((user) => (
            <XStack
              key={user.id}
              padding={12}
              backgroundColor="$background"
              borderRadius={8}
              marginBottom={8}
              alignItems="center"
              space={12}
            >
              <User size={24} color="$primary" />
              <YStack flex={1}>
                <Text fontSize={16} fontWeight="600" color="$text">
                  {user.name}
                </Text>
                <Text fontSize={12} color="$text" opacity={0.7}>
                  {user.email}
                </Text>
              </YStack>
            </XStack>
          ))}
        </Card>

        <Button
          title="加载更多"
          variant="outline"
          fullWidth
          onPress={() => console.log('Load more')}
        />
      </YStack>
    </ScrollView>
  )
}

const users = [
  { id: '1', name: '张三', email: 'zhangsan@example.com' },
  { id: '2', name: '李四', email: 'lisi@example.com' },
  { id: '3', name: '王五', email: 'wangwu@example.com' },
]
```

### 9. 登录表单

```tsx
// app/(auth)/login.tsx
import { View, YStack, Text } from 'tamagui'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { useAuth } from '@/hooks/useAuth'

export default function LoginScreen() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleLogin = async () => {
    const newErrors: Record<string, string> = {}

    if (!email) newErrors.email = '请输入邮箱'
    if (!password) newErrors.password = '请输入密码'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      await login(email, password)
      router.replace('/(tabs)')
    } catch (error) {
      setErrors({ general: '登录失败，请检查邮箱和密码' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View flex={1} backgroundColor="$background" padding={24} justifyContent="center">
      <YStack space={24}>
        <Text fontSize={32} fontWeight="700" textAlign="center" color="$text">
          欢迎回来
        </Text>

        <Input
          label="邮箱"
          placeholder="请输入邮箱"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label="密码"
          placeholder="请输入密码"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          secureTextEntry
        />

        {errors.general && (
          <Text color="$error" fontSize={14} textAlign="center">
            {errors.general}
          </Text>
        )}

        <Button
          title="登录"
          onPress={handleLogin}
          loading={loading}
          fullWidth
        />

        <Button
          title="没有账号？立即注册"
          variant="ghost"
          onPress={() => router.push('/(auth)/register')}
        />
      </YStack>
    </View>
  )
}
```

## 最佳实践

### 1. 样式设计

```tsx
// ✅ 使用 tokens 和 theme
<View backgroundColor="$background" padding="$4">
  <Text color="$text" fontSize="$5">Hello</Text>
</View>

// ❌ 避免硬编码值
<View backgroundColor="#FFFFFF" padding={16}>
  <Text color="#000000" fontSize={16}>Hello</Text>
</View>
```

### 2. 响应式设计

```tsx
import { useMedia } from 'tamagui'

function MyComponent() {
  const media = useMedia()
  
  return (
    <View
      flexDirection={media.gtMd ? 'row' : 'column'}
      padding={media.gtMd ? '$4' : '$2'}
    >
      {/* 内容 */}
    </View>
  )
}
```

### 3. 性能优化

```tsx
// ✅ 使用 memo 避免不必要的重渲染
import { memo } from 'react'

const MyComponent = memo(({ title }) => {
  return <Text>{title}</Text>
})

// ✅ 使用动画配置
const animations = createAnimations({
  fast: {
    type: 'timing',
    duration: 200,
  },
})
```

### 4. 类型安全

```tsx
// ✅ 使用 TypeScript 和 Tamagui 类型
import { GetProps, styled } from 'tamagui'

const MyView = styled(View, {
  backgroundColor: '$primary',
})

type MyViewProps = GetProps<typeof MyView>

const Component = (props: MyViewProps) => {
  return <MyView {...props} />
}
```

## 常用命令

### 安装

```bash
# 创建 Expo 项目
npx create-expo-app@latest my-app -t with-tamagui

# 安装 Tamagui
npx @tamagui/create@latest

# 添加依赖
pnpm add tamagui @tamagui/font-inter @tamagui/theme-base
pnpm add @tamagui/lucide-icons @tamagui/toast
```

### 开发

```bash
# 启动开发服务器
pnpm start

# iOS
pnpm ios

# Android
pnpm android

# Web
pnpm web
```

### 构建

```bash
# Expo 构建
npx expo build:ios
npx expo build:android

# EAS 构建
eas build --platform ios
eas build --platform android
```

## 部署配置

### 1. app.json

```json
{
  "expo": {
    "name": "My App",
    "slug": "my-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#4F46E5"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.example.myapp"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#4F46E5"
      },
      "package": "com.example.myapp"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router"
    ]
  }
}
```

### 2. tsconfig.json

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### 3. EAS 配置

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
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 4. Metro 配置

```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json']

module.exports = config
```

### 5. 环境变量

```typescript
// app.config.ts
import 'dotenv/config'

export default {
  expo: {
    extra: {
      apiUrl: process.env.API_URL,
    },
  },
}
```

## 相关资源

- [Tamagui 官方文档](https://tamagui.dev/)
- [Tamagui GitHub](https://github.com/tamagui/tamagui)
- [Expo 文档](https://docs.expo.dev/)
- [React Native 文档](https://reactnative.dev/)
- [Expo Router 文档](https://expo.github.io/router/)
