# Husky Git Hooks Advanced Template

## Tech Stack
- husky v9.x
- lint-staged v15.x
- commitlint v18.x

## Configuration

### Husky Setup
```bash
npm install -D husky
npx husky init
```

### Pre-commit Hook
```bash
# .husky/pre-commit
npm run lint-staged
npm run type-check
```

### Commit Message Hook
```bash
# .husky/commit-msg
npx commitlint --edit $1
```

### Lint-staged Config
```javascript
// lint-staged.config.js
module.exports = {
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,yml}': ['prettier --write'],
};
```

### Commitlint Config
```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'revert'],
    ],
    'subject-case': [2, 'always', 'lower-case'],
  },
};
```

### Package.json Scripts
```json
{
  "scripts": {
    "prepare": "husky",
    "lint-staged": "lint-staged"
  }
}
```

## Common Commands

```bash
npm install -D husky lint-staged @commitlint/cli @commitlint/config-conventional
npx husky init
echo "npx lint-staged" > .husky/pre-commit
```

## Related Resources
- [Husky Documentation](https://typicode.github.io/husky/)
- [Commitlint](https://commitlint.js.org/)
