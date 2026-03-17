# NativeWind 模板

## 技术栈

- **核心**: NativeWind v4.x (Tailwind CSS for React Native)
- **运行时**: React Native / Expo
- **样式**: Tailwind CSS v3.x
- **平台**: iOS, Android, Web

## 项目结构

```
nativewind-app/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Input.tsx
│   │   └── layouts/
│   │       └── Container.tsx
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   ├── hooks/
│   │   └── useTheme.ts
│   ├── utils/
│   │   └── cn.ts (className utility)
│   └── types/
│       └── index.ts
├── tailwind.config.js
├── babel.config.js
├── metro.config.js
├── global.css
├── app.json (Expo) / app.tsx (RN CLI)
└── package.json
```

## 代码模式

### 基础组件样式

```typescript
// src/components/ui/Button.tsx
import { View, Text, Pressable } from 'react-native';
import { styled } from 'nativewind';

const StyledPressable = styled(Pressable);
const StyledText = styled(Text);

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({ 
  title, 
  onPress, 
  variant = 'primary',
  disabled = false 
}: ButtonProps) {
  const baseStyles = 'px-6 py-3 rounded-lg items-center justify-center';
  const variantStyles = {
    primary: 'bg-blue-500 active:bg-blue-600',
    secondary: 'bg-gray-200 active:bg-gray-300'
  };
  const textStyles = {
    primary: 'text-white font-semibold',
    secondary: 'text-gray-800 font-semibold'
  };

  return (
    <StyledPressable
      onPress={onPress}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${disabled ? 'opacity-50' : ''}`}
    >
      <StyledText className={textStyles[variant]}>
        {title}
      </StyledText>
    </StyledPressable>
  );
}
```

### 条件样式

```typescript
// src/components/ui/Card.tsx
import { View, Text } from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);

interface CardProps {
  title: string;
  description?: string;
  elevated?: boolean;
}

export function Card({ title, description, elevated = false }: CardProps) {
  return (
    <StyledView 
      className={`
        p-4 rounded-xl bg-white
        ${elevated ? 'shadow-lg' : 'shadow-sm'}
        border border-gray-200
      `}
    >
      <StyledText className="text-lg font-bold text-gray-900">
        {title}
      </StyledText>
      {description && (
        <StyledText className="text-sm text-gray-600 mt-2">
          {description}
        </StyledText>
      )}
    </StyledView>
  );
}
```

### 响应式设计（跨平台）

```typescript
// src/screens/HomeScreen.tsx
import { View, Text, useWindowDimensions } from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);

export function HomeScreen() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  return (
    <StyledView 
      className={`
        flex-1 
        ${isLargeScreen ? 'px-12' : 'px-4'}
        py-8
      `}
    >
      <StyledText 
        className={`
          font-bold 
          ${isLargeScreen ? 'text-4xl' : 'text-2xl'}
          text-gray-900
        `}
      >
        Welcome to NativeWind
      </StyledText>
      
      <StyledView className="flex-row flex-wrap mt-6">
        {[1, 2, 3, 4].map((item) => (
          <StyledView
            key={item}
            className={`
              bg-blue-100 p-4 rounded-lg mb-4
              ${isLargeScreen ? 'w-1/2 px-2' : 'w-full'}
            `}
          >
            <StyledText className="text-blue-900">
              Item {item}
            </StyledText>
          </StyledView>
        ))}
      </StyledView>
    </StyledView>
  );
}
```

### 自定义工具函数

```typescript
// src/utils/cn.ts
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]): string {
  return twMerge(inputs.filter(Boolean).join(' '));
}

// 使用示例
import { cn } from '@/utils/cn';

<View className={cn(
  'p-4 rounded-lg',
  isActive && 'bg-blue-500',
  isDisabled && 'opacity-50'
)}>
```

### 暗色模式支持

```typescript
// src/hooks/useTheme.ts
import { useColorScheme } from 'react-native';

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    isDark,
    colorScheme,
    colors: {
      background: isDark ? 'bg-gray-900' : 'bg-white',
      text: isDark ? 'text-white' : 'text-gray-900',
      card: isDark ? 'bg-gray-800' : 'bg-gray-100',
    }
  };
}

// 使用
function ThemedScreen() {
  const { colors } = useTheme();
  
  return (
    <StyledView className={`flex-1 ${colors.background}`}>
      <StyledText className={colors.text}>
        Themed Content
      </StyledText>
    </StyledView>
  );
}
```

## 最佳实践

1. **样式组织**
   - 使用 `styled()` 包装组件（NativeWind v4）
   - 基础样式和变体样式分离
   - 创建可复用的 UI 组件库

2. **性能优化**
   - 避免内联样式计算
   - 使用 `memo()` 优化频繁渲染组件
   - 静态样式优先于动态样式

3. **类型安全**
   - 为所有组件定义 TypeScript 接口
   - 使用 `cn()` 工具函数处理条件样式
   - 创建主题类型定义

4. **响应式设计**
   - 使用 `useWindowDimensions` 检测屏幕尺寸
   - 移动优先，逐步增强到平板/桌面
   - 测试不同设备和方向

5. **可维护性**
   - 使用 Tailwind 配置扩展自定义颜色/字体
   - 建立设计系统（间距、颜色、字体规范）
   - 样式命名遵循语义化

## 常用命令

### 开发

```bash
# 使用 Expo
npx create-expo-app my-app -t expo-template-blank-typescript
cd my-app
npx expo install nativewind
npx expo install tailwindcss@3.3.2

# 初始化 Tailwind
npx tailwindcss init

# 启动开发服务器
npx expo start

# iOS 模拟器
npx expo start --ios

# Android 模拟器
npx expo start --android

# Web
npx expo start --web
```

### 样式调试

```bash
# 查看 Tailwind 类名是否生效
npx tailwindcss --content './src/**/*.{ts,tsx}' --output ./dist/styles.css

# 清除缓存
npx expo start --clear
```

### 构建

```bash
# EAS Build (Expo)
eas build --platform ios
eas build --platform android

# 预览构建
eas build --profile preview --platform ios
```

## 部署配置

### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

### babel.config.js

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // NativeWind v4 需要的插件
      'nativewind/babel',
    ],
  };
};
```

### metro.config.js

```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;
```

### global.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### app.json (Expo)

```json
{
  "expo": {
    "name": "NativeWind App",
    "slug": "nativewind-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.example.nativewind"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.example.nativewind"
    },
    "web": {
      "favicon": "./assets/favicon.png",
      "bundler": "metro"
    },
    "plugins": [
      "expo-font"
    ]
  }
}
```

### package.json 脚本

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build:ios": "eas build --platform ios",
    "build:android": "eas build --platform android",
    "lint": "eslint . --ext .ts,.tsx",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "expo": "~50.0.0",
    "expo-status-bar": "~1.11.1",
    "nativewind": "^4.0.0",
    "react": "18.2.0",
    "react-native": "0.73.2",
    "tailwindcss": "3.3.2"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@types/react": "~18.2.45",
    "typescript": "^5.1.3"
  }
}
```

## 注意事项

1. **NativeWind v4 变化**
   - 必须使用 `styled()` 包装组件
   - 不再支持直接在组件上使用 `className`
   - 需要配置 Babel 插件

2. **Tailwind 版本**
   - 推荐使用 Tailwind CSS v3.x
   - v4 支持仍在开发中

3. **性能考虑**
   - 动态样式会创建新组件，避免在渲染中使用
   - 使用静态类名字符串性能最佳

4. **跨平台差异**
   - 某些 CSS 特性在 React Native 不支持（如 `display: grid`）
   - 使用 Flexbox 布局
   - 测试所有目标平台

5. **调试**
   - 使用 React Native Debugger
   - 检查样式是否正确应用
   - 确认 Tailwind 配置的 content 路径正确

## 相关资源

- [NativeWind 文档](https://www.nativewind.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [React Native 样式文档](https://reactnative.dev/docs/style)
- [Expo 文档](https://docs.expo.dev/)
