# Lottie 动画模板

## 技术栈

- **核心**: Lottie 5.x
- **播放器**: lottie-web / lottie-react / lottie-ios / lottie-android
- **创作工具**: After Effects + Bodymovin / LottieFiles
- **优化**: Lottie Optimizer / lottie-interactive
- **格式**: JSON / dotLottie (.lottie)

## 项目结构

```
lottie-project/
├── src/
│   ├── animations/
│   │   ├── loading.json        # 加载动画
│   │   ├── success.json        # 成功动画
│   │   ├── error.json          # 错误动画
│   │   └── icons/              # 图标动画
│   ├── components/
│   │   ├── LottiePlayer.tsx    # 播放器组件
│   │   ├── InteractiveLottie.tsx
│   │   ├── ControlledLottie.tsx
│   │   └── LottieSequence.tsx
│   ├── hooks/
│   │   ├── useLottie.ts        # Lottie hook
│   │   └── useLottieInteractivity.ts
│   ├── utils/
│   │   ├── optimizer.ts        # 动画优化
│   │   ├── lazyLoader.ts       # 懒加载
│   │   └── colorReplacer.ts    # 颜色替换
│   └── types/
│       └── lottie.d.ts
├── public/
│   └── animations/             # 公开动画资源
├── package.json
└── tsconfig.json
```

## 代码模式

### 基础播放器

```typescript
// components/LottiePlayer.tsx
import React, { useEffect, useRef, useState } from 'react';
import lottie, { AnimationItem } from 'lottie-web';

interface LottiePlayerProps {
  animationData: any; // JSON 动画数据
  loop?: boolean;
  autoplay?: boolean;
  speed?: number;
  style?: React.CSSProperties;
  onComplete?: () => void;
  onLoopComplete?: () => void;
  onEnterFrame?: (frame: number) => void;
}

export const LottiePlayer: React.FC<LottiePlayerProps> = ({
  animationData,
  loop = true,
  autoplay = true,
  speed = 1,
  style,
  onComplete,
  onLoopComplete,
  onEnterFrame,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 初始化动画
    animationRef.current = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg', // 'svg' | 'canvas' | 'html'
      loop,
      autoplay,
      animationData,
    });

    // 设置播放速度
    animationRef.current.setSpeed(speed);

    // 事件监听
    if (onComplete) {
      animationRef.current.addEventListener('complete', onComplete);
    }

    if (onLoopComplete) {
      animationRef.current.addEventListener('loopComplete', onLoopComplete);
    }

    if (onEnterFrame) {
      animationRef.current.addEventListener('enterFrame', (e) => {
        onEnterFrame(e.currentTime);
      });
    }

    return () => {
      animationRef.current?.destroy();
    };
  }, [animationData]);

  return <div ref={containerRef} style={style} />;
};

// 使用示例
import loadingAnimation from '../animations/loading.json';

function App() {
  return (
    <LottiePlayer
      animationData={loadingAnimation}
      loop={true}
      autoplay={true}
      style={{ width: 200, height: 200 }}
    />
  );
}
```

### React Lottie 组件

```typescript
// components/ReactLottie.tsx
import React from 'react';
import Lottie from 'lottie-react';

interface ReactLottieProps {
  animationData: any;
  loop?: boolean;
  autoplay?: boolean;
  style?: React.CSSProperties;
  onComplete?: () => void;
}

export const ReactLottie: React.FC<ReactLottieProps> = ({
  animationData,
  loop = true,
  autoplay = true,
  style,
  onComplete,
}) => {
  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
      style={style}
      onComplete={onComplete}
    />
  );
};

// 使用 hooks
import { useLottie } from 'lottie-react';

function ControlledAnimation() {
  const options = {
    animationData: loadingAnimation,
    loop: true,
    autoplay: false,
  };

  const { View, play, pause, stop, setSpeed } = useLottie(options);

  return (
    <div>
      {View}
      <button onClick={play}>Play</button>
      <button onClick={pause}>Pause</button>
      <button onClick={stop}>Stop</button>
      <button onClick={() => setSpeed(2)}>2x Speed</button>
    </div>
  );
}
```

### 受控播放

```typescript
// components/ControlledLottie.tsx
import React, { useRef, useEffect } from 'react';
import lottie, { AnimationItem } from 'lottie-web';

interface ControlledLottieProps {
  animationData: any;
  progress: number; // 0-1 之间的进度值
  speed?: number;
  direction?: 1 | -1;
}

export const ControlledLottie: React.FC<ControlledLottieProps> = ({
  animationData,
  progress,
  speed = 1,
  direction = 1,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    animationRef.current = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      animationData,
    });

    return () => {
      animationRef.current?.destroy();
    };
  }, [animationData]);

  useEffect(() => {
    if (!animationRef.current) return;

    // 根据进度设置帧
    const totalFrames = animationRef.current.totalFrames;
    const frame = progress * totalFrames;
    animationRef.current.goToAndStop(frame, true);

    // 设置速度和方向
    animationRef.current.setSpeed(speed);
    animationRef.current.setDirection(direction);
  }, [progress, speed, direction]);

  return <div ref={containerRef} />;
};

// 使用示例：滚动控制动画
function ScrollAnimation() {
  const [progress, setProgress] = React.useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // 计算滚动进度（0-1）
      const scrollProgress = 1 - (rect.top / windowHeight);
      setProgress(Math.max(0, Math.min(1, scrollProgress)));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={containerRef} style={{ height: '100vh' }}>
      <ControlledLottie
        animationData={scrollAnimation}
        progress={progress}
      />
    </div>
  );
}
```

### 交互式动画

```typescript
// components/InteractiveLottie.tsx
import React, { useRef, useEffect, useState } from 'react';
import lottie, { AnimationItem } from 'lottie-web';

interface InteractiveLottieProps {
  animationData: any;
  hoverAnimation?: any;
  clickAnimation?: any;
}

export const InteractiveLottie: React.FC<InteractiveLottieProps> = ({
  animationData,
  hoverAnimation,
  clickAnimation,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const animation = isHovered && hoverAnimation ? hoverAnimation : animationData;

    animationRef.current?.destroy();
    animationRef.current = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: animation,
    });

    return () => {
      animationRef.current?.destroy();
    };
  }, [animationData, hoverAnimation, isHovered]);

  const handleClick = () => {
    if (!clickAnimation || !containerRef.current) return;

    animationRef.current?.destroy();
    animationRef.current = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: false,
      autoplay: true,
      animationData: clickAnimation,
    });

    animationRef.current.addEventListener('complete', () => {
      // 点击动画完成后恢复默认动画
      setIsHovered(false);
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    />
  );
}
```

### 动画序列

```typescript
// components/LottieSequence.tsx
import React, { useState, useEffect, useRef } from 'react';
import lottie, { AnimationItem } from 'lottie-web';

interface SequenceStep {
  animationData: any;
  duration?: number; // 毫秒
}

interface LottieSequenceProps {
  steps: SequenceStep[];
  loop?: boolean;
  onStepChange?: (stepIndex: number) => void;
}

export const LottieSequence: React.FC<LottieSequenceProps> = ({
  steps,
  loop = false,
  onStepChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!containerRef.current || steps.length === 0) return;

    const step = steps[currentStep];
    
    animationRef.current?.destroy();
    animationRef.current = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: false,
      autoplay: true,
      animationData: step.animationData,
    });

    onStepChange?.(currentStep);

    const handleComplete = () => {
      const nextStep = currentStep + 1;
      
      if (nextStep < steps.length) {
        setCurrentStep(nextStep);
      } else if (loop) {
        setCurrentStep(0);
      }
    };

    animationRef.current.addEventListener('complete', handleComplete);

    return () => {
      animationRef.current?.destroy();
    };
  }, [currentStep, steps, loop]);

  return <div ref={containerRef} />;
};

// 使用示例
function AnimatedOnboarding() {
  const steps = [
    { animationData: step1Animation },
    { animationData: step2Animation },
    { animationData: step3Animation },
  ];

  return (
    <LottieSequence
      steps={steps}
      loop={false}
      onStepChange={(step) => console.log(`Step ${step}`)}
    />
  );
}
```

### 动态颜色替换

```typescript
// utils/colorReplacer.ts
export function replaceColors(
  animationData: any,
  colorMap: Record<string, string>
): any {
  const data = JSON.parse(JSON.stringify(animationData));

  function traverseLayers(layers: any[]) {
    layers.forEach((layer) => {
      if (layer.shapes) {
        traverseShapes(layer.shapes);
      }
    });
  }

  function traverseShapes(shapes: any[]) {
    shapes.forEach((shape) => {
      if (shape.it) {
        traverseShapes(shape.it);
      }

      // 替换填充颜色
      if (shape.ty === 'fl' && shape.c) {
        const originalColor = shape.c.k;
        const colorKey = rgbToHex(originalColor);
        
        if (colorMap[colorKey]) {
          shape.c.k = hexToRgb(colorMap[colorKey]);
        }
      }

      // 替换描边颜色
      if (shape.ty === 'st' && shape.c) {
        const originalColor = shape.c.k;
        const colorKey = rgbToHex(originalColor);
        
        if (colorMap[colorKey]) {
          shape.c.k = hexToRgb(colorMap[colorKey]);
        }
      }
    });
  }

  traverseLayers(data.layers);
  return data;
}

function rgbToHex(rgb: number[]): string {
  const r = Math.round(rgb[0] * 255);
  const g = Math.round(rgb[1] * 255);
  const b = Math.round(rgb[2] * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function hexToRgb(hex: string): number[] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
        1,
      ]
    : [0, 0, 0, 1];
}

// 使用示例
const themedAnimation = replaceColors(animationData, {
  '#ff0000': '#00ff00', // 红色替换为绿色
  '#0000ff': '#ff00ff', // 蓝色替换为紫色
});
```

## 最佳实践

### 1. 懒加载优化

```typescript
// utils/lazyLoader.ts
import React from 'react';

const animationCache = new Map<string, any>();

export async function loadAnimation(url: string): Promise<any> {
  // 检查缓存
  if (animationCache.has(url)) {
    return animationCache.get(url);
  }

  // 加载动画
  const response = await fetch(url);
  const data = await response.json();

  // 缓存结果
  animationCache.set(url, data);

  return data;
}

// React 组件中使用
function LazyLottie({ url }: { url: string }) {
  const [animationData, setAnimationData] = React.useState(null);

  React.useEffect(() => {
    loadAnimation(url).then(setAnimationData);
  }, [url]);

  if (!animationData) {
    return <div>Loading...</div>;
  }

  return <LottiePlayer animationData={animationData} />;
}
```

### 2. 动画优化

```typescript
// utils/optimizer.ts
export function optimizeAnimation(animationData: any): any {
  const data = JSON.parse(JSON.stringify(animationData));

  // 移除未使用的资源
  data.assets = data.assets.filter((asset: any) => {
    return isAssetUsed(asset.id, data.layers);
  });

  // 简化路径
  data.layers.forEach((layer: any) => {
    if (layer.shapes) {
      simplifyShapes(layer.shapes);
    }
  });

  // 减少帧率
  if (data.fr > 30) {
    data.fr = 30;
  }

  return data;
}

function isAssetUsed(assetId: string, layers: any[]): boolean {
  return layers.some((layer) => {
    if (layer.refId === assetId) return true;
    if (layer.layers) return isAssetUsed(assetId, layer.layers);
    return false;
  });
}

function simplifyShapes(shapes: any[]) {
  shapes.forEach((shape) => {
    if (shape.it) {
      simplifyShapes(shape.it);
    }

    // 简化贝塞尔曲线
    if (shape.ks && shape.ks.i && shape.ks.o) {
      // 实现简化逻辑
    }
  });
}
```

### 3. 响应式尺寸

```typescript
// components/ResponsiveLottie.tsx
import React from 'react';
import Lottie from 'lottie-react';

interface ResponsiveLottieProps {
  animationData: any;
  aspectRatio?: number; // 宽高比
  maxWidth?: number;
  maxHeight?: number;
}

export const ResponsiveLottie: React.FC<ResponsiveLottieProps> = ({
  animationData,
  aspectRatio = 1,
  maxWidth = 400,
  maxHeight = 400,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;

      // 计算最佳尺寸
      let width = containerWidth;
      let height = width / aspectRatio;

      if (height > containerHeight) {
        height = containerHeight;
        width = height * aspectRatio;
      }

      // 应用最大尺寸限制
      width = Math.min(width, maxWidth);
      height = Math.min(height, maxHeight);

      setSize({ width, height });
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    return () => window.removeEventListener('resize', updateSize);
  }, [aspectRatio, maxWidth, maxHeight]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <Lottie
        animationData={animationData}
        style={{
          width: size.width,
          height: size.height,
        }}
      />
    </div>
  );
};
```

### 4. 无障碍访问

```typescript
// components/AccessibleLottie.tsx
import React from 'react';
import Lottie from 'lottie-react';

interface AccessibleLottieProps {
  animationData: any;
  ariaLabel: string;
  ariaDescription?: string;
  role?: 'img' | 'presentation';
  pauseOnReduceMotion?: boolean;
}

export const AccessibleLottie: React.FC<AccessibleLottieProps> = ({
  animationData,
  ariaLabel,
  ariaDescription,
  role = 'img',
  pauseOnReduceMotion = true,
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div
      role={role}
      aria-label={ariaLabel}
      aria-describedby={ariaDescription ? 'lottie-description' : undefined}
    >
      <Lottie
        animationData={animationData}
        autoplay={!prefersReducedMotion || !pauseOnReduceMotion}
        loop={!prefersReducedMotion || !pauseOnReduceMotion}
      />
      
      {ariaDescription && (
        <span id="lottie-description" className="sr-only">
          {ariaDescription}
        </span>
      )}
    </div>
  );
};

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}
```

## 常用命令

```bash
# 安装
npm install lottie-web
npm install lottie-react # React 专用

# TypeScript 支持
npm install @types/lottie-web -D

# 优化工具
npm install lottie-optimizer -D

# CLI 工具
npm install lottie-cli -g

# 转换为 dotLottie
npx lottie-to-dotlottie animation.json

# 优化动画
npx lottie-optimizer animation.json -o optimized.json
```

## 部署配置

### CDN 引入

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>

<script>
  const animation = lottie.loadAnimation({
    container: document.getElementById('lottie'),
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: 'animation.json', // 或 animationData: {...}
  });
</script>
```

### Next.js 优化

```typescript
// components/DynamicLottie.tsx
import dynamic from 'next/dynamic';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

export function DynamicLottie({ animationData }: any) {
  return <Lottie animationData={animationData} />;
}

// 使用
<DynamicLottie animationData={myAnimation} />
```

### Gzip 压缩

```nginx
# nginx.conf
gzip on;
gzip_types application/json;
gzip_min_length 1000;

# 对 JSON 动画文件启用压缩
location ~* \.json$ {
  gzip_static on;
  add_header Cache-Control "public, max-age=31536000";
}
```

### dotLottie 格式

```typescript
// 使用 dotLottie 格式（更小的文件大小）
import { DotLottiePlayer } from '@dotlottie/react-player';

function DotLottieDemo() {
  return (
    <DotLottiePlayer
      src="/animations/animation.lottie"
      autoplay
      loop
      style={{ height: '300px', width: '300px' }}
    />
  );
}
```

## 扩展资源

- [Lottie 官方文档](https://airbnb.io/lottie/)
- [LottieFiles](https://lottiefiles.com/) - 动画库
- [Lottie Editor](https://edit.lottiefiles.com/) - 在线编辑器
- [After Effects 插件](https://aescripts.com/bodymovin/)
- [dotLottie 格式](https://dotlottie.io/)
