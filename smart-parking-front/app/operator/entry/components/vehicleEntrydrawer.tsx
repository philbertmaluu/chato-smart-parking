"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { get } from "@/utils/api/api";
import { API_ENDPOINTS } from "@/utils/api/endpoints";
import { useAuth } from "@/components/auth-provider";
import {
  VehiclePassageService,
  type VehiclePassageData,
  type VehiclePassageResponse,
} from "@/utils/api/vehicle-passage-service";
import { getVehicleTypeIcon } from "@/utils/utils";
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  Camera,
  Keyboard,
} from "lucide-react";

interface VehicleEntryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVehicleRegistered: (
    vehicle: any,
    passageData?: any,
    receiptData?: any
  ) => void;
  selectedGateId?: number;
  // For future plate detection integration
  detectedPlateNumber?: string;
  isPlateDetectionEnabled?: boolean;
}

export function VehicleEntryDrawer({
  open,
  onOpenChange,
  onVehicleRegistered,
  selectedGateId,
  detectedPlateNumber,
  isPlateDetectionEnabled = false,
}: VehicleEntryDrawerProps) {
  const { user } = useAuth();
  // Use a simpler hook that fetches only active body types for operators
  const [vehicleBodyTypes, setVehicleBodyTypes] = useState<any[]>([]);
  const [bodyTypesLoading, setBodyTypesLoading] = useState(true);
  const [bodyTypesError, setBodyTypesError] = useState<string | null>(null);

  // Fetch active vehicle body types on mount
  useEffect(() => {
    const fetchActiveBodyTypes = async () => {
      setBodyTypesLoading(true);
      setBodyTypesError(null);
      try {
        const response = await get<{ success: boolean; data: any[] }>(
          API_ENDPOINTS.VEHICLE_BODY_TYPES.ACTIVE_LIST
        );
        if (response?.success && response?.data) {
          setVehicleBodyTypes(response.data);
        } else {
          setVehicleBodyTypes([]);
        }
      } catch (err) {
        console.error("Error fetching active body types:", err);
        setBodyTypesError(err instanceof Error ? err.message : 'Failed to fetch vehicle body types');
        setVehicleBodyTypes([]);
      } finally {
        setBodyTypesLoading(false);
      }
    };

    if (open) {
      fetchActiveBodyTypes();
    }
  }, [open]);

  const [manualPlateNumber, setManualPlateNumber] = useState("");
  const [bodyTypeId, setBodyTypeId] = useState<number | undefined>();
  const [ownerName, setOwnerName] = useState("");
  const [isProcessingEntry, setIsProcessingEntry] = useState(false);

  // Initialize plate number from detection or manual input
  const currentPlateNumber = detectedPlateNumber || manualPlateNumber;

  // Auto-fill plate number when drawer opens with detected plate
  useEffect(() => {
    if (open && detectedPlateNumber) {
      setManualPlateNumber(detectedPlateNumber);
    }
  }, [open, detectedPlateNumber]);

  const handleProcessEntry = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!currentPlateNumber.trim()) {
      toast.error("Please enter a plate number");
      return;
    }

    if (!selectedGateId) {
      toast.error("Please select a gate first");
      return;
    }

    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    setIsProcessingEntry(true);
    try {
      const passageData: VehiclePassageData = {
        plate_number: currentPlateNumber.trim(),
        gate_id: selectedGateId,
        body_type_id: bodyTypeId, // Optional - can be undefined
        owner_name: ownerName.trim() || undefined,
      };

      const result: VehiclePassageResponse =
        await VehiclePassageService.processEntry(passageData);

      if (result.success) {
        toast.success(result.message || "Vehicle entry processed successfully");

        // Call the callback with passage data (vehicle can be null for unregistered vehicles)
        onVehicleRegistered(null as any, result.data, result.receipt);

        // Reset form
        setManualPlateNumber("");
        setBodyTypeId(undefined);
        setOwnerName("");
        onOpenChange(false);
      } else {
        toast.error(result.message || "Failed to process vehicle entry");
      }
    } catch (error: any) {
      console.error("Error processing vehicle entry:", error);
      toast.error(error.message || "Failed to process vehicle entry");
    } finally {
      setIsProcessingEntry(false);
    }
  };


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[600px] sm:w-[700px] p-0 overflow-hidden"
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 border-b bg-gradient-to-r from-primary/5 to-primary/10"
          >
            <SheetHeader className="text-left">
              <SheetTitle className="text-2xl font-bold text-gradient flex items-center space-x-3">
                {isPlateDetectionEnabled ? (
                  <Camera className="w-6 h-6" />
                ) : (
                  <Keyboard className="w-6 h-6" />
                )}
                <span>
                  {isPlateDetectionEnabled ? "Manual Entry" : "Vehicle Entry"}
                </span>
              </SheetTitle>
              <SheetDescription className="text-base mt-2">
                Enter vehicle details to process entry
              </SheetDescription>
              {selectedGateId && (
                <div className="mt-2 flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Gate selected and ready for processing</span>
                </div>
              )}
              {!selectedGateId && (
                <div className="mt-2 flex items-center space-x-2 text-sm text-orange-600 dark:text-orange-400">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span>Please select a gate from the main page first</span>
                </div>
              )}
              {detectedPlateNumber && (
                <div className="mt-2 flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
                  <Camera className="w-4 h-4" />
                  <span>Detected: {detectedPlateNumber}</span>
                </div>
              )}
            </SheetHeader>
          </motion.div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleProcessEntry} className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Manual Vehicle Entry</h3>
                <p className="text-muted-foreground">Enter vehicle details to process entry</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="plateNumber">License Plate Number *</Label>
                    <Input
                    id="plateNumber"
                      value={currentPlateNumber}
                    onChange={(e) => setManualPlateNumber(e.target.value.toUpperCase())}
                      placeholder="Enter plate number (e.g., ABC-123)"
                    className="text-lg font-mono h-12"
                    required
                    autoFocus
                  />
                  </div>

                    <div className="space-y-2">
                  <Label htmlFor="bodyType">Vehicle Body Type (Optional)</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Leave empty to set vehicle type at exit
                  </p>
                  {bodyTypesError && (
                    <div className="text-sm text-red-600 dark:text-red-400 mb-2">
                      Error loading body types: {bodyTypesError}
                        </div>
                      )}
                  <Select
                    value={bodyTypeId?.toString() || ""}
                    onValueChange={(value) => {
                      if (value !== "loading" && value !== "none") {
                        setBodyTypeId(parseInt(value));
                      } else if (value === "none") {
                        setBodyTypeId(undefined);
                      }
                    }}
                    disabled={bodyTypesLoading || !!bodyTypesError}
                  >
                    <SelectTrigger className="w-full h-12">
                      <SelectValue placeholder={
                        bodyTypesLoading 
                          ? "Loading body types..." 
                          : bodyTypesError 
                          ? "Error loading body types" 
                          : vehicleBodyTypes.length === 0 
                          ? "No body types available" 
                          : "Select vehicle body type (optional)"
                      } />
                          </SelectTrigger>
                          <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center space-x-3">
                          <span className="text-muted-foreground">Skip - Set at exit</span>
                        </div>
                      </SelectItem>
                      {bodyTypesLoading ? (
                        <SelectItem value="loading" disabled>
                          <div className="flex items-center space-x-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Loading body types...</span>
                          </div>
                        </SelectItem>
                      ) : vehicleBodyTypes.length === 0 ? (
                        <SelectItem value="empty" disabled>
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4" />
                            <span>No body types available</span>
                          </div>
                        </SelectItem>
                      ) : (
                        vehicleBodyTypes
                          .filter((type: any) => type.is_active !== false)
                          .map((type: any) => {
                              const vehicleIcon = getVehicleTypeIcon(type.name);
                              return (
                              <SelectItem key={type.id} value={type.id.toString()}>
                                  <div className="flex items-center space-x-3">
                                  <span className={`text-lg ${vehicleIcon.color}`}>
                                      {vehicleIcon.icon}
                                    </span>
                                  <span>{type.name}</span>
                                      {type.category && (
                                    <span className="text-xs text-muted-foreground">
                                          ({type.category})
                                        </span>
                                      )}
                                  </div>
                                </SelectItem>
                              );
                          })
                      )}
                          </SelectContent>
                        </Select>
                  {!bodyTypesLoading && vehicleBodyTypes.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {vehicleBodyTypes.filter((type: any) => type.is_active !== false).length} body type(s) available
                    </p>
                  )}
                      </div>

                      <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner Name (Optional)</Label>
                        <Input
                          id="ownerName"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Enter owner name"
                    className="h-12"
                  />
                    </div>

                {!selectedGateId && (
                  <div className="flex items-center space-x-2 text-sm text-orange-600 dark:text-orange-400 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span>Please select a gate first</span>
                  </div>
                )}

                    <Button
                  type="submit"
                  disabled={isProcessingEntry || !currentPlateNumber.trim() || !selectedGateId}
                  className="w-full h-12 text-lg gradient-maroon hover:opacity-90 transition-all duration-200"
                    >
                      {isProcessingEntry ? (
                        <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing Entry...
                        </>
                      ) : (
                        <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                          Process Entry
                        </>
                      )}
                    </Button>
              </div>
            </form>
                  </div>
                </div>
      </SheetContent>
    </Sheet>
  );
}
