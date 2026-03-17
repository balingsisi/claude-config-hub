# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: Apollo Client Application
**Type**: GraphQL Client for React/Next.js
**Tech Stack**: Apollo Client 3.x + React + TypeScript + GraphQL
**Goal**: Production-ready GraphQL client with caching, pagination, and real-time updates

---

## Tech Stack

### Core
- **GraphQL Client**: Apollo Client 3.x
- **Framework**: React 18+ / Next.js 14
- **Language**: TypeScript 5.3+
- **State Management**: Apollo Client Cache

### GraphQL Ecosystem
- **Schema**: GraphQL Schema
- **Code Generation**: GraphQL Code Generator
- **Testing**: Apollo Testing Utilities + Vitest

### Development
- **Package Manager**: pnpm
- **Linting**: ESLint + GraphQL ESLint
- **Formatting**: Prettier

---

## Project Structure

```
apollo-client-app/
├── src/
│   ├── graphql/
│   │   ├── fragments/
│   │   │   ├── user.graphql
│   │   │   ├── post.graphql
│   │   │   └── comment.graphql
│   │   ├── queries/
│   │   │   ├── users.graphql
│   │   │   ├── posts.graphql
│   │   │   └── comments.graphql
│   │   ├── mutations/
│   │   │   ├── auth.graphql
│   │   │   ├── posts.graphql
│   │   │   └── comments.graphql
│   │   ├── subscriptions/
│   │   │   └── notifications.graphql
│   │   └── schema.graphql
│   ├── lib/
│   │   ├── apollo/
│   │   │   ├── client.ts
│   │   │   ├── links.ts
│   │   │   ├── cache.ts
│   │   │   ├── persisted-queries.ts
│   │   │   └── error-handling.ts
│   │   └── auth/
│   │       └── token.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── usePosts.ts
│   │   ├── useOptimisticMutation.ts
│   │   └── usePagination.ts
│   ├── components/
│   │   ├── providers/
│   │   │   └── ApolloProvider.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── posts/
│   │   │   ├── PostList.tsx
│   │   │   ├── PostCard.tsx
│   │   │   ├── PostDetail.tsx
│   │   │   └── CreatePost.tsx
│   │   └── comments/
│   │       ├── CommentList.tsx
│   │       └── AddComment.tsx
│   ├── generated/
│   │   └── graphql.ts
│   └── types/
│       └── index.ts
├── codegen.ts
├── apollo.config.js
├── .graphqlconfig
└── package.json
```

---

## Coding Rules

### 1. GraphQL Fragments

```graphql
# src/graphql/fragments/user.graphql
fragment UserFields on User {
  id
  email
  username
  avatar
  bio
  createdAt
  updatedAt
}

fragment UserWithStats on User {
  ...UserFields
  followersCount
  followingCount
  postsCount
}

# src/graphql/fragments/post.graphql
fragment PostFields on Post {
  id
  title
  slug
  excerpt
  content
  featuredImage
  status
  publishedAt
  createdAt
  updatedAt
  author {
    ...UserFields
  }
  categories {
    id
    name
    slug
  }
  tags {
    id
    name
  }
  commentsCount
  likesCount
}

fragment PostSummary on Post {
  id
  title
  slug
  excerpt
  featuredImage
  publishedAt
  author {
    id
    username
    avatar
  }
  likesCount
  commentsCount
}

# src/graphql/fragments/comment.graphql
fragment CommentFields on Comment {
  id
  content
  createdAt
  updatedAt
  author {
    ...UserFields
  }
}
```

### 2. GraphQL Queries

```graphql
# src/graphql/queries/users.graphql
query GetCurrentUser {
  me {
    ...UserWithStats
  }
}

query GetUser($id: ID!) {
  user(id: $id) {
    ...UserWithStats
  }
}

query GetUserPosts($id: ID!, $page: Int, $limit: Int) {
  userPosts(userId: $id, page: $page, limit: $limit) {
    items {
      ...PostSummary
    }
    total
    hasMore
  }
}

# src/graphql/queries/posts.graphql
query GetPosts($page: Int, $limit: Int, $filter: PostFilterInput) {
  posts(page: $page, limit: $limit, filter: $filter) {
    items {
      ...PostSummary
    }
    total
    hasMore
  }
}

query GetPost($id: ID!) {
  post(id: $id) {
    ...PostFields
  }
}

query GetPostBySlug($slug: String!) {
  postBySlug(slug: $slug) {
    ...PostFields
  }
}

query SearchPosts($query: String!, $page: Int, $limit: Int) {
  searchPosts(query: $query, page: $page, limit: $limit) {
    items {
      ...PostSummary
    }
    total
    hasMore
  }
}

# src/graphql/queries/comments.graphql
query GetComments($postId: ID!, $page: Int, $limit: Int) {
  comments(postId: $postId, page: $page, limit: $limit) {
    items {
      ...CommentFields
    }
    total
    hasMore
  }
}
```

### 3. GraphQL Mutations

```graphql
# src/graphql/mutations/auth.graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    user {
      ...UserFields
    }
    accessToken
    refreshToken
  }
}

mutation Register($input: RegisterInput!) {
  register(input: $input) {
    user {
      ...UserFields
    }
    accessToken
    refreshToken
  }
}

mutation Logout {
  logout
}

mutation RefreshToken($refreshToken: String!) {
  refreshToken(refreshToken: $refreshToken) {
    accessToken
    refreshToken
  }
}

# src/graphql/mutations/posts.graphql
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    ...PostFields
  }
}

mutation UpdatePost($id: ID!, $input: UpdatePostInput!) {
  updatePost(id: $id, input: $input) {
    ...PostFields
  }
}

mutation DeletePost($id: ID!) {
  deletePost(id: $id)
}

mutation LikePost($postId: ID!) {
  likePost(postId: $postId) {
    id
    likesCount
    isLiked
  }
}

# src/graphql/mutations/comments.graphql
mutation CreateComment($input: CreateCommentInput!) {
  createComment(input: $input) {
    ...CommentFields
  }
}

mutation UpdateComment($id: ID!, $content: String!) {
  updateComment(id: $id, content: $content) {
    ...CommentFields
  }
}

mutation DeleteComment($id: ID!) {
  deleteComment(id: $id)
}
```

### 4. GraphQL Subscriptions

```graphql
# src/graphql/subscriptions/notifications.graphql
subscription OnNotificationAdded($userId: ID!) {
  notificationAdded(userId: $userId) {
    id
    type
    title
    message
    read
    createdAt
  }
}

subscription OnPostCommented($postId: ID!) {
  postCommented(postId: $postId) {
    ...CommentFields
  }
}

subscription OnPostLiked($postId: ID!) {
  postLiked(postId: $postId) {
    id
    likesCount
  }
}
```

### 5. Apollo Client Setup

```typescript
// src/lib/apollo/client.ts
import {
  ApolloClient,
  InMemoryCache,
  ApolloLink,
  HttpLink,
  split,
} from "@apollo/client";
import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { RetryLink } from "@apollo/client/link/retry";
import { createPersistedQueryLink } from "@apollo/client/link/persisted-queries";
import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";
import { getToken, setToken, clearToken } from "../auth/token";
import { cacheConfig } from "./cache";

const isBrowser = typeof window !== "undefined";

if (process.env.NODE_ENV === "development") {
  loadDevMessages();
  loadErrorMessages();
}

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "http://localhost:4000/graphql";
const WS_ENDPOINT = process.env.NEXT_PUBLIC_WS_ENDPOINT || "ws://localhost:4000/graphql";

// Auth link
const authLink = setContext(async (_, { headers }) => {
  const token = getToken();
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      if (err.extensions?.code === "UNAUTHENTICATED") {
        clearToken();
        if (isBrowser) {
          window.location.href = "/login";
        }
        return;
      }

      console.error(`[GraphQL error]: ${err.message}`, err);
    }
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError.message}`);
  }
});

// Retry link
const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: 3000,
    jitter: true,
  },
  attempts: {
    max: 3,
    retryIf: (error, _operation) => !!error,
  },
});

// HTTP link
const httpLink = new HttpLink({
  uri: GRAPHQL_ENDPOINT,
  credentials: "include",
});

// WebSocket link (for subscriptions)
const wsLink = isBrowser
  ? new WebSocketLink({
      uri: WS_ENDPOINT,
      options: {
        reconnect: true,
        connectionParams: async () => {
          const token = getToken();
          return {
            authorization: token ? `Bearer ${token}` : "",
          };
        },
      },
    })
  : null;

// Split link for subscriptions vs queries/mutations
const splitLink = isBrowser && wsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === "OperationDefinition" &&
          definition.operation === "subscription"
        );
      },
      wsLink,
      httpLink
    )
  : httpLink;

// Create Apollo Client
export function createApolloClient() {
  return new ApolloClient({
    ssrMode: !isBrowser,
    link: ApolloLink.from([
      errorLink,
      retryLink,
      authLink,
      splitLink,
    ]),
    cache: new InMemoryCache(cacheConfig),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: "cache-and-network",
        errorPolicy: "all",
      },
      query: {
        fetchPolicy: "cache-first",
        errorPolicy: "all",
      },
      mutate: {
        errorPolicy: "all",
      },
    },
    connectToDevTools: process.env.NODE_ENV === "development",
  });
}
```

### 6. Cache Configuration

```typescript
// src/lib/apollo/cache.ts
import { FieldPolicy, TypePolicies } from "@apollo/client";

type KeyArgs = FieldPolicy<any>["keyArgs"];

// Pagination helper
function paginationFieldPolicy(keyArgs: KeyArgs = false): FieldPolicy {
  return {
    keyArgs,
    merge(existing, incoming, { args, readField }) {
      if (!args) return incoming;

      const { page = 1 } = args;
      const merged = existing ? { ...existing, items: [...existing.items] } : { items: [], total: 0, hasMore: false };

      // If it's the first page, replace all items
      if (page === 1) {
        merged.items = incoming.items;
      } else {
        // Otherwise, append items (avoiding duplicates)
        const existingIds = new Set(merged.items.map((item: any) => readField("id", item)));
        for (const item of incoming.items) {
          const id = readField("id", item);
          if (!existingIds.has(id)) {
            merged.items.push(item);
          }
        }
      }

      merged.total = incoming.total;
      merged.hasMore = incoming.hasMore;

      return merged;
    },
  };
}

export const cacheConfig: TypePolicies = {
  Query: {
    fields: {
      posts: paginationFieldPolicy(["filter"]),
      userPosts: paginationFieldPolicy(["id"]),
      comments: paginationFieldPolicy(["postId"]),
      searchPosts: paginationFieldPolicy(["query"]),
    },
  },
  User: {
    keyFields: ["id"],
    fields: {
      followersCount: { merge: false },
      followingCount: { merge: false },
      postsCount: { merge: false },
    },
  },
  Post: {
    keyFields: ["id"],
    fields: {
      likesCount: { merge: false },
      commentsCount: { merge: false },
      isLiked: { merge: false },
    },
  },
  Comment: {
    keyFields: ["id"],
  },
};
```

### 7. Custom Hooks

```typescript
// src/hooks/useAuth.ts
import { useMutation, useQuery } from "@apollo/client";
import { useCallback } from "react";
import {
  LOGIN_MUTATION,
  REGISTER_MUTATION,
  LOGOUT_MUTATION,
  REFRESH_TOKEN_MUTATION,
  CURRENT_USER_QUERY,
} from "@/generated/graphql";
import { setToken, clearToken } from "@/lib/auth/token";

export function useAuth() {
  const { data, loading, error } = useQuery(CURRENT_USER_QUERY, {
    skip: typeof window === "undefined",
  });

  const [loginMutation, loginState] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => {
      const { accessToken, refreshToken } = data.login;
      setToken(accessToken, refreshToken);
    },
    update: (cache, { data }) => {
      cache.writeQuery({
        query: CURRENT_USER_QUERY,
        data: { me: data.login.user },
      });
    },
  });

  const [registerMutation, registerState] = useMutation(REGISTER_MUTATION, {
    onCompleted: (data) => {
      const { accessToken, refreshToken } = data.register;
      setToken(accessToken, refreshToken);
    },
    update: (cache, { data }) => {
      cache.writeQuery({
        query: CURRENT_USER_QUERY,
        data: { me: data.register.user },
      });
    },
  });

  const [logoutMutation] = useMutation(LOGOUT_MUTATION, {
    onCompleted: () => {
      clearToken();
      window.location.href = "/login";
    },
    update: (cache) => {
      cache.writeQuery({
        query: CURRENT_USER_QUERY,
        data: { me: null },
      });
    },
  });

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await loginMutation({
        variables: { input: { email, password } },
      });
      return result.data?.login;
    },
    [loginMutation]
  );

  const register = useCallback(
    async (input: { email: string; username: string; password: string }) => {
      const result = await registerMutation({
        variables: { input },
      });
      return result.data?.register;
    },
    [registerMutation]
  );

  const logout = useCallback(() => {
    logoutMutation();
  }, [logoutMutation]);

  return {
    user: data?.me,
    loading,
    error,
    isAuthenticated: !!data?.me,
    login,
    register,
    logout,
    loginState,
    registerState,
  };
}

// src/hooks/usePosts.ts
import { useQuery, useMutation } from "@apollo/client";
import { useState } from "react";
import {
  GET_POSTS_QUERY,
  CREATE_POST_MUTATION,
  UPDATE_POST_MUTATION,
  DELETE_POST_MUTATION,
  LIKE_POST_MUTATION,
} from "@/generated/graphql";
import type { PostFilterInput, CreatePostInput, UpdatePostInput } from "@/generated/graphql";

export function usePosts(initialFilter?: PostFilterInput) {
  const [filter, setFilter] = useState<PostFilterInput>(initialFilter || {});
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, loading, error, fetchMore, refetch } = useQuery(GET_POSTS_QUERY, {
    variables: { page, limit, filter },
    notifyOnNetworkStatusChange: true,
  });

  const loadMore = () => {
    if (data?.posts.hasMore) {
      fetchMore({
        variables: { page: page + 1 },
      });
      setPage((p) => p + 1);
    }
  };

  return {
    posts: data?.posts.items || [],
    total: data?.posts.total || 0,
    hasMore: data?.posts.hasMore || false,
    loading,
    error,
    loadMore,
    refetch,
    filter,
    setFilter,
  };
}

export function usePostMutations() {
  const [createPost, createState] = useMutation(CREATE_POST_MUTATION, {
    update: (cache, { data }) => {
      cache.modify({
        fields: {
          posts: (existing) => {
            const newPostRef = cache.writeFragment({
              data: data!.createPost,
              fragment: gql`
                fragment NewPost on Post {
                  id
                  title
                  slug
                }
              `,
            });
            return {
              ...existing,
              items: [newPostRef, ...existing.items],
              total: existing.total + 1,
            };
          },
        },
      });
    },
  });

  const [updatePost, updateState] = useMutation(UPDATE_POST_MUTATION);

  const [deletePost, deleteState] = useMutation(DELETE_POST_MUTATION, {
    update: (cache, { data }) => {
      if (data?.deletePost) {
        cache.evict({ id: cache.identify({ __typename: "Post", id: data.deletePost }) });
        cache.gc();
      }
    },
  });

  const [likePost, likeState] = useMutation(LIKE_POST_MUTATION, {
    optimisticResponse: (variables) => ({
      likePost: {
        __typename: "Post",
        id: variables.postId,
        likesCount: 0,
        isLiked: true,
      },
    }),
  });

  return {
    createPost: (input: CreatePostInput) => createPost({ variables: { input } }),
    updatePost: (id: string, input: UpdatePostInput) => updatePost({ variables: { id, input } }),
    deletePost: (id: string) => deletePost({ variables: { id } }),
    likePost: (postId: string) => likePost({ variables: { postId } }),
    createState,
    updateState,
    deleteState,
    likeState,
  };
}
```

### 8. Apollo Provider

```typescript
// src/components/providers/ApolloProvider.tsx
"use client";

import { ApolloProvider as BaseApolloProvider } from "@apollo/client";
import { useEffect, useState } from "react";
import { createApolloClient } from "@/lib/apollo/client";

let apolloClient: ReturnType<typeof createApolloClient> | undefined;

function getApolloClient() {
  if (!apolloClient) {
    apolloClient = createApolloClient();
  }
  return apolloClient;
}

export function ApolloProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState(() => getApolloClient());

  useEffect(() => {
    // Hydration sync
    setClient(getApolloClient());
  }, []);

  return <BaseApolloProvider client={client}>{children}</BaseApolloProvider>;
}
```

---

## GraphQL Code Generator Config

```typescript
// codegen.ts
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: process.env.GRAPHQL_SCHEMA_PATH || "http://localhost:4000/graphql",
  documents: ["src/graphql/**/*.graphql"],
  generates: {
    "src/generated/graphql.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-react-apollo",
      ],
      config: {
        withHooks: true,
        withComponent: false,
        withHOC: false,
        reactApolloVersion: 3,
        apolloClientVersion: 3,
        skipTypename: false,
        enumsAsTypes: true,
        maybeValue: "T | undefined",
        inputMaybeValue: "T | undefined",
        scalars: {
          DateTime: "string",
          JSON: "Record<string, any>",
        },
      },
    },
    "src/generated/graphql.schema.json": {
      plugins: ["introspection"],
    },
  },
};

export default config;
```

---

## Environment Variables

```bash
# .env.local

# GraphQL API
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:4000/graphql
NEXT_PUBLIC_WS_ENDPOINT=ws://localhost:4000/graphql

# For codegen
GRAPHQL_SCHEMA_PATH=http://localhost:4000/graphql

# Auth
NEXT_PUBLIC_AUTH_COOKIE_NAME=auth_token
```

---

## Common Commands

```bash
# Development
pnpm dev

# Build
pnpm build

# Generate GraphQL types
pnpm codegen
pnpm codegen:watch

# Lint GraphQL
pnpm lint:graphql

# Validate schema
pnpm schema:validate

# Testing
pnpm test
pnpm test:watch

# Apollo CLI
pnpm apollo client:download-schema
pnpm apollo client:check
```

---

## Deployment Checklist

- [ ] Configure GraphQL endpoint for production
- [ ] Enable WebSocket for subscriptions
- [ ] Set up authentication token refresh
- [ ] Configure error tracking (Sentry)
- [ ] Enable persisted queries (optional)
- [ ] Configure cache size limits
- [ ] Set up CDN for static assets
- [ ] Enable request compression
- [ ] Configure rate limiting
- [ ] Test subscription reconnection
- [ ] Review security headers
- [ ] Monitor query complexity
- [ ] Set up schema monitoring
- [ ] Configure backup GraphQL endpoint
