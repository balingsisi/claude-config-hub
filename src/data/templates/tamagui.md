# Tamagui Template

## 技术栈

- **核心**: tamagui ^1.x
- **React Native**: react-native ^0.73+
- **Web**: Next.js / Vite
- **主题**: @tamagui/theme
- **动画**: @tamagui/animations-css / @tamagui/animations-reanimated
- **字体**: @tamagui/font-inter

## 项目结构

```
tamagui-project/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Sheet.tsx
│   │   │   └── Toast.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── Container.tsx
│   ├── themes/
│   │   ├── tokens.ts        # 设计令牌
│   │   ├── theme.ts         # 主题配置
│   │   └── config.ts        # Tamagui 配置
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── hooks/
│   │   ├── useMedia.ts
│   │   ├── useTheme.ts
│   │   └── useToast.ts
│   ├── utils/
│   │   └── variants.ts
│   └── App.tsx
├── tamagui.config.ts
├── package.json
└── tsconfig.json
```

## 代码模式

### Tamagui 配置

```typescript
// tamagui.config.ts
import { createTamagui } from 'tamagui';
import { config as tamaguiConfig } from '@tamagui/config/v3';
import { shorthands } from '@tamagui/shorthands';
import { createInterFont } from '@tamagui/font-inter';

const interFont = createInterFont();

export const config = createTamagui({
  ...tamaguiConfig,
  shorthands,
  fonts: {
    heading: interFont,
    body: interFont,
  },
  themes: {
    light: {
      background: '#fff',
      color: '#1e293b',
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#8b5cf6',
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
    },
    dark: {
      background: '#0f172a',
      color: '#e2e8f0',
      primary: '#60a5fa',
      secondary: '#94a3b8',
      accent: '#a78bfa',
      success: '#34d399',
      error: '#f87171',
      warning: '#fbbf24',
    },
  },
  tokens: {
    size: {
      xs: 8,
      sm: 12,
      md: 16,
      lg: 20,
      xl: 24,
      '2xl': 28,
      '3xl': 32,
      '4xl': 40,
    },
    space: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      '2xl': 48,
      '3xl': 64,
    },
    radius: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
      full: 9999,
    },
  },
});

export type AppConfig = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;

// themes/config.ts
import { createTokens } from 'tamagui';

export const tokens = createTokens({
  size: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    '2xl': 28,
    '3xl': 32,
  },
  color: {
    primary50: '#eff6ff',
    primary100: '#dbeafe',
    primary500: '#3b82f6',
    primary600: '#2563eb',
    primary700: '#1d4ed8',
  },
});
```

### 基础组件

```typescript
// components/ui/Button.tsx
import { styled, GetProps, Button as TamaguiButton } from 'tamagui';

const ButtonFrame = styled(TamaguiButton, {
  name: 'Button',
  backgroundColor: '$primary',
  color: '#fff',
  fontWeight: '600',
  paddingHorizontal: '$md',
  paddingVertical: '$sm',
  borderRadius: '$md',
  borderWidth: 0,
  pressStyle: {
    backgroundColor: '$primary600',
    scale: 0.98,
  },
  hoverStyle: {
    backgroundColor: '$primary600',
  },

  variants: {
    variant: {
      primary: {
        backgroundColor: '$primary',
        color: '#fff',
      },
      secondary: {
        backgroundColor: '$secondary',
        color: '#fff',
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '$primary',
        color: '$primary',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '$primary',
      },
      destructive: {
        backgroundColor: '$error',
        color: '#fff',
      },
    },
    size: {
      sm: {
        paddingHorizontal: '$sm',
        paddingVertical: '$xs',
        fontSize: '$sm',
      },
      md: {
        paddingHorizontal: '$md',
        paddingVertical: '$sm',
        fontSize: '$md',
      },
      lg: {
        paddingHorizontal: '$lg',
        paddingVertical: '$md',
        fontSize: '$lg',
      },
    },
    fullWidth: {
      true: {
        width: '100%',
      },
    },
    disabled: {
      true: {
        opacity: 0.5,
        pointerEvents: 'none',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

export type ButtonProps = GetProps<typeof ButtonFrame>;

export function Button({ children, ...props }: ButtonProps) {
  return <ButtonFrame {...props}>{children}</ButtonFrame>;
}

// 使用示例
function Example() {
  return (
    <YStack space="$md">
      <Button variant="primary" size="lg">
        主要按钮
      </Button>
      <Button variant="outline">轮廓按钮</Button>
      <Button variant="ghost" disabled>
        幽灵按钮
      </Button>
    </YStack>
  );
}
```

### 输入框

```typescript
// components/ui/Input.tsx
import { styled, GetProps, Input as TamaguiInput, XStack, Label, Text } from 'tamagui';

const InputFrame = styled(TamaguiInput, {
  name: 'Input',
  backgroundColor: '$background',
  borderColor: '$border',
  borderWidth: 1,
  borderRadius: '$md',
  paddingHorizontal: '$md',
  paddingVertical: '$sm',
  fontSize: '$md',
  color: '$color',
  placeholderTextColor: '$placeholder',

  focusStyle: {
    borderColor: '$primary',
    borderWidth: 2,
  },

  variants: {
    size: {
      sm: {
        paddingHorizontal: '$sm',
        paddingVertical: '$xs',
        fontSize: '$sm',
      },
      md: {
        paddingHorizontal: '$md',
        paddingVertical: '$sm',
        fontSize: '$md',
      },
      lg: {
        paddingHorizontal: '$lg',
        paddingVertical: '$md',
        fontSize: '$lg',
      },
    },
    error: {
      true: {
        borderColor: '$error',
        focusStyle: {
          borderColor: '$error',
        },
      },
    },
    disabled: {
      true: {
        opacity: 0.5,
        pointerEvents: 'none',
      },
    },
  } as const,

  defaultVariants: {
    size: 'md',
  },
});

export type InputProps = GetProps<typeof InputFrame> & {
  label?: string;
  errorText?: string;
  helperText?: string;
};

export function Input({
  label,
  errorText,
  helperText,
  error,
  ...props
}: InputProps) {
  return (
    <YStack space="$xs">
      {label && (
        <Label fontSize="$sm" color="$secondary">
          {label}
        </Label>
      )}
      <InputFrame error={error} {...props} />
      {errorText && (
        <Text fontSize="$sm" color="$error">
          {errorText}
        </Text>
      )}
      {helperText && !errorText && (
        <Text fontSize="$sm" color="$secondary">
          {helperText}
        </Text>
      )}
    </YStack>
  );
}
```

### 卡片

```typescript
// components/ui/Card.tsx
import { styled, GetProps, YStack, XStack, Text } from 'tamagui';

const CardFrame = styled(YStack, {
  name: 'Card',
  backgroundColor: '$background',
  borderRadius: '$lg',
  borderWidth: 1,
  borderColor: '$border',
  padding: '$md',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 3,

  variants: {
    variant: {
      elevated: {
        shadowOpacity: 0.15,
        elevation: 6,
      },
      outlined: {
        shadowOpacity: 0,
        elevation: 0,
        borderWidth: 1,
      },
      filled: {
        backgroundColor: '$backgroundHover',
        shadowOpacity: 0,
        elevation: 0,
      },
    },
    interactive: {
      true: {
        hoverStyle: {
          backgroundColor: '$backgroundHover',
        },
        pressStyle: {
          scale: 0.98,
        },
      },
    },
  } as const,

  defaultVariants: {
    variant: 'elevated',
  },
});

export type CardProps = GetProps<typeof CardFrame>;

export function Card({ children, ...props }: CardProps) {
  return <CardFrame {...props}>{children}</CardFrame>;
}

// 带标题的卡片
export function CardWithHeader({
  title,
  subtitle,
  action,
  children,
  ...props
}: CardProps & {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card {...props}>
      <XStack justifyContent="space-between" alignItems="center" marginBottom="$md">
        <YStack>
          <Text fontSize="$lg" fontWeight="700">
            {title}
          </Text>
          {subtitle && (
            <Text fontSize="$sm" color="$secondary">
              {subtitle}
            </Text>
          )}
        </YStack>
        {action}
      </XStack>
      {children}
    </Card>
  );
}
```

### 底部抽屉

```typescript
// components/ui/Sheet.tsx
import { Sheet as TamaguiSheet, YStack, XStack, Text, Button } from 'tamagui';
import { useState } from 'react';

export function Sheet({
  open,
  onOpenChange,
  title,
  children,
  snapPoints = [80],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: number[];
}) {
  return (
    <TamaguiSheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={snapPoints}
      dismissOnSnapToBottom
      position={0}
    >
      <TamaguiSheet.Overlay
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      />
      <TamaguiSheet.Frame
        padding="$md"
        borderTopLeftRadius="$lg"
        borderTopRightRadius="$lg"
        backgroundColor="$background"
      >
        <TamaguiSheet.Handle />
        {title && (
          <XStack justifyContent="space-between" alignItems="center" marginBottom="$md">
            <Text fontSize="$lg" fontWeight="700">
              {title}
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => onOpenChange(false)}
            >
              关闭
            </Button>
          </XStack>
        )}
        {children}
      </TamaguiSheet.Frame>
    </TamaguiSheet>
  );
}

// 使用示例
function SheetExample() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onPress={() => setOpen(true)}>打开抽屉</Button>
      <Sheet open={open} onOpenChange={setOpen} title="选择选项">
        <YStack space="$sm">
          <Button variant="outline" fullWidth>
            选项 1
          </Button>
          <Button variant="outline" fullWidth>
            选项 2
          </Button>
        </YStack>
      </Sheet>
    </>
  );
}
```

### Toast 通知

```typescript
// components/ui/Toast.tsx
import { Toast as TamaguiToast, useToastState, YStack, Text } from 'tamagui';

export function ToastViewport() {
  const currentToast = useToastState();

  if (!currentToast || currentToast.isHandledNatively) return null;

  return (
    <TamaguiToast
      key={currentToast.id}
      duration={currentToast.duration}
      viewportName={currentToast.viewportName}
      enterStyle={{ opacity: 0, scale: 0.9, y: -10 }}
      exitStyle={{ opacity: 0, scale: 0.9, y: -10 }}
      y={0}
      opacity={1}
      scale={1}
      animation="quick"
      backgroundColor="$background"
      borderRadius="$md"
      padding="$md"
      shadowColor="#000"
      shadowOpacity={0.1}
      shadowRadius={10}
      elevation={5}
    >
      <YStack>
        <Text fontWeight="700">{currentToast.title}</Text>
        {currentToast.message && (
          <Text fontSize="$sm" color="$secondary">
            {currentToast.message}
          </Text>
        )}
      </YStack>
    </TamaguiToast>
  );
}

// hooks/useToast.ts
import { useToastController } from 'tamagui';

export function useAppToast() {
  const toast = useToastController();

  const show = (
    title: string,
    message?: string,
    type: 'success' | 'error' | 'info' = 'info'
  ) => {
    toast.show(title, {
      message,
      duration: 3000,
      type,
    });
  };

  return { show };
}

// 使用
function Example() {
  const toast = useAppToast();
  
  return (
    <Button onPress={() => toast.show('保存成功', '数据已保存', 'success')}>
      显示 Toast
    </Button>
  );
}
```

### 主题切换

```typescript
// hooks/useTheme.ts
import { useTheme as useTamaguiTheme } from 'tamagui';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useTheme() {
  const theme = useTamaguiTheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    const savedTheme = await AsyncStorage.getItem('theme');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  return {
    isDark,
    theme: isDark ? 'dark' : 'light',
    toggleTheme,
    colors: theme,
  };
}

// App.tsx
import { TamaguiProvider, Theme } from 'tamagui';
import config from './tamagui.config';

export function App() {
  const { isDark } = useTheme();

  return (
    <TamaguiProvider config={config} defaultTheme={isDark ? 'dark' : 'light'}>
      <Theme name={isDark ? 'dark' : 'light'}>
        <YourApp />
      </Theme>
    </TamaguiProvider>
  );
}
```

### 响应式设计

```typescript
// hooks/useMedia.ts
import { useMedia as useTamaguiMedia } from 'tamagui';

export function useMedia() {
  const media = useTamaguiMedia();

  return {
    isXs: media.xs,
    isSm: media.sm,
    isMd: media.md,
    isLg: media.lg,
    isXl: media.xl,
    isMobile: !media.md,
    isTablet: media.md && !media.lg,
    isDesktop: media.lg,
  };
}

// 响应式组件
function ResponsiveCard() {
  const { isMobile, isDesktop } = useMedia();

  return (
    <XStack
      flexDirection={isMobile ? 'column' : 'row'}
      space="$md"
    >
      <Card flex={isDesktop ? 1 : undefined}>
        {/* ... */}
      </Card>
      <Card flex={isDesktop ? 1 : undefined}>
        {/* ... */}
      </Card>
    </XStack>
  );
}
```

## 最佳实践

### 1. 设计令牌

```typescript
// themes/tokens.ts
import { createTokens } from 'tamagui';

export const tokens = createTokens({
  size: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  space: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
    auto: 'auto',
  },
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
    full: 9999,
  },
  zIndex: {
    0: 0,
    1: 100,
    2: 200,
    3: 300,
    4: 400,
    5: 500,
    modal: 1000,
    toast: 2000,
  },
  color: {
    white: '#ffffff',
    black: '#000000',
    transparent: 'transparent',
  },
});
```

### 2. 组件变体

```typescript
// utils/variants.ts
export const buttonVariants = {
  primary: {
    backgroundColor: '$primary',
    color: '#fff',
  },
  secondary: {
    backgroundColor: '$secondary',
    color: '#fff',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '$primary',
    color: '$primary',
  },
} as const;

export const sizeVariants = {
  sm: {
    paddingHorizontal: '$sm',
    paddingVertical: '$xs',
    fontSize: '$sm',
  },
  md: {
    paddingHorizontal: '$md',
    paddingVertical: '$sm',
    fontSize: '$md',
  },
  lg: {
    paddingHorizontal: '$lg',
    paddingVertical: '$md',
    fontSize: '$lg',
  },
} as const;
```

### 3. 动画配置

```typescript
// themes/animations.ts
import { createAnimations } from '@tamagui/animations-css';

export const animations = createAnimations({
  quick: {
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
  lazy: {
    type: 'spring',
    damping: 20,
    stiffness: 60,
  },
});

// 使用
const AnimatedView = styled(YStack, {
  animation: 'quick',
  
  hoverStyle: {
    scale: 1.05,
  },
  
  pressStyle: {
    scale: 0.95,
  },
});
```

### 4. 表单处理

```typescript
// components/Form.tsx
import { Form as TamaguiForm, YStack } from 'tamagui';

export function Form({ children, onSubmit }: FormProps) {
  return (
    <TamaguiForm onSubmit={onSubmit}>
      <YStack space="$md">
        {children}
      </YStack>
    </TamaguiForm>
  );
}

// 使用
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    console.log({ email, password });
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Input
        label="邮箱"
        value={email}
        onChangeText={setEmail}
        placeholder="请输入邮箱"
      />
      <Input
        label="密码"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="请输入密码"
      />
      <Button type="submit" fullWidth>
        登录
      </Button>
    </Form>
  );
}
```

## 常用命令

```bash
# 安装核心包
npm install tamagui @tamagui/config
npm install @tamagui/animations-css

# React Native 集成
npm install react-native
npm install @tamagui/font-inter

# Next.js 集成
npm install @tamagui/next-theme

# 开发
npm run dev

# Web 构建
npm run build:web

# Native 构建
npx react-native run-ios
npx react-native run-android

# 清理缓存
npx react-native start --reset-cache
```

## 部署配置

### Next.js 配置

```typescript
// next.config.js
const { withTamagui } = require('@tamagui/next-plugin');

module.exports = withTamagui({
  tamaguiConfig: './tamagui.config.ts',
  components: ['tamagui'],
  importsWhitelist: ['constants.js', 'colors.js'],
  logTimings: true,
  disableExtraction: process.env.NODE_ENV === 'development',
});

// pages/_app.tsx
import { TamaguiProvider } from 'tamagui';
import config from '../tamagui.config';

export default function App({ Component, pageProps }) {
  return (
    <TamaguiProvider config={config}>
      <Component {...pageProps} />
    </TamaguiProvider>
  );
}
```

### Expo 配置

```json
// app.json
{
  "expo": {
    "name": "TamaguiApp",
    "slug": "tamagui-app",
    "version": "1.0.0",
    "plugins": [
      "@tamagui/babel-plugin"
    ]
  }
}

// babel.config.js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        '@tamagui/babel-plugin',
        {
          components: ['tamagui'],
          config: './tamagui.config.ts',
        },
      ],
    ],
  };
};
```

### Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import tamagui from '@tamagui/vite-plugin';

export default defineConfig({
  plugins: [
    tamagui({
      tamaguiConfig: './tamagui.config.ts',
      components: ['tamagui'],
    }),
  ],
});
```

### 性能优化

```typescript
// 使用提取样式
// tamagui.config.ts
export const config = createTamagui({
  ...config,
  settings: {
    ...config.settings,
    // 启用样式提取
    styleResolution: 'specific',
    // 禁用开发警告
    devWarnings: false,
  },
});

// 按需加载字体
import { loadFont } from '@tamagui/font-inter';

// 在应用启动时加载
loadFont().then(() => {
  // 字体加载完成
});
```
