# React Navigation 7 Template

## 技术栈

- **核心**: @react-navigation/native ^7.x
- **导航器**: @react-navigation/native-stack, @react-navigation/bottom-tabs, @react-navigation/drawer
- **原生依赖**: react-native-screens, react-native-safe-area-context, react-native-gesture-handler
- **类型安全**: TypeScript + 类型化导航
- **状态管理**: React Context / Zustand

## 项目结构

```
react-navigation-app/
├── src/
│   ├── navigation/
│   │   ├── RootNavigator.tsx    # 根导航器
│   │   ├── AuthNavigator.tsx    # 认证流程
│   │   ├── MainNavigator.tsx    # 主应用流程
│   │   ├── TabNavigator.tsx     # 底部标签
│   │   └── types.ts             # 导航类型定义
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── DetailsScreen.tsx
│   │   └── auth/
│   │       ├── LoginScreen.tsx
│   │       └── RegisterScreen.tsx
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── TabBar.tsx
│   │   └── BackButton.tsx
│   ├── hooks/
│   │   ├── useNavigation.ts
│   │   └── useDeepLink.ts
│   └── App.tsx
├── app.json
├── package.json
└── tsconfig.json
```

## 代码模式

### 类型定义

```typescript
// navigation/types.ts
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: { referralCode?: string };
  ForgotPassword: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  Profile: { userId: string };
  Settings: undefined;
  Details: { id: number; title: string };
};

export type TabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  ProfileTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
  Onboarding: undefined;
};

// 类型化的 props
export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'HomeTab'>,
  NativeStackScreenProps<MainStackParamList>
>;

// 全局导航类型
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
```

### 根导航器

```typescript
// navigation/RootNavigator.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer
      linking={linking}
      theme={theme}
      onStateChange={onStateChange}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      >
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// 深度链接配置
const linking = {
  prefixes: ['myapp://', 'https://myapp.com'],
  config: {
    screens: {
      Main: {
        screens: {
          Home: 'home',
          Profile: 'profile/:userId',
          Details: 'details/:id',
        },
      },
      Auth: {
        screens: {
          Login: 'login',
          Register: 'register',
        },
      },
    },
  },
};
```

### 认证导航器

```typescript
// navigation/AuthNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1a1a2e' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        cardStyle: { backgroundColor: '#1a1a2e' },
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: '创建账户' }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ title: '找回密码' }}
      />
    </Stack.Navigator>
  );
}
```

### 底部标签导航

```typescript
// navigation/TabNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            HomeTab: 'home',
            SearchTab: 'search',
            ProfileTab: 'person',
            SettingsTab: 'settings',
          };
          
          return (
            <Ionicons
              name={icons[route.name]}
              size={size}
              color={focused ? '#3b82f6' : color}
            />
          );
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          elevation: 20,
          shadowOpacity: 0.1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: '首页' }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchScreen}
        options={{ tabBarLabel: '搜索' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: '我的' }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{ tabBarLabel: '设置' }}
      />
    </Tab.Navigator>
  );
}
```

### 抽屉导航

```typescript
// navigation/DrawerNavigator.tsx
import { createDrawerNavigator } from '@react-navigation/drawer';
import { DrawerContent } from '../components/DrawerContent';
import { HomeScreen } from '../screens/HomeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Drawer = createDrawerNavigator();

export function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        drawerType: 'front',
        drawerPosition: 'left',
        drawerStyle: {
          backgroundColor: '#1a1a2e',
          width: 280,
        },
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        headerShown: false,
        drawerActiveBackgroundColor: '#3b82f6',
        drawerActiveTintColor: '#fff',
        drawerInactiveTintColor: '#94a3b8',
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          drawerLabel: '首页',
          drawerIcon: ({ color }) => <Ionicons name="home" color={color} />,
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          drawerLabel: '设置',
          drawerIcon: ({ color }) => <Ionicons name="settings" color={color} />,
        }}
      />
    </Drawer.Navigator>
  );
}
```

### 导航 Hooks

```typescript
// hooks/useNavigation.ts
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function useAppNavigation() {
  const navigation = useNavigation<Navigation>();
  return navigation;
}

// 使用示例
function useProfileNavigation() {
  const navigation = useAppNavigation();
  
  const goToProfile = (userId: string) => {
    navigation.navigate('Main', {
      screen: 'Profile',
      params: { userId },
    });
  };
  
  return { goToProfile };
}

// 深度链接处理
export function useDeepLink() {
  const navigation = useNavigation();
  const linking = useLinking();
  
  useEffect(() => {
    const unsubscribe = linking.addEventListener('url', ({ url }) => {
      // 处理深链接
      console.log('Deep link:', url);
    });
    
    return unsubscribe;
  }, [linking]);
}
```

### 屏幕示例

```typescript
// screens/HomeScreen.tsx
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Home'>;

export function HomeScreen({ navigation, route }: Props) {
  const handleNavigate = () => {
    navigation.navigate('Details', {
      id: 123,
      title: '示例标题',
    });
  };

  return (
    <View style={styles.container}>
      <Text>首页</Text>
      <Button title="查看详情" onPress={handleNavigate} />
      <Button
        title="返回"
        onPress={() => navigation.goBack()}
      />
      <Button
        title="返回首页"
        onPress={() => navigation.popToTop()}
      />
    </View>
  );
}

// 嵌套导航示例
export function ProfileScreen({ navigation }: Props) {
  const goToTab = () => {
    // 跨导航器导航
    navigation.navigate('HomeTab', {
      screen: 'Details',
      params: { id: 456 },
    });
  };
  
  return (
    <View>
      <Button title="切换到详情标签" onPress={goToTab} />
    </View>
  );
}
```

## 最佳实践

### 1. 参数验证

```typescript
// utils/navigation.ts
import { ParamListBase } from '@react-navigation/native';

export function validateParams<T extends keyof ParamListBase>(
  route: string,
  params: any
): params is ParamListBase[T] {
  const validators: Record<string, (p: any) => boolean> = {
    Details: (p) => typeof p.id === 'number',
    Profile: (p) => typeof p.userId === 'string',
  };
  
  return validators[route]?.(params) ?? false;
}

// 使用
const params = route.params as DetailsParams;
if (!validateParams('Details', params)) {
  // 参数无效，处理错误
  return null;
}
```

### 2. 导航状态持久化

```typescript
// App.tsx
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PERSISTENCE_KEY = 'NAVIGATION_STATE';

export function App() {
  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState();

  useEffect(() => {
    const restoreState = async () => {
      try {
        const savedState = await AsyncStorage.getItem(PERSISTENCE_KEY);
        const state = savedState ? JSON.parse(savedState) : undefined;
        setInitialState(state);
      } finally {
        setIsReady(true);
      }
    };
    
    restoreState();
  }, []);

  if (!isReady) return <SplashScreen />;

  return (
    <NavigationContainer
      initialState={initialState}
      onStateChange={(state) => {
        AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state));
      }}
    >
      <RootNavigator />
    </NavigationContainer>
  );
}
```

### 3. 自定义转场动画

```typescript
// navigation/transitions.ts
import { CardStyleInterpolators } from '@react-navigation/native-stack';

export const customTransitions = {
  fade: {
    cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
  },
  slide: {
    cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  },
  scale: {
    cardStyleInterpolator: ({ current }) => ({
      cardStyle: {
        transform: [
          {
            scale: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.9, 1],
            }),
          },
        ],
      },
    }),
  },
  modal: {
    presentation: 'modal',
    cardStyleInterpolator: CardStyleInterpolators.forModalPresentationIOS,
  },
};

// 使用
<Stack.Navigator screenOptions={customTransitions.slide}>
  {/* ... */}
</Stack.Navigator>
```

### 4. 导航守卫

```typescript
// hooks/useAuthGuard.ts
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from './useAuth';

export function useAuthGuard() {
  const navigation = useNavigation();
  const route = useRoute();
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (!isAuthenticated && route.name !== 'Login') {
      // 未认证时重定向到登录
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth', params: { screen: 'Login' } }],
      });
    }
  }, [isAuthenticated, route.name]);
}

// 在需要认证的屏幕使用
function ProtectedScreen() {
  useAuthGuard();
  // ... 屏幕内容
}
```

## 常用命令

```bash
# 安装核心包
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context

# 底部标签和抽屉
npm install @react-navigation/bottom-tabs @react-navigation/drawer
npm install react-native-gesture-handler react-native-reanimated

# 类型定义
npm install -D @types/react-navigation

# 运行
npx react-native run-ios
npx react-native run-android

# 清理缓存
npx react-native start --reset-cache
```

## 部署配置

### iOS 配置

```xml
<!-- ios/MyApp/Info.plist -->
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>myapp</string>
    </array>
  </dict>
</array>
<key>LSApplicationQueriesSchemes</key>
<array>
  <string>itms-apps</string>
</array>
```

### Android 配置

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="myapp" />
</intent-filter>

<!-- 深链接 -->
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="https" android:host="myapp.com" />
</intent-filter>
```

### Expo 配置

```json
// app.json
{
  "expo": {
    "scheme": "myapp",
    "ios": {
      "associatedDomains": ["applinks:myapp.com"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [{ "scheme": "https", "host": "myapp.com" }],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### 测试配置

```typescript
// __tests__/navigation.test.tsx
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

function renderWithNavigation(component) {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Test" component={component} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

test('导航到详情页', () => {
  const { getByText } = renderWithNavigation(HomeScreen);
  fireEvent.press(getByText('查看详情'));
  // 验证导航行为
});
```
