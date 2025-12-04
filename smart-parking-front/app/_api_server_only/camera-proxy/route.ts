import { NextRequest, NextResponse } from 'next/server';

// ZKTeco Camera Proxy API Route
// This proxy helps avoid CORS issues when accessing the camera directly from the browser

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');
    const streamType = searchParams.get('streamType') || 'sub';
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Camera credentials (should ideally come from environment variables)
    const username = process.env.CAMERA_USERNAME || 'admin';
    const password = process.env.CAMERA_PASSWORD || 'Password123!';
    
    // Create authorization header
    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    
    // Fetch from camera
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
      // @ts-ignore - Next.js specific options
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Camera responded with status ${response.status}` },
        { status: response.status }
      );
    }

    // Get the content type from camera response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Create response with the stream
    const data = await response.arrayBuffer();
    
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Camera proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to camera', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle POST requests for streaming
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, username, password } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Use provided credentials or defaults
    const auth = Buffer.from(
      `${username || 'admin'}:${password || 'Password123!'}`
    ).toString('base64');

    // Fetch from camera
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
      // @ts-ignore
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Camera responded with status ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Camera proxy POST error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy camera request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
