# Recharts Data Visualization Template

## Tech Stack
- recharts v2.x
- React 18+
- TypeScript 5+

## Project Structure
```
src/
├── components/
│   ├── charts/
│   │   ├── LineChartWidget.tsx
│   │   ├── BarChartWidget.tsx
│   │   ├── PieChartWidget.tsx
│   │   └── AreaChartWidget.tsx
│   └── dashboard/
│       └── Dashboard.tsx
├── data/
│   └── sampleData.ts
└── App.tsx
```

## Core Patterns

### Line Chart
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LineChartWidgetProps {
  data: Array<{
    name: string;
    uv: number;
    pv: number;
  }>;
}

export const LineChartWidget: React.FC<LineChartWidgetProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="pv" stroke="#8884d8" />
        <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
      </LineChart>
    </ResponsiveContainer>
  );
};
```

### Bar Chart
```typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const BarChartWidget: React.FC = () => {
  const data = [
    { name: 'Page A', uv: 4000, pv: 2400 },
    { name: 'Page B', uv: 3000, pv: 1398 },
    { name: 'Page C', uv: 2000, pv: 9800 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="pv" fill="#8884d8" />
        <Bar dataKey="uv" fill="#82ca9d" />
      </BarChart>
    </ResponsiveContainer>
  );
};
```

### Pie Chart
```typescript
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const PieChartWidget: React.FC = () => {
  const data = [
    { name: 'Group A', value: 400 },
    { name: 'Group B', value: 300 },
    { name: 'Group C', value: 300 },
    { name: 'Group D', value: 200 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};
```

### Area Chart
```typescript
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const AreaChartWidget: React.FC = () => {
  const data = [
    { name: 'Jan', uv: 4000, pv: 2400 },
    { name: 'Feb', uv: 3000, pv: 1398 },
    { name: 'Mar', uv: 2000, pv: 9800 },
    { name: 'Apr', uv: 2780, pv: 3908 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="uv" stackId="1" stroke="#8884d8" fill="#8884d8" />
        <Area type="monotone" dataKey="pv" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
      </AreaChart>
    </ResponsiveContainer>
  );
};
```

## Best Practices

1. Use ResponsiveContainer for responsive charts
2. Memoize data transformations
3. Use custom tooltips for better UX
4. Implement loading states

## Common Commands

```bash
npm install recharts
npm run dev
```

## Related Resources
- [Recharts Documentation](https://recharts.org/)
- [Examples Gallery](https://recharts.org/en-US/examples)
