"use client";

import { motion, AnimatePresence } from "framer-motion";
import { StreamType, StreamStatus, StreamStats } from "@/hooks/use-stream";

interface StreamOverlayProps {
  show: boolean;
  streamType: StreamType;
  streamStatus: StreamStatus;
  stats: StreamStats;
}

export function StreamOverlay({ show, streamType, streamStatus, stats }: StreamOverlayProps) {
  if (!show) return null;

  const getStreamMethodDisplay = (type: StreamType) => {
    switch (type) {
      case 'optimized':
        return 'Optimized Stream';
      case 'mjpeg':
        return 'MJPEG Stream';
      case 'snapshot':
        return 'Live Snapshots';
      case 'hls':
        return 'HLS Stream';
      default:
        return 'Live Stream';
    }
  };

  const getStatusColor = (status: StreamStatus) => {
    switch (status) {
      case 'live':
        return 'bg-green-600';
      case 'starting':
        return 'bg-yellow-600';
      case 'error':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getStatusText = (status: StreamStatus) => {
    switch (status) {
      case 'live':
        return 'LIVE';
      case 'starting':
        return 'Starting...';
      case 'error':
        return 'Error';
      case 'stopped':
        return 'Stopped';
      default:
        return 'Ready';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="absolute top-3 right-3 bg-black/70 text-white px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-sm z-10"
      >
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(streamStatus)} ${streamStatus === 'live' ? 'animate-pulse' : ''}`}></div>
          <span>{getStreamMethodDisplay(streamType)}</span>
          <span>•</span>
          <span>{getStatusText(streamStatus)}</span>
        </div>
        
        {(streamStatus === 'live' || streamStatus === 'starting') && (
          <div className="flex items-center justify-between mt-1 text-xs text-gray-300">
            <span>{stats.fps} FPS</span>
            <span>•</span>
            <span>{stats.uptime}</span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
