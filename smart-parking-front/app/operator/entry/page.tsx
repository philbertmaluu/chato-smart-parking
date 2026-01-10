"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { ChevronDown, MapPin, Pencil, Camera, Video, CheckCircle, AlertCircle, Building2, X, RotateCcw, RefreshCw, ScanLine, Loader2, Wifi, WifiOff } from "lucide-react";
import { CameraDetectionService } from "@/utils/api/camera-detection-service";
import { toast } from "sonner";
import Echo from "laravel-echo";
import Pusher from "pusher-js";

// Declare Pusher on window for Laravel Echo
declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo;
  }
}

export default function VehicleEntry() {
  const { availableGates, selectedGate, selectedGateDevices, loading: gatesLoading, error: gatesError, selectGate, deselectGate } = useOperatorGates();
  const [showGateModal, setShowGateModal] = useState(false);
  const [showEntryDrawer, setShowEntryDrawer] = useState(false);
  const [showVehicleTypeModal, setShowVehicleTypeModal] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [captureLoading, setCaptureLoading] = useState(false);
  const [detectedPlateNumber, setDetectedPlateNumber] = useState<string | undefined>(undefined);
  const [capturedDetection, setCapturedDetection] = useState<any>(null);
  const [websocketConnected, setWebsocketConnected] = useState(false);
  const isPageVisible = usePageVisibility();
  const { setLatestNewDetection } = useDetectionContext();

  // ── NOTIFICATION SOUND (now using .mp3) ─────────────────────────────────────
  const notificationSound = useRef<HTMLAudioElement | null>(null);
  const lastSoundPlayed = useRef<number>(0);

  const playDetectionSound = useCallback(() => {
    const now = Date.now();
    // Prevent sound spam - minimum 2.2 seconds between plays
    if (now - lastSoundPlayed.current < 2200) return;

    if (notificationSound.current) {
      notificationSound.current.currentTime = 0;
      notificationSound.current.play().catch(err => {
        console.log("Sound playback blocked - needs user interaction first", err);
      });
      lastSoundPlayed.current = now;
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      notificationSound.current = new Audio('/sounds/detectionsound.mp3');
      notificationSound.current.preload = "auto";
      notificationSound.current.volume = 0.8; // ← adjust 0.3–0.8 as needed
    }

    return () => {
      if (notificationSound.current) {
        notificationSound.current.pause();
        notificationSound.current = null;
      }
    };
  }, []);
  // ─────────────────────────────────────────────────────────────────────────────

  // Get camera device from gate devices
  const cameraDevice = selectedGateDevices.find(device => device.device_type === 'camera' && device.status === 'active');
  
  // Get camera IP
  const cameraConfig = zktecoConfig.getConfig();
  const cameraIp = cameraDevice?.ip_address || cameraConfig?.ip || null;
  const cameraHttpPort = cameraDevice?.http_port || cameraConfig?.httpPort || 80;
  
  const effectiveDirection = 0; // Always entry direction

  // Debug camera config
  useEffect(() => {
    if (selectedGate) {
      console.log('[Entry Page] Camera Configuration:', {
        hasCameraDevice: !!cameraDevice,
        cameraIp,
        cameraHttpPort,
        gateDevices: selectedGateDevices.length,
        effectiveDirection,
        cameraDevice: cameraDevice ? {
          ip: cameraDevice.ip_address,
          port: cameraDevice.http_port,
          status: cameraDevice.status,
          name: cameraDevice.name
        } : null
      });
      
      if (!cameraIp) {
        console.warn('[Entry Page] ⚠️ Camera IP not configured!');
      }
    }
  }, [selectedGate, cameraDevice, cameraIp, cameraHttpPort, selectedGateDevices]);

  // WebSocket / Laravel Reverb setup
  useEffect(() => {
    if (!selectedGate) return;

    const reverbAppKey = process.env.NEXT_PUBLIC_REVERB_APP_KEY;
    const reverbHost = process.env.NEXT_PUBLIC_REVERB_HOST || 'localhost';
    const reverbPort = process.env.NEXT_PUBLIC_REVERB_PORT || '8080';
    const reverbScheme = process.env.NEXT_PUBLIC_REVERB_SCHEME || 'http';
    
    if (!reverbAppKey) {
      console.warn('[Entry Page] ⚠️ WebSocket not configured - missing Reverb credentials');
      setWebsocketConnected(false);
      return;
    }

    try {
      window.Pusher = Pusher;

      window.Echo = new Echo({
        broadcaster: 'reverb',
        key: reverbAppKey,
        wsHost: reverbHost,
        wsPort: reverbPort,
        wssPort: reverbPort,
        forceTLS: reverbScheme === 'https',
        enabledTransports: ['ws', 'wss'],
        authEndpoint: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/broadcasting/auth`,
        auth: {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
            Accept: 'application/json',
          },
        },
      });

      console.log('[Entry Page] ✅ Laravel Echo initialized');

      const channel = window.Echo.private(`gate.${selectedGate.id}`);

      channel.listen('.new-detection', (event: any) => {
        console.log('[Entry Page] 🎯 WebSocket new detection:', event);
        
        const detectionDirection = event.direction ?? 0;
        if (detectionDirection !== 0) {
          console.log('[Entry Page] Skipping non-entry detection');
          return;
        }

        // Play sound!
        playDetectionSound();

        if (isPageVisible) {
          const detection = {
            id: event.id,
            numberplate: event.numberplate,
            detection_timestamp: event.detection_timestamp,
            gate_id: event.gate_id,
            direction: 0,
            processing_status: 'pending_vehicle_type',
            global_confidence: event.global_confidence,
          };

          setCapturedDetection(detection);
          setDetectedPlateNumber(event.numberplate);
          setShowVehicleTypeModal(true);
          toast.success(`📷 New vehicle: ${event.numberplate}`, {
            description: `Gate: ${event.gate_name} (Entry)`,
          });
        }
      });

      window.Echo.connector.pusher.connection.bind('connected', () => {
        console.log('[Entry Page] ✅ WebSocket connected');
        setWebsocketConnected(true);
        toast.success('🔗 Real-time active');
      });

      window.Echo.connector.pusher.connection.bind('disconnected', () => {
        console.log('[Entry Page] ❌ WebSocket disconnected');
        setWebsocketConnected(false);
        toast.warning('Using polling fallback');
      });

      return () => {
        try {
          channel.stopListening('.new-detection');
          window.Echo.leave(`gate.${selectedGate.id}`);
        } catch (err) {
          console.warn('Cleanup error:', err);
        }
      };
    } catch (error) {
      console.error('[Entry Page] WebSocket init error:', error);
      setWebsocketConnected(false);
    }
  }, [selectedGate, isPageVisible, playDetectionSound]);

  // Fallback polling
  const { latestDetection, fetchPendingDetections, clearLatestDetection, loading: detectionsLoading } = usePendingDetections({
    enabled: isPageVisible && !websocketConnected,
    pollInterval: websocketConnected ? 0 : 3000,
    onNewDetection: (detection) => {
      if (detection && (detection.direction === 0 || detection.direction == null)) {
        console.log('[Entry Page] Polling → new entry detection:', detection);

        // Play sound!
        playDetectionSound();

        if (isPageVisible) {
          const entryDetection = { ...detection, direction: 0 };
          setCapturedDetection(entryDetection);
          setDetectedPlateNumber(detection.numberplate);
          setShowVehicleTypeModal(true);
          toast.success(`📷 New vehicle: ${detection.numberplate} (Entry)`);
        }
      }
    },
  });

  // Exit polling
  const { latestDetection: latestExitDetection, fetchPendingExitDetections, clearLatestDetection: clearLatestExitDetection } = usePendingExitDetections({
    enabled: true,
    pollInterval: 5000,
    onNewDetection: () => {
      if (isPageVisible) setShowExitDialog(true);
    },
  });

  useEffect(() => {
    if (latestExitDetection && isPageVisible) setShowExitDialog(true);
  }, [latestExitDetection, isPageVisible]);

  // Gate modal on load if none selected
  useEffect(() => {
    if (!gatesLoading && !selectedGate) {
      setShowGateModal(true);
    }
  }, [gatesLoading, selectedGate]);

  // Initial fetch when visible
  useEffect(() => {
    if (isPageVisible && selectedGate) {
      fetchPendingDetections();
      fetchPendingExitDetections();
    }
  }, [isPageVisible, selectedGate, fetchPendingDetections, fetchPendingExitDetections]);

  // Camera feed refresh (Tauri + browser)
  useEffect(() => {
    if (!isPageVisible || !selectedGate || !cameraIp || !cameraDevice) return;

    const img = document.getElementById('camera-feed-img') as HTMLImageElement | null;
    if (!img) return;

    const isTauri = typeof window !== 'undefined' && 
      ((window as any).__TAURI__ || window.location.protocol.includes('tauri'));

    const username = cameraDevice.username || 'admin';
    const password = cameraDevice.password || '';
    const port = cameraHttpPort || 80;

    const authPrefix = username || password ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@` : '';

    const buildUrl = (path: string, cacheBust = true) => {
      const bust = cacheBust ? `${path.includes('?') ? '&' : '?'}t=${Date.now()}` : '';
      return `http://${authPrefix}${cameraIp}:${port}${path}${bust}`;
    };

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
      intervalId = setInterval(async () => {
        const path = snapshotCandidates[currentCandidate % snapshotCandidates.length];
        const url = buildUrl(path, true);
        try {
          const resp = await fetch(url);
          if (!resp.ok) throw new Error('fail');
          const blob = await resp.blob();
          const objectUrl = URL.createObjectURL(blob);
          if (img.src?.startsWith('blob:')) URL.revokeObjectURL(img.src);
          img.src = objectUrl;
        } catch {
          currentCandidate = (currentCandidate + 1) % snapshotCandidates.length;
        }
      }, 800);
    };

    const startMjpeg = () => {
      isMjpegActive = true;
      if (intervalId) clearInterval(intervalId);
      img.src = buildUrl('/cgi-bin/mjpeg', false);
      img.onerror = () => {
        isMjpegActive = false;
        startSnapshotLoop();
      };
    };

    if (isTauri) {
      startMjpeg();
    } else {
      startSnapshotLoop();
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (img.src?.startsWith('blob:')) URL.revokeObjectURL(img.src);
      if (isMjpegActive) img.src = '';
    };
  }, [isPageVisible, selectedGate, cameraIp, cameraHttpPort, cameraDevice]);

  const handleCaptureVehicle = async () => {
    if (!selectedGate) {
      toast.error("Please select a gate first");
      return;
    }

    try {
      setCaptureLoading(true);
      const result = await CameraDetectionService.quickCapture({ direction: 0 });
      
      if (result.success && result.data?.detection?.plate_number) {
        const detection = {
          id: result.data.detection.id,
          numberplate: result.data.detection.plate_number,
          detection_timestamp: result.data.detection.detection_timestamp,
          gate_id: selectedGate.id,
          direction: 0,
          processing_status: 'manual_processing',
          make_str: null,
          model_str: null,
          color_str: null,
        };
        
        setCapturedDetection(detection);
        setShowVehicleTypeModal(true);
        toast.success(`Captured! Plate: ${result.data.detection.plate_number}`);
      } else {
        toast.warning("No vehicle detected");
      }
    } catch (err) {
      toast.error("Capture failed");
    } finally {
      setCaptureLoading(false);
    }
  };

  const handleVehicleTypeModalSuccess = () => {
    setShowVehicleTypeModal(false);
    clearLatestDetection();
    setCapturedDetection(null);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gradient">Vehicle Entry</h1>
              <p className="text-muted-foreground mt-2">Vehicle entry processing</p>
              {!selectedGate && (
                <div className="mt-2 flex items-center space-x-2 text-sm text-orange-600 dark:text-orange-400">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span>Please select a gate to start</span>
                </div>
              )}
              {selectedGate && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>Gate: <strong>{selectedGate.name}</strong></span>
                  </div>
                  <div className={`flex items-center space-x-2 text-xs ${websocketConnected ? 'text-blue-600' : 'text-amber-600'}`}>
                    {websocketConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    <span>{websocketConnected ? 'Real-time (Entry)' : 'Polling mode'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Camera Section */}
        {selectedGate && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
            <Card className="glass-effect">
              <CardHeader>
                <div className="flex items-center justify-end">
                  <div className="flex flex-wrap gap-3">
                    {selectedGate && cameraDevice && (
                      <Button
                        onClick={handleCaptureVehicle}
                        disabled={captureLoading}
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2 px-6 py-3 text-base animate-pulse hover:animate-none"
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

                    {selectedGate && cameraIp && (
                      <Button
                        variant="outline"
                        size="lg"
                        className="border-blue-500 text-blue-600 hover:bg-blue-50"
                        onClick={() => {
                          const img = document.getElementById('camera-feed-img') as HTMLImageElement;
                          if (img && cameraIp) {
                            img.src = `http://${cameraIp}:${cameraHttpPort}/edge/cgi-bin/vparcgi.cgi?computerid=1&oper=snapshot&resolution=800x600&i=${Date.now()}`;
                          }
                        }}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </Button>
                    )}

                    {selectedGate && (
                      <Button
                        variant="outline"
                        size="lg"
                        className="border-red-500 text-red-600 hover:bg-red-50"
                        onClick={async () => {
                          await deselectGate();
                          setShowGateModal(true);
                        }}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Change Gate
                      </Button>
                    )}

                    <Button
                      size="lg"
                      className={selectedGate ? "gradient-maroon hover:opacity-90" : "bg-gray-300 text-gray-500 cursor-not-allowed"}
                      onClick={() => setShowEntryDrawer(true)}
                      disabled={!selectedGate}
                    >
                      <Pencil className="w-5 h-5 mr-2" />
                      Manual Entry
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Camera feed display - your original logic */}
                {gatesLoading ? (
                  <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center min-h-[500px]">
                    <div className="text-center">
                      <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-white" />
                      <p className="text-white">Loading gate...</p>
                    </div>
                  </div>
                ) : !cameraIp ? (
                  <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center min-h-[500px]">
                    <div className="text-center p-6">
                      <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                      <h3 className="text-white text-lg font-medium">Camera Not Configured</h3>
                      <p className="text-gray-300 mt-2">Configure camera in Gate Settings</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video min-h-[500px]">
                    <img
                      id="camera-feed-img"
                      src={`http://${cameraIp}:${cameraHttpPort}/edge/cgi-bin/vparcgi.cgi?computerid=1&oper=snapshot&resolution=800x600&i=${Date.now()}`}
                      alt="Camera Feed"
                      className="w-full h-full object-contain"
                      onError={e => console.error('Camera feed error', e)}
                    />
                    <div className="absolute bottom-3 right-3 bg-black/60 px-3 py-1 rounded-full text-xs text-white flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      LIVE • {cameraIp}:{cameraHttpPort}
                    </div>
                    {websocketConnected && (
                      <div className="absolute top-3 right-3 bg-green-600/80 px-3 py-1 rounded-full text-xs text-white flex items-center gap-2">
                        <Wifi className="w-3 h-3" />
                        Real-time
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Camera: {cameraIp ? `${cameraIp}:${cameraHttpPort}` : 'Not configured'}</span>
                  {selectedGate && <span>Gate: {selectedGate.name} • Entry</span>}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Modals & Drawers */}
        <VehicleEntryDrawer
          open={showEntryDrawer}
          onOpenChange={(open) => {
            setShowEntryDrawer(open);
            if (!open) setDetectedPlateNumber(undefined);
          }}
          selectedGateId={selectedGate?.id}
          detectedPlateNumber={detectedPlateNumber}
          isPlateDetectionEnabled={!!detectedPlateNumber}
          onVehicleRegistered={() => {
            setDetectedPlateNumber(undefined);
            setShowEntryDrawer(false);
          }}
        />

        <GateSelectionModal
          open={showGateModal}
          onClose={() => setShowGateModal(false)}
          onGateSelected={() => {}} // handled internally in your hook
        />

        <VehicleTypeSelectionModal
          open={showVehicleTypeModal && capturedDetection !== null}
          onOpenChange={(open) => {
            setShowVehicleTypeModal(open);
            if (!open) setCapturedDetection(null);
          }}
          detection={capturedDetection}
          onSuccess={handleVehicleTypeModalSuccess}
        />

        <CameraExitDialog
          open={showExitDialog && latestExitDetection !== null}
          onOpenChange={(open) => {
            setShowExitDialog(open);
            if (!open) clearLatestExitDetection();
          }}
          detection={latestExitDetection}
          onExitProcessed={() => {
            clearLatestExitDetection();
            setTimeout(fetchPendingExitDetections, 200);
          }}
        />
      </div>
    </MainLayout>
  );
}