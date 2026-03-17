# React Player 模板

## 技术栈
- **React Player** - React 组件用于播放各种媒体 URL
- **TypeScript** - 完整类型支持
- **React** - React 生态系统
- **多种平台支持** - YouTube, Vimeo, Soundcloud, Facebook 等
- **自定义播放器** - 支持自定义控制和样式

## 项目结构
```
react-player-project/
├── src/
│   ├── components/
│   │   ├── VideoPlayer.tsx
│   │   ├── AudioPlayer.tsx
│   │   ├── YouTubePlayer.tsx
│   │   ├── VimeoPlayer.tsx
│   │   ├── SoundCloudPlayer.tsx
│   │   ├── MediaPlayer.tsx
│   │   └── PlayerControls.tsx
│   ├── hooks/
│   │   ├── usePlayer.ts
│   │   └── usePlayerState.ts
│   ├── utils/
│ │   ├── parsers.ts
│   │   └── validators.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── tsconfig.json
```

## 代码模式

### 基础播放器组件
```typescript
// src/components/VideoPlayer.tsx
import { useRef, useState, useCallback } from 'react';
import ReactPlayer from 'react-player';
import type { ReactPlayerProps } from 'react-player';

export interface VideoPlayerProps extends Partial<ReactPlayerProps> {
  url: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: any) => void;
  onProgress?: (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => void;
  onDuration?: (duration: number) => void;
  onReady?: () => void;
  onStart?: () => void;
  showControls?: boolean;
  light?: boolean | string;
  pip?: boolean;
}

export function VideoPlayer({
  url,
  onPlay,
  onPause,
  onEnded,
  onError,
  onProgress,
  onDuration,
  onReady,
  onStart,
  showControls = true,
  light = false,
  pip = true,
  ...rest
}: VideoPlayerProps) {
  const playerRef = useRef<ReactPlayer>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);

  const handlePlay = useCallback(() => {
    setPlaying(true);
    onPlay?.();
  }, [onPlay]);

  const handlePause = useCallback(() => {
    setPlaying(false);
    onPause?.();
  }, [onPause]);

  const handleEnded = useCallback(() => {
    setPlaying(false);
    onEnded?.();
  }, [onEnded]);

  const handleProgress = useCallback((state: any) => {
    if (!seeking) {
      setPlayed(state.played);
    }
    onProgress?.(state);
  }, [seeking, onProgress]);

  const handleDuration = useCallback((dur: number) => {
    setDuration(dur);
    onDuration?.(dur);
  }, [onDuration]);

  const handleSeekChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayed(parseFloat(e.target.value));
  }, []);

  const handleSeekMouseDown = useCallback(() => {
    setSeeking(true);
  }, []);

  const handleSeekMouseUp = useCallback((e: React.MouseEvent<HTMLInputElement>) => {
    setSeeking(false);
    playerRef.current?.seekTo(parseFloat((e.target as HTMLInputElement).value));
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  }, []);

  const handleMute = useCallback(() => {
    setMuted(!muted);
  }, [muted]);

  const play = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => setPlaying(false), []);
  const togglePlay = useCallback(() => setPlaying((prev) => !prev), []);

  const seekTo = useCallback((time: number) => {
    playerRef.current?.seekTo(time);
  }, []);

  return (
    <div className="video-player">
      <ReactPlayer
        ref={playerRef}
        url={url}
        playing={playing}
        volume={volume}
        muted={muted}
        controls={showControls}
        light={light}
        pip={pip}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={onError}
        onProgress={handleProgress}
        onDuration={handleDuration}
        onReady={onReady}
        onStart={onStart}
        width="100%"
        height="auto"
        {...rest}
      />
    </div>
  );
}
```

### 音频播放器
```typescript
// src/components/AudioPlayer.tsx
import { useRef, useState, useCallback } from 'react';
import ReactPlayer from 'react-player';

export interface AudioPlayerProps {
  url: string;
  title?: string;
  artist?: string;
  cover?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onProgress?: (state: { played: number; playedSeconds: number }) => void;
}

export function AudioPlayer({
  url,
  title,
  artist,
  cover,
  onPlay,
  onPause,
  onEnded,
  onProgress,
}: AudioPlayerProps) {
  const playerRef = useRef<ReactPlayer>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loaded, setLoaded] = useState(0);

  const handlePlayPause = useCallback(() => {
    setPlaying((prev) => !prev);
  }, []);

  const handleStop = useCallback(() => {
    setPlaying(false);
    playerRef.current?.seekTo(0);
  }, []);

  const handleProgress = useCallback((state: any) => {
    setPlayed(state.played);
    setLoaded(state.loaded);
    onProgress?.(state);
  }, [onProgress]);

  const handleDuration = useCallback((dur: number) => {
    setDuration(dur);
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayed(parseFloat(e.target.value));
  }, []);

  const handleSeekMouseUp = useCallback((e: React.MouseEvent<HTMLInputElement>) => {
    playerRef.current?.seekTo(parseFloat((e.target as HTMLInputElement).value));
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="audio-player">
      {cover && <img src={cover} alt={title} className="audio-cover" />}
      
      <div className="audio-info">
        {title && <h3 className="audio-title">{title}</h3>}
        {artist && <p className="audio-artist">{artist}</p>}
      </div>

      <div className="audio-controls">
        <button onClick={handleStop}>停止</button>
        <button onClick={handlePlayPause}>{playing ? '暂停' : '播放'}</button>
      </div>

      <div className="audio-progress">
        <span>{formatTime(played * duration)}</span>
        <input
          type="range"
          min={0}
          max={0.999999}
          step="any"
          value={played}
          onChange={handleSeek}
          onMouseUp={handleSeekMouseUp}
        />
        <span>{formatTime(duration)}</span>
      </div>

      <div className="audio-volume">
        <input
          type="range"
          min={0}
          max={1}
          step="any"
          value={volume}
          onChange={handleVolumeChange}
        />
      </div>

      <ReactPlayer
        ref={playerRef}
        url={url}
        playing={playing}
        volume={volume}
        height="0"
        width="0"
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        onProgress={handleProgress}
        onDuration={handleDuration}
      />
    </div>
  );
}
```

### YouTube 播放器
```typescript
// src/components/YouTubePlayer.tsx
import { useRef, useState, useCallback } from 'react';
import ReactPlayer from 'react-player/youtube';

export interface YouTubePlayerProps {
  videoId: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onReady?: () => void;
  onStart?: () => void;
  showControls?: boolean;
  modestBranding?: boolean;
  rel?: boolean;
}

export function YouTubePlayer({
  videoId,
  onPlay,
  onPause,
  onEnded,
  onReady,
  onStart,
  showControls = true,
  modestBranding = true,
  rel = false,
}: YouTubePlayerProps) {
  const playerRef = useRef<ReactPlayer>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  const url = `https://www.youtube.com/watch?v=${videoId}`;

  const handlePlay = useCallback(() => {
    setPlaying(true);
    onPlay?.();
  }, [onPlay]);

  const handlePause = useCallback(() => {
    setPlaying(false);
    onPause?.();
  }, [onPause]);

  const handleEnded = useCallback(() => {
    setPlaying(false);
    onEnded?.();
  }, [onEnded]);

  const handleDuration = useCallback((dur: number) => {
    setDuration(dur);
  }, []);

  return (
    <div className="youtube-player">
      <ReactPlayer
        ref={playerRef}
        url={url}
        playing={playing}
        controls={showControls}
        config={{
          youtube: {
            playerVars: {
              modestbranding: modestBranding ? 1 : 0,
              rel: rel ? 1 : 0,
              showinfo: 0,
              iv_load_policy: 3,
              fs: 1,
              disablekb: 0,
            },
          },
        }}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onReady={onReady}
        onStart={onStart}
        onDuration={handleDuration}
        width="100%"
        height="100%"
      />
    </div>
  );
}
```

### Vimeo 播放器
```typescript
// src/components/VimeoPlayer.tsx
import { useRef, useState, useCallback } from 'react';
import ReactPlayer from 'react-player/vimeo';

export interface VimeoPlayerProps {
  videoId: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onReady?: () => void;
  showControls?: boolean;
  autoplay?: boolean;
  loop?: boolean;
}

export function VimeoPlayer({
  videoId,
  onPlay,
  onPause,
  onEnded,
  onReady,
  showControls = true,
  autoplay = false,
  loop = false,
}: VimeoPlayerProps) {
  const playerRef = useRef<ReactPlayer>(null);
  const [playing, setPlaying] = useState(autoplay);

  const url = `https://vimeo.com/${videoId}`;

  const handlePlay = useCallback(() => {
    setPlaying(true);
    onPlay?.();
  }, [onPlay]);

  const handlePause = useCallback(() => {
    setPlaying(false);
    onPause?.();
  }, [onPause]);

  const handleEnded = useCallback(() => {
    setPlaying(false);
    onEnded?.();
  }, [onEnded]);

  return (
    <div className="vimeo-player">
      <ReactPlayer
        ref={playerRef}
        url={url}
        playing={playing}
        controls={showControls}
        config={{
          vimeo: {
            playerOptions: {
              autoplay: autoplay,
              loop: loop,
              byline: false,
              portrait: false,
              title: false,
              speed: true,
              transparent: false,
            },
          },
        }}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onReady={onReady}
        width="100%"
        height="100%"
      />
    </div>
  );
}
```

### SoundCloud 播放器
```typescript
// src/components/SoundCloudPlayer.tsx
import { useRef, useState, useCallback } from 'react';
import ReactPlayer from 'react-player/soundcloud';

export interface SoundCloudPlayerProps {
  url: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onReady?: () => void;
  showControls?: boolean;
  visual?: boolean;
}

export function SoundCloudPlayer({
  url,
  onPlay,
  onPause,
  onEnded,
  onReady,
  showControls = true,
  visual = false,
}: SoundCloudPlayerProps) {
  const playerRef = useRef<ReactPlayer>(null);
  const [playing, setPlaying] = useState(false);

  const handlePlay = useCallback(() => {
    setPlaying(true);
    onPlay?.();
  }, [onPlay]);

  const handlePause = useCallback(() => {
    setPlaying(false);
    onPause?.();
  }, [onPause]);

  const handleEnded = useCallback(() => {
    setPlaying(false);
    onEnded?.();
  }, [onEnded]);

  return (
    <div className="soundcloud-player">
      <ReactPlayer
        ref={playerRef}
        url={url}
        playing={playing}
        controls={showControls}
        config={{
          soundcloud: {
            options: {
              visual: visual,
              show_artwork: true,
              show_user: true,
              single_active: true,
            },
          },
        }}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onReady={onReady}
        width="100%"
        height={visual ? '300px' : '166px'}
      />
    </div>
  );
}
```

### 通用媒体播放器
```typescript
// src/components/MediaPlayer.tsx
import { useRef, useState, useCallback, useEffect } from 'react';
import ReactPlayer from 'react-player';
import type { ReactPlayerProps } from 'react-player';

export interface MediaPlayerProps {
  url: string | string[];
  title?: string;
  poster?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  pip?: boolean;
  light?: boolean | string;
  volume?: number;
  playbackRate?: number;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: any) => void;
  onProgress?: (state: any) => void;
  onDuration?: (duration: number) => void;
  onReady?: () => void;
  onSeek?: (seconds: number) => void;
}

export function MediaPlayer({
  url,
  title,
  poster,
  autoplay = false,
  loop = false,
  muted = false,
  controls = true,
  pip = true,
  light = false,
  volume = 0.8,
  playbackRate = 1,
  onPlay,
  onPause,
  onEnded,
  onError,
  onProgress,
  onDuration,
  onReady,
  onSeek,
}: MediaPlayerProps) {
  const playerRef = useRef<ReactPlayer>(null);
  const [playing, setPlaying] = useState(autoplay);
  const [currentVolume, setVolume] = useState(volume);
  const [currentMuted, setMuted] = useState(muted);
  const [currentPlaybackRate, setPlaybackRate] = useState(playbackRate);
  const [currentUrlIndex, setUrlIndex] = useState(0);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const urls = Array.isArray(url) ? url : [url];
  const currentUrl = urls[currentUrlIndex];

  const handlePlay = useCallback(() => {
    setPlaying(true);
    onPlay?.();
  }, [onPlay]);

  const handlePause = useCallback(() => {
    setPlaying(false);
    onPause?.();
  }, [onPause]);

  const handleEnded = useCallback(() => {
    if (loop && urls.length > 1) {
      setUrlIndex((prev) => (prev + 1) % urls.length);
    } else if (loop) {
      playerRef.current?.seekTo(0);
    } else {
      setPlaying(false);
    }
    onEnded?.();
  }, [loop, urls.length, onEnded]);

  const handleError = useCallback((error: any) => {
    console.error('Player error:', error);
    onError?.(error);
  }, [onError]);

  const handleProgress = useCallback((state: any) => {
    setPlayed(state.played);
    onProgress?.(state);
  }, [onProgress]);

  const handleDuration = useCallback((dur: number) => {
    setDuration(dur);
    onDuration?.(dur);
  }, [onDuration]);

  const handleReady = useCallback(() => {
    setIsReady(true);
    onReady?.();
  }, [onReady]);

  const handleSeek = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds);
    onSeek?.(seconds);
  }, [onSeek]);

  const play = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => setPlaying(false), []);
  const togglePlay = useCallback(() => setPlaying((prev) => !prev), []);

  const setVolumeLevel = useCallback((level: number) => {
    setVolume(Math.max(0, Math.min(1, level)));
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => !prev);
  }, []);

  const setSpeed = useCallback((speed: number) => {
    setPlaybackRate(speed);
  }, []);

  const next = useCallback(() => {
    if (currentUrlIndex < urls.length - 1) {
      setUrlIndex((prev) => prev + 1);
    }
  }, [currentUrlIndex, urls.length]);

  const previous = useCallback(() => {
    if (currentUrlIndex > 0) {
      setUrlIndex((prev) => prev - 1);
    }
  }, [currentUrlIndex]);

  return (
    <div className="media-player">
      {poster && !playing && (
        <div className="media-poster">
          <img src={poster} alt={title} />
          <button onClick={play}>播放</button>
        </div>
      )}
      
      <ReactPlayer
        ref={playerRef}
        url={currentUrl}
        playing={playing}
        volume={currentVolume}
        muted={currentMuted}
        playbackRate={currentPlaybackRate}
        loop={loop}
        controls={controls}
        pip={pip}
        light={light}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleError}
        onProgress={handleProgress}
        onDuration={handleDuration}
        onReady={handleReady}
        onSeek={handleSeek}
        width="100%"
        height="auto"
      />
    </div>
  );
}
```

### 自定义 Hook
```typescript
// src/hooks/usePlayer.ts
import { useRef, useState, useCallback } from 'react';
import ReactPlayer from 'react-player';

export interface UsePlayerOptions {
  url: string;
  autoplay?: boolean;
  volume?: number;
  muted?: boolean;
  loop?: boolean;
  playbackRate?: number;
}

export function usePlayer(options: UsePlayerOptions) {
  const playerRef = useRef<ReactPlayer>(null);
  const [playing, setPlaying] = useState(options.autoplay || false);
  const [volume, setVolume] = useState(options.volume || 0.8);
  const [muted, setMuted] = useState(options.muted || false);
  const [loop, setLoop] = useState(options.loop || false);
  const [playbackRate, setPlaybackRate] = useState(options.playbackRate || 1);
  const [played, setPlayed] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const play = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => setPlaying(false), []);
  const togglePlay = useCallback(() => setPlaying((prev) => !prev), []);

  const seekTo = useCallback((time: number) => {
    playerRef.current?.seekTo(time);
  }, []);

  const seekForward = useCallback((seconds: number = 10) => {
    const currentTime = playerRef.current?.getCurrentTime() || 0;
    playerRef.current?.seekTo(currentTime + seconds);
  }, []);

  const seekBackward = useCallback((seconds: number = 10) => {
    const currentTime = playerRef.current?.getCurrentTime() || 0;
    playerRef.current?.seekTo(Math.max(0, currentTime - seconds));
  }, []);

  const handleProgress = useCallback((state: any) => {
    setPlayed(state.played);
    setLoaded(state.loaded);
  }, []);

  const handleDuration = useCallback((dur: number) => {
    setDuration(dur);
  }, []);

  const handleReady = useCallback(() => {
    setIsReady(true);
  }, []);

  const getCurrentTime = useCallback(() => {
    return playerRef.current?.getCurrentTime() || 0;
  }, []);

  const getSecondsLoaded = useCallback(() => {
    return playerRef.current?.getSecondsLoaded() || 0;
  }, []);

  return {
    playerRef,
    playing,
    volume,
    muted,
    loop,
    playbackRate,
    played,
    loaded,
    duration,
    isReady,
    play,
    pause,
    togglePlay,
    seekTo,
    seekForward,
    seekBackward,
    setVolume,
    setMuted,
    setLoop,
    setPlaybackRate,
    handleProgress,
    handleDuration,
    handleReady,
    getCurrentTime,
    getSecondsLoaded,
  };
}
```

### 播放器状态 Hook
```typescript
// src/hooks/usePlayerState.ts
import { useState, useCallback } from 'react';

export interface PlayerState {
  playing: boolean;
  volume: number;
  muted: boolean;
  played: number;
  loaded: number;
  duration: number;
  playbackRate: number;
  loop: boolean;
  fullscreen: boolean;
  pip: boolean;
}

export function usePlayerState(initialState?: Partial<PlayerState>) {
  const [state, setState] = useState<PlayerState>({
    playing: false,
    volume: 0.8,
    muted: false,
    played: 0,
    loaded: 0,
    duration: 0,
    playbackRate: 1,
    loop: false,
    fullscreen: false,
    pip: false,
    ...initialState,
  });

  const updateState = useCallback((updates: Partial<PlayerState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetState = useCallback(() => {
    setState({
      playing: false,
      volume: 0.8,
      muted: false,
      played: 0,
      loaded: 0,
      duration: 0,
      playbackRate: 1,
      loop: false,
      fullscreen: false,
      pip: false,
      ...initialState,
    });
  }, [initialState]);

  return {
    state,
    updateState,
    resetState,
  };
}
```

### URL 解析器
```typescript
// src/utils/parsers.ts
export function parseYouTubeUrl(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export function parseVimeoUrl(url: string): string | null {
  const regExp = /https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
  const match = url.match(regExp);
  return match ? match[3] : null;
}

export function parseSoundCloudUrl(url: string): string | null {
  const regExp = /^https?:\/\/(soundcloud\.com|snd\.sc)\/(.*)$/;
  const match = url.match(regExp);
  return match ? url : null;
}

export function detectPlatform(url: string): string | null {
  if (parseYouTubeUrl(url)) return 'youtube';
  if (parseVimeoUrl(url)) return 'vimeo';
  if (parseSoundCloudUrl(url)) return 'soundcloud';
  if (url.includes('facebook.com')) return 'facebook';
  if (url.includes('twitch.tv')) return 'twitch';
  if (url.includes('dailymotion.com')) return 'dailymotion';
  if (url.includes('mixcloud.com')) return 'mixcloud';
  if (url.includes('wistia.com')) return 'wistia';
  if (url.includes('vidyard.com')) return 'vidyard';
  if (url.includes('kaltura.com')) return 'kaltura';
  
  // 检查是否为直接媒体文件
  const mediaExtensions = ['.mp4', '.webm', '.ogg', '.mp3', '.wav', '.m3u8', '.mpd'];
  if (mediaExtensions.some((ext) => url.includes(ext))) {
    return 'file';
  }
  
  return null;
}
```

### TypeScript 类型
```typescript
// src/types/index.ts
export interface PlayerConfig {
  file?: {
    forceVideo?: boolean;
    forceAudio?: boolean;
    attributes?: Record<string, string>;
    tracks?: MediaTrack[];
  };
  youtube?: {
    playerVars?: YouTubePlayerVars;
    embedOptions?: Record<string, any>;
  };
  vimeo?: {
    playerOptions?: VimeoPlayerOptions;
  };
  soundcloud?: {
    options?: SoundCloudOptions;
  };
  facebook?: {
    appId: string;
    version: string;
    playerId: string;
  };
}

export interface YouTubePlayerVars {
  autoplay?: 0 | 1;
  cc_load_policy?: 0 | 1;
  color?: 'red' | 'white';
  controls?: 0 | 1 | 2;
  disablekb?: 0 | 1;
  enablejsapi?: 0 | 1;
  end?: number;
  fs?: 0 | 1;
  hl?: string;
  iv_load_policy?: 1 | 3;
  list?: string;
  listType?: 'playlist' | 'search' | 'user_uploads';
  loop?: 0 | 1;
  modestbranding?: 0 | 1;
  origin?: string;
  playlist?: string;
  playsinline?: 0 | 1;
  rel?: 0 | 1;
  showinfo?: 0 | 1;
  start?: number;
}

export interface VimeoPlayerOptions {
  autoplay?: boolean;
  background?: boolean;
  byline?: boolean;
  color?: string;
  controls?: boolean;
  dnt?: boolean;
  height?: number;
  loop?: boolean;
  maxheight?: number;
  maxwidth?: number;
  muted?: boolean;
  pip?: boolean;
  playsinline?: boolean;
  portrait?: boolean;
  quality?: 'auto' | '240p' | '360p' | '540p' | '720p' | '1080p' | '2k' | '4k';
  responsive?: boolean;
  speed?: boolean;
  texttrack?: string;
  title?: boolean;
  transparent?: boolean;
  width?: number;
}

export interface SoundCloudOptions {
  visual?: boolean;
  show_artwork?: boolean;
  show_user?: boolean;
  single_active?: boolean;
  buying?: boolean;
  sharing?: boolean;
  download?: boolean;
  show_comments?: boolean;
  show_playcount?: boolean;
  show_teaser?: boolean;
}

export interface MediaTrack {
  kind: 'subtitles' | 'captions' | 'chapters' | 'descriptions' | 'metadata';
  src: string;
  srcLang: string;
  label: string;
  default?: boolean;
}

export interface ProgressState {
  played: number;
  playedSeconds: number;
  loaded: number;
  loadedSeconds: number;
}
```

## 最佳实践

### 1. 懒加载
```typescript
import { lazy, Suspense } from 'react';

const ReactPlayer = lazy(() => import('react-player'));

function LazyPlayer() {
  return (
    <Suspense fallback={<div>Loading player...</div>}>
      <ReactPlayer url="https://www.youtube.com/watch?v=ysz5S6P_z-E" />
    </Suspense>
  );
}
```

### 2. 响应式设计
```typescript
function ResponsivePlayer() {
  const [width, setWidth] = useState('100%');
  
  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth < 768 ? '100%' : '640px');
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <ReactPlayer
      url="https://www.youtube.com/watch?v=ysz5S6P_z-E"
      width={width}
      height={width === '100%' ? '100%' : '360px'}
    />
  );
}
```

### 3. 错误处理
```typescript
function PlayerWithErrorHandling() {
  const [error, setError] = useState<string | null>(null);
  
  const handleError = (err: any) => {
    console.error('Player error:', err);
    setError('Failed to load video. Please try again later.');
  };
  
  if (error) {
    return <div className="error">{error}</div>;
  }
  
  return (
    <ReactPlayer
      url="https://www.youtube.com/watch?v=ysz5S6P_z-E"
      onError={handleError}
    />
  );
}
```

## 常用命令

### 安装
```bash
# 安装 React Player
npm install react-player

# 安装 TypeScript 类型
npm install -D @types/react-player
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
  "name": "react-player-project",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-player": "^2.14.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/react-player": "^2.0.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0"
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
VITE_YOUTUBE_API_KEY=your_youtube_api_key
VITE_VIMEO_ACCESS_TOKEN=your_vimeo_access_token
```
