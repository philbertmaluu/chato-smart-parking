"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StreamType, StreamStatus, StreamStats } from "@/hooks/use-stream";
import { 
  Play, 
  Square, 
  Camera, 
  Video, 
  Image, 
  Zap, 
  TestTube, 
  Copy, 
  ExternalLink,
  Loader2
} from "lucide-react";

interface StreamControlsProps {
  streamActive: boolean;
  currentStreamType: StreamType;
  streamStatus: StreamStatus;
  stats: StreamStats;
  error: string | null;
  onStartMJPEG: () => void;
  onStartSnapshot: () => void;
  onStartHLS: () => void;
  onCaptureSnapshot: () => void;
  onStopStream: () => void;
  onTestConnection: () => void;
  onCopyStreamURL: () => void;
}

export function StreamControls({
  streamActive,
  currentStreamType,
  streamStatus,
  stats,
  error,
  onStartMJPEG,
  onStartSnapshot,
  onStartHLS,
  onCaptureSnapshot,
  onStopStream,
  onTestConnection,
  onCopyStreamURL
}: StreamControlsProps) {

  const getMethodBadgeVariant = (method: StreamType) => {
    return currentStreamType === method && streamActive ? "default" : "outline";
  };

  return (
    <Card className="glass-effect border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2">
          <Video className="w-5 h-5" />
          <span>Stream Controls</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Actions */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">Quick Actions</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={onStartMJPEG}
              disabled={streamActive}
              className="gradient-maroon hover:opacity-90 transition-opacity"
              size="sm"
            >
              {streamStatus === 'starting' && currentStreamType === 'optimized' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Start Live Stream
            </Button>
            <Button
              onClick={onStopStream}
              disabled={!streamActive}
              variant="destructive"
              size="sm"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop Stream
            </Button>
            <Button
              onClick={onCaptureSnapshot}
              variant="outline"
              size="sm"
            >
              <Camera className="w-4 h-4 mr-2" />
              Take Snapshot
            </Button>
          </div>
        </div>

        {/* Stream Methods */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">Stream Methods</h4>
          <div className="space-y-2">
            {/* MJPEG Stream */}
            <div className={`p-3 border rounded-lg transition-all ${
              currentStreamType === 'optimized' && streamActive 
                ? 'border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-700' 
                : 'border-gray-200 dark:border-gray-700'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4" />
                    <span className="font-medium">MJPEG Stream</span>
                    <Badge variant={getMethodBadgeVariant('optimized')}>
                      Recommended
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Real-time video streaming
                  </p>
                </div>
                <Button
                  onClick={onStartMJPEG}
                  disabled={streamActive}
                  size="sm"
                  variant="outline"
                >
                  {streamStatus === 'starting' && currentStreamType === 'optimized' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Video className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Snapshot Stream */}
            <div className={`p-3 border rounded-lg transition-all ${
              currentStreamType === 'snapshot' && streamActive 
                ? 'border-blue-300 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-700' 
                : 'border-gray-200 dark:border-gray-700'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Image className="w-4 h-4" />
                    <span className="font-medium">Live Snapshots</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    1-2 second updates
                  </p>
                </div>
                <Button
                  onClick={onStartSnapshot}
                  disabled={streamActive && currentStreamType !== 'snapshot'}
                  size="sm"
                  variant="outline"
                >
                  {streamStatus === 'starting' && currentStreamType === 'snapshot' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* HLS Stream */}
            <div className={`p-3 border rounded-lg transition-all ${
              currentStreamType === 'hls' && streamActive 
                ? 'border-purple-300 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-700' 
                : 'border-gray-200 dark:border-gray-700'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Video className="w-4 h-4" />
                    <span className="font-medium">HLS Stream</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    High quality (slower startup)
                  </p>
                </div>
                <Button
                  onClick={onStartHLS}
                  disabled={streamActive}
                  size="sm"
                  variant="outline"
                >
                  {streamStatus === 'starting' && currentStreamType === 'hls' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stream Stats */}
        {streamActive && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">Stream Stats</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-green-600">{stats.fps}</div>
                <div className="text-xs text-muted-foreground">FPS</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-blue-600">{stats.uptime}</div>
                <div className="text-xs text-muted-foreground">Uptime</div>
              </div>
            </div>
          </div>
        )}

        {/* Diagnostics */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">Diagnostics</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={onTestConnection}
              variant="outline"
              size="sm"
            >
              <TestTube className="w-4 h-4 mr-2" />
              Test Connection
            </Button>
            <Button
              onClick={onCopyStreamURL}
              variant="outline"
              size="sm"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy URL
            </Button>
          </div>
        </div>

        {/* Camera Info */}
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <h5 className="text-xs font-semibold text-muted-foreground mb-2">Camera Information</h5>
          <div className="text-xs space-y-1 font-mono">
            <div>IP: 192.168.0.109:554</div>
            <div>Protocol: RTSP</div>
            <div>Authentication: Digest</div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3 rounded-lg">
            <div className="text-sm text-red-800 dark:text-red-400">
              {error}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
