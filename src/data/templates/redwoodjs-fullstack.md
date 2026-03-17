# RedwoodJS Fullstack Application Template

## Project Overview

Opinionated fullstack JavaScript framework with integrated frontend, backend, and database tooling. RedwoodJS combines React, GraphQL, and Prisma into a cohesive development experience with conventions and best practices built-in.

## Tech Stack

- **Framework**: RedwoodJS 7.x
- **Frontend**: React 18, TypeScript
- **Backend**: GraphQL (Yoga), Serverless Functions
- **Database**: PostgreSQL (Prisma ORM)
- **Styling**: Tailwind CSS
- **Testing**: Jest, Playwright, Storybook
- **Auth**: RedwoodAuth (DbAuth / Firebase / Auth0 / Supabase)

## Project Structure

```
├── api/                          # Backend (GraphQL + Functions)
│   ├── db/                       # Database layer
│   │   ├── schema.prisma         # Prisma schema
│   │   └── seed.ts               # Seed data
│   ├── src/                      # API source
│   │   ├── functions/            # Serverless functions
│   │   │   ├── graphql.ts        # GraphQL endpoint
│   │   │   └── auth.ts           # Auth handler
│   │   ├── graphql/              # GraphQL schema & resolvers
│   │   │   ├── user.sdl.ts
│   │   │   └── post.sdl.ts
│   │   ├── services/             # Business logic
│   │   │   ├── users/
│   │   │   │   └── users.ts
│   │   │   └── posts/
│   │   │       └── posts.ts
│   │   ├── lib/                  # Utilities
│   │   │   ├── auth.ts
│   │   │   └── db.ts
│   │   └── directives/           # GraphQL directives
│   └── server.config.ts          # Server configuration
├── web/                          # Frontend (React)
│   ├── src/                      # Web source
│   │   ├── components/           # React components
│   │   │   ├── Admin/
│   │   │   ├── BlogPost/
│   │   │   └── Navigation/
│   │   ├── layouts/              # Page layouts
│   │   │   └── BlogLayout/
│   │   ├── pages/                # Route pages
│   │   │   ├── HomePage/
│   │   │   ├── BlogPage/
│   │   │   └── FatalErrorPage/
│   │   ├── App.tsx               # Root component
│   │   ├── Routes.tsx            # Route definitions
│   │   └── index.css             # Global styles
│   ├── public/                   # Static assets
│   └── index.html
├── scripts/                      # Build scripts
├── graphql.config.js             # GraphQL configuration
├── redwood.toml                  # RedwoodJS configuration
└── package.json
```

## Key Patterns

### 1. Prisma Schema

```prisma
// api/db/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int       @id @default(autoincrement())
  email     String    @unique
  name      String?
  password  String?
  posts     Post[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  role      Role      @default(USER)
}

model Post {
  id          Int       @id @default(autoincrement())
  title       String
  body        String
  authorId    Int
  author      User      @relation(fields: [authorId], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

enum Role {
  USER
  ADMIN
}
```

### 2. GraphQL Schema & Resolver (SDL)

```typescript
// api/src/graphql/posts.sdl.ts
export const schema = gql`
  type Post {
    id: Int!
    title: String!
    body: String!
    author: User!
    authorId: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Query {
    posts: [Post!]!
    post(id: Int!): Post
  }

  type Mutation {
    createPost(input: CreatePostInput!): Post!
    updatePost(id: Int!, input: UpdatePostInput!): Post!
    deletePost(id: Int!): Post!
  }

  input CreatePostInput {
    title: String!
    body: String!
  }

  input UpdatePostInput {
    title: String
    body: String
  }
`
```

### 3. Service (Business Logic)

```typescript
// api/src/services/posts/posts.ts
import type { Prisma, Post } from '@prisma/client'
import { db } from 'src/lib/db'

export const posts = () => {
  return db.post.findMany({
    include: { author: true },
    orderBy: { createdAt: 'desc' },
  })
}

export const post = ({ id }: { id: number }) => {
  return db.post.findUnique({
    where: { id },
    include: { author: true },
  })
}

interface CreatePostArgs {
  input: Prisma.PostCreateInput
}

export const createPost = ({ input }: CreatePostArgs) => {
  return db.post.create({
    data: input,
  })
}

interface UpdatePostArgs extends Prisma.PostWhereUniqueInput {
  input: Prisma.PostUpdateInput
}

export const updatePost = ({ id, input }: UpdatePostArgs) => {
  return db.post.update({
    data: input,
    where: { id },
  })
}

export const deletePost = ({ id }: { id: number }) => {
  return db.post.delete({
    where: { id },
  })
}
```

### 4. Cell (Data Fetching Component)

```tsx
// web/src/components/BlogPost/BlogPostCell.tsx
import type { BlogPostQuery } from 'types/graphql'
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

export const QUERY = gql`
  query BlogPostQuery($id: Int!) {
    post(id: $id) {
      id
      title
      body
      author {
        name
      }
      createdAt
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Post not found</div>

export const Failure = ({ error }: CellFailureProps) => (
  <div className="text-red-500">Error: {error?.message}</div>
)

export const Success = ({ post }: CellSuccessProps<BlogPostQuery>) => {
  return (
    <article className="prose lg:prose-xl">
      <h1>{post.title}</h1>
      <p className="text-gray-500">
        By {post.author.name} • {new Date(post.createdAt).toLocaleDateString()}
      </p>
      <div>{post.body}</div>
    </article>
  )
}
```

### 5. Page Component

```tsx
// web/src/pages/BlogPage/BlogPage.tsx
import { Metadata } from '@redwoodjs/web'
import BlogPostCell from 'src/components/BlogPost/BlogPostCell'

interface BlogPageProps {
  id: number
}

const BlogPage = ({ id }: BlogPageProps) => {
  return (
    <>
      <Metadata title="Blog Post" description="Blog post details" />
      <BlogPostCell id={id} />
    </>
  )
}

export default BlogPage
```

### 6. Route Configuration

```tsx
// web/src/Routes.tsx
import { Router, Route, Set } from '@redwoodjs/router'
import BlogLayout from 'src/layouts/BlogLayout'

const Routes = () => {
  return (
    <Router>
      <Set wrap={BlogLayout}>
        <Route path="/" page={HomePage} name="home" />
        <Route path="/blog/{id:Int}" page={BlogPage} name="blogPost" />
        <Route path="/about" page={AboutPage} name="about" />
      </Set>
      <Route notfound page={NotFoundPage} />
    </Router>
  )
}

export default Routes
```

### 7. Authentication

```typescript
// api/src/lib/auth.ts
import { DbAuthHandler } from '@redwoodjs/auth-dbauth-api'
import { db } from './db'

export const handler = async (event, context) => {
  const forgotPasswordOptions = {
    handler: (user) => {
      // Send forgot password email
      console.log('Forgot password for:', user.email)
    },
  }

  const resetPasswordOptions = {
    handler: (user) => {
      console.log('Password reset for:', user.email)
    },
  }

  return await DbAuthHandler({
    db,
    event,
    context,
    forgotPassword: forgotPasswordOptions,
    resetPassword: resetPasswordOptions,
  })
}
```

### 8. Using Auth in Components

```tsx
// web/src/components/Navigation/Navigation.tsx
import { Link, routes } from '@redwoodjs/router'
import { useAuth } from '@redwoodjs/auth'

const Navigation = () => {
  const { isAuthenticated, currentUser, logOut } = useAuth()

  return (
    <nav className="flex justify-between p-4">
      <Link to={routes.home()} className="font-bold">
        Blog
      </Link>
      <ul className="flex gap-4">
        <li>
          <Link to={routes.home()}>Home</Link>
        </li>
        {isAuthenticated ? (
          <>
            <li>Welcome, {currentUser.email}</li>
            <li>
              <button onClick={logOut}>Logout</button>
            </li>
          </>
        ) : (
          <li>
            <Link to={routes.login()}>Login</Link>
          </li>
        )}
      </ul>
    </nav>
  )
}

export default Navigation
```

## Best Practices

1. **Use Cells**: Leverage Redwood's Cell pattern for data fetching
2. **Service Layer**: Keep business logic in services, not resolvers
3. **Prisma Migrations**: Always use Prisma migrations for schema changes
4. **Auth Guards**: Use requireAuth() in services for protected resources
5. **Generator Commands**: Use `yarn rw g` commands for scaffolding

## Common Commands

```bash
# Development
yarn rw dev

# Generate scaffold
yarn rw g scaffold Post

# Generate component
yarn rw g component BlogPost

# Generate page
yarn rw g page About

# Generate cell
yarn rw g cell BlogPost

# Database
yarn rw prisma migrate dev
yarn rw prisma studio
yarn rw dataMigrate up

# Authentication
yarn rw setup auth dbAuth

# Testing
yarn rw test
yarn rw test:e2e

# Build
yarn rw build

# Deploy
yarn rw deploy
```

## Configuration

```toml
# redwood.toml
[web]
  title = "RedwoodJS App"
  port = 8910
  apiUrl = "/.redwood/functions"

[api]
  port = 8911

[browser]
  open = true

[experimental]
  esbuild = false
```

## Deployment

### Vercel / Netlify

```bash
# Build and deploy
yarn rw build
yarn rw deploy vercel
```

### Serverless (AWS Lambda)

```bash
yarn rw deploy aws
```

### Docker

```dockerfile
FROM node:20-alpine as builder
WORKDIR /app
COPY . .
RUN yarn install
RUN yarn rw build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/api/dist /app/api
COPY --from=builder /app/web/dist /app/web
EXPOSE 8911
CMD ["node", "api/server.js"]
```

## Resources

- [RedwoodJS Documentation](https://redwoodjs.com/docs/introduction)
- [RedwoodJS Tutorial](https://redwoodjs.com/docs/tutorial/foreword)
- [Prisma Documentation](https://www.prisma.io/docs)
- [RedwoodJS Community](https://community.redwoodjs.com/)
