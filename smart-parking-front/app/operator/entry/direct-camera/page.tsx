"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  AlertCircle, 
  CheckCircle,
  RefreshCw,
  ExternalLink,
  Copy
} from "lucide-react";

export default function DirectCameraAccessPage() {
  const [cameraIp, setCameraIp] = useState("192.168.0.109");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Password123!");
  const [streamMethod, setStreamMethod] = useState<'iframe' | 'img' | 'video' | null>(null);
  const [currentUrl, setCurrentUrl] = useState("");
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Generate authenticated URL
  const getAuthUrl = (path: string = "/") => {
    return `http://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${cameraIp}${path}`;
  };

  // Method 1: Load camera web interface in iframe
  const loadWebInterface = () => {
    const url = getAuthUrl("/");
    setCurrentUrl(url);
    setStreamMethod('iframe');
  };

  // Method 2: Load MJPEG stream as image
  const loadMJPEGStream = () => {
    const url = getAuthUrl("/cgi-bin/mjpeg");
    setCurrentUrl(url);
    setStreamMethod('img');
    
    if (imgRef.current) {
      imgRef.current.src = url;
    }
  };

  // Method 3: Load snapshot (refreshing)
  const loadSnapshotStream = () => {
    const url = getAuthUrl("/cgi-bin/snapshot.cgi");
    setCurrentUrl(url);
    setStreamMethod('img');
    
    // Refresh snapshot every second
    const interval = setInterval(() => {
      if (imgRef.current) {
        imgRef.current.src = getAuthUrl(`/cgi-bin/snapshot.cgi?t=${Date.now()}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  };

  // Try alternative endpoints
  const tryAlternativeEndpoint = (endpoint: string) => {
    const url = getAuthUrl(endpoint);
    setCurrentUrl(url);
    setStreamMethod('img');
    
    if (imgRef.current) {
      imgRef.current.src = url;
    }
  };

  // Copy URL to clipboard
  const copyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    alert('URL copied to clipboard!');
  };

  // Open in new tab
  const openInNewTab = () => {
    window.open(currentUrl, '_blank');
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Direct Camera Access</h1>
        <p className="text-muted-foreground">
          Access camera directly from browser (no server-side proxy needed)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Camera Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="ip">Camera IP</Label>
                <Input
                  id="ip"
                  value={cameraIp}
                  onChange={(e) => setCameraIp(e.target.value)}
                  placeholder="192.168.0.109"
                />
              </div>
              <div>
                <Label htmlFor="user">Username</Label>
                <Input
                  id="user"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                />
              </div>
              <div>
                <Label htmlFor="pass">Password</Label>
                <Input
                  id="pass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password123!"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={loadWebInterface}
                variant="default"
                size="sm"
                className="w-full"
              >
                <Video className="w-4 h-4 mr-2" />
                Load Web Interface
              </Button>
              
              <Button
                onClick={loadMJPEGStream}
                variant="default"
                size="sm"
                className="w-full"
              >
                <Video className="w-4 h-4 mr-2" />
                MJPEG Stream
              </Button>
              
              <Button
                onClick={loadSnapshotStream}
                variant="default"
                size="sm"
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Live Snapshots
              </Button>

              <div className="pt-2 border-t">
                <p className="text-xs font-semibold mb-2 text-muted-foreground">Try Alternative Endpoints:</p>
                <div className="space-y-1">
                  <Button
                    onClick={() => tryAlternativeEndpoint("/live/main")}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                  >
                    /live/main
                  </Button>
                  <Button
                    onClick={() => tryAlternativeEndpoint("/live/sub")}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                  >
                    /live/sub
                  </Button>
                  <Button
                    onClick={() => tryAlternativeEndpoint("/Streaming/Channels/1/picture")}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                  >
                    /Streaming/Channels/1/picture
                  </Button>
                  <Button
                    onClick={() => tryAlternativeEndpoint("/video.cgi")}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                  >
                    /video.cgi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {currentUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Current URL</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xs font-mono break-all bg-muted p-2 rounded">
                  {currentUrl}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={copyUrl}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                  <Button
                    onClick={openInNewTab}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Open
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Video Display Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Live Feed</span>
                {streamMethod && (
                  <Badge variant="default">
                    {streamMethod === 'iframe' ? '🌐 Web Interface' : 
                     streamMethod === 'img' ? '📸 Image Stream' : 
                     '🎥 Video'}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ minHeight: '500px' }}>
                {/* Iframe Display */}
                {streamMethod === 'iframe' && currentUrl && (
                  <iframe
                    ref={iframeRef}
                    src={currentUrl}
                    className="w-full h-full border-0"
                    style={{ minHeight: '500px' }}
                    allow="camera; microphone; autoplay; fullscreen"
                    title="Camera Interface"
                  />
                )}

                {/* Image Display (MJPEG or Snapshots) */}
                {streamMethod === 'img' && currentUrl && (
                  <img
                    ref={imgRef}
                    src={currentUrl}
                    alt="Camera Stream"
                    className="w-full h-full object-contain"
                    style={{ minHeight: '500px' }}
                    onError={(e) => {
                      console.error('Image failed to load:', currentUrl);
                    }}
                  />
                )}

                {/* Placeholder */}
                {!streamMethod && (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="text-center">
                      <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No Stream Active</p>
                      <p className="text-sm text-gray-400">
                        Select a streaming method from the left panel
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">📖 Instructions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Since you can access the camera in Safari:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Click "Load Web Interface" to see the full camera UI</li>
                    <li>Try "MJPEG Stream" for real-time video</li>
                    <li>Use "Live Snapshots" if MJPEG doesn't work</li>
                    <li>If those don't work, try the alternative endpoints below</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="bg-muted p-3 rounded space-y-1">
                <p className="font-semibold">💡 Tips:</p>
                <ul className="text-xs space-y-1 ml-4 list-disc">
                  <li>This page accesses the camera directly (no proxy)</li>
                  <li>Works the same way as Safari</li>
                  <li>Your browser may ask for camera credentials</li>
                  <li>If you see a login prompt, enter username and password again</li>
                  <li>Try "Open" button to test in a new tab</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
