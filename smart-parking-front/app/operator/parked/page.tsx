"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
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
// CameraDetectionService import removed - no longer needed for polling
import { toast } from "sonner";
import { useDetectionContext } from "@/contexts/detection-context";
import { CameraDetection } from "@/hooks/use-detection-logs";
import { useRef } from "react";
import { useCameraLocalPolling } from "@/hooks/use-camera-local-polling";
import { RawCameraDetection } from "@/utils/camera-local-client";

// Fixed polling interval: 1.5 seconds as requested
// Polling removed - background processing handled by Laravel scheduler

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

  // Check for pending detections - NO POLLING
  // Background processing is handled by Laravel scheduler (cron jobs)
  // Only checks on page load and when page becomes visible
  const { latestDetection: pendingDetection, fetchPendingDetections, clearLatestDetection } = usePendingDetections({
    enabled: true, // Enabled but no polling - only checks on mount
    onNewDetection: (detection) => {
      // Only show modal if page is visible
      if (isPageVisible) {
        setShowVehicleTypeModal(true);
      }
    },
  });

  // Check for pending exit detections - NO POLLING
  // Background processing is handled by Laravel scheduler (cron jobs)
  // Only checks on page load and when page becomes visible
  const { latestDetection: latestExitDetection, fetchPendingExitDetections, clearLatestDetection: clearLatestExitDetection } = usePendingExitDetections({
    enabled: true, // Enabled but no polling - only checks on mount
    onNewDetection: (detection) => {
      // Only show dialog if page is visible
      if (isPageVisible) {
        setShowCameraExitDialog(true);
      }
    },
  });

  const handleLocalDetections = useCallback(
    (detections: RawCameraDetection[]) => {
      if (!detections || detections.length === 0) return;
      const latest = detections[detections.length - 1];
      const normalized: CameraDetection = {
        id: latest.id || 0,
        camera_detection_id: latest.id || 0,
        gate_id: selectedGate?.id || null,
        gate: selectedGate
          ? { id: selectedGate.id, name: selectedGate.name, station_id: selectedGate.station?.id || 0 }
          : undefined,
        numberplate: latest.numberplate || latest.originalplate || (latest as any).plate_number || '',
        originalplate: latest.originalplate || latest.numberplate || null,
        detection_timestamp:
          (latest as any).detection_timestamp ||
          latest.timestamp ||
          latest.utc_time ||
          new Date().toISOString(),
        utc_time: latest.utc_time || latest.timestamp || '',
        located_plate: Boolean((latest as any).locatedPlate ?? (latest as any).located_plate ?? true),
        global_confidence: (latest as any).globalconfidence ?? (latest as any).global_confidence ?? '',
        average_char_height: (latest as any).averagecharheight ?? '',
        process_time: (latest as any).processtime ?? 0,
        plate_format: (latest as any).plateformat ?? 0,
        country: latest.country ?? 0,
        country_str: (latest as any).country_str ?? '',
        vehicle_left: (latest as any).vehicleleft ?? 0,
        vehicle_top: (latest as any).vehicletop ?? 0,
        vehicle_right: (latest as any).vehicleright ?? 0,
        vehicle_bottom: (latest as any).vehiclebottom ?? 0,
        result_left: (latest as any).resultleft ?? 0,
        result_top: (latest as any).resulttop ?? 0,
        result_right: (latest as any).resultright ?? 0,
        result_bottom: (latest as any).resultbottom ?? 0,
        speed: latest.speed ?? "0",
        lane_id: (latest as any).laneid ?? (latest as any).lane_id ?? 0,
        direction: latest.direction ?? 0,
        make: latest.make ?? 0,
        model: latest.model ?? 0,
        color: latest.color ?? 0,
        make_str: (latest as any).make_str ?? "",
        model_str: (latest as any).model_str ?? "",
        color_str: (latest as any).color_str ?? "",
        veclass_str: (latest as any).veclass_str ?? "",
        image_path: (latest as any).imagepath ?? "",
        image_retail_path: (latest as any).imageretailpath ?? "",
        width: latest.width ?? 0,
        height: latest.height ?? 0,
        list_id: (latest as any).listid ?? "",
        name_list_id: (latest as any).namelistid ?? "",
        evidences: latest.evidences ?? 0,
        br_ocurr: latest.br_ocurr ?? 0,
        br_time: latest.br_time ?? 0,
        raw_data: latest,
        processed: false,
        processed_at: null,
        processing_status: (latest as any).processing_status ?? "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setContextDetection(normalized);
      if (normalized.numberplate) {
        toast.success(`📷 Local camera detected ${normalized.numberplate}`);
      }
    },
    [selectedGate]
  );

  useCameraLocalPolling({
    gateId: selectedGate?.id,
    cameraDevice,
    enabled: true,
    onNewDetections: handleLocalDetections,
  });

  // Show modal if there's a pending detection on initial load or when pendingDetection changes
  // Show immediately when page becomes visible if there's a pending detection
  useEffect(() => {
    if (pendingDetection) {
      if (isPageVisible) {
        setShowVehicleTypeModal(true);
      }
    }
  }, [pendingDetection, isPageVisible]);

  // Show exit dialog if there's a pending exit detection
  // Show immediately when page becomes visible if there's a pending exit detection
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
      // Fetch both types of pending detections when page becomes visible
      // Background processing is handled by Laravel scheduler
      fetchPendingDetections();
      fetchPendingExitDetections();
    }
  }, [isPageVisible, fetchPendingDetections, fetchPendingExitDetections]);

  // Watch for new detections from detection logs page via context
  useEffect(() => {
    if (!latestNewDetection || !isPageVisible) return;

    const detection = latestNewDetection;

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
    // Check if plate number matches any active passage
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
  }, [latestNewDetection, isPageVisible, activePassages, clearContextDetection]);

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
    clearLatestDetection(); // Clear first to allow next in queue
    // Refresh after a short delay to allow next detection to be fetched
    setTimeout(() => {
      fetchPendingDetections(); // This will fetch next in queue
      fetchActivePassages(); // Also refresh active passages
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
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gradient">
              {t("nav.parked") || "Detected Vehicles"}
            </h1>
            <p className="text-muted-foreground mt-2">
              Currently detected vehicles at your gate
            </p>
            {!selectedGate && (
              <div className="mt-2 flex items-center space-x-2 text-sm text-orange-600 dark:text-orange-400">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span>
                  Please select a gate from the entry page to process exits
                </span>
              </div>
            )}
            {selectedGate && (
              <div className="mt-2 flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>
                  Active Gate: <strong>{selectedGate.name}</strong> at {selectedGate.station?.name}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => fetchActivePassages()}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {t("common.refresh") || "Refresh"}
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={viewMode === "grid" ? "gradient-maroon" : ""}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "gradient-maroon" : ""}
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
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search by plate number, passage number, or vehicle type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 h-12 text-base glass-effect border-0 focus:ring-2 focus:ring-primary/20"
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
                <div className="mt-3 text-sm text-muted-foreground">
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
            className="text-center py-12"
          >
            <Loader2 className="w-8 h-8 mx-auto text-primary mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading active passages...</p>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <AlertCircle className="w-8 h-8 mx-auto text-red-500 mb-4" />
            <p className="text-red-600 font-medium mb-2">
              Error loading vehicles
            </p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => fetchActivePassages()} variant="outline">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      <Card className="glass-effect border-0 shadow-lg hover:shadow-xl transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-full ${vehicleIcon.bgColor}`}>
                                <span className={`text-lg ${vehicleIcon.color}`}>
                                  {vehicleIcon.icon}
                                </span>
                              </div>
                              <div>
                                <h3 className="font-bold text-lg">
                                  {passage.vehicle?.plate_number || "N/A"}
                                </h3>
                                <Badge className={`${vehicleIcon.bgColor} ${vehicleIcon.color} border-0`}>
                                  {vehicleType}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                Entry Time:
                              </span>
                              <span className="text-sm font-medium">
                                {formatTime(passage.entry_time)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">
                                Duration:
                              </span>
                              <span className="text-sm font-medium">
                                {passage.duration || "0m"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground flex items-center">
                                <DollarSign className="w-3 h-3 mr-1" />
                                Current Fee:
                              </span>
                              <span className="text-sm font-bold text-primary">
                                {passage.currentFee || "Tsh. 0.00"}
                              </span>
                            </div>
                            {passage.spot && (
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">
                                  Spot:
                                </span>
                                <span className="text-sm font-mono">
                                  {passage.spot}
                                </span>
                              </div>
                            )}
                          </div>

                          <Button
                            className="w-full gradient-maroon hover:opacity-90 transition-opacity"
                            onClick={() => handleProcessExit(passage)}
                            disabled={!selectedGate}
                          >
                            {selectedGate ? "Process Exit" : "Select Gate First"}
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
                  <div className="space-y-4">
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
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-full ${vehicleIcon.bgColor}`}>
                              <span className={`text-lg ${vehicleIcon.color}`}>
                                {vehicleIcon.icon}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">
                                {passage.vehicle?.plate_number || "N/A"}
                              </h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge className={`${vehicleIcon.bgColor} ${vehicleIcon.color} border-0`}>
                                  {vehicleType}
                                </Badge>
                                {passage.passage_number && (
                                  <Badge variant="outline" className="text-xs">
                                    #{passage.passage_number}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-6">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">
                                Entry Time
                              </p>
                              <p className="font-medium text-xs">
                                {formatDate(passage.entry_time)}
                              </p>
                              <p className="font-medium">
                                {formatTime(passage.entry_time)}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">
                                Duration
                              </p>
                              <p className="font-medium">{passage.duration || "0m"}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">
                                Current Fee
                              </p>
                              <p className="font-bold text-primary">
                                {passage.currentFee || "Tsh. 0.00"}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              className="gradient-maroon hover:opacity-90 transition-opacity"
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
            className="text-center py-12"
          >
            <Car className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No vehicles found
            </h3>
            <p className="text-sm text-muted-foreground">
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
            clearLatestExitDetection(); // Clear first to allow next in queue
            if (contextDetection) {
              setContextDetection(null);
              clearContextDetection();
            }
            // Refresh after a short delay to allow next detection to be fetched
            setTimeout(() => {
              fetchPendingExitDetections(); // This will fetch next in queue
              fetchActivePassages(); // Refresh active passages list
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
