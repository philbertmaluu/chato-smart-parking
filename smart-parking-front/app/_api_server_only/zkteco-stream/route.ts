import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// ZKTeco Live Stream API Route
// Provides different streaming methods for ZKTeco cameras

interface ZKTecoCameraConfig {
  ip: string;
  port: number;
  username: string;
  password: string;
}

// Enhanced configuration with multiple fallbacks for ZKTeco cameras (Updated from actual camera settings)
const DEFAULT_CAMERA_CONFIG: ZKTecoCameraConfig = {
  ip: process.env.NEXT_PUBLIC_ZKTECO_IP || process.env.CAMERA_IP || '192.168.0.109',
  port: parseInt(process.env.NEXT_PUBLIC_ZKTECO_HTTP_PORT || process.env.CAMERA_HTTP_PORT || '80'),
  username: process.env.NEXT_PUBLIC_ZKTECO_USERNAME || process.env.CAMERA_USERNAME || '',
  password: process.env.NEXT_PUBLIC_ZKTECO_PASSWORD || process.env.CAMERA_PASSWORD || 'Password123!',
};

// Common ZKTeco stream endpoints (Updated from actual camera settings)
const STREAM_ENDPOINTS = {
  mainStream: '/ch01',
  subStream: '/ch01_sub',
  thirdStream: '/ch01_third',
  mjpeg: '/cgi-bin/mjpeg',
  snapshot: '/cgi-bin/snapshot.cgi',
  liveView: '/live.html',
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const streamType = searchParams.get('type') || 'sub'; // main, sub, mjpeg, snapshot
    const timestamp = searchParams.get('t'); // For cache busting
    const testMode = searchParams.get('test'); // For connection testing

    // Allow custom camera config from headers (for setup page)
    const customIp = request.headers.get('X-Camera-IP');
    const customUsername = request.headers.get('X-Camera-Username');
    const customPassword = request.headers.get('X-Camera-Password');

    const config = {
      ip: customIp || DEFAULT_CAMERA_CONFIG.ip,
      port: DEFAULT_CAMERA_CONFIG.port,
      username: customUsername || DEFAULT_CAMERA_CONFIG.username,
      password: customPassword || DEFAULT_CAMERA_CONFIG.password,
    };
    
    // Determine endpoint based on stream type
    let endpoint = '';
    switch (streamType) {
      case 'main':
        endpoint = STREAM_ENDPOINTS.mainStream;
        break;
      case 'sub':
        endpoint = STREAM_ENDPOINTS.subStream;
        break;
      case 'mjpeg':
        endpoint = STREAM_ENDPOINTS.mjpeg;
        break;
      case 'snapshot':
        endpoint = STREAM_ENDPOINTS.snapshot;
        break;
      default:
        endpoint = STREAM_ENDPOINTS.subStream;
    }

    // Build camera URL
    const cameraUrl = `http://${config.ip}:${config.port}${endpoint}`;
    
    // Create authorization header
    const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
    
    console.log(`[ZKTeco] Fetching stream: ${cameraUrl.replace(config.password, '***')}`);

    // Fetch from camera with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const response = await fetch(cameraUrl, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'User-Agent': 'Mozilla/5.0 (compatible; SmartParkingApp/1.0)',
          'Accept': streamType === 'mjpeg' ? 'multipart/x-mixed-replace' : 'image/jpeg',
        },
        signal: controller.signal,
        // @ts-ignore
        cache: 'no-store',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`[ZKTeco] Camera responded with status ${response.status} for ${streamType} stream`);
        
        // Provide specific error messages for common issues
        let errorMessage = `Camera responded with status ${response.status}`;
        if (response.status === 401) {
          errorMessage = 'Authentication failed - check username and password';
        } else if (response.status === 404) {
          errorMessage = `Stream endpoint not found - ${streamType} may not be supported`;
        } else if (response.status === 503) {
          errorMessage = 'Camera service unavailable - device may be busy';
        }

        return NextResponse.json(
          { 
            error: errorMessage,
            status_code: response.status,
            stream_type: streamType,
            cameraUrl: cameraUrl.replace(config.password, '***'),
          },
          { status: response.status }
        );
      }

      // Get the content type from camera response
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      
      // For MJPEG streams, we need to handle them differently
      if (streamType === 'mjpeg' || contentType.includes('multipart')) {
        // Stream the MJPEG content
        const data = await response.arrayBuffer();
        
        return new NextResponse(data, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // For snapshots or other image types
      const data = await response.arrayBuffer();
      
      return new NextResponse(data, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': streamType === 'snapshot' ? 'no-cache' : 'no-store',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('Camera request timeout');
        return NextResponse.json(
          { error: 'Camera connection timeout', cameraUrl: cameraUrl.replace(config.password, '***') },
          { status: 504 }
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('ZKTeco stream error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to connect to ZKTeco camera',
        details: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Make sure the camera is online and the IP address is correct'
      },
      { status: 500 }
    );
  }
}

// Get camera info and test connection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === 'test-connection') {
      const config = DEFAULT_CAMERA_CONFIG;
      const testUrl = `http://${config.ip}:${config.port}/`;
      const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');

      try {
        const response = await fetch(testUrl, {
          method: 'HEAD',
          headers: {
            'Authorization': `Basic ${auth}`,
          },
          signal: AbortSignal.timeout(5000),
        });

        return NextResponse.json({
          success: response.ok,
          status: response.status,
          message: response.ok ? 'Camera connection successful' : 'Camera returned error',
          config: {
            ip: config.ip,
            port: config.port,
            username: config.username,
          },
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          message: 'Failed to connect to camera',
          error: error instanceof Error ? error.message : 'Unknown error',
          config: {
            ip: config.ip,
            port: config.port,
            username: config.username,
          },
        }, { status: 500 });
      }
    }

    if (action === 'get-rtsp-url') {
      const config = DEFAULT_CAMERA_CONFIG;
      const streamType = body.streamType || 'main';
      const rtspPort = 554;
      
      const rtspEndpoint = streamType === 'main' 
        ? '/ch01' 
        : '/ch01_sub';
      
      const rtspUrl = `rtsp://${config.username}:${encodeURIComponent(config.password)}@${config.ip}:${rtspPort}${rtspEndpoint}`;
      
      return NextResponse.json({
        success: true,
        rtspUrl,
        message: 'Copy this URL to VLC or another RTSP player',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('ZKTeco API POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
