# Stencil Components 模板

## 技术栈

- **框架**: Stencil 4.x
- **语言**: TypeScript 5.x
- **编译目标**: Web Components (Custom Elements)
- **样式**: CSS/SCSS
- **测试**: Stencil Testing (Jest + Puppeteer)
- **文档**: Stencil Docs (Readme)
- **包管理**: npm/pnpm

## 项目结构

```
stencil-components/
├── src/                       # 源代码
│   ├── components/           # 组件目录
│   │   ├── my-button/       # 按钮组件
│   │   │   ├── my-button.tsx
│   │   │   ├── my-button.css
│   │   │   ├── my-button.e2e.ts
│   │   │   └── readme.md
│   │   ├── my-card/         # 卡片组件
│   │   └── my-input/        # 输入框组件
│   ├── global/              # 全局样式和资源
│   │   └── styles.css
│   ├── utils/               # 工具函数
│   │   └── utils.ts
│   ├── index.html           # 开发测试页面
│   ├── index.ts             # 入口文件
│   └── components.d.ts      # 组件类型声明
├── www/                     # 构建输出（文档网站）
├── loader/                  # 懒加载配置
├── dist/                    # 构建输出（库文件）
├── stencil.config.ts        # Stencil 配置
├── package.json             # 项目配置
└── tsconfig.json            # TypeScript 配置
```

## 代码模式

### Stencil 配置

```typescript
// stencil.config.ts
import { Config } from '@stencil/core';
import { sass } from '@stencil/sass';
import { postcss } from '@stencil/postcss';
import autoprefixer from 'autoprefixer';

export const config: Config = {
  // 命名空间
  namespace: 'my-components',

  // 全局样式
  globalStyle: 'src/global/styles.css',
  globalScript: 'src/global/app.ts',

  // 输出目标
  outputTargets: [
    // Web Components
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    // 懒加载
    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'auto',
      dir: 'dist/custom-elements',
    },
    // 文档
    {
      type: 'docs-readme',
      dir: 'docs',
      footer: '*Built with Stencil*',
    },
    {
      type: 'docs-json',
      file: 'docs/components.json',
    },
    // 开发服务器
    {
      type: 'www',
      serviceWorker: null,
      dir: 'www',
    },
    // React 集成
    {
      type: 'dist-react',
      componentCorePackage: 'my-components',
      proxiesFile: '../react-library/src/components.ts',
    },
    // Angular 集成
    {
      type: 'dist-angular',
      componentCorePackage: 'my-components',
      directivesProxyFile: '../angular-library/src/directives/proxies.ts',
    },
    // Vue 集成
    {
      type: 'dist-vue',
      componentCorePackage: 'my-components',
      proxiesFile: '../vue-library/src/components.ts',
    },
  ],

  // 插件
  plugins: [
    sass(),
    postcss({
      plugins: [autoprefixer()],
    }),
  ],

  // 开发服务器
  devServer: {
    reloadStrategy: 'pageReload',
    port: 3333,
    openBrowser: true,
  },

  // 构建选项
  buildEs5: 'prod',
  extras: {
    experimentalImportInjection: true,
    enableImportInjection: true,
  },

  // 测试配置
  testing: {
    browserHeadless: 'new',
    browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
    slowTestThreshold: 1000,
  },
};

// stencil.config.minimal.ts - 最小配置
import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'my-components',
  outputTargets: [
    { type: 'dist' },
    { type: 'www' },
  ],
};
```

### 组件示例

```typescript
// src/components/my-button/my-button.tsx
import { Component, Prop, h, Event, EventEmitter, Element, Host } from '@stencil/core';

@Component({
  tag: 'my-button',
  styleUrl: 'my-button.css',
  shadow: true,
})
export class MyButton {
  @Element() el!: HTMLElement;

  /**
   * 按钮类型
   */
  @Prop() variant: 'primary' | 'secondary' | 'danger' = 'primary';

  /**
   * 按钮大小
   */
  @Prop() size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * 是否禁用
   */
  @Prop({ reflect: true }) disabled: boolean = false;

  /**
   * 是否加载中
   */
  @Prop() loading: boolean = false;

  /**
   * 按钮类型（HTML 原生）
   */
  @Prop() type: 'button' | 'submit' | 'reset' = 'button';

  /**
   * 点击事件
   */
  @Event() myClick!: EventEmitter<MouseEvent>;

  /**
   * 按钮获得焦点事件
   */
  @Event() myFocus!: EventEmitter<FocusEvent>;

  /**
   * 按钮失去焦点事件
   */
  @Event() myBlur!: EventEmitter<FocusEvent>;

  private handleClick = (event: MouseEvent) => {
    if (!this.disabled && !this.loading) {
      this.myClick.emit(event);
    }
  };

  private handleFocus = (event: FocusEvent) => {
    this.myFocus.emit(event);
  };

  private handleBlur = (event: FocusEvent) => {
    this.myBlur.emit(event);
  };

  render() {
    const { variant, size, disabled, loading, type } = this;

    return (
      <Host>
        <button
          class={{
            'my-button': true,
            [`my-button--${variant}`]: true,
            [`my-button--${size}`]: true,
            'my-button--disabled': disabled,
            'my-button--loading': loading,
          }}
          type={type}
          disabled={disabled || loading}
          onClick={this.handleClick}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
        >
          {loading && (
            <span class="my-button__spinner">
              <svg viewBox="0 0 24 24" class="spinner-icon">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" />
              </svg>
            </span>
          )}
          <span class="my-button__content">
            <slot />
          </span>
        </button>
      </Host>
    );
  }
}

/* src/components/my-button/my-button.css */
:host {
  display: inline-block;
}

.my-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.my-button--primary {
  background-color: #0967d2;
  color: white;
}

.my-button--primary:hover:not(.my-button--disabled) {
  background-color: #0552b5;
}

.my-button--secondary {
  background-color: transparent;
  color: #0967d2;
  border: 2px solid #0967d2;
}

.my-button--secondary:hover:not(.my-button--disabled) {
  background-color: #e6f6ff;
}

.my-button--danger {
  background-color: #e12c39;
  color: white;
}

.my-button--danger:hover:not(.my-button--disabled) {
  background-color: #cf1124;
}

.my-button--sm {
  padding: 4px 12px;
  font-size: 14px;
}

.my-button--md {
  padding: 8px 16px;
  font-size: 16px;
}

.my-button--lg {
  padding: 12px 24px;
  font-size: 18px;
}

.my-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.my-button--loading {
  cursor: wait;
}

.my-button__spinner {
  margin-right: 8px;
}

.spinner-icon {
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

### 复杂组件

```typescript
// src/components/my-input/my-input.tsx
import {
  Component,
  Prop,
  h,
  Event,
  EventEmitter,
  State,
  Watch,
  Element,
  Host,
  Method,
} from '@stencil/core';

@Component({
  tag: 'my-input',
  styleUrl: 'my-input.css',
  shadow: true,
})
export class MyInput {
  @Element() el!: HTMLElement;

  /**
   * 输入框类型
   */
  @Prop() type: 'text' | 'email' | 'password' | 'number' | 'tel' = 'text';

  /**
   * 输入框值
   */
  @Prop({ mutable: true }) value: string = '';

  /**
   * 占位符
   */
  @Prop() placeholder: string = '';

  /**
   * 标签
   */
  @Prop() label: string = '';

  /**
   * 是否必填
   */
  @Prop() required: boolean = false;

  /**
   * 是否禁用
   */
  @Prop({ reflect: true }) disabled: boolean = false;

  /**
   * 是否只读
   */
  @Prop() readonly: boolean = false;

  /**
   * 最大长度
   */
  @Prop() maxlength: number = 524288;

  /**
   * 最小长度
   */
  @Prop() minlength: number = 0;

  /**
   * 错误信息
   */
  @Prop() error: string = '';

  /**
   * 帮助文本
   */
  @Prop() hint: string = '';

  /**
   * 值改变事件
   */
  @Event() myChange!: EventEmitter<string>;

  /**
   * 输入事件
   */
  @Event() myInput!: EventEmitter<InputEvent>;

  /**
   * 获得焦点事件
   */
  @Event() myFocus!: EventEmitter<FocusEvent>;

  /**
   * 失去焦点事件
   */
  @Event() myBlur!: EventEmitter<FocusEvent>;

  @State() hasFocus: boolean = false;

  private inputRef!: HTMLInputElement;

  @Watch('value')
  valueChanged(newValue: string) {
    this.myChange.emit(newValue);
  }

  /**
   * 获得焦点
   */
  @Method()
  async setFocus() {
    this.inputRef?.focus();
  }

  /**
   * 失去焦点
   */
  @Method()
  async setBlur() {
    this.inputRef?.blur();
  }

  private handleInput = (event: Event) => {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
    this.myInput.emit(event as InputEvent);
  };

  private handleFocus = (event: FocusEvent) => {
    this.hasFocus = true;
    this.myFocus.emit(event);
  };

  private handleBlur = (event: FocusEvent) => {
    this.hasFocus = false;
    this.myBlur.emit(event);
  };

  render() {
    const { type, value, placeholder, label, required, disabled, readonly, maxlength, minlength, error, hint, hasFocus } = this;

    return (
      <Host>
        <div class={{
          'my-input-wrapper': true,
          'my-input-wrapper--error': !!error,
          'my-input-wrapper--disabled': disabled,
          'my-input-wrapper--focused': hasFocus,
        }}>
          {label && (
            <label class="my-input__label">
              {label}
              {required && <span class="my-input__required">*</span>}
            </label>
          )}

          <div class="my-input__container">
            <slot name="prefix" />

            <input
              ref={(el) => (this.inputRef = el)}
              class="my-input__input"
              type={type}
              value={value}
              placeholder={placeholder}
              required={required}
              disabled={disabled}
              readonly={readonly}
              maxlength={maxlength}
              minlength={minlength}
              onInput={this.handleInput}
              onFocus={this.handleFocus}
              onBlur={this.handleBlur}
            />

            <slot name="suffix" />
          </div>

          {error && <div class="my-input__error">{error}</div>}
          {hint && !error && <div class="my-input__hint">{hint}</div>}
        </div>
      </Host>
    );
  }
}

/* src/components/my-input/my-input.css */
:host {
  display: block;
  margin-bottom: 16px;
}

.my-input-wrapper {
  display: flex;
  flex-direction: column;
}

.my-input__label {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #333;
}

.my-input__required {
  color: #e12c39;
  margin-left: 4px;
}

.my-input__container {
  display: flex;
  align-items: center;
  border: 1px solid #ccc;
  border-radius: 4px;
  transition: border-color 0.2s;
}

.my-input-wrapper--focused .my-input__container {
  border-color: #0967d2;
  box-shadow: 0 0 0 2px rgba(9, 103, 210, 0.1);
}

.my-input-wrapper--error .my-input__container {
  border-color: #e12c39;
}

.my-input-wrapper--disabled .my-input__container {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.my-input__input {
  flex: 1;
  border: none;
  outline: none;
  padding: 8px 12px;
  font-size: 16px;
  background: transparent;
}

.my-input__input:disabled {
  cursor: not-allowed;
}

.my-input__error {
  font-size: 12px;
  color: #e12c39;
  margin-top: 4px;
}

.my-input__hint {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}
```

### 卡片组件

```typescript
// src/components/my-card/my-card.tsx
import { Component, Prop, h, Host } from '@stencil/core';

@Component({
  tag: 'my-card',
  styleUrl: 'my-card.css',
  shadow: true,
})
export class MyCard {
  /**
   * 卡片标题
   */
  @Prop() header: string = '';

  /**
   * 卡片阴影
   */
  @Prop() shadow: 'none' | 'sm' | 'md' | 'lg' = 'md';

  /**
   * 卡片内边距
   */
  @Prop() padding: 'none' | 'sm' | 'md' | 'lg' = 'md';

  render() {
    const { header, shadow, padding } = this;

    return (
      <Host>
        <div class={{
          'my-card': true,
          [`my-card--shadow-${shadow}`]: shadow !== 'none',
          [`my-card--padding-${padding}`]: padding !== 'none',
        }}>
          {header && (
            <div class="my-card__header">
              <slot name="header">
                <h3 class="my-card__title">{header}</h3>
              </slot>
            </div>
          )}

          <div class="my-card__body">
            <slot />
          </div>

          <div class="my-card__footer">
            <slot name="footer" />
          </div>
        </div>
      </Host>
    );
  }
}

/* src/components/my-card/my-card.css */
:host {
  display: block;
}

.my-card {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
}

.my-card--shadow-sm {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.my-card--shadow-md {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.my-card--shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.my-card--padding-sm {
  padding: 12px;
}

.my-card--padding-md {
  padding: 24px;
}

.my-card--padding-lg {
  padding: 32px;
}

.my-card__header {
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 16px;
  padding-bottom: 16px;
}

.my-card__title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.my-card__body {
  flex: 1;
}

.my-card__footer {
  border-top: 1px solid #e5e7eb;
  margin-top: 16px;
  padding-top: 16px;
}
```

### 测试示例

```typescript
// src/components/my-button/my-button.e2e.ts
import { newE2EPage } from '@stencil/core/testing';

describe('my-button', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<my-button>Click me</my-button>');

    const element = await page.find('my-button');
    expect(element).toHaveClass('hydrated');
  });

  it('displays text content', async () => {
    const page = await newE2EPage();
    await page.setContent('<my-button>Click me</my-button>');

    const button = await page.find('my-button >>> button');
    expect(button.textContent).toEqual('Click me');
  });

  it('emits click event', async () => {
    const page = await newE2EPage();
    await page.setContent('<my-button>Click me</my-button>');

    const button = await page.find('my-button');
    const myClick = await button.spyOnEvent('myClick');

    await button.click();

    expect(myClick).toHaveReceivedEvent();
  });

  it('should not emit click when disabled', async () => {
    const page = await newE2EPage();
    await page.setContent('<my-button disabled>Click me</my-button>');

    const button = await page.find('my-button');
    const myClick = await button.spyOnEvent('myClick');

    await button.click();

    expect(myClick).not.toHaveReceivedEvent();
  });

  it('should apply variant class', async () => {
    const page = await newE2EPage();
    await page.setContent('<my-button variant="secondary">Click me</my-button>');

    const button = await page.find('my-button >>> button');
    expect(button).toHaveClass('my-button--secondary');
  });

  it('should show loading spinner', async () => {
    const page = await newE2EPage();
    await page.setContent('<my-button loading>Click me</my-button>');

    const spinner = await page.find('my-button >>> .my-button__spinner');
    expect(spinner).toBeDefined();
  });
});

// src/components/my-button/my-button.spec.ts
import { MyButton } from './my-button';

describe('my-button', () => {
  it('should build', () => {
    expect(new MyButton()).toBeTruthy();
  });

  describe('variant', () => {
    it('should have a default variant of primary', () => {
      const component = new MyButton();
      expect(component.variant).toEqual('primary');
    });
  });

  describe('size', () => {
    it('should have a default size of md', () => {
      const component = new MyButton();
      expect(component.size).toEqual('md');
    });
  });
});
```

## 最佳实践

### 1. 组件设计

```typescript
// 使用 @Prop 定义输入属性
@Component({ tag: 'my-component' })
export class MyComponent {
  // 可变属性
  @Prop({ mutable: true }) value: string = '';

  // 反射到 DOM
  @Prop({ reflect: true }) active: boolean = false;

  // 监听属性变化
  @Prop() count: number = 0;
  @Watch('count')
  countChanged(newValue: number, oldValue: number) {
    console.log(`Count changed from ${oldValue} to ${newValue}`);
  }

  // 私有状态
  @State() isOpen: boolean = false;
}

// 使用 @Event 定义输出事件
@Component({ tag: 'my-component' })
export class MyComponent {
  @Event() myChange!: EventEmitter<string>;
  @Event() mySubmit!: EventEmitter<FormData>;

  private handleChange() {
    this.myChange.emit('new value');
  }
}

// 使用 @Method 暴露公共方法
@Component({ tag: 'my-component' })
export class MyComponent {
  @Method()
  async open() {
    this.isOpen = true;
  }

  @Method()
  async close() {
    this.isOpen = false;
  }
}
```

### 2. 样式管理

```typescript
// 使用 CSS 变量
@Component({
  tag: 'my-component',
  styleUrl: 'my-component.css',
  shadow: true,
})
export class MyComponent {
  render() {
    return (
      <div class="my-component">
        <slot />
      </div>
    );
  }
}

/* my-component.css */
:host {
  --primary-color: #0967d2;
  --border-radius: 4px;
  --font-size: 16px;
}

.my-component {
  color: var(--primary-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size);
}
```

### 3. 插槽使用

```typescript
@Component({ tag: 'my-component' })
export class MyComponent {
  render() {
    return (
      <div>
        {/* 默认插槽 */}
        <slot />

        {/* 具名插槽 */}
        <slot name="header" />
        <slot name="footer" />

        {/* 条件插槽 */}
        {this.showHeader && <slot name="header" />}
      </div>
    );
  }
}

// 使用
<my-component>
  <div slot="header">Header</div>
  <p>Content</p>
  <div slot="footer">Footer</div>
</my-component>
```

### 4. 性能优化

```typescript
@Component({ tag: 'my-component' })
export class MyComponent {
  // 使用 @State 管理内部状态
  @State() items: string[] = [];

  // 使用 shouldUpdate 优化渲染
  shouldUpdate(newVal: any, oldVal: any, propName: string) {
    if (propName === 'items') {
      return JSON.stringify(newVal) !== JSON.stringify(oldVal);
    }
    return true;
  }

  render() {
    return (
      <div>
        {this.items.map(item => (
          <div key={item}>{item}</div>
        ))}
      </div>
    );
  }
}
```

## 常用命令

```bash
# Stencil CLI 命令

# 启动开发服务器
npm start

# 构建生产版本
npm run build

# 运行测试
npm test

# 运行 E2E 测试
npm run test:e2e

# 运行单元测试
npm run test:unit

# 生成文档
npm run docs

# 清理构建产物
npm run clean

# 创建新组件
npm run generate my-component

# 监听模式
npm run start -- --watch

# 指定端口
npm run start -- --port 4444

# 禁用浏览器自动打开
npm run start -- --no-open

# 详细输出
npm run build -- --debug
```

## 部署配置

### Package.json

```json
{
  "name": "my-components",
  "version": "1.0.0",
  "description": "Web Components built with Stencil",
  "main": "dist/index.cjs.js",
  "module": "dist/index.js",
  "es2015": "dist/esm/index.mjs",
  "es2017": "dist/esm/index.mjs",
  "types": "dist/types/index.d.ts",
  "collection": "dist/collection/collection-manifest.json",
  "collection:main": "dist/collection/index.js",
  "unpkg": "dist/my-components/my-components.esm.js",
  "files": [
    "dist/",
    "loader/"
  ],
  "scripts": {
    "build": "stencil build",
    "start": "stencil build --dev --watch --serve",
    "test": "stencil test --spec --e2e",
    "test:spec": "stencil test --spec",
    "test:e2e": "stencil test --e2e",
    "generate": "stencil generate",
    "docs": "stencil build --docs"
  },
  "devDependencies": {
    "@stencil/core": "^4.0.0",
    "@stencil/postcss": "^2.0.0",
    "@stencil/sass": "^3.0.0",
    "@types/jest": "^29.0.0",
    "@types/node": "^20.0.0",
    "autoprefixer": "^10.0.0",
    "jest": "^29.0.0",
    "jest-cli": "^29.0.0",
    "puppeteer": "^21.0.0",
    "typescript": "^5.0.0"
  },
  "license": "MIT",
  "keywords": [
    "stencil",
    "web components",
    "custom elements"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/username/my-components.git"
  }
}
```

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

  publish:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Publish to npm
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 参考资源

- [Stencil 官方文档](https://stenciljs.com/)
- [Stencil GitHub](https://github.com/ionic-team/stencil)
- [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [Custom Elements](https://custom-elements-everywhere.com/)
- [Stencil Output Targets](https://stenciljs.com/docs/output-targets)
