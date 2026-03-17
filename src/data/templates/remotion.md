# Remotion 视频制作模板

## 技术栈

- **核心**: Remotion 4.x
- **框架**: React 18+ / TypeScript 5.x
- **渲染**: Puppeteer / Chrome Headless
- **输出格式**: MP4 / WebM / GIF / PNG Sequence
- **云渲染**: Remotion Lambda / Remotion Cloud

## 项目结构

```
remotion-project/
├── src/
│   ├── compositions/
│   │   ├── Intro.tsx           # 开场动画
│   │   ├── Title.tsx           # 标题组件
│   │   ├── DataViz.tsx         # 数据可视化
│   │   └── index.ts            # 组件导出
│   ├── components/
│   │   ├── AnimatedText.tsx    # 动画文字
│   │   ├── ProgressBar.tsx     # 进度条
│   │   ├── Chart.tsx           # 图表组件
│   │   └── Transition.tsx      # 转场效果
│   ├── utils/
│   │   ├── easing.ts           # 缓动函数
│   │   ├── format.ts           # 格式化工具
│   │   └── audio.ts            # 音频处理
│   ├── audio/
│   │   ├── background.mp3      # 背景音乐
│   │   └── sfx/                # 音效
│   ├── Root.tsx                # 根组件
│   ├── index.ts                # 入口文件
│   └── Config.ts               # Remotion 配置
├── public/
│   ├── fonts/                  # 字体文件
│   └── images/                 # 图片资源
├── out/                        # 渲染输出
├── package.json
└── remotion.config.ts
```

## 代码模式

### 基础 Composition

```typescript
// compositions/Intro.tsx
import React from 'react';
import {
  AbsoluteFill,
  useVideoConfig,
  useCurrentFrame,
  interpolate,
  spring,
} from 'remotion';

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // 动画：标题从下方滑入
  const titleY = spring({
    frame,
    fps,
    config: {
      damping: 100,
      stiffness: 200,
      mass: 0.5,
    },
  });

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#1a1a2e',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <h1
        style={{
          fontFamily: 'Arial',
          fontSize: 100,
          color: '#fff',
          transform: `translateY(${interpolate(titleY, [0, 1], [200, 0])}px)`,
          opacity: titleOpacity,
        }}
      >
        Welcome to Remotion
      </h1>
    </AbsoluteFill>
  );
};
```

### 注册 Composition

```typescript
// src/Root.tsx
import React from 'react';
import { Composition } from 'remotion';
import { Intro } from './compositions/Intro';
import { Title } from './compositions/Title';
import { DataViz } from './compositions/DataViz';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Intro"
        component={Intro}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
      
      <Composition
        id="Title"
        component={Title}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          titleText: 'Hello World',
          titleColor: '#000000',
        }}
      />
      
      <Composition
        id="DataViz"
        component={DataViz}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
```

### 动画文字

```typescript
// components/AnimatedText.tsx
import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';

interface AnimatedTextProps {
  text: string;
  delay?: number;
  style?: React.CSSProperties;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  delay = 0,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ display: 'flex', ...style }}>
      {text.split('').map((char, i) => {
        const charDelay = delay + i * 2;
        const progress = spring({
          frame: frame - charDelay,
          fps,
          config: {
            damping: 100,
            stiffness: 200,
            mass: 0.5,
          },
        });

        const opacity = interpolate(
          frame - charDelay,
          [0, 10],
          [0, 1],
          { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
        );

        const translateY = interpolate(progress, [0, 1], [50, 0]);

        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity,
              transform: `translateY(${translateY}px)`,
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        );
      })}
    </div>
  );
};
```

### 序列与时间线

```typescript
// compositions/Timeline.tsx
import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig } from 'remotion';
import { Intro } from './Intro';
import { Title } from './Title';
import { DataViz } from './DataViz';

export const Timeline: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f0f23' }}>
      {/* 0-5秒：开场 */}
      <Sequence from={0} durationInFrames={5 * fps}>
        <Intro />
      </Sequence>

      {/* 5-15秒：标题 */}
      <Sequence from={5 * fps} durationInFrames={10 * fps}>
        <Title titleText="Introduction" />
      </Sequence>

      {/* 15-30秒：数据可视化 */}
      <Sequence from={15 * fps} durationInFrames={15 * fps}>
        <DataViz />
      </Sequence>
    </AbsoluteFill>
  );
};
```

### 数据可视化动画

```typescript
// components/Chart.tsx
import React from 'react';
import {
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from 'remotion';

interface ChartData {
  label: string;
  value: number;
  color: string;
}

interface BarChartProps {
  data: ChartData[];
}

export const BarChart: React.FC<BarChartProps> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 20,
        height: 400,
      }}
    >
      {data.map((item, index) => {
        const delay = index * 5;
        const progress = spring({
          frame: frame - delay,
          fps,
          config: { damping: 100, stiffness: 200 },
        });

        const barHeight = interpolate(
          progress,
          [0, 1],
          [0, (item.value / maxValue) * 400]
        );

        return (
          <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: 80,
                height: barHeight,
                backgroundColor: item.color,
                borderRadius: '8px 8px 0 0',
              }}
            />
            <span
              style={{
                marginTop: 10,
                fontSize: 24,
                color: '#fff',
              }}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
```

### 音频同步

```typescript
// compositions/AudioSync.tsx
import React from 'react';
import {
  AbsoluteFill,
  Audio,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  staticFile,
} from 'remotion';

export const AudioSync: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 音频节拍时间点（帧数）
  const beats = [0, 30, 60, 90, 120];
  
  // 检测当前是否在节拍上
  const currentBeat = beats.findIndex((beat, i) => {
    const nextBeat = beats[i + 1] || Infinity;
    return frame >= beat && frame < nextBeat;
  });

  // 节拍动画
  const scale = beats.reduce((acc, beat) => {
    if (frame >= beat && frame < beat + 10) {
      const progress = interpolate(frame, [beat, beat + 10], [1.2, 1], {
        extrapolateRight: 'clamp',
      });
      return progress;
    }
    return acc;
  }, 1);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#1a1a2e',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: 200,
          height: 200,
          borderRadius: '50%',
          backgroundColor: '#e94560',
          transform: `scale(${scale})`,
        }}
      />
      
      <Audio src={staticFile('background.mp3')} />
    </AbsoluteFill>
  );
};
```

### 图片序列

```typescript
// compositions/ImageSequence.tsx
import React from 'react';
import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  interpolate,
  staticFile,
} from 'remotion';

export const ImageSequence: React.FC = () => {
  const frame = useCurrentFrame();
  
  // 图片序列（假设有 100 张图片）
  const imageNumber = Math.floor(frame % 100);
  const paddedNumber = String(imageNumber).padStart(4, '0');
  
  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Img
        src={staticFile(`frames/frame_${paddedNumber}.png`)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity,
        }}
      />
    </AbsoluteFill>
  );
};
```

## 最佳实践

### 1. 组件化与复用

```typescript
// components/Slide.tsx
import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';

interface SlideProps {
  durationInFrames: number;
  children: React.ReactNode;
  background?: string;
  transition?: 'fade' | 'slide' | 'zoom';
}

export const Slide: React.FC<SlideProps> = ({
  durationInFrames,
  children,
  background = '#1a1a2e',
  transition = 'fade',
}) => {
  return (
    <Sequence durationInFrames={durationInFrames}>
      <AbsoluteFill
        style={{
          backgroundColor: background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {children}
      </AbsoluteFill>
    </Sequence>
  );
};

// 使用
<Slide durationInFrames={150} background="#0f3460">
  <h1>Slide 1</h1>
</Slide>
```

### 2. 缓动函数

```typescript
// utils/easing.ts
import { interpolate } from 'remotion';

export const easingFunctions = {
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,

  easeOutBounce: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },

  easeOutElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

// 使用自定义缓动
export function useCustomEasing(
  frame: number,
  inputRange: [number, number],
  outputRange: [number, number],
  easingFn: (t: number) => number
) {
  const normalized = interpolate(frame, inputRange, [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  
  const eased = easingFn(normalized);
  
  return interpolate(eased, [0, 1], outputRange);
}
```

### 3. 配置管理

```typescript
// remotion.config.ts
import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);

// 渲染配置
Config.setPixelFormat('yuv420p');
Config.setCrf(18); // 质量（0-51，越低越好）

// 并发配置
Config.setConcurrency(4);

// 输出配置
Config.setOutputLocation('out/video.mp4');
```

### 4. 性能优化

```typescript
// 使用 memo 避免重复渲染
import React, { useMemo } from 'remotion';

export const OptimizedComponent: React.FC = () => {
  const frame = useCurrentFrame();

  // 使用 useMemo 缓存计算结果
  const expensiveValue = useMemo(() => {
    return heavyCalculation(frame);
  }, [frame]);

  return <div>{expensiveValue}</div>;
};

// 延迟加载大组件
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

export const LazyComposition: React.FC = () => {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </React.Suspense>
  );
};
```

## 常用命令

```bash
# 安装
npm install remotion @remotion/cli @remotion/player

# 启动开发服务器
npx remotion preview

# 渲染视频
npx remotion render Intro out/intro.mp4

# 渲染 GIF
npx remotion render Intro out/intro.gif

# 渲染图片序列
npx remotion render Intro out/frame-%05d.png --sequence

# Lambda 渲染（需要配置）
npx remotion lambda render Intro out/video.mp4

# 类型检查
npx remotion compositions

# 查看配置
npx remotion config
```

## 部署配置

### Remotion Lambda

```typescript
// lambda/config.ts
import { deploySite, getOrCreateBucket } from '@remotion/lambda';

async function deploy() {
  const { bucketName } = await getOrCreateBucket({
    region: 'us-east-1',
  });

  const { serveUrl } = await deploySite({
    bucketName,
    siteName: 'my-video',
    region: 'us-east-1',
  });

  console.log('Deployed to:', serveUrl);
}

// 渲染视频
import { renderMediaOnLambda } from '@remotion/lambda';

const result = await renderMediaOnLambda({
  region: 'us-east-1',
  functionName: 'remotion-render',
  composition: 'Intro',
  serveUrl: 'https://your-bucket.s3.amazonaws.com/site/index.html',
  inputProps: {},
  codec: 'h264',
  outputBucket: 'output-bucket',
});
```

### 环境变量

```bash
# .env
REMOTION_AWS_ACCESS_KEY_ID=xxx
REMOTION_AWS_SECRET_ACCESS_KEY=xxx
REMOTION_AWS_REGION=us-east-1

# Lambda 函数名称
REMOTION_LAMBDA_FUNCTION_NAME=remotion-render
```

### GitHub Actions

```yaml
# .github/workflows/render.yml
name: Render Video

on:
  push:
    branches: [main]

jobs:
  render:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Install dependencies
        run: npm ci
        
      - name: Render video
        run: npx remotion render Intro out/video.mp4
        
      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: video
          path: out/video.mp4
```

### Next.js 集成

```typescript
// pages/api/render.ts
import { renderMediaOnLambda } from '@remotion/lambda';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { compositionId, inputProps } = req.body;

  const result = await renderMediaOnLambda({
    region: 'us-east-1',
    functionName: process.env.REMOTION_LAMBDA_FUNCTION_NAME!,
    composition: compositionId,
    serveUrl: process.env.REMOTION_SERVE_URL!,
    inputProps,
    codec: 'h264',
    outputBucket: process.env.REMOTION_OUTPUT_BUCKET!,
  });

  return res.status(200).json({
    renderId: result.renderId,
    bucketName: result.bucketName,
  });
}
```

## 扩展资源

- [Remotion 官方文档](https://www.remotion.dev/docs)
- [Remotion GitHub](https://github.com/remotion-dev/remotion)
- [示例项目](https://www.remotion.dev/showcase)
- [Lambda 文档](https://www.remotion.dev/docs/lambda)
- [Player 组件](https://www.remotion.dev/docs/player)
