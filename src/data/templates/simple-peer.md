# Simple-Peer 模板

## 技术栈
- **Simple-Peer** - WebRTC 简单封装，用于点对点连接
- **TypeScript** - 完整类型支持
- **React** - React 集成
- **WebSocket** - 信令服务器
- **WebRTC** - 浏览器点对点通信
- **MediaStream** - 音视频流处理

## 项目结构
```
simple-peer-project/
├── src/
│   ├── components/
│   │   ├── VideoCall.tsx
│   │   ├── AudioCall.tsx
│   │   ├── ScreenShare.tsx
│   │   └── PeerConnection.tsx
│   ├── peers/
│   │   ├── PeerManager.ts
│   │   ├── VideoPeer.ts
│   │   └── DataPeer.ts
│   ├── signaling/
│   │   ├── SignalingServer.ts
│   │   └── WebSocketClient.ts
│   ├── hooks/
│   │   ├── usePeer.ts
│   │   ├── useMediaStream.ts
│   │   └── useWebSocket.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── server/
│   ├── signaling-server.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

## 代码模式

### 基础 Peer 连接
```typescript
// src/peers/PeerManager.ts
import Peer, { SignalData } from 'simple-peer';
import { EventEmitter } from 'events';

export interface PeerOptions {
  initiator?: boolean;
  trickle?: boolean;
  stream?: MediaStream;
  config?: RTCConfiguration;
}

export interface SignalMessage {
  type: 'offer' | 'answer' | 'candidate';
  data: SignalData | RTCIceCandidate;
}

export class PeerManager extends EventEmitter {
  private peer: Peer.Instance | null = null;
  private options: PeerOptions;

  constructor(options: PeerOptions = {}) {
    super();
    this.options = {
      initiator: false,
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          {
            urls: 'turn:turn.example.com:3478',
            username: 'username',
            credential: 'password',
          },
        ],
      },
      ...options,
    };
  }

  // 创建连接
  createConnection() {
    this.peer = new Peer({
      initiator: this.options.initiator,
      trickle: this.options.trickle,
      config: this.options.config,
      stream: this.options.stream,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.peer) return;

    // 信号数据
    this.peer.on('signal', (data) => {
      this.emit('signal', data);
    });

    // 连接建立
    this.peer.on('connect', () => {
      console.log('Peer connected');
      this.emit('connected');
    });

    // 接收数据
    this.peer.on('data', (data) => {
      console.log('Received data:', data);
      this.emit('data', data);
    });

    // 接收流
    this.peer.on('stream', (stream) => {
      console.log('Received stream');
      this.emit('stream', stream);
    });

    // 连接错误
    this.peer.on('error', (err) => {
      console.error('Peer error:', err);
      this.emit('error', err);
    });

    // 连接关闭
    this.peer.on('close', () => {
      console.log('Peer connection closed');
      this.emit('disconnected');
      this.peer = null;
    });
  }

  // 信号处理
  signal(data: SignalData) {
    if (this.peer) {
      this.peer.signal(data);
    }
  }

  // 发送数据
  send(data: any) {
    if (this.peer) {
      this.peer.send(JSON.stringify(data));
    }
  }

  // 发送二进制数据
  sendBinary(data: Buffer | ArrayBuffer) {
    if (this.peer) {
      this.peer.send(data);
    }
  }

  // 添加流
  addStream(stream: MediaStream) {
    if (this.peer) {
      this.peer.addStream(stream);
    }
  }

  // 移除流
  removeStream(stream: MediaStream) {
    if (this.peer) {
      this.peer.removeStream(stream);
    }
  }

  // 替换轨道
  replaceTrack(
    oldTrack: MediaStreamTrack,
    newTrack: MediaStreamTrack,
    stream: MediaStream
  ) {
    if (this.peer) {
      // @ts-ignore - replaceTrack 方法在某些版本中存在
      if (this.peer.replaceTrack) {
        this.peer.replaceTrack(oldTrack, newTrack, stream);
      }
    }
  }

  // 添加轨道
  addTrack(track: MediaStreamTrack, stream: MediaStream) {
    if (this.peer) {
      this.peer.addTrack(track, stream);
    }
  }

  // 移除轨道
  removeTrack(track: MediaStreamTrack, stream: MediaStream) {
    if (this.peer) {
      this.peer.removeTrack(track, stream);
    }
  }

  // 销毁连接
  destroy() {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }

  // 获取状态
  isConnected(): boolean {
    return this.peer ? this.peer.connected : false;
  }
}
```

### 视频通话
```typescript
// src/peers/VideoPeer.ts
import { PeerManager, PeerOptions } from './PeerManager';

export interface VideoPeerOptions extends PeerOptions {
  video?: boolean;
  audio?: boolean;
  screenShare?: boolean;
}

export class VideoPeer extends PeerManager {
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private videoEnabled: boolean;
  private audioEnabled: boolean;

  constructor(options: VideoPeerOptions = {}) {
    super(options);
    this.videoEnabled = options.video ?? true;
    this.audioEnabled = options.audio ?? true;

    this.on('stream', (stream: MediaStream) => {
      this.remoteStream = stream;
      this.emit('remoteStream', stream);
    });
  }

  // 获取本地流
  async getLocalStream(): Promise<MediaStream> {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: this.videoEnabled,
      audio: this.audioEnabled,
    });

    this.localStream = stream;
    return stream;
  }

  // 获取屏幕共享流
  async getScreenShareStream(): Promise<MediaStream> {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });

    this.localStream = stream;
    return stream;
  }

  // 切换视频
  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        this.videoEnabled = videoTrack.enabled;
        this.emit('videoToggled', this.videoEnabled);
      }
    }
  }

  // 切换音频
  toggleAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.audioEnabled = audioTrack.enabled;
        this.emit('audioToggled', this.audioEnabled);
      }
    }
  }

  // 切换摄像头
  async switchCamera() {
    if (this.localStream) {
      const oldTrack = this.localStream.getVideoTracks()[0];
      
      // 获取新设备
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      
      const currentIndex = videoDevices.findIndex(
        (d) => d.deviceId === oldTrack?.getSettings().deviceId
      );
      const nextIndex = (currentIndex + 1) % videoDevices.length;
      const nextDevice = videoDevices[nextIndex];

      // 获取新流
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: nextDevice.deviceId } },
        audio: false,
      });

      const newTrack = newStream.getVideoTracks()[0];

      // 替换轨道
      if (oldTrack && newTrack) {
        this.replaceTrack(oldTrack, newTrack, this.localStream);
        oldTrack.stop();
      }
    }
  }

  // 开始屏幕共享
  async startScreenShare() {
    const stream = await this.getScreenShareStream();
    
    // 停止当前视频轨道
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.stop();
      }
    }

    // 添加屏幕共享流
    this.addStream(stream);
    this.localStream = stream;

    // 监听停止共享
    stream.getVideoTracks()[0].onended = () => {
      this.emit('screenShareEnded');
    };

    this.emit('screenShareStarted', stream);
  }

  // 停止屏幕共享
  async stopScreenShare() {
    if (this.localStream) {
      const tracks = this.localStream.getTracks();
      tracks.forEach((track) => track.stop());
      this.removeStream(this.localStream);
    }

    // 重新获取摄像头流
    const stream = await this.getLocalStream();
    this.addStream(stream);

    this.emit('screenShareStopped', stream);
  }

  // 获取远程流
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  // 获取本地流
  getStream(): MediaStream | null {
    return this.localStream;
  }

  // 清理
  async cleanup() {
    if (this.localStream) {
      const tracks = this.localStream.getTracks();
      tracks.forEach((track) => track.stop());
      this.localStream = null;
    }

    this.remoteStream = null;
    this.destroy();
  }
}
```

### 数据通道
```typescript
// src/peers/DataPeer.ts
import { PeerManager, PeerOptions } from './PeerManager';

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface ChunkData {
  index: number;
  total: number;
  data: ArrayBuffer;
}

export class DataPeer extends PeerManager {
  private fileTransfers: Map<
    string,
    {
      metadata: FileMetadata;
      chunks: ArrayBuffer[];
      received: number;
    }
  > = new Map();

  constructor(options: PeerOptions = {}) {
    super(options);

    this.on('data', (data: any) => {
      this.handleData(data);
    });
  }

  private handleData(data: any) {
    try {
      // 尝试解析 JSON
      const parsed = JSON.parse(data.toString());

      if (parsed.type === 'file-metadata') {
        this.handleFileMetadata(parsed.metadata, parsed.transferId);
      } else if (parsed.type === 'file-chunk') {
        this.handleFileChunk(parsed.transferId, parsed.chunk);
      } else if (parsed.type === 'file-complete') {
        this.handleFileComplete(parsed.transferId);
      } else {
        // 普通消息
        this.emit('message', parsed);
      }
    } catch (err) {
      // 二进制数据
      this.emit('binary', data);
    }
  }

  // 发送消息
  sendMessage(message: any) {
    this.send({
      type: 'message',
      payload: message,
      timestamp: Date.now(),
    });
  }

  // 发送文件
  async sendFile(file: File, chunkSize: number = 16384): Promise<string> {
    const transferId = `${Date.now()}-${Math.random()}`;

    // 发送文件元数据
    const metadata: FileMetadata = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    };

    this.send({
      type: 'file-metadata',
      transferId,
      metadata,
    });

    // 读取并发送文件块
    const reader = new FileReader();
    let offset = 0;
    let index = 0;

    const readNextChunk = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        const slice = file.slice(offset, offset + chunkSize);
        reader.onload = (e) => {
          if (e.target?.result) {
            const chunk = e.target.result as ArrayBuffer;

            this.send({
              type: 'file-chunk',
              transferId,
              chunk: {
                index,
                total: Math.ceil(file.size / chunkSize),
                data: Array.from(new Uint8Array(chunk)),
              },
            });

            offset += chunkSize;
            index++;

            // 更新进度
            const progress = offset / file.size;
            this.emit('fileProgress', { transferId, progress });

            if (offset < file.size) {
              resolve(readNextChunk());
            } else {
              // 发送完成信号
              this.send({
                type: 'file-complete',
                transferId,
              });
              resolve();
            }
          }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(slice);
      });
    };

    await readNextChunk();
    this.emit('fileSent', { transferId, file });

    return transferId;
  }

  // 处理文件元数据
  private handleFileMetadata(metadata: FileMetadata, transferId: string) {
    this.fileTransfers.set(transferId, {
      metadata,
      chunks: [],
      received: 0,
    });

    this.emit('fileStart', { transferId, metadata });
  }

  // 处理文件块
  private handleFileChunk(transferId: string, chunk: any) {
    const transfer = this.fileTransfers.get(transferId);
    if (!transfer) return;

    // 存储块
    transfer.chunks[chunk.index] = new Uint8Array(chunk.data).buffer;
    transfer.received++;

    // 更新进度
    const progress = transfer.received / chunk.total;
    this.emit('fileProgress', { transferId, progress });
  }

  // 处理文件完成
  private handleFileComplete(transferId: string) {
    const transfer = this.fileTransfers.get(transferId);
    if (!transfer) return;

    // 合并块
    const blob = new Blob(transfer.chunks, { type: transfer.metadata.type });
    const file = new File([blob], transfer.metadata.name, {
      type: transfer.metadata.type,
      lastModified: transfer.metadata.lastModified,
    });

    this.emit('fileReceived', { transferId, file, metadata: transfer.metadata });
    this.fileTransfers.delete(transferId);
  }

  // 发送 JSON
  sendJSON(data: any) {
    this.send({
      type: 'json',
      payload: data,
      timestamp: Date.now(),
    });
  }
}
```

### React 组件
```typescript
// src/components/VideoCall.tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { VideoPeer } from '../peers/VideoPeer';

export interface VideoCallProps {
  signalingUrl: string;
  room: string;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

export function VideoCall({
  signalingUrl,
  room,
  onConnected,
  onDisconnected,
  onError,
}: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<VideoPeer | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // 初始化
  useEffect(() => {
    const init = async () => {
      try {
        // 创建 Peer
        const peer = new VideoPeer({
          initiator: true,
          video: true,
          audio: true,
        });

        peerRef.current = peer;

        // 获取本地流
        const stream = await peer.getLocalStream();
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // 监听信号
        peer.on('signal', (signal) => {
          // 发送信号到信令服务器
          wsRef.current?.send(
            JSON.stringify({
              type: 'signal',
              room,
              signal,
            })
          );
        });

        // 监听远程流
        peer.on('remoteStream', (stream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
          }
        });

        // 监听连接
        peer.on('connected', () => {
          setIsConnected(true);
          onConnected?.();
        });

        // 监听断开
        peer.on('disconnected', () => {
          setIsConnected(false);
          onDisconnected?.();
        });

        // 监听错误
        peer.on('error', (err) => {
          onError?.(err);
        });

        // 连接信令服务器
        const ws = new WebSocket(signalingUrl);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'signal') {
            peer.signal(data.signal);
          }
        };

        // 创建连接
        peer.createConnection();
      } catch (error) {
        onError?.(error as Error);
      }
    };

    init();

    return () => {
      peerRef.current?.cleanup();
      wsRef.current?.close();
    };
  }, [signalingUrl, room]);

  // 切换音频
  const toggleMute = useCallback(() => {
    peerRef.current?.toggleAudio();
    setIsMuted((prev) => !prev);
  }, []);

  // 切换视频
  const toggleVideo = useCallback(() => {
    peerRef.current?.toggleVideo();
    setIsVideoOff((prev) => !prev);
  }, []);

  // 切换屏幕共享
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      await peerRef.current?.stopScreenShare();
      setIsScreenSharing(false);
    } else {
      await peerRef.current?.startScreenShare();
      setIsScreenSharing(true);
    }
  }, [isScreenSharing]);

  // 结束通话
  const endCall = useCallback(() => {
    peerRef.current?.cleanup();
    wsRef.current?.close();
    setIsConnected(false);
  }, []);

  return (
    <div className="video-call">
      <div className="video-container">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="local-video"
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="remote-video"
        />
      </div>

      <div className="controls">
        <button onClick={toggleMute} className={isMuted ? 'active' : ''}>
          {isMuted ? '取消静音' : '静音'}
        </button>
        <button onClick={toggleVideo} className={isVideoOff ? 'active' : ''}>
          {isVideoOff ? '开启视频' : '关闭视频'}
        </button>
        <button
          onClick={toggleScreenShare}
          className={isScreenSharing ? 'active' : ''}
        >
          {isScreenSharing ? '停止共享' : '共享屏幕'}
        </button>
        <button onClick={endCall} className="end-call">
          结束通话
        </button>
      </div>

      {isConnected && <div className="status">已连接</div>}
    </div>
  );
}
```

### 自定义 Hook
```typescript
// src/hooks/usePeer.ts
import { useRef, useState, useCallback } from 'react';
import Peer from 'simple-peer';
import { EventEmitter } from 'events';

export interface UsePeerOptions {
  initiator?: boolean;
  stream?: MediaStream;
  config?: RTCConfiguration;
}

export function usePeer(options: UsePeerOptions = {}) {
  const peerRef = useRef<Peer.Instance | null>(null);
  const eventEmitterRef = useRef(new EventEmitter());

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const createPeer = useCallback(() => {
    const peer = new Peer({
      initiator: options.initiator || false,
      stream: options.stream,
      config: options.config || {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      },
    });

    peer.on('signal', (data) => {
      eventEmitterRef.current.emit('signal', data);
    });

    peer.on('connect', () => {
      setIsConnected(true);
      eventEmitterRef.current.emit('connected');
    });

    peer.on('stream', (stream) => {
      setRemoteStream(stream);
      eventEmitterRef.current.emit('stream', stream);
    });

    peer.on('data', (data) => {
      eventEmitterRef.current.emit('data', data);
    });

    peer.on('error', (err) => {
      setError(err);
      eventEmitterRef.current.emit('error', err);
    });

    peer.on('close', () => {
      setIsConnected(false);
      eventEmitterRef.current.emit('disconnected');
    });

    peerRef.current = peer;
    return peer;
  }, [options]);

  const signal = useCallback((data: Peer.SignalData) => {
    peerRef.current?.signal(data);
  }, []);

  const send = useCallback((data: any) => {
    if (peerRef.current && isConnected) {
      peerRef.current.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }, [isConnected]);

  const destroy = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
      setIsConnected(false);
      setRemoteStream(null);
    }
  }, []);

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    eventEmitterRef.current.on(event, callback);
  }, []);

  const off = useCallback((event: string, callback: (...args: any[]) => void) => {
    eventEmitterRef.current.off(event, callback);
  }, []);

  return {
    peer: peerRef.current,
    remoteStream,
    isConnected,
    error,
    createPeer,
    signal,
    send,
    destroy,
    on,
    off,
  };
}
```

### 媒体流 Hook
```typescript
// src/hooks/useMediaStream.ts
import { useRef, useState, useCallback } from 'react';

export interface UseMediaStreamOptions {
  video?: boolean | MediaTrackConstraints;
  audio?: boolean | MediaTrackConstraints;
  screen?: boolean;
}

export function useMediaStream(options: UseMediaStreamOptions = {}) {
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  // 获取流
  const getStream = useCallback(async () => {
    try {
      let stream: MediaStream;

      if (options.screen) {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: options.video ?? true,
          audio: options.audio ?? true,
        });
      }

      streamRef.current = stream;
      setIsStreaming(true);
      return stream;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [options]);

  // 停止流
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  // 切换音频
  const toggleAudio = useCallback(() => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }, []);

  // 切换视频
  const toggleVideo = useCallback(() => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }, []);

  // 切换摄像头
  const switchCamera = useCallback(async () => {
    if (!streamRef.current) return null;

    const oldTrack = streamRef.current.getVideoTracks()[0];
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((d) => d.kind === 'videoinput');

    const currentIndex = videoDevices.findIndex(
      (d) => d.deviceId === oldTrack?.getSettings().deviceId
    );
    const nextIndex = (currentIndex + 1) % videoDevices.length;
    const nextDevice = videoDevices[nextIndex];

    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: nextDevice.deviceId } },
      audio: false,
    });

    const newTrack = newStream.getVideoTracks()[0];

    if (oldTrack && newTrack) {
      oldTrack.stop();
      streamRef.current.removeTrack(oldTrack);
      streamRef.current.addTrack(newTrack);
    }

    return streamRef.current;
  }, []);

  // 获取设备列表
  const getDevices = useCallback(async () => {
    const deviceList = await navigator.mediaDevices.enumerateDevices();
    setDevices(deviceList);
    return deviceList;
  }, []);

  return {
    stream: streamRef.current,
    isStreaming,
    error,
    devices,
    getStream,
    stopStream,
    toggleAudio,
    toggleVideo,
    switchCamera,
    getDevices,
  };
}
```

### 信令服务器
```typescript
// server/signaling-server.ts
import { WebSocketServer, WebSocket } from 'ws';

interface Room {
  clients: Set<WebSocket>;
}

export class SignalingServer {
  private wss: WebSocketServer;
  private rooms: Map<string, Room> = new Map();

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.setupServer();
  }

  private setupServer() {
    this.wss.on('connection', (ws: WebSocket) => {
      let currentRoom: string | null = null;

      ws.on('message', (data: string) => {
        try {
          const message = JSON.parse(data);

          switch (message.type) {
            case 'join':
              this.handleJoin(ws, message.room);
              currentRoom = message.room;
              break;

            case 'signal':
              if (currentRoom) {
                this.handleSignal(ws, currentRoom, message.signal);
              }
              break;

            case 'leave':
              if (currentRoom) {
                this.handleLeave(ws, currentRoom);
                currentRoom = null;
              }
              break;
          }
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      });

      ws.on('close', () => {
        if (currentRoom) {
          this.handleLeave(ws, currentRoom);
        }
      });
    });

    console.log(`Signaling server is running on port ${this.wss.options.port}`);
  }

  private handleJoin(ws: WebSocket, room: string) {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, { clients: new Set() });
    }

    const roomData = this.rooms.get(room)!;
    
    // 通知房间内的其他人
    roomData.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'user-joined' }));
      }
    });

    roomData.clients.add(ws);

    ws.send(JSON.stringify({ type: 'joined', room }));
  }

  private handleSignal(ws: WebSocket, room: string, signal: any) {
    const roomData = this.rooms.get(room);
    if (!roomData) return;

    // 转发信号给房间内的其他人
    roomData.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: 'signal',
            signal,
          })
        );
      }
    });
  }

  private handleLeave(ws: WebSocket, room: string) {
    const roomData = this.rooms.get(room);
    if (!roomData) return;

    roomData.clients.delete(ws);

    // 通知房间内的其他人
    roomData.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'user-left' }));
      }
    });

    // 如果房间为空，删除房间
    if (roomData.clients.size === 0) {
      this.rooms.delete(room);
    }
  }

  close() {
    this.wss.close();
  }
}
```

### TypeScript 类型
```typescript
// src/types/index.ts
import Peer from 'simple-peer';

export interface PeerConfig {
  initiator: boolean;
  trickle?: boolean;
  stream?: MediaStream;
  config?: RTCConfiguration;
  offerOptions?: RTCOfferOptions;
  answerOptions?: RTCAnswerOptions;
  sdpTransform?: (sdp: string) => string;
}

export interface SignalData {
  type: 'offer' | 'answer' | 'candidate';
  sdp?: string;
  candidate?: RTCIceCandidateInit;
}

export interface Room {
  id: string;
  name?: string;
  peers: string[];
  createdAt: Date;
}

export interface Message {
  id: string;
  from: string;
  to?: string;
  type: 'text' | 'file' | 'json';
  content: any;
  timestamp: Date;
}

export interface FileTransfer {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'pending' | 'transferring' | 'completed' | 'error';
}
```

## 最佳实践

### 1. ICE 服务器配置
```typescript
const config: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:turn.example.com:3478',
      username: 'username',
      credential: 'password',
    },
  ],
  iceCandidatePoolSize: 10,
};
```

### 2. 错误处理
```typescript
peer.on('error', (err) => {
  console.error('Peer error:', err);

  // 根据错误类型处理
  if (err.code === 'ERR_CONNECTION_FAILURE') {
    // 重连
    reconnect();
  } else if (err.code === 'ERR_DATA_CHANNEL_FAILURE') {
    // 数据通道失败
    recreateDataChannel();
  }
});
```

### 3. 重连机制
```typescript
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

function handleDisconnect() {
  if (reconnectAttempts < maxReconnectAttempts) {
    reconnectAttempts++;
    setTimeout(() => {
      createPeer();
    }, 2000 * reconnectAttempts);
  }
}
```

## 常用命令

### 安装
```bash
# 安装 simple-peer
npm install simple-peer

# 安装 TypeScript 类型
npm install -D @types/simple-peer

# 安装 WebSocket 服务器
npm install ws
npm install -D @types/ws
```

### 开发
```bash
# 启动开发服务器
npm run dev

# 启动信令服务器
npm run server

# 构建生产版本
npm run build
```

## 部署配置

### package.json
```json
{
  "name": "simple-peer-project",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "simple-peer": "^9.11.1",
    "ws": "^8.16.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/simple-peer": "^9.11.0",
    "@types/ws": "^8.5.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  },
  "scripts": {
    "dev": "vite",
    "server": "ts-node server/index.ts",
    "build": "tsc && vite build"
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
  "include": ["src", "server"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Docker Compose
```yaml
version: '3.8'

services:
  signaling-server:
    build: .
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
    command: npm run server

  web:
    build: .
    ports:
      - "3000:80"
    environment:
      - VITE_SIGNALING_URL=ws://signaling-server:8080
```

### 环境变量
```bash
# .env
VITE_SIGNALING_URL=ws://localhost:8080
VITE_STUN_SERVER=stun:stun.l.google.com:19302
VITE_TURN_SERVER=turn:turn.example.com:3478
VITE_TURN_USERNAME=username
VITE_TURN_PASSWORD=password
```
