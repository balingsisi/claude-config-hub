# Immutable.js 不可变数据结构模板

## 技术栈

- **Immutable.js**: 4.x (不可变数据结构)
- **React**: 18.x
- **TypeScript**: 5.x
- **状态管理**: Redux / 自定义Store
- **测试**: Vitest

## 项目结构

```
src/
├── immutable/                 # Immutable工具
│   ├── collections/          # 集合类型
│   │   ├── List.ts           # List操作
│   │   ├── Map.ts            # Map操作
│   │   ├── Set.ts            # Set操作
│   │   └── Record.ts         # Record类型
│   ├── utils/                # 工具函数
│   │   ├── conversion.ts     # 转换工具
│   │   ├── seq.ts            # 惰性序列
│   │   └── equality.ts       # 相等性比较
│   └── index.ts              # 导出
├── store/                    # 状态管理
│   ├── index.ts              # Store定义
│   ├── reducers/             # Reducers
│   │   ├── userReducer.ts
│   │   └── todoReducer.ts
│   └── middleware/           # 中间件
│       └── logger.ts
├── hooks/                    # React Hooks
│   ├── useImmutable.ts       # Immutable hook
│   ├── useRecord.ts          # Record hook
│   └── useCursor.ts          # Cursor hook
├── components/               # 组件
│   ├── TodoList/
│   ├── UserForm/
│   └── DataTable/
└── __tests__/               # 测试
    ├── immutable/
    └── store/
```

## 代码模式

### List 操作

```typescript
// immutable/collections/List.ts
import { List, Range, Repeat } from 'immutable';

// 创建List
export function createList<T>(items?: Iterable<T> | ArrayLike<T>): List<T> {
  return List(items);
}

// 从数组创建
export function fromArray<T>(array: T[]): List<T> {
  return List(array);
}

// 创建范围List
export function createRange(start: number, end: number, step = 1): List<number> {
  return Range(start, end, step).toList();
}

// 创建重复List
export function createRepeat<T>(value: T, times: number): List<T> {
  return Repeat(value, times).toList();
}

// 基础操作
export function listOperations<T>() {
  const list = List([1, 2, 3, 4, 5]);

  return {
    // 获取
    get: list.get(0),           // 1
    getIn: list.getIn([0]),     // 1
    first: list.first(),        // 1
    last: list.last(),          // 5

    // 添加
    push: list.push(6),         // [1,2,3,4,5,6]
    unshift: list.unshift(0),   // [0,1,2,3,4,5]
    insert: list.insert(2, 99), // [1,2,99,3,4,5]

    // 删除
    pop: list.pop(),            // [1,2,3,4]
    shift: list.shift(),        // [2,3,4,5]
    delete: list.delete(2),     // [1,2,4,5]
    clear: list.clear(),        // []

    // 更新
    set: list.set(0, 10),       // [10,2,3,4,5]
    update: list.update(0, x => x * 2), // [2,2,3,4,5]
    merge: list.merge(List([10, 20])),  // [10,20,3,4,5]

    // 查找
    find: list.find(x => x > 2),     // 3
    findIndex: list.findIndex(x => x > 2), // 2
    indexOf: list.indexOf(3),        // 2
    contains: list.includes(3),      // true

    // 过滤
    filter: list.filter(x => x > 2), // [3,4,5]
    slice: list.slice(1, 4),         // [2,3,4]
    take: list.take(3),              // [1,2,3]
    takeLast: list.takeLast(2),      // [4,5]
    skip: list.skip(2),              // [3,4,5]
    skipLast: list.skipLast(2),      // [1,2,3]

    // 转换
    map: list.map(x => x * 2),       // [2,4,6,8,10]
    reduce: list.reduce((sum, x) => sum + x, 0), // 15
    flatMap: list.flatMap(x => [x, x * 2]), // [1,2,2,4,3,6,4,8,5,10]

    // 排序
    sort: list.sort((a, b) => b - a), // [5,4,3,2,1]
    reverse: list.reverse(),           // [5,4,3,2,1]

    // 分组
    groupBy: list.groupBy(x => x % 2), // {0: [2,4], 1: [1,3,5]}

    // 统计
    size: list.size,                  // 5
    count: list.count(x => x > 2),    // 3
    every: list.every(x => x > 0),    // true
    some: list.some(x => x > 4),      // true

    // 转换为JS
    toArray: list.toArray(),          // [1,2,3,4,5]
    toJS: list.toJS(),                // [1,2,3,4,5]
  };
}

// 高级操作
export function updateListInPath<T>(
  list: List<any>,
  keyPath: Iterable<number | string>,
  updater: (value: any) => any
): List<any> {
  return list.updateIn(keyPath, updater);
}

// 批量更新
export function updateMultiple<T>(
  list: List<T>,
  updates: Array<{ index: number; value: T }>
): List<T> {
  return list.withMutations(mutable => {
    updates.forEach(({ index, value }) => {
      mutable.set(index, value);
    });
  });
}

// 分页
export function paginateList<T>(
  list: List<T>,
  page: number,
  pageSize: number
): List<T> {
  const start = (page - 1) * pageSize;
  return list.slice(start, start + pageSize);
}

// 移动元素
export function moveItem<T>(
  list: List<T>,
  fromIndex: number,
  toIndex: number
): List<T> {
  const item = list.get(fromIndex);
  return list.delete(fromIndex).insert(toIndex, item!);
}

// 使用示例
const numbers = createList([1, 2, 3, 4, 5]);
const doubled = numbers.map(x => x * 2);
const filtered = numbers.filter(x => x > 2);
const sum = numbers.reduce((acc, val) => acc + val, 0);
```

### Map 操作

```typescript
// immutable/collections/Map.ts
import { Map, fromJS } from 'immutable';

// 创建Map
export function createMap<K = string, V = any>(obj?: object): Map<K, V> {
  return Map(obj);
}

// 深度转换JS对象
export function fromJSDeep(obj: any): any {
  return fromJS(obj);
}

// 基础操作
export function mapOperations() {
  const map = Map({ a: 1, b: 2, c: 3 });

  return {
    // 获取
    get: map.get('a'),              // 1
    getIn: map.getIn(['a']),        // 1
    has: map.has('a'),              // true
    includes: map.includes(2),      // true

    // 设置
    set: map.set('d', 4),           // {a:1,b:2,c:3,d:4}
    setIn: map.setIn(['a'], 10),    // {a:10,b:2,c:3}
    update: map.update('a', x => x * 2), // {a:2,b:2,c:3}
    updateIn: map.updateIn(['a'], x => x * 2),

    // 删除
    delete: map.delete('a'),        // {b:2,c:3}
    clear: map.clear(),             // {}

    // 合并
    merge: map.merge({ d: 4, e: 5 }),     // {a:1,b:2,c:3,d:4,e:5}
    mergeDeep: map.mergeDeep({ a: { x: 10 } }), // 深度合并
    mergeWith: map.mergeWith(
      (oldVal, newVal) => oldVal + newVal,
      { a: 10, b: 20 }
    ), // {a:11,b:22,c:3}

    // 转换
    map: map.map((value, key) => value * 2), // {a:2,b:4,c:6}
    mapKeys: map.mapKeys((key) => key.toUpperCase()), // {A:1,B:2,C:3}
    mapEntries: map.mapEntries(([key, value]) => [key.toUpperCase(), value * 2]),

    // 过滤
    filter: map.filter((value) => value > 1), // {b:2,c:3}
    filterNot: map.filterNot((value) => value > 1), // {a:1}

    // 翻转
    flip: map.flip(),               // {1:'a',2:'b',3:'c'}

    // 键值
    keys: [...map.keys()],          // ['a','b','c']
    values: [...map.values()],      // [1,2,3]
    entries: [...map.entries()],    // [['a',1],['b',2],['c',3]]

    // 统计
    size: map.size,                 // 3
    count: map.count((v) => v > 1), // 2

    // 转换为JS
    toObject: map.toObject(),       // {a:1,b:2,c:3}
    toJS: map.toJS(),               // {a:1,b:2,c:3}
  };
}

// 嵌套Map操作
export function nestedMapOperations() {
  const nested = fromJS({
    user: {
      name: 'John',
      age: 30,
      address: {
        city: 'NYC',
        country: 'USA',
      },
    },
  });

  // 获取嵌套值
  nested.getIn(['user', 'name']);              // 'John'
  nested.getIn(['user', 'address', 'city']);   // 'NYC'

  // 设置嵌套值
  nested.setIn(['user', 'age'], 31);
  nested.setIn(['user', 'address', 'zip'], '10001');

  // 更新嵌套值
  nested.updateIn(['user', 'age'], age => age + 1);

  // 删除嵌套值
  nested.deleteIn(['user', 'address', 'country']);

  return nested;
}

// Map工具函数
export function mapKeys<K, V>(
  map: Map<K, V>,
  keyMapper: (key: K, value: V) => K
): Map<K, V> {
  return map.mapKeys(keyMapper);
}

export function mapValues<K, V, R>(
  map: Map<K, V>,
  valueMapper: (value: V, key: K) => R
): Map<K, R> {
  return map.map(valueMapper);
}

export function filterMap<K, V>(
  map: Map<K, V>,
  predicate: (value: V, key: K) => boolean
): Map<K, V> {
  return map.filter(predicate);
}

// 批量更新
export function updateMapInPaths<K, V>(
  map: Map<K, V>,
  updates: Array<{ path: K[]; updater: (value: any) => any }>
): Map<K, V> {
  return updates.reduce(
    (acc, { path, updater }) => acc.updateIn(path, updater),
    map
  );
}

// 使用示例
const userMap = createMap({
  id: 1,
  name: 'John',
  email: 'john@example.com',
});

const updated = userMap
  .set('age', 30)
  .update('name', name => name.toUpperCase())
  .merge({ role: 'admin' });
```

### Set 操作

```typescript
// immutable/collections/Set.ts
import { Set, OrderedSet } from 'immutable';

// 创建Set
export function createSet<T>(values?: Iterable<T>): Set<T> {
  return Set(values);
}

// 创建有序Set
export function createOrderedSet<T>(values?: Iterable<T>): OrderedSet<T> {
  return OrderedSet(values);
}

// 基础操作
export function setOperations() {
  const set = Set([1, 2, 3, 4, 5]);

  return {
    // 添加
    add: set.add(6),           // Set{1,2,3,4,5,6}

    // 删除
    delete: set.delete(3),     // Set{1,2,4,5}
    clear: set.clear(),        // Set{}

    // 查询
    has: set.has(3),           // true
    includes: set.includes(3), // true

    // 集合操作
    union: set.union(Set([4, 5, 6])),        // 并集 Set{1,2,3,4,5,6}
    intersect: set.intersect(Set([4, 5, 6])), // 交集 Set{4,5}
    subtract: set.subtract(Set([4, 5])),     // 差集 Set{1,2,3}

    // 转换
    map: set.map(x => x * 2),  // Set{2,4,6,8,10}
    filter: set.filter(x => x > 2), // Set{3,4,5}

    // 统计
    size: set.size,            // 5
    count: set.count(x => x > 2), // 3

    // 转换为JS
    toArray: set.toArray(),    // [1,2,3,4,5]
    toJS: set.toJS(),          // [1,2,3,4,5]
  };
}

// 集合运算
export function setMath<T>() {
  const setA = Set([1, 2, 3, 4]);
  const setB = Set([3, 4, 5, 6]);

  return {
    union: setA.union(setB),         // Set{1,2,3,4,5,6}
    intersection: setA.intersect(setB), // Set{3,4}
    difference: setA.subtract(setB), // Set{1,2}
    symmetricDifference: setA.subtract(setB).union(setB.subtract(setA)), // Set{1,2,5,6}
  };
}

// 使用示例
const tags = createSet(['javascript', 'typescript', 'react']);
const updatedTags = tags
  .add('nodejs')
  .delete('javascript')
  .union(Set(['vue', 'angular']));
```

### Record 类型

```typescript
// immutable/collections/Record.ts
import { Record, Map } from 'immutable';

// 定义Record类型
interface UserRecord {
  id: number;
  name: string;
  email: string;
  age: number;
  role: 'admin' | 'user';
  active: boolean;
}

// 创建Record工厂
const UserFactory = Record<UserRecord>({
  id: 0,
  name: '',
  email: '',
  age: 0,
  role: 'user',
  active: true,
});

// 创建Record实例
export type UserRecordType = ReturnType<typeof UserFactory>;

export function createUser(props: Partial<UserRecord> = {}): UserRecordType {
  return UserFactory(props);
}

// Record操作
export function recordOperations() {
  const user = createUser({
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
  });

  return {
    // 获取值
    get: user.get('name'),       // 'John Doe'
    getIn: user.getIn(['name']), // 'John Doe'

    // 属性访问
    name: user.name,             // 'John Doe'
    email: user.email,           // 'john@example.com'

    // 设置值
    set: user.set('age', 30),
    setName: user.set('name', 'Jane Doe'),

    // 更新值
    update: user.update('age', age => age + 1),

    // 合并
    merge: user.merge({ age: 30, role: 'admin' }),

    // 删除
    delete: user.delete('age'),

    // 检查
    has: user.has('name'),       // true
    get: user.get('nonexistent', 'default'), // 'default'

    // 类型
    getRecordName: user.getRecordName(), // 'UserRecord'
  };
}

// 嵌套Record
interface AddressRecord {
  street: string;
  city: string;
  country: string;
  zipCode: string;
}

interface CompanyRecord {
  name: string;
  address: AddressRecord;
  employees: number;
}

const AddressFactory = Record<AddressRecord>({
  street: '',
  city: '',
  country: '',
  zipCode: '',
});

const CompanyFactory = Record<CompanyRecord>({
  name: '',
  address: AddressFactory(),
  employees: 0,
});

// 使用嵌套Record
export function createCompany(props: Partial<CompanyRecord> = {}) {
  return CompanyFactory({
    ...props,
    address: AddressFactory(props.address),
  });
}

// Record集合
interface TodoRecord {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

const TodoFactory = Record<TodoRecord>({
  id: '',
  text: '',
  completed: false,
  createdAt: new Date(),
});

export class TodoStore {
  private todos = Map<string, ReturnType<typeof TodoFactory>>();

  addTodo(text: string) {
    const todo = TodoFactory({
      id: crypto.randomUUID(),
      text,
      createdAt: new Date(),
    });
    this.todos = this.todos.set(todo.id, todo);
    return todo;
  }

  toggleTodo(id: string) {
    this.todos = this.todos.update(id, todo =>
      todo?.set('completed', !todo.completed)
    );
  }

  removeTodo(id: string) {
    this.todos = this.todos.delete(id);
  }

  getTodo(id: string) {
    return this.todos.get(id);
  }

  getAllTodos() {
    return this.todos.valueSeq().toList();
  }

  getCompletedTodos() {
    return this.todos
      .filter(todo => todo.completed)
      .valueSeq()
      .toList();
  }
}
```

### 转换工具

```typescript
// immutable/utils/conversion.ts
import {
  isImmutable,
  isCollection,
  isKeyed,
  isIndexed,
  isAssociative,
  isOrdered,
  isPlainObject,
  fromJS,
  toJS,
  Seq,
} from 'immutable';

// 检查是否为Immutable对象
export function checkImmutable(value: any) {
  return {
    isImmutable: isImmutable(value),
    isCollection: isCollection(value),
    isKeyed: isKeyed(value),
    isIndexed: isIndexed(value),
    isAssociative: isAssociative(value),
    isOrdered: isOrdered(value),
  };
}

// 转换为JS
export function convertToJS(value: any): any {
  return isImmutable(value) ? value.toJS() : value;
}

// 深度转换为JS
export function deepToJS(value: any): any {
  return toJS(value);
}

// 转换为Immutable
export function convertToImmutable(value: any): any {
  return isImmutable(value) ? value : fromJS(value);
}

// 浅转换（只转换第一层）
export function shallowToImmutable(obj: object) {
  return Seq(obj).toMap();
}

// 合并普通对象和Immutable对象
export function mergeWithImmutable(
  jsObj: object,
  immutableObj: any
): any {
  return fromJS(jsObj).merge(immutableObj);
}

// 提取路径上的值
export function extractPath(
  immutableObj: any,
  paths: string[][]
): Record<string, any> {
  return paths.reduce((result, path) => {
    const key = path.join('.');
    result[key] = immutableObj.getIn(path);
    return result;
  }, {} as Record<string, any>);
}

// 使用示例
const obj = {
  user: {
    name: 'John',
    age: 30,
  },
  items: [1, 2, 3],
};

const immutable = fromJS(obj);
const backToJS = convertToJS(immutable);

const checks = checkImmutable(immutable);
// { isImmutable: true, isCollection: true, ... }
```

### 性能优化

```typescript
// 使用withMutations进行批量更新
export function batchUpdate<T>(
  list: List<T>,
  updater: (mutable: List<T>) => void
): List<T> {
  return list.withMutations(updater);
}

// 示例：批量添加元素
const list = List([1, 2, 3]);
const updated = batchUpdate(list, (mutable) => {
  mutable.push(4);
  mutable.push(5);
  mutable.push(6);
});

// 使用Seq进行惰性计算
export function lazyOperations() {
  const largeArray = Array.from({ length: 1000000 }, (_, i) => i);

  // 惰性序列 - 不立即计算
  const seq = Seq(largeArray)
    .filter(x => x % 2 === 0)
    .map(x => x * 2)
    .take(10);

  // 只有在实际需要时才计算
  const result = seq.toArray(); // 只计算前10个

  return result;
}

// 使用memoize缓存结果
import { memoize } from 'immutable';

export const memoizedExpensiveCalc = memoize((data: any) => {
  // 昂贵的计算
  return data;
});
```

### React集成

```typescript
// hooks/useImmutable.ts
import { useState, useCallback, useMemo } from 'react';
import { isImmutable, fromJS, toJS } from 'immutable';

export function useImmutable<T>(initialValue: T) {
  const [state, setState] = useState(() =>
    isImmutable(initialValue) ? initialValue : fromJS(initialValue)
  );

  const updateState = useCallback((updater: (draft: any) => any) => {
    setState(prev => updater(prev));
  }, []);

  const resetState = useCallback((newValue?: T) => {
    setState(
      newValue
        ? isImmutable(newValue)
          ? newValue
          : fromJS(newValue)
        : fromJS(initialValue)
    );
  }, [initialValue]);

  const jsValue = useMemo(() => toJS(state), [state]);

  return {
    state,
    jsValue,
    updateState,
    resetState,
  };
}

// hooks/useRecord.ts
import { useState, useCallback } from 'react';
import { Record, RecordOf } from 'immutable';

export function useRecord<T extends object>(
  RecordFactory: Record.Factory<T>,
  initialValues?: Partial<T>
) {
  const [record, setRecord] = useState(() =>
    RecordFactory(initialValues)
  );

  const update = useCallback((key: keyof T, value: T[keyof T]) => {
    setRecord(prev => prev.set(key, value));
  }, []);

  const merge = useCallback((values: Partial<T>) => {
    setRecord(prev => prev.merge(values));
  }, []);

  const reset = useCallback(() => {
    setRecord(RecordFactory(initialValues));
  }, [RecordFactory, initialValues]);

  return {
    record,
    update,
    merge,
    reset,
    get: (key: keyof T) => record.get(key),
    toJS: () => record.toJS(),
  };
}

// 使用示例
function TodoComponent() {
  const { state, jsValue, updateState } = useImmutable({
    todos: [],
    filter: 'all',
  });

  const addTodo = (text: string) => {
    updateState(draft =>
      draft.update('todos', todos =>
        todos.push(fromJS({ id: Date.now(), text, completed: false }))
      )
    );
  };

  const toggleTodo = (id: number) => {
    updateState(draft =>
      draft.update('todos', todos =>
        todos.map(todo =>
          todo.get('id') === id
            ? todo.update('completed', c => !c)
            : todo
        )
      )
    );
  };

  return (
    <div>
      {/* 使用jsValue渲染 */}
      {jsValue.todos.map(todo => (
        <div key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo(todo.id)}
          />
          {todo.text}
        </div>
      ))}
    </div>
  );
}
```

## 测试

```typescript
// __tests__/immutable/collections/List.test.ts
import { describe, it, expect } from 'vitest';
import { List } from 'immutable';
import { createList, paginateList, moveItem } from '@/immutable/collections/List';

describe('List Operations', () => {
  it('should create list', () => {
    const list = createList([1, 2, 3]);
    expect(list.size).toBe(3);
    expect(list.get(0)).toBe(1);
  });

  it('should paginate list', () => {
    const list = createList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const page1 = paginateList(list, 1, 3);
    
    expect(page1.toJS()).toEqual([1, 2, 3]);
    
    const page2 = paginateList(list, 2, 3);
    expect(page2.toJS()).toEqual([4, 5, 6]);
  });

  it('should move item', () => {
    const list = createList([1, 2, 3, 4, 5]);
    const moved = moveItem(list, 0, 3);
    
    expect(moved.toJS()).toEqual([2, 3, 4, 1, 5]);
  });

  it('should be immutable', () => {
    const list1 = List([1, 2, 3]);
    const list2 = list1.push(4);
    
    expect(list1.size).toBe(3);
    expect(list2.size).toBe(4);
    expect(list1).not.toBe(list2);
  });
});

// __tests__/immutable/collections/Map.test.ts
import { describe, it, expect } from 'vitest';
import { Map, fromJS } from 'immutable';
import { createMap, mapValues, filterMap } from '@/immutable/collections/Map';

describe('Map Operations', () => {
  it('should create map', () => {
    const map = createMap({ a: 1, b: 2 });
    expect(map.get('a')).toBe(1);
    expect(map.get('b')).toBe(2);
  });

  it('should map values', () => {
    const map = createMap({ a: 1, b: 2, c: 3 });
    const doubled = mapValues(map, v => v * 2);
    
    expect(doubled.toJS()).toEqual({ a: 2, b: 4, c: 6 });
  });

  it('should filter map', () => {
    const map = createMap({ a: 1, b: 2, c: 3, d: 4 });
    const filtered = filterMap(map, v => v > 2);
    
    expect(filtered.toJS()).toEqual({ c: 3, d: 4 });
  });

  it('should handle nested operations', () => {
    const nested = fromJS({
      user: {
        name: 'John',
        age: 30,
      },
    });

    const updated = nested.setIn(['user', 'age'], 31);
    expect(updated.getIn(['user', 'age'])).toBe(31);
    expect(nested.getIn(['user', 'age'])).toBe(30); // 原始未变
  });
});
```

## 配置文件

### package.json

```json
{
  "dependencies": {
    "immutable": "^4.3.0",
    "react": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

## 最佳实践

1. **使用fromJS转换**: 深度转换普通对象为Immutable
2. **使用toJS转换**: 需要渲染时才转换为JS对象
3. **性能优化**: 使用withMutations进行批量更新
4. **类型安全**: 使用Record定义明确的数据结构
5. **避免频繁转换**: 减少Immutable和JS之间的转换
6. **使用Seq**: 对于大型数据集使用惰性计算
7. **相等性比较**: Immutable对象的值比较使用equals()
8. **路径访问**: 使用getIn/setIn/updateIn操作嵌套数据
9. **持久化**: 序列化时使用toJS()或JSON.stringify()
10. **调试**: 使用Immutable DevTools查看状态变化
