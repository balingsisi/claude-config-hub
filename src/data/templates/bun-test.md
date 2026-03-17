# Bun Test Template

## Tech Stack
- bun v1.x
- TypeScript 5+

## Core Patterns

### Basic Test
```typescript
import { test, expect } from 'bun:test';

test('adds numbers', () => {
  expect(1 + 1).toBe(2);
});

test('async test', async () => {
  const result = await fetch('https://api.example.com');
  expect(result.ok).toBe(true);
});
```

### Mocking
```typescript
import { test, expect, mock } from 'bun:test';

test('mock function', () => {
  const fn = mock(() => 'hello');
  expect(fn()).toBe('hello');
  expect(fn).toHaveBeenCalled();
});
```

### Snapshot Testing
```typescript
import { test, expect } from 'bun:test';

test('snapshot', () => {
  expect({ name: 'Alice', age: 30 }).toMatchSnapshot();
});
```

### Describe Block
```typescript
import { describe, test, expect } from 'bun:test';

describe('UserService', () => {
  test('creates user', () => {
    // test code
  });

  test('deletes user', () => {
    // test code
  });
});
```

## Common Commands

```bash
bun test
bun test --watch
bun test --coverage
```

## Related Resources
- [Bun Test Documentation](https://bun.sh/docs/cli/test)
