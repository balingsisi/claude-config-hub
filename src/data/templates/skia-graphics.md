# React Native Skia - 2D 图形库

## 技术栈

- **核心**: @shopify/react-native-skia 1.x
- **运行时**: React Native 0.76+
- **渲染引擎**: Skia (Google)
- **类型支持**: TypeScript
- **平台**: iOS, Android, Web

## 项目结构

```
src/
├── components/
│   ├── charts/
│   │   ├── LineChart.tsx    # 折线图
│   │   ├── BarChart.tsx     # 柱状图
│   │   ├── PieChart.tsx     # 饼图
│   │   └── AreaChart.tsx    # 面积图
│   ├── shapes/
│   │   ├── Circle.tsx       # 圆形
│   │   ├── Rect.tsx         # 矩形
│   │   └── Path.tsx         # 路径
│   └── effects/
│       ├── Blur.tsx         # 模糊效果
│       ├── Gradient.tsx     # 渐变
│       └── Shadow.tsx       # 阴影
├── hooks/
│   ├── useFont.ts           # 字体钩子
│   ├── useCanvas.ts         # Canvas钩子
│   └── useAnimation.ts      # 动画钩子
├── utils/
│   ├── math.ts              # 数学工具
│   └── colors.ts            # 颜色工具
└── types/
    └── index.ts             # 类型定义
```

## 代码模式

### 1. 基础配置

```typescript
// App.tsx
import { Canvas, Circle, Group } from '@shopify/react-native-skia'

export default function App() {
  return (
    <Canvas style={{ flex: 1 }}>
      <Circle cx={128} cy={128} r={64} color="lightblue" />
    </Canvas>
  )
}
```

### 2. 基础形状

```typescript
// src/components/shapes/Circle.tsx
import { Canvas, Circle, Group, Paint, BlendMode } from '@shopify/react-native-skia'

interface CircleShapeProps {
  cx: number
  cy: number
  r: number
  color: string
  opacity?: number
}

export function CircleShape({ cx, cy, r, color, opacity = 1 }: CircleShapeProps) {
  return (
    <Canvas style={{ flex: 1 }}>
      <Group opacity={opacity}>
        <Circle cx={cx} cy={cy} r={r} color={color} />
      </Group>
    </Canvas>
  )
}

// 多个圆形
export function MultipleCircles() {
  const circles = [
    { cx: 50, cy: 50, r: 30, color: 'red' },
    { cx: 100, cy: 100, r: 40, color: 'green' },
    { cx: 150, cy: 50, r: 35, color: 'blue' },
  ]

  return (
    <Canvas style={{ flex: 1 }}>
      <Group>
        {circles.map((circle, index) => (
          <Circle key={index} {...circle} />
        ))}
      </Group>
    </Canvas>
  )
}
```

```typescript
// src/components/shapes/Rect.tsx
import { Canvas, Rect, RoundedRect, Group } from '@shopify/react-native-skia'

export function RectangleShapes() {
  return (
    <Canvas style={{ flex: 1 }}>
      <Group>
        {/* 普通矩形 */}
        <Rect x={20} y={20} width={100} height={60} color="lightblue" />

        {/* 圆角矩形 */}
        <RoundedRect
          x={20}
          y={100}
          width={100}
          height={60}
          r={10}
          color="lightgreen"
        />
      </Group>
    </Canvas>
  )
}
```

```typescript
// src/components/shapes/Path.tsx
import { Canvas, Path, Group, Skia } from '@shopify/react-native-skia'

export function PathShapes() {
  // 使用 Skia.Path() 创建路径
  const path = Skia.Path.Make()
  path.moveTo(20, 20)
  path.lineTo(100, 20)
  path.lineTo(60, 80)
  path.close()

  // 使用 SVG 路径字符串
  const svgPath = 'M 20 20 L 100 20 L 60 80 Z'

  return (
    <Canvas style={{ flex: 1 }}>
      <Group>
        {/* 使用 Path 对象 */}
        <Path path={path} color="lightblue" />

        {/* 使用 SVG 路径字符串 */}
        <Path path={svgPath} color="lightgreen" />
      </Group>
    </Canvas>
  )
}
```

### 3. 渐变和效果

```typescript
// src/components/effects/Gradient.tsx
import { Canvas, Rect, Group, LinearGradient, RadialGradient, vec } from '@shopify/react-native-skia'

export function GradientShapes() {
  return (
    <Canvas style={{ flex: 1 }}>
      <Group>
        {/* 线性渐变 */}
        <Rect x={20} y={20} width={200} height={100}>
          <LinearGradient
            start={vec(20, 20)}
            end={vec(220, 120)}
            colors={['red', 'blue']}
          />
        </Rect>

        {/* 径向渐变 */}
        <Rect x={20} y={140} width={200} height={100}>
          <RadialGradient
            c={vec(120, 190)}
            r={100}
            colors={['yellow', 'orange', 'red']}
          />
        </Rect>
      </Group>
    </Canvas>
  )
}
```

```typescript
// src/components/effects/Blur.tsx
import { Canvas, Circle, Group, BlurMask } from '@shopify/react-native-skia'

export function BlurEffect() {
  return (
    <Canvas style={{ flex: 1 }}>
      <Group>
        {/* 模糊效果 */}
        <Circle cx={100} cy={100} r={50} color="lightblue">
          <BlurMask blur={20} style="normal" />
        </Circle>

        {/* 内发光 */}
        <Circle cx={200} cy={100} r={50} color="lightgreen">
          <BlurMask blur={15} style="inner" />
        </Circle>
      </Group>
    </Canvas>
  )
}
```

```typescript
// src/components/effects/Shadow.tsx
import { Canvas, RoundedRect, Group, Shadow } from '@shopify/react-native-skia'

export function ShadowEffect() {
  return (
    <Canvas style={{ flex: 1 }}>
      <Group>
        {/* 阴影效果 */}
        <RoundedRect x={50} y={50} width={200} height={100} r={10} color="white">
          <Shadow dx={5} dy={5} blur={10} color="rgba(0, 0, 0, 0.3)" />
        </RoundedRect>
      </Group>
    </Canvas>
  )
}
```

### 4. 图表组件

```typescript
// src/components/charts/LineChart.tsx
import { Canvas, Path, Group, Line, Text, useFont, vec } from '@shopify/react-native-skia'
import { Dimensions } from 'react-native'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface DataPoint {
  x: number
  y: number
  label?: string
}

interface LineChartProps {
  data: DataPoint[]
  width?: number
  height?: number
  color?: string
  strokeWidth?: number
}

export function LineChart({
  data,
  width = SCREEN_WIDTH,
  height = 200,
  color = '#3b82f6',
  strokeWidth = 2,
}: LineChartProps) {
  const font = useFont(require('../../../assets/fonts/Inter-Regular.ttf'), 12)

  if (!font || data.length < 2) return null

  // 计算缩放
  const maxX = Math.max(...data.map(d => d.x))
  const maxY = Math.max(...data.map(d => d.y))
  const padding = 40

  const scaleX = (x: number) => padding + (x / maxX) * (width - 2 * padding)
  const scaleY = (y: number) => height - padding - (y / maxY) * (height - 2 * padding)

  // 创建路径
  const path = Skia.Path.Make()
  path.moveTo(scaleX(data[0].x), scaleY(data[0].y))
  data.slice(1).forEach((point) => {
    path.lineTo(scaleX(point.x), scaleY(point.y))
  })

  return (
    <Canvas style={{ width, height }}>
      <Group>
        {/* 网格线 */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <Line
            key={ratio}
            p1={vec(padding, scaleY(maxY * ratio))}
            p2={vec(width - padding, scaleY(maxY * ratio))}
            color="#e5e7eb"
            strokeWidth={1}
          />
        ))}

        {/* 数据线 */}
        <Path path={path} color={color} strokeWidth={strokeWidth} style="stroke" />

        {/* 数据点和标签 */}
        {data.map((point, index) => (
          <Group key={index}>
            <Circle
              cx={scaleX(point.x)}
              cy={scaleY(point.y)}
              r={4}
              color={color}
            />
            {point.label && (
              <Text
                font={font}
                text={point.label}
                x={scaleX(point.x) - 15}
                y={scaleY(point.y) + 20}
              />
            )}
          </Group>
        ))}
      </Group>
    </Canvas>
  )
}
```

```typescript
// src/components/charts/BarChart.tsx
import { Canvas, Rect, Group, Text, useFont } from '@shopify/react-native-skia'
import { Dimensions } from 'react-native'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface BarData {
  value: number
  label: string
  color?: string
}

interface BarChartProps {
  data: BarData[]
  width?: number
  height?: number
  barWidth?: number
  spacing?: number
}

export function BarChart({
  data,
  width = SCREEN_WIDTH,
  height = 200,
  barWidth = 40,
  spacing = 10,
}: BarChartProps) {
  const font = useFont(require('../../../assets/fonts/Inter-Regular.ttf'), 12)

  if (!font) return null

  const maxValue = Math.max(...data.map(d => d.value))
  const padding = 40
  const chartHeight = height - 2 * padding

  const scaleY = (value: number) => padding + chartHeight - (value / maxValue) * chartHeight

  return (
    <Canvas style={{ width, height }}>
      <Group>
        {data.map((item, index) => {
          const x = padding + index * (barWidth + spacing)
          const barHeight = (item.value / maxValue) * chartHeight
          const y = height - padding - barHeight

          return (
            <Group key={index}>
              {/* 柱子 */}
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                color={item.color || '#3b82f6'}
              />

              {/* 标签 */}
              <Text
                font={font}
                text={item.label}
                x={x}
                y={height - 10}
              />

              {/* 数值 */}
              <Text
                font={font}
                text={item.value.toString()}
                x={x}
                y={y - 10}
              />
            </Group>
          )
        })}
      </Group>
    </Canvas>
  )
}
```

```typescript
// src/components/charts/PieChart.tsx
import { Canvas, Group, Path, Text, useFont } from '@shopify/react-native-skia'
import { Skia } from '@shopify/react-native-skia'

interface PieData {
  value: number
  label: string
  color: string
}

interface PieChartProps {
  data: PieData[]
  size?: number
  centerX?: number
  centerY?: number
}

export function PieChart({
  data,
  size = 200,
  centerX = 100,
  centerY = 100,
}: PieChartProps) {
  const font = useFont(require('../../../assets/fonts/Inter-Regular.ttf'), 12)

  if (!font) return null

  const radius = size / 2 - 20
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let startAngle = 0

  const paths = data.map((item) => {
    const angle = (item.value / total) * 2 * Math.PI
    const path = Skia.Path.Make()

    path.moveTo(centerX, centerY)
    path.arcToOval(
      { x: centerX - radius, y: centerY - radius, width: radius * 2, height: radius * 2 },
      startAngle,
      angle,
      false
    )
    path.close()

    const labelAngle = startAngle + angle / 2
    const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7)
    const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7)

    startAngle += angle

    return { path, color: item.color, labelX, labelY, label: item.label }
  })

  return (
    <Canvas style={{ width: size, height: size }}>
      <Group>
        {paths.map((item, index) => (
          <Group key={index}>
            <Path path={item.path} color={item.color} />
            <Text
              font={font}
              text={item.label}
              x={item.labelX}
              y={item.labelY}
            />
          </Group>
        ))}
      </Group>
    </Canvas>
  )
}
```

### 5. 动画支持

```typescript
// src/hooks/useAnimation.ts
import { useSharedValue, useDerivedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { Skia, useFont } from '@shopify/react-native-skia'

export function useSkiaAnimation() {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      true
    )
  }, [])

  return progress
}

// 在组件中使用
function AnimatedCircle() {
  const progress = useSkiaAnimation()

  const radius = useDerivedValue(() => {
    return 30 + progress.value * 20
  })

  return (
    <Canvas style={{ flex: 1 }}>
      <Circle cx={100} cy={100} r={radius} color="lightblue" />
    </Canvas>
  )
}
```

### 6. 自定义绘图

```typescript
// 自定义绘图示例
import { Canvas, Group, Skia, Paint, BlendMode } from '@shopify/react-native-skia'

export function CustomDrawing() {
  const paint = Skia.Paint()
  paint.setAntiAlias(true)
  paint.setColor(Skia.Color('lightblue'))

  return (
    <Canvas style={{ flex: 1 }} onDraw={({ canvas }) => {
      // 自定义绘制逻辑
      canvas.drawCircle(100, 100, 50, paint)
    }}>
      {/* ... */}
    </Canvas>
  )
}
```

## 最佳实践

### 1. 性能优化

```typescript
// ✅ 使用 Group 减少重绘
<Canvas style={{ flex: 1 }}>
  <Group>
    <Circle cx={50} cy={50} r={30} color="red" />
    <Circle cx={100} cy={100} r={40} color="green" />
  </Group>
</Canvas>

// ✅ 避免在渲染中创建对象
const path = useMemo(() => {
  const p = Skia.Path.Make()
  p.moveTo(0, 0)
  p.lineTo(100, 100)
  return p
}, [])

// ✅ 使用 Reanimated 驱动动画
const progress = useSharedValue(0)
```

### 2. 内存管理

```typescript
// 重用 Paint 对象
const paint = useMemo(() => {
  const p = Skia.Paint()
  p.setAntiAlias(true)
  return p
}, [])

// 及时释放资源
useEffect(() => {
  return () => {
    // 清理资源
  }
}, [])
```

### 3. 响应式设计

```typescript
import { useWindowDimensions } from 'react-native'

function ResponsiveChart() {
  const { width } = useWindowDimensions()

  return (
    <Canvas style={{ width, height: 200 }}>
      {/* 根据 width 调整绘图 */}
    </Canvas>
  )
}
```

### 4. 错误处理

```typescript
// 字体加载失败处理
const font = useFont(require('./font.ttf'), 12)

if (!font) {
  return <View><Text>Loading...</Text></View>
}

// 路径创建失败处理
const path = Skia.Path.Make()
if (!path) {
  return null
}
```

### 5. 测试

```typescript
// __tests__/LineChart.test.tsx
import { render } from '@testing-library/react-native'
import { LineChart } from '../LineChart'

jest.mock('@shopify/react-native-skia', () => {
  const MockSkia = {
    Path: {
      Make: () => ({
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        close: jest.fn(),
      }),
    },
  }

  return {
    Canvas: 'Canvas',
    Path: 'Path',
    Skia: MockSkia,
  }
})

describe('LineChart', () => {
  it('renders correctly', () => {
    const data = [
      { x: 0, y: 0, label: 'A' },
      { x: 1, y: 10, label: 'B' },
    ]

    const { toJSON } = render(<LineChart data={data} />)
    expect(toJSON()).toBeTruthy()
  })
})
```

## 常用命令

```bash
# 安装
npm install @shopify/react-native-skia

# iOS
cd ios && pod install

# 运行
npx react-native run-ios
npx react-native run-android

# 清除缓存
rm -rf node_modules && npm install
```

## 部署配置

### 1. Android配置

```gradle
// android/app/build.gradle
android {
  ...
  packagingOptions {
    pickFirst '**/libc++_shared.so'
  }
}
```

### 2. iOS配置

```ruby
# ios/Podfile
target 'YourApp' do
  use_react_native!
  pod 'Skia', :path => '../node_modules/@shopify/react-native-skia'
end
```

### 3. Web支持

```typescript
// 支持 Web
import { Canvas } from '@shopify/react-native-skia'

// 确保安装了 canvas 依赖
// npm install canvas
```

## 关键特性

- 🎨 **高性能**: GPU 加速渲染
- 📊 **图表**: 丰富的图表组件
- 🎯 **声明式**: React 风格 API
- 🌈 **渐变**: 线性和径向渐变
- ✨ **效果**: 模糊、阴影、发光
- 📝 **文字**: 自定义字体支持
- 🚀 **动画**: Reanimated 集成
- 📱 **跨平台**: iOS, Android, Web
- 🎭 **混合模式**: 多种混合模式
- 🔧 **自定义**: 底层 Canvas API
