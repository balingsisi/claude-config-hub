# React Native Reanimated 3 - 高性能动画库

## 技术栈

- **核心**: React Native Reanimated 3.x
- **运行时**: React Native 0.76+
- **手势**: React Native Gesture Handler 2.x
- **类型支持**: TypeScript
- **平台**: iOS, Android, Web

## 项目结构

```
src/
├── animations/
│   ├── FadeIn.tsx          # 淡入动画
│   ├── SlideIn.tsx         # 滑入动画
│   ├── ScaleIn.tsx         # 缩放动画
│   ├── Swipeable.tsx       # 滑动删除
│   └── Draggable.tsx       # 拖拽组件
├── components/
│   ├── AnimatedButton.tsx  # 动画按钮
│   ├── AnimatedCard.tsx    # 动画卡片
│   ├── AnimatedList.tsx    # 动画列表
│   └── BottomSheet.tsx     # 底部抽屉
├── hooks/
│   ├── useAnimation.ts     # 动画钩子
│   ├── useGesture.ts       # 手势钩子
│   └── useSharedValue.ts   # 共享值钩子
├── utils/
│   └── animations.ts       # 动画工具函数
└── types/
    └── index.ts            # 类型定义
```

## 代码模式

### 1. 基础配置

```typescript
// babel.config.js
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: ['react-native-reanimated/plugin'],
}
```

```typescript
// 基础导入
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated'
```

### 2. 基础动画

```typescript
// src/animations/FadeIn.tsx
import { View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated'
import { useEffect } from 'react'

interface FadeInProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  distance?: number
}

export function FadeIn({
  children,
  delay = 0,
  duration = 500,
  direction = 'up',
  distance = 30,
}: FadeInProps) {
  const opacity = useSharedValue(0)
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)

  useEffect(() => {
    const translations = {
      up: { x: 0, y: distance },
      down: { x: 0, y: -distance },
      left: { x: distance, y: 0 },
      right: { x: -distance, y: 0 },
    }

    translateX.value = translations[direction].x
    translateY.value = translations[direction].y

    opacity.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.cubic) })
    )

    translateX.value = withDelay(
      delay,
      withTiming(0, { duration, easing: Easing.out(Easing.cubic) })
    )

    translateY.value = withDelay(
      delay,
      withTiming(0, { duration, easing: Easing.out(Easing.cubic) })
    )
  }, [delay, duration, direction, distance])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
  }))

  return <Animated.View style={animatedStyle}>{children}</Animated.View>
}
```

```typescript
// src/animations/ScaleIn.tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated'
import { useEffect } from 'react'

interface ScaleInProps {
  children: React.ReactNode
  delay?: number
  initialScale?: number
}

export function ScaleIn({ children, delay = 0, initialScale = 0 }: ScaleInProps) {
  const scale = useSharedValue(initialScale)

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, {
      damping: 15,
      stiffness: 150,
    }))
  }, [delay, initialScale])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return <Animated.View style={animatedStyle}>{children}</Animated.View>
}
```

```typescript
// src/animations/SlideIn.tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated'
import { useEffect } from 'react'

interface SlideInProps {
  children: React.ReactNode
  delay?: number
  from?: 'left' | 'right' | 'top' | 'bottom'
  distance?: number
}

export function SlideIn({
  children,
  delay = 0,
  from = 'left',
  distance = 100,
}: SlideInProps) {
  const translateX = useSharedValue(from === 'left' ? -distance : from === 'right' ? distance : 0)
  const translateY = useSharedValue(from === 'top' ? -distance : from === 'bottom' ? distance : 0)

  useEffect(() => {
    const toValue = 0
    translateX.value = withDelay(delay, withSpring(toValue, { damping: 20 }))
    translateY.value = withDelay(delay, withSpring(toValue, { damping: 20 }))
  }, [delay, from, distance])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
  }))

  return <Animated.View style={animatedStyle}>{children}</Animated.View>
}
```

### 3. 手势动画

```typescript
// src/animations/Draggable.tsx
import { View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'

interface DraggableProps {
  children: React.ReactNode
  onDragEnd?: (x: number, y: number) => void
  snapBack?: boolean
}

export function Draggable({ children, onDragEnd, snapBack = true }: DraggableProps) {
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const startX = useSharedValue(0)
  const startY = useSharedValue(0)

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value
      startY.value = translateY.value
    })
    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX
      translateY.value = startY.value + event.translationY
    })
    .onEnd(() => {
      if (snapBack) {
        translateX.value = withSpring(0, { damping: 15 })
        translateY.value = withSpring(0, { damping: 15 })
      } else if (onDragEnd) {
        runOnJS(onDragEnd)(translateX.value, translateY.value)
      }
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
  }))

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </GestureDetector>
  )
}
```

```typescript
// src/animations/Swipeable.tsx
import { View, TouchableOpacity, Text } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'

interface SwipeableProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  leftActions?: React.ReactNode
  rightActions?: React.ReactNode
  threshold?: number
}

export function Swipeable({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftActions,
  rightActions,
  threshold = 100,
}: SwipeableProps) {
  const translateX = useSharedValue(0)
  const startX = useSharedValue(0)

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value
    })
    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX
    })
    .onEnd(() => {
      if (translateX.value > threshold && onSwipeRight) {
        runOnJS(onSwipeRight)()
        translateX.value = withSpring(0)
      } else if (translateX.value < -threshold && onSwipeLeft) {
        runOnJS(onSwipeLeft)()
        translateX.value = withSpring(0)
      } else {
        translateX.value = withSpring(0, { damping: 20 })
      }
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  const leftActionsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, threshold], [0, 1], Extrapolate.CLAMP),
    transform: [{ translateX: interpolate(translateX.value, [-100, 0, 100], [-100, 0, 0], Extrapolate.CLAMP) }],
  }))

  const rightActionsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-threshold, 0], [1, 0], Extrapolate.CLAMP),
    transform: [{ translateX: interpolate(translateX.value, [-100, 0, 100], [0, 0, 100], Extrapolate.CLAMP) }],
  }))

  return (
    <View className="relative overflow-hidden">
      {/* Left Actions */}
      <Animated.View style={[leftActionsStyle, { position: 'absolute', left: 0, top: 0, bottom: 0 }]}>
        {leftActions}
      </Animated.View>

      {/* Right Actions */}
      <Animated.View style={[rightActionsStyle, { position: 'absolute', right: 0, top: 0, bottom: 0 }]}>
        {rightActions}
      </Animated.View>

      {/* Content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedStyle}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  )
}
```

### 4. 复杂动画

```typescript
// src/components/AnimatedList.tsx
import { View, Text, FlatList } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from 'react-native-reanimated'
import { useEffect } from 'react'

interface Item {
  id: string
  title: string
  description: string
}

interface AnimatedListProps {
  data: Item[]
  renderItem: (item: Item) => React.ReactNode
}

function AnimatedItem({
  item,
  index,
  renderItem,
}: {
  item: Item
  index: number
  renderItem: (item: Item) => React.ReactNode
}) {
  const scale = useSharedValue(0)
  const opacity = useSharedValue(0)

  useEffect(() => {
    scale.value = withDelay(index * 100, withSpring(1, { damping: 15 }))
    opacity.value = withDelay(index * 100, withSpring(1))
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }))

  return (
    <Animated.View style={animatedStyle}>
      {renderItem(item)}
    </Animated.View>
  )
}

export function AnimatedList({ data, renderItem }: AnimatedListProps) {
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <AnimatedItem item={item} index={index} renderItem={renderItem} />
      )}
      scrollEventThrottle={16}
    />
  )
}
```

```typescript
// src/components/BottomSheet.tsx
import { View, Dimensions, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const MAX_TRANSLATE_Y = -SCREEN_HEIGHT + 50

interface BottomSheetProps {
  children: React.ReactNode
  isOpen: boolean
  onClose: () => void
  snapPoints?: number[]
}

export function BottomSheet({
  children,
  isOpen,
  onClose,
  snapPoints = [0.5, 0.9],
}: BottomSheetProps) {
  const translateY = useSharedValue(0)
  const context = useSharedValue({ y: 0 })

  const scrollTo = (destination: number) => {
    'worklet'
    translateY.value = withSpring(destination, { damping: 50 })
  }

  useEffect(() => {
    if (isOpen) {
      scrollTo(-SCREEN_HEIGHT * snapPoints[0])
    } else {
      scrollTo(0)
    }
  }, [isOpen])

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value }
    })
    .onUpdate((event) => {
      translateY.value = Math.max(
        event.translationY + context.value.y,
        MAX_TRANSLATE_Y
      )
    })
    .onEnd(() => {
      if (translateY.value > -SCREEN_HEIGHT * 0.3) {
        scrollTo(0)
        runOnJS(onClose)()
      } else if (translateY.value < -SCREEN_HEIGHT * 0.7) {
        scrollTo(-SCREEN_HEIGHT * snapPoints[1])
      } else {
        scrollTo(-SCREEN_HEIGHT * snapPoints[0])
      }
    })

  const rBottomSheetStyle = useAnimatedStyle(() => {
    const borderRadius = interpolate(
      translateY.value,
      [MAX_TRANSLATE_Y + 50, MAX_TRANSLATE_Y],
      [25, 5],
      Extrapolate.CLAMP
    )

    return {
      borderRadius,
      transform: [{ translateY: translateY.value }],
    }
  })

  const rBackdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [-SCREEN_HEIGHT, 0],
      [1, 0],
      Extrapolate.CLAMP
    ),
  }))

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        style={[
          {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0,0,0,0.4)',
          },
          rBackdropStyle,
        ]}
        onTouchStart={() => {
          scrollTo(0)
          onClose()
        }}
      />

      {/* Bottom Sheet */}
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[
            {
              height: SCREEN_HEIGHT,
              width: '100%',
              backgroundColor: 'white',
              position: 'absolute',
              top: SCREEN_HEIGHT,
              borderRadius: 25,
            },
            rBottomSheetStyle,
          ]}
        >
          {/* Handle */}
          <View className="w-12 h-1 bg-gray-300 rounded-full self-center mt-3 mb-2" />

          {/* Content */}
          <View className="flex-1">{children}</View>
        </Animated.View>
      </GestureDetector>
    </>
  )
}
```

### 5. 自定义钩子

```typescript
// src/hooks/useAnimation.ts
import { useSharedValue, withSpring, withTiming, withDelay } from 'react-native-reanimated'

export function useFadeIn(duration: number = 500, delay: number = 0) {
  const opacity = useSharedValue(0)

  const fadeIn = () => {
    opacity.value = withDelay(delay, withTiming(1, { duration }))
  }

  const fadeOut = () => {
    opacity.value = withTiming(0, { duration })
  }

  return { opacity, fadeIn, fadeOut }
}

export function useScale(initialValue: number = 1) {
  const scale = useSharedValue(initialValue)

  const scaleUp = (value: number = 1.1) => {
    scale.value = withSpring(value, { damping: 15, stiffness: 150 })
  }

  const scaleDown = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 })
  }

  return { scale, scaleUp, scaleDown }
}
```

```typescript
// src/hooks/useGesture.ts
import { useSharedValue } from 'react-native-reanimated'
import { Gesture } from 'react-native-gesture-handler'

export function useTap(onTap: () => void) {
  const pressed = useSharedValue(false)

  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      pressed.value = true
    })
    .onFinalize(() => {
      pressed.value = false
    })
    .onEnd(() => {
      runOnJS(onTap)()
    })

  return { tapGesture, pressed }
}

export function useDoubleTap(onDoubleTap: () => void) {
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(onDoubleTap)()
    })

  return doubleTapGesture
}
```

## 最佳实践

### 1. 性能优化

```typescript
// ✅ 使用 useAnimatedStyle
const animatedStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
}))

// ❌ 避免在动画中使用 JS 线程
// 不要在 worklet 外频繁更新状态

// ✅ 使用 runOnJS 调用 JS 函数
.onEnd(() => {
  runOnJS(handleAnimationEnd)()
})
```

### 2. Worklets

```typescript
// worklet 函数在 UI 线程运行
function someWorklet() {
  'worklet'
  // 这里可以使用 Reanimated API
  console.log('Running on UI thread')
}

// 普通函数在 JS 线程运行
function regularFunction() {
  // 这里只能使用 JS API
  console.log('Running on JS thread')
}
```

### 3. 组合动画

```typescript
import { withSequence, withDelay, withSpring, withTiming } from 'react-native-reanimated'

// 序列动画
const sequence = withSequence(
  withSpring(1.2),
  withSpring(0.8),
  withSpring(1)
)

// 延迟动画
const delayed = withDelay(500, withTiming(1))

// 重复动画
const repeat = withRepeat(withTiming(1, { duration: 1000 }), -1, true)
```

### 4. 手势组合

```typescript
import { Gesture } from 'react-native-gesture-handler'

const tapGesture = Gesture.Tap().onEnd(() => {})
const panGesture = Gesture.Pan().onUpdate(() => {})

// 同时响应
const composed = Gesture.Simultaneous(tapGesture, panGesture)

// 互斥
const exclusive = Gesture.Exclusive(tapGesture, panGesture)

// 顺序
const race = Gesture.Race(tapGesture, panGesture)
```

### 5. 测试

```typescript
// __tests__/FadeIn.test.tsx
import { render } from '@testing-library/react-native'
import { FadeIn } from '../FadeIn'

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock')
  Reanimated.default.call = () => {}
  return Reanimated
})

describe('FadeIn', () => {
  it('renders children', () => {
    const { getByText } = render(
      <FadeIn>
        <Text>Hello</Text>
      </FadeIn>
    )
    expect(getByText('Hello')).toBeTruthy()
  })
})
```

## 常用命令

```bash
# 安装
npm install react-native-reanimated react-native-gesture-handler

# iOS
cd ios && pod install

# 运行
npx expo start
npm run ios
npm run android
```

## 部署配置

### 1. Android配置

```gradle
// android/app/build.gradle
android {
  ...
  packagingOptions {
    pickFirst '**/armeabi-v7a/libc++_shared.so'
    pickFirst '**/x86/libc++_shared.so'
    pickFirst '**/arm64-v8a/libc++_shared.so'
    pickFirst '**/x86_64/libc++_shared.so'
  }
}
```

### 2. iOS配置

```ruby
# ios/Podfile
target 'YourApp' do
  use_expo_modules!
  config = use_native_modules!
end
```

### 3. Web配置

```typescript
// 支持 Web
import { enableLayoutAnimations } from 'react-native-reanimated'

enableLayoutAnimations(true)
```

## 关键特性

- ⚡ **60FPS**: 在 UI 线程运行动画
- 🎨 **声明式**: React 风格 API
- 🤚 **手势**: 与 Gesture Handler 完美集成
- 📱 **跨平台**: iOS, Android, Web
- 🔧 **TypeScript**: 完整类型支持
- 🎯 **Worklets**: UI 线程函数
- 📦 **轻量级**: Tree-shakable
- 🚀 **性能**: 原生驱动动画
