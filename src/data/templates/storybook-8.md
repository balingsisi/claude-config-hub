# Storybook 8 Component Development Template

## Tech Stack

- **@storybook/react-vite**: v8.x
- **@storybook/addon-essentials**: Docs, Controls, Actions
- **@storybook/addon-interactions**: Interaction Testing
- **@storybook/test**: Vitest integration
- **React**: 18+
- **TypeScript**: 5+
- **Vite**: 5.x

## Project Structure

```
project/
├── .storybook/
│   ├── main.ts              # Storybook 配置
│   ├── preview.tsx          # 全局装饰器和参数
│   ├── theme.ts             # 自定义主题
│   └── manager.ts           # 管理器配置
├── src/
│   ├── components/
│   │   └── Button/
│   │       ├── Button.tsx
│   │       ├── Button.stories.tsx
│   │       ├── Button.test.ts
│   │       └── index.ts
│   ├── stories/
│   │   ├── Introduction.mdx
│   │   └── GettingStarted.mdx
│   └── styles/
│       └── globals.css
├── package.json
└── vite.config.ts
```

## Code Patterns

### 1. Storybook Configuration

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@chromatic-com/storybook',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
    defaultName: 'Documentation',
  },
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
    },
  },
  viteFinal: async (config) => {
    return {
      ...config,
      define: {
        ...config.define,
        'process.env.NODE_ENV': JSON.stringify('development'),
      },
    };
  },
};

export default config;
```

### 2. Preview Configuration

```typescript
// .storybook/preview.tsx
import type { Preview } from '@storybook/react';
import { withThemeByClassName } from '@storybook/addon-themes';
import '../src/styles/globals.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
        { name: 'gray', value: '#f5f5f5' },
      ],
    },
    layout: 'centered',
    docs: {
      toc: true,
    },
  },
  decorators: [
    withThemeByClassName({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'light',
    }),
  ],
};

export default preview;
```

### 3. Component Story (CSF 3.0)

```typescript
// src/components/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile button component with multiple variants.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost'],
      description: 'Button variant style',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button size',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the button',
    },
  },
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    variant: 'primary',
    disabled: true,
    children: 'Disabled Button',
  },
};

export const WithIcon: Story = {
  args: {
    variant: 'primary',
    children: (
      <>
        <Icon name="plus" />
        With Icon
      </>
    ),
  },
};
```

### 4. Component Implementation

```typescript
// src/components/Button/Button.tsx
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variantStyles = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50',
  ghost: 'text-gray-700 hover:bg-gray-100',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### 5. Interaction Testing

```typescript
// src/components/Button/Button.test.ts
import { test, expect } from '@storybook/test';
import { within, userEvent } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'Components/Button/Tests',
  component: Button,
} satisfies Meta<typeof Button>;

export default meta;

export const TestClick: StoryObj<typeof Button> = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    
    await userEvent.click(button);
    
    await expect(args.onClick).toHaveBeenCalled();
  },
};

export const TestDisabled: StoryObj<typeof Button> = {
  args: {
    disabled: true,
    children: 'Disabled',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    
    await expect(button).toBeDisabled();
  },
};

export const TestAccessibility: StoryObj<typeof Button> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    
    await expect(button).toHaveAttribute('type', 'button');
  },
};
```

### 6. MDX Documentation

```mdx
<!-- src/stories/Introduction.mdx -->
import { Meta } from '@storybook/blocks';

<Meta title="Introduction" />

# Component Library

Welcome to our component library built with Storybook 8.

## Features

- 🎨 **Theming** - Light and dark mode support
- ♿ **Accessibility** - WCAG 2.1 AA compliant
- 📱 **Responsive** - Mobile-first design
- 🧪 **Tested** - Unit and interaction tests
- 📚 **Documented** - Auto-generated docs

## Getting Started

```bash
npm install
npm run storybook
```

## Available Components

- [Button](/story/components-button--primary)
- [Input](/story/components-input--text)
- [Card](/story/components-card--basic)
```

### 7. Custom Theme

```typescript
// .storybook/theme.ts
import { create } from '@storybook/theming';

export default create({
  base: 'light',
  brandTitle: 'My Component Library',
  brandUrl: 'https://example.com',
  brandImage: '/logo.svg',
  brandTarget: '_self',
  
  colorPrimary: '#3b82f6',
  colorSecondary: '#10b981',
  
  // UI
  appBg: '#ffffff',
  appContentBg: '#f9fafb',
  appBorderColor: '#e5e7eb',
  appBorderRadius: 8,
  
  // Typography
  fontBase: '"Inter", sans-serif',
  fontCode: '"Fira Code", monospace',
  
  // Text colors
  textColor: '#1f2937',
  textInverseColor: '#ffffff',
  
  // Toolbar
  barTextColor: '#6b7280',
  barSelectedColor: '#3b82f6',
  barBg: '#ffffff',
  
  // Inputs
  inputBg: '#ffffff',
  inputBorder: '#d1d5db',
  inputTextColor: '#1f2937',
});
```

### 8. Manager Configuration

```typescript
// .storybook/manager.ts
import { addons } from '@storybook/manager-api';
import theme from './theme';

addons.setConfig({
  theme,
  panelPosition: 'bottom',
  enableShortcuts: true,
  showToolbar: true,
  showPanel: true,
  showNav: true,
  sidebar: {
    showRoots: true,
    collapsedRoots: ['other'],
  },
  toolbar: {
    title: { hidden: false },
    zoom: { hidden: false },
    eject: { hidden: false },
    copy: { hidden: false },
    fullscreen: { hidden: false },
  },
});
```

### 9. Chromatic Integration

```typescript
// .storybook/main.ts (add to config)
addons: [
  '@chromatic-com/storybook',
],

// package.json
{
  "scripts": {
    "chromatic": "chromatic --exit-zero-on-changes"
  },
  "devDependencies": {
    "@chromatic-com/storybook": "^1.0.0"
  }
}
```

```yaml
# .github/workflows/chromatic.yml
name: Chromatic

on: push

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - run: npm ci
      
      - uses: chromaui/action@v1
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

### 10. Addon Configuration

```typescript
// .storybook/main.ts
const config: StorybookConfig = {
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    {
      name: '@storybook/addon-styling-webpack',
      options: {
        rules: [
          {
            test: /\.css$/,
            sideEffects: true,
            use: [
              'style-loader',
              {
                loader: 'css-loader',
                options: { importLoaders: 1 },
              },
              'postcss-loader',
            ],
          },
        ],
      },
    },
  ],
};
```

## Best Practices

### 1. Story Organization

```typescript
// Hierarchical naming
title: 'Design System/Atoms/Button'
title: 'Design System/Molecules/Card'
title: 'Design System/Organisms/Header'
```

### 2. Args Composition

```typescript
// Base args for reuse
const baseArgs = {
  variant: 'primary',
  size: 'md',
};

export const Primary: Story = {
  args: {
    ...baseArgs,
    children: 'Primary',
  },
};

export const Secondary: Story = {
  args: {
    ...baseArgs,
    variant: 'secondary',
    children: 'Secondary',
  },
};
```

### 3. Decorators

```typescript
// src/.storybook/preview.tsx
import { withRouter } from 'storybook-addon-remix-react-router';

export const decorators = [
  withRouter,
  (Story) => (
    <div className="p-4">
      <Story />
    </div>
  ),
];
```

### 4. Mock Data

```typescript
// src/mocks/data.ts
export const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
};

// src/components/UserCard.stories.tsx
import { mockUser } from '@/mocks/data';

export const Default: Story = {
  args: {
    user: mockUser,
  },
};
```

### 5. Accessibility Testing

```typescript
// .storybook/main.ts
addons: ['@storybook/addon-a11y'],

// In story
export const A11yTest: StoryObj<typeof Button> = {
  parameters: {
    a11y: {
      element: '#root',
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
  },
};
```

## Common Commands

```bash
# Start Storybook
npm run storybook

# Build static Storybook
npm run build-storybook

# Run Chromatic
npm run chromatic

# Test stories
npm run test-storybook

# Generate story file
npx storybook generate component-name
```

## Package.json Scripts

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "test-storybook": "test-storybook",
    "chromatic": "chromatic --exit-zero-on-changes"
  },
  "devDependencies": {
    "@storybook/react-vite": "^8.0.0",
    "@storybook/addon-essentials": "^8.0.0",
    "@storybook/addon-interactions": "^8.0.0",
    "@storybook/addon-a11y": "^8.0.0",
    "@storybook/test": "^8.0.0",
    "@chromatic-com/storybook": "^1.0.0",
    "storybook": "^8.0.0"
  }
}
```

## Resources

- [Storybook 8 Documentation](https://storybook.js.org/docs)
- [CSF 3.0 Format](https://storybook.js.org/docs/writing-stories/introduction)
- [Interaction Testing](https://storybook.js.org/docs/writing-tests/interaction-testing)
- [Chromatic](https://www.chromatic.com/)
- [Storybook Addons](https://storybook.js.org/addons)
