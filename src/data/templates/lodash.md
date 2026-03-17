# Lodash 工具函数库模板

## 技术栈

- **Lodash**: 4.x (工具函数库)
- **TypeScript**: 5.x
- **Tree-shaking**: lodash-es 或 lodash 方法导入
- **测试**: Vitest

## 项目结构

```
src/
├── utils/                     # 工具函数
│   ├── lodash/               # Lodash扩展
│   │   ├── array.ts          # 数组工具
│   │   ├── object.ts         # 对象工具
│   │   ├── string.ts         # 字符串工具
│   │   ├── collection.ts     # 集合工具
│   │   └── custom.ts         # 自定义方法
│   ├── fp/                   # 函数式编程
│   │   ├── compose.ts        # 组合函数
│   │   ├── curry.ts          # 柯里化
│   │   └── pipe.ts           # 管道函数
│   └── index.ts              # 导出
├── hooks/                    # React Hooks
│   ├── useDebounce.ts        # 防抖hook
│   ├── useThrottle.ts        # 节流hook
│   ├── useDeepCompare.ts     # 深度比较
│   └── useMemoized.ts        # 记忆化
├── components/               # 组件
│   ├── SearchInput/
│   ├── FilterList/
│   └── DataTable/
└── __tests__/               # 测试
    ├── utils/
    └── hooks/
```

## 代码模式

### 数组操作

```typescript
// utils/lodash/array.ts
import {
  chunk,
  compact,
  difference,
  drop,
  dropRight,
  fill,
  findIndex,
  flatten,
  flattenDeep,
  fromPairs,
  head,
  intersection,
  last,
  nth,
  pull,
  pullAll,
  remove,
  slice,
  sortedIndex,
  sortedUniq,
  tail,
  take,
  takeRight,
  union,
  uniq,
  uniqBy,
  unzip,
  without,
  xor,
  zip,
  zipObject,
} from 'lodash-es';

// 分页数组
export function paginateArray<T>(array: T[], pageSize: number, pageNumber: number): T[] {
  const chunks = chunk(array, pageSize);
  return chunks[pageNumber - 1] || [];
}

// 去除重复对象
export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  return uniqBy(array, key);
}

// 数组分组
import { groupBy } from 'lodash-es';

export function groupArrayBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return groupBy(array, key);
}

// 数组排序
import { sortBy, orderBy } from 'lodash-es';

export function sortArrayBy<T>(
  array: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  return orderBy(array, [key], [order]);
}

// 数组求和/平均
import { sumBy, meanBy } from 'lodash-es';

export function calculateStats<T>(
  array: T[],
  key: keyof T
): { sum: number; mean: number; count: number } {
  return {
    sum: sumBy(array, key as any),
    mean: meanBy(array, key as any),
    count: array.length,
  };
}

// 数组统计
import { countBy } from 'lodash-es';

export function countByKey<T>(array: T[], key: keyof T): Record<string, number> {
  return countBy(array, key);
}

// 数组查找
import { find, findLast, filter, reject, some, every, includes } from 'lodash-es';

export function findItem<T>(array: T[], predicate: (item: T) => boolean): T | undefined {
  return find(array, predicate);
}

export function filterItems<T>(array: T[], predicate: (item: T) => boolean): T[] {
  return filter(array, predicate);
}

// 数组差异
export function arrayDifference<T>(array1: T[], array2: T[]): T[] {
  return difference(array1, array2);
}

export function arrayIntersection<T>(array1: T[], array2: T[]): T[] {
  return intersection(array1, array2);
}

export function arrayUnion<T>(...arrays: T[][]): T[] {
  return union(...arrays);
}

// 数组操作示例
const users = [
  { id: 1, name: 'Alice', age: 25, department: 'Engineering' },
  { id: 2, name: 'Bob', age: 30, department: 'Marketing' },
  { id: 3, name: 'Charlie', age: 25, department: 'Engineering' },
  { id: 4, name: 'David', age: 35, department: 'Marketing' },
];

// 按部门分组
const byDepartment = groupArrayBy(users, 'department');
// { Engineering: [...], Marketing: [...] }

// 按年龄排序
const sortedByAge = sortArrayBy(users, 'age', 'asc');

// 年龄统计
const ageStats = calculateStats(users, 'age');
// { sum: 115, mean: 28.75, count: 4 }

// 按年龄计数
const byAge = countByKey(users, 'age');
// { '25': 2, '30': 1, '35': 1 }
```

### 对象操作

```typescript
// utils/lodash/object.ts
import {
  assign,
  assignIn,
  at,
  clone,
  cloneDeep,
  defaults,
  defaultsDeep,
  findKey,
  findLastKey,
  forIn,
  forOwn,
  get,
  has,
  invert,
  keys,
  keysIn,
  mapKeys,
  mapValues,
  merge,
  mergeWith,
  omit,
  omitBy,
  pick,
  pickBy,
  result,
  set,
  setWith,
  toPairs,
  toPairsIn,
  transform,
  unset,
  update,
  updateWith,
  values,
  valuesIn,
} from 'lodash-es';

// 深度获取对象属性
export function getNestedValue<T>(obj: object, path: string, defaultValue?: T): T {
  return get(obj, path, defaultValue);
}

// 深度设置对象属性
export function setNestedValue<T>(obj: object, path: string, value: T): object {
  return set(cloneDeep(obj), path, value);
}

// 安全删除属性
export function deleteNestedValue(obj: object, path: string): boolean {
  return unset(obj, path);
}

// 对象合并（深度）
export function deepMerge<T extends object>(...objects: Partial<T>[]): T {
  return merge({}, ...objects);
}

// 条件合并
export function mergeWithCustomizer<T>(
  objValue: any,
  srcValue: any,
  key: string,
  object: T,
  source: T
): any {
  if (Array.isArray(objValue)) {
    return objValue.concat(srcValue);
  }
}

// 选择属性
export function pickFields<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  return pick(obj, keys) as Pick<T, K>;
}

// 排除属性
export function omitFields<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  return omit(obj, keys) as Omit<T, K>;
}

// 条件选择
export function pickByCondition<T extends object>(
  obj: T,
  predicate: (value: T[keyof T], key: string) => boolean
): Partial<T> {
  return pickBy(obj, predicate);
}

// 条件排除
export function omitByCondition<T extends object>(
  obj: T,
  predicate: (value: T[keyof T], key: string) => boolean
): Partial<T> {
  return omitBy(obj, predicate);
}

// 映射键名
export function renameKeys<T extends object>(
  obj: T,
  keyMap: Record<string, string>
): object {
  return mapKeys(obj, (value, key) => keyMap[key] || key);
}

// 映射值
export function transformValues<T extends object, R>(
  obj: T,
  transformer: (value: T[keyof T], key: string) => R
): Record<string, R> {
  return mapValues(obj, transformer);
}

// 对象扁平化
export function flattenObject(obj: object, prefix = ''): Record<string, any> {
  const result: Record<string, any> = {};

  forOwn(obj, (value, key) => {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey));
    } else {
      result[newKey] = value;
    }
  });

  return result;
}

// 对象展开
export function unflattenObject(obj: Record<string, any>): object {
  const result = {};

  forOwn(obj, (value, key) => {
    set(result, key, value);
  });

  return result;
}

// 深度比较
import { isEqual, isMatch } from 'lodash-es';

export function deepEqual(a: any, b: any): boolean {
  return isEqual(a, b);
}

export function partialMatch(object: object, source: object): boolean {
  return isMatch(object, source);
}

// 使用示例
const user = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  profile: {
    age: 30,
    address: {
      city: 'New York',
      country: 'USA',
    },
  },
};

// 获取嵌套值
const city = getNestedValue(user, 'profile.address.city', 'Unknown');
// 'New York'

// 设置嵌套值
const updated = setNestedValue(user, 'profile.address.zipCode', '10001');

// 扁平化对象
const flat = flattenObject(user);
// { id: 1, name: 'John Doe', 'profile.age': 30, 'profile.address.city': 'New York', ... }
```

### 字符串操作

```typescript
// utils/lodash/string.ts
import {
  camelCase,
  capitalize,
  deburr,
  endsWith,
  escape,
  escapeRegExp,
  kebabCase,
  lowerCase,
  lowerFirst,
  pad,
  padEnd,
  padStart,
  parseInt,
  repeat,
  replace,
  snakeCase,
  split,
  startCase,
  startsWith,
  template,
  templateSettings,
  toLower,
  toUpper,
  trim,
  trimEnd,
  trimStart,
  truncate,
  unescape,
  upperCase,
  upperFirst,
  words,
} from 'lodash-es';

// 大小写转换
export function convertCase(str: string, format: 'camel' | 'kebab' | 'snake' | 'start' | 'upper' | 'lower'): string {
  switch (format) {
    case 'camel':
      return camelCase(str);
    case 'kebab':
      return kebabCase(str);
    case 'snake':
      return snakeCase(str);
    case 'start':
      return startCase(str);
    case 'upper':
      return upperCase(str);
    case 'lower':
      return lowerCase(str);
    default:
      return str;
  }
}

// 截断字符串
export function truncateString(
  str: string,
  options: {
    length?: number;
    omission?: string;
    separator?: string | RegExp;
  } = {}
): string {
  const { length = 30, omission = '...', separator } = options;
  return truncate(str, { length, omission, separator });
}

// 模板字符串
export function createTemplate(templateStr: string, options = {}) {
  const compiled = template(templateStr, options);
  return (data: object) => compiled(data);
}

// 高亮关键词
export function highlightKeywords(
  text: string,
  keywords: string[],
  highlightTag = 'mark'
): string {
  let result = text;
  keywords.forEach((keyword) => {
    const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi');
    result = replace(result, regex, `<${highlightTag}>$1</${highlightTag}>`);
  });
  return result;
}

// 生成slug
export function generateSlug(text: string): string {
  return kebabCase(deburr(text));
}

// 字数统计
export function countWords(text: string): number {
  return words(text).length;
}

// 字符串填充
export function padString(
  str: string,
  length: number,
  chars = ' ',
  position: 'left' | 'right' | 'both' = 'left'
): string {
  switch (position) {
    case 'left':
      return padStart(str, length, chars);
    case 'right':
      return padEnd(str, length, chars);
    case 'both':
      return pad(str, length, chars);
    default:
      return str;
  }
}

// 重复字符串
export function repeatString(str: string, n: number, separator = ''): string {
  return Array(n).fill(str).join(separator);
}

// URL友好字符串
export function toUrlFriendly(str: string): string {
  return deburr(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// 使用示例
const title = 'Hello World! This is a Test.';

// 大小写转换
camelCase(title);     // 'helloWorldThisIsATest'
kebabCase(title);     // 'hello-world-this-is-a-test'
snakeCase(title);     // 'hello_world_this_is_a_test'
startCase(title);     // 'Hello World This Is A Test'

// 截断
truncateString(title, { length: 20 }); // 'Hello World! This...'

// 模板
const greet = createTemplate('Hello, <%= name %>!');
greet({ name: 'John' }); // 'Hello, John!'

// Slug生成
generateSlug('This is a Blog Post Title!'); // 'this-is-a-blog-post-title'

// 字数统计
countWords(title); // 6
```

### 函数式编程

```typescript
// utils/fp/compose.ts
import { flow, flowRight, pipe } from 'lodash/fp';

// 从左到右组合
export function composeLeft<T>(...funcs: Array<(arg: T) => T>): (arg: T) => T {
  return flow(funcs);
}

// 从右到左组合
export function composeRight<T>(...funcs: Array<(arg: T) => T>): (arg: T) => T {
  return flowRight(funcs);
}

// 管道
export { pipe };

// 使用示例
const add = (a: number) => (b: number) => a + b;
const multiply = (a: number) => (b: number) => a * b;
const square = (n: number) => n * n;

const calculate = pipe(
  add(10),
  multiply(2),
  square
);

calculate(5); // ((5 + 10) * 2)² = 900

// utils/fp/curry.ts
import { curry, curryRight, partial, partialRight } from 'lodash';

// 柯里化
export function createCurried<T extends (...args: any[]) => any>(fn: T): ReturnType<typeof curry<T>> {
  return curry(fn);
}

// 偏函数
export function createPartial<T extends (...args: any[]) => any>(
  fn: T,
  ...partials: any[]
): (...args: any[]) => any {
  return partial(fn, ...partials);
}

// 使用示例
const sum = (a: number, b: number, c: number) => a + b + c;

const curriedSum = createCurried(sum);
curriedSum(1)(2)(3); // 6
curriedSum(1, 2)(3); // 6
curriedSum(1)(2, 3); // 6

const addFive = createPartial(sum, 5);
addFive(2, 3); // 10

// utils/fp/memoize.ts
import { memoize, memoizeFactory } from 'lodash';

// 记忆化
export function memoizeFunction<T extends (...args: any[]) => any>(
  fn: T,
  resolver?: (...args: Parameters<T>) => string
): T {
  return memoize(fn, resolver);
}

// 使用示例
const expensiveCalculation = (n: number) => {
  console.log('Calculating...');
  return n * n;
};

const memoizedCalc = memoizeFunction(expensiveCalculation);

memoizedCalc(5); // Calculating... 25
memoizedCalc(5); // 25 (cached)
memoizedCalc(10); // Calculating... 100
```

### React Hooks

```typescript
// hooks/useDebounce.ts
import { useState, useEffect } from 'react';
import { debounce } from 'lodash-es';

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const debouncedFn = debounce((newValue: T) => {
      setDebouncedValue(newValue);
    }, delay);

    debouncedFn(value);

    return () => {
      debouncedFn.cancel();
    };
  }, [value, delay]);

  return debouncedValue;
}

// hooks/useThrottle.ts
import { useState, useEffect } from 'react';
import { throttle } from 'lodash-es';

export function useThrottle<T>(value: T, limit: number = 300): T {
  const [throttledValue, setThrottledValue] = useState(value);

  useEffect(() => {
    const throttledFn = throttle((newValue: T) => {
      setThrottledValue(newValue);
    }, limit);

    throttledFn(value);

    return () => {
      throttledFn.cancel();
    };
  }, [value, limit]);

  return throttledValue;
}

// hooks/useDeepCompare.ts
import { useRef } from 'react';
import { isEqual } from 'lodash-es';

export function useDeepCompareMemoize<T>(value: T): T | undefined {
  const ref = useRef<T>();

  if (!isEqual(value, ref.current)) {
    ref.current = value;
  }

  return ref.current;
}

// hooks/useDeepCompareEffect.ts
import { useEffect, EffectCallback, DependencyList } from 'react';
import { useDeepCompareMemoize } from './useDeepCompare';

export function useDeepCompareEffect(
  effect: EffectCallback,
  deps: DependencyList
): void {
  useEffect(effect, deps.map(useDeepCompareMemoize));
}

// hooks/useMemoized.ts
import { useMemo, useCallback } from 'react';
import { memoize } from 'lodash-es';

export function useMemoizedFunction<T extends (...args: any[]) => any>(
  fn: T
): T {
  return useMemo(() => memoize(fn), [fn]);
}

// 使用示例
function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearch) {
      // 执行搜索
      searchAPI(debouncedSearch);
    }
  }, [debouncedSearch]);

  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### 集合操作

```typescript
// utils/lodash/collection.ts
import {
  countBy,
  every,
  filter,
  find,
  findLast,
  flatMap,
  flatMapDeep,
  forEach,
  forEachRight,
  groupBy,
  includes,
  invokeMap,
  keyBy,
  map,
  orderBy,
  partition,
  reduce,
  reduceRight,
  reject,
  sample,
  sampleSize,
  shuffle,
  size,
  some,
  sortBy,
  orderBy as orderByFn,
} from 'lodash-es';

// 高级过滤
export function advancedFilter<T>(
  collection: T[],
  conditions: Array<{
    field: keyof T;
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains';
    value: any;
  }>
): T[] {
  return filter(collection, (item) =>
    conditions.every(({ field, operator, value }) => {
      const itemValue = item[field];
      switch (operator) {
        case 'eq':
          return itemValue === value;
        case 'neq':
          return itemValue !== value;
        case 'gt':
          return itemValue > value;
        case 'gte':
          return itemValue >= value;
        case 'lt':
          return itemValue < value;
        case 'lte':
          return itemValue <= value;
        case 'contains':
          return String(itemValue).includes(value);
        default:
          return true;
      }
    })
  );
}

// 分区和分组
export function partitionBy<T>(
  collection: T[],
  predicate: (item: T) => boolean
): [T[], T[]] {
  return partition(collection, predicate);
}

// 随机选择
export function randomSample<T>(collection: T[], count?: number): T | T[] {
  if (count) {
    return sampleSize(collection, count);
  }
  return sample(collection);
}

// 洗牌
export function shuffleCollection<T>(collection: T[]): T[] {
  return shuffle([...collection]);
}

// 转换为查找表
export function createLookup<T>(collection: T[], key: keyof T): Record<string, T> {
  return keyBy(collection, key);
}

// 使用示例
const products = [
  { id: 1, name: 'Laptop', price: 999, category: 'Electronics', stock: 10 },
  { id: 2, name: 'Phone', price: 699, category: 'Electronics', stock: 25 },
  { id: 3, name: 'Book', price: 19, category: 'Books', stock: 100 },
  { id: 4, name: 'Chair', price: 149, category: 'Furniture', stock: 5 },
];

// 高级过滤
const cheapElectronics = advancedFilter(products, [
  { field: 'category', operator: 'eq', value: 'Electronics' },
  { field: 'price', operator: 'lt', value: 800 },
]);

// 分区
const [inStock, outOfStock] = partitionBy(products, (p) => p.stock > 0);

// 随机选择
const randomProduct = randomSample(products);
const randomProducts = randomSample(products, 2);

// 按价格排序
const sorted = sortBy(products, ['price']);
const sortedDesc = orderBy(products, ['price'], ['desc']);

// 按分类分组
const byCategory = groupBy(products, 'category');

// 创建查找表
const productLookup = createLookup(products, 'id');
// { '1': { id: 1, ... }, '2': { id: 2, ... }, ... }
```

## 性能优化

```typescript
// 按需导入（推荐）
import { debounce, throttle } from 'lodash-es';

// 或者直接导入方法
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';

// Tree-shaking友好
import {
  map,
  filter,
  find,
  groupBy,
  sortBy,
} from 'lodash-es';
```

## 测试

```typescript
// __tests__/utils/lodash/array.test.ts
import { describe, it, expect } from 'vitest';
import { paginateArray, uniqueBy, groupArrayBy } from '@/utils/lodash/array';

describe('Array Utils', () => {
  it('should paginate array', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const page1 = paginateArray(arr, 3, 1);
    
    expect(page1).toEqual([1, 2, 3]);
  });

  it('should unique by key', () => {
    const users = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 1, name: 'Alice Duplicate' },
    ];
    
    const unique = uniqueBy(users, 'id');
    
    expect(unique).toHaveLength(2);
    expect(unique[0].name).toBe('Alice');
  });

  it('should group by key', () => {
    const items = [
      { type: 'a', value: 1 },
      { type: 'b', value: 2 },
      { type: 'a', value: 3 },
    ];
    
    const grouped = groupArrayBy(items, 'type');
    
    expect(grouped.a).toHaveLength(2);
    expect(grouped.b).toHaveLength(1);
  });
});

// __tests__/hooks/useDebounce.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useDebounce } from '@/hooks/useDebounce';

describe('useDebounce', () => {
  it('should debounce value', async () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated', delay: 500 });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');

    vi.useRealTimers();
  });
});
```

## 配置文件

### package.json

```json
{
  "dependencies": {
    "lodash-es": "^4.17.21"
  },
  "devDependencies": {
    "@types/lodash-es": "^4.17.0"
  }
}
```

### vite.config.ts

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    include: ['lodash-es'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          lodash: ['lodash-es'],
        },
      },
    },
  },
});
```

## 最佳实践

1. **使用 lodash-es**: 支持 tree-shaking，减少包体积
2. **按需导入**: 只导入需要的方法
3. **函数式风格**: 使用 lodash/fp 进行函数式编程
4. **性能考虑**: 对于简单操作，优先使用原生方法
5. **类型安全**: 使用 @types/lodash-es 获得类型提示
6. **链式调用**: 适度使用 chain()，避免性能问题
7. **记忆化**: 对昂贵计算使用 memoize
8. **防抖节流**: 合理使用 debounce 和 throttle
9. **深度操作**: 使用 get/set 处理嵌套对象
10. **不可变性**: 使用 cloneDeep 避免副作用
