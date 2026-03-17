# LiveKit Real-Time Audio/Video Template

## Tech Stack
- livekit-client v2.x
- @livekit/components-react v2.x
- livekit-server-sdk v2.x
- React 18+
- TypeScript 5+

## Core Patterns

### Server-Side Token Generation
```typescript
import { AccessToken } from 'livekit-server-sdk';

export async function generateToken(roomName: string, participantName: string) {
  const apiKey = process.env.LIVEKIT_API_KEY!;
  const apiSecret = process.env.LIVEKIT_API_SECRET!;
  
  const token = new AccessToken(apiKey, apiSecret, {
    identity: participantName,
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  return token.toJwt();
}

// API Route (Next.js App Router)
export async function POST(request: Request) {
  const { room, identity } = await request.json();
  const token = await generateToken(room, identity);
  return Response.json({ token });
}
```

### Client-Side Room Connection
```typescript
import { Room, RoomEvent } from 'livekit-client';

export class VideoRoom {
  private room: Room;

  constructor() {
    this.room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });
  }

  async connect(url: string, token: string) {
    await this.room.connect(url, token);
    this.setupListeners();
  }

  private setupListeners() {
    this.room.on(RoomEvent.ParticipantConnected, (participant) => {
      console.log('Participant connected:', participant.identity);
    });

    this.room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      console.log('Participant disconnected:', participant.identity);
    });

    this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      console.log('Track subscribed:', track.kind);
    });
  }

  async disconnect() {
    await this.room.disconnect();
  }
}
```

### React Components
```typescript
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';

interface MeetingRoomProps {
  token: string;
  serverUrl: string;
}

export const MeetingRoom: React.FC<MeetingRoomProps> = ({ token, serverUrl }) => {
  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect={true}
      video={true}
      audio={true}
    >
      <VideoConference />
    </LiveKitRoom>
  );
};
```

### Custom Video Track
```typescript
import { useParticipants, useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';

export const ParticipantList: React.FC = () => {
  const participants = useParticipants();

  return (
    <div className="participant-grid">
      {participants.map((participant) => (
        <div key={participant.identity} className="participant">
          <span>{participant.identity}</span>
          <span>{participant.isSpeaking ? '🔊' : '🔇'}</span>
        </div>
      ))}
    </div>
  );
};

export const VideoTracks: React.FC = () => {
  const tracks = useTracks(
    [Track.Source.Camera, Track.Source.ScreenShare],
    { onlySubscribed: true }
  );

  return (
    <div className="video-grid">
      {tracks.map((trackRef) => (
        <VideoTrack trackRef={trackRef} key={trackRef.publication.trackSid} />
      ))}
    </div>
  );
};
```

### Screen Share
```typescript
import { useRoomContext } from '@livekit/components-react';

export const ScreenShareButton: React.FC = () => {
  const room = useRoomContext();

  const startScreenShare = async () => {
    await room.localParticipant.setScreenShareEnabled(true);
  };

  const stopScreenShare = async () => {
    await room.localParticipant.setScreenShareEnabled(false);
  };

  return (
    <button onClick={startScreenShare}>
      Share Screen
    </button>
  );
};
```

## Common Commands

```bash
npm install livekit-client @livekit/components-react livekit-server-sdk
npm install -D @livekit/components-styles

# Start LiveKit server (Docker)
docker run -d \
  --name livekit \
  -p 7880:7880 \
  -p 7881:7881 \
  -v $PWD/livekit.yaml:/livekit.yaml \
  livekit/livekit-server \
  --config /livekit.yaml

# Generate keys
docker run --rm livekit/generate
```

## Environment Setup

```env
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
LIVEKIT_URL=wss://your-project.livekit.cloud
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
```

## Related Resources
- [LiveKit Documentation](https://docs.livekit.io/)
- [React Components](https://docs.livekit.io/reference/components/react/)
- [LiveKit Cloud](https://cloud.livekit.io/)
