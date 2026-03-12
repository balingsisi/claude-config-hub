# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: React Native Mobile Application
**Type**: Cross-platform Mobile App
**Tech Stack**: React Native + TypeScript + Expo
**Goal**: Production-ready mobile application for iOS and Android with modern architecture

---

## Tech Stack

### Core
- **Framework**: React Native 0.73+
- **Platform**: Expo SDK 50+
- **Language**: TypeScript 5.3+
- **Navigation**: Expo Router (file-based) or React Navigation 6
- **State Management**: Zustand or Redux Toolkit

### UI & Styling
- **Styling**: NativeWind (Tailwind CSS for React Native) or StyleSheet
- **UI Components**: Custom components + Tamagui or React Native Paper
- **Icons**: @expo/vector-icons
- **Animations**: React Native Reanimated 3

### Data & Backend
- **API Client**: TanStack Query (React Query) + Axios
- **Forms**: React Hook Form + Zod validation
- **Storage**: AsyncStorage / MMKV
- **Database**: SQLite / WatermelonDB (offline-first)

### Development
- **Package Manager**: pnpm or npm
- **Testing**: Jest + React Native Testing Library
- **E2E**: Detox or Maestro
- **Linting**: ESLint + Prettier

---

## Code Standards

### TypeScript Rules
- Use strict mode - no `any` types
- Prefer explicit return types for functions
- Use `interface` for props, `type` for unions
- Enable strict null checks

```typescript
// ✅ Good
interface UserScreenProps {
  userId: string
  onUserUpdate: (user: User) => void
}

export function UserScreen({ userId, onUserUpdate }: UserScreenProps) {
  // ...
}

// ❌ Bad
export function UserScreen({ userId, onUserUpdate }: any) {
  // ...
}
```

### Naming Conventions
- **Components**: PascalCase (`UserProfile.tsx`)
- **Screens**: PascalCase with Screen suffix (`HomeScreen.tsx`)
- **Hooks**: camelCase with use prefix (`useAuth`)
- **Utils**: camelCase (`formatDate`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types/Interfaces**: PascalCase (`UserProfile`)

### File Organization
```
src/
├── app/              # Expo Router screens (file-based routing)
│   ├── (tabs)/      # Tab navigation
│   └── (auth)/      # Auth screens
├── components/       # Reusable components
│   ├── ui/          # Basic UI components
│   └── features/    # Feature-specific components
├── hooks/           # Custom React hooks
├── services/        # API services
├── stores/          # Zustand stores
├── utils/           # Utility functions
├── types/           # TypeScript types
├── constants/       # App constants
└── assets/          # Images, fonts, etc.
```

---

## Architecture Patterns

### Navigation Structure
- Use Expo Router for file-based routing (recommended)
- Or React Navigation for traditional stack/tab navigation
- Implement deep linking support
- Handle authentication flows properly

```typescript
// app/(tabs)/home.tsx - Expo Router
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text>Home Screen</Text>
    </View>
  )
}

// app/(auth)/login.tsx
export default function LoginScreen() {
  const router = useRouter()
  return (
    <View>
      <Button onPress={() => router.replace('/(tabs)')}>
        Login
      </Button>
    </View>
  )
}
```

### State Management
- Use Zustand for global state (simpler, less boilerplate)
- Use TanStack Query for server state
- Keep component state local when possible

```typescript
// stores/authStore.ts
import { create } from 'zustand'

interface AuthState {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: async (email, password) => {
    const response = await api.login(email, password)
    set({ user: response.user, token: response.token })
  },
  logout: () => set({ user: null, token: null }),
}))
```

### Data Fetching
- Use TanStack Query for all server state
- Implement proper caching and invalidation
- Handle loading and error states
- Support offline functionality

```typescript
// hooks/useUsers.ts
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => api.getUsers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// components/UserList.tsx
export function UserList() {
  const { data: users, isLoading, error } = useUsers()
  
  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  
  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <UserCard user={item} />}
    />
  )
}
```

### Styling Patterns
- Use NativeWind for Tailwind-like styling
- Or StyleSheet for traditional RN styling
- Keep styles close to components
- Use theme constants for consistency

```typescript
// With NativeWind
import { View, Text } from 'react-native'
import { styled } from 'nativewind'

const StyledView = styled(View)
const StyledText = styled(Text)

export function Card({ title }: { title: string }) {
  return (
    <StyledView className="p-4 bg-white rounded-lg shadow-md">
      <StyledText className="text-lg font-bold text-gray-900">
        {title}
      </StyledText>
    </StyledView>
  )
}

// With StyleSheet
import { StyleSheet, View, Text } from 'react-native'

export function Card({ title }: { title: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
})
```

---

## Key Constraints

### Platform Considerations
- ✅ Test on both iOS and Android
- ✅ Handle platform-specific code with `Platform.OS`
- ✅ Use SafeAreaView for notch/home indicator
- ✅ Request runtime permissions properly
- ❌ Don't assume both platforms behave identically
- ❌ Don't use iOS-only or Android-only APIs without checks

### Performance
- ✅ Use FlatList/VirtualizedList for long lists
- ✅ Optimize images with proper sizing and caching
- ✅ Use React.memo for expensive components
- ✅ Implement lazy loading for screens
- ❌ Don't render large lists without virtualization
- ❌ Don't run heavy computations on JS thread

### User Experience
- ✅ Provide loading states for all async operations
- ✅ Handle network errors gracefully
- ✅ Implement pull-to-refresh
- ✅ Use proper touch feedback (TouchableOpacity, etc.)
- ❌ Don't block UI without feedback
- ❌ Don't ignore offline scenarios

---

## Common Commands

### Development
```bash
npx expo start           # Start development server
npx expo start --ios     # Start with iOS simulator
npx expo start --android # Start with Android emulator
npx expo start --web     # Start web version
```

### Building
```bash
npx expo build:ios       # Build iOS (classic)
npx expo build:android   # Build Android (classic)
eas build --platform ios # Build with EAS
eas build --platform android
```

### Testing
```bash
npm test                 # Run unit tests
npm run test:watch       # Watch mode
detox test               # Run E2E tests
```

### Other
```bash
npx expo install <package>  # Install and configure package
npx expo doctor             # Check project health
npx expo upgrade            # Upgrade Expo SDK
eas submit                  # Submit to app stores
```

---

## Important Prohibitions

### ❌ Never Do
- Don't use `any` type - use proper TypeScript types
- Don't ignore TypeScript errors
- Don't disable ESLint rules without good reason
- Don't commit sensitive data (API keys, tokens)
- Don't use `console.log` in production - use proper logging
- Don't render large lists without FlatList
- Don't block the JS thread with heavy computations
- Don't ignore platform-specific behaviors
- Don't skip testing on both platforms
- Don't forget to handle permissions

### ⚠️ Use with Caution
- `useEffect` - avoid unnecessary dependencies
- Global state - keep it minimal
- Native modules - ensure proper error handling
- AsyncStorage - don't store sensitive data unencrypted
- Push notifications - handle permission requests carefully

---

## Best Practices

### Component Design
- Keep components small and focused
- Use functional components with hooks
- Extract reusable logic into custom hooks
- Implement proper prop types

```typescript
// ✅ Good
interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary'
  loading?: boolean
}

export function Button({ 
  title, 
  onPress, 
  variant = 'primary',
  loading = false 
}: ButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, styles[variant]]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? <ActivityIndicator /> : <Text>{title}</Text>}
    </TouchableOpacity>
  )
}
```

### Error Handling
- Always handle errors in async operations
- Provide meaningful error messages to users
- Log errors for debugging
- Implement error boundaries

```typescript
// ✅ Good
export function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => api.getUser(userId),
    retry: 2,
    onError: (error) => {
      console.error('Failed to fetch user:', error)
      showToast('Failed to load user data')
    },
  })
}
```

### Accessibility
- Use accessible labels
- Support screen readers
- Ensure proper contrast ratios
- Test with accessibility tools

---

## Compact Instructions

When using `/compact`, preserve:
- Architecture decisions and API changes
- Navigation structure changes
- Test commands and results
- Modified files list and critical diffs

Discard:
- Verbose log output
- Exploratory search dead ends
- Redundant confirmation messages

---

## Quick Reference

### File Locations
- Screens: `src/app/**/*.tsx` (Expo Router)
- Components: `src/components/**`
- Hooks: `src/hooks/**`
- Services: `src/services/**`
- Stores: `src/stores/**`
- Types: `src/types/**`

### Environment Variables
```env
API_BASE_URL=https://api.example.com
EXPO_PUBLIC_API_KEY=your_key_here
SENTRY_DSN=https://...
```

### Platform Detection
```typescript
import { Platform } from 'react-native'

if (Platform.OS === 'ios') {
  // iOS-specific code
} else if (Platform.OS === 'android') {
  // Android-specific code
}

// Platform-specific styles
const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: {
        shadowOpacity: 0.1,
      },
      android: {
        elevation: 4,
      },
    }),
  },
})
```

---

**Last Updated**: 2026-03-12
