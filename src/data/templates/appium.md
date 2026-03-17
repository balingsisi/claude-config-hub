# Appium Mobile Automation - Project Context

## Build & Test Commands
- `appium` - Start Appium server
- `appium-doctor` - Verify Appium setup
- `npm test` - Run all tests
- `npm run test:ios` - Run iOS tests
- `npm run test:android` - Run Android tests
- `npm run test:parallel` - Run tests in parallel
- `npm run lint` - Lint test code
- `allure serve` - Generate Allure report

## Code Style & Conventions
- JavaScript/TypeScript with WebdriverIO or Appium
- Page Object Model (POM) pattern
- Clear test descriptions using BDD (Given/When/Then)
- Explicit waits over implicit waits
- Descriptive element locators (accessibility ID preferred)
- Avoid hard-coded waits (use explicit waits)
- Keep tests independent and idempotent

## Architecture & Structure
```
project/
├── test/
│   ├── specs/              # Test specifications
│   │   ├── login.spec.ts
│   │   └── checkout.spec.ts
│   ├── pageobjects/        # Page Object Model
│   │   ├── base.page.ts
│   │   ├── login.page.ts
│   │   └── home.page.ts
│   └── helpers/            # Test utilities
│       ├── hooks.ts
│       └── utils.ts
├── config/
│   ├── wdio.ios.conf.ts    # iOS configuration
│   ├── wdio.android.conf.ts # Android configuration
│   └── wdio.shared.conf.ts  # Shared configuration
├── capabilities/           # Device capabilities
│   ├── ios.json
│   └── android.json
├── apps/                   # Mobile app binaries
│   ├── iOS/
│   └── Android/
└── reports/                # Test reports
    ├── allure/
    └── screenshots/
```

## Key Libraries & Tools
- `appium` - Core automation framework
- `webdriverio` - WebdriverIO test framework
- `@wdio/cli` - WDIO command-line interface
- `@wdio/mocha-framework` - Mocha test framework
- `@wdio/allure-reporter` - Allure reporting
- `@wdio/appium-service` - Appium integration
- `appium-doctor` - Setup verification
- `appium-desktop` - GUI for Appium
- `xcode` - iOS development (for iOS testing)
- `android-sdk` - Android SDK (for Android testing)

## Best Practices
- Use Page Object Model for maintainability
- Prefer accessibility IDs over XPath
- Implement explicit waits with ExpectedConditions
- Use data-driven testing for multiple scenarios
- Run tests on real devices and emulators/simulators
- Implement retry logic for flaky tests
- Take screenshots on test failures
- Use parallel execution for faster feedback
- Test on multiple OS versions
- Implement proper cleanup in after hooks

## Common Patterns

### Page Object Model
```typescript
// pageobjects/base.page.ts
export default class BasePage {
  protected driver: WebdriverIO.Browser;

  constructor(driver: WebdriverIO.Browser) {
    this.driver = driver;
  }

  async waitForElement(selector: string, timeout = 10000) {
    const element = await this.driver.$(selector);
    await element.waitForDisplayed({ timeout });
    return element;
  }

  async tap(selector: string) {
    const element = await this.waitForElement(selector);
    await element.click();
  }

  async enterText(selector: string, text: string) {
    const element = await this.waitForElement(selector);
    await element.clearValue();
    await element.setValue(text);
  }

  async getText(selector: string): Promise<string> {
    const element = await this.waitForElement(selector);
    return await element.getText();
  }
}
```

```typescript
// pageobjects/login.page.ts
import BasePage from './base.page';

class LoginPage extends BasePage {
  private USERNAME_INPUT = '~username-input';
  private PASSWORD_INPUT = '~password-input';
  private LOGIN_BUTTON = '~login-button';
  private ERROR_MESSAGE = '~error-message';

  async login(username: string, password: string) {
    await this.enterText(this.USERNAME_INPUT, username);
    await this.enterText(this.PASSWORD_INPUT, password);
    await this.tap(this.LOGIN_BUTTON);
  }

  async getErrorMessage(): Promise<string> {
    return await this.getText(this.ERROR_MESSAGE);
  }

  async isLoginButtonDisplayed(): Promise<boolean> {
    const button = await this.driver.$(this.LOGIN_BUTTON);
    return await button.isDisplayed();
  }
}

export default new LoginPage();
```

### Test Specification
```typescript
// specs/login.spec.ts
import LoginPage from '../pageobjects/login.page';
import { expect } from 'chai';

describe('Login Flow', () => {
  beforeEach(async () => {
    // Reset app state before each test
    await driver.reset();
  });

  it('should login successfully with valid credentials', async () => {
    await LoginPage.login('testuser', 'password123');
    
    const isHomeDisplayed = await HomePage.isDisplayed();
    expect(isHomeDisplayed).to.be.true;
  });

  it('should show error for invalid credentials', async () => {
    await LoginPage.login('invalid', 'wrong');
    
    const errorMessage = await LoginPage.getErrorMessage();
    expect(errorMessage).to.equal('Invalid credentials');
  });
});
```

### WDIO Configuration
```typescript
// config/wdio.ios.conf.ts
import { config as sharedConfig } from './wdio.shared.conf';

export const config: WebdriverIO.Config = {
  ...sharedConfig,
  capabilities: [{
    platformName: 'iOS',
    platformVersion: '17.0',
    deviceName: 'iPhone 15 Pro',
    automationName: 'XCUITest',
    app: './apps/iOS/TestApp.app',
    noReset: false,
    newCommandTimeout: 300,
    autoAcceptAlerts: true
  }],
  services: [
    ['appium', {
      command: 'appium',
      args: {
        address: '127.0.0.1',
        port: 4723
      }
    }]
  ]
};
```

```typescript
// config/wdio.android.conf.ts
import { config as sharedConfig } from './wdio.shared.conf';

export const config: WebdriverIO.Config = {
  ...sharedConfig,
  capabilities: [{
    platformName: 'Android',
    platformVersion: '14.0',
    deviceName: 'Pixel 8',
    automationName: 'UiAutomator2',
    app: './apps/Android/TestApp.apk',
    noReset: false,
    newCommandTimeout: 300,
    autoGrantPermissions: true
  }]
};
```

### Explicit Waits
```typescript
import { $, browser } from '@wdio/globals';

// Wait for element to be displayed
await $('#login-button').waitForDisplayed({ timeout: 5000 });

// Wait for element to be clickable
await $('#submit-btn').waitForClickable({ timeout: 3000 });

// Wait for element to exist in DOM
await $('#loading').waitForExist({ timeout: 10000, reverse: true });

// Custom wait condition
await browser.waitUntil(
  async () => {
    const text = await $('.status').getText();
    return text === 'Complete';
  },
  {
    timeout: 10000,
    timeoutMsg: 'Expected status to be Complete'
  }
);
```

### Gestures (iOS/Android)
```typescript
// Swipe gesture
await browser.touchPerform([
  { action: 'press', options: { x: 100, y: 500 } },
  { action: 'wait', options: { ms: 500 } },
  { action: 'moveTo', options: { x: 100, y: 100 } },
  { action: 'release' }
]);

// Long press
const element = await $('#long-press-button');
await driver.touchPerform([
  { action: 'longPress', options: { element: element.elementId } },
  { action: 'release' }
]);

// Pinch to zoom (iOS)
await driver.execute('mobile: pinch', {
  scale: 0.5,
  velocity: -1
});
```

## Locator Strategies
- **Accessibility ID**: `~login-button` (preferred, platform-agnostic)
- **ID**: `id=com.app:id/username`
- **Class Name**: `android.widget.Button` or `XCUIElementTypeButton`
- **XPath**: `//android.widget.Button[@text='Login']` (use sparingly)
- **CSS Selector**: `.login-button` (for hybrid apps)
- **Predicate (iOS)**: `-ios predicate string:type == 'XCUIElementTypeButton'`
- **Class Chain (iOS)**: `-ios class chain:**/XCUIElementTypeButton`
- **UIAutomator (Android)**: `android=UiSelector().text("Login")`

## Parallel Execution
```typescript
// wdio.shared.conf.ts
export const config = {
  maxInstances: 5,  // Maximum parallel instances
  capabilities: [
    { platformName: 'iOS', deviceName: 'iPhone 15' },
    { platformName: 'iOS', deviceName: 'iPhone 14' },
    { platformName: 'Android', deviceName: 'Pixel 8' }
  ]
};
```

## CI/CD Integration
- Run tests on cloud services (BrowserStack, Sauce Labs, LambdaTest)
- Use Appium Docker containers
- Generate Allure reports
- Integrate with Jenkins/GitHub Actions
- Use device farms for large-scale testing
- Implement test result notifications

## Troubleshooting
- Use `appium-doctor` to diagnose setup issues
- Check server logs for detailed errors
- Use Appium Desktop Inspector for element inspection
- Verify device connectivity with `adb devices` (Android)
- Check Xcode and iOS simulator status (iOS)
- Increase timeouts for slow network conditions
- Use `driver.getPageSource()` for DOM inspection
