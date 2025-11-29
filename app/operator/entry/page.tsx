"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { VehicleEntryDrawer } from "./components/vehicle-entry";
import { CameraInterface } from "./components/camera-interface";
import { VehicleTypeSelectionModal } from "./components/vehicle-type-selection-modal";
import { useOperatorGates } from "@/hooks/use-operator-gates";
import { usePendingDetections } from "@/hooks/use-pending-detections";
import { useMJPEGStream } from "@/hooks/use-mjpeg-stream";
import { usePageVisibility } from "@/hooks/use-page-visibility";
import { GateSelectionModal } from "@/components/operator/gate-selection-modal";
import { ChevronDown, MapPin, Pencil, Camera, Video, CheckCircle, AlertCircle, Building2, X, RotateCcw, RefreshCw } from "lucide-react";

export default function VehicleEntry() {
  const { availableGates, selectedGate, selectedGateDevices, loading: gatesLoading, error: gatesError, selectGate, deselectGate } = useOperatorGates();
  const [showGateModal, setShowGateModal] = useState(false);
  const [showEntryDrawer, setShowEntryDrawer] = useState(false);
  const [showVehicleTypeModal, setShowVehicleTypeModal] = useState(false);
  const isPageVisible = usePageVisibility();

  // Get camera device from gate devices - recalculate when devices or gate changes
  const cameraDevice = selectedGateDevices.find(device => device.device_type === 'camera' && device.status === 'active');

  // Camera stream hook - uses snapshot mode (MJPEG has CORS issues)
  const {
    streamContainerRef,
    isStreaming,
    error: streamError,
    isFallback,
    stopStream,
    refreshStream,
  } = useMJPEGStream(cameraDevice || null, {
    enabled: isPageVisible && !!cameraDevice && !!selectedGate,
    useSnapshotOnly: true, // Use snapshot mode directly (MJPEG blocked by CORS)
    fallbackToSnapshot: true,
    onError: (error) => {
      // Silently handle - snapshot mode works fine
      console.log('Camera stream:', error);
    },
  });

  // Poll for pending detections that need vehicle type (1.5 second polling as requested)
  const { latestDetection, fetchPendingDetections, clearLatestDetection } = usePendingDetections({
    enabled: isPageVisible,
    pollInterval: 1500, // 1.5 seconds polling for new vehicle detection
    useAdaptive: false, // Disable adaptive polling for consistent 1.5s interval
    onNewDetection: (detection) => {
      setShowVehicleTypeModal(true);
    },
  });

  // Show modal if there's a pending detection on initial load or when latestDetection changes
  useEffect(() => {
    if (latestDetection) {
      setShowVehicleTypeModal(true);
    }
  }, [latestDetection]);

  // Check if operator has selected a gate on mount - show modal automatically
  useEffect(() => {
    if (!gatesLoading && !selectedGate) {
      setShowGateModal(true);
    }
  }, [gatesLoading, selectedGate]);

  // Auto-refresh stream when page becomes visible again
  const refreshStreamRef = useRef(refreshStream);
  
  useEffect(() => {
    refreshStreamRef.current = refreshStream;
  }, [refreshStream]);
  
  useEffect(() => {
    // When page becomes visible and we have a camera, refresh the stream
    if (isPageVisible && cameraDevice && selectedGate && refreshStreamRef.current) {
      // Small delay to ensure everything is ready
      const timer = setTimeout(() => {
        if (refreshStreamRef.current) {
          refreshStreamRef.current();
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isPageVisible, cameraDevice, selectedGate]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  const handleEntrySuccess = (data: any) => {
    console.log("Entry processed successfully:", data);
    // Handle success - could show receipt, update UI, etc.
  };

  const handleVehicleTypeModalSuccess = () => {
    clearLatestDetection();
    fetchPendingDetections(); // Refresh to get updated list
  };

  const handleGateSelect = async (gateId: number) => {
    await selectGate(gateId);
    setShowGateModal(false);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gradient">
                Vehicle Entry
              </h1>
              <p className="text-muted-foreground mt-2">
                Vehicle entry processing
              </p>
              {!selectedGate && (
                <div className="mt-2 flex items-center space-x-2 text-sm text-orange-600 dark:text-orange-400">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span>Please select a gate to start processing vehicles</span>
                </div>
              )}
              {selectedGate && (
                <div className="mt-2 flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>Active Gate: <strong>{selectedGate.name}</strong> at {selectedGate.station?.name}</span>
                </div>
              )}
            </div>
            
          </div>
        </motion.div>

        {/* Camera Interface Section - Only show if gate is selected */}
        {selectedGate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="relative">
            {/* Camera Feed - Full Width */}
            <Card className="glass-effect">
              <CardHeader>
                <div className="flex items-center justify-end">
                 
                  
                  {/* Gate Selection and Manual Entry Buttons - Top Right */}
                  <div className="flex items-center gap-3">
                    {/* Refresh Camera Button - Only show when gate is selected */}
                    {selectedGate && cameraDevice && refreshStream && (
                      <Button
                        onClick={() => {
                          if (refreshStream) {
                            refreshStream();
                          }
                        }}
                        variant="outline"
                        size="lg"
                        className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 flex items-center space-x-2"
                        title="Refresh camera feed"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Refresh</span>
                      </Button>
                    )}
                    
                    {/* Deselect Gate Button - Only show when gate is selected */}
                    {selectedGate && (
                      <Button
                        onClick={async () => {
                          await deselectGate();
                          // Automatically open gate selection modal after deselecting
                          setShowGateModal(true);
                        }}
                        variant="outline"
                        size="lg"
                        className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 flex items-center space-x-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Change Gate</span>
                      </Button>
                    )}
                    
                    {/* Manual Entry Button */}
                    <Button
                      size="lg"
                      className={`${
                        selectedGate
                          ? "gradient-maroon hover:opacity-90"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      } transition-opacity shadow-lg`}
                      onClick={() => setShowEntryDrawer(true)}
                      disabled={!selectedGate}
                      title={!selectedGate ? "Please select a gate first" : ""}
                    >
                      <Pencil className="w-5 h-5 mr-2" />
                      Manual Entry
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-0">
                {gatesLoading ? (
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center" style={{ aspectRatio: '16/9', minHeight: '500px' }}>
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                      <p>Loading gate information...</p>
                    </div>
                  </div>
                ) : !cameraDevice ? (
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center" style={{ aspectRatio: '16/9', minHeight: '500px' }}>
                    <div className="text-center space-y-2 p-4">
                      <Camera className="w-12 h-12 mx-auto text-gray-500" />
                      <p className="font-semibold text-white">No Camera Configured</p>
                      <p className="text-sm text-gray-400">Please contact administrator to configure camera for this gate.</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9', minHeight: '500px' }}>
                    {/* MJPEG Stream Container */}
                    <div
                      ref={streamContainerRef}
                      className="w-full h-full"
                      style={{ minHeight: '500px' }}
                    />
                    
                    {/* Error Message */}
                    {streamError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white p-4">
                        <div className="text-center space-y-2">
                          <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
                          <p className="font-semibold">Cannot connect to camera</p>
                          <p className="text-sm text-gray-400">
                            {streamError}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Loading Indicator */}
                    {!isStreaming && !streamError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white p-4">
                        <div className="text-center space-y-2">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                          <p className="text-sm">Connecting to camera...</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Live Indicator */}
                    {isStreaming && (
                      <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/70 px-3 py-2 rounded-lg backdrop-blur-sm">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-white font-medium text-sm">
                          LIVE
                        </span>
                      </div>
                    )}
                    
                    {/* Current Gate Overlay (Mobile) */}
                    {selectedGate && (
                      <div className="md:hidden absolute bottom-4 left-4 bg-black/70 px-3 py-2 rounded-lg backdrop-blur-sm">
                        <p className="text-white text-xs">Gate: {selectedGate.name}</p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  {!cameraDevice && selectedGate && (
                    <Alert className="flex-1" variant="destructive">
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>
                        <strong>Camera not configured</strong> - Please contact administrator to configure camera for this gate.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
        )}
      </div>

      {/* Vehicle Entry Drawer */}
      <VehicleEntryDrawer
        open={showEntryDrawer}
        onOpenChange={setShowEntryDrawer}
        gateId={selectedGate?.id}
        onSuccess={handleEntrySuccess}
      />

      {/* Gate Selection Modal */}
      <GateSelectionModal
        open={showGateModal}
        onClose={() => setShowGateModal(false)}
        onGateSelected={(gate) => {
          // Gate selection is handled by the modal itself
          // The selectedGate state will update automatically via the hook
          // Camera config will be fetched automatically via useEffect
        }}
      />

      {/* Vehicle Type Selection Modal */}
      <VehicleTypeSelectionModal
        open={showVehicleTypeModal && latestDetection !== null}
        onOpenChange={(open) => {
          setShowVehicleTypeModal(open);
          if (!open) {
            clearLatestDetection();
          }
        }}
        detection={latestDetection}
        onSuccess={handleVehicleTypeModalSuccess}
      />
    </MainLayout>
  );
}
