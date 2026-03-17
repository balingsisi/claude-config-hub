# React Use Hooks 工具库模板

## 技术栈

- **核心**: @uidotdev/usehooks
- **状态管理**: useState, useReducer, useLocalStorage
- **副作用**: useEffect, useLayoutEffect, useDebounce
- **事件**: useEventListener, useOnClickOutside
- **网络**: useFetch, useWebSocket
- **类型安全**: TypeScript

## 项目结构

```
project/
├── src/
│   ├── hooks/
│   │   ├── useLocalStorage.ts
│   │   ├── useDebounce.ts
│   │   ├── useToggle.ts
│   │   ├── useOnClickOutside.ts
│   │   ├── useEventListener.ts
│   │   ├── useFetch.ts
│   │   ├── useMediaQuery.ts
│   │   ├── useIntersectionObserver.ts
│   │   ├── useCopyToClipboard.ts
│   │   └── useWindowSize.ts
│   ├── components/
│   │   └── HooksDemo.tsx
│   ├── utils/
│   │   └── helpers.ts
│   └── types/
│       └── index.ts
├── package.json
└── tsconfig.json
```

## 代码模式

### useLocalStorage

```typescript
// src/hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

// 使用
const [theme, setTheme] = useLocalStorage('theme', 'light');
const [user, setUser] = useLocalStorage<User | null>('user', null);
```

### useDebounce

```typescript
// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 使用
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDebounce(searchTerm, 500);

useEffect(() => {
  if (debouncedSearchTerm) {
    searchAPI(debouncedSearchTerm);
  }
}, [debouncedSearchTerm]);
```

### useToggle

```typescript
// src/hooks/useToggle.ts
import { useState, useCallback } from 'react';

export function useToggle(
  initialValue: boolean = false
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((v) => !v);
  }, []);

  const setToggle = useCallback((value: boolean) => {
    setValue(value);
  }, []);

  return [value, toggle, setToggle];
}

// 使用
const [isOpen, toggleOpen, setOpen] = useToggle();
```

### useOnClickOutside

```typescript
// src/hooks/useOnClickOutside.ts
import { useEffect, RefObject } from 'react';

export function useOnClickOutside<T extends HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void
): void {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

// 使用
const ref = useRef<HTMLDivElement>(null);
useOnClickOutside(ref, () => setIsOpen(false));
```

### useEventListener

```typescript
// src/hooks/useEventListener.ts
import { useEffect, useRef } from 'react';

type EventHandler<T extends Event> = (event: T) => void;

export function useEventListener<T extends Event>(
  eventName: string,
  handler: EventHandler<T>,
  element: HTMLElement | Window = window
): void {
  const savedHandler = useRef<EventHandler<T>>(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const isSupported = element && element.addEventListener;
    if (!isSupported) return;

    const eventListener = (event: Event) => {
      savedHandler.current(event as T);
    };

    element.addEventListener(eventName, eventListener);

    return () => {
      element.removeEventListener(eventName, eventListener);
    };
  }, [eventName, element]);
}

// 使用
useEventListener('scroll', () => {
  setScrollY(window.scrollY);
});
```

### useFetch

```typescript
// src/hooks/useFetch.ts
import { useState, useEffect } from 'react';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useFetch<T>(url: string): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setState({ data, loading: false, error: null });
      } catch (error) {
        setState({ data: null, loading: false, error: error as Error });
      }
    };

    fetchData();
  }, [url]);

  return state;
}

// 使用
const { data, loading, error } = useFetch<User[]>('/api/users');
```

### useMediaQuery

```typescript
// src/hooks/useMediaQuery.ts
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

// 使用
const isMobile = useMediaQuery('(max-width: 768px)');
const isDark = useMediaQuery('(prefers-color-scheme: dark)');
```

### useIntersectionObserver

```typescript
// src/hooks/useIntersectionObserver.ts
import { useState, useEffect, RefObject } from 'react';

interface IntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
}

export function useIntersectionObserver(
  ref: RefObject<Element>,
  options: IntersectionObserverOptions = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isIntersecting;
}

// 使用
const ref = useRef<HTMLDivElement>(null);
const isVisible = useIntersectionObserver(ref, { threshold: 0.5 });
```

### useCopyToClipboard

```typescript
// src/hooks/useCopyToClipboard.ts
import { useState, useCallback } from 'react';

export function useCopyToClipboard(): [string | null, (text: string) => Promise<boolean>] {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      return true;
    } catch (error) {
      console.error('Failed to copy:', error);
      setCopiedText(null);
      return false;
    }
  }, []);

  return [copiedText, copy];
}

// 使用
const [copiedText, copy] = useCopyToClipboard();
```

### useWindowSize

```typescript
// src/hooks/useWindowSize.ts
import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

// 使用
const { width, height } = useWindowSize();
```

## 最佳实践

### 1. 组合 Hooks

```typescript
// 组合多个 hooks 创建复杂功能
function useSearch() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const { data, loading, error } = useFetch(
    debouncedQuery ? `/api/search?q=${debouncedQuery}` : null
  );

  return { query, setQuery, data, loading, error };
}
```

### 2. 依赖管理

```typescript
// 确保依赖数组正确
useEffect(() => {
  // 使用 useCallback 或 useMemo 避免不必要的依赖
}, [stableDependency]);
```

### 3. 清理副作用

```typescript
// 总是清理事件监听器和订阅
useEffect(() => {
  const subscription = observable.subscribe();
  return () => subscription.unsubscribe();
}, []);
```

### 4. TypeScript 类型安全

```typescript
// 为 hooks 提供类型
export function useCustomHook<T>(value: T): T {
  // ...
}
```

### 5. 性能优化

```typescript
// 使用 useCallback 和 useMemo 优化性能
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);

const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```

## 常用命令

### 安装依赖

```bash
# React Use 库
npm install @uidotdev/usehooks

# 或者自己实现
# 无需额外依赖
```

### TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

## 部署配置

### 测试 Hooks

```typescript
// __tests__/useLocalStorage.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useLocalStorage } from '../hooks/useLocalStorage';

test('should use localStorage', () => {
  const { result } = renderHook(() => useLocalStorage('key', 'initial'));

  expect(result.current[0]).toBe('initial');

  act(() => {
    result.current[1]('new value');
  });

  expect(result.current[0]).toBe('new value');
});
```

### Storybook 集成

```typescript
// stories/HooksDemo.stories.tsx
import { HooksDemo } from '../components/HooksDemo';

export default {
  title: 'Hooks/Demo',
  component: HooksDemo,
};

export const Default = () => <HooksDemo />;
```

## 性能优化

### 1. 避免不必要的重渲染

```typescript
// 使用 React.memo 包装组件
const MemoizedComponent = React.memo(Component);

// 使用 useCallback 缓存回调
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);
```

### 2. 懒加载 Hooks

```typescript
// 条件加载 hooks
function useConditionalHook(condition: boolean) {
  if (condition) {
    return useExpensiveHook();
  }
  return null;
}
```

### 3. 批量更新

```typescript
// 使用 useReducer 处理复杂状态
const [state, dispatch] = useReducer(reducer, initialState);

// 一次更新多个状态
dispatch({ type: 'BATCH_UPDATE', payload: newData });
```

## 参考资料

- [useHooks 官方文档](https://usehooks.com/)
- [React Hooks 文档](https://react.dev/reference/react)
- [useHooks TypeScript](https://github.com/uidotdev/usehooks)
- [React Hooks 最佳实践](https://react.dev/learn/reusing-logic-with-custom-hooks)
