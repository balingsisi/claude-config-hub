# AG Grid 企业级数据表格模板

## 技术栈

- **AG Grid**: 企业级数据表格组件
- **React 18**: UI 框架
- **TypeScript**: 类型支持
- **Vite**: 构建工具
- **Tailwind CSS**: 样式方案
- **React Router**: 路由管理

## 项目结构

```
ag-grid-app/
├── src/
│   ├── components/
│   │   ├── grid/
│   │   │   ├── BasicGrid.tsx
│   │   │   ├── EditableGrid.tsx
│   │   │   ├── FilterGrid.tsx
│   │   │   ├── PivotGrid.tsx
│   │   │   ├── TreeGrid.tsx
│   │   │   └── MasterDetailGrid.tsx
│   │   ├── renderers/
│   │   │   ├── ActionRenderer.tsx
│   │   │   ├── StatusRenderer.tsx
│   │   │   ├── ImageRenderer.tsx
│   │   │   ├── ProgressBarRenderer.tsx
│   │   │   └── CustomCellRenderer.tsx
│   │   ├── editors/
│   │   │   ├── DatePickerEditor.tsx
│   │   │   ├── SelectEditor.tsx
│   │   │   └── AutocompleteEditor.tsx
│   │   ├── examples/
│   │   │   ├── EmployeeTable.tsx
│   │   │   ├── OrderTable.tsx
│   │   │   └── FinancialTable.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Layout.tsx
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useGridData.ts
│   │   ├── useGridFilter.ts
│   │   └── useGridExport.ts
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Basic.tsx
│   │   ├── Advanced.tsx
│   │   └── Enterprise.tsx
│   ├── utils/
│   │   ├── grid-helpers.ts
│   │   ├── formatters.ts
│   │   └── validators.ts
│   ├── types/
│   │   └── grid.ts
│   ├── styles/
│   │   └── globals.css
│   ├── App.tsx
│   └── main.tsx
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 代码模式

### 基础表格

```tsx
// src/components/grid/BasicGrid.tsx
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent } from 'ag-grid-community';
import { useState, useCallback } from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

interface RowData {
  id: number;
  name: string;
  email: string;
  department: string;
  salary: number;
  startDate: string;
}

export const BasicGrid = () => {
  const [rowData, setRowData] = useState<RowData[]>([
    { id: 1, name: '张三', email: 'zhang@example.com', department: '技术部', salary: 15000, startDate: '2020-01-15' },
    { id: 2, name: '李四', email: 'li@example.com', department: '市场部', salary: 12000, startDate: '2019-03-20' },
    { id: 3, name: '王五', email: 'wang@example.com', department: '销售部', salary: 13000, startDate: '2021-07-10' },
    { id: 4, name: '赵六', email: 'zhao@example.com', department: '技术部', salary: 16000, startDate: '2018-11-05' },
    { id: 5, name: '钱七', email: 'qian@example.com', department: '人事部', salary: 11000, startDate: '2022-02-28' }
  ]);

  const [columnDefs] = useState<ColDef<RowData>[]>([
    { field: 'id', headerName: 'ID', width: 80, sortable: true, filter: true },
    { field: 'name', headerName: '姓名', width: 120, sortable: true, filter: true },
    { field: 'email', headerName: '邮箱', width: 200 },
    { field: 'department', headerName: '部门', width: 120, sortable: true, filter: true },
    { 
      field: 'salary', 
      headerName: '薪资', 
      width: 120,
      valueFormatter: (params) => `¥${params.value.toLocaleString()}`
    },
    { field: 'startDate', headerName: '入职日期', width: 130 }
  ]);

  const defaultColDef = {
    resizable: true,
    sortable: true,
    filter: true
  };

  const onGridReady = useCallback((event: GridReadyEvent) => {
    // 可以在这里加载远程数据
    console.log('Grid ready', event);
  }, []);

  return (
    <div className="ag-theme-alpine" style={{ height: 500, width: '100%' }}>
      <AgGridReact<RowData>
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onGridReady={onGridReady}
        pagination={true}
        paginationPageSize={10}
        animateRows={true}
      />
    </div>
  );
};
```

### 可编辑表格

```tsx
// src/components/grid/EditableGrid.tsx
import { AgGridReact } from 'ag-grid-react';
import { ColDef, CellValueChangedEvent } from 'ag-grid-community';
import { useState } from 'react';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: string;
}

export const EditableGrid = () => {
  const [rowData, setRowData] = useState<Product[]>([
    { id: 1, name: '笔记本电脑', category: '电子产品', price: 5999, stock: 50, status: '在售' },
    { id: 2, name: '机械键盘', category: '配件', price: 399, stock: 200, status: '在售' },
    { id: 3, name: '显示器', category: '电子产品', price: 1999, stock: 80, status: '在售' },
    { id: 4, name: '鼠标', category: '配件', price: 99, stock: 500, status: '缺货' },
    { id: 5, name: '耳机', category: '配件', price: 299, stock: 0, status: '缺货' }
  ]);

  const [columnDefs] = useState<ColDef<Product>[]>([
    { field: 'id', headerName: 'ID', width: 80, editable: false },
    { 
      field: 'name', 
      headerName: '产品名称', 
      width: 150, 
      editable: true,
      cellStyle: { backgroundColor: '#e6f3ff' }
    },
    { 
      field: 'category', 
      headerName: '分类', 
      width: 120, 
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['电子产品', '配件', '软件', '服务']
      }
    },
    { 
      field: 'price', 
      headerName: '价格', 
      width: 120, 
      editable: true,
      valueFormatter: (params) => `¥${params.value}`,
      valueParser: (params) => Number(params.newValue)
    },
    { 
      field: 'stock', 
      headerName: '库存', 
      width: 100, 
      editable: true,
      valueParser: (params) => Number(params.newValue)
    },
    { 
      field: 'status', 
      headerName: '状态', 
      width: 100, 
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['在售', '缺货', '下架']
      },
      cellClass: (params) => {
        return params.value === '缺货' ? 'text-red-600 font-bold' : '';
      }
    }
  ]);

  const onCellValueChanged = (event: CellValueChangedEvent) => {
    console.log('Cell value changed:', event);
    // 可以在这里保存数据到服务器
  };

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">产品库存管理</h2>
        <p className="text-gray-600">双击单元格可编辑</p>
      </div>
      <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
        <AgGridReact<Product>
          rowData={rowData}
          columnDefs={columnDefs}
          onCellValueChanged={onCellValueChanged}
          editType="fullRow"
          stopEditingWhenCellsLoseFocus={true}
          pagination={true}
          paginationPageSize={5}
        />
      </div>
    </div>
  );
};
```

### 高级过滤表格

```tsx
// src/components/grid/FilterGrid.tsx
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { useState, useRef } from 'react';
import 'ag-grid-enterprise';

interface Order {
  orderId: string;
  customer: string;
  product: string;
  amount: number;
  date: Date;
  status: string;
  region: string;
}

const StatusRenderer = (params: ICellRendererParams) => {
  const statusColors: Record<string, string> = {
    '已完成': 'bg-green-100 text-green-800',
    '处理中': 'bg-blue-100 text-blue-800',
    '已取消': 'bg-red-100 text-red-800',
    '待支付': 'bg-yellow-100 text-yellow-800'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[params.value] || ''}`}>
      {params.value}
    </span>
  );
};

export const FilterGrid = () => {
  const gridRef = useRef<AgGridReact<Order>>(null);
  
  const [rowData] = useState<Order[]>([
    { orderId: 'ORD001', customer: '张三', product: '笔记本电脑', amount: 5999, date: new Date('2024-01-15'), status: '已完成', region: '华东' },
    { orderId: 'ORD002', customer: '李四', product: '机械键盘', amount: 399, date: new Date('2024-01-16'), status: '处理中', region: '华南' },
    { orderId: 'ORD003', customer: '王五', product: '显示器', amount: 1999, date: new Date('2024-01-17'), status: '待支付', region: '华北' },
    { orderId: 'ORD004', customer: '赵六', product: '鼠标', amount: 99, date: new Date('2024-01-18'), status: '已取消', region: '华东' },
    { orderId: 'ORD005', customer: '钱七', product: '耳机', amount: 299, date: new Date('2024-01-19'), status: '已完成', region: '华南' }
  ]);

  const [columnDefs] = useState<ColDef<Order>[]>([
    { 
      field: 'orderId', 
      headerName: '订单号', 
      width: 120,
      filter: 'agTextColumnFilter'
    },
    { 
      field: 'customer', 
      headerName: '客户', 
      width: 120,
      filter: 'agTextColumnFilter'
    },
    { 
      field: 'product', 
      headerName: '产品', 
      width: 150,
      filter: 'agTextColumnFilter'
    },
    { 
      field: 'amount', 
      headerName: '金额', 
      width: 120,
      filter: 'agNumberColumnFilter',
      valueFormatter: (params) => `¥${params.value.toLocaleString()}`
    },
    { 
      field: 'date', 
      headerName: '日期', 
      width: 130,
      filter: 'agDateColumnFilter',
      valueFormatter: (params) => params.value.toLocaleDateString()
    },
    { 
      field: 'status', 
      headerName: '状态', 
      width: 120,
      filter: 'agSetColumnFilter',
      filterParams: {
        values: ['已完成', '处理中', '待支付', '已取消']
      },
      cellRenderer: StatusRenderer
    },
    { 
      field: 'region', 
      headerName: '地区', 
      width: 100,
      filter: 'agSetColumnFilter',
      filterParams: {
        values: ['华东', '华南', '华北', '华中', '西南', '西北', '东北']
      }
    }
  ]);

  const onQuickFilterChanged = () => {
    const quickFilterValue = document.getElementById('quickFilter') as HTMLInputElement;
    gridRef.current?.api.setQuickFilter(quickFilterValue.value);
  };

  const onFilterChanged = () => {
    const filterModel = gridRef.current?.api.getFilterModel();
    console.log('Filter changed:', filterModel);
  };

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">订单管理</h2>
        <input
          type="text"
          id="quickFilter"
          placeholder="快速搜索..."
          onChange={onQuickFilterChanged}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="ag-theme-alpine" style={{ height: 500, width: '100%' }}>
        <AgGridReact<Order>
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          onFilterChanged={onFilterChanged}
          pagination={true}
          paginationPageSize={10}
          enableCharts={true}
          enableRangeSelection={true}
          sideBar={{
            toolPanels: [
              {
                id: 'filters',
                labelDefault: 'Filters',
                labelKey: 'filters',
                iconKey: 'filter',
                toolPanel: 'agFiltersToolPanel'
              }
            ]
          }}
        />
      </div>
    </div>
  );
};
```

### 主从表格（Master-Detail）

```tsx
// src/components/grid/MasterDetailGrid.tsx
import { AgGridReact } from 'ag-grid-react';
import { ColDef, DetailCellRendererParams } from 'ag-grid-community';
import { useState } from 'react';
import 'ag-grid-enterprise';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface Order {
  orderId: string;
  customer: string;
  totalAmount: number;
  date: string;
  items: OrderItem[];
}

export const MasterDetailGrid = () => {
  const [rowData] = useState<Order[]>([
    {
      orderId: 'ORD001',
      customer: '张三',
      totalAmount: 6398,
      date: '2024-01-15',
      items: [
        { productId: 'P001', productName: '笔记本电脑', quantity: 1, unitPrice: 5999 },
        { productId: 'P002', productName: '鼠标', quantity: 1, unitPrice: 99 },
        { productId: 'P003', productName: '鼠标垫', quantity: 2, unitPrice: 150 }
      ]
    },
    {
      orderId: 'ORD002',
      customer: '李四',
      totalAmount: 2398,
      date: '2024-01-16',
      items: [
        { productId: 'P004', productName: '机械键盘', quantity: 1, unitPrice: 399 },
        { productId: 'P005', productName: '显示器', quantity: 1, unitPrice: 1999 }
      ]
    },
    {
      orderId: 'ORD003',
      customer: '王五',
      totalAmount: 299,
      date: '2024-01-17',
      items: [
        { productId: 'P006', productName: '耳机', quantity: 1, unitPrice: 299 }
      ]
    }
  ]);

  const [columnDefs] = useState<ColDef<Order>[]>([
    { field: 'orderId', headerName: '订单号', width: 120 },
    { field: 'customer', headerName: '客户', width: 120 },
    { 
      field: 'totalAmount', 
      headerName: '总金额', 
      width: 120,
      valueFormatter: (params) => `¥${params.value.toLocaleString()}`
    },
    { field: 'date', headerName: '日期', width: 120 }
  ]);

  const detailCellRendererParams = {
    detailGridOptions: {
      columnDefs: [
        { field: 'productId', headerName: '产品ID', width: 100 },
        { field: 'productName', headerName: '产品名称', width: 150 },
        { field: 'quantity', headerName: '数量', width: 100 },
        { 
          field: 'unitPrice', 
          headerName: '单价', 
          width: 120,
          valueFormatter: (params: any) => `¥${params.value}`
        }
      ],
      defaultColDef: {
        sortable: true,
        filter: true
      }
    },
    getDetailRowData: (params: DetailCellRendererParams) => {
      params.successCallback(params.data.items);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold">订单明细（点击行展开）</h2>
      </div>
      <div className="ag-theme-alpine" style={{ height: 600, width: '100%' }}>
        <AgGridReact<Order>
          rowData={rowData}
          columnDefs={columnDefs}
          masterDetail={true}
          detailCellRendererParams={detailCellRendererParams}
          detailRowHeight={200}
        />
      </div>
    </div>
  );
};
```

### 树形表格

```tsx
// src/components/grid/TreeGrid.tsx
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { useState } from 'react';

interface Employee {
  name: string;
  position: string;
  department: string;
  salary: number;
  children?: Employee[];
}

export const TreeGrid = () => {
  const [rowData] = useState<Employee[]>([
    {
      name: 'CEO',
      position: '首席执行官',
      department: '管理层',
      salary: 50000,
      children: [
        {
          name: '技术总监',
          position: '技术负责人',
          department: '技术部',
          salary: 30000,
          children: [
            { name: '张三', position: '高级工程师', department: '技术部', salary: 15000 },
            { name: '李四', position: '工程师', department: '技术部', salary: 12000 }
          ]
        },
        {
          name: '市场总监',
          position: '市场负责人',
          department: '市场部',
          salary: 28000,
          children: [
            { name: '王五', position: '市场经理', department: '市场部', salary: 14000 },
            { name: '赵六', position: '市场专员', department: '市场部', salary: 10000 }
          ]
        }
      ]
    }
  ]);

  const [columnDefs] = useState<ColDef<Employee>[]>([
    { 
      field: 'name', 
      headerName: '姓名', 
      width: 200,
      cellRenderer: 'agGroupCellRenderer'
    },
    { field: 'position', headerName: '职位', width: 150 },
    { field: 'department', headerName: '部门', width: 120 },
    { 
      field: 'salary', 
      headerName: '薪资', 
      width: 120,
      valueFormatter: (params) => `¥${params.value.toLocaleString()}`
    }
  ]);

  const getDataPath = (data: Employee) => {
    return data.name.split('/');
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold">组织架构</h2>
      </div>
      <div className="ag-theme-alpine" style={{ height: 500, width: '100%' }}>
        <AgGridReact<Employee>
          rowData={rowData}
          columnDefs={columnDefs}
          treeData={true}
          getDataPath={getDataPath}
          groupDefaultExpanded={-1}
          animateRows={true}
        />
      </div>
    </div>
  );
};
```

### 数据透视表

```tsx
// src/components/grid/PivotGrid.tsx
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { useState } from 'react';
import 'ag-grid-enterprise';

interface SalesData {
  region: string;
  product: string;
  quarter: string;
  sales: number;
  profit: number;
}

export const PivotGrid = () => {
  const [rowData] = useState<SalesData[]>([
    { region: '华东', product: '笔记本电脑', quarter: 'Q1', sales: 50000, profit: 10000 },
    { region: '华东', product: '笔记本电脑', quarter: 'Q2', sales: 60000, profit: 12000 },
    { region: '华东', product: '手机', quarter: 'Q1', sales: 30000, profit: 6000 },
    { region: '华东', product: '手机', quarter: 'Q2', sales: 35000, profit: 7000 },
    { region: '华南', product: '笔记本电脑', quarter: 'Q1', sales: 45000, profit: 9000 },
    { region: '华南', product: '笔记本电脑', quarter: 'Q2', sales: 55000, profit: 11000 },
    { region: '华南', product: '手机', quarter: 'Q1', sales: 25000, profit: 5000 },
    { region: '华南', product: '手机', quarter: 'Q2', sales: 30000, profit: 6000 }
  ]);

  const [columnDefs] = useState<ColDef<SalesData>[]>([
    { 
      field: 'region', 
      rowGroup: true,
      headerName: '地区'
    },
    { 
      field: 'product', 
      rowGroup: true,
      headerName: '产品'
    },
    { 
      field: 'quarter', 
      pivot: true,
      headerName: '季度'
    },
    { 
      field: 'sales', 
      aggFunc: 'sum',
      headerName: '销售额',
      valueFormatter: (params) => `¥${params.value.toLocaleString()}`
    },
    { 
      field: 'profit', 
      aggFunc: 'sum',
      headerName: '利润',
      valueFormatter: (params) => `¥${params.value.toLocaleString()}`
    }
  ]);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold">销售数据透视表</h2>
      </div>
      <div className="ag-theme-alpine" style={{ height: 500, width: '100%' }}>
        <AgGridReact<SalesData>
          rowData={rowData}
          columnDefs={columnDefs}
          pivotMode={true}
          groupDefaultExpanded={-1}
          sideBar={{
            toolPanels: ['columns', 'filters']
          }}
        />
      </div>
    </div>
  );
};
```

## 自定义单元格渲染器

```tsx
// src/components/renderers/ProgressBarRenderer.tsx
import { ICellRendererParams } from 'ag-grid-community';

export const ProgressBarRenderer = (params: ICellRendererParams) => {
  const percentage = params.value;
  const color = percentage < 30 ? 'bg-red-500' : 
                percentage < 70 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="flex items-center gap-2 w-full h-full">
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm">{percentage}%</span>
    </div>
  );
};
```

```tsx
// src/components/renderers/ActionRenderer.tsx
import { ICellRendererParams } from 'ag-grid-community';

interface ActionRendererProps extends ICellRendererParams {
  onEdit?: (data: any) => void;
  onDelete?: (data: any) => void;
}

export const ActionRenderer = (props: ActionRendererProps) => {
  const { data, onEdit, onDelete } = props;

  return (
    <div className="flex gap-2">
      <button
        onClick={() => onEdit?.(data)}
        className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm"
      >
        编辑
      </button>
      <button
        onClick={() => onDelete?.(data)}
        className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
      >
        删除
      </button>
    </div>
  );
};
```

## 导出功能

```tsx
// src/hooks/useGridExport.ts
import { useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';

export const useGridExport = () => {
  const exportToCsv = useCallback((gridRef: React.RefObject<AgGridReact>, filename = 'data.csv') => {
    gridRef.current?.api.exportDataAsCsv({
      fileName: filename
    });
  }, []);

  const exportToExcel = useCallback((gridRef: React.RefObject<AgGridReact>, filename = 'data.xlsx') => {
    gridRef.current?.api.exportDataAsExcel({
      fileName: filename
    });
  }, []);

  return { exportToCsv, exportToExcel };
};
```

## 核心特性

### 1. 高性能
- 虚拟滚动支持大数据集
- 高效的渲染引擎
- 最小化 DOM 操作

### 2. 丰富的功能
- 排序、过滤、分组
- 数据透视
- 行选择、范围选择
- 内联编辑
- 主从表格

### 3. 高度可定制
- 自定义单元格渲染器
- 自定义编辑器
- 自定义过滤器
- 主题定制

### 4. 企业级特性
- Excel 导入导出
- 图表集成
- 剪贴板操作
- 范围选择

## 最佳实践

1. **虚拟滚动**: 对于大数据集，始终启用虚拟滚动
2. **列定义优化**: 合理设置列宽，避免过多列
3. **数据格式化**: 使用 valueFormatter 而不是在数据中预处理
4. **按需加载**: 使用懒加载减少初始加载时间

## 常见用例

- 企业管理系统
- 数据分析仪表板
- 财务报表
- 订单管理
- 库存管理
- CRM 系统
- 数据导入导出

## 性能优化

```tsx
// 启用虚拟滚动
<AgGridReact
  rowData={largeDataSet}
  rowModelType="infinite"
  cacheBlockSize={100}
  infiniteInitialRowCount={1000}
/>

// 禁用不必要的功能
<AgGridReact
  suppressDragLeaveHidesColumns={true}
  suppressMakeColumnVisibleAfterUnGroup={true}
  suppressRowClickSelection={true}
/>
```

## 依赖

```json
{
  "dependencies": {
    "ag-grid-community": "^31.0.0",
    "ag-grid-enterprise": "^31.0.0",
    "ag-grid-react": "^31.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.3.3",
    "vite": "^5.0.8"
  }
}
```
