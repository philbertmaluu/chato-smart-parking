"use client";

import { ZKTecoLiveView } from "../components/zkteco-live-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ZKTecoCameraTestPage() {
  const handleFullscreen = () => {
    // Toggle fullscreen mode
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">ZKTeco Camera Live View</h1>
        <p className="text-muted-foreground">
          Access live camera footage from your ZKTeco IP camera at 192.168.0.109
        </p>
      </div>

      <ZKTecoLiveView onFullscreen={handleFullscreen} />

      {/* Additional Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Camera Access Methods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. MJPEG Stream (Recommended for Web)</h3>
            <p className="text-sm text-muted-foreground">
              Uses the Motion JPEG protocol to stream live video directly in the browser. 
              This is the most reliable method for web applications.
            </p>
            <code className="block mt-2 p-2 bg-muted rounded text-xs">
              http://admin:Password123!@192.168.0.109:80/cgi-bin/mjpeg
            </code>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2. Live Snapshots</h3>
            <p className="text-sm text-muted-foreground">
              Captures individual frames from the camera every second. Best compatibility 
              with all cameras and doesn't require streaming protocols.
            </p>
            <code className="block mt-2 p-2 bg-muted rounded text-xs">
              http://admin:Password123!@192.168.0.109:80/cgi-bin/snapshot.cgi
            </code>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3. RTSP Stream (For VLC/Professional Players)</h3>
            <p className="text-sm text-muted-foreground">
              Real-Time Streaming Protocol for high-quality video playback in dedicated players 
              like VLC Media Player. Use the "Copy RTSP" button to get the URL.
            </p>
            <code className="block mt-2 p-2 bg-muted rounded text-xs">
              rtsp://admin:Password123!@192.168.0.109:554/Streaming/Channels/101
            </code>
          </div>

          <div>
            <h3 className="font-semibold mb-2">4. Web Interface</h3>
            <p className="text-sm text-muted-foreground">
              Direct access to the camera's built-in web interface. You may need to log in 
              using the credentials (admin / Password123!) within the iframe.
            </p>
            <code className="block mt-2 p-2 bg-muted rounded text-xs">
              http://192.168.0.109:80/
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Camera not connecting?</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
            <li>Make sure the camera is powered on and connected to the network</li>
            <li>Verify the IP address (192.168.0.109) is correct</li>
            <li>Check that your computer is on the same network as the camera</li>
            <li>Try pinging the camera: <code className="bg-muted px-1">ping 192.168.0.109</code></li>
            <li>Verify credentials are correct (admin / Password123!)</li>
          </ul>

          <p className="mt-4"><strong>Stream not loading?</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
            <li>Try the "Test Connection" button first</li>
            <li>Start with "Live Snapshots" as it has the best compatibility</li>
            <li>If MJPEG fails, the camera may use different endpoints</li>
            <li>Use the "Web Interface" option to access the camera directly</li>
            <li>Check browser console for specific error messages</li>
          </ul>

          <p className="mt-4"><strong>CORS Errors?</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
            <li>The application uses a proxy API to avoid CORS issues</li>
            <li>Make sure the Next.js server is running</li>
            <li>Check that API routes are accessible at /api/zkteco-stream</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
