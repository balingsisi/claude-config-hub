# NativeWind v4 - React Native Tailwind CSS

## 技术栈

- **核心**: NativeWind 4.x
- **运行时**: React Native 0.76+
- **框架**: Expo SDK 52+ / React Native CLI
- **样式**: Tailwind CSS v3.4+
- **类型支持**: TypeScript
- **平台**: iOS, Android, Web

## 项目结构

```
src/
├── components/
│   ├── ui/
│   │   ├── Button.tsx       # 按钮组件
│   │   ├── Card.tsx         # 卡片组件
│   │   ├── Input.tsx        # 输入框组件
│   │   └── Avatar.tsx       # 头像组件
│   └── layout/
│       ├── Container.tsx    # 容器组件
│       └── Screen.tsx       # 屏幕组件
├── hooks/
│   └── useTheme.ts          # 主题钩子
├── types/
│   └── index.ts             # 类型定义
├── utils/
│   └── cn.ts                # 类名工具
├── app/                     # Expo Router 或
├── screens/                 # React Navigation
└── global.css               # 全局样式
```

## 代码模式

### 1. 配置

```typescript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f8fafc',
          500: '#64748b',
          900: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrainsMono', 'monospace'],
      },
    },
  },
  plugins: [],
}
```

```typescript
// nativewind-env.d.ts
/// <reference types="nativewind/types" />
```

```typescript
// babel.config.js
module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      'react-native-reanimated/plugin',
    ],
  }
}
```

```typescript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

const config = getDefaultConfig(__dirname)

module.exports = withNativeWind(config, { input: './global.css' })
```

```css
/* global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --color-primary: #3b82f6;
    --color-secondary: #64748b;
  }
}

@layer components {
  .btn-primary {
    @apply bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold;
  }
}
```

### 2. 基础组件

```typescript
// src/components/ui/Button.tsx
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native'
import { styled } from 'nativewind'
import { cn } from '@/utils/cn'

const StyledTouchableOpacity = styled(TouchableOpacity)
const StyledText = styled(Text)

interface ButtonProps {
  onPress: () => void
  title: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  className?: string
}

export function Button({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className,
}: ButtonProps) {
  const baseStyles = 'flex-row items-center justify-center rounded-lg font-semibold'

  const variantStyles = {
    primary: 'bg-primary-500 active:bg-primary-600',
    secondary: 'bg-secondary-500 active:bg-secondary-600',
    outline: 'border-2 border-primary-500 bg-transparent active:bg-primary-50',
    ghost: 'bg-transparent active:bg-gray-100',
  }

  const sizeStyles = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  }

  const textVariantStyles = {
    primary: 'text-white',
    secondary: 'text-white',
    outline: 'text-primary-500',
    ghost: 'text-gray-700',
  }

  const textSizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }

  return (
    <StyledTouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        disabled && 'opacity-50',
        className
      )}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? '#3b82f6' : '#fff'}
        />
      ) : (
        <StyledText
          className={cn(
            'font-semibold',
            textVariantStyles[variant],
            textSizeStyles[size]
          )}
        >
          {title}
        </StyledText>
      )}
    </StyledTouchableOpacity>
  )
}
```

```typescript
// src/components/ui/Card.tsx
import { View, Text } from 'react-native'
import { styled } from 'nativewind'
import { cn } from '@/utils/cn'

const StyledView = styled(View)
const StyledText = styled(Text)

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ children, className, padding = 'md' }: CardProps) {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }

  return (
    <StyledView
      className={cn(
        'bg-white rounded-xl shadow-sm border border-gray-200',
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </StyledView>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <StyledView className={cn('mb-3', className)}>
      {children}
    </StyledView>
  )
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <StyledText className={cn('text-xl font-bold text-gray-900', className)}>
      {children}
    </StyledText>
  )
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <StyledText className={cn('text-sm text-gray-600', className)}>
      {children}
    </StyledText>
  )
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <StyledView className={className}>{children}</StyledView>
}
```

```typescript
// src/components/ui/Input.tsx
import { TextInput, View, Text } from 'react-native'
import { styled } from 'nativewind'
import { cn } from '@/utils/cn'

const StyledTextInput = styled(TextInput)
const StyledView = styled(View)
const StyledText = styled(Text)

interface InputProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  label?: string
  error?: string
  secureTextEntry?: boolean
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad'
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  disabled?: boolean
  className?: string
}

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  disabled = false,
  className,
}: InputProps) {
  return (
    <StyledView className={cn('mb-4', className)}>
      {label && (
        <StyledText className="text-sm font-medium text-gray-700 mb-1">
          {label}
        </StyledText>
      )}
      <StyledTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={!disabled}
        className={cn(
          'px-4 py-3 rounded-lg border bg-white text-base',
          error ? 'border-red-500' : 'border-gray-300',
          disabled && 'bg-gray-100 opacity-50'
        )}
      />
      {error && (
        <StyledText className="text-sm text-red-500 mt-1">
          {error}
        </StyledText>
      )}
    </StyledView>
  )
}
```

```typescript
// src/components/ui/Avatar.tsx
import { View, Image, Text } from 'react-native'
import { styled } from 'nativewind'
import { cn } from '@/utils/cn'

const StyledView = styled(View)
const StyledText = styled(Text)

interface AvatarProps {
  source?: { uri: string }
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Avatar({ source, name, size = 'md', className }: AvatarProps) {
  const sizeStyles = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  }

  const textSizeStyles = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
    xl: 'text-xl',
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <StyledView
      className={cn(
        'rounded-full bg-gray-300 items-center justify-center overflow-hidden',
        sizeStyles[size],
        className
      )}
    >
      {source ? (
        <Image
          source={source}
          className="w-full h-full"
          resizeMode="cover"
        />
      ) : name ? (
        <StyledText className={cn('font-semibold text-white', textSizeStyles[size])}>
          {getInitials(name)}
        </StyledText>
      ) : (
        <StyledText className={cn('text-white', textSizeStyles[size])}>
          ?
        </StyledText>
      )}
    </StyledView>
  )
}
```

### 3. 工具函数

```typescript
// src/utils/cn.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

```typescript
// src/hooks/useTheme.ts
import { useColorScheme } from 'react-native'
import { useMemo } from 'react'

export function useTheme() {
  const colorScheme = useColorScheme()

  const isDark = colorScheme === 'dark'
  const isLight = colorScheme === 'light'

  const colors = useMemo(
    () => ({
      primary: '#3b82f6',
      secondary: '#64748b',
      background: isDark ? '#0f172a' : '#ffffff',
      text: isDark ? '#f8fafc' : '#0f172a',
      border: isDark ? '#334155' : '#e2e8f0',
      card: isDark ? '#1e293b' : '#ffffff',
    }),
    [isDark]
  )

  return {
    colorScheme,
    isDark,
    isLight,
    colors,
  }
}
```

### 4. 屏幕示例

```typescript
// src/screens/HomeScreen.tsx
import { View, Text, ScrollView, RefreshControl } from 'react-native'
import { styled } from 'nativewind'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'

const StyledView = styled(View)
const StyledText = styled(Text)
const StyledScrollView = styled(ScrollView)

export function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    // 模拟数据加载
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  return (
    <StyledScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <StyledView className="p-4">
        {/* Header */}
        <StyledView className="flex-row items-center justify-between mb-6">
          <StyledView>
            <StyledText className="text-2xl font-bold text-gray-900">
              Welcome Back!
            </StyledText>
            <StyledText className="text-sm text-gray-600">
              Let's get started
            </StyledText>
          </StyledView>
          <Avatar name="John Doe" size="md" />
        </StyledView>

        {/* Stats Cards */}
        <StyledView className="flex-row gap-3 mb-6">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>128</CardTitle>
              <CardDescription>Total Orders</CardDescription>
            </CardHeader>
          </Card>
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>$4.2k</CardTitle>
              <CardDescription>Revenue</CardDescription>
            </CardHeader>
          </Card>
        </StyledView>

        {/* Feature Card */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get things done faster</CardDescription>
          </CardHeader>
          <CardContent>
            <StyledView className="flex-row gap-2">
              <Button
                title="New Order"
                onPress={() => {}}
                variant="primary"
                size="sm"
                className="flex-1"
              />
              <Button
                title="View All"
                onPress={() => {}}
                variant="outline"
                size="sm"
                className="flex-1"
              />
            </StyledView>
          </CardContent>
        </Card>

        {/* List Card */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {[1, 2, 3].map(item => (
              <StyledView
                key={item}
                className="flex-row items-center py-3 border-b border-gray-100 last:border-0"
              >
                <Avatar name={`User ${item}`} size="sm" className="mr-3" />
                <StyledView className="flex-1">
                  <StyledText className="text-base font-medium text-gray-900">
                    Order #{1000 + item}
                  </StyledText>
                  <StyledText className="text-sm text-gray-600">
                    Completed 2h ago
                  </StyledText>
                </StyledView>
                <StyledText className="text-base font-semibold text-primary-500">
                  $45
                </StyledText>
              </StyledView>
            ))}
          </CardContent>
        </Card>
      </StyledView>
    </StyledScrollView>
  )
}
```

```typescript
// src/screens/AuthScreen.tsx
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { styled } from 'nativewind'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const StyledView = styled(View)
const StyledText = styled(Text)

export function AuthScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const validateForm = () => {
    const newErrors: typeof errors = {}

    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email format'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      // 登录逻辑
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('Login successful')
    } catch (error) {
      console.error('Login failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <StyledView className="flex-1 bg-white px-6 py-12 justify-center">
          {/* Header */}
          <StyledView className="mb-8">
            <StyledText className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </StyledText>
            <StyledText className="text-base text-gray-600">
              Sign in to continue
            </StyledText>
          </StyledView>

          {/* Form */}
          <StyledView className="mb-6">
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              error={errors.email}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              error={errors.password}
            />

            <Button
              title="Sign In"
              onPress={handleSubmit}
              loading={loading}
              className="mt-4"
            />
          </StyledView>

          {/* Footer */}
          <StyledView className="flex-row justify-center">
            <StyledText className="text-sm text-gray-600">
              Don't have an account?{' '}
            </StyledText>
            <StyledText className="text-sm font-semibold text-primary-500">
              Sign Up
            </StyledText>
          </StyledView>
        </StyledView>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
```

## 最佳实践

### 1. 响应式设计

```typescript
import { useWindowDimensions } from 'react-native'

function useResponsive() {
  const { width, height } = useWindowDimensions()

  const isSmall = width < 375
  const isMedium = width >= 375 && width < 768
  const isLarge = width >= 768

  return { width, height, isSmall, isMedium, isLarge }
}

// 使用
function MyComponent() {
  const { isSmall } = useResponsive()

  return (
    <View className={isSmall ? 'p-2' : 'p-4'}>
      {/* ... */}
    </View>
  )
}
```

### 2. 暗色模式

```typescript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  // ...
}

// 组件中
import { useColorScheme } from 'react-native'

function MyComponent() {
  const colorScheme = useColorScheme()

  return (
    <View className={colorScheme === 'dark' ? 'bg-gray-900' : 'bg-white'}>
      <Text className={colorScheme === 'dark' ? 'text-white' : 'text-gray-900'}>
        Hello
      </Text>
    </View>
  )
}
```

### 3. 动画支持

```typescript
import { Animated } from 'react-native'
import { styled } from 'nativewind'

const StyledAnimatedView = styled(Animated.View)

function FadeInView({ children }: { children: React.ReactNode }) {
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start()
  }, [])

  return (
    <StyledAnimatedView style={{ opacity: fadeAnim }} className="flex-1">
      {children}
    </StyledAnimatedView>
  )
}
```

### 4. 平台特定样式

```typescript
import { Platform } from 'react-native'

function MyComponent() {
  return (
    <View
      className={`
        p-4
        ${Platform.OS === 'ios' ? 'pt-8' : 'pt-4'}
        ${Platform.OS === 'android' ? 'elevation-4' : 'shadow-lg'}
      `}
    >
      {/* ... */}
    </View>
  )
}
```

### 5. 性能优化

```typescript
// 使用 memo 避免不必要渲染
import { memo } from 'react'

const MyComponent = memo(function MyComponent({ title }: { title: string }) {
  return (
    <View className="p-4">
      <Text className="text-lg">{title}</Text>
    </View>
  )
})

// 使用 useCallback 优化回调
const handlePress = useCallback(() => {
  // ...
}, [dependency])
```

## 常用命令

```bash
# 安装
npm install nativewind tailwindcss
npm install --dev babel-preset-expo

# 初始化 Tailwind
npx tailwindcss init

# 运行
npx expo start
npm run ios
npm run android

# 类型生成
npx tailwindcss --help
```

## 部署配置

### 1. Expo配置

```json
// app.json
{
  "expo": {
    "name": "My App",
    "slug": "my-app",
    "version": "1.0.0",
    "sdkVersion": "52.0.0",
    "platforms": ["ios", "android", "web"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.myapp"
    },
    "android": {
      "package": "com.myapp",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    }
  }
}
```

### 2. Web支持

```typescript
// 在 App.tsx 或 _layout.tsx 中导入全局样式
import './global.css'

export default function App() {
  return <YourApp />
}
```

## 关键特性

- 🎨 **Tailwind CSS**: 使用熟悉的 Tailwind 语法
- ⚡ **即时反馈**: 开发时样式实时更新
- 📱 **跨平台**: iOS, Android, Web 一致体验
- 🌙 **暗色模式**: 内置暗色模式支持
- 📦 **轻量级**: 最小化bundle大小
- 🔧 **TypeScript**: 完整类型支持
- 🎯 **性能优化**: 编译时优化
- 🛠️ **可定制**: 扩展 Tailwind 配置
