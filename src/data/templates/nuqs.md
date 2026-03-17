# Nuqs URL 状态管理模板

## 技术栈

- **核心**: Nuqs 1.x
- **框架**: Next.js 14.x / 15.x (App Router)
- **类型安全**: TypeScript 5.x + Zod
- **状态同步**: URL Query Params
- **路由**: Next.js Navigation API
- **测试**: Vitest + Playwright

## 项目结构

```
project/
├── src/
│   ├── app/
│   │   ├── products/
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── filters/
│   │   │   ├── SearchFilter.tsx
│   │   │   ├── CategoryFilter.tsx
│   │   │   ├── PriceFilter.tsx
│   │   │   └── SortControl.tsx
│   │   └── pagination/
│   │       └── Pagination.tsx
│   ├── hooks/
│   │   ├── useProductFilters.ts
│   │   ├── usePagination.ts
│   │   └── useDebouncedQuery.ts
│   ├── parsers/
│   │   ├── filters.ts
│   │   └── pagination.ts
│   ├── types/
│   │   └── filters.ts
│   └── utils/
│       └── query-helpers.ts
├── next.config.js
├── tsconfig.json
└── package.json
```

## 代码模式

### 基础配置

```typescript
// src/app/layout.tsx
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { ReactNode } from 'react';

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <NuqsAdapter>
          {children}
        </NuqsAdapter>
      </body>
    </html>
  );
}
```

### 查询参数解析器

```typescript
// src/parsers/filters.ts
import { parseAsString, parseAsInteger, parseAsBoolean, parseAsJson } from 'nuqs';
import { z } from 'zod';

// 基础解析器
export const searchQueryParser = parseAsString
  .withDefault('')
  .withOptions({ shallow: false });

export const pageParser = parseAsInteger
  .withDefault(1)
  .withOptions({ shallow: true });

export const pageSizeParser = parseAsInteger
  .withDefault(20)
  .withOptions({ shallow: true });

// 类别解析器（数组）
export const categoriesParser = parseAsString
  .withOptions({ shallow: true });

// 价格范围解析器
const priceRangeSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
});

export const priceRangeParser = parseAsJson<z.infer<typeof priceRangeSchema>>(
  (value) => priceRangeSchema.parse(value)
).withDefault({});

// 排序解析器
export const sortParser = parseAsString
  .withOptions({ shallow: false });

// 复杂过滤器解析器
interface FilterState {
  search: string;
  categories: string[];
  priceRange: { min?: number; max?: number };
  inStock: boolean;
  sortBy: string;
}

const filterStateSchema = z.object({
  search: z.string(),
  categories: z.array(z.string()),
  priceRange: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }),
  inStock: z.boolean(),
  sortBy: z.string(),
});

export const filterStateParser = parseAsJson<FilterState>(
  (value) => filterStateSchema.parse(value)
);
```

### 搜索过滤器

```typescript
// src/components/filters/SearchFilter.tsx
'use client';

import { useQueryState } from 'nuqs';
import { searchQueryParser } from '@/parsers/filters';
import { useDebouncedCallback } from '@/hooks/useDebouncedQuery';

export default function SearchFilter() {
  const [search, setSearch] = useQueryState(
    'search',
    searchQueryParser
  );

  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setSearch(value || null);
  }, 300);

  return (
    <div className="search-filter">
      <input
        type="text"
        defaultValue={search}
        onChange={(e) => debouncedSetSearch(e.target.value)}
        placeholder="Search products..."
        className="search-input"
      />
      {search && (
        <button
          onClick={() => setSearch(null)}
          className="clear-button"
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );
}
```

### 类别过滤器

```typescript
// src/components/filters/CategoryFilter.tsx
'use client';

import { useQueryState } from 'nuqs';
import { categoriesParser } from '@/parsers/filters';
import { useCallback } from 'react';

const AVAILABLE_CATEGORIES = [
  'Electronics',
  'Clothing',
  'Books',
  'Home & Garden',
  'Sports',
] as const;

export default function CategoryFilter() {
  const [categories, setCategories] = useQueryState(
    'categories',
    categoriesParser
  );

  const selectedCategories = categories ? categories.split(',').filter(Boolean) : [];

  const toggleCategory = useCallback((category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    
    setCategories(newCategories.length > 0 ? newCategories.join(',') : null);
  }, [selectedCategories, setCategories]);

  const clearAll = useCallback(() => {
    setCategories(null);
  }, [setCategories]);

  return (
    <div className="category-filter">
      <div className="filter-header">
        <h3>Categories</h3>
        {selectedCategories.length > 0 && (
          <button onClick={clearAll} className="clear-all">
            Clear all
          </button>
        )}
      </div>
      
      <div className="category-list">
        {AVAILABLE_CATEGORIES.map((category) => (
          <label key={category} className="category-item">
            <input
              type="checkbox"
              checked={selectedCategories.includes(category)}
              onChange={() => toggleCategory(category)}
            />
            <span>{category}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
```

### 价格范围过滤器

```typescript
// src/components/filters/PriceFilter.tsx
'use client';

import { useQueryState } from 'nuqs';
import { priceRangeParser } from '@/parsers/filters';
import { useState, useEffect } from 'react';

export default function PriceFilter() {
  const [priceRange, setPriceRange] = useQueryState(
    'price',
    priceRangeParser
  );

  const [localMin, setLocalMin] = useState(priceRange.min?.toString() || '');
  const [localMax, setLocalMax] = useState(priceRange.max?.toString() || '');

  useEffect(() => {
    setLocalMin(priceRange.min?.toString() || '');
    setLocalMax(priceRange.max?.toString() || '');
  }, [priceRange]);

  const handleApply = () => {
    const min = localMin ? parseFloat(localMin) : undefined;
    const max = localMax ? parseFloat(localMax) : undefined;

    if (min !== undefined || max !== undefined) {
      setPriceRange({ min, max });
    } else {
      setPriceRange(null);
    }
  };

  const handleClear = () => {
    setLocalMin('');
    setLocalMax('');
    setPriceRange(null);
  };

  return (
    <div className="price-filter">
      <h3>Price Range</h3>
      
      <div className="price-inputs">
        <div className="input-group">
          <label>Min</label>
          <input
            type="number"
            value={localMin}
            onChange={(e) => setLocalMin(e.target.value)}
            placeholder="0"
            min="0"
          />
        </div>
        
        <span className="separator">-</span>
        
        <div className="input-group">
          <label>Max</label>
          <input
            type="number"
            value={localMax}
            onChange={(e) => setLocalMax(e.target.value)}
            placeholder="1000"
            min="0"
          />
        </div>
      </div>

      <div className="price-actions">
        <button onClick={handleApply} className="apply-button">
          Apply
        </button>
        <button onClick={handleClear} className="clear-button">
          Clear
        </button>
      </div>
    </div>
  );
}
```

### 排序控制

```typescript
// src/components/filters/SortControl.tsx
'use client';

import { useQueryState } from 'nuqs';
import { sortParser } from '@/parsers/filters';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
] as const;

export default function SortControl() {
  const [sort, setSort] = useQueryState('sort', sortParser);

  return (
    <div className="sort-control">
      <label htmlFor="sort">Sort by:</label>
      <select
        id="sort"
        value={sort || 'newest'}
        onChange={(e) => setSort(e.target.value)}
        className="sort-select"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### 分页组件

```typescript
// src/components/pagination/Pagination.tsx
'use client';

import { useQueryState } from 'nuqs';
import { pageParser, pageSizeParser } from '@/parsers/filters';
import { useRouter } from 'next/navigation';

interface PaginationProps {
  totalCount: number;
}

export default function Pagination({ totalCount }: PaginationProps) {
  const router = useRouter();
  const [page, setPage] = useQueryState('page', pageParser);
  const [pageSize, setPageSize] = useQueryState('pageSize', pageSizeParser);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    router.scrollTo?.(0, 0);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1); // Reset to first page
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Always show first page
    pages.push(1);

    if (page > 3) {
      pages.push('...');
    }

    // Show pages around current page
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (page < totalPages - 2) {
      pages.push('...');
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="pagination">
      <div className="page-size-selector">
        <label>Show:</label>
        <select
          value={pageSize}
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      <div className="page-buttons">
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          className="page-button"
          aria-label="Previous page"
        >
          ‹
        </button>

        {getPageNumbers().map((pageNum, idx) =>
          typeof pageNum === 'number' ? (
            <button
              key={idx}
              onClick={() => handlePageChange(pageNum)}
              className={`page-button ${page === pageNum ? 'active' : ''}`}
            >
              {pageNum}
            </button>
          ) : (
            <span key={idx} className="ellipsis">
              {pageNum}
            </span>
          )
        )}

        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
          className="page-button"
          aria-label="Next page"
        >
          ›
        </button>
      </div>

      <div className="page-info">
        Showing {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, totalCount)} of {totalCount}
      </div>
    </div>
  );
}
```

### 自定义 Hook

```typescript
// src/hooks/useProductFilters.ts
'use client';

import { useQueryStates } from 'nuqs';
import { useCallback, useMemo } from 'react';
import {
  searchQueryParser,
  categoriesParser,
  priceRangeParser,
  sortParser,
  pageParser,
  pageSizeParser,
} from '@/parsers/filters';

export function useProductFilters() {
  const [query, setQuery] = useQueryStates({
    search: searchQueryParser,
    categories: categoriesParser,
    price: priceRangeParser,
    sort: sortParser,
    page: pageParser,
    pageSize: pageSizeParser,
  });

  const filters = useMemo(
    () => ({
      search: query.search,
      categories: query.categories ? query.categories.split(',') : [],
      priceRange: query.price,
      sortBy: query.sort,
      page: query.page,
      pageSize: query.pageSize,
    }),
    [query]
  );

  const updateFilters = useCallback(
    (updates: Partial<typeof filters>) => {
      setQuery({
        search: updates.search ?? null,
        categories: updates.categories?.length ? updates.categories.join(',') : null,
        price: updates.priceRange ?? null,
        sort: updates.sortBy ?? null,
        page: updates.page ?? null,
        pageSize: updates.pageSize ?? null,
      });
    },
    [setQuery]
  );

  const resetFilters = useCallback(() => {
    setQuery({
      search: null,
      categories: null,
      price: null,
      sort: null,
      page: null,
      pageSize: null,
    });
  }, [setQuery]);

  const hasActiveFilters = useMemo(() => {
    return (
      query.search !== '' ||
      query.categories !== null ||
      (query.price.min !== undefined || query.price.max !== undefined) ||
      query.sort !== null
    );
  }, [query]);

  return {
    filters,
    query,
    updateFilters,
    resetFilters,
    hasActiveFilters,
  };
}

// 使用示例
function ProductsPage() {
  const { filters, hasActiveFilters, resetFilters } = useProductFilters();

  return (
    <div>
      <div className="filter-bar">
        <SearchFilter />
        <CategoryFilter />
        <PriceFilter />
        <SortControl />
        
        {hasActiveFilters && (
          <button onClick={resetFilters}>Clear All Filters</button>
        )}
      </div>
      
      <ProductList filters={filters} />
      <Pagination totalCount={totalCount} />
    </div>
  );
}
```

```typescript
// src/hooks/useDebouncedQuery.ts
import { useCallback, useRef } from 'react';

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}
```

## 最佳实践

### 1. URL 状态同步

```typescript
// ✅ 推荐：使用 shallow routing 避免服务器请求
const [page, setPage] = useQueryState(
  'page',
  parseAsInteger.withOptions({ shallow: true })
);

// ✅ 重要状态使用深度路由（触发服务器请求）
const [search, setSearch] = useQueryState(
  'search',
  parseAsString.withOptions({ shallow: false })
);
```

### 2. 性能优化

```typescript
// ✅ 防抖搜索
const debouncedSearch = useDebouncedCallback((value: string) => {
  setSearch(value);
}, 300);

// ✅ 批量更新
const updateAllFilters = useCallback((updates) => {
  setQuery(updates);
}, [setQuery]);

// ❌ 避免单独更新多个参数
setSearch(value);
setPage(1);
setSort('newest');
```

### 3. 类型安全

```typescript
// ✅ 使用 Zod 验证
const schema = z.object({
  min: z.number().min(0).optional(),
  max: z.number().max(10000).optional(),
});

export const priceParser = parseAsJson(
  (value) => schema.parse(value)
).withDefault({});
```

### 4. 分享链接

```typescript
// src/utils/sharing.ts
export function getShareableUrl(filters: ProductFilters): string {
  const params = new URLSearchParams();
  
  if (filters.search) params.set('search', filters.search);
  if (filters.categories.length) params.set('categories', filters.categories.join(','));
  if (filters.priceRange.min) params.set('min', filters.priceRange.min.toString());
  if (filters.priceRange.max) params.set('max', filters.priceRange.max.toString());
  if (filters.sortBy) params.set('sort', filters.sortBy);
  
  const queryString = params.toString();
  return queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
}

// 使用
const shareUrl = getShareableUrl(filters);
navigator.clipboard.writeText(shareUrl);
```

## 配置

### Next.js 配置

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // 启用优化
  },
};

module.exports = nextConfig;
```

### TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    },
    "strict": true
  }
}
```

## 常用命令

```bash
# 安装依赖
npm install nuqs zod

# 开发依赖
npm install -D @types/node

# 开发服务器
npm run dev

# 生产构建
npm run build

# 运行测试
npm run test

# E2E 测试
npm run test:e2e
```

## 测试

```typescript
// src/__tests__/filters.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import SearchFilter from '@/components/filters/SearchFilter';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

describe('SearchFilter', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
    (usePathname as jest.Mock).mockReturnValue('/products');
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
  });

  it('should update URL with search query', async () => {
    render(<SearchFilter />);
    
    const input = screen.getByPlaceholderText('Search products...');
    fireEvent.change(input, { target: { value: 'laptop' } });
    
    // 等待防抖
    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith(
        expect.stringContaining('search=laptop')
      );
    });
  });

  it('should clear search', () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams('search=laptop')
    );
    
    render(<SearchFilter />);
    
    const clearButton = screen.getByLabelText('Clear search');
    fireEvent.click(clearButton);
    
    expect(router.push).toHaveBeenCalledWith(
      expect.not.stringContaining('search')
    );
  });
});
```

## E2E 测试

```typescript
// e2e/filters.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Product Filters', () => {
  test('should persist filters in URL', async ({ page }) => {
    await page.goto('/products');
    
    // 设置过滤器
    await page.fill('input[placeholder*="Search"]', 'laptop');
    await page.check('text=Electronics');
    await page.selectOption('select#sort', 'price-asc');
    
    // 等待 URL 更新
    await expect(page).toHaveURL(/search=laptop/);
    await expect(page).toHaveURL(/categories=Electronics/);
    await expect(page).toHaveURL(/sort=price-asc/);
    
    // 刷新页面验证状态保持
    await page.reload();
    await expect(page).toHaveURL(/search=laptop/);
    await expect(page).toHaveURL(/categories=Electronics/);
  });

  test('should share URL with filters', async ({ page, context }) => {
    await page.goto('/products?search=laptop&categories=Electronics');
    
    // 验证过滤器已应用
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toHaveValue('laptop');
    
    const electronicsCheckbox = page.locator('text=Electronics');
    await expect(electronicsCheckbox).toBeChecked();
  });
});
```

## 参考资源

- [Nuqs 官方文档](https://nuqs.47ng.com/)
- [Nuqs GitHub](https://github.com/47ng/nuqs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [URL State 最佳实践](https://tkdodo.eu/blog/react-query-and-react-router#url-state)
