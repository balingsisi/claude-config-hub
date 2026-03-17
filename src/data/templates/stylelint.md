# Stylelint CSS 代码检查模板

## 技术栈

- **Stylelint**: 16.x - 现代 CSS Linter
- **stylelint-config-standard**: 标准配置
- **stylelint-config-recommended**: 推荐配置
- **stylelint-prettier**: Prettier 集成
- **stylelint-scss**: SCSS 支持
- **stylelint-order**: 属性排序
- **stylelint-declaration-block-no-ignored-properties**: 忽略属性检查
- **postcss**: CSS 处理器

## 项目结构

```
stylelint-project/
├── src/
│   ├── styles/
│   │   ├── base/
│   │   │   ├── _reset.scss
│   │   │   ├── _variables.scss
│   │   │   └── _mixins.scss
│   │   ├── components/
│   │   │   ├── _button.scss
│   │   │   ├── _card.scss
│   │   │   └── _form.scss
│   │   ├── layouts/
│   │   │   ├── _header.scss
│   │   │   ├── _footer.scss
│   │   │   └── _grid.scss
│   │   ├── utilities/
│   │   │   ├── _helpers.scss
│   │   │   └── _animations.scss
│   │   └── main.scss
│   └── components/
│       └── Button/
│           ├── Button.tsx
│           └── Button.module.css
├── .stylelintrc.json          # Stylelint 配置
├── .stylelintignore           # 忽略文件
├── postcss.config.js          # PostCSS 配置
├── package.json
└── README.md
```

## 代码模式

### 1. 基础配置

```json
// .stylelintrc.json
{
  "extends": [
    "stylelint-config-standard",
    "stylelint-config-recommended-scss",
    "stylelint-config-standard-scss",
    "stylelint-prettier/recommended"
  ],
  "plugins": [
    "stylelint-scss",
    "stylelint-order",
    "stylelint-declaration-block-no-ignored-properties"
  ],
  "rules": {
    // 禁止使用重要声明
    "declaration-no-important": true,

    // 颜色格式
    "color-hex-length": "short",
    "color-hex-alpha": "never",
    "color-named": "never",
    "color-no-invalid-hex": true,

    // 字体
    "font-family-name-quotes": "always-where-recommended",
    "font-family-no-duplicate-names": true,
    "font-weight-notation": "numeric",

    // 函数
    "function-calc-no-unspaced-operator": true,
    "function-linear-gradient-no-nonstandard-direction": true,
    "function-name-case": "lower",
    "function-url-no-scheme-relative": true,
    "function-url-quotes": "always",

    // 长度
    "length-zero-no-unit": true,

    // 数字
    "number-max-precision": 4,

    // 字符串
    "string-quotes": "double",

    // 时间
    "time-min-milliseconds": 10,

    // 单位
    "unit-no-unknown": true,

    // 选择器
    "selector-class-pattern": "^[a-z][a-z0-9]*(-[a-z0-9]+)*$",
    "selector-id-pattern": "^[a-z][a-z0-9]*(-[a-z0-9]+)*$",
    "selector-max-compound-selectors": 3,
    "selector-max-id": 0,
    "selector-max-type": 2,
    "selector-no-qualifying-type": [true, { "ignore": ["attribute", "class"] }],
    "selector-pseudo-class-no-unknown": true,
    "selector-pseudo-element-colon-notation": "double",

    // 媒体查询
    "media-feature-name-no-unknown": true,
    "media-feature-name-no-vendor-prefix": true,

    // 属性
    "property-no-unknown": true,
    "property-no-vendor-prefix": true,

    // 声明块
    "declaration-block-no-duplicate-properties": [true, { "ignore": ["consecutive-duplicates-with-different-values"] }],
    "declaration-block-no-shorthand-property-overrides": true,

    // 块
    "block-no-empty": true,

    // 注释
    "comment-no-empty": true,
    "comment-whitespace-inside": "always",

    // 通用
    "no-duplicate-selectors": true,
    "no-empty-source": true,
    "no-invalid-double-slash-comments": true,

    // 属性排序
    "order/properties-order": [
      "position",
      "top",
      "right",
      "bottom",
      "left",
      "z-index",
      "display",
      "flex",
      "flex-direction",
      "flex-wrap",
      "justify-content",
      "align-items",
      "align-content",
      "order",
      "flex-grow",
      "flex-shrink",
      "flex-basis",
      "align-self",
      "width",
      "height",
      "min-width",
      "min-height",
      "max-width",
      "max-height",
      "margin",
      "margin-top",
      "margin-right",
      "margin-bottom",
      "margin-left",
      "padding",
      "padding-top",
      "padding-right",
      "padding-bottom",
      "padding-left",
      "border",
      "border-radius",
      "background",
      "background-color",
      "color",
      "font",
      "font-family",
      "font-size",
      "font-weight",
      "line-height",
      "text-align",
      "text-transform",
      "transition",
      "animation"
    ],

    // SCSS 规则
    "at-rule-no-unknown": null,
    "scss/at-rule-no-unknown": true,
    "scss/dollar-variable-pattern": "^[a-z][a-zA-Z0-9]*$",
    "scss/percent-placeholder-pattern": "^[a-z][a-zA-Z0-9]*$",
    "scss/at-mixin-pattern": "^[a-z][a-zA-Z0-9]*$",
    "scss/at-function-pattern": "^[a-z][a-zA-Z0-9]*$",
    "scss/double-slash-comment-whitespace-inside": "always",
    "scss/dollar-variable-no-missing-interpolation": true,
    "scss/operator-no-newline-after": null,
    "scss/operator-no-unspaced": true,
    "scss/selector-no-redundant-nesting-selector": true
  },
  "ignoreFiles": [
    "dist/**/*",
    "node_modules/**/*",
    "**/*.min.css"
  ]
}
```

### 2. 忽略文件

```
# .stylelintignore
dist/
node_modules/
coverage/
*.min.css
vendor/
public/
build/
.cache/
```

### 3. CSS 模块规范

```css
/* src/components/Button/Button.module.css */
/* ✅ 好的例子 */

/* 基础按钮样式 */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 0.125rem solid transparent;
  border-radius: 0.5rem;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.5;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

/* 变体：主要按钮 */
.button--primary {
  background-color: #007bff;
  color: #fff;
}

.button--primary:hover {
  background-color: #0056b3;
}

/* 变体：次要按钮 */
.button--secondary {
  background-color: transparent;
  border-color: #007bff;
  color: #007bff;
}

.button--secondary:hover {
  background-color: #007bff;
  color: #fff;
}

/* 变体：禁用状态 */
.button--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

/* 尺寸变体 */
.button--small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.button--large {
  padding: 1rem 2rem;
  font-size: 1.125rem;
}

/* ❌ 坏的例子 - 会被 Stylelint 捕获 */
.BadButton {
  POSITION: relative;          /* 错误：属性名应小写 */
  width: 100PX;                /* 错误：0值不应有单位 */
  color: red;                  /* 错误：不应使用颜色名称 */
  margin-top: 10px;
  margin-bottom: 10px;
  margin-left: 10px;           /* 错误：应简写为 margin */
  background: #007bff;
  font-size: 14;               /* 错误：缺少单位 */
}
```

### 4. SCSS 模块规范

```scss
// src/styles/base/_variables.scss
// 颜色系统
$color-primary: #007bff !default;
$color-secondary: #6c757d !default;
$color-success: #28a745 !default;
$color-danger: #dc3545 !default;
$color-warning: #ffc107 !default;
$color-info: #17a2b8 !default;
$color-light: #f8f9fa !default;
$color-dark: #343a40 !default;

// 灰度
$gray-100: #f8f9fa !default;
$gray-200: #e9ecef !default;
$gray-300: #dee2e6 !default;
$gray-400: #ced4da !default;
$gray-500: #adb5bd !default;
$gray-600: #6c757d !default;
$gray-700: #495057 !default;
$gray-800: #343a40 !default;
$gray-900: #212529 !default;

// 间距
$spacing-unit: 0.25rem !default;
$spacing-xs: $spacing-unit !default;
$spacing-sm: $spacing-unit * 2 !default;
$spacing-md: $spacing-unit * 4 !default;
$spacing-lg: $spacing-unit * 6 !default;
$spacing-xl: $spacing-unit * 8 !default;

// 断点
$breakpoint-sm: 576px !default;
$breakpoint-md: 768px !default;
$breakpoint-lg: 992px !default;
$breakpoint-xl: 1200px !default;

// 字体
$font-family-base: (
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  Roboto,
  "Helvetica Neue",
  Arial,
  sans-serif
) !default;

$font-size-base: 1rem !default;
$font-weight-normal: 400 !default;
$font-weight-bold: 700 !default;
$line-height-base: 1.5 !default;

// 边框
$border-width: 1px !default;
$border-radius: 0.25rem !default;
$border-radius-lg: 0.5rem !default;
$border-radius-sm: 0.2rem !default;

// 过渡
$transition-base: all 0.2s ease-in-out !default;
$transition-fade: opacity 0.15s linear !default;
```

### 5. Mixins

```scss
// src/styles/base/_mixins.scss
// 响应式断点
@mixin respond-to($breakpoint) {
  @if $breakpoint == "sm" {
    @media (min-width: $breakpoint-sm) {
      @content;
    }
  } @else if $breakpoint == "md" {
    @media (min-width: $breakpoint-md) {
      @content;
    }
  } @else if $breakpoint == "lg" {
    @media (min-width: $breakpoint-lg) {
      @content;
    }
  } @else if $breakpoint == "xl" {
    @media (min-width: $breakpoint-xl) {
      @content;
    }
  }
}

// Flexbox 布局
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

// 绝对定位居中
@mixin absolute-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

// 清除浮动
@mixin clearfix {
  &::after {
    display: table;
    clear: both;
    content: "";
  }
}

// 文本截断
@mixin text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// 多行文本截断
@mixin text-clamp($lines: 2) {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: $lines;
  -webkit-box-orient: vertical;
}

// 视觉隐藏（但保持可访问性）
@mixin visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

// 按钮重置
@mixin button-reset {
  padding: 0;
  margin: 0;
  background: transparent;
  border: none;
  border-radius: 0;
  font-family: inherit;
  font-size: inherit;
  color: inherit;
  cursor: pointer;
  appearance: none;
}

// 卡片阴影
@mixin card-shadow {
  box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.1);
}

// 过渡
@mixin transition($properties...) {
  transition-property: $properties;
  transition-duration: 0.2s;
  transition-timing-function: ease-in-out;
}

// 渐变背景
@mixin gradient-bg($start-color, $end-color, $direction: to bottom) {
  background: linear-gradient($direction, $start-color, $end-color);
}

// 使用示例
.card {
  @include card-shadow;
  border-radius: $border-radius-lg;
  padding: $spacing-md;

  .title {
    @include text-truncate;
    font-weight: $font-weight-bold;
  }

  .description {
    @include text-clamp(3);
    color: $gray-600;
  }
}

.container {
  @include flex-between;
  padding: $spacing-md;

  @include respond-to("md") {
    padding: $spacing-lg;
  }
}
```

### 6. 组件样式

```scss
// src/styles/components/_card.scss
// 卡片组件
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background-color: #fff;
  border: $border-width solid $gray-300;
  border-radius: $border-radius;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);

  // 卡片主体
  &__body {
    flex: 1 1 auto;
    padding: $spacing-md;
  }

  // 卡片头部
  &__header {
    padding: $spacing-md;
    margin-bottom: 0;
    background-color: $gray-100;
    border-bottom: $border-width solid $gray-300;

    &:first-child {
      border-radius: $border-radius $border-radius 0 0;
    }
  }

  // 卡片底部
  &__footer {
    padding: $spacing-md;
    background-color: $gray-100;
    border-top: $border-width solid $gray-300;

    &:last-child {
      border-radius: 0 0 $border-radius $border-radius;
    }
  }

  // 图片
  &__image {
    width: 100%;
    border-radius: $border-radius $border-radius 0 0;
  }

  // 标题
  &__title {
    margin-bottom: $spacing-sm;
    font-size: 1.25rem;
    font-weight: $font-weight-bold;
  }

  // 文本
  &__text {
    margin-bottom: $spacing-md;
    color: $gray-700;
    line-height: $line-height-base;
  }

  // 变体
  &--bordered {
    border: $border-width solid $gray-300;
    box-shadow: none;
  }

  &--shadow {
    border: none;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  }

  &--flat {
    border: none;
    box-shadow: none;
  }

  // 响应式
  @include respond-to("md") {
    &__body {
      padding: $spacing-lg;
    }
  }
}
```

### 7. PostCSS 配置

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    // 自动添加前缀
    autoprefixer: {
      overrideBrowserslist: [
        '> 1%',
        'last 2 versions',
        'not dead',
        'not ie 11',
      ],
    },

    // CSS 变量转换（如需要支持旧浏览器）
    'postcss-custom-properties': {
      preserve: true,
    },

    // 嵌套
    'postcss-nested': {},

    // 导入
    'postcss-import': {},

    // 压缩
    cssnano: {
      preset: [
        'default',
        {
          discardComments: { removeAll: true },
          normalizeWhitespace: true,
        },
      ],
    },
  },
};
```

## 最佳实践

### 1. 命名约定

```css
/* ✅ BEM 命名约定 */
.block {}
.block__element {}
.block--modifier {}
.block__element--modifier {}

/* ✅ 实际例子 */
.card {}
.card__header {}
.card__body {}
.card__footer {}
.card--featured {}
.card--dark {}
.card__header--compact {}

/* ❌ 避免 */
.cardHeader {}           /* 驼峰命名 */
.card-header {}          /* 单个连字符 */
.card_header {}          /* 下划线分隔 */
.Card {}                 /* 大写开头 */
```

### 2. 选择器嵌套

```scss
// ✅ 好的嵌套（不超过3层）
.card {
  &__header {
    &--compact {
      padding: 0.5rem;
    }
  }
}

// ❌ 避免过深嵌套
.container {
  .wrapper {
    .content {
      .card {
        .header {
          .title {
            /* 太深了！ */
          }
        }
      }
    }
  }
}

// ✅ 使用扁平化结构
.card {}
.card__header {}
.card__title {}
```

### 3. 变量使用

```scss
// ✅ 使用语义化变量
.button {
  background-color: $color-primary;
  padding: $spacing-md;
  border-radius: $border-radius;
}

// ❌ 避免魔法数字
.button {
  background-color: #007bff;
  padding: 16px;
  border-radius: 4px;
}

// ✅ 计算值
.sidebar {
  width: calc(100% - #{$spacing-md * 2});
}

// ✅ 使用 map 组织变量
$colors: (
  "primary": #007bff,
  "secondary": #6c757d,
  "success": #28a745,
);

@function color($key) {
  @return map-get($colors, $key);
}

.button {
  background-color: color("primary");
}
```

### 4. 媒体查询

```scss
// ✅ 移动优先
.container {
  padding: $spacing-sm;

  @include respond-to("md") {
    padding: $spacing-md;
  }

  @include respond-to("lg") {
    padding: $spacing-lg;
  }
}

// ✅ 组件内媒体查询
.card {
  display: flex;
  flex-direction: column;

  @include respond-to("md") {
    flex-direction: row;
  }
}

// ❌ 避免桌面优先
.container {
  padding: $spacing-lg;

  @media (max-width: 768px) {
    padding: $spacing-sm;
  }
}
```

### 5. 性能优化

```scss
// ✅ 使用简写属性
.element {
  margin: $spacing-md;
  padding: $spacing-sm $spacing-md;
}

// ✅ 避免昂贵的属性
.expensive {
  /* 避免频繁使用 */
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  filter: blur(5px);
  backdrop-filter: blur(10px);
}

// ✅ 使用 will-change 优化动画
.animated {
  will-change: transform, opacity;
  transition: transform 0.3s, opacity 0.3s;
}

// ✅ 使用 contain 限制重绘范围
.isolated {
  contain: layout style;
}

// ✅ 使用 CSS 变量实现主题
:root {
  --primary-color: #007bff;
  --spacing-unit: 0.25rem;
}

.themed {
  color: var(--primary-color);
  padding: calc(var(--spacing-unit) * 4);
}
```

## 常用命令

### 检查命令

```bash
# 安装 Stylelint
npm install -D stylelint stylelint-config-standard

# 基本检查
npx stylelint "**/*.css"

# 检查 SCSS
npx stylelint "**/*.scss"

# 自动修复
npx stylelint "**/*.css" --fix

# 检查特定文件
npx stylelint src/styles/main.css

# 输出详细报告
npx stylelint "**/*.css" --formatter verbose

# 输出 JSON 格式
npx stylelint "**/*.css" --formatter json

# 检查并生成报告
npx stylelint "**/*.css" --output-file stylelint-report.json
```

### 配置命令

```bash
# 初始化配置
npm init stylelint

# 添加 SCSS 支持
npm install -D stylelint-scss stylelint-config-standard-scss

# 添加 Prettier 集成
npm install -D stylelint-prettier stylelint-config-prettier

# 添加属性排序
npm install -D stylelint-order
```

### 集成命令

```bash
# 在 package.json 中添加脚本
{
  "scripts": {
    "lint:css": "stylelint \"**/*.css\"",
    "lint:css:fix": "stylelint \"**/*.css\" --fix",
    "lint:scss": "stylelint \"**/*.scss\"",
    "lint:styles": "npm run lint:css && npm run lint:scss"
  }
}

# 结合 npm run
npm run lint:css
npm run lint:css:fix
```

## 部署配置

### 1. VS Code 集成

```json
// .vscode/settings.json
{
  "css.validate": false,
  "scss.validate": false,
  "stylelint.enable": true,
  "stylelint.config": null,
  "stylelint.configBasedir": ".",
  "stylelint.configFile": ".stylelintrc.json",
  "stylelint.ignoreDisables": false,
  "stylelint.packageManager": "npm",
  "stylelint.syntax": "css",
  "editor.codeActionsOnSave": {
    "source.fixAll.stylelint": "explicit"
  },
  "[css]": {
    "editor.formatOnSave": false
  },
  "[scss]": {
    "editor.formatOnSave": false
  }
}
```

### 2. package.json 脚本

```json
{
  "scripts": {
    "lint": "npm run lint:js && npm run lint:css",
    "lint:css": "stylelint \"src/**/*.css\"",
    "lint:scss": "stylelint \"src/**/*.scss\"",
    "lint:fix": "npm run lint:css -- --fix && npm run lint:scss -- --fix",
    "precommit": "lint-staged",
    "build:css": "postcss src/styles/main.css -o dist/styles.css"
  },
  "lint-staged": {
    "*.css": ["stylelint --fix", "git add"],
    "*.scss": ["stylelint --fix", "git add"]
  }
}
```

### 3. CI/CD 集成

```yaml
# .github/workflows/lint.yml
name: Lint CSS

on:
  push:
    paths:
      - '**.css'
      - '**.scss'
  pull_request:
    paths:
      - '**.css'
      - '**.scss'

jobs:
  stylelint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Run Stylelint
        run: npm run lint:css

      - name: Generate Report
        if: failure()
        run: npm run lint:css -- --formatter json > stylelint-report.json

      - name: Upload Report
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: stylelint-report
          path: stylelint-report.json
```

### 4. Webpack 集成

```javascript
// webpack.config.js
const StylelintPlugin = require('stylelint-webpack-plugin');

module.exports = {
  // ... 其他配置
  plugins: [
    new StylelintPlugin({
      configFile: '.stylelintrc.json',
      context: 'src',
      files: '**/*.css',
      failOnError: false,
      quiet: false,
      emitErrors: true,
      lintDirtyModulesOnly: true,
    }),
  ],
};
```

### 5. Vite 集成

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import stylelint from 'vite-plugin-stylelint';

export default defineConfig({
  plugins: [
    stylelint({
      include: ['src/**/*.{css,scss}'],
      exclude: ['node_modules/**/*'],
      fix: true,
    }),
  ],
});
```

## 相关资源

- [Stylelint 官方文档](https://stylelint.io/)
- [Stylelint GitHub](https://github.com/stylelint/stylelint)
- [规则列表](https://stylelint.io/user-guide/rules/list)
- [配置指南](https://stylelint.io/user-guide/configure)
- [BEM 命名约定](https://getbem.com/)
- [CSS Guidelines](https://cssguidelin.es/)
- [Sass Guidelines](https://sass-guidelin.es/)
