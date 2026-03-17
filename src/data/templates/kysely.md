# Kysely - Type-Safe SQL Query Builder

## Overview

Kysely is a type-safe SQL query builder for TypeScript. It provides a fluent API for building SQL queries with full TypeScript support, including auto-completion and type checking for tables, columns, and relationships.

## Key Features

- **Type Safety**: Full TypeScript support with auto-completion
- **Fluent API**: Intuitive query building
- **Database Support**: PostgreSQL, MySQL, SQLite, and more
- **No Runtime Overhead**: Pure compile-time type checking
- **Migration Support**: Built-in migration system
- **Raw SQL Support**: Escape hatch for complex queries

## Project Structure

```
kysely-project/
├── src/
│   ├── db/
│   │   ├── database.ts          # Kysely instance
│   │   ├── types.ts             # Database type definitions
│   │   └── migrations/          # Migration files
│   │       ├── 001_initial.ts
│   │       └── 002_add_users.ts
│   ├── repositories/
│   │   ├── user.repository.ts
│   │   └── post.repository.ts
│   ├── services/
│   │   ├── user.service.ts
│   │   └── post.service.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

## Installation

```bash
# Core package
npm install kysely

# Database driver (choose one)
npm install pg                    # PostgreSQL
npm install mysql2                # MySQL
npm install better-sqlite3        # SQLite

# For type generation
npm install -D kysely-codegen
```

## Configuration

### Database Types (src/db/types.ts)

```typescript
// Generated or hand-written database types
export interface Database {
  users: {
    id: Generated<number>
    email: string
    name: string
    created_at: Generated<Date>
    updated_at: Generated<Date>
  }
  posts: {
    id: Generated<number>
    user_id: number
    title: string
    content: string
    published: Generated<boolean>
    created_at: Generated<Date>
    updated_at: Generated<Date>
  }
  comments: {
    id: Generated<number>
    post_id: number
    user_id: number
    content: string
    created_at: Generated<Date>
  }
}
```

### Database Instance (src/db/database.ts)

```typescript
import { Kysely, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler } from 'kysely'
import { Pool } from 'pg'
import { Database } from './types'

export const db = new Kysely<Database>({
  dialect: {
    createAdapter() {
      return new PostgresAdapter()
    },
    createDriver() {
      return new PostgresDriver({
        pool: new Pool({
          host: process.env.DB_HOST,
          database: process.env.DB_NAME,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          max: 10,
        })
      })
    },
    createIntrospector(db: Kysely<Database>) {
      return new PostgresIntrospector(db)
    },
    createQueryCompiler() {
      return new PostgresQueryCompiler()
    },
  },
  plugins: [
    // Add plugins here
  ],
})
```

## Usage Examples

### Basic Queries

```typescript
import { db } from './db/database'

// Select all users
const users = await db
  .selectFrom('users')
  .selectAll()
  .execute()

// Select with where clause
const user = await db
  .selectFrom('users')
  .where('id', '=', 1)
  .selectAll()
  .executeTakeFirst()

// Select specific columns
const userEmails = await db
  .selectFrom('users')
  .select(['id', 'email', 'name'])
  .execute()
```

### Insert Operations

```typescript
// Insert single row
const user = await db
  .insertInto('users')
  .values({
    email: 'user@example.com',
    name: 'John Doe',
  })
  .returning(['id', 'email', 'name'])
  .executeTakeFirst()

// Insert multiple rows
await db
  .insertInto('users')
  .values([
    { email: 'user1@example.com', name: 'User One' },
    { email: 'user2@example.com', name: 'User Two' },
  ])
  .execute()
```

### Update Operations

```typescript
// Update with where clause
await db
  .updateTable('users')
  .set({ name: 'Jane Doe' })
  .where('id', '=', 1)
  .execute()

// Update with returning
const updated = await db
  .updateTable('users')
  .set({ name: 'Jane Doe' })
  .where('id', '=', 1)
  .returning(['id', 'name'])
  .executeTakeFirst()
```

### Delete Operations

```typescript
await db
  .deleteFrom('users')
  .where('id', '=', 1)
  .execute()
```

### Joins

```typescript
// Inner join
const postsWithAuthors = await db
  .selectFrom('posts')
  .innerJoin('users', 'users.id', 'posts.user_id')
  .select([
    'posts.id',
    'posts.title',
    'users.name as author_name',
  ])
  .execute()

// Multiple joins
const postsWithDetails = await db
  .selectFrom('posts')
  .innerJoin('users', 'users.id', 'posts.user_id')
  .leftJoin('comments', 'comments.post_id', 'posts.id')
  .select([
    'posts.id',
    'posts.title',
    'users.name as author',
    db.fn.count('comments.id').as('comment_count'),
  ])
  .groupBy(['posts.id', 'users.name'])
  .execute()
```

### Complex Queries

```typescript
// Subqueries
const activeUsers = await db
  .selectFrom('users')
  .where((eb) => eb.exists(
    db
      .selectFrom('posts')
      .whereRef('posts.user_id', '=', 'users.id')
      .where('posts.published', '=', true)
      .select('posts.id')
  ))
  .selectAll()
  .execute()

// Aggregations
const stats = await db
  .selectFrom('posts')
  .where('published', '=', true)
  .select([
    db.fn.count<number>('id').as('total_posts'),
    db.fn.avg<number>('view_count').as('avg_views'),
    db.fn.max('created_at').as('latest_post'),
  ])
  .executeTakeFirst()
```

### Transactions

```typescript
await db.transaction().execute(async (trx) => {
  const user = await trx
    .insertInto('users')
    .values({ email: 'user@example.com', name: 'John' })
    .returning('id')
    .executeTakeFirst()

  await trx
    .insertInto('posts')
    .values({ user_id: user!.id, title: 'First Post', content: '...' })
    .execute()
})
```

### Repository Pattern

```typescript
// src/repositories/user.repository.ts
import { db } from '../db/database'
import { Database } from '../db/types'

export class UserRepository {
  async findById(id: number) {
    return db
      .selectFrom('users')
      .where('id', '=', id)
      .selectAll()
      .executeTakeFirst()
  }

  async findByEmail(email: string) {
    return db
      .selectFrom('users')
      .where('email', '=', email)
      .selectAll()
      .executeTakeFirst()
  }

  async create(data: { email: string; name: string }) {
    return db
      .insertInto('users')
      .values(data)
      .returningAll()
      .executeTakeFirst()
  }

  async update(id: number, data: Partial<{ email: string; name: string }>) {
    return db
      .updateTable('users')
      .set(data)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst()
  }

  async delete(id: number) {
    return db
      .deleteFrom('users')
      .where('id', '=', id)
      .execute()
  }
}
```

## Migrations

### Create Migration

```typescript
// src/db/migrations/001_initial.ts
import { Kysely, sql } from 'kysely'
import { Database } from '../types'

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('users')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .execute()

  await db.schema
    .createTable('posts')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('user_id', 'integer', (col) =>
      col.references('users.id').onDelete('cascade').notNull()
    )
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('content', 'text')
    .addColumn('published', 'boolean', (col) =>
      col.defaultTo(false).notNull()
    )
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('posts').execute()
  await db.schema.dropTable('users').execute()
}
```

### Migration Runner

```typescript
// src/db/migrate.ts
import { promises as fs } from 'fs'
import path from 'path'
import { db } from './database'

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations')
  const files = await fs.readdir(migrationsDir)

  for (const file of files.sort()) {
    if (!file.endsWith('.ts')) continue

    const migration = await import(path.join(migrationsDir, file))
    console.log(`Running migration: ${file}`)
    await migration.up(db)
  }

  console.log('All migrations completed')
}

runMigrations()
```

## Type Generation

```bash
# Generate types from existing database
npx kysely-codegen --out-file ./src/db/types.ts

# With connection string
npx kysely-codegen \
  --out-file ./src/db/types.ts \
  --url postgres://user:pass@localhost:5432/dbname
```

## Best Practices

1. **Use Repository Pattern**: Encapsulate database logic
2. **Type Safety**: Keep types in sync with migrations
3. **Transactions**: Use for operations that must succeed together
4. **Connection Pooling**: Configure appropriate pool size
5. **Migrations**: Version control your schema changes
6. **Error Handling**: Handle database errors gracefully
7. **Indexing**: Add indexes for frequently queried columns

## Testing

```typescript
import { Kysely, SqliteAdapter, SqliteDriver } from 'kysely'
import { Database } from '../src/db/types'

describe('UserRepository', () => {
  let db: Kysely<Database>

  beforeAll(async () => {
    db = new Kysely<Database>({
      dialect: {
        createAdapter: () => new SqliteAdapter(),
        createDriver: () => new SqliteDriver({ filename: ':memory:' }),
        createIntrospector: (db) => new SqliteIntrospector(db),
        createQueryCompiler: () => new SqliteQueryCompiler(),
      },
    })

    // Run migrations on test database
    await runMigrations(db)
  })

  afterAll(async () => {
    await db.destroy()
  })

  it('should create user', async () => {
    const repo = new UserRepository()
    const user = await repo.create({
      email: 'test@example.com',
      name: 'Test User',
    })

    expect(user.email).toBe('test@example.com')
  })
})
```

## Performance Tips

1. **Select Only What You Need**: Use `.select()` instead of `.selectAll()`
2. **Use Indexes**: Create indexes on frequently queried columns
3. **Batch Operations**: Use batch inserts for multiple rows
4. **Connection Pooling**: Configure appropriate pool size
5. **Query Optimization**: Use EXPLAIN to analyze queries
6. **Caching**: Cache frequently accessed data

## Integration with Frameworks

### Express.js

```typescript
import express from 'express'
import { db } from './db/database'

const app = express()

app.get('/users/:id', async (req, res) => {
  const user = await db
    .selectFrom('users')
    .where('id', '=', parseInt(req.params.id))
    .selectAll()
    .executeTakeFirst()

  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  res.json(user)
})
```

### Next.js API Routes

```typescript
// pages/api/users/[id].ts
import { db } from '../../../db/database'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query

  if (req.method === 'GET') {
    const user = await db
      .selectFrom('users')
      .where('id', '=', Number(id))
      .selectAll()
      .executeTakeFirst()

    return res.status(200).json(user)
  }

  res.status(405).json({ error: 'Method not allowed' })
}
```

## Resources

- [Official Documentation](https://kysely.dev/)
- [GitHub Repository](https://github.com/kysely-org/kysely)
- [Type Generation](https://github.com/ RobinBlomberg/kysely-codegen)
- [Examples](https://github.com/kysely-org/kysely/tree/master/examples)

## Summary

Kysely provides a powerful type-safe SQL query builder for TypeScript applications. Its fluent API, comprehensive type checking, and support for multiple databases make it an excellent choice for projects that need type safety without sacrificing SQL flexibility.
