import { NextRequest, NextResponse } from 'next/server';

// Secure camera proxy API route
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cameraUrl = searchParams.get('url');
    const assetPath = searchParams.get('asset');

    if (!cameraUrl) {
      return NextResponse.json(
        { error: 'Missing camera URL parameter' },
        { status: 400 }
      );
    }

    // Validate URL (only allow HTTP/HTTPS)
    let urlObj;
    try {
      urlObj = new URL(cameraUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return NextResponse.json(
        { error: 'Invalid protocol' },
        { status: 400 }
      );
    }

    // Check if URL is from allowed camera IPs (security measure)
    const allowedIPs = ['192.168.0.103']; // Add your camera IPs
    if (!allowedIPs.includes(urlObj.hostname)) {
      return NextResponse.json(
        { error: 'Camera IP not allowed' },
        { status: 403 }
      );
    }

    // Construct the full URL to fetch
    let fetchUrl = cameraUrl;
    if (assetPath) {
      // If requesting a specific asset, append it to the base URL
      fetchUrl = `${cameraUrl.replace(/\/$/, '')}/${assetPath.replace(/^\//, '')}`;
    }

    console.log('Fetching camera content from:', fetchUrl);
    
    try {
      // Use basic authentication headers instead of URL-based auth
      const authHeader = 'Basic ' + Buffer.from('admin:Password123!').toString('base64');
      
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'SmartParking-CameraProxy/1.0',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.5',
          'Authorization': authHeader,
        },
      });

      if (!response.ok) {
        console.error('Camera request failed:', response.status, response.statusText);
        return NextResponse.json(
          { error: `Camera request failed: ${response.status}` },
          { status: response.status }
        );
      }

      const content = await response.text();
      console.log('Camera content fetched successfully, length:', content.length);

      // Determine content type based on file extension
      let contentType = 'text/html';
      let processedContent = content;
      
      if (assetPath) {
        if (assetPath.endsWith('.css')) contentType = 'text/css';
        else if (assetPath.endsWith('.js')) contentType = 'application/javascript';
        else if (assetPath.endsWith('.json')) contentType = 'application/json';
        else if (assetPath.endsWith('.png')) contentType = 'image/png';
        else if (assetPath.endsWith('.jpg') || assetPath.endsWith('.jpeg')) contentType = 'image/jpeg';
        else if (assetPath.endsWith('.gif')) contentType = 'image/gif';
        else if (assetPath.endsWith('.svg')) contentType = 'image/svg+xml';
        else if (assetPath.endsWith('.map')) contentType = 'application/json'; // Source maps
        else if (assetPath.endsWith('.ico')) contentType = 'image/x-icon';
        else if (assetPath.endsWith('.woff')) contentType = 'font/woff';
        else if (assetPath.endsWith('.woff2')) contentType = 'font/woff2';
        else if (assetPath.endsWith('.ttf')) contentType = 'font/ttf';
        else if (assetPath.endsWith('.eot')) contentType = 'application/vnd.ms-fontobject';
      } else {
        // For HTML content, rewrite all static asset URLs to go through the proxy
        const baseUrl = cameraUrl.replace(/\/$/, '');
        const proxyBase = `/api/camera-proxy/?url=${encodeURIComponent(baseUrl)}&asset=`;
        
        // Rewrite CSS and JS file references (handle both quoted and unquoted attributes)
        processedContent = content
          .replace(/href=static\/([^" >]+)/g, `href="${proxyBase}static/$1"`)
          .replace(/src=static\/([^" >]+)/g, `src="${proxyBase}static/$1"`)
          .replace(/href="static\/([^"]+)"/g, `href="${proxyBase}static/$1"`)
          .replace(/src="static\/([^"]+)"/g, `src="${proxyBase}static/$1"`)
          // Also handle any other file references that might be in the HTML
          .replace(/url\(static\/([^)]+)\)/g, `url(${proxyBase}static/$1)`)
          .replace(/url\("static\/([^"]+)"\)/g, `url("${proxyBase}static/$1")`);
      }

      // Return content with secure headers that allow iframe embedding
      return new NextResponse(processedContent, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'X-Frame-Options': 'ALLOWALL', // Allow embedding in your app
          'X-Content-Type-Options': 'nosniff',
          'X-XSS-Protection': '1; mode=block',
        },
      });
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch camera content' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Camera proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, username, password } = await request.json();

    // Validate input
    if (!url || !username || !password) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Validate URL (only allow HTTP/HTTPS)
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return NextResponse.json(
        { error: 'Invalid protocol' },
        { status: 400 }
      );
    }

    // Check if URL is from allowed camera IPs (security measure)
    const allowedIPs = ['192.168.0.103']; // Add your camera IPs
    if (!allowedIPs.includes(urlObj.hostname)) {
      return NextResponse.json(
        { error: 'Camera IP not allowed' },
        { status: 403 }
      );
    }

    // Fetch camera content with authentication
    const authUrl = url.replace('://', `://${username}:${password}@`);
    
    const response = await fetch(authUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'SmartParking-CameraProxy/1.0',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Camera request failed: ${response.status}` },
        { status: response.status }
      );
    }

    const content = await response.text();

    // Return content with secure headers
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'X-Frame-Options': 'ALLOWALL', // Allow embedding in your app
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block',
      },
    });
  } catch (error) {
    console.error('Camera proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
