# Sass/SCSS 样式开发模板

## 技术栈

- **Sass**: CSS 预处理器
- **Dart Sass**: 官方编译器
- **模块系统**: @use / @forward
- **构建工具**: Vite / Webpack / Rollup

## 项目结构

```
styles/
├── abstracts/
│   ├── _variables.scss     # 变量定义
│   ├── _mixins.scss        # 混入
│   ├── _functions.scss     # 函数
│   └── _index.scss         # 导出
├── base/
│   ├── _reset.scss         # 重置样式
│   ├── _typography.scss    # 字体
│   └── _base.scss          # 基础样式
├── components/
│   ├── _buttons.scss
│   ├── _cards.scss
│   └── _forms.scss
├── layout/
│   ├── _grid.scss
│   ├── _header.scss
│   └── _footer.scss
├── pages/
│   ├── _home.scss
│   └── _about.scss
├── themes/
│   └── _default.scss
└── main.scss               # 主入口
```

## 代码模式

### 变量定义

```scss
// abstracts/_variables.scss

// Colors
$colors: (
  'primary': #3498db,
  'secondary': #2ecc71,
  'danger': #e74c3c,
  'dark': #2c3e50,
  'light': #ecf0f1
);

// Typography
$font-family-base: 'Inter', -apple-system, sans-serif;
$font-sizes: (
  'xs': 0.75rem,
  'sm': 0.875rem,
  'base': 1rem,
  'lg': 1.125rem,
  'xl': 1.25rem,
  '2xl': 1.5rem
);

// Spacing
$spacing: (
  0: 0,
  1: 0.25rem,
  2: 0.5rem,
  3: 0.75rem,
  4: 1rem,
  6: 1.5rem,
  8: 2rem
);

// Breakpoints
$breakpoints: (
  'sm': 640px,
  'md': 768px,
  'lg': 1024px,
  'xl': 1280px
);
```

### Mixins

```scss
// abstracts/_mixins.scss

@use 'variables' as *;

// 响应式断点
@mixin respond-to($breakpoint) {
  $value: map-get($breakpoints, $breakpoint);
  @if $value {
    @media (min-width: $value) {
      @content;
    }
  } @else {
    @warn "Breakpoint '#{$breakpoint}' not found.";
  }
}

// Flexbox 居中
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

// 文本截断
@mixin truncate($lines: 1) {
  @if $lines == 1 {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  } @else {
    display: -webkit-box;
    -webkit-line-clamp: $lines;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

// 渐变背景
@mixin gradient($direction, $color1, $color2) {
  background: linear-gradient($direction, $color1, $color2);
}

// 阴影
@mixin shadow($level: 1) {
  box-shadow: 0 #{2px * $level} #{4px * $level} rgba(0, 0, 0, 0.1 * $level);
}
```

### 函数

```scss
// abstracts/_functions.scss

@use 'sass:color';
@use 'variables' as *;

// 获取颜色
@function color($key) {
  $value: map-get($colors, $key);
  @if $value {
    @return $value;
  }
  @warn "Color '#{$key}' not found.";
  @return null;
}

// 获取间距
@function spacing($key) {
  @return map-get($spacing, $key);
}

// px 转 rem
@function rem($px) {
  @return calc($px / 16px) * 1rem;
}

// 颜色变亮
@function lighten($color, $amount) {
  @return color.adjust($color, $lightness: $amount * 1%);
}

// 颜色变暗
@function darken($color, $amount) {
  @return color.adjust($color, $lightness: -$amount * 1%);
}
```

### 组件样式

```scss
// components/_buttons.scss

@use '../abstracts' as *;

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: spacing(2) spacing(4);
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  // 变体
  &--primary {
    background: color('primary');
    color: white;

    &:hover:not(:disabled) {
      background: darken(color('primary'), 10);
    }
  }

  &--secondary {
    background: color('secondary');
    color: white;
  }

  &--outline {
    background: transparent;
    border: 2px solid color('primary');
    color: color('primary');
  }

  // 尺寸
  &--sm {
    padding: spacing(1) spacing(3);
    font-size: map-get($font-sizes, 'sm');
  }

  &--lg {
    padding: spacing(3) spacing(6);
    font-size: map-get($font-sizes, 'lg');
  }
}
```

### Grid 系统

```scss
// layout/_grid.scss

@use '../abstracts' as *;

.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 spacing(4);
}

.row {
  display: flex;
  flex-wrap: wrap;
  margin: 0 spacing(-2);
}

.col {
  padding: 0 spacing(2);

  // 响应式列
  @for $i from 1 through 12 {
    &-#{$i} {
      flex: 0 0 calc(100% / 12 * $i);
      max-width: calc(100% / 12 * $i);
    }
  }

  // 响应式
  @each $name, $breakpoint in $breakpoints {
    @media (min-width: $breakpoint) {
      @for $i from 1 through 12 {
        &-#{$name}-#{$i} {
          flex: 0 0 calc(100% / 12 * $i);
          max-width: calc(100% / 12 * $i);
        }
      }
    }
  }
}
```

### 主入口文件

```scss
// main.scss

@use 'abstracts';
@use 'base';
@use 'components';
@use 'layout';
@use 'pages';
@use 'themes';
```

## 最佳实践

### 1. 使用模块系统

```scss
// 推荐：@use
@use 'abstracts' as *;

// 避免：@import（已废弃）
@import 'variables';
```

### 2. 7-1 架构

- abstracts/ - 抽象工具（变量、混入、函数）
- base/ - 基础样式（重置、字体）
- components/ - 组件样式
- layout/ - 布局样式
- pages/ - 页面特定样式
- themes/ - 主题样式
- vendors/ - 第三方样式

### 3. BEM 命名

```scss
.block {
  &__element {
    // 元素
  }
  
  &--modifier {
    // 修饰符
  }
}
```

### 4. 避免嵌套过深

```scss
// 推荐：最多3层
.card {
  &__title {
    &--large {
      font-size: 2rem;
    }
  }
}

// 避免
.page .section .container .card .title {}
```

### 5. 使用 Map 管理值

```scss
$z-index: (
  'dropdown': 100,
  'modal': 200,
  'tooltip': 300
);

.element {
  z-index: map-get($z-index, 'modal');
}
```

## 常用命令

### 开发

```bash
# 安装 Sass
npm install -D sass

# 监听文件
sass --watch src/styles:dist/styles

# 编译单个文件
sass src/styles/main.scss dist/styles/main.css

# 压缩输出
sass src/styles/main.scss dist/styles/main.css --style=compressed

# 生成 source map
sass src/styles/main.scss dist/styles/main.css --source-map
```

### Vite 集成

```bash
# 安装
npm install -D sass

# vite.config.js
export default {
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/abstracts" as *;`
      }
    }
  }
}
```

### package.json 脚本

```json
{
  "scripts": {
    "build:css": "sass src/styles/main.scss dist/styles/main.css --style=compressed",
    "watch:css": "sass --watch src/styles:dist/styles",
    "lint:scss": "stylelint 'src/**/*.scss' --fix"
  }
}
```

## 部署配置

### Vite 生产配置

```js
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/abstracts" as *;`,
        silenceDeprecations: ['legacy-js-api']
      }
    }
  },
  build: {
    cssMinify: true,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[hash][extname]'
      }
    }
  }
});
```

### Webpack 配置

```js
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              additionalData: `@use "@/styles/abstracts" as *;`
            }
          }
        ]
      }
    ]
  }
};
```

### Stylelint 配置

```json
// .stylelintrc.json
{
  "extends": ["stylelint-config-standard-scss"],
  "rules": {
    "selector-class-pattern": null,
    "scss/at-rule-no-unknown": true,
    "max-nesting-depth": 3
  }
}
```

### PostCSS 集成

```js
// postcss.config.js
module.exports = {
  plugins: [
    require('autoprefixer'),
    require('cssnano')({
      preset: ['default', { discardComments: { removeAll: true } }]
    })
  ]
};
```
