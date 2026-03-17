# Redux Toolkit - React状态管理官方方案

## 技术栈

- **核心**: Redux Toolkit (RTK) 2.x
- **React绑定**: react-redux 9.x
- **异步处理**: createAsyncThunk / RTK Query
- **开发工具**: Redux DevTools
- **类型支持**: TypeScript
- **持久化**: redux-persist (可选)

## 项目结构

```
src/
├── store/
│   ├── index.ts           # Store配置
│   ├── rootReducer.ts     # 根reducer
│   ├── middleware.ts      # 自定义中间件
│   └── hooks.ts           # 类型化的hooks
├── features/
│   ├── auth/
│   │   ├── authSlice.ts   # Auth状态切片
│   │   ├── authSelectors.ts
│   │   └── authAPI.ts     # API调用
│   ├── users/
│   │   ├── usersSlice.ts
│   │   └── usersSelectors.ts
│   └── ui/
│       └── uiSlice.ts     # UI状态
├── app/
│   ├── rootReducer.ts     # 合并所有reducers
│   └── store.ts           # Store设置
└── types/
    └── store.ts           # 类型定义
```

## 代码模式

### 1. Store配置

```typescript
// app/store.ts
import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { api } from './services/api'
import authReducer from '../features/auth/authSlice'
import uiReducer from '../features/ui/uiSlice'

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
    ui: uiReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(api.middleware)
      .concat(loggerMiddleware),
  devTools: process.env.NODE_ENV !== 'production'
})

setupListeners(store.dispatch)

// 推断类型
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

### 2. 类型化Hooks

```typescript
// app/hooks.ts
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from './store'

// 避免手动类型标注
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
```

### 3. Slice模式

```typescript
// features/auth/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { User } from '../../types/store'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null
}

// 异步thunk
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data)
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  }
})

export const { logout, updateUser, clearError } = authSlice.actions
export default authSlice.reducer
```

### 4. RTK Query (数据获取)

```typescript
// services/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    }
  }),
  tagTypes: ['User', 'Post'],
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => '/users',
      transformResponse: (response: { data: User[] }) => response.data,
      providesTags: ['User']
    }),
    getUser: builder.query<User, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_, __, id) => [{ type: 'User', id }]
    }),
    createUser: builder.mutation<User, Partial<User>>({
      query: (user) => ({
        url: '/users',
        method: 'POST',
        body: user
      }),
      invalidatesTags: ['User']
    }),
    updateUser: builder.mutation<User, { id: string; user: Partial<User> }>({
      query: ({ id, user }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body: user
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'User', id }]
    })
  })
})

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation
} = api
```

### 5. Selectors (选择器)

```typescript
// features/auth/authSelectors.ts
import { createSelector } from '@reduxjs/toolkit'
import { RootState } from '../../app/store'

// 基础选择器
export const selectAuth = (state: RootState) => state.auth
export const selectUser = (state: RootState) => state.auth.user
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated

// 派生选择器
export const selectUserName = createSelector(
  [selectUser],
  (user) => user?.name ?? 'Guest'
)

export const selectUserPermissions = createSelector(
  [selectUser],
  (user) => user?.permissions ?? []
)

// 参数化选择器
export const selectUserById = (id: string) =>
  createSelector(
    [(state: RootState) => state.users.entities],
    (entities) => entities[id]
  )
```

## 最佳实践

### 1. 状态设计

- ✅ 扁平化状态结构，避免嵌套
- ✅ 规范化数据（使用createEntityAdapter）
- ✅ 分离UI状态和业务状态
- ✅ 避免冗余数据
- ✅ 保持状态最小化

```typescript
// 使用 createEntityAdapter
import { createEntityAdapter } from '@reduxjs/toolkit'

interface User {
  id: string
  name: string
  email: string
}

const usersAdapter = createEntityAdapter<User>({
  selectId: (user) => user.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name)
})

const usersSlice = createSlice({
  name: 'users',
  initialState: usersAdapter.getInitialState({
    loading: false,
    error: null
  }),
  reducers: {
    userAdded: usersAdapter.addOne,
    userUpdated: usersAdapter.updateOne,
    userRemoved: usersAdapter.removeOne
  }
})
```

### 2. 性能优化

- ✅ 使用createSelector进行记忆化
- ✅ 细粒度选择器，避免不必要的渲染
- ✅ 使用React.memo包装组件
- ✅ 懒加载reducer
- ✅ 限制订阅的state范围

```typescript
// 懒加载reducer
import { combineReducers, Reducer } from '@reduxjs/toolkit'

const asyncReducers: Record<string, Reducer> = {}

export const createReducer = (asyncReducers: Record<string, Reducer>) => {
  return combineReducers({
    auth: authReducer,
    ...asyncReducers
  })
}

// 动态注入reducer
store.asyncReducers['feature'] = featureReducer
store.replaceReducer(createReducer(store.asyncReducers))
```

### 3. 错误处理

```typescript
// 统一错误处理中间件
const errorMiddleware: Middleware = (store) => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    console.error('Action failed:', action.error)
    // 显示错误通知
    store.dispatch(showNotification({
      type: 'error',
      message: action.error.message
    }))
  }
  return next(action)
}
```

### 4. 测试策略

```typescript
// __tests__/authSlice.test.ts
import authReducer, { loginUser, logout } from '../authSlice'

describe('auth slice', () => {
  it('should handle logout', () => {
    const initialState = {
      user: { id: '1', name: 'Test' },
      isAuthenticated: true
    }
    const newState = authReducer(initialState, logout())
    expect(newState.user).toBeNull()
    expect(newState.isAuthenticated).toBe(false)
  })

  it('should handle login pending', () => {
    const action = { type: loginUser.pending.type }
    const newState = authReducer(undefined, action)
    expect(newState.loading).toBe(true)
  })
})
```

## 常用命令

```bash
# 安装
npm install @reduxjs/toolkit react-redux

# TypeScript类型
npm install @types/react-redux -D

# 开发工具
# Chrome扩展: Redux DevTools

# 测试
npm test
```

## 部署配置

### 1. Provider配置

```typescript
// index.tsx
import { Provider } from 'react-redux'
import { store } from './app/store'

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
)
```

### 2. 状态持久化

```typescript
// store.ts
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'] // 只持久化auth
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer
})

export const persistor = persistStore(store)
```

```typescript
// index.tsx
import { PersistGate } from 'redux-persist/integration/react'

<Provider store={store}>
  <PersistGate loading={null} persistor={persistor}>
    <App />
  </PersistGate>
</Provider>
```

### 3. SSR配置

```typescript
// server/store.ts
import { configureStore } from '@reduxjs/toolkit'

export function createStore(preloadedState = {}) {
  return configureStore({
    reducer: rootReducer,
    preloadedState
  })
}
```

```typescript
// client/store.ts
import { configureStore } from '@reduxjs/toolkit'

export const store = configureStore({
  reducer: rootReducer,
  preloadedState: window.__PRELOADED_STATE__
})
```

## 关键特性

- 🎯 **简化配置**: 开箱即用的最佳实践
- 📦 **包含常用工具**: createSlice、createAsyncThunk、RTK Query
- 🛠️ **类型安全**: 完整的TypeScript支持
- 🔧 **易于测试**: 可预测的状态更新
- 📊 **DevTools**: 强大的调试工具
- ⚡ **性能优化**: 记忆化选择器
