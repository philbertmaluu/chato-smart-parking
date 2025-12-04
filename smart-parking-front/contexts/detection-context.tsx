"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CameraDetection } from '@/hooks/use-detection-logs';

interface DetectionContextType {
  latestNewDetection: CameraDetection | null;
  setLatestNewDetection: (detection: CameraDetection | null) => void;
  clearLatestDetection: () => void;
}

const DetectionContext = createContext<DetectionContextType | undefined>(undefined);

export const useDetectionContext = () => {
  const context = useContext(DetectionContext);
  if (!context) {
    throw new Error('useDetectionContext must be used within a DetectionProvider');
  }
  return context;
};

interface DetectionProviderProps {
  children: ReactNode;
}

export const DetectionProvider: React.FC<DetectionProviderProps> = ({ children }) => {
  const [latestNewDetection, setLatestNewDetectionState] = useState<CameraDetection | null>(null);

  const setLatestNewDetection = useCallback((detection: CameraDetection | null) => {
    setLatestNewDetectionState(detection);
  }, []);

  const clearLatestDetection = useCallback(() => {
    setLatestNewDetectionState(null);
  }, []);

  return (
    <DetectionContext.Provider
      value={{
        latestNewDetection,
        setLatestNewDetection,
        clearLatestDetection,
      }}
    >
      {children}
    </DetectionContext.Provider>
  );
};

