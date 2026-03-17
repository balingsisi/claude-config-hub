# HTMX 前端开发模板

## 技术栈

- **核心库**: HTMX 1.9+
- **CSS 框架**: Tailwind CSS / Bootstrap / Pico CSS
- **后端**: 任意（Go、Python、Node.js、Rust 等）
- **模板引擎**: 服务端渲染（Jinja2、EJS、Tera 等）
- **扩展**: _hyperscript、Alpine.js（可选）

## 项目结构

```
htmx-project/
├── static/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── htmx.min.js
│   └── img/
├── templates/
│   ├── partials/
│   │   ├── _header.html
│   │   ├── _footer.html
│   │   └── _pagination.html
│   ├── layouts/
│   │   └── base.html
│   └── pages/
│       ├── index.html
│       └── dashboard.html
├── handlers/
│   └── routes.py
├── app.py
└── requirements.txt
```

## 代码模式

### 基础 HTMX 属性

```html
<!-- GET 请求替换内容 -->
<div hx-get="/api/users" hx-trigger="load" hx-swap="innerHTML">
  加载中...
</div>

<!-- POST 表单提交 -->
<form hx-post="/api/submit" hx-swap="outerHTML">
  <input type="text" name="title" required>
  <button type="submit">提交</button>
</form>

<!-- 点击触发 -->
<button hx-delete="/api/item/1" 
        hx-target="#item-1" 
        hx-swap="outerHTML swap:0.5s"
        hx-confirm="确定删除？">
  删除
</button>

<!-- 搜索实时过滤 -->
<input type="search" 
       name="q"
       hx-get="/api/search"
       hx-trigger="input changed delay:300ms, search"
       hx-target="#results"
       placeholder="搜索...">

<div id="results"></div>
```

### 部分模板更新

```html
<!-- 列表项模板 (templates/partials/_item.html) -->
<li id="item-{{id}}" class="flex justify-between p-2 border-b">
  <span>{{name}}</span>
  <button hx-delete="/api/items/{{id}}" 
          hx-target="#item-{{id}}"
          hx-swap="outerHTML swap:0.3s"
          class="text-red-500 hover:text-red-700">
    删除
  </button>
</li>

<!-- 分页组件 -->
<nav class="flex gap-2" id="pagination">
  <button hx-get="/api/items?page={{prev}}" 
          hx-target="#items-list"
          class="px-3 py-1 bg-gray-200 rounded"
          {{#if first}}disabled{{/if}}>
    上一页
  </button>
  <span>第 {{current}} / {{total}} 页</span>
  <button hx-get="/api/items?page={{next}}" 
          hx-target="#items-list"
          class="px-3 py-1 bg-gray-200 rounded"
          {{#if last}}disabled{{/if}}>
    下一页
  </button>
</nav>
```

### 表单验证与反馈

```html
<!-- 带验证的表单 -->
<form hx-post="/api/register" 
      hx-target="#form-result"
      hx-indicator="#spinner">
  <div class="mb-4">
    <label>邮箱</label>
    <input type="email" name="email" 
           hx-post="/api/check-email"
           hx-trigger="change"
           hx-target="#email-error"
           class="w-full p-2 border rounded">
    <span id="email-error" class="text-red-500 text-sm"></span>
  </div>
  
  <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded">
    <span id="spinner" class="htmx-indicator">⏳</span>
    注册
  </button>
</form>

<div id="form-result"></div>
```

### 高级交互模式

```html
<!-- 无限滚动 -->
<div hx-get="/api/posts?offset=0"
     hx-trigger="revealed"
     hx-swap="afterend"
     hx-indicator=".htmx-indicator">
  <!-- 初始内容 -->
</div>

<!-- 拖拽排序 -->
<ul id="sortable-list">
  {{#each items}}
  <li draggable="true" 
      hx-post="/api/reorder"
      hx-trigger="end"
      hx-vals='{"id": "{{id}}", "position": "event.detail.position"}'
      hx-include="#sortable-list">
    {{name}}
  </li>
  {{/each}}
</ul>

<!-- WebSocket 实时更新 -->
<div hx-ext="ws" ws-connect="/ws/chat">
  <div id="messages" hx-swap="beforeend">
    <!-- 消息会动态追加 -->
  </div>
  <form ws-send>
    <input type="text" name="message">
    <button>发送</button>
  </form>
</div>
```

### SSE 服务器推送

```html
<!-- 实时通知 -->
<div hx-ext="sse" 
     sse-connect="/api/notifications"
     sse-swap="notification"
     hx-swap="beforeend"
     class="fixed top-4 right-4 space-y-2">
</div>

<!-- 后端示例 (Python/Flask) -->
```
```python
from flask import Response
import time

def stream_notifications():
    def generate():
        while True:
            data = get_pending_notifications()
            if data:
                yield f"event: notification\ndata: {data}\n\n"
            time.sleep(5)
    return Response(generate(), mimetype="text/event-stream")
```

## 最佳实践

### 1. 渐进增强

```html
<!-- 无 JS 也能工作 -->
<a href="/page/2" 
   hx-get="/page/2" 
   hx-target="#content"
   hx-push-url="true">
  下一页
</a>

<!-- 表单回退 -->
<form action="/submit" method="POST" 
      hx-post="/api/submit" 
      hx-target="#result">
```

### 2. 加载状态与错误处理

```html
<style>
.htmx-request .htmx-indicator { display: inline-block; }
.htmx-indicator { display: none; }
</style>

<div hx-get="/api/data" hx-indicator="#loader">
  <span id="loader" class="htmx-indicator">加载中...</span>
  内容区域
</div>

<!-- 全局错误处理 -->
<body hx-on::htmx:response-error="alert('请求失败: ' + event.detail.error)">

<!-- 局部错误处理 -->
<div hx-get="/api/data"
     hx-on::htmx:error="this.innerHTML = '加载失败，点击重试'"
     hx-on::click="htmx.trigger(this, 'htmx:refresh')">
</div>
```

### 3. 布局继承

```html
<!-- templates/layouts/base.html -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>{{title}} | MyApp</title>
  <script src="/static/js/htmx.min.js"></script>
  <link href="/static/css/styles.css" rel="stylesheet">
</head>
<body hx-boost="true">
  {% include "partials/_header.html" %}
  <main id="content">
    {% block content %}{% endblock %}
  </main>
  {% include "partials/_footer.html" %}
</body>
</html>

<!-- 使用 hx-boost 自动增强所有链接 -->
<a href="/about">关于</a> <!-- 自动变成 AJAX 请求 -->
```

### 4. 安全性

```html
<!-- CSRF 保护 -->
<meta name="csrf-token" content="{{csrf_token}}">

<body hx-headers='{"X-CSRF-Token": "{{csrf_token}}"}'>

<!-- 请求确认 -->
<button hx-delete="/api/item/1" 
        hx-confirm="此操作不可撤销，确定删除？">
  删除
</button>
```

### 5. 性能优化

```html
<!-- 防抖与节流 -->
<input hx-get="/api/search"
       hx-trigger="keyup changed delay:500ms, search">

<!-- 懒加载图片 -->
<img hx-get="/api/avatar/{{id}}" 
     hx-trigger="revealed"
     hx-swap="outerHTML"
     src="/static/placeholder.png">

<!-- 缓存控制 -->
<div hx-get="/api/dashboard"
     hx-trigger="load, every 30s"
     hx-headers='{"Cache-Control": "no-cache"}'>
</div>
```

## 常用命令

```bash
# 安装 HTMX (CDN)
curl -o static/js/htmx.min.js https://unpkg.com/htmx.org@1.9.10/dist/htmx.min.js

# 安装扩展
curl -o static/js/htmx-sse.js https://unpkg.com/htmx.org@1.9.10/dist/ext/sse.js
curl -o static/js/htmx-ws.js https://unpkg.com/htmx.org@1.9.10/dist/ext/ws.js

# 开发服务器 (Python)
uvicorn app:app --reload --port 8000

# 开发服务器 (Node.js)
npx serve -p 3000

# 构建生产版本 (压缩 HTML)
html-minifier --collapse-whitespace --remove-comments templates/*.html -d dist/

# 测试
pytest tests/ --cov=handlers
```

## 部署配置

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# 静态文件压缩
RUN find static -name "*.js" -exec gzip -k {} \;
RUN find static -name "*.css" -exec gzip -k {} \;

EXPOSE 8000
CMD ["gunicorn", "app:app", "--workers", "4", "--bind", "0.0.0.0:8000"]
```

### Nginx 配置

```nginx
server {
    listen 80;
    server_name example.com;

    # 静态文件缓存
    location /static/ {
        alias /app/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        gzip_static on;
    }

    # 代理到后端
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # SSE 长连接
    location /api/notifications {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }
}
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: htmx-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: htmx-app
  template:
    metadata:
      labels:
        app: htmx-app
    spec:
      containers:
      - name: app
        image: htmx-app:latest
        ports:
        - containerPort: 8000
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: htmx-app-service
spec:
  selector:
    app: htmx-app
  ports:
  - port: 80
    targetPort: 8000
```

## 常见问题

1. **页面刷新后状态丢失** → 使用 `hx-push-url="true"` 更新浏览器历史
2. **表单重复提交** → 使用 `hx-disable-elt="button"` 在请求期间禁用按钮
3. **大量数据渲染慢** → 使用虚拟滚动或分页加载
4. **SEO 问题** → 确保服务器返回完整 HTML，使用渐进增强
5. **调试困难** → 使用 `htmx.logAll()` 和浏览器开发者工具的 Network 面板

## 扩展资源

- [HTMX 官方文档](https://htmx.org/docs/)
- [HTMX 示例](https://htmx.org/examples/)
- [hyperscript 文档](https://hyperscript.org/)
- [HTMX + Go 示例](https://github.com/ronniehedwig/htmx-go-example)
