"use client";

import { useState } from "react";
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
  const { vehicleBodyTypes, loading: bodyTypesLoading } = useVehicleBodyTypes();
  const [selectedBodyTypeId, setSelectedBodyTypeId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleClose = () => {
    if (!isProcessing) {
      setSelectedBodyTypeId(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose} modal={true}>
      <DialogContent className="sm:max-w-[500px] z-50" onInteractOutside={(e) => {
        // Prevent closing by clicking outside when processing
        if (isProcessing) {
          e.preventDefault();
        }
      }}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gradient flex items-center space-x-3">
            <Camera className="w-6 h-6 text-blue-600" />
            <span>
              {(detection as any)?.vehicle_exists 
                ? "🚗 Vehicle Detected - Confirm Entry" 
                : "🚗 New Vehicle Detected - Action Required"}
            </span>
          </DialogTitle>
          <DialogDescription className="text-base mt-2 font-medium">
            {(detection as any)?.vehicle_exists 
              ? "A known vehicle has been detected. You can process the entry directly without selecting body type."
              : "A new vehicle has been detected by the camera. Please select the vehicle body type and process the entry."}
          </DialogDescription>
        </DialogHeader>

        {detection && (
          <div className="space-y-6 mt-4">
            {/* Detected Plate Number */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <Car className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Detected Plate Number
                  </Label>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
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
                  <SelectTrigger className="h-12 w-full">
                    <SelectValue placeholder="Select vehicle body type" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleBodyTypes.map((type: any) => {
                      const vehicleIcon = getVehicleTypeIcon(type.name);
                      return (
                        <SelectItem
                          key={type.id}
                          value={type.id.toString()}
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
                  <p className="text-sm text-red-500">
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
                  <SelectTrigger className="h-12 w-full">
                    <SelectValue placeholder="Optional: Update body type (or leave empty to skip)" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleBodyTypes.map((type: any) => {
                      const vehicleIcon = getVehicleTypeIcon(type.name);
                      return (
                        <SelectItem
                          key={type.id}
                          value={type.id.toString()}
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
                <p className="text-sm text-muted-foreground">
                  Body type is optional for existing vehicles. Leave empty to skip, or select one to update. You can process entry directly.
                </p>
              </div>
            )}

            {/* Additional Info */}
            {(detection.make_str || detection.model_str || detection.color_str) && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Label className="text-xs font-medium text-muted-foreground uppercase">
                  Detected Vehicle Details
                </Label>
                <div className="mt-2 space-y-1 text-sm">
                  {detection.make_str && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Make:</span>
                      <span className="font-medium">{detection.make_str}</span>
                    </div>
                  )}
                  {detection.model_str && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Model:</span>
                      <span className="font-medium">{detection.model_str}</span>
                    </div>
                  )}
                  {detection.color_str && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Color:</span>
                      <span className="font-medium">{detection.color_str}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Important Notice - Only show for new vehicles */}
            {!(detection as any)?.vehicle_exists && (
              <div className="flex items-start space-x-2 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border-2 border-amber-300 dark:border-amber-700">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                    ⚠️ Action Required
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Please select the vehicle body type to process this entry. The vehicle will be registered and parking entry will be processed automatically once you click "Process Entry".
                  </p>
                </div>
              </div>
            )}
            
            {/* Info Notice for existing vehicles */}
            {(detection as any)?.vehicle_exists && (
              <div className="flex items-start space-x-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-300 dark:border-green-700">
                <AlertCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                    ✓ Known Vehicle
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    This vehicle is already registered. You can process the entry directly without selecting body type.
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isProcessing}
                className="flex-1 h-11"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={(!selectedBodyTypeId && !(detection as any)?.vehicle_exists) || isProcessing || bodyTypesLoading}
                className="flex-1 h-11 gradient-maroon"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Car className="w-4 h-4 mr-2" />
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






