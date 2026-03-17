# Lit - Web Components 开发模板

## 项目概述

Lit 是一个简单的轻量级库，用于构建快速、轻量的 Web Components。由 Google Polymer 团队开发，它提供了响应式声明、作用域样式和高效渲染，同时保持极小的体积（约5KB gzipped）。

## 技术栈

- **核心库**: Lit 3.x
- **语言**: TypeScript 5.x
- **构建工具**: Vite / Rollup
- **开发服务器**: Vite / Web Dev Server
- **测试**: Web Test Runner / Playwright
- **Linter**: ESLint + lit-analyzer
- **包管理**: npm / pnpm / yarn

## 项目结构

```
lit-project/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button/
│   │   │   │   ├── button.ts
│   │   │   │   ├── button.styles.ts
│   │   │   │   ├── button.test.ts
│   │   │   │   └── index.ts
│   │   │   ├── input/
│   │   │   │   ├── input.ts
│   │   │   │   ├── input.styles.ts
│   │   │   │   └── input.test.ts
│   │   │   └── card/
│   │   ├── features/
│   │   │   ├── user-profile/
│   │   │   │   ├── user-profile.ts
│   │   │   │   └── user-profile.styles.ts
│   │   │   └── data-table/
│   │   └── index.ts
│   ├── styles/
│   │   ├── tokens.ts           # Design tokens
│   │   ├── reset.ts            # CSS reset
│   │   └── utilities.ts        # Utility classes
│   ├── utils/
│   │   ├── decorators.ts       # Custom decorators
│   │   ├── directives.ts       # Lit directives
│   │   └── helpers.ts
│   ├── types/
│   │   └── index.ts
│   └── index.ts                # 导出所有组件
├── demo/
│   ├── index.html
│   └── components/
│       └── button.html
├── test/
│   ├── unit/
│   └── integration/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── web-test-runner.config.js
└── README.md
```

## 核心代码模式

### 1. 基础组件

```typescript
// src/components/ui/button/button.ts
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { styles } from './button.styles.js';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

@customElement('my-button')
export class MyButton extends LitElement {
  static styles = styles;

  @property({ type: String }) variant: ButtonVariant = 'primary';
  @property({ type: String }) size: ButtonSize = 'medium';
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) loading = false;
  @property({ type: String }) href?: string;
  @property({ type: String }) type: 'button' | 'submit' | 'reset' = 'button';

  @state() private isHovered = false;

  private handleClick(event: MouseEvent) {
    if (this.disabled || this.loading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.dispatchEvent(
      new CustomEvent('my-click', {
        bubbles: true,
        composed: true,
        detail: { originalEvent: event },
      })
    );
  }

  render() {
    const classes = {
      button: true,
      [`variant-${this.variant}`]: true,
      [`size-${this.size}`]: true,
      disabled: this.disabled,
      loading: this.loading,
    };

    const content = html`
      ${this.loading
        ? html`<span class="spinner" part="spinner"></span>`
        : null}
      <slot></slot>
    `;

    if (this.href) {
      return html`
        <a
          class=${classMap(classes)}
          href=${ifDefined(this.href)}
          @click=${this.handleClick}
          part="base"
        >
          ${content}
        </a>
      `;
    }

    return html`
      <button
        class=${classMap(classes)}
        type=${this.type}
        ?disabled=${this.disabled || this.loading}
        @click=${this.handleClick}
        part="base"
      >
        ${content}
      </button>
    `;
  }
}

// src/components/ui/button/button.styles.ts
import { css } from 'lit';

export const styles = css`
  :host {
    display: inline-block;
  }

  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-weight: 500;
    border-radius: 0.375rem;
    transition: all 0.2s;
    cursor: pointer;
    text-decoration: none;
    border: 2px solid transparent;
  }

  .button:focus-visible {
    outline: 2px solid var(--color-primary, #3b82f6);
    outline-offset: 2px;
  }

  /* Sizes */
  .size-small {
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
  }

  .size-medium {
    padding: 0.5rem 1rem;
    font-size: 1rem;
  }

  .size-large {
    padding: 0.75rem 1.5rem;
    font-size: 1.125rem;
  }

  /* Variants */
  .variant-primary {
    background-color: var(--color-primary, #3b82f6);
    color: white;
  }

  .variant-primary:hover:not(.disabled) {
    background-color: var(--color-primary-hover, #2563eb);
  }

  .variant-secondary {
    background-color: var(--color-secondary, #64748b);
    color: white;
  }

  .variant-outline {
    background-color: transparent;
    border-color: var(--color-primary, #3b82f6);
    color: var(--color-primary, #3b82f6);
  }

  .variant-ghost {
    background-color: transparent;
    color: var(--color-primary, #3b82f6);
  }

  /* States */
  .disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .loading {
    position: relative;
    color: transparent;
  }

  .spinner {
    position: absolute;
    width: 1em;
    height: 1em;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.75s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
```

### 2. 响应式属性与状态

```typescript
// src/components/features/user-profile/user-profile.ts
import { LitElement, html, css } from 'lit';
import { customElement, property, query, queryAll } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { guard } from 'lit/directives/guard.js';
import { cache } from 'lit/directives/cache.js';
import { until } from 'lit/directives/until.js';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user' | 'guest';
}

@customElement('user-profile')
export class UserProfile extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
    }

    .avatar {
      width: 4rem;
      height: 4rem;
      border-radius: 50%;
      object-fit: cover;
    }

    .info {
      margin-top: 1rem;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .badge-admin {
      background-color: #fef3c7;
      color: #92400e;
    }

    .badge-user {
      background-color: #dbeafe;
      color: #1e40af;
    }
  `;

  @property({ type: Object }) user!: User;
  @property({ type: Boolean, attribute: 'show-email' }) showEmail = false;
  @property({ type: Array }) permissions: string[] = [];

  @query('#edit-button') editButton!: HTMLButtonElement;
  @queryAll('.permission-item') permissionItems!: NodeListOf<Element>;

  // 只在特定属性变化时触发更新
  protected updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('user')) {
      console.log('User updated:', this.user);
      this.dispatchEvent(
        new CustomEvent('user-changed', {
          detail: { user: this.user },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  private toggleEmail() {
    this.showEmail = !this.showEmail;
  }

  // 使用 guard 避免不必要的重新渲染
  private renderPermissions() {
    return guard(
      [this.permissions],
      () => html`
        <div class="permissions">
          <h4>Permissions</h4>
          ${repeat(
            this.permissions,
            (permission) => permission,
            (permission) => html`
              <span class="permission-item">${permission}</span>
            `
          )}
        </div>
      `
    );
  }

  // 使用 cache 缓存不同的渲染结果
  render() {
    return html`
      <div class="profile">
        <img
          class="avatar"
          src=${this.user.avatar || 'https://via.placeholder.com/64'}
          alt=${this.user.name}
        />

        <div class="info">
          <h3>${this.user.name}</h3>

          <span class="badge badge-${this.user.role}">
            ${this.user.role.toUpperCase()}
          </span>

          ${cache(
            this.showEmail
              ? html`<p>Email: ${this.user.email}</p>`
              : html`
                  <button @click=${this.toggleEmail}>Show Email</button>
                `
          )}

          ${this.renderPermissions()}
        </div>

        <button id="edit-button" @click=${() => this.editUser()}>
          Edit Profile
        </button>
      </div>
    `;
  }

  private editUser() {
    this.dispatchEvent(
      new CustomEvent('edit-user', {
        detail: { userId: this.user.id },
        bubbles: true,
        composed: true,
      })
    );
  }
}
```

### 3. 异步数据加载

```typescript
// src/components/features/data-table/data-table.ts
import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { until } from 'lit/directives/until.js';

interface DataTableColumn<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => unknown;
}

@customElement('data-table')
export class DataTable<T extends Record<string, unknown>> extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th,
    td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    th {
      background-color: #f9fafb;
      font-weight: 600;
    }

    tr:hover {
      background-color: #f9fafb;
    }

    .loading {
      padding: 2rem;
      text-align: center;
    }

    .error {
      padding: 1rem;
      background-color: #fee2e2;
      color: #991b1b;
      border-radius: 0.375rem;
    }
  `;

  @property({ type: Array }) columns: DataTableColumn<T>[] = [];
  @property({ type: String }) dataUrl = '';
  @property({ type: Number }) pageSize = 10;

  @state() private data: T[] = [];
  @state() private loading = false;
  @state() private error: string | null = null;
  @state() private currentPage = 1;
  @state() private sortBy: string | null = null;
  @state() private sortOrder: 'asc' | 'desc' = 'asc';

  protected firstUpdated() {
    this.loadData();
  }

  private async loadData() {
    this.loading = true;
    this.error = null;

    try {
      const response = await fetch(
        `${this.dataUrl}?page=${this.currentPage}&limit=${this.pageSize}&sort=${this.sortBy}&order=${this.sortOrder}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.data = await response.json();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to load data';
    } finally {
      this.loading = false;
    }
  }

  private handleSort(key: keyof T) {
    if (this.sortBy === key) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = key as string;
      this.sortOrder = 'asc';
    }
    this.loadData();
  }

  private renderCell(row: T, column: DataTableColumn<T>) {
    const value = row[column.key];
    return column.render ? column.render(value, row) : (value as string);
  }

  render() {
    return html`
      <div class="table-container">
        ${until(
          this.loading
            ? html`<div class="loading">Loading...</div>`
            : this.error
            ? html`<div class="error">${this.error}</div>`
            : html`
                <table>
                  <thead>
                    <tr>
                      ${repeat(
                        this.columns,
                        (column) => column.key,
                        (column) => html`
                          <th>
                            ${column.header}
                            ${column.sortable
                              ? html`
                                  <button
                                    @click=${() => this.handleSort(column.key)}
                                  >
                                    ${this.sortBy === column.key
                                      ? this.sortOrder === 'asc'
                                        ? '↑'
                                        : '↓'
                                      : '↕'}
                                  </button>
                                `
                              : null}
                          </th>
                        `
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    ${repeat(
                      this.data,
                      (row, index) => html`
                        <tr>
                          ${repeat(
                            this.columns,
                            (column) => column.key,
                            (column) => html`
                              <td>${this.renderCell(row, column)}</td>
                            `
                          )}
                        </tr>
                      `
                    )}
                  </tbody>
                </table>
              `,
          html`<div class="loading">Loading...</div>`
        )}
      </div>
    `;
  }
}
```

### 4. 自定义指令

```typescript
// src/utils/directives.ts
import {
  directive,
  Directive,
  DirectiveParameters,
  PartInfo,
  PartType,
} from 'lit/directive.js';

// 高亮搜索文本
class HighlightDirective extends Directive {
  render(text: string, query: string) {
    if (!query) {
      return text;
    }

    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part) =>
      part.toLowerCase() === query.toLowerCase()
        ? html`<mark>${part}</mark>`
        : part
    );
  }
}

export const highlight = directive(HighlightDirective);

// 使用示例
import { highlight } from './utils/directives.js';

@customElement('search-result')
export class SearchResult extends LitElement {
  @property() text = '';
  @property() query = '';

  render() {
    return html`
      <div>${highlight(this.text, this.query)}</div>
    `;
  }
}

// 图片懒加载指令
class LazyLoadDirective extends Directive {
  render(src: string, placeholder?: string) {
    return html`
      <img
        src=${placeholder || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}
        data-src=${src}
        @intersection=${(e: CustomEvent) => {
          if (e.detail.isIntersecting) {
            e.target.src = e.target.dataset.src;
          }
        }}
      />
    `;
  }
}

export const lazyLoad = directive(LazyLoadDirective);
```

### 5. 上下文与依赖注入

```typescript
// src/utils/context.ts
import { createContext, provideContext, consumeContext } from '@lit/context';
import type { Logger } from './logger';

// 定义上下文
export const LoggerContext = createContext<Logger>('logger');

// 提供者组件
@customElement('app-root')
export class AppRoot extends LitElement {
  @provideContext({ context: LoggerContext })
  logger = new Logger();

  render() {
    return html`<slot></slot>`;
  }
}

// 消费者组件
@customElement('user-list')
export class UserList extends LitElement {
  @consumeContext({ context: LoggerContext })
  logger!: Logger;

  protected firstUpdated() {
    this.logger.log('UserList mounted');
  }

  render() {
    return html`<div>User List</div>`;
  }
}

// 主题上下文
export interface Theme {
  primaryColor: string;
  secondaryColor: string;
  mode: 'light' | 'dark';
}

export const ThemeContext = createContext<Theme>('theme');

@customElement('theme-provider')
export class ThemeProvider extends LitElement {
  @property({ type: Object }) theme: Theme = {
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
    mode: 'light',
  };

  @provideContext({ context: ThemeContext })
  get currentTheme() {
    return this.theme;
  }

  render() {
    return html`
      <style>
        :host {
          --color-primary: ${this.theme.primaryColor};
          --color-secondary: ${this.theme.secondaryColor};
          color-scheme: ${this.theme.mode};
        }
      </style>
      <slot></slot>
    `;
  }
}
```

## 最佳实践

### 1. 性能优化

```typescript
// 避免不必要的更新
@customElement('optimized-component')
export class OptimizedComponent extends LitElement {
  @property({ type: Array }) items: string[] = [];

  // 1. 使用 hasChanged 自定义更新逻辑
  @property({
    type: Array,
    hasChanged: (newVal, oldVal) => {
      if (!oldVal) return true;
      return newVal.length !== oldVal.length;
    },
  })
  filteredItems: string[] = [];

  // 2. 使用 guard 缓存复杂计算
  render() {
    return html`
      <div>
        ${guard(
          [this.items],
          () => html`
            ${repeat(
              this.items,
              (item) => item,
              (item) => html`<div>${item}</div>`
            )}
          `
        )}
      </div>
    `;
  }

  // 3. 避免在 render 中创建新对象/数组
  private static styles = css`
    :host {
      display: block;
    }
  `;

  // 4. 使用 willUpdate 进行预处理
  protected willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('items')) {
      this.filteredItems = this.items.filter((item) => item.length > 0);
    }
  }
}
```

### 2. 无障碍访问（A11y）

```typescript
@customElement('accessible-button')
export class AccessibleButton extends LitElement {
  @property({ type: String }) label = '';
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) ariaDescribedBy?: string;

  render() {
    return html`
      <button
        aria-label=${this.label}
        aria-disabled=${this.disabled}
        aria-describedby=${ifDefined(this.ariaDescribedBy)}
        ?disabled=${this.disabled}
        role="button"
        tabindex=${this.disabled ? '-1' : '0'}
      >
        <slot></slot>
      </button>
    `;
  }

  // 键盘导航支持
  protected firstUpdated() {
    this.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        this.click();
        e.preventDefault();
      }
    });
  }
}
```

### 3. 测试

```typescript
// test/unit/button.test.ts
import { fixture, html, expect } from '@open-wc/testing';
import { MyButton } from '../../src/components/ui/button/button.js';

describe('MyButton', () => {
  it('renders with default properties', async () => {
    const el = await fixture<MyButton>(html`<my-button>Click me</my-button>`);

    expect(el.variant).to.equal('primary');
    expect(el.size).to.equal('medium');
    expect(el.disabled).to.be.false;
    expect(el.textContent).to.include('Click me');
  });

  it('applies variant classes correctly', async () => {
    const el = await fixture<MyButton>(
      html`<my-button variant="outline">Outline</my-button>`
    );

    const button = el.shadowRoot?.querySelector('button');
    expect(button?.classList.contains('variant-outline')).to.be.true;
  });

  it('emits click event', async () => {
    const el = await fixture<MyButton>(html`<my-button>Click</my-button>`);

    let clicked = false;
    el.addEventListener('my-click', () => (clicked = true));

    const button = el.shadowRoot?.querySelector('button');
    button?.click();

    expect(clicked).to.be.true;
  });

  it('does not emit click when disabled', async () => {
    const el = await fixture<MyButton>(
      html`<my-button disabled>Disabled</my-button>`
    );

    let clicked = false;
    el.addEventListener('my-click', () => (clicked = true));

    const button = el.shadowRoot?.querySelector('button') as HTMLButtonElement;
    button.click();

    expect(clicked).to.be.false;
    expect(button.disabled).to.be.true;
  });

  it('shows loading spinner when loading', async () => {
    const el = await fixture<MyButton>(
      html`<my-button loading>Loading</my-button>`
    );

    const spinner = el.shadowRoot?.querySelector('.spinner');
    expect(spinner).to.exist;
  });
});
```

## 常用命令

```bash
# 开发
npm run dev              # 启动开发服务器
npm run build            # 构建生产版本
npm run build:watch      # 监听模式构建

# 测试
npm run test             # 运行测试
npm run test:watch       # 监听模式测试
npm run test:coverage    # 生成测试覆盖率报告

# 代码质量
npm run lint             # 运行 ESLint
npm run lint:fix         # 自动修复 lint 问题
npm run format           # 格式化代码

# 发布
npm run publish:beta     # 发布 beta 版本
npm run publish:stable   # 发布稳定版本
```

## 部署配置

### package.json

```json
{
  "name": "my-components",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist", "README.md"],
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./button": "./dist/components/ui/button/index.js",
    "./input": "./dist/components/ui/input/index.js"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "web-test-runner",
    "test:watch": "web-test-runner --watch",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write \"src/**/*.ts\""
  },
  "dependencies": {
    "lit": "^3.1.0"
  },
  "devDependencies": {
    "@open-wc/testing": "^4.0.0",
    "@web/test-runner": "^0.18.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MyComponents',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['lit'],
      output: {
        globals: {
          lit: 'Lit',
        },
      },
    },
  },
  server: {
    port: 3000,
    open: '/demo/index.html',
  },
});
```

### web-test-runner.config.js

```javascript
import { playwrightLauncher } from '@web/test-runner-playwright';

export default {
  files: 'test/**/*.test.ts',
  nodeResolve: true,
  browsers: [
    playwrightLauncher({ product: 'chromium' }),
    playwrightLauncher({ product: 'firefox' }),
    playwrightLauncher({ product: 'webkit' }),
  ],
  coverage: true,
};
```

## 扩展资源

- [Lit 官方文档](https://lit.dev/)
- [Lit Playground](https://lit.dev/playground/)
- [Open WC](https://open-wc.org/)
- [Web Components 指南](https://www.webcomponents.org/)
- [Lit 示例](https://github.com/lit/lit/tree/main/packages/lit-examples)
