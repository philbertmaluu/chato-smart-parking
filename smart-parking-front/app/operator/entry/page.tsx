"use client";

import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
// DISABLED: Client-side polling imports - now using Laravel cron job instead
// import { useCameraLocalPolling } from "@/hooks/use-camera-local-polling";
// import { useLocalPendingDetections } from "@/hooks/use-local-pending-detections";
// import { RawCameraDetection } from "@/utils/camera-local-client";
// import { LocalPendingDetection } from "@/utils/local-detection-storage";

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
  const { setLatestNewDetection } = useDetectionContext();
  // REMOVED: Local detections state - now using backend database instead
  // const [localDetections, setLocalDetections] = useState<
  //   { plate: string; timestamp: string; gateName: string | null; status: "pushed" | "pending" }[]
  // >([]);

  // Get camera device from gate devices - recalculate when devices or gate changes
  const cameraDevice = selectedGateDevices.find(device => device.device_type === 'camera' && device.status === 'active');
  
  // Get camera IP - prioritize device IP from database, then config, then show error
  const cameraConfig = zktecoConfig.getConfig();
  const cameraIp = cameraDevice?.ip_address || cameraConfig?.ip || null;
  const cameraHttpPort = cameraDevice?.http_port || cameraConfig?.httpPort || 80;
  const directionFromGate = selectedGate?.gate_type === 'exit' ? 1 : 0;
  const directionFromDevice =
    cameraDevice?.direction?.toLowerCase() === 'exit'
      ? 1
      : cameraDevice?.direction?.toLowerCase() === 'entry'
        ? 0
        : null;
  const effectiveDirection = directionFromDevice ?? directionFromGate;
  
  // REMOVED: Frontend-driven camera polling callback
  // Now using Laravel cron job (fetch:camera-data) to fetch from camera and store in database
  // Frontend polls the backend API for new detections instead

  // DISABLED: Client-side camera polling - now using Laravel cron job instead
  // The backend scheduler (fetch:camera-data) runs every 2 seconds to fetch from camera
  // and store detections in the database. Frontend polls the backend API for new detections.
  // const { featureEnabled: localPollingEnabled, lastError: localPollingError } = useCameraLocalPolling({
  //   gateId: selectedGate?.id,
  //   cameraDevice,
  //   enabled: false, // DISABLED - using cron job instead
  //   direction: effectiveDirection,
  //   onNewDetections: handleLocalDetections,
  // });

  // DISABLED: Local storage-based detection system - now using backend database instead
  // const {
  //   latestDetection: localPendingDetection,
  //   clearLatestDetection: clearLocalDetection,
  //   markProcessed: markLocalProcessed,
  // } = useLocalPendingDetections({
  //   gateId: selectedGate?.id,
  //   enabled: false, // DISABLED - using backend API instead
  //   pollInterval: 2000,
  //   onNewDetection: (localDetection: LocalPendingDetection) => {
  //     // ... (removed)
  //   },
  // });
  
  // Log camera configuration for debugging
  useEffect(() => {
    if (selectedGate) {
      console.log('[Entry Page] Camera Configuration:', {
        hasCameraDevice: !!cameraDevice,
        cameraIp: cameraIp,
        cameraHttpPort: cameraHttpPort,
        gateDevices: selectedGateDevices.length,
        cameraDevice: cameraDevice ? {
          ip: cameraDevice.ip_address,
          port: cameraDevice.http_port,
          status: cameraDevice.status,
          name: cameraDevice.name
        } : null
      });
      
      if (!cameraIp) {
        console.warn('[Entry Page] ⚠️ Camera IP not configured! Please configure camera device in gate settings.');
      }
    }
  }, [selectedGate, cameraDevice, cameraIp, cameraHttpPort, selectedGateDevices]);

  // Check for pending detections from backend database
  // Background processing is handled by Laravel scheduler (cron job: fetch:camera-data)
  // The cron job runs every 2 seconds to fetch from camera and store in database
  // Frontend polls the backend API every 2.5 seconds to get new detections
  const { latestDetection, fetchPendingDetections, clearLatestDetection, loading: detectionsLoading } = usePendingDetections({
    enabled: isPageVisible, // Enabled when page is visible (don't require gate selection - show all detections from operator's assigned gates)
    pollInterval: 2500, // Poll every 2.5 seconds
    onNewDetection: (detection) => {
      // Show vehicle type selection modal when new detection is found
      console.log('[Entry Page] onNewDetection called:', {
        detection: detection ? { id: detection.id, plate: detection.numberplate, gate_id: detection.gate_id } : null,
        isPageVisible,
        selectedGate: selectedGate?.id
      });
      if (isPageVisible && detection) {
        console.log('[Entry Page] Showing vehicle type modal for detection:', detection.numberplate);
        setCapturedDetection(detection);
        setDetectedPlateNumber(detection.numberplate);
        setShowVehicleTypeModal(true);
        toast.success(`📷 New vehicle detected: ${detection.numberplate}`);
      } else {
        console.log('[Entry Page] Not showing modal - conditions not met:', {
          isPageVisible,
          hasDetection: !!detection
        });
      }
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

  // Auto-fetch pending detections when page becomes visible
  // Entry detections are automatically fetched from backend (populated by cron job)
  // Exit detections are also auto-fetched for exit processing
  // Fetch even if no gate is selected - show all detections from operator's assigned gates
  useEffect(() => {
    if (isPageVisible) {
      // Fetch both entry and exit detections automatically
      fetchPendingDetections();
      fetchPendingExitDetections();
    }
  }, [isPageVisible, fetchPendingDetections, fetchPendingExitDetections]);

  // Auto-refresh camera feed with direct camera endpoints (works in Tauri without proxy)
  useEffect(() => {
    if (!isPageVisible || !selectedGate || !cameraIp || !cameraDevice) return;

    const img = document.getElementById('camera-feed-img') as HTMLImageElement | null;
    if (!img) return;

    const isBrowser = typeof window !== 'undefined';
    const isTauri =
      isBrowser &&
      (((window as any).__TAURI__ !== undefined) ||
        window.location.protocol.includes('tauri'));

    const username = cameraDevice.username || 'admin';
    const password = cameraDevice.password || '';
    const port = cameraHttpPort || 80;

    const authPrefix =
      username || password
        ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`
        : '';

    const buildUrl = (path: string, cacheBust = false) => {
      const bust = cacheBust ? `${path.includes('?') ? '&' : '?'}t=${Date.now()}` : '';
      return `http://${authPrefix}${cameraIp}:${port}${path}${bust}`;
    };

    // Try MJPEG first, then fall back to snapshot endpoints
    const snapshotCandidates = [
      '/cgi-bin/snapshot.cgi',
      '/cgi-bin/snapshot.jpg',
      '/snapshot.jpg',
      '/Streaming/Channels/1/picture',
      '/mjpeg',
      '/video.cgi',
    ];

    let intervalId: NodeJS.Timeout | null = null;
    let currentCandidate = 0;
    let isMjpegActive = false;

    const startSnapshotLoop = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(async () => {
        const path = snapshotCandidates[currentCandidate % snapshotCandidates.length];
        const url = buildUrl(path, true);
        try {
          const resp = await fetch(url, { method: 'GET' });
          if (!resp.ok) {
            currentCandidate = (currentCandidate + 1) % snapshotCandidates.length;
            return;
          }
          const blob = await resp.blob();
          const objectUrl = URL.createObjectURL(blob);
          if (img.src && img.src.startsWith('blob:')) {
            URL.revokeObjectURL(img.src);
          }
          img.src = objectUrl;
        } catch {
          currentCandidate = (currentCandidate + 1) % snapshotCandidates.length;
        }
      }, 800); // ~1.2 fps
    };

    const startMjpeg = () => {
      isMjpegActive = true;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      const url = buildUrl('/cgi-bin/mjpeg', false);
      img.src = url;
      img.onerror = () => {
        // fall back to snapshots
        isMjpegActive = false;
        startSnapshotLoop();
      };
    };

    // In Tauri: try MJPEG; if it fails, fall back to snapshots
    if (isTauri) {
      startMjpeg();
    } else {
      // In browser build (if used), still try direct snapshots (no proxy in static build)
      startSnapshotLoop();
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (img.src && img.src.startsWith('blob:')) {
        URL.revokeObjectURL(img.src);
      }
      if (isMjpegActive) {
        img.src = '';
      }
    };
  }, [isPageVisible, selectedGate, cameraIp, cameraHttpPort, cameraDevice]);


  const handleEntrySuccess = (data: any) => {
    // Entry processed successfully - no logging needed
  };

  const handleVehicleTypeModalSuccess = () => {
    setShowVehicleTypeModal(false);
    // Clear the latest detection from backend API
    clearLatestDetection();
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

        {/* REMOVED: Local Detection Logs - Now using backend cron job instead */}

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
                    {selectedGate && cameraIp && (
                      <Button
                        onClick={() => {
                          // Force refresh by updating the image src
                          const img = document.getElementById('camera-feed-img') as HTMLImageElement;
                          if (img && cameraIp) {
                            img.src = `http://${cameraIp}:${cameraHttpPort}/edge/cgi-bin/vparcgi.cgi?computerid=1&oper=snapshot&resolution=800x600&i=${Date.now()}`;
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
                ) : !cameraIp ? (
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center" style={{ aspectRatio: '16/9', minHeight: '500px' }}>
                    <div className="text-center p-6 max-w-md">
                      <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                      <h3 className="text-white text-lg font-semibold mb-2">Camera Not Configured</h3>
                      <p className="text-gray-300 text-sm mb-4">
                        No camera IP address found for this gate. Please configure the camera device in Gate Settings.
                      </p>
                      <p className="text-gray-400 text-xs">
                        Gate: {selectedGate?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9', minHeight: '500px' }}>
                    {/* Live Camera Feed - Auto-refreshes every 500ms */}
                    <img
                      id="camera-feed-img"
                      src={`http://${cameraIp}:${cameraHttpPort}/edge/cgi-bin/vparcgi.cgi?computerid=1&oper=snapshot&resolution=800x600&i=${Date.now()}`}
                      alt="Camera Feed"
                      className="w-full h-full object-contain"
                      style={{ minHeight: '500px' }}
                      onError={(e) => {
                        console.error('[Entry Page] Camera image load error:', e);
                        const target = e.target as HTMLImageElement;
                        // Show error state
                        target.style.display = 'none';
                      }}
                    />
                    {/* Live Indicator */}
                    <div className="absolute bottom-2 right-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
                      🔴 Live • {cameraIp}:{cameraHttpPort}
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
                    <span>
                      Camera: {cameraIp ? `${cameraIp}:${cameraHttpPort}` : 'Not Configured'}
                      {cameraDevice && cameraDevice.name && ` (${cameraDevice.name})`}
                    </span>
                    {selectedGate && <span>Gate: {selectedGate.name}</span>}
                  </div>
                  {!cameraIp && selectedGate && (
                    <Alert className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Please configure a camera device for this gate in Settings → Gates → Gate Devices.
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
