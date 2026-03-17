# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: NativeWind Application
**Type**: React Native with Tailwind CSS
**Tech Stack**: React Native + NativeWind + Expo + TypeScript
**Goal**: Cross-platform mobile app with Tailwind CSS styling

---

## Tech Stack

### Core
- **Framework**: React Native 0.73+
- **Styling**: NativeWind 4.0 (Tailwind CSS for React Native)
- **Runtime**: Expo SDK 50+
- **Language**: TypeScript 5.3+

### Navigation
- **Router**: Expo Router 3.x (File-based)
- **State**: Zustand / Jotai

### Development
- **Package Manager**: pnpm
- **Testing**: Jest + React Native Testing Library
- **Linting**: ESLint + Prettier

---

## Project Structure

```
nativewind-app/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── explore.tsx
│   │   └── profile.tsx
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── modal/
│   │   └── settings.tsx
│   └── post/
│       └── [id].tsx
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── Skeleton.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── TabBar.tsx
│   │   │   └── SafeArea.tsx
│   │   └── features/
│   │       ├── PostCard.tsx
│   │       ├── UserList.tsx
│   │       └── CommentSection.tsx
│   ├── hooks/
│   │   ├── useTheme.ts
│   │   ├── useAuth.ts
│   │   ├── usePosts.ts
│   │   └── useKeyboard.ts
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   └── auth.ts
│   │   └── utils/
│   │       ├── cn.ts
│   │       └── helpers.ts
│   ├── stores/
│   │   ├── useAuthStore.ts
│   │   └── useThemeStore.ts
│   ├── types/
│   │   └── index.ts
│   └── constants/
│       └── theme.ts
├── assets/
│   ├── fonts/
│   ├── images/
│   └── icons/
├── tailwind.config.js
├── global.css
├── app.json
├── metro.config.js
├── babel.config.js
└── package.json
```

---

## Coding Rules

### 1. NativeWind Setup

```typescript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        secondary: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        background: {
          light: "#ffffff",
          dark: "#0a0a0a",
        },
        surface: {
          light: "#f8f9fa",
          dark: "#141414",
        },
        text: {
          light: "#1a1a1a",
          dark: "#f5f5f5",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui"],
        mono: ["JetBrainsMono", "monospace"],
      },
      spacing: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
      },
    },
  },
  plugins: [],
};

// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};

// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
```

### 2. Global Styles

```css
/* global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --color-primary: #3b82f6;
    --color-secondary: #8b5cf6;
  }
}

@layer components {
  .btn-primary {
    @apply bg-primary-500 text-white py-3 px-6 rounded-lg font-semibold active:bg-primary-600;
  }

  .btn-secondary {
    @apply bg-secondary-500 text-white py-3 px-6 rounded-lg font-semibold active:bg-secondary-600;
  }

  .btn-outline {
    @apply border-2 border-primary-500 text-primary-500 py-3 px-6 rounded-lg font-semibold;
  }

  .card {
    @apply bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm;
  }

  .input {
    @apply bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-text-light dark:text-text-dark;
  }
}
```

### 3. Utility Functions

```typescript
// src/lib/utils/cn.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// src/lib/utils/helpers.ts
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}
```

### 4. UI Components

```typescript
// src/components/ui/Button.tsx
import { Pressable, Text, ActivityIndicator, ViewStyle } from "react-native";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  onPress?: () => void;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary-500 active:bg-primary-600",
  secondary: "bg-secondary-500 active:bg-secondary-600",
  outline: "bg-transparent border-2 border-primary-500",
  ghost: "bg-transparent",
};

const textVariantStyles: Record<ButtonVariant, string> = {
  primary: "text-white",
  secondary: "text-white",
  outline: "text-primary-500",
  ghost: "text-primary-500",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "py-2 px-4 rounded-md",
  md: "py-3 px-6 rounded-lg",
  lg: "py-4 px-8 rounded-xl",
};

const textSizeStyles: Record<ButtonSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  className,
  onPress,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={cn(
        "flex-row items-center justify-center",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        isDisabled && "opacity-50",
        className
      )}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "outline" || variant === "ghost" ? "#3b82f6" : "#ffffff"}
        />
      ) : (
        <Text
          className={cn(
            "font-semibold",
            textVariantStyles[variant],
            textSizeStyles[size]
          )}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}

// src/components/ui/Input.tsx
import { useState } from "react";
import {
  View,
  TextInput,
  Text,
  Pressable,
  TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/lib/utils/cn";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerClassName,
  className,
  secureTextEntry,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className={cn("mb-4", containerClassName)}>
      {label && (
        <Text className="text-sm font-medium text-text-light dark:text-text-dark mb-2">
          {label}
        </Text>
      )}
      <View
        className={cn(
          "flex-row items-center bg-surface-light dark:bg-surface-dark border rounded-lg px-4",
          isFocused ? "border-primary-500" : "border-gray-200 dark:border-gray-700",
          error && "border-red-500"
        )}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            className="mr-3 text-gray-400"
            color="#9ca3af"
          />
        )}
        <TextInput
          className={cn(
            "flex-1 py-3 text-text-light dark:text-text-dark",
            className
          )}
          placeholderTextColor="#9ca3af"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry && !showPassword}
          {...props}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color="#9ca3af"
            />
          </Pressable>
        )}
        {rightIcon && !secureTextEntry && (
          <Pressable onPress={onRightIconPress}>
            <Ionicons name={rightIcon} size={20} color="#9ca3af" />
          </Pressable>
        )}
      </View>
      {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
    </View>
  );
}

// src/components/ui/Card.tsx
import { View, ViewStyle } from "react-native";
import { cn } from "@/lib/utils/cn";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "elevated" | "outlined" | "filled";
}

const variantStyles = {
  elevated: "bg-white dark:bg-surface-dark shadow-md",
  outlined: "bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700",
  filled: "bg-surface-light dark:bg-surface-dark",
};

export function Card({ children, className, variant = "elevated" }: CardProps) {
  return (
    <View
      className={cn(
        "rounded-xl p-4",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </View>
  );
}

// src/components/ui/Avatar.tsx
import { View, Image, Text } from "react-native";
import { cn } from "@/lib/utils/cn";

interface AvatarProps {
  source?: { uri: string } | number;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeStyles = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

const textSizeStyles = {
  sm: "text-xs",
  md: "text-base",
  lg: "text-xl",
  xl: "text-3xl",
};

export function Avatar({ source, name, size = "md", className }: AvatarProps) {
  const initials = name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <View
      className={cn(
        "rounded-full bg-primary-500 items-center justify-center overflow-hidden",
        sizeStyles[size],
        className
      )}
    >
      {source ? (
        <Image
          source={source}
          className="w-full h-full"
          resizeMode="cover"
        />
      ) : (
        <Text
          className={cn(
            "text-white font-semibold",
            textSizeStyles[size]
          )}
        >
          {initials || "?"}
        </Text>
      )}
    </View>
  );
}
```

### 5. Theme Hook

```typescript
// src/hooks/useTheme.ts
import { useColorScheme } from "react-native";
import { useThemeStore } from "@/stores/useThemeStore";

export function useTheme() {
  const systemColorScheme = useColorScheme();
  const { theme, setTheme } = useThemeStore();

  const colorScheme = theme === "system" ? systemColorScheme : theme;
  const isDark = colorScheme === "dark";

  return {
    theme,
    colorScheme,
    isDark,
    setTheme,
    toggleTheme: () => {
      setTheme(isDark ? "light" : "dark");
    },
  };
}

// src/stores/useThemeStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### 6. Auth Store and Hook

```typescript
// src/stores/useAuthStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),
      setToken: (token) => set({ token }),
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// src/hooks/useAuth.ts
import { useAuthStore } from "@/stores/useAuthStore";
import { api } from "@/lib/api/client";
import * as SecureStore from "expo-secure-store";

export function useAuth() {
  const { user, token, isAuthenticated, setUser, setToken, logout } = useAuthStore();

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { user, accessToken, refreshToken } = response.data;

      await SecureStore.setItemAsync("refreshToken", refreshToken);
      setToken(accessToken);
      setUser(user);

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || "Login failed",
      };
    }
  };

  const register = async (data: { email: string; username: string; password: string }) => {
    try {
      const response = await api.post("/auth/register", data);
      const { user, accessToken, refreshToken } = response.data;

      await SecureStore.setItemAsync("refreshToken", refreshToken);
      setToken(accessToken);
      setUser(user);

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || "Registration failed",
      };
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("refreshToken");
    logout();
  };

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout: handleLogout,
  };
}
```

### 7. Screen Examples

```typescript
// app/(tabs)/index.tsx
import { View, Text, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePosts } from "@/hooks/usePosts";
import { PostCard } from "@/components/features/PostCard";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function HomeScreen() {
  const { posts, loading, error, refetch, loadMore, hasMore } = usePosts();

  if (loading && posts.length === 0) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background-light dark:bg-background-dark">
        <Text className="text-red-500 mb-4">{error}</Text>
        <Button onPress={refetch}>Try Again</Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerClassName="p-4 gap-4"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
        onEndReached={() => hasMore && loadMore()}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-12">
            <Text className="text-gray-500 text-lg">No posts yet</Text>
          </View>
        }
        ListFooterComponent={
          loading && posts.length > 0 ? (
            <LoadingSpinner size="small" />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

// app/(auth)/login.tsx
import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    const result = await login(email, password);

    setLoading(false);

    if (result.success) {
      router.replace("/(tabs)");
    } else {
      setError(result.error || "Login failed");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          className="px-6"
        >
          <View className="flex-1 justify-center py-12">
            <Text className="text-3xl font-bold text-text-light dark:text-text-dark mb-2">
              Welcome back
            </Text>
            <Text className="text-gray-500 mb-8">
              Sign in to continue
            </Text>

            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail"
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon="lock-closed"
            />

            {error && (
              <Text className="text-red-500 text-center mb-4">{error}</Text>
            )}

            <Button
              onPress={handleLogin}
              loading={loading}
              fullWidth
              className="mt-4"
            >
              Sign In
            </Button>

            <Button
              variant="ghost"
              onPress={() => router.push("/(auth)/register")}
              className="mt-4"
            >
              Don't have an account? Sign up
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
```

---

## App Configuration

```json
// app.json
{
  "expo": {
    "name": "NativeWind App",
    "slug": "nativewind-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "nativewindapp",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#3b82f6"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.example.nativewindapp"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#3b82f6"
      },
      "package": "com.example.nativewindapp"
    },
    "plugins": [
      "expo-router",
      "expo-secure-store"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

---

## Environment Variables

```bash
# .env

# API
API_URL=http://localhost:3000/api

# Auth (Optional)
AUTH_SECRET=your-secret-key

# Sentry (Optional)
SENTRY_DSN=https://xxx@sentry.io/xxx

# Environment
ENV=development
```

---

## Common Commands

```bash
# Development
pnpm start
pnpm android
pnpm ios
pnpm web

# Build
pnpm build:android
pnpm build:ios

# Lint
pnpm lint
pnpm lint:fix

# Test
pnpm test
pnpm test:watch

# Expo
pnpm expo:install <package>
pnpm expo:update
pnpm expo:doctor

# NativeWind
pnpm nativewind:generate

# Clear cache
pnpm clear-cache
```

---

## Deployment Checklist

- [ ] Configure app.json with correct bundle ID
- [ ] Set up app icons and splash screens
- [ ] Configure deep linking
- [ ] Set up push notifications (if needed)
- [ ] Configure environment variables
- [ ] Test on both iOS and Android
- [ ] Set up error tracking (Sentry)
- [ ] Configure app signing
- [ ] Test performance on low-end devices
- [ ] Review bundle size
- [ ] Test offline functionality
- [ ] Configure analytics
- [ ] Submit to App Store / Play Store
- [ ] Set up CI/CD for builds
