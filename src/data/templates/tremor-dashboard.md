# Tremor Dashboard Template

## Project Overview

Modern analytics dashboard built with Tremor - a low-level UI component library for building dashboards with React, featuring charts, KPIs, and data visualizations.

## Tech Stack

- **Framework**: React 18+
- **Library**: Tremor 3.x
- **Styling**: Tailwind CSS
- **Charts**: Recharts (via Tremor)
- **Language**: TypeScript
- **Build**: Vite / Next.js
- **Data**: REST API / GraphQL / Static Data

## Project Structure

```
dashboard/
├── src/
│   ├── components/
│   │   ├── charts/
│   │   │   ├── AreaChartCard.tsx
│   │   │   ├── BarChartCard.tsx
│   │   │   ├── LineChartCard.tsx
│   │   │   └── DonutChartCard.tsx
│   │   ├── kpis/
│   │   │   ├── KPICard.tsx
│   │   │   └── MetricGrid.tsx
│   │   ├── tables/
│   │   │   └── DataTable.tsx
│   │   └── layout/
│   │       ├── Sidebar.tsx
│   │       ├── Header.tsx
│   │       └── DashboardLayout.tsx
│   ├── pages/
│   │   ├── Overview.tsx
│   │   ├── Analytics.tsx
│   │   └── Reports.tsx
│   ├── hooks/
│   │   ├── useChartData.ts
│   │   └── useKPIs.ts
│   ├── services/
│   │   └── api.ts
│   ├── data/
│   │   └── mockData.ts
│   └── App.tsx
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Key Patterns

### 1. Basic Dashboard Layout

```typescript
// src/components/layout/DashboardLayout.tsx
import { Card, Title, Flex } from '@tremor/react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### 2. KPI Cards

```typescript
// src/components/kpis/KPICard.tsx
import { Card, Metric, Text, Flex, BadgeDelta, DeltaType } from '@tremor/react';

interface KPICardProps {
  title: string;
  metric: string | number;
  delta?: string;
  deltaType?: DeltaType;
  subtitle?: string;
}

export function KPICard({ title, metric, delta, deltaType, subtitle }: KPICardProps) {
  return (
    <Card className="max-w-xs mx-auto">
      <Flex alignItems="start">
        <div>
          <Text>{title}</Text>
          <Metric>{metric}</Metric>
        </div>
        {delta && deltaType && (
          <BadgeDelta deltaType={deltaType}>
            {delta}
          </BadgeDelta>
        )}
      </Flex>
      {subtitle && (
        <Text className="mt-2 text-gray-500">{subtitle}</Text>
      )}
    </Card>
  );
}

// Usage
<KPICard
  title="Total Revenue"
  metric="$45,231"
  delta="12.5%"
  deltaType="increase"
  subtitle="Compared to last month"
/>
```

### 3. Chart Components

```typescript
// src/components/charts/AreaChartCard.tsx
import { Card, Title, AreaChart } from '@tremor/react';

const chartData = [
  { date: 'Jan 23', Sales: 2890, Profit: 2400 },
  { date: 'Feb 23', Sales: 1890, Profit: 1398 },
  { date: 'Mar 23', Sales: 3890, Profit: 2980 },
  // ...
];

export function AreaChartCard() {
  return (
    <Card className="mt-6">
      <Title>Performance</Title>
      <AreaChart
        className="h-72 mt-4"
        data={chartData}
        index="date"
        categories={['Sales', 'Profit']}
        colors={['indigo', 'cyan']}
        valueFormatter={(value) => `$${value.toLocaleString()}`}
      />
    </Card>
  );
}

// src/components/charts/BarChartCard.tsx
import { Card, Title, BarChart } from '@tremor/react';

const barData = [
  { name: 'Product A', Sales: 1200 },
  { name: 'Product B', Sales: 1900 },
  { name: 'Product C', Sales: 1600 },
  // ...
];

export function BarChartCard() {
  return (
    <Card>
      <Title>Top Products</Title>
      <BarChart
        className="mt-6 h-64"
        data={barData}
        index="name"
        categories={['Sales']}
        colors={['blue']}
        valueFormatter={(value) => `${value} units`}
      />
    </Card>
  );
}

// src/components/charts/DonutChartCard.tsx
import { Card, Title, DonutChart } from '@tremor/react';

const donutData = [
  { name: 'Direct', value: 40 },
  { name: 'Organic', value: 30 },
  { name: 'Referral', value: 20 },
  { name: 'Social', value: 10 },
];

export function DonutChartCard() {
  return (
    <Card>
      <Title>Traffic Sources</Title>
      <DonutChart
        className="mt-6"
        data={donutData}
        category="value"
        index="name"
        valueFormatter={(value) => `${value}%`}
        colors={['blue', 'indigo', 'violet', 'purple']}
      />
    </Card>
  );
}
```

### 4. Data Table

```typescript
// src/components/tables/DataTable.tsx
import { Card, Title, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@tremor/react';

interface DataTableProps {
  title: string;
  data: Array<Record<string, any>>;
  columns: Array<{ key: string; header: string; formatter?: (value: any) => string }>;
}

export function DataTable({ title, data, columns }: DataTableProps) {
  return (
    <Card>
      <Title>{title}</Title>
      <Table className="mt-6">
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableHeaderCell key={col.key}>{col.header}</TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow key={idx}>
              {columns.map((col) => (
                <TableCell key={col.key}>
                  {col.formatter ? col.formatter(row[col.key]) : row[col.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

// Usage
<DataTable
  title="Recent Orders"
  data={orders}
  columns={[
    { key: 'id', header: 'Order ID' },
    { key: 'customer', header: 'Customer' },
    { key: 'amount', header: 'Amount', formatter: (v) => `$${v}` },
    { key: 'status', header: 'Status' },
  ]}
/>
```

### 5. Real-time Metrics Grid

```typescript
// src/components/kpis/MetricGrid.tsx
import { Grid, Card, Metric, Text, Icon } from '@tremor/react';
import { 
  CurrencyDollarIcon, 
  UserGroupIcon, 
  ShoppingCartIcon,
  ChartBarIcon
} from '@heroicons/react/24/solid';

const metrics = [
  {
    title: 'Revenue',
    metric: '$45,231',
    icon: CurrencyDollarIcon,
    color: 'blue',
  },
  {
    title: 'Users',
    metric: '1,234',
    icon: UserGroupIcon,
    color: 'indigo',
  },
  {
    title: 'Orders',
    metric: '567',
    icon: ShoppingCartIcon,
    color: 'purple',
  },
  {
    title: 'Growth',
    metric: '+23%',
    icon: ChartBarIcon,
    color: 'green',
  },
];

export function MetricGrid() {
  return (
    <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
      {metrics.map((item) => (
        <Card key={item.title}>
          <div className="flex items-center justify-between">
            <div>
              <Text>{item.title}</Text>
              <Metric className="mt-2">{item.metric}</Metric>
            </div>
            <Icon icon={item.icon} color={item.color} size="lg" />
          </div>
        </Card>
      ))}
    </Grid>
  );
}
```

### 6. Dashboard Page

```typescript
// src/pages/Overview.tsx
import { Title, Subtitle } from '@tremor/react';
import { MetricGrid } from '../components/kpis/MetricGrid';
import { AreaChartCard } from '../components/charts/AreaChartCard';
import { BarChartCard } from '../components/charts/BarChartCard';
import { DonutChartCard } from '../components/charts/DonutChartCard';
import { DataTable } from '../components/tables/DataTable';
import { Grid, Col } from '@tremor/react';

export default function Overview() {
  return (
    <div>
      <Title>Dashboard</Title>
      <Subtitle>Monitor your key metrics and performance</Subtitle>
      
      <MetricGrid />
      
      <Grid numItemsMd={2} numItemsLg={3} className="gap-6 mt-6">
        <Col numColSpan={2}>
          <AreaChartCard />
        </Col>
        <Col>
          <DonutChartCard />
        </Col>
      </Grid>
      
      <Grid numItemsMd={2} className="gap-6 mt-6">
        <BarChartCard />
        <DataTable 
          title="Recent Transactions"
          data={recentTransactions}
          columns={columns}
        />
      </Grid>
    </div>
  );
}
```

### 7. Custom Theme Configuration

```typescript
// tailwind.config.js
const colors = require('tailwindcss/colors');

module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        tremor: {
          brand: {
            faint: colors.blue[50],
            muted: colors.blue[200],
            subtle: colors.blue[400],
            DEFAULT: colors.blue[500],
            emphasis: colors.blue[700],
            inverted: colors.white,
          },
        },
      },
    },
  },
  plugins: [],
};
```

### 8. Data Fetching Hook

```typescript
// src/hooks/useChartData.ts
import { useState, useEffect } from 'react';

export function useChartData<T>(endpoint: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(endpoint);
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [endpoint]);

  return { data, loading, error };
}

// Usage
const { data, loading, error } = useChartData<SalesData>('/api/sales');
```

## Best Practices

1. **Responsive Design**: Use Tremor's Grid component for responsive layouts
2. **Color Consistency**: Stick to a consistent color palette across charts
3. **Value Formatting**: Use `valueFormatter` for consistent number/date formatting
4. **Accessibility**: Add proper ARIA labels and ensure color contrast
5. **Performance**: Memoize expensive calculations and use React.memo for chart components

## Common Commands

```bash
# Install dependencies
npm install @tremor/react @heroicons/react tailwindcss

# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check
```

## Dependencies

```json
{
  "dependencies": {
    "@tremor/react": "^3.0.0",
    "@heroicons/react": "^2.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0"
  }
}
```

## Component Library

| Component | Purpose |
|-----------|---------|
| `Card` | Container for content |
| `Metric` | Large numerical value |
| `Text` | Text content |
| `Title` | Section heading |
| `Badge` | Status indicator |
| `BadgeDelta` | Delta/change indicator |
| `Button` | Action trigger |
| `Grid` | Responsive grid layout |
| `Flex` | Flex container |
| `Table` | Data table |
| `AreaChart` | Area chart |
| `BarChart` | Bar chart |
| `LineChart` | Line chart |
| `DonutChart` | Donut/pie chart |
| `SparkChart` | Mini inline chart |
| `ProgressBar` | Progress indicator |
| `Select` | Dropdown selector |
| `TabList` | Tab navigation |
| `DateRangePicker` | Date range selector |

## Deployment

### Vite

```bash
# Build
npm run build

# Output in dist/ folder
```

### Next.js

```typescript
// next.config.js
module.exports = {
  reactStrictMode: true,
  transpilePackages: ['@tremor/react'],
};
```

### Docker

```dockerfile
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Testing

```typescript
// src/components/kpis/KPICard.test.tsx
import { render, screen } from '@testing-library/react';
import { KPICard } from './KPICard';

test('renders KPI card with metric', () => {
  render(
    <KPICard
      title="Revenue"
      metric="$45,231"
      delta="12.5%"
      deltaType="increase"
    />
  );
  
  expect(screen.getByText('Revenue')).toBeInTheDocument();
  expect(screen.getByText('$45,231')).toBeInTheDocument();
  expect(screen.getByText('12.5%')).toBeInTheDocument();
});
```

## Resources

- [Tremor Documentation](https://www.tremor.so/docs)
- [Tremor GitHub](https://github.com/tremorlabs/tremor)
- [Recharts Documentation](https://recharts.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Heroicons](https://heroicons.com/)
