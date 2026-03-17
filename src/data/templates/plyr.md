# Plyr 视频播放器模板

## 技术栈

- **核心**: Plyr 3.x
- **媒体格式**: HTML5 Video / Audio / YouTube / Vimeo
- **UI**: CSS 自定义主题
- **扩展**: plyr-react / vue-plyr
- **功能**: 字幕 / 画质切换 / 倍速播放 / 画中画

## 项目结构

```
plyr-project/
├── src/
│   ├── components/
│   │   ├── VideoPlayer.tsx       # 视频播放器
│   │   ├── AudioPlayer.tsx       # 音频播放器
│   │   ├── YouTubePlayer.tsx     # YouTube 播放器
│   │   ├── VimeoPlayer.tsx       # Vimeo 播放器
│   │   ├── PlaylistPlayer.tsx    # 播放列表
│   │   └── CustomControls.tsx    # 自定义控制
│   ├── hooks/
│   │   ├── usePlyr.ts            # Plyr hook
│   │   ├── useFullscreen.ts      # 全屏控制
│   │   └── useKeyboard.ts        # 键盘快捷键
│   ├── themes/
│   │   ├── default.css           # 默认主题
│   │   ├── dark.css              # 暗色主题
│   │   └── minimal.css           # 极简主题
│   └── utils/
│       ├── formatTime.ts         # 时间格式化
│       └── qualitySelector.ts    # 画质选择
├── public/
│   ├── videos/                   # 视频文件
│   └── subtitles/                # 字幕文件
├── package.json
└── tsconfig.json
```

## 代码模式

### 基础视频播放器

```typescript
// components/VideoPlayer.tsx
import React, { useEffect, useRef } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  subtitles?: Array<{
    src: string;
    label: string;
    srclang: string;
  }>;
  options?: Plyr.Options;
  onReady?: (player: Plyr) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  subtitles = [],
  options = {},
  onReady,
  onPlay,
  onPause,
  onEnd,
  onTimeUpdate,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    // 初始化 Plyr
    playerRef.current = new Plyr(videoRef.current, {
      controls: [
        'play-large',
        'play',
        'progress',
        'current-time',
        'mute',
        'volume',
        'captions',
        'settings',
        'pip',
        'airplay',
        'fullscreen',
      ],
      ratio: '16:9',
      ...options,
    });

    // 事件监听
    const player = playerRef.current;

    if (onReady) {
      player.on('ready', () => onReady(player));
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
        onTimeUpdate(player.currentTime);
      });
    }

    return () => {
      player.destroy();
    };
  }, []);

  return (
    <div className="plyr__video-embed">
      <video
        ref={videoRef}
        poster={poster}
        controls
        crossOrigin="anonymous"
        playsInline
      >
        <source src={src} type="video/mp4" />
        
        {subtitles.map((sub, index) => (
          <track
            key={index}
            kind="captions"
            label={sub.label}
            src={sub.src}
            srclang={sub.srclang}
          />
        ))}
        
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

// 使用示例
function App() {
  return (
    <VideoPlayer
      src="/videos/demo.mp4"
      poster="/images/poster.jpg"
      subtitles={[
        {
          src: '/subtitles/en.vtt',
          label: 'English',
          srclang: 'en',
        },
        {
          src: '/subtitles/zh.vtt',
          label: '中文',
          srclang: 'zh',
        },
      ]}
      options={{
        quality: {
          default: 720,
          options: [4320, 2880, 2160, 1440, 1080, 720, 576, 480, 360, 240],
        },
      }}
      onPlay={() => console.log('Video playing')}
      onPause={() => console.log('Video paused')}
    />
  );
}
```

### React Hook

```typescript
// hooks/usePlyr.ts
import { useEffect, useRef, useState } from 'react';
import Plyr from 'plyr';

interface UsePlyrOptions {
  src: string;
  options?: Plyr.Options;
  autoplay?: boolean;
}

export function usePlyr({ src, options = {}, autoplay = false }: UsePlyrOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;

    playerRef.current = new Plyr(videoRef.current, options);

    const player = playerRef.current;

    player.on('play', () => setIsPlaying(true));
    player.on('pause', () => setIsPlaying(false));
    player.on('timeupdate', () => setCurrentTime(player.currentTime));
    player.on('loadedmetadata', () => setDuration(player.duration));
    player.on('volumechange', () => {
      setVolume(player.volume);
      setMuted(player.muted);
    });

    return () => {
      player.destroy();
    };
  }, [options]);

  // 控制方法
  const play = () => playerRef.current?.play();
  const pause = () => playerRef.current?.pause();
  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };
  const seek = (time: number) => {
    if (playerRef.current) {
      playerRef.current.currentTime = time;
    }
  };
  const setPlayerVolume = (vol: number) => {
    if (playerRef.current) {
      playerRef.current.volume = vol;
    }
  };
  const toggleMute = () => {
    if (playerRef.current) {
      playerRef.current.muted = !playerRef.current.muted;
    }
  };
  const enterFullscreen = () => playerRef.current?.fullscreen.enter();
  const exitFullscreen = () => playerRef.current?.fullscreen.exit();

  return {
    videoRef,
    player: playerRef.current,
    isPlaying,
    currentTime,
    duration,
    volume,
    muted,
    play,
    pause,
    togglePlay,
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
  } = usePlyr({
    src: '/video.mp4',
    options: { controls: [] }, // 隐藏默认控制
  });

  return (
    <div>
      <video ref={videoRef} />
      
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

### YouTube 播放器

```typescript
// components/YouTubePlayer.tsx
import React, { useEffect, useRef } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';

interface YouTubePlayerProps {
  videoId: string;
  options?: Plyr.Options;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  options = {},
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Plyr | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    playerRef.current = new Plyr(containerRef.current, {
      ...options,
    });

    return () => {
      playerRef.current?.destroy();
    };
  }, [videoId]);

  return (
    <div ref={containerRef} className="plyr__video-embed">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?origin=https://plyr.io&amp;iv_load_policy=3&amp;modestbranding=1&amp;playsinline=1&amp;showinfo=0&amp;rel=0&amp;enablejsapi=1`}
        allowFullScreen
        allow="autoplay; encrypted-media"
        title="YouTube video"
      />
    </div>
  );
};

// 使用示例
<YouTubePlayer videoId="bTqVqk7FSmY" />
```

### 多画质切换

```typescript
// components/QualityPlayer.tsx
import React, { useEffect, useRef } from 'react';
import Plyr from 'plyr';

interface QualitySource {
  src: string;
  type: string;
  size: number;
}

interface QualityPlayerProps {
  sources: QualitySource[];
  poster?: string;
}

export const QualityPlayer: React.FC<QualityPlayerProps> = ({
  sources,
  poster,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    playerRef.current = new Plyr(videoRef.current, {
      quality: {
        default: sources[0].size,
        options: sources.map(s => s.size).reverse(),
        forced: true,
        onChange: (newQuality) => {
          // 画质切换时保存当前时间
          const currentTime = playerRef.current?.currentTime || 0;
          const isPlaying = playerRef.current?.playing || false;

          // 更新源
          const source = sources.find(s => s.size === newQuality);
          if (source && videoRef.current) {
            videoRef.current.src = source.src;
            videoRef.current.currentTime = currentTime;
            
            if (isPlaying) {
              videoRef.current.play();
            }
          }
        },
      },
      i18n: {
        qualityLabel: {
          1080: '1080p',
          720: '720p',
          480: '480p',
          360: '360p',
        },
      },
    });

    return () => {
      playerRef.current?.destroy();
    };
  }, [sources]);

  return (
    <video
      ref={videoRef}
      poster={poster}
      controls
    >
      {sources.map((source, index) => (
        <source
          key={index}
          src={source.src}
          type={source.type}
          size={source.size}
        />
      ))}
    </video>
  );
};

// 使用示例
<QualityPlayer
  sources={[
    { src: '/video-1080.mp4', type: 'video/mp4', size: 1080 },
    { src: '/video-720.mp4', type: 'video/mp4', size: 720 },
    { src: '/video-480.mp4', type: 'video/mp4', size: 480 },
    { src: '/video-360.mp4', type: 'video/mp4', size: 360 },
  ]}
  poster="/poster.jpg"
/>
```

### 播放列表

```typescript
// components/PlaylistPlayer.tsx
import React, { useState, useEffect, useRef } from 'react';
import Plyr from 'plyr';

interface PlaylistItem {
  src: string;
  poster?: string;
  title: string;
  duration?: string;
}

interface PlaylistPlayerProps {
  items: PlaylistItem[];
  autoAdvance?: boolean;
}

export const PlaylistPlayer: React.FC<PlaylistPlayerProps> = ({
  items,
  autoAdvance = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!videoRef.current) return;

    playerRef.current = new Plyr(videoRef.current);

    const player = playerRef.current;

    // 自动播放下一个
    if (autoAdvance) {
      player.on('ended', () => {
        if (currentIndex < items.length - 1) {
          setCurrentIndex(currentIndex + 1);
        }
      });
    }

    return () => {
      player.destroy();
    };
  }, [currentIndex, autoAdvance]);

  // 切换视频时更新源
  useEffect(() => {
    if (videoRef.current && items[currentIndex]) {
      videoRef.current.src = items[currentIndex].src;
      playerRef.current?.play();
    }
  }, [currentIndex]);

  const playItem = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="playlist-player">
      <div className="player-wrapper">
        <video ref={videoRef} poster={items[currentIndex]?.poster} controls />
      </div>

      <div className="playlist">
        {items.map((item, index) => (
          <div
            key={index}
            className={`playlist-item ${index === currentIndex ? 'active' : ''}`}
            onClick={() => playItem(index)}
          >
            <img src={item.poster} alt={item.title} />
            <div className="info">
              <h4>{item.title}</h4>
              {item.duration && <span>{item.duration}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 音频播放器

```typescript
// components/AudioPlayer.tsx
import React, { useEffect, useRef } from 'react';
import Plyr from 'plyr';

interface AudioPlayerProps {
  src: string;
  title?: string;
  artist?: string;
  artwork?: string;
  options?: Plyr.Options;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  title,
  artist,
  artwork,
  options = {},
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<Plyr | null>(null);

  useEffect(() => {
    if (!audioRef.current) return;

    playerRef.current = new Plyr(audioRef.current, {
      controls: [
        'play',
        'progress',
        'current-time',
        'duration',
        'mute',
        'volume',
      ],
      ...options,
    });

    return () => {
      playerRef.current?.destroy();
    };
  }, []);

  return (
    <div className="audio-player">
      {artwork && (
        <div className="artwork">
          <img src={artwork} alt={title} />
        </div>
      )}
      
      <div className="info">
        {title && <h3>{title}</h3>}
        {artist && <p>{artist}</p>}
      </div>

      <audio ref={audioRef}>
        <source src={src} type="audio/mp3" />
      </audio>
    </div>
  );
};
```

## 最佳实践

### 1. 自定义主题

```css
/* themes/dark.css */
.plyr {
  --plyr-color-main: #1ac266;
  --plyr-video-background: #000;
  --plyr-video-control-background: rgba(0, 0, 0, 0.7);
  --plyr-video-control-color: #fff;
  --plyr-video-control-color-hover: #fff;
  --plyr-video-progress-background: rgba(255, 255, 255, 0.25);
  --plyr-video-progress-buffered-background: rgba(255, 255, 255, 0.25);
  --plyr-audio-progress-background: rgba(183, 197, 193, 0.25);
}

.plyr--full-ui.plyr--video .plyr__control--overlaid {
  background-color: var(--plyr-color-main);
  border-radius: 50%;
}

.plyr__control--overlaid:focus {
  background: var(--plyr-color-main);
}

.plyr__control--overlaid:hover {
  background: var(--plyr-color-main);
}
```

### 2. 键盘快捷键

```typescript
// hooks/useKeyboard.ts
import { useEffect } from 'react';

export function useKeyboardShortcuts(player: Plyr | null) {
  useEffect(() => {
    if (!player) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case ' ':
        case 'k':
          event.preventDefault();
          player.togglePlay();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          player.currentTime -= 10;
          break;
        case 'ArrowRight':
          event.preventDefault();
          player.currentTime += 10;
          break;
        case 'ArrowUp':
          event.preventDefault();
          player.volume = Math.min(1, player.volume + 0.1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          player.volume = Math.max(0, player.volume - 0.1);
          break;
        case 'm':
          player.muted = !player.muted;
          break;
        case 'f':
          player.fullscreen.toggle();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [player]);
}

// 使用
function PlayerWithShortcuts() {
  const { player } = usePlyr({ src: '/video.mp4' });
  
  useKeyboardShortcuts(player);
  
  return <video ref={videoRef} />;
}
```

### 3. 时间格式化

```typescript
// utils/formatTime.ts
export function formatTime(seconds: number): string {
  if (seconds === 0 || isNaN(seconds)) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// 使用
const formatted = formatTime(125); // "2:05"
const formatted2 = formatTime(3725); // "1:02:05"
```

### 4. 响应式设计

```typescript
// components/ResponsivePlayer.tsx
import React, { useEffect, useRef, useState } from 'react';
import Plyr from 'plyr';

export const ResponsivePlayer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);
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

    playerRef.current = new Plyr(videoRef.current, {
      controls: isMobile
        ? ['play-large', 'play', 'fullscreen']
        : [
            'play-large',
            'play',
            'progress',
            'current-time',
            'mute',
            'volume',
            'settings',
            'fullscreen',
          ],
      hideControls: isMobile ? false : true,
    });

    return () => {
      playerRef.current?.destroy();
    };
  }, [isMobile]);

  return (
    <div className="responsive-player">
      <video ref={videoRef} src="/video.mp4" />
    </div>
  );
};
```

## 常用命令

```bash
# 安装
npm install plyr

# React 封装
npm install plyr-react

# Vue 封装
npm install vue-plyr

# TypeScript 支持
npm install @types/plyr -D

# CSS 主题
import 'plyr/dist/plyr.css'
```

## 部署配置

### Next.js 配置

```typescript
// next.config.js
const nextConfig = {
  // 支持视频文件
  headers: async () => [
    {
      source: '/videos/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
};

module.exports = nextConfig;
```

### CDN 配置

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/plyr@3/dist/plyr.css" />
<script src="https://cdn.jsdelivr.net/npm/plyr@3/dist/plyr.min.js"></script>
```

### HLS 流媒体

```typescript
import Hls from 'hls.js';
import Plyr from 'plyr';

function HLSPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    // 初始化 Plyr
    const player = new Plyr(video, {
      controls: [
        'play-large',
        'play',
        'progress',
        'current-time',
        'mute',
        'volume',
        'settings',
        'fullscreen',
      ],
      settings: ['captions', 'quality', 'speed'],
    });

    // 初始化 HLS
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource('https://example.com/stream.m3u8');
      hls.attachMedia(video);

      // 质量切换
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const levels = hls.levels.map((level, index) => ({
          index,
          label: level.height + 'p',
        }));

        // 更新 Plyr 质量选项
        player.quality = levels;
      });
    }

    return () => {
      player.destroy();
    };
  }, []);

  return <video ref={videoRef} controls />;
}
```

### 服务端渲染

```typescript
// components/SSRPlayer.tsx
import React from 'react';

export const SSRPlayer = () => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="player-placeholder">Loading player...</div>;
  }

  // 动态导入 Plyr
  const PlyrComponent = React.lazy(() => import('./PlyrComponent'));

  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <PlyrComponent />
    </React.Suspense>
  );
};
```

## 扩展资源

- [Plyr 官方文档](https://plyr.io/)
- [GitHub 仓库](https://github.com/sampotts/plyr)
- [React Plyr](https://github.com/chintan9/plyr-react)
- [HLS.js 集成](https://github.com/video-dev/hls.js/)
- [自定义主题示例](https://codepen.io/sampotts/pen/JKEMqB)
