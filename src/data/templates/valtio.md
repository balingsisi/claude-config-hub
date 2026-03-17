# Valtio - Proxy State Management

## Overview

Valtio is a minimalistic state management library for React that makes proxy-state simple. It leverages JavaScript proxies to provide a mutable state API that automatically triggers re-renders when state changes.

## Key Features

- **Mutable API**: Mutate state directly like normal JavaScript objects
- **Automatic Re-renders**: Only re-renders components that use changed state
- **TypeScript Support**: Full type inference out of the box
- **No Boilerplate**: Minimal setup required
- **DevTools**: Built-in devtools for debugging
- **Snapshot-based**: Immutable snapshots for time-travel debugging

## Project Structure

```
valtio-project/
├── src/
│   ├── stores/
│   │   ├── userStore.ts        # User state
│   │   ├── cartStore.ts        # Shopping cart state
│   │   ├── uiStore.ts          # UI state
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useUser.ts
│   │   └── useCart.ts
│   ├── components/
│   │   ├── UserProfile.tsx
│   │   ├── ShoppingCart.tsx
│   │   └── ProductList.tsx
│   └── App.tsx
├── package.json
└── tsconfig.json
```

## Installation

```bash
npm install valtio
```

## Basic Usage

### Creating a Store

```typescript
// src/stores/userStore.ts
import { proxy } from 'valtio'

interface User {
  id: string
  name: string
  email: string
}

interface UserState {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateProfile: (updates: Partial<User>) => void
}

export const userStore = proxy<UserState>({
  user: null,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    // Simulate API call
    const response = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    const user = await response.json()
    
    userStore.user = user
    userStore.isAuthenticated = true
  },

  logout: () => {
    userStore.user = null
    userStore.isAuthenticated = false
  },

  updateProfile: (updates: Partial<User>) => {
    if (userStore.user) {
      Object.assign(userStore.user, updates)
    }
  },
})
```

### Using in Components

```typescript
// src/components/UserProfile.tsx
import { useSnapshot } from 'valtio'
import { userStore } from '../stores/userStore'

export function UserProfile() {
  const snap = useSnapshot(userStore)

  if (!snap.isAuthenticated || !snap.user) {
    return <div>Please log in</div>
  }

  return (
    <div>
      <h2>{snap.user.name}</h2>
      <p>{snap.user.email}</p>
      <button onClick={() => userStore.logout()}>Logout</button>
    </div>
  )
}
```

## Advanced Patterns

### Nested State

```typescript
// src/stores/cartStore.ts
import { proxy } from 'valtio'

interface Product {
  id: string
  name: string
  price: number
}

interface CartItem {
  product: Product
  quantity: number
}

interface CartState {
  items: CartItem[]
  total: number
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
}

export const cartStore = proxy<CartState>({
  items: [],
  total: 0,

  addItem: (product: Product, quantity = 1) => {
    const existingItem = cartStore.items.find(
      item => item.product.id === product.id
    )

    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      cartStore.items.push({ product, quantity })
    }

    cartStore.calculateTotal()
  },

  removeItem: (productId: string) => {
    const index = cartStore.items.findIndex(
      item => item.product.id === productId
    )
    if (index !== -1) {
      cartStore.items.splice(index, 1)
      cartStore.calculateTotal()
    }
  },

  updateQuantity: (productId: string, quantity: number) => {
    const item = cartStore.items.find(
      item => item.product.id === productId
    )
    if (item) {
      item.quantity = quantity
      cartStore.calculateTotal()
    }
  },

  clearCart: () => {
    cartStore.items = []
    cartStore.total = 0
  },
})

// Extend proxy with methods
declare module 'valtio' {
  interface CartState {
    calculateTotal: () => void
  }
}

// Add method to store
;(cartStore as any).calculateTotal = () => {
  cartStore.total = cartStore.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )
}
```

### Computed Values

```typescript
// src/stores/cartStore.ts (updated)
import { proxy, derive } from 'valtio/utils'

interface CartState {
  items: CartItem[]
  // ... other properties
}

const cartStore = proxy<CartState>({
  items: [],
  // ... other methods
})

// Derived state
export const derivedCart = derive({
  total: (get) => {
    const { items } = get(cartStore)
    return items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    )
  },
  itemCount: (get) => {
    const { items } = get(cartStore)
    return items.reduce((count, item) => count + item.quantity, 0)
  },
  isEmpty: (get) => {
    const { items } = get(cartStore)
    return items.length === 0
  },
})

// Usage
function CartSummary() {
  const { total, itemCount } = useSnapshot(derivedCart)
  
  return (
    <div>
      <p>Items: {itemCount}</p>
      <p>Total: ${total.toFixed(2)}</p>
    </div>
  )
}
```

### Async Actions

```typescript
// src/stores/productStore.ts
import { proxy } from 'valtio'

interface Product {
  id: string
  name: string
  price: number
  category: string
}

interface ProductState {
  products: Product[]
  loading: boolean
  error: string | null
  fetchProducts: () => Promise<void>
  fetchProductById: (id: string) => Promise<Product | null>
}

export const productStore = proxy<ProductState>({
  products: [],
  loading: false,
  error: null,

  fetchProducts: async () => {
    productStore.loading = true
    productStore.error = null

    try {
      const response = await fetch('/api/products')
      const products = await response.json()
      productStore.products = products
    } catch (error) {
      productStore.error = 'Failed to fetch products'
    } finally {
      productStore.loading = false
    }
  },

  fetchProductById: async (id: string) => {
    productStore.loading = true
    productStore.error = null

    try {
      const response = await fetch(`/api/products/${id}`)
      const product = await response.json()
      return product
    } catch (error) {
      productStore.error = 'Failed to fetch product'
      return null
    } finally {
      productStore.loading = false
    }
  },
})
```

### Subscribing to Changes

```typescript
// src/stores/userStore.ts
import { subscribe } from 'valtio'

// Subscribe to all changes
const unsubscribe = subscribe(userStore, (ops) => {
  console.log('State changed:', ops)
  // ops is an array of operations [op, path, value, prevValue]
})

// Subscribe to specific path
const unsubscribe2 = subscribe(userStore.user, (ops) => {
  console.log('User changed:', ops)
})

// Cleanup
unsubscribe()
unsubscribe2()
```

### Watch Specific Changes

```typescript
import { watch } from 'valtio/utils'

// Watch for specific changes
watch((get) => {
  const user = get(userStore).user
  if (user) {
    console.log('User logged in:', user.email)
    // Perform side effects
    localStorage.setItem('userId', user.id)
  }
})
```

## Integration Patterns

### Custom Hooks

```typescript
// src/hooks/useCart.ts
import { useSnapshot } from 'valtio'
import { cartStore, derivedCart } from '../stores/cartStore'

export function useCart() {
  const snap = useSnapshot(cartStore)
  const derived = useSnapshot(derivedCart)

  return {
    items: snap.items,
    total: derived.total,
    itemCount: derived.itemCount,
    isEmpty: derived.isEmpty,
    addItem: cartStore.addItem,
    removeItem: cartStore.removeItem,
    updateQuantity: cartStore.updateQuantity,
    clearCart: cartStore.clearCart,
  }
}

// Usage
function ShoppingCart() {
  const { items, total, addItem, removeItem } = useCart()

  return (
    <div>
      {items.map(item => (
        <div key={item.product.id}>
          {item.product.name} x {item.quantity}
          <button onClick={() => removeItem(item.product.id)}>
            Remove
          </button>
        </div>
      ))}
      <p>Total: ${total.toFixed(2)}</p>
    </div>
  )
}
```

### Local Storage Persistence

```typescript
// src/stores/persistStore.ts
import { proxy, subscribe } from 'valtio'
import { devtools, persist } from 'valtio/utils'

interface Settings {
  theme: 'light' | 'dark'
  language: string
  notifications: boolean
}

const settingsStore = proxy<Settings>({
  theme: 'light',
  language: 'en',
  notifications: true,
})

// Persist to localStorage
persist(settingsStore, 'app-settings', (key, value) => {
  localStorage.setItem(key, JSON.stringify(value))
}, (key) => {
  const value = localStorage.getItem(key)
  return value ? JSON.parse(value) : null
})

export { settingsStore }
```

### DevTools Integration

```typescript
// src/stores/userStore.ts
import { devtools } from 'valtio/utils'

const userStore = proxy<UserState>({
  // ... state
})

// Add devtools
devtools(userStore, { name: 'userStore', enabled: true })

export { userStore }
```

## Best Practices

### 1. Separate Store by Domain

```typescript
// src/stores/index.ts
export { userStore } from './userStore'
export { cartStore } from './cartStore'
export { uiStore } from './uiStore'
```

### 2. Use TypeScript Interfaces

```typescript
interface State {
  // Define all state properties
  data: DataType[]
  loading: boolean
  error: string | null
}

const store = proxy<State>({
  data: [],
  loading: false,
  error: null,
})
```

### 3. Keep Stores Flat

```typescript
// Good
const store = proxy({
  users: [],
  products: [],
  orders: [],
})

// Avoid deep nesting
const store = proxy({
  data: {
    users: {
      items: [],
    },
  },
})
```

### 4. Use Actions for Complex Logic

```typescript
const store = proxy({
  items: [],

  // Action method
  batchUpdate: (updates: Array<{ id: string; changes: any }>) => {
    updates.forEach(({ id, changes }) => {
      const item = store.items.find(i => i.id === id)
      if (item) {
        Object.assign(item, changes)
      }
    })
  },
})
```

## Comparison with Other Libraries

### vs. Redux
- **Valtio**: Mutable API, less boilerplate
- **Redux**: Immutable, more structured, larger ecosystem

### vs. Zustand
- **Valtio**: Uses proxies, mutable API
- **Zustand**: Immutable, hooks-based

### vs. Jotai
- **Valtio**: Object-based stores
- **Jotai**: Atomic state management

## Testing

```typescript
import { userStore } from '../stores/userStore'

describe('UserStore', () => {
  beforeEach(() => {
    // Reset store
    userStore.user = null
    userStore.isAuthenticated = false
  })

  it('should login user', async () => {
    await userStore.login('test@example.com', 'password')
    
    expect(userStore.user).toBeDefined()
    expect(userStore.isAuthenticated).toBe(true)
  })

  it('should logout user', () => {
    userStore.user = { id: '1', name: 'Test', email: 'test@example.com' }
    userStore.isAuthenticated = true
    
    userStore.logout()
    
    expect(userStore.user).toBeNull()
    expect(userStore.isAuthenticated).toBe(false)
  })
})
```

## Performance Optimization

### 1. Use Selective Snapshots

```typescript
// Only re-render when user.name changes
function UserName() {
  const snap = useSnapshot(userStore)
  return <div>{snap.user?.name}</div>
}

// Re-renders on any user change
function UserInfo() {
  const snap = useSnapshot(userStore)
  return <pre>{JSON.stringify(snap.user)}</pre>
}
```

### 2. Split Large Stores

```typescript
// Instead of one large store
const largeStore = proxy({
  users: [],
  products: [],
  orders: [],
  // ... many more
})

// Split into domain-specific stores
const userStore = proxy({ users: [] })
const productStore = proxy({ products: [] })
const orderStore = proxy({ orders: [] })
```

## Resources

- [Official Documentation](https://valtio.pmnd.rs/)
- [GitHub Repository](https://github.com/pmndrs/valtio)
- [Examples](https://github.com/pmndrs/valtio/tree/main/examples)
- [Comparison with Other Libraries](https://github.com/pmndrs/valtio/wiki/Comparison)

## Summary

Valtio provides a simple, mutable state management solution for React applications. Its proxy-based approach allows developers to mutate state directly while maintaining reactivity, making it an excellent choice for projects that prefer a more intuitive API over the complexity of immutable state management patterns.
