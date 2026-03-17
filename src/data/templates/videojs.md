# Video.js 播放器模板

## 技术栈

- **核心**: Video.js 8.x
- **格式支持**: HTML5 Video / HLS / DASH / YouTube / Vimeo
- **插件**: videojs-hls / videojs-contrib-ads / videojs-ima
- **主题**: Video.js Skins / 自定义 CSS
- **功能**: 广告 / 分析 / 字幕 / 360° 视频

## 项目结构

```
videojs-project/
├── src/
│   ├── components/
│   │   ├── VideoPlayer.tsx        # 主播放器
│   │   ├── HLSPlayer.tsx          # HLS 流媒体
│   │   ├── DASHPlayer.tsx         # DASH 流媒体
│   │   ├── YouTubePlayer.tsx      # YouTube 播放器
│   │   ├── AdsPlayer.tsx          # 广告播放器
│   │   └── VRPlayer.tsx           # 360° 视频
│   ├── plugins/
│   │   ├── watermark.ts           # 水印插件
│   │   ├── hotkeys.ts             # 快捷键插件
│   │   ├── seekButtons.ts         # 跳转按钮
│   │   └── overlay.ts             # 覆盖层插件
│   ├── themes/
│   │   ├── netflix.css            # Netflix 主题
│   │   ├── youtube.css            # YouTube 主题
│   │   └── minimal.css            # 极简主题
│   ├── hooks/
│   │   ├── useVideoJS.ts          # Video.js hook
│   │   └── usePlayerEvents.ts     # 事件 hook
│   └── utils/
│       ├── analytics.ts           # 分析工具
│       ├── qualityLevels.ts       # 画质管理
│       └── storage.ts             # 本地存储
├── public/
│   ├── videos/                    # 视频文件
│   └── subtitles/                 # 字幕文件
├── package.json
└── tsconfig.json
```

## 代码模式

### 基础播放器

```typescript
// components/VideoPlayer.tsx
import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  options: videojs.PlayerOptions;
  onReady?: (player: videojs.Player) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  options,
  onReady,
  onPlay,
  onPause,
  onEnd,
  onTimeUpdate,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<videojs.Player | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    // 初始化 Video.js
    playerRef.current = videojs(videoRef.current, {
      controls: true,
      autoplay: false,
      preload: 'auto',
      fluid: true,
      responsive: true,
      playbackRates: [0.5, 1, 1.25, 1.5, 2],
      controlBar: {
        children: [
          'playToggle',
          'volumePanel',
          'currentTimeDisplay',
          'timeDivider',
          'durationDisplay',
          'progressControl',
          'playbackRateMenuButton',
          'fullscreenToggle',
        ],
      },
      ...options,
    });

    const player = playerRef.current;

    // 事件监听
    if (onReady) {
      player.ready(() => {
        onReady(player);
      });
    }

    if (onPlay) {
      player.on('play', onPlay);
    }

    if (onPause) {
      player.on('pause', onPause);
    }

    if (onEnd) {
      player.on('ended', onEnd);
    }

    if (onTimeUpdate) {
      player.on('timeupdate', () => {
        onTimeUpdate(player.currentTime() || 0);
      });
    }

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
      }
    };
  }, [options]);

  return (
    <div data-vjs-player>
      <video
        ref={videoRef}
        className="video-js vjs-big-play-centered vjs-theme-city"
      />
    </div>
  );
};

// 使用示例
function App() {
  const playerOptions = {
    sources: [
      {
        src: '/videos/demo.mp4',
        type: 'video/mp4',
      },
    ],
    poster: '/images/poster.jpg',
    tracks: [
      {
        kind: 'captions',
        src: '/subtitles/en.vtt',
        srclang: 'en',
        label: 'English',
        default: true,
      },
      {
        kind: 'captions',
        src: '/subtitles/zh.vtt',
        srclang: 'zh',
        label: '中文',
      },
    ],
  };

  return (
    <VideoPlayer
      options={playerOptions}
      onReady={(player) => console.log('Player ready', player)}
      onPlay={() => console.log('Playing')}
      onPause={() => console.log('Paused')}
    />
  );
}
```

### React Hook

```typescript
// hooks/useVideoJS.ts
import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';

interface UseVideoJSOptions {
  sources: Array<{ src: string; type: string }>;
  poster?: string;
  autoplay?: boolean;
  controls?: boolean;
  responsive?: boolean;
  fluid?: boolean;
}

export function useVideoJS(options: UseVideoJSOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<videojs.Player | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;

    playerRef.current = videojs(videoRef.current, options);

    const player = playerRef.current;

    player.ready(() => {
      setIsReady(true);
    });

    player.on('play', () => setIsPlaying(true));
    player.on('pause', () => setIsPlaying(false));
    player.on('timeupdate', () => setCurrentTime(player.currentTime() || 0));
    player.on('loadedmetadata', () => setDuration(player.duration() || 0));
    player.on('volumechange', () => {
      setVolume(player.volume());
      setMuted(player.muted());
    });

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
      }
    };
  }, []);

  // 控制方法
  const play = () => playerRef.current?.play();
  const pause = () => playerRef.current?.pause();
  const seek = (time: number) => playerRef.current?.currentTime(time);
  const setPlayerVolume = (vol: number) => playerRef.current?.volume(vol);
  const toggleMute = () => playerRef.current?.muted(!muted);
  const enterFullscreen = () => playerRef.current?.requestFullscreen();
  const exitFullscreen = () => playerRef.current?.exitFullscreen();

  return {
    videoRef,
    player: playerRef.current,
    isReady,
    isPlaying,
    currentTime,
    duration,
    volume,
    muted,
    play,
    pause,
    seek,
    setVolume: setPlayerVolume,
    toggleMute,
    enterFullscreen,
    exitFullscreen,
  };
}

// 使用示例
function CustomPlayer() {
  const {
    videoRef,
    isPlaying,
    currentTime,
    duration,
    play,
    pause,
    seek,
  } = useVideoJS({
    sources: [{ src: '/video.mp4', type: 'video/mp4' }],
    controls: false,
  });

  return (
    <div>
      <video ref={videoRef} className="video-js" />
      
      <div className="custom-controls">
        <button onClick={isPlaying ? pause : play}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        
        <input
          type="range"
          min={0}
          max={duration}
          value={currentTime}
          onChange={(e) => seek(Number(e.target.value))}
        />
      </div>
    </div>
  );
}
```

### HLS 流媒体

```typescript
// components/HLSPlayer.tsx
import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'videojs-contrib-quality-menu';
import 'videojs-hls-support';

interface HLSPlayerProps {
  src: string;
  poster?: string;
}

export const HLSPlayer: React.FC<HLSPlayerProps> = ({ src, poster }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<videojs.Player | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    playerRef.current = videojs(videoRef.current, {
      sources: [
        {
          src,
          type: 'application/x-mpegURL',
        },
      ],
      poster,
      html5: {
        vhs: {
          overrideNative: true,
          enableLowInitialPlaylist: true,
          smoothQualityChange: true,
          fastQualityChange: true,
        },
        nativeAudioTracks: false,
        nativeVideoTracks: false,
      },
      plugins: {
        qualityMenu: {},
      },
    });

    const player = playerRef.current;

    // 监听质量变化
    player.on('loadedmetadata', () => {
      const qualityLevels = player.qualityLevels();
      
      console.log('Available quality levels:', qualityLevels.length);
      
      qualityLevels.on('change', () => {
        console.log('Quality changed');
      });
    });

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
      }
    };
  }, [src]);

  return (
    <div data-vjs-player>
      <video ref={videoRef} className="video-js vjs-theme-city" />
    </div>
  );
};

// 使用示例
<HLSPlayer
  src="https://example.com/stream.m3u8"
  poster="/poster.jpg"
/>
```

### DASH 流媒体

```typescript
// components/DASHPlayer.tsx
import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'dashjs';

interface DASHPlayerProps {
  src: string;
  poster?: string;
}

export const DASHPlayer: React.FC<DASHPlayerProps> = ({ src, poster }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<videojs.Player | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    playerRef.current = videojs(videoRef.current, {
      sources: [
        {
          src,
          type: 'application/dash+xml',
        },
      ],
      poster,
      html5: {
        dash: {
          overrideNative: true,
        },
      },
    });

    const player = playerRef.current;

    // 监听质量变化
    player.on('loadedmetadata', () => {
      const qualityLevels = player.qualityLevels();
      
      qualityLevels.on('change', () => {
        console.log('Quality changed');
      });
    });

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
      }
    };
  }, [src]);

  return (
    <div data-vjs-player>
      <video ref={videoRef} className="video-js" />
    </div>
  );
};
```

### 广告集成

```typescript
// components/AdsPlayer.tsx
import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'videojs-contrib-ads';
import 'videojs-ima';

interface AdsPlayerProps {
  contentSrc: string;
  adTagUrl: string;
}

export const AdsPlayer: React.FC<AdsPlayerProps> = ({
  contentSrc,
  adTagUrl,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<videojs.Player | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    playerRef.current = videojs(videoRef.current, {
      sources: [{ src: contentSrc, type: 'video/mp4' }],
    });

    const player = playerRef.current;

    // 初始化广告
    player.ima({
      adTagUrl,
      debug: true,
    });

    // 广告事件
    player.on('adsready', () => {
      console.log('Ads ready');
    });

    player.on('adsstart', () => {
      console.log('Ad started');
    });

    player.on('adsend', () => {
      console.log('Ad ended');
    });

    player.on('adskip', () => {
      console.log('Ad skipped');
    });

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
      }
    };
  }, [contentSrc, adTagUrl]);

  return (
    <div data-vjs-player>
      <video ref={videoRef} className="video-js" />
    </div>
  );
};
```

### 自定义插件

```typescript
// plugins/watermark.ts
import videojs from 'video.js';

const Plugin = videojs.getPlugin('plugin');

class WatermarkPlugin extends Plugin {
  constructor(player: videojs.Player, options: any) {
    super(player, options);

    const watermark = videojs.dom.createEl('div', {
      className: 'vjs-watermark',
      innerHTML: options.text || '',
    });

    Object.assign(watermark.style, {
      position: 'absolute',
      bottom: '50px',
      right: '20px',
      color: 'rgba(255, 255, 255, 0.5)',
      fontSize: '14px',
      fontFamily: 'Arial',
      pointerEvents: 'none',
      zIndex: 1,
    });

    player.el().appendChild(watermark);
  }
}

videojs.registerPlugin('watermark', WatermarkPlugin);

// 使用
player.watermark({ text: '© 2024 My Company' });

// plugins/hotkeys.ts
class HotkeysPlugin extends Plugin {
  constructor(player: videojs.Player, options: any) {
    super(player, options);

    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          if (player.paused()) {
            player.play();
          } else {
            player.pause();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          player.currentTime(player.currentTime() - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          player.currentTime(player.currentTime() + 10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          player.volume(Math.min(1, player.volume() + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          player.volume(Math.max(0, player.volume() - 0.1));
          break;
        case 'm':
          player.muted(!player.muted());
          break;
        case 'f':
          if (player.isFullscreen()) {
            player.exitFullscreen();
          } else {
            player.requestFullscreen();
          }
          break;
      }
    });
  }
}

videojs.registerPlugin('hotkeys', HotkeysPlugin);
```

## 最佳实践

### 1. 自定义主题

```css
/* themes/netflix.css */
.video-js.vjs-theme-netflix {
  --vjs-theme-netflix-primary: #e50914;
  --vjs-theme-netflix-secondary: #141414;
}

.video-js.vjs-theme-netflix .vjs-big-play-button {
  background-color: var(--vjs-theme-netflix-primary);
  border: none;
  border-radius: 4px;
  width: 80px;
  height: 80px;
  line-height: 80px;
  font-size: 40px;
}

.video-js.vjs-theme-netflix .vjs-control-bar {
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  height: 60px;
}

.video-js.vjs-theme-netflix .vjs-play-progress {
  background-color: var(--vjs-theme-netflix-primary);
}

.video-js.vjs-theme-netflix .vjs-volume-level {
  background-color: var(--vjs-theme-netflix-primary);
}
```

### 2. 分析集成

```typescript
// utils/analytics.ts
import videojs from 'video.js';

export function setupAnalytics(player: videojs.Player) {
  let playCount = 0;
  let totalWatchTime = 0;
  let lastTimeUpdate = 0;

  player.on('play', () => {
    playCount++;
    lastTimeUpdate = Date.now();
    sendAnalytics('play', {
      playCount,
      currentTime: player.currentTime(),
    });
  });

  player.on('pause', () => {
    const watchTime = (Date.now() - lastTimeUpdate) / 1000;
    totalWatchTime += watchTime;
    sendAnalytics('pause', {
      totalWatchTime,
      currentTime: player.currentTime(),
    });
  });

  player.on('ended', () => {
    sendAnalytics('completed', {
      playCount,
      totalWatchTime,
      duration: player.duration(),
    });
  });

  player.on('qualitychange', () => {
    sendAnalytics('quality_change', {
      quality: player.qualityLevels()[player.qualityLevels().selectedIndex],
    });
  });

  player.on('error', () => {
    const error = player.error();
    sendAnalytics('error', {
      code: error?.code,
      message: error?.message,
    });
  });
}

async function sendAnalytics(event: string, data: any) {
  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data, timestamp: Date.now() }),
    });
  } catch (error) {
    console.error('Analytics error:', error);
  }
}
```

### 3. 本地存储

```typescript
// utils/storage.ts
import videojs from 'video.js';

export function setupStorage(player: videojs.Player, videoId: string) {
  const storageKey = `videojs-${videoId}`;

  // 恢复播放进度
  const savedTime = localStorage.getItem(`${storageKey}-time`);
  if (savedTime) {
    player.currentTime(parseFloat(savedTime));
  }

  // 恢复音量
  const savedVolume = localStorage.getItem(`${storageKey}-volume`);
  if (savedVolume) {
    player.volume(parseFloat(savedVolume));
  }

  // 保存播放进度
  player.on('timeupdate', () => {
    const currentTime = player.currentTime();
    localStorage.setItem(`${storageKey}-time`, currentTime.toString());
  });

  // 保存音量
  player.on('volumechange', () => {
    const volume = player.volume();
    localStorage.setItem(`${storageKey}-volume`, volume.toString());
  });

  // 清除完成的视频进度
  player.on('ended', () => {
    localStorage.removeItem(`${storageKey}-time`);
  });
}
```

### 4. 响应式设计

```typescript
// components/ResponsivePlayer.tsx
import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';

export const ResponsivePlayer: React.FC<{ src: string }> = ({ src }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<videojs.Player | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;

    playerRef.current = videojs(videoRef.current, {
      sources: [{ src, type: 'video/mp4' }],
      fluid: true,
      responsive: true,
      controls: !isMobile,
      controlBar: isMobile
        ? false
        : {
            children: [
              'playToggle',
              'volumePanel',
              'currentTimeDisplay',
              'timeDivider',
              'durationDisplay',
              'progressControl',
              'fullscreenToggle',
            ],
          },
    });

    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
      }
    };
  }, [src, isMobile]);

  return (
    <div data-vjs-player>
      <video
        ref={videoRef}
        className={`video-js ${isMobile ? 'vjs-mobile' : 'vjs-desktop'}`}
      />
    </div>
  );
};
```

## 常用命令

```bash
# 安装
npm install video.js

# TypeScript 支持
npm install @types/video.js -D

# HLS 支持
npm install videojs-contrib-quality-menu

# DASH 支持
npm install dashjs

# 广告支持
npm install videojs-contrib-ads videojs-ima

# 主题
npm install @videojs/themes
```

## 部署配置

### CDN 引入

```html
<link href="https://vjs.zencdn.net/8.10.0/video-js.css" rel="stylesheet" />
<script src="https://vjs.zencdn.net/8.10.0/video.min.js"></script>

<!-- HLS 支持 -->
<script src="https://cdn.jsdelivr.net/npm/videojs-hls-support@1.0.0/dist/videojs-hls-support.min.js"></script>

<script>
  const player = videojs('my-video', {
    controls: true,
    autoplay: false,
    preload: 'auto',
    sources: [{
      src: 'video.mp4',
      type: 'video/mp4'
    }]
  });
</script>
```

### Next.js 配置

```typescript
// components/DynamicVideoPlayer.tsx
import React from 'react';
import dynamic from 'next/dynamic';

const VideoPlayer = dynamic(() => import('./VideoPlayer'), { ssr: false });

export function DynamicVideoPlayer(props: any) {
  return <VideoPlayer {...props} />;
}
```

### 服务端渲染

```typescript
// components/SSRPlayer.tsx
import React, { useEffect, useRef } from 'react';

export const SSRPlayer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    // 动态导入 video.js
    import('video.js').then((videojs) => {
      const video = document.createElement('video');
      video.className = 'video-js vjs-theme-city';
      video.setAttribute('playsInline', 'true');
      
      containerRef.current?.appendChild(video);

      const player = videojs.default(video, {
        sources: [{ src: '/video.mp4', type: 'video/mp4' }],
      });

      return () => {
        player.dispose();
      };
    });
  }, [mounted]);

  return <div ref={containerRef} />;
};
```

### Nginx 配置

```nginx
# nginx.conf
server {
  location /videos/ {
    # 支持 Range 请求
    add_header Accept-Ranges bytes;
    
    # 启用缓存
    add_header Cache-Control "public, max-age=31536000";
    
    # HLS 支持
    types {
      application/vnd.apple.mpegurl m3u8;
      video/mp2t ts;
    }
  }

  location /hls/ {
    # HLS 流媒体配置
    types {
      application/vnd.apple.mpegurl m3u8;
    }
    
    add_header Cache-Control no-cache;
    add_header Access-Control-Allow-Origin *;
  }
}
```

## 扩展资源

- [Video.js 官方文档](https://videojs.com/)
- [GitHub 仓库](https://github.com/videojs/video.js)
- [插件列表](https://videojs.com/plugins/)
- [主题集合](https://github.com/videojs/themes)
- [HLS 指南](https://docs.videojs.com/tutorial-videojs.html#hls)
