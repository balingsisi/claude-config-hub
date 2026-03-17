# htmx Extensions 模板

## 技术栈

- **核心**: htmx 2.x
- **扩展库**: htmx-extensions (官方及社区扩展)
- **后端**: 任意 (Node.js / Python / Go / PHP 等)
- **工具**: 
  - hyperscript (可选，增强交互)
  - Alpine.js (可选，客户端状态管理)

## 项目结构

```
htmx-app/
├── public/
│   ├── index.html
│   ├── styles.css
│   └── htmx-extensions/
│       ├── loading-states.js
│       └── custom-extension.js
├── src/
│   ├── components/
│   │   ├── search.html
│   │   ├── modal.html
│   │   └── infinite-scroll.html
│   ├── partials/
│   │   ├── header.html
│   │   └── footer.html
│   └── server/
│       ├── app.js (Node.js/Express)
│       └── routes/
│           ├── api.js
│           └── partials.js
├── package.json
└── README.md
```

## 代码模式

### 基础扩展使用

```html
<!-- 加载 htmx 和扩展 -->
<script src="https://unpkg.com/htmx.org@2.0.0"></script>
<script src="https://unpkg.com/htmx-ext-loading-states@2.0.0"></script>

<!-- 启用扩展 -->
<body hx-ext="loading-states">
  
  <!-- Loading 状态指示器 -->
  <button 
    hx-post="/api/save"
    hx-target="#result"
    hx-indicator="#loading-spinner"
  >
    Save
  </button>
  
  <div id="loading-spinner" class="htmx-indicator">
    Loading...
  </div>
  
  <div id="result"></div>
</body>
```

### 自定义扩展

```javascript
// public/htmx-extensions/custom-extension.js
htmx.defineExtension('custom-extension', {
  onEvent: function(name, evt) {
    // 请求前添加自定义 header
    if (name === 'htmx:configRequest') {
      evt.detail.headers['X-Custom-Header'] = 'value';
    }
  },
  
  transformResponse: function(text, xhr, elt) {
    // 转换响应内容
    return text.toUpperCase();
  },
  
  encodeParameters: function(xhr, parameters, elt) {
    // 自定义参数编码
    xhr.overrideMimeType('text/plain');
    return JSON.stringify(parameters);
  }
});
```

### 常用官方扩展

#### 1. loading-states（加载状态）

```html
<script src="https://unpkg.com/htmx-ext-loading-states@2.0.0"></script>

<body hx-ext="loading-states">
  <!-- 禁用按钮 -->
  <button 
    hx-post="/api/submit"
    data-loading-disable
  >
    Submit
  </button>
  
  <!-- 替换按钮文本 -->
  <button 
    hx-post="/api/process"
    data-loading-text="Processing..."
  >
    Process
  </button>
  
  <!-- 添加 CSS 类 -->
  <button 
    hx-post="/api/action"
    data-loading-class="opacity-50 cursor-wait"
  >
    Action
  </button>
  
  <!-- 显示/隐藏元素 -->
  <div data-loading>
    <div data-loading-show>Processing...</div>
    <div data-loading-hide>Ready</div>
  </div>
</body>
```

#### 2. path-deps（路径依赖）

```html
<script src="https://unpkg.com/htmx-ext-path-deps@2.0.0"></script>

<div hx-ext="path-deps">
  <!-- 监听路径变化并自动刷新 -->
  <div hx-get="/api/notifications" hx-trigger="path-deps" data-path="/notifications">
    <!-- 通知列表 -->
  </div>
  
  <!-- 更新时触发路径依赖 -->
  <button 
    hx-post="/api/notifications/read"
    hx-post-path="/notifications"
  >
    Mark as read
  </button>
</div>
```

#### 3. client-side-templates（客户端模板）

```html
<script src="https://unpkg.com/htmx-ext-client-side-templates@2.0.0"></script>
<script src="https://unpkg.com/mustache@4.2.0"></script>

<div hx-ext="client-side-templates">
  <!-- 使用 Mustache 模板 -->
  <div 
    hx-get="/api/users"
    hx-target="this"
    mustache-template="user-template"
  ></div>
  
  <script id="user-template" type="x-tmpl-mustache">
    {{#users}}
      <div class="user">
        <h3>{{name}}</h3>
        <p>{{email}}</p>
      </div>
    {{/users}}
  </script>
</div>
```

#### 4. json-enc（JSON 编码）

```html
<script src="https://unpkg.com/htmx-ext-json-enc@2.0.0"></script>

<form 
  hx-post="/api/users"
  hx-ext="json-enc"
  hx-target="#result"
>
  <input type="text" name="name" value="John">
  <input type="email" name="email" value="john@example.com">
  
  <button type="submit">Create User</button>
</form>

<!-- 发送的请求体：{"name":"John","email":"john@example.com"} -->
```

#### 5. method-override（方法覆盖）

```html
<script src="https://unpkg.com/htmx-ext-method-override@2.0.0"></script>

<!-- 浏览器发送 POST，但服务器收到 DELETE -->
<button 
  hx-post="/api/users/123"
  hx-ext="method-override"
  hx-headers='{"X-HTTP-Method-Override": "DELETE"}'
>
  Delete User
</button>
```

### 高级模式

#### 无限滚动

```html
<!-- 初始加载 -->
<div 
  hx-get="/api/posts"
  hx-trigger="revealed"
  hx-target="this"
  hx-swap="beforeend"
  hx-indicator=".loading"
>
  <div class="post">Post 1</div>
  <div class="post">Post 2</div>
  
  <!-- 下一页触发器 -->
  <div 
    hx-get="/api/posts?page=2"
    hx-trigger="revealed"
    hx-target="closest div.htmx-request"
    hx-swap="outerHTML"
  >
    Load more...
  </div>
</div>

<div class="loading htmx-indicator">Loading...</div>
```

#### 实时搜索

```html
<!-- 防抖搜索 -->
<input 
  type="search"
  name="q"
  placeholder="Search..."
  hx-get="/api/search"
  hx-trigger="input changed delay:500ms, search"
  hx-target="#search-results"
  hx-indicator="#search-spinner"
>

<span id="search-spinner" class="htmx-indicator">
  <i class="fas fa-spinner fa-spin"></i>
</span>

<div id="search-results"></div>
```

#### 模态框

```html
<!-- 触发模态框 -->
<button 
  hx-get="/api/modal/user/123"
  hx-target="#modal-container"
  hx-swap="innerHTML"
>
  View User
</button>

<!-- 模态框容器 -->
<div id="modal-container"></div>

<!-- 服务器返回的模态框内容 -->
<template id="modal-template">
  <div class="modal-overlay" _="on click remove #modal-container">
    <div class="modal" _="on click halt">
      <button class="close" _="on click remove #modal-container">×</button>
      <div class="modal-content">
        {{ content }}
      </div>
    </div>
  </div>
</template>
```

#### 内联编辑

```html
<div id="edit-container">
  <span 
    hx-get="/api/users/123/edit"
    hx-target="#edit-container"
    hx-swap="outerHTML"
    class="editable"
  >
    John Doe
  </span>
</div>

<!-- 服务器返回编辑表单 -->
<form 
  hx-put="/api/users/123"
  hx-target="#edit-container"
  hx-swap="outerHTML"
>
  <input type="text" name="name" value="John Doe">
  <button type="submit">Save</button>
  <button 
    type="button"
    hx-get="/api/users/123"
    hx-target="#edit-container"
    hx-swap="outerHTML"
  >
    Cancel
  </button>
</form>
```

### 与 hyperscript 配合

```html
<script src="https://unpkg.com/hyperscript.org@0.9.12"></script>

<!-- 使用 hyperscript 增强交互 -->
<button 
  hx-post="/api/toggle"
  hx-target="#status"
  _="on htmx:afterRequest toggle .active on me"
>
  Toggle
</button>

<!-- 复杂交互 -->
<div 
  hx-get="/api/data"
  hx-trigger="load"
  _="
    on htmx:beforeRequest 
      add .loading to #content
    end
    
    on htmx:afterRequest 
      remove .loading from #content
      if event.detail.successful
        call myNotify('Data loaded!')
      end
    end
  "
>
  <div id="content"></div>
</div>
```

### 与 Alpine.js 配合

```html
<script src="https://unpkg.com/alpinejs@3.x.x"></script>

<div x-data="{ showDetails: false }">
  <!-- htmx 更新内容，Alpine 管理状态 -->
  <div 
    hx-get="/api/items"
    hx-trigger="load"
    hx-target="this"
    x-show="showDetails"
  >
    <!-- 内容 -->
  </div>
  
  <button 
    @click="showDetails = !showDetails"
    hx-get="/api/items"
    hx-target="previous element"
  >
    Toggle Details
  </button>
</div>
```

## 最佳实践

1. **渐进增强**
   - 确保无 JavaScript 时基本功能可用
   - 使用 `<noscript>` 提供备用方案
   - htmx 优雅降级

2. **性能优化**
   - 使用 `hx-trigger` 的 `delay` 防抖
   - 缓存常用片段 (`hx-cache="true"`)
   - 批量更新而非频繁请求

3. **可访问性**
   - 保持语义化 HTML
   - 使用 `aria-*` 属性
   - 键盘导航支持

4. **错误处理**
   - 监听 `htmx:beforeSend` 和 `htmx:responseError`
   - 提供友好的错误提示
   - 重试机制

5. **组织代码**
   - 按功能拆分片段
   - 复用模板片段
   - 服务器端组合

## 常用命令

### 开发

```bash
# 使用 Node.js/Express 服务器
npm init -y
npm install express

# 启动服务器
node src/server/app.js

# 访问
open http://localhost:3000
```

### 服务器示例（Express）

```javascript
// src/server/app.js
const express = require('express');
const path = require('path');
const app = express();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// API 路由
app.get('/api/search', (req, res) => {
  const { q } = req.query;
  const results = filterData(q);
  res.send(renderSearchResults(results));
});

app.post('/api/save', (req, res) => {
  const data = req.body;
  saveData(data);
  res.send('<div class="success">Saved!</div>');
});

// 片段路由
app.get('/partials/header', (req, res) => {
  res.sendFile(path.join(__dirname, '../partials/header.html'));
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

## 部署配置

### 静态托管（Netlify/Vercel）

```html
<!-- public/index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>htmx App</title>
  <script src="https://unpkg.com/htmx.org@2.0.0"></script>
  <script src="https://unpkg.com/htmx-ext-loading-states@2.0.0"></script>
  <link rel="stylesheet" href="/styles.css">
</head>
<body hx-ext="loading-states">
  <!-- 内容 -->
</body>
</html>
```

### netlify.toml

```toml
[build]
  publish = "public"
  command = "npm run build"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

### Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "src/server/app.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - ./public:/app/public
```

## 注意事项

1. **CORS 问题**
   - 确保 API 允许跨域请求
   - 使用 `hx-headers` 添加认证 token
   - 开发环境配置代理

2. **SEO 考虑**
   - 使用服务器端渲染初始内容
   - 添加 `<meta>` 标签描述
   - 提供站点地图

3. **浏览器兼容性**
   - htmx 2.x 支持现代浏览器
   - 旧浏览器使用 htmx 1.x
   - 测试不同浏览器

4. **安全性**
   - 验证所有用户输入
   - 使用 CSRF token
   - 限制请求频率

5. **调试技巧**
   - 使用 `htmx.logAll()` 查看所有事件
   - 检查网络请求
   - 使用浏览器开发者工具

## 相关资源

- [htmx 官方文档](https://htmx.org/)
- [htmx 扩展库](https://htmx.org/extensions/)
- [hyperscript 文档](https://hyperscript.org/)
- [htmx 示例](https://htmx.org/examples/)
- [htmx Discord 社区](https://htmx.org/discord)
