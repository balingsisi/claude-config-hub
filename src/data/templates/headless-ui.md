# Headless UI 模板

## 技术栈

### 核心技术
- **Headless UI**: Tailwind CSS 团队的无样式 UI 组件库
- **React / Vue**: 支持 React 18+ 和 Vue 3
- **Tailwind CSS**: 实用优先的 CSS 框架
- **Framer Motion**: 动画库（可选）
- **Heroicons / Lucide**: 图标库

### 开发工具
- **TypeScript**: 类型安全
- **@headlessui/react**: React 组件
- **@headlessui/tailwindcss**: Tailwind 插件
- **clsx / tailwind-merge**: 类名工具

## 项目结构

```
headless-ui-project/
├── src/
│   ├── components/
│   │   ├── ui/                    # Headless UI 封装
│   │   │   ├── Menu.tsx           # 下拉菜单
│   │   │   ├── Listbox.tsx        # 列表选择框
│   │   │   ├── Combobox.tsx       # 组合框
│   │   │   ├── Dialog.tsx         # 对话框
│   │   │   ├── Disclosure.tsx     # 折叠面板
│   │   │   ├── Popover.tsx        # 弹出框
│   │   │   ├── Tab.tsx            # 标签页
│   │   │   ├── RadioGroup.tsx     # 单选组
│   │   │   ├── Switch.tsx         # 开关
│   │   │   ├── Transition.tsx     # 过渡动画
│   │   │   └── FocusTrap.tsx      # 焦点捕获
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── MobileMenu.tsx
│   │   └── forms/
│   │       ├── SearchCombobox.tsx
│   │       ├── CountrySelect.tsx
│   │       └── SettingsForm.tsx
│   ├── hooks/
│   │   ├── useClickOutside.ts
│   │   └── useKeyNavigation.ts
│   ├── lib/
│   │   └── utils.ts
│   └── app/
│       ├── layout.tsx
│       └── page.tsx
├── tailwind.config.js
├── package.json
└── tsconfig.json
```

## 代码模式

### 1. 下拉菜单 (components/ui/Menu.tsx)

```typescript
'use client'

import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { cn } from '@/lib/utils'

interface MenuItem {
  label: string
  onClick?: () => void
  icon?: React.ReactNode
  disabled?: boolean
  danger?: boolean
}

interface MenuDropdownProps {
  items: MenuItem[]
  trigger: React.ReactNode
  className?: string
}

export function MenuDropdown({
  items,
  trigger,
  className,
}: MenuDropdownProps) {
  return (
    <Menu as="div" className={cn('relative inline-block text-left', className)}>
      <Menu.Button className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50">
        {trigger}
        <ChevronDownIcon className="h-4 w-4 text-gray-500" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
          <div className="p-1">
            {items.map((item, index) => (
              <Menu.Item key={index} disabled={item.disabled}>
                {({ active, disabled }) => (
                  <button
                    onClick={item.onClick}
                    disabled={disabled}
                    className={cn(
                      'group flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm',
                      active && 'bg-gray-100',
                      disabled && 'opacity-50 cursor-not-allowed',
                      item.danger && 'text-red-600',
                      !item.danger && 'text-gray-900'
                    )}
                  >
                    {item.icon && (
                      <span className="h-5 w-5 opacity-60">{item.icon}</span>
                    )}
                    {item.label}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}

// 使用示例
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

function Example() {
  return (
    <MenuDropdown
      trigger="Options"
      items={[
        { label: 'Edit', icon: <PencilIcon />, onClick: () => {} },
        { label: 'Delete', icon: <TrashIcon />, danger: true, onClick: () => {} },
      ]}
    />
  )
}
```

### 2. 列表选择框 (components/ui/Listbox.tsx)

```typescript
'use client'

import { Fragment } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { cn } from '@/lib/utils'

interface Option {
  id: string | number
  name: string
  description?: string
  icon?: React.ReactNode
  disabled?: boolean
}

interface ListboxSelectProps {
  value: Option
  onChange: (value: Option) => void
  options: Option[]
  label?: string
  className?: string
}

export function ListboxSelect({
  value,
  onChange,
  options,
  label,
  className,
}: ListboxSelectProps) {
  return (
    <Listbox value={value} onChange={onChange}>
      {({ open }) => (
        <div className={cn('relative', className)}>
          {label && (
            <Listbox.Label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </Listbox.Label>
          )}
          <div className="relative">
            <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2.5 pl-3 pr-10 text-left shadow-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm">
              <span className="flex items-center gap-2">
                {value.icon && <span className="h-5 w-5">{value.icon}</span>}
                <span className="block truncate">{value.name}</span>
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
              </span>
            </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                {options.map((option) => (
                  <Listbox.Option
                    key={option.id}
                    value={option}
                    disabled={option.disabled}
                    className={({ active, selected }) =>
                      cn(
                        'relative cursor-pointer select-none py-2 pl-3 pr-9',
                        active && 'bg-gray-100',
                        option.disabled && 'opacity-50 cursor-not-allowed'
                      )
                    }
                  >
                    {({ selected }) => (
                      <>
                        <div className="flex items-center gap-2">
                          {option.icon && (
                            <span className="h-5 w-5">{option.icon}</span>
                          )}
                          <div>
                            <span
                              className={cn(
                                'block truncate',
                                selected && 'font-semibold'
                              )}
                            >
                              {option.name}
                            </span>
                            {option.description && (
                              <span className="block text-xs text-gray-500">
                                {option.description}
                              </span>
                            )}
                          </div>
                        </div>
                        {selected && (
                          <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary">
                            <CheckIcon className="h-5 w-5" />
                          </span>
                        )}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </div>
      )}
    </Listbox>
  )
}
```

### 3. 组合框/搜索框 (components/ui/Combobox.tsx)

```typescript
'use client'

import { Fragment, useState, useEffect } from 'react'
import { Combobox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { cn } from '@/lib/utils'

interface ComboboxSearchProps<T> {
  value: T | null
  onChange: (value: T) => void
  options: T[]
  displayValue: (option: T) => string
  filterFn?: (query: string, options: T[]) => T[]
  placeholder?: string
  label?: string
  className?: string
}

export function ComboboxSearch<T extends { id: string | number }>({
  value,
  onChange,
  options,
  displayValue,
  filterFn,
  placeholder = 'Search...',
  label,
  className,
}: ComboboxSearchProps<T>) {
  const [query, setQuery] = useState('')
  const [filtered, setFiltered] = useState(options)

  useEffect(() => {
    if (!query) {
      setFiltered(options)
      return
    }

    if (filterFn) {
      setFiltered(filterFn(query, options))
    } else {
      const lowerQuery = query.toLowerCase()
      setFiltered(
        options.filter((option) =>
          displayValue(option).toLowerCase().includes(lowerQuery)
        )
      )
    }
  }, [query, options, filterFn, displayValue])

  return (
    <Combobox value={value} onChange={onChange} nullable>
      {({ open }) => (
        <div className={cn('relative', className)}>
          {label && (
            <Combobox.Label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </Combobox.Label>
          )}
          <div className="relative">
            <div className="relative w-full">
              <Combobox.Input
                className="w-full rounded-lg border-0 bg-white py-2.5 pl-3 pr-10 shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-primary sm:text-sm"
                displayValue={(item: T | null) => (item ? displayValue(item) : '')}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
              />
              <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
              </Combobox.Button>
            </div>

            <Transition
              show={open}
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                {filtered.length === 0 && query !== '' ? (
                  <div className="relative cursor-pointer select-none px-4 py-2 text-gray-700">
                    Nothing found.
                  </div>
                ) : (
                  filtered.map((option) => (
                    <Combobox.Option
                      key={option.id}
                      value={option}
                      className={({ active }) =>
                        cn(
                          'relative cursor-pointer select-none py-2 pl-3 pr-9',
                          active && 'bg-gray-100'
                        )
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span
                            className={cn(
                              'block truncate',
                              selected && 'font-semibold'
                            )}
                          >
                            {displayValue(option)}
                          </span>
                          {selected && (
                            <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary">
                              <CheckIcon className="h-5 w-5" />
                            </span>
                          )}
                        </>
                      )}
                    </Combobox.Option>
                  ))
                )}
              </Combobox.Options>
            </Transition>
          </div>
        </div>
      )}
    </Combobox>
  )
}
```

### 4. 对话框/模态框 (components/ui/Dialog.tsx)

```typescript
'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  className,
}: ModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* 背景遮罩 */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={cn(
                  'w-full transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all',
                  sizeClasses[size],
                  className
                )}
              >
                {/* 关闭按钮 */}
                <div className="absolute right-4 top-4">
                  <button
                    type="button"
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* 标题 */}
                {title && (
                  <div className="px-6 pt-6">
                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                      {title}
                    </Dialog.Title>
                    {description && (
                      <Dialog.Description className="mt-2 text-sm text-gray-500">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>
                )}

                {/* 内容 */}
                <div className="p-6">{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

// 使用示例
function Example() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Delete Item"
        description="This action cannot be undone."
      >
        <p>Are you sure you want to delete this item?</p>
        <div className="mt-4 flex gap-2 justify-end">
          <button onClick={() => setIsOpen(false)}>Cancel</button>
          <button className="bg-red-500 text-white px-4 py-2 rounded">
            Delete
          </button>
        </div>
      </Modal>
    </>
  )
}
```

### 5. 标签页 (components/ui/Tab.tsx)

```typescript
'use client'

import { Tab } from '@headlessui/react'
import { cn } from '@/lib/utils'

interface TabItem {
  label: string
  content: React.ReactNode
  icon?: React.ReactNode
  disabled?: boolean
}

interface TabsProps {
  tabs: TabItem[]
  defaultIndex?: number
  onChange?: (index: number) => void
  variant?: 'line' | 'pills'
  className?: string
}

export function Tabs({
  tabs,
  defaultIndex = 0,
  onChange,
  variant = 'line',
  className,
}: TabsProps) {
  return (
    <Tab.Group defaultIndex={defaultIndex} onChange={onChange}>
      <Tab.List
        className={cn(
          'flex',
          variant === 'line' && 'border-b border-gray-200',
          variant === 'pills' && 'gap-2 rounded-lg bg-gray-100 p-1',
          className
        )}
      >
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            disabled={tab.disabled}
            className={({ selected }) =>
              cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium outline-none transition-colors',
                variant === 'line' && [
                  '-mb-px border-b-2',
                  selected
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                ],
                variant === 'pills' && [
                  'rounded-md',
                  selected
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900',
                ],
                tab.disabled && 'opacity-50 cursor-not-allowed'
              )
            }
          >
            {tab.icon && <span className="h-5 w-5">{tab.icon}</span>}
            {tab.label}
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels className="mt-4">
        {tabs.map((tab, index) => (
          <Tab.Panel key={index}>{tab.content}</Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  )
}
```

### 6. 开关组件 (components/ui/Switch.tsx)

```typescript
'use client'

import { Switch } from '@headlessui/react'
import { cn } from '@/lib/utils'

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeConfig = {
  sm: {
    container: 'h-5 w-9',
    dot: 'h-4 w-4',
    translate: 'translate-x-4',
  },
  md: {
    container: 'h-6 w-11',
    dot: 'h-5 w-5',
    translate: 'translate-x-5',
  },
  lg: {
    container: 'h-7 w-14',
    dot: 'h-6 w-6',
    translate: 'translate-x-7',
  },
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className,
}: ToggleSwitchProps) {
  const config = sizeConfig[size]

  return (
    <Switch.Group>
      <div className={cn('flex items-center gap-4', className)}>
        <Switch
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className={cn(
            'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            config.container,
            checked ? 'bg-primary' : 'bg-gray-200',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
              config.dot,
              checked ? config.translate : 'translate-x-0'
            )}
          />
        </Switch>
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <Switch.Label className="text-sm font-medium text-gray-900">
                {label}
              </Switch.Label>
            )}
            {description && (
              <Switch.Description className="text-sm text-gray-500">
                {description}
              </Switch.Description>
            )}
          </div>
        )}
      </div>
    </Switch.Group>
  )
}
```

## 最佳实践

### 1. 可访问性
```typescript
// ✅ 使用 Headless UI 提供的 ARIA 属性
<Menu.Button className="...">
<Menu.Items className="...">
  <Menu.Item>...</Menu.Item>
</Menu.Items>

// ✅ 提供适当的标签
<Switch.Label>Enable notifications</Switch.Label>

// ✅ 使用 Description
<Switch.Description>
  Receive push notifications for new messages
</Switch.Description>
```

### 2. 过渡动画
```typescript
// ✅ 使用 Transition 组件
<Transition
  show={isOpen}
  enter="transition ease-out duration-100"
  enterFrom="transform opacity-0 scale-95"
  enterTo="transform opacity-100 scale-100"
  leave="transition ease-in duration-75"
  leaveFrom="transform opacity-100 scale-100"
  leaveTo="transform opacity-0 scale-95"
>

// ✅ 使用 Fragment 包装
<Transition as={Fragment} show={isOpen}>
```

### 3. 受控 vs 非受控
```typescript
// ✅ 受控组件（推荐用于表单）
<Listbox value={selected} onChange={setSelected}>

// ✅ 非受控组件
<Disclosure defaultOpen={false}>

// ✅ 使用 nullable 处理空值
<Combobox value={value} onChange={onChange} nullable>
```

### 4. 焦点管理
```typescript
// ✅ 自动焦点捕获
<Dialog onClose={close} initialFocus={initialRef}>

// ✅ 自定义焦点顺序
<Tab.Group>
  <Tab.List>
    <Tab>Tab 1</Tab>
    <Tab>Tab 2</Tab>
  </Tab.List>
</Tab.Group>
```

## 常用命令

### 安装
```bash
# React
npm install @headlessui/react

# Vue
npm install @headlessui/vue

# Tailwind 插件
npm install @headlessui/tailwindcss
```

### Tailwind 配置
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [
    require('@headlessui/tailwindcss'),
  ],
}
```

## 扩展资源

- [Headless UI 官方文档](https://headlessui.com)
- [React 组件 API](https://headlessui.com/react/menu)
- [Vue 组件 API](https://headlessui.com/vue/menu)
- [Tailwind CSS 集成](https://tailwindui.com/components)
- [示例代码库](https://github.com/tailwindlabs/headlessui/tree/main/packages/%40headlessui-react/src/components)
