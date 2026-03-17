# UseGesture 手势处理模板

## 技术栈

- **@use-gesture/react**: React 手势处理库
- **React Spring**: 动画库（推荐）
- **Framer Motion**: 动画库（可选）
- **TypeScript**: 类型支持
- **Vite**: 构建工具
- **Tailwind CSS**: 样式方案

## 项目结构

```
use-gesture/
├── src/
│   ├── components/
│   │   ├── gestures/
│   │   │   ├── Draggable.tsx
│   │   │   ├── Swipeable.tsx
│   │   │   ├── Pinchable.tsx
│   │   │   ├── Rotatable.tsx
│   │   │   ├── LongPress.tsx
│   │   │   ├── Hover.tsx
│   │   │   └── Wheel.tsx
│   │   ├── interactive/
│   │   │   ├── Card.tsx
│   │   │   ├── Gallery.tsx
│   │   │   ├── Slider.tsx
│   │   │   ├── ImageViewer.tsx
│   │   │   └── Drawer.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       └── Container.tsx
│   ├── hooks/
│   │   ├── useDrag.ts
│   │   ├── useSwipe.ts
│   │   ├── usePinch.ts
│   │   ├── useRotate.ts
│   │   └── useGesture.ts
│   ├── utils/
│   │   ├── gestureHelpers.ts
│   │   └── math.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 代码模式

### 基础手势组件

```typescript
// src/components/gestures/Draggable.tsx
import React, { useRef } from 'react';
import { useDrag } from '@use-gesture/react';
import { useSpring, animated } from '@react-spring/web';

interface DraggableProps {
  children: React.ReactNode;
  onDragStart?: () => void;
  onDragEnd?: (position: { x: number; y: number }) => void;
  bounds?: { left: number; right: number; top: number; bottom: number };
  className?: string;
}

export const Draggable: React.FC<DraggableProps> = ({
  children,
  onDragStart,
  onDragEnd,
  bounds,
  className = '',
}) => {
  const [{ x, y }, api] = useSpring(() => ({ x: 0, y: 0 }));
  const lastPosition = useRef({ x: 0, y: 0 });

  const bind = useDrag(
    ({ active, movement: [mx, my], memo = lastPosition.current }) => {
      if (active) {
        let newX = memo.x + mx;
        let newY = memo.y + my;

        // 边界约束
        if (bounds) {
          newX = Math.max(bounds.left, Math.min(bounds.right, newX));
          newY = Math.max(bounds.top, Math.min(bounds.bottom, newY));
        }

        api.start({ x: newX, y: newY, immediate: true });
      } else {
        lastPosition.current = { x: x.get(), y: y.get() };
        onDragEnd?.({ x: x.get(), y: y.get() });
      }

      return memo;
    },
    {
      onStart: onDragStart,
      filterTaps: true,
    }
  );

  return (
    <animated.div
      {...bind()}
      style={{ x, y, touchAction: 'none' }}
      className={`cursor-grab active:cursor-grabbing ${className}`}
    >
      {children}
    </animated.div>
  );
};
```

```typescript
// src/components/gestures/Swipeable.tsx
import React from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';

interface SwipeableProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
}

export const Swipeable: React.FC<SwipeableProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 100,
  className = '',
}) => {
  const [{ x, y }, api] = useSpring(() => ({ x: 0, y: 0 }));

  const bind = useDrag(
    ({ movement: [mx, my], direction: [dx, dy], velocity: [vx, vy] }) => {
      // 根据移动距离和方向判断滑动方向
      if (Math.abs(mx) > threshold && Math.abs(vx) > 0.5) {
        if (dx > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
        api.start({ x: 0, y: 0 });
      } else if (Math.abs(my) > threshold && Math.abs(vy) > 0.5) {
        if (dy > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
        api.start({ x: 0, y: 0 });
      } else {
        api.start({ x: 0, y: 0 });
      }
    },
    {
      filterTaps: true,
    }
  );

  return (
    <animated.div
      {...bind()}
      style={{ x, y, touchAction: 'none' }}
      className={className}
    >
      {children}
    </animated.div>
  );
};
```

```typescript
// src/components/gestures/Pinchable.tsx
import React from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useGesture } from '@use-gesture/react';

interface PinchableProps {
  children: React.ReactNode;
  minScale?: number;
  maxScale?: number;
  className?: string;
}

export const Pinchable: React.FC<PinchableProps> = ({
  children,
  minScale = 0.5,
  maxScale = 3,
  className = '',
}) => {
  const [{ scale }, api] = useSpring(() => ({ scale: 1 }));

  const bind = useGesture(
    {
      onPinch: ({ offset: [s], memo = scale.get() }) => {
        const newScale = Math.max(minScale, Math.min(maxScale, s));
        api.start({ scale: newScale });
        return memo;
      },
    },
    {
      target: undefined,
      eventOptions: { passive: false },
    }
  );

  return (
    <animated.div
      {...bind()}
      style={{ scale, touchAction: 'none' }}
      className={className}
    >
      {children}
    </animated.div>
  );
};
```

```typescript
// src/components/gestures/Rotatable.tsx
import React from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';

interface RotatableProps {
  children: React.ReactNode;
  onRotate?: (angle: number) => void;
  className?: string;
}

export const Rotatable: React.FC<RotatableProps> = ({
  children,
  onRotate,
  className = '',
}) => {
  const [{ rotation }, api] = useSpring(() => ({ rotation: 0 }));

  const bind = useDrag(({ movement: [mx], memo = rotation.get() }) => {
    const newRotation = memo + mx;
    api.start({ rotation: newRotation });
    onRotate?.(newRotation);
    return memo;
  });

  return (
    <animated.div
      {...bind()}
      style={{ rotate: rotation, touchAction: 'none' }}
      className={`cursor-grab ${className}`}
    >
      {children}
    </animated.div>
  );
};
```

```typescript
// src/components/gestures/LongPress.tsx
import React, { useState } from 'react';
import { useLongPress } from '@use-gesture/react';

interface LongPressProps {
  children: React.ReactNode;
  onLongPress: () => void;
  duration?: number;
  className?: string;
}

export const LongPress: React.FC<LongPressProps> = ({
  children,
  onLongPress,
  duration = 500,
  className = '',
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const bind = useLongPress(
    () => {
      onLongPress();
      setIsPressed(false);
    },
    {
      threshold: duration,
      onStart: () => setIsPressed(true),
      onCancel: () => setIsPressed(false),
    }
  );

  return (
    <div
      {...bind()}
      className={`${className} ${isPressed ? 'opacity-70' : ''}`}
    >
      {children}
    </div>
  );
};
```

```typescript
// src/components/gestures/Hover.tsx
import React, { useState } from 'react';
import { useHover, useMove } from '@use-gesture/react';
import { useSpring, animated } from '@react-spring/web';

interface HoverProps {
  children: React.ReactNode;
  onHover?: (isHovering: boolean) => void;
  onMove?: (position: { x: number; y: number }) => void;
  className?: string;
}

export const Hover: React.FC<HoverProps> = ({
  children,
  onHover,
  onMove,
  className = '',
}) => {
  const [{ scale, background }, api] = useSpring(() => ({
    scale: 1,
    background: '#4a90e2',
  }));

  const bind = useHover(({ active }) => {
    api.start({
      scale: active ? 1.05 : 1,
      background: active ? '#ff6b6b' : '#4a90e2',
    });
    onHover?.(active);
  });

  const bindMove = useMove(({ xy: [x, y] }) => {
    onMove?.({ x, y });
  });

  return (
    <animated.div
      {...bind()}
      {...bindMove()}
      style={{ scale, background }}
      className={className}
    >
      {children}
    </animated.div>
  );
};
```

```typescript
// src/components/gestures/Wheel.tsx
import React from 'react';
import { useWheel } from '@use-gesture/react';
import { useSpring, animated } from '@react-spring/web';

interface WheelProps {
  children: React.ReactNode;
  onScroll?: (delta: number) => void;
  className?: string;
}

export const Wheel: React.FC<WheelProps> = ({
  children,
  onScroll,
  className = '',
}) => {
  const [{ y }, api] = useSpring(() => ({ y: 0 }));

  const bind = useWheel(({ delta: [, dy] }) => {
    api.start({ y: y.get() + dy * 2 });
    onScroll?.(dy);
  });

  return (
    <animated.div
      {...bind()}
      style={{ y }}
      className={`overflow-auto ${className}`}
    >
      {children}
    </animated.div>
  );
};
```

### 交互式组件

```typescript
// src/components/interactive/Card.tsx
import React from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';

interface CardProps {
  title: string;
  description: string;
  image: string;
  onSwipe?: (direction: 'left' | 'right') => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  description,
  image,
  onSwipe,
}) => {
  const [{ x, y, rotate, scale }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
  }));

  const bind = useDrag(
    ({ active, movement: [mx, my], direction: [xDir], velocity: [vx] }) => {
      if (active) {
        api.start({
          x: mx,
          y: my,
          rotate: mx * 0.1,
          scale: 1.05,
          immediate: true,
        });
      } else {
        // 如果滑动速度足够快，触发滑动事件
        if (Math.abs(vx) > 0.5 && Math.abs(mx) > 100) {
          const direction = xDir > 0 ? 'right' : 'left';
          api.start({
            x: xDir > 0 ? 500 : -500,
            rotate: xDir > 0 ? 45 : -45,
          });
          onSwipe?.(direction);
        } else {
          // 否则返回原位
          api.start({ x: 0, y: 0, rotate: 0, scale: 1 });
        }
      }
    },
    { filterTaps: true }
  );

  return (
    <animated.div
      {...bind()}
      style={{ x, y, rotate, scale, touchAction: 'none' }}
      className="w-80 h-96 bg-white rounded-2xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing"
    >
      <img src={image} alt={title} className="w-full h-48 object-cover" />
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </animated.div>
  );
};
```

```typescript
// src/components/interactive/Gallery.tsx
import React, { useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';

interface GalleryProps {
  images: string[];
}

export const Gallery: React.FC<GalleryProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [{ x }, api] = useSpring(() => ({ x: 0 }));

  const bind = useDrag(
    ({ movement: [mx], direction: [xDir], velocity: [vx], active }) => {
      if (active) {
        api.start({ x: mx, immediate: true });
      } else {
        if (Math.abs(vx) > 0.5 && Math.abs(mx) > 50) {
          const newIndex =
            xDir > 0
              ? Math.max(0, currentIndex - 1)
              : Math.min(images.length - 1, currentIndex + 1);
          setCurrentIndex(newIndex);
          api.start({ x: 0 });
        } else {
          api.start({ x: 0 });
        }
      }
    },
    { axis: 'x', filterTaps: true }
  );

  return (
    <div className="relative w-full h-96 overflow-hidden">
      <animated.div
        {...bind()}
        style={{ x }}
        className="absolute inset-0 flex items-center justify-center touch-pan-y"
      >
        <img
          src={images[currentIndex]}
          alt={`Slide ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />
      </animated.div>
      
      {/* 指示器 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {images.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full ${
              index === currentIndex ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
```

```typescript
// src/components/interactive/Slider.tsx
import React, { useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';

interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
}

export const Slider: React.FC<SliderProps> = ({
  min = 0,
  max = 100,
  step = 1,
  defaultValue = 50,
  onChange,
}) => {
  const [value, setValue] = useState(defaultValue);
  const [{ x }, api] = useSpring(() => ({ x: 0 }));

  const percentage = ((value - min) / (max - min)) * 100;

  const bind = useDrag(
    ({ movement: [mx], memo = value }) => {
      const sliderWidth = 300; // 滑块宽度
      const newValue = memo + (mx / sliderWidth) * (max - min);
      const clampedValue = Math.max(min, Math.min(max, newValue));
      const steppedValue = Math.round(clampedValue / step) * step;
      
      setValue(steppedValue);
      onChange?.(steppedValue);
      
      return memo;
    },
    { axis: 'x' }
  );

  return (
    <div className="w-80">
      <div className="relative h-2 bg-gray-300 rounded-full">
        <div
          className="absolute h-full bg-blue-500 rounded-full"
          style={{ width: `${percentage}%` }}
        />
        <animated.div
          {...bind()}
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-2 border-blue-500 rounded-full cursor-grab active:cursor-grabbing shadow-lg"
          style={{
            left: `${percentage}%`,
            transform: 'translate(-50%, -50%)',
            x,
          }}
        />
      </div>
      <div className="mt-2 text-center text-sm text-gray-600">
        {value}
      </div>
    </div>
  );
};
```

```typescript
// src/components/interactive/ImageViewer.tsx
import React from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useGesture } from '@use-gesture/react';

interface ImageViewerProps {
  src: string;
  alt?: string;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ src, alt = '' }) => {
  const [{ x, y, scale, rotate }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
  }));

  const bind = useGesture({
    onDrag: ({ offset: [mx, my] }) => {
      api.start({ x: mx, y: my });
    },
    onPinch: ({ offset: [s] }) => {
      api.start({ scale: Math.max(0.5, Math.min(3, s)) });
    },
    onWheel: ({ offset: [, rotation] }) => {
      api.start({ rotate: rotation });
    },
  });

  const resetTransform = () => {
    api.start({ x: 0, y: 0, scale: 1, rotate: 0 });
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <animated.div
        {...bind()}
        style={{
          x,
          y,
          scale,
          rotate,
          touchAction: 'none',
        }}
        className="absolute inset-0 flex items-center justify-center cursor-move"
      >
        <img src={src} alt={alt} className="max-w-full max-h-full" />
      </animated.div>
      
      <button
        onClick={resetTransform}
        className="absolute top-4 right-4 px-4 py-2 bg-white rounded-lg shadow-lg"
      >
        重置
      </button>
    </div>
  );
};
```

```typescript
// src/components/interactive/Drawer.tsx
import React from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position?: 'left' | 'right' | 'bottom';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  children,
  position = 'left',
}) => {
  const [{ x, y }, api] = useSpring(() => ({
    x: position === 'left' ? -300 : position === 'right' ? 300 : 0,
    y: position === 'bottom' ? 300 : 0,
  }));

  React.useEffect(() => {
    if (isOpen) {
      api.start({ x: 0, y: 0 });
    } else {
      api.start({
        x: position === 'left' ? -300 : position === 'right' ? 300 : 0,
        y: position === 'bottom' ? 300 : 0,
      });
    }
  }, [isOpen, position, api]);

  const bind = useDrag(
    ({ movement: [mx, my], direction: [xDir, yDir], velocity: [vx, vy] }) => {
      const threshold = 100;
      
      if (position === 'left' && xDir < 0 && mx < -threshold) {
        onClose();
      } else if (position === 'right' && xDir > 0 && mx > threshold) {
        onClose();
      } else if (position === 'bottom' && yDir > 0 && my > threshold) {
        onClose();
      } else {
        api.start({ x: 0, y: 0 });
      }
    },
    { filterTaps: true }
  );

  const positionStyles = {
    left: 'top-0 left-0 h-full w-80',
    right: 'top-0 right-0 h-full w-80',
    bottom: 'bottom-0 left-0 w-full h-96',
  };

  return (
    <animated.div
      {...bind()}
      style={{
        x: position === 'bottom' ? 0 : x,
        y: position === 'bottom' ? y : 0,
      }}
      className={`fixed ${positionStyles[position]} bg-white shadow-2xl touch-pan-y`}
    >
      <div className="p-6">{children}</div>
    </animated.div>
  );
};
```

### 自定义 Hooks

```typescript
// src/hooks/useDrag.ts
import { useDrag as useGestureDrag } from '@use-gesture/react';
import { useSpring } from '@react-spring/web';
import { useCallback } from 'react';

export function useCustomDrag(
  options: {
    bounds?: { left: number; right: number; top: number; bottom: number };
    onDragStart?: () => void;
    onDragEnd?: (position: { x: number; y: number }) => void;
  } = {}
) {
  const [{ x, y }, api] = useSpring(() => ({ x: 0, y: 0 }));

  const bind = useGestureDrag(
    ({ active, movement: [mx, my], memo = { x: x.get(), y: y.get() }) => {
      if (active) {
        let newX = memo.x + mx;
        let newY = memo.y + my;

        if (options.bounds) {
          newX = Math.max(options.bounds.left, Math.min(options.bounds.right, newX));
          newY = Math.max(options.bounds.top, Math.min(options.bounds.bottom, newY));
        }

        api.start({ x: newX, y: newY, immediate: true });
      } else {
        options.onDragEnd?.({ x: x.get(), y: y.get() });
      }

      return memo;
    },
    {
      onStart: options.onDragStart,
      filterTaps: true,
    }
  );

  const reset = useCallback(() => {
    api.start({ x: 0, y: 0 });
  }, [api]);

  return { bind, x, y, reset };
}
```

```typescript
// src/hooks/useSwipe.ts
import { useDrag } from '@use-gesture/react';
import { useCallback } from 'react';

type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export function useSwipe(
  onSwipe: (direction: SwipeDirection) => void,
  options: {
    threshold?: number;
    velocity?: number;
  } = {}
) {
  const { threshold = 100, velocity = 0.5 } = options;

  const bind = useDrag(
    ({ movement: [mx, my], direction: [xDir, yDir], velocity: [vx, vy] }) => {
      if (Math.abs(mx) > threshold && Math.abs(vx) > velocity) {
        onSwipe(xDir > 0 ? 'right' : 'left');
      } else if (Math.abs(my) > threshold && Math.abs(vy) > velocity) {
        onSwipe(yDir > 0 ? 'down' : 'up');
      }
    },
    { filterTaps: true }
  );

  return bind;
}
```

```typescript
// src/hooks/usePinch.ts
import { useGesture } from '@use-gesture/react';
import { useSpring } from '@react-spring/web';

export function usePinch(
  options: {
    minScale?: number;
    maxScale?: number;
    onScale?: (scale: number) => void;
  } = {}
) {
  const { minScale = 0.5, maxScale = 3, onScale } = options;
  const [{ scale }, api] = useSpring(() => ({ scale: 1 }));

  const bind = useGesture({
    onPinch: ({ offset: [s] }) => {
      const clampedScale = Math.max(minScale, Math.min(maxScale, s));
      api.start({ scale: clampedScale });
      onScale?.(clampedScale);
    },
  });

  const reset = () => {
    api.start({ scale: 1 });
  };

  return { bind, scale, reset };
}
```

```typescript
// src/hooks/useRotate.ts
import { useGesture } from '@use-gesture/react';
import { useSpring } from '@react-spring/web';

export function useRotate(
  options: {
    onRotate?: (angle: number) => void;
  } = {}
) {
  const [{ rotation }, api] = useSpring(() => ({ rotation: 0 }));

  const bind = useGesture({
    onDrag: ({ movement: [mx], memo = rotation.get() }) => {
      const newRotation = memo + mx;
      api.start({ rotation: newRotation });
      options.onRotate?.(newRotation);
      return memo;
    },
  });

  const reset = () => {
    api.start({ rotation: 0 });
  };

  return { bind, rotation, reset };
}
```

```typescript
// src/hooks/useGesture.ts
import { useGesture } from '@use-gesture/react';
import { useSpring } from '@react-spring/web';
import { useCallback } from 'react';

interface GestureOptions {
  onDrag?: (position: { x: number; y: number }) => void;
  onPinch?: (scale: number) => void;
  onRotate?: (angle: number) => void;
  onScroll?: (delta: number) => void;
  onHover?: (isHovering: boolean) => void;
}

export function useGestures(options: GestureOptions = {}) {
  const [{ x, y, scale, rotation }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
  }));

  const bind = useGesture({
    onDrag: ({ offset: [mx, my] }) => {
      api.start({ x: mx, y: my });
      options.onDrag?.({ x: mx, y: my });
    },
    onPinch: ({ offset: [s] }) => {
      api.start({ scale: Math.max(0.5, Math.min(3, s)) });
      options.onPinch?.(s);
    },
    onRotate: ({ offset: [r] }) => {
      api.start({ rotation: r });
      options.onRotate?.(r);
    },
    onWheel: ({ offset: [, y] }) => {
      options.onScroll?.(y);
    },
    onHover: ({ active }) => {
      options.onHover?.(active);
    },
  });

  const reset = useCallback(() => {
    api.start({ x: 0, y: 0, scale: 1, rotation: 0 });
  }, [api]);

  return { bind, x, y, scale, rotation, reset };
}
```

### 工具函数

```typescript
// src/utils/gestureHelpers.ts
export function getSwipeDirection(
  dx: number,
  dy: number,
  threshold: number = 50
): 'left' | 'right' | 'up' | 'down' | null {
  if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
    return null;
  }

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  } else {
    return dy > 0 ? 'down' : 'up';
  }
}

export function getDistance(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function getAngle(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

export function isMultiTouch(event: TouchEvent): boolean {
  return event.touches.length > 1;
}

export function getTouchPoints(event: TouchEvent): Array<{ x: number; y: number }> {
  return Array.from(event.touches).map((touch) => ({
    x: touch.clientX,
    y: touch.clientY,
  }));
}
```

```typescript
// src/utils/math.ts
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}
```

### 类型定义

```typescript
// src/types/index.ts
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface GestureState {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface GestureOptions {
  threshold?: number;
  velocity?: number;
  bounds?: Bounds;
  filterTaps?: boolean;
  rubberBand?: boolean;
}

export interface DragState {
  active: boolean;
  movement: [number, number];
  velocity: [number, number];
  direction: [number, number];
  xy: [number, number];
  initial: [number, number];
  offset: [number, number];
}

export interface PinchState {
  active: boolean;
  da: [number, number];
  offset: [number, number];
  movement: [number, number];
}

export interface WheelState {
  active: boolean;
  movement: [number, number];
  delta: [number, number];
  offset: [number, number];
}
```

### 主应用

```typescript
// src/App.tsx
import React, { useState } from 'react';
import { Draggable } from './components/gestures/Draggable';
import { Swipeable } from './components/gestures/Swipeable';
import { Pinchable } from './components/gestures/Pinchable';
import { Card } from './components/interactive/Card';
import { Gallery } from './components/interactive/Gallery';
import { Slider } from './components/interactive/Slider';
import { Drawer } from './components/interactive/Drawer';

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);

  const images = [
    'https://picsum.photos/800/600?random=1',
    'https://picsum.photos/800/600?random=2',
    'https://picsum.photos/800/600?random=3',
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8">UseGesture Demo</h1>

      {/* Draggable */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Draggable</h2>
        <Draggable className="inline-block">
          <div className="w-32 h-32 bg-blue-500 rounded-lg shadow-lg" />
        </Draggable>
      </section>

      {/* Swipeable */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Swipeable</h2>
        <Swipeable
          onSwipeLeft={() => console.log('Swiped left')}
          onSwipeRight={() => console.log('Swiped right')}
        >
          <div className="w-64 h-32 bg-green-500 rounded-lg shadow-lg flex items-center justify-center text-white">
            Swipe me
          </div>
        </Swipeable>
      </section>

      {/* Pinchable */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Pinchable</h2>
        <Pinchable className="inline-block">
          <img
            src="https://picsum.photos/400/300"
            alt="Pinchable"
            className="rounded-lg shadow-lg"
          />
        </Pinchable>
      </section>

      {/* Slider */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Slider</h2>
        <Slider value={sliderValue} onChange={setSliderValue} />
      </section>

      {/* Gallery */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Gallery</h2>
        <Gallery images={images} />
      </section>

      {/* Drawer */}
      <section className="mb-12">
        <button
          onClick={() => setDrawerOpen(true)}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg"
        >
          Open Drawer
        </button>
        <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <h2 className="text-xl font-bold mb-4">Drawer Content</h2>
          <p>Swipe left to close</p>
        </Drawer>
      </section>
    </div>
  );
}

export default App;
```

## 最佳实践

### 1. 性能优化

```typescript
// 使用 immediate: true 避免动画延迟
api.start({ x: 100, immediate: true });

// 使用 filterTaps 过滤点击事件
useDrag(() => {}, { filterTaps: true });

// 使用 axis 限制手势方向
useDrag(() => {}, { axis: 'x' });

// 使用 rubberBand 效果
useDrag(() => {}, { rubberBand: true });
```

### 2. 可访问性

```typescript
// 为手势提供替代交互方式
<div
  {...bind()}
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      // 键盘激活
    }
  }}
>
  Draggable element
</div>
```

### 3. 触摸优化

```typescript
// 设置 touchAction 防止浏览器默认行为
<div {...bind()} style={{ touchAction: 'none' }}>

// 设置 passove: false 允许 preventDefault
useGesture(() => {}, { eventOptions: { passive: false } });
```

## 常用命令

```bash
# 安装依赖
npm install @use-gesture/react @react-spring/web

# 开发模式
npm run dev

# 构建
npm run build

# 测试
npm run test
```

## 部署配置

### package.json

```json
{
  "dependencies": {
    "@use-gesture/react": "^10.3.0",
    "@react-spring/web": "^9.7.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
});
```

## 参考资源

- [UseGesture 官方文档](https://use-gesture.netlify.app/)
- [React Spring 文档](https://www.react-spring.dev/)
- [MDN 触摸事件](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [手势识别最佳实践](https://developers.google.com/web/fundamentals/design-and-ux/input/touch)
