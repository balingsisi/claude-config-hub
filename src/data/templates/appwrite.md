# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: Appwrite Backend-as-a-Service
**Type**: Full-Stack Application with BaaS
**Tech Stack**: Appwrite + Next.js/React/Vue + TypeScript
**Goal**: Build applications with authentication, database, storage, and serverless functions without managing backend infrastructure

---

## Tech Stack

### Backend (Appwrite)
- **Platform**: Appwrite Cloud or Self-hosted
- **Services**: Auth, Database, Storage, Functions, Realtime
- **Authentication**: Email/Password, OAuth (Google, GitHub, etc.)
- **Database**: Document-based with real-time subscriptions
- **Storage**: File uploads with transformations
- **Functions**: Serverless functions (Node.js, Python, etc.)

### Frontend
- **Framework**: Next.js / React / Vue / Nuxt / Svelte
- **Language**: TypeScript 5.x
- **SDK**: Appwrite Web SDK
- **Styling**: Tailwind CSS
- **State**: React Context / Zustand / Pinia

### Development
- **Package Manager**: npm/pnpm/yarn
- **Testing**: Vitest / Jest
- **Linting**: ESLint
- **Formatting**: Prettier

---

## Code Standards

### TypeScript Rules
- Use Appwrite SDK types
- Define custom types for your data models
- Use async/await for SDK operations
- Handle errors properly

```typescript
// ✅ Good - Typed model and SDK usage
import { Models } from 'appwrite'

interface PostDocument extends Models.Document {
  title: string
  content: string
  author: string
  published: boolean
  publishedAt: string
}

async function getPosts(): Promise<PostDocument[]> {
  try {
    const response = await databases.listDocuments<PostDocument>(
      DATABASE_ID,
      COLLECTION_POSTS
    )
    return response.documents
  } catch (error) {
    console.error('Failed to fetch posts:', error)
    throw error
  }
}

// ❌ Bad - Untyped, no error handling
async function getPosts() {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID)
  return response.documents
}
```

### Naming Conventions
- **Database IDs**: UPPER_SNAKE_CASE (`BLOG_DATABASE`)
- **Collection IDs**: UPPER_SNAKE_CASE (`POSTS_COLLECTION`)
- **Document fields**: camelCase (`publishedAt`)
- **Variables**: camelCase (`currentUser`)
- **Components**: PascalCase (`UserProfile`)

### File Organization
```
src/
├── lib/
│   ├── appwrite.ts          # Appwrite client configuration
│   ├── auth.ts              # Authentication utilities
│   ├── database.ts          # Database operations
│   └── storage.ts           # Storage operations
├── types/
│   └── models.ts            # TypeScript interfaces
├── components/
│   ├── auth/                # Auth components
│   ├── database/            # Database CRUD components
│   └── storage/             # File upload components
├── hooks/
│   ├── useAuth.ts           # Auth hook
│   ├── useDatabase.ts       # Database hook
│   └── useStorage.ts        # Storage hook
└── app/                     # App pages/components
```

---

## Architecture Patterns

### Appwrite Client Setup
- Configure SDK with environment variables
- Create singleton client instance
- Export database, storage, and auth instances

```typescript
// ✅ Good - Centralized Appwrite configuration
import { Client, Account, Databases, Storage } from 'appwrite'

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)

// Usage
import { account, databases } from '@/lib/appwrite'
```

### Authentication
- Use Appwrite Auth for user management
- Implement login, register, logout flows
- Handle session persistence
- Implement OAuth providers

```typescript
// ✅ Good - Auth utilities
export async function signUp(email: string, password: string, name: string) {
  try {
    const user = await account.create('unique()', email, password, name)
    await account.createEmailPasswordSession(email, password)
    return user
  } catch (error) {
    console.error('Sign up failed:', error)
    throw error
  }
}

export async function signIn(email: string, password: string) {
  try {
    const session = await account.createEmailPasswordSession(email, password)
    return session
  } catch (error) {
    console.error('Sign in failed:', error)
    throw error
  }
}

export async function getCurrentUser() {
  try {
    return await account.get()
  } catch {
    return null
  }
}

export async function signOut() {
  await account.deleteSession('current')
}
```

### Database Operations
- Use document-based database
- Implement CRUD operations
- Use queries for filtering
- Implement pagination

```typescript
// ✅ Good - Database operations
export async function createPost(data: Omit<PostDocument, keyof Models.Document>) {
  try {
    const post = await databases.createDocument<PostDocument>(
      DATABASE_ID,
      COLLECTION_POSTS,
      'unique()',
      data
    )
    return post
  } catch (error) {
    console.error('Failed to create post:', error)
    throw error
  }
}

export async function getPost(id: string) {
  try {
    return await databases.getDocument<PostDocument>(
      DATABASE_ID,
      COLLECTION_POSTS,
      id
    )
  } catch (error) {
    console.error('Failed to fetch post:', error)
    throw error
  }
}

export async function listPosts(limit = 10, offset = 0) {
  try {
    return await databases.listDocuments<PostDocument>(
      DATABASE_ID,
      COLLECTION_POSTS,
      [
        Query.equal('published', true),
        Query.orderDesc('publishedAt'),
        Query.limit(limit),
        Query.offset(offset)
      ]
    )
  } catch (error) {
    console.error('Failed to list posts:', error)
    throw error
  }
}

export async function updatePost(id: string, data: Partial<PostDocument>) {
  try {
    return await databases.updateDocument<PostDocument>(
      DATABASE_ID,
      COLLECTION_POSTS,
      id,
      data
    )
  } catch (error) {
    console.error('Failed to update post:', error)
    throw error
  }
}

export async function deletePost(id: string) {
  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTION_POSTS, id)
  } catch (error) {
    console.error('Failed to delete post:', error)
    throw error
  }
}
```

### Real-time Subscriptions
- Use real-time subscriptions for live updates
- Subscribe to document changes
- Unsubscribe on component unmount

```typescript
// ✅ Good - Real-time subscription
import { Client } from 'appwrite'

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

export function subscribeToPosts(callback: (payload: any) => void) {
  return client.subscribe(
    `databases.${DATABASE_ID}.collections.${COLLECTION_POSTS}.documents`,
    callback
  )
}

// Usage in React component
useEffect(() => {
  const unsubscribe = subscribeToPosts((response) => {
    if (response.events.includes('databases.*.collections.*.documents.*.create')) {
      // New post created
      setPosts(prev => [...prev, response.payload])
    }
    if (response.events.includes('databases.*.collections.*.documents.*.update')) {
      // Post updated
      setPosts(prev => prev.map(post => 
        post.$id === response.payload.$id ? response.payload : post
      ))
    }
    if (response.events.includes('databases.*.collections.*.documents.*.delete')) {
      // Post deleted
      setPosts(prev => prev.filter(post => post.$id !== response.payload.$id))
    }
  })
  
  return () => unsubscribe()
}, [])
```

### File Storage
- Upload files to Appwrite Storage
- Get file previews
- Handle file permissions

```typescript
// ✅ Good - Storage operations
export async function uploadFile(file: File) {
  try {
    const response = await storage.createFile(
      BUCKET_ID,
      'unique()',
      file
    )
    return response
  } catch (error) {
    console.error('Failed to upload file:', error)
    throw error
  }
}

export function getFileUrl(fileId: string) {
  return storage.getFileView(BUCKET_ID, fileId)
}

export function getFilePreview(fileId: string, width = 400, height = 300) {
  return storage.getFilePreview(BUCKET_ID, fileId, {
    width,
    height,
    gravity: 'center'
  })
}

export async function deleteFile(fileId: string) {
  try {
    await storage.deleteFile(BUCKET_ID, fileId)
  } catch (error) {
    console.error('Failed to delete file:', error)
    throw error
  }
}
```

---

## Key Constraints

### Security
- ✅ Use Appwrite's built-in authentication
- ✅ Implement document-level permissions
- ✅ Validate data on frontend and backend (functions)
- ✅ Use environment variables for Appwrite credentials
- ✅ Configure CORS settings properly
- ❌ Never expose Appwrite API key on frontend
- ❌ Never skip authentication for protected routes
- ❌ Never trust client-side validation alone

### Performance
- ✅ Use pagination for large datasets
- ✅ Implement real-time subscriptions selectively
- ✅ Optimize images before upload
- ✅ Use file previews for images
- ❌ Don't fetch all documents without pagination
- ❌ Don't subscribe to unnecessary events
- ❌ Don't upload large files without chunking

### Data Modeling
- ✅ Define proper document structure
- ✅ Use relationships for related data
- ✅ Index frequently queried fields
- ✅ Use appropriate data types
- ❌ Don't duplicate data excessively
- ❌ Don't create deeply nested structures
- ❌ Don't ignore document size limits

---

## Common Commands

### Appwrite CLI
```bash
appwrite login              # Login to Appwrite
appwrite init               # Initialize project
appwrite deploy             # Deploy functions
appwrite databases create   # Create database
appwrite storage create     # Create storage bucket
```

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run test         # Run tests
```

### Environment Variables
```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key  # Server-side only
```

---

## Important Prohibitions

### ❌ Never Do
- Don't expose API key on frontend
- Don't skip error handling
- Don't ignore document permissions
- Don't commit `.env` files
- Don't use API key for client-side operations
- Don't disable authentication for production
- Don't fetch sensitive data without permission checks

### ⚠️ Use with Caution
- Real-time subscriptions - can impact performance if overused
- Large file uploads - consider chunking or compression
- Complex queries - may need optimization
- Batch operations - ensure they're within limits

---

## Best Practices

### React Hooks
- Create custom hooks for Appwrite operations
- Handle loading and error states
- Implement proper cleanup

```typescript
// ✅ Good - Custom hook
export function useAuth() {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false))
  }, [])
  
  const login = async (email: string, password: string) => {
    await signIn(email, password)
    const user = await getCurrentUser()
    setUser(user)
    return user
  }
  
  const logout = async () => {
    await signOut()
    setUser(null)
  }
  
  return { user, loading, login, logout }
}
```

### Permission Handling
- Set document permissions on creation
- Use roles for access control
- Implement team-based permissions

```typescript
// ✅ Good - Document with permissions
await databases.createDocument(
  DATABASE_ID,
  COLLECTION_POSTS,
  'unique()',
  {
    title: 'My Post',
    content: 'Content...',
    author: userId
  },
  [
    Permission.read(Role.any()),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId))
  ]
)
```

### Server-side Operations
- Use API key for server-side operations
- Keep API key secure on backend
- Implement proper middleware

```typescript
// ✅ Good - Server-side with API key
import { Client, Databases } from 'node-appwrite'

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!)

const databases = new Databases(client)

export async function getServerSideProps() {
  const posts = await databases.listDocuments(DATABASE_ID, COLLECTION_POSTS)
  return { props: { posts } }
}
```

---

## Quick Reference

### Appwrite Services
- **Account** - User authentication and management
- **Databases** - Document storage and retrieval
- **Storage** - File uploads and management
- **Functions** - Serverless functions
- **Realtime** - Real-time subscriptions

### Query Operators
- `Query.equal(attr, value)` - Equal to
- `Query.notEqual(attr, value)` - Not equal to
- `Query.lessThan(attr, value)` - Less than
- `Query.greaterThan(attr, value)` - Greater than
- `Query.search(attr, query)` - Full-text search
- `Query.orderDesc(attr)` - Sort descending
- `Query.orderAsc(attr)` - Sort ascending
- `Query.limit(n)` - Limit results
- `Query.offset(n)` - Skip results

### Permission Types
- `Permission.read(role)` - Read permission
- `Permission.write(role)` - Write permission
- `Permission.update(role)` - Update permission
- `Permission.delete(role)` - Delete permission

### Roles
- `Role.any()` - Any user
- `Role.user(id)` - Specific user
- `Role.users()` - All authenticated users
- `Role.guests()` - Unauthenticated users
- `Role.team(id)` - Team members
- `Role.member(id)` - Team member

---

**Last Updated**: 2026-03-17
