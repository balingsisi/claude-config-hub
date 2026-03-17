# Headless UI 无样式组件库

## 技术栈

- **Headless UI** - 无样式 UI 组件
- **React 18+** - UI 框架
- **Tailwind CSS** - 样式框架（推荐）
- **TypeScript** - 类型安全
- **Framer Motion** - 动画（可选）

## 项目结构

```
src/
├── components/
│   ├── ui/                    # Headless UI 封装
│   │   ├── Menu.tsx           # 下拉菜单
│   │   ├── Listbox.tsx        # 选择框
│   │   ├── Combobox.tsx       # 组合框
│   │   ├── Dialog.tsx         # 模态框
│   │   ├── Disclosure.tsx     # 折叠面板
│   │   ├── Popover.tsx        # 弹出框
│   │   ├── RadioGroup.tsx     # 单选组
│   │   ├── Switch.tsx         # 开关
│   │   ├── Tab.tsx            # 标签页
│   │   └── Transition.tsx     # 过渡动画
│   ├── forms/                 # 表单组件
│   │   ├── Select.tsx
│   │   ├── Autocomplete.tsx
│   │   └── Toggle.tsx
│   ├── modals/                # 模态框
│   │   ├── ConfirmDialog.tsx
│   │   └── AlertDialog.tsx
│   └── navigation/            # 导航组件
│       ├── Dropdown.tsx
│       └── MegaMenu.tsx
├── hooks/
│   └── useFloatingUI.ts       # 定位工具
└── App.tsx
```

## 核心概念

### 1. Menu 下拉菜单

```tsx
// components/ui/Menu.tsx
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

interface MenuOption {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  onClick?: () => void;
}

interface DropdownMenuProps {
  button: React.ReactNode;
  items: MenuOption[];
  className?: string;
}

export function DropdownMenu({ button, items, className }: DropdownMenuProps) {
  return (
    <Menu as="div" className={`relative ${className}`}>
      <MenuButton className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
        {button}
        <ChevronDownIcon className="h-4 w-4" />
      </MenuButton>

      <Transition
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
          {items.map((item) => (
            <MenuItem key={item.id} disabled={item.disabled}>
              {({ active, disabled }) => (
                <button
                  onClick={item.onClick}
                  className={`
                    group flex w-full items-center gap-2 px-4 py-2 text-sm
                    ${active ? 'bg-blue-500 text-white' : 'text-gray-700'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {item.icon && <item.icon className="h-5 w-5" />}
                  {item.label}
                </button>
              )}
            </MenuItem>
          ))}
        </MenuItems>
      </Transition>
    </Menu>
  );
}

// 使用示例
function App() {
  const menuItems = [
    { id: 'edit', label: 'Edit', onClick: () => console.log('Edit') },
    { id: 'duplicate', label: 'Duplicate', onClick: () => console.log('Duplicate') },
    { id: 'archive', label: 'Archive', onClick: () => console.log('Archive') },
    { id: 'delete', label: 'Delete', onClick: () => console.log('Delete') },
  ];

  return (
    <DropdownMenu button="Options" items={menuItems} />
  );
}
```

### 2. Listbox 选择框

```tsx
// components/ui/Listbox.tsx
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

interface SelectOption {
  id: string;
  name: string;
  avatar?: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: SelectOption;
  onChange: (value: SelectOption) => void;
  options: SelectOption[];
  label?: string;
  placeholder?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  label,
  placeholder = 'Select...',
}: CustomSelectProps) {
  return (
    <Listbox value={value} onChange={onChange}>
      {label && (
        <Listbox.Label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </Listbox.Label>
      )}
      <div className="relative">
        <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm">
          <span className={value ? 'block truncate' : 'block truncate text-gray-400'}>
            {value?.name || placeholder}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </span>
        </ListboxButton>

        <Transition
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
            {options.map((option) => (
              <ListboxOption
                key={option.id}
                value={option}
                disabled={option.disabled}
                className={({ active, selected }) =>
                  `relative cursor-default select-none py-2 pl-3 pr-9 ${
                    active ? 'bg-blue-600 text-white' : 'text-gray-900'
                  } ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}`
                }
              >
                {({ selected }) => (
                  <>
                    {option.avatar && (
                      <img
                        src={option.avatar}
                        alt=""
                        className="h-6 w-6 flex-shrink-0 rounded-full"
                      />
                    )}
                    <span className={`block truncate ${selected ? 'font-semibold' : ''}`}>
                      {option.name}
                    </span>
                    {selected && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )}
                  </>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>
  );
}
```

### 3. Combobox 组合框

```tsx
// components/ui/Combobox.tsx
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { useState, useMemo } from 'react';

interface AutocompleteOption {
  id: string;
  name: string;
}

interface AutocompleteProps {
  value: AutocompleteOption | null;
  onChange: (value: AutocompleteOption | null) => void;
  options: AutocompleteOption[];
  placeholder?: string;
  displayValue?: (option: AutocompleteOption) => string;
}

export function Autocomplete({
  value,
  onChange,
  options,
  placeholder = 'Search...',
  displayValue = (option) => option.name,
}: AutocompleteProps) {
  const [query, setQuery] = useState('');

  const filteredOptions = useMemo(() => {
    if (!query) return options;
    return options.filter((option) =>
      option.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [options, query]);

  return (
    <Combobox value={value} onChange={onChange} nullable>
      <div className="relative">
        <div className="relative w-full">
          <ComboboxInput
            className="w-full rounded-md border-0 bg-white py-2 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm"
            displayValue={displayValue}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
          />
          <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </ComboboxButton>
        </div>

        <Transition
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery('')}
        >
          <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
            {filteredOptions.length === 0 && query !== '' ? (
              <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                Nothing found.
              </div>
            ) : (
              filteredOptions.map((option) => (
                <ComboboxOption
                  key={option.id}
                  value={option}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-3 pr-9 ${
                      active ? 'bg-blue-600 text-white' : 'text-gray-900'
                    }`
                  }
                >
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-medium' : ''}`}>
                        {option.name}
                      </span>
                      {selected && (
                        <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      )}
                    </>
                  )}
                </ComboboxOption>
              ))
            )}
          </ComboboxOptions>
        </Transition>
      </div>
    </Combobox>
  );
}
```

### 4. Dialog 模态框

```tsx
// components/ui/Dialog.tsx
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
};

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <DialogBackdrop className="fixed inset-0 bg-black/50" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className={`w-full ${sizeClasses[size]} transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all`}>
                {title && (
                  <div className="flex items-center justify-between mb-4">
                    <DialogTitle className="text-lg font-semibold text-gray-900">
                      {title}
                    </DialogTitle>
                    <button
                      onClick={onClose}
                      className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                )}
                {children}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// 使用示例
function ConfirmDialog({ isOpen, onClose, onConfirm }: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Action" size="sm">
      <p className="text-gray-600 mb-6">
        Are you sure you want to proceed? This action cannot be undone.
      </p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
        >
          Confirm
        </button>
      </div>
    </Modal>
  );
}
```

### 5. Tab 标签页

```tsx
// components/ui/Tab.tsx
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';

interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  defaultIndex?: number;
  onChange?: (index: number) => void;
  variant?: 'default' | 'pills' | 'bordered';
}

export function Tabs({ tabs, defaultIndex = 0, onChange, variant = 'default' }: TabsProps) {
  return (
    <TabGroup defaultIndex={defaultIndex} onChange={onChange}>
      <TabList className={`
        flex gap-2
        ${variant === 'default' ? 'border-b border-gray-200' : ''}
        ${variant === 'pills' ? 'bg-gray-100 p-1 rounded-lg' : ''}
        ${variant === 'bordered' ? 'bg-white rounded-t-lg border border-b-0 border-gray-200 p-1' : ''}
      `}>
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            disabled={tab.disabled}
            className={({ selected }) => `
              px-4 py-2 text-sm font-medium outline-none transition-colors
              ${variant === 'default' ? `
                -mb-px border-b-2
                ${selected ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              ` : ''}
              ${variant === 'pills' ? `
                rounded-md
                ${selected ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'}
              ` : ''}
              ${variant === 'bordered' ? `
                rounded-md
                ${selected ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-800'}
              ` : ''}
              ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {tab.label}
          </Tab>
        ))}
      </TabList>

      <TabPanels className="mt-4">
        {tabs.map((tab) => (
          <TabPanel key={tab.id}>{tab.content}</TabPanel>
        ))}
      </TabPanels>
    </TabGroup>
  );
}

// 使用示例
function SettingsPage() {
  const tabs = [
    {
      id: 'profile',
      label: 'Profile',
      content: <ProfileSettings />,
    },
    {
      id: 'account',
      label: 'Account',
      content: <AccountSettings />,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      content: <NotificationSettings />,
    },
  ];

  return <Tabs tabs={tabs} variant="pills" />;
}
```

### 6. Switch 开关

```tsx
// components/ui/Switch.tsx
import { Switch, Field, Label } from '@headlessui/react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  return (
    <Field className="flex items-center justify-between">
      <div className="flex flex-col">
        {label && (
          <Label className="text-sm font-medium text-gray-900">{label}</Label>
        )}
        {description && (
          <span className="text-sm text-gray-500">{description}</span>
        )}
      </div>
      <Switch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={`
          group relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${checked ? 'bg-blue-600' : 'bg-gray-200'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <span className="sr-only">{label}</span>
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg
            ring-0 transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </Switch>
    </Field>
  );
}

// 使用示例
function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);

  return (
    <div className="space-y-6">
      <Toggle
        checked={emailNotifications}
        onChange={setEmailNotifications}
        label="Email notifications"
        description="Receive updates via email"
      />
      <Toggle
        checked={pushNotifications}
        onChange={setPushNotifications}
        label="Push notifications"
        description="Receive push notifications on your device"
      />
    </div>
  );
}
```

### 7. Disclosure 折叠面板

```tsx
// components/ui/Disclosure.tsx
import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
  defaultOpen?: boolean;
}

interface AccordionProps {
  items: AccordionItem[];
  multiple?: boolean; // 是否允许多个同时展开
}

export function Accordion({ items, multiple = false }: AccordionProps) {
  return (
    <div className="divide-y divide-gray-200 rounded-lg bg-white">
      {items.map((item) => (
        <Disclosure key={item.id} defaultOpen={item.defaultOpen}>
          {({ open }) => (
            <>
              <DisclosureButton className="flex w-full justify-between px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <span>{item.title}</span>
                <ChevronDownIcon
                  className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                    open ? 'rotate-180 transform' : ''
                  }`}
                />
              </DisclosureButton>
              <Transition
                enter="transition duration-100 ease-out"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-75 ease-out"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
              >
                <DisclosurePanel className="px-4 py-3 text-sm text-gray-600">
                  {item.content}
                </DisclosurePanel>
              </Transition>
            </>
          )}
        </Disclosure>
      ))}
    </div>
  );
}

// 使用示例
function FAQSection() {
  const faqItems = [
    {
      id: '1',
      title: 'What is Headless UI?',
      content: 'Headless UI is a completely unstyled, accessible UI component library...',
    },
    {
      id: '2',
      title: 'How do I style components?',
      content: 'Since Headless UI is unstyled, you can use Tailwind CSS, CSS modules, or any styling solution...',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">FAQ</h2>
      <Accordion items={faqItems} />
    </div>
  );
}
```

### 8. RadioGroup 单选组

```tsx
// components/ui/RadioGroup.tsx
import { Radio, RadioGroup, Field, Label, Description } from '@headlessui/react';

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface CustomRadioGroupProps {
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  label?: string;
  layout?: 'vertical' | 'horizontal';
}

export function CustomRadioGroup({
  value,
  onChange,
  options,
  label,
  layout = 'vertical',
}: CustomRadioGroupProps) {
  return (
    <RadioGroup value={value} onChange={onChange}>
      {label && (
        <Label className="text-sm font-medium text-gray-900 mb-3 block">
          {label}
        </Label>
      )}
      <div className={`space-y-2 ${layout === 'horizontal' ? 'flex gap-4 space-y-0' : ''}`}>
        {options.map((option) => (
          <Field key={option.value} disabled={option.disabled}>
            <Radio
              value={option.value}
              className={({ checked }) => `
                group flex cursor-pointer rounded-lg border p-3
                ${checked ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
                ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
              `}
            >
              {({ checked }) => (
                <div className="flex w-full items-center justify-between">
                  <div className="flex flex-col">
                    <Label className={`text-sm font-medium ${checked ? 'text-blue-900' : 'text-gray-900'}`}>
                      {option.label}
                    </Label>
                    {option.description && (
                      <Description className="text-sm text-gray-500">
                        {option.description}
                      </Description>
                    )}
                  </div>
                  <div
                    className={`
                      h-5 w-5 rounded-full border-2 flex items-center justify-center
                      ${checked ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white'}
                    `}
                  >
                    {checked && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              )}
            </Radio>
          </Field>
        ))}
      </div>
    </RadioGroup>
  );
}
```

## 最佳实践

### 1. 可访问性

```tsx
// 所有组件都支持键盘导航和屏幕阅读器
<Menu>
  <MenuButton aria-label="More options">
    <DotsVerticalIcon className="h-5 w-5" />
  </MenuButton>
  <MenuItems>
    <MenuItem>
      <button className="focus:ring-2 focus:ring-blue-500">
        Edit
      </button>
    </MenuItem>
  </MenuItems>
</Menu>
```

### 2. 受控 vs 非受控

```tsx
// 非受控（内部管理状态）
<Switch defaultChecked={true} />

// 受控（外部管理状态）
const [enabled, setEnabled] = useState(true);
<Switch checked={enabled} onChange={setEnabled} />
```

### 3. 组合模式

```tsx
// 灵活组合组件
<Menu>
  <MenuButton as={Fragment}>
    <Button variant="primary">
      Options <ChevronDownIcon />
    </Button>
  </MenuButton>
  <MenuItems anchor="bottom start">
    <MenuItem>
      <Link to="/edit">Edit</Link>
    </MenuItem>
    <MenuItem>
      <Link to="/delete">Delete</Link>
    </MenuItem>
  </MenuItems>
</Menu>
```

## 常用命令

```bash
# 安装
npm install @headlessui/react

# 与 Tailwind CSS 一起使用
npm install tailwindcss @headlessui/react

# 图标库（可选）
npm install @heroicons/react
```

## 部署配置

### Tailwind CSS 配置

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

### Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          headlessui: ['@headlessui/react'],
        },
      },
    },
  },
});
```

## 测试

```tsx
// __tests__/DropdownMenu.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DropdownMenu } from '../components/ui/Menu';

test('opens menu on click', async () => {
  const user = userEvent.setup();
  const items = [
    { id: '1', label: 'Edit', onClick: jest.fn() },
    { id: '2', label: 'Delete', onClick: jest.fn() },
  ];

  render(<DropdownMenu button="Options" items={items} />);

  await user.click(screen.getByRole('button', { name: /options/i }));
  
  expect(screen.getByRole('menuitem', { name: /edit/i })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument();
});
```

## 性能优化

### 1. 懒加载模态框

```tsx
const HeavyModal = lazy(() => import('./HeavyModal'));

function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      {isOpen && (
        <Suspense fallback={<div>Loading...</div>}>
          <HeavyModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
```

### 2. 虚拟化长列表

```tsx
import { Combobox, ComboboxOptions } from '@headlessui/react';
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualizedCombobox({ options }) {
  const parentRef = useRef(null);
  
  const virtualizer = useVirtualizer({
    count: options.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
  });

  return (
    <ComboboxOptions
      ref={parentRef}
      className="max-h-60 overflow-auto"
    >
      {virtualizer.getVirtualItems().map((virtualItem) => (
        <ComboboxOption
          key={options[virtualItem.index].id}
          value={options[virtualItem.index]}
          style={{
            position: 'absolute',
            transform: `translateY(${virtualItem.start}px)`,
          }}
        >
          {options[virtualItem.index].name}
        </ComboboxOption>
      ))}
    </ComboboxOptions>
  );
}
```
