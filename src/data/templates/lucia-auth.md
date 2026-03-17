# Lucia Auth - Complete Authentication Framework

## Overview

Lucia Auth is a flexible authentication framework for TypeScript that works with any database and framework. It provides a comprehensive set of authentication methods including email/password, OAuth, and more.

> **Note**: As of 2024, Lucia v3 is the latest version. Lucia v2 has been deprecated. This template uses Lucia v3.

## Key Features

- **Database Agnostic**: Works with any database
- **Framework Agnostic**: Use with Express, Next.js, SvelteKit, etc.
- **Multiple Auth Methods**: Email/password, OAuth, WebAuthn
- **Session Management**: Built-in session handling
- **Type-Safe**: Full TypeScript support
- **Flexible**: Customizable to your needs

## Project Structure

```
lucia-auth-project/
├── src/
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── lucia.ts           # Lucia instance
│   │   │   ├── adapter.ts         # Database adapter
│   │   │   └── index.ts
│   │   ├── db/
│   │   │   ├── schema.ts          # User schema
│   │   │   └── index.ts
│   │   └── utils/
│   │       └── password.ts
│   ├── routes/
│   │   ├── auth/
│   │   │   ├── login.ts
│   │   │   ├── register.ts
│   │   │   ├── logout.ts
│   │   │   └── oauth/
│   │   │       ├── google.ts
│   │   │       └── github.ts
│   │   └── api/
│   │       └── user.ts
│   └── app.ts
├── package.json
└── tsconfig.json
```

## Installation

```bash
# Core package
npm install lucia

# Database adapter (choose one)
npm install @lucia-auth/adapter-prisma     # Prisma
npm install @lucia-auth/adapter-drizzle    # Drizzle ORM
npm install @lucia-auth/adapter-sqlite     # SQLite

# Password hashing
npm install @node-rs/argon2

# OAuth providers (optional)
npm install @lucia-auth/oauth
```

## Configuration

### Database Schema (Prisma)

```prisma
// schema.prisma
model User {
  id           String    @id @unique
  auth_user_id String    @unique
  username     String?
  email        String    @unique
  created_at   DateTime  @default(now())
  updated_at   DateTime  @updatedAt
  sessions     Session[]
  keys         Key[]
  attributes   Json?

  @@map("user")
}

model Session {
  id           String   @id @unique
  user_id      String
  active_expires BigInt
  idle_expires   BigInt
  user         User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@map("session")
}

model Key {
  id           String   @id
  user_id      String
  hashed_password String?
  user         User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@map("key")
}
```

### Lucia Instance (src/lib/auth/lucia.ts)

```typescript
import { Lucia } from 'lucia'
import { PrismaAdapter } from '@lucia-auth/adapter-prisma'
import { prisma } from '../db'

const adapter = new PrismaAdapter(prisma.session, prisma.user)

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === 'production',
    },
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
      username: attributes.username,
    }
  },
})

// IMPORTANT! Type declaration
declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia
    DatabaseUserAttributes: {
      email: string
      username: string | null
    }
  }
}
```

## Authentication Methods

### Email/Password Authentication

#### Registration (src/routes/auth/register.ts)

```typescript
import { lucia } from '../../lib/auth'
import { hash } from '@node-rs/argon2'
import { generateId } from 'lucia'
import { prisma } from '../../lib/db'

export async function register(email: string, password: string, username?: string) {
  // Validate input
  if (!email || !password) {
    throw new Error('Email and password are required')
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters')
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    throw new Error('Email already in use')
  }

  // Generate IDs
  const userId = generateId(15)
  const authUserId = generateId(15)

  // Hash password
  const passwordHash = await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  })

  // Create user
  await prisma.user.create({
    data: {
      id: userId,
      auth_user_id: authUserId,
      email,
      username: username || null,
    },
  })

  // Create key (password)
  await prisma.key.create({
    data: {
      id: `email:${email}`,
      user_id: userId,
      hashed_password: passwordHash,
    },
  })

  // Create session
  const session = await lucia.createSession(userId, {})
  const sessionCookie = lucia.createSessionCookie(session.id)

  return { session, sessionCookie }
}
```

#### Login (src/routes/auth/login.ts)

```typescript
import { lucia } from '../../lib/auth'
import { verify } from '@node-rs/argon2'
import { prisma } from '../../lib/db'

export async function login(email: string, password: string) {
  // Validate input
  if (!email || !password) {
    throw new Error('Email and password are required')
  }

  // Find key (email/password)
  const key = await prisma.key.findUnique({
    where: { id: `email:${email}` },
    include: { user: true },
  })

  if (!key || !key.hashed_password) {
    throw new Error('Invalid email or password')
  }

  // Verify password
  const validPassword = await verify(key.hashed_password, password)

  if (!validPassword) {
    throw new Error('Invalid email or password')
  }

  // Create session
  const session = await lucia.createSession(key.user_id, {})
  const sessionCookie = lucia.createSessionCookie(session.id)

  return { session, sessionCookie, user: key.user }
}
```

#### Logout (src/routes/auth/logout.ts)

```typescript
import { lucia } from '../../lib/auth'

export async function logout(sessionId: string) {
  await lucia.invalidateSession(sessionId)
  const sessionCookie = lucia.createBlankSessionCookie()
  return { sessionCookie }
}
```

### OAuth Authentication

#### Google OAuth (src/routes/auth/oauth/google.ts)

```typescript
import { lucia } from '../../../lib/auth'
import { google } from '@lucia-auth/oauth/providers'
import { generateId } from 'lucia'
import { prisma } from '../../../lib/db'

const googleAuth = google(lucia, {
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: 'http://localhost:3000/auth/google/callback',
})

export async function getGoogleAuthUrl() {
  const [url, state] = await googleAuth.getAuthorizationUrl()
  return { url, state }
}

export async function handleGoogleCallback(code: string, state: string) {
  const { getExistingUser, googleUser, createUser } = await googleAuth.validateCallback(code)

  const existingUser = await getExistingUser()

  if (existingUser) {
    const session = await lucia.createSession(existingUser.id, {})
    const sessionCookie = lucia.createSessionCookie(session.id)
    return { session, sessionCookie, user: existingUser }
  }

  // Check if email already exists
  const existingEmailUser = await prisma.user.findUnique({
    where: { email: googleUser.email },
  })

  if (existingEmailUser) {
    // Link Google account to existing user
    await prisma.key.create({
      data: {
        id: `google:${googleUser.sub}`,
        user_id: existingEmailUser.id,
        hashed_password: null,
      },
    })

    const session = await lucia.createSession(existingEmailUser.id, {})
    const sessionCookie = lucia.createSessionCookie(session.id)
    return { session, sessionCookie, user: existingEmailUser }
  }

  // Create new user
  const userId = generateId(15)
  const authUserId = generateId(15)

  const user = await prisma.user.create({
    data: {
      id: userId,
      auth_user_id: authUserId,
      email: googleUser.email,
      username: googleUser.name,
    },
  })

  await prisma.key.create({
    data: {
      id: `google:${googleUser.sub}`,
      user_id: userId,
      hashed_password: null,
    },
  })

  const session = await lucia.createSession(userId, {})
  const sessionCookie = lucia.createSessionCookie(session.id)

  return { session, sessionCookie, user }
}
```

#### GitHub OAuth (src/routes/auth/oauth/github.ts)

```typescript
import { lucia } from '../../../lib/auth'
import { github } from '@lucia-auth/oauth/providers'
import { generateId } from 'lucia'
import { prisma } from '../../../lib/db'

const githubAuth = github(lucia, {
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  redirectUri: 'http://localhost:3000/auth/github/callback',
})

export async function getGithubAuthUrl() {
  const [url, state] = await githubAuth.getAuthorizationUrl()
  return { url, state }
}

export async function handleGithubCallback(code: string) {
  const { getExistingUser, githubUser, createUser } = await githubAuth.validateCallback(code)

  const existingUser = await getExistingUser()

  if (existingUser) {
    const session = await lucia.createSession(existingUser.id, {})
    const sessionCookie = lucia.createSessionCookie(session.id)
    return { session, sessionCookie, user: existingUser }
  }

  // Create or link user (similar to Google OAuth)
  // ... implementation similar to Google callback
}
```

## Session Management

### Validate Session Middleware

```typescript
// src/lib/auth/middleware.ts
import { lucia } from './lucia'
import type { Session, User } from 'lucia'

export async function validateSession(
  sessionId: string | undefined
): Promise<{ user: User | null; session: Session | null }> {
  if (!sessionId) {
    return { user: null, session: null }
  }

  const { session, user } = await lucia.validateSession(sessionId)

  if (session && session.fresh) {
    // Session needs refresh
    const sessionCookie = lucia.createSessionCookie(session.id)
    return { session, user, sessionCookie }
  }

  return { session, user }
}
```

### Auth Guard Middleware (Express)

```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express'
import { validateSession } from '../lib/auth/middleware'

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const sessionId = req.cookies.session

  const { user, session } = await validateSession(sessionId)

  if (!user || !session) {
    res.clearCookie('session')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  req.user = user
  req.session = session
  next()
}
```

## Protected Routes

```typescript
// src/routes/api/user.ts
import { Router } from 'express'
import { requireAuth } from '../../middleware/auth'

const router = Router()

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})

router.put('/me', requireAuth, async (req, res) => {
  const { username } = req.body

  await prisma.user.update({
    where: { id: req.user.id },
    data: { username },
  })

  res.json({ success: true })
})

export default router
```

## Integration Examples

### Express.js

```typescript
import express from 'express'
import cookieParser from 'cookie-parser'
import { lucia } from './lib/auth'

const app = express()

app.use(cookieParser())
app.use(express.json())

// Middleware to attach user to request
app.use(async (req, res, next) => {
  const sessionId = req.cookies.session
  const { user, session } = await lucia.validateSession(sessionId)

  if (session && session.fresh) {
    const sessionCookie = lucia.createSessionCookie(session.id)
    res.cookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
  }

  if (!session) {
    const sessionCookie = lucia.createBlankSessionCookie()
    res.cookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
  }

  req.user = user
  req.session = session
  next()
})

// Routes
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, username } = req.body
    const { session, sessionCookie } = await register(email, password, username)
    
    res.cookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
    res.json({ success: true })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const { session, sessionCookie, user } = await login(email, password)
    
    res.cookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
    res.json({ user })
  } catch (error) {
    res.status(401).json({ error: error.message })
  }
})

app.post('/auth/logout', async (req, res) => {
  const sessionId = req.cookies.session
  if (sessionId) {
    await logout(sessionId)
  }
  res.clearCookie('session')
  res.json({ success: true })
})
```

### Next.js App Router

```typescript
// app/lib/auth.ts
import { lucia } from 'lucia'
import { prisma } from './db'
import { cookies } from 'next/headers'

export const auth = lucia({
  adapter: prismaAdapter(prisma),
  env: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'DEV',
  middleware: nextjsFuture(),
  sessionCookie: {
    expires: false,
  },
})

export type Auth = typeof auth

// app/actions/auth.ts
'use server'

import { auth } from '../lib/auth'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(email: string, password: string) {
  const user = await auth.useKey('email', email, password)
  const session = await auth.createSession({
    userId: user.userId,
    attributes: {},
  })
  
  const sessionCookie = auth.createSessionCookie(session)
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  )
  
  redirect('/dashboard')
}

export async function logout() {
  const session = await auth.getSession()
  if (session) {
    await auth.invalidateSession(session.sessionId)
  }
  
  const sessionCookie = auth.createBlankSessionCookie()
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  )
  
  redirect('/login')
}
```

## Security Best Practices

1. **Password Hashing**: Use Argon2id (via @node-rs/argon2)
2. **HTTPS**: Always use HTTPS in production
3. **Session Security**: Set secure cookie flags
4. **CSRF Protection**: Implement CSRF tokens
5. **Rate Limiting**: Limit login attempts
6. **Input Validation**: Validate all user inputs
7. **Secrets Management**: Use environment variables
8. **Regular Updates**: Keep dependencies updated

## Environment Variables

```env
# .env
DATABASE_URL="postgresql://user:pass@localhost:5432/db"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# App Settings
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Testing

```typescript
import { lucia } from '../lib/auth'
import { hash } from '@node-rs/argon2'

describe('Authentication', () => {
  it('should register user', async () => {
    const email = 'test@example.com'
    const password = 'password123'
    
    const { session, sessionCookie } = await register(email, password)
    
    expect(session).toBeDefined()
    expect(sessionCookie.value).toBeDefined()
  })

  it('should login user', async () => {
    const email = 'test@example.com'
    const password = 'password123'
    
    await register(email, password)
    const { user } = await login(email, password)
    
    expect(user.email).toBe(email)
  })

  it('should validate session', async () => {
    const { session } = await register('test@example.com', 'password123')
    
    const { user, session: validSession } = await lucia.validateSession(session.id)
    
    expect(user).toBeDefined()
    expect(validSession.id).toBe(session.id)
  })
})
```

## Resources

- [Official Documentation](https://lucia-auth.com/)
- [GitHub Repository](https://github.com/lucia-auth/lucia)
- [Examples](https://github.com/lucia-auth/lucia/tree/main/examples)
- [OAuth Providers](https://lucia-auth.com/oauth/providers)

## Migration Guide (v2 to v3)

If you're migrating from Lucia v2:

1. Update imports from `lucia-auth` to `lucia`
2. Update adapter imports from `@lucia-auth/adapter-xxx`
3. Change `auth` to `lucia` instance creation
4. Update session cookie handling
5. Review getUserAttributes configuration

## Summary

Lucia Auth provides a flexible, type-safe authentication solution for TypeScript applications. Its database-agnostic approach and support for multiple authentication methods make it suitable for a wide range of projects, from simple applications to complex enterprise systems.
