# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: Svelte Native Mobile App
**Type**: Cross-platform Mobile Application
**Tech Stack**: Svelte Native + NativeScript + TypeScript
**Goal**: Build performant native mobile apps with Svelte's reactive syntax

---

## Tech Stack

### Core
- **Framework**: Svelte Native 0.10+
- **Runtime**: NativeScript 8.6+
- **Language**: TypeScript 5.3+
- **Architecture**: Reactive components, Native rendering

### UI Components
- **UI Library**: NativeScript Core UI
- **Styling**: NativeScript CSS with Svelte scoping
- **Navigation**: NativeScript Navigation
- **Icons**: NativeScript Font Icons

### State Management
- **Local State**: Svelte stores
- **Global State**: Svelte writable/readable stores
- **Persistence**: NativeScript Application Settings

### Development
- **CLI**: NativeScript CLI
- **Package Manager**: npm or pnpm
- **Testing**: Jest + NativeScript Testing
- **Linting**: ESLint + Prettier

---

## Code Standards

### TypeScript Rules
- Use strict mode
- Define component props with interfaces
- Use typed stores
- Enable strict null checks

```typescript
// ✅ Good
<script lang="ts">
  interface Props {
    title: string;
    count?: number;
  }

  export let title: string;
  export let count: number = 0;
</script>

// ❌ Bad
<script>
  export let title;  // No type
  export let count;
</script>
```

### Naming Conventions
- **Components**: PascalCase (`UserCard.svelte`, `ProductList.svelte`)
- **Pages**: PascalCase with Page suffix (`HomePage.svelte`, `DetailPage.svelte`)
- **Stores**: camelCase with store suffix (`userStore.ts`, `cartStore.ts`)
- **Actions**: camelCase (`navigateToDetail`, `addToCart`)
- **Styles**: camelCase for NativeScript properties (`fontSize`, `backgroundColor`)

### File Organization
```
app/
├── components/            # Reusable components
│   ├── Header.svelte
│   ├── Footer.svelte
│   ├── UserCard.svelte
│   └── ProductList.svelte
├── pages/                # Application pages
│   ├── Home.svelte
│   ├── Login.svelte
│   ├── Detail.svelte
│   └── Settings.svelte
├── stores/              # Svelte stores
│   ├── userStore.ts
│   ├── cartStore.ts
│   └── navigationStore.ts
├── services/            # API services
│   ├── api.ts
│   ├── auth.ts
│   └── storage.ts
├── utils/              # Utility functions
│   ├── validators.ts
│   └── helpers.ts
├── models/             # TypeScript interfaces
│   ├── User.ts
│   └── Product.ts
├── app.scss            # Global styles
├── app.ts              # App entry point
└── _app_config.ts      # App configuration
```

---

## Architecture Patterns

### Component Structure
- Single-file components (.svelte)
- Reactive declarations with `$:`
- Proper cleanup in `onDestroy`
- Use slots for composition

```svelte
<!-- components/UserCard.svelte -->
<script lang="ts">
  import { navigate } from 'svelte-native';
  import type { User } from '../models/User';

  export let user: User;
  export let onTap: ((user: User) => void) | undefined = undefined;

  $: formattedDate = new Date(user.createdAt).toLocaleDateString();

  function handleTap() {
    if (onTap) {
      onTap(user);
    } else {
      navigate({ page: 'Detail', props: { userId: user.id } });
    }
  }
</script>

<stackLayout class="user-card" on:tap={handleTap}>
  <label text={user.name} class="name" />
  <label text={user.email} class="email" />
  <label text={formattedDate} class="date" />
</stackLayout>

<style>
  .user-card {
    padding: 16;
    background-color: white;
    border-radius: 8;
  }

  .name {
    font-size: 18;
    font-weight: bold;
    color: #333;
  }

  .email {
    font-size: 14;
    color: #666;
    margin-top: 4;
  }

  .date {
    font-size: 12;
    color: #999;
    margin-top: 4;
  }
</style>
```

### Page Navigation
- Use NativeScript's navigation API
- Pass parameters between pages
- Handle back navigation properly

```svelte
<!-- pages/Home.svelte -->
<script lang="ts">
  import { navigate, goBack } from 'svelte-native';
  import UserCard from '../components/UserCard.svelte';
  import { userStore } from '../stores/userStore';
  import type { User } from '../models/User';

  $: users = $userStore.users;

  function navigateToDetail(user: User) {
    navigate({
      page: 'Detail',
      props: { userId: user.id }
    });
  }

  function navigateToSettings() {
    navigate({ page: 'Settings' });
  }
</script>

<page>
  <actionBar title="Home">
    <actionItem
      ios.position="right"
      on:tap={navigateToSettings}
    >
      <label text="⚙️" />
    </actionItem>
  </actionBar>

  <stackLayout>
    {#each users as user (user.id)}
      <UserCard {user} onTap={navigateToDetail} />
    {/each}
  </stackLayout>
</page>
```

### State Management
- Use Svelte stores for global state
- Implement custom stores for complex logic
- Persist data using Application Settings

```typescript
// stores/userStore.ts
import { writable, derived } from 'svelte/store';
import { ApplicationSettings } from '@nativescript/core';
import type { User } from '../models/User';

interface UserState {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
}

const initialState: UserState = {
  users: [],
  currentUser: null,
  isLoading: false,
};

function createUserStore() {
  const { subscribe, set, update } = writable<UserState>(initialState);

  return {
    subscribe,

    loadUsers: async () => {
      update(s => ({ ...s, isLoading: true }));

      try {
        const response = await fetch('https://api.example.com/users');
        const users: User[] = await response.json();

        update(s => ({
          ...s,
          users,
          isLoading: false
        }));
      } catch (error) {
        update(s => ({ ...s, isLoading: false }));
        throw error;
      }
    },

    setCurrentUser: (user: User | null) => {
      update(s => ({ ...s, currentUser: user }));

      // Persist to device storage
      if (user) {
        ApplicationSettings.setString('currentUser', JSON.stringify(user));
      } else {
        ApplicationSettings.remove('currentUser');
      }
    },

    restoreSession: () => {
      const savedUser = ApplicationSettings.getString('currentUser');
      if (savedUser) {
        const currentUser = JSON.parse(savedUser);
        update(s => ({ ...s, currentUser }));
      }
    },

    reset: () => set(initialState),
  };
}

export const userStore = createUserStore();

// Derived store for filtered users
export const activeUsers = derived(
  userStore,
  $store => $store.users.filter(u => u.isActive)
);
```

### API Services
- Centralize API calls
- Handle errors consistently
- Implement request/response interceptors

```typescript
// services/api.ts
import { ApplicationSettings } from '@nativescript/core';

const API_BASE_URL = 'https://api.example.com';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

class ApiService {
  private getToken(): string | null {
    return ApplicationSettings.getString('authToken');
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    headers['Content-Type'] = 'application/json';

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body: data });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body: data });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiService();
```

---

## Key Constraints

### Performance
- ✅ Use `lazy` for lazy loading pages
- ✅ Implement proper list virtualization
- ✅ Optimize images and assets
- ✅ Use NativeScript's threading for heavy operations
- ❌ Don't block the UI thread
- ❌ Don't use synchronous network calls

### Native UI
- ✅ Use NativeScript UI components
- ✅ Follow platform design guidelines
- ✅ Use native animations
- ❌ Don't use web-specific CSS properties
- ❌ Don't use HTML elements

### State Management
- ✅ Use Svelte stores for global state
- ✅ Implement proper cleanup
- ✅ Persist critical data
- ❌ Don't overuse global state
- ❌ Don't skip cleanup in `onDestroy`

---

## Common Commands

### Development
```bash
ns run android         # Run on Android
ns run ios             # Run on iOS
ns debug android       # Debug Android
ns debug ios           # Debug iOS
```

### Building
```bash
ns build android       # Build Android APK
ns build ios           # Build iOS IPA
ns build android --release  # Release build
```

### Testing
```bash
npm test               # Run unit tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
```

### Code Quality
```bash
npm run lint           # Run ESLint
npm run format         # Format with Prettier
ns migrate             # Migrate to latest version
```

---

## Important Prohibitions

### ❌ Never Do
- Don't use web-specific CSS properties
- Don't use HTML elements (div, span, etc.)
- Don't block the UI thread with heavy operations
- Don't skip cleanup in lifecycle hooks
- Don't hardcode API URLs
- Don't commit sensitive data
- Don't use synchronous network calls
- Don't ignore platform-specific styling

### ⚠️ Use with Caution
- Global stores - ensure proper cleanup
- Platform-specific code - test on both platforms
- Native plugins - verify compatibility
- Background threads - ensure proper synchronization

---

## Best Practices

### Lifecycle Hooks
- Use `onMount` for initialization
- Use `onDestroy` for cleanup
- Handle async operations properly

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { userStore } from '../stores/userStore';

  let interval: number;

  onMount(async () => {
    await userStore.loadUsers();
    interval = setInterval(() => userStore.loadUsers(), 30000);
  });

  onDestroy(() => {
    if (interval) {
      clearInterval(interval);
    }
  });
</script>
```

### Styling
- Use NativeScript CSS properties
- Follow platform conventions
- Use responsive layouts

```svelte
<style>
  /* ✅ Good - NativeScript CSS */
  .container {
    padding: 16;
    background-color: #f5f5f5;
  }

  .title {
    font-size: 24;
    font-weight: bold;
    color: #333;
  }

  /* ❌ Bad - Web CSS */
  .container {
    display: flex;  /* Not supported */
    padding: 1rem;  /* Use 16 instead */
  }
</style>
```

### Platform-Specific Code
- Use `ios` and `android` properties
- Test on both platforms
- Handle platform differences gracefully

```svelte
<script lang="ts">
  import { Device } from '@nativescript/core';

  const isIOS = Device.os === 'iOS';
  const isAndroid = Device.os === 'Android';
</script>

<stackLayout class={isIOS ? 'ios-container' : 'android-container'}>
  <label
    text="Hello"
    ios:text="Hello iOS"
    android:text="Hello Android"
  />
</stackLayout>
```

---

## Compact Instructions

When using `/compact`, preserve:
- Component schema changes
- Store modifications
- Navigation changes
- API service updates
- Test commands and results

Discard:
- Verbose log output
- Exploratory search dead ends
- Redundant confirmation messages

---

## Quick Reference

### File Locations
- Components: `app/components/*.svelte`
- Pages: `app/pages/*.svelte`
- Stores: `app/stores/*.ts`
- Services: `app/services/*.ts`
- Models: `app/models/*.ts`

### Environment Variables
```env
API_URL=https://api.example.com
API_KEY=your-api-key
```

### NativeScript CSS Properties
```css
/* Layout */
width, height, margin, padding
horizontal-align, vertical-align

/* Text */
font-size, font-weight, color
text-align, text-transform

/* Visual */
background-color, border-radius, opacity

/* NativeScript-specific */
rows, columns  /* GridLayout */
orientation    /* StackLayout */
```

---

**Last Updated**: 2026-03-17
