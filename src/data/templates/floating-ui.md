# Floating UI 定位库模板

## 技术栈

- **核心**: @floating-ui/react 0.26.x
- **React**: 18.x / 19.x
- **定位引擎**: Floating UI Core
- **交互**: @floating-ui/react-dom
- **类型安全**: TypeScript 5.x
- **测试**: Vitest + @testing-library/react

## 项目结构

```
project/
├── src/
│   ├── components/
│   │   ├── floating/
│   │   │   ├── Tooltip.tsx
│   │   │   ├── Popover.tsx
│   │   │   ├── DropdownMenu.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── ContextMenu.tsx
│   │   │   └── Combobox.tsx
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useFloating.ts
│   │   ├── useHover.ts
│   │   ├── useClick.ts
│   │   └── useDismiss.ts
│   ├── utils/
│   │   └── floating-helpers.ts
│   └── types/
│       └── floating.d.ts
├── package.json
└── tsconfig.json
```

## 代码模式

### 基础 Tooltip

```typescript
// src/components/floating/Tooltip.tsx
import { useState } from 'react';
import { useFloating, autoUpdate, offset, flip, shift, useHover, useFocus, useDismiss, useInteractions, FloatingPortal } from '@floating-ui/react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export default function Tooltip({
  content,
  children,
  placement = 'top',
  delay = 200,
}: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({
        fallbackPlacements: ['top', 'bottom', 'left', 'right'],
      }),
      shift({
        padding: 8,
      }),
    ],
  });

  const hover = useHover(context, {
    delay: { open: delay, close: 0 },
  });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
  ]);

  return (
    <>
      {children &&
        children &&
        typeof children === 'object' &&
        'props' in children &&
        children.props &&
        typeof children.props === 'object' ? (
          <div
            ref={refs.setReference}
            {...getReferenceProps(children.props)}
            className="tooltip-trigger"
          >
            {children}
          </div>
        ) : null}

      <FloatingPortal>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className="tooltip-content"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              {content}
              <div className="tooltip-arrow" />
            </motion.div>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </>
  );
}

// 使用示例
<Tooltip content="This is a helpful tooltip">
  <button>Hover me</button>
</Tooltip>
```

### Popover 组件

```typescript
// src/components/floating/Popover.tsx
import { useState } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useClick,
  useDismiss,
  useInteractions,
  FloatingPortal,
  FloatingFocusManager,
} from '@floating-ui/react';
import { motion, AnimatePresence } from 'framer-motion';

interface PopoverProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  offset?: number;
}

export default function Popover({
  trigger,
  content,
  placement = 'bottom',
  offset: offsetValue = 8,
}: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(offsetValue),
      flip({
        fallbackPlacements: ['top', 'bottom', 'left', 'right'],
      }),
      shift({
        padding: 8,
      }),
    ],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context, {
    escapeKey: true,
    outsidePress: true,
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
  ]);

  return (
    <>
      <div
        ref={refs.setReference}
        {...getReferenceProps()}
        className="popover-trigger"
      >
        {trigger}
      </div>

      <FloatingPortal>
        <AnimatePresence>
          {isOpen && (
            <FloatingFocusManager context={context}>
              <motion.div
                ref={refs.setFloating}
                style={floatingStyles}
                {...getFloatingProps()}
                className="popover-content"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {content}
              </motion.div>
            </FloatingFocusManager>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </>
  );
}

// 使用示例
<Popover
  trigger={<button>Open Popover</button>}
  content={
    <div className="p-4">
      <h3>Popover Title</h3>
      <p>Some content here...</p>
    </div>
  }
/>
```

### 下拉菜单

```typescript
// src/components/floating/DropdownMenu.tsx
import { useState } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  size,
  useClick,
  useDismiss,
  useInteractions,
  FloatingPortal,
  FloatingFocusManager,
  useListNavigation,
} from '@floating-ui/react';
import { motion, AnimatePresence } from 'framer-motion';

interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: MenuItem[];
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
}

export default function DropdownMenu({
  trigger,
  items,
  placement = 'bottom-start',
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const listRef = React.useRef<Array<HTMLElement | null>>([]);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(4),
      flip({
        fallbackPlacements: ['top-start', 'top-end'],
      }),
      shift({
        padding: 8,
      }),
      size({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, {
            maxHeight: `${Math.min(300, window.innerHeight - rects.reference.bottom - 16)}px`,
          });
        },
      }),
    ],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const listNavigation = useListNavigation(context, {
    listRef,
    activeIndex,
    onNavigate: setActiveIndex,
    virtual: true,
    loop: true,
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    listNavigation,
  ]);

  const handleItemClick = (item: MenuItem, index: number) => {
    if (item.disabled) return;

    item.onClick?.();
    setIsOpen(false);
    setActiveIndex(null);
  };

  return (
    <>
      <div
        ref={refs.setReference}
        {...getReferenceProps()}
        className="dropdown-trigger"
      >
        {trigger}
      </div>

      <FloatingPortal>
        <AnimatePresence>
          {isOpen && (
            <FloatingFocusManager context={context}>
              <motion.div
                ref={refs.setFloating}
                style={floatingStyles}
                {...getFloatingProps()}
                className="dropdown-menu"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                {items.map((item, index) => (
                  <button
                    key={index}
                    ref={(node) => {
                      listRef.current[index] = node;
                    }}
                    onClick={() => handleItemClick(item, index)}
                    disabled={item.disabled}
                    className={`menu-item ${item.danger ? 'danger' : ''} ${
                      activeIndex === index ? 'active' : ''
                    }`}
                    role="menuitem"
                    tabIndex={activeIndex === index ? 0 : -1}
                  >
                    {item.icon && <span className="menu-icon">{item.icon}</span>}
                    <span>{item.label}</span>
                  </button>
                ))}
              </motion.div>
            </FloatingFocusManager>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </>
  );
}

// 使用示例
<DropdownMenu
  trigger={<button>Menu</button>}
  items={[
    { label: 'Edit', icon: <EditIcon />, onClick: () => handleEdit() },
    { label: 'Duplicate', icon: <CopyIcon />, onClick: () => handleDuplicate() },
    { label: 'Delete', icon: <TrashIcon />, onClick: () => handleDelete(), danger: true },
  ]}
/>
```

### 上下文菜单

```typescript
// src/components/floating/ContextMenu.tsx
import { useState } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useDismiss,
  useInteractions,
  FloatingPortal,
  FloatingFocusManager,
} from '@floating-ui/react';
import { motion, AnimatePresence } from 'framer-motion';

interface ContextMenuProps {
  items: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    divider?: boolean;
  }>;
  children: React.ReactNode;
}

export default function ContextMenu({ items, children }: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'right-start',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(0),
      flip({
        fallbackPlacements: ['left-start', 'right-end', 'left-end'],
      }),
      shift({
        padding: 8,
      }),
    ],
  });

  const dismiss = useDismiss(context);

  const { getFloatingProps } = useInteractions([dismiss]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setPosition({ x: e.clientX, y: e.clientY });
    setIsOpen(true);
  };

  return (
    <>
      <div onContextMenu={handleContextMenu} className="context-menu-trigger">
        {children}
      </div>

      <FloatingPortal>
        <AnimatePresence>
          {isOpen && (
            <FloatingFocusManager context={context}>
              <motion.div
                ref={refs.setFloating}
                style={{
                  ...floatingStyles,
                  position: 'fixed',
                  top: position.y,
                  left: position.x,
                }}
                {...getFloatingProps()}
                className="context-menu"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                {items.map((item, index) =>
                  item.divider ? (
                    <div key={index} className="menu-divider" />
                  ) : (
                    <button
                      key={index}
                      onClick={() => {
                        item.onClick?.();
                        setIsOpen(false);
                      }}
                      disabled={item.disabled}
                      className="menu-item"
                    >
                      {item.icon && <span className="menu-icon">{item.icon}</span>}
                      <span>{item.label}</span>
                    </button>
                  )
                )}
              </motion.div>
            </FloatingFocusManager>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </>
  );
}

// 使用示例
<ContextMenu
  items={[
    { label: 'Copy', icon: <CopyIcon />, onClick: () => copy() },
    { label: 'Cut', icon: <ScissorsIcon />, onClick: () => cut() },
    { divider: true },
    { label: 'Paste', icon: <ClipboardIcon />, onClick: () => paste() },
  ]}
>
  <div className="content-area">Right-click here</div>
</ContextMenu>
```

### Modal/Dialog

```typescript
// src/components/floating/Modal.tsx
import { useEffect } from 'react';
import {
  useFloating,
  useInteractions,
  FloatingPortal,
  FloatingFocusManager,
  FloatingOverlay,
  useId,
} from '@floating-ui/react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  initialFocus?: number;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  initialFocus = 0,
}: ModalProps) {
  const { refs, context } = useFloating({
    open: isOpen,
    onOpenChange: onClose,
  });

  const { getFloatingProps } = useInteractions([]);

  const headingId = useId();

  // 处理 Escape 键
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <FloatingPortal>
      <AnimatePresence>
        {isOpen && (
          <FloatingOverlay
            className="modal-overlay"
            lockScroll
            style={{ background: 'rgba(0, 0, 0, 0.5)' }}
          >
            <FloatingFocusManager context={context} initialFocus={initialFocus}>
              <motion.div
                ref={refs.setFloating}
                {...getFloatingProps()}
                className="modal-content"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                aria-labelledby={headingId}
                role="dialog"
                aria-modal="true"
              >
                {title && (
                  <div className="modal-header">
                    <h2 id={headingId}>{title}</h2>
                    <button onClick={onClose} className="close-button">
                      ×
                    </button>
                  </div>
                )}
                <div className="modal-body">{children}</div>
              </motion.div>
            </FloatingFocusManager>
          </FloatingOverlay>
        )}
      </AnimatePresence>
    </FloatingPortal>
  );
}

// 使用示例
<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Edit Profile">
  <form>
    <input type="text" placeholder="Name" />
    <input type="email" placeholder="Email" />
    <button type="submit">Save</button>
  </form>
</Modal>
```

### 自定义 Hook

```typescript
// src/hooks/useFloating.ts
import { useFloating as useFloatingUI, autoUpdate, offset, flip, shift, size, inline, hide } from '@floating-ui/react';
import type { Middleware, Placement, Strategy } from '@floating-ui/react';

interface UseFloatingOptions {
  placement?: Placement;
  strategy?: Strategy;
  middleware?: Middleware[];
  autoUpdate?: boolean;
}

export function useFloating({
  placement = 'bottom',
  strategy = 'absolute',
  middleware = [],
  autoUpdate: shouldAutoUpdate = true,
}: UseFloatingOptions = {}) {
  return useFloatingUI({
    placement,
    strategy,
    whileElementsMounted: shouldAutoUpdate ? autoUpdate : undefined,
    middleware: [
      offset(8),
      flip(),
      shift({ padding: 8 }),
      ...middleware,
    ],
  });
}

// 使用示例
const { refs, floatingStyles, context } = useFloating({
  placement: 'right',
  middleware: [
    size({
      apply({ rects, elements }) {
        elements.floating.style.maxHeight = '300px';
      },
    }),
  ],
});
```

```typescript
// src/hooks/useHover.ts
import { useHover as useFloatingHover } from '@floating-ui/react';
import type { FloatingContext } from '@floating-ui/react';

interface UseHoverOptions {
  delay?: number;
  mouseOnly?: boolean;
  restMs?: number;
}

export function useHover(
  context: FloatingContext,
  options: UseHoverOptions = {}
) {
  const { delay = 0, mouseOnly = false, restMs = 0 } = options;

  return useFloatingHover(context, {
    delay,
    mouseOnly,
    restMs,
  });
}
```

## 最佳实践

### 1. 中间件顺序

```typescript
// ✅ 正确的中间件顺序
const middleware = [
  offset(8),      // 1. 偏移
  flip(),         // 2. 翻转
  shift(),        // 3. 移位
  size(),         // 4. 尺寸限制
  inline(),       // 5. 内联（可选）
  hide(),         // 6. 隐藏（可选）
];
```

### 2. 自动更新

```typescript
// ✅ 推荐：使用 autoUpdate 保持定位
const { refs, floatingStyles } = useFloating({
  whileElementsMounted: autoUpdate,
});

// ❌ 避免：手动更新
useEffect(() => {
  const cleanup = autoUpdate(refs.reference.current, refs.floating.current, update);
  return cleanup;
}, []);
```

### 3. 无障碍性

```typescript
// ✅ 使用 FloatingFocusManager
<FloatingFocusManager context={context}>
  <div {...getFloatingProps()}>Content</div>
</FloatingFocusManager>

// ✅ 添加 ARIA 属性
<div
  role="tooltip"
  aria-hidden={!isOpen}
>
  Tooltip content
</div>
```

### 4. 性能优化

```typescript
// ✅ 懒加载浮动元素
const [isOpen, setIsOpen] = useState(false);

{isOpen && (
  <FloatingPortal>
    <div ref={refs.setFloating}>Content</div>
  </FloatingPortal>
)}

// ✅ 条件渲染中间件
const middleware = useMemo(() => {
  const items: Middleware[] = [offset(8), flip(), shift()];
  
  if (needsSizeConstraint) {
    items.push(size({ apply }));
  }
  
  return items;
}, [needsSizeConstraint]);
```

## 常用命令

```bash
# 安装依赖
npm install @floating-ui/react

# 可选：动画库
npm install framer-motion

# 开发依赖
npm install -D @types/react @types/react-dom

# 开发服务器
npm run dev

# 生产构建
npm run build

# 运行测试
npm run test
```

## 测试

```typescript
// src/__tests__/Tooltip.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Tooltip from '@/components/floating/Tooltip';

describe('Tooltip', () => {
  it('should show tooltip on hover', async () => {
    render(
      <Tooltip content="Tooltip text">
        <button>Hover me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByText('Tooltip text')).toBeInTheDocument();
    });
  });

  it('should hide tooltip on mouse leave', async () => {
    render(
      <Tooltip content="Tooltip text">
        <button>Hover me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me');
    fireEvent.mouseEnter(trigger);
    
    await waitFor(() => {
      expect(screen.getByText('Tooltip text')).toBeInTheDocument();
    });

    fireEvent.mouseLeave(trigger);
    
    await waitFor(() => {
      expect(screen.queryByText('Tooltip text')).not.toBeInTheDocument();
    });
  });

  it('should show tooltip on focus', async () => {
    render(
      <Tooltip content="Tooltip text">
        <button>Focus me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Focus me');
    fireEvent.focus(trigger);

    await waitFor(() => {
      expect(screen.getByText('Tooltip text')).toBeInTheDocument();
    });
  });
});
```

## 样式示例

```css
/* Tooltip 样式 */
.tooltip-content {
  background: #333;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  z-index: 9999;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Popover 样式 */
.popover-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  min-width: 200px;
}

/* 下拉菜单样式 */
.dropdown-menu {
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  min-width: 150px;
}

.menu-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
}

.menu-item:hover,
.menu-item.active {
  background: #f5f5f5;
}

.menu-item.danger {
  color: #f44336;
}

/* Modal 样式 */
.modal-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
}
```

## 参考资源

- [Floating UI 官方文档](https://floating-ui.com/)
- [Floating UI React 文档](https://floating-ui.com/docs/react)
- [Floating UI GitHub](https://github.com/floating-ui/floating-ui)
- [React 交互示例](https://floating-ui.com/docs/interactions)
