# Ark UI 无样式组件库模板

## 技术栈

### 核心技术
- **@ark-ui/react**: React 无样式组件
- **@ark-ui/vue**: Vue 无样式组件
- **@ark-ui/solid**: Solid 无样式组件
- **Tailwind CSS**: 样式框架（推荐）
- **TypeScript**: 类型安全

### 特性
- 完全无样式，可自定义
- 基于 Zag.js 状态机
- 内置可访问性（WAI-ARIA）
- 支持键盘导航
- 多框架支持
- SSR 友好

## 项目结构

```
ark-ui-app/
├── src/
│   ├── components/
│   │   ├── ui/              # UI 基础组件
│   │   │   ├── Accordion.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── Menu.tsx
│   │   │   ├── Popover.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   └── index.ts
│   │   └── composite/       # 复合组件
│   │       ├── DatePicker/
│   │       ├── Select/
│   │       └── Combobox/
│   ├── styles/
│   │   ├── components.css
│   │   └── utilities.css
│   ├── hooks/
│   │   └── useTheme.ts
│   ├── App.tsx
│   └── main.tsx
├── tailwind.config.js
├── package.json
└── tsconfig.json
```

## 核心代码模式

### 1. Accordion 组件

```typescript
// src/components/ui/Accordion.tsx
import React from 'react';
import { Accordion } from '@ark-ui/react/accordion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface AccordionItem {
  value: string;
  title: string;
  content: React.ReactNode;
}

interface CustomAccordionProps {
  items: AccordionItem[];
  multiple?: boolean;
  collapsible?: boolean;
  defaultValue?: string[];
  className?: string;
}

export function CustomAccordion({
  items,
  multiple = false,
  collapsible = true,
  defaultValue = [],
  className = '',
}: CustomAccordionProps) {
  return (
    <Accordion.Root
      multiple={multiple}
      collapsible={collapsible}
      defaultValue={defaultValue}
      className={`w-full ${className}`}
    >
      {items.map((item, index) => (
        <Accordion.Item
          key={item.value}
          value={item.value}
          className="border-b border-gray-200 last:border-0"
        >
          <Accordion.ItemTrigger className="flex w-full items-center justify-between py-4 text-left hover:bg-gray-50">
            <span className="text-sm font-medium text-gray-900">
              {item.title}
            </span>
            <Accordion.ItemIndicator>
              <ChevronDownIcon className="h-5 w-5 text-gray-500 transition-transform duration-200 data-[state=open]:rotate-180" />
            </Accordion.ItemIndicator>
          </Accordion.ItemTrigger>

          <Accordion.ItemContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <div className="pb-4 pt-0 text-sm text-gray-600">
              {item.content}
            </div>
          </Accordion.ItemContent>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}

// 使用示例
export function AccordionExample() {
  const items = [
    {
      value: 'item-1',
      title: 'What is Ark UI?',
      content:
        'Ark UI is a collection of unstyled, accessible UI components that work with React, Vue, and Solid.',
    },
    {
      value: 'item-2',
      title: 'How do I style components?',
      content:
        'Ark UI provides unstyled components, so you can style them using any CSS framework like Tailwind, styled-components, or plain CSS.',
    },
    {
      value: 'item-3',
      title: 'Is it accessible?',
      content:
        'Yes! All components follow WAI-ARIA guidelines and support keyboard navigation out of the box.',
    },
  ];

  return (
    <div className="mx-auto max-w-md p-4">
      <CustomAccordion items={items} />
    </div>
  );
}
```

### 2. Dialog/Modal 组件

```typescript
// src/components/ui/Dialog.tsx
import React from 'react';
import { Dialog } from '@ark-ui/react/dialog';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface CustomDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
}

export function CustomDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  showCloseButton = true,
}: CustomDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Positioner className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Content className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
            {title && (
              <Dialog.Title className="mb-2 text-lg font-semibold text-gray-900">
                {title}
              </Dialog.Title>
            )}
            {description && (
              <Dialog.Description className="mb-4 text-sm text-gray-600">
                {description}
              </Dialog.Description>
            )}

            {children}

            {showCloseButton && (
              <Dialog.CloseTrigger className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2">
                <XMarkIcon className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Dialog.CloseTrigger>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// 使用示例
export function DialogExample() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
      >
        Open Dialog
      </button>

      <CustomDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Edit Profile"
        description="Make changes to your profile here. Click save when you're done."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="your@email.com"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsOpen(false)}
              className="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </div>
      </CustomDialog>
    </>
  );
}
```

### 3. Menu/Dropdown 组件

```typescript
// src/components/ui/Menu.tsx
import React from 'react';
import { Menu } from '@ark-ui/react/menu';

interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

interface CustomMenuProps {
  trigger: React.ReactNode;
  items: MenuItem[];
  label?: string;
}

export function CustomMenu({ trigger, items, label }: CustomMenuProps) {
  return (
    <Menu.Root>
      <Menu.Trigger className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2">
        {trigger}
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner className="z-50">
          <Menu.Content className="min-w-[180px] rounded-md border border-gray-200 bg-white p-1 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
            {label && (
              <Menu.Label className="px-2 py-1.5 text-sm font-semibold text-gray-900">
                {label}
              </Menu.Label>
            )}

            {items.map((item) => (
              <Menu.Item
                key={item.id}
                id={item.id}
                disabled={item.disabled}
                onClick={item.onClick}
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                {item.icon && <span className="mr-2 h-4 w-4">{item.icon}</span>}
                {item.label}
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

// 使用示例
export function MenuExample() {
  const items: MenuItem[] = [
    {
      id: 'profile',
      label: 'Profile',
      onClick: () => console.log('Profile clicked'),
    },
    {
      id: 'settings',
      label: 'Settings',
      onClick: () => console.log('Settings clicked'),
    },
    {
      id: 'separator',
      label: '',
    },
    {
      id: 'logout',
      label: 'Log out',
      onClick: () => console.log('Logout clicked'),
    },
  ];

  return (
    <CustomMenu
      trigger={<button className="px-4 py-2">Open Menu</button>}
      items={items}
      label="My Account"
    />
  );
}
```

### 4. Tabs 组件

```typescript
// src/components/ui/Tabs.tsx
import React from 'react';
import { Tabs } from '@ark-ui/react/tabs';

interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface CustomTabsProps {
  items: TabItem[];
  defaultValue?: string;
  orientation?: 'horizontal' | 'vertical';
  onChange?: (value: string) => void;
}

export function CustomTabs({
  items,
  defaultValue,
  orientation = 'horizontal',
  onChange,
}: CustomTabsProps) {
  return (
    <Tabs.Root
      defaultValue={defaultValue || items[0]?.id}
      orientation={orientation}
      onValueChange={(details) => onChange?.(details.value)}
      className="w-full"
    >
      <Tabs.List
        className={`${
          orientation === 'horizontal'
            ? 'inline-flex h-10 items-center justify-center rounded-lg bg-gray-100 p-1'
            : 'inline-flex flex-col w-48 space-y-1'
        }`}
      >
        {items.map((item) => (
          <Tabs.Trigger
            key={item.id}
            value={item.id}
            disabled={item.disabled}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[selected]:bg-white data-[selected]:text-gray-900 data-[selected]:shadow-sm`}
          >
            {item.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      <div className={orientation === 'horizontal' ? 'mt-4' : 'ml-4 flex-1'}>
        {items.map((item) => (
          <Tabs.Content
            key={item.id}
            value={item.id}
            className="mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
          >
            {item.content}
          </Tabs.Content>
        ))}
      </div>
    </Tabs.Root>
  );
}

// 使用示例
export function TabsExample() {
  const tabs: TabItem[] = [
    {
      id: 'account',
      label: 'Account',
      content: (
        <div>
          <h3 className="text-lg font-semibold">Account Settings</h3>
          <p className="mt-2 text-sm text-gray-600">
            Manage your account settings and preferences.
          </p>
        </div>
      ),
    },
    {
      id: 'password',
      label: 'Password',
      content: (
        <div>
          <h3 className="text-lg font-semibold">Password</h3>
          <p className="mt-2 text-sm text-gray-600">
            Change your password here. After saving, you'll be logged out.
          </p>
        </div>
      ),
    },
    {
      id: 'notifications',
      label: 'Notifications',
      content: (
        <div>
          <h3 className="text-lg font-semibold">Notifications</h3>
          <p className="mt-2 text-sm text-gray-600">
            Configure how you receive notifications.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-md p-4">
      <CustomTabs items={tabs} defaultValue="account" />
    </div>
  );
}
```

### 5. Popover 组件

```typescript
// src/components/ui/Popover.tsx
import React from 'react';
import { Popover } from '@ark-ui/react/popover';

interface CustomPopoverProps {
  trigger: React.ReactNode;
  title?: string;
  content: React.ReactNode;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  showCloseButton?: boolean;
}

export function CustomPopover({
  trigger,
  title,
  content,
  placement = 'bottom',
  showCloseButton = true,
}: CustomPopoverProps) {
  return (
    <Popover.Root placement={placement}>
      <Popover.Trigger className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2">
        {trigger}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner className="z-50">
          <Popover.Content className="w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
            {title && (
              <Popover.Title className="mb-2 text-sm font-semibold text-gray-900">
                {title}
              </Popover.Title>
            )}

            <Popover.Description className="text-sm text-gray-600">
              {content}
            </Popover.Description>

            {showCloseButton && (
              <Popover.CloseTrigger className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Popover.CloseTrigger>
            )}

            <Popover.Arrow className="fill-white">
              <svg width="10" height="5" viewBox="0 0 30 10">
                <path d="M0 0 L15 10 L30 0 Z" fill="white" />
              </svg>
            </Popover.Arrow>
          </Popover.Content>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

// 使用示例
export function PopoverExample() {
  return (
    <div className="p-20">
      <CustomPopover
        trigger={<button className="rounded bg-gray-100 px-4 py-2">Show Popover</button>}
        title="Notifications"
        content={
          <div>
            <p>You have 3 unread messages.</p>
            <button className="mt-2 text-blue-500 hover:underline">
              View all
            </button>
          </div>
        }
        placement="right"
      />
    </div>
  );
}
```

### 6. Tooltip 组件

```typescript
// src/components/ui/Tooltip.tsx
import React from 'react';
import { Tooltip } from '@ark-ui/react/tooltip';

interface CustomTooltipProps {
  content: React.ReactNode;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  openDelay?: number;
  closeDelay?: number;
  children: React.ReactNode;
}

export function CustomTooltip({
  content,
  placement = 'top',
  openDelay = 200,
  closeDelay = 0,
  children,
}: CustomTooltipProps) {
  return (
    <Tooltip.Root
      openDelay={openDelay}
      closeDelay={closeDelay}
      positioning={{ placement }}
    >
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>

      <Tooltip.Portal>
        <Tooltip.Positioner className="z-50">
          <Tooltip.Content className="z-50 overflow-hidden rounded-md bg-gray-900 px-3 py-1.5 text-xs text-gray-50 shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
            {content}
            <Tooltip.Arrow className="fill-gray-900">
              <svg width="8" height="4" viewBox="0 0 30 10">
                <path d="M0 0 L15 10 L30 0 Z" fill="#111827" />
              </svg>
            </Tooltip.Arrow>
          </Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

// 使用示例
export function TooltipExample() {
  return (
    <div className="flex space-x-4 p-20">
      <CustomTooltip content="This is a helpful tooltip" placement="top">
        <button className="rounded bg-blue-500 px-4 py-2 text-white">
          Hover me
        </button>
      </CustomTooltip>

      <CustomTooltip
        content={
          <div>
            <p className="font-semibold">More info</p>
            <p className="text-xs opacity-90">Additional details here</p>
          </div>
        }
        placement="right"
      >
        <button className="rounded bg-gray-500 px-4 py-2 text-white">
          More info
        </button>
      </CustomTooltip>
    </div>
  );
}
```

### 7. Select 组件

```typescript
// src/components/ui/Select.tsx
import React from 'react';
import { Select } from '@ark-ui/react/select';
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  options: SelectOption[];
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  label?: string;
}

export function CustomSelect({
  options,
  placeholder = 'Select an option',
  value,
  onChange,
  disabled = false,
  label,
}: CustomSelectProps) {
  return (
    <Select.Root
      value={value ? [value] : undefined}
      onValueChange={(details) => onChange?.(details.value[0])}
      disabled={disabled}
    >
      {label && (
        <Select.Label className="mb-2 block text-sm font-medium text-gray-700">
          {label}
        </Select.Label>
      )}

      <Select.Control className="relative">
        <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
          <Select.ValueText placeholder={placeholder} />
          <Select.Indicator>
            <ChevronDownIcon className="h-4 w-4 opacity-50" />
          </Select.Indicator>
        </Select.Trigger>
      </Select.Control>

      <Select.Portal>
        <Select.Positioner className="z-50">
          <Select.Content className="relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white text-gray-900 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
            <Select.Viewport className="p-1">
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  item={option}
                  disabled={option.disabled}
                  className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <Select.ItemIndicator>
                      <CheckIcon className="h-4 w-4" />
                    </Select.ItemIndicator>
                  </span>
                  <Select.ItemText>{option.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

// 使用示例
export function SelectExample() {
  const [value, setValue] = React.useState('');

  const options: SelectOption[] = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Orange', value: 'orange', disabled: true },
    { label: 'Mango', value: 'mango' },
  ];

  return (
    <div className="mx-auto max-w-sm p-4">
      <CustomSelect
        label="Favorite fruit"
        options={options}
        value={value}
        onChange={setValue}
        placeholder="Choose a fruit"
      />
      <p className="mt-2 text-sm text-gray-600">
        Selected: {value || 'None'}
      </p>
    </div>
  );
}
```

## 最佳实践

### 1. 样式封装
```typescript
// ✅ Good - 创建封装的自定义组件
export function CustomDialog({ children, ...props }) {
  return (
    <Dialog.Root {...props}>
      <Dialog.Content className="your-custom-styles">
        {children}
      </Dialog.Content>
    </Dialog.Root>
  );
}

// ❌ Bad - 每次都重新定义样式
<Dialog.Root>
  <Dialog.Content className="inline-flex rounded...">
    {/* 重复的样式定义 */}
  </Dialog.Content>
</Dialog.Root>
```

### 2. 可访问性
```typescript
// ✅ Good - 始终提供有意义的标签
<Dialog.Title>Edit Profile</Dialog.Title>
<Dialog.Description>
  Make changes to your profile here.
</Dialog.Description>

// ❌ Bad - 省略可访问性属性
<Dialog.Content>
  {/* 没有标题或描述 */}
</Dialog.Content>
```

### 3. 状态管理
```typescript
// ✅ Good - 受控组件
const [open, setOpen] = useState(false);
<Dialog.Root open={open} onOpenChange={setOpen}>

// ✅ Good - 非受控组件（简单场景）
<Dialog.Root defaultOpen={false}>
```

### 4. 动画优化
```typescript
// ✅ Good - 使用 data 属性进行动画
<Dialog.Content
  className="data-[state=open]:animate-in
             data-[state=closed]:animate-out"
>
```

## 依赖安装

```bash
# React
npm install @ark-ui/react

# Vue
npm install @ark-ui/vue

# Solid
npm install @ark-ui/solid

# 样式工具（推荐）
npm install tailwindcss
npm install @heroicons/react  # 图标库
```

## Tailwind 配置

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}
```

## TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "module": "ESNext",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

## 参考资源

- [Ark UI 官方文档](https://ark-ui.com/)
- [GitHub 仓库](https://github.com/chakra-ui/ark)
- [组件示例](https://ark-ui.com/react/docs/components/accordion)
- [Tailwind 集成](https://ark-ui.com/docs/styling/tailwind)
- [可访问性指南](https://www.w3.org/WAI/ARIA/apg/)
