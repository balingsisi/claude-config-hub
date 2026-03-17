# Rive Animation 动画模板

## 技术栈

- **@rive-app/react-canvas**: Rive React Canvas 运行时
- **@rive-app/react-webgl**: Rive React WebGL 运行时（可选）
- **Rive Editor**: 动画设计和导出工具
- **React**: 18+
- **TypeScript**: 5+
- **Framer Motion**: 复杂交互动画（可选）

## 项目结构

```
project/
├── public/
│   └── rive/
│       ├── loader.riv
│       ├── mascot.riv
│       ├── icons/
│       │   ├── check.riv
│       │   ├── menu.riv
│       │   └── settings.riv
│       └── illustrations/
│           ├── hero.riv
│           └── empty-state.riv
├── src/
│   ├── components/
│   │   ├── rive/
│   │   │   ├── RiveWrapper.tsx
│   │   │   ├── AnimatedIcon.tsx
│   │   │   ├── InteractiveAnimation.tsx
│   │   │   └── StateMachineDemo.tsx
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   └── loading.tsx
│   │   └── layouts/
│   │       └── LoadingScreen.tsx
│   ├── hooks/
│   │   ├── useRive.ts
│   │   └── useRiveStateMachine.ts
│   ├── lib/
│   │   └── rive-config.ts
│   └── app/
│       └── page.tsx
├── package.json
└── tsconfig.json
```

## 代码模式

### 1. 基础 Rive 组件

```typescript
// src/components/rive/RiveWrapper.tsx
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { useEffect } from 'react';

interface RiveWrapperProps {
  src: string;
  stateMachine?: string;
  artboard?: string;
  animations?: string | string[];
  autoplay?: boolean;
  className?: string;
  onStateChange?: (stateName: string) => void;
}

export function RiveWrapper({
  src,
  stateMachine,
  artboard,
  animations,
  autoplay = true,
  className,
  onStateChange,
}: RiveWrapperProps) {
  const { rive, RiveComponent } = useRive({
    src,
    stateMachines: stateMachine,
    artboard,
    animations,
    autoplay,
    onStateChange: (event) => {
      onStateChange?.(event.data[0]);
    },
  });

  return (
    <div className={className}>
      <RiveComponent />
    </div>
  );
}
```

### 2. 动画图标组件

```typescript
// src/components/rive/AnimatedIcon.tsx
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { useEffect } from 'react';

interface AnimatedIconProps {
  src: string;
  size?: number;
  stateMachine?: string;
  inputName?: string;
  onToggle?: (isActive: boolean) => void;
  className?: string;
}

export function AnimatedIcon({
  src,
  size = 24,
  stateMachine = 'State Machine 1',
  inputName = 'active',
  onToggle,
  className,
}: AnimatedIconProps) {
  const { rive, RiveComponent } = useRive({
    src,
    stateMachines: stateMachine,
    autoplay: true,
  });

  const activeInput = useStateMachineInput(rive, stateMachine, inputName);

  const handleClick = () => {
    if (activeInput) {
      activeInput.value = !activeInput.value;
      onToggle?.(activeInput.value as boolean);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <RiveComponent />
    </button>
  );
}

// 使用示例
export function ExampleUsage() {
  return (
    <div className="flex gap-4">
      <AnimatedIcon src="/rive/icons/check.riv" size={32} />
      <AnimatedIcon src="/rive/icons/menu.riv" size={32} />
      <AnimatedIcon src="/rive/icons/settings.riv" size={32} />
    </div>
  );
}
```

### 3. 交互式动画组件

```typescript
// src/components/rive/InteractiveAnimation.tsx
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { useEffect, useState } from 'react';

interface InteractiveAnimationProps {
  src: string;
  stateMachine?: string;
  className?: string;
}

export function InteractiveAnimation({
  src,
  stateMachine = 'State Machine 1',
  className,
}: InteractiveAnimationProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const { rive, RiveComponent } = useRive({
    src,
    stateMachines: stateMachine,
    autoplay: true,
  });

  const hoverInput = useStateMachineInput(rive, stateMachine, 'hover');
  const pressInput = useStateMachineInput(rive, stateMachine, 'press');

  useEffect(() => {
    if (hoverInput) {
      hoverInput.value = isHovered;
    }
  }, [isHovered, hoverInput]);

  useEffect(() => {
    if (pressInput) {
      pressInput.value = isPressed;
    }
  }, [isPressed, pressInput]);

  return (
    <div
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
    >
      <RiveComponent />
    </div>
  );
}
```

### 4. 状态机演示

```typescript
// src/components/rive/StateMachineDemo.tsx
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { useState } from 'react';

interface StateMachineDemoProps {
  src: string;
  stateMachine?: string;
  className?: string;
}

export function StateMachineDemo({
  src,
  stateMachine = 'State Machine 1',
  className,
}: StateMachineDemoProps) {
  const [level, setLevel] = useState(0);
  const [speed, setSpeed] = useState(1);

  const { rive, RiveComponent } = useRive({
    src,
    stateMachines: stateMachine,
    autoplay: true,
  });

  const levelInput = useStateMachineInput(rive, stateMachine, 'level');
  const speedInput = useStateMachineInput(rive, stateMachine, 'speed');

  const handleLevelChange = (newLevel: number) => {
    setLevel(newLevel);
    if (levelInput) {
      levelInput.value = newLevel;
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (speedInput) {
      speedInput.value = newSpeed;
    }
  };

  return (
    <div className={className}>
      <div className="mb-4">
        <RiveComponent />
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Level: {level}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={level}
            onChange={(e) => handleLevelChange(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Speed: {speed.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={speed}
            onChange={(e) => handleSpeedChange(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
```

### 5. 加载动画组件

```typescript
// src/components/ui/loading.tsx
import { useRive } from '@rive-app/react-canvas';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Loading({ size = 'md', className }: LoadingProps) {
  const { RiveComponent } = useRive({
    src: '/rive/loader.riv',
    autoplay: true,
  });

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-24 h-24',
    lg: 'w-48 h-48',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={sizeClasses[size]}>
        <RiveComponent />
      </div>
    </div>
  );
}
```

### 6. 加载屏幕

```typescript
// src/components/layouts/LoadingScreen.tsx
import { useRive } from '@rive-app/react-canvas';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  message?: string;
  onComplete?: () => void;
}

export function LoadingScreen({
  message = 'Loading...',
  onComplete,
}: LoadingScreenProps) {
  const { RiveComponent } = useRive({
    src: '/rive/loader.riv',
    autoplay: true,
    onStop: () => {
      onComplete?.();
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
    >
      <div className="w-32 h-32 mb-8">
        <RiveComponent />
      </div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-lg text-gray-600"
      >
        {message}
      </motion.p>
    </motion.div>
  );
}
```

### 7. 自定义 Hook

```typescript
// src/hooks/useRive.ts
import { useRive as useRiveOriginal, useStateMachineInput } from '@rive-app/react-canvas';
import { useCallback, useMemo } from 'react';

interface UseRiveOptions {
  src: string;
  stateMachine?: string;
  artboard?: string;
  autoplay?: boolean;
}

export function useRiveControls(options: UseRiveOptions) {
  const { rive, RiveComponent } = useRiveOriginal({
    src: options.src,
    stateMachines: options.stateMachine,
    artboard: options.artboard,
    autoplay: options.autoplay ?? true,
  });

  const play = useCallback(() => {
    rive?.play();
  }, [rive]);

  const pause = useCallback(() => {
    rive?.pause();
  }, [rive]);

  const reset = useCallback(() => {
    rive?.reset();
  }, [rive]);

  const getInput = useCallback(
    (inputName: string) => {
      return useStateMachineInput(rive, options.stateMachine ?? '', inputName);
    },
    [rive, options.stateMachine]
  );

  const controls = useMemo(
    () => ({
      play,
      pause,
      reset,
      setInputValue: (inputName: string, value: number | boolean) => {
        const input = getInput(inputName);
        if (input) {
          input.value = value;
        }
      },
    }),
    [play, pause, reset, getInput]
  );

  return {
    rive,
    RiveComponent,
    controls,
    getInput,
  };
}
```

### 8. Rive 配置文件

```typescript
// src/lib/rive-config.ts
export const RIVE_CONFIG = {
  // 动画文件路径
  animations: {
    loader: '/rive/loader.riv',
    mascot: '/rive/mascot.riv',
    hero: '/rive/illustrations/hero.riv',
    emptyState: '/rive/illustrations/empty-state.riv',
  },
  
  // 图标路径
  icons: {
    check: '/rive/icons/check.riv',
    menu: '/rive/icons/menu.riv',
    settings: '/rive/icons/settings.riv',
    heart: '/rive/icons/heart.riv',
    star: '/rive/icons/star.riv',
  },
  
  // 默认状态机名称
  defaultStateMachine: 'State Machine 1',
  
  // 性能配置
  performance: {
    // 启用 WebGL（更高性能）
    useWebGL: false,
    // 预加载动画
    preload: true,
  },
};

// 动画预设
export const ANIMATION_PRESETS = {
  fadeIn: {
    duration: 300,
    easing: 'ease-out',
  },
  slideIn: {
    duration: 500,
    easing: 'ease-in-out',
  },
  bounce: {
    duration: 600,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};
```

### 9. Hero 区域示例

```typescript
// src/app/page.tsx
import { useRive } from '@rive-app/react-canvas';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const { RiveComponent } = useRive({
    src: '/rive/illustrations/hero.riv',
    autoplay: true,
  });

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="space-y-6">
          <h1 className="text-5xl font-bold text-gray-900">
            Beautiful Animations
            <br />
            Made Simple
          </h1>
          <p className="text-xl text-gray-600">
            Create stunning interactive animations with Rive. Bring your designs
            to life with state machines and real-time interactions.
          </p>
          <div className="flex gap-4">
            <Button size="lg">Get Started</Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>

        {/* Right Animation */}
        <div className="relative">
          <div className="w-full h-[500px]">
            <RiveComponent />
          </div>
        </div>
      </div>
    </section>
  );
}
```

### 10. 空状态组件

```typescript
// src/components/ui/EmptyState.tsx
import { useRive } from '@rive-app/react-canvas';
import { Button } from './button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { RiveComponent } = useRive({
    src: '/rive/illustrations/empty-state.riv',
    autoplay: true,
  });

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-64 h-64 mb-6">
        <RiveComponent />
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-center max-w-md mb-6">{description}</p>

      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
```

### 11. WebGL 版本（高性能）

```typescript
// src/components/rive/RiveWebGL.tsx
import { useRive } from '@rive-app/react-webgl';

interface RiveWebGLProps {
  src: string;
  stateMachine?: string;
  className?: string;
}

export function RiveWebGL({
  src,
  stateMachine,
  className,
}: RiveWebGLProps) {
  const { RiveComponent } = useRive({
    src,
    stateMachines: stateMachine,
    autoplay: true,
  });

  return (
    <div className={className}>
      <RiveComponent />
    </div>
  );
}
```

## 最佳实践

### 1. 文件优化

```typescript
// 在 Rive Editor 中优化文件大小
// 1. 使用矢量图形而非位图
// 2. 删除未使用的艺术板和动画
// 3. 简化复杂路径
// 4. 使用嵌套组件

// 代码中按需加载
import { lazy, Suspense } from 'react';

const AnimatedIcon = lazy(() => import('./AnimatedIcon'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AnimatedIcon src="/rive/icons/check.riv" />
    </Suspense>
  );
}
```

### 2. 性能监控

```typescript
// src/hooks/useRivePerformance.ts
import { useEffect, useRef } from 'react';

export function useRivePerformance() {
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    let animationId: number;

    const measureFPS = () => {
      frameCount.current++;
      const currentTime = performance.now();

      if (currentTime - lastTime.current >= 1000) {
        console.log(`Rive FPS: ${frameCount.current}`);
        frameCount.current = 0;
        lastTime.current = currentTime;
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);

    return () => cancelAnimationFrame(animationId);
  }, []);
}
```

### 3. 响应式设计

```typescript
// 根据屏幕尺寸加载不同的动画
import { useMediaQuery } from '@/hooks/useMediaQuery';

function ResponsiveRiveAnimation() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const { RiveComponent } = useRive({
    src: isMobile ? '/rive/mobile-animation.riv' : '/rive/desktop-animation.riv',
    autoplay: true,
  });

  return <RiveComponent />;
}
```

### 4. 错误处理

```typescript
// src/components/rive/SafeRive.tsx
import { useRive } from '@rive-app/react-canvas';
import { useState } from 'react';

interface SafeRiveProps {
  src: string;
  fallback?: React.ReactNode;
}

export function SafeRive({ src, fallback }: SafeRiveProps) {
  const [hasError, setHasError] = useState(false);
  const { RiveComponent } = useRive({
    src,
    autoplay: true,
    onError: (error) => {
      console.error('Rive error:', error);
      setHasError(true);
    },
  });

  if (hasError) {
    return fallback ?? <div>Failed to load animation</div>;
  }

  return <RiveComponent />;
}
```

### 5. 可访问性

```typescript
// 为 Rive 动画添加可访问性支持
interface AccessibleRiveProps {
  src: string;
  ariaLabel: string;
  role?: 'img' | 'presentation';
}

export function AccessibleRive({
  src,
  ariaLabel,
  role = 'img',
}: AccessibleRiveProps) {
  const { RiveComponent } = useRive({
    src,
    autoplay: true,
  });

  return (
    <div role={role} aria-label={ariaLabel}>
      <RiveComponent />
    </div>
  );
}
```

## 常用命令

```bash
# 安装依赖
npm install @rive-app/react-canvas

# 安装 WebGL 版本（可选）
npm install @rive-app/react-webgl

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## Package.json

```json
{
  "dependencies": {
    "@rive-app/react-canvas": "^4.0.0",
    "@rive-app/react-webgl": "^2.0.0",
    "framer-motion": "^11.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

## 资源

- [Rive 官方文档](https://rive.app/docs)
- [Rive React Runtime](https://github.com/rive-app/rive-wasm/tree/master/js)
- [Rive 社区动画](https://rive.app/community/)
- [Rive Editor](https://rive.app/)
- [Rive 状态机](https://rive.app/docs/editor/state-machine)
