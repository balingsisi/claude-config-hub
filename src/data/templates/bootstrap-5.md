# Bootstrap 5 前端开发模板

## 技术栈

- **Bootstrap 5.3**: CSS 框架
- **Sass/SCSS**: CSS 预处理器
- **JavaScript ES6+**: 交互逻辑
- **Vite**: 构建工具
- **Bootstrap Icons**: 图标库
- **Popper.js**: 工具提示和弹出框

## 项目结构

```
bootstrap-app/
├── src/
│   ├── scss/
│   │   ├── main.scss
│   │   ├── _variables.scss
│   │   ├── _mixins.scss
│   │   ├── _components/
│   │   │   ├── _buttons.scss
│   │   │   ├── _cards.scss
│   │   │   ├── _navbar.scss
│   │   │   ├── _forms.scss
│   │   │   └── _modals.scss
│   │   ├── _layouts/
│   │   │   ├── _header.scss
│   │   │   ├── _footer.scss
│   │   │   └── _sidebar.scss
│   │   ├── _pages/
│   │   │   ├── _home.scss
│   │   │   ├── _dashboard.scss
│   │   │   └── _auth.scss
│   │   └── _utilities.scss
│   ├── js/
│   │   ├── main.js
│   │   ├── components/
│   │   │   ├── navbar.js
│   │   │   ├── form-validation.js
│   │   │   ├── data-table.js
│   │   │   └── toast.js
│   │   └── utils/
│   │       ├── api.js
│   │       └── helpers.js
│   ├── pages/
│   │   ├── index.html
│   │   ├── dashboard.html
│   │   ├── login.html
│   │   ├── register.html
│   │   └── profile.html
│   └── assets/
│       ├── images/
│       └── fonts/
├── dist/
├── package.json
├── vite.config.js
└── .gitignore
```

## 核心代码模式

### Sass 配置

```scss
// src/scss/_variables.scss

// 颜色系统
$primary: #0d6efd;
$secondary: #6c757d;
$success: #198754;
$info: #0dcaf0;
$warning: #ffc107;
$danger: #dc3545;
$light: #f8f9fa;
$dark: #212529;

// 自定义颜色
$brand-primary: #2563eb;
$brand-secondary: #64748b;
$brand-accent: #f59e0b;

// 主题色映射
$theme-colors: (
  "primary": $brand-primary,
  "secondary": $brand-secondary,
  "success": $success,
  "info": $info,
  "warning": $warning,
  "danger": $danger,
  "light": $light,
  "dark": $dark,
  "accent": $brand-accent
);

// 间距系统
$spacer: 1rem;
$spacers: (
  0: 0,
  1: $spacer * 0.25,
  2: $spacer * 0.5,
  3: $spacer,
  4: $spacer * 1.5,
  5: $spacer * 3,
  6: $spacer * 4,
  7: $spacer * 5
);

// 字体
$font-family-sans-serif: "Inter", system-ui, -apple-system, sans-serif;
$font-family-monospace: "JetBrains Mono", SFMono-Regular, monospace;

$font-sizes: (
  1: 2.5rem,
  2: 2rem,
  3: 1.75rem,
  4: 1.5rem,
  5: 1.25rem,
  6: 1rem
);

$font-weights: (
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700
);

// 断点
$grid-breakpoints: (
  xs: 0,
  sm: 576px,
  md: 768px,
  lg: 992px,
  xl: 1200px,
  xxl: 1400px
);

// 容器宽度
$container-max-widths: (
  sm: 540px,
  md: 720px,
  lg: 960px,
  xl: 1140px,
  xxl: 1320px
);

// 边框圆角
$border-radius: 0.5rem;
$border-radius-sm: 0.375rem;
$border-radius-lg: 0.75rem;
$border-radius-xl: 1rem;
$border-radius-pill: 50rem;

// 阴影
$box-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
$box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
$box-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
$box-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);

// 卡片
$card-border-radius: $border-radius-lg;
$card-box-shadow: $box-shadow;

// 按钮
$btn-padding-y: 0.625rem;
$btn-padding-x: 1.25rem;
$btn-font-weight: 500;
$btn-border-radius: $border-radius;

// 表单
$input-padding-y: 0.625rem;
$input-padding-x: 1rem;
$input-border-radius: $border-radius;
$input-focus-border-color: $brand-primary;
$input-focus-box-shadow: 0 0 0 0.25rem rgba($brand-primary, 0.25);

// 导航栏
$navbar-height: 64px;
$navbar-padding-y: 0.75rem;
$navbar-brand-font-size: 1.25rem;
```

```scss
// src/scss/main.scss

// 1. 引入变量和函数（必须在 Bootstrap 之前）
@import "variables";

// 2. 引入 Bootstrap 核心
@import "bootstrap/scss/functions";
@import "bootstrap/scss/variables";
@import "bootstrap/scss/maps";
@import "bootstrap/scss/mixins";
@import "bootstrap/scss/utilities";

// 3. 自定义混合
@import "mixins";

// 4. Bootstrap 布局和组件
@import "bootstrap/scss/root";
@import "bootstrap/scss/reboot";
@import "bootstrap/scss/type";
@import "bootstrap/scss/images";
@import "bootstrap/scss/containers";
@import "bootstrap/scss/grid";
@import "bootstrap/scss/tables";
@import "bootstrap/scss/forms";
@import "bootstrap/scss/buttons";
@import "bootstrap/scss/transitions";
@import "bootstrap/scss/dropdown";
@import "bootstrap/scss/button-group";
@import "bootstrap/scss/nav";
@import "bootstrap/scss/navbar";
@import "bootstrap/scss/card";
@import "bootstrap/scss/accordion";
@import "bootstrap/scss/breadcrumb";
@import "bootstrap/scss/pagination";
@import "bootstrap/scss/badge";
@import "bootstrap/scss/alert";
@import "bootstrap/scss/progress";
@import "bootstrap/scss/list-group";
@import "bootstrap/scss/close";
@import "bootstrap/scss/toasts";
@import "bootstrap/scss/modal";
@import "bootstrap/scss/tooltip";
@import "bootstrap/scss/popover";
@import "bootstrap/scss/carousel";
@import "bootstrap/scss/spinners";
@import "bootstrap/scss/offcanvas";
@import "bootstrap/scss/placeholders";

// 5. Bootstrap 工具类
@import "bootstrap/scss/helpers";
@import "bootstrap/scss/utilities/api";

// 6. 自定义组件
@import "components/buttons";
@import "components/cards";
@import "components/navbar";
@import "components/forms";
@import "components/modals";

// 7. 布局样式
@import "layouts/header";
@import "layouts/footer";
@import "layouts/sidebar";

// 8. 页面特定样式
@import "pages/home";
@import "pages/dashboard";
@import "pages/auth";

// 9. 自定义工具类
@import "utilities";
```

```scss
// src/scss/_mixins.scss

// 响应式断点
@mixin respond-to($breakpoint) {
  @if map-has-key($grid-breakpoints, $breakpoint) {
    @media (min-width: map-get($grid-breakpoints, $breakpoint)) {
      @content;
    }
  }
}

@mixin respond-below($breakpoint) {
  @if map-has-key($grid-breakpoints, $breakpoint) {
    @media (max-width: map-get($grid-breakpoints, $breakpoint) - 0.02) {
      @content;
    }
  }
}

// 文本截断
@mixin text-truncate($lines: 1) {
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
@mixin gradient-bg($start, $end, $direction: to right) {
  background: linear-gradient($direction, $start, $end);
}

// 卡片悬浮效果
@mixin card-hover {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: $box-shadow-lg;
  }
}

// 按钮加载状态
@mixin button-loading {
  position: relative;
  pointer-events: none;
  
  &::after {
    content: "";
    position: absolute;
    width: 1rem;
    height: 1rem;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spinner 0.75s linear infinite;
  }
}

@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}

// Focus 样式
@mixin focus-ring($color: $primary) {
  outline: none;
  box-shadow: 0 0 0 0.25rem rgba($color, 0.25);
}
```

### 组件样式

```scss
// src/scss/_components/_buttons.scss

// 主要按钮变体
.btn {
  font-weight: $btn-font-weight;
  transition: all 0.15s ease-in-out;
  
  &:focus {
    @include focus-ring();
  }
  
  &:disabled,
  &.disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
}

.btn-primary {
  background: linear-gradient(135deg, $brand-primary 0%, darken($brand-primary, 10%) 100%);
  border: none;
  
  &:hover {
    background: linear-gradient(135deg, darken($brand-primary, 5%) 0%, darken($brand-primary, 15%) 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba($brand-primary, 0.35);
  }
  
  &:active {
    transform: translateY(0);
  }
}

// 轮廓按钮
.btn-outline-primary {
  border-width: 2px;
  
  &:hover {
    background-color: $brand-primary;
    border-color: $brand-primary;
  }
}

// 大按钮
.btn-lg {
  padding: 0.875rem 2rem;
  font-size: 1.125rem;
  border-radius: $border-radius-lg;
}

// 小按钮
.btn-sm {
  padding: 0.375rem 0.875rem;
  font-size: 0.875rem;
}

// 图标按钮
.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border-radius: 50%;
  
  &.btn-icon-sm {
    width: 2rem;
    height: 2rem;
  }
  
  &.btn-icon-lg {
    width: 3rem;
    height: 3rem;
  }
}

// 加载状态
.btn-loading {
  @include button-loading();
  color: transparent !important;
}

// 按钮组
.btn-group-responsive {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  
  @include respond-to(md) {
    flex-wrap: nowrap;
  }
}
```

```scss
// src/scss/_components/_cards.scss

.card {
  border: none;
  border-radius: $card-border-radius;
  box-shadow: $card-box-shadow;
  transition: box-shadow 0.2s ease;
  
  &.card-hover {
    @include card-hover();
  }
  
  &.card-clickable {
    cursor: pointer;
    
    &:hover {
      box-shadow: $box-shadow-lg;
    }
  }
}

.card-header {
  background-color: transparent;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 1rem 1.25rem;
}

.card-body {
  padding: 1.5rem;
}

.card-footer {
  background-color: transparent;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  padding: 1rem 1.25rem;
}

// 卡片变体
.card-primary {
  border-left: 4px solid $brand-primary;
}

.card-success {
  border-left: 4px solid $success;
}

.card-warning {
  border-left: 4px solid $warning;
}

.card-danger {
  border-left: 4px solid $danger;
}

// 统计卡片
.card-stat {
  .stat-icon {
    width: 3rem;
    height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $border-radius-lg;
    font-size: 1.5rem;
    
    &.bg-primary-soft {
      background-color: rgba($brand-primary, 0.1);
      color: $brand-primary;
    }
  }
  
  .stat-value {
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1.2;
  }
  
  .stat-label {
    color: $secondary;
    font-size: 0.875rem;
  }
  
  .stat-change {
    font-size: 0.875rem;
    font-weight: 500;
    
    &.positive {
      color: $success;
    }
    
    &.negative {
      color: $danger;
    }
  }
}

// 产品卡片
.card-product {
  .product-image {
    position: relative;
    padding-top: 100%;
    overflow: hidden;
    border-radius: $border-radius $border-radius 0 0;
    
    img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
  }
  
  &:hover .product-image img {
    transform: scale(1.05);
  }
  
  .product-badge {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
  }
  
  .product-actions {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    opacity: 0;
    transform: translateX(10px);
    transition: all 0.2s ease;
  }
  
  &:hover .product-actions {
    opacity: 1;
    transform: translateX(0);
  }
}
```

```scss
// src/scss/_components/_navbar.scss

.navbar {
  height: $navbar-height;
  padding: $navbar-padding-y 0;
  background-color: #fff;
  box-shadow: $box-shadow-sm;
  
  @include respond-to(lg) {
    padding: $navbar-padding-y 1rem;
  }
}

.navbar-brand {
  font-size: $navbar-brand-font-size;
  font-weight: 700;
  color: $dark;
  
  &:hover {
    color: $brand-primary;
  }
}

.nav-link {
  font-weight: 500;
  color: $secondary;
  padding: 0.5rem 1rem;
  border-radius: $border-radius;
  transition: all 0.15s ease;
  
  &:hover,
  &.active {
    color: $brand-primary;
    background-color: rgba($brand-primary, 0.08);
  }
}

// 下拉菜单
.dropdown-menu {
  border: none;
  box-shadow: $box-shadow-lg;
  border-radius: $border-radius;
  padding: 0.5rem;
  min-width: 200px;
}

.dropdown-item {
  padding: 0.625rem 1rem;
  border-radius: $border-radius-sm;
  font-weight: 500;
  
  &:hover {
    background-color: rgba($brand-primary, 0.08);
    color: $brand-primary;
  }
  
  &.active,
  &:active {
    background-color: $brand-primary;
    color: #fff;
  }
}

// 移动端导航
.navbar-collapse {
  @include respond-below(lg) {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: #fff;
    box-shadow: $box-shadow;
    padding: 1rem;
    border-radius: 0 0 $border-radius $border-radius;
  }
}

// 用户菜单
.user-menu {
  .user-avatar {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid $light;
  }
  
  .dropdown-toggle::after {
    display: none;
  }
}
```

```scss
// src/scss/_components/_forms.scss

// 表单控件
.form-control {
  padding: $input-padding-y $input-padding-x;
  border-radius: $input-border-radius;
  border: 1px solid #e2e8f0;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  
  &:focus {
    border-color: $input-focus-border-color;
    box-shadow: $input-focus-box-shadow;
  }
  
  &::placeholder {
    color: $secondary;
    opacity: 0.6;
  }
}

// 输入框组
.input-group {
  .form-control {
    &:not(:first-child) {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }
    
    &:not(:last-child) {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
  }
}

.input-group-text {
  background-color: $light;
  border: 1px solid #e2e8f0;
  color: $secondary;
}

// 表单标签
.form-label {
  font-weight: 500;
  color: $dark;
  margin-bottom: 0.5rem;
}

// 必填标记
.form-label-required::after {
  content: "*";
  color: $danger;
  margin-left: 0.25rem;
}

// 验证状态
.form-control.is-valid {
  border-color: $success;
  
  &:focus {
    border-color: $success;
    box-shadow: 0 0 0 0.25rem rgba($success, 0.25);
  }
}

.form-control.is-invalid {
  border-color: $danger;
  
  &:focus {
    border-color: $danger;
    box-shadow: 0 0 0 0.25rem rgba($danger, 0.25);
  }
}

.invalid-feedback {
  font-size: 0.875rem;
  color: $danger;
  margin-top: 0.25rem;
}

.valid-feedback {
  font-size: 0.875rem;
  color: $success;
  margin-top: 0.25rem;
}

// 复选框和单选框
.form-check-input {
  width: 1.25rem;
  height: 1.25rem;
  margin-top: 0;
  
  &:checked {
    background-color: $brand-primary;
    border-color: $brand-primary;
  }
  
  &:focus {
    border-color: $brand-primary;
    box-shadow: 0 0 0 0.25rem rgba($brand-primary, 0.25);
  }
}

.form-check-label {
  cursor: pointer;
  padding-left: 0.25rem;
}

// 选择框
.form-select {
  padding: $input-padding-y $input-padding-x;
  padding-right: 2.5rem;
  border-radius: $input-border-radius;
  
  &:focus {
    border-color: $input-focus-border-color;
    box-shadow: $input-focus-box-shadow;
  }
}

// 文本域
textarea.form-control {
  min-height: 120px;
  resize: vertical;
}

// 浮动标签
.form-floating {
  > .form-control {
    height: calc(3.5rem + 2px);
    padding: 1rem $input-padding-x;
  }
  
  > label {
    padding: 1rem $input-padding-x;
  }
}

// 搜索框
.search-form {
  position: relative;
  
  .search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: $secondary;
  }
  
  .form-control {
    padding-left: 2.75rem;
  }
}

// 文件上传
.form-file {
  .form-control[type="file"] {
    cursor: pointer;
    
    &::file-selector-button {
      padding: $input-padding-y 1rem;
      margin: (-$input-padding-y) (-$input-padding-x);
      margin-right: $input-padding-x;
      background-color: $light;
      border: 0;
      border-right: 1px solid #e2e8f0;
      font-weight: 500;
      color: $dark;
    }
  }
}
```

### 页面模板

```html
<!-- src/pages/index.html -->
<!DOCTYPE html>
<html lang="zh-CN" data-bs-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Bootstrap 5 前端开发模板">
  <title>首页 - Bootstrap App</title>
  
  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <!-- Bootstrap Icons -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
  
  <!-- Custom CSS -->
  <link rel="stylesheet" href="/scss/main.scss">
</head>
<body>
  <!-- 导航栏 -->
  <nav class="navbar navbar-expand-lg fixed-top">
    <div class="container">
      <a class="navbar-brand" href="/">
        <i class="bi bi-lightning-charge-fill text-primary me-1"></i>
        BootstrapApp
      </a>
      
      <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarMain">
        <span class="navbar-toggler-icon"></span>
      </button>
      
      <div class="collapse navbar-collapse" id="navbarMain">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item">
            <a class="nav-link active" href="/">首页</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="/features">功能</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="/pricing">价格</a>
          </li>
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
              资源
            </a>
            <ul class="dropdown-menu">
              <li><a class="dropdown-item" href="/docs">文档</a></li>
              <li><a class="dropdown-item" href="/blog">博客</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item" href="/support">支持</a></li>
            </ul>
          </li>
        </ul>
        
        <form class="d-flex me-3 d-none d-md-flex">
          <div class="search-form">
            <i class="bi bi-search search-icon"></i>
            <input class="form-control" type="search" placeholder="搜索...">
          </div>
        </form>
        
        <div class="d-flex align-items-center gap-2">
          <a href="/login" class="btn btn-link text-decoration-none">登录</a>
          <a href="/register" class="btn btn-primary">注册</a>
          
          <!-- 主题切换 -->
          <button class="btn btn-icon btn-outline-secondary" id="themeToggle" title="切换主题">
            <i class="bi bi-moon-fill"></i>
          </button>
        </div>
      </div>
    </div>
  </nav>

  <!-- 主内容 -->
  <main>
    <!-- Hero 区域 -->
    <section class="hero py-5 mt-5">
      <div class="container">
        <div class="row align-items-center min-vh-75">
          <div class="col-lg-6">
            <span class="badge bg-primary-soft text-primary mb-3">
              <i class="bi bi-stars me-1"></i> 全新发布 v5.3
            </span>
            <h1 class="display-4 fw-bold mb-4">
              构建现代化<br>
              <span class="text-primary">响应式网站</span>
            </h1>
            <p class="lead text-secondary mb-4">
              基于 Bootstrap 5 的完整前端解决方案，包含组件、页面模板和最佳实践。
            </p>
            <div class="d-flex gap-3 flex-wrap">
              <a href="/get-started" class="btn btn-primary btn-lg">
                <i class="bi bi-rocket-takeoff me-2"></i>快速开始
              </a>
              <a href="/docs" class="btn btn-outline-secondary btn-lg">
                <i class="bi bi-book me-2"></i>查看文档
              </a>
            </div>
            
            <!-- 统计 -->
            <div class="row g-4 mt-4">
              <div class="col-4">
                <div class="text-center">
                  <div class="h3 fw-bold mb-0">50+</div>
                  <small class="text-secondary">组件</small>
                </div>
              </div>
              <div class="col-4">
                <div class="text-center">
                  <div class="h3 fw-bold mb-0">20+</div>
                  <small class="text-secondary">页面模板</small>
                </div>
              </div>
              <div class="col-4">
                <div class="text-center">
                  <div class="h3 fw-bold mb-0">10K+</div>
                  <small class="text-secondary">用户</small>
                </div>
              </div>
            </div>
          </div>
          <div class="col-lg-6">
            <div class="hero-image">
              <img src="/assets/hero-illustration.svg" alt="Hero" class="img-fluid">
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 功能展示 -->
    <section class="features py-5 bg-light">
      <div class="container">
        <div class="text-center mb-5">
          <h2 class="display-6 fw-bold">核心功能</h2>
          <p class="lead text-secondary">一切你需要的，都已准备好</p>
        </div>
        
        <div class="row g-4">
          <div class="col-md-6 col-lg-4">
            <div class="card card-hover h-100">
              <div class="card-body">
                <div class="feature-icon bg-primary-soft text-primary mb-3">
                  <i class="bi bi-grid-3x3-gap"></i>
                </div>
                <h5 class="fw-bold">响应式网格</h5>
                <p class="text-secondary mb-0">
                  基于 Flexbox 的强大网格系统，轻松创建各种布局。
                </p>
              </div>
            </div>
          </div>
          
          <div class="col-md-6 col-lg-4">
            <div class="card card-hover h-100">
              <div class="card-body">
                <div class="feature-icon bg-success-soft text-success mb-3">
                  <i class="bi bi-palette"></i>
                </div>
                <h5 class="fw-bold">主题定制</h5>
                <p class="text-secondary mb-0">
                  通过 Sass 变量轻松定制颜色、字体和组件样式。
                </p>
              </div>
            </div>
          </div>
          
          <div class="col-md-6 col-lg-4">
            <div class="card card-hover h-100">
              <div class="card-body">
                <div class="feature-icon bg-warning-soft text-warning mb-3">
                  <i class="bi bi-lightning"></i>
                </div>
                <h5 class="fw-bold">高性能</h5>
                <p class="text-secondary mb-0">
                  优化的 CSS 和 JS，确保快速的页面加载和交互。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 统计卡片 -->
    <section class="stats py-5">
      <div class="container">
        <div class="row g-4">
          <div class="col-sm-6 col-lg-3">
            <div class="card card-stat">
              <div class="card-body">
                <div class="d-flex align-items-center">
                  <div class="stat-icon bg-primary-soft me-3">
                    <i class="bi bi-people"></i>
                  </div>
                  <div>
                    <div class="stat-value">2,453</div>
                    <div class="stat-label">活跃用户</div>
                  </div>
                </div>
                <div class="mt-2">
                  <span class="stat-change positive">
                    <i class="bi bi-arrow-up"></i> 12.5%
                  </span>
                  <small class="text-secondary ms-1">较上月</small>
                </div>
              </div>
            </div>
          </div>
          
          <div class="col-sm-6 col-lg-3">
            <div class="card card-stat">
              <div class="card-body">
                <div class="d-flex align-items-center">
                  <div class="stat-icon bg-success-soft me-3">
                    <i class="bi bi-cart"></i>
                  </div>
                  <div>
                    <div class="stat-value">1,234</div>
                    <div class="stat-label">订单数量</div>
                  </div>
                </div>
                <div class="mt-2">
                  <span class="stat-change positive">
                    <i class="bi bi-arrow-up"></i> 8.2%
                  </span>
                  <small class="text-secondary ms-1">较上月</small>
                </div>
              </div>
            </div>
          </div>
          
          <div class="col-sm-6 col-lg-3">
            <div class="card card-stat">
              <div class="card-body">
                <div class="d-flex align-items-center">
                  <div class="stat-icon bg-warning-soft me-3">
                    <i class="bi bi-currency-dollar"></i>
                  </div>
                  <div>
                    <div class="stat-value">$45.2K</div>
                    <div class="stat-label">总收入</div>
                  </div>
                </div>
                <div class="mt-2">
                  <span class="stat-change positive">
                    <i class="bi bi-arrow-up"></i> 15.3%
                  </span>
                  <small class="text-secondary ms-1">较上月</small>
                </div>
              </div>
            </div>
          </div>
          
          <div class="col-sm-6 col-lg-3">
            <div class="card card-stat">
              <div class="card-body">
                <div class="d-flex align-items-center">
                  <div class="stat-icon bg-danger-soft me-3">
                    <i class="bi bi-graph-up"></i>
                  </div>
                  <div>
                    <div class="stat-value">89.2%</div>
                    <div class="stat-label">转化率</div>
                  </div>
                </div>
                <div class="mt-2">
                  <span class="stat-change negative">
                    <i class="bi bi-arrow-down"></i> 2.1%
                  </span>
                  <small class="text-secondary ms-1">较上月</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- 页脚 -->
  <footer class="footer py-5 bg-dark text-white">
    <div class="container">
      <div class="row g-4">
        <div class="col-lg-4">
          <h5 class="fw-bold mb-3">
            <i class="bi bi-lightning-charge-fill text-primary me-1"></i>
            BootstrapApp
          </h5>
          <p class="text-secondary">
            构建现代化响应式网站的最佳选择。
          </p>
          <div class="social-links">
            <a href="#" class="btn btn-icon btn-outline-light btn-sm me-2">
              <i class="bi bi-twitter"></i>
            </a>
            <a href="#" class="btn btn-icon btn-outline-light btn-sm me-2">
              <i class="bi bi-github"></i>
            </a>
            <a href="#" class="btn btn-icon btn-outline-light btn-sm">
              <i class="bi bi-discord"></i>
            </a>
          </div>
        </div>
        
        <div class="col-6 col-lg-2">
          <h6 class="fw-bold mb-3">产品</h6>
          <ul class="list-unstyled">
            <li class="mb-2"><a href="#" class="text-secondary text-decoration-none">功能</a></li>
            <li class="mb-2"><a href="#" class="text-secondary text-decoration-none">价格</a></li>
            <li class="mb-2"><a href="#" class="text-secondary text-decoration-none">更新日志</a></li>
          </ul>
        </div>
        
        <div class="col-6 col-lg-2">
          <h6 class="fw-bold mb-3">资源</h6>
          <ul class="list-unstyled">
            <li class="mb-2"><a href="#" class="text-secondary text-decoration-none">文档</a></li>
            <li class="mb-2"><a href="#" class="text-secondary text-decoration-none">组件</a></li>
            <li class="mb-2"><a href="#" class="text-secondary text-decoration-none">模板</a></li>
          </ul>
        </div>
        
        <div class="col-lg-4">
          <h6 class="fw-bold mb-3">订阅更新</h6>
          <form class="d-flex gap-2">
            <input type="email" class="form-control" placeholder="输入邮箱地址">
            <button class="btn btn-primary" type="submit">订阅</button>
          </form>
        </div>
      </div>
      
      <hr class="my-4 border-secondary">
      
      <div class="d-flex flex-wrap justify-content-between align-items-center">
        <small class="text-secondary">
          © 2024 BootstrapApp. All rights reserved.
        </small>
        <div>
          <a href="#" class="text-secondary text-decoration-none me-3">隐私政策</a>
          <a href="#" class="text-secondary text-decoration-none">服务条款</a>
        </div>
      </div>
    </div>
  </footer>

  <!-- Toast 容器 -->
  <div class="toast-container position-fixed bottom-0 end-0 p-3">
    <div id="liveToast" class="toast" role="alert">
      <div class="toast-header">
        <i class="bi bi-bell text-primary me-2"></i>
        <strong class="me-auto">通知</strong>
        <small>刚刚</small>
        <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
      </div>
      <div class="toast-body">
        欢迎使用 BootstrapApp！
      </div>
    </div>
  </div>

  <!-- Scripts -->
  <script type="module" src="/js/main.js"></script>
</body>
</html>
```

### JavaScript 模块

```javascript
// src/js/main.js

// Bootstrap JS (按需引入)
import 'bootstrap/js/dist/collapse';
import 'bootstrap/js/dist/dropdown';
import 'bootstrap/js/dist/modal';
import 'bootstrap/js/dist/toast';
import 'bootstrap/js/dist/tooltip';
import 'bootstrap/js/dist/alert';

// 自定义组件
import './components/navbar';
import './components/form-validation';
import './components/toast';

// 初始化工具提示
document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
  new bootstrap.Tooltip(el);
});

// 初始化弹出框
document.querySelectorAll('[data-bs-toggle="popover"]').forEach(el => {
  new bootstrap.Popover(el);
});

console.log('🚀 Bootstrap App initialized');
```

```javascript
// src/js/components/navbar.js

// 导航栏滚动效果
const navbar = document.querySelector('.navbar.fixed-top');
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
  const currentScrollY = window.scrollY;
  
  // 添加阴影
  if (currentScrollY > 10) {
    navbar.classList.add('navbar-scrolled');
  } else {
    navbar.classList.remove('navbar-scrolled');
  }
  
  // 隐藏/显示导航栏
  if (currentScrollY > lastScrollY && currentScrollY > 100) {
    navbar.style.transform = 'translateY(-100%)';
  } else {
    navbar.style.transform = 'translateY(0)';
  }
  
  lastScrollY = currentScrollY;
});

// 移动端菜单关闭
document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
  link.addEventListener('click', () => {
    const collapse = document.querySelector('.navbar-collapse');
    if (collapse.classList.contains('show')) {
      const bsCollapse = bootstrap.Collapse.getInstance(collapse);
      bsCollapse?.hide();
    }
  });
});
```

```javascript
// src/js/components/form-validation.js

// 表单验证
export function initFormValidation() {
  const forms = document.querySelectorAll('.needs-validation');
  
  forms.forEach(form => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      
      // 自定义验证
      const isValid = await validateForm(form);
      
      if (isValid) {
        form.classList.add('was-validated');
        // 提交表单
        submitForm(form);
      } else {
        form.classList.add('was-validated');
        // 滚动到第一个错误
        const firstError = form.querySelector(':invalid');
        firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });
}

// 密码强度验证
export function checkPasswordStrength(password) {
  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  
  const levels = ['very-weak', 'weak', 'fair', 'good', 'strong'];
  return {
    level: levels[strength - 1] || 'very-weak',
    score: strength
  };
}

// 邮箱验证
export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 手机号验证 (中国)
export function validatePhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

// 异步表单验证
async function validateForm(form) {
  const inputs = form.querySelectorAll('input, select, textarea');
  let isValid = true;
  
  for (const input of inputs) {
    // 跳过不需要验证的
    if (input.disabled || input.type === 'hidden') continue;
    
    // 清除之前的错误
    clearError(input);
    
    // 必填验证
    if (input.required && !input.value.trim()) {
      showError(input, '此字段必填');
      isValid = false;
      continue;
    }
    
    // 邮箱验证
    if (input.type === 'email' && input.value && !validateEmail(input.value)) {
      showError(input, '请输入有效的邮箱地址');
      isValid = false;
      continue;
    }
    
    // 密码确认
    if (input.dataset.confirm) {
      const target = form.querySelector(input.dataset.confirm);
      if (target && input.value !== target.value) {
        showError(input, '两次输入的密码不一致');
        isValid = false;
        continue;
      }
    }
    
    // 自定义异步验证
    if (input.dataset.asyncValidate) {
      const result = await asyncValidate(input);
      if (!result.valid) {
        showError(input, result.message);
        isValid = false;
      }
    }
  }
  
  return isValid;
}

function showError(input, message) {
  input.classList.add('is-invalid');
  input.classList.remove('is-valid');
  
  let feedback = input.parentElement.querySelector('.invalid-feedback');
  if (!feedback) {
    feedback = document.createElement('div');
    feedback.className = 'invalid-feedback';
    input.parentElement.appendChild(feedback);
  }
  feedback.textContent = message;
}

function clearError(input) {
  input.classList.remove('is-invalid');
  const feedback = input.parentElement.querySelector('.invalid-feedback');
  if (feedback) feedback.textContent = '';
}

// 初始化
initFormValidation();
```

```javascript
// src/js/components/toast.js

// Toast 通知系统
class ToastManager {
  constructor() {
    this.container = this.getOrCreateContainer();
  }
  
  getOrCreateContainer() {
    let container = document.querySelector('.toast-container-custom');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container-custom position-fixed top-0 end-0 p-3';
      container.style.zIndex = '1100';
      document.body.appendChild(container);
    }
    return container;
  }
  
  show(options) {
    const {
      title = '通知',
      message,
      type = 'info', // success, error, warning, info
      duration = 5000,
      icon = null
    } = options;
    
    const icons = {
      success: 'bi-check-circle-fill text-success',
      error: 'bi-x-circle-fill text-danger',
      warning: 'bi-exclamation-triangle-fill text-warning',
      info: 'bi-info-circle-fill text-info'
    };
    
    const toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'alert');
    toastEl.innerHTML = `
      <div class="toast-header">
        <i class="bi ${icon || icons[type]} me-2"></i>
        <strong class="me-auto">${title}</strong>
        <small>刚刚</small>
        <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
      </div>
      <div class="toast-body">${message}</div>
    `;
    
    this.container.appendChild(toastEl);
    
    const toast = new bootstrap.Toast(toastEl, {
      animation: true,
      autohide: duration > 0,
      delay: duration
    });
    
    toast.show();
    
    // 自动移除
    toastEl.addEventListener('hidden.bs.toast', () => {
      toastEl.remove();
    });
  }
  
  success(message, title = '成功') {
    this.show({ title, message, type: 'success' });
  }
  
  error(message, title = '错误') {
    this.show({ title, message, type: 'error' });
  }
  
  warning(message, title = '警告') {
    this.show({ title, message, type: 'warning' });
  }
  
  info(message, title = '提示') {
    this.show({ title, message, type: 'info' });
  }
}

// 全局实例
window.toast = new ToastManager();

// 使用示例
// toast.success('操作成功！');
// toast.error('发生错误，请重试');
```

```javascript
// src/js/utils/api.js

// API 请求封装
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };
    
    // 添加认证 token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '请求失败');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
  
  get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }
  
  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
  
  patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }
  
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);

// 使用示例
// const users = await api.get('/users');
// const user = await api.post('/users', { name: 'John' });
```

## 最佳实践

### 1. 响应式设计

```scss
// 移动优先
.element {
  // 移动端样式
  padding: 1rem;
  
  // 平板
  @include respond-to(md) {
    padding: 2rem;
  }
  
  // 桌面
  @include respond-to(lg) {
    padding: 3rem;
  }
}

// 隐藏/显示
.hide-mobile {
  @include respond-below(md) {
    display: none !important;
  }
}

.show-mobile {
  display: none !important;
  
  @include respond-below(md) {
    display: block !important;
  }
}
```

### 2. 性能优化

```javascript
// 图片懒加载
document.addEventListener('DOMContentLoaded', () => {
  const lazyImages = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        imageObserver.unobserve(img);
      }
    });
  });
  
  lazyImages.forEach(img => imageObserver.observe(img));
});

// 防抖
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 节流
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
```

### 3. 可访问性

```html
<!-- 语义化 HTML -->
<nav aria-label="主导航">
  <ul role="menubar">
    <li role="none"><a role="menuitem" href="#">首页</a></li>
  </ul>
</nav>

<!-- 跳转链接 -->
<a href="#main-content" class="visually-hidden-focusable">跳到主要内容</a>

<!-- ARIA 标签 -->
<button aria-label="关闭菜单" aria-expanded="false">
  <i class="bi bi-x-lg" aria-hidden="true"></i>
</button>

<!-- 表单 -->
<label for="email">邮箱地址 <span class="text-danger">*</span></label>
<input type="email" id="email" name="email" required aria-describedby="email-hint">
<small id="email-hint" class="form-text">我们不会分享您的邮箱</small>

<!-- 错误提示 -->
<div role="alert" class="alert alert-danger">
  请输入有效的邮箱地址
</div>
```

## 常用命令

### 开发

```bash
# 安装依赖
npm install

# 开发服务器
npm run dev

# 构建
npm run build

# 预览构建
npm run preview

# 代码检查
npm run lint

# 格式化
npm run format
```

## 部署配置

### package.json

```json
{
  "name": "bootstrap-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src/**/*.{js,scss}",
    "format": "prettier --write src/**/*.{js,scss,html}"
  },
  "dependencies": {
    "bootstrap": "^5.3.0"
  },
  "devDependencies": {
    "sass": "^1.69.0",
    "vite": "^5.0.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "eslint": "^8.53.0",
    "prettier": "^3.1.0"
  }
}
```

### vite.config.js

```javascript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  publicDir: 'assets',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        dashboard: resolve(__dirname, 'src/pages/dashboard.html'),
        login: resolve(__dirname, 'src/pages/login.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "src/scss/_variables.scss";`
      }
    }
  }
});
```

### Dockerfile

```dockerfile
# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 运行阶段
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA 路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```
