# TanStack Table 模板

## 技术栈

### 核心技术
- **TanStack Table (React Table v8)**: 无头表格库，支持 React/Vue/Solid/Svelte
- **TypeScript**: 完整类型支持
- **@tanstack/react-virtual**: 虚拟滚动支持

### 框架集成
- **React 18+**: 主要支持
- **Next.js**: 服务端渲染支持
- **Remix**: 全栈框架集成
- **Vite**: 快速开发构建

### 配套工具
- **@tanstack/match-sorter-utils**: 排序和过滤工具
- **@tanstack/react-query**: 数据获取（可选）
- **Tailwind CSS / CSS Modules**: 样式方案

## 项目结构

```
tanstack-table-project/
├── src/
│   ├── components/
│   │   ├── tables/
│   │   │   ├── data-table.tsx          # 基础表格组件
│   │   │   ├── virtual-table.tsx       # 虚拟滚动表格
│   │   │   ├── editable-table.tsx      # 可编辑表格
│   │   │   └── server-table.tsx        # 服务端数据表格
│   │   ├── filters/
│   │   │   ├── global-filter.tsx       # 全局搜索
│   │   │   ├── column-filter.tsx       # 列过滤
│   │   │   └── faceted-filter.tsx      # 多选过滤器
│   │   ├── toolbar/
│   │   │   ├── table-toolbar.tsx
│   │   │   ├── column-visibility.tsx
│   │   │   └── export-button.tsx
│   │   └── pagination/
│   │       ├── pagination.tsx
│   │       └── page-size-selector.tsx
│   ├── hooks/
│   │   ├── use-data-table.ts           # 表格逻辑封装
│   │   ├── use-debounce.ts
│   │   └── use-local-storage.ts
│   ├── lib/
│   │   ├── table-utils.ts              # 表格工具函数
│   │   ├── column-helpers.ts           # 列定义辅助函数
│   │   └── export-utils.ts             # 导出功能
│   ├── types/
│   │   ├── table.types.ts
│   │   └── pagination.types.ts
│   └── data/
│       ├── mock-data.ts                # 测试数据
│       └── constants.ts
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 代码模式

### 1. 基础表格组件

```typescript
// components/tables/data-table.tsx
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table"
import { useState } from "react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [rowSelection, setRowSelection] = useState({})

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
    },
  })

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <input
          placeholder="Search..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </span>
        </div>
      </div>

      {/* 表格 */}
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-left">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="border-t"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            {"<<"}
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {"<"}
          </button>
          <span className="flex items-center gap-1">
            <div>Page</div>
            <strong>
              {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </strong>
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {">"}
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            {">>"}
          </button>
        </div>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
        >
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
```

### 2. 列定义模式

```typescript
// types/table.types.ts
export type User = {
  id: string
  name: string
  email: string
  status: "active" | "inactive" | "pending"
  role: "admin" | "user" | "guest"
  createdAt: Date
}

// lib/column-helpers.ts
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { User } from "@/types/table.types"

const columnHelper = createColumnHelper<User>()

// 排序列
export const sortableColumn = (
  accessorKey: keyof User,
  header: string
): ColumnDef<User> => ({
  accessorKey,
  header: ({ column }) => (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {header}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  ),
})

// 选择列
export const selectColumn: ColumnDef<User> = {
  id: "select",
  header: ({ table }) => (
    <Checkbox
      checked={table.getIsAllPageRowsSelected()}
      onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      aria-label="Select all"
    />
  ),
  cell: ({ row }) => (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
      aria-label="Select row"
    />
  ),
  enableSorting: false,
  enableHiding: false,
}

// 操作列
export const actionsColumn: ColumnDef<User> = {
  id: "actions",
  enableHiding: false,
  cell: ({ row }) => {
    const user = row.original

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
            Copy user ID
          </DropdownMenuItem>
          <DropdownMenuItem>Edit user</DropdownMenuItem>
          <DropdownMenuItem>Delete user</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  },
}

// 状态列（带徽章）
export const statusColumn: ColumnDef<User> = {
  accessorKey: "status",
  header: "Status",
  cell: ({ row }) => {
    const status = row.getValue("status") as string
    const variant = {
      active: "default",
      inactive: "secondary",
      pending: "outline",
    }[status]

    return <Badge variant={variant}>{status}</Badge>
  },
  filterFn: (row, id, value) => {
    return value.includes(row.getValue(id))
  },
}

// 日期列
export const dateColumn: ColumnDef<User> = {
  accessorKey: "createdAt",
  header: "Created At",
  cell: ({ row }) => {
    const date = row.getValue("createdAt") as Date
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  },
}

// 完整列定义
export const columns: ColumnDef<User>[] = [
  selectColumn,
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <div className="font-mono">{row.getValue("id")}</div>,
  },
  sortableColumn("name", "Name"),
  sortableColumn("email", "Email"),
  statusColumn,
  {
    accessorKey: "role",
    header: "Role",
  },
  dateColumn,
  actionsColumn,
]
```

### 3. 虚拟滚动表格

```typescript
// components/tables/virtual-table.tsx
import { useVirtualizer } from "@tanstack/react-virtual"
import { useRef } from "react"
import { useReactTable, getCoreRowModel } from "@tanstack/react-table"

interface VirtualTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  estimateSize?: number
}

export function VirtualTable<T>({
  data,
  columns,
  estimateSize = 50,
}: VirtualTableProps<T>) {
  const tableContainerRef = useRef<HTMLDivElement>(null)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const { rows } = table.getRowModel()

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => estimateSize,
    overscan: 10,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()

  return (
    <div
      ref={tableContainerRef}
      className="h-[600px] overflow-auto"
    >
      <div className="relative" style={{ height: `${totalSize}px` }}>
        <table className="w-full">
          <thead className="sticky top-0 bg-white z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-left border-b">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index]
              return (
                <tr
                  key={row.id}
                  style={{
                    position: "absolute",
                    transform: `translateY(${virtualRow.start}px)`,
                    width: "100%",
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

### 4. 可编辑表格

```typescript
// components/tables/editable-table.tsx
import { useState } from "react"
import { useReactTable, getCoreRowModel, createRow } from "@tanstack/react-table"

interface EditableTableProps<T> {
  initialData: T[]
  columns: ColumnDef<T>[]
  onUpdate: (data: T[]) => void
}

export function EditableTable<T extends { id: string }>({
  initialData,
  columns,
  onUpdate,
}: EditableTableProps<T>) {
  const [data, setData] = useState(initialData)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      updateData: (rowIndex: number, columnId: string, value: unknown) => {
        const newData = data.map((row, index) => {
          if (index === rowIndex) {
            return {
              ...row,
              [columnId]: value,
            }
          }
          return row
        })
        setData(newData)
        onUpdate(newData)
      },
      addRow: () => {
        const newRow = createRow(table, "new", {} as T, -1, 0)
        const newData = [...data, newRow.original]
        setData(newData)
        onUpdate(newData)
      },
      removeRow: (rowIndex: number) => {
        const newData = data.filter((_, index) => index !== rowIndex)
        setData(newData)
        onUpdate(newData)
      },
    },
  })

  return (
    <div className="space-y-4">
      <table className="w-full">
        {/* 表格内容 */}
      </table>
      <button onClick={() => table.options.meta?.addRow()}>
        Add Row
      </button>
    </div>
  )
}

// 可编辑单元格组件
export function EditableCell({
  getValue,
  row: { index },
  column: { id },
  table,
}: CellContext<any, unknown>) {
  const initialValue = getValue()
  const [value, setValue] = useState(initialValue)

  const onBlur = () => {
    table.options.meta?.updateData(index, id, value)
  }

  return (
    <input
      value={value as string}
      onChange={(e) => setValue(e.target.value)}
      onBlur={onBlur}
      className="w-full px-2 py-1"
    />
  )
}
```

### 5. 服务端数据表格

```typescript
// components/tables/server-table.tsx
import { useQuery } from "@tanstack/react-query"
import { useReactTable, getCoreRowModel } from "@tanstack/react-table"
import { useState, useEffect } from "react"

interface ServerTableProps<T> {
  columns: ColumnDef<T>[]
  fetchData: (params: FetchParams) => Promise<PaginatedResponse<T>>
}

interface FetchParams {
  pageIndex: number
  pageSize: number
  sortBy?: string
  filter?: string
}

interface PaginatedResponse<T> {
  data: T[]
  pageCount: number
  total: number
}

export function ServerTable<T>({
  columns,
  fetchData,
}: ServerTableProps<T>) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [sorting, setSorting] = useState([])
  const [globalFilter, setGlobalFilter] = useState("")

  const { data, isLoading, isError } = useQuery({
    queryKey: ["table-data", pagination, sorting, globalFilter],
    queryFn: () =>
      fetchData({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sortBy: sorting[0]?.id,
        filter: globalFilter,
      }),
  })

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    pageCount: data?.pageCount ?? -1,
    getCoreRowModel: getCoreRowModel(),
    state: {
      pagination,
      sorting,
      globalFilter,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  })

  if (isLoading) return <div>Loading...</div>
  if (isError) return <div>Error loading data</div>

  return (
    <div>
      {/* 表格渲染 */}
    </div>
  )
}
```

## 最佳实践

### 1. 列定义组织
```typescript
// ✅ 好的做法：分离列定义
// lib/columns/user-columns.ts
export const getUserColumns = (onEdit: (user: User) => void): ColumnDef<User>[] => [
  // 列定义
]

// ✅ 使用工厂函数处理动态列
export const createDynamicColumns = <T,>(
  keys: (keyof T)[]
): ColumnDef<T>[] => {
  return keys.map((key) => ({
    accessorKey: key,
    header: String(key).toUpperCase(),
  }))
}

// ❌ 避免：在组件内定义列（每次渲染都会重新创建）
```

### 2. 性能优化
```typescript
// ✅ 使用 memo 缓存列定义
const columns = useMemo(() => [
  // 列定义
], [])

// ✅ 使用 memo 缓存数据
const data = useMemo(() => fetchData(), [])

// ✅ 虚拟滚动处理大数据
<VirtualTable data={largeDataset} columns={columns} />

// ✅ 防抖过滤
const [filter, setFilter] = useState("")
const debouncedFilter = useDebounce(filter, 300)
```

### 3. 状态管理
```typescript
// ✅ 使用 URL 状态管理（支持书签和分享）
const [searchParams, setSearchParams] = useSearchParams()

const table = useReactTable({
  state: {
    pagination: {
      pageIndex: Number(searchParams.get("page")) || 0,
      pageSize: Number(searchParams.get("size")) || 10,
    },
  },
  onPaginationChange: (updater) => {
    const newState = typeof updater === "function" 
      ? updater(table.getState().pagination) 
      : updater
    setSearchParams({
      page: String(newState.pageIndex),
      size: String(newState.pageSize),
    })
  },
})

// ✅ 使用本地存储持久化
const [columnVisibility, setColumnVisibility] = useLocalStorage(
  "table-column-visibility",
  {}
)
```

### 4. 过滤和排序
```typescript
// ✅ 自定义过滤函数
const filterFns = {
  fuzzy: (row, columnId, value, addMeta) => {
    // 自定义模糊匹配逻辑
    return rankItem(row.getValue(columnId), value).passed
  },
}

// ✅ 排序函数
const sortingFns = {
  alphanumeric: (rowA, rowB, columnId) => {
    return rowA.getValue(columnId).localeCompare(rowB.getValue(columnId))
  },
}

// ✅ 组合过滤
table.getColumn("status")?.setFilterValue(["active", "pending"])
```

### 5. TypeScript 类型安全
```typescript
// ✅ 使用泛型保持类型安全
interface TableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData, any>[]
}

// ✅ 使用 createColumnHelper
const columnHelper = createColumnHelper<User>()

export const columns = [
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => info.getValue(), // 类型推断
  }),
] as const

// ✅ 严格类型检查
const table = useReactTable<User>({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
})
```

### 6. 无障碍性
```typescript
// ✅ 添加 ARIA 标签
<table
  role="grid"
  aria-label="User data table"
  aria-rowcount={table.getFilteredRowModel().rows.length}
>
  <thead role="rowgroup">
    {/* ... */}
  </thead>
  <tbody role="rowgroup">
    {table.getRowModel().rows.map((row) => (
      <tr
        key={row.id}
        role="row"
        aria-selected={row.getIsSelected()}
      >
        {/* ... */}
      </tr>
    ))}
  </tbody>
</table>

// ✅ 键盘导航
onKeyDown={(e) => {
  if (e.key === "ArrowDown") {
    // 移动到下一行
  }
  if (e.key === "ArrowUp") {
    // 移动到上一行
  }
}}
```

## 常用命令

### 安装
```bash
# React 版本
npm install @tanstack/react-table

# Vue 版本
npm install @tanstack/vue-table

# Solid 版本
npm install @tanstack/solid-table

# Svelte 版本
npm install @tanstack/svelte-table

# 虚拟滚动支持
npm install @tanstack/react-virtual

# 工具函数
npm install @tanstack/match-sorter-utils
```

### 开发
```bash
# 启动开发服务器
npm run dev

# 类型检查
npm run type-check

# 运行测试
npm run test

# 构建
npm run build
```

### 数据生成
```bash
# 使用 Faker.js 生成测试数据
npm install @faker-js/faker -D

# 生成脚本
node scripts/generate-mock-data.js
```

## 部署配置

### Next.js SSR 配置
```typescript
// app/users/page.tsx
import { dehydrate, QueryClient } from "@tanstack/react-query"

export default async function UsersPage() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DataTable />
    </HydrationBoundary>
  )
}
```

### API 端点
```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = Number(searchParams.get("page")) || 0
  const size = Number(searchParams.get("size")) || 10
  const sort = searchParams.get("sort")
  const filter = searchParams.get("filter")

  const { data, total } = await db.users.findMany({
    skip: page * size,
    take: size,
    where: filter ? { name: { contains: filter } } : undefined,
    orderBy: sort ? { [sort]: "asc" } : undefined,
  })

  return NextResponse.json({
    data,
    pageCount: Math.ceil(total / size),
    total,
  })
}
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### 性能优化配置
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "tanstack-table": ["@tanstack/react-table"],
          "tanstack-virtual": ["@tanstack/react-virtual"],
        },
      },
    },
  },
})
```

## 扩展资源

- [TanStack Table 官方文档](https://tanstack.com/table)
- [React Table v8 示例](https://github.com/TanStack/table/tree/main/examples)
- [虚拟滚动文档](https://tanstack.com/virtual/latest)
- [类型指南](https://tanstack.com/table/latest/docs/guide/typescript)
- [性能优化](https://tanstack.com/table/latest/docs/guide/performance)
- [GitHub 仓库](https://github.com/TanStack/table)
