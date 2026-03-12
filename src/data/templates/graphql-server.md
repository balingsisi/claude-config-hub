# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: GraphQL Server
**Type**: GraphQL API Service
**Tech Stack**: Apollo Server / Yoga + TypeScript + PostgreSQL
**Goal**: Type-safe GraphQL API with excellent developer experience and production-ready features

---

## Tech Stack

### Core
- **Server**: Apollo Server 4 or GraphQL Yoga 5
- **Language**: TypeScript 5.3+
- **Schema**: Schema-first or Code-first (Pothos/Nexus)
- **Runtime**: Node.js 20+ LTS

### Database
- **Database**: PostgreSQL 15+
- **ORM**: Prisma or TypeORM
- **Migrations**: Built-in migration system

### Development
- **Package Manager**: pnpm or npm
- **Testing**: Vitest + Apollo Server Testing
- **Tools**: GraphQL Playground / Apollo Studio
- **Linting**: ESLint + Prettier

### Optional
- **Subscriptions**: GraphQL WS or Apollo Server
- **Caching**: Redis + Apollo Data Sources
- **Monitoring**: Apollo Studio / Grafana

---

## Code Standards

### TypeScript Rules
- Use strict mode - no `any` types
- Define proper types for resolvers
- Use code-first or schema-first consistently
- Enable strict null checks

```typescript
// ✅ Good
interface UserResolvers {
  id: (parent: User) => string
  email: (parent: User) => string
  posts: (parent: User) => Promise<Post[]>
}

// ❌ Bad
const resolvers = {
  User: {
    posts: (parent: any) => any
  }
}
```

### Naming Conventions
- **Types**: PascalCase (`User`, `BlogPost`)
- **Queries**: camelCase (`getUser`, `listPosts`)
- **Mutations**: camelCase, verb-first (`createUser`, `updatePost`)
- **Fields**: camelCase (`firstName`, `createdAt`)
- **Enums**: PascalCase values (`UserRole`, `PostStatus`)

### File Organization (Schema-first)
```
src/
├── schema/            # GraphQL schema files
│   ├── user.graphql
│   ├── post.graphql
│   └── index.graphql
├── resolvers/         # Resolver implementations
│   ├── user.resolver.ts
│   ├── post.resolver.ts
│   └── index.ts
├── dataSources/      # Data sources
│   └── database.ts
├── context/          # Context types and setup
│   └── index.ts
├── utils/            # Utility functions
├── types/            # TypeScript types
└── index.ts         # Server entry point
```

### File Organization (Code-first with Pothos)
```
src/
├── schema/           # Schema builder
│   ├── builder.ts
│   ├── types/       # Object types
│   │   ├── user.ts
│   │   └── post.ts
│   └── index.ts
├── resolvers/        # Resolver implementations
│   ├── user.ts
│   └── post.ts
├── prisma/           # Prisma schema
│   └── schema.prisma
├── context/          # Context setup
├── types/            # TypeScript types
└── index.ts         # Server entry point
```

---

## Architecture Patterns

### Schema-First Approach
- Define schema in `.graphql` files
- Implement resolvers in TypeScript
- Use schema stitching for modular schemas

```graphql
# src/schema/user.graphql
type User {
  id: ID!
  email: String!
  name: String!
  posts: [Post!]!
  createdAt: DateTime!
}

type Query {
  me: User
  user(id: ID!): User
  users(skip: Int, take: Int): [User!]!
}

type Mutation {
  createUser(data: CreateUserInput!): User!
  updateUser(id: ID!, data: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!
}

input CreateUserInput {
  email: String!
  name: String!
}

input UpdateUserInput {
  email: String
  name: String
}

scalar DateTime
```

```typescript
// src/resolvers/user.resolver.ts
export const userResolvers = {
  Query: {
    me: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('Not authenticated')
      }
      return context.dataSources.db.user.findUnique({
        where: { id: context.user.id }
      })
    },
    
    user: async (_: any, { id }: { id: string }, context: Context) => {
      return context.dataSources.db.user.findUnique({
        where: { id }
      })
    },
    
    users: async (_: any, { skip = 0, take = 10 }: PaginationArgs, context: Context) => {
      return context.dataSources.db.user.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      })
    }
  },
  
  Mutation: {
    createUser: async (_: any, { data }: { data: CreateUserInput }, context: Context) => {
      return context.dataSources.db.user.create({
        data
      })
    }
  },
  
  User: {
    posts: async (parent: User, _: any, context: Context) => {
      return context.dataSources.db.post.findMany({
        where: { authorId: parent.id }
      })
    }
  }
}
```

### Code-First Approach (Pothos)
- Define schema in TypeScript
- Full type safety with Prisma integration
- Auto-generated schema

```typescript
// src/schema/builder.ts
import SchemaBuilder from '@pothos/core'
import PrismaPlugin from '@pothos/plugin-prisma'
import { DateTimeResolver } from 'graphql-scalars'
import { prisma } from '../db'

export const builder = new SchemaBuilder<{
  Context: Context
  Objects: {
    User: User
    Post: Post
  }
}>({
  plugins: [PrismaPlugin],
  prisma: {
    client: prisma
  }
})

builder.addScalarType('DateTime', DateTimeResolver)

// src/schema/types/user.ts
builder.prismaObject('User', {
  fields: (t) => ({
    id: t.exposeID('id'),
    email: t.exposeString('email'),
    name: t.exposeString('name'),
    posts: t.relation('posts', {
      query: {
        orderBy: { createdAt: 'desc' }
      }
    }),
    createdAt: t.expose('createdAt', { type: 'DateTime' })
  })
})

builder.queryType({
  fields: (t) => ({
    me: t.prismaField({
      type: 'User',
      nullable: true,
      resolve: (query, _, __, context) => {
        if (!context.user) return null
        return prisma.user.findUnique({
          ...query,
          where: { id: context.user.id }
        })
      }
    }),
    
    users: t.prismaField({
      type: ['User'],
      args: {
        skip: t.arg.int({ defaultValue: 0 }),
        take: t.arg.int({ defaultValue: 10 })
      },
      resolve: (query, _, { skip, take }) => {
        return prisma.user.findMany({
          ...query,
          skip,
          take,
          orderBy: { createdAt: 'desc' }
        })
      }
    })
  })
})

builder.mutationType({
  fields: (t) => ({
    createUser: t.prismaField({
      type: 'User',
      args: {
        data: t.arg({
          type: builder.inputType('CreateUserInput', {
            fields: (i) => ({
              email: i.string({ required: true }),
              name: i.string({ required: true })
            })
          })
        })
      },
      resolve: (query, _, { data }) => {
        return prisma.user.create({
          ...query,
          data
        })
      }
    })
  })
})
```

### Authentication & Authorization
- Use context for user information
- Implement middleware/guards
- Validate permissions in resolvers

```typescript
// src/context/index.ts
import { verifyToken } from '../utils/auth'

export interface Context {
  user?: {
    id: string
    email: string
    role: string
  }
  dataSources: {
    db: PrismaClient
  }
}

export async function createContext({ req }: { req: Request }): Promise<Context> {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  let user
  if (token) {
    try {
      user = await verifyToken(token)
    } catch (error) {
      console.error('Invalid token:', error)
    }
  }
  
  return {
    user,
    dataSources: {
      db: prisma
    }
  }
}

// Usage in resolvers
const resolvers = {
  Query: {
    myPosts: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('Not authenticated')
      }
      
      return context.dataSources.db.post.findMany({
        where: { authorId: context.user.id }
      })
    }
  }
}
```

### N+1 Problem Prevention
- Use DataLoader for batching
- Implement proper relation loading
- Monitor query performance

```typescript
// src/dataSources/users.ts
import { DataSource } from 'apollo-datasource'
import DataLoader from 'dataloader'

export class UsersDataSource extends DataSource {
  private userLoader: DataLoader<string, User>
  
  constructor(private prisma: PrismaClient) {
    super()
    this.userLoader = new DataLoader(async (ids: readonly string[]) => {
      const users = await this.prisma.user.findMany({
        where: { id: { in: [...ids] } }
      })
      const userMap = new Map(users.map(u => [u.id, u]))
      return ids.map(id => userMap.get(id) || null)
    })
  }
  
  findById(id: string): Promise<User | null> {
    return this.userLoader.load(id)
  }
  
  findByIds(ids: string[]): Promise<(User | null)[]> {
    return this.userLoader.loadMany(ids)
  }
}
```

---

## Key Constraints

### Performance
- ✅ Use DataLoader to prevent N+1 queries
- ✅ Implement query complexity analysis
- ✅ Set query depth limits
- ✅ Use pagination for lists
- ❌ Don't fetch unnecessary fields
- ❌ Don't ignore query performance

### Security
- ✅ Validate all inputs
- ✅ Implement proper authentication
- ✅ Use authorization checks
- ✅ Limit query complexity
- ❌ Don't expose sensitive data
- ❌ Don't allow arbitrary query depth

### Type Safety
- ✅ Use TypeScript throughout
- ✅ Generate types from schema
- ✅ Keep resolvers type-safe
- ❌ Don't use `any` type
- ❌ Don't ignore type errors

---

## Common Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
```

### Schema
```bash
npm run schema:generate    # Generate TypeScript types from schema
npm run schema:validate    # Validate schema
npm run schema:export      # Export SDL
```

### Database
```bash
npm run db:migrate    # Run migrations
npm run db:seed       # Seed database
npm run db:studio     # Open Prisma Studio
```

### Testing
```bash
npm test             # Run unit tests
npm run test:e2e     # Run E2E tests
```

---

## Important Prohibitions

### ❌ Never Do
- Don't use `any` type - use proper TypeScript types
- Don't skip authentication checks
- Don't ignore N+1 query problems
- Don't expose sensitive fields without authorization
- Don't allow unlimited query depth
- Don't skip input validation
- Don't forget error handling
- Don't use `console.log` in production
- Don't ignore TypeScript errors
- Don't disable security features

### ⚠️ Use with Caution
- Subscriptions - ensure proper scaling strategy
- File uploads - consider size limits and storage
- Real-time features - monitor WebSocket connections
- Complex queries - implement proper limits

---

## Best Practices

### Error Handling
- Use custom error classes
- Provide meaningful error messages
- Log errors appropriately

```typescript
// ✅ Good
class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User with ID ${userId} not found`)
    this.name = 'UserNotFoundError'
  }
}

const resolvers = {
  Query: {
    user: async (_: any, { id }: { id: string }, context: Context) => {
      const user = await context.dataSources.db.user.findUnique({
        where: { id }
      })
      
      if (!user) {
        throw new UserNotFoundError(id)
      }
      
      return user
    }
  }
}
```

### Pagination
- Use cursor-based pagination for large datasets
- Use offset pagination for simple cases
- Provide total count when needed

```graphql
type Query {
  users(
    first: Int
    after: String
    last: Int
    before: String
  ): UserConnection!
}

type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type UserEdge {
  node: User!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

### Testing
- Test resolvers in isolation
- Mock data sources
- Test error cases

```typescript
// ✅ Good
describe('User Resolvers', () => {
  it('should return user by id', async () => {
    const mockUser = { id: '1', name: 'John', email: 'john@example.com' }
    
    const context = {
      dataSources: {
        db: {
          user: {
            findUnique: jest.fn().mockResolvedValue(mockUser)
          }
        }
      }
    }
    
    const result = await userResolvers.Query.user(
      null,
      { id: '1' },
      context
    )
    
    expect(result).toEqual(mockUser)
    expect(context.dataSources.db.user.findUnique).toHaveBeenCalledWith({
      where: { id: '1' }
    })
  })
})
```

---

## Compact Instructions

When using `/compact`, preserve:
- Schema changes and updates
- Resolver architecture decisions
- Database schema changes
- Test commands and results

Discard:
- Verbose log output
- Exploratory search dead ends
- Redundant confirmation messages

---

## Quick Reference

### File Locations
- Schema: `src/schema/**/*.graphql` or `src/schema/**/*.ts`
- Resolvers: `src/resolvers/**/*.ts`
- Data Sources: `src/dataSources/**/*.ts`
- Context: `src/context/index.ts`
- Types: `src/types/**/*.ts`

### Common Scalar Types
```graphql
scalar DateTime
scalar JSON
scalar Upload
scalar Email
scalar URL
scalar PhoneNumber
```

### Apollo Server Setup
```typescript
import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { typeDefs } from './schema'
import { resolvers } from './resolvers'
import { createContext } from './context'

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

const { url } = await startStandaloneServer(server, {
  context: createContext
})

console.log(`Server ready at ${url}`)
```

---

**Last Updated**: 2026-03-12
