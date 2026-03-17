# Prettier Plugin Tailwindcss Template

## Tech Stack
- prettier v3.x
- prettier-plugin-tailwindcss v0.x
- tailwindcss v3.x

## Configuration

### Prettier Config
```javascript
// .prettierrc
module.exports = {
  plugins: ['prettier-plugin-tailwindcss'],
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 100,
};
```

### VS Code Settings
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "prettier.requireConfig": true
}
```

### Before/After Example
```jsx
// Before
<div className="bg-red-500 p-4 text-white font-bold hover:bg-red-700 dark:bg-red-900"></div>

// After (sorted)
<div className="font-bold text-white bg-red-500 p-4 hover:bg-red-700 dark:bg-red-900"></div>
```

### Custom Sort Order
```javascript
// .prettierrc
module.exports = {
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindFunctions: ['clsx', 'cn', 'cva'],
  tailwindAttributes: ['className', 'class'],
  // Custom sorting
  tailwindConfig: './tailwind.config.js',
};
```

### Integration with Class Variance Authority
```typescript
import { cva } from 'class-variance-authority';

const buttonVariants = cva('font-semibold border rounded', {
  variants: {
    intent: {
      primary: 'bg-blue-500 text-white border-transparent hover:bg-blue-600',
      secondary: 'bg-white text-gray-800 border-gray-400 hover:bg-gray-100',
    },
    size: {
      small: 'text-sm py-1 px-2',
      medium: 'text-base py-2 px-4',
    },
  },
});
```

## Common Commands

```bash
npm install -D prettier prettier-plugin-tailwindcss
npx prettier --write "**/*.{js,jsx,ts,tsx}"
```

## Related Resources
- [Prettier Plugin Tailwindcss](https://github.com/tailwindlabs/prettier-plugin-tailwindcss)
