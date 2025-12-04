"use client";

import { useEffect, useRef, useState } from "react";
import { useCameraInterface } from "@/hooks/use-camera-interface";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Video, 
  Image as ImageIcon, 
  MonitorPlay, 
  Copy, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  Maximize,
  ExternalLink
} from "lucide-react";

interface ZKTecoLiveViewProps {
  className?: string;
  onFullscreen?: () => void;
}

export function ZKTecoLiveView({ className = "", onFullscreen }: ZKTecoLiveViewProps) {
  const {
    isConnected,
    isLoading,
    error,
    currentUrl,
    connectToLiveStream,
    connectToWebInterface,
    loadMJPEGStream,
    captureSnapshot,
    copyRTSPUrl,
    testLiveStream,
    getLiveStreamUrl,
    getSnapshotUrl,
    disconnect,
    cameraConfig,
  } = useCameraInterface();

  const [streamMode, setStreamMode] = useState<'mjpeg' | 'iframe' | 'snapshot' | null>(null);
  const [lastSnapshot, setLastSnapshot] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<boolean | null>(null);
  const [snapshotInterval, setSnapshotInterval] = useState<NodeJS.Timeout | null>(null);
  
  const streamContainerRef = useRef<HTMLDivElement>(null);
  const snapshotImageRef = useRef<HTMLImageElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (snapshotInterval) {
        clearInterval(snapshotInterval);
      }
      disconnect();
    };
  }, [snapshotInterval, disconnect]);

  // Handle MJPEG stream loading
  const handleStartMJPEGStream = async () => {
    if (streamContainerRef.current) {
      setStreamMode('mjpeg');
      const result = loadMJPEGStream(streamContainerRef.current);
      if (!result.success) {
        console.error('Failed to load MJPEG stream:', result.error);
      }
    }
  };

  // Handle web interface loading
  const handleLoadWebInterface = async () => {
    setStreamMode('iframe');
    await connectToWebInterface();
  };

  // Handle sub-stream loading
  const handleLoadSubStream = async () => {
    setStreamMode('iframe');
    await connectToLiveStream('sub');
  };

  // Handle main stream loading
  const handleLoadMainStream = async () => {
    setStreamMode('iframe');
    await connectToLiveStream('main');
  };

  // Handle snapshot capture
  const handleCaptureSnapshot = async () => {
    const result = await captureSnapshot();
    if (result.success && result.url) {
      setLastSnapshot(result.url);
      setStreamMode('snapshot');
    }
  };

  // Handle continuous snapshots
  const handleStartContinuousSnapshots = () => {
    setStreamMode('snapshot');
    
    // Clear existing interval
    if (snapshotInterval) {
      clearInterval(snapshotInterval);
    }

    // Capture initial snapshot
    handleCaptureSnapshot();

    // Set up interval for continuous snapshots (every 1 second)
    const interval = setInterval(() => {
      captureSnapshot().then(result => {
        if (result.success && result.url) {
          setLastSnapshot(result.url);
        }
      });
    }, 1000);

    setSnapshotInterval(interval);
  };

  // Stop continuous snapshots
  const handleStopStream = () => {
    if (snapshotInterval) {
      clearInterval(snapshotInterval);
      setSnapshotInterval(null);
    }
    disconnect();
    setStreamMode(null);
    setLastSnapshot(null);
  };

  // Test connection
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionTestResult(null);
    
    const result = await testLiveStream('sub');
    setConnectionTestResult(result);
    
    setTimeout(() => {
      setTestingConnection(false);
    }, 2000);
  };

  // Copy RTSP URL
  const handleCopyRTSP = async () => {
    const result = await copyRTSPUrl('main');
    if (result.success) {
      alert(`RTSP URL copied to clipboard!\n\nOpen VLC Media Player and use:\nMedia > Open Network Stream\n\nPaste: ${result.url}`);
    } else {
      alert('Failed to copy RTSP URL: ' + result.error);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Camera Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              ZKTeco Camera Live View
            </span>
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Camera Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">IP Address</p>
              <p className="font-mono">{cameraConfig.ip}</p>
            </div>
            <div>
              <p className="text-muted-foreground">HTTP Port</p>
              <p className="font-mono">{cameraConfig.httpPort}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Username</p>
              <p className="font-mono">{cameraConfig.username}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <div className="flex items-center gap-2">
                {connectionTestResult === true && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Online
                  </Badge>
                )}
                {connectionTestResult === false && (
                  <Badge variant="destructive">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Offline
                  </Badge>
                )}
                {connectionTestResult === null && (
                  <Badge variant="secondary">Unknown</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Test Connection */}
          <Button
            onClick={handleTestConnection}
            disabled={testingConnection}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {testingConnection ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Test Connection
          </Button>
        </CardContent>
      </Card>

      {/* Stream Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stream Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Quick Start Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleStartMJPEGStream}
              disabled={isLoading || (isConnected && streamMode === 'mjpeg')}
              variant="default"
              className="w-full"
            >
              <Video className="w-4 h-4 mr-2" />
              MJPEG Stream
            </Button>
            
            <Button
              onClick={handleStartContinuousSnapshots}
              disabled={isLoading || (isConnected && streamMode === 'snapshot')}
              variant="default"
              className="w-full"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Live Snapshots
            </Button>

            <Button
              onClick={handleLoadSubStream}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              <MonitorPlay className="w-4 h-4 mr-2" />
              Sub Stream
            </Button>

            <Button
              onClick={handleLoadMainStream}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              <MonitorPlay className="w-4 h-4 mr-2" />
              Main Stream
            </Button>
          </div>

          {/* Additional Controls */}
          <div className="flex gap-2">
            <Button
              onClick={handleLoadWebInterface}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Web Interface
            </Button>

            <Button
              onClick={handleCopyRTSP}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy RTSP
            </Button>
          </div>

          {/* Stop Button */}
          {isConnected && (
            <Button
              onClick={handleStopStream}
              variant="destructive"
              size="sm"
              className="w-full"
            >
              Stop Stream
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stream Display Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>Live Feed</span>
            {onFullscreen && isConnected && (
              <Button
                onClick={onFullscreen}
                variant="ghost"
                size="sm"
              >
                <Maximize className="w-4 h-4" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ minHeight: '400px', maxHeight: '600px' }}>
            {/* Loading State */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <div className="text-center text-white">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p>Connecting to camera...</p>
                </div>
              </div>
            )}

            {/* MJPEG Stream Container */}
            {streamMode === 'mjpeg' && (
              <div ref={streamContainerRef} className="w-full h-full flex items-center justify-center" />
            )}

            {/* Iframe Stream */}
            {streamMode === 'iframe' && currentUrl && (
              <iframe
                src={currentUrl}
                className="w-full h-full border-0"
                style={{ minHeight: '400px' }}
                allow="camera; microphone; autoplay; fullscreen"
                title="ZKTeco Camera Stream"
              />
            )}

            {/* Snapshot Display */}
            {streamMode === 'snapshot' && lastSnapshot && (
              <div className="w-full h-full flex items-center justify-center">
                <img
                  ref={snapshotImageRef}
                  src={lastSnapshot}
                  alt="Camera Snapshot"
                  className="max-w-full max-h-full object-contain"
                  onError={() => {
                    console.error('Failed to load snapshot');
                  }}
                />
              </div>
            )}

            {/* Placeholder */}
            {!streamMode && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center">
                  <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No Stream Active</p>
                  <p className="text-sm text-gray-400">Select a stream method above to start viewing</p>
                </div>
              </div>
            )}
          </div>

          {/* Stream Info */}
          {isConnected && streamMode && (
            <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium mb-1">Current Stream:</p>
              <p className="font-mono text-xs break-all text-muted-foreground">
                {streamMode === 'snapshot' && lastSnapshot && lastSnapshot}
                {streamMode === 'mjpeg' && getLiveStreamUrl('mjpeg', false)}
                {streamMode === 'iframe' && currentUrl && currentUrl}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>MJPEG Stream:</strong> Best for web viewing, real-time video stream</p>
            <p><strong>Live Snapshots:</strong> Updates every second, works with most cameras</p>
            <p><strong>Sub/Main Stream:</strong> Direct camera stream (may require login in iframe)</p>
            <p><strong>Web Interface:</strong> Access full camera settings and controls</p>
            <p><strong>RTSP URL:</strong> For VLC or professional video players</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
