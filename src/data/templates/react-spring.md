# React Spring 动画模板

## 技术栈

- **核心库**: @react-spring/web v9.7+
- **动画引擎**: react-spring (physics-based)
- **类型支持**: TypeScript
- **框架集成**: React 18+
- **扩展库**: @react-spring/konva, @react-spring/three, @react-spring/zdog

## 项目结构

```
src/
├── animations/
│   ├── index.ts              # 导出所有动画
│   ├── useFadeIn.ts          # 淡入动画
│   ├── useSlideIn.ts         # 滑入动画
│   ├── useScale.ts           # 缩放动画
│   ├── useRotate.ts          # 旋转动画
│   ├── useSpring.ts          # 弹簧动画
│   └── useTrail.ts           # 链式动画
├── components/
│   ├── AnimatedCard.tsx      # 动画卡片
│   ├── AnimatedList.tsx      # 动画列表
│   ├── AnimatedModal.tsx     # 动画模态框
│   ├── AnimatedNumber.tsx    # 数字动画
│   ├── Transition.tsx        # 过渡组件
│   └── Parallax.tsx          # 视差效果
├── hooks/
│   ├── useBoop.ts            # 弹跳效果
│   ├── useGesture.ts         # 手势集成
│   └── useScrollProgress.ts  # 滚动进度
├── utils/
│   ├── springs.ts            # 弹簧配置
│   ├── interpolators.ts      # 插值器
│   └── easings.ts            # 缓动函数
└── types/
    └── animation.d.ts        # 类型定义
```

## 代码模式

### 1. 基础配置

```typescript
// src/animations/useSpring.ts
import { useSpring, animated, SpringValue } from '@react-spring/web';
import { SpringConfig } from '@react-spring/shared';

// 常用弹簧配置
export const springConfigs = {
  default: { tension: 170, friction: 26 },
  gentle: { tension: 120, friction: 14 },
  wobbly: { tension: 180, friction: 12 },
  stiff: { tension: 210, friction: 20 },
  slow: { tension: 100, friction: 24 },
  molasses: { tension: 280, friction: 60 },
  snappy: { tension: 400, friction: 30 },
} as const;

// 基础 Hook
export function useAnimatedValue(
  to: number | object,
  config: SpringConfig = springConfigs.default
) {
  return useSpring({
    to,
    config,
  });
}

// 动画组件
export { animated };
export type { SpringValue };
```

### 2. 淡入淡出

```typescript
// src/animations/useFadeIn.ts
import { useSpring, animated } from '@react-spring/web';
import { useEffect, useState } from 'react';

interface FadeInOptions {
  duration?: number;
  delay?: number;
  from?: number;
  to?: number;
}

export function useFadeIn(options: FadeInOptions = {}) {
  const { duration = 300, delay = 0, from = 0, to = 1 } = options;
  const [isVisible, setIsVisible] = useState(false);

  const styles = useSpring({
    opacity: isVisible ? to : from,
    transform: isVisible ? 'translateY(0px)' : 'translateY(20px)',
    config: { duration, tension: 280, friction: 60 },
    delay,
  });

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const reset = () => {
    setIsVisible(false);
    setTimeout(() => setIsVisible(true), 50);
  };

  return { styles: animated.div, FadeIn: animated.div, reset, ...styles };
}

// 使用示例
function FadeInComponent({ children }: { children: React.ReactNode }) {
  const FadeIn = useFadeIn({ duration: 500 });
  
  return <FadeIn>{children}</FadeIn>;
}
```

### 3. 滑入动画

```typescript
// src/animations/useSlideIn.ts
import { useSpring, animated } from '@react-spring/web';
import { useEffect, useState } from 'react';

type Direction = 'left' | 'right' | 'top' | 'bottom';

interface SlideInOptions {
  direction?: Direction;
  distance?: number;
  duration?: number;
  delay?: number;
}

export function useSlideIn(options: SlideInOptions = {}) {
  const {
    direction = 'left',
    distance = 100,
    duration = 400,
    delay = 0,
  } = options;
  
  const [isVisible, setIsVisible] = useState(false);

  const getTransform = (dir: Direction, dist: number) => {
    switch (dir) {
      case 'left':
        return `translateX(-${dist}px)`;
      case 'right':
        return `translateX(${dist}px)`;
      case 'top':
        return `translateY(-${dist}px)`;
      case 'bottom':
        return `translateY(${dist}px)`;
    }
  };

  const styles = useSpring({
    from: {
      opacity: 0,
      transform: getTransform(direction, distance),
    },
    to: {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translate(0px, 0px)' : getTransform(direction, distance),
    },
    config: { tension: 280, friction: 60 },
    delay,
  });

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return animated.div;
}

// 使用示例
function SlideInCard() {
  const SlideIn = useSlideIn({ direction: 'left', distance: 200 });
  
  return (
    <SlideIn className="card">
      <h2>Slide In Content</h2>
    </SlideIn>
  );
}
```

### 4. 缩放动画

```typescript
// src/animations/useScale.ts
import { useSpring, animated } from '@react-spring/web';
import { useState } from 'react';

interface ScaleOptions {
  from?: number;
  to?: number;
  tension?: number;
  friction?: number;
}

export function useScale(options: ScaleOptions = {}) {
  const {
    from = 0.8,
    to = 1,
    tension = 300,
    friction = 20,
  } = options;
  
  const [isScaled, setIsScaled] = useState(false);

  const styles = useSpring({
    transform: isScaled ? `scale(${to})` : `scale(${from})`,
    opacity: isScaled ? 1 : 0,
    config: { tension, friction },
  });

  return {
    ScaleDiv: animated.div,
    styles,
    trigger: () => setIsScaled(true),
    reset: () => setIsScaled(false),
    toggle: () => setIsScaled(!isScaled),
  };
}

// 弹跳效果
export function useBoop(scale = 1.1, rotation = 0) {
  const [isBooped, setIsBooped] = useState(false);

  const style = useSpring({
    transform: isBooped
      ? `scale(${scale}) rotate(${rotation}deg)`
      : `scale(1) rotate(0deg)`,
    config: { tension: 300, friction: 10 },
  });

  return {
    style,
    trigger: {
      onMouseEnter: () => setIsBooped(true),
      onMouseLeave: () => setIsBooped(false),
    },
  };
}
```

### 5. 链式动画 (Trail)

```typescript
// src/animations/useTrail.ts
import { useTrail, animated, useSprings } from '@react-spring/web';
import { useEffect, useState } from 'react';

interface TrailOptions {
  items: any[];
  config?: object;
  delay?: number;
}

export function useTrailAnimation(count: number, options: TrailOptions = {}) {
  const { config = { tension: 180, friction: 26 }, delay = 0 } = options;
  const [isVisible, setIsVisible] = useState(false);

  const trails = useTrail(count, {
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0px)' : 'translateY(20px)',
    },
    config,
    delay,
  });

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return trails;
}

// 使用示例
function AnimatedList({ items }: { items: string[] }) {
  const trails = useTrailAnimation(items.length);

  return (
    <div>
      {trails.map((style, index) => (
        <animated.div key={index} style={style}>
          {items[index]}
        </animated.div>
      ))}
    </div>
  );
}
```

### 6. 手势集成

```typescript
// src/hooks/useGesture.ts
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';

interface DragOptions {
  bounds?: { left?: number; right?: number; top?: number; bottom?: number };
  rubberBand?: boolean;
}

export function useDraggable(options: DragOptions = {}) {
  const { bounds, rubberBand = true } = options;
  
  const [{ x, y }, api] = useSpring(() => ({ x: 0, y: 0 }));

  const bind = useDrag(({ down, movement: [mx, my], velocity: [vx, vy] }) => {
    if (down) {
      api.start({ x: mx, y: my });
    } else {
      // 回弹效果
      if (rubberBand) {
        api.start({ x: 0, y: 0, config: { tension: 200, friction: 30 } });
      }
    }
  }, {
    bounds,
    rubberband: rubberBand,
  });

  return {
    bind,
    style: { x, y },
    DraggableDiv: animated.div,
  };
}

// 使用示例
function DraggableCard() {
  const { bind, style, DraggableDiv } = useDraggable();

  return (
    <DraggableDiv
      {...bind()}
      style={{
        ...style,
        touchAction: 'none',
        cursor: 'grab',
      }}
    >
      Drag me!
    </DraggableDiv>
  );
}
```

### 7. 数字动画

```typescript
// src/components/AnimatedNumber.tsx
import { useSpring, animated } from '@react-spring/web';
import { useEffect, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: (value: number) => string;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 1000,
  format = (v) => v.toFixed(0),
  className,
}: AnimatedNumberProps) {
  const { number } = useSpring({
    from: { number: 0 },
    number: value,
    config: { duration },
  });

  return (
    <animated.span className={className}>
      {number.to((n) => format(n))}
    </animated.span>
  );
}

// 计数器
export function useCounter(start = 0, end = 100, duration = 2000) {
  const [count, setCount] = useState(start);
  
  const { number } = useSpring({
    from: { number: start },
    number: count,
    config: { duration: duration / (end - start) },
  });

  const startCounter = () => setCount(end);
  const resetCounter = () => setCount(start);

  return { number, startCounter, resetCounter };
}
```

### 8. 过渡动画

```typescript
// src/components/Transition.tsx
import { useTransition, animated } from '@react-spring/web';
import { useState } from 'react';

interface TransitionGroupProps {
  items: Array<{ id: string | number; content: React.ReactNode }>;
  keys?: (item: any) => string | number;
  from?: object;
  enter?: object;
  leave?: object;
  config?: object;
}

export function TransitionGroup({
  items,
  keys = (item) => item.id,
  from = { opacity: 0, transform: 'translateY(20px)' },
  enter = { opacity: 1, transform: 'translateY(0px)' },
  leave = { opacity: 0, transform: 'translateY(-20px)' },
  config = { tension: 200, friction: 20 },
}: TransitionGroupProps) {
  const transitions = useTransition(items, {
    keys,
    from,
    enter,
    leave,
    config,
    trail: 100,
  });

  return transitions((style, item) => (
    <animated.div style={style}>{item.content}</animated.div>
  ));
}

// 模态框过渡
export function useModalTransition(isOpen: boolean) {
  return useTransition(isOpen, {
    from: { opacity: 0, transform: 'scale(0.9)' },
    enter: { opacity: 1, transform: 'scale(1)' },
    leave: { opacity: 0, transform: 'scale(0.9)' },
    config: { tension: 300, friction: 25 },
  });
}
```

### 9. 视差效果

```typescript
// src/components/Parallax.tsx
import { useSpring, animated, useScroll } from '@react-spring/web';
import { useRef } from 'react';

interface ParallaxProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export function Parallax({ children, speed = 0.5, className }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = scrollYProgress.to((value) => value * 100 * speed);

  return (
    <animated.div ref={ref} style={{ y }} className={className}>
      {children}
    </animated.div>
  );
}

// 视差层
export function ParallaxLayer({
  factor = 1,
  offset = 0,
  children,
}: {
  factor?: number;
  offset?: number;
  children: React.ReactNode;
}) {
  const { scrollY } = useSpring({ scrollY: 0 });
  
  const y = scrollY.to((v) => v * factor + offset);

  return (
    <animated.div style={{ y, position: 'absolute', width: '100%' }}>
      {children}
    </animated.div>
  );
}
```

### 10. 滚动进度

```typescript
// src/hooks/useScrollProgress.ts
import { useSpring, animated } from '@react-spring/web';
import { useScroll } from '@react-spring/web';

export function useScrollProgress() {
  const { scrollYProgress } = useScroll();
  
  return scrollYProgress;
}

// 进度条组件
export function ScrollProgressBar() {
  const scrollYProgress = useScrollProgress();
  
  const width = scrollYProgress.to((v) => `${v * 100}%`);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: 4, background: '#eee' }}>
      <animated.div
        style={{
          width,
          height: '100%',
          background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
        }}
      />
    </div>
  );
}
```

## 最佳实践

### 1. 性能优化

```typescript
// ✅ 使用 will-change 提示浏览器
<animated.div
  style={{
    ...styles,
    willChange: 'transform, opacity',
  }}
>
  Content
</animated.div>

// ✅ 避免在动画中改变布局属性
const styles = useSpring({
  // ✅ 使用 transform
  transform: `translateX(${x}px)`,
  
  // ❌ 避免改变 margin/left
  // marginLeft: x,
});

// ✅ 使用硬件加速
const styles = useSpring({
  transform: 'translate3d(0, 0, 0)', // 触发 GPU 加速
});
```

### 2. 可访问性

```typescript
// ✅ 尊重用户偏好
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

const duration = prefersReducedMotion ? 0 : 300;

const styles = useSpring({
  opacity: 1,
  config: { duration },
});

// ✅ 提供非动画替代方案
function AnimatedComponent() {
  if (prefersReducedMotion) {
    return <div>{content}</div>;
  }
  
  return <FadeIn>{content}</FadeIn>;
}
```

### 3. 依赖管理

```typescript
// ✅ 安装所需包
npm install @react-spring/web

// 手势支持
npm install @use-gesture/react

// 其他平台
npm install @react-spring/three    # Three.js
npm install @react-spring/konva    # Konva
npm install @react-spring/zdog     # Zdog
npm install @react-spring/native   # React Native
```

### 4. TypeScript 类型

```typescript
import { SpringValue, SpringConfig, Interpolation } from '@react-spring/web';

// ✅ 定义动画值类型
interface AnimatedStyles {
  opacity: SpringValue<number>;
  transform: SpringValue<string>;
  x: SpringValue<number>;
  y: SpringValue<number>;
}

// ✅ 配置类型
const config: SpringConfig = {
  tension: 180,
  friction: 24,
  mass: 1,
  velocity: 0,
};

// ✅ 插值类型
const interpolated: Interpolation<number, string> = x.to(
  [0, 100, 200],
  ['red', 'green', 'blue']
);
```

## 常用命令

```bash
# 安装核心库
npm install @react-spring/web

# 安装手势支持
npm install @use-gesture/react

# 安装其他平台
npm install @react-spring/three @react-spring/konva

# TypeScript 支持（内置）
npm install -D @types/react

# 开发
npm run dev

# 构建
npm run build
```

## 配置选项

### 弹簧配置

```typescript
// 物理参数
interface SpringConfig {
  tension?: number;      // 张力 (default: 170)
  friction?: number;     // 摩擦力 (default: 26)
  mass?: number;         // 质量 (default: 1)
  velocity?: number;     // 初始速度 (default: 0)
  precision?: number;    // 精度 (default: 0.01)
  duration?: number;     // 持续时间（覆盖物理模拟）
}

// 预设配置
import { config } from '@react-spring/web';

config.default      // 默认
config.gentle       // 温和
config.wobbly       // 摇晃
config.stiff        // 生硬
config.slow         // 缓慢
config.molasses     // 糖浆
config.slow         // 慢
```

### 插值器

```typescript
// 线性插值
const color = x.to([0, 100], ['rgb(0, 0, 0)', 'rgb(255, 255, 255)']);

// 范围插值
const opacity = scrollY.to([0, 200], [1, 0]);

// 自定义插值
const formatted = number.to((n) => `$${n.toFixed(2)}`);

// 多值插值
const transform = x.to((x) => `translateX(${x}px) rotate(${x / 10}deg)`);

// 链式插值
const value = x
  .to([0, 50, 100], [0, 1, 0])
  .to((v) => `rgba(0, 0, 0, ${v})`);
```

## 扩展资源

- [React Spring 官方文档](https://www.react-spring.dev/)
- [React Spring GitHub](https://github.com/pmndrs/react-spring)
- [Use Gesture](https://use-gesture.netlify.app/)
- [动画示例](https://www.react-spring.dev/examples)
- [物理弹簧指南](https://www.react-spring.dev/docs/advanced/spring-configs)
