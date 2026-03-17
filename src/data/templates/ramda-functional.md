# Ramda 函数式编程模板

## 技术栈

- **函数式库**: Ramda 0.29.x
- **类型支持**: @types/ramda
- **工具库**: Ramda 扩展函数
- **调试**: ramda-debug
- **验证**: 结合 Zod/Yup 使用
- **React 集成**: recompose (可选)

## 项目结构

```
ramda-functional/
├── src/
│   ├── utils/                # 工具函数
│   │   ├── fp/              # 函数式工具
│   │   ├── transforms/      # 数据转换
│   │   └── predicates/      # 断言函数
│   ├── domain/              # 业务逻辑
│   │   ├── user/            # 用户相关
│   │   ├── product/         # 产品相关
│   │   └── order/           # 订单相关
│   ├── services/            # 服务层
│   │   ├── api/             # API 调用
│   │   └── cache/           # 缓存处理
│   └── types/               # 类型定义
├── test/                    # 测试文件
│   ├── unit/
│   └── integration/
├── package.json
└── tsconfig.json
```

## 代码模式

### 基础函数组合

```typescript
// src/utils/fp/composition.ts
import * as R from 'ramda';

// 组合函数（从右到左执行）
const addOne = (x: number) => x + 1;
const double = (x: number) => x * 2;
const square = (x: number) => x * x;

// compose: 从右到左
export const addOneDoubleSquare = R.compose(square, double, addOne);
// addOne(2) -> 3, double(3) -> 6, square(6) -> 36

// pipe: 从左到右
export const addOneDoubleSquarePipe = R.pipe(addOne, double, square);
// addOne(2) -> 3, double(3) -> 6, square(6) -> 36

// 实际应用：处理用户数据
interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  posts: Post[];
}

interface Post {
  id: string;
  title: string;
  views: number;
}

// 获取活跃用户的平均帖子浏览量
export const getAverageViewsForActiveUsers = R.pipe(
  R.filter<User>((user) => user.age >= 18), // 过滤成年用户
  R.filter<User>((user) => user.posts.length > 0), // 有帖子的用户
  R.map<User, Post[]>((user) => user.posts), // 提取所有帖子
  R.flatten, // 扁平化
  R.map<Post, number>((post) => post.views), // 提取浏览量
  R.mean // 计算平均值
);

// 使用示例
const users: User[] = [
  {
    id: '1',
    name: 'John',
    email: 'john@example.com',
    age: 25,
    posts: [
      { id: 'p1', title: 'Post 1', views: 100 },
      { id: 'p2', title: 'Post 2', views: 200 },
    ],
  },
  {
    id: '2',
    name: 'Jane',
    email: 'jane@example.com',
    age: 17,
    posts: [{ id: 'p3', title: 'Post 3', views: 150 }],
  },
];

const avgViews = getAverageViewsForActiveUsers(users); // 150

// 复杂数据转换
interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
}

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

// 计算已完成订单的总收入
export const getTotalRevenueFromCompletedOrders = R.pipe(
  R.filter<Order>((order) => order.status === 'completed'),
  R.map<Order, OrderItem[]>((order) => order.items),
  R.flatten,
  R.map<OrderItem, number>((item) => item.quantity * item.price),
  R.sum
);

// 按客户分组订单
export const groupOrdersByCustomer = R.groupBy<Order>((order) => order.customerId);

// 获取客户订单统计
export const getCustomerOrderStats = R.pipe(
  groupOrdersByCustomer,
  R.mapObjIndexed((orders: Order[]) => ({
    totalOrders: orders.length,
    completedOrders: orders.filter((o) => o.status === 'completed').length,
    totalSpent: R.pipe(
      R.filter<Order>((o) => o.status === 'completed'),
      R.map<Order, OrderItem[]>((o) => o.items),
      R.flatten,
      R.map<OrderItem, number>((item) => item.quantity * item.price),
      R.sum
    )(orders),
  }))
);
```

### 柯里化和部分应用

```typescript
// src/utils/fp/curry.ts
import * as R from 'ramda';

// 柯里化函数
const add = R.curry((a: number, b: number, c: number) => a + b + c);

const add5 = add(5);
const add5And3 = add5(3);
const result = add5And3(2); // 10

// 或直接调用
add(5, 3, 2); // 10
add(5)(3)(2); // 10
add(5, 3)(2); // 10

// 实际应用：API 请求构建器
interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  body?: any;
}

const createRequest = R.curry(
  (baseUrl: string, endpoint: string, options: RequestOptions) => ({
    url: `${baseUrl}${endpoint}`,
    ...options,
  })
);

const apiRequest = createRequest('https://api.example.com');
const userRequest = apiRequest('/users');
const getUsers = userRequest({ method: 'GET', headers: {} });

// 部分应用
const multiply = (a: number, b: number, c: number) => a * b * c;

const multiplyBy2 = R.partial(multiply, [2]);
const multiply2By3 = R.partial(multiply, [2, 3]);

multiplyBy2(4, 5); // 40
multiply2By3(4); // 24

// 实际应用：数据处理管道
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
}

const filterByCategory = R.curry((category: string, products: Product[]) =>
  R.filter<Product>((p) => p.category === category)(products)
);

const filterInStock = R.filter<Product>((p) => p.inStock);

const sortByPrice = R.sortBy<Product>(R.prop('price'));

const takeTop = R.curry((n: number, items: any[]) => R.take(n)(items));

// 组合使用
const getTopInStockElectronics = R.pipe(
  filterByCategory('electronics'),
  filterInStock,
  sortByPrice,
  takeTop(10)
);

// 占位符使用
const greet = R.curry((greeting: string, name: string) => 
  `${greeting}, ${name}!`
);

const sayHello = greet('Hello');
sayHello('John'); // "Hello, John!"

const sayToJohn = greet(R.__, 'John');
sayToJohn('Hi'); // "Hi, John!"
```

### 对象操作

```typescript
// src/utils/fp/objects.ts
import * as R from 'ramda';

interface User {
  id: string;
  name: string;
  email: string;
  profile: {
    age: number;
    address: {
      city: string;
      country: string;
    };
  };
}

// 读取属性
const getName = R.prop('name');
const getNameFromUser = getName({ name: 'John', age: 30 }); // 'John'

// 嵌套属性
const getCity = R.path(['profile', 'address', 'city']);
const city = getCity({
  profile: { address: { city: 'New York', country: 'USA' } },
}); // 'New York'

// 带默认值
const getCityWithDefault = R.pathOr('Unknown', ['profile', 'address', 'city']);

// 提取多个属性
const getUserInfo = R.props(['id', 'name', 'email']);
const userInfo = getUserInfo({
  id: '1',
  name: 'John',
  email: 'john@example.com',
  age: 30,
}); // ['1', 'John', 'john@example.com']

// 修改属性
const updateUserEmail = R.assoc('email', 'new@example.com');
const updated = updateUserEmail({ id: '1', email: 'old@example.com' });

// 嵌套修改
const updateCity = R.assocPath(['profile', 'address', 'city'], 'Boston');

// 深度合并
const mergeUserProfile = R.mergeDeepRight({
  profile: {
    age: 25,
    address: { city: 'New York' },
  },
});

// Evolve - 基于函数转换
const evolveUser = R.evolve({
  name: R.toUpper,
  profile: {
    age: R.inc,
  },
});

const evolved = evolveUser({
  name: 'john',
  profile: { age: 30, address: { city: 'NYC' } },
});
// { name: 'JOHN', profile: { age: 31, address: { city: 'NYC' } } }

// Pick 和 Omit
const getBasicInfo = R.pick(['id', 'name', 'email']);
const removeSensitiveInfo = R.omit(['password', 'token']);

// Keys 和 Values
const getObjectKeys = R.keys({ a: 1, b: 2, c: 3 }); // ['a', 'b', 'c']
const getObjectValues = R.values({ a: 1, b: 2, c: 3 }); // [1, 2, 3]

// 合并对象
const mergeObjects = R.mergeLeft({ a: 1, b: 2 });
mergeObjects({ b: 3, c: 4 }); // { a: 1, b: 2, c: 4 }

// Invert
const invertObject = R.invert({ a: '1', b: '2', c: '1' });
// { '1': ['a', 'c'], '2': ['b'] }

// 实际应用：用户数据标准化
interface RawUserData {
  user_id: string;
  full_name: string;
  email_address: string;
  phone_number?: string;
  created_at: string;
}

interface NormalizedUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: Date;
}

export const normalizeUser = R.pipe(
  R.evolve({
    user_id: String,
    full_name: String,
    email_address: String,
    created_at: (date: string) => new Date(date),
  }),
  R.renameKeys({
    user_id: 'id',
    full_name: 'name',
    email_address: 'email',
    phone_number: 'phone',
    created_at: 'createdAt',
  })
) as (data: RawUserData) => NormalizedUser;

// renameKeys 辅助函数
const renameKeys = R.curry((keysMap: Record<string, string>, obj: any) =>
  R.reduce(
    (acc, key) => R.assoc(keysMap[key] || key, obj[key], acc),
    {},
    R.keys(obj)
  )
);
```

### 数组操作

```typescript
// src/utils/fp/arrays.ts
import * as R from 'ramda';

// Map
const double = R.map((x: number) => x * 2);
double([1, 2, 3]); // [2, 4, 6]

// Filter
const isEven = R.filter((x: number) => x % 2 === 0);
isEven([1, 2, 3, 4, 5]); // [2, 4]

// Reduce
const sum = R.reduce((acc: number, x: number) => acc + x, 0);
sum([1, 2, 3, 4]); // 10

// Find
const findUser = R.find<User>((user) => user.age > 25);

// Every 和 Some
const allAdults = R.all<User>((user) => user.age >= 18);
const hasAdmin = R.any<User>((user) => user.role === 'admin');

// Includes
const hasValue = R.includes(3);
hasValue([1, 2, 3, 4]); // true

// Take 和 Drop
const firstThree = R.take(3)([1, 2, 3, 4, 5]); // [1, 2, 3]
const dropFirstTwo = R.drop(2)([1, 2, 3, 4, 5]); // [3, 4, 5]

// TakeWhile 和 DropWhile
const takeWhilePositive = R.takeWhile((x: number) => x > 0);
takeWhilePositive([1, 2, 3, -1, 4, 5]); // [1, 2, 3]

// Head, Tail, Last, Init
const first = R.head([1, 2, 3]); // 1
const rest = R.tail([1, 2, 3]); // [2, 3]
const last = R.last([1, 2, 3]); // 3
const allButLast = R.init([1, 2, 3]); // [1, 2]

// Flatten 和 FlatMap
const flattened = R.flatten([[1, 2], [3, [4, 5]]]); // [1, 2, 3, 4, 5]
const flatMapped = R.chain((x: number) => [x, x * 2], [1, 2, 3]);
// [1, 2, 2, 4, 3, 6]

// Uniq 和 UniqBy
const unique = R.uniq([1, 2, 2, 3, 3, 4]); // [1, 2, 3, 4]
const uniqueBy = R.uniqBy<User>(R.prop('id'));

// Group
const groupByCategory = R.groupBy<Product>(R.prop('category'));

// Chunk
const chunks = R.splitEvery(2)([1, 2, 3, 4, 5]); // [[1, 2], [3, 4], [5]]

// Partition
const [evens, odds] = R.partition((x: number) => x % 2 === 0)([1, 2, 3, 4, 5]);

// Zip 和 Unzip
const zipped = R.zip([1, 2, 3], ['a', 'b', 'c']); // [[1, 'a'], [2, 'b'], [3, 'c']]
const [numbers, letters] = R.unzip(zipped);

// 实际应用：购物车计算
interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

// 计算总价
export const calculateTotal = R.pipe(
  R.map<CartItem, number>((item) => item.price * item.quantity),
  R.sum
);

// 按类别分组
export const groupByCategory = R.groupBy<CartItem>(R.prop('category'));

// 获取最贵的商品
export const getMostExpensive = R.reduce<CartItem, CartItem | null>(
  (max, item) =>
    max === null || item.price > max.price ? item : max,
  null
);

// 应用折扣
export const applyDiscount = R.curry((discount: number, items: CartItem[]) =>
  R.map(R.evolve({ price: (p: number) => p * (1 - discount) }))(items)
);

// 过滤特定类别
export const filterByCategory = R.curry((category: string, items: CartItem[]) =>
  R.filter<CartItem>(R.propEq('category', category))(items)
);

// 复杂管道：获取打折后电子产品类别总价最高的前3个商品
export const getTopElectronics = R.pipe(
  filterByCategory('electronics'),
  applyDiscount(0.1), // 10% 折扣
  R.sortBy<CartItem>(R.prop('price')),
  R.reverse,
  R.take(3)
);
```

### 函数式编程模式

```typescript
// src/utils/fp/patterns.ts
import * as R from 'ramda';

// 1. Point-free 风格
const getActiveUsers = R.filter<User>(R.propEq('active', true));
const getUserNames = R.map<User, string>(R.prop('name'));
const getActiveUserNames = R.pipe(getActiveUsers, getUserNames);

// 2. 柯里化谓词
const hasRole = R.propEq('role');
const isAdmin = hasRole('admin');
const isEditor = hasRole('editor');

// 3. 组合验证
const isNotEmpty = R.complement(R.isEmpty);
const isValidEmail = R.test(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
const isValidAge = R.both(R.lte(18), R.gte(120));

const isValidUser = R.where({
  email: isValidEmail,
  age: isValidAge,
  name: isNotEmpty,
});

isValidUser({ email: 'john@example.com', age: 25, name: 'John' }); // true

// 4. Lens - 函数式引用
interface State {
  user: {
    profile: {
      name: string;
      age: number;
    };
    settings: {
      theme: 'light' | 'dark';
    };
  };
}

const nameLens = R.lensPath(['user', 'profile', 'name']);

// 读取
const getName = R.view(nameLens);

// 修改
const setName = R.set(nameLens, 'New Name');

// 基于函数修改
const upperCaseName = R.over(nameLens, R.toUpper);

// 5. 条件执行
const processValue = R.ifElse(
  R.gt(R.__, 100), // 如果大于 100
  R.multiply(0.9), // 打 9 折
  R.identity // 否则不变
);

// 6. Memoization
const expensiveCalculation = R.memoizeWith(
  (x: number, y: number) => `${x}-${y}`,
  (x: number, y: number) => {
    console.log('Calculating...');
    return x * y;
  }
);

expensiveCalculation(5, 10); // 计算并缓存
expensiveCalculation(5, 10); // 从缓存读取

// 7. 无限列表
const naturals = R.range(1, Infinity);
const firstTen = R.take(10, naturals); // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// 8. Transduce - 高性能转换
const transducer = R.compose(
  R.filter((x: number) => x % 2 === 0),
  R.map((x: number) => x * 2),
  R.take(3)
);

const result = R.transduce(
  transducer,
  R.flip(R.append),
  [] as number[],
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
); // [4, 8, 12]

// 9. 惰性求值
const lazyResult = R.into(
  [] as number[],
  R.compose(
    R.filter((x: number) => x > 5),
    R.map((x: number) => x * 2)
  ),
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
); // [12, 14, 16, 18, 20]

// 10. 函数式错误处理
const safeParseJSON = R.tryCatch(
  JSON.parse,
  R.always(null)
);

safeParseJSON('{"a":1}'); // { a: 1 }
safeParseJSON('invalid'); // null

// 11. 类型安全组合
type Result<T> = { type: 'success'; value: T } | { type: 'error'; message: string };

const success = <T>(value: T): Result<T> => ({ type: 'success', value });
const error = <T>(message: string): Result<T> => ({ type: 'error', message });

const mapResult = <T, U>(fn: (x: T) => U) => (result: Result<T>): Result<U> =>
  result.type === 'success' ? success(fn(result.value)) : result;

const chainResult = <T, U>(fn: (x: T) => Result<U>) => (result: Result<T>): Result<U> =>
  result.type === 'success' ? fn(result.value) : result;

// 使用示例
const processUser = R.pipe(
  (data: string) => safeParseJSON(data) as unknown as User | null,
  R.ifElse(
    R.isNil,
    () => error('Invalid JSON'),
    success
  ),
  chainResult((user) =>
    isValidUser(user) ? success(user) : error('Invalid user data')
  ),
  mapResult(R.evolve({ name: R.toUpper }))
);
```

### 实际应用示例

```typescript
// src/domain/user/userOperations.ts
import * as R from 'ramda';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  active: boolean;
  lastLoginAt: Date;
  permissions: string[];
}

// 用户验证
const isActive = R.propEq('active', true);
const isAdmin = R.propEq('role', 'admin');
const hasPermission = (permission: string) =>
  R.pipe(R.prop('permissions') as () => string[], R.includes(permission));

// 获取活跃管理员
export const getActiveAdmins = R.pipe(
  R.filter<User>(R.both(isActive, isAdmin)),
  R.map(R.pick(['id', 'name', 'email']))
);

// 检查用户权限
export const canUserPerformAction = R.curry(
  (action: string, user: User) =>
    isAdmin(user) || hasPermission(action)(user)
);

// 用户分组
export const groupUsersByRole = R.groupBy<User>(R.prop('role'));

// 统计用户状态
export const getUserStats = R.pipe(
  R.groupBy<User>((user) => (user.active ? 'active' : 'inactive')),
  R.map(R.length)
);

// 最近登录的用户
export const getRecentlyLoggedIn = R.pipe(
  R.filter<User>((user) => {
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);
    return user.lastLoginAt > dayAgo;
  }),
  R.sortBy<User>(R.prop('lastLoginAt')),
  R.reverse,
  R.take(10)
);

// src/domain/product/productOperations.ts
import * as R from 'ramda';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  tags: string[];
  stock: number;
  rating: number;
}

// 价格过滤
const priceRange = R.curry((min: number, max: number, products: Product[]) =>
  R.filter<Product>(
    R.both(R.propSatisfies(R.gte(R.__, min), 'price'), R.propSatisfies(R.lte(R.__, max), 'price'))
  )(products)
);

// 标签过滤
const hasTag = R.curry((tag: string, product: Product) =>
  R.pipe(R.prop('tags') as () => string[], R.includes(tag))(product)
);

// 搜索产品
export const searchProducts = R.curry((query: string, products: Product[]) => {
  const lowerQuery = query.toLowerCase();
  return R.filter<Product>((product) =>
    product.name.toLowerCase().includes(lowerQuery) ||
    product.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  )(products);
});

// 推荐产品（高分 + 有库存）
export const getRecommendedProducts = R.pipe(
  R.filter<Product>(R.both(R.propSatisfies(R.gte(4), 'rating'), R.propSatisfies(R.gt(0), 'stock'))),
  R.sortBy<Product>(R.prop('rating')),
  R.reverse,
  R.take(10)
);

// 按类别分组并计算平均价格
export const getCategoryStats = R.pipe(
  R.groupBy<Product>(R.prop('category')),
  R.mapObjIndexed((products: Product[]) => ({
    count: products.length,
    avgPrice: R.pipe(R.map(R.prop('price')), R.mean)(products),
    avgRating: R.pipe(R.map(R.prop('rating')), R.mean)(products),
  }))
);

// 组合查询
export const findProducts = R.curry(
  (filters: {
    minPrice?: number;
    maxPrice?: number;
    category?: string;
    tags?: string[];
    inStock?: boolean;
  }, products: Product[]) =>
    R.pipe(
      filters.minPrice !== undefined || filters.maxPrice !== undefined
        ? priceRange(filters.minPrice || 0, filters.maxPrice || Infinity)
        : R.identity,
      filters.category ? R.filter<Product>(R.propEq('category', filters.category)) : R.identity,
      filters.tags ? R.filter<Product>((p) => filters.tags!.some(hasTag(R.__, p))) : R.identity,
      filters.inStock ? R.filter<Product>(R.propSatisfies(R.gt(0), 'stock')) : R.identity
    )(products)
);

// src/services/api/apiHelpers.ts
import * as R from 'ramda';

// API 响应处理
interface ApiResponse<T> {
  data: T;
  meta: {
    page: number;
    total: number;
    perPage: number;
  };
}

export const extractData = R.prop('data');
export const extractMeta = R.prop('meta');

export const extractPage = R.pipe(extractMeta, R.prop('page'));
export const extractTotal = R.pipe(extractMeta, R.prop('total'));

// 分页
export const paginate = R.curry((page: number, perPage: number, items: any[]) => {
  const start = (page - 1) * perPage;
  return R.slice(start, start + perPage)(items);
});

// 构建查询参数
export const buildQueryString = R.pipe(
  R.toPairs,
  R.filter(([_, value]) => value !== undefined && value !== null),
  R.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`),
  R.join('&'),
  R.ifElse(R.isEmpty, R.always(''), R.concat('?'))
);

// 请求去重
const createRequestKey = R.pipe(
  R.props(['method', 'url', 'params']),
  R.join(':')
);

const pendingRequests = new Map<string, Promise<any>>();

export const deduplicateRequest = <T>(request: () => Promise<T>, config: any): Promise<T> => {
  const key = createRequestKey(config);
  
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }
  
  const promise = request().finally(() => {
    pendingRequests.delete(key);
  });
  
  pendingRequests.set(key, promise);
  return promise;
};

// 数据缓存
export const createCache = <T>(ttl: number) => {
  const cache = new Map<string, { data: T; expiry: number }>();
  
  const get = (key: string): T | null => {
    const item = cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      cache.delete(key);
      return null;
    }
    
    return item.data;
  };
  
  const set = (key: string, data: T) => {
    cache.set(key, {
      data,
      expiry: Date.now() + ttl,
    });
  };
  
  const clear = () => cache.clear();
  
  return { get, set, clear };
};
```

## 最佳实践

### 1. 保持 Point-free 风格

```typescript
// ✅ 推荐：Point-free
const getActiveUserNames = R.pipe(
  R.filter<User>(R.propEq('active', true)),
  R.map<User, string>(R.prop('name'))
);

// ❌ 避免：显式参数
const getActiveUserNames2 = (users: User[]) =>
  users.filter(u => u.active).map(u => u.name);
```

### 2. 组合小函数

```typescript
// ✅ 推荐：小函数组合
const isValidEmail = R.test(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
const isNotEmpty = R.complement(R.isEmpty);
const isValidName = R.both(isNotEmpty, R.pipe(R.length, R.lte(2)));

const validateUser = R.where({
  email: isValidEmail,
  name: isValidName,
});

// ❌ 避免：大函数
const validateUser2 = (user: User) =>
  user.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) &&
  user.name.length >= 2 &&
  user.name.length > 0;
```

### 3. 使用类型注解

```typescript
// ✅ 推荐：明确类型
const doubleNumbers: (arr: number[]) => number[] = R.map(R.multiply(2));

// 或使用泛型
const mapToArray = <T, U>(fn: (x: T) => U) => R.map<T, U>(fn);

// ❌ 避免：类型丢失
const result = R.map(R.multiply(2))([1, 2, 3]); // any[]
```

### 4. 性能优化

```typescript
// ✅ 使用 transduce 处理大数据
const transducer = R.compose(
  R.filter((x: number) => x % 2 === 0),
  R.map((x: number) => x * 2),
  R.take(1000)
);

const result = R.transduce(transducer, R.flip(R.append), [], largeArray);

// ✅ 使用 memoize 缓存昂贵计算
const expensiveOperation = R.memoizeWith(
  (x: number) => String(x),
  (x: number) => {
    // 复杂计算
    return x * x;
  }
);

// ✅ 惰性求值
const lazy = R.into([], transducer, infiniteSequence);
```

## 常用命令

```bash
# 安装依赖
npm install ramda
npm install --save-dev @types/ramda

# 运行测试
npm test

# 类型检查
npm run type-check

# 代码检查
npm run lint

# 构建生产版本
npm run build
```

## 部署配置

### Package.json

```json
{
  "dependencies": {
    "ramda": "^0.29.0"
  },
  "devDependencies": {
    "@types/ramda": "^0.29.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0"
  },
  "scripts": {
    "test": "jest",
    "type-check": "tsc --noEmit",
    "lint": "eslint 'src/**/*.ts'",
    "build": "tsc"
  }
}
```

### TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "ramda": ["node_modules/@types/ramda"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

## 参考资源

- [Ramda 官方文档](https://ramdajs.com/)
- [Ramda GitHub](https://github.com/ramda/ramda)
- [Ramda Cookbook](https://github.com/ramda/ramda/wiki/Cookbook)
- [Mostly Adequate Guide to FP](https://mostly-adequate.gitbooks.io/mostly-adequate-guide/)
- [Fantas, Eel, and Specification](http://www.tomharding.me/fantas-eel-and-specification/)
