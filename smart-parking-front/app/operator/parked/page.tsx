"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/language-provider";
import { useOperatorGates } from "@/hooks/use-operator-gates";
import { formatTime, formatDate } from "@/utils/date-utils";
import { getVehicleTypeIcon } from "@/utils/utils";
import {
  Search,
  Car,
  Grid,
  List,
  RefreshCw,
  Loader2,
  AlertCircle,
  Clock,
  DollarSign,
} from "lucide-react";
import { ActivePassage, useActivePassages } from "./hooks/use-active-passages";
import { VehicleExitDialog } from "./components/vehicle-exit-dialog";
import { CameraExitDialog } from "@/app/operator/entry/components/camera-exit-dialog";
import { usePendingDetections } from "@/hooks/use-pending-detections";
import { usePendingExitDetections } from "@/hooks/use-pending-exit-detections";
import { usePageVisibility } from "@/hooks/use-page-visibility";
import { VehicleTypeSelectionModal } from "@/app/operator/entry/components/vehicle-type-selection-modal";
import { toast } from "sonner";
import { useDetectionContext } from "@/contexts/detection-context";
import { CameraDetection } from "@/hooks/use-detection-logs";

export default function ParkedVehicles() {
  const { t } = useLanguage();
  const { selectedGate, selectedGateDevices } = useOperatorGates();
  const { latestNewDetection, clearLatestDetection: clearContextDetection } = useDetectionContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedPassage, setSelectedPassage] = useState<ActivePassage | null>(
    null
  );
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showCameraExitDialog, setShowCameraExitDialog] = useState(false);
  const [showVehicleTypeModal, setShowVehicleTypeModal] = useState(false);
  const [contextDetection, setContextDetection] = useState<CameraDetection | null>(null);
  const isPageVisible = usePageVisibility();
  
  const cameraDevice = selectedGateDevices?.find(
    (device) => device.device_type === "camera" && device.status === "active"
  );
  const directionFromGate = selectedGate?.gate_type === "exit" ? 1 : 0;
  const directionFromDevice =
    cameraDevice?.direction?.toLowerCase() === "exit"
      ? 1
      : cameraDevice?.direction?.toLowerCase() === "entry"
        ? 0
        : null;
  const effectiveDirection = directionFromDevice ?? directionFromGate;

  // ── NOTIFICATION SOUND ─────────────────────────────────────────────────────
  const notificationSound = useRef<HTMLAudioElement | null>(null);
  const lastSoundPlayed = useRef(0);

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
      notificationSound.current.volume = 0.8; // Adjust 0.3–0.8 as needed
    }

    return () => {
      if (notificationSound.current) {
        notificationSound.current.pause();
        notificationSound.current = null;
      }
    };
  }, []);
  // ───────────────────────────────────────────────────────────────────────────

  // Check for pending detections - NO POLLING
  const { latestDetection: pendingDetection, fetchPendingDetections, clearLatestDetection } = usePendingDetections({
    enabled: true,
    onNewDetection: (detection) => {
      // Play sound when new detection arrives
      playDetectionSound();
      
      // Only show modal if page is visible
      if (isPageVisible) {
        setShowVehicleTypeModal(true);
      }
    },
  });

  // Check for pending exit detections - NO POLLING
  const { latestDetection: latestExitDetection, fetchPendingExitDetections, clearLatestDetection: clearLatestExitDetection } = usePendingExitDetections({
    enabled: true,
    onNewDetection: (detection) => {
      // Play sound when new exit detection arrives
      playDetectionSound();
      
      // Only show dialog if page is visible
      if (isPageVisible) {
        setShowCameraExitDialog(true);
      }
    },
  });

  // Show modal if there's a pending detection on initial load or when pendingDetection changes
  useEffect(() => {
    if (pendingDetection) {
      if (isPageVisible) {
        setShowVehicleTypeModal(true);
      }
    }
  }, [pendingDetection, isPageVisible]);

  // Show exit dialog if there's a pending exit detection
  useEffect(() => {
    if (latestExitDetection) {
      if (isPageVisible) {
        setShowCameraExitDialog(true);
      }
    }
  }, [latestExitDetection, isPageVisible]);

  const { 
    activePassages, 
    loading, 
    error, 
    fetchActivePassages,
    processVehicleExit,
    searchActivePassages,
  } = useActivePassages();

  // Fetch pending detections when page becomes visible (no continuous polling)
  useEffect(() => {
    if (isPageVisible) {
      fetchPendingDetections();
      fetchPendingExitDetections();
    }
  }, [isPageVisible]);

  // Watch for new detections from detection logs page via context
  useEffect(() => {
    if (!latestNewDetection || !isPageVisible) return;

    const detection = latestNewDetection;

    // Play sound for context detections too
    playDetectionSound();

    // Store detection for modal use
    setContextDetection(detection);

    // Check processing_status first
    if (detection.processing_status === 'pending_exit') {
      setShowCameraExitDialog(true);
      clearContextDetection();
      return;
    }

    if (detection.processing_status === 'pending_vehicle_type') {
      setShowVehicleTypeModal(true);
      clearContextDetection();
      return;
    }

    // Fallback: Check if vehicle has active passage
    const hasActivePassage = activePassages.some(
      (passage) => passage.vehicle?.plate_number?.toLowerCase() === detection.numberplate?.toLowerCase()
    );

    if (hasActivePassage) {
      setShowCameraExitDialog(true);
      clearContextDetection();
    } else {
      setShowVehicleTypeModal(true);
      clearContextDetection();
    }
  }, [latestNewDetection, isPageVisible, activePassages, clearContextDetection, playDetectionSound]);

  // Filter passages based on search term
  const filteredPassages = useMemo(() => {
    if (!searchTerm.trim()) {
      return activePassages;
    }
    return searchActivePassages(searchTerm);
  }, [activePassages, searchTerm, searchActivePassages]);

  // Handle process exit
  const handleProcessExit = async (passage: ActivePassage) => {
    if (!selectedGate) {
      toast.error("Please select a gate first");
      return;
    }
    setSelectedPassage(passage);
    setShowExitDialog(true);
  };

  // Handle exit processed callback
  const handleExitProcessed = () => {
    fetchActivePassages();
    setShowExitDialog(false);
    setSelectedPassage(null);
  };

  // Handle vehicle type modal success
  const handleVehicleTypeModalSuccess = () => {
    clearLatestDetection();
    setTimeout(() => {
      fetchPendingDetections();
      fetchActivePassages();
    }, 200);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full"
        >
          <div className="w-full">
            <h1 className="text-2xl sm:text-3xl font-bold text-gradient">
              {t("nav.parked") || "Detected Vehicles"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Currently detected vehicles at your gate
            </p>
            {!selectedGate && (
              <div className="mt-2 flex items-center space-x-2 text-xs sm:text-sm text-orange-600 dark:text-orange-400">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse flex-shrink-0"></div>
                <span className="break-words">
                  Please select a gate from the entry page to process exits
                </span>
              </div>
            )}
            {selectedGate && (
              <div className="mt-2 flex items-center space-x-2 text-xs sm:text-sm text-green-600 dark:text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="break-words">
                  Active Gate: <strong>{selectedGate.name}</strong> at {selectedGate.station?.name}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end space-x-2 gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => fetchActivePassages()}
              disabled={loading}
              size="sm"
              className="text-xs sm:text-sm"
            >
              <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{t("common.refresh") || "Refresh"}</span>
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={`${viewMode === "grid" ? "gradient-maroon" : ""} p-2 sm:px-3`}
              title="Grid view"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={`${viewMode === "list" ? "gradient-maroon" : ""} p-2 sm:px-3`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card className="glass-effect border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
                <Input
                  placeholder="Search by plate, passage #..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 sm:pl-12 pr-4 h-10 sm:h-12 text-sm sm:text-base glass-effect border-0 focus:ring-2 focus:ring-primary/20"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  >
                    <span className="text-muted-foreground">×</span>
                  </Button>
                )}
              </div>
              {searchTerm && (
                <div className="mt-3 text-xs sm:text-sm text-muted-foreground">
                  Found {filteredPassages.length} vehicle{filteredPassages.length !== 1 ? 's' : ''} matching "{searchTerm}"
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 sm:py-12"
          >
            <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-primary mb-4 animate-spin" />
            <p className="text-sm sm:text-base text-muted-foreground">Loading active passages...</p>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 sm:py-12"
          >
            <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-red-500 mb-4" />
            <p className="text-red-600 font-medium mb-2">
              Error loading vehicles
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4 px-4">{error}</p>
            <Button onClick={() => fetchActivePassages()} variant="outline" size="sm">
              Try Again
            </Button>
          </motion.div>
        )}

        {/* Vehicles Display */}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredPassages.map((passage, index) => {
                  const vehicleType = passage.vehicle?.body_type?.name || "Unknown";
                  const vehicleIcon = getVehicleTypeIcon(vehicleType);
                  
                  return (
                    <motion.div
                      key={passage.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + index * 0.1, duration: 0.3 }}
                    >
                      <Card className="glass-effect border-0 shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col">
                        <CardContent className="p-4 sm:p-6 flex-1 flex flex-col">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className={`p-2 rounded-full flex-shrink-0 ${vehicleIcon.bgColor}`}>
                                <span className={`text-lg ${vehicleIcon.color}`}>
                                  {vehicleIcon.icon}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-bold text-base sm:text-lg break-all">
                                  {passage.vehicle?.plate_number || "N/A"}
                                </h3>
                                <Badge className={`${vehicleIcon.bgColor} ${vehicleIcon.color} border-0 text-xs mt-1`}>
                                  {vehicleType}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 mb-4 flex-1">
                            <div className="flex justify-between gap-2">
                              <span className="text-xs sm:text-sm text-muted-foreground flex items-center flex-shrink-0">
                                <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                                Entry:
                              </span>
                              <span className="text-xs sm:text-sm font-medium text-right break-words">
                                {formatTime(passage.entry_time)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-2">
                              <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">
                                Duration:
                              </span>
                              <span className="text-xs sm:text-sm font-medium">
                                {passage.duration || "0m"}
                              </span>
                            </div>
                            <div className="flex justify-between gap-2">
                              <span className="text-xs sm:text-sm text-muted-foreground flex items-center flex-shrink-0">
                                <DollarSign className="w-3 h-3 mr-1 flex-shrink-0" />
                                Fee:
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-primary">
                                {passage.currentFee || "Tsh. 0.00"}
                              </span>
                            </div>
                            {passage.spot && (
                              <div className="flex justify-between gap-2">
                                <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">
                                  Spot:
                                </span>
                                <span className="text-xs sm:text-sm font-mono">
                                  {passage.spot}
                                </span>
                              </div>
                            )}
                          </div>

                          <Button
                            className="w-full gradient-maroon hover:opacity-90 transition-opacity text-xs sm:text-sm"
                            onClick={() => handleProcessExit(passage)}
                            disabled={!selectedGate}
                            size="sm"
                          >
                            {selectedGate ? "Process Exit" : "Select Gate"}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <Card className="glass-effect border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Active Passages List</CardTitle>
                  <CardDescription>
                    Vehicles currently parked at your gate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 overflow-x-auto">
                    {filteredPassages.map((passage, index) => {
                      const vehicleType = passage.vehicle?.body_type?.name || "Unknown";
                      const vehicleIcon = getVehicleTypeIcon(vehicleType);
                      
                      return (
                        <motion.div
                          key={passage.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: 0.6 + index * 0.1,
                            duration: 0.3,
                          }}
                          className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors gap-4"
                        >
                          <div className="flex items-center space-x-4 flex-1 min-w-0">
                            <div className={`p-2 rounded-full flex-shrink-0 ${vehicleIcon.bgColor}`}>
                              <span className={`text-lg ${vehicleIcon.color}`}>
                                {vehicleIcon.icon}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-lg break-all">
                                {passage.vehicle?.plate_number || "N/A"}
                              </h3>
                              <div className="flex items-center space-x-2 mt-1 flex-wrap gap-2">
                                <Badge className={`${vehicleIcon.bgColor} ${vehicleIcon.color} border-0 flex-shrink-0`}>
                                  {vehicleType}
                                </Badge>
                                {passage.passage_number && (
                                  <Badge variant="outline" className="text-xs flex-shrink-0">
                                    #{passage.passage_number}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4 w-full lg:w-auto">
                            <div className="text-left sm:text-center">
                              <p className="text-xs text-muted-foreground font-medium">
                                Entry Time
                              </p>
                              <p className="font-medium text-xs">
                                {formatDate(passage.entry_time)}
                              </p>
                              <p className="font-medium text-sm">
                                {formatTime(passage.entry_time)}
                              </p>
                            </div>
                            <div className="text-left sm:text-center">
                              <p className="text-xs text-muted-foreground font-medium">
                                Duration
                              </p>
                              <p className="font-medium text-sm">{passage.duration || "0m"}</p>
                            </div>
                            <div className="text-left sm:text-center">
                              <p className="text-xs text-muted-foreground font-medium">
                                Current Fee
                              </p>
                              <p className="font-bold text-primary text-sm">
                                {passage.currentFee || "Tsh. 0.00"}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              className="gradient-maroon hover:opacity-90 transition-opacity w-full sm:w-auto flex-shrink-0"
                              onClick={() => handleProcessExit(passage)}
                              disabled={!selectedGate}
                            >
                              {selectedGate ? "Process Exit" : "Select Gate"}
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredPassages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-center py-8 sm:py-12"
          >
            <Car className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-muted-foreground mb-2">
              No vehicles found
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground px-4">
              {searchTerm
                ? "Try adjusting your search terms"
                : "No active passages found. Vehicles will appear here once they enter the parking area."}
            </p>
          </motion.div>
        )}

        {/* Exit Dialog */}
        <VehicleExitDialog
          open={showExitDialog}
          onOpenChange={setShowExitDialog}
          vehicle={selectedPassage}
          onExitProcessed={handleExitProcessed}
        />

        {/* Camera Exit Dialog */}
        <CameraExitDialog
          open={showCameraExitDialog && (latestExitDetection !== null || contextDetection !== null)}
          onOpenChange={(open) => {
            setShowCameraExitDialog(open);
            if (!open) {
              clearLatestExitDetection();
              if (contextDetection) {
                setContextDetection(null);
                clearContextDetection();
              }
            }
          }}
          detection={latestExitDetection || (contextDetection ? contextDetection as any : null)}
          onExitProcessed={() => {
            clearLatestExitDetection();
            if (contextDetection) {
              setContextDetection(null);
              clearContextDetection();
            }
            setTimeout(() => {
              fetchPendingExitDetections();
              fetchActivePassages();
            }, 200);
          }}
        />

        {/* Vehicle Type Selection Modal */}
        <VehicleTypeSelectionModal
          open={showVehicleTypeModal && (pendingDetection !== null || contextDetection !== null)}
          onOpenChange={(open) => {
            setShowVehicleTypeModal(open);
            if (!open) {
              clearLatestDetection();
              if (contextDetection) {
                setContextDetection(null);
                clearContextDetection();
              }
            }
          }}
          detection={pendingDetection || (contextDetection ? contextDetection as any : null)}
          onSuccess={() => {
            handleVehicleTypeModalSuccess();
            if (contextDetection) {
              setContextDetection(null);
              clearContextDetection();
            }
          }}
        />
      </div>
    </MainLayout>
  );
}