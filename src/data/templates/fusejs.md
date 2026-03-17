# Fuse.js 模糊搜索模板

## 技术栈

- **核心库**: fuse.js v7.0+
- **类型支持**: TypeScript (内置)
- **框架集成**: React, Vue, Node.js
- **性能优化**: 节流、防抖、Web Worker
- **扩展**: fuse.js 基本配置、高级配置

## 项目结构

```
src/
├── search/
│   ├── index.ts              # 导出搜索功能
│   ├── fuseConfig.ts         # Fuse 配置
│   ├── searchEngine.ts       # 搜索引擎
│   ├── filters.ts            # 过滤器
│   └── rankers.ts            # 排序器
├── hooks/
│   ├── useFuseSearch.ts      # 搜索 Hook
│   ├── useDebouncedSearch.ts # 防抖搜索
│   └── useSearchHistory.ts   # 搜索历史
├── components/
│   ├── SearchBar.tsx         # 搜索栏
│   ├── SearchResults.tsx     # 搜索结果
│   ├── SearchFilters.tsx     # 搜索过滤器
│   └── HighlightText.tsx     # 高亮文本
├── utils/
│   ├── highlight.ts          # 高亮工具
│   ├── normalize.ts          # 标准化
│   └── validators.ts         # 验证器
└── types/
    └── search.d.ts           # 类型定义
```

## 代码模式

### 1. 基础配置

```typescript
// src/search/fuseConfig.ts
import Fuse, { FuseOptionKey, IFuseOptions } from 'fuse.js';

// 基础搜索选项
export const defaultFuseOptions: IFuseOptions<any> = {
  includeScore: true,          // 包含分数
  includeMatches: true,        // 包含匹配信息
  minMatchCharLength: 1,       // 最小匹配字符长度
  shouldSort: true,            // 自动排序
  threshold: 0.3,              // 匹配阈值 (0-1)
  distance: 100,               // 匹配距离
  ignoreLocation: false,       // 是否忽略位置
  findAllMatches: false,       // 查找所有匹配
  useExtendedSearch: false,    // 扩展搜索
  ignoreFieldNorm: false,      // 忽略字段规范
};

// 严格搜索选项
export const strictFuseOptions: IFuseOptions<any> = {
  ...defaultFuseOptions,
  threshold: 0.1,
  distance: 50,
};

// 宽松搜索选项
export const looseFuseOptions: IFuseOptions<any> = {
  ...defaultFuseOptions,
  threshold: 0.6,
  distance: 200,
};
```

### 2. 搜索引擎

```typescript
// src/search/searchEngine.ts
import Fuse, { IFuseOptions, FuseResult } from 'fuse.js';

export class SearchEngine<T> {
  private fuse: Fuse<T>;
  private data: T[];
  
  constructor(data: T[], options?: IFuseOptions<T>) {
    this.data = data;
    this.fuse = new Fuse(data, options);
  }
  
  // 基础搜索
  search(query: string, limit?: number): FuseResult<T>[] {
    return this.fuse.search(query, { limit });
  }
  
  // 更新数据
  setData(data: T[]): void {
    this.data = data;
    this.fuse.setCollection(data);
  }
  
  // 添加数据
  add(data: T): void {
    this.fuse.add(data);
    this.data.push(data);
  }
  
  // 移除数据
  remove(predicate: (item: T) => boolean): void {
    this.data = this.data.filter((item) => !predicate(item));
    this.fuse.setCollection(this.data);
  }
  
  // 获取所有数据
  getData(): T[] {
    return this.data;
  }
}

// 使用示例
interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
}

const products: Product[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro',
    description: 'Latest Apple smartphone with titanium design',
    category: 'Electronics',
    price: 999,
  },
  {
    id: '2',
    name: 'MacBook Pro',
    description: 'Powerful laptop for professionals',
    category: 'Electronics',
    price: 1999,
  },
];

const searchEngine = new SearchEngine<Product>(products, {
  keys: ['name', 'description', 'category'],
  ...defaultFuseOptions,
});

const results = searchEngine.search('apple');
```

### 3. React Hooks

```typescript
// src/hooks/useFuseSearch.ts
import { useState, useMemo, useCallback } from 'react';
import Fuse, { IFuseOptions, FuseResult } from 'fuse.js';

export function useFuseSearch<T>(
  data: T[],
  options: IFuseOptions<T>
) {
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(10);
  
  const fuse = useMemo(() => new Fuse(data, options), [data, options]);
  
  const results = useMemo(() => {
    if (!query) return [];
    return fuse.search(query, { limit });
  }, [fuse, query, limit]);
  
  const search = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);
  
  return {
    results,
    query,
    search,
    setLimit,
  };
}

// 使用示例
function ProductSearch({ products }: { products: Product[] }) {
  const { results, query, search } = useFuseSearch<Product>(products, {
    keys: ['name', 'description'],
    threshold: 0.3,
  });
  
  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => search(e.target.value)}
        placeholder="Search products..."
      />
      
      <ul>
        {results.map((result) => (
          <li key={result.item.id}>
            <h3>{result.item.name}</h3>
            <p>{result.item.description}</p>
            <small>Score: {result.score}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 4. 防抖搜索

```typescript
// src/hooks/useDebouncedSearch.ts
import { useState, useEffect, useRef } from 'react';
import Fuse, { IFuseOptions, FuseResult } from 'fuse.js';

export function useDebouncedSearch<T>(
  data: T[],
  options: IFuseOptions<T>,
  delay = 300
) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FuseResult<T>[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const fuse = useMemo(() => new Fuse(data, options), [data, options]);
  
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (!query) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    
    timeoutRef.current = setTimeout(() => {
      const searchResults = fuse.search(query);
      setResults(searchResults);
      setIsSearching(false);
    }, delay);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [fuse, query, delay]);
  
  const search = (newQuery: string) => {
    setQuery(newQuery);
  };
  
  return {
    results,
    query,
    search,
    isSearching,
  };
}
```

### 5. 高级搜索

```typescript
// src/search/advancedSearch.ts
import Fuse, { IFuseOptions, FuseResult, Expression } from 'fuse.js';

// 扩展搜索
export class AdvancedSearchEngine<T> extends SearchEngine<T> {
  constructor(data: T[], options?: IFuseOptions<T>) {
    super(data, {
      ...options,
      useExtendedSearch: true, // 启用扩展搜索
    });
  }
  
  // 精确匹配
  exactMatch(field: string, value: string): FuseResult<T>[] {
    return this.search(`="${value}"`);
  }
  
  // 包含匹配
  includes(field: string, value: string): FuseResult<T>[] {
    return this.search(`'${value}`);
  }
  
  // 前缀匹配
  prefixMatch(field: string, value: string): FuseResult<T>[] {
    return this.search(`^${value}`);
  }
  
  // 逻辑与
  andSearch(expressions: Expression[]): FuseResult<T>[] {
    return this.search({
      $and: expressions,
    });
  }
  
  // 逻辑或
  orSearch(expressions: Expression[]): FuseResult<T>[] {
    return this.search({
      $or: expressions,
    });
  }
}

// 使用示例
const advancedSearch = new AdvancedSearchEngine<Product>(products, {
  keys: ['name', 'description', 'category'],
});

// 搜索名称包含 "iPhone" 且类别是 "Electronics"
const results = advancedSearch.andSearch([
  { name: 'iPhone' },
  { category: 'Electronics' },
]);
```

### 6. 搜索组件

```typescript
// src/components/SearchBar.tsx
import React, { useState, useCallback } from 'react';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';

interface SearchBarProps<T> {
  data: T[];
  keys: string[];
  placeholder?: string;
  onResults: (results: T[]) => void;
  delay?: number;
  className?: string;
}

export function SearchBar<T extends { id: string | number }>({
  data,
  keys,
  placeholder = 'Search...',
  onResults,
  delay = 300,
  className,
}: SearchBarProps<T>) {
  const { results, query, search, isSearching } = useDebouncedSearch<T>(
    data,
    {
      keys,
      includeScore: true,
      includeMatches: true,
      threshold: 0.3,
    },
    delay
  );
  
  useEffect(() => {
    onResults(results.map((r) => r.item));
  }, [results, onResults]);
  
  return (
    <div className={className}>
      <input
        type="text"
        value={query}
        onChange={(e) => search(e.target.value)}
        placeholder={placeholder}
        className="search-input"
      />
      {isSearching && <span className="search-loading">Searching...</span>}
    </div>
  );
}

// src/components/SearchResults.tsx
import React from 'react';
import { FuseResult } from 'fuse.js';
import { HighlightText } from './HighlightText';

interface SearchResultsProps<T> {
  results: FuseResult<T>[];
  renderKey: keyof T;
  renderItem?: (item: T) => React.ReactNode;
  onSelect?: (item: T) => void;
  className?: string;
}

export function SearchResults<T>({
  results,
  renderKey,
  renderItem,
  onSelect,
  className,
}: SearchResultsProps<T>) {
  if (results.length === 0) {
    return <div className={className}>No results found</div>;
  }
  
  return (
    <ul className={className}>
      {results.map((result, index) => (
        <li
          key={`${result.item[renderKey]}-${index}`}
          onClick={() => onSelect?.(result.item)}
          className="search-result-item"
        >
          {renderItem ? (
            renderItem(result.item)
          ) : (
            <div>
              <HighlightText
                text={String(result.item[renderKey])}
                matches={result.matches}
              />
              {result.score !== undefined && (
                <small>Score: {(1 - result.score).toFixed(2)}</small>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
```

### 7. 高亮文本

```typescript
// src/components/HighlightText.tsx
import React from 'react';
import { FuseResultMatch } from 'fuse.js';

interface HighlightTextProps {
  text: string;
  matches?: readonly FuseResultMatch[];
  highlightClassName?: string;
  className?: string;
}

export function HighlightText({
  text,
  matches,
  highlightClassName = 'highlight',
  className,
}: HighlightTextProps) {
  if (!matches || matches.length === 0) {
    return <span className={className}>{text}</span>;
  }
  
  // 获取所有匹配的索引
  const indices: Array<[number, number]> = [];
  matches.forEach((match) => {
    if (match.indices) {
      indices.push(...match.indices);
    }
  });
  
  // 合并重叠的索引
  const mergedIndices = mergeIndices(indices);
  
  // 生成高亮文本
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  mergedIndices.forEach(([start, end], index) => {
    // 添加未高亮部分
    if (start > lastIndex) {
      parts.push(
        <span key={`text-${index}`}>
          {text.substring(lastIndex, start)}
        </span>
      );
    }
    
    // 添加高亮部分
    parts.push(
      <span key={`highlight-${index}`} className={highlightClassName}>
        {text.substring(start, end + 1)}
      </span>
    );
    
    lastIndex = end + 1;
  });
  
  // 添加剩余部分
  if (lastIndex < text.length) {
    parts.push(<span key="text-last">{text.substring(lastIndex)}</span>);
  }
  
  return <span className={className}>{parts}</span>;
}

// 合并重叠索引
function mergeIndices(indices: Array<[number, number]>): Array<[number, number]> {
  if (indices.length === 0) return [];
  
  // 按起始位置排序
  const sorted = [...indices].sort((a, b) => a[0] - b[0]);
  
  const merged: Array<[number, number]> = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    const [currentStart, currentEnd] = sorted[i];
    const [lastStart, lastEnd] = merged[merged.length - 1];
    
    if (currentStart <= lastEnd + 1) {
      // 合并重叠或相邻的索引
      merged[merged.length - 1] = [lastStart, Math.max(lastEnd, currentEnd)];
    } else {
      merged.push([currentStart, currentEnd]);
    }
  }
  
  return merged;
}
```

### 8. 搜索历史

```typescript
// src/hooks/useSearchHistory.ts
import { useState, useCallback, useEffect } from 'react';

interface SearchHistoryItem {
  query: string;
  timestamp: number;
  count: number;
}

export function useSearchHistory(
  maxItems = 10,
  storageKey = 'search-history'
) {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  
  // 从 localStorage 加载历史
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load search history:', error);
      }
    }
  }, [storageKey]);
  
  // 保存到 localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(history));
  }, [history, storageKey]);
  
  // 添加搜索项
  const addToHistory = useCallback((query: string) => {
    if (!query.trim()) return;
    
    setHistory((prev) => {
      const existing = prev.find((item) => item.query === query);
      
      if (existing) {
        // 更新现有项
        return [
          { ...existing, count: existing.count + 1, timestamp: Date.now() },
          ...prev.filter((item) => item.query !== query),
        ].slice(0, maxItems);
      } else {
        // 添加新项
        return [
          { query, timestamp: Date.now(), count: 1 },
          ...prev,
        ].slice(0, maxItems);
      }
    });
  }, [maxItems]);
  
  // 清除历史
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(storageKey);
  }, [storageKey]);
  
  // 移除单个项
  const removeFromHistory = useCallback((query: string) => {
    setHistory((prev) => prev.filter((item) => item.query !== query));
  }, []);
  
  // 获取最常搜索
  const getMostFrequent = useCallback((count = 5) => {
    return [...history]
      .sort((a, b) => b.count - a.count)
      .slice(0, count);
  }, [history]);
  
  // 获取最近搜索
  const getMostRecent = useCallback((count = 5) => {
    return [...history]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);
  }, [history]);
  
  return {
    history,
    addToHistory,
    clearHistory,
    removeFromHistory,
    getMostFrequent,
    getMostRecent,
  };
}
```

### 9. 搜索过滤器

```typescript
// src/search/filters.ts
import { FuseResult } from 'fuse.js';

// 按字段过滤
export function filterByField<T>(
  results: FuseResult<T>[],
  field: keyof T,
  value: any
): FuseResult<T>[] {
  return results.filter((result) => result.item[field] === value);
}

// 按范围过滤
export function filterByRange<T>(
  results: FuseResult<T>[],
  field: keyof T,
  min?: number,
  max?: number
): FuseResult<T>[] {
  return results.filter((result) => {
    const value = result.item[field] as number;
    if (min !== undefined && value < min) return false;
    if (max !== undefined && value > max) return false;
    return true;
  });
}

// 按分数过滤
export function filterByScore<T>(
  results: FuseResult<T>[],
  minScore = 0.5
): FuseResult<T>[] {
  return results.filter((result) => {
    const score = result.score ?? 0;
    return (1 - score) >= minScore;
  });
}

// 组合过滤器
export function composeFilters<T>(
  ...filters: Array<(results: FuseResult<T>[]) => FuseResult<T>[]>
) {
  return (results: FuseResult<T>[]) => {
    return filters.reduce((acc, filter) => filter(acc), results);
  };
}

// 使用示例
const filteredResults = composeFilters(
  (results) => filterByField(results, 'category', 'Electronics'),
  (results) => filterByRange(results, 'price', 100, 1000),
  (results) => filterByScore(results, 0.7)
)(searchResults);
```

### 10. 排序

```typescript
// src/search/rankers.ts
import { FuseResult } from 'fuse.js';

// 按分数排序
export function sortByScore<T>(results: FuseResult<T>[]): FuseResult<T>[] {
  return [...results].sort((a, b) => {
    const scoreA = a.score ?? 0;
    const scoreB = b.score ?? 0;
    return scoreA - scoreB; // 分数越低越好
  });
}

// 按字段排序
export function sortByField<T>(
  results: FuseResult<T>[],
  field: keyof T,
  order: 'asc' | 'desc' = 'asc'
): FuseResult<T>[] {
  return [...results].sort((a, b) => {
    const valueA = a.item[field];
    const valueB = b.item[field];
    
    if (valueA < valueB) return order === 'asc' ? -1 : 1;
    if (valueA > valueB) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

// 按匹配数量排序
export function sortByMatches<T>(results: FuseResult<T>[]): FuseResult<T>[] {
  return [...results].sort((a, b) => {
    const matchesA = a.matches?.length ?? 0;
    const matchesB = b.matches?.length ?? 0;
    return matchesB - matchesA;
  });
}

// 组合排序器
export function composeSorters<T>(
  ...sorters: Array<(results: FuseResult<T>[]) => FuseResult<T>[]>
) {
  return (results: FuseResult<T>[]) => {
    return sorters.reduceRight((acc, sorter) => sorter(acc), results);
  };
}

// 使用示例
const sortedResults = composeSorters(
  (results) => sortByField(results, 'price', 'asc'),
  (results) => sortByScore(results)
)(searchResults);
```

## 最佳实践

### 1. 性能优化

```typescript
// ✅ 使用 useMemo 缓存 Fuse 实例
const fuse = useMemo(() => new Fuse(data, options), [data, options]);

// ✅ 防抖输入
const debouncedSearch = useDebouncedSearch(data, options, 300);

// ✅ 限制结果数量
const results = fuse.search(query, { limit: 10 });

// ✅ 使用 Web Worker（大数据集）
const worker = new Worker('searchWorker.js');
worker.postMessage({ data, query });
worker.onmessage = (e) => {
  setResults(e.data.results);
};

// ✅ 分页加载
const paginatedResults = results.slice(0, pageSize * currentPage);
```

### 2. 键配置

```typescript
// ✅ 指定权重
const options: IFuseOptions<Product> = {
  keys: [
    { name: 'name', weight: 2 },        // 更高权重
    { name: 'description', weight: 1 }, // 默认权重
    { name: 'category', weight: 0.5 },  // 较低权重
  ],
};

// ✅ 嵌套键
const options: IFuseOptions<Order> = {
  keys: [
    'customer.name',
    'customer.email',
    'items.name',
  ],
};

// ✅ 使用函数获取值
const options: IFuseOptions<Product> = {
  keys: [
    {
      name: 'name',
      getFn: (product) => product.name.toLowerCase(),
    },
  ],
};
```

### 3. 类型安全

```typescript
// ✅ 使用 TypeScript 泛型
const fuse = new Fuse<Product>(products, {
  keys: ['name', 'description'], // 自动补全
});

// ✅ 定义搜索结果类型
interface SearchResult<T> {
  item: T;
  score?: number;
  matches?: readonly FuseResultMatch[];
}

// ✅ 类型守卫
function isSearchResult<T>(result: any): result is FuseResult<T> {
  return result && typeof result.item !== 'undefined';
}
```

### 4. 错误处理

```typescript
// ✅ 捕获搜索错误
try {
  const results = fuse.search(query);
} catch (error) {
  console.error('Search failed:', error);
  // 返回空结果或显示错误
}

// ✅ 验证输入
function safeSearch(fuse: Fuse<T>, query: string): FuseResult<T>[] {
  if (!query || typeof query !== 'string') {
    return [];
  }
  
  try {
    return fuse.search(query.trim());
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}
```

## 常用命令

```bash
# 安装 Fuse.js
npm install fuse.js

# TypeScript 支持（内置）
# 无需额外安装

# 测试
npm test

# 构建
npm run build
```

## 配置选项

### 基础选项

```typescript
interface IFuseOptions<T> {
  keys: (string | FuseOptionKey<T>)[]; // 搜索字段
  includeScore?: boolean;               // 包含分数
  includeMatches?: boolean;             // 包含匹配
  minMatchCharLength?: number;          // 最小匹配长度
  shouldSort?: boolean;                 // 自动排序
  threshold?: number;                   // 匹配阈值 (0-1)
  distance?: number;                    // 匹配距离
  ignoreLocation?: boolean;             // 忽略位置
  findAllMatches?: boolean;             // 查找所有匹配
  useExtendedSearch?: boolean;          // 扩展搜索
  ignoreFieldNorm?: boolean;            // 忽略字段规范
  fieldNormWeight?: number;             // 字段规范权重
}
```

### 扩展搜索语法

```typescript
// 精确匹配
{ field: '=value' }

// 包含匹配
{ field: "'value" }

// 前缀匹配
{ field: '^value' }

// 后缀匹配（不支持）

// 逻辑与
{ $and: [{ field1: 'value1' }, { field2: 'value2' }] }

// 逻辑或
{ $or: [{ field1: 'value1' }, { field2: 'value2' }] }
```

## 扩展资源

- [Fuse.js 官方文档](https://fusejs.io/)
- [Fuse.js GitHub](https://github.com/krisk/Fuse)
- [API 参考](https://fusejs.io/api/api.html)
- [配置选项](https://fusejs.io/api/options.html)
- [示例](https://fusejs.io/examples.html)
