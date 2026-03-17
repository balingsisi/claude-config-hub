# Ant Design Mobile 移动端 UI 模板

## 技术栈

- **Ant Design Mobile**: 移动端 UI 组件库
- **React 18**: 用户界面库
- **TypeScript**: 类型支持
- **Vite**: 下一代前端构建工具
- **React Router**: 路由管理
- **Zustand**: 轻量级状态管理
- **Ahooks**: React Hooks 工具集

## 项目结构

```
ant-design-mobile-app/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── TabBarLayout.tsx
│   │   │   ├── NavBar.tsx
│   │   │   └── SafeArea.tsx
│   │   ├── Forms/
│   │   │   ├── LoginForm.tsx
│   │   │   └── SearchForm.tsx
│   │   ├── Lists/
│   │   │   ├── UserList.tsx
│   │   │   └── ProductList.tsx
│   │   └── Common/
│   │       ├── PullToRefresh.tsx
│   │       ├── InfiniteScroll.tsx
│   │       └── EmptyState.tsx
│   ├── pages/
│   │   ├── Home/
│   │   │   └── index.tsx
│   │   ├── User/
│   │   │   ├── index.tsx
│   │   │   ├── Profile.tsx
│   │   │   └── Settings.tsx
│   │   ├── Cart/
│   │   │   └── index.tsx
│   │   └── Product/
│   │       ├── List.tsx
│   │       └── Detail.tsx
│   ├── hooks/
│   │   ├── useRequest.ts
│   │   ├── useAuth.ts
│   │   └── useToast.ts
│   ├── stores/
│   │   ├── userStore.ts
│   │   └── cartStore.ts
│   ├── utils/
│   │   ├── request.ts
│   │   ├── storage.ts
│   │   └── navigation.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
│   └── favicon.ico
├── index.html
├── vite.config.ts
├── package.json
└── tsconfig.json
```

## 代码模式

### 应用入口

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd-mobile';
import zhCN from 'antd-mobile/es/locales/zh-CN';

import App from './App';

import 'antd-mobile/bundle/style.css';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>
);
```

### App 组件

```tsx
// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import TabBarLayout from './components/Layout/TabBarLayout';
import Home from './pages/Home';
import User from './pages/User';
import Cart from './pages/Cart';
import ProductList from './pages/Product/List';
import ProductDetail from './pages/Product/Detail';

export default function App() {
  return (
    <div className="app">
      <Routes>
        {/* 带底部导航的页面 */}
        <Route element={<TabBarLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/user" element={<User />} />
          <Route path="/cart" element={<Cart />} />
        </Route>

        {/* 不带底部导航的页面 */}
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/:id" element={<ProductDetail />} />
      </Routes>
    </div>
  );
}
```

### 底部导航布局

```tsx
// src/components/Layout/TabBarLayout.tsx
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TabBar } from 'antd-mobile';
import {
  AppOutline,
  MessageOutline,
  UserOutline,
  CartOutline,
} from 'antd-mobile-icons';

const tabs = [
  {
    key: '/',
    title: '首页',
    icon: <AppOutline />,
  },
  {
    key: '/messages',
    title: '消息',
    icon: <MessageOutline />,
  },
  {
    key: '/cart',
    title: '购物车',
    icon: <CartOutline />,
    badge: '5',
  },
  {
    key: '/user',
    title: '我的',
    icon: <UserOutline />,
  },
];

export default function TabBarLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { pathname } = location;

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto pb-12">
        <Outlet />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <TabBar activeKey={pathname} onChange={(value) => navigate(value)}>
          {tabs.map((item) => (
            <TabBar.Item
              key={item.key}
              icon={item.icon}
              title={item.title}
              badge={item.badge}
            />
          ))}
        </TabBar>
      </div>
    </div>
  );
}
```

### 导航栏

```tsx
// src/components/Layout/NavBar.tsx
import { useNavigate } from 'react-router-dom';
import { NavBar, Space, Button } from 'antd-mobile';
import { SearchOutline, MoreOutline } from 'antd-mobile-icons';

interface NavBarProps {
  title?: string;
  back?: boolean | string;
  right?: React.ReactNode;
  onBack?: () => void;
}

export default function NavBar({
  title,
  back,
  right,
  onBack,
}: NavBarProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (typeof back === 'string') {
      navigate(back);
    } else {
      navigate(-1);
    }
  };

  return (
    <NavBar
      className="sticky top-0 z-50 bg-white border-b border-gray-200"
      back={back}
      onBack={handleBack}
      right={right}
    >
      {title}
    </NavBar>
  );
}

// 使用示例
<NavBar
  title="商品详情"
  back
  right={
    <Space>
      <SearchOutline fontSize={20} />
      <MoreOutline fontSize={20} />
    </Space>
  }
/>
```

### 首页

```tsx
// src/pages/Home/index.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SearchBar,
  Swiper,
  Grid,
  Card,
  Space,
  Tag,
  DotLoading,
} from 'antd-mobile';
import { useRequest } from 'ahooks';
import NavBar from '@/components/Layout/NavBar';

const banners = [
  { id: 1, image: 'https://example.com/banner1.jpg' },
  { id: 2, image: 'https://example.com/banner2.jpg' },
  { id: 3, image: 'https://example.com/banner3.jpg' },
];

const categories = [
  { id: 1, name: '电子产品', icon: '📱' },
  { id: 2, name: '服装', icon: '👕' },
  { id: 3, name: '食品', icon: '🍔' },
  { id: 4, name: '图书', icon: '📚' },
  { id: 5, name: '家居', icon: '🏠' },
  { id: 6, name: '美妆', icon: '💄' },
  { id: 7, name: '运动', icon: '⚽' },
  { id: 8, name: '更多', icon: '➕' },
];

export default function Home() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');

  const { data: products, loading } = useRequest(
    () => fetch('/api/products').then((res) => res.json())
  );

  return (
    <div>
      <NavBar
        title="首页"
        right={
          <SearchBar
            placeholder="搜索商品"
            value={searchText}
            onChange={setSearchText}
            style={{ '--background': '#f5f5f5' }}
          />
        }
      />

      <div className="p-4 space-y-6">
        {/* 轮播图 */}
        <Swiper autoplay loop>
          {banners.map((item) => (
            <Swiper.Item key={item.id}>
              <div
                className="h-48 bg-cover bg-center rounded-lg"
                style={{ backgroundImage: `url(${item.image})` }}
              />
            </Swiper.Item>
          ))}
        </Swiper>

        {/* 分类网格 */}
        <Grid columns={4} gap={16}>
          {categories.map((item) => (
            <Grid.Item key={item.id}>
              <div className="flex flex-col items-center justify-center py-3">
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="text-xs text-gray-700">{item.name}</div>
              </div>
            </Grid.Item>
          ))}
        </Grid>

        {/* 商品推荐 */}
        <div>
          <h2 className="text-lg font-bold mb-4">推荐商品</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <DotLoading color="primary" />
            </div>
          ) : (
            <Grid columns={2} gap={16}>
              {products?.map((product: any) => (
                <Grid.Item key={product.id}>
                  <Card
                    onClick={() => navigate(`/products/${product.id}`)}
                    className="overflow-hidden"
                  >
                    <div className="aspect-square bg-gray-100 mb-2">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="px-2 pb-2">
                      <div className="text-sm font-medium truncate mb-1">
                        {product.name}
                      </div>
                      <Space>
                        <span className="text-red-500 font-bold">
                          ¥{product.price}
                        </span>
                        {product.originalPrice && (
                          <span className="text-xs text-gray-400 line-through">
                            ¥{product.originalPrice}
                          </span>
                        )}
                      </Space>
                      {product.tags?.map((tag: string) => (
                        <Tag key={tag} color="primary" className="mt-2">
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  </Card>
                </Grid.Item>
              ))}
            </Grid>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 商品列表（带下拉刷新和无限滚动）

```tsx
// src/pages/Product/List.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SearchBar,
  Card,
  Space,
  Tag,
  PullToRefresh,
  InfiniteScroll,
  Empty,
} from 'antd-mobile';
import { useRequest } from 'ahooks';
import NavBar from '@/components/Layout/NavBar';

export default function ProductList() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const { loading, run: loadProducts } = useRequest(
    async (currentPage: number) => {
      const res = await fetch(`/api/products?page=${currentPage}&search=${searchText}`);
      const data = await res.json();
      
      if (currentPage === 1) {
        setProducts(data.list);
      } else {
        setProducts([...products, ...data.list]);
      }
      
      setHasMore(data.hasMore);
      setPage(currentPage);
    },
    { manual: true }
  );

  const handleRefresh = async () => {
    await loadProducts(1);
  };

  const handleLoadMore = async () => {
    await loadProducts(page + 1);
  };

  return (
    <div>
      <NavBar title="商品列表" back />

      <div className="sticky top-0 z-40 bg-white p-4 border-b border-gray-200">
        <SearchBar
          placeholder="搜索商品"
          value={searchText}
          onChange={setSearchText}
          onSearch={() => loadProducts(1)}
        />
      </div>

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="p-4 space-y-4">
          {products.length === 0 && !loading ? (
            <Empty description="暂无商品" />
          ) : (
            <>
              {products.map((product) => (
                <Card
                  key={product.id}
                  onClick={() => navigate(`/products/${product.id}`)}
                  className="overflow-hidden"
                >
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-gray-100 flex-shrink-0">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium mb-2">{product.name}</div>
                      <div className="text-sm text-gray-500 mb-2 line-clamp-2">
                        {product.description}
                      </div>
                      <Space>
                        <span className="text-red-500 font-bold">
                          ¥{product.price}
                        </span>
                        <span className="text-xs text-gray-400">
                          已售 {product.sales}
                        </span>
                      </Space>
                      {product.tags?.map((tag: string) => (
                        <Tag key={tag} color="primary" className="ml-2">
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}

              <InfiniteScroll loadMore={handleLoadMore} hasMore={hasMore} />
            </>
          )}
        </div>
      </PullToRefresh>
    </div>
  );
}
```

### 登录表单

```tsx
// src/components/Forms/LoginForm.tsx
import { useState } from 'react';
import { Form, Input, Button, Checkbox, Toast } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { useRequest } from 'ahooks';

export default function LoginForm() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [agreed, setAgreed] = useState(false);

  const { loading, run: handleSubmit } = useRequest(
    async (values: any) => {
      if (!agreed) {
        Toast.show({
          content: '请同意用户协议',
          icon: 'fail',
        });
        return;
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        Toast.show({
          content: '登录成功',
          icon: 'success',
        });
        navigate('/');
      } else {
        Toast.show({
          content: '登录失败',
          icon: 'fail',
        });
      }
    },
    { manual: true }
  );

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">欢迎回来</h1>
        <p className="text-gray-500">请登录您的账号</p>
      </div>

      <Form
        form={form}
        layout="horizontal"
        onFinish={handleSubmit}
        footer={
          <Button
            block
            type="submit"
            color="primary"
            size="large"
            loading={loading}
          >
            登录
          </Button>
        }
      >
        <Form.Item
          name="phone"
          label="手机号"
          rules={[
            { required: true, message: '请输入手机号' },
            { pattern: /^1\d{10}$/, message: '手机号格式不正确' },
          ]}
        >
          <Input placeholder="请输入手机号" clearable />
        </Form.Item>

        <Form.Item
          name="password"
          label="密码"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码至少6位' },
          ]}
        >
          <Input placeholder="请输入密码" clearable type="password" />
        </Form.Item>

        <Form.Item>
          <div className="flex items-center justify-between">
            <Checkbox
              checked={agreed}
              onChange={setAgreed}
            >
              同意
              <a href="/agreement" className="text-blue-500">用户协议</a>
            </Checkbox>
            <a href="/forgot-password" className="text-blue-500 text-sm">
              忘记密码？
            </a>
          </div>
        </Form.Item>
      </Form>

      <div className="mt-6 text-center">
        <span className="text-gray-500">还没有账号？</span>
        <a href="/register" className="text-blue-500 ml-1">立即注册</a>
      </div>
    </div>
  );
}
```

### 用户中心

```tsx
// src/pages/User/index.tsx
import { useNavigate } from 'react-router-dom';
import { List, Avatar, Space, Badge } from 'antd-mobile';
import {
  UnorderedListOutline,
  PayCircleOutline,
  SetOutline,
  RightOutline,
} from 'antd-mobile-icons';
import NavBar from '@/components/Layout/NavBar';
import { useUserStore } from '@/stores/userStore';

const menuItems = [
  {
    icon: <UnorderedListOutline />,
    title: '我的订单',
    badge: '3',
  },
  {
    icon: <PayCircleOutline />,
    title: '我的钱包',
    extra: '¥999.00',
  },
  {
    icon: <SetOutline />,
    title: '设置',
  },
];

export default function User() {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);

  return (
    <div>
      <NavBar title="我的" />

      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6">
        <div className="flex items-center gap-4">
          <Avatar src={user?.avatar} className="w-16 h-16" />
          <div>
            <div className="text-xl font-bold mb-1">{user?.name}</div>
            <div className="text-sm opacity-80">{user?.phone}</div>
          </div>
        </div>
      </div>

      <div className="m-4">
        <List header="常用功能">
          {menuItems.map((item, index) => (
            <List.Item
              key={index}
              prefix={item.icon}
              extra={
                item.badge ? (
                  <Badge content={item.badge}>
                    <RightOutline />
                  </Badge>
                ) : item.extra ? (
                  <Space>
                    <span className="text-red-500">{item.extra}</span>
                    <RightOutline />
                  </Space>
                ) : (
                  <RightOutline />
                )
              }
              onClick={() => navigate(`/${item.title}`)}
            >
              {item.title}
            </List.Item>
          ))}
        </List>
      </div>
    </div>
  );
}
```

### 购物车

```tsx
// src/pages/Cart/index.tsx
import { useState } from 'react';
import {
  List,
  SwipeAction,
  Checkbox,
  Space,
  Button,
  Price,
  Dialog,
} from 'antd-mobile';
import { DeleteOutline } from 'antd-mobile-icons';
import NavBar from '@/components/Layout/NavBar';
import { useCartStore } from '@/stores/cartStore';

export default function Cart() {
  const { items, removeItem, updateQuantity } = useCartStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const totalPrice = items
    .filter((item) => selectedIds.includes(item.id))
    .reduce((total, item) => total + item.price * item.quantity, 0);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(items.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Dialog.confirm({
      content: '确定删除该商品吗？',
    });
    
    if (result) {
      removeItem(id);
      setSelectedIds(selectedIds.filter((itemId) => itemId !== id));
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <NavBar title="购物车" />

      <div className="flex-1 overflow-y-auto">
        <List>
          {items.map((item) => (
            <SwipeAction
              key={item.id}
              rightActions={[
                {
                  key: 'delete',
                  text: <DeleteOutline fontSize={20} />,
                  color: 'danger',
                  onClick: () => handleDelete(item.id),
                },
              ]}
            >
              <List.Item
                prefix={
                  <Checkbox
                    checked={selectedIds.includes(item.id)}
                    onChange={(checked) => {
                      if (checked) {
                        setSelectedIds([...selectedIds, item.id]);
                      } else {
                        setSelectedIds(
                          selectedIds.filter((id) => id !== item.id)
                        );
                      }
                    }}
                  />
                }
                description={
                  <Space direction="vertical">
                    <div className="text-xs text-gray-500">
                      规格: {item.spec}
                    </div>
                    <div className="flex items-center justify-between">
                      <Price value={item.price} />
                      <Space>
                        <Button
                          size="mini"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                        >
                          -
                        </Button>
                        <span>{item.quantity}</span>
                        <Button
                          size="mini"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          +
                        </Button>
                      </Space>
                    </div>
                  </Space>
                }
              >
                <div className="flex gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                  </div>
                </div>
              </List.Item>
            </SwipeAction>
          ))}
        </List>
      </div>

      <div className="sticky bottom-12 bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <Checkbox
            checked={selectedIds.length === items.length}
            onChange={handleSelectAll}
          >
            全选
          </Checkbox>
          <Space>
            <div>
              合计: <Price value={totalPrice} color="danger" />
            </div>
            <Button color="danger" size="large">
              结算({selectedIds.length})
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
}
```

### 状态管理

```ts
// src/stores/cartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  spec: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existingItem = state.items.find((i) => i.id === item.id);
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.id === item.id
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: Math.max(0, quantity) } : i
          ),
        })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'cart-storage',
    }
  )
);
```

### 自定义 Hooks

```ts
// src/hooks/useToast.ts
import { Toast } from 'antd-mobile';

export function useToast() {
  const showSuccess = (content: string) => {
    Toast.show({
      content,
      icon: 'success',
    });
  };

  const showError = (content: string) => {
    Toast.show({
      content,
      icon: 'fail',
    });
  };

  const showLoading = (content: string) => {
    Toast.show({
      content,
      icon: 'loading',
      duration: 0,
    });
  };

  const hide = () => {
    Toast.clear();
  };

  return {
    showSuccess,
    showError,
    showLoading,
    hide,
  };
}
```

## 最佳实践

### 1. 适配安全区域

```tsx
// src/components/Layout/SafeArea.tsx
import { SafeArea } from 'antd-mobile';

export default function SafeAreaWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SafeArea position="top" />
      {children}
      <SafeArea position="bottom" />
    </>
  );
}
```

### 2. 图片懒加载

```tsx
import { Image } from 'antd-mobile';
import { LazyLoad } from 'antd-mobile/es/components/image/lazy-load';

<Image
  src={imageUrl}
  lazy
  placeholder={<div className="bg-gray-100 animate-pulse" />}
  fallback={<div className="bg-gray-100">加载失败</div>}
  style={{ '--width': '100%', '--height': '200px' }}
/>
```

### 3. 防抖搜索

```tsx
import { useDebounceFn } from 'ahooks';

const { run: handleSearch } = useDebounceFn(
  (value: string) => {
    // 执行搜索
  },
  { wait: 500 }
);

<SearchBar onChange={handleSearch} />
```

### 4. 路由懒加载

```tsx
import { lazy, Suspense } from 'react';
import { DotLoading } from 'antd-mobile';

const ProductDetail = lazy(() => import('./pages/Product/Detail'));

function App() {
  return (
    <Suspense fallback={<DotLoading color="primary" />}>
      <Routes>
        <Route path="/products/:id" element={<ProductDetail />} />
      </Routes>
    </Suspense>
  );
}
```

### 5. 请求封装

```ts
// src/utils/request.ts
import { Toast } from 'antd-mobile';

const request = async <T = any>(
  url: string,
  options?: RequestInit
): Promise<T> => {
  const token = localStorage.getItem('token');

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      Toast.show({
        content: '请先登录',
        icon: 'fail',
      });
      window.location.href = '/login';
    }

    throw new Error('Request failed');
  }

  return response.json();
};

export default request;
```

## 常用命令

### 开发

```bash
# 安装依赖
npm install antd-mobile antd-mobile-icons ahooks zustand react-router-dom

# 开发模式
npm run dev

# 构建
npm run build

# 预览
npm run preview
```

### Vite 配置

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});
```

## 部署配置

### PWA 配置

```json
// manifest.json
{
  "name": "My App",
  "short_name": "MyApp",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1677ff",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 环境变量

```env
# .env.example
VITE_API_URL=https://api.example.com
VITE_APP_TITLE=移动应用
```

## 性能优化

### 1. 按需加载

```ts
// vite.config.ts
import styleImport from 'vite-plugin-style-import';

export default defineConfig({
  plugins: [
    styleImport({
      libs: [
        {
          libraryName: 'antd-mobile',
          esModule: true,
        },
      ],
    }),
  ],
});
```

### 2. 虚拟列表

```tsx
import { List } from 'antd-mobile';
import { VirtualList } from 'antd-mobile/es/components/list/virtual-list';

<List>
  <VirtualList
    items={items}
    itemHeight={80}
    renderItem={(item) => <List.Item>{item.name}</List.Item>}
  />
</List>
```

### 3. 图片压缩

```ts
// vite.config.ts
import viteImagemin from 'vite-plugin-imagemin';

export default defineConfig({
  plugins: [
    viteImagemin({
      gifsicle: { optimizationLevel: 3 },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      svgo: { plugins: [{ name: 'removeViewBox' }] },
    }),
  ],
});
```
