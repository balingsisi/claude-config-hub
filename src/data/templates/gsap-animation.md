# GSAP 动画库模板

## 技术栈

### 核心技术
- **GSAP (GreenSock Animation Platform)**: 专业级 JavaScript 动画库
- **ScrollTrigger**: 滚动驱动动画插件
- **ScrollSmoother**: 平滑滚动效果
- **MotionPathPlugin**: 路径动画
- **Flip**: 布局过渡动画

### 框架集成
- **React / Next.js**: React 生态集成
- **Vue / Nuxt**: Vue 生态集成
- **Vanilla JS**: 原生 JavaScript

### 配套工具
- **Lenis**: 平滑滚动（可选）
- **Framer Motion 互补**: 复杂动画组合
- **Three.js**: 3D 动画结合

## 项目结构

```
gsap-animation-project/
├── src/
│   ├── animations/
│   │   ├── scroll/
│   │   │   ├── parallax.ts           # 视差滚动
│   │   │   ├── reveal-on-scroll.ts   # 滚动显示
│   │   │   ├── scroll-section.ts     # 滚动区块
│   │   │   └── horizontal-scroll.ts  # 横向滚动
│   │   ├── transitions/
│   │   │   ├── page-transition.ts    # 页面过渡
│   │   │   ├── card-flip.ts          # 卡片翻转
│   │   │   └── layout-shift.ts       # 布局切换
│   │   ├── interactions/
│   │   │   ├── hover-effects.ts      # 悬停效果
│   │   │   ├── drag-to-move.ts       # 拖拽移动
│   │   │   └── magnetic-button.ts    # 磁性按钮
│   │   ├── text/
│   │   │   ├── split-text.ts         # 文字分割动画
│   │   │   ├── text-reveal.ts        # 文字显示
│   │   │   └── typewriter.ts         # 打字机效果
│   │   └── timeline/
│   │       ├── hero-sequence.ts      # 英雄区序列
│   │       └── loading-sequence.ts   # 加载序列
│   ├── hooks/
│   │   ├── use-gsap.ts               # React 钩子
│   │   ├── use-scroll-trigger.ts
│   │   └── use-split-text.ts
│   ├── components/
│   │   ├── animated/
│   │   │   ├── animated-text.tsx
│   │   │   ├── animated-counter.tsx
│   │   │   └── animated-svg.tsx
│   │   └── scroll/
│   │       ├── scroll-progress.tsx
│   │       └── scroll-indicator.tsx
│   ├── utils/
│   │   ├── gsap-config.ts            # GSAP 配置
│   │   ├── easings.ts                # 自定义缓动
│   │   └── animation-helpers.ts
│   └── styles/
│       └── animations.css
├── gsap.config.js                    # GSAP 配置文件
├── package.json
└── tsconfig.json
```

## 代码模式

### 1. 基础动画

```typescript
// utils/gsap-config.ts
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { MotionPathPlugin } from "gsap/MotionPathPlugin"
import { TextPlugin } from "gsap/TextPlugin"

// 注册插件
gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, TextPlugin)

// 全局配置
gsap.defaults({
  ease: "power2.out",
  duration: 1,
})

// 自定义缓动
gsap.registerEffect({
  name: "fadeIn",
  effect: (targets, config) => {
    return gsap.from(targets, {
      opacity: 0,
      y: config.y || 30,
      duration: config.duration || 1,
      ease: config.ease || "power2.out",
    })
  },
  defaults: { y: 30, duration: 1 },
})

export { gsap, ScrollTrigger }
```

### 2. React 钩子

```typescript
// hooks/use-gsap.ts
import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export function useGSAP(
  callback: (context: gsap.Context, gsapInstance: typeof gsap) => void | (() => void),
  deps: any[] = []
) {
  const ref = useRef<gsap.Context>()

  useEffect(() => {
    ref.current = gsap.context(() => {
      const cleanup = callback(ref.current!, gsap)
      return cleanup
    })

    return () => {
      ref.current?.revert()
    }
  }, deps)

  return ref
}

// 使用示例
function MyComponent() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP((context, gsap) => {
    gsap.from(".box", {
      opacity: 0,
      y: 50,
      stagger: 0.1,
    })
  }, [])

  return (
    <div ref={containerRef}>
      <div className="box">Box 1</div>
      <div className="box">Box 2</div>
      <div className="box">Box 3</div>
    </div>
  )
}
```

### 3. ScrollTrigger 动画

```typescript
// animations/scroll/reveal-on-scroll.ts
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export function revealOnScroll(selector: string, options = {}) {
  const defaults = {
    y: 100,
    opacity: 0,
    duration: 1,
    stagger: 0.2,
    markers: false,
    start: "top 80%",
    end: "bottom 20%",
    toggleActions: "play none none reverse",
  }

  const config = { ...defaults, ...options }

  return gsap.from(selector, {
    y: config.y,
    opacity: config.opacity,
    duration: config.duration,
    stagger: config.stagger,
    scrollTrigger: {
      trigger: selector,
      start: config.start,
      end: config.end,
      toggleActions: config.toggleActions,
      markers: config.markers,
    },
  })
}

// 视差滚动
export function parallaxEffect(selector: string, speed = 0.5) {
  gsap.to(selector, {
    yPercent: -30 * speed,
    ease: "none",
    scrollTrigger: {
      trigger: selector,
      start: "top bottom",
      end: "bottom top",
      scrub: true,
    },
  })
}

// 固定元素
export function pinElement(selector: string, endTrigger: string) {
  ScrollTrigger.create({
    trigger: selector,
    pin: true,
    start: "top top",
    endTrigger: endTrigger,
    end: "bottom bottom",
    pinSpacing: false,
  })
}

// 横向滚动
export function horizontalScroll(container: string, sections: string) {
  const containerEl = document.querySelector(container)
  const sectionsEl = gsap.utils.toArray(sections)

  gsap.to(sectionsEl, {
    xPercent: -100 * (sectionsEl.length - 1),
    ease: "none",
    scrollTrigger: {
      trigger: container,
      pin: true,
      scrub: 1,
      snap: 1 / (sectionsEl.length - 1),
      end: () => "+=" + containerEl!.offsetWidth,
    },
  })
}
```

### 4. 时间线动画

```typescript
// animations/timeline/hero-sequence.ts
import gsap from "gsap"

export function heroAnimation(container: string) {
  const tl = gsap.timeline()

  tl.from(".hero-title", {
    opacity: 0,
    y: 100,
    duration: 1,
    ease: "power4.out",
  })
    .from(
      ".hero-subtitle",
      {
        opacity: 0,
        y: 50,
        duration: 0.8,
      },
      "-=0.5"
    )
    .from(
      ".hero-cta",
      {
        opacity: 0,
        scale: 0.8,
        duration: 0.6,
      },
      "-=0.3"
    )
    .from(
      ".hero-image",
      {
        opacity: 0,
        scale: 1.2,
        duration: 1.2,
        ease: "power3.out",
      },
      "-=0.8"
    )

  return tl
}

// 加载序列
export function loadingSequence() {
  const tl = gsap.timeline()

  tl.to(".loader-progress", {
    width: "100%",
    duration: 2,
    ease: "power2.inOut",
  })
    .to(".loader", {
      yPercent: -100,
      duration: 0.8,
      ease: "power4.inOut",
    })
    .from(
      ".content",
      {
        opacity: 0,
        y: 50,
        duration: 0.6,
      },
      "-=0.3"
    )

  return tl
}

// 交错动画
export function staggerAnimation(selector: string) {
  return gsap.from(selector, {
    opacity: 0,
    y: 40,
    duration: 0.8,
    stagger: {
      each: 0.15,
      from: "start",
      ease: "power2.out",
    },
  })
}
```

### 5. 文字动画

```typescript
// animations/text/split-text.ts
import gsap from "gsap"
import { SplitText } from "gsap/SplitText"

gsap.registerPlugin(SplitText)

export function splitTextAnimation(selector: string) {
  const element = document.querySelector(selector)
  if (!element) return

  const split = new SplitText(element, {
    type: "chars, words, lines",
    linesClass: "line",
    wordsClass: "word",
    charsClass: "char",
  })

  gsap.from(split.chars, {
    opacity: 0,
    y: 50,
    rotateX: -90,
    stagger: 0.02,
    duration: 0.8,
    ease: "back.out(1.7)",
  })

  return split
}

// 文字揭示
export function textReveal(selector: string) {
  const split = new SplitText(selector, {
    type: "lines",
    linesClass: "reveal-line",
  })

  split.lines.forEach((line) => {
    gsap.from(line, {
      yPercent: 100,
      duration: 1,
      ease: "power4.out",
      scrollTrigger: {
        trigger: line,
        start: "top 90%",
      },
    })
  })
}

// 打字机效果
export function typewriterEffect(selector: string, text: string) {
  const element = document.querySelector(selector)
  if (!element) return

  return gsap.to(element, {
    duration: text.length * 0.05,
    text: text,
    ease: "none",
  })
}
```

### 6. 交互动画

```typescript
// animations/interactions/hover-effects.ts
import gsap from "gsap"

export function hoverScale(selector: string) {
  const elements = document.querySelectorAll(selector)

  elements.forEach((el) => {
    el.addEventListener("mouseenter", () => {
      gsap.to(el, {
        scale: 1.05,
        duration: 0.3,
        ease: "power2.out",
      })
    })

    el.addEventListener("mouseleave", () => {
      gsap.to(el, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
      })
    })
  })
}

// 磁性按钮
export function magneticButton(selector: string) {
  const button = document.querySelector(selector)
  if (!button) return

  button.addEventListener("mousemove", (e: Event) => {
    const event = e as MouseEvent
    const rect = button.getBoundingClientRect()
    const x = event.clientX - rect.left - rect.width / 2
    const y = event.clientY - rect.top - rect.height / 2

    gsap.to(button, {
      x: x * 0.3,
      y: y * 0.3,
      duration: 0.3,
      ease: "power2.out",
    })
  })

  button.addEventListener("mouseleave", () => {
    gsap.to(button, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: "elastic.out(1, 0.3)",
    })
  })
}

// 拖拽移动
export function draggableElement(selector: string) {
  import("gsap/Draggable").then(({ Draggable }) => {
    gsap.registerPlugin(Draggable)

    Draggable.create(selector, {
      type: "x,y",
      bounds: "parent",
      inertia: true,
      onDrag: function () {
        // 拖拽回调
      },
    })
  })
}
```

### 7. 过渡动画

```typescript
// animations/transitions/page-transition.ts
import gsap from "gsap"

export function pageTransition() {
  const tl = gsap.timeline()

  tl.to(".transition-overlay", {
    yPercent: 100,
    duration: 0.5,
    ease: "power4.inOut",
  })
    .set(".transition-overlay", {
      yPercent: -100,
    })
    .to(".transition-overlay", {
      yPercent: 0,
      duration: 0.5,
      ease: "power4.inOut",
    })

  return tl
}

// Flip 动画
import { Flip } from "gsap/Flip"

gsap.registerPlugin(Flip)

export function flipAnimation(fromSelector: string, toSelector: string) {
  const fromEl = document.querySelector(fromSelector)
  const toEl = document.querySelector(toSelector)

  if (!fromEl || !toEl) return

  const state = Flip.getState(fromEl)

  // 改变布局
  fromEl.classList.toggle("moved")

  Flip.from(state, {
    duration: 1,
    ease: "power1.inOut",
    absolute: true,
  })
}

// 卡片翻转
export function cardFlip(cardSelector: string) {
  const card = document.querySelector(cardSelector)
  if (!card) return

  gsap.to(card, {
    rotateY: 180,
    duration: 0.8,
    ease: "power2.inOut",
  })
}
```

## 最佳实践

### 1. 性能优化
```typescript
// ✅ 使用 will-change 提示浏览器
.animated-element {
  will-change: transform, opacity;
}

// ✅ 批量动画使用 timeline
const tl = gsap.timeline()
tl.to(".el1", { x: 100 })
  .to(".el2", { y: 50 })

// ✅ 使用 GPU 加速属性
gsap.to(".element", {
  x: 100,    // 使用 x 而非 left
  y: 50,     // 使用 y 而非 top
  scale: 1.2,
  rotation: 45,
})

// ❌ 避免布局属性
gsap.to(".element", {
  left: 100,   // 触发重排
  top: 50,     // 触发重排
})

// ✅ 及时清理 ScrollTrigger
useEffect(() => {
  ScrollTrigger.create({ /* ... */ })
  return () => ScrollTrigger.getAll().forEach(t => t.kill())
}, [])
```

### 2. 内存管理
```typescript
// ✅ 使用 gsap.context 管理动画
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.to(".box", { x: 100 })
  })

  return () => ctx.revert() // 清理所有动画
}, [])

// ✅ 清理 ScrollTrigger
useEffect(() => {
  ScrollTrigger.create({
    trigger: ".section",
    start: "top center",
  })

  return () => {
    ScrollTrigger.getAll().forEach(trigger => trigger.kill())
  }
}, [])
```

### 3. 响应式动画
```typescript
// ✅ 使用 ScrollTrigger.matchMedia
ScrollTrigger.matchMedia({
  "(min-width: 768px)": function () {
    gsap.to(".box", {
      x: 100,
      scrollTrigger: { /* ... */ }
    })
  },
  "(max-width: 767px)": function () {
    gsap.to(".box", {
      y: 100,
      scrollTrigger: { /* ... */ }
    })
  },
})

// ✅ 根据设备能力调整动画
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches

if (!prefersReducedMotion) {
  // 执行动画
}
```

### 4. 调试技巧
```typescript
// ✅ 开发环境启用 markers
if (process.env.NODE_ENV === "development") {
  ScrollTrigger.defaults({
    markers: true,
  })
}

// ✅ 使用 gsap.debug()
gsap.to(".element", {
  x: 100,
  onStart: () => console.log("Animation started"),
  onComplete: () => console.log("Animation completed"),
})

// ✅ 检查动画状态
const animation = gsap.to(".box", { x: 100 })
console.log(animation.progress()) // 0-1
console.log(animation.isActive())
```

### 5. 模块化组织
```typescript
// ✅ 分离动画逻辑
// animations/scroll/index.ts
export { revealOnScroll } from "./reveal-on-scroll"
export { parallaxEffect } from "./parallax"
export { horizontalScroll } from "./horizontal-scroll"

// ✅ 使用工厂模式
function createScrollAnimation(config) {
  return {
    init: () => { /* ... */ },
    play: () => { /* ... */ },
    pause: () => { /* ... */ },
    kill: () => { /* ... */ },
  }
}
```

### 6. 无障碍性
```typescript
// ✅ 尊重用户偏好
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches

function animate() {
  if (prefersReducedMotion) {
    // 简单淡入替代复杂动画
    gsap.to(".element", { opacity: 1, duration: 0.3 })
    return
  }

  // 完整动画
  gsap.from(".element", {
    opacity: 0,
    y: 100,
    rotation: 45,
    duration: 1,
  })
}

// ✅ 暂停动画时考虑用户
element.addEventListener("blur", () => {
  gsap.globalTimeline.pause()
})

element.addEventListener("focus", () => {
  gsap.globalTimeline.resume()
})
```

## 常用命令

### 安装
```bash
# 基础安装（免费）
npm install gsap

# 安装特定插件（Club GreenSock 会员）
# MotionPathHelper, ScrambleText, SplitText 等

# React 集成
npm install gsap @gsap/react
```

### 开发
```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 类型检查（TypeScript）
npm run type-check
```

### GSAP 工具
```bash
# 使用 GSAP CDN
# <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>

# ESM 导入
# import gsap from "gsap"
```

## 部署配置

### Next.js 集成
```javascript
// next.config.js
module.exports = {
  webpack: (config) => {
    // 处理 GSAP 插件
    config.resolve.alias["gsap"] = "gsap"
    return config
  },
}
```

### Webpack 配置
```javascript
// webpack.config.js
module.exports = {
  resolve: {
    alias: {
      gsap: path.resolve("./node_modules/gsap"),
    },
  },
}
```

### 性能配置
```javascript
// gsap.config.js
gsap.config({
  nullTargetWarn: false, // 生产环境关闭警告
  force3D: true,         // 强制 GPU 加速
})

// 压缩配置
// build 时移除未使用的插件
```

### 懒加载插件
```typescript
// 动态加载重型插件
async function loadMotionPath() {
  const { MotionPathPlugin } = await import("gsap/MotionPathPlugin")
  gsap.registerPlugin(MotionPathPlugin)
  // 使用插件
}

// 条件加载
if (needsAdvancedAnimation) {
  loadMotionPath()
}
```

## 扩展资源

- [GSAP 官方文档](https://greensock.com/docs/)
- [ScrollTrigger 文档](https://greensock.com/docs/v3/Plugins/ScrollTrigger)
- [GSAP 示例](https://greensock.com/examples/)
- [CodePen GSAP 集合](https://codepen.io/collection/DWvNpE)
- [GreenSock 论坛](https://greensock.com/forums/)
- [Club GreenSock](https://greensock.com/club/)
- [GSAP React 指南](https://greensock.com/react/)
