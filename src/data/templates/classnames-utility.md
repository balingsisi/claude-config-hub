# Classnames Utility Template

## Tech Stack
- classnames v2.x
- React 18+
- TypeScript 5+

## Core Patterns

### Basic Usage
```typescript
import classNames from 'classnames';

// Strings
classNames('foo', 'bar'); // 'foo bar'
classNames('foo', { bar: true }); // 'foo bar'
classNames({ 'foo-bar': true }); // 'foo-bar'

// Arrays
classNames(['foo', 'bar']); // 'foo bar'

// Mixed
classNames('foo', { bar: true }, ['baz']); // 'foo bar baz'
```

### React Component
```typescript
import classNames from 'classnames';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
}) => {
  const classes = classNames(
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    {
      'btn-disabled': disabled,
    }
  );

  return <button className={classes}>{children}</button>;
};
```

### with CSS Modules
```typescript
import classNames from 'classnames/bind';
import styles from './Button.module.css';

const cx = classNames.bind(styles);

export const Button: React.FC<ButtonProps> = ({ variant, children }) => {
  return (
    <button className={cx('button', `button--${variant}`)}>
      {children}
    </button>
  );
};
```

## Common Commands

```bash
npm install classnames
npm install -D @types/classnames
npm run dev
```

## Related Resources
- [Classnames Documentation](https://github.com/JedWatson/classnames)
- [Usage Examples](https://github.com/JedWatson/classnames#usage)
