# Plyr 模板

## 技术栈
- **Plyr** - 轻量级、可访问和可定制的 HTML5 媒体播放器
- **TypeScript** - 完整类型支持
- **React** - React 集成（react-player 或 plyr-react）
- **HLS.js** - HLS 流媒体支持
- **Dash.js** - DASH 流媒体支持
- **YouTube/Vimeo** - 第三方平台集成

## 项目结构
```
plyr-project/
├── src/
│   ├── components/
│   │   ├── PlyrPlayer.tsx
│   │   ├── AudioPlayer.tsx
│   │   ├── VideoPlayer.tsx
│   │   └── YouTubePlayer.tsx
│   ├── players/
│   │   ├── BasicPlayer.ts
│   │   ├── HLSPlayer.ts
│   │   └── DASHPlayer.ts
│   ├── themes/
│   │   ├── custom.css
│   │   └── dark.css
│   ├── hooks/
│   │   └── usePlyr.ts
│   ├── types/
│ │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
│   └── media/
├── package.json
└── tsconfig.json
```

## 代码模式

### 基础播放器
```typescript
// src/players/BasicPlayer.ts
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';

export interface PlyrOptions extends Plyr.Options {
  debug?: boolean;
}

export class BasicPlayer {
  private player: Plyr | null = null;

  constructor(element: HTMLElement | string, options: PlyrOptions = {}) {
    const defaultOptions: PlyrOptions = {
      controls: [
        'play-large',
        'play',
        'progress',
        'current-time',
        'duration',
        'mute',
        'volume',
        'captions',
        'settings',
        'pip',
        'airplay',
        'download',
        'fullscreen',
      ],
      i18n: {
        restart: '重新播放',
        rewind: '后退 {seektime} 秒',
        play: '播放',
        pause: '暂停',
        fastForward: '前进 {seektime} 秒',
        seek: '定位',
        seekLabel: '{currentTime} / {duration}',
        played: '已播放',
        buffered: '已缓冲',
        currentTime: '当前时间',
        duration: '时长',
        volume: '音量',
        mute: '静音',
        unmute: '取消静音',
        enableCaptions: '开启字幕',
        disableCaptions: '关闭字幕',
        download: '下载',
        enterFullscreen: '进入全屏',
        exitFullscreen: '退出全屏',
        frameTitle: 'Player for {title}',
        captions: '字幕',
        settings: '设置',
        pip: '画中画',
        menuBack: '返回上级菜单',
        speed: '速度',
        normal: '正常',
        quality: '质量',
        loop: '循环',
        start: '开始',
        end: '结束',
        all: '全部',
        reset: '重置',
        disabled: '禁用',
        enabled: '启用',
        advertisement: '广告',
        qualityBadge: {
          2160: '4K',
          1440: 'HD',
          1080: 'HD',
          720: 'HD',
          576: 'SD',
          480: 'SD',
        },
      },
      ...options,
    };

    this.player = new Plyr(element, defaultOptions);
    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.player) return;

    // 准备就绪
    this.player.on('ready', () => {
      console.log('Player ready');
    });

    // 播放事件
    this.player.on('play', () => {
      console.log('Video started playing');
    });

    this.player.on('pause', () => {
      console.log('Video paused');
    });

    this.player.on('playing', () => {
      console.log('Video is playing');
    });

    this.player.on('ended', () => {
      console.log('Video ended');
    });

    // 时间更新
    this.player.on('timeupdate', () => {
      const currentTime = this.player?.currentTime || 0;
      const duration = this.player?.duration || 0;
      console.log(`Time: ${currentTime} / ${duration}`);
    });

    // 音量变化
    this.player.on('volumechange', () => {
      const volume = this.player?.volume || 0;
      const muted = this.player?.muted || false;
      console.log(`Volume: ${volume}, Muted: ${muted}`);
    });

    // 全屏变化
    this.player.on('enterfullscreen', () => {
      console.log('Entered fullscreen');
    });

    this.player.on('exitfullscreen', () => {
      console.log('Exited fullscreen');
    });

    // 错误处理
    this.player.on('error', (event) => {
      console.error('Player error:', event);
    });
  }

  // 播放控制
  play() {
    this.player?.play();
  }

  pause() {
    this.player?.pause();
  }

  togglePlay() {
    this.player?.togglePlay();
  }

  stop() {
    this.player?.stop();
  }

  // 跳转
  seek(time: number) {
    if (this.player) {
      this.player.currentTime = time;
    }
  }

  forward(seconds: number = 10) {
    if (this.player) {
      this.player.forward = seconds;
    }
  }

  rewind(seconds: number = 10) {
    if (this.player) {
      this.player.rewind = seconds;
    }
  }

  // 音量控制
  setVolume(volume: number) {
    if (this.player) {
      this.player.volume = Math.max(0, Math.min(1, volume));
    }
  }

  mute() {
    if (this.player) {
      this.player.muted = true;
    }
  }

  unmute() {
    if (this.player) {
      this.player.muted = false;
    }
  }

  toggleMute() {
    if (this.player) {
      this.player.muted = !this.player.muted;
    }
  }

  // 全屏
  enterFullscreen() {
    this.player?.fullscreen.enter();
  }

  exitFullscreen() {
    this.player?.fullscreen.exit();
  }

  toggleFullscreen() {
    this.player?.fullscreen.toggle();
  }

  // 画中画
  enterPIP() {
    this.player?.pip = 'active';
  }

  exitPIP() {
    this.player?.pip = 'inactive';
  }

  togglePIP() {
    if (this.player) {
      this.player.pip = this.player.pip === 'active' ? 'inactive' : 'active';
    }
  }

  // 播放速度
  setSpeed(speed: number) {
    if (this.player) {
      this.player.speed = speed;
    }
  }

  // 质量选择
  setQuality(quality: number) {
    if (this.player) {
      this.player.quality = quality;
    }
  }

  // 获取信息
  getCurrentTime(): number {
    return this.player?.currentTime || 0;
  }

  getDuration(): number {
    return this.player?.duration || 0;
  }

  getVolume(): number {
    return this.player?.volume || 0;
  }

  isMuted(): boolean {
    return this.player?.muted || false;
  }

  isPaused(): boolean {
    return this.player?.paused || true;
  }

  // 销毁
  destroy() {
    this.player?.destroy();
    this.player = null;
  }
}
```

### React 组件
```typescript
// src/components/PlyrPlayer.tsx
import { useEffect, useRef, useState } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';

export interface PlyrPlayerProps {
  source: Plyr.MediaInfo;
  options?: Plyr.Options;
  onReady?: (player: Plyr) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onVolumeChange?: (volume: number, muted: boolean) => void;
  onError?: (error: any) => void;
}

export function PlyrPlayer({
  source,
  options = {},
  onReady,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onVolumeChange,
  onError,
}: PlyrPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;

    const player = new Plyr(videoRef.current, {
      ...options,
      source,
    });

    playerRef.current = player;

    // 事件监听
    player.on('ready', () => {
      setIsReady(true);
      onReady?.(player);
    });

    player.on('play', () => onPlay?.());
    player.on('pause', () => onPause?.());
    player.on('ended', () => onEnded?.());

    player.on('timeupdate', () => {
      const currentTime = player.currentTime || 0;
      const duration = player.duration || 0;
      onTimeUpdate?.(currentTime, duration);
    });

    player.on('volumechange', () => {
      const volume = player.volume || 0;
      const muted = player.muted || false;
      onVolumeChange?.(volume, muted);
    });

    player.on('error', (event) => onError?.(event));

    return () => {
      player.destroy();
    };
  }, []);

  // 更新源
  useEffect(() => {
    if (playerRef.current && source) {
      playerRef.current.source = source;
    }
  }, [source]);

  return (
    <div className="plyr-container">
      <video ref={videoRef} className="plyr plyr--video" />
    </div>
  );
}
```

### 音频播放器
```typescript
// src/components/AudioPlayer.tsx
import { useEffect, useRef } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';

export interface AudioPlayerProps {
  sources: Array<{ src: string; type: string }>;
  poster?: string;
  options?: Plyr.Options;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

export function AudioPlayer({
  sources,
  poster,
  options = {},
  onPlay,
  onPause,
  onEnded,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<Plyr | null>(null);

  useEffect(() => {
    if (!audioRef.current) return;

    const player = new Plyr(audioRef.current, {
      controls: [
        'play',
        'progress',
        'current-time',
        'duration',
        'mute',
        'volume',
        'settings',
      ],
      ...options,
    });

    playerRef.current = player;

    player.on('play', () => onPlay?.());
    player.on('pause', () => onPause?.());
    player.on('ended', () => onEnded?.());

    return () => {
      player.destroy();
    };
  }, []);

  return (
    <div className="audio-player">
      <audio ref={audioRef} className="plyr plyr--audio" poster={poster}>
        {sources.map((source, index) => (
          <source key={index} src={source.src} type={source.type} />
        ))}
      </audio>
    </div>
  );
}
```

### HLS 流媒体播放器
```typescript
// src/players/HLSPlayer.ts
import Plyr from 'plyr';
import Hls from 'hls.js';
import 'plyr/dist/plyr.css';

export interface HLSPlayerOptions {
  source: string;
  poster?: string;
  plyrOptions?: Plyr.Options;
  hlsOptions?: Hls.Config;
}

export class HLSPlayer {
  private player: Plyr | null = null;
  private hls: Hls | null = null;

  constructor(element: HTMLElement | string, options: HLSPlayerOptions) {
    const video =
      typeof element === 'string'
        ? document.querySelector<HTMLVideoElement>(element)
        : element;

    if (!video) {
      throw new Error('Video element not found');
    }

    // 检查 HLS 支持
    if (Hls.isSupported()) {
      this.hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        ...options.hlsOptions,
      });

      this.hls.loadSource(options.source);
      this.hls.attachMedia(video);

      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed');

        // 获取质量级别
        const qualityLevels = this.hls?.levels.map((level, index) => ({
          index,
          height: level.height,
          bitrate: level.bitrate,
        }));

        console.log('Available quality levels:', qualityLevels);
      });

      this.hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Network error');
              this.hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Media error');
              this.hls?.recoverMediaError();
              break;
            default:
              console.error('Fatal error');
              this.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // 原生 HLS 支持（Safari）
      video.src = options.source;
    } else {
      throw new Error('HLS is not supported');
    }

    // 初始化 Plyr
    this.player = new Plyr(video, {
      quality: {
        default: 720,
        options: [4320, 2880, 2160, 1440, 1080, 720, 576, 480, 360, 240],
        forced: true,
        onChange: (quality) => {
          if (this.hls) {
            this.hls.levels.forEach((level, index) => {
              if (level.height === quality) {
                this.hls!.currentLevel = index;
              }
            });
          }
        },
      },
      ...options.plyrOptions,
    });
  }

  destroy() {
    this.player?.destroy();
    this.hls?.destroy();
    this.player = null;
    this.hls = null;
  }
}
```

### DASH 流媒体播放器
```typescript
// src/players/DASHPlayer.ts
import Plyr from 'plyr';
import dashjs from 'dashjs';
import 'plyr/dist/plyr.css';

export interface DASHPlayerOptions {
  source: string;
  poster?: string;
  plyrOptions?: Plyr.Options;
  dashOptions?: dashjs.MediaPlayerSettingClass;
}

export class DASHPlayer {
  private player: Plyr | null = null;
  private dash: dashjs.MediaPlayerClass | null = null;

  constructor(element: HTMLElement | string, options: DASHPlayerOptions) {
    const video =
      typeof element === 'string'
        ? document.querySelector<HTMLVideoElement>(element)
        : element;

    if (!video) {
      throw new Error('Video element not found');
    }

    // 初始化 DASH
    this.dash = dashjs.MediaPlayer().create();
    this.dash.updateSettings({
      streaming: {
        buffer: {
          fastSwitchEnabled: true,
        },
        abr: {
          autoSwitchBitrate: {
            video: true,
          },
        },
        ...options.dashOptions?.streaming,
      },
    });

    this.dash.initialize(video, options.source, false);

    // 监听质量变化
    this.dash.on(dashjs.MediaPlayer.events.QUALITY_CHANGE_RENDERED, (event) => {
      console.log('Quality changed:', event);
    });

    // 监听错误
    this.dash.on(dashjs.MediaPlayer.events.ERROR, (event) => {
      console.error('DASH error:', event);
    });

    // 初始化 Plyr
    this.player = new Plyr(video, {
      quality: {
        default: 720,
        options: [4320, 2880, 2160, 1440, 1080, 720, 576, 480, 360, 240],
        forced: true,
        onChange: (quality) => {
          if (this.dash) {
            const bitrates = this.dash.getBitrateInfoListFor('video');
            const index = bitrates.findIndex(
              (bitrate) => bitrate.height === quality
            );
            if (index !== -1) {
              this.dash.updateSettings({
                streaming: {
                  abr: {
                    autoSwitchBitrate: {
                      video: false,
                    },
                  },
                },
              });
              this.dash.setQualityFor('video', index);
            }
          }
        },
      },
      ...options.plyrOptions,
    });
  }

  destroy() {
    this.player?.destroy();
    this.dash?.reset();
    this.player = null;
    this.dash = null;
  }
}
```

### 自定义 Hook
```typescript
// src/hooks/usePlyr.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import Plyr from 'plyr';

export interface UsePlyrOptions {
  source: Plyr.MediaInfo;
  options?: Plyr.Options;
  onReady?: (player: Plyr) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export function usePlyr(options: UsePlyrOptions) {
  const playerRef = useRef<Plyr | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const video = containerRef.current.querySelector('video');
    if (!video) return;

    const player = new Plyr(video, {
      ...options.options,
      source: options.source,
    });

    playerRef.current = player;

    player.on('ready', () => {
      setIsReady(true);
      options.onReady?.(player);
    });

    player.on('play', () => {
      setIsPlaying(true);
      options.onPlay?.();
    });

    player.on('pause', () => {
      setIsPlaying(false);
      options.onPause?.();
    });

    player.on('ended', () => {
      setIsPlaying(false);
      options.onEnded?.();
    });

    player.on('timeupdate', () => {
      const time = player.currentTime || 0;
      const dur = player.duration || 0;
      setCurrentTime(time);
      setDuration(dur);
      options.onTimeUpdate?.(time, dur);
    });

    player.on('volumechange', () => {
      setVolume(player.volume || 0);
      setIsMuted(player.muted || false);
    });

    return () => {
      player.destroy();
    };
  }, []);

  // 更新源
  useEffect(() => {
    if (playerRef.current && options.source) {
      playerRef.current.source = options.source;
    }
  }, [options.source]);

  // 控制函数
  const play = useCallback(() => {
    playerRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    playerRef.current?.togglePlay();
  }, []);

  const seek = useCallback((time: number) => {
    if (playerRef.current) {
      playerRef.current.currentTime = time;
    }
  }, []);

  const setVolumeLevel = useCallback((level: number) => {
    if (playerRef.current) {
      playerRef.current.volume = level;
    }
  }, []);

  const mute = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.muted = true;
    }
  }, []);

  const unmute = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.muted = false;
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.muted = !playerRef.current.muted;
    }
  }, []);

  const enterFullscreen = useCallback(() => {
    playerRef.current?.fullscreen.enter();
  }, []);

  const exitFullscreen = useCallback(() => {
    playerRef.current?.fullscreen.exit();
  }, []);

  const toggleFullscreen = useCallback(() => {
    playerRef.current?.fullscreen.toggle();
  }, []);

  return {
    containerRef,
    player: playerRef.current,
    isReady,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    play,
    pause,
    togglePlay,
    seek,
    setVolume: setVolumeLevel,
    mute,
    unmute,
    toggleMute,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
}
```

### 自定义主题
```css
/* src/themes/custom.css */
.plyr {
  --plyr-color-main: #1ac266;
  --plyr-video-background: rgba(0, 0, 0, 1);
  --plyr-tab-focus-color: var(--plyr-color-main);
  --plyr-badge-background: #4bafe4;
  --plyr-badge-text-color: #ffffff;
  --plyr-badge-border-radius: 2px;
  --plyr-tab-focus-color: var(--plyr-color-main);
  --plyr-video-control-background-hover: rgba(0, 0, 0, 0.3);
  --plyr-controls-background: rgba(0, 0, 0, 0.3);
  --plyr-control-icon-size: 20px;
  --plyr-range-track-height: 6px;
  --plyr-range-thumb-height: 14px;
  --plyr-range-thumb-width: 14px;
  --plyr-range-thumb-background: #fff;
  --plyr-range-thumb-shadow: 0 1px 1px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.15);
  --plyr-range-fill-background: var(--plyr-color-main);
  --plyr-video-progress-buffered-background: rgba(255, 255, 255, 0.25);
  --plyr-audio-progress-buffered-background: rgba(193, 200, 209, 0.6);
}

/* 深色主题 */
/* src/themes/dark.css */
.plyr.plyr--dark {
  --plyr-color-main: #6c5ce7;
  --plyr-video-background: #000;
  --plyr-controls-background: rgba(0, 0, 0, 0.7);
  --plyr-range-fill-background: #6c5ce7;
}
```

### TypeScript 类型
```typescript
// src/types/index.ts
import Plyr from 'plyr';

export interface VideoSource {
  src: string;
  type: string;
  size?: number;
}

export interface AudioSource {
  src: string;
  type: string;
}

export interface PosterImage {
  src: string;
  sizes?: string;
}

export interface Track {
  kind: 'subtitles' | 'captions' | 'chapters' | 'descriptions' | 'metadata';
  label: string;
  srclang: string;
  src: string;
  default?: boolean;
}

export interface PlyrSource {
  type: 'video' | 'audio';
  sources: VideoSource[] | AudioSource[];
  poster?: string;
  tracks?: Track[];
}

export interface PlyrQuality {
  default?: number;
  options: number[];
  forced?: boolean;
  onChange?: (quality: number) => void;
}

export interface PlyrSpeed {
  selected?: number;
  options: number[];
}
```

## 最佳实践

### 1. 响应式设计
```typescript
const options: Plyr.Options = {
  ratio: '16:9',
  fitvids: true,
  fullscreen: {
    enabled: true,
    fallback: true,
    iosNative: true,
  },
};
```

### 2. 无障碍性
```typescript
const options: Plyr.Options = {
  captions: {
    active: true,
    language: 'auto',
    update: true,
  },
  keyboard: {
    focused: true,
    global: true,
  },
  tooltips: {
    controls: true,
    seek: true,
  },
};
```

### 3. 广告集成
```typescript
const options: Plyr.Options = {
  ads: {
    enabled: true,
    publisherId: '123456789',
    tagUrl: 'https://ads.example.com/vmap.xml',
  },
};
```

## 常用命令

### 安装
```bash
# 安装 Plyr
npm install plyr

# 安装 TypeScript 类型
npm install -D @types/plyr

# 安装 HLS.js
npm install hls.js

# 安装 Dash.js
npm install dashjs

# 安装 React 集成
npm install plyr-react
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
  "name": "plyr-project",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "plyr": "^3.7.8",
    "hls.js": "^1.5.0",
    "dashjs": "^4.7.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/plyr": "^3.7.0",
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
});
```

### 环境变量
```bash
# .env
VITE_API_URL=https://api.example.com
VITE_MEDIA_CDN=https://cdn.example.com/media
```
