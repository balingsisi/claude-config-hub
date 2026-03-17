# Styled Components Template

## Tech Stack
- styled-components v6.x
- React 18+
- TypeScript 5+
- Vite / Next.js

## Project Structure
```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.styles.ts
│   │   └── index.ts
│   └── ...
├── styles/
│   ├── theme.ts
│   ├── GlobalStyles.ts
│   └── mixins.ts
└── App.tsx
```

## Core Patterns

### Theme Configuration
```typescript
// src/styles/theme.ts
export const theme = {
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40',
    text: '#212529',
    background: '#ffffff',
  },
  fonts: {
    main: "'Inter', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  breakpoints: {
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
  transitions: {
    fast: '150ms ease',
    normal: '250ms ease',
    slow: '350ms ease',
  },
};

export type Theme = typeof theme;
```

### Global Styles
```typescript
// src/styles/GlobalStyles.ts
import { createGlobalStyle } from 'styled-components';
import { Theme } from './theme';

export const GlobalStyles = createGlobalStyle<{ theme: Theme }>`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    font-size: 16px;
    scroll-behavior: smooth;
  }

  body {
    font-family: ${({ theme }) => theme.fonts.main};
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
    transition: color ${({ theme }) => theme.transitions.fast};

    &:hover {
      color: ${({ theme }) => theme.colors.primary}dd;
    }
  }

  button {
    font-family: inherit;
    cursor: pointer;
  }

  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
  }

  h1, h2, h3, h4, h5, h6 {
    font-weight: 600;
    line-height: 1.3;
  }

  code, pre {
    font-family: ${({ theme }) => theme.fonts.mono};
  }

  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.light};
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.secondary};
    border-radius: ${({ theme }) => theme.borderRadius.full};
  }
`;
```

### Styled Component with Props
```typescript
// src/components/Button/Button.styles.ts
import styled, { css, shouldForwardProp } from 'styled-components';
import { Theme } from '../../styles/theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

const variantStyles = (variant: ButtonVariant = 'primary') => {
  const variants = {
    primary: css`
      background-color: ${({ theme }: { theme: Theme }) => theme.colors.primary};
      color: white;
      border: none;

      &:hover:not(:disabled) {
        background-color: ${({ theme }: { theme: Theme }) => theme.colors.primary}dd;
      }
    `,
    secondary: css`
      background-color: ${({ theme }: { theme: Theme }) => theme.colors.secondary};
      color: white;
      border: none;

      &:hover:not(:disabled) {
        background-color: ${({ theme }: { theme: Theme }) => theme.colors.secondary}dd;
      }
    `,
    danger: css`
      background-color: ${({ theme }: { theme: Theme }) => theme.colors.danger};
      color: white;
      border: none;

      &:hover:not(:disabled) {
        background-color: ${({ theme }: { theme: Theme }) => theme.colors.danger}dd;
      }
    `,
    ghost: css`
      background-color: transparent;
      color: ${({ theme }: { theme: Theme }) => theme.colors.text};
      border: 1px solid ${({ theme }: { theme: Theme }) => theme.colors.secondary};

      &:hover:not(:disabled) {
        background-color: ${({ theme }: { theme: Theme }) => theme.colors.light};
      }
    `,
  };

  return variants[variant];
};

const sizeStyles = (size: ButtonSize = 'md') => {
  const sizes = {
    sm: css`
      padding: ${({ theme }: { theme: Theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
      font-size: ${({ theme }: { theme: Theme }) => theme.fontSizes.sm};
    `,
    md: css`
      padding: ${({ theme }: { theme: Theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
      font-size: ${({ theme }: { theme: Theme }) => theme.fontSizes.md};
    `,
    lg: css`
      padding: ${({ theme }: { theme: Theme }) => `${theme.spacing.md} ${theme.spacing.xl}`};
      font-size: ${({ theme }: { theme: Theme }) => theme.fontSizes.lg};
    `,
  };

  return sizes[size];
};

export const StyledButton = styled.button.withConfig({
  shouldForwardProp: (prop) => !['variant', 'size', 'fullWidth', 'loading'].includes(prop),
})<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-weight: 500;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  transition: all ${({ theme }) => theme.transitions.fast};
  cursor: pointer;
  white-space: nowrap;

  ${({ variant }) => variantStyles(variant)}
  ${({ size }) => sizeStyles(size)}
  ${({ fullWidth }) => fullWidth && css`width: 100%;`}
  
  ${({ disabled, theme }) => disabled && css`
    opacity: 0.6;
    cursor: not-allowed;
  `}

  ${({ loading }) => loading && css`
    position: relative;
    color: transparent;
    pointer-events: none;
  `}
`;
```

### Component Implementation
```typescript
// src/components/Button/Button.tsx
import React from 'react';
import { StyledButton } from './Button.styles';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
}) => {
  return (
    <StyledButton
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled || loading}
      loading={loading}
      onClick={onClick}
      type={type}
    >
      {loading && (
        <span style={{ position: 'absolute' }}>
          ⏳
        </span>
      )}
      {children}
    </StyledButton>
  );
};
```

### Theme Provider Setup
```typescript
// src/App.tsx
import { ThemeProvider } from 'styled-components';
import { theme } from './styles/theme';
import { GlobalStyles } from './styles/GlobalStyles';
import { Button } from './components/Button';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <div className="App">
        <Button variant="primary">Primary Button</Button>
        <Button variant="secondary">Secondary Button</Button>
        <Button variant="danger">Danger Button</Button>
        <Button variant="ghost">Ghost Button</Button>
      </div>
    </ThemeProvider>
  );
}

export default App;
```

## Best Practices

### 1. Use Theme Types
```typescript
// Always type styled components with theme
const Container = styled.div<{ theme: Theme }>`
  color: ${({ theme }) => theme.colors.primary};
`;
```

### 2. Create Reusable Mixins
```typescript
// src/styles/mixins.ts
import { css, Theme } from 'styled-components';

export const flexCenter = css`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const truncate = (lines: number = 1) => css`
  overflow: hidden;
  text-overflow: ellipsis;
  ${lines === 1
    ? css`white-space: nowrap;`
    : css`
        display: -webkit-box;
        -webkit-line-clamp: ${lines};
        -webkit-box-orient: vertical;
      `
  }
`;

export const card = (theme: Theme) => css`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.md};
  padding: ${theme.spacing.lg};
`;
```

### 3. Avoid Prop Leakage
```typescript
// Use shouldForwardProp to prevent custom props from being passed to DOM
const StyledInput = styled.input.withConfig({
  shouldForwardProp: (prop) => !['hasError', 'size'].includes(prop),
})<{ hasError?: boolean }>`
  border: 1px solid ${({ hasError, theme }) => 
    hasError ? theme.colors.danger : theme.colors.secondary
  };
`;
```

### 4. Use Style Objects for Complex Logic
```typescript
// Group related styles
const inputStyles = {
  base: css`
    padding: ${({ theme }) => theme.spacing.sm};
    border-radius: ${({ theme }) => theme.borderRadius.md};
  `,
  error: css`
    border-color: ${({ theme }) => theme.colors.danger};
  `,
  disabled: css`
    background-color: ${({ theme }) => theme.colors.light};
    cursor: not-allowed;
  `,
};
```

## Common Commands

```bash
# Install
npm install styled-components

# TypeScript support
npm install -D @types/styled-components

# Development
npm run dev

# Build
npm run build

# SSR (Next.js)
npm install babel-plugin-styled-components
```

## Deployment

### Next.js Configuration
```javascript
// next.config.js
module.exports = {
  compiler: {
    styledComponents: true,
  },
};
```

### Babel Configuration
```javascript
// .babelrc
{
  "presets": ["next/babel"],
  "plugins": [
    [
      "styled-components",
      {
        "ssr": true,
        "displayName": true,
        "preprocess": false
      }
    ]
  ]
}
```

## Related Resources
- [Styled Components Documentation](https://styled-components.com/)
- [Theming Guide](https://styled-components.com/docs/advanced)
- [TypeScript Setup](https://styled-components.com/docs/tooling#typescript)
