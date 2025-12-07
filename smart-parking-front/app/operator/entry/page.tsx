"use client";

import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { VehicleEntryDrawer } from "./components/vehicleEntrydrawer";
import { CameraInterface } from "./components/camera-interface";
import { VehicleTypeSelectionModal } from "./components/vehicle-type-selection-modal";
import { CameraExitDialog } from "./components/camera-exit-dialog";
import { useOperatorGates } from "@/hooks/use-operator-gates";
import { usePendingDetections } from "@/hooks/use-pending-detections";
import { usePendingExitDetections } from "@/hooks/use-pending-exit-detections";
import { usePageVisibility } from "@/hooks/use-page-visibility";
import { zktecoConfig } from "@/utils/config/zkteco-config";
import { GateSelectionModal } from "@/components/operator/gate-selection-modal";
import { useDetectionContext } from "@/contexts/detection-context";
import { CameraDetection } from "@/hooks/use-detection-logs";
import { ChevronDown, MapPin, Pencil, Camera, Video, CheckCircle, AlertCircle, Building2, X, RotateCcw, RefreshCw, ScanLine, Loader2 } from "lucide-react";
import { CameraDetectionService } from "@/utils/api/camera-detection-service";
import { toast } from "sonner";

export default function VehicleEntry() {
  const { availableGates, selectedGate, selectedGateDevices, loading: gatesLoading, error: gatesError, selectGate, deselectGate } = useOperatorGates();
  const [showGateModal, setShowGateModal] = useState(false);
  const [showEntryDrawer, setShowEntryDrawer] = useState(false);
  const [showVehicleTypeModal, setShowVehicleTypeModal] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [captureLoading, setCaptureLoading] = useState(false);
  const [detectedPlateNumber, setDetectedPlateNumber] = useState<string | undefined>(undefined);
  const [capturedDetection, setCapturedDetection] = useState<any>(null);
  const isPageVisible = usePageVisibility();

  // Get camera device from gate devices - recalculate when devices or gate changes
  const cameraDevice = selectedGateDevices.find(device => device.device_type === 'camera' && device.status === 'active');
  
  // Get camera IP - use device IP or fallback to config
  const cameraConfig = zktecoConfig.getConfig();
  const cameraIp = cameraDevice?.ip_address || cameraConfig?.ip || '192.168.0.109';

  // Check for pending detections with gentle polling
  // Background processing is handled by Laravel scheduler (cron jobs)
  // Polls every 2.5 seconds when page is visible to catch new detections quickly
  // NOTE: Auto-opening of entry drawer/manual modals is disabled - operator must manually capture
  const { latestDetection, fetchPendingDetections, clearLatestDetection, loading: detectionsLoading } = usePendingDetections({
    enabled: false, // Disabled - no auto-polling, operator will manually capture
    pollInterval: 2500,
    onNewDetection: (detection) => {
      // Disabled - no auto-opening of entry drawer
      // Operator must manually click "Capture Vehicle" button
    },
  });

  // Check for pending exit detections with gentle polling
  // Background processing is handled by Laravel scheduler (cron jobs)
  // Polls every 2.5 seconds when page is visible to catch new detections quickly
  const { latestDetection: latestExitDetection, fetchPendingExitDetections, clearLatestDetection: clearLatestExitDetection } = usePendingExitDetections({
    enabled: true,
    pollInterval: 2500, // 2.5 seconds - gentle polling
    onNewDetection: (detection) => {
      // Show dialog immediately when new exit detection is found
      if (isPageVisible) {
        setShowExitDialog(true);
      }
    },
  });

  // Disabled - no auto-opening of entry drawer
  // Operator must manually click "Capture Vehicle" button to process detections

  // Show exit dialog if there's a pending exit detection
  // Show immediately when page becomes visible if there's a pending exit detection
  useEffect(() => {
    if (latestExitDetection) {
      if (isPageVisible) {
        setShowExitDialog(true);
      }
    }
  }, [latestExitDetection, isPageVisible]);

  // Check if operator has selected a gate on mount - show modal automatically
  useEffect(() => {
    if (!gatesLoading && !selectedGate) {
      setShowGateModal(true);
    }
  }, [gatesLoading, selectedGate]);

  // Disabled auto-fetching - operator will manually capture when needed
  // Exit detections still auto-fetch for exit processing
  useEffect(() => {
    if (isPageVisible && selectedGate) {
      // Only fetch exit detections automatically
      fetchPendingExitDetections();
      // Entry detections are handled manually via "Capture Vehicle" button
    }
  }, [isPageVisible, selectedGate, fetchPendingExitDetections]);

  // Auto-refresh camera feed every 500ms for live video
  useEffect(() => {
    if (!isPageVisible || !selectedGate) return;

    const img = document.getElementById('camera-feed-img') as HTMLImageElement;
    if (!img) return;

    const interval = setInterval(() => {
      const currentImg = document.getElementById('camera-feed-img') as HTMLImageElement;
      if (currentImg && document.contains(currentImg)) {
        // Add timestamp to force refresh
        currentImg.src = `http://${cameraIp}/edge/cgi-bin/vparcgi.cgi?computerid=1&oper=snapshot&resolution=800x600&i=${Date.now()}`;
      }
    }, 500); // Refresh every 500ms for smooth live video

    return () => clearInterval(interval);
  }, [isPageVisible, selectedGate, cameraIp]);


  const handleEntrySuccess = (data: any) => {
    // Entry processed successfully - no logging needed
  };

  const handleVehicleTypeModalSuccess = () => {
    setShowVehicleTypeModal(false);
    setCapturedDetection(null); // Clear captured detection
  };

  const handleGateSelect = async (gateId: number) => {
    await selectGate(gateId);
    setShowGateModal(false);
  };

  // Handle capture vehicle - triggers camera to capture and detect plate
  // Shows body type selection modal for processing
  const handleCaptureVehicle = async () => {
    if (!selectedGate) {
      toast.error("Please select a gate first");
      return;
    }

    try {
      setCaptureLoading(true);
      
      // Use quick capture - returns latest detection immediately
      const result = await CameraDetectionService.quickCapture();
      
      if (result.success) {
        // Check for detection first - this is the most important check
        if (result.data.detection && result.data.detection.plate_number) {
          // Got a detection - create a detection object for the modal
          const detection = {
            id: result.data.detection.id,
            numberplate: result.data.detection.plate_number,
            detection_timestamp: result.data.detection.detection_timestamp,
            gate_id: selectedGate.id,
            processing_status: 'manual_processing',
            make_str: null,
            model_str: null,
            color_str: null,
          };
          
          setCapturedDetection(detection);
          setShowVehicleTypeModal(true);
          toast.success(`✅ Vehicle captured! Plate: ${result.data.detection.plate_number}`);
        } else if (result.data.camera_unavailable) {
          toast.error("📷 Camera not responding. Check connection.");
        } else {
          // No detection found - show appropriate message
          toast.warning("⚠️ No vehicle detected. Position vehicle in camera view and try again.");
        }
      } else {
        toast.error(result.messages || "Capture failed. Try again.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Capture failed";
      toast.error(message);
    } finally {
      setCaptureLoading(false);
    }
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
                    {/* CAPTURE VEHICLE - Primary Action Button */}
                    {selectedGate && cameraDevice && (
                      <Button
                        onClick={handleCaptureVehicle}
                        disabled={captureLoading}
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2 px-6 py-3 text-base font-semibold animate-pulse hover:animate-none"
                        title="Capture vehicle plate when vehicle arrives"
                      >
                        {captureLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Capturing...</span>
                          </>
                        ) : (
                          <>
                            <ScanLine className="w-5 h-5" />
                            <span>Capture Vehicle</span>
                          </>
                        )}
                      </Button>
                    )}

                    {/* Refresh Camera Button */}
                    {selectedGate && (
                      <Button
                        onClick={() => {
                          // Force refresh by updating the image src
                          const img = document.querySelector('img[alt="Camera Feed"]') as HTMLImageElement;
                          if (img) {
                            img.src = `http://${cameraIp}/edge/cgi-bin/vparcgi.cgi?computerid=1&oper=snapshot&resolution=800x600&i=${new Date().toISOString()}`;
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
                ) : (
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9', minHeight: '500px' }}>
                    {/* Live Camera Feed - Auto-refreshes every 500ms */}
                    <img
                      id="camera-feed-img"
                      src={`http://${cameraIp}/edge/cgi-bin/vparcgi.cgi?computerid=1&oper=snapshot&resolution=800x600&i=${Date.now()}`}
                      alt="Camera Feed"
                      className="w-full h-full object-contain"
                      style={{ minHeight: '500px' }}
                    />
                    {/* Live Indicator */}
                    <div className="absolute bottom-2 right-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
                      🔴 Live • {cameraIp}
                    </div>
                    
                    {/* Current Gate Overlay (Mobile) */}
                    {selectedGate && (
                      <div className="md:hidden absolute bottom-4 left-4 bg-black/70 px-3 py-2 rounded-lg backdrop-blur-sm">
                        <p className="text-white text-xs">Gate: {selectedGate.name}</p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Camera: {cameraIp}</span>
                    {selectedGate && <span>Gate: {selectedGate.name}</span>}
                  </div>
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
        onOpenChange={(open) => {
          setShowEntryDrawer(open);
          if (!open) {
            // Clear detected plate number when drawer closes
            setDetectedPlateNumber(undefined);
          }
        }}
        selectedGateId={selectedGate?.id}
        detectedPlateNumber={detectedPlateNumber}
        isPlateDetectionEnabled={!!detectedPlateNumber}
        onVehicleRegistered={(vehicle, passageData, receiptData) => {
          // Handle successful vehicle registration
          setDetectedPlateNumber(undefined);
          setShowEntryDrawer(false);
        }}
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
        open={showVehicleTypeModal && capturedDetection !== null}
        onOpenChange={(open) => {
          setShowVehicleTypeModal(open);
          if (!open) {
            // Clear captured detection when modal closes
            setCapturedDetection(null);
          }
        }}
        detection={capturedDetection}
        onSuccess={handleVehicleTypeModalSuccess}
      />

      {/* Camera Exit Dialog */}
      <CameraExitDialog
        open={showExitDialog && latestExitDetection !== null}
        onOpenChange={(open) => {
          setShowExitDialog(open);
          if (!open) {
            clearLatestExitDetection();
          }
        }}
        detection={latestExitDetection}
        onExitProcessed={() => {
          clearLatestExitDetection(); // Clear first to allow next in queue
          // Refresh after a short delay to allow next detection to be fetched
          setTimeout(() => {
            fetchPendingExitDetections(); // This will fetch next in queue
          }, 200);
        }}
      />
    </MainLayout>
  );
}
