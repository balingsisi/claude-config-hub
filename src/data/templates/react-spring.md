# React Spring 物理动画模板

## 技术栈

- **React Spring**: 9.x (物理动画库)
- **React**: 18.x
- **TypeScript**: 5.x
- **动画类型**: 弹簧动画、手势动画、页面转场
- **测试**: Vitest + @testing-library/react

## 项目结构

```
src/
├── animations/                # 动画配置
│   ├── springs/              # 弹簧配置
│   │   ├── presets.ts        # 预设配置
│   │   ├── custom.ts         # 自定义配置
│   │   └── index.ts          # 配置导出
│   ├── transitions/          # 转场动画
│   │   ├── page.ts           # 页面转场
│   │   ├── list.ts           # 列表动画
│   │   └── modal.ts          # 模态框动画
│   └── gestures/             # 手势动画
│       ├── drag.ts           # 拖拽动画
│       ├── swipe.ts          # 滑动动画
│       └── pinch.ts          # 缩放动画
├── hooks/                    # 自定义Hooks
│   ├── useSpring/            # 基础Spring
│   │   ├── index.ts
│   │   └── types.ts
│   ├── useTransition/        # 转场Hook
│   │   ├── index.ts
│   │   └── types.ts
│   ├── useTrail/             # 队列动画
│   ├── useChain/             # 链式动画
│   └── useGesture/           # 手势集成
├── components/               # 动画组件
│   ├── AnimatedList/         # 动画列表
│   ├── AnimatedModal/        # 动画模态框
│   ├── AnimatedPage/         # 页面转场
│   ├── DraggableCard/        # 可拖拽卡片
│   ├── SwipeableList/        # 可滑动列表
│   └── ParallaxScroll/       # 视差滚动
├── utils/                    # 工具函数
│   ├── interpolators.ts      # 插值器
│   ├── physics.ts            # 物理计算
│   └── timing.ts             # 时间控制
└── __tests__/               # 测试
    ├── hooks/
    ├── components/
    └── utils/
```

## 代码模式

### 基础弹簧动画

```typescript
// hooks/useSpring/index.ts
import { useSpring, SpringValue, SpringConfig } from '@react-spring/web';
import { UseSpringProps } from './types';

export type { UseSpringProps };

// 基础使用
function AnimatedComponent() {
  const [styles, api] = useSpring(() => ({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: { tension: 280, friction: 60 },
  }));

  return (
    <animated.div style={styles}>
      Fade in content
    </animated.div>
  );
}

// 动画控制
function ControlledAnimation() {
  const [styles, api] = useSpring(() => ({
    from: { scale: 1 },
    config: { mass: 1, tension: 180, friction: 12 },
  }));

  const handleMouseEnter = () => {
    api.start({ scale: 1.1 });
  };

  const handleMouseLeave = () => {
    api.start({ scale: 1 });
  };

  return (
    <animated.div
      style={{ transform: styles.scale.to(s => `scale(${s})`) }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      Hover me
    </animated.div>
  );
}

// 循环动画
function LoopAnimation() {
  const styles = useSpring({
    from: { rotate: 0 },
    to: { rotate: 360 },
    loop: true,
    config: { duration: 2000 },
  });

  return (
    <animated.div
      style={{
        transform: styles.rotate.to(r => `rotate(${r}deg)`),
      }}
    >
      Spinning
    </animated.div>
  );
}

// 脉冲动画
function PulseAnimation() {
  const styles = useSpring({
    from: { scale: 1, opacity: 1 },
    to: [
      { scale: 1.1, opacity: 0.8 },
      { scale: 1, opacity: 1 },
    ],
    loop: true,
    config: { duration: 1000 },
  });

  return (
    <animated.div style={{
      transform: styles.scale.to(s => `scale(${s})`),
      opacity: styles.opacity,
    }}>
      Pulsing
    </animated.div>
  );
}
```

### 预设弹簧配置

```typescript
// animations/springs/presets.ts
import { SpringConfig } from '@react-spring/web';

export const springPresets: Record<string, SpringConfig> = {
  // 弹性效果
  bouncy: { mass: 1, tension: 180, friction: 12 },
  
  // 快速响应
  snappy: { mass: 1, tension: 400, friction: 30 },
  
  // 平滑
  smooth: { mass: 1, tension: 120, friction: 14 },
  
  // 缓慢
  slow: { mass: 2, tension: 100, friction: 26 },
  
  // 僵硬
  stiff: { mass: 1, tension: 300, friction: 40 },
  
  // 柔软
  soft: { mass: 2, tension: 120, friction: 20 },
  
  // 橡皮筋
  rubberBand: { mass: 0.8, tension: 200, friction: 10 },
  
  // 惯性
  molasses: { mass: 5, tension: 50, friction: 20 },
  
  // 线性
  linear: { duration: 300 },
  
  // 缓入缓出
  easeInOut: { duration: 400 },
};

// animations/springs/custom.ts
import { SpringConfig } from '@react-spring/web';

// 创建自定义弹簧配置
export function createSpringConfig(options: {
  mass?: number;
  tension?: number;
  friction?: number;
  velocity?: number;
  precision?: number;
  duration?: number;
}): SpringConfig {
  if (options.duration) {
    return { duration: options.duration };
  }

  return {
    mass: options.mass ?? 1,
    tension: options.tension ?? 170,
    friction: options.friction ?? 26,
    velocity: options.velocity ?? 0,
    precision: options.precision ?? 0.01,
  };
}

// 基于物理特性的弹簧
export function createPhysicsSpring(options: {
  stiffness: number; // 刚度
  damping: number;   // 阻尼
  mass?: number;
}): SpringConfig {
  const { stiffness, damping, mass = 1 } = options;
  
  return {
    mass,
    tension: stiffness * 2,
    friction: damping * 2,
  };
}

// 根据距离计算弹簧参数
export function calculateSpringFromDistance(distance: number): SpringConfig {
  const distanceFactor = Math.min(Math.abs(distance) / 100, 2);
  
  return {
    mass: 1,
    tension: 180 + distanceFactor * 20,
    friction: 12 + distanceFactor * 5,
  };
}
```

### 列表动画（useTrail）

```typescript
// hooks/useTrail/index.ts
import { useTrail, SpringValue } from '@react-spring/web';
import { ReactNode, Children, isValidElement } from 'react';

interface TrailProps {
  children: ReactNode;
  config?: { mass?: number; tension?: number; friction?: number };
  delay?: number;
}

// 基础队列动画
export function Trail({ children, config, delay = 0 }: TrailProps) {
  const items = Children.toArray(children);
  
  const trail = useTrail(items.length, {
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: config ?? { mass: 1, tension: 280, friction: 20 },
    delay,
  });

  return (
    <>
      {trail.map((style, index) => (
        <animated.div key={index} style={style}>
          {items[index]}
        </animated.div>
      ))}
    </>
  );
}

// 使用示例
function AnimatedMenu() {
  const menuItems = ['Home', 'About', 'Services', 'Contact'];

  const trail = useTrail(menuItems.length, {
    from: { opacity: 0, x: -20 },
    to: { opacity: 1, x: 0 },
    config: { mass: 1, tension: 280, friction: 20 },
  });

  return (
    <nav>
      {trail.map((style, index) => (
        <animated.div
          key={index}
          style={{
            opacity: style.opacity,
            transform: style.x.to(x => `translateX(${x}px)`),
          }}
        >
          {menuItems[index]}
        </animated.div>
      ))}
    </nav>
  );
}

// 网格列表动画
function AnimatedGrid({ items }: { items: Array<{ id: string; title: string }> }) {
  const trail = useTrail(items.length, {
    from: { scale: 0, opacity: 0 },
    to: { scale: 1, opacity: 1 },
    config: { mass: 1, tension: 200, friction: 20 },
  });

  return (
    <div className="grid grid-cols-3 gap-4">
      {trail.map((style, index) => (
        <animated.div
          key={items[index].id}
          style={{
            transform: style.scale.to(s => `scale(${s})`),
            opacity: style.opacity,
          }}
        >
          {items[index].title}
        </animated.div>
      ))}
    </div>
  );
}
```

### 转场动画（useTransition）

```typescript
// animations/transitions/page.ts
import { useTransition, SpringValue } from '@react-spring/web';
import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
}

// 页面转场
export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();

  const transitions = useTransition(location, {
    keys: (location) => location.pathname,
    from: { opacity: 0, transform: 'translateX(100%)' },
    enter: { opacity: 1, transform: 'translateX(0%)' },
    leave: { opacity: 0, transform: 'translateX(-100%)' },
    config: { mass: 1, tension: 200, friction: 30 },
  });

  return transitions((style, item) => (
    <animated.div style={style} className="page">
      {children}
    </animated.div>
  ));
}

// animations/transitions/modal.ts
import { useTransition } from '@react-spring/web';

interface ModalTransitionProps {
  isOpen: boolean;
  children: ReactNode;
  onClose: () => void;
}

export function ModalTransition({ isOpen, children, onClose }: ModalTransitionProps) {
  const transitions = useTransition(isOpen, {
    from: { opacity: 0, scale: 0.9, y: -20 },
    enter: { opacity: 1, scale: 1, y: 0 },
    leave: { opacity: 0, scale: 0.9, y: -20 },
    config: { mass: 1, tension: 300, friction: 30 },
  });

  const backdropTransitions = useTransition(isOpen, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });

  return (
    <>
      {backdropTransitions((style, item) =>
        item && (
          <animated.div
            style={style}
            className="fixed inset-0 bg-black/50"
            onClick={onClose}
          />
        )
      )}
      {transitions((style, item) =>
        item && (
          <animated.div
            style={{
              opacity: style.opacity,
              transform: style.scale.to(
                (s) => `scale(${s}) translateY(${style.y.get()}px)`
              ),
            }}
            className="fixed inset-0 flex items-center justify-center"
          >
            {children}
          </animated.div>
        )
      )}
    </>
  );
}

// animations/transitions/list.ts
import { useTransition } from '@react-spring/web';

interface Item {
  id: string;
  text: string;
}

export function AnimatedList({ items }: { items: Item[] }) {
  const transitions = useTransition(items, {
    keys: (item) => item.id,
    from: { opacity: 0, height: 0, transform: 'translateX(-100%)' },
    enter: { opacity: 1, height: 60, transform: 'translateX(0%)' },
    leave: { opacity: 0, height: 0, transform: 'translateX(100%)' },
    config: { mass: 1, tension: 200, friction: 20 },
    trail: 50,
  });

  return (
    <div className="list">
      {transitions((style, item) => (
        <animated.div style={style} className="list-item">
          {item.text}
        </animated.div>
      ))}
    </div>
  );
}
```

### 手势集成

```typescript
// animations/gestures/drag.ts
import { useSpring, SpringValue } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';

interface DraggableProps {
  children: ReactNode;
  onDragEnd?: (x: number, y: number) => void;
}

export function Draggable({ children, onDragEnd }: DraggableProps) {
  const [style, api] = useSpring(() => ({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
  }));

  const bind = useDrag(
    ({ down, movement: [mx, my], velocity: [vx], direction: [dx] }) => {
      api.start({
        x: down ? mx : 0,
        y: down ? my : 0,
        scale: down ? 1.1 : 1,
        rotation: down ? mx * 0.1 : 0,
        config: { mass: 1, tension: 400, friction: 30 },
      });

      if (!down && Math.abs(mx) > 100) {
        onDragEnd?.(mx, my);
      }
    },
    { filterTaps: true }
  );

  return (
    <animated.div
      {...bind()}
      style={{
        transform: style.x.to(
          (x) =>
            `translateX(${x}px) translateY(${style.y.get()}px) scale(${style.scale.get()}) rotate(${style.rotation.get()}deg)`
        ),
        touchAction: 'none',
        cursor: 'grab',
      }}
    >
      {children}
    </animated.div>
  );
}

// animations/gestures/swipe.ts
import { useSpring } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';

interface SwipeableProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  children: ReactNode;
}

export function Swipeable({ onSwipeLeft, onSwipeRight, children }: SwipeableProps) {
  const [style, api] = useSpring(() => ({ x: 0 }));

  const bind = useDrag(
    ({ down, movement: [mx], velocity: [vx], direction: [dx] }) => {
      if (down) {
        api.start({ x: mx, immediate: true });
      } else {
        if (Math.abs(mx) > 100 || vx > 0.5) {
          if (dx > 0) {
            onSwipeRight?.();
          } else {
            onSwipeLeft?.();
          }
          api.start({ x: 0 });
        } else {
          api.start({ x: 0 });
        }
      }
    },
    { axis: 'x', filterTaps: true }
  );

  return (
    <animated.div
      {...bind()}
      style={{
        transform: style.x.to((x) => `translateX(${x}px)`),
        touchAction: 'pan-y',
      }}
    >
      {children}
    </animated.div>
  );
}

// 滑动删除组件
function SwipeToDelete({ id, text, onDelete }: { id: string; text: string; onDelete: (id: string) => void }) {
  const [style, api] = useSpring(() => ({ x: 0, opacity: 1 }));

  const bind = useDrag(({ down, movement: [mx], direction: [dx], velocity: [vx] }) => {
    if (down) {
      api.start({ x: mx, immediate: true });
    } else {
      if (mx < -100 || (dx < 0 && vx > 0.5)) {
        // 滑动删除
        api.start({
          x: -400,
          opacity: 0,
          onRest: () => onDelete(id),
        });
      } else {
        // 回弹
        api.start({ x: 0 });
      }
    }
  });

  return (
    <animated.div
      {...bind()}
      style={{
        transform: style.x.to((x) => `translateX(${x}px)`),
        opacity: style.opacity,
        touchAction: 'pan-y',
      }}
    >
      {text}
    </animated.div>
  );
}
```

### 链式动画（useChain）

```typescript
// hooks/useChain/index.ts
import { useChain, useSpring, useTrail, SpringRef } from '@react-spring/web';

// 链式动画示例
function ChainAnimation() {
  const springsRef = SpringRef();
  const trailRef = SpringRef();

  const [titleStyles, titleApi] = useSpring(() => ({
    ref: springsRef,
    from: { opacity: 0, y: -50 },
    to: { opacity: 1, y: 0 },
  }));

  const trail = useTrail(3, {
    ref: trailRef,
    from: { opacity: 0, x: -20 },
    to: { opacity: 1, x: 0 },
  });

  // 按顺序执行动画
  useChain([springsRef, trailRef], [0, 0.5]);

  return (
    <div>
      <animated.h1 style={titleStyles}>Welcome</animated.h1>
      {trail.map((style, index) => (
        <animated.div key={index} style={style}>
          Item {index + 1}
        </animated.div>
      ))}
    </div>
  );
}

// 复杂链式动画
function ComplexChainAnimation() {
  const firstRef = SpringRef();
  const secondRef = SpringRef();
  const thirdRef = SpringRef();

  const [first, firstApi] = useSpring(() => ({
    ref: firstRef,
    from: { scale: 0 },
    to: { scale: 1 },
  }));

  const [second, secondApi] = useSpring(() => ({
    ref: secondRef,
    from: { rotation: 0 },
    to: { rotation: 360 },
  }));

  const third = useTrail(5, {
    ref: thirdRef,
    from: { opacity: 0 },
    to: { opacity: 1 },
  });

  // 自定义时间轴
  useChain([firstRef, secondRef, thirdRef], [0, 0.3, 0.6]);

  return (
    <div>
      <animated.div style={{ transform: first.scale.to((s) => `scale(${s})`) }}>
        First
      </animated.div>
      <animated.div style={{ transform: second.rotation.to((r) => `rotate(${r}deg)`) }}>
        Second
      </animated.div>
      {third.map((style, i) => (
        <animated.div key={i} style={style}>
          Third {i}
        </animated.div>
      ))}
    </div>
  );
}
```

### 视差滚动

```typescript
// components/ParallaxScroll/index.tsx
import { useSpring, SpringValue } from '@react-spring/web';
import { useScroll, useTransform } from 'framer-motion';

interface ParallaxProps {
  children: ReactNode;
  offset?: number;
}

export function ParallaxLayer({ children, offset = 50 }: ParallaxProps) {
  const { scrollY } = useScroll();
  
  const y = useTransform(scrollY, [0, 1000], [0, offset]);
  
  return (
    <motion.div style={{ y }}>
      {children}
    </motion.div>
  );
}

// 使用 React Spring 实现视差
function ParallaxWithSpring({ children, offset = 50 }: ParallaxProps) {
  const [{ y }, api] = useSpring(() => ({ y: 0 }));

  useEffect(() => {
    const handleScroll = () => {
      api.start({ y: window.scrollY * (offset / 1000) });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [offset, api]);

  return (
    <animated.div style={{ transform: y.to((y) => `translateY(${y}px)`) }}>
      {children}
    </animated.div>
  );
}

// 多层视差
function MultiLayerParallax() {
  const { scrollY } = useScroll();

  const y1 = useTransform(scrollY, [0, 1000], [0, 100]);
  const y2 = useTransform(scrollY, [0, 1000], [0, 50]);
  const y3 = useTransform(scrollY, [0, 1000], [0, 25]);

  return (
    <div className="h-[200vh]">
      <motion.div
        style={{ y: y1 }}
        className="fixed top-0 left-0 w-full h-screen bg-blue-200"
      />
      <motion.div
        style={{ y: y2 }}
        className="fixed top-0 left-0 w-full h-screen flex items-center justify-center"
      >
        <h1>Parallax Content</h1>
      </motion.div>
      <motion.div
        style={{ y: y3 }}
        className="fixed top-0 left-0 w-full h-screen bg-blue-300/50"
      />
    </div>
  );
}
```

### 高级插值

```typescript
// utils/interpolators.ts
import { SpringValue, to } from '@react-spring/web';

// 颜色插值
export function interpolateColor(
  value: SpringValue<number>,
  color1: string,
  color2: string
) {
  return value.to({
    range: [0, 1],
    output: [color1, color2],
  });
}

// 多值插值
export function interpolateMultiple(
  value: SpringValue<number>,
  stops: Array<[number, any]>
) {
  return value.to({
    range: stops.map(([pos]) => pos),
    output: stops.map(([, val]) => val),
  });
}

// 字符串模板插值
export function interpolateTemplate(
  values: Record<string, SpringValue<number>>,
  template: string
) {
  const keys = Object.keys(values);
  const springValues = Object.values(values);

  return to(springValues, (...nums) => {
    let result = template;
    keys.forEach((key, i) => {
      result = result.replace(`{${key}}`, String(nums[i]));
    });
    return result;
  });
}

// 使用示例
function AdvancedInterpolation() {
  const [style] = useSpring(() => ({
    progress: 0,
    to: { progress: 1 },
    config: { duration: 2000 },
  }));

  return (
    <animated.div
      style={{
        backgroundColor: interpolateColor(style.progress, '#ff0000', '#0000ff'),
        transform: interpolateTemplate(
          { x: style.progress, y: style.progress },
          'translate({x}px, {y}px)'
        ),
        opacity: interpolateMultiple(style.progress, [
          [0, 0],
          [0.5, 0.5],
          [1, 1],
        ]),
      }}
    >
      Advanced Interpolation
    </animated.div>
  );
}
```

## 组件示例

```typescript
// components/AnimatedCard/index.tsx
import { useSpring } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';

interface AnimatedCardProps {
  title: string;
  description: string;
  image: string;
}

export function AnimatedCard({ title, description, image }: AnimatedCardProps) {
  const [style, api] = useSpring(() => ({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  }));

  const bind = useDrag(
    ({ down, movement: [mx, my], tap }) => {
      if (tap) return;

      api.start({
        x: down ? mx : 0,
        y: down ? my : 0,
        scale: down ? 1.05 : 1,
        rotation: down ? mx * 0.05 : 0,
        boxShadow: down
          ? '0 20px 40px rgba(0, 0, 0, 0.2)'
          : '0 4px 6px rgba(0, 0, 0, 0.1)',
        config: { mass: 1, tension: 400, friction: 30 },
      });
    },
    { filterTaps: true }
  );

  return (
    <animated.div
      {...bind()}
      style={{
        transform: style.x.to(
          (x) =>
            `translateX(${x}px) translateY(${style.y.get()}px) scale(${style.scale.get()}) rotate(${style.rotation.get()}deg)`
        ),
        boxShadow: style.boxShadow,
        touchAction: 'none',
      }}
      className="bg-white rounded-lg overflow-hidden cursor-grab"
    >
      <img src={image} alt={title} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </animated.div>
  );
}

// components/FlipCard/index.tsx
import { useSpring } from '@react-spring/web';

interface FlipCardProps {
  front: ReactNode;
  back: ReactNode;
}

export function FlipCard({ front, back }: FlipCardProps) {
  const [flipped, setFlipped] = useState(false);

  const { transform, opacity } = useSpring({
    opacity: flipped ? 1 : 0,
    transform: `rotateY(${flipped ? 180 : 0}deg)`,
    config: { mass: 1, tension: 200, friction: 20 },
  });

  return (
    <div onClick={() => setFlipped(!flipped)} className="cursor-pointer">
      <animated.div
        style={{
          opacity: opacity.to((o) => 1 - o),
          transform,
          position: 'absolute',
          backfaceVisibility: 'hidden',
        }}
      >
        {front}
      </animated.div>
      <animated.div
        style={{
          opacity,
          transform: transform.to((t) => `${t} rotateY(180deg)`),
          backfaceVisibility: 'hidden',
        }}
      >
        {back}
      </animated.div>
    </div>
  );
}
```

## 测试

```typescript
// __tests__/hooks/useSpring.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useSpring } from '@react-spring/web';

describe('useSpring', () => {
  it('should initialize with from values', () => {
    const { result } = renderHook(() =>
      useSpring(() => ({
        from: { opacity: 0 },
        to: { opacity: 1 },
      }))
    );

    const [style] = result.current;
    expect(style.opacity.get()).toBe(0);
  });

  it('should update values on api.start', async () => {
    const { result } = renderHook(() =>
      useSpring(() => ({
        from: { opacity: 0 },
      }))
    );

    const [, api] = result.current;

    act(() => {
      api.start({ opacity: 1 });
    });

    // Wait for animation to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    const [style] = result.current;
    expect(style.opacity.get()).toBeCloseTo(1, 1);
  });
});

// __tests__/components/AnimatedCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AnimatedCard } from '@/components/AnimatedCard';

describe('AnimatedCard', () => {
  it('should render card content', () => {
    render(
      <AnimatedCard
        title="Test Card"
        description="Test Description"
        image="test.jpg"
      />
    );

    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('should respond to drag gestures', async () => {
    const { container } = render(
      <AnimatedCard
        title="Test Card"
        description="Test Description"
        image="test.jpg"
      />
    );

    const card = container.firstChild;

    fireEvent.mouseDown(card);
    fireEvent.mouseMove(card, { clientX: 100, clientY: 50 });
    fireEvent.mouseUp(card);

    // Animation should trigger
    expect(card).toBeInTheDocument();
  });
});
```

## 配置文件

### package.json

```json
{
  "dependencies": {
    "@react-spring/web": "^9.7.0",
    "@react-spring/konva": "^9.7.0",
    "@react-spring/three": "^9.7.0",
    "@react-spring/zdog": "^9.7.0",
    "@use-gesture/react": "^10.3.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@types/react": "^18.2.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
```

## 最佳实践

1. **使用预设配置**: 复用弹簧配置保持动画一致性
2. **性能优化**: 使用 `immediate: true` 处理拖拽等连续更新
3. **手势集成**: 结合 `@use-gesture/react` 实现自然交互
4. **链式动画**: 使用 `useChain` 控制复杂动画序列
5. **类型安全**: 为动画值定义类型
6. **可访问性**: 考虑减少动画偏好设置
7. **内存管理**: 组件卸载时清理动画
8. **测试**: 使用 `vi.useFakeTimers()` 测试动画
9. **调试**: 使用 React DevTools 检查 Spring 值
10. **文档**: 为复杂动画添加注释说明
