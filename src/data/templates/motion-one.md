# Motion One 动画库模板

## 技术栈

- **核心库**: @motionone/dom v10+
- **动画 API**: Motion One Animation
- **时间线**: @motionone/timeline
- **动画曲线**: @motionone/easing
- **TypeScript**: 完整类型支持
- **框架集成**: @motionone/react, @motionone/vue
- **构建工具**: Vite, Webpack, Rollup

## 项目结构

```
src/
├── animations/
│   ├── presets/
│   │   ├── fade.ts           # 淡入淡出
│   │   ├── slide.ts          # 滑动动画
│   │   ├── scale.ts          # 缩放动画
│   │   └── rotate.ts         # 旋转动画
│   ├── sequences/
│   │   ├── hero.ts           # 英雄区域动画
│   │   ├── card.ts           # 卡片动画序列
│   │   └── modal.ts          # 模态框动画
│   ├── timeline/
│   │   ├── scroll.ts         # 滚动驱动时间线
│   │   └── sequence.ts       # 复杂序列
│   └── utils/
│       ├── easing.ts         # 缓动函数
│       └── helpers.ts        # 工具函数
├── components/
│   ├── MotionDiv.tsx         # React 包装组件
│   ├── AnimatedList.tsx      # 列表动画
│   └── ScrollReveal.tsx      # 滚动显示
├── hooks/
│   ├── useAnimation.ts       # 动画 Hook
│   ├── useScrollAnimation.ts # 滚动动画 Hook
│   └── useInView.ts          # 可见性检测
└── types/
    └── animation.d.ts        # 类型定义
```

## 代码模式

### 1. 基础动画

```typescript
// src/animations/presets/fade.ts
import { animate } from 'motion';

// 淡入
export const fadeIn = (element: Element, duration = 0.5) => {
  return animate(
    element,
    { opacity: [0, 1] },
    { duration, easing: 'ease-out' }
  );
};

// 淡出
export const fadeOut = (element: Element, duration = 0.5) => {
  return animate(
    element,
    { opacity: [1, 0] },
    { duration, easing: 'ease-in' }
  );
};

// 淡入淡出组合
export const fadeInOut = async (element: Element, stayDuration = 2) => {
  await fadeIn(element);
  await new Promise(resolve => setTimeout(resolve, stayDuration * 1000));
  await fadeOut(element);
};

// 使用示例
const element = document.querySelector('.box');
fadeIn(element).then(() => console.log('Animation complete'));
```

### 2. 变换动画

```typescript
// src/animations/presets/slide.ts
import { animate } from 'motion';

// 从左侧滑入
export const slideInLeft = (element: Element, duration = 0.6) => {
  return animate(
    element,
    {
      opacity: [0, 1],
      x: [-100, 0],
    },
    {
      duration,
      easing: [0.25, 0.46, 0.45, 0.94], // cubic-bezier
    }
  );
};

// 从右侧滑入
export const slideInRight = (element: Element, duration = 0.6) => {
  return animate(
    element,
    {
      opacity: [0, 1],
      x: [100, 0],
    },
    { duration, easing: 'ease-out' }
  );
};

// 从上方滑入
export const slideInTop = (element: Element, duration = 0.6) => {
  return animate(
    element,
    {
      opacity: [0, 1],
      y: [-100, 0],
    },
    { duration, easing: 'ease-out' }
  );
};

// 从下方滑入
export const slideInBottom = (element: Element, duration = 0.6) => {
  return animate(
    element,
    {
      opacity: [0, 1],
      y: [100, 0],
    },
    { duration, easing: 'ease-out' }
  );
};
```

### 3. 缩放与旋转

```typescript
// src/animations/presets/scale.ts
import { animate } from 'motion';

// 弹性缩放
export const scaleIn = (element: Element) => {
  return animate(
    element,
    {
      opacity: [0, 1],
      scale: [0, 1],
    },
    {
      duration: 0.5,
      easing: [0.34, 1.56, 0.64, 1], // 弹性效果
    }
  );
};

// 脉冲效果
export const pulse = (element: Element) => {
  return animate(
    element,
    {
      scale: [1, 1.05, 1],
    },
    {
      duration: 0.6,
      easing: 'ease-in-out',
    }
  );
};

// src/animations/presets/rotate.ts
import { animate } from 'motion';

// 旋转进入
export const rotateIn = (element: Element) => {
  return animate(
    element,
    {
      opacity: [0, 1],
      rotate: [-180, 0],
      scale: [0, 1],
    },
    {
      duration: 0.6,
      easing: [0.25, 0.46, 0.45, 0.94],
    }
  );
};

// 持续旋转
export const spin = (element: Element, duration = 1) => {
  return animate(
    element,
    { rotate: 360 },
    {
      duration,
      easing: 'linear',
      repeat: Infinity,
    }
  );
};
```

### 4. 时间线动画

```typescript
// src/animations/timeline/sequence.ts
import { timeline } from 'motion';

// 串行动画
export const heroAnimation = (elements: {
  title: Element;
  subtitle: Element;
  cta: Element;
}) => {
  return timeline([
    [elements.title, { opacity: [0, 1], y: [50, 0] }, { duration: 0.6 }],
    [elements.subtitle, { opacity: [0, 1], y: [30, 0] }, { duration: 0.5, at: '-0.3' }],
    [elements.cta, { opacity: [0, 1], scale: [0.8, 1] }, { duration: 0.4, at: '-0.2' }],
  ]);
};

// 并行动画
export const parallelAnimation = (elements: Element[]) => {
  return timeline(
    elements.map(el => [
      el,
      { opacity: [0, 1], scale: [0.5, 1] },
      { duration: 0.4 },
    ])
  );
};

// 交错动画
export const staggeredAnimation = (elements: NodeListOf<Element>) => {
  return timeline(
    Array.from(elements).map((el, index) => [
      el,
      { opacity: [0, 1], x: [50, 0] },
      {
        duration: 0.4,
        at: index === 0 ? 0 : `${(index - 1) * 0.1}`,
      },
    ])
  );
};
```

### 5. 滚动驱动动画

```typescript
// src/animations/timeline/scroll.ts
import { scroll, animate } from 'motion';

// 滚动进度动画
export const scrollProgress = (element: Element) => {
  return scroll(
    animate(element, {
      opacity: [0, 1, 1, 0],
      scale: [0.8, 1, 1, 0.8],
    }),
    {
      target: element,
      offset: ['start end', 'end start'],
    }
  );
};

// 视差滚动
export const parallaxScroll = (element: Element, speed = 0.5) => {
  return scroll(
    animate(element, {
      y: [0, -100 * speed],
    }),
    {
      offset: ['start end', 'end start'],
    }
  );
};

// 滚动触发动画
export const scrollReveal = (element: Element) => {
  return scroll(
    ({ y }) => {
      if (y.progress > 0.25 && y.progress < 0.75) {
        animate(element, { opacity: 1, scale: 1 }, { duration: 0.3 });
      } else {
        animate(element, { opacity: 0, scale: 0.95 }, { duration: 0.3 });
      }
    },
    {
      target: element,
      offset: ['start end', 'end start'],
    }
  );
};
```

### 6. React 集成

```typescript
// src/components/MotionDiv.tsx
import { useEffect, useRef } from 'react';
import { animate, AnimationControls } from 'motion';

interface MotionDivProps {
  children: React.ReactNode;
  initial?: Record<string, any>;
  animate?: Record<string, any>;
  transition?: {
    duration?: number;
    easing?: string | number[];
    delay?: number;
  };
  className?: string;
  style?: React.CSSProperties;
}

export function MotionDiv({
  children,
  initial = { opacity: 0 },
  animate: targetValues = { opacity: 1 },
  transition = { duration: 0.5 },
  className,
  style,
}: MotionDivProps) {
  const ref = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimationControls>();

  useEffect(() => {
    if (ref.current) {
      // 设置初始状态
      Object.assign(ref.current.style, initial);
      
      // 执行动画
      animationRef.current = animate(ref.current, targetValues, transition);
    }

    return () => {
      animationRef.current?.stop();
    };
  }, []);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}

// 使用示例
function Hero() {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, easing: 'ease-out' }}
    >
      <h1>Welcome</h1>
    </MotionDiv>
  );
}
```

### 7. React Hooks

```typescript
// src/hooks/useAnimation.ts
import { useEffect, useRef } from 'react';
import { animate, AnimationControls } from 'motion';

export function useAnimation(
  keyframes: Record<string, any[]>,
  options: {
    duration?: number;
    easing?: string | number[];
    delay?: number;
    repeat?: number;
  } = {}
) {
  const ref = useRef<HTMLElement>(null);
  const animationRef = useRef<AnimationControls>();

  const play = () => {
    if (ref.current) {
      animationRef.current = animate(ref.current, keyframes, options);
    }
  };

  const stop = () => {
    animationRef.current?.stop();
  };

  const finish = () => {
    animationRef.current?.finish();
  };

  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  return { ref, play, stop, finish };
}

// 使用示例
function Card() {
  const { ref, play } = useAnimation(
    {
      opacity: [0, 1],
      scale: [0.8, 1],
      y: [50, 0],
    },
    { duration: 0.6 }
  );

  return (
    <div ref={ref} onMouseEnter={play}>
      Hover me
    </div>
  );
}

// src/hooks/useScrollAnimation.ts
import { useEffect, useRef } from 'react';
import { scroll, animate } from 'motion';

export function useScrollAnimation(
  keyframes: Record<string, any[]>,
  options: {
    offset?: [string, string];
    target?: HTMLElement;
  } = {}
) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current) {
      const cleanup = scroll(animate(ref.current, keyframes), {
        target: options.target || ref.current,
        offset: options.offset || ['start end', 'end start'],
      });

      return cleanup;
    }
  }, []);

  return ref;
}

// 使用示例
function ScrollReveal() {
  const ref = useScrollAnimation(
    { opacity: [0, 1], y: [100, 0] },
    { offset: ['start end', 'center center'] }
  );

  return <div ref={ref}>Reveal on scroll</div>;
}
```

### 8. 列表动画

```typescript
// src/components/AnimatedList.tsx
import { useEffect, useRef } from 'react';
import { stagger, animate } from 'motion';

interface AnimatedListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  animation?: Record<string, any[]>;
}

export function AnimatedList({
  children,
  staggerDelay = 0.1,
  animation = { opacity: [0, 1], y: [20, 0] },
}: AnimatedListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      const items = listRef.current.children;
      
      animate(
        items,
        animation,
        {
          delay: stagger(staggerDelay),
          duration: 0.4,
          easing: 'ease-out',
        }
      );
    }
  }, [children]);

  return (
    <div ref={listRef}>
      {children.map((child, index) => (
        <div key={index}>{child}</div>
      ))}
    </div>
  );
}

// 使用示例
function TodoList({ todos }: { todos: string[] }) {
  return (
    <AnimatedList staggerDelay={0.05}>
      {todos.map((todo, index) => (
        <div key={index}>{todo}</div>
      ))}
    </AnimatedList>
  );
}
```

## 最佳实践

### 1. 性能优化

```typescript
// ✅ 使用 transform 和 opacity（GPU 加速）
animate(element, {
  transform: ['translateX(0px)', 'translateX(100px)'],
  opacity: [0, 1],
});

// ❌ 避免触发 layout 的属性
animate(element, {
  width: ['100px', '200px'],  // 触发 layout
  height: ['100px', '200px'], // 触发 layout
});

// ✅ 使用 will-change 提示浏览器
element.style.willChange = 'transform, opacity';
animate(element, { transform: 'scale(1.1)' });
```

### 2. 缓动函数选择

```typescript
// 标准缓动
const easings = {
  linear: 'linear',
  easeIn: [0.4, 0, 1, 1],
  easeOut: [0, 0, 0.2, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  
  // 弹性
  spring: [0.34, 1.56, 0.64, 1],
  
  // 平滑
  smooth: [0.25, 0.46, 0.45, 0.94],
};

// 使用
animate(element, { opacity: [0, 1] }, { easing: easings.easeOut });
```

### 3. 可访问性

```typescript
// ✅ 尊重 prefers-reduced-motion
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

if (!prefersReducedMotion) {
  animate(element, { opacity: [0, 1] }, { duration: 0.5 });
} else {
  element.style.opacity = '1';
}

// ✅ 提供 CSS 回退
.element {
  opacity: 1;
  transition: opacity 0.3s ease;
}

@supports (animation: fadeIn 0.3s) {
  .element {
    animation: fadeIn 0.3s ease;
  }
}
```

### 4. 内存管理

```typescript
// ✅ 清理动画实例
useEffect(() => {
  const animation = animate(element, { opacity: 1 });
  
  return () => {
    animation.stop();
  };
}, []);

// ✅ 取消滚动监听
useEffect(() => {
  const cleanup = scroll(animate(element, { opacity: [0, 1] }));
  
  return cleanup;
}, []);
```

### 5. 代码组织

```typescript
// ✅ 动画配置集中管理
const animations = {
  fadeIn: {
    keyframes: { opacity: [0, 1] },
    options: { duration: 0.5, easing: 'ease-out' },
  },
  slideIn: {
    keyframes: { opacity: [0, 1], x: [-100, 0] },
    options: { duration: 0.6, easing: [0.25, 0.46, 0.45, 0.94] },
  },
};

// 使用
const { keyframes, options } = animations.fadeIn;
animate(element, keyframes, options);
```

## 常用命令

```bash
# 安装核心库
npm install @motionone/dom

# 安装 React 绑定
npm install @motionone/dom @motionone/react

# 安装时间线
npm install @motionone/timeline

# 安装所有包
npm install motion

# 开发
npm run dev

# 构建
npm run build

# 类型检查
npm run type-check
```

## 配置选项

### 动画选项

```typescript
interface AnimationOptions {
  duration?: number;           // 持续时间（秒）
  easing?: string | number[];  // 缓动函数
  delay?: number;              // 延迟（秒）
  repeat?: number;             // 重复次数
  direction?: 'normal' | 'alternate' | 'reverse';
  fill?: 'none' | 'forwards' | 'backwards' | 'both';
}
```

### 滚动选项

```typescript
interface ScrollOptions {
  target?: Element;            // 目标元素
  offset?: [string, string];   // 滚动范围
  smooth?: boolean;            // 平滑滚动
}
```

## 扩展资源

- [Motion One 官方文档](https://motion.dev/)
- [Motion One GitHub](https://github.com/motiondivision/motionone)
- [动画示例](https://motion.dev/examples)
- [性能指南](https://motion.dev/docs/performance)
- [React 集成](https://motion.dev/docs/react)
