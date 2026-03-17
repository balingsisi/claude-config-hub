# Apache ECharts Template

## 技术栈

- **核心**: echarts ^5.x
- **框架集成**: echarts-for-react / vue-echarts / echarts-vue
- **数据处理**: ECharts 内置数据转换
- **主题**: 内置主题 + 自定义主题
- **服务端渲染**: echarts-node-canvas

## 项目结构

```
echarts-project/
├── src/
│   ├── charts/
│   │   ├── LineChart.tsx
│   │   ├── BarChart.tsx
│   │   ├── PieChart.tsx
│   │   ├── MapChart.tsx
│   │   ├── ScatterChart.tsx
│   │   ├── HeatmapChart.tsx
│   │   └── index.ts
│   ├── config/
│   │   ├── theme.ts          # 主题配置
│   │   ├── options.ts        # 基础配置
│   │   └── colors.ts         # 配色方案
│   ├── components/
│   │   ├── ChartContainer.tsx
│   │   ├── ChartLoader.tsx
│   │   └── ChartError.tsx
│   ├── hooks/
│   │   ├── useChart.ts
│   │   ├── useResize.ts
│   │   └── useTheme.ts
│   ├── utils/
│   │   ├── dataTransform.ts
│   │   ├── export.ts
│   │   └── format.ts
│   └── App.tsx
├── public/
│   └── map-data/             # 地图数据
├── package.json
└── tsconfig.json
```

## 代码模式

### 基础配置

```typescript
// config/theme.ts
import * as echarts from 'echarts';

export const customTheme = {
  color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
  backgroundColor: 'transparent',
  textStyle: {
    color: '#64748b',
    fontSize: 12,
  },
  title: {
    textStyle: {
      color: '#1e293b',
      fontSize: 16,
      fontWeight: 'bold',
    },
    subtextStyle: {
      color: '#94a3b8',
    },
  },
  line: {
    smooth: true,
    symbol: 'circle',
    symbolSize: 6,
  },
  bar: {
    barMaxWidth: 40,
    itemStyle: {
      borderRadius: [4, 4, 0, 0],
    },
  },
  pie: {
    radius: ['40%', '70%'],
    itemStyle: {
      borderRadius: 8,
      borderColor: '#fff',
      borderWidth: 2,
    },
  },
};

// 注册主题
echarts.registerTheme('custom', customTheme);

// config/options.ts
export const baseOption = {
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderColor: 'transparent',
    borderWidth: 0,
    textStyle: {
      color: '#fff',
      fontSize: 13,
    },
    padding: [10, 15],
    extraCssText: 'box-shadow: 0 2px 8px rgba(0,0,0,0.15);',
  },
  legend: {
    top: 10,
    textStyle: {
      color: '#64748b',
    },
    icon: 'roundRect',
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: 60,
    containLabel: true,
  },
};
```

### React 封装

```typescript
// hooks/useChart.ts
import { useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';

export function useChart(option: EChartsOption, theme = 'custom') {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // 初始化图表
    chartInstance.current = echarts.init(chartRef.current, theme);
    chartInstance.current.setOption(option);

    // 响应式调整
    const handleResize = () => {
      chartInstance.current?.resize();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
      chartInstance.current?.dispose();
    };
  }, []);

  // 更新配置
  useEffect(() => {
    chartInstance.current?.setOption(option, { notMerge: true });
  }, [option]);

  return { chartRef, chartInstance };
}

// 通用图表组件
interface ChartProps {
  option: EChartsOption;
  theme?: string;
  style?: React.CSSProperties;
  className?: string;
}

export function Chart({ option, theme, style, className }: ChartProps) {
  const { chartRef } = useChart(option, theme);

  return (
    <div
      ref={chartRef}
      style={{ width: '100%', height: '400px', ...style }}
      className={className}
    />
  );
}
```

### 折线图

```typescript
// charts/LineChart.tsx
import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';

interface LineChartProps {
  data: {
    dates: string[];
    series: {
      name: string;
      data: number[];
    }[];
  };
  showArea?: boolean;
  smooth?: boolean;
}

export function LineChart({ data, showArea = false, smooth = true }: LineChartProps) {
  const option = useMemo<EChartsOption>(() => ({
    ...baseOption,
    tooltip: {
      ...baseOption.tooltip,
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985',
        },
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.dates,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#64748b' },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#64748b' },
    },
    series: data.series.map((s) => ({
      name: s.name,
      type: 'line',
      data: s.data,
      smooth,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2 },
      areaStyle: showArea
        ? {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0)' },
            ]),
          }
        : undefined,
      emphasis: {
        focus: 'series',
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.3)',
        },
      },
    })),
  }), [data, showArea, smooth]);

  return <Chart option={option} />;
}

// 使用示例
function SalesChart() {
  const data = {
    dates: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    series: [
      { name: 'Email', data: [120, 132, 101, 134, 90, 230, 210] },
      { name: 'Union Ads', data: [220, 182, 191, 234, 290, 330, 310] },
    ],
  };
  return <LineChart data={data} showArea />;
}
```

### 柱状图

```typescript
// charts/BarChart.tsx
export function BarChart({ data, horizontal = false }: BarChartProps) {
  const option: EChartsOption = {
    ...baseOption,
    tooltip: {
      ...baseOption.tooltip,
      axisPointer: { type: 'shadow' },
    },
    [horizontal ? 'xAxis' : 'yAxis']: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
    },
    [horizontal ? 'yAxis' : 'xAxis']: {
      type: 'category',
      data: data.categories,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#64748b' },
    },
    series: data.series.map((s, index) => ({
      name: s.name,
      type: 'bar',
      data: s.data,
      barMaxWidth: 40,
      itemStyle: {
        borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
        color: new echarts.graphic.LinearGradient(
          horizontal ? 0 : 1,
          horizontal ? 1 : 0,
          0,
          0,
          [
            { offset: 0, color: colors[index % colors.length] },
            { offset: 1, color: colors[index % colors.length] + '66' },
          ]
        ),
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.2)',
        },
      },
    })),
  };

  return <Chart option={option} />;
}

// 堆叠柱状图
export function StackedBarChart({ data }: StackedBarChartProps) {
  const option: EChartsOption = {
    ...baseOption,
    tooltip: {
      ...baseOption.tooltip,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    xAxis: {
      type: 'category',
      data: data.categories,
    },
    yAxis: { type: 'value' },
    series: data.series.map((s) => ({
      name: s.name,
      type: 'bar',
      stack: 'total',
      data: s.data,
      emphasis: { focus: 'series' },
    })),
  };

  return <Chart option={option} />;
}
```

### 饼图

```typescript
// charts/PieChart.tsx
export function PieChart({ data, showLegend = true }: PieChartProps) {
  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: showLegend
      ? {
          orient: 'vertical',
          right: 10,
          top: 'center',
        }
      : undefined,
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        labelLine: { show: false },
        data: data.map((item) => ({
          value: item.value,
          name: item.name,
        })),
      },
    ],
  };

  return <Chart option={option} />;
}

// 玫瑰图
export function RoseChart({ data }: RoseChartProps) {
  const option: EChartsOption = {
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: ['20%', '70%'],
        roseType: 'area',
        itemStyle: { borderRadius: 5 },
        data: data.map((item, index) => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: colors[index % colors.length],
          },
        })),
      },
    ],
  };

  return <Chart option={option} />;
}
```

### 地图

```typescript
// charts/MapChart.tsx
import * as echarts from 'echarts';
import chinaMapData from '@/map-data/china.json';

// 注册地图
echarts.registerMap('china', chinaMapData);

export function MapChart({ data }: MapChartProps) {
  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `${params.name}<br/>数值: ${params.value || 0}`;
      },
    },
    visualMap: {
      min: 0,
      max: 1000,
      left: 'left',
      top: 'bottom',
      text: ['高', '低'],
      inRange: {
        color: ['#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'],
      },
      calculable: true,
    },
    series: [
      {
        name: '数据',
        type: 'map',
        map: 'china',
        roam: true,
        scaleLimit: { min: 1, max: 5 },
        label: {
          show: true,
          fontSize: 10,
        },
        emphasis: {
          label: { show: true },
          itemStyle: {
            areaColor: '#ffd700',
          },
        },
        data: data.map((item) => ({
          name: item.name,
          value: item.value,
        })),
      },
    ],
  };

  return <Chart option={option} />;
}
```

### 散点图

```typescript
// charts/ScatterChart.tsx
export function ScatterChart({ data }: ScatterChartProps) {
  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `${params.data[0]}: ${params.data[1]}`;
      },
    },
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed' } },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed' } },
    },
    series: data.map((series, index) => ({
      name: series.name,
      type: 'scatter',
      symbolSize: 10,
      data: series.points,
      emphasis: {
        focus: 'series',
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
    })),
  };

  return <Chart option={option} />;
}

// 气泡图
export function BubbleChart({ data }: BubbleChartProps) {
  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `(${params.data[0]}, ${params.data[1]})<br/>大小: ${params.data[2]}`;
      },
    },
    xAxis: { type: 'value' },
    yAxis: { type: 'value' },
    series: [{
      type: 'scatter',
      symbolSize: (val: number[]) => val[2] * 5,
      data: data.points,
      itemStyle: {
        color: new echarts.graphic.RadialGradient(0.5, 0.5, 0.5, [
          { offset: 0, color: 'rgba(59, 130, 246, 0.8)' },
          { offset: 1, color: 'rgba(59, 130, 246, 0.2)' },
        ]),
      },
    }],
  };

  return <Chart option={option} />;
}
```

### 热力图

```typescript
// charts/HeatmapChart.tsx
export function HeatmapChart({ data }: HeatmapChartProps) {
  const option: EChartsOption = {
    tooltip: {
      position: 'top',
      formatter: (params: any) => `${params.data[0]} - ${params.data[1]}: ${params.data[2]}`,
    },
    grid: {
      height: '50%',
      top: '10%',
    },
    xAxis: {
      type: 'category',
      data: data.hours,
      splitArea: { show: true },
    },
    yAxis: {
      type: 'category',
      data: data.days,
      splitArea: { show: true },
    },
    visualMap: {
      min: 0,
      max: 10,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '15%',
      inRange: {
        color: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#3182bd', '#08519c'],
      },
    },
    series: [
      {
        type: 'heatmap',
        data: data.values,
        label: { show: true },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };

  return <Chart option={option} />;
}
```

## 最佳实践

### 1. 数据转换

```typescript
// utils/dataTransform.ts
export function transformToChartData(rawData: any[]) {
  return {
    dates: rawData.map((d) => d.date),
    series: [
      {
        name: '销量',
        data: rawData.map((d) => d.sales),
      },
    ],
  };
}

// 聚合数据
export function aggregateData(data: any[], groupBy: string) {
  const grouped = data.reduce((acc, item) => {
    const key = item[groupBy];
    if (!acc[key]) acc[key] = 0;
    acc[key] += item.value;
    return acc;
  }, {});

  return Object.entries(grouped).map(([name, value]) => ({ name, value }));
}
```

### 2. 图表导出

```typescript
// utils/export.ts
import * as echarts from 'echarts';

export function exportAsImage(
  chart: echarts.ECharts,
  filename = 'chart.png'
) {
  const url = chart.getDataURL({
    type: 'png',
    pixelRatio: 2,
    backgroundColor: '#fff',
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
}

export function exportAsSVG(chart: echarts.ECharts) {
  const svg = chart.renderToSVGString();
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.download = 'chart.svg';
  link.href = url;
  link.click();
  
  URL.revokeObjectURL(url);
}
```

### 3. 响应式设计

```typescript
// hooks/useResize.ts
import { useDebounceFn } from 'ahooks';

export function useChartResize(chartRef: React.RefObject<echarts.ECharts>) {
  const { run: handleResize } = useDebounceFn(
    () => {
      chartRef.current?.resize();
    },
    { wait: 100 }
  );

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);
}
```

### 4. 主题切换

```typescript
// hooks/useTheme.ts
export function useChartTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setTheme(mediaQuery.matches ? 'dark' : 'light');

    const handler = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return theme;
}

// 深色主题配置
export const darkTheme = {
  ...customTheme,
  backgroundColor: '#1e293b',
  textStyle: { color: '#e2e8f0' },
  legend: { textStyle: { color: '#94a3b8' } },
};
```

## 常用命令

```bash
# 安装
npm install echarts echarts-for-react
bun add echarts vue-echarts

# 地图数据
npm install echarts/map-js china

# 类型定义
npm install -D @types/echarts

# 开发
npm run dev

# 构建
npm run build

# 服务端渲染
npm install echarts-node-canvas
```

## 部署配置

### 服务端渲染

```typescript
// server/chart.ts
import { createCanvas } from 'canvas';
import * as echarts from 'echarts';

export async function renderChart(option: EChartsOption) {
  const canvas = createCanvas(800, 600);
  const chart = echarts.init(canvas as any);

  chart.setOption(option);
  const buffer = chart.getDataURL({ type: 'png' });

  chart.dispose();
  return buffer;
}

// API 路由
app.post('/api/chart', async (req, res) => {
  const { option } = req.body;
  const image = await renderChart(option);

  res.set('Content-Type', 'image/png');
  res.send(image);
});
```

### Next.js 优化

```typescript
// components/EChart.tsx
'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

export function EChart({ option }: { option: EChartsOption }) {
  return <ReactECharts option={option} style={{ height: '400px' }} />;
}

// 性能优化 - 懒加载
export function LazyChart({ option }: { option: EChartsOption }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight: '400px' }}>
      {isVisible && <EChart option={option} />}
    </div>
  );
}
```

### Vue 3 集成

```typescript
// composables/useECharts.ts
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';

export function useECharts(option: Ref<EChartsOption>) {
  const chartRef = ref<HTMLDivElement>();
  const chart = ref<echarts.ECharts>();

  onMounted(() => {
    if (chartRef.value) {
      chart.value = echarts.init(chartRef.value);
      chart.value.setOption(option.value);
    }
  });

  watch(option, (newOption) => {
    chart.value?.setOption(newOption);
  }, { deep: true });

  onUnmounted(() => {
    chart.value?.dispose();
  });

  return { chartRef, chart };
}

// 使用
<template>
  <div ref="chartRef" style="width: 100%; height: 400px;"></div>
</template>

<script setup lang="ts">
const { chartRef } = useECharts(toRef(props, 'option'));
</script>
```
