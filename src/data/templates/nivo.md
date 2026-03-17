# Nivo 图表库模板

## 技术栈

### 核心技术
- **Nivo**: 基于 D3.js 的 React 图表库
- **@nivo/***: 各类型图表独立包
- **React**: 18+ 支持
- **D3.js**: 底层可视化库

### 开发工具
- **TypeScript**: 类型支持
- **Storybook**: 组件文档
- **Emotion**: CSS-in-JS 样式

## 项目结构

```
nivo-project/
├── src/
│   ├── components/
│   │   ├── charts/
│   │   │   ├── BarChart.tsx           # 柱状图
│   │   │   ├── LineChart.tsx          # 折线图
│   │   │   ├── PieChart.tsx           # 饼图
│   │   │   ├── AreaChart.tsx          # 面积图
│   │   │   ├── ScatterPlot.tsx        # 散点图
│   │   │   ├── RadarChart.tsx         # 雷达图
│   │   │   ├── HeatMap.tsx            # 热力图
│   │   │   ├── TreeMap.tsx            # 树图
│   │   │   ├── ChoroplethMap.tsx      # 地图
│   │   │   ├── SunburstChart.tsx      # 旭日图
│   │   │   ├── SankeyChart.tsx        # 桑基图
│   │   │   └── CalendarChart.tsx      # 日历图
│   │   ├── dashboard/
│   │   │   ├── SalesDashboard.tsx
│   │   │   ├── AnalyticsOverview.tsx
│   │   │   └── MetricCard.tsx
│   │   └── shared/
│   │       ├── ChartContainer.tsx
│   │       ├── ChartLegend.tsx
│   │       └── ChartTooltip.tsx
│   ├── lib/
│   │   ├── chart-theme.ts
│   │   ├── chart-utils.ts
│   │   └── data-transform.ts
│   ├── hooks/
│   │   └── useResponsiveChart.ts
│   └── app/
│       ├── layout.tsx
│       ├── page.tsx
│       └── dashboard/
│           └── page.tsx
├── package.json
└── tsconfig.json
```

## 代码模式

### 1. 柱状图 (components/charts/BarChart.tsx)

```typescript
'use client'

import { ResponsiveBar } from '@nivo/bar'
import { cn } from '@/lib/utils'
import { chartTheme } from '@/lib/chart-theme'

interface BarChartProps {
  data: Array<Record<string, any>>
  keys: string[]
  indexBy: string
  title?: string
  className?: string
  colors?: string[]
  groupMode?: 'grouped' | 'stacked'
  layout?: 'vertical' | 'horizontal'
  showLegend?: boolean
  enableLabels?: boolean
}

export function BarChart({
  data,
  keys,
  indexBy,
  title,
  className,
  colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
  groupMode = 'grouped',
  layout = 'vertical',
  showLegend = true,
  enableLabels = true,
}: BarChartProps) {
  return (
    <div className={cn('w-full h-96', className)}>
      {title && (
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
      )}
      <ResponsiveBar
        data={data}
        keys={keys}
        indexBy={indexBy}
        margin={{ top: 20, right: 130, bottom: 50, left: 60 }}
        padding={0.3}
        groupMode={groupMode}
        layout={layout}
        colors={colors}
        theme={chartTheme}
        borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: layout === 'vertical' ? 'Category' : 'Value',
          legendPosition: 'middle',
          legendOffset: 32,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: layout === 'vertical' ? 'Value' : 'Category',
          legendPosition: 'middle',
          legendOffset: -40,
        }}
        enableLabel={enableLabels}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
        legends={
          showLegend
            ? [
                {
                  dataFrom: 'keys',
                  anchor: 'bottom-right',
                  direction: 'column',
                  justify: false,
                  translateX: 120,
                  translateY: 0,
                  itemsSpacing: 2,
                  itemWidth: 100,
                  itemHeight: 20,
                  itemDirection: 'left-to-right',
                  itemOpacity: 0.85,
                  symbolSize: 20,
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemOpacity: 1,
                      },
                    },
                  ],
                },
              ]
            : []
        }
        animate={true}
        motionLevel="gentle"
        role="application"
        ariaLabel={title || 'Bar chart'}
        barAriaLabel={(e) => `${e.id}: ${e.formattedValue} in ${e.indexValue}`}
      />
    </div>
  )
}

// 使用示例
const monthlyData = [
  { month: 'Jan', sales: 120, profit: 40 },
  { month: 'Feb', sales: 150, profit: 55 },
  { month: 'Mar', sales: 180, profit: 70 },
  { month: 'Apr', sales: 200, profit: 80 },
  { month: 'May', sales: 170, profit: 65 },
]

<BarChart
  data={monthlyData}
  keys={['sales', 'profit']}
  indexBy="month"
  title="Monthly Sales & Profit"
  groupMode="grouped"
/>
```

### 2. 折线图 (components/charts/LineChart.tsx)

```typescript
'use client'

import { ResponsiveLine } from '@nivo/line'
import { chartTheme } from '@/lib/chart-theme'
import { cn } from '@/lib/utils'

interface LineChartProps {
  data: Array<{
    id: string
    data: Array<{ x: string | number; y: number }>
  }>
  title?: string
  className?: string
  colors?: string[]
  curve?: 'linear' | 'smooth' | 'step' | 'cardinal'
  enableArea?: boolean
  enablePoints?: boolean
  showLegend?: boolean
}

export function LineChart({
  data,
  title,
  className,
  colors = ['#3b82f6', '#10b981', '#f59e0b'],
  curve = 'smooth',
  enableArea = false,
  enablePoints = true,
  showLegend = true,
}: LineChartProps) {
  return (
    <div className={cn('w-full h-96', className)}>
      {title && (
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
      )}
      <ResponsiveLine
        data={data}
        margin={{ top: 20, right: 110, bottom: 50, left: 60 }}
        xScale={{ type: 'point' }}
        yScale={{
          type: 'linear',
          min: 'auto',
          max: 'auto',
          stacked: false,
          reverse: false,
        }}
        curve={curve}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Time',
          legendOffset: 36,
          legendPosition: 'middle',
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Value',
          legendOffset: -40,
          legendPosition: 'middle',
        }}
        enableGridX={false}
        enableGridY={true}
        colors={colors}
        lineWidth={2}
        enablePoints={enablePoints}
        pointSize={6}
        pointColor={{ theme: 'background' }}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        pointLabelYOffset={-12}
        enableArea={enableArea}
        areaOpacity={0.15}
        theme={chartTheme}
        useMesh={true}
        legends={
          showLegend
            ? [
                {
                  anchor: 'bottom-right',
                  direction: 'column',
                  justify: false,
                  translateX: 100,
                  translateY: 0,
                  itemsSpacing: 0,
                  itemDirection: 'left-to-right',
                  itemWidth: 80,
                  itemHeight: 20,
                  itemOpacity: 0.75,
                  symbolSize: 12,
                  symbolShape: 'circle',
                  symbolBorderColor: 'rgba(0, 0, 0, .5)',
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemBackground: 'rgba(0, 0, 0, .03)',
                        itemOpacity: 1,
                      },
                    },
                  ],
                },
              ]
            : []
        }
        animate={true}
        motionLevel="gentle"
      />
    </div>
  )
}
```

### 3. 饼图 (components/charts/PieChart.tsx)

```typescript
'use client'

import { ResponsivePie } from '@nivo/pie'
import { chartTheme } from '@/lib/chart-theme'
import { cn } from '@/lib/utils'

interface PieChartProps {
  data: Array<{
    id: string
    label: string
    value: number
    color?: string
  }>
  title?: string
  className?: string
  innerRadius?: number
  padAngle?: number
  cornerRadius?: number
  enableArcLabels?: boolean
  showLegend?: boolean
}

export function PieChart({
  data,
  title,
  className,
  innerRadius = 0,
  padAngle = 0.5,
  cornerRadius = 3,
  enableArcLabels = true,
  showLegend = true,
}: PieChartProps) {
  const colors = data.map((d) => d.color).filter(Boolean) as string[]
  const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  return (
    <div className={cn('w-full h-96', className)}>
      {title && (
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
      )}
      <ResponsivePie
        data={data}
        margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
        innerRadius={innerRadius}
        padAngle={padAngle}
        cornerRadius={cornerRadius}
        colors={colors.length > 0 ? colors : defaultColors}
        borderWidth={1}
        borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
        enableArcLabels={enableArcLabels}
        arcLinkLabelsSkipAngle={10}
        arcLinkLabelsTextColor="#333333"
        arcLinkLabelsThickness={2}
        arcLinkLabelsColor={{ from: 'color' }}
        arcLabelsSkipAngle={10}
        arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
        theme={chartTheme}
        legends={
          showLegend
            ? [
                {
                  anchor: 'bottom',
                  direction: 'row',
                  justify: false,
                  translateX: 0,
                  translateY: 56,
                  itemsSpacing: 0,
                  itemWidth: 100,
                  itemHeight: 18,
                  itemTextColor: '#999',
                  itemDirection: 'left-to-right',
                  itemOpacity: 1,
                  symbolSize: 18,
                  symbolShape: 'circle',
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemTextColor: '#000',
                      },
                    },
                  ],
                },
              ]
            : []
        }
        animate={true}
        motionLevel="gentle"
      />
    </div>
  )
}

// 使用示例 - 环形图
<PieChart
  data={[
    { id: 'react', label: 'React', value: 40, color: '#61dafb' },
    { id: 'vue', label: 'Vue', value: 30, color: '#42b883' },
    { id: 'angular', label: 'Angular', value: 20, color: '#dd0031' },
    { id: 'svelte', label: 'Svelte', value: 10, color: '#ff3e00' },
  ]}
  innerRadius={0.5}
  title="Framework Usage"
/>
```

### 4. 热力图 (components/charts/HeatMap.tsx)

```typescript
'use client'

import { ResponsiveHeatMap } from '@nivo/heatmap'
import { chartTheme } from '@/lib/chart-theme'
import { cn } from '@/lib/utils'

interface HeatMapProps {
  data: Array<{
    id: string
    data: Array<{ x: string; y: number }>
  }>
  title?: string
  className?: string
  colors?: {
    type: 'sequential' | 'diverging'
    scheme?: string
  }
}

export function HeatMap({
  data,
  title,
  className,
  colors = { type: 'sequential', scheme: 'blues' },
}: HeatMapProps) {
  return (
    <div className={cn('w-full h-96', className)}>
      {title && (
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
      )}
      <ResponsiveHeatMap
        data={data}
        margin={{ top: 60, right: 90, bottom: 60, left: 90 }}
        valueFormat=">-.2s"
        forceSquare={true}
        xOuterPadding={0.15}
        xInnerPadding={0.15}
        yOuterPadding={0.15}
        yInnerPadding={0.15}
        axisTop={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -90,
          legend: '',
          legendOffset: 40,
        }}
        axisRight={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: '',
          legendOffset: 50,
        }}
        axisBottom={null}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: '',
          legendOffset: -40,
        }}
        colors={colors}
        emptyColor="#aaaaaa"
        legends={[
          {
            anchor: 'bottom',
            translateX: 0,
            translateY: 30,
            length: 400,
            thickness: 8,
            direction: 'row',
            tickPosition: 'after',
            tickSize: 3,
            tickSpacing: 4,
            tickOverlap: false,
            titleAlign: 'start',
            titleOffset: 4,
          },
        ]}
        theme={chartTheme}
        animate={true}
        motionLevel="gentle"
      />
    </div>
  )
}
```

### 5. 雷达图 (components/charts/RadarChart.tsx)

```typescript
'use client'

import { ResponsiveRadar } from '@nivo/radar'
import { chartTheme } from '@/lib/chart-theme'
import { cn } from '@/lib/utils'

interface RadarChartProps {
  data: Array<{
    [key: string]: string | number
  }>
  keys: string[]
  indexBy: string
  title?: string
  className?: string
  colors?: string[]
  enableDots?: boolean
  fillOpacity?: number
}

export function RadarChart({
  data,
  keys,
  indexBy,
  title,
  className,
  colors = ['#3b82f6', '#10b981', '#f59e0b'],
  enableDots = true,
  fillOpacity = 0.25,
}: RadarChartProps) {
  return (
    <div className={cn('w-full h-96', className)}>
      {title && (
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
      )}
      <ResponsiveRadar
        data={data}
        keys={keys}
        indexBy={indexBy}
        maxValue="auto"
        margin={{ top: 70, right: 80, bottom: 40, left: 80 }}
        curve="linearClosed"
        borderWidth={2}
        borderColor={{ from: 'color' }}
        gridLevels={5}
        gridShape="circular"
        gridLabelOffset={36}
        enableDots={enableDots}
        dotSize={8}
        dotColor={{ from: 'color', modifiers: [] }}
        dotBorderWidth={0}
        dotBorderColor="#ffffff"
        enableDotLabel={true}
        dotLabel="value"
        dotLabelYOffset={-12}
        colors={colors}
        fillOpacity={fillOpacity}
        blendMode="multiply"
        animate={true}
        motionLevel="gentle"
        theme={chartTheme}
        legends={[
          {
            anchor: 'top-left',
            direction: 'column',
            translateX: -50,
            translateY: -40,
            itemWidth: 80,
            itemHeight: 20,
            itemTextColor: '#999',
            symbolSize: 12,
            symbolShape: 'circle',
            effects: [
              {
                on: 'hover',
                style: {
                  itemTextColor: '#000',
                },
              },
            ],
          },
        ]}
      />
    </div>
  )
}
```

### 6. 主题配置 (lib/chart-theme.ts)

```typescript
import type { Theme } from '@nivo/core'

export const chartTheme: Theme = {
  background: 'transparent',
  text: {
    fontSize: 12,
    fill: '#333333',
    outlineWidth: 0,
    outlineColor: 'transparent',
  },
  axis: {
    domain: {
      line: {
        stroke: '#e5e7eb',
        strokeWidth: 1,
      },
    },
    legend: {
      text: {
        fontSize: 12,
        fill: '#6b7280',
        outlineWidth: 0,
        outlineColor: 'transparent',
      },
    },
    ticks: {
      line: {
        stroke: '#e5e7eb',
        strokeWidth: 1,
      },
      text: {
        fontSize: 11,
        fill: '#6b7280',
        outlineWidth: 0,
        outlineColor: 'transparent',
      },
    },
  },
  grid: {
    line: {
      stroke: '#f3f4f6',
      strokeWidth: 1,
    },
  },
  legends: {
    title: {
      text: {
        fontSize: 11,
        fill: '#6b7280',
        outlineWidth: 0,
        outlineColor: 'transparent',
      },
    },
    text: {
      fontSize: 11,
      fill: '#6b7280',
      outlineWidth: 0,
      outlineColor: 'transparent',
    },
    ticks: {
      line: {},
      text: {
        fontSize: 10,
        fill: '#6b7280',
        outlineWidth: 0,
        outlineColor: 'transparent',
      },
    },
  },
  annotations: {
    text: {
      fontSize: 13,
      fill: '#333333',
      outlineWidth: 2,
      outlineColor: '#ffffff',
      outlineOpacity: 1,
    },
    link: {
      stroke: '#000000',
      strokeWidth: 1,
      outlineWidth: 2,
      outlineColor: '#ffffff',
      outlineOpacity: 1,
    },
    outline: {
      stroke: '#000000',
      strokeWidth: 2,
      outlineWidth: 2,
      outlineColor: '#ffffff',
      outlineOpacity: 1,
    },
    symbol: {
      fill: '#000000',
      outlineWidth: 2,
      outlineColor: '#ffffff',
      outlineOpacity: 1,
    },
  },
  tooltip: {
    container: {
      background: '#ffffff',
      color: '#333333',
      fontSize: 12,
      borderRadius: 4,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      padding: '8px 12px',
    },
  },
}

// 深色主题
export const darkChartTheme: Theme = {
  ...chartTheme,
  text: {
    ...chartTheme.text,
    fill: '#e5e7eb',
  },
  axis: {
    ...chartTheme.axis,
    domain: {
      line: {
        stroke: '#374151',
      },
    },
    legend: {
      text: {
        fill: '#9ca3af',
      },
    },
    ticks: {
      line: {
        stroke: '#374151',
      },
      text: {
        fill: '#9ca3af',
      },
    },
  },
  grid: {
    line: {
      stroke: '#1f2937',
    },
  },
  tooltip: {
    container: {
      background: '#1f2937',
      color: '#e5e7eb',
    },
  },
}
```

### 7. 数据转换工具 (lib/data-transform.ts)

```typescript
// 将 API 数据转换为图表格式
export function transformToBarData<T>(
  items: T[],
  valueKey: keyof T,
  indexKey: keyof T,
  groupKey?: keyof T
): Array<Record<string, any>> {
  if (!groupKey) {
    return items.map((item) => ({
      [String(indexKey)]: item[indexKey],
      [String(valueKey)]: item[valueKey],
    }))
  }

  const grouped: Record<string, Record<string, any>> = {}

  items.forEach((item) => {
    const index = String(item[indexKey])
    const group = String(item[groupKey])

    if (!grouped[index]) {
      grouped[index] = { [String(indexKey)]: index }
    }
    grouped[index][group] = item[valueKey]
  })

  return Object.values(grouped)
}

// 生成渐变色
export function generateGradientColors(
  count: number,
  startColor: string,
  endColor: string
): string[] {
  const colors: string[] = []
  const start = hexToRgb(startColor)
  const end = hexToRgb(endColor)

  if (!start || !end) return []

  for (let i = 0; i < count; i++) {
    const ratio = i / (count - 1)
    const r = Math.round(start.r + (end.r - start.r) * ratio)
    const g = Math.round(start.g + (end.g - start.g) * ratio)
    const b = Math.round(start.b + (end.b - start.b) * ratio)
    colors.push(`rgb(${r}, ${g}, ${b})`)
  }

  return colors
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}
```

## 最佳实践

### 1. 响应式设计
```typescript
// ✅ 使用 Responsive* 组件
import { ResponsiveBar, ResponsiveLine, ResponsivePie } from '@nivo/*'

// ✅ 容器自适应
<div className="w-full h-96">
  <ResponsiveBar data={data} {...props} />
</div>

// ❌ 避免固定尺寸
<Bar data={data} width={500} height={300} />
```

### 2. 性能优化
```typescript
// ✅ 大数据集使用 mesh
<ResponsiveLine
  data={largeData}
  useMesh={true}  // 只渲染一个点
  enableSlices="x"
/>

// ✅ 减少动画
<ResponsiveBar
  animate={true}
  motionLevel="gentle"  // 或 "none" 禁用
/>

// ✅ 按需加载
const BarChart = dynamic(() => import('./BarChart'), { ssr: false })
```

### 3. 交互增强
```typescript
// ✅ 自定义 tooltip
<ResponsiveBar
  tooltip={({ id, value, color }) => (
    <div className="bg-white shadow-lg rounded p-2">
      <strong>{id}</strong>: {value}
    </div>
  )}
/>

// ✅ 点击事件
<ResponsivePie
  onClick={(node) => {
    console.log('Clicked:', node)
    router.push(`/details/${node.id}`)
  }}
/>
```

### 4. 可访问性
```typescript
// ✅ 添加 ARIA 标签
<ResponsiveBar
  role="application"
  ariaLabel="Sales by month"
  barAriaLabel={(e) => `${e.id}: ${e.formattedValue} in ${e.indexValue}`}
/>

// ✅ 键盘导航支持
// Headless UI 组件已内置支持
```

## 常用命令

### 安装
```bash
# 按需安装图表包
npm install @nivo/bar @nivo/line @nivo/pie
npm install @nivo/area @nivo/scatterplot @nivo/radar
npm install @nivo/heatmap @nivo/treemap @nivo/choropleth
npm install @nivo/sunburst @nivo/sankey @nivo/calendar

# 核心包（通常自动安装）
npm install @nivo/core
```

### 开发命令
```bash
# 启动开发服务器
npm run dev

# 构建
npm run build
```

## 部署配置

### Next.js 配置
```javascript
// next.config.js
module.exports = {
  // Nivo 使用 canvas，需要配置
  experimental: {
    optimizePackageImports: ['@nivo/core'],
  },
}
```

### 环境变量
```bash
# .env.local
NEXT_PUBLIC_CHART_THEME=light
```

## 扩展资源

- [Nivo 官方文档](https://nivo.rocks)
- [Nivo GitHub](https://github.com/plouc/nivo)
- [图表示例库](https://nivo.rocks/storybook)
- [D3.js 文档](https://d3js.org)
- [Nivo Storybook](https://nivo.rocks/storybook)
