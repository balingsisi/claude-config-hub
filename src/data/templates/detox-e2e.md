# Detox React Native 端到端测试模板

## 技术栈

- **测试框架**: Detox 20.x
- **运行环境**: iOS Simulator / Android Emulator
- **测试运行器**: Jest
- **应用框架**: React Native
- **状态管理**: Redux / MobX / Zustand
- **导航**: React Navigation
- **语言**: TypeScript

## 项目结构

```
detox-e2e/
├── e2e/
│   ├── tests/              # 测试文件
│   │   ├── auth/
│   │   │   ├── login.test.ts
│   │   │   ├── register.test.ts
│   │   │   └── logout.test.ts
│   │   ├── navigation/
│   │   │   └── tabs.test.ts
│   │   ├── features/
│   │   │   ├── search.test.ts
│   │   │   └── profile.test.ts
│   │   └── smoke/
│   │       └── app-launch.test.ts
│   ├── utils/              # 测试工具
│   │   ├── helpers.ts
│   │   ├── assertions.ts
│   │   └── actions.ts
│   ├── page-objects/       # 页面对象模型
│   │   ├── LoginPage.ts
│   │   ├── HomePage.ts
│   │   └── ProfilePage.ts
│   ├── config/
│   │   ├── ios.config.ts
│   │   └── android.config.ts
│   ├── setup.ts            # 全局设置
│   ├── init.ts             # 初始化
│   └── jest.config.js      # Jest 配置
├── src/
│   ├── components/         # React Native 组件
│   ├── screens/            # 屏幕组件
│   ├── navigation/         # 导航配置
│   ├── store/              # 状态管理
│   ├── services/           # 服务
│   └── App.tsx
├── android/                # Android 原生代码
├── ios/                    # iOS 原生代码
├── .detoxrc.js             # Detox 配置
├── detox.config.js         # Detox 配置
├── package.json
└── tsconfig.json
```

## 代码模式

### 1. Detox 配置

```javascript
// .detoxrc.js
/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      '$0': 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/MyApp.app',
      build: 'xcodebuild -workspace ios/MyApp.xcworkspace -scheme MyApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/MyApp.app',
      build: 'xcodebuild -workspace ios/MyApp.xcworkspace -scheme MyApp -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [8081],
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release',
    },
  },
  
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15',
      },
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_API_33',
      },
    },
  },
  
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.release',
    },
  },
};
```

```javascript
// e2e/jest.config.js
module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.test.ts'],
  testTimeout: 120000,
  setupFiles: ['<rootDir>/e2e/setup.ts'],
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  verbose: true,
};
```

```typescript
// e2e/setup.ts
import { device } from 'detox';

beforeAll(async () => {
  await device.launchApp({
    newInstance: true,
    permissions: {
      notifications: 'YES',
      camera: 'YES',
      microphone: 'YES',
      location: 'always',
    },
  });
});

beforeEach(async () => {
  await device.reloadReactNative();
});

afterAll(async () => {
  await device.terminateApp();
});
```

### 2. 页面对象模型 (Page Object Model)

```typescript
// e2e/page-objects/LoginPage.ts
import { by, element, expect as detoxExpect } from 'detox';

export class LoginPage {
  // 元素定位器
  private emailInput = element(by.id('email-input'));
  private passwordInput = element(by.id('password-input'));
  private loginButton = element(by.id('login-button'));
  private errorMessage = element(by.id('error-message'));
  private forgotPasswordLink = element(by.id('forgot-password-link'));
  private registerLink = element(by.id('register-link'));
  
  // 操作方法
  async enterEmail(email: string) {
    await this.emailInput.replaceText(email);
  }
  
  async enterPassword(password: string) {
    await this.passwordInput.replaceText(password);
  }
  
  async tapLoginButton() {
    await this.loginButton.tap();
  }
  
  async login(email: string, password: string) {
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.tapLoginButton();
  }
  
  async tapForgotPassword() {
    await this.forgotPasswordLink.tap();
  }
  
  async tapRegister() {
    await this.registerLink.tap();
  }
  
  // 断言方法
  async assertPageVisible() {
    await detoxExpect(this.emailInput).toBeVisible();
    await detoxExpect(this.passwordInput).toBeVisible();
    await detoxExpect(this.loginButton).toBeVisible();
  }
  
  async assertErrorMessage(message: string) {
    await detoxExpect(this.errorMessage).toHaveText(message);
  }
  
  async assertLoginButtonDisabled() {
    await detoxExpect(this.loginButton).toBeNotVisible();
  }
}

export const loginPage = new LoginPage();

// e2e/page-objects/HomePage.ts
import { by, element, expect as detoxExpect } from 'detox';

export class HomePage {
  private welcomeMessage = element(by.id('welcome-message'));
  private searchInput = element(by.id('search-input'));
  private productList = element(by.id('product-list'));
  private tabBar = element(by.id('tab-bar'));
  
  async assertPageVisible() {
    await detoxExpect(this.welcomeMessage).toBeVisible();
  }
  
  async search(query: string) {
    await this.searchInput.replaceText(query);
    await this.searchInput.tapReturnKey();
  }
  
  async tapProductAtIndex(index: number) {
    const product = element(by.id(`product-item-${index}`));
    await product.tap();
  }
  
  async scrollToBottom() {
    await this.productList.scrollTo('bottom');
  }
  
  async assertProductCount(count: number) {
    // 自定义断言逻辑
  }
}

export const homePage = new HomePage();

// e2e/page-objects/ProfilePage.ts
import { by, element, expect as detoxExpect } from 'detox';

export class ProfilePage {
  private profileImage = element(by.id('profile-image'));
  private userName = element(by.id('user-name'));
  private userEmail = element(by.id('user-email'));
  private editButton = element(by.id('edit-profile-button'));
  private logoutButton = element(by.id('logout-button'));
  
  async assertPageVisible() {
    await detoxExpect(this.profileImage).toBeVisible();
    await detoxExpect(this.userName).toBeVisible();
  }
  
  async tapEditProfile() {
    await this.editButton.tap();
  }
  
  async tapLogout() {
    await this.logoutButton.tap();
  }
  
  async assertUserName(name: string) {
    await detoxExpect(this.userName).toHaveText(name);
  }
  
  async assertUserEmail(email: string) {
    await detoxExpect(this.userEmail).toHaveText(email);
  }
}

export const profilePage = new ProfilePage();
```

### 3. 测试用例

```typescript
// e2e/tests/auth/login.test.ts
import { device, element, by, expect as detoxExpect } from 'detox';
import { loginPage } from '../../page-objects/LoginPage';
import { homePage } from '../../page-objects/HomePage';

describe('Login Flow', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    // 导航到登录页面
    await element(by.id('navigate-to-login')).tap();
  });
  
  it('should display login form', async () => {
    await loginPage.assertPageVisible();
  });
  
  it('should login successfully with valid credentials', async () => {
    await loginPage.login('test@example.com', 'password123');
    
    // 等待登录成功并跳转到首页
    await homePage.assertPageVisible();
  });
  
  it('should show error for invalid credentials', async () => {
    await loginPage.login('invalid@example.com', 'wrongpassword');
    
    await loginPage.assertErrorMessage('Invalid email or password');
  });
  
  it('should show error for empty email', async () => {
    await loginPage.enterPassword('password123');
    await loginPage.tapLoginButton();
    
    await loginPage.assertErrorMessage('Email is required');
  });
  
  it('should show error for invalid email format', async () => {
    await loginPage.enterEmail('invalid-email');
    await loginPage.enterPassword('password123');
    await loginPage.tapLoginButton();
    
    await loginPage.assertErrorMessage('Invalid email format');
  });
  
  it('should navigate to forgot password screen', async () => {
    await loginPage.tapForgotPassword();
    
    await detoxExpect(element(by.id('forgot-password-screen'))).toBeVisible();
  });
  
  it('should navigate to register screen', async () => {
    await loginPage.tapRegister();
    
    await detoxExpect(element(by.id('register-screen'))).toBeVisible();
  });
  
  it('should handle biometric authentication', async () => {
    // 模拟生物识别
    await device.setBiometricEnrollment(true);
    await loginPage.tapBiometricButton();
    await device.matchFace();
    
    await homePage.assertPageVisible();
  });
});

// e2e/tests/auth/register.test.ts
import { device, element, by, expect as detoxExpect } from 'detox';

describe('Registration Flow', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.id('navigate-to-register')).tap();
  });
  
  it('should register successfully', async () => {
    await element(by.id('name-input')).replaceText('John Doe');
    await element(by.id('email-input')).replaceText('john@example.com');
    await element(by.id('password-input')).replaceText('password123');
    await element(by.id('confirm-password-input')).replaceText('password123');
    
    await element(by.id('register-button')).tap();
    
    // 等待注册成功
    await detoxExpect(element(by.id('registration-success'))).toBeVisible();
  });
  
  it('should show error for mismatched passwords', async () => {
    await element(by.id('name-input')).replaceText('John Doe');
    await element(by.id('email-input')).replaceText('john@example.com');
    await element(by.id('password-input')).replaceText('password123');
    await element(by.id('confirm-password-input')).replaceText('password456');
    
    await element(by.id('register-button')).tap();
    
    await detoxExpect(element(by.id('error-message'))).toHaveText('Passwords do not match');
  });
  
  it('should validate email format', async () => {
    await element(by.id('name-input')).replaceText('John Doe');
    await element(by.id('email-input')).replaceText('invalid-email');
    await element(by.id('password-input')).replaceText('password123');
    await element(by.id('confirm-password-input')).replaceText('password123');
    
    await element(by.id('register-button')).tap();
    
    await detoxExpect(element(by.id('error-message'))).toHaveText('Invalid email format');
  });
  
  it('should accept terms and conditions', async () => {
    await element(by.id('terms-checkbox')).tap();
    
    await detoxExpect(element(by.id('terms-checkbox'))).toHaveToggleValue(true);
  });
});

// e2e/tests/navigation/tabs.test.ts
import { device, element, by, expect as detoxExpect } from 'detox';

describe('Tab Navigation', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });
  
  it('should switch between tabs', async () => {
    // 首页标签
    await element(by.id('tab-home')).tap();
    await detoxExpect(element(by.id('home-screen'))).toBeVisible();
    
    // 搜索标签
    await element(by.id('tab-search')).tap();
    await detoxExpect(element(by.id('search-screen'))).toBeVisible();
    
    // 个人中心标签
    await element(by.id('tab-profile')).tap();
    await detoxExpect(element(by.id('profile-screen'))).toBeVisible();
  });
  
  it('should maintain tab state after navigation', async () => {
    // 导航到搜索页面
    await element(by.id('tab-search')).tap();
    await element(by.id('search-input')).replaceText('test query');
    
    // 切换到个人中心
    await element(by.id('tab-profile')).tap();
    
    // 返回搜索页面
    await element(by.id('tab-search')).tap();
    
    // 验证搜索内容仍然存在
    await detoxExpect(element(by.id('search-input'))).toHaveText('test query');
  });
});

// e2e/tests/features/search.test.ts
import { device, element, by, expect as detoxExpect } from 'detox';

describe('Search Feature', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.id('tab-search')).tap();
  });
  
  it('should search for products', async () => {
    await element(by.id('search-input')).replaceText('iPhone');
    await element(by.id('search-input')).tapReturnKey();
    
    // 等待搜索结果
    await detoxExpect(element(by.id('search-results'))).toBeVisible();
    
    // 验证结果包含搜索关键词
    await detoxExpect(element(by.text('iPhone'))).toBeVisible();
  });
  
  it('should show empty state for no results', async () => {
    await element(by.id('search-input')).replaceText('xyz123nonexistent');
    await element(by.id('search-input')).tapReturnKey();
    
    await detoxExpect(element(by.id('empty-state'))).toBeVisible();
    await detoxExpect(element(by.text('No results found'))).toBeVisible();
  });
  
  it('should filter search results', async () => {
    await element(by.id('search-input')).replaceText('iPhone');
    await element(by.id('search-input')).tapReturnKey();
    
    // 打开筛选器
    await element(by.id('filter-button')).tap();
    
    // 选择价格范围
    await element(by.id('price-range-min')).replaceText('500');
    await element(by.id('price-range-max')).replaceText('1000');
    
    // 应用筛选
    await element(by.id('apply-filter-button')).tap();
    
    // 验证筛选结果
    await detoxExpect(element(by.id('search-results'))).toBeVisible();
  });
  
  it('should sort search results', async () => {
    await element(by.id('search-input')).replaceText('iPhone');
    await element(by.id('search-input')).tapReturnKey();
    
    // 打开排序选项
    await element(by.id('sort-button')).tap();
    
    // 选择价格从低到高
    await element(by.text('Price: Low to High')).tap();
    
    // 验证排序结果
    await detoxExpect(element(by.id('search-results'))).toBeVisible();
  });
});

// e2e/tests/smoke/app-launch.test.ts
import { device, element, by, expect as detoxExpect } from 'detox';

describe('App Launch', () => {
  it('should launch app successfully', async () => {
    await device.launchApp({
      newInstance: true,
    });
    
    // 等待应用启动
    await detoxExpect(element(by.id('root-view'))).toBeVisible();
  });
  
  it('should show onboarding for first launch', async () => {
    await device.launchApp({
      newInstance: true,
      delete: true, // 清除应用数据
    });
    
    await detoxExpect(element(by.id('onboarding-screen'))).toBeVisible();
  });
  
  it('should handle deep links', async () => {
    await device.launchApp({
      newInstance: false,
      url: 'myapp://product/123',
    });
    
    await detoxExpect(element(by.id('product-detail-screen'))).toBeVisible();
    await detoxExpect(element(by.id('product-id'))).toHaveText('123');
  });
  
  it('should handle notifications', async () => {
    // 模拟推送通知
    await device.launchApp({
      newInstance: false,
      userNotification: {
        trigger: {
          type: 'push',
        },
        title: 'New Message',
        body: 'You have a new message',
        payload: {
          messageId: '123',
        },
      },
    });
    
    await detoxExpect(element(by.id('notification-banner'))).toBeVisible();
  });
});
```

### 4. 测试工具函数

```typescript
// e2e/utils/helpers.ts
import { device, element, by, expect as detoxExpect } from 'detox';

export const helpers = {
  // 等待元素可见
  async waitForElement(elementId: string, timeout: number = 10000) {
    await waitFor(element(by.id(elementId)))
      .toBeVisible()
      .withTimeout(timeout);
  },
  
  // 等待元素消失
  async waitForElementToDisappear(elementId: string, timeout: number = 10000) {
    await waitFor(element(by.id(elementId)))
      .toBeNotVisible()
      .withTimeout(timeout);
  },
  
  // 滚动到元素
  async scrollToElement(scrollViewId: string, elementId: string, direction: 'up' | 'down' = 'down') {
    await waitFor(element(by.id(elementId)))
      .toBeVisible()
      .whileElement(by.id(scrollViewId))
      .scroll(100, direction);
  },
  
  // 输入文本并提交
  async inputTextAndSubmit(inputId: string, text: string) {
    await element(by.id(inputId)).replaceText(text);
    await element(by.id(inputId)).tapReturnKey();
  },
  
  // 多次点击
  async tapMultipleTimes(elementId: string, times: number) {
    for (let i = 0; i < times; i++) {
      await element(by.id(elementId)).tap();
    }
  },
  
  // 滑动删除
  async swipeToDelete(elementId: string) {
    await element(by.id(elementId)).swipe('left', 'fast', 0.8);
    await element(by.text('Delete')).tap();
  },
  
  // 截图
  async takeScreenshot(name: string) {
    await device.takeScreenshot(name);
  },
  
  // 模拟网络延迟
  async simulateNetworkDelay(ms: number) {
    await new Promise(resolve => setTimeout(resolve, ms));
  },
  
  // 检查平台
  isIOS() {
    return device.getPlatform() === 'ios';
  },
  
  isAndroid() {
    return device.getPlatform() === 'android';
  },
};

// e2e/utils/assertions.ts
import { element, by, expect as detoxExpect } from 'detox';

export const assertions = {
  async assertElementVisible(elementId: string) {
    await detoxExpect(element(by.id(elementId))).toBeVisible();
  },
  
  async assertElementNotVisible(elementId: string) {
    await detoxExpect(element(by.id(elementId))).toBeNotVisible();
  },
  
  async assertElementText(elementId: string, text: string) {
    await detoxExpect(element(by.id(elementId))).toHaveText(text);
  },
  
  async assertElementValue(elementId: string, value: string) {
    await detoxExpect(element(by.id(elementId))).toHaveValue(value);
  },
  
  async assertElementToggleValue(elementId: string, value: boolean) {
    await detoxExpect(element(by.id(elementId))).toHaveToggleValue(value);
  },
  
  async assertElementExist(elementId: string) {
    await detoxExpect(element(by.id(elementId))).toExist();
  },
  
  async assertElementNotExists(elementId: string) {
    await detoxExpect(element(by.id(elementId))).toNotExist();
  },
  
  async assertElementFocused(elementId: string) {
    await detoxExpect(element(by.id(elementId))).toBeFocused();
  },
};

// e2e/utils/actions.ts
import { device, element, by } from 'detox';

export const actions = {
  async tap(elementId: string) {
    await element(by.id(elementId)).tap();
  },
  
  async tapAtPoint(elementId: string, x: number, y: number) {
    await element(by.id(elementId)).tapAtPoint({ x, y });
  },
  
  async longPress(elementId: string) {
    await element(by.id(elementId)).longPress();
  },
  
  async multiTap(elementId: string, times: number) {
    await element(by.id(elementId)).multiTap(times);
  },
  
  async typeText(elementId: string, text: string) {
    await element(by.id(elementId)).typeText(text);
  },
  
  async replaceText(elementId: string, text: string) {
    await element(by.id(elementId)).replaceText(text);
  },
  
  async clearText(elementId: string) {
    await element(by.id(elementId)).clearText();
  },
  
  async swipe(elementId: string, direction: 'up' | 'down' | 'left' | 'right', speed: 'fast' | 'slow' = 'fast', percentage: number = 0.75) {
    await element(by.id(elementId)).swipe(direction, speed, percentage);
  },
  
  async scroll(elementId: string, direction: 'up' | 'down' | 'left' | 'right', distanceInPixels: number = 200) {
    await element(by.id(elementId)).scroll(distanceInPixels, direction);
  },
  
  async scrollTo(edge: 'top' | 'bottom' | 'left' | 'right', elementId: string) {
    await element(by.id(elementId)).scrollTo(edge);
  },
  
  async pinch(elementId: string, direction: 'outward' | 'inward', speed: 'fast' | 'slow' = 'fast', angle: number = 0) {
    await element(by.id(elementId)).pinchWithAngle(direction, speed, angle);
  },
  
  async back() {
    await device.pressBack();
  },
  
  async shake() {
    await device.shake();
  },
};
```

### 5. React Native 组件添加 testID

```typescript
// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, Text, TouchableOpacity } from 'react-native';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const handleLogin = async () => {
    try {
      // 登录逻辑
    } catch (err) {
      setError('Invalid email or password');
    }
  };
  
  return (
    <View testID="login-screen">
      <TextInput
        testID="email-input"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <TextInput
        testID="password-input"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      {error && (
        <Text testID="error-message">{error}</Text>
      )}
      
      <Button
        testID="login-button"
        title="Login"
        onPress={handleLogin}
        disabled={!email || !password}
      />
      
      <TouchableOpacity
        testID="forgot-password-link"
        onPress={() => {}}
      >
        <Text>Forgot Password?</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        testID="register-link"
        onPress={() => {}}
      >
        <Text>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
};

// src/components/ProductCard.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
  onPress: () => void;
}

export const ProductCard = ({ product, onPress }: ProductCardProps) => {
  return (
    <TouchableOpacity
      testID={`product-item-${product.id}`}
      onPress={onPress}
    >
      <Image
        testID={`product-image-${product.id}`}
        source={{ uri: product.image }}
        style={{ width: 100, height: 100 }}
      />
      
      <Text testID={`product-name-${product.id}`}>
        {product.name}
      </Text>
      
      <Text testID={`product-price-${product.id}`}>
        ${product.price}
      </Text>
    </TouchableOpacity>
  );
};
```

## 最佳实践

### 1. 页面对象模式
- 使用 POM 封装页面逻辑
- 提高测试可维护性
- 减少代码重复

### 2. testID 命名规范
- 使用描述性的 testID
- 保持一致的命名规范
- 避免使用动态 testID

### 3. 测试独立性
- 每个测试独立运行
- 不依赖其他测试
- 使用 beforeEach 重置状态

### 4. 等待策略
- 使用显式等待
- 避免固定延迟
- 合理设置超时时间

### 5. 错误处理
- 捕获并报告错误
- 提供清晰的错误信息
- 截图保存失败状态

### 6. 平台差异
- 处理 iOS 和 Android 差异
- 使用条件判断
- 避免平台特定假设

## 常用命令

```bash
# 安装依赖
npm install detox detox-cli --dev

# 初始化 Detox
detox init

# 构建 iOS 应用
detox build -c ios.sim.debug

# 构建 Android 应用
detox build -c android.emu.debug

# 运行 iOS 测试
detox test -c ios.sim.debug

# 运行 Android 测试
detox test -c android.emu.debug

# 运行特定测试文件
detox test e2e/tests/auth/login.test.ts -c ios.sim.debug

# 运行特定测试用例
detox test -c ios.sim.debug --grep "should login successfully"

# 清理缓存
detox clean-framework-cache

# 重置模拟器
detox reset-lock-file-ios

# 查看 Detox 配置
detox config

# 录制测试视频
detox test -c ios.sim.debug --record-videos all

# 生成覆盖率报告
detox test -c ios.sim.debug --coverage
```

## 部署配置

### Package.json

```json
{
  "scripts": {
    "detox:build:ios": "detox build -c ios.sim.debug",
    "detox:build:android": "detox build -c android.emu.debug",
    "detox:test:ios": "detox test -c ios.sim.debug",
    "detox:test:android": "detox test -c android.emu.debug",
    "detox:test:ios:release": "detox test -c ios.sim.release",
    "detox:test:android:release": "detox test -c android.emu.release"
  },
  "devDependencies": {
    "detox": "^20.0.0",
    "detox-cli": "^20.0.0",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  }
}
```

### CI/CD (GitHub Actions)

```yaml
# .github/workflows/detox.yml
name: Detox E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ios:
    runs-on: macos-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install applesimutils
        run: |
          brew tap wix/brew
          brew install applesimutils
      
      - name: Build iOS app
        run: npm run detox:build:ios
      
      - name: Run iOS tests
        run: npm run detox:test:ios
      
      - name: Upload artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: detox-artifacts-ios
          path: |
            artifacts/
  
  android:
    runs-on: macos-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build Android app
        run: npm run detox:build:android
      
      - name: Run Android tests
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 33
          arch: x86_64
          profile: pixel_6
          script: npm run detox:test:android
      
      - name: Upload artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: detox-artifacts-android
          path: |
            artifacts/
```

### Detox Artifacts 配置

```javascript
// .detoxrc.js
module.exports = {
  // ... 其他配置
  
  artifacts: {
    rootDir: './artifacts',
    pathBuilder: ({ testRunDirectory, testSummary }) => {
      const { testName, testStatus } = testSummary;
      return `${testRunDirectory}/${testName}_${testStatus}`;
    },
    plugins: {
      log: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: true,
      },
      screenshot: {
        enabled: true,
        shouldTakeAutomaticSnapshots: true,
        keepOnlyFailedTestsArtifacts: true,
        takeWhen: {
          testStart: true,
          testDone: true,
          appNotReady: true,
        },
      },
      video: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: true,
        android: {
          bitRate: 4000000,
        },
        ios: {
          codec: 'h264',
          quality: 'medium',
        },
      },
      instruments: {
        enabled: false,
      },
    },
  },
};
```

## 总结

Detox 提供了：
✅ 真实的端到端测试
✅ iOS 和 Android 支持
✅ 灰盒测试能力
✅ 与 React Native 深度集成
✅ 自动同步机制
✅ 丰富的 API

适用场景：
- React Native 应用测试
- 端到端测试
- 用户流程测试
- 回归测试
- CI/CD 集成
- 自动化测试
