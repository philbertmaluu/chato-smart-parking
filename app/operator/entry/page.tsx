"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { VehicleEntryDrawer } from "./components/vehicle-entry";
import { CameraInterface } from "./components/camera-interface";
import { useOperatorGates } from "@/hooks/use-operator-gates";
import { useGateCamera } from "@/hooks/use-gate-camera";
import { GateSelectionModal } from "@/components/operator/gate-selection-modal";
import { ChevronDown, MapPin, Pencil, Camera, Video, CheckCircle, AlertCircle, Building2 } from "lucide-react";

export default function VehicleEntry() {
  const { availableGates, selectedGate, loading: gatesLoading, error: gatesError, selectGate } = useOperatorGates();
  const { cameraConfig, loading: cameraLoading, error: cameraError, fetchCameraConfig } = useGateCamera();
  const [showGateModal, setShowGateModal] = useState(false);
  const [showEntryDrawer, setShowEntryDrawer] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if operator has selected a gate on mount
  useEffect(() => {
    if (!gatesLoading && !selectedGate) {
      setShowGateModal(true);
    }
  }, [gatesLoading, selectedGate]);

  // Fetch camera config when gate changes
  useEffect(() => {
    if (selectedGate?.id) {
      fetchCameraConfig(selectedGate.id);
    }
  }, [selectedGate?.id, fetchCameraConfig]);

  // Auto-refresh camera feed
  useEffect(() => {
    if (!cameraConfig) return;

    const refreshCamera = () => {
      if (imageRef.current) {
        const timestamp = new Date().toISOString();
        imageRef.current.src = `http://${cameraConfig.ip}/edge/cgi-bin/vparcgi.cgi?computerid=1&oper=snapshot&resolution=800x600&i=${timestamp}`;
      }
    };

    // Start auto-refresh
    refreshIntervalRef.current = setInterval(refreshCamera, 500);

    // Cleanup on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [cameraConfig]);

  const handleEntrySuccess = (data: any) => {
    console.log("Entry processed successfully:", data);
    // Handle success - could show receipt, update UI, etc.
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
                Simple vehicle entry processing
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
            
            {/* Gate Selection Button */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowGateModal(true)}
                variant={selectedGate ? "default" : "outline"}
                className={`${
                  selectedGate
                    ? "bg-gradient-maroon text-white border-0"
                    : "border-maroon-500 text-maroon-600 hover:bg-gradient-maroon hover:text-white"
                } transition-all duration-200 flex items-center space-x-2`}
              >
                <MapPin className="w-4 h-4" />
                <span>
                  {selectedGate ? selectedGate.name : "Select Gate"}
                </span>
              </Button>
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
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    <div>
                      <CardTitle>Live Camera Feed</CardTitle>
                      <CardDescription>
                        {cameraConfig 
                          ? `Real-time monitoring from camera at ${cameraConfig.ip}`
                          : selectedGate 
                            ? 'Loading camera configuration...' 
                            : 'Select a gate to view camera feed'
                        }
                      </CardDescription>
                    </div>
                  </div>
                  
                  {/* Manual Entry Button - Top Right */}
                  <div className="flex items-center gap-3">
                    {selectedGate && (
                      <div className="hidden md:block text-right">
                        <p className="text-sm font-medium text-muted-foreground">Active Gate</p>
                        <p className="text-base font-bold text-gradient">{selectedGate.name}</p>
                      </div>
                    )}
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
              <CardContent className="space-y-4">
                {cameraLoading ? (
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center" style={{ aspectRatio: '16/9', minHeight: '500px' }}>
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                      <p>Loading camera configuration...</p>
                    </div>
                  </div>
                ) : cameraError ? (
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center" style={{ aspectRatio: '16/9', minHeight: '500px' }}>
                    <div className="text-center space-y-2 p-4">
                      <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
                      <p className="font-semibold text-white">Camera Configuration Error</p>
                      <p className="text-sm text-gray-400">{cameraError}</p>
                    </div>
                  </div>
                ) : !cameraConfig ? (
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center" style={{ aspectRatio: '16/9', minHeight: '500px' }}>
                    <div className="text-center space-y-2 p-4">
                      <Camera className="w-12 h-12 mx-auto text-gray-500" />
                      <p className="font-semibold text-white">No Gate Selected</p>
                      <p className="text-sm text-gray-400">Please select a gate to view the camera feed</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9', minHeight: '500px' }}>
                    <img
                      ref={imageRef}
                      src={`http://${cameraConfig.ip}/edge/cgi-bin/vparcgi.cgi?computerid=1&oper=snapshot&resolution=800x600&i=${new Date().toISOString()}`}
                      alt="Camera Feed"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const errorDiv = target.nextElementSibling as HTMLElement;
                        if (errorDiv && errorDiv.classList.contains('error-message')) {
                          errorDiv.style.display = 'flex';
                        }
                      }}
                    />
                    <div className="error-message absolute inset-0 flex items-center justify-center bg-gray-800 text-white p-4" style={{ display: 'none' }}>
                      <div className="text-center space-y-2">
                        <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
                        <p className="font-semibold">Cannot connect to camera</p>
                        <p className="text-sm text-gray-400">
                          Camera at {cameraConfig.ip} is not accessible from this browser.
                        </p>
                      </div>
                    </div>
                    
                    {/* Live Indicator */}
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/70 px-3 py-2 rounded-lg backdrop-blur-sm">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-white font-medium text-sm">LIVE</span>
                    </div>
                    
                    {/* Camera Info */}
                    <div className="absolute bottom-4 right-4 bg-black/70 px-3 py-2 rounded-lg backdrop-blur-sm">
                      <p className="text-white text-sm font-mono">{cameraConfig.ip}</p>
                    </div>
                    
                    {/* Current Gate Overlay (Mobile) */}
                    {selectedGate && (
                      <div className="md:hidden absolute bottom-4 left-4 bg-black/70 px-3 py-2 rounded-lg backdrop-blur-sm">
                        <p className="text-white text-xs">Gate: {selectedGate.name}</p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  {cameraConfig ? (
                    <Alert className="flex-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <AlertDescription>
                        <strong>Live monitoring active</strong> - Auto-refreshing every 500ms for real-time vehicle detection.
                      </AlertDescription>
                    </Alert>
                  ) : selectedGate ? (
                    <Alert className="flex-1" variant="destructive">
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>
                        <strong>Camera not configured</strong> - Please contact administrator to configure camera for this gate.
                      </AlertDescription>
                    </Alert>
                  ) : null}
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
          setShowGateModal(false);
        }}
      />
    </MainLayout>
  );
}
