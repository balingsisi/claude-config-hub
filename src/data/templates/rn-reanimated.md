# React Native Reanimated 模板

## 技术栈

- **动画库**: React Native Reanimated 3.x
- **手势**: React Native Gesture Handler
- **平台**: iOS / Android
- **运行时**: React Native 0.73+
- **类型**: TypeScript

## 项目结构

```
rn-reanimated-app/
├── src/
│   ├── components/
│   │   ├── animations/
│   │   │   ├── FadeInView.tsx
│   │   │   ├── SlideInView.tsx
│   │   │   ├── ScaleInView.tsx
│   │   │   └── SpinView.tsx
│   │   ├── gestures/
│   │   │   ├── SwipeableCard.tsx
│   │   │   ├── DraggableItem.tsx
│   │   │   └── PinchZoom.tsx
│   │   ├── ui/
│   │   │   ├── AnimatedButton.tsx
│   │   │   ├── AnimatedList.tsx
│   │   │   └── BottomSheet.tsx
│   │   └── screens/
│   │       └── OnboardingScreen.tsx
│   ├── hooks/
│   │   ├── useAnimatedValue.ts
│   │   ├── useGesture.ts
│   │   └── useMount.ts
│   ├── utils/
│   │   ├── animations.ts
│   │   └── interpolations.ts
│   └── App.tsx
├── package.json
├── babel.config.js
└── tsconfig.json
```

## 代码模式

### 基础配置

```javascript
// babel.config.js
module.exports = {
  presets: ["babel-preset-expo"],
  plugins: ["react-native-reanimated/plugin"],
};

// 必须是最后一个插件！
```

```typescript
// src/App.tsx
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Your app */}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
```

### 基础动画

```typescript
// src/components/animations/FadeInView.tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import { View, ViewProps } from "react-native";
import { useEffect } from "react";

interface FadeInViewProps extends ViewProps {
  delay?: number;
  duration?: number;
}

export function FadeInView({ 
  children, 
  delay = 0, 
  duration = 500,
  style,
  ...props 
}: FadeInViewProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration })
    );
    translateY.value = withDelay(
      delay,
      withSpring(0, { damping: 15 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
}
```

### Spring 动画

```typescript
// src/components/animations/ScaleInView.tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Pressable, Text, StyleSheet } from "react-native";
import { useState } from "react";

interface AnimatedButtonProps {
  onPress: () => void;
  title: string;
}

export function AnimatedButton({ onPress, title }: AnimatedButtonProps) {
  const scale = useSharedValue(1);
  const borderRadius = useSharedValue(8);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, {
      damping: 15,
      stiffness: 150,
    });
    borderRadius.value = withTiming(16);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 10,
      stiffness: 200,
    });
    borderRadius.value = withTiming(8);
  };

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.9, { damping: 15 }),
      withSpring(1, { damping: 10 })
    );
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderRadius: borderRadius.value,
  }));

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View style={[styles.button, animatedStyle]}>
        <Text style={styles.text}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  text: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
```

### 手势交互

```typescript
// src/components/gestures/DraggableItem.tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import { View, StyleSheet } from "react-native";

interface DraggableItemProps {
  onDragEnd?: (x: number, y: number) => void;
}

export function DraggableItem({ onDragEnd }: DraggableItemProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
      scale.value = withSpring(1.1);
    })
    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
    })
    .onEnd(() => {
      scale.value = withSpring(1);
      runOnJS(onDragEnd)?.(translateX.value, translateY.value);
    });

  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(0.95);
    })
    .onFinalize(() => {
      scale.value = withSpring(1);
    });

  const composed = Gesture.Simultaneous(panGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.box, animatedStyle]} />
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 100,
    height: 100,
    backgroundColor: "#007AFF",
    borderRadius: 12,
  },
});
```

### 滑动删除

```typescript
// src/components/gestures/SwipeableCard.tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

interface SwipeableCardProps {
  title: string;
  onDelete: () => void;
}

export function SwipeableCard({ title, onDelete }: SwipeableCardProps) {
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(80);
  const startX = useSharedValue(0);

  const THRESHOLD = -100;

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      // 只允许左滑
      translateX.value = Math.min(0, startX.value + event.translationX);
    })
    .onEnd(() => {
      if (translateX.value < THRESHOLD) {
        // 删除动画
        translateX.value = withTiming(-400);
        itemHeight.value = withTiming(0, undefined, () => {
          runOnJS(onDelete)();
        });
      } else {
        // 回弹
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    height: itemHeight.value,
  }));

  const deleteStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-200, -50, 0],
      [1, 0.5, 0],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.deleteAction, deleteStyle]}>
        <TouchableOpacity onPress={onDelete}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
      
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.card, animatedStyle]}>
          <Text style={styles.title}>{title}</Text>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    marginBottom: 8,
  },
  deleteAction: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteText: {
    color: "white",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "white",
    padding: 16,
    height: 80,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
  },
});
```

### 列表动画

```typescript
// src/components/ui/AnimatedList.tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  FadeInDown,
  FadeOutUp,
  Layout,
} from "react-native-reanimated";
import { FlatList, View, Text, StyleSheet } from "react-native";
import { useState } from "react";

interface Item {
  id: string;
  title: string;
}

interface AnimatedListProps {
  data: Item[];
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function AnimatedList({ data }: AnimatedListProps) {
  const [items, setItems] = useState(data);

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const renderItem = ({ item, index }: { item: Item; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      exiting={FadeOutUp}
      layout={Layout.springify()}
      style={styles.item}
    >
      <Text style={styles.text}>{item.title}</Text>
      <AnimatedTouchable
        onPress={() => removeItem(item.id)}
        style={styles.deleteBtn}
      >
        <Text style={styles.deleteText}>×</Text>
      </AnimatedTouchable>
    </Animated.View>
  );

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  text: {
    fontSize: 16,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
```

### 底部弹出框

```typescript
// src/components/ui/BottomSheet.tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { View, Text, StyleSheet, Dimensions, Pressable } from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_TRANSLATE_Y = -SCREEN_HEIGHT * 0.8;

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, children }: BottomSheetProps) {
  const translateY = useSharedValue(0);
  const context = useSharedValue({ y: 0 });

  const scrollTo = (destination: number) => {
    "worklet";
    translateY.value = withSpring(destination, { damping: 50 });
  };

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      translateY.value = Math.max(
        event.translationY + context.value.y,
        MAX_TRANSLATE_Y
      );
    })
    .onEnd(() => {
      if (translateY.value > -SCREEN_HEIGHT * 0.3) {
        scrollTo(0);
        runOnJS(onClose)();
      } else {
        scrollTo(MAX_TRANSLATE_Y);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const borderRadius = interpolate(
      translateY.value,
      [MAX_TRANSLATE_Y, 0],
      [24, 0],
      Extrapolation.CLAMP
    );

    return {
      borderRadius,
      transform: [{ translateY: translateY.value }],
    };
  });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [0, MAX_TRANSLATE_Y],
      [0, 0.5],
      Extrapolation.CLAMP
    ),
  }));

  useEffect(() => {
    if (isOpen) {
      scrollTo(MAX_TRANSLATE_Y);
    } else {
      scrollTo(0);
    }
  }, [isOpen]);

  return (
    <>
      <Pressable onPress={onClose} style={styles.backdrop}>
        <Animated.View style={[styles.backdropLayer, backdropStyle]} />
      </Pressable>
      
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.container, animatedStyle]}>
          <View style={styles.line} />
          {children}
        </Animated.View>
      </GestureDetector>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropLayer: {
    flex: 1,
    backgroundColor: "black",
  },
  container: {
    position: "absolute",
    top: SCREEN_HEIGHT,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: "white",
  },
  line: {
    width: 75,
    height: 4,
    backgroundColor: "grey",
    alignSelf: "center",
    marginVertical: 15,
    borderRadius: 2,
  },
});
```

### 自定义 Hook

```typescript
// src/hooks/useAnimatedValue.ts
import { useSharedValue, withTiming, withSpring } from "react-native-reanimated";
import { useEffect } from "react";

export function useAnimatedValue(
  targetValue: number,
  config?: {
    type?: "timing" | "spring";
    duration?: number;
    damping?: number;
    stiffness?: number;
  }
) {
  const value = useSharedValue(0);

  useEffect(() => {
    if (config?.type === "spring") {
      value.value = withSpring(targetValue, {
        damping: config.damping ?? 15,
        stiffness: config.stiffness ?? 150,
      });
    } else {
      value.value = withTiming(targetValue, {
        duration: config?.duration ?? 300,
      });
    }
  }, [targetValue]);

  return value;
}

// src/hooks/useMount.ts
import { useEffect } from "react";

export function useMount(callback: () => void) {
  useEffect(() => {
    callback();
  }, []);
}
```

## 最佳实践

### 1. 性能优化

```typescript
// ✅ 使用 useDerivedValue 处理计算
import Animated, {
  useSharedValue,
  useDerivedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

export function OptimizedComponent() {
  const x = useSharedValue(0);
  
  // 计算在 UI 线程
  const opacity = useDerivedValue(() => {
    return Math.abs(x.value) / 100;
  });
  
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: x.value }],
  }));
  
  return <Animated.View style={style} />;
}
```

### 2. 动画配置

```typescript
// 统一的动画配置
export const ANIMATION_CONFIG = {
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  timing: {
    duration: 300,
  },
  rubberBand: {
    damping: 20,
    stiffness: 200,
  },
};

// 使用
scale.value = withSpring(0.9, ANIMATION_CONFIG.spring);
```

### 3. Worklets

```typescript
// 必须使用 "worklet" 指令
function logValue(value: number) {
  "worklet";
  console.log(value);
}

// 在 UI 线程执行
useDerivedValue(() => {
  logValue(x.value); // ✅ OK
  // console.log(x.value); // ❌ 会在 UI 线程报错
});
```

### 4. 交互隔离

```typescript
// 手势和动画分离
export function OptimizedGesture() {
  const scale = useSharedValue(1);
  
  // 手势处理
  const gesture = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(0.95);
    })
    .onFinalize(() => {
      scale.value = withSpring(1);
    });
  
  // 样式计算
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={style} />
    </GestureDetector>
  );
}
```

## 常用命令

```bash
# 安装依赖
npm install react-native-reanimated react-native-gesture-handler
# 或
yarn add react-native-reanimated react-native-gesture-handler

# iOS pod install
cd ios && pod install

# 清除缓存
npx react-native start --reset-cache

# 运行
npx react-native run-ios
npx react-native run-android

# 类型检查
npx tsc --noEmit

# Flipper 调试 (查看动画)
# 在 Flipper 中安装 Reanimated 插件
```

## 部署配置

### Metro 配置

```javascript
// metro.config.js
const { getDefaultConfig } = require("metro-config");

module.exports = (async () => {
  const {
    resolver: { sourceExts },
  } = await getDefaultConfig();
  return {
    transformer: {
      babelTransformerPath: require.resolve("react-native-svg-transformer"),
    },
    resolver: {
      sourceExts: [...sourceExts, "svg"],
    },
  };
})();
```

### Android 配置

```gradle
// android/app/build.gradle
android {
    // ...
    
    // 启用 Hermes
    project.ext.react = [
        enableHermes: true
    ]
}

dependencies {
    implementation project(':react-native-reanimated')
}
```

### iOS 配置

```ruby
# ios/Podfile
target 'YourApp' do
  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => true
  )
  
  pod 'RNReanimated', :path => '../node_modules/react-native-reanimated'
end
```

### 性能监控

```typescript
// 使用 useAnimatedReaction 监控
import { useAnimatedReaction, runOnJS } from "react-native-reanimated";

function PerformanceMonitor() {
  const value = useSharedValue(0);

  useAnimatedReaction(
    () => value.value,
    (result, previous) => {
      if (result !== previous) {
        runOnJS(console.log)("Value changed:", result);
      }
    }
  );
}
```
