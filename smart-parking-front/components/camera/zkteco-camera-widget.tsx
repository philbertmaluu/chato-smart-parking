"use client";

import React, { useRef, useState, useEffect } from "react";
import { useZKTecoCamera } from "@/hooks/use-zkteco-camera";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Camera,
  Video,
  Image as ImageIcon,
  Play,
  Square,
  RefreshCw,
  Settings,
  Maximize,
  Copy,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle,
  XCircle,
  Monitor,
  ChevronDown,
  Zap,
} from "lucide-react";

interface ZKTecoCameraWidgetProps {
  className?: string;
  showControls?: boolean;
  defaultStreamType?: 'mjpeg' | 'snapshot';
  autoConnect?: boolean;
  onFullscreen?: () => void;
  onSnapshot?: (imageUrl: string) => void;
}

export function ZKTecoCameraWidget({
  className = "",
  showControls = true,
  defaultStreamType = 'mjpeg',
  autoConnect = true,
  onFullscreen,
  onSnapshot,
}: ZKTecoCameraWidgetProps) {
  const {
    // State
    isConnected,
    isLoading,
    error,
    currentStreamType,
    streamActive,
    connectionStatus,
    lastSnapshot,
    deviceInfo,
    config,
    
    // Methods
    testConnection,
    startMJPEGStream,
    startSnapshotStream,
    stopStream,
    captureSnapshot,
    getRtspUrls,
    getDeviceInfo,
  } = useZKTecoCamera({ autoConnect });

  const streamContainerRef = useRef<HTMLDivElement>(null);
  const [rtspUrls, setRtspUrls] = useState<{ main?: string; sub?: string }>({});
  const [snapshotInterval, setSnapshotInterval] = useState(2000);

  // Get device info on connection
  useEffect(() => {
    if (isConnected && !deviceInfo) {
      getDeviceInfo();
    }
  }, [isConnected, deviceInfo, getDeviceInfo]);

  // Auto-start default stream if configured
  useEffect(() => {
    if (isConnected && !streamActive && defaultStreamType && streamContainerRef.current) {
      if (defaultStreamType === 'mjpeg') {
        handleStartMJPEG();
      } else if (defaultStreamType === 'snapshot') {
        handleStartSnapshots();
      }
    }
  }, [isConnected, streamActive, defaultStreamType]);

  const handleTestConnection = async () => {
    const result = await testConnection();
    if (result.success) {
      // Also get RTSP URLs
      const mainRtsp = await getRtspUrls('main');
      const subRtsp = await getRtspUrls('sub');
      
      setRtspUrls({
        main: mainRtsp.data?.rtsp_url,
        sub: subRtsp.data?.rtsp_url,
      });
    }
  };

  const handleStartMJPEG = async () => {
    if (streamContainerRef.current) {
      await startMJPEGStream(streamContainerRef.current);
    }
  };

  const handleStartSnapshots = async () => {
    if (streamContainerRef.current) {
      await startSnapshotStream(streamContainerRef.current, snapshotInterval);
    }
  };

  const handleCaptureSnapshot = async () => {
    const result = await captureSnapshot();
    if (result.success && result.data?.url && onSnapshot) {
      onSnapshot(result.data.url);
    }
  };

  const handleCopyRtspUrl = async (type: 'main' | 'sub') => {
    try {
      const result = await getRtspUrls(type);
      if (result.success && result.data?.rtsp_url) {
        await navigator.clipboard.writeText(result.data.rtsp_url);
        // You could add a toast notification here
      }
    } catch (error) {
      console.error('Failed to copy RTSP URL:', error);
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'default';
      case 'connecting': return 'secondary';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <CheckCircle className="w-4 h-4" />;
      case 'connecting': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              ZKTeco Camera Feed
            </CardTitle>
            <CardDescription>
              IP: {config.ip}:{config.httpPort} • Real-time monitoring
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={getStatusColor()}>
              {getStatusIcon()}
              {connectionStatus}
            </Badge>
            
            {onFullscreen && (
              <Button
                variant="outline"
                size="sm"
                onClick={onFullscreen}
              >
                <Maximize className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Camera Stream Container */}
        <div className="relative">
          <div
            ref={streamContainerRef}
            className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 overflow-hidden"
          >
            {!streamActive && !isLoading && (
              <div className="text-center text-gray-500 dark:text-gray-400">
                <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Camera feed will appear here</p>
                <p className="text-xs">Click a stream button to start</p>
              </div>
            )}
            
            {isLoading && (
              <div className="text-center text-gray-500 dark:text-gray-400">
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                <p className="text-sm">Loading camera stream...</p>
              </div>
            )}
          </div>

          {/* Stream Info Overlay */}
          {streamActive && (
            <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              LIVE • {currentStreamType?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Control Buttons */}
        {showControls && (
          <div className="space-y-3">
            <Separator />
            
            {/* Connection Controls */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleTestConnection}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Test Connection
              </Button>
              
              {streamActive && (
                <Button
                  onClick={stopStream}
                  variant="outline"
                  size="sm"
                >
                  <Square className="w-4 h-4" />
                  Stop Stream
                </Button>
              )}
            </div>

            {/* Stream Controls */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleStartMJPEG}
                disabled={!isConnected || isLoading}
                variant={currentStreamType === 'mjpeg' ? 'default' : 'outline'}
                size="sm"
              >
                <Video className="w-4 h-4 mr-2" />
                MJPEG Stream
              </Button>
              
              <Button
                onClick={handleStartSnapshots}
                disabled={!isConnected || isLoading}
                variant={currentStreamType === 'snapshot' ? 'default' : 'outline'}
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Live Snapshots
              </Button>
            </div>

            {/* Snapshot Controls */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleCaptureSnapshot}
                disabled={!isConnected || isLoading}
                variant="outline"
                size="sm"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Capture Photo
              </Button>

              {/* RTSP URLs Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    RTSP
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleCopyRtspUrl('main')}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Main Stream URL
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCopyRtspUrl('sub')}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Sub Stream URL
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Device Information */}
            {deviceInfo && (
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  Device Information
                </h4>
                <div className="text-xs space-y-1 font-mono">
                  {Object.entries(deviceInfo).slice(0, 3).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{key}:</span>
                      <span className="text-gray-900 dark:text-gray-100">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}