# Uni-app 跨平台小程序模板

## 技术栈

- **核心框架**: Uni-app 3.x (Vue 3)
- **UI 框架**: uView UI / Uni UI
- **状态管理**: Pinia
- **网络请求**: uni.request / luch-request
- **路由**: uni-app 内置路由
- **构建工具**: Vite
- **语言**: TypeScript

## 支持平台

- **微信小程序**
- **支付宝小程序**
- **抖音小程序**
- **QQ 小程序**
- **百度小程序**
- **字节跳动小程序**
- **快手小程序**
- **H5**
- **App (iOS/Android)**

## 项目结构

```
uni-app/
├── src/
│   ├── pages/               # 页面
│   │   ├── index/           # 首页
│   │   │   ├── index.vue
│   │   │   └── index.scss
│   │   ├── user/            # 用户页
│   │   │   ├── profile.vue
│   │   │   └── settings.vue
│   │   └── product/         # 产品页
│   │       ├── list.vue
│   │       └── detail.vue
│   ├── components/          # 组件
│   │   ├── common/          # 通用组件
│   │   │   ├── NavBar.vue
│   │   │   ├── TabBar.vue
│   │   │   └── Loading.vue
│   │   └── business/        # 业务组件
│   │       ├── ProductCard.vue
│   │       └── UserCard.vue
│   ├── static/              # 静态资源
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   ├── store/               # Pinia 状态管理
│   │   ├── modules/
│   │   │   ├── user.ts
│   │   │   ├── product.ts
│   │   │   └── cart.ts
│   │   └── index.ts
│   ├── api/                 # API 接口
│   │   ├── modules/
│   │   │   ├── user.ts
│   │   │   ├── product.ts
│   │   │   └── auth.ts
│   │   ├── request.ts       # 请求封装
│   │   └── index.ts
│   ├── utils/               # 工具函数
│   │   ├── auth.ts          # 认证工具
│   │   ├── storage.ts       # 存储工具
│   │   ├── common.ts        # 通用工具
│   │   └── permission.ts    # 权限管理
│   ├── hooks/               # 组合式 API
│   │   ├── useAuth.ts
│   │   ├── useRequest.ts
│   │   └── useUpload.ts
│   ├── types/               # TypeScript 类型
│   │   ├── api.d.ts
│   │   ├── user.d.ts
│   │   └── global.d.ts
│   ├── styles/              # 样式
│   │   ├── variables.scss   # 变量
│   │   ├── mixins.scss      # 混入
│   │   └── common.scss      # 通用样式
│   ├── App.vue              # 根组件
│   ├── main.ts              # 入口文件
│   ├── manifest.json        # 应用配置
│   ├── pages.json           # 页面配置
│   └── uni.scss             # uni-app 样式变量
├── public/
│   └── index.html           # H5 入口
├── dist/                    # 构建输出
│   ├── dev/
│   │   ├── mp-weixin/       # 微信小程序
│   │   ├── mp-alipay/       # 支付宝小程序
│   │   └── h5/              # H5
│   └── build/
├── package.json
├── vite.config.ts
├── tsconfig.json
└── uni-pages.d.ts           # 页面配置类型
```

## 代码模式

### 1. 应用配置

```json
// src/pages.json
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "首页",
        "navigationBarBackgroundColor": "#007AFF",
        "navigationBarTextStyle": "white",
        "enablePullDownRefresh": true,
        "backgroundTextStyle": "dark"
      }
    },
    {
      "path": "pages/user/profile",
      "style": {
        "navigationBarTitleText": "个人中心",
        "navigationBarBackgroundColor": "#007AFF",
        "navigationBarTextStyle": "white"
      }
    },
    {
      "path": "pages/product/list",
      "style": {
        "navigationBarTitleText": "商品列表",
        "enablePullDownRefresh": true,
        "onReachBottomDistance": 50
      }
    },
    {
      "path": "pages/product/detail",
      "style": {
        "navigationBarTitleText": "商品详情"
      }
    }
  ],
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "Uni App",
    "navigationBarBackgroundColor": "#F8F8F8",
    "backgroundColor": "#F8F8F8"
  },
  "tabBar": {
    "color": "#7A7E83",
    "selectedColor": "#007AFF",
    "borderStyle": "black",
    "backgroundColor": "#FFFFFF",
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "首页",
        "iconPath": "static/icons/home.png",
        "selectedIconPath": "static/icons/home-active.png"
      },
      {
        "pagePath": "pages/product/list",
        "text": "商品",
        "iconPath": "static/icons/product.png",
        "selectedIconPath": "static/icons/product-active.png"
      },
      {
        "pagePath": "pages/cart/cart",
        "text": "购物车",
        "iconPath": "static/icons/cart.png",
        "selectedIconPath": "static/icons/cart-active.png"
      },
      {
        "pagePath": "pages/user/profile",
        "text": "我的",
        "iconPath": "static/icons/user.png",
        "selectedIconPath": "static/icons/user-active.png"
      }
    ]
  },
  "condition": {
    "current": 0,
    "list": [
      {
        "name": "商品详情",
        "path": "pages/product/detail",
        "query": "id=1"
      }
    ]
  }
}
```

```json
// src/manifest.json
{
  "name": "UniApp Demo",
  "appid": "__UNI__XXXXXXX",
  "description": "跨平台小程序应用",
  "versionName": "1.0.0",
  "versionCode": "100",
  "transformPx": false,
  
  "app-plus": {
    "usingComponents": true,
    "nvueStyleCompiler": "uni-app",
    "compilerVersion": 3,
    "splashscreen": {
      "alwaysShowBeforeRender": true,
      "waiting": true,
      "autoclose": true,
      "delay": 0
    },
    "modules": {},
    "distribute": {
      "android": {
        "permissions": [
          "<uses-permission android:name=\"android.permission.CHANGE_NETWORK_STATE\"/>",
          "<uses-permission android:name=\"android.permission.MOUNT_UNMOUNT_FILESYSTEMS\"/>",
          "<uses-permission android:name=\"android.permission.VIBRATE\"/>",
          "<uses-permission android:name=\"android.permission.READ_LOGS\"/>",
          "<uses-permission android:name=\"android.permission.ACCESS_WIFI_STATE\"/>",
          "<uses-feature android:name=\"android.hardware.camera.autofocus\"/>",
          "<uses-permission android:name=\"android.permission.ACCESS_NETWORK_STATE\"/>",
          "<uses-permission android:name=\"android.permission.CAMERA\"/>",
          "<uses-permission android:name=\"android.permission.GET_ACCOUNTS\"/>",
          "<uses-permission android:name=\"android.permission.READ_PHONE_STATE\"/>",
          "<uses-permission android:name=\"android.permission.CHANGE_WIFI_STATE\"/>",
          "<uses-permission android:name=\"android.permission.WAKE_LOCK\"/>",
          "<uses-permission android:name=\"android.permission.FLASHLIGHT\"/>",
          "<uses-feature android:name=\"android.hardware.camera\"/>",
          "<uses-permission android:name=\"android.permission.WRITE_SETTINGS\"/>"
        ]
      },
      "ios": {},
      "sdkConfigs": {}
    }
  },
  
  "quickapp": {},
  
  "mp-weixin": {
    "appid": "wx0000000000000000",
    "setting": {
      "urlCheck": false,
      "es6": true,
      "enhance": true,
      "postcss": true,
      "minified": true
    },
    "usingComponents": true,
    "permission": {
      "scope.userLocation": {
        "desc": "你的位置信息将用于小程序位置接口的效果展示"
      }
    },
    "requiredPrivateInfos": [
      "getLocation",
      "chooseLocation"
    ]
  },
  
  "mp-alipay": {
    "usingComponents": true
  },
  
  "mp-baidu": {
    "usingComponents": true
  },
  
  "mp-toutiao": {
    "usingComponents": true
  },
  
  "uniStatistics": {
    "enable": false
  },
  
  "h5": {
    "devServer": {
      "port": 8080,
      "disableHostCheck": true,
      "proxy": {
        "/api": {
          "target": "https://api.example.com",
          "changeOrigin": true,
          "pathRewrite": {
            "^/api": ""
          }
        }
      }
    },
    "router": {
      "mode": "history",
      "base": "/"
    }
  }
}
```

### 2. 请求封装

```typescript
// src/api/request.ts
interface RequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: Record<string, string>;
  showLoading?: boolean;
  showError?: boolean;
}

interface Response<T = any> {
  code: number;
  data: T;
  message: string;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.example.com';

class Request {
  private baseURL: string;
  
  constructor() {
    this.baseURL = BASE_URL;
  }
  
  // 请求拦截
  private beforeRequest(config: RequestConfig) {
    const token = uni.getStorageSync('token');
    
    config.header = {
      'Content-Type': 'application/json',
      ...config.header,
    };
    
    if (token) {
      config.header['Authorization'] = `Bearer ${token}`;
    }
    
    if (config.showLoading !== false) {
      uni.showLoading({
        title: '加载中...',
        mask: true,
      });
    }
    
    return config;
  }
  
  // 响应拦截
  private afterRequest<T>(response: UniApp.RequestSuccessCallbackResult): Promise<T> {
    uni.hideLoading();
    
    const data = response.data as Response<T>;
    
    // 成功
    if (data.code === 0 || data.code === 200) {
      return Promise.resolve(data.data);
    }
    
    // 未登录
    if (data.code === 401) {
      uni.removeStorageSync('token');
      uni.reLaunch({ url: '/pages/login/login' });
      return Promise.reject(new Error('未登录'));
    }
    
    // 其他错误
    const error = new Error(data.message || '请求失败');
    return Promise.reject(error);
  }
  
  // 通用请求方法
  async request<T = any>(config: RequestConfig): Promise<T> {
    config = this.beforeRequest(config);
    
    return new Promise((resolve, reject) => {
      uni.request({
        url: this.baseURL + config.url,
        method: config.method || 'GET',
        data: config.data,
        header: config.header,
        success: (res) => {
          this.afterRequest<T>(res)
            .then(resolve)
            .catch((error) => {
              if (config.showError !== false) {
                uni.showToast({
                  title: error.message || '请求失败',
                  icon: 'none',
                  duration: 2000,
                });
              }
              reject(error);
            });
        },
        fail: (error) => {
          uni.hideLoading();
          const errMsg = error.errMsg || '网络请求失败';
          uni.showToast({
            title: errMsg,
            icon: 'none',
            duration: 2000,
          });
          reject(new Error(errMsg));
        },
      });
    });
  }
  
  get<T = any>(url: string, data?: any, config?: Partial<RequestConfig>) {
    return this.request<T>({ url, method: 'GET', data, ...config });
  }
  
  post<T = any>(url: string, data?: any, config?: Partial<RequestConfig>) {
    return this.request<T>({ url, method: 'POST', data, ...config });
  }
  
  put<T = any>(url: string, data?: any, config?: Partial<RequestConfig>) {
    return this.request<T>({ url, method: 'PUT', data, ...config });
  }
  
  delete<T = any>(url: string, data?: any, config?: Partial<RequestConfig>) {
    return this.request<T>({ url, method: 'DELETE', data, ...config });
  }
  
  // 文件上传
  upload(url: string, filePath: string, name: string = 'file', formData?: any) {
    return new Promise((resolve, reject) => {
      const token = uni.getStorageSync('token');
      
      uni.uploadFile({
        url: this.baseURL + url,
        filePath,
        name,
        formData,
        header: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        success: (res) => {
          const data = JSON.parse(res.data);
          if (data.code === 0 || data.code === 200) {
            resolve(data.data);
          } else {
            reject(new Error(data.message));
          }
        },
        fail: (error) => {
          reject(new Error(error.errMsg || '上传失败'));
        },
      });
    });
  }
}

export const http = new Request();
```

```typescript
// src/api/modules/user.ts
import { http } from '../request';
import type { User, LoginParams, RegisterParams } from '@/types/user';

export const userApi = {
  // 登录
  login(params: LoginParams) {
    return http.post<{ token: string; user: User }>('/auth/login', params);
  },
  
  // 注册
  register(params: RegisterParams) {
    return http.post<User>('/auth/register', params);
  },
  
  // 获取用户信息
  getUserInfo() {
    return http.get<User>('/user/info');
  },
  
  // 更新用户信息
  updateUserInfo(data: Partial<User>) {
    return http.put<User>('/user/info', data);
  },
  
  // 上传头像
  uploadAvatar(filePath: string) {
    return http.upload<{ url: string }>('/user/avatar', filePath, 'avatar');
  },
};
```

### 3. 状态管理 (Pinia)

```typescript
// src/store/modules/user.ts
import { defineStore } from 'pinia';
import { userApi } from '@/api/modules/user';
import type { User } from '@/types/user';

interface UserState {
  token: string;
  userInfo: User | null;
  isLoggedIn: boolean;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: uni.getStorageSync('token') || '',
    userInfo: null,
    isLoggedIn: false,
  }),
  
  getters: {
    // 是否登录
    hasLogin: (state) => !!state.token && state.isLoggedIn,
    
    // 用户名
    username: (state) => state.userInfo?.name || '未登录',
    
    // 头像
    avatar: (state) => state.userInfo?.avatar || '/static/icons/default-avatar.png',
  },
  
  actions: {
    // 登录
    async login(params: LoginParams) {
      try {
        const { token, user } = await userApi.login(params);
        
        this.token = token;
        this.userInfo = user;
        this.isLoggedIn = true;
        
        uni.setStorageSync('token', token);
        
        uni.showToast({
          title: '登录成功',
          icon: 'success',
        });
        
        return true;
      } catch (error) {
        return false;
      }
    },
    
    // 登出
    logout() {
      this.token = '';
      this.userInfo = null;
      this.isLoggedIn = false;
      
      uni.removeStorageSync('token');
      
      uni.reLaunch({ url: '/pages/login/login' });
    },
    
    // 获取用户信息
    async fetchUserInfo() {
      try {
        const user = await userApi.getUserInfo();
        this.userInfo = user;
        this.isLoggedIn = true;
        return user;
      } catch (error) {
        this.logout();
        return null;
      }
    },
    
    // 更新用户信息
    async updateUserInfo(data: Partial<User>) {
      try {
        const user = await userApi.updateUserInfo(data);
        this.userInfo = user;
        return user;
      } catch (error) {
        throw error;
      }
    },
  },
});
```

```typescript
// src/store/index.ts
import { createPinia } from 'pinia';

const pinia = createPinia();

export default pinia;

// 导出所有 store
export * from './modules/user';
export * from './modules/product';
export * from './modules/cart';
```

### 4. 页面开发

```vue
<!-- src/pages/index/index.vue -->
<template>
  <view class="container">
    <!-- 轮播图 -->
    <swiper
      class="banner"
      :indicator-dots="true"
      :autoplay="true"
      :interval="3000"
      :duration="500"
    >
      <swiper-item v-for="item in banners" :key="item.id">
        <image :src="item.image" mode="aspectFill" />
      </swiper-item>
    </swiper>
    
    <!-- 分类 -->
    <view class="categories">
      <view
        v-for="category in categories"
        :key="category.id"
        class="category-item"
        @tap="handleCategoryTap(category)"
      >
        <image :src="category.icon" class="category-icon" />
        <text class="category-name">{{ category.name }}</text>
      </view>
    </view>
    
    <!-- 商品列表 -->
    <view class="products">
      <view class="section-title">热门商品</view>
      <view class="product-list">
        <ProductCard
          v-for="product in products"
          :key="product.id"
          :product="product"
          @tap="handleProductTap(product)"
        />
      </view>
    </view>
    
    <!-- 加载更多 -->
    <view v-if="hasMore" class="load-more" @tap="loadMore">
      <text v-if="!loading">加载更多</text>
      <text v-else>加载中...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import ProductCard from '@/components/business/ProductCard.vue';
import { productApi } from '@/api/modules/product';
import type { Product, Category, Banner } from '@/types/api';

const banners = ref<Banner[]>([]);
const categories = ref<Category[]>([]);
const products = ref<Product[]>([]);
const loading = ref(false);
const hasMore = ref(true);
const page = ref(1);

// 加载数据
const loadData = async () => {
  try {
    const [bannerRes, categoryRes, productRes] = await Promise.all([
      productApi.getBanners(),
      productApi.getCategories(),
      productApi.getProducts({ page: page.value, limit: 10 }),
    ]);
    
    banners.value = bannerRes;
    categories.value = categoryRes;
    
    if (page.value === 1) {
      products.value = productRes.list;
    } else {
      products.value.push(...productRes.list);
    }
    
    hasMore.value = productRes.hasMore;
  } catch (error) {
    console.error('加载数据失败:', error);
  }
};

// 加载更多
const loadMore = async () => {
  if (loading.value || !hasMore.value) return;
  
  loading.value = true;
  page.value++;
  
  try {
    const res = await productApi.getProducts({ page: page.value, limit: 10 });
    products.value.push(...res.list);
    hasMore.value = res.hasMore;
  } catch (error) {
    console.error('加载更多失败:', error);
    page.value--;
  } finally {
    loading.value = false;
  }
};

// 分类点击
const handleCategoryTap = (category: Category) => {
  uni.navigateTo({
    url: `/pages/product/list?categoryId=${category.id}`,
  });
};

// 商品点击
const handleProductTap = (product: Product) => {
  uni.navigateTo({
    url: `/pages/product/detail?id=${product.id}`,
  });
};

// 页面加载
onMounted(() => {
  loadData();
});

// 下拉刷新
onPullDownRefresh(async () => {
  page.value = 1;
  await loadData();
  uni.stopPullDownRefresh();
});

// 触底加载
onReachBottom(() => {
  loadMore();
});
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.banner {
  width: 100%;
  height: 360rpx;
  
  image {
    width: 100%;
    height: 100%;
  }
}

.categories {
  display: flex;
  flex-wrap: wrap;
  padding: 20rpx;
  background-color: #fff;
  margin-bottom: 20rpx;
}

.category-item {
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20rpx;
}

.category-icon {
  width: 80rpx;
  height: 80rpx;
  margin-bottom: 10rpx;
}

.category-name {
  font-size: 24rpx;
  color: #333;
}

.products {
  padding: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.product-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.load-more {
  text-align: center;
  padding: 30rpx 0;
  font-size: 28rpx;
  color: #999;
}
</style>
```

```vue
<!-- src/pages/product/detail.vue -->
<template>
  <view class="container">
    <!-- 商品图片 -->
    <swiper
      class="product-images"
      :indicator-dots="true"
      :autoplay="false"
    >
      <swiper-item v-for="(image, index) in product.images" :key="index">
        <image :src="image" mode="aspectFill" />
      </swiper-item>
    </swiper>
    
    <!-- 商品信息 -->
    <view class="product-info">
      <view class="price-box">
        <text class="price">¥{{ product.price }}</text>
        <text class="original-price">¥{{ product.originalPrice }}</text>
      </view>
      
      <view class="title">{{ product.name }}</view>
      <view class="desc">{{ product.description }}</view>
      
      <view class="sales-info">
        <text>销量: {{ product.sales }}</text>
        <text>库存: {{ product.stock }}</text>
      </view>
    </view>
    
    <!-- 规格选择 -->
    <view class="specs" @tap="showSpecs = true">
      <text>选择规格</text>
      <text class="spec-value">{{ selectedSpecs || '请选择' }}</text>
    </view>
    
    <!-- 商品详情 -->
    <view class="detail-content">
      <rich-text :nodes="product.detail"></rich-text>
    </view>
    
    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="actions">
        <view class="action-item" @tap="handleContact">
          <uni-icons type="chat" size="20" />
          <text>客服</text>
        </view>
        
        <view class="action-item" @tap="handleCartTap">
          <uni-icons type="cart" size="20" />
          <text>购物车</text>
          <view v-if="cartCount > 0" class="badge">{{ cartCount }}</view>
        </view>
      </view>
      
      <view class="buttons">
        <button class="btn-cart" @tap="handleAddToCart">加入购物车</button>
        <button class="btn-buy" @tap="handleBuyNow">立即购买</button>
      </view>
    </view>
    
    <!-- 规格弹窗 -->
    <uni-popup ref="popup" type="bottom">
      <view class="specs-popup">
        <!-- 规格内容 -->
      </view>
    </uni-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { productApi } from '@/api/modules/product';
import { useCartStore } from '@/store/modules/cart';
import type { Product } from '@/types/api';

const productId = ref<string>('');
const product = ref<Product>({
  id: '',
  name: '',
  description: '',
  price: 0,
  originalPrice: 0,
  images: [],
  stock: 0,
  sales: 0,
  detail: '',
});
const selectedSpecs = ref('');
const showSpecs = ref(false);
const cartStore = useCartStore();

const cartCount = computed(() => cartStore.totalCount);

// 加载商品详情
const loadProductDetail = async () => {
  try {
    uni.showLoading({ title: '加载中...' });
    const data = await productApi.getProductDetail(productId.value);
    product.value = data;
  } catch (error) {
    console.error('加载失败:', error);
    uni.showToast({
      title: '加载失败',
      icon: 'none',
    });
  } finally {
    uni.hideLoading();
  }
};

// 加入购物车
const handleAddToCart = () => {
  if (!selectedSpecs.value) {
    showSpecs.value = true;
    return;
  }
  
  cartStore.addItem({
    id: product.value.id,
    name: product.value.name,
    price: product.value.price,
    image: product.value.images[0],
    quantity: 1,
  });
  
  uni.showToast({
    title: '已加入购物车',
    icon: 'success',
  });
};

// 立即购买
const handleBuyNow = () => {
  if (!selectedSpecs.value) {
    showSpecs.value = true;
    return;
  }
  
  uni.navigateTo({
    url: `/pages/order/create?productId=${product.value.id}`,
  });
};

// 客服
const handleContact = () => {
  // 打开客服会话
};

// 购物车
const handleCartTap = () => {
  uni.switchTab({ url: '/pages/cart/cart' });
};

// 页面加载
onLoad((options) => {
  productId.value = options.id || '';
  loadProductDetail();
});
</script>

<style lang="scss" scoped>
.container {
  padding-bottom: 100rpx;
}

.product-images {
  width: 100%;
  height: 750rpx;
  
  image {
    width: 100%;
    height: 100%;
  }
}

.product-info {
  padding: 30rpx;
  background-color: #fff;
  margin-bottom: 20rpx;
}

.price-box {
  display: flex;
  align-items: baseline;
  margin-bottom: 20rpx;
}

.price {
  font-size: 48rpx;
  font-weight: bold;
  color: #ff4d4f;
}

.original-price {
  margin-left: 20rpx;
  font-size: 28rpx;
  color: #999;
  text-decoration: line-through;
}

.title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.desc {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 20rpx;
}

.sales-info {
  display: flex;
  font-size: 24rpx;
  color: #999;
  
  text:first-child {
    margin-right: 30rpx;
  }
}

.specs {
  display: flex;
  justify-content: space-between;
  padding: 30rpx;
  background-color: #fff;
  margin-bottom: 20rpx;
}

.spec-value {
  color: #999;
}

.detail-content {
  padding: 30rpx;
  background-color: #fff;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  height: 100rpx;
  background-color: #fff;
  border-top: 1rpx solid #eee;
  padding: 0 20rpx;
  z-index: 999;
}

.actions {
  display: flex;
  margin-right: 20rpx;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 40rpx;
  position: relative;
  
  text {
    font-size: 20rpx;
    color: #666;
  }
}

.badge {
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  background-color: #ff4d4f;
  color: #fff;
  font-size: 20rpx;
  padding: 2rpx 10rpx;
  border-radius: 20rpx;
}

.buttons {
  flex: 1;
  display: flex;
}

.btn-cart,
.btn-buy {
  flex: 1;
  height: 70rpx;
  line-height: 70rpx;
  text-align: center;
  border-radius: 35rpx;
  font-size: 28rpx;
  margin: 0 10rpx;
}

.btn-cart {
  background-color: #ff9900;
  color: #fff;
}

.btn-buy {
  background-color: #ff4d4f;
  color: #fff;
}
</style>
```

### 5. 组件开发

```vue
<!-- src/components/business/ProductCard.vue -->
<template>
  <view class="product-card" @tap="handleTap">
    <image class="product-image" :src="product.image" mode="aspectFill" />
    <view class="product-info">
      <view class="product-name">{{ product.name }}</view>
      <view class="product-price">
        <text class="price">¥{{ product.price }}</text>
        <text v-if="product.originalPrice" class="original-price">
          ¥{{ product.originalPrice }}
        </text>
      </view>
      <view class="product-sales">已售 {{ product.sales }} 件</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { Product } from '@/types/api';

interface Props {
  product: Product;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  tap: [product: Product];
}>();

const handleTap = () => {
  emit('tap', props.product);
};
</script>

<style lang="scss" scoped>
.product-card {
  width: 345rpx;
  background-color: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
}

.product-image {
  width: 100%;
  height: 345rpx;
}

.product-info {
  padding: 20rpx;
}

.product-name {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 10rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-price {
  display: flex;
  align-items: baseline;
  margin-bottom: 10rpx;
}

.price {
  font-size: 32rpx;
  font-weight: bold;
  color: #ff4d4f;
}

.original-price {
  margin-left: 10rpx;
  font-size: 24rpx;
  color: #999;
  text-decoration: line-through;
}

.product-sales {
  font-size: 22rpx;
  color: #999;
}
</style>
```

### 6. 工具函数

```typescript
// src/utils/storage.ts
class Storage {
  // 设置
  set(key: string, value: any) {
    try {
      uni.setStorageSync(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage set error:', error);
    }
  }
  
  // 获取
  get<T = any>(key: string): T | null {
    try {
      const value = uni.getStorageSync(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  }
  
  // 删除
  remove(key: string) {
    try {
      uni.removeStorageSync(key);
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  }
  
  // 清空
  clear() {
    try {
      uni.clearStorageSync();
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  }
}

export const storage = new Storage();

// src/utils/auth.ts
import { storage } from './storage';

const TOKEN_KEY = 'token';
const USER_KEY = 'userInfo';

export const auth = {
  getToken(): string {
    return storage.get<string>(TOKEN_KEY) || '';
  },
  
  setToken(token: string) {
    storage.set(TOKEN_KEY, token);
  },
  
  removeToken() {
    storage.remove(TOKEN_KEY);
  },
  
  getUserInfo(): User | null {
    return storage.get<User>(USER_KEY);
  },
  
  setUserInfo(user: User) {
    storage.set(USER_KEY, user);
  },
  
  removeUserInfo() {
    storage.remove(USER_KEY);
  },
  
  isLoggedIn(): boolean {
    return !!this.getToken();
  },
  
  logout() {
    this.removeToken();
    this.removeUserInfo();
  },
};
```

## 最佳实践

### 1. 跨平台兼容
- 使用条件编译处理平台差异
- 避免使用特定平台的 API
- 测试所有目标平台

### 2. 性能优化
- 使用分包加载
- 图片懒加载和压缩
- 减少 setData 调用频率
- 使用虚拟列表

### 3. 代码规范
- 使用 TypeScript
- 遵循 Vue 3 组合式 API
- 组件化开发
- 统一的样式规范

### 4. 状态管理
- 合理使用 Pinia
- 本地存储同步
- 避免过度全局状态

### 5. 请求处理
- 统一的错误处理
- 请求拦截和响应拦截
- Loading 状态管理

## 常用命令

```bash
# 安装依赖
npm install

# 开发模式 - 微信小程序
npm run dev:mp-weixin

# 开发模式 - 支付宝小程序
npm run dev:mp-alipay

# 开发模式 - H5
npm run dev:h5

# 开发模式 - App
npm run dev:app

# 生产构建 - 微信小程序
npm run build:mp-weixin

# 生产构建 - H5
npm run build:h5

# 类型检查
npm run type-check

# 代码格式化
npm run lint
```

## 部署配置

### 微信小程序配置

```json
// project.config.json
{
  "miniprogramRoot": "dist/build/mp-weixin/",
  "projectname": "uniapp-demo",
  "description": "跨平台小程序应用",
  "appid": "wx0000000000000000",
  "setting": {
    "urlCheck": false,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "minified": true,
    "newFeature": true
  },
  "compileType": "miniprogram",
  "condition": {}
}
```

### H5 部署

```nginx
# nginx.conf
server {
  listen 80;
  server_name example.com;
  
  location / {
    root /var/www/uniapp-h5;
    try_files $uri $uri/ /index.html;
  }
  
  location /api {
    proxy_pass https://api.example.com;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

### CI/CD

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build WeChat Mini Program
        run: npm run build:mp-weixin
      
      - name: Build H5
        run: npm run build:h5
      
      - name: Deploy H5
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist/build/h5
```

## 总结

Uni-app 提供了：
✅ 一套代码多端运行
✅ Vue 3 组合式 API
✅ 丰富的组件和 API
✅ 良好的开发体验
✅ 活跃的社区生态

适用场景：
- 多平台小程序开发
- 跨平台移动应用
- 快速原型开发
- 企业级应用
- 电商应用
