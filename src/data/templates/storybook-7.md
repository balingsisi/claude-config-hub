# Storybook 7 Component Development Template

## Tech Stack
- @storybook/react-vite v7.x
- React 18+
- TypeScript 5+
- Vite 5.x

## Project Structure
```
src/
├── components/
│   └── Button/
│       ├── Button.tsx
│       ├── Button.stories.tsx
│       ├── Button.test.tsx
│       └── index.ts
└── .storybook/
    ├── main.ts
    ├── preview.ts
    └── theme.ts
```

## Core Patterns

### Story File
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

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
```

### Configuration
```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
};

export default config;
```

## Common Commands

```bash
npx storybook@latest init
npm run storybook
npm run build-storybook
```

## Related Resources
- [Storybook Documentation](https://storybook.js.org/)
- [Storybook for React](https://storybook.js.org/docs/react/get-started/introduction)
