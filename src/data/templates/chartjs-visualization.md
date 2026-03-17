# Chart.js Data Visualization Template

## 技术栈

- **核心**: Chart.js ^4.x
- **框架集成**: react-chartjs-2 / vue-chartjs / svelte-chartjs
- **数据处理**: D3-scale (可选)
- **动画**: Chart.js 内置 / CSS transitions
- **响应式**: Container-based resize

## 项目结构

```
chartjs-project/
├── src/
│   ├── charts/
│   │   ├── LineChart.tsx
│   │   ├── BarChart.tsx
│   │   ├── PieChart.tsx
│   │   ├── RadarChart.tsx
│   │   └── index.ts
│   ├── config/
│   │   ├── defaults.ts      # 全局配置
│   │   ├── plugins.ts       # 自定义插件
│   │   └── themes.ts        # 主题配置
│   ├── utils/
│   │   ├── formatters.ts    # 数据格式化
│   │   ├── transformers.ts  # 数据转换
│   │   └── download.ts      # 图表导出
│   ├── hooks/
│   │   ├── useChart.ts
│   │   └── useChartData.ts
│   └── App.tsx
├── package.json
└── tsconfig.json
```

## 代码模式

### 基础图表配置

```typescript
// config/defaults.ts
import { ChartConfiguration } from 'chart.js';

export const defaultOptions: ChartConfiguration['options'] = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 750,
    easing: 'easeInOutQuart',
  },
  plugins: {
    legend: {
      position: 'top',
      labels: {
        usePointStyle: true,
        padding: 20,
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      titleFont: { size: 14 },
      bodyFont: { size: 13 },
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#666' },
    },
    y: {
      grid: { color: '#eee' },
      ticks: { color: '#666' },
    },
  },
};
```

### React 折线图组件

```typescript
// charts/LineChart.tsx
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { defaultOptions } from '../config/defaults';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface LineChartProps {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    fill?: boolean;
  }[];
  options?: ChartConfiguration['options'];
}

export function LineChart({ labels, datasets, options }: LineChartProps) {
  const data = {
    labels,
    datasets: datasets.map((ds) => ({
      ...ds,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2,
    })),
  };

  return (
    <Line
      data={data}
      options={{ ...defaultOptions, ...options }}
    />
  );
}

// 使用示例
function SalesChart() {
  const monthlyData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: '2024 Sales',
        data: [65, 78, 90, 81, 95, 110],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
      },
      {
        label: '2023 Sales',
        data: [45, 52, 68, 72, 80, 88],
        borderColor: '#94a3b8',
        backgroundColor: 'transparent',
      },
    ],
  };

  return (
    <div className="h-80">
      <LineChart {...monthlyData} />
    </div>
  );
}
```

### 柱状图（带渐变）

```typescript
// charts/BarChart.tsx
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, ... } from 'chart.js';

ChartJS.register(BarElement, ...);

export function GradientBarChart({ data, options }) {
  const chartRef = useRef<ChartJS>(null);

  const gradient = useMemo(() => {
    const chart = chartRef.current;
    if (!chart) return '#3b82f6';
    
    const ctx = chart.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, '#3b82f6');
    gradient.addColorStop(1, '#93c5fd');
    return gradient;
  }, []);

  const chartData = {
    ...data,
    datasets: data.datasets.map((ds) => ({
      ...ds,
      backgroundColor: gradient,
      borderRadius: 8,
      borderSkipped: false,
    })),
  };

  return (
    <Bar
      ref={chartRef}
      data={chartData}
      options={{
        ...defaultOptions,
        ...options,
        plugins: {
          ...defaultOptions.plugins,
          legend: { display: false },
        },
      }}
    />
  );
}
```

### 饼图/环形图

```typescript
// charts/DoughnutChart.tsx
import { Doughnut } from 'react-chartjs-2';
import { ArcElement } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface DoughnutChartProps {
  labels: string[];
  data: number[];
  colors?: string[];
  cutout?: string;
}

export function DoughnutChart({
  labels,
  data,
  colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
  cutout = '70%',
}: DoughnutChartProps) {
  const chartData = {
    labels,
    datasets: [{
      data,
      backgroundColor: colors,
      borderColor: '#fff',
      borderWidth: 3,
      hoverOffset: 10,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
    },
  };

  return <Doughnut data={chartData} options={options} />;
}

// 中心文字插件
const centerTextPlugin = {
  id: 'centerText',
  afterDraw(chart) {
    const { ctx, width, height } = chart;
    const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
    
    ctx.save();
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total.toLocaleString(), width / 2, height / 2);
    ctx.restore();
  },
};
```

### 实时数据更新

```typescript
// hooks/useRealtimeChart.ts
import { useEffect, useRef } from 'react';
import { Chart as ChartJS } from 'chart.js';

interface DataPoint {
  timestamp: number;
  value: number;
}

export function useRealtimeChart(
  chartRef: React.RefObject<ChartJS>,
  data: DataPoint[],
  maxPoints: number = 50
) {
  const dataRef = useRef<DataPoint[]>([]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    // 添加新数据点
    dataRef.current = [...dataRef.current, ...data].slice(-maxPoints);

    // 更新图表
    chart.data.labels = dataRef.current.map((d) =>
      new Date(d.timestamp).toLocaleTimeString()
    );
    chart.data.datasets[0].data = dataRef.current.map((d) => d.value);
    chart.update('none'); // 不使用动画提高性能
  }, [data, chartRef, maxPoints]);
}

// 使用示例
function RealtimeChart() {
  const chartRef = useRef<ChartJS>(null);
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    const ws = new WebSocket('wss://api.example.com/realtime');
    ws.onmessage = (event) => {
      const point = JSON.parse(event.data);
      setData((prev) => [...prev, point]);
    };
    return () => ws.close();
  }, []);

  useRealtimeChart(chartRef, data);

  return <LineChart ref={chartRef} data={...} />;
}
```

### 自定义工具提示

```typescript
// config/plugins.ts
import { Plugin } from 'chart.js';

export const customTooltip: Plugin = {
  id: 'customTooltip',
  beforeDraw: (chart) => {
    const tooltip = chart.tooltip;
    if (!tooltip?.getActiveElements().length) return;

    const { ctx } = chart;
    const active = tooltip.getActiveElements()[0];
    const data = chart.data;

    // 自定义绘制逻辑
    ctx.save();
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#333';
    ctx.fillText(
      `${data.labels[active.index]}: ${data.datasets[0].data[active.index]}`,
      active.element.x,
      active.element.y - 10
    );
    ctx.restore();
  },
};

// 外部 HTML 工具提示
export function createExternalTooltip(chart) {
  const tooltipEl = document.createElement('div');
  tooltipEl.className = 'chart-tooltip';
  
  return (context) => {
    const { chart, tooltip } = context;

    if (tooltip.opacity === 0) {
      tooltipEl.style.opacity = '0';
      return;
    }

    tooltipEl.innerHTML = `
      <div class="tooltip-header">${tooltip.title}</div>
      <div class="tooltip-body">
        ${tooltip.body.map((b) => `<div>${b.lines}</div>`).join('')}
      </div>
    `;

    const { offsetLeft, offsetTop } = chart.canvas;
    tooltipEl.style.left = `${offsetLeft + tooltip.caretX}px`;
    tooltipEl.style.top = `${offsetTop + tooltip.caretY}px`;
    tooltipEl.style.opacity = '1';
  };
}
```

## 最佳实践

### 1. 响应式设计

```typescript
// hooks/useChartResize.ts
import { useEffect } from 'react';
import { Chart as ChartJS } from 'chart.js';

export function useChartResize(chartRef: React.RefObject<ChartJS>) {
  useEffect(() => {
    const handleResize = () => {
      chartRef.current?.resize();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    const container = chartRef.current?.canvas.parentElement;

    if (container) {
      resizeObserver.observe(container);
    }

    return () => resizeObserver.disconnect();
  }, [chartRef]);
}

// CSS 容器
<div style={{ width: '100%', height: '400px', position: 'relative' }}>
  <LineChart ... />
</div>
```

### 2. 数据格式化

```typescript
// utils/formatters.ts
import { Tick } from 'chart.js';

export const formatters = {
  currency: (value: number, currency = 'USD') =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(value),

  percentage: (value: number) =>
    `${(value * 100).toFixed(1)}%`,

  compact: (value: number) =>
    new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
    }).format(value),

  date: (value: number | Date) =>
    new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(value),
};

// 使用
const options = {
  scales: {
    y: {
      ticks: {
        callback: (value) => formatters.compact(value),
      },
    },
    x: {
      ticks: {
        callback: (value, index) => formatters.date(dates[index]),
      },
    },
  },
  plugins: {
    tooltip: {
      callbacks: {
        label: (context) => formatters.currency(context.parsed.y),
      },
    },
  },
};
```

### 3. 图表导出

```typescript
// utils/download.ts
import { Chart as ChartJS } from 'chart.js';

export function downloadChart(
  chart: ChartJS,
  filename: string = 'chart.png'
) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = chart.toBase64Image('image/png', 1);
  link.click();
}

export function downloadCSV(
  labels: string[],
  datasets: { label: string; data: number[] }[],
  filename: string = 'chart.csv'
) {
  const headers = ['Label', ...datasets.map((d) => d.label)].join(',');
  const rows = labels.map((label, i) =>
    [label, ...datasets.map((d) => d.data[i])].join(',')
  );
  const csv = [headers, ...rows].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.download = filename;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}
```

### 4. 主题切换

```typescript
// config/themes.ts
export const themes = {
  light: {
    background: '#fff',
    text: '#333',
    grid: '#eee',
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
  },
  dark: {
    background: '#1e293b',
    text: '#e2e8f0',
    grid: '#334155',
    colors: ['#60a5fa', '#34d399', '#fbbf24', '#f87171'],
  },
};

export function applyTheme(chart: ChartJS, theme: 'light' | 'dark') {
  const t = themes[theme];

  chart.options.scales.x.grid.color = t.grid;
  chart.options.scales.y.grid.color = t.grid;
  chart.options.scales.x.ticks.color = t.text;
  chart.options.scales.y.ticks.color = t.text;

  chart.data.datasets.forEach((ds, i) => {
    ds.borderColor = t.colors[i % t.colors.length];
    ds.backgroundColor = t.colors[i % t.colors.length] + '33';
  });

  chart.update();
}
```

## 常用命令

```bash
# 安装
npm install chart.js react-chartjs-2
bun add chart.js vue-chartjs

# 类型定义
npm install -D @types/chart.js

# 开发
npm run dev

# 构建
npm run build

# 图表生成
npm install chartjs-node-canvas  # 服务端渲染
```

## 部署配置

### 服务端渲染（SSR）

```typescript
// server/chart.ts
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

const chartCanvas = new ChartJSNodeCanvas({
  width: 800,
  height: 600,
  backgroundColour: 'white',
});

export async function generateChart(data: ChartConfiguration) {
  const image = await chartCanvas.renderToBuffer(data);
  return image.toString('base64');
}

// API 路由
app.get('/api/chart', async (req, res) => {
  const imageData = await generateChart({
    type: 'bar',
    data: { /* ... */ },
    options: { /* ... */ },
  });
  
  res.set('Content-Type', 'image/png');
  res.send(Buffer.from(imageData, 'base64'));
});
```

### Next.js 优化

```typescript
// components/Chart.tsx
'use client';

import dynamic from 'next/dynamic';

const Line = dynamic(
  () => import('react-chartjs-2').then((mod) => mod.Line),
  { ssr: false }
);

export function Chart(props) {
  return (
    <div className="h-[400px]">
      <Line {...props} />
    </div>
  );
}
```
