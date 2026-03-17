# EdgeDB 3 Template

## Tech Stack
- edgedb v3.x
- TypeScript 5+
- EdgeDB Query Builder

## Core Patterns

### Schema Definition
```
module default {
  type User {
    required property email -> str {
      constraint exclusive;
    }
    property name -> str;
    property avatar -> str;
    property created_at -> datetime {
      default := datetime_current();
    }
    link posts -> Post;
  }

  type Post {
    required property title -> str;
    property content -> str;
    property published -> bool {
      default := false;
    }
    property created_at -> datetime {
      default := datetime_current();
    }
    required link author -> User;
  }
}
```

### TypeScript Client
```typescript
import { createClient } from 'edgedb';

const client = createClient();

// Query
const users = await client.query(`
  select User {
    id,
    email,
    name,
    posts: {
      id,
      title
    }
  }
  filter .email = <str>$email
`, { email: 'user@example.com' });

// Insert
const user = await client.query(`
  insert User {
    email := <str>$email,
    name := <str>$name
  }
`, { email: 'new@example.com', name: 'Alice' });

// Update
await client.query(`
  update User
  filter .email = <str>$email
  set { name := <str>$newName }
`, { email: 'user@example.com', newName: 'Bob' });

// Delete
await client.query(`
  delete User filter .id = <uuid>$id
`, { id: '...' });
```

### Query Builder
```typescript
import { e } from './edgeql-js';

const query = e.select(e.User, (user) => ({
  id: true,
  email: true,
  name: true,
  posts: { id: true, title: true },
  filter: e.eq(user.email, e.str('user@example.com')),
}));

const result = await query.run(client);
```

### Migrations
```bash
# Create migration
edgedb migration create

# Apply migration
edgedb migrate

# Watch mode
edgedb watch
```

## Common Commands

```bash
npm install edgedb
edgedb project init
edgedb migration create
edgedb migrate
```

## Related Resources
- [EdgeDB Documentation](https://www.edgedb.com/docs)
