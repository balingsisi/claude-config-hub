# Video.js 模板

## 技术栈
- **Video.js** - 开源 HTML5 视频播放器框架
- **TypeScript** - 完整类型支持
- **React** - React 集成（可选）
- **Video.js Plugins** - 插件生态系统
- **HLS.js** - HLS 流媒体支持
- **DASH** - MPEG-DASH 支持

## 项目结构
```
videojs-project/
├── src/
│   ├── components/
│   │   ├── VideoPlayer.tsx
│   │   ├── VideoPlayerControls.tsx
│   │   └── VideoPlayerPlugins.tsx
│   ├── players/
│   │   ├── BasicPlayer.ts
│   │   ├── HLSPlayer.ts
│   │   └── DASHPlayer.ts
│   ├── plugins/
│   │   ├── watermark.ts
│   │   ├── analytics.ts
│   │   └── quality-selector.ts
│   ├── styles/
│   │   └── video-player.scss
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
│   └── videos/
├── package.json
└── tsconfig.json
```

## 代码模式

### 基础播放器
```typescript
// src/players/BasicPlayer.ts
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import Player from 'video.js/dist/types/player';

export interface VideoPlayerOptions {
  controls?: boolean;
  autoplay?: boolean | 'play' | 'muted' | 'any';
  preload?: 'auto' | 'metadata' | 'none';
  loop?: boolean;
  muted?: boolean;
  fluid?: boolean;
  responsive?: boolean;
  playbackRates?: number[];
  poster?: string;
  sources?: Array<{
    src: string;
    type: string;
  }>;
}

export class BasicPlayer {
  private player: Player | null = null;
  private videoElement: HTMLVideoElement;

  constructor(element: HTMLVideoElement, options: VideoPlayerOptions = {}) {
    this.videoElement = element;
    this.init(options);
  }

  private init(options: VideoPlayerOptions) {
    const defaultOptions: VideoPlayerOptions = {
      controls: true,
      autoplay: false,
      preload: 'auto',
      fluid: true,
      playbackRates: [0.5, 1, 1.5, 2],
      ...options,
    };

    this.player = videojs(this.videoElement, defaultOptions, () => {
      console.log('Player is ready');
      this.onReady();
    });
  }

  private onReady() {
    if (!this.player) return;

    // 播放事件
    this.player.on('play', () => {
      console.log('Video started playing');
    });

    this.player.on('pause', () => {
      console.log('Video paused');
    });

    this.player.on('ended', () => {
      console.log('Video ended');
    });

    // 时间更新
    this.player.on('timeupdate', () => {
      const currentTime = this.player?.currentTime();
      const duration = this.player?.duration();
      console.log(`Time: ${currentTime} / ${duration}`);
    });

    // 错误处理
    this.player.on('error', () => {
      const error = this.player?.error();
      console.error('Video error:', error);
    });
  }

  // 播放控制
  play() {
    this.player?.play();
  }

  pause() {
    this.player?.pause();
  }

  stop() {
    this.player?.pause();
    this.player?.currentTime(0);
  }

  // 跳转
  seek(time: number) {
    this.player?.currentTime(time);
  }

  // 音量控制
  setVolume(volume: number) {
    this.player?.volume(Math.max(0, Math.min(1, volume)));
  }

  mute() {
    this.player?.muted(true);
  }

  unmute() {
    this.player?.muted(false);
  }

  // 全屏
  requestFullscreen() {
    this.player?.requestFullscreen();
  }

  exitFullscreen() {
    this.player?.exitFullscreen();
  }

  // 播放速度
  setPlaybackRate(rate: number) {
    this.player?.playbackRate(rate);
  }

  // 获取信息
  getCurrentTime(): number {
    return this.player?.currentTime() || 0;
  }

  getDuration(): number {
    return this.player?.duration() || 0;
  }

  getBuffered(): TimeRanges | undefined {
    return this.player?.buffered();
  }

  // 销毁
  dispose() {
    if (this.player) {
      this.player.dispose();
      this.player = null;
    }
  }
}
```

### React 组件
```typescript
// src/components/VideoPlayer.tsx
import { useEffect, useRef, useCallback } from 'react';
import videojs from 'video.js';
import Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';

export interface VideoPlayerProps {
  options: videojs.PlayerOptions;
  onReady?: (player: Player) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onError?: (error: any) => void;
}

export function VideoPlayer({
  options,
  onReady,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onError,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    // 初始化播放器
    if (!playerRef.current) {
      const player = videojs(videoRef.current, options, () => {
        console.log('Player is ready');
        onReady?.(player);
      });

      playerRef.current = player;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [options]);

  // 事件监听
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    if (onPlay) {
      player.on('play', onPlay);
    }
    if (onPause) {
      player.on('pause', onPause);
    }
    if (onEnded) {
      player.on('ended', onEnded);
    }
    if (onTimeUpdate) {
      player.on('timeupdate', () => {
        const currentTime = player.currentTime() || 0;
        const duration = player.duration() || 0;
        onTimeUpdate(currentTime, duration);
      });
    }
    if (onError) {
      player.on('error', () => {
        onError(player.error());
      });
    }

    return () => {
      if (onPlay) player.off('play', onPlay);
      if (onPause) player.off('pause', onPause);
      if (onEnded) player.off('ended', onEnded);
      if (onTimeUpdate) player.off('timeupdate');
      if (onError) player.off('error');
    };
  }, [onPlay, onPause, onEnded, onTimeUpdate, onError]);

  return (
    <div data-vjs-player>
      <video
        ref={videoRef}
        className="video-js vjs-big-play-centered vjs-theme-city"
        playsInline
      />
    </div>
  );
}
```

### HLS 流媒体播放器
```typescript
// src/players/HLSPlayer.ts
import videojs from 'video.js';
import 'videojs-contrib-quality-levels';
import 'videojs-hls-quality-selector';
import { BasicPlayer, VideoPlayerOptions } from './BasicPlayer';

export interface HLSPlayerOptions extends VideoPlayerOptions {
  hls?: {
    overrideNative?: boolean;
    enableLowInitialPlaylist?: boolean;
    smoothQualityChange?: boolean;
    fastQualityChange?: boolean;
  };
}

export class HLSPlayer extends BasicPlayer {
  constructor(element: HTMLVideoElement, options: HLSPlayerOptions = {}) {
    const hlsOptions: HLSPlayerOptions = {
      ...options,
      html5: {
        vhs: {
          overrideNative: options.hls?.overrideNative ?? true,
          enableLowInitialPlaylist: options.hls?.enableLowInitialPlaylist ?? true,
          smoothQualityChange: options.hls?.smoothQualityChange ?? true,
          fastQualityChange: options.hls?.fastQualityChange ?? true,
        },
        nativeAudioTracks: false,
        nativeVideoTracks: false,
      },
    };

    super(element, hlsOptions);
  }
}
```

### DASH 流媒体播放器
```typescript
// src/players/DASHPlayer.ts
import videojs from 'video.js';
import 'videojs-contrib-dash';
import { BasicPlayer, VideoPlayerOptions } from './BasicPlayer';

export interface DASHPlayerOptions extends VideoPlayerOptions {
  dash?: {
    limitBitrateByPortal?: boolean;
    initialBitrate?: {
      video: number;
      audio: number;
    };
  };
}

export class DASHPlayer extends DASHPlayerOptions {
  constructor(element: HTMLVideoElement, options: DASHPlayerOptions = {}) {
    const dashOptions: DASHPlayerOptions = {
      ...options,
      html5: {
        ...options.html5,
        dash: {
          limitBitrateByPortal: options.dash?.limitBitrateByPortal ?? true,
          initialBitrate: options.dash?.initialBitrate ?? {
            video: 1000,
            audio: 128,
          },
        },
      },
    };

    super(element, dashOptions);
  }
}
```

### 自定义插件
```typescript
// src/plugins/watermark.ts
import videojs from 'video.js';

const Plugin = videojs.getPlugin('plugin');

interface WatermarkOptions {
  image?: string;
  text?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  opacity?: number;
  margin?: number;
}

class Watermark extends Plugin {
  private watermarkElement: HTMLDivElement | null = null;

  constructor(player: videojs.Player, options: WatermarkOptions = {}) {
    super(player, options);

    this.createWatermark(options);
  }

  private createWatermark(options: WatermarkOptions) {
    const {
      image,
      text,
      position = 'bottom-right',
      opacity = 0.5,
      margin = 10,
    } = options;

    this.watermarkElement = document.createElement('div');
    this.watermarkElement.className = 'vjs-watermark';

    // 样式
    Object.assign(this.watermarkElement.style, {
      position: 'absolute',
      opacity: opacity.toString(),
      zIndex: '10',
      ...this.getPositionStyles(position, margin),
    });

    if (image) {
      const img = document.createElement('img');
      img.src = image;
      img.style.maxWidth = '100px';
      img.style.maxHeight = '50px';
      this.watermarkElement.appendChild(img);
    } else if (text) {
      this.watermarkElement.textContent = text;
      this.watermarkElement.style.color = 'white';
      this.watermarkElement.style.fontSize = '14px';
      this.watermarkElement.style.textShadow = '1px 1px 2px black';
    }

    this.player.el().appendChild(this.watermarkElement);
  }

  private getPositionStyles(
    position: string,
    margin: number
  ): Partial<CSSStyleDeclaration> {
    const styles: any = {};

    switch (position) {
      case 'top-left':
        styles.top = `${margin}px`;
        styles.left = `${margin}px`;
        break;
      case 'top-right':
        styles.top = `${margin}px`;
        styles.right = `${margin}px`;
        break;
      case 'bottom-left':
        styles.bottom = `${margin}px`;
        styles.left = `${margin}px`;
        break;
      case 'bottom-right':
        styles.bottom = `${margin}px`;
        styles.right = `${margin}px`;
        break;
    }

    return styles;
  }

  dispose() {
    if (this.watermarkElement) {
      this.watermarkElement.remove();
      this.watermarkElement = null;
    }
    super.dispose();
  }
}

videojs.registerPlugin('watermark', Watermark);
```

### 分析插件
```typescript
// src/plugins/analytics.ts
import videojs from 'video.js';

const Plugin = videojs.getPlugin('plugin');

interface AnalyticsOptions {
  trackingId: string;
  events?: string[];
}

class Analytics extends Plugin {
  private trackingId: string;
  private events: string[];
  private playedSeconds: number = 0;
  private lastTimeUpdate: number = 0;

  constructor(player: videojs.Player, options: AnalyticsOptions) {
    super(player, options);

    this.trackingId = options.trackingId;
    this.events = options.events || ['play', 'pause', 'ended', 'seeked', 'error'];

    this.setupEventTracking();
  }

  private setupEventTracking() {
    // 播放
    this.player.on('play', () => {
      this.trackEvent('play', {
        currentTime: this.player.currentTime(),
      });
    });

    // 暂停
    this.player.on('pause', () => {
      this.trackEvent('pause', {
        currentTime: this.player.currentTime(),
        playedSeconds: this.playedSeconds,
      });
    });

    // 结束
    this.player.on('ended', () => {
      this.trackEvent('ended', {
        playedSeconds: this.playedSeconds,
        duration: this.player.duration(),
      });
    });

    // 跳转
    this.player.on('seeked', () => {
      this.trackEvent('seeked', {
        currentTime: this.player.currentTime(),
      });
    });

    // 时间跟踪
    this.player.on('timeupdate', () => {
      const currentTime = this.player.currentTime() || 0;
      const deltaTime = currentTime - this.lastTimeUpdate;
      
      if (deltaTime > 0 && deltaTime < 2) {
        this.playedSeconds += deltaTime;
      }
      
      this.lastTimeUpdate = currentTime;
    });

    // 错误
    this.player.on('error', () => {
      const error = this.player.error();
      this.trackEvent('error', {
        code: error?.code,
        message: error?.message,
      });
    });
  }

  private trackEvent(action: string, data: any = {}) {
    // 发送到分析服务
    fetch('https://analytics.example.com/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trackingId: this.trackingId,
        event: action,
        timestamp: Date.now(),
        data: {
          videoSrc: this.player.src(),
          duration: this.player.duration(),
          ...data,
        },
      }),
    }).catch((error) => {
      console.error('Analytics tracking failed:', error);
    });
  }

  dispose() {
    this.player.off('play');
    this.player.off('pause');
    this.player.off('ended');
    this.player.off('seeked');
    this.player.off('timeupdate');
    this.player.off('error');
    super.dispose();
  }
}

videojs.registerPlugin('analytics', Analytics);
```

### 质量选择器插件
```typescript
// src/plugins/quality-selector.ts
import videojs from 'video.js';
import QualityLevels from 'videojs-contrib-quality-levels';

const Plugin = videojs.getPlugin('plugin');

interface QualityLevel {
  id: string;
  label: string;
  width: number;
  height: number;
  bitrate: number;
}

class QualitySelector extends Plugin {
  private qualityLevels: QualityLevels | null = null;
  private menuButton: any = null;

  constructor(player: videojs.Player) {
    super(player);

    this.player.ready(() => {
      this.setupQualityLevels();
      this.createMenuButton();
    });
  }

  private setupQualityLevels() {
    this.qualityLevels = this.player.qualityLevels();

    this.qualityLevels.on('addqualitylevel', (event: any) => {
      console.log('Quality level added:', event.qualityLevel);
    });

    this.qualityLevels.on('change', (event: any) => {
      console.log('Quality level changed:', event);
    });
  }

  private createMenuButton() {
    const MenuButton = videojs.getComponent('MenuButton');
    const MenuItem = videojs.getComponent('MenuItem');

    class QualityMenuButton extends MenuButton {
      constructor(player: any, options: any) {
        super(player, options);
        this.addClass('vjs-quality-button');
        this.controlText('Quality');
      }

      createItems() {
        const items: any[] = [];
        const qualityLevels = this.player().qualityLevels();

        // Auto
        items.push(
          new MenuItem(this.player(), {
            label: 'Auto',
            selectable: true,
            selected: true,
          })
        );

        // 添加所有质量级别
        for (let i = 0; i < qualityLevels.length; i++) {
          const level = qualityLevels[i];
          items.push(
            new MenuItem(this.player(), {
              label: this.getLabel(level),
              selectable: true,
              selected: false,
            })
          );
        }

        return items;
      }

      private getLabel(level: any): string {
        if (level.height >= 2160) return '4K';
        if (level.height >= 1080) return '1080p';
        if (level.height >= 720) return '720p';
        if (level.height >= 480) return '480p';
        return '360p';
      }
    }

    videojs.registerComponent('QualityMenuButton', QualityMenuButton);
    this.menuButton = this.player.controlBar.addChild(
      'QualityMenuButton',
      {},
      this.player.controlBar.children().length - 1
    );
  }

  dispose() {
    if (this.menuButton) {
      this.menuButton.dispose();
    }
    super.dispose();
  }
}

videojs.registerPlugin('qualitySelector', QualitySelector);
```

### TypeScript 类型
```typescript
// src/types/index.ts
import videojs from 'video.js';

declare module 'video.js' {
  interface Player {
    qualityLevels(): QualityLevels;
    watermark(options?: WatermarkOptions): void;
    analytics(options: AnalyticsOptions): void;
    qualitySelector(): void;
  }
}

export interface VideoPlayerOptions extends videojs.PlayerOptions {
  sources?: VideoSource[];
  poster?: string;
  tracks?: TextTrack[];
}

export interface VideoSource {
  src: string;
  type: string;
  label?: string;
  res?: number;
}

export interface TextTrack {
  kind: 'subtitles' | 'captions' | 'chapters' | 'descriptions' | 'metadata';
  src: string;
  srclang: string;
  label: string;
  default?: boolean;
}
```

## 最佳实践

### 1. 响应式设计
```typescript
// 使用 fluid 或 responsive 选项
const options: VideoPlayerOptions = {
  fluid: true, // 或
  responsive: true,
  aspectRatio: '16:9',
};
```

### 2. 多源回退
```typescript
const sources = [
  { src: 'video.mp4', type: 'video/mp4' },
  { src: 'video.webm', type: 'video/webm' },
  { src: 'video.ogv', type: 'video/ogg' },
];
```

### 3. 无障碍性
```typescript
const options: VideoPlayerOptions = {
  controls: true,
  controlBar: {
    playToggle: true,
    volumePanel: true,
    currentTimeDisplay: true,
    durationDisplay: true,
    progressControl: true,
    liveDisplay: true,
    seekToLive: true,
    remainingTimeDisplay: true,
    customControlSpacer: true,
    playbackRateMenuButton: true,
    chaptersButton: true,
    descriptionsButton: true,
    subsCapsButton: true,
    audioTrackButton: true,
    pictureInPictureToggle: true,
    fullscreenToggle: true,
  },
  tracks: [
    {
      kind: 'captions',
      src: 'captions.vtt',
      srclang: 'en',
      label: 'English',
      default: true,
    },
  ],
};
```

## 常用命令

### 安装
```bash
# 安装 Video.js
npm install video.js

# 安装 TypeScript 类型
npm install -D @types/video.js

# 安装 HLS 支持
npm install videojs-contrib-quality-levels videojs-hls-quality-selector

# 安装 DASH 支持
npm install videojs-contrib-dash

# 安装 React 集成
npm install @videojs/themes
```

### 开发
```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行测试
npm run test
```

## 部署配置

### package.json
```json
{
  "name": "videojs-project",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "video.js": "^8.10.0",
    "videojs-contrib-quality-levels": "^4.0.0",
    "videojs-hls-quality-selector": "^2.0.0",
    "videojs-contrib-dash": "^5.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/video.js": "^7.3.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Vite 配置
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'video.js': ['video.js'],
        },
      },
    },
  },
});
```

### Nginx 配置（视频流）
```nginx
server {
    listen 80;
    server_name example.com;

    location /videos/ {
        alias /var/www/videos/;
        
        # 支持范围请求
        add_header Accept-Ranges bytes;
        
        # 缓存设置
        expires 1y;
        add_header Cache-Control "public, immutable";
        
        # CORS
        add_header Access-Control-Allow-Origin *;
        
        # HLS/DASH 支持
        types {
            application/vnd.apple.mpegurl m3u8;
            application/dash+xml mpd;
        }
    }
}
```

### 环境变量
```bash
# .env
VITE_API_URL=https://api.example.com
VITE_VIDEO_CDN=https://cdn.example.com/videos
```
