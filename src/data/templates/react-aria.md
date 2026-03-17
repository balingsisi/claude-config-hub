# React Aria 模板

## 技术栈

### 核心技术
- **React Aria**: Adobe 的无样式 UI 原语库
- **React Aria Components**: 预构建的可访问性组件
- **React**: UI 框架
- **TypeScript**: 类型安全

### 核心特性
- **无样式**: 完全控制设计
- **可访问性**: WCAG 合规
- **交互性**: 键盘导航、焦点管理
- **国际化**: RTL、日期格式化

### 组件集合
- Button, Link
- TextField, TextArea, Checkbox, Switch, Radio
- Select, ComboBox, Autocomplete
- Dialog, Modal, Popover
- Menu, Tabs, Breadcrumbs
- Calendar, DatePicker, DateRangePicker
- Table, Grid, Tree

## 项目结构

```
react-aria-project/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── TextField.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   ├── Tabs.tsx
│   │   │   └── Menu.tsx
│   │   ├── forms/
│   │   │   ├── LoginForm.tsx
│   │   │   └── ContactForm.tsx
│   │   └── data/
│   │       ├── DataTable.tsx
│   │       └── TreeView.tsx
│   ├── hooks/
│   │   └── useCustomComponent.ts
│   ├── styles/
│   │   └── global.css
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── tsconfig.json
├── vite.config.ts
└── package.json
```

## 核心代码模式

### 1. Button 组件

```tsx
// src/components/ui/Button.tsx
import { useRef } from 'react'
import { useButton } from 'react-aria'
import type { AriaButtonProps } from 'react-aria'

interface ButtonProps extends AriaButtonProps {
  variant?: 'primary' | 'secondary' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: ButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const { buttonProps } = useButton(props, ref)

  const variantStyles = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    destructive: 'bg-red-500 hover:bg-red-600 text-white',
  }

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      {...buttonProps}
      ref={ref}
      className={`
        inline-flex items-center justify-center rounded-md font-medium
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${variantStyles[variant]}
        ${sizeStyles[size]}
      `}
    >
      {children}
    </button>
  )
}
```

### 2. TextField 组件

```tsx
// src/components/ui/TextField.tsx
import { useTextField } from 'react-aria'
import { useRef } from 'react'
import type { AriaTextFieldProps } from 'react-aria'

interface TextFieldProps extends AriaTextFieldProps {
  label: string
  description?: string
  errorMessage?: string
}

export function TextField({
  label,
  description,
  errorMessage,
  ...props
}: TextFieldProps) {
  const ref = useRef<HTMLInputElement>(null)
  const {
    labelProps,
    inputProps,
    descriptionProps,
    errorMessageProps,
  } = useTextField(
    {
      label,
      description,
      errorMessage,
      ...props,
    },
    ref
  )

  return (
    <div className="flex flex-col gap-1.5">
      <label
        {...labelProps}
        className="text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <input
        {...inputProps}
        ref={ref}
        className={`
          px-3 py-2 rounded-md border border-gray-300
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          ${errorMessage ? 'border-red-500' : ''}
        `}
      />
      {description && (
        <p
          {...descriptionProps}
          className="text-sm text-gray-600"
        >
          {description}
        </p>
      )}
      {errorMessage && (
        <p
          {...errorMessageProps}
          className="text-sm text-red-600"
        >
          {errorMessage}
        </p>
      )}
    </div>
  )
}
```

### 3. Select 组件

```tsx
// src/components/ui/Select.tsx
import { useSelect, HiddenSelect } from 'react-aria'
import { useSelectState } from 'react-stately'
import { useRef } from 'react'
import type { SelectProps } from 'react-aria'
import { Item } from 'react-stately'

interface SelectOption {
  value: string
  label: string
}

interface CustomSelectProps extends SelectProps<SelectOption> {
  options: SelectOption[]
}

export function Select({ options, ...props }: CustomSelectProps) {
  const state = useSelectState({
    items: options,
    ...props,
  })
  const ref = useRef<HTMLButtonElement>(null)
  const {
    labelProps,
    triggerProps,
    valueProps,
    menuProps,
  } = useSelect(props, state, ref)

  return (
    <div className="flex flex-col gap-1.5">
      <label
        {...labelProps}
        className="text-sm font-medium text-gray-700"
      >
        {props.label}
      </label>
      <HiddenSelect
        state={state}
        triggerRef={ref}
        name={props.name}
        isDisabled={props.isDisabled}
      />
      <button
        {...triggerProps}
        ref={ref}
        className={`
          px-3 py-2 rounded-md border border-gray-300 bg-white
          flex items-center justify-between gap-2
          focus:outline-none focus:ring-2 focus:ring-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        <span {...valueProps}>
          {state.selectedItem
            ? state.selectedItem.rendered
            : 'Select an option'}
        </span>
        <span aria-hidden="true">▼</span>
      </button>
      {state.isOpen && (
        <ul
          {...menuProps}
          className={`
            absolute mt-1 max-h-60 w-full overflow-auto
            rounded-md border border-gray-200 bg-white shadow-lg
            z-10
          `}
        >
          {state.collection.map((item) => (
            <Item
              key={item.key}
              textValue={item.textValue}
            >
              {item.rendered}
            </Item>
          ))}
        </ul>
      )}
    </div>
  )
}
```

### 4. Dialog 组件

```tsx
// src/components/ui/Dialog.tsx
import {
  useDialog,
  useModalOverlay,
  useOverlay,
  usePreventScroll,
} from 'react-aria'
import { useOverlayTriggerState } from 'react-stately'
import { useRef, ReactNode } from 'react'
import type { AriaDialogProps } from 'react-aria'

interface DialogProps extends AriaDialogProps {
  title?: string
  children: ReactNode
  isOpen: boolean
  onClose: () => void
}

export function Dialog({
  title,
  children,
  isOpen,
  onClose,
  ...props
}: DialogProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { dialogProps, titleProps } = useDialog(props, ref)

  usePreventScroll({ isDisabled: !isOpen })

  const { overlayProps } = useOverlay(
    {
      isOpen,
      onClose,
      isDismissable: true,
    },
    ref
  )

  const { modalProps } = useModalOverlay(
    {
      isOpen,
    },
    state,
    ref
  )

  const state = useOverlayTriggerState({ isOpen, onClose })

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div
        {...overlayProps}
        {...dialogProps}
        {...modalProps}
        ref={ref}
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
      >
        {title && (
          <h3
            {...titleProps}
            className="text-lg font-semibold mb-4"
          >
            {title}
          </h3>
        )}
        {children}
      </div>
    </div>
  )
}
```

### 5. DatePicker 组件

```tsx
// src/components/ui/DatePicker.tsx
import { useDatePicker } from 'react-aria'
import { useDatePickerState } from 'react-stately'
import { useRef } from 'react'
import type { DatePickerProps } from 'react-aria'
import { Calendar } from './Calendar'
import { Button } from './Button'

export function DatePicker(props: DatePickerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const state = useDatePickerState(props)
  const {
    groupProps,
    labelProps,
    fieldProps,
    buttonProps,
    dialogProps,
    calendarProps,
  } = useDatePicker(props, state, ref)

  return (
    <div className="flex flex-col gap-1.5">
      <label
        {...labelProps}
        className="text-sm font-medium text-gray-700"
      >
        {props.label}
      </label>
      <div
        {...groupProps}
        ref={ref}
        className="flex items-center gap-2"
      >
        <input
          {...fieldProps}
          className="px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
        />
        <Button {...buttonProps}>📅</Button>
      </div>
      {state.isOpen && (
        <div
          {...dialogProps}
          className="absolute mt-2 z-10 bg-white rounded-lg shadow-xl p-4"
        >
          <Calendar {...calendarProps} />
        </div>
      )}
    </div>
  )
}
```

### 6. Tabs 组件

```tsx
// src/components/ui/Tabs.tsx
import { useTabList, useTab, useTabPanel } from 'react-aria'
import { useTabListState } from 'react-stately'
import { useRef } from 'react'
import type { TabListProps, Node } from 'react-aria'

export function Tabs(props: TabListProps) {
  const state = useTabListState(props)
  const ref = useRef<HTMLDivElement>(null)
  const { tabListProps } = useTabList(props, state, ref)

  return (
    <div>
      <div
        {...tabListProps}
        ref={ref}
        className="flex gap-2 border-b border-gray-200"
      >
        {[...state.collection].map((item) => (
          <Tab key={item.key} item={item} state={state} />
        ))}
      </div>
      <TabPanel key={state.selectedItem?.key} state={state} />
    </div>
  )
}

function Tab({ item, state }: { item: Node; state: any }) {
  const ref = useRef<HTMLButtonElement>(null)
  const { tabProps } = useTab({ key: item.key }, state, ref)
  const isSelected = state.selectedKey === item.key

  return (
    <button
      {...tabProps}
      ref={ref}
      className={`
        px-4 py-2 font-medium transition-colors
        focus:outline-none focus:ring-2 focus:ring-blue-500
        ${isSelected
          ? 'text-blue-600 border-b-2 border-blue-600'
          : 'text-gray-600 hover:text-gray-900'}
      `}
    >
      {item.rendered}
    </button>
  )
}

function TabPanel({ state }: { state: any }) {
  const ref = useRef<HTMLDivElement>(null)
  const { tabPanelProps } = useTabPanel(state, ref)

  return (
    <div
      {...tabPanelProps}
      ref={ref}
      className="py-4"
    >
      {state.selectedItem?.props.children}
    </div>
  )
}
```

### 7. Table 组件

```tsx
// src/components/data/DataTable.tsx
import { useTable } from 'react-aria'
import { useTableState } from 'react-stately'
import { useRef } from 'react'
import type { TableProps } from 'react-aria'

interface Column {
  key: string
  name: string
  width?: number
}

interface Row {
  [key: string]: any
}

export function DataTable({
  columns,
  rows,
  ...props
}: TableProps & { columns: Column[]; rows: Row[] }) {
  const state = useTableState({
    ...props,
    columns,
    items: rows,
  })
  const ref = useRef<HTMLTableElement>(null)
  const { collection } = state
  const { gridProps } = useTable(props, state, ref)

  return (
    <table
      {...gridProps}
      ref={ref}
      className="min-w-full divide-y divide-gray-200"
    >
      <thead className="bg-gray-50">
        <tr>
          {[...collection.columns].map((column) => (
            <th
              key={column.key}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {column.rendered}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {[...collection.rows].map((row) => (
          <tr key={row.key}>
            {[...row.childNodes].map((cell) => (
              <td
                key={cell.key}
                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
              >
                {cell.rendered}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

## 最佳实践

### 1. 组合模式

```tsx
// ✅ 使用 React Aria hooks 组合组件
import { useButton, useFocusRing, useHover } from 'react-aria'

function CustomButton(props) {
  const ref = useRef(null)
  const { buttonProps } = useButton(props, ref)
  const { focusProps, isFocusVisible } = useFocusRing()
  const { hoverProps, isHovered } = useHover(props)

  return (
    <button
      {...mergeProps(buttonProps, focusProps, hoverProps)}
      ref={ref}
      className={`
        ${isHovered ? 'bg-blue-600' : 'bg-blue-500'}
        ${isFocusVisible ? 'ring-2 ring-offset-2' : ''}
      `}
    >
      {props.children}
    </button>
  )
}
```

### 2. 无障碍性

```tsx
// ✅ 确保所有交互元素可访问
import { usePress, useKeyboard } from 'react-aria'

function ClickableDiv({ onPress, children }) {
  const ref = useRef(null)
  const { pressProps } = usePress({ onPress })
  const { keyboardProps } = useKeyboard({
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        onPress?.()
      }
    },
  })

  return (
    <div
      {...mergeProps(pressProps, keyboardProps)}
      ref={ref}
      role="button"
      tabIndex={0}
    >
      {children}
    </div>
  )
}
```

### 3. 国际化

```tsx
// 使用 React Aria 的国际化支持
import { useLocale, useDateFormatter } from 'react-aria'

function InternationalComponent() {
  const { locale, direction } = useLocale()
  const formatter = useDateFormatter({
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div dir={direction}>
      <p>当前语言: {locale}</p>
      <p>今天: {formatter.format(new Date())}</p>
    </div>
  )
}
```

## 常用命令

### 安装

```bash
# React Aria Components
pnpm add react-aria-components

# React Aria (hooks)
pnpm add react-aria react-stately

# 特定包
pnpm add @react-aria/button
pnpm add @react-aria/focus
pnpm add @react-aria/i18n
```

### 开发

```bash
# 启动开发服务器
pnpm dev

# 构建
pnpm build

# 类型检查
pnpm type-check
```

## 部署配置

### 1. Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-aria': ['react-aria', 'react-stately'],
        },
      },
    },
  },
})
```

### 2. TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true
  }
}
```

## React Aria vs Radix UI

| 特性 | React Aria | Radix UI |
|------|-----------|----------|
| 开发者 | Adobe | Radix |
| 样式 | 无样式 | 无样式 |
| 可访问性 | WCAG AAA | WCAG AA |
| 学习曲线 | 🟡 中等 | 🟢 简单 |
| 文档质量 | 🟢 优秀 | 🟢 优秀 |
| 包大小 | 🟡 中等 | 🟢 较小 |
| 组件数量 | 🟢 丰富 | 🟢 丰富 |

## 相关资源

- [React Aria 官方文档](https://react-spectrum.adobe.com/react-aria/)
- [React Aria Components](https://react-spectrum.adobe.com/react-aria/components.html)
- [React Stately](https://react-spectrum.adobe.com/react-stately/)
- [WCAG 指南](https://www.w3.org/WAI/WCAG21/quickref/)
- [Adobe Spectrum](https://spectrum.adobe.com/)
