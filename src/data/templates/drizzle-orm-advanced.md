# Drizzle ORM Advanced Template

## Tech Stack
- drizzle-orm v0.x
- drizzle-kit v0.x
- PostgreSQL / MySQL / SQLite
- TypeScript 5+

## Core Patterns

### Schema Definition
```typescript
import { pgTable, serial, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content'),
  authorId: integer('author_id').references(() => users.id),
  published: boolean('published').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
}));
```

### Query with Relations
```typescript
import { db } from './db';
import { users, posts } from './schema';
import { eq } from 'drizzle-orm';

// Select with join
const result = await db.select().from(posts).leftJoin(users, eq(posts.authorId, users.id));

// Insert
await db.insert(users).values({ email: 'user@example.com', name: 'John' });

// Update
await db.update(users).set({ name: 'Jane' }).where(eq(users.id, 1));

// Delete
await db.delete(users).where(eq(users.id, 1));
```

### Transaction
```typescript
await db.transaction(async (tx) => {
  const user = await tx.insert(users).values({ email, name }).returning();
  await tx.insert(posts).values({ title: 'First Post', authorId: user[0].id });
});
```

### Migrations
```bash
# Generate
npx drizzle-kit generate

# Push (dev)
npx drizzle-kit push

# Studio
npx drizzle-kit studio
```

## Common Commands

```bash
npm install drizzle-orm drizzle-kit
npm run db:generate
npm run db:migrate
```

## Related Resources
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
