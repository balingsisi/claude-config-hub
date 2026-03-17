# React Native MMKV - 超快键值存储

## 技术栈

- **核心**: react-native-mmkv 3.x
- **运行时**: React Native 0.76+
- **存储引擎**: MMKV (腾讯开源)
- **类型支持**: TypeScript
- **平台**: iOS, Android, Web

## 项目结构

```
src/
├── storage/
│   ├── index.ts            # 存储初始化
│   ├── mmkv.ts             # MMKV 实例
│   ├── keys.ts             # 存储键定义
│   └── types.ts            # 类型定义
├── hooks/
│   ├── useMMKV.ts          # MMKV 钩子
│   ├── useStorage.ts       # 存储钩子
│   └── useSecureStorage.ts # 安全存储钩子
├── services/
│   ├── cache.ts            # 缓存服务
│   ├── session.ts          # 会话服务
│   └── settings.ts         # 设置服务
└── utils/
    └── migration.ts        # 迁移工具
```

## 代码模式

### 1. 基础配置

```typescript
// src/storage/mmkv.ts
import { MMKV } from 'react-native-mmkv'

export const storage = new MMKV({
  id: 'my-app-storage',
  encryptionKey: process.env.MMKV_ENCRYPTION_KEY,
})

// 创建多个实例
export const cacheStorage = new MMKV({
  id: 'cache-storage',
})

export const userStorage = new MMKV({
  id: 'user-storage',
  encryptionKey: process.env.USER_STORAGE_KEY,
})
```

```typescript
// src/storage/keys.ts
export const StorageKeys = {
  // 用户相关
  USER_TOKEN: 'user_token',
  USER_ID: 'user_id',
  USER_PROFILE: 'user_profile',
  
  // 设置相关
  THEME: 'theme',
  LANGUAGE: 'language',
  NOTIFICATIONS_ENABLED: 'notifications_enabled',
  
  // 缓存相关
  LAST_SYNC_TIME: 'last_sync_time',
  OFFLINE_DATA: 'offline_data',
  
  // 会话相关
  ONBOARDING_COMPLETED: 'onboarding_completed',
  LAST_ROUTE: 'last_route',
} as const

export type StorageKey = typeof StorageKeys[keyof typeof StorageKeys]
```

### 2. 存储服务

```typescript
// src/services/settings.ts
import { storage, StorageKeys } from '../storage'

interface UserSettings {
  theme: 'light' | 'dark' | 'system'
  language: string
  notificationsEnabled: boolean
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  language: 'en',
  notificationsEnabled: true,
}

export const settingsService = {
  getSettings(): UserSettings {
    const settings = storage.getString(StorageKeys.USER_PROFILE)
    if (settings) {
      try {
        return JSON.parse(settings)
      } catch (error) {
        console.error('Failed to parse settings:', error)
        return DEFAULT_SETTINGS
      }
    }
    return DEFAULT_SETTINGS
  },

  updateSettings(updates: Partial<UserSettings>): void {
    const current = this.getSettings()
    const updated = { ...current, ...updates }
    storage.set(StorageKeys.USER_PROFILE, JSON.stringify(updated))
  },

  setTheme(theme: UserSettings['theme']): void {
    this.updateSettings({ theme })
  },

  setLanguage(language: string): void {
    this.updateSettings({ language })
  },

  toggleNotifications(enabled: boolean): void {
    this.updateSettings({ notificationsEnabled: enabled })
  },
}
```

```typescript
// src/services/session.ts
import { storage, StorageKeys } from '../storage'

interface SessionData {
  token: string
  userId: string
  expiresAt: number
}

export const sessionService = {
  setSession(data: SessionData): void {
    storage.set(StorageKeys.USER_TOKEN, data.token)
    storage.set(StorageKeys.USER_ID, data.userId)
    storage.set('session_expires_at', data.expiresAt)
  },

  getSession(): SessionData | null {
    const token = storage.getString(StorageKeys.USER_TOKEN)
    const userId = storage.getString(StorageKeys.USER_ID)
    const expiresAt = storage.getNumber('session_expires_at')

    if (!token || !userId) return null

    // 检查是否过期
    if (expiresAt && Date.now() > expiresAt) {
      this.clearSession()
      return null
    }

    return { token, userId, expiresAt: expiresAt || 0 }
  },

  clearSession(): void {
    storage.delete(StorageKeys.USER_TOKEN)
    storage.delete(StorageKeys.USER_ID)
    storage.delete('session_expires_at')
  },

  isValid(): boolean {
    return this.getSession() !== null
  },
}
```

```typescript
// src/services/cache.ts
import { cacheStorage } from '../storage'

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

export const cacheService = {
  set<T>(key: string, data: T, ttl: number = 3600000): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    }
    cacheStorage.set(key, JSON.stringify(item))
  },

  get<T>(key: string): T | null {
    const itemStr = cacheStorage.getString(key)
    if (!itemStr) return null

    try {
      const item: CacheItem<T> = JSON.parse(itemStr)
      const isExpired = Date.now() - item.timestamp > item.ttl

      if (isExpired) {
        cacheStorage.delete(key)
        return null
      }

      return item.data
    } catch (error) {
      console.error('Failed to parse cache item:', error)
      return null
    }
  },

  delete(key: string): void {
    cacheStorage.delete(key)
  },

  clear(): void {
    cacheStorage.clearAll()
  },

  has(key: string): boolean {
    return cacheStorage.contains(key)
  },
}
```

### 3. 自定义钩子

```typescript
// src/hooks/useMMKV.ts
import { useMMKVString, useMMKVNumber, useMMKVBoolean } from 'react-native-mmkv'
import { storage } from '../storage'

export function useMMKV<T>(key: string, defaultValue: T) {
  const [stringValue, setStringValue] = useMMKVString(key, storage)
  const [numberValue, setNumberValue] = useMMKVNumber(key, storage)
  const [booleanValue, setBooleanValue] = useMMKVBoolean(key, storage)

  const getValue = (): T => {
    if (typeof defaultValue === 'string') {
      return (stringValue as T) ?? defaultValue
    }
    if (typeof defaultValue === 'number') {
      return (numberValue as T) ?? defaultValue
    }
    if (typeof defaultValue === 'boolean') {
      return (booleanValue as T) ?? defaultValue
    }
    return defaultValue
  }

  const setValue = (value: T) => {
    if (typeof value === 'string') {
      setStringValue(value)
    } else if (typeof value === 'number') {
      setNumberValue(value)
    } else if (typeof value === 'boolean') {
      setBooleanValue(value)
    }
  }

  return [getValue(), setValue] as const
}
```

```typescript
// src/hooks/useStorage.ts
import { useState, useEffect } from 'react'
import { storage } from '../storage'

export function useStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    const item = storage.getString(key)
    if (item) {
      try {
        return JSON.parse(item) as T
      } catch {
        return defaultValue
      }
    }
    return defaultValue
  })

  const setValue = (value: T | ((prev: T) => T)) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value
    setStoredValue(valueToStore)
    storage.set(key, JSON.stringify(valueToStore))
  }

  // 监听其他实例的更改
  useEffect(() => {
    const listener = storage.addOnValueChangedListener((changedKey) => {
      if (changedKey === key) {
        const newValue = storage.getString(key)
        if (newValue) {
          try {
            setStoredValue(JSON.parse(newValue))
          } catch {
            // 忽略解析错误
          }
        }
      }
    })

    return () => listener.remove()
  }, [key])

  return [storedValue, setValue]
}
```

```typescript
// src/hooks/useSecureStorage.ts
import { useState, useCallback } from 'react'
import { userStorage } from '../storage'

export function useSecureStorage<T>(key: string) {
  const [value, setValue] = useState<T | null>(() => {
    const item = userStorage.getString(key)
    if (item) {
      try {
        return JSON.parse(item) as T
      } catch {
        return null
      }
    }
    return null
  })

  const set = useCallback(
    (newValue: T) => {
      setValue(newValue)
      userStorage.set(key, JSON.stringify(newValue))
    },
    [key]
  )

  const remove = useCallback(() => {
    setValue(null)
    userStorage.delete(key)
  }, [key])

  return { value, set, remove }
}
```

### 4. 迁移工具

```typescript
// src/utils/migration.ts
import { AsyncStorage } from 'react-native'
import { storage } from '../storage'

export async function migrateFromAsyncStorage(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys()
    const migratedKeys: string[] = []

    for (const key of keys) {
      const value = await AsyncStorage.getItem(key)
      if (value !== null) {
        // 尝试解析 JSON
        try {
          const parsed = JSON.parse(value)
          storage.set(key, JSON.stringify(parsed))
        } catch {
          // 不是 JSON，直接存储字符串
          storage.set(key, value)
        }
        migratedKeys.push(key)
      }
    }

    console.log(`Migrated ${migratedKeys.length} keys from AsyncStorage`)
    
    // 迁移成功后清除 AsyncStorage
    await AsyncStorage.multiRemove(keys)
    console.log('Cleared AsyncStorage')
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}
```

### 5. 使用示例

```typescript
// 示例：用户认证
import { useStorage } from './hooks/useStorage'
import { StorageKeys } from './storage/keys'

function useAuth() {
  const [token, setToken] = useStorage<string | null>(StorageKeys.USER_TOKEN, null)
  const [userId, setUserId] = useStorage<string | null>(StorageKeys.USER_ID, null)

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password)
    setToken(response.token)
    setUserId(response.userId)
  }

  const logout = () => {
    setToken(null)
    setUserId(null)
  }

  const isAuthenticated = token !== null

  return { token, userId, login, logout, isAuthenticated }
}
```

```typescript
// 示例：主题切换
import { useMMKV } from './hooks/useMMKV'
import { StorageKeys } from './storage/keys'

function useTheme() {
  const [theme, setTheme] = useMMKV<'light' | 'dark' | 'system'>(
    StorageKeys.THEME,
    'system'
  )

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return { theme, setTheme, toggleTheme }
}
```

```typescript
// 示例：离线数据
import { cacheService } from './services/cache'

interface Post {
  id: string
  title: string
  content: string
}

function useOfflinePosts() {
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    // 从缓存加载
    const cached = cacheService.get<Post[]>('posts')
    if (cached) {
      setPosts(cached)
    }

    // 从服务器获取最新数据
    fetchPosts().then((data) => {
      setPosts(data)
      cacheService.set('posts', data, 3600000) // 1小时 TTL
    })
  }, [])

  return posts
}
```

```typescript
// 示例：应用设置
import { settingsService } from './services/settings'

function SettingsScreen() {
  const [settings, setSettings] = useState(settingsService.getSettings())

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    settingsService.setTheme(theme)
    setSettings(settingsService.getSettings())
  }

  const handleLanguageChange = (language: string) => {
    settingsService.setLanguage(language)
    setSettings(settingsService.getSettings())
  }

  return (
    <View>
      <Text>Theme: {settings.theme}</Text>
      <Button title="Toggle Theme" onPress={() => handleThemeChange('dark')} />
      <Text>Language: {settings.language}</Text>
      <Button title="Change Language" onPress={() => handleLanguageChange('zh')} />
    </View>
  )
}
```

## 最佳实践

### 1. 数据加密

```typescript
// 使用加密存储
import { MMKV } from 'react-native-mmkv'

const secureStorage = new MMKV({
  id: 'secure-storage',
  encryptionKey: 'my-encryption-key', // 从安全来源获取
})

// 存储敏感数据
secureStorage.set('user_token', 'secret-token')
```

### 2. 数据类型

```typescript
// 使用类型化的存储键
import { storage } from './storage'

type StorageValue = string | number | boolean | object

function setTypedValue<T extends StorageValue>(key: string, value: T): void {
  if (typeof value === 'string') {
    storage.set(key, value)
  } else if (typeof value === 'number') {
    storage.set(key, value)
  } else if (typeof value === 'boolean') {
    storage.set(key, value)
  } else {
    storage.set(key, JSON.stringify(value))
  }
}

function getTypedValue<T>(key: string): T | null {
  const string = storage.getString(key)
  if (!string) return null

  try {
    return JSON.parse(string) as T
  } catch {
    return string as unknown as T
  }
}
```

### 3. 监听变化

```typescript
// 监听存储变化
useEffect(() => {
  const listener = storage.addOnValueChangedListener((key) => {
    if (key === 'user_token') {
      const newToken = storage.getString(key)
      console.log('Token changed:', newToken)
    }
  })

  return () => listener.remove()
}, [])
```

### 4. 批量操作

```typescript
// 批量设置
function setMultipleValues(data: Record<string, any>) {
  Object.entries(data).forEach(([key, value]) => {
    storage.set(key, JSON.stringify(value))
  })
}

// 批量删除
function deleteMultipleKeys(keys: string[]) {
  keys.forEach((key) => storage.delete(key))
}
```

### 5. 错误处理

```typescript
function safeGet<T>(key: string, defaultValue: T): T {
  try {
    const value = storage.getString(key)
    if (!value) return defaultValue
    return JSON.parse(value) as T
  } catch (error) {
    console.error(`Failed to get value for key ${key}:`, error)
    return defaultValue
  }
}
```

## 常用命令

```bash
# 安装
npm install react-native-mmkv

# iOS
cd ios && pod install

# 运行
npx react-native run-ios
npx react-native run-android

# 清除存储
# iOS: 删除应用重装
# Android: 应用设置 -> 清除数据
```

## 部署配置

### 1. Android配置

```gradle
// android/app/build.gradle
android {
  ...
  packagingOptions {
    pickFirst '**/libc++_shared.so'
  }
}
```

### 2. iOS配置

```ruby
# ios/Podfile
target 'YourApp' do
  use_react_native!
  pod 'MMKV', '~> 1.3.0'
end
```

### 3. 性能对比

```
| 操作 | AsyncStorage | MMKV | 提升 |
|------|-------------|------|------|
| 读取 | 8ms | 0.1ms | 80x |
| 写入 | 10ms | 0.2ms | 50x |
| 删除 | 12ms | 0.1ms | 120x |
```

## 关键特性

- ⚡ **极速**: 比 AsyncStorage 快 30 倍
- 🔐 **加密**: 内置 AES 加密
- 📦 **轻量**: 约 50KB
- 🔄 **同步**: 无需 async/await
- 🎯 **类型安全**: 完整 TypeScript 支持
- 🌐 **跨平台**: iOS, Android, Web
- 📱 **多实例**: 支持多个存储实例
- 🔔 **监听**: 值变化监听器
