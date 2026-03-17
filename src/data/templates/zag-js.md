# Zag.js 组件状态机模板

## 技术栈

### 核心技术
- **@zag-js/core**: 状态机核心
- **@zag-js/store**: 状态存储
- **@zag-js/utils**: 工具函数
- **React/Vue/Solid**: 框架集成
- **TypeScript**: 类型安全

### 特性
- 框架无关的状态机
- 声明式状态定义
- 可访问性（a11y）内置
- 可定制且可扩展
- 类型安全
- 支持 SSR

## 项目结构

```
zag-components/
├── src/
│   ├── machines/            # 状态机定义
│   │   ├── accordion.ts
│   │   ├── dialog.ts
│   │   ├── menu.ts
│   │   ├── popover.ts
│   │   ├── tooltip.ts
│   │   └── dropdown.ts
│   ├── components/          # React 组件
│   │   ├── Accordion/
│   │   │   ├── Accordion.tsx
│   │   │   ├── AccordionItem.tsx
│   │   │   └── index.ts
│   │   ├── Dialog/
│   │   │   ├── Dialog.tsx
│   │   │   ├── DialogTrigger.tsx
│   │   │   └── DialogContent.tsx
│   │   ├── Menu/
│   │   └── Tooltip/
│   ├── hooks/
│   │   └── useMachine.ts
│   ├── types/
│   │   └── index.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

## 核心代码模式

### 1. 基础状态机定义

```typescript
// src/machines/toggle.ts
import { createMachine } from '@zag-js/core';

interface ToggleContext {
  disabled: boolean;
}

type ToggleEvent = {
  type: 'TOGGLE';
};

export const toggleMachine = createMachine<ToggleContext, ToggleEvent>({
  id: 'toggle',
  initial: 'inactive',
  context: {
    disabled: false,
  },
  states: {
    inactive: {
      on: {
        TOGGLE: {
          target: 'active',
          guard: ({ context }) => !context.disabled,
        },
      },
    },
    active: {
      on: {
        TOGGLE: {
          target: 'inactive',
          guard: ({ context }) => !context.disabled,
        },
      },
    },
  },
});
```

### 2. React 集成

```typescript
// src/hooks/useMachine.ts
import { useMachine as useZagMachine } from '@zag-js/react';
import { useId } from 'react';

export function useMachine<TContext, TEvent>(
  machine: ReturnType<typeof createMachine<TContext, TEvent>>,
  context?: Partial<TContext>
) {
  const id = useId();

  const [state, send] = useZagMachine(machine, {
    id,
    context,
  });

  return [state, send] as const;
}
```

```typescript
// src/components/Toggle/Toggle.tsx
import React from 'react';
import { useMachine } from '../../hooks/useMachine';
import { toggleMachine } from '../../machines/toggle';

interface ToggleProps {
  disabled?: boolean;
  onChange?: (active: boolean) => void;
  children: React.ReactNode;
}

export function Toggle({ disabled = false, onChange, children }: ToggleProps) {
  const [state, send] = useMachine(toggleMachine, {
    disabled,
  });

  const isActive = state.matches('active');

  React.useEffect(() => {
    onChange?.(isActive);
  }, [isActive, onChange]);

  const handleClick = () => {
    send({ type: 'TOGGLE' });
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={isActive}
      data-state={isActive ? 'active' : 'inactive'}
    >
      {children}
    </button>
  );
}
```

### 3. 复杂组件：Accordion

```typescript
// src/machines/accordion.ts
import { createMachine, assign } from '@zag-js/core';

interface AccordionItemContext {
  id: string;
  disabled: boolean;
}

interface AccordionContext {
  items: AccordionItemContext[];
  value: string[];
  multiple: boolean;
  collapsible: boolean;
}

type AccordionEvent =
  | { type: 'FOCUS'; id: string }
  | { type: 'EXPAND'; id: string }
  | { type: 'COLLAPSE'; id: string }
  | { type: 'TOGGLE'; id: string }
  | { type: 'NAVIGATE'; direction: 'next' | 'prev' };

export const accordionMachine = createMachine<AccordionContext, AccordionEvent>(
  {
    id: 'accordion',
    initial: 'idle',
    context: {
      items: [],
      value: [],
      multiple: false,
      collapsible: true,
    },
    states: {
      idle: {
        on: {
          TOGGLE: [
            {
              guard: 'allowToggle',
              actions: ['toggleItem'],
            },
          ],
          EXPAND: {
            actions: ['expandItem'],
          },
          COLLAPSE: {
            guard: 'isCollapsible',
            actions: ['collapseItem'],
          },
          NAVIGATE: {
            actions: ['navigateItem'],
          },
        },
      },
    },
  },
  {
    guards: {
      allowToggle: ({ context, event }) => {
        if (event.type !== 'TOGGLE') return false;
        const isOpen = context.value.includes(event.id);
        if (!isOpen) return true;
        return context.collapsible;
      },
      isCollapsible: ({ context }) => context.collapsible,
    },
    actions: {
      toggleItem: assign(({ context, event }) => {
        if (event.type !== 'TOGGLE') return {};
        const { id } = event;
        const isOpen = context.value.includes(id);

        if (isOpen) {
          return {
            value: context.value.filter((v) => v !== id),
          };
        }

        if (context.multiple) {
          return {
            value: [...context.value, id],
          };
        }

        return {
          value: [id],
        };
      }),

      expandItem: assign(({ context, event }) => {
        if (event.type !== 'EXPAND') return {};
        const { id } = event;

        if (context.value.includes(id)) return {};

        if (context.multiple) {
          return {
            value: [...context.value, id],
          };
        }

        return {
          value: [id],
        };
      }),

      collapseItem: assign(({ context, event }) => {
        if (event.type !== 'COLLAPSE') return {};
        return {
          value: context.value.filter((v) => v !== event.id),
        };
      }),

      navigateItem: ({ context, event }) => {
        if (event.type !== 'NAVIGATE') return;
        // 实现导航逻辑
        const items = context.items.filter((item) => !item.disabled);
        // ...导航到下一个或上一个项
      },
    },
  }
);
```

```typescript
// src/components/Accordion/Accordion.tsx
import React, { createContext, useContext, useMemo } from 'react';
import { useMachine } from '../../hooks/useMachine';
import { accordionMachine } from '../../machines/accordion';

interface AccordionProps {
  multiple?: boolean;
  collapsible?: boolean;
  defaultValue?: string[];
  value?: string[];
  onChange?: (value: string[]) => void;
  children: React.ReactNode;
}

interface AccordionContextValue {
  state: ReturnType<typeof useMachine<typeof accordionMachine>[0]>;
  send: ReturnType<typeof useMachine<typeof accordionMachine>[1]>;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

export function Accordion({
  multiple = false,
  collapsible = true,
  defaultValue = [],
  value,
  onChange,
  children,
}: AccordionProps) {
  const [state, send] = useMachine(accordionMachine, {
    multiple,
    collapsible,
    value: value ?? defaultValue,
  });

  const context = useMemo(
    () => ({
      state,
      send,
    }),
    [state, send]
  );

  React.useEffect(() => {
    if (onChange) {
      const currentValue = state.context.value;
      onChange(currentValue);
    }
  }, [state.context.value, onChange]);

  return (
    <AccordionContext.Provider value={context}>
      <div role="region" aria-label="Accordion">
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

function useAccordion() {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('useAccordion must be used within Accordion');
  }
  return context;
}

// AccordionItem
interface AccordionItemProps {
  id: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export function AccordionItem({ id, disabled = false, children }: AccordionItemProps) {
  const { state, send } = useAccordion();
  const isOpen = state.context.value.includes(id);

  return (
    <div
      data-state={isOpen ? 'open' : 'closed'}
      data-disabled={disabled ? '' : undefined}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            id,
            isOpen,
            disabled,
            onToggle: () => send({ type: 'TOGGLE', id }),
          });
        }
        return child;
      })}
    </div>
  );
}

// AccordionTrigger
interface AccordionTriggerProps {
  id: string;
  isOpen: boolean;
  disabled?: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function AccordionTrigger({
  id,
  isOpen,
  disabled,
  onToggle,
  children,
}: AccordionTriggerProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-expanded={isOpen}
      aria-controls={`accordion-content-${id}`}
      id={`accordion-trigger-${id}`}
    >
      {children}
    </button>
  );
}

// AccordionContent
interface AccordionContentProps {
  id: string;
  isOpen: boolean;
  children: React.ReactNode;
}

export function AccordionContent({ id, isOpen, children }: AccordionContentProps) {
  if (!isOpen) return null;

  return (
    <div
      role="region"
      id={`accordion-content-${id}`}
      aria-labelledby={`accordion-trigger-${id}`}
    >
      {children}
    </div>
  );
}
```

### 4. Dialog/Modal 组件

```typescript
// src/machines/dialog.ts
import { createMachine, assign } from '@zag-js/core';

interface DialogContext {
  open: boolean;
  modal: boolean;
  closeOnEsc: boolean;
  closeOnOverlayClick: boolean;
}

type DialogEvent =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'TOGGLE' }
  | { type: 'ESCAPE' }
  | { type: 'CLICK_OUTSIDE' };

export const dialogMachine = createMachine<DialogContext, DialogEvent>(
  {
    id: 'dialog',
    initial: 'closed',
    context: {
      open: false,
      modal: true,
      closeOnEsc: true,
      closeOnOverlayClick: true,
    },
    states: {
      closed: {
        entry: [assign({ open: false })],
        on: {
          OPEN: {
            target: 'open',
          },
          TOGGLE: {
            target: 'open',
          },
        },
      },
      open: {
        entry: [assign({ open: true })],
        on: {
          CLOSE: {
            target: 'closed',
          },
          TOGGLE: {
            target: 'closed',
          },
          ESCAPE: {
            guard: 'closeOnEsc',
            target: 'closed',
          },
          CLICK_OUTSIDE: {
            guard: 'closeOnOverlayClick',
            target: 'closed',
          },
        },
      },
    },
  },
  {
    guards: {
      closeOnEsc: ({ context }) => context.closeOnEsc,
      closeOnOverlayClick: ({ context }) => context.closeOnOverlayClick,
    },
  }
);
```

```typescript
// src/components/Dialog/Dialog.tsx
import React, { useEffect, useRef } from 'react';
import { useMachine } from '../../hooks/useMachine';
import { dialogMachine } from '../../machines/dialog';

interface DialogProps {
  open?: boolean;
  modal?: boolean;
  closeOnEsc?: boolean;
  closeOnOverlayClick?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({
  open: controlledOpen,
  modal = true,
  closeOnEsc = true,
  closeOnOverlayClick = true,
  onOpenChange,
  children,
}: DialogProps) {
  const [state, send] = useMachine(dialogMachine, {
    modal,
    closeOnEsc,
    closeOnOverlayClick,
    open: controlledOpen ?? false,
  });

  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (controlledOpen !== undefined) {
      if (controlledOpen && !state.context.open) {
        send({ type: 'OPEN' });
      } else if (!controlledOpen && state.context.open) {
        send({ type: 'CLOSE' });
      }
    }
  }, [controlledOpen, state.context.open, send]);

  useEffect(() => {
    onOpenChange?.(state.context.open);
  }, [state.context.open, onOpenChange]);

  // 处理 ESC 键
  useEffect(() => {
    if (!state.context.open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        send({ type: 'ESCAPE' });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.context.open, send]);

  // 处理点击外部
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      send({ type: 'CLICK_OUTSIDE' });
    }
  };

  if (!state.context.open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        role="dialog"
        aria-modal={modal}
        style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          maxWidth: '500px',
          width: '100%',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogTrigger({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return <>{children}</>;
}

export function DialogContent({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export function DialogClose({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick}>
      {children}
    </button>
  );
}
```

### 5. Menu/Dropdown 组件

```typescript
// src/machines/menu.ts
import { createMachine, assign } from '@zag-js/core';

interface MenuContext {
  open: boolean;
  activeId: string | null;
  orientation: 'horizontal' | 'vertical';
}

type MenuEvent =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'TOGGLE' }
  | { type: 'FOCUS'; id: string }
  | { type: 'SELECT'; id: string }
  | { type: 'NAVIGATE'; direction: 'next' | 'prev' | 'first' | 'last' };

export const menuMachine = createMachine<MenuContext, MenuEvent>(
  {
    id: 'menu',
    initial: 'closed',
    context: {
      open: false,
      activeId: null,
      orientation: 'vertical',
    },
    states: {
      closed: {
        entry: [assign({ activeId: null })],
        on: {
          OPEN: {
            target: 'open',
          },
          TOGGLE: {
            target: 'open',
          },
        },
      },
      open: {
        on: {
          CLOSE: {
            target: 'closed',
          },
          TOGGLE: {
            target: 'closed',
          },
          FOCUS: {
            actions: ['focusItem'],
          },
          SELECT: {
            target: 'closed',
            actions: ['selectItem'],
          },
          NAVIGATE: {
            actions: ['navigate'],
          },
        },
      },
    },
  },
  {
    actions: {
      focusItem: assign(({ event }) => {
        if (event.type !== 'FOCUS') return {};
        return { activeId: event.id };
      }),

      selectItem: ({ event, context }) => {
        if (event.type !== 'SELECT') return;
        console.log('Selected item:', event.id);
      },

      navigate: assign(({ context, event }) => {
        if (event.type !== 'NAVIGATE') return {};
        // 实现导航逻辑
        return {};
      }),
    },
  }
);
```

```typescript
// src/components/Menu/Menu.tsx
import React, { useRef, useEffect } from 'react';
import { useMachine } from '../../hooks/useMachine';
import { menuMachine } from '../../machines/menu';

interface MenuProps {
  children: React.ReactNode;
}

export function Menu({ children }: MenuProps) {
  const [state, send] = useMachine(menuMachine);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <div style={{ position: 'relative' }}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            state,
            send,
            triggerRef,
          });
        }
        return child;
      })}
    </div>
  );
}

interface MenuTriggerProps {
  state: any;
  send: any;
  triggerRef: React.RefObject<HTMLButtonElement>;
  children: React.ReactNode;
}

export function MenuTrigger({ state, send, triggerRef, children }: MenuTriggerProps) {
  return (
    <button
      ref={triggerRef}
      onClick={() => send({ type: 'TOGGLE' })}
      aria-expanded={state.context.open}
      aria-haspopup="menu"
    >
      {children}
    </button>
  );
}

interface MenuContentProps {
  state: any;
  send: any;
  children: React.ReactNode;
}

export function MenuContent({ state, send, children }: MenuContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state.context.open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          send({ type: 'CLOSE' });
          break;
        case 'ArrowDown':
          e.preventDefault();
          send({ type: 'NAVIGATE', direction: 'next' });
          break;
        case 'ArrowUp':
          e.preventDefault();
          send({ type: 'NAVIGATE', direction: 'prev' });
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.context.open, send]);

  useEffect(() => {
    if (!state.context.open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(e.target as Node)
      ) {
        send({ type: 'CLOSE' });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [state.context.open, send]);

  if (!state.context.open) return null;

  return (
    <div
      ref={contentRef}
      role="menu"
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        marginTop: '4px',
        background: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        minWidth: '200px',
      }}
    >
      {children}
    </div>
  );
}

interface MenuItemProps {
  id: string;
  disabled?: boolean;
  state: any;
  send: any;
  children: React.ReactNode;
}

export function MenuItem({ id, disabled = false, state, send, children }: MenuItemProps) {
  const isActive = state.context.activeId === id;

  return (
    <button
      role="menuitem"
      disabled={disabled}
      onClick={() => send({ type: 'SELECT', id })}
      onMouseEnter={() => send({ type: 'FOCUS', id })}
      style={{
        width: '100%',
        padding: '8px 16px',
        textAlign: 'left',
        background: isActive ? '#f0f0f0' : 'white',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}
```

### 6. Tooltip 组件

```typescript
// src/machines/tooltip.ts
import { createMachine, assign } from '@zag-js/core';

interface TooltipContext {
  open: boolean;
  delay: number;
  position: 'top' | 'right' | 'bottom' | 'left';
}

type TooltipEvent =
  | { type: 'SHOW' }
  | { type: 'HIDE' }
  | { type: 'TOGGLE' };

export const tooltipMachine = createMachine<TooltipContext, TooltipEvent>({
  id: 'tooltip',
  initial: 'closed',
  context: {
    open: false,
    delay: 700,
    position: 'top',
  },
  states: {
    closed: {
      entry: [assign({ open: false })],
      on: {
        SHOW: {
          target: 'delayedOpen',
        },
      },
    },
    delayedOpen: {
      after: {
        DELAY: {
          target: 'open',
        },
      },
      on: {
        HIDE: {
          target: 'closed',
        },
      },
    },
    open: {
      entry: [assign({ open: true })],
      on: {
        HIDE: {
          target: 'closed',
        },
      },
    },
  },
  delays: {
    DELAY: ({ context }) => context.delay,
  },
});
```

```typescript
// src/components/Tooltip/Tooltip.tsx
import React from 'react';
import { useMachine } from '../../hooks/useMachine';
import { tooltipMachine } from '../../machines/tooltip';

interface TooltipProps {
  content: React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
  children: React.ReactNode;
}

export function Tooltip({
  content,
  position = 'top',
  delay = 700,
  children,
}: TooltipProps) {
  const [state, send] = useMachine(tooltipMachine, {
    position,
    delay,
  });

  const positionStyles = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)' },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)' },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%)' },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%)' },
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => send({ type: 'SHOW' })}
      onMouseLeave={() => send({ type: 'HIDE' })}
    >
      {children}
      {state.context.open && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            ...positionStyles[position],
            padding: '4px 8px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            zIndex: 1000,
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
```

## 最佳实践

### 1. 状态机设计原则
```typescript
// ✅ Good - 清晰的状态定义
const machine = createMachine({
  id: 'component',
  initial: 'idle',
  states: {
    idle: { on: { START: 'running' } },
    running: { on: { STOP: 'idle' } },
  },
});

// ❌ Bad - 过于复杂的状态
const machine = createMachine({
  // 太多状态，难以维护
});
```

### 2. 上下文管理
```typescript
// ✅ Good - 类型安全的上下文
interface MyContext {
  count: number;
  disabled: boolean;
}

const machine = createMachine<MyContext>({
  context: {
    count: 0,
    disabled: false,
  },
});
```

### 3. 守卫函数
```typescript
// ✅ Good - 提取守卫逻辑
guards: {
  isValid: ({ context }) => context.count > 0,
  canProceed: ({ context }) => !context.disabled,
}
```

### 4. 动作组合
```typescript
// ✅ Good - 复用动作
actions: {
  logState: ({ context }) => console.log(context),
  notifyParent: ({ context }) => onChange?.(context),
}

// 在状态转换中组合
'EVENT': {
  actions: ['logState', 'notifyParent'],
}
```

## 依赖安装

```bash
# 核心依赖
npm install @zag-js/core @zag-js/store

# React 集成
npm install @zag-js/react

# 预构建组件（可选）
npm install @zag-js/accordion
npm install @zag-js/dialog
npm install @zag-js/menu
npm install @zag-js/tooltip
```

## TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "module": "ESNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

## 参考资源

- [Zag.js 官方文档](https://zagjs.com/)
- [GitHub 仓库](https://github.com/chakra-ui/zag)
- [组件示例](https://zagjs.com/components/accordion)
- [状态机概念](https://xstate.js.org/docs/)
