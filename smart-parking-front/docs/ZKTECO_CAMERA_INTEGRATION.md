# ZKTeco Camera Integration Guide

## Overview
This guide explains how to access live camera footage from ZKTeco IP cameras in your Smart Parking application.

## Camera Configuration
- **IP Address:** 192.168.0.109
- **HTTP Port:** 80
- **HTTPS Port:** 443
- **Username:** admin
- **Password:** Password123!

## Available Streaming Methods

### 1. MJPEG Stream (Recommended)
The MJPEG (Motion JPEG) stream provides real-time video by sending a continuous stream of JPEG images.

**Usage:**
```typescript
import { useCameraInterface } from '@/hooks/use-camera-interface';

const { loadMJPEGStream } = useCameraInterface();

// In your component
const containerRef = useRef<HTMLDivElement>(null);

const startStream = () => {
  if (containerRef.current) {
    loadMJPEGStream(containerRef.current);
  }
};
```

**Direct URL:**
```
http://admin:Password123!@192.168.0.109:80/cgi-bin/mjpeg
```

**Via Proxy API:**
```
GET /api/zkteco-stream?type=mjpeg
```

### 2. Live Snapshots
Captures individual frames from the camera at regular intervals (every 1 second).

**Usage:**
```typescript
const { captureSnapshot, getSnapshotUrl } = useCameraInterface();

// Single snapshot
const takeSnapshot = async () => {
  const result = await captureSnapshot();
  if (result.success) {
    console.log('Snapshot URL:', result.url);
  }
};

// Continuous snapshots
const startContinuousSnapshots = () => {
  const interval = setInterval(async () => {
    const result = await captureSnapshot();
    if (result.success && result.url) {
      // Update your image element
      imageElement.src = result.url;
    }
  }, 1000);
};
```

**Direct URL:**
```
http://admin:Password123!@192.168.0.109:80/cgi-bin/snapshot.cgi
```

**Via Proxy API:**
```
GET /api/zkteco-stream?type=snapshot&t=[timestamp]
```

### 3. Sub Stream (Lower Quality, Better for Web)
A lower resolution stream optimized for web viewing.

**Usage:**
```typescript
const { connectToLiveStream } = useCameraInterface();

const startSubStream = async () => {
  const result = await connectToLiveStream('sub');
  if (result.success) {
    console.log('Sub stream URL:', result.url);
  }
};
```

**Direct URL:**
```
http://admin:Password123!@192.168.0.109:80/live/sub
```

### 4. Main Stream (Higher Quality)
A higher resolution stream with better quality but requires more bandwidth.

**Usage:**
```typescript
const { connectToLiveStream } = useCameraInterface();

const startMainStream = async () => {
  const result = await connectToLiveStream('main');
  if (result.success) {
    console.log('Main stream URL:', result.url);
  }
};
```

**Direct URL:**
```
http://admin:Password123!@192.168.0.109:80/live/main
```

### 5. RTSP Stream (For Professional Players)
RTSP (Real-Time Streaming Protocol) is ideal for use with VLC Media Player or professional video applications.

**Usage:**
```typescript
const { copyRTSPUrl, getRTSPUrl } = useCameraInterface();

// Get RTSP URL
const rtspUrl = getRTSPUrl('main'); // or 'sub'
console.log(rtspUrl);
// rtsp://admin:Password123!@192.168.0.109:554/Streaming/Channels/101

// Copy to clipboard
const copyUrl = async () => {
  const result = await copyRTSPUrl('main');
  if (result.success) {
    alert('RTSP URL copied! Paste in VLC: Media > Open Network Stream');
  }
};
```

**URLs:**
- Main Stream: `rtsp://admin:Password123!@192.168.0.109:554/Streaming/Channels/101`
- Sub Stream: `rtsp://admin:Password123!@192.168.0.109:554/Streaming/Channels/102`

### 6. Web Interface
Direct access to the camera's built-in web interface.

**Usage:**
```typescript
const { connectToWebInterface } = useCameraInterface();

const loadInterface = async () => {
  const result = await connectToWebInterface();
  if (result.success) {
    // Load in iframe or window
    console.log('Interface URL:', result.url);
  }
};
```

**Direct URL:**
```
http://admin:Password123!@192.168.0.109:80/
```

## API Routes

### GET /api/zkteco-stream
Proxies requests to the ZKTeco camera to avoid CORS issues.

**Parameters:**
- `type`: Stream type (main | sub | mjpeg | snapshot)
- `t`: Optional timestamp for cache-busting

**Examples:**
```bash
# MJPEG Stream
curl http://localhost:3001/api/zkteco-stream?type=mjpeg

# Snapshot
curl http://localhost:3001/api/zkteco-stream?type=snapshot&t=1234567890

# Sub Stream
curl http://localhost:3001/api/zkteco-stream?type=sub
```

### POST /api/zkteco-stream
Provides additional camera operations.

**Test Connection:**
```typescript
const testConnection = async () => {
  const response = await fetch('/api/zkteco-stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'test-connection' }),
  });
  
  const result = await response.json();
  console.log(result);
};
```

**Get RTSP URL:**
```typescript
const getRTSP = async () => {
  const response = await fetch('/api/zkteco-stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      action: 'get-rtsp-url',
      streamType: 'main' // or 'sub'
    }),
  });
  
  const result = await response.json();
  console.log(result.rtspUrl);
};
```

## React Component Usage

### Using the Pre-built Component
```typescript
import { ZKTecoLiveView } from '@/app/operator/entry/components/zkteco-live-view';

export default function CameraPage() {
  return (
    <div className="container">
      <ZKTecoLiveView 
        onFullscreen={() => {
          document.documentElement.requestFullscreen();
        }}
      />
    </div>
  );
}
```

### Using the Hook Directly
```typescript
import { useCameraInterface } from '@/hooks/use-camera-interface';

export function MyCameraComponent() {
  const {
    isConnected,
    isLoading,
    error,
    currentUrl,
    connectToLiveStream,
    loadMJPEGStream,
    captureSnapshot,
    disconnect,
  } = useCameraInterface({
    ip: "192.168.0.109",
    httpPort: 80,
    username: "admin",
    password: "Password123!",
  });

  const streamRef = useRef<HTMLDivElement>(null);

  const handleStart = async () => {
    if (streamRef.current) {
      loadMJPEGStream(streamRef.current);
    }
  };

  return (
    <div>
      <button onClick={handleStart} disabled={isLoading}>
        Start Stream
      </button>
      <button onClick={disconnect} disabled={!isConnected}>
        Stop Stream
      </button>
      <div ref={streamRef} style={{ width: '100%', height: '400px' }} />
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

## Testing the Integration

### 1. Access the Test Page
Navigate to: `http://localhost:3001/operator/entry/zkteco-test`

### 2. Test Connection
Click the "Test Connection" button to verify the camera is accessible.

### 3. Try Different Streams
Start with "Live Snapshots" as it has the best compatibility, then try other methods.

### 4. View in VLC
1. Click "Copy RTSP" button
2. Open VLC Media Player
3. Go to Media > Open Network Stream
4. Paste the RTSP URL
5. Click Play

## Troubleshooting

### Camera Not Connecting
1. **Verify Network Connection**
   ```bash
   ping 192.168.0.109
   ```

2. **Check Camera Web Interface**
   Open in browser: `http://192.168.0.109`
   Login with: admin / Password123!

3. **Test API Route**
   ```bash
   curl http://localhost:3001/api/zkteco-stream?type=snapshot
   ```

### Stream Not Loading
1. **Check Browser Console** for error messages
2. **Try Different Methods** - Start with Live Snapshots
3. **Verify Credentials** in the camera settings
4. **Check Camera Settings** - Ensure streaming is enabled

### CORS Issues
The application uses proxy API routes to avoid CORS problems. Make sure:
- Next.js server is running
- API routes are accessible
- Camera allows access from the proxy

### Authentication Errors
If you get 401 errors:
1. Verify username and password are correct
2. Check if camera requires different authentication method
3. Try accessing camera web interface directly to confirm credentials

## Environment Variables (Optional)

You can configure camera settings via environment variables:

```env
# .env.local
CAMERA_IP=192.168.0.109
CAMERA_HTTP_PORT=80
CAMERA_HTTPS_PORT=443
CAMERA_USERNAME=admin
CAMERA_PASSWORD=Password123!
```

## Common ZKTeco Endpoints

Different ZKTeco models may use different endpoints:

```
# Video Streams
/live/main          # Main stream
/live/sub           # Sub stream
/cgi-bin/mjpeg      # MJPEG stream
/video.cgi          # Alternative video endpoint

# Snapshots
/cgi-bin/snapshot.cgi
/Streaming/Channels/1/picture
/snapshot.jpg

# RTSP
/Streaming/Channels/101  # Main stream
/Streaming/Channels/102  # Sub stream

# Web Interface
/
/live.html
/index.html
```

## Performance Tips

1. **Use Sub Stream for Web** - Lower bandwidth, better for web viewing
2. **Use Main Stream for Recording** - Higher quality, use for important recordings
3. **Snapshots for Compatibility** - Most reliable method across all cameras
4. **RTSP for Professional Use** - Best quality, use with dedicated players

## Security Considerations

1. **Change Default Password** - Update from Password123! to a secure password
2. **Use HTTPS** - Enable HTTPS on the camera if possible
3. **Network Isolation** - Keep camera on a separate VLAN
4. **Environment Variables** - Store credentials in environment variables, not in code
5. **Access Control** - Limit who can access the camera feeds

## Next Steps

1. Test the integration using the test page
2. Integrate the component into your main application
3. Customize the UI to match your needs
4. Set up recording/snapshot storage if needed
5. Configure alerts based on camera events

## Support

For issues specific to your ZKTeco camera model, consult:
- Camera manual for specific endpoints
- ZKTeco technical support
- Camera web interface documentation
