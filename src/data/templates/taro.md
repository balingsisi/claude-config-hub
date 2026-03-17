# Taro Template

## Project Overview

Taro - A cross-platform framework for building applications that run on multiple platforms (WeChat Mini Program, Alipay Mini Program, H5, React Native, etc.) using React/Vue.

## Tech Stack

- **Framework**: Taro 3.x+
- **Language**: TypeScript
- **UI Library**: React / Vue
- **Styling**: Sass/Less, Tailwind CSS
- **Platforms**: WeChat, Alipay, H5, React Native, JD Mini Program
- **State Management**: Redux / MobX / Zustand

## Project Structure

```
taro-project/
├── config/
│   ├── index.ts              # Main config
│   ├── dev.ts                # Development config
│   └── prod.ts               # Production config
├── src/
│   ├── pages/
│   │   ├── index/
│   │   │   ├── index.tsx     # Page component
│   │   │   ├── index.config.ts # Page config
│   │   │   └── index.module.scss
│   │   └── user/
│   │       ├── index.tsx
│   │       └── index.config.ts
│   ├── components/
│   │   ├── Header/
│   │   │   ├── index.tsx
│   │   │   └── index.module.scss
│   │   └── ProductCard/
│   ├── services/
│   │   ├── api.ts            # API client
│   │   └── auth.ts           # Auth service
│   ├── store/
│   │   ├── index.ts          # Store setup
│   │   └── modules/
│   │       ├── user.ts       # User slice
│   │       └── cart.ts       # Cart slice
│   ├── utils/
│   │   ├── request.ts        # HTTP client
│   │   └── storage.ts        # Storage helpers
│   ├── app.tsx               # App entry
│   ├── app.config.ts         # App config
│   └── index.html            # H5 entry
├── package.json
├── project.config.json       # WeChat Mini Program config
└── tsconfig.json
```

## Key Patterns

### 1. App Configuration

```typescript
// src/app.config.ts
export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/user/index',
    'pages/cart/index',
    'pages/product/detail',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'My App',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    color: '#999',
    selectedColor: '#3b82f6',
    backgroundColor: '#ffffff',
    list: [
      {
        pagePath: 'pages/index/index',
        text: 'Home',
        iconPath: 'assets/icons/home.png',
        selectedIconPath: 'assets/icons/home-active.png',
      },
      {
        pagePath: 'pages/cart/index',
        text: 'Cart',
        iconPath: 'assets/icons/cart.png',
        selectedIconPath: 'assets/icons/cart-active.png',
      },
      {
        pagePath: 'pages/user/index',
        text: 'Profile',
        iconPath: 'assets/icons/user.png',
        selectedIconPath: 'assets/icons/user-active.png',
      },
    ],
  },
  plugins: {},
  permission: {
    'scope.userLocation': {
      desc: 'Your location will be used for delivery',
    },
  },
});
```

### 2. App Entry

```typescript
// src/app.tsx
import { Component } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import './app.scss';

class App extends Component {
  componentDidMount() {
    // App launched
    this.checkUpdate();
  }

  componentDidShow() {
    // App shown from background
  }

  componentDidHide() {
    // App hidden to background
  }

  componentDidCatchError(error: Error) {
    console.error('App error:', error);
  }

  // Check for mini program updates
  checkUpdate() {
    if (process.env.TARO_ENV === 'weapp') {
      const updateManager = Taro.getUpdateManager();
      
      updateManager.onCheckForUpdate((res) => {
        console.log('Has update:', res.hasUpdate);
      });

      updateManager.onUpdateReady(() => {
        Taro.showModal({
          title: 'Update Available',
          content: 'New version ready, restart now?',
          success: (res) => {
            if (res.confirm) {
              updateManager.applyUpdate();
            }
          },
        });
      });

      updateManager.onUpdateFailed(() => {
        Taro.showToast({
          title: 'Update failed',
          icon: 'none',
        });
      });
    }
  }

  render() {
    return (
      <Provider store={store}>
        {this.props.children}
      </Provider>
    );
  }
}

export default App;
```

### 3. Page Component

```typescript
// src/pages/index/index.tsx
import { View, Text, Image, Button } from '@tarojs/components';
import Taro, { useLoad, useReady, useDidShow, useDidHide } from '@tarojs/taro';
import { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ProductCard from '../../components/ProductCard';
import { fetchProducts } from '../../store/modules/product';
import './index.module.scss';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.info);

  // Lifecycle hooks
  useLoad(() => {
    console.log('Page loaded');
  });

  useReady(() => {
    console.log('Page ready');
    loadProducts();
  });

  useDidShow(() => {
    console.log('Page shown');
  });

  useDidHide(() => {
    console.log('Page hidden');
  });

  // Load products
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const result = await dispatch(fetchProducts());
      setProducts(result.payload);
    } catch (error) {
      Taro.showToast({
        title: 'Failed to load products',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  // Navigate to product detail
  const goToDetail = (id: string) => {
    Taro.navigateTo({
      url: `/pages/product/detail?id=${id}`,
    });
  };

  // Pull to refresh
  usePullDownRefresh(() => {
    loadProducts().finally(() => {
      Taro.stopPullDownRefresh();
    });
  });

  return (
    <View className='index'>
      <View className='header'>
        <Text className='title'>Welcome, {user?.name || 'Guest'}</Text>
      </View>

      {loading ? (
        <View className='loading'>Loading...</View>
      ) : (
        <View className='product-list'>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => goToDetail(product.id)}
            />
          ))}
        </View>
      )}

      <Button onClick={loadProducts}>Refresh</Button>
    </View>
  );
}

// Page configuration
definePageConfig({
  navigationBarTitleText: 'Home',
  enablePullDownRefresh: true,
  backgroundTextStyle: 'dark',
});
```

### 4. Component

```tsx
// src/components/ProductCard/index.tsx
import { View, Text, Image } from '@tarojs/components';
import { memo } from 'react';
import './index.module.scss';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    description?: string;
  };
  onClick?: () => void;
}

const ProductCard = memo<ProductCardProps>(({ product, onClick }) => {
  const formatPrice = (price: number) => {
    return `¥${(price / 100).toFixed(2)}`;
  };

  return (
    <View className='product-card' onClick={onClick}>
      <Image
        className='product-image'
        src={product.image}
        mode='aspectFill'
        lazyLoad
      />
      <View className='product-info'>
        <Text className='product-name'>{product.name}</Text>
        {product.description && (
          <Text className='product-desc'>{product.description}</Text>
        )}
        <Text className='product-price'>{formatPrice(product.price)}</Text>
      </View>
    </View>
  );
});

export default ProductCard;
```

```scss
// src/components/ProductCard/index.module.scss
.product-card {
  display: flex;
  padding: 20px;
  margin-bottom: 20px;
  background: #fff;
  border-radius: 8px;
}

.product-image {
  width: 200px;
  height: 200px;
  border-radius: 8px;
}

.product-info {
  flex: 1;
  margin-left: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-name {
  font-size: 32px;
  font-weight: bold;
  color: #333;
}

.product-desc {
  font-size: 24px;
  color: #666;
  margin-top: 10px;
}

.product-price {
  font-size: 36px;
  color: #ff4444;
  font-weight: bold;
}
```

### 5. HTTP Client

```typescript
// src/utils/request.ts
import Taro from '@tarojs/taro';

const BASE_URL = process.env.TARO_APP_API_BASE_URL || 'https://api.example.com';

interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: Record<string, string>;
  showLoading?: boolean;
}

interface Response<T = any> {
  code: number;
  data: T;
  message: string;
}

class HttpClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    Taro.setStorageSync('token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = Taro.getStorageSync('token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    Taro.removeStorageSync('token');
  }

  async request<T = any>(options: RequestOptions): Promise<T> {
    const { url, method = 'GET', data, header = {}, showLoading = false } = options;

    if (showLoading) {
      Taro.showLoading({ title: 'Loading...' });
    }

    try {
      const token = this.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...header,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await Taro.request({
        url: `${BASE_URL}${url}`,
        method,
        data,
        header: headers,
      });

      const result: Response<T> = response.data as Response<T>;

      // Handle business errors
      if (result.code !== 0) {
        throw new Error(result.message || 'Request failed');
      }

      return result.data;
    } catch (error: any) {
      // Handle 401 unauthorized
      if (error.statusCode === 401) {
        this.clearToken();
        Taro.redirectTo({ url: '/pages/login/index' });
        throw new Error('Unauthorized');
      }

      Taro.showToast({
        title: error.message || 'Network error',
        icon: 'none',
      });

      throw error;
    } finally {
      if (showLoading) {
        Taro.hideLoading();
      }
    }
  }

  get<T = any>(url: string, params?: any) {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.request<T>({ url: url + queryString });
  }

  post<T = any>(url: string, data?: any) {
    return this.request<T>({ url, method: 'POST', data });
  }

  put<T = any>(url: string, data?: any) {
    return this.request<T>({ url, method: 'PUT', data });
  }

  delete<T = any>(url: string, data?: any) {
    return this.request<T>({ url, method: 'DELETE', data });
  }
}

export const http = new HttpClient();
```

### 6. API Service

```typescript
// src/services/api.ts
import { http } from '../utils/request';

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  stock: number;
}

export interface LoginParams {
  phone: string;
  code: string;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  avatar: string;
}

export const api = {
  // Auth
  login: (params: LoginParams) =>
    http.post<{ token: string; user: User }>('/auth/login', params),

  logout: () => http.post('/auth/logout'),

  getUserInfo: () => http.get<User>('/user/info'),

  // Products
  getProducts: (params?: { category?: string; page?: number }) =>
    http.get<Product[]>('/products', params),

  getProductDetail: (id: string) =>
    http.get<Product>(`/products/${id}`),

  // Cart
  getCart: () => http.get('/cart'),

  addToCart: (productId: string, quantity: number) =>
    http.post('/cart/items', { productId, quantity }),

  updateCartItem: (itemId: string, quantity: number) =>
    http.put(`/cart/items/${itemId}`, { quantity }),

  removeCartItem: (itemId: string) =>
    http.delete(`/cart/items/${itemId}`),

  // Orders
  createOrder: (data: { addressId: string; items: any[] }) =>
    http.post('/orders', data),

  getOrders: (params?: { status?: string }) =>
    http.get('/orders', params),

  cancelOrder: (orderId: string) =>
    http.post(`/orders/${orderId}/cancel`),
};
```

### 7. Redux Store

```typescript
// src/store/index.ts
import { createStore, combineReducers } from 'redux';
import { userReducer } from './modules/user';
import { cartReducer } from './modules/cart';

const rootReducer = combineReducers({
  user: userReducer,
  cart: cartReducer,
});

export const store = createStore(rootReducer);
```

```typescript
// src/store/modules/user.ts
import { api } from '../../services/api';

// Action Types
const SET_USER = 'user/SET_USER';
const CLEAR_USER = 'user/CLEAR_USER';

// Actions
export const setUser = (user: any) => ({ type: SET_USER, payload: user });
export const clearUser = () => ({ type: CLEAR_USER });

// Thunk
export const fetchUserInfo = () => async (dispatch: any) => {
  try {
    const user = await api.getUserInfo();
    dispatch(setUser(user));
    return user;
  } catch (error) {
    dispatch(clearUser());
    throw error;
  }
};

// Reducer
const initialState = {
  info: null,
  isLoggedIn: false,
};

export const userReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case SET_USER:
      return {
        ...state,
        info: action.payload,
        isLoggedIn: true,
      };
    case CLEAR_USER:
      return initialState;
    default:
      return state;
  }
};
```

### 8. Storage Helpers

```typescript
// src/utils/storage.ts
import Taro from '@tarojs/taro';

export const storage = {
  get<T = any>(key: string): T | null {
    try {
      const value = Taro.getStorageSync(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  },

  set(key: string, value: any): void {
    try {
      Taro.setStorageSync(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },

  remove(key: string): void {
    Taro.removeStorageSync(key);
  },

  clear(): void {
    Taro.clearStorageSync();
  },

  // Get with expiration
  getWithExpiry<T = any>(key: string, maxAge: number): T | null {
    const item = this.get<{ value: T; timestamp: number }>(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > maxAge) {
      this.remove(key);
      return null;
    }

    return item.value;
  },

  // Set with timestamp
  setWithTimestamp(key: string, value: any): void {
    this.set(key, {
      value,
      timestamp: Date.now(),
    });
  },
};
```

### 9. Platform-Specific Code

```typescript
// src/utils/platform.ts
import Taro from '@tarojs/taro';

// Check current platform
export const isWeapp = process.env.TARO_ENV === 'weapp';
export const isAlipay = process.env.TARO_ENV === 'alipay';
export const isH5 = process.env.TARO_ENV === 'h5';
export const isRN = process.env.TARO_ENV === 'rn';

// Platform-specific payment
export const requestPayment = async (orderInfo: any) => {
  if (isWeapp) {
    return Taro.requestPayment({
      timeStamp: orderInfo.timeStamp,
      nonceStr: orderInfo.nonceStr,
      package: orderInfo.package,
      signType: 'MD5',
      paySign: orderInfo.paySign,
    });
  }

  if (isAlipay) {
    return Taro.requestPayment({
      orderStr: orderInfo.orderStr,
    });
  }

  if (isH5) {
    // Redirect to payment page
    window.location.href = orderInfo.paymentUrl;
    return Promise.resolve();
  }

  throw new Error('Payment not supported on this platform');
};

// Platform-specific login
export const login = async () => {
  if (isWeapp) {
    const { code } = await Taro.login();
    return api.login({ code });
  }

  if (isAlipay) {
    const { authCode } = await Taro.getAuthCode();
    return api.login({ authCode });
  }

  if (isH5 || isRN) {
    // Redirect to login page
    Taro.navigateTo({ url: '/pages/login/index' });
    return Promise.reject('Need manual login');
  }
};
```

## Configuration

### config/index.ts

```typescript
const config = {
  projectName: 'taro-app',
  date: '2024-1-1',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [],
  defineConstants: {},
  copy: {
    patterns: [],
    options: {},
  },
  framework: 'react',
  compiler: {
    type: 'webpack5',
    prebundle: { enable: false },
  },
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {},
      },
      cssModules: {
        enable: true,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]',
        },
      },
    },
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    postcss: {
      autoprefixer: {
        enable: true,
      },
      cssModules: {
        enable: true,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]',
        },
      },
    },
  },
  rn: {
    appName: 'TaroApp',
    postcss: {
      cssModules: {
        enable: true,
      },
    },
  },
};

module.exports = function (merge) {
  if (process.env.NODE_ENV === 'development') {
    return merge({}, config, require('./dev'));
  }
  return merge({}, config, require('./prod'));
};
```

### project.config.json (WeChat)

```json
{
  "miniprogramRoot": "dist/",
  "projectname": "taro-app",
  "description": "Taro cross-platform app",
  "appid": "wx1234567890abcdef",
  "setting": {
    "urlCheck": false,
    "es6": false,
    "enhance": false,
    "postcss": false,
    "preloadBackgroundData": false,
    "minified": false,
    "newFeature": false,
    "coverView": true,
    "nodeModules": false,
    "autoAudits": false,
    "showShadowRootInWxmlPanel": true,
    "scopeDataCheck": false,
    "uglifyFileName": false,
    "checkInvalidKey": true,
    "checkSiteMap": true,
    "uploadWithSourceMap": true,
    "compileHotReLoad": false,
    "lazyloadPlaceholderEnable": false,
    "useMultiFrameRuntime": true,
    "useApiHook": true,
    "useApiHostProcess": true,
    "babelSetting": {
      "ignore": [],
      "disablePlugins": [],
      "outputPath": ""
    },
    "useIsolateContext": true,
    "userConfirmedBundleSwitch": false,
    "packNpmManually": false,
    "packNpmRelationList": [],
    "minifyWXSS": true,
    "disableUseStrict": false,
    "minifyWXML": true,
    "showES6CompileOption": false,
    "useCompilerPlugins": false
  },
  "compileType": "miniprogram",
  "condition": {}
}
```

## Build Commands

```bash
# Development
npm run dev:weapp        # WeChat Mini Program
npm run dev:alipay       # Alipay Mini Program
npm run dev:h5           # H5
npm run dev:rn           # React Native

# Production
npm run build:weapp      # WeChat Mini Program
npm run build:alipay     # Alipay Mini Program
npm run build:h5         # H5
npm run build:rn         # React Native

# Preview H5
npm run preview

# Analyze bundle
npm run analyze
```

## Best Practices

### 1. Optimize Images

```typescript
// Use lazy load and CDN
<Image
  src={`${CDN_URL}${image}?x-oss-process=image/resize,w_400`}
  lazyLoad
  mode='aspectFill'
/>
```

### 2. Subpackages

```typescript
// app.config.ts
export default defineAppConfig({
  pages: [
    'pages/index/index',
  ],
  subPackages: [
    {
      root: 'packageA',
      pages: [
        'pages/detail/index',
        'pages/list/index',
      ],
    },
  ],
});
```

### 3. Code Splitting

```typescript
// Lazy load components
const HeavyComponent = Taro.memo(() => {
  const [Component, setComponent] = useState(null);
  
  useEffect(() => {
    import('./HeavyComponent').then((mod) => {
      setComponent(() => mod.default);
    });
  }, []);

  return Component ? <Component /> : <Loading />;
});
```

## Resources

- [Taro Documentation](https://taro-docs.jd.com/)
- [Taro GitHub](https://github.com/NervJS/taro)
- [Taro UI](https://taro-ui.jd.com/)
- [WeChat Mini Program Docs](https://developers.weixin.qq.com/miniprogram/dev/framework/)
