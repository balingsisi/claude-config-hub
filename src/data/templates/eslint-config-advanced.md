# ESLint Config Advanced Template

## Tech Stack
- eslint v9.x (Flat Config)
- typescript-eslint v7.x
- eslint-plugin-react v7.x
- eslint-plugin-react-hooks v4.x

## Core Patterns

### Flat Config
```typescript
// eslint.config.mjs
import js from '@eslint/js';
import ts from 'typescript-eslint';
import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      react,
      'react-hooks': hooks,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '*.config.js'],
  },
];
```

### Custom Rule
```typescript
const noConsoleLog = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Disallow console.log' },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.object?.name === 'console' &&
          node.callee.property?.name === 'log'
        ) {
          context.report({
            node,
            message: 'Use logger instead of console.log',
          });
        }
      },
    };
  },
};
```

## Common Commands

```bash
npm install -D eslint @eslint/js typescript-eslint eslint-plugin-react eslint-plugin-react-hooks
npx eslint .
```

## Related Resources
- [ESLint Documentation](https://eslint.org/)
- [TypeScript ESLint](https://typescript-eslint.io/)
