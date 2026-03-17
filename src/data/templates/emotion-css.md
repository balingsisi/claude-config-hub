# Emotion CSS-in-JS Template

## Tech Stack
- @emotion/react v11.x
- @emotion/styled v11.x
- React 18+
- TypeScript 5+

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
│   ├── global.ts
│   └── mixins.ts
└── App.tsx
```

## Core Patterns

### Theme Configuration
```typescript
// src/styles/theme.ts
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    danger: string;
    warning: string;
    background: string;
    text: string;
  };
  fonts: {
    main: string;
    mono: string;
  };
  fontSizes: Record<string, string>;
  spacing: Record<string, string>;
  breakpoints: Record<string, string>;
  shadows: Record<string, string>;
}

export const theme: Theme = {
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    background: '#ffffff',
    text: '#212529',
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
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
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
  },
};

declare module '@emotion/react' {
  export interface Theme extends Theme {}
}
```

### Global Styles with css prop
```typescript
// src/styles/global.ts
import { css } from '@emotion/react';

export const globalStyles = css`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    font-size: 16px;
  }

  body {
    font-family: var(--font-main);
    background-color: #ffffff;
    color: #212529;
    line-height: 1.6;
  }

  a {
    color: #007bff;
    text-decoration: none;
  }
`;
```

### Styled Component with Emotion
```typescript
// src/components/Button/Button.styles.ts
import styled from '@emotion/styled';
import { css, Theme } from '@emotion/react';

type ButtonVariant = 'primary' | 'secondary' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantStyles = (variant: ButtonVariant) => {
  const variants = {
    primary: (theme: Theme) => css`
      background-color: ${theme.colors.primary};
      color: white;
      &:hover {
        background-color: ${theme.colors.primary}dd;
      }
    `,
    secondary: (theme: Theme) => css`
      background-color: ${theme.colors.secondary};
      color: white;
      &:hover {
        background-color: ${theme.colors.secondary}dd;
      }
    `,
    danger: (theme: Theme) => css`
      background-color: ${theme.colors.danger};
      color: white;
      &:hover {
        background-color: ${theme.colors.danger}dd;
      }
    `,
  };
  return variants[variant];
};

const sizeStyles = (size: ButtonSize) => {
  const sizes = {
    sm: css`
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
    `,
    md: css`
      padding: 0.5rem 1.5rem;
      font-size: 1rem;
    `,
    lg: css`
      padding: 1rem 2rem;
      font-size: 1.125rem;
    `,
  };
  return sizes[size];
};

export const StyledButton = styled('button')<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;

  ${({ variant = 'primary', theme }) => variantStyles(variant)(theme)}
  ${({ size = 'md' }) => sizeStyles(size)}
  ${({ fullWidth }) => fullWidth && css`width: 100%;`}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
```

### Component Implementation
```typescript
// src/components/Button/Button.tsx
import React from 'react';
import { StyledButton } from './Button.styles';

interface Props {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export const Button: React.FC<Props> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
}) => {
  return (
    <StyledButton
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </StyledButton>
  );
};
```

### Theme Provider Setup
```typescript
// src/App.tsx
import { ThemeProvider, Global } from '@emotion/react';
import { theme, globalStyles } from './styles';
import { Button } from './components/Button';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Global styles={globalStyles} />
      <div>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="danger">Danger</Button>
      </div>
    </ThemeProvider>
  );
}

export default App;
```

## Best Practices

### 1. Use the css prop for inline styles
```typescript
import { css } from '@emotion/react';

<div
  css={css`
    padding: 1rem;
    background: white;
  `}
>
  Content
</div>
```

### 2. Create reusable mixins
```typescript
// src/styles/mixins.ts
import { css } from '@emotion/react';

export const flexCenter = css`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const truncate = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
```

### 3. Use object styles for type safety
```typescript
const buttonStyles = {
  padding: '0.5rem 1rem',
  backgroundColor: '#007bff',
  color: 'white',
} as const;
```

## Common Commands

```bash
# Install
npm install @emotion/react @emotion/styled

# Babel plugin (optional)
npm install -D @emotion/babel-plugin

# Development
npm run dev

# Build
npm run build
```

## Related Resources
- [Emotion Documentation](https://emotion.sh/)
- [Theming Guide](https://emotion.sh/docs/theming)
- [TypeScript Support](https://emotion.sh/docs/typescript)
