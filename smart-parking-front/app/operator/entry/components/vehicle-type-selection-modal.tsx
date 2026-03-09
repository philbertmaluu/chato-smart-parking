"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useVehicleBodyTypes } from "@/app/manager/settings/hooks/use-vehicle-body-types";
import { get } from "@/utils/api/api";
import { API_ENDPOINTS } from "@/utils/api/endpoints";

interface ApiResponse {
  success: boolean;
  data: any[] | { data: any[] };
  messages?: string;
  status?: number;
}
import { CameraDetectionService } from "@/utils/api/camera-detection-service";
import { PendingVehicleTypeDetection } from "@/utils/api/camera-detection-service";
import { markLocalDetectionProcessed } from "@/utils/local-detection-storage";
import { getVehicleTypeIcon } from "@/utils/utils";
import {
  Loader2,
  Camera,
  Car,
  AlertCircle,
} from "lucide-react";

interface VehicleTypeSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detection: PendingVehicleTypeDetection | null;
  onSuccess?: () => void;
}

export function VehicleTypeSelectionModal({
  open,
  onOpenChange,
  detection,
  onSuccess,
}: VehicleTypeSelectionModalProps) {
  const [vehicleBodyTypes, setVehicleBodyTypes] = useState<any[]>([]);
  const [bodyTypesLoading, setBodyTypesLoading] = useState(false);
  const [selectedBodyTypeId, setSelectedBodyTypeId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch active vehicle body types when modal opens
  useEffect(() => {
    if (open) {
      const fetchActiveBodyTypes = async () => {
        setBodyTypesLoading(true);
        try {
          const response = await get<ApiResponse>(API_ENDPOINTS.VEHICLE_BODY_TYPES.ACTIVE_LIST);
          if (response?.success && response?.data) {
            const responseData = response.data;
            setVehicleBodyTypes(Array.isArray(responseData) ? responseData : responseData.data || []);
          } else {
            setVehicleBodyTypes([]);
          }
        } catch (error) {
          console.error('Error fetching active vehicle body types:', error);
          setVehicleBodyTypes([]);
        } finally {
          setBodyTypesLoading(false);
        }
      };

      fetchActiveBodyTypes();
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!detection) {
      toast.error("No detection provided");
      return;
    }
    
    // For existing vehicles, body type is optional
    const vehicleExists = (detection as any).vehicle_exists === true;
    if (!vehicleExists && !selectedBodyTypeId) {
      toast.error("Please select a vehicle body type");
      return;
    }

    setIsProcessing(true);
    try {
      let detectionId = detection.id;
      const isLocalDetection = (detection as any).isLocal && (detection as any).localId;

      // If this is a local detection, store it first
      if (isLocalDetection) {
        const localId = (detection as any).localId;
        const rawDetection = {
          id: detection.camera_detection_id || 0,
          numberplate: detection.numberplate,
          originalplate: detection.originalplate,
          detection_timestamp: detection.detection_timestamp,
          timestamp: detection.detection_timestamp,
          utc_time: detection.utc_time || detection.detection_timestamp,
          direction: detection.direction ?? 0,
          make_str: detection.make_str || '',
          model_str: detection.model_str || '',
          color_str: detection.color_str || '',
          make: (detection as any).make || 0,
          model: (detection as any).model || 0,
          color: (detection as any).color || 0,
          gate_id: detection.gate_id,
        };

        const storeResult = await CameraDetectionService.storeDetectionsFromBrowser(
          [rawDetection],
          detection.gate_id || undefined
        );

        if (!storeResult.success || storeResult.stored === 0) {
          toast.error("Failed to store detection. Please try again.");
          setIsProcessing(false);
          return;
        }

        const pendingDetections = await CameraDetectionService.getPendingVehicleTypeDetections();
        const storedDetection = pendingDetections.find(
          (d: any) =>
            d.numberplate === detection.numberplate &&
            d.gate_id === detection.gate_id
        );

        if (!storedDetection) {
          toast.error("Detection stored but could not be found. Please refresh and try again.");
          setIsProcessing(false);
          return;
        }

        detectionId = storedDetection.id;
        markLocalDetectionProcessed(localId);
      }

      // Process with vehicle type (optional for existing vehicles)
      const bodyTypeId: number | null | undefined = vehicleExists 
        ? (selectedBodyTypeId || undefined) 
        : selectedBodyTypeId;
      const result = await CameraDetectionService.processWithVehicleType(
        detectionId,
        bodyTypeId ?? undefined
      );

      if (result.success) {
        toast.success("Vehicle entry processed successfully");

        setSelectedBodyTypeId(null);
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.messages || "Failed to process vehicle entry");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to process vehicle entry");
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate duration since detection
  const calculateDetectionDuration = (detectionTime: string): string => {
    const detection = new Date(detectionTime);
    const now = new Date();
    const diffMs = now.getTime() - detection.getTime();
    
    if (diffMs < 0) {
      return '0s';
    }
    
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setSelectedBodyTypeId(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose} modal={true}>
      <DialogContent className="sm:max-w-[600px] z-[9999] fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] lg:w-full max-h-[90vh] overflow-hidden flex flex-col" onInteractOutside={(e) => {
        // Prevent closing by clicking outside when processing
        if (isProcessing) {
          e.preventDefault();
        }
      }}>
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-gradient flex items-center space-x-3 flex-wrap gap-2">
            <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
            <span>
              {(detection as any)?.vehicle_exists 
                ? "🚗 Vehicle Detected - Confirm Entry" 
                : "🚗 New Vehicle Detected - Action Required"}
            </span>
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base mt-2 font-medium">
            {(detection as any)?.vehicle_exists 
              ? "A known vehicle has been detected. You can process the entry directly without selecting body type."
              : "A new vehicle has been detected by the camera. Please select the vehicle body type and process the entry."}
          </DialogDescription>
        </DialogHeader>

        {detection && (
          <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 mt-4 pr-2">
            {/* Detection Time and Duration */}
            <div className="flex gap-3 sm:gap-4 flex-wrap">
              <div className="flex-1 p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 min-w-[150px]">
                <Label className="text-xs sm:text-sm font-medium text-muted-foreground uppercase">
                  Detection Time
                </Label>
                <p className="text-sm sm:text-base font-medium mt-1 text-purple-800 dark:text-purple-200">
                  {new Date(detection.detection_timestamp).toLocaleTimeString()}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(detection.detection_timestamp).toLocaleDateString()}
                </p>
              </div>
              <div className="flex-1 p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 min-w-[150px]">
                <Label className="text-xs sm:text-sm font-medium text-muted-foreground uppercase">
                  Time Since Detection
                </Label>
                <p className="text-sm sm:text-base font-bold text-green-800 dark:text-green-200 mt-1">
                  {calculateDetectionDuration(detection.detection_timestamp)}
                </p>
              </div>
            </div>

            {/* Detected Plate Number */}
            <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-3 flex-wrap">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Car className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <Label className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Detected Plate Number
                  </Label>
                  <p className="text-lg sm:text-2xl font-bold text-blue-800 dark:text-blue-200 break-all">
                    {detection.numberplate}
                  </p>
                </div>
              </div>
            </div>

            {/* Vehicle Body Type Selection - Only required for new vehicles */}
            {!(detection as any)?.vehicle_exists && (
              <div className="space-y-3">
                <Label htmlFor="bodyType" className="text-sm font-medium">
                  Vehicle Body Type *
                </Label>
                <Select
                  value={selectedBodyTypeId?.toString() || ""}
                  onValueChange={(value) => setSelectedBodyTypeId(parseInt(value))}
                  disabled={isProcessing || bodyTypesLoading}
                >
                  <SelectTrigger className="h-10 sm:h-12 w-full text-sm">
                    <SelectValue placeholder="Select vehicle body type" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] z-[9999] min-w-[200px]">
                    {vehicleBodyTypes.map((type: any) => {
                      const vehicleIcon = getVehicleTypeIcon(type.name);
                      return (
                        <SelectItem
                          key={type.id}
                          value={type.id.toString()}
                          className="text-sm"
                        >
                          <div className="flex items-center space-x-3">
                            <span
                              className={`text-lg ${vehicleIcon.color}`}
                            >
                              {vehicleIcon.icon}
                            </span>
                            <div>
                              <span className="font-medium">
                                {type.name}
                              </span>
                              {type.category && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({type.category})
                                </span>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {!selectedBodyTypeId && (
                  <p className="text-xs sm:text-sm text-red-500">
                    Please select a vehicle body type to continue
                  </p>
                )}
              </div>
            )}
            
            {/* Optional body type selection for existing vehicles */}
            {(detection as any)?.vehicle_exists && (
              <div className="space-y-3">
                <Label htmlFor="bodyType" className="text-sm font-medium">
                  Vehicle Body Type (Optional)
                </Label>
                <Select
                  value={selectedBodyTypeId?.toString() || ""}
                  onValueChange={(value) => {
                    // Allow clearing selection by setting to null
                    const parsed = value ? parseInt(value, 10) : null;
                    setSelectedBodyTypeId(parsed);
                  }}
                  disabled={isProcessing || bodyTypesLoading}
                >
                  <SelectTrigger className="h-10 sm:h-12 w-full text-sm">
                    <SelectValue placeholder="Optional: Update body type (or leave empty to skip)" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] z-[9999] min-w-[200px]">
                    {vehicleBodyTypes.map((type: any) => {
                      const vehicleIcon = getVehicleTypeIcon(type.name);
                      return (
                        <SelectItem
                          key={type.id}
                          value={type.id.toString()}
                          className="text-sm"
                        >
                          <div className="flex items-center space-x-3">
                            <span
                              className={`text-lg ${vehicleIcon.color}`}
                            >
                              {vehicleIcon.icon}
                            </span>
                            <div>
                              <span className="font-medium">
                                {type.name}
                              </span>
                              {type.category && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({type.category})
                                </span>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Body type is optional for existing vehicles. Leave empty to skip, or select one to update. You can process entry directly.
                </p>
              </div>
            )}

            {/* Additional Info */}
            {(detection.make_str || detection.model_str || detection.color_str) && (
              <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Label className="text-xs font-medium text-muted-foreground uppercase">
                  Detected Vehicle Details
                </Label>
                <div className="mt-2 space-y-1 text-xs sm:text-sm">
                  {detection.make_str && (
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground flex-shrink-0">Make:</span>
                      <span className="font-medium text-right">{detection.make_str}</span>
                    </div>
                  )}
                  {detection.model_str && (
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground flex-shrink-0">Model:</span>
                      <span className="font-medium text-right">{detection.model_str}</span>
                    </div>
                  )}
                  {detection.color_str && (
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground flex-shrink-0">Color:</span>
                      <span className="font-medium text-right">{detection.color_str}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Important Notice - Only show for new vehicles */}
            {!(detection as any)?.vehicle_exists && (
              <div className="flex items-start space-x-2 p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border-2 border-amber-300 dark:border-amber-700">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                    ⚠️ Action Required
                  </p>
                  <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200">
                    Please select the vehicle body type to process this entry. The vehicle will be registered and parking entry will be processed automatically once you click "Process Entry".
                  </p>
                </div>
              </div>
            )}
            
            {/* Info Notice for existing vehicles */}
            {(detection as any)?.vehicle_exists && (
              <div className="flex items-start space-x-2 p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-300 dark:border-green-700">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                    ✓ Known Vehicle
                  </p>
                  <p className="text-xs sm:text-sm text-green-800 dark:text-green-200">
                    This vehicle is already registered. You can process the entry directly without selecting body type.
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4 gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isProcessing}
                className="flex-1 h-9 sm:h-11 text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={(!selectedBodyTypeId && !(detection as any)?.vehicle_exists) || isProcessing || bodyTypesLoading}
                className="flex-1 h-9 sm:h-11 gradient-maroon text-sm"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Car className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Process Entry
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}






