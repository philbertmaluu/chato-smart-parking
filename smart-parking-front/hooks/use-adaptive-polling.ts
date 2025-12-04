import { useState, useEffect, useRef, useCallback } from 'react';

export type PollingSpeed = 'fast' | 'normal' | 'slow';

interface UseAdaptivePollingOptions {
  baseInterval?: number; // Normal polling interval in ms
  fastInterval?: number; // Fast polling interval in ms
  slowInterval?: number; // Slow polling interval in ms
  activityBoostDuration?: number; // How long to stay in fast mode after activity (ms)
  peakHours?: Array<{ start: number; end: number }>; // Peak hours in 24h format, e.g., [{ start: 7, end: 9 }]
  onActivity?: () => void; // Callback when activity is detected
}

const DEFAULT_OPTIONS: Required<Omit<UseAdaptivePollingOptions, 'peakHours' | 'onActivity'>> = {
  baseInterval: 5000, // 5 seconds
  fastInterval: 1000, // 1 second
  slowInterval: 12000, // 12 seconds
  activityBoostDuration: 30000, // 30 seconds
};

/**
 * Hook for adaptive polling that adjusts interval based on:
 * - Activity detection (switches to fast mode)
 * - Time of day (peak hours vs off-peak)
 */
export const useAdaptivePolling = (options: UseAdaptivePollingOptions = {}) => {
  const {
    baseInterval = DEFAULT_OPTIONS.baseInterval,
    fastInterval = DEFAULT_OPTIONS.fastInterval,
    slowInterval = DEFAULT_OPTIONS.slowInterval,
    activityBoostDuration = DEFAULT_OPTIONS.activityBoostDuration,
    peakHours = [
      { start: 7, end: 9 }, // Morning peak: 7 AM - 9 AM
      { start: 17, end: 19 }, // Evening peak: 5 PM - 7 PM
    ],
    onActivity,
  } = options;

  const [currentInterval, setCurrentInterval] = useState(baseInterval);
  const [currentSpeed, setCurrentSpeed] = useState<PollingSpeed>('normal');
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number | null>(null);

  /**
   * Check if current time is within peak hours
   */
  const isPeakHour = useCallback((): boolean => {
    const now = new Date();
    const currentHour = now.getHours();

    return peakHours.some(({ start, end }) => {
      if (start <= end) {
        // Normal range (e.g., 7-9)
        return currentHour >= start && currentHour < end;
      } else {
        // Wraps around midnight (e.g., 22-2)
        return currentHour >= start || currentHour < end;
      }
    });
  }, [peakHours]);

  /**
   * Calculate the appropriate polling interval based on:
   * - Recent activity
   * - Time of day (peak hours)
   */
  const calculateInterval = useCallback((): { interval: number; speed: PollingSpeed } => {
    const now = Date.now();
    const timeSinceLastActivity = lastActivityRef.current
      ? now - lastActivityRef.current
      : Infinity;

    // If activity was detected recently, use fast interval
    if (timeSinceLastActivity < activityBoostDuration) {
      return { interval: fastInterval, speed: 'fast' };
    }

    // Check if it's peak hour
    if (isPeakHour()) {
      return { interval: baseInterval, speed: 'normal' };
    }

    // Off-peak hours, use slow interval
    return { interval: slowInterval, speed: 'slow' };
  }, [fastInterval, baseInterval, slowInterval, activityBoostDuration, isPeakHour]);

  /**
   * Signal that activity was detected (e.g., new detection found)
   */
  const signalActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    onActivity?.();

    // Clear existing timeout
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }

    // Update interval immediately
    const { interval, speed } = calculateInterval();
    setCurrentInterval(interval);
    setCurrentSpeed(speed);

    // Set timeout to return to normal/slow after activity boost duration
    activityTimeoutRef.current = setTimeout(() => {
      const { interval: newInterval, speed: newSpeed } = calculateInterval();
      setCurrentInterval(newInterval);
      setCurrentSpeed(newSpeed);
    }, activityBoostDuration);
  }, [calculateInterval, onActivity]);

  // Periodically recalculate interval (e.g., when entering/exiting peak hours)
  useEffect(() => {
    const updateInterval = () => {
      // Only update if not in activity boost mode
      if (!lastActivityRef.current || 
          Date.now() - lastActivityRef.current >= activityBoostDuration) {
        const { interval, speed } = calculateInterval();
        setCurrentInterval(interval);
        setCurrentSpeed(speed);
      }
    };

    // Update every minute to catch peak hour transitions
    const interval = setInterval(updateInterval, 60000);

    // Initial calculation
    updateInterval();

    return () => clearInterval(interval);
  }, [calculateInterval, activityBoostDuration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, []);

  return {
    currentInterval,
    currentSpeed,
    signalActivity,
    isPeakHour: isPeakHour(),
  };
};





