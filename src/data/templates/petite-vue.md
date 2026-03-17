# Petite-Vue 模板

轻量级（~6KB）渐进式 Vue 框架，专为增强现有 HTML 而设计，无需构建步骤。

## 技术栈

- **框架**: Petite-Vue 0.4.x
- **语法**: Vue 3 模板语法子集
- **部署**: 无需构建，直接在浏览器运行
- **工具**: 可选 Vite 用于开发服务器
- **样式**: CSS / Tailwind CSS / Bootstrap
- **TypeScript**: 可选支持

## 项目结构

```
petite-vue-project/
├── index.html              # 主页面
├── app.js                  # 应用逻辑
├── styles.css              # 样式文件
├── components/             # 组件目录
│   ├── header.js
│   ├── footer.js
│   ├── modal.js
│   └── form.js
├── stores/                 # 状态管理
│   ├── cart.js
│   └── user.js
├── utils/                  # 工具函数
│   ├── api.js
│   ├── validators.js
│   └── helpers.js
├── pages/                  # 多页面
│   ├── about.html
│   ├── contact.html
│   └── products.html
├── public/                 # 静态资源
│   ├── images/
│   └── fonts/
├── package.json            # 依赖管理（可选）
└── vite.config.js          # Vite 配置（可选）
```

## 核心代码模式

### 1. 基础 HTML 集成 (index.html)

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Petite-Vue 应用</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <!-- 根作用域 -->
    <div id="app" v-scope="App()">
        <!-- 导航栏 -->
        <nav v-scope="Navbar()">
            <a href="/">首页</a>
            <a href="/about">关于</a>
            <a href="/products">产品</a>
            <span v-show="cartCount > 0">购物车 ({{ cartCount }})</span>
        </nav>

        <!-- 主要内容 -->
        <main>
            <h1>{{ title }}</h1>
            <p>{{ message }}</p>
            
            <!-- 条件渲染 -->
            <div v-if="isLoggedIn">
                <p>欢迎回来，{{ user.name }}！</p>
            </div>
            <div v-else>
                <button @click="showLogin = true">登录</button>
            </div>

            <!-- 列表渲染 -->
            <div class="product-list">
                <div v-for="product in products" :key="product.id" class="product">
                    <h3>{{ product.name }}</h3>
                    <p>价格: ¥{{ product.price }}</p>
                    <button @click="addToCart(product)">加入购物车</button>
                </div>
            </div>

            <!-- 表单绑定 -->
            <form @submit.prevent="submitForm">
                <input 
                    v-model="formData.email" 
                    type="email" 
                    placeholder="邮箱"
                    required
                >
                <textarea 
                    v-model="formData.message" 
                    placeholder="留言"
                ></textarea>
                <button type="submit">提交</button>
            </form>
        </main>

        <!-- 页脚 -->
        <footer v-scope="Footer()">
            <p>&copy; 2024 我的应用</p>
        </footer>
    </div>

    <!-- 引入 Petite-Vue -->
    <script src="https://unpkg.com/petite-vue" defer init></script>
    <!-- 或使用本地版本 -->
    <!-- <script src="/node_modules/petite-vue/dist/petite-vue.es.js" defer init></script> -->
    
    <!-- 应用脚本 -->
    <script src="app.js" defer></script>
</body>
</html>
```

### 2. 应用逻辑 (app.js)

```javascript
// 主应用组件
function App() {
    return {
        // 数据
        title: '我的应用',
        message: '欢迎使用 Petite-Vue',
        isLoggedIn: false,
        user: null,
        showLogin: false,
        cartCount: 0,
        products: [],
        formData: {
            email: '',
            message: ''
        },

        // 生命周期
        init() {
            this.loadProducts();
            this.checkAuth();
            this.loadCartCount();
        },

        // 方法
        async loadProducts() {
            try {
                const response = await fetch('/api/products');
                this.products = await response.json();
            } catch (error) {
                console.error('加载产品失败:', error);
            }
        },

        checkAuth() {
            const token = localStorage.getItem('authToken');
            if (token) {
                this.isLoggedIn = true;
                this.user = JSON.parse(localStorage.getItem('user'));
            }
        },

        loadCartCount() {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            this.cartCount = cart.length;
        },

        addToCart(product) {
            let cart = JSON.parse(localStorage.getItem('cart') || '[]');
            cart.push(product);
            localStorage.setItem('cart', JSON.stringify(cart));
            this.cartCount = cart.length;
            alert(`${product.name} 已加入购物车！`);
        },

        async submitForm() {
            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.formData)
                });
                
                if (response.ok) {
                    alert('提交成功！');
                    this.formData = { email: '', message: '' };
                }
            } catch (error) {
                console.error('提交失败:', error);
            }
        },

        logout() {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            this.isLoggedIn = false;
            this.user = null;
        }
    };
}

// 导航栏组件
function Navbar() {
    return {
        mobileMenuOpen: false,
        toggleMenu() {
            this.mobileMenuOpen = !this.mobileMenuOpen;
        }
    };
}

// 页脚组件
function Footer() {
    return {
        year: new Date().getFullYear(),
        links: [
            { text: '隐私政策', href: '/privacy' },
            { text: '服务条款', href: '/terms' }
        ]
    };
}
```

### 3. 可复用组件 (components/modal.js)

```javascript
function Modal() {
    return {
        isOpen: false,
        title: '',
        content: '',

        open(title, content) {
            this.title = title;
            this.content = content;
            this.isOpen = true;
            document.body.style.overflow = 'hidden';
        },

        close() {
            this.isOpen = false;
            document.body.style.overflow = 'auto';
        },

        // 监听 ESC 键关闭
        handleKeydown(e) {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        },

        init() {
            document.addEventListener('keydown', this.handleKeydown.bind(this));
        },

        destroy() {
            document.removeEventListener('keydown', this.handleKeydown.bind(this));
        }
    };
}

// 使用方式
/*
<div v-scope="Modal()" v-show="isOpen" class="modal-overlay" @click.self="close()">
    <div class="modal-content">
        <h2>{{ title }}</h2>
        <p>{{ content }}</p>
        <button @click="close()">关闭</button>
    </div>
</div>
*/
```

### 4. 表单验证 (components/form.js)

```javascript
function ContactForm() {
    return {
        formData: {
            name: '',
            email: '',
            phone: '',
            message: ''
        },
        errors: {},
        isSubmitting: false,

        validators: {
            name: (value) => {
                if (!value.trim()) return '姓名不能为空';
                if (value.length < 2) return '姓名至少2个字符';
                return null;
            },
            email: (value) => {
                if (!value.trim()) return '邮箱不能为空';
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) return '邮箱格式不正确';
                return null;
            },
            phone: (value) => {
                if (value && !/^1[3-9]\d{9}$/.test(value)) {
                    return '手机号格式不正确';
                }
                return null;
            },
            message: (value) => {
                if (!value.trim()) return '留言不能为空';
                if (value.length < 10) return '留言至少10个字符';
                return null;
            }
        },

        validate(field) {
            const error = this.validators[field](this.formData[field]);
            if (error) {
                this.errors[field] = error;
                return false;
            } else {
                delete this.errors[field];
                return true;
            }
        },

        validateAll() {
            let isValid = true;
            Object.keys(this.validators).forEach(field => {
                if (!this.validate(field)) isValid = false;
            });
            return isValid;
        },

        async submit() {
            if (!this.validateAll()) {
                alert('请修正表单错误');
                return;
            }

            this.isSubmitting = true;
            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.formData)
                });

                if (response.ok) {
                    alert('提交成功！');
                    this.reset();
                } else {
                    alert('提交失败，请稍后重试');
                }
            } catch (error) {
                console.error('提交错误:', error);
                alert('网络错误，请稍后重试');
            } finally {
                this.isSubmitting = false;
            }
        },

        reset() {
            this.formData = {
                name: '',
                email: '',
                phone: '',
                message: ''
            };
            this.errors = {};
        }
    };
}

// 使用方式
/*
<form v-scope="ContactForm()" @submit.prevent="submit()">
    <div>
        <input 
            v-model="formData.name" 
            @blur="validate('name')"
            placeholder="姓名"
        >
        <span v-if="errors.name" class="error">{{ errors.name }}</span>
    </div>
    <div>
        <input 
            v-model="formData.email" 
            @blur="validate('email')"
            type="email"
            placeholder="邮箱"
        >
        <span v-if="errors.email" class="error">{{ errors.email }}</span>
    </div>
    <button type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? '提交中...' : '提交' }}
    </button>
</form>
*/
```

### 5. 状态管理 (stores/cart.js)

```javascript
// 简单的状态管理
const CartStore = {
    items: [],
    listeners: [],

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    },

    notify() {
        this.listeners.forEach(listener => listener(this.items));
    },

    load() {
        const saved = localStorage.getItem('cart');
        this.items = saved ? JSON.parse(saved) : [];
        this.notify();
    },

    save() {
        localStorage.setItem('cart', JSON.stringify(this.items));
        this.notify();
    },

    add(product) {
        const existing = this.items.find(item => item.id === product.id);
        if (existing) {
            existing.quantity += 1;
        } else {
            this.items.push({ ...product, quantity: 1 });
        }
        this.save();
    },

    remove(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.save();
    },

    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            item.quantity = quantity;
            if (item.quantity <= 0) {
                this.remove(productId);
            } else {
                this.save();
            }
        }
    },

    getTotal() {
        return this.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    },

    getItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    },

    clear() {
        this.items = [];
        this.save();
    }
};

// 在组件中使用
function ShoppingCart() {
    return {
        items: [],
        total: 0,

        init() {
            CartStore.load();
            this.items = CartStore.items;
            this.total = CartStore.getTotal();
            
            // 订阅更新
            this.unsubscribe = CartStore.subscribe((items) => {
                this.items = items;
                this.total = CartStore.getTotal();
            });
        },

        destroy() {
            if (this.unsubscribe) this.unsubscribe();
        },

        addToCart(product) {
            CartStore.add(product);
        },

        removeFromCart(productId) {
            CartStore.remove(productId);
        },

        updateQuantity(productId, quantity) {
            CartStore.updateQuantity(productId, quantity);
        },

        checkout() {
            // 结账逻辑
            alert(`总计: ¥${this.total.toFixed(2)}`);
        }
    };
}
```

### 6. 工具函数 (utils/api.js)

```javascript
// API 请求封装
const API = {
    baseUrl: '/api',
    
    async request(endpoint, options = {}) {
        const url = this.baseUrl + endpoint;
        const token = localStorage.getItem('authToken');
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        try {
            const response = await fetch(url, { ...options, headers });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    get(endpoint) {
        return this.request(endpoint);
    },
    
    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
};

// 使用示例
async function loadProducts() {
    try {
        const products = await API.get('/products');
        this.products = products;
    } catch (error) {
        alert('加载产品失败');
    }
}
```

## 最佳实践

### 1. 性能优化

```javascript
// 使用 v-once 避免重复渲染静态内容
<div v-once>
    <h1>{{ staticTitle }}</h1>
</div>

// 使用 v-memo 缓存列表项（Vue 3.2+）
<div v-for="item in list" v-memo="[item.id]">
    {{ item.name }}
</div>

// 防抖处理
function SearchInput() {
    return {
        query: '',
        results: [],
        searchTimeout: null,
        
        search() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(async () => {
                if (this.query.length > 2) {
                    const response = await fetch(`/api/search?q=${this.query}`);
                    this.results = await response.json();
                }
            }, 300);
        }
    };
}

// 懒加载图片
function LazyImage() {
    return {
        loaded: false,
        observer: null,
        
        init() {
            if ('IntersectionObserver' in window) {
                this.observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            this.loaded = true;
                            this.observer.disconnect();
                        }
                    });
                });
                this.observer.observe(this.$el);
            } else {
                this.loaded = true;
            }
        },
        
        destroy() {
            if (this.observer) {
                this.observer.disconnect();
            }
        }
    };
}
```

### 2. 代码组织

```javascript
// 使用模块化组织代码
// utils/helpers.js
export function formatDate(date) {
    return new Date(date).toLocaleDateString('zh-CN');
}

export function formatCurrency(amount) {
    return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY'
    }).format(amount);
}

// 在主文件中引入
// <script type="module" src="app.js"></script>
import { formatDate, formatCurrency } from './utils/helpers.js';

// 使用混入 (mixin 模式)
const ModalMixin = {
    isOpen: false,
    open() { this.isOpen = true; },
    close() { this.isOpen = false; }
};

function CustomModal() {
    return {
        ...ModalMixin,
        title: '',
        content: '',
        
        openWithContent(title, content) {
            this.title = title;
            this.content = content;
            this.open();
        }
    };
}
```

### 3. 无障碍访问 (A11y)

```html
<!-- 使用语义化标签 -->
<nav aria-label="主导航">
    <ul>
        <li><a href="/">首页</a></li>
        <li><a href="/about">关于</a></li>
    </ul>
</nav>

<!-- 表单无障碍 -->
<form @submit.prevent="submit">
    <label for="email">邮箱</label>
    <input 
        id="email"
        v-model="email"
        type="email"
        aria-describedby="email-error"
        required
    >
    <span v-if="errors.email" id="email-error" role="alert">
        {{ errors.email }}
    </span>
</form>

<!-- 模态框无障碍 -->
<div 
    v-scope="Modal()"
    v-show="isOpen"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
>
    <h2 id="modal-title">{{ title }}</h2>
    <button @click="close()" aria-label="关闭对话框">×</button>
</div>
```

### 4. 错误处理

```javascript
// 全局错误处理
window.addEventListener('error', (event) => {
    console.error('全局错误:', event.error);
    // 可以上报错误到服务器
});

// 异步错误处理
window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的 Promise 拒绝:', event.reason);
});

// API 错误处理
async function safeApiCall(apiCall) {
    try {
        return await apiCall();
    } catch (error) {
        console.error('API 调用失败:', error);
        // 显示用户友好的错误消息
        alert('操作失败，请稍后重试');
        return null;
    }
}
```

## 常用命令

### 开发

```bash
# 使用 Python 启动简单服务器
python -m http.server 8000

# 使用 Node.js serve 包
npx serve

# 使用 Vite 开发服务器（可选）
npm create vite@latest my-app -- --template vanilla
cd my-app
npm install petite-vue
npm run dev

# 安装依赖（如果使用 npm）
npm init -y
npm install petite-vue

# 实时重载（使用 live-server）
npx live-server --port=3000
```

### 生产部署

```bash
# 直接复制文件到服务器
scp -r ./* user@server:/var/www/html/

# 使用 rsync
rsync -avz --exclude 'node_modules' ./ user@server:/var/www/html/

# 使用 Netlify/Vercel 部署
# 直接连接 Git 仓库，自动部署

# 压缩静态资源
npx html-minifier-terser --collapse-whitespace --remove-comments --minify-css true --minify-js true -o index.min.html index.html

# 优化图片
npx imagemin images/* --out-dir=dist/images
```

## 部署配置

### Nginx 配置

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/petite-vue-app;
    index index.html;

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # HTML 文件不缓存
    location ~* \.html$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;
}
```

### Netlify 配置 (netlify.toml)

```toml
[build]
  publish = "."

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[redirects]]
  from = "/api/*"
  to = "https://api.example.com/:splat"
  status = 200
  force = true
```

### Vercel 配置 (vercel.json)

```json
{
  "version": 2,
  "public": true,
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://api.example.com/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    },
    {
      "source": "/(.*).js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### GitHub Pages 配置

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
          publish_branch: gh-pages
```

## 样式示例

```css
/* styles.css - 响应式设计 */
:root {
    --primary-color: #3498db;
    --secondary-color: #2ecc71;
    --text-color: #333;
    --bg-color: #f5f5f5;
    --error-color: #e74c3c;
    --success-color: #27ae60;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    line-height: 1.6;
    color: var(--text-color);
    background-color: var(--bg-color);
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* 导航栏 */
nav {
    background: white;
    padding: 1rem 0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

nav a {
    color: var(--text-color);
    text-decoration: none;
    margin-right: 1rem;
}

nav a:hover {
    color: var(--primary-color);
}

/* 按钮 */
button, .btn {
    background-color: var(--primary-color);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.3s;
}

button:hover, .btn:hover {
    background-color: #2980b9;
}

button:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
}

/* 表单 */
input, textarea, select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    margin-bottom: 1rem;
}

input:focus, textarea:focus {
    outline: none;
    border-color: var(--primary-color);
}

.error {
    color: var(--error-color);
    font-size: 0.875rem;
    margin-top: -0.5rem;
    margin-bottom: 1rem;
}

/* 卡片 */
.card {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin-bottom: 1rem;
}

/* 模态框 */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    max-width: 500px;
    width: 90%;
}

/* 响应式 */
@media (max-width: 768px) {
    .container {
        padding: 0 15px;
    }
    
    nav {
        text-align: center;
    }
    
    nav a {
        display: block;
        margin: 0.5rem 0;
    }
}

/* 工具类 */
.text-center { text-align: center; }
.mt-1 { margin-top: 0.5rem; }
.mt-2 { margin-top: 1rem; }
.mb-1 { margin-bottom: 0.5rem; }
.mb-2 { margin-bottom: 1rem; }
.hidden { display: none; }
```

## TypeScript 支持（可选）

```typescript
// app.ts
interface User {
    id: number;
    name: string;
    email: string;
}

interface Product {
    id: number;
    name: string;
    price: number;
    quantity?: number;
}

interface AppState {
    title: string;
    user: User | null;
    products: Product[];
    cart: Product[];
}

function App(): AppState {
    return {
        title: 'TypeScript 应用',
        user: null,
        products: [],
        cart: [],
        
        init() {
            this.loadData();
        },
        
        async loadData(): Promise<void> {
            try {
                const response = await fetch('/api/data');
                const data = await response.json();
                this.products = data.products;
            } catch (error) {
                console.error('加载数据失败:', error);
            }
        },
        
        addToCart(product: Product): void {
            this.cart.push(product);
        }
    };
}
```

## 参考资料

- [Petite-Vue 官方文档](https://github.com/vuejs/petite-vue)
- [Vue 3 文档](https://vuejs.org/)
- [MDN Web API](https://developer.mozilla.org/)
- [JavaScript 最佳实践](https://developer.mozilla.org/en-US/docs/MDN/Guidelines/Code_guidelines/JavaScript)
- [Web 无障碍指南](https://www.w3.org/WAI/WCAG21/quickref/)
