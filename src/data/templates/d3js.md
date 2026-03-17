# D3.js 模板

## 技术栈

### 核心技术
- **D3.js**: 数据驱动文档的 JavaScript 库
- **TypeScript**: 类型安全
- **Vite**: 构建工具

### 常用模块
- **d3-selection**: DOM 选择与操作
- **d3-scale**: 比例尺
- **d3-axis**: 坐标轴
- **d3-shape**: 形状生成器
- **d3-transition**: 过渡动画
- **d3-zoom**: 缩放行为
- **d3-drag**: 拖拽行为
- **d3-force**: 力导向图
- **d3-geo**: 地理投影
- **d3-hierarchy**: 层次结构

### 可视化类型
- 柱状图 / 条形图
- 折线图 / 面积图
- 饼图 / 环形图
- 散点图 / 气泡图
- 力导向图
- 树状图
- 地图
- 仪表盘

## 项目结构

```
d3-visualization-project/
├── src/
│   ├── components/
│   │   ├── charts/
│   │   │   ├── BarChart.vue
│   │   │   ├── LineChart.vue
│   │   │   ├── PieChart.vue
│   │   │   ├── ScatterPlot.vue
│   │   │   ├── ForceGraph.vue
│   │   │   ├── TreeChart.vue
│   │   │   └── MapChart.vue
│   │   ├── widgets/
│   │   │   ├── Legend.vue
│   │   │   ├── Tooltip.vue
│   │   │   ├── Axis.vue
│   │   │   └── Grid.vue
│   │   └── dashboard/
│   │       ├── DashboardLayout.vue
│   │       ├── MetricCard.vue
│   │       └── FilterPanel.vue
│   ├── composables/
│   │   ├── useChart.ts
│   │   ├── useResponsive.ts
│   │   ├── useTooltip.ts
│   │   └── useAnimation.ts
│   ├── utils/
│   │   ├── scales.ts           # 比例尺工具
│   │   ├── formats.ts          # 格式化工具
│   │   ├── colors.ts           # 颜色方案
│   │   └── data.ts             # 数据处理
│   ├── types/
│   │   ├── chart.ts
│   │   └── data.ts
│   ├── data/
│   │   └── sample-data.ts
│   ├── App.vue
│   └── main.ts
├── public/
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 核心代码模式

### 1. 基础图表组件结构

```vue
<!-- src/components/charts/BarChart.vue -->
<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as d3 from 'd3'
import type { ScaleBand, ScaleLinear } from 'd3'

interface DataItem {
  label: string
  value: number
}

interface Props {
  data: DataItem[]
  width?: number
  height?: number
  margin?: { top: number; right: number; bottom: number; left: number }
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  width: 600,
  height: 400,
  margin: () => ({ top: 20, right: 30, bottom: 40, left: 50 }),
  color: '#4F46E5',
})

const chartRef = ref<SVGSVGElement>()
const tooltipRef = ref<HTMLDivElement>()

let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>
let xScale: ScaleBand<string>
let yScale: ScaleLinear<number, number>

const innerWidth = computed(() => props.width - props.margin.left - props.margin.right)
const innerHeight = computed(() => props.height - props.margin.top - props.margin.bottom)

const initChart = () => {
  if (!chartRef.value) return

  svg = d3.select(chartRef.value)
    .attr('width', props.width)
    .attr('height', props.height)
    .append('g')
    .attr('transform', `translate(${props.margin.left},${props.margin.top})`)

  updateChart()
}

const updateChart = () => {
  if (!svg) return

  // 清空现有内容
  svg.selectAll('*').remove()

  // 创建比例尺
  xScale = d3.scaleBand()
    .domain(props.data.map(d => d.label))
    .range([0, innerWidth.value])
    .padding(0.1)

  yScale = d3.scaleLinear()
    .domain([0, d3.max(props.data, d => d.value)!])
    .nice()
    .range([innerHeight.value, 0])

  // 添加坐标轴
  svg.append('g')
    .attr('transform', `translate(0,${innerHeight.value})`)
    .call(d3.axisBottom(xScale))

  svg.append('g')
    .call(d3.axisLeft(yScale))

  // 绘制柱子
  const bars = svg.selectAll('.bar')
    .data(props.data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => xScale(d.label)!)
    .attr('width', xScale.bandwidth())
    .attr('y', innerHeight.value)
    .attr('height', 0)
    .attr('fill', props.color)

  // 动画
  bars.transition()
    .duration(750)
    .attr('y', d => yScale(d.value))
    .attr('height', d => innerHeight.value - yScale(d.value))

  // 交互
  bars.on('mouseover', (event, d) => {
    d3.select(event.currentTarget)
      .transition()
      .duration(200)
      .attr('opacity', 0.8)
    
    showTooltip(event, d)
  })
  .on('mouseout', (event) => {
    d3.select(event.currentTarget)
      .transition()
      .duration(200)
      .attr('opacity', 1)
    
    hideTooltip()
  })
}

const showTooltip = (event: MouseEvent, data: DataItem) => {
  if (!tooltipRef.value) return
  
  d3.select(tooltipRef.value)
    .style('display', 'block')
    .style('left', `${event.pageX + 10}px`)
    .style('top', `${event.pageY - 10}px`)
    .html(`<strong>${data.label}</strong>: ${data.value}`)
}

const hideTooltip = () => {
  if (!tooltipRef.value) return
  d3.select(tooltipRef.value).style('display', 'none')
}

onMounted(() => {
  initChart()
})

watch(() => props.data, updateChart, { deep: true })

onUnmounted(() => {
  if (svg) svg.remove()
})
</script>

<template>
  <div class="chart-container">
    <svg ref="chartRef"></svg>
    <div ref="tooltipRef" class="tooltip"></div>
  </div>
</template>

<style scoped>
.chart-container {
  position: relative;
}

.tooltip {
  position: absolute;
  display: none;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  pointer-events: none;
  font-size: 14px;
}
</style>
```

### 2. 响应式图表

```typescript
// src/composables/useResponsive.ts
import { ref, onMounted, onUnmounted } from 'vue'
import { useResizeObserver } from '@vueuse/core'

export function useResponsiveChart(containerRef: Ref<HTMLElement | undefined>) {
  const width = ref(0)
  const height = ref(0)
  
  useResizeObserver(containerRef, (entries) => {
    const entry = entries[0]
    width.value = entry.contentRect.width
    height.value = entry.contentRect.height
  })
  
  return { width, height }
}
```

```vue
<!-- 响应式图表使用 -->
<script setup lang="ts">
import { ref } from 'vue'
import { useResponsiveChart } from '@/composables/useResponsive'

const containerRef = ref<HTMLElement>()
const { width, height } = useResponsiveChart(containerRef)

watch([width, height], () => {
  updateChart()
})
</script>

<template>
  <div ref="containerRef" class="chart-wrapper">
    <BarChart :data="data" :width="width" :height="height" />
  </div>
</template>

<style scoped>
.chart-wrapper {
  width: 100%;
  height: 400px;
}
</style>
```

### 3. 折线图与面积图

```vue
<!-- src/components/charts/LineChart.vue -->
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as d3 from 'd3'

interface DataPoint {
  date: Date
  value: number
}

interface Props {
  data: DataPoint[]
  width?: number
  height?: number
  showArea?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: 800,
  height: 400,
  showArea: false,
})

const chartRef = ref<SVGSVGElement>()

const drawChart = () => {
  if (!chartRef.value) return

  const margin = { top: 20, right: 30, bottom: 30, left: 50 }
  const innerWidth = props.width - margin.left - margin.right
  const innerHeight = props.height - margin.top - margin.bottom

  const svg = d3.select(chartRef.value)
  svg.selectAll('*').remove()

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // 比例尺
  const xScale = d3.scaleTime()
    .domain(d3.extent(props.data, d => d.date) as [Date, Date])
    .range([0, innerWidth])

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(props.data, d => d.value)!])
    .nice()
    .range([innerHeight, 0])

  // 线生成器
  const line = d3.line<DataPoint>()
    .x(d => xScale(d.date))
    .y(d => yScale(d.value))
    .curve(d3.curveMonotoneX)

  // 面积生成器
  const area = d3.area<DataPoint>()
    .x(d => xScale(d.date))
    .y0(innerHeight)
    .y1(d => yScale(d.value))
    .curve(d3.curveMonotoneX)

  // 绘制面积
  if (props.showArea) {
    g.append('path')
      .datum(props.data)
      .attr('fill', 'rgba(79, 70, 229, 0.1)')
      .attr('d', area)
  }

  // 绘制线条
  g.append('path')
    .datum(props.data)
    .attr('fill', 'none')
    .attr('stroke', '#4F46E5')
    .attr('stroke-width', 2)
    .attr('d', line)

  // 坐标轴
  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(xScale).ticks(7))

  g.append('g')
    .call(d3.axisLeft(yScale))

  // 数据点
  g.selectAll('.dot')
    .data(props.data)
    .enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('cx', d => xScale(d.date))
    .attr('cy', d => yScale(d.value))
    .attr('r', 4)
    .attr('fill', '#4F46E5')
    .on('mouseover', function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('r', 6)
    })
    .on('mouseout', function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('r', 4)
    })
}

onMounted(drawChart)
watch(() => props.data, drawChart, { deep: true })
</script>

<template>
  <svg ref="chartRef" :width="width" :height="height"></svg>
</template>
```

### 4. 饼图与环形图

```vue
<!-- src/components/charts/PieChart.vue -->
<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import * as d3 from 'd3'

interface DataItem {
  label: string
  value: number
}

interface Props {
  data: DataItem[]
  width?: number
  height?: number
  innerRadius?: number
}

const props = withDefaults(defineProps<Props>(), {
  width: 400,
  height: 400,
  innerRadius: 0,
})

const chartRef = ref<SVGSVGElement>()
const isDonut = computed(() => props.innerRadius > 0)

const colorScale = d3.scaleOrdinal()
  .range(d3.schemeCategory10)

const drawChart = () => {
  if (!chartRef.value) return

  const radius = Math.min(props.width, props.height) / 2
  
  const svg = d3.select(chartRef.value)
  svg.selectAll('*').remove()

  const g = svg.append('g')
    .attr('transform', `translate(${props.width / 2},${props.height / 2})`)

  // 饼图生成器
  const pie = d3.pie<DataItem>()
    .value(d => d.value)
    .sort(null)

  // 弧生成器
  const arc = d3.arc<d3.PieArcDatum<DataItem>>()
    .innerRadius(props.innerRadius)
    .outerRadius(radius - 10)

  // 标签弧
  const labelArc = d3.arc<d3.PieArcDatum<DataItem>>()
    .innerRadius(radius - 40)
    .outerRadius(radius - 40)

  // 绘制扇形
  const arcs = g.selectAll('.arc')
    .data(pie(props.data))
    .enter()
    .append('g')
    .attr('class', 'arc')

  arcs.append('path')
    .attr('d', arc)
    .attr('fill', (_, i) => colorScale(i.toString()))
    .attr('stroke', 'white')
    .attr('stroke-width', 2)
    .style('opacity', 0)
    .transition()
    .duration(1000)
    .attrTween('d', function(d) {
      const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d)
      return (t) => arc(interpolate(t))!
    })
    .style('opacity', 1)

  // 标签
  arcs.append('text')
    .attr('transform', d => `translate(${labelArc.centroid(d)})`)
    .attr('dy', '0.35em')
    .attr('text-anchor', 'middle')
    .text(d => d.data.label)
    .style('opacity', 0)
    .transition()
    .delay(1000)
    .duration(500)
    .style('opacity', 1)

  // 中心文字（环形图）
  if (isDonut.value) {
    const total = d3.sum(props.data, d => d.value)
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.5em')
      .style('font-size', '2em')
      .style('font-weight', 'bold')
      .text(total)

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1em')
      .text('Total')
  }
}

onMounted(drawChart)
watch(() => props.data, drawChart, { deep: true })
</script>

<template>
  <svg ref="chartRef" :width="width" :height="height"></svg>
</template>
```

### 5. 力导向图

```vue
<!-- src/components/charts/ForceGraph.vue -->
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as d3 from 'd3'

interface Node {
  id: string
  group: number
}

interface Link {
  source: string
  target: string
  value: number
}

interface Props {
  nodes: Node[]
  links: Link[]
  width?: number
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  width: 800,
  height: 600,
})

const chartRef = ref<SVGSVGElement>()

const drawGraph = () => {
  if (!chartRef.value) return

  const svg = d3.select(chartRef.value)
  svg.selectAll('*').remove()

  // 创建力模拟
  const simulation = d3.forceSimulation<Node>(props.nodes)
    .force('link', d3.forceLink<Node, d3.SimulationLinkDatum<Node>>(props.links)
      .id(d => d.id)
      .distance(100))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(props.width / 2, props.height / 2))
    .force('collision', d3.forceCollide().radius(20))

  // 绘制连线
  const link = svg.append('g')
    .selectAll('line')
    .data(props.links)
    .enter()
    .append('line')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6)
    .attr('stroke-width', d => Math.sqrt(d.value))

  // 绘制节点
  const node = svg.append('g')
    .selectAll('circle')
    .data(props.nodes)
    .enter()
    .append('circle')
    .attr('r', 10)
    .attr('fill', d => d3.schemeCategory10[d.group])
    .call(d3.drag<SVGCircleElement, Node>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended))

  // 节点标签
  const label = svg.append('g')
    .selectAll('text')
    .data(props.nodes)
    .enter()
    .append('text')
    .text(d => d.id)
    .attr('font-size', 12)
    .attr('dx', 12)
    .attr('dy', 4)

  // 更新位置
  simulation.on('tick', () => {
    link
      .attr('x1', d => (d.source as any).x)
      .attr('y1', d => (d.source as any).y)
      .attr('x2', d => (d.target as any).x)
      .attr('y2', d => (d.target as any).y)

    node
      .attr('cx', d => d.x!)
      .attr('cy', d => d.y!)

    label
      .attr('x', d => d.x!)
      .attr('y', d => d.y!)
  })

  // 拖拽函数
  function dragstarted(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
    if (!event.active) simulation.alphaTarget(0.3).restart()
    event.subject.fx = event.subject.x
    event.subject.fy = event.subject.y
  }

  function dragged(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
    event.subject.fx = event.x
    event.subject.fy = event.y
  }

  function dragended(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
    if (!event.active) simulation.alphaTarget(0)
    event.subject.fx = null
    event.subject.fy = null
  }
}

onMounted(drawGraph)
watch(() => [props.nodes, props.links], drawGraph, { deep: true })
</script>

<template>
  <svg ref="chartRef" :width="width" :height="height"></svg>
</template>
```

### 6. 层次结构树状图

```vue
<!-- src/components/charts/TreeChart.vue -->
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as d3 from 'd3'

interface TreeNode {
  name: string
  children?: TreeNode[]
}

interface Props {
  data: TreeNode
  width?: number
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  width: 800,
  height: 600,
})

const chartRef = ref<SVGSVGElement>()

const drawTree = () => {
  if (!chartRef.value) return

  const margin = { top: 40, right: 90, bottom: 50, left: 90 }
  const innerWidth = props.width - margin.left - margin.right
  const innerHeight = props.height - margin.top - margin.bottom

  const svg = d3.select(chartRef.value)
  svg.selectAll('*').remove()

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // 创建层次结构
  const root = d3.hierarchy(props.data)
  const treeLayout = d3.tree<TreeNode>().size([innerHeight, innerWidth])

  treeLayout(root)

  // 绘制连线
  g.selectAll('.link')
    .data(root.links())
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('fill', 'none')
    .attr('stroke', '#ccc')
    .attr('stroke-width', 2)
    .attr('d', d3.linkHorizontal<any, any>()
      .x(d => d.y)
      .y(d => d.x))

  // 绘制节点
  const nodes = g.selectAll('.node')
    .data(root.descendants())
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', d => `translate(${d.y},${d.x})`)

  nodes.append('circle')
    .attr('r', 8)
    .attr('fill', d => d.children ? '#4F46E5' : '#10B981')
    .attr('stroke', 'white')
    .attr('stroke-width', 2)

  nodes.append('text')
    .attr('dy', 3)
    .attr('x', d => d.children ? -12 : 12)
    .attr('text-anchor', d => d.children ? 'end' : 'start')
    .text(d => d.data.name)
    .style('font-size', '12px')
}

onMounted(drawTree)
watch(() => props.data, drawTree, { deep: true })
</script>

<template>
  <svg ref="chartRef" :width="width" :height="height"></svg>
</template>
```

### 7. 通用比例尺工具

```typescript
// src/utils/scales.ts
import * as d3 from 'd3'

export function createLinearScale(
  domain: [number, number],
  range: [number, number],
  nice = true
) {
  const scale = d3.scaleLinear().domain(domain).range(range)
  return nice ? scale.nice() : scale
}

export function createBandScale(
  domain: string[],
  range: [number, number],
  padding = 0.1
) {
  return d3.scaleBand()
    .domain(domain)
    .range(range)
    .padding(padding)
}

export function createTimeScale(
  domain: [Date, Date],
  range: [number, number]
) {
  return d3.scaleTime().domain(domain).range(range)
}

export function createOrdinalScale(domain: string[], colors?: string[]) {
  return d3.scaleOrdinal()
    .domain(domain)
    .range(colors || d3.schemeCategory10)
}

export function createColorScale(
  domain: [number, number],
  interpolator = d3.interpolateViridis
) {
  return d3.scaleSequential()
    .domain(domain)
    .interpolator(interpolator)
}
```

### 8. 格式化工具

```typescript
// src/utils/formats.ts
import * as d3 from 'd3'

export const formatNumber = d3.format(',.0f')
export const formatPercent = d3.format('.1%')
export const formatCurrency = d3.format('$,.2f')
export const formatSI = d3.format('.2s')

export const formatTime = d3.timeFormat('%B %d, %Y')
export const formatMonth = d3.timeFormat('%B %Y')
export const formatYear = d3.timeFormat('%Y')

// 自定义格式化
export function formatShortNumber(num: number): string {
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K'
  return num.toString()
}
```

## 最佳实践

### 1. 性能优化

```typescript
// ✅ 使用 key 函数绑定数据
svg.selectAll('circle')
  .data(data, d => d.id) // 使用唯一键
  .enter()
  .append('circle')

// ❌ 避免频繁重绘
// 只在必要时更新
watch(() => props.data, updateChart, { deep: true })

// ✅ 使用过渡池
const transition = d3.transition()
  .duration(750)
  .ease(d3.easeCubic)
```

### 2. 响应式设计

```typescript
// ✅ 监听容器大小变化
import { useResizeObserver } from '@vueuse/core'

const containerRef = ref<HTMLElement>()

useResizeObserver(containerRef, () => {
  updateChart()
})
```

### 3. 可访问性

```vue
<!-- ✅ 添加无障碍属性 -->
<svg
  role="img"
  aria-label="柱状图显示销售数据"
  aria-describedby="chart-desc"
>
  <desc id="chart-desc">
    柱状图展示了2024年每月销售额
  </desc>
</svg>
```

### 4. 清理资源

```typescript
// ✅ 组件卸载时清理
onUnmounted(() => {
  if (simulation) simulation.stop()
  if (svg) svg.selectAll('*').remove()
})
```

## 常用命令

### 安装

```bash
# 安装完整 D3.js
pnpm add d3

# 按需安装模块
pnpm add d3-selection d3-scale d3-axis d3-shape

# TypeScript 类型
pnpm add -D @types/d3
```

### 开发

```bash
# 启动开发服务器
pnpm dev

# 构建
pnpm build

# 类型检查
pnpm type-check
```

## 部署配置

### 1. Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          d3: ['d3'],
        },
      },
    },
  },
})
```

### 2. Tree-shaking 优化

```typescript
// ✅ 按需导入模块
import { select, scaleLinear } from 'd3'

// 或导入子模块
import select from 'd3-selection'
import scaleLinear from 'd3-scale'

// ❌ 避免导入全部
import * as d3 from 'd3'
```

### 3. 环境变量

```bash
# .env
VITE_API_URL=https://api.example.com/data
```

## 相关资源

- [D3.js 官方文档](https://d3js.org/)
- [D3.js GitHub](https://github.com/d3/d3)
- [Observable D3 教程](https://observablehq.com/@d3/learn-d3)
- [D3.js in Action](https://www.manning.com/books/d3js-in-action-third-edition)
- [D3 Gallery](https://observablehq.com/@d3/gallery)
