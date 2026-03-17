# React Native Paper Template

## Project Overview

React Native Paper is a Material Design component library for React Native, providing high-quality, accessible, and cross-platform UI components. It follows Google's Material Design guidelines and offers a consistent experience across iOS and Android.

## Tech Stack

- **Core**: React Native 0.73+
- **UI Library**: React Native Paper 5.x
- **Navigation**: React Navigation 6.x
- **State Management**: React Context / Redux Toolkit / Zustand
- **Language**: TypeScript
- **Icons**: React Native Vector Icons
- **Fonts**: Custom fonts with Material Design
- **Testing**: Jest, React Native Testing Library, Detox

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── common/                # Reusable components
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.test.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Card/
│   │   │   │   ├── Card.tsx
│   │   │   │   └── index.ts
│   │   │   └── Modal/
│   │   │       ├── Modal.tsx
│   │   │       └── index.ts
│   │   └── screens/               # Screen components
│   │       ├── Home/
│   │       │   ├── HomeScreen.tsx
│   │       │   ├── HomeHeader.tsx
│   │       │   └── index.ts
│   │       ├── Login/
│   │       │   ├── LoginScreen.tsx
│   │       │   └── index.ts
│   │       └── Profile/
│   │           ├── ProfileScreen.tsx
│   │           └── index.ts
│   ├── navigation/
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── MainNavigator.tsx
│   │   └── types.ts
│   ├── context/
│   │   ├── ThemeContext.tsx
│   │   ├── AuthContext.tsx
│   │   └── PaperProvider.tsx
│   ├── hooks/
│   │   ├── useTheme.ts
│   │   ├── useAuth.ts
│   │   └── usePaperTheme.ts
│   ├── services/
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   └── endpoints.ts
│   │   ├── auth/
│   │   │   └── authService.ts
│   │   └── storage/
│   │       ├── asyncStorage.ts
│   │       └── secureStorage.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── validators.ts
│   │   └── helpers.ts
│   ├── theme/
│   │   ├── light.ts
│   │   ├── dark.ts
│   │   └── index.ts
│   ├── types/
│   │   ├── navigation.ts
│   │   └── global.d.ts
│   └── App.tsx
├── android/
├── ios/
├── __tests__/
│   ├── setup.ts
│   └── components/
├── app.json
├── package.json
├── tsconfig.json
├── babel.config.js
├── metro.config.js
└── react-native.config.js
```

## Key Patterns

### 1. Paper Provider Setup

```typescript
// src/context/PaperProvider.tsx
import { PaperProvider as PaperProviderBase } from 'react-native-paper'
import { useTheme } from '@/hooks/useTheme'
import { lightTheme, darkTheme } from '@/theme'

export function PaperProvider({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme

  return <PaperProviderBase theme={theme}>{children}</PaperProviderBase>
}
```

### 2. Theme Configuration

```typescript
// src/theme/light.ts
import { MD3LightTheme } from 'react-native-paper'

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200EE',
    secondary: '#03DAC6',
    tertiary: '#7B1FA2',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    error: '#B00020',
    text: '#000000',
    textSecondary: '#666666',
    disabled: '#9E9E9E',
    placeholder: '#9E9E9E',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#F50057',
  },
  roundness: 8,
}
```

```typescript
// src/theme/dark.ts
import { MD3DarkTheme } from 'react-native-paper'

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#BB86FC',
    secondary: '#03DAC6',
    tertiary: '#3700B3',
    background: '#121212',
    surface: '#1E1E1E',
    error: '#CF6679',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    disabled: '#636363',
    placeholder: '#757575',
    backdrop: 'rgba(0, 0, 0, 0.7)',
    notification: '#FF0266',
  },
  roundness: 8,
}
```

### 3. Navigation Setup

```typescript
// src/navigation/AppNavigator.tsx
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuth } from '@/hooks/useAuth'
import { AuthNavigator } from './AuthNavigator'
import { MainNavigator } from './MainNavigator'
import { RootStackParamList } from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()

export function AppNavigator() {
  const { isAuthenticated } = useAuth()

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
```

### 4. Custom Button Component

```typescript
// src/components/common/Button/Button.tsx
import { ReactNode } from 'react'
import { Button as PaperButton, ButtonProps as PaperButtonProps } from 'react-native-paper'
import { StyleSheet } from 'react-native'

export interface ButtonProps extends Omit<PaperButtonProps, 'children'> {
  children: ReactNode
  variant?: 'filled' | 'outlined' | 'text' | 'contained' | 'elevated' | 'contained-tonal'
  size?: 'small' | 'medium' | 'large'
  fullWidth?: boolean
}

export function Button({
  children,
  variant = 'filled',
  size = 'medium',
  fullWidth = false,
  style,
  ...props
}: ButtonProps) {
  const modeMap = {
    filled: 'contained',
    outlined: 'outlined',
    text: 'text',
    contained: 'contained',
    elevated: 'elevated',
    'contained-tonal': 'contained-tonal',
  } as const

  const sizeStyles = {
    small: styles.small,
    medium: styles.medium,
    large: styles.large,
  }

  return (
    <PaperButton
      mode={modeMap[variant]}
      style={[sizeStyles[size], fullWidth && styles.fullWidth, style]}
      {...props}
    >
      {children}
    </PaperButton>
  )
}

const styles = StyleSheet.create({
  small: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  medium: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  large: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  fullWidth: {
    width: '100%',
  },
})
```

### 5. Custom Card Component

```typescript
// src/components/common/Card/Card.tsx
import { ReactNode } from 'react'
import { Card as PaperCard, CardProps as PaperCardProps } from 'react-native-paper'
import { StyleSheet, ViewStyle } from 'react-native'

export interface CardProps extends PaperCardProps {
  children: ReactNode
  variant?: 'elevated' | 'outlined' | 'filled'
  padding?: 'none' | 'small' | 'medium' | 'large'
}

export function Card({ children, variant = 'elevated', padding = 'medium', style, ...props }: CardProps) {
  const paddingStyles = {
    none: {},
    small: { padding: 8 },
    medium: { padding: 16 },
    large: { padding: 24 },
  }

  const variantStyles: Record<string, ViewStyle> = {
    elevated: styles.elevated,
    outlined: styles.outlined,
    filled: styles.filled,
  }

  return (
    <PaperCard style={[variantStyles[variant], paddingStyles[padding], style]} {...props}>
      {children}
    </PaperCard>
  )
}

const styles = StyleSheet.create({
  elevated: {
    elevation: 2,
  },
  outlined: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filled: {
    backgroundColor: '#F5F5F5',
  },
})
```

### 6. Login Screen

```typescript
// src/components/screens/Login/LoginScreen.tsx
import { useState } from 'react'
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { Text, TextInput, Button, HelperText, useTheme } from 'react-native-paper'
import { useAuth } from '@/hooks/useAuth'
import { validateEmail, validatePassword } from '@/utils/validators'

export function LoginScreen() {
  const theme = useTheme()
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const handleLogin = async () => {
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError })
      return
    }

    try {
      await login(email, password)
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text variant="headlineLarge" style={styles.title}>
            Welcome Back
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Sign in to continue
          </Text>

          <View style={styles.form}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text)
                setErrors({ ...errors, email: undefined })
              }}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              error={!!errors.email}
              style={styles.input}
            />
            {errors.email && (
              <HelperText type="error" visible={!!errors.email}>
                {errors.email}
              </HelperText>
            )}

            <TextInput
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text)
                setErrors({ ...errors, password: undefined })
              }}
              mode="outlined"
              secureTextEntry={!showPassword}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              error={!!errors.password}
              style={styles.input}
            />
            {errors.password && (
              <HelperText type="error" visible={!!errors.password}>
                {errors.password}
              </HelperText>
            )}

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
            >
              Sign In
            </Button>

            <Button mode="text" onPress={() => {}} style={styles.forgotButton}>
              Forgot Password?
            </Button>
          </View>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.outline }]} />
            <Text variant="bodySmall" style={[styles.dividerText, { color: theme.colors.outline }]}>
              OR
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.outline }]} />
          </View>

          <Button
            mode="outlined"
            icon="google"
            onPress={() => {}}
            style={styles.socialButton}
          >
            Continue with Google
          </Button>

          <Button
            mode="outlined"
            icon="apple"
            onPress={() => {}}
            style={styles.socialButton}
          >
            Continue with Apple
          </Button>

          <View style={styles.footer}>
            <Text variant="bodyMedium">Don't have an account? </Text>
            <Button mode="text" onPress={() => {}} compact>
              Sign Up
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 16,
    paddingVertical: 6,
  },
  forgotButton: {
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
  },
  socialButton: {
    marginBottom: 12,
    paddingVertical: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
})
```

### 7. Home Screen with Lists

```typescript
// src/components/screens/Home/HomeScreen.tsx
import { useState, useCallback } from 'react'
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native'
import { Text, Card, Title, Paragraph, Avatar, FAB, useTheme } from 'react-native-paper'

interface Post {
  id: string
  title: string
  content: string
  author: string
  avatar: string
  createdAt: string
}

export function HomeScreen() {
  const theme = useTheme()
  const [refreshing, setRefreshing] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    // Fetch posts
    setTimeout(() => setRefreshing(false), 2000)
  }, [])

  const renderPost = ({ item }: { item: Post }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Avatar.Text size={40} label={item.author.charAt(0)} />
          <View style={styles.authorInfo}>
            <Text variant="titleMedium">{item.author}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
              {item.createdAt}
            </Text>
          </View>
        </View>
        <Title>{item.title}</Title>
        <Paragraph>{item.content}</Paragraph>
      </Card.Content>
      <Card.Actions>
        <Card.Actions>
          <Card.Actions>
            <Card.Actions>
              <Card.Actions>
                <Card.Actions>
                  <Card.Actions>
                    <Card.Actions>
                      <Card.Actions>
                        <Card.Actions>
                          <Card.Actions>
                            <Card.Actions>
                              <Card.Actions>
                                <Card.Actions>
                                  <Card.Actions>
                                    <Card.Actions>
                                      <Card.Actions>
                                        <Card.Actions>
                                          <Card.Actions>
                                            <Card.Actions>
                                              <Card.Actions>
                                                <Card.Actions>
                                                  <Card.Actions>
                                                    <Card.Actions>
                                                      <Card.Actions>
                                                        <Card.Actions>
                                                          <Card.Actions>
                                                            <Card.Actions>
                                                              <Card.Actions>
                                                                <Card.Actions>
                                                                  <Card.Actions>
                                                                    <Card.Actions>
                                                                      <Card.Actions>
                                                                        <Card.Actions>
                                                                          <Card.Actions>
                                                                            <Card.Actions>
                                                                              <Card.Actions>
                                                                                <Card.Actions>
                                                                                  <Card.Actions>
                                                                                    <Card.Actions>
                                                                                      <Card.Actions>
                                                                                        <Card.Actions>
                                                                                          <Card.Actions>
                                                                                            <Card.Actions>
                                                                                              <Card.Actions>
                                                                                                <Card.Actions>
                                                                                                  <Card.Actions>
                                                                                                    <Card.Actions>
                                                                                                      <Card.Actions>
                                                                                                        <Card.Actions>
                                                                                                          <Card.Actions>
                                                                                                            <Card.Actions>
                                                                                                              <Card.Actions>
                                                                                                                <Card.Actions>
                                                                                                                  <Card.Actions>
                                                                                                                    <Card.Actions>
                                                                                                                      <Card.Actions>
                                                                                                                        <Card.Actions>
                                                                                                                          <Card.Actions>
                                                                                                                            <Card.Actions>
                                                                                                                              <Card.Actions>
                                                                                                                                <Card.Actions>
                                                                                                                                  <Card.Actions>
                                                                                                                                    <Card.Actions>
                                                                                                                                      <Card.Actions>
                                                                                                                                        <Card.Actions>
                                                                                                                                          <Card.Actions>
                                                                                                                                            <Card.Actions>
                                                                                                                                              <Card.Actions>
                                                                                                                                                <Card.Actions>
                                                                                                                                                  <Card.Actions>
                                                                                                                                                    <Card.Actions>
                                                                                                                                                      <Card.Actions>
                                                                                                                                                        <Card.Actions>
                                                                                                                                                          <Card.Actions>
                                                                                                                                                            <Card.Actions>
                                                                                                                                                              <Card.Actions>
                                                                                                                                                                <Card.Actions>
                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                              <Card.Actions>
                                                                                                                                                                                                                                                                                                                <Card.Actions>
                                                                                                                                                                                                                                                                                                                  <Card.Actions>
                                                                                                                                                                                                                                                                                                                    <Card.Actions>
                                                                                                                                                                                                                                                                                                                      <Card.Actions>
                                                                                                                                                                                                                                                                                                                        <Card.Actions>
                                                                                                                                                                                                                                                                                                                          <Card.Actions>
                                                                                                                                                                                                                                                                                                                            <Card.Actions>
                                                                                                                                                                                                                                                                                                                                                          </View>
      </Card.Content>
    </Card>
  )

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
      <FAB icon="plus" style={styles.fab} onPress={() => {}} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
})
```

## Best Practices

1. **Material Design**: Follow Material Design 3 guidelines
2. **Accessibility**: Ensure proper accessibility labels and roles
3. **Performance**: Use memoization for expensive renders
4. **Responsive**: Design for different screen sizes
5. **Dark Mode**: Support both light and dark themes
6. **TypeScript**: Use strict typing for all components
7. **Navigation**: Use typed navigation with proper params

## Common Commands

```bash
# Development
npx react-native start             # Start Metro bundler
npx react-native run-ios           # Run on iOS
npx react-native run-android       # Run on Android

# Testing
npm test                           # Run unit tests
npm run test:watch                 # Watch mode
npm run test:coverage              # Coverage report

# Build
npm run build:ios                  # Build iOS
npm run build:android              # Build Android

# Linting
npm run lint                       # Run ESLint
npm run lint:fix                   # Fix issues
```

## Deployment

### iOS

```bash
# Build for production
cd ios
pod install
cd ..
npx react-native build --mode Release --platform ios
```

### Android

```bash
# Build APK
cd android
./gradlew assembleRelease

# Build AAB
./gradlew bundleRelease
```

## Resources

- [React Native Paper Documentation](https://callstack.github.io/react-native-paper/)
- [Material Design 3](https://m3.material.io/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Paper GitHub](https://github.com/callstack/react-native-paper)
