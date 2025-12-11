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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useOperatorGates } from "@/hooks/use-operator-gates";
import { type ActivePassage } from "../hooks/use-active-passages";
import { getVehicleTypeIcon } from "@/utils/utils";
import { formatDateTime } from "@/utils/date-utils";
import { useVehicleBodyTypes } from "@/app/manager/settings/hooks/use-vehicle-body-types";
import { useAuth } from "@/components/auth-provider";
import {
  Car,
  Clock,
  DollarSign,
  MapPin,
  Loader2,
  AlertCircle,
  CheckCircle,
  QrCode,
  Download,
  Receipt,
  Shield,
  User,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VehicleExitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: ActivePassage | null;
  onExitProcessed: () => void;
}

export function VehicleExitDialog({
  open,
  onOpenChange,
  vehicle,
  onExitProcessed,
}: VehicleExitDialogProps) {
  const { selectedGate } = useOperatorGates();
  const { user } = useAuth();
  
  // Get operator name from logged-in user
  const operatorName = user?.username || "";

  const [isProcessing, setIsProcessing] = useState(false);
  const [exitResult, setExitResult] = useState<any>(null);
  const [showVehicleTypeModal, setShowVehicleTypeModal] = useState(false);
  const [selectedBodyTypeId, setSelectedBodyTypeId] = useState<number | null>(null);
  const { vehicleBodyTypes, loading: bodyTypesLoading } = useVehicleBodyTypes();
  const [updatedVehicle, setUpdatedVehicle] = useState<ActivePassage | null>(null);



  const handleProcessExit = async (bodyTypeId?: number) => {
    if (!vehicle || !selectedGate) {
      toast.error("Vehicle and gate selection required");
      return;
    }

    // Use updatedVehicle if available, otherwise use original vehicle
    const vehicleToCheck = updatedVehicle || vehicle;
    
    // Check if vehicle has body_type_id, if not, show selection modal
    if (!vehicleToCheck.vehicle?.body_type_id && !bodyTypeId) {
      setShowVehicleTypeModal(true);
      return;
    }

    setIsProcessing(true);
    setExitResult(null);

    try {
      // Import the service directly
      const { VehiclePassageService } = await import(
        "@/utils/api/vehicle-passage-service"
      );

      const result = await VehiclePassageService.processExit({
        plate_number: vehicle.vehicle?.plate_number || "",
        gate_id: selectedGate.id,
      });

      setExitResult(result);

      if (result && result.success) {
        toast.success("Vehicle exit processed successfully");

        // Auto-print exit receipt using direct USB printing
        const passageData = result.data?.passage || result.data;
        if (passageData) {
          try {
            const { printReceiptDirect } = await import("@/utils/printer/direct-printer");
            toast.loading("Printing exit receipt...", { id: "print-exit-receipt" });

            const formatCurrency = (value: any) =>
              `Tsh ${Number(value ?? 0).toFixed(2)}`;
            
            // Format receipt data from passage
            const receiptData = {
              company_name: "Smart Parking System",
              receipt_type: "EXIT RECEIPT",
              receipt_id: passageData.passage_number || `EXIT-${passageData.id}`,
              plate_number: passageData.vehicle?.plate_number || vehicle?.vehicle?.plate_number || "N/A",
              vehicle_type: passageData.vehicle?.body_type?.name || displayVehicle?.vehicle?.body_type?.name || "N/A",
              station: passageData.exit_station?.name || passageData.entry_station?.name || "N/A",
              operator: passageData.exit_operator?.name || passageData.entry_operator?.name || user?.username || "N/A",
              entry_time: passageData.entry_time ? formatDateTime(passageData.entry_time) : "N/A",
              exit_time: passageData.exit_time ? formatDateTime(passageData.exit_time) : "N/A",
              duration: passageData.duration_minutes ? `${passageData.duration_minutes} minutes` : "N/A",
              total_amount: formatCurrency(passageData.total_amount),
              payment_method: passageData.payment_type?.name || "N/A",
              gate: passageData.exit_gate?.name || passageData.entry_gate?.name || selectedGate?.name || "N/A",
              footer: "Thank you for parking with us!",
            };
            
            await printReceiptDirect(receiptData);
            toast.success("🖨️ Exit receipt printed!", { id: "print-exit-receipt" });
          } catch (printError: any) {
            console.error("Direct print error:", printError);
            toast.error("Could not print receipt: " + (printError?.message || "Unknown error"), { id: "print-exit-receipt" });
          }
        }

        // Call the callback to refresh the parent component
        onExitProcessed();

        // Close dialog after a short delay
        setTimeout(() => {
          onOpenChange(false);
          setExitResult(null);
          setShowVehicleTypeModal(false);
          setUpdatedVehicle(null); // Reset updated vehicle
        }, 2000);
      } else {
        toast.error((result && result.message) || "Failed to process vehicle exit");
      }
    } catch (error: any) {
      console.error("Exit processing error:", error);
      toast.error(error.message || "Failed to process vehicle exit");
    } finally {
      setIsProcessing(false);
    }
  };

  // Removed fetchPricingPreview - pricing is calculated on exit by backend

  const handleVehicleTypeSelected = async (bodyTypeId: number) => {
    setSelectedBodyTypeId(bodyTypeId);
    setShowVehicleTypeModal(false);
    
    // Call backend to set vehicle type for this passage and get preview
    if (vehicle?.id) {
      try {
        const { patch } = await import("@/utils/api/api");
        const { API_ENDPOINTS } = await import("@/utils/api/endpoints");

        const response = await patch(API_ENDPOINTS.VEHICLE_PASSAGES.SET_VEHICLE_TYPE(vehicle.id), {
          body_type_id: bodyTypeId,
        });

        if (response && (response as any).success && (response as any).data) {
          // response.data should be the preview object returned by the backend
          const preview = (response as any).data;

          // Map preview to UI fields
          const formattedFee = `Tsh. ${Number(preview.amount || 0).toFixed(2)}`;

          const updatedVehicleData = {
            ...vehicle,
            vehicle: {
              ...vehicle.vehicle,
              body_type_id: bodyTypeId,
              body_type: vehicleBodyTypes.find((bt: any) => bt.id === bodyTypeId) || null,
            },
            base_amount: preview.base_amount,
            total_amount: preview.amount,
            currentFee: formattedFee,
          };

          setUpdatedVehicle(updatedVehicleData);
          toast.success("Vehicle type updated and preview calculated");
        } else {
          toast.error("Failed to update vehicle type: " + ((response as any)?.message || "Unknown error"));
        }
      } catch (error: any) {
        console.error("Failed to update vehicle type:", error);
        toast.error("Failed to update vehicle type: " + (error.message || "Unknown error"));
        return;
      }
    } else {
      toast.error("Vehicle ID not found");
    }
  };

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedBodyTypeId(null);
      setExitResult(null);
      setUpdatedVehicle(null); // Reset updated vehicle state
    }
  }, [open]);

  // Pricing is calculated by backend on exit - no preview needed

  const handleConfirmExit = async () => {
    // Process exit with the selected vehicle type
    await handleProcessExit(selectedBodyTypeId || vehicle?.vehicle?.body_type_id || undefined);
  };

  if (!vehicle) return null;

  // Use updated vehicle if available, otherwise use original
  const displayVehicle = updatedVehicle || vehicle;
  const vehicleType = displayVehicle.vehicle?.body_type?.name || "Unknown";
  const vehicleIcon = getVehicleTypeIcon(vehicleType);
  const needsVehicleType = !displayVehicle.vehicle?.body_type_id;
  
  // Check for paid status (paid within 24 hours)
  // ONLY check paid_until - don't check base_amount
  const paidUntil = displayVehicle.vehicle?.paid_until ? new Date(displayVehicle.vehicle.paid_until) : null;
  const isPaidPass = !!paidUntil && paidUntil.getTime() > Date.now();


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl w-[95vw] max-w-7xl mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-gradient flex items-center justify-center space-x-2">
            <span className={`text-xl ${vehicleIcon.color}`}>
              {vehicleIcon.icon}
            </span>
            <span>Process Vehicle Exit</span>
          </DialogTitle>
          <DialogDescription className="text-center">
            Complete the exit process for {vehicle.vehicle?.plate_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Vehicle Information */}
         

          {/* Receipt Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6"
          >
            {/* <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-lg flex items-center space-x-2">
              
                <span>Parking Receipt</span>
              </h4>
              <Button onClick={() => toast.success("Receipt downloaded successfully")} size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div> */}

            {/* Receipt / Status Content */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              {/* Receipt Header with Shield Icon */}
              <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 gradient-maroon rounded-lg  flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Chato Parking</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Parking Receipt</p>
                </div>
              </div>
              <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">TIN #:</span>
                  <span className="font-medium"></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">District:</span>
                  <span className="font-medium">Chato DC</span>
                </div>
              {/* Receipt Details */}
              <div className="space-y-2 text-sm">
                {isPaidPass && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3 mb-3">
                    <div className="flex items-center space-x-2 text-green-700 dark:text-green-300">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-semibold">Paid within 24 hours - No charge</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Receipt #:</span>
                  <span className="font-mono">{displayVehicle?.passage_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Plate Number:</span>
                  <span className="font-mono font-medium">{displayVehicle?.vehicle?.plate_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Vehicle Type:</span>
                  <span>{needsVehicleType ? <span className="text-orange-600 font-semibold">Required for Exit</span> : vehicleType}</span>
                </div>
                
                {needsVehicleType && (
                  <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                          Vehicle Type Required
                        </p>
                        <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                          Please select a vehicle type to process exit.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Entry Time:</span>
                  <span>{formatDateTime(displayVehicle?.entry_time || "")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                  <span>{displayVehicle?.duration || 'Calculating...'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Issued by:</span>
                  <span className="font-medium">{operatorName || 'N/A'}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-gray-200 dark:border-gray-700 pt-2 mt-3">
                  <span>Total Fee:</span>
                  <span className="text-primary">{displayVehicle?.currentFee || 'N/A'}</span>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex flex-col justify-between mt-4">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded flex items-center justify-center mx-auto mb-2">
                    <QrCode className="w-10 h-10 text-gray-500" />
                  </div>
                  <p className="text-xs text-green-600 mb-4">Scan to make payment</p>
                </div>
                
                <div className="text-center">
                  <p className="text-xs text-gray-500">Thank you for using Chato Parking!</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Exit Result */}
          {exitResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-4 rounded-lg border ${
                exitResult.success
                  ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                  : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
              }`}
            >
              <div className="flex items-center space-x-2">
                {exitResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span
                  className={`font-medium ${
                    exitResult.success
                      ? "text-green-800 dark:text-green-200"
                      : "text-red-800 dark:text-red-200"
                  }`}
                >
                  {exitResult.success
                    ? "Exit Processed Successfully"
                    : "Exit Processing Failed"}
                </span>
              </div>
              <p className="text-sm mt-1 text-muted-foreground">
                {exitResult.message}
              </p>
            </motion.div>
          )}

        </div>

      

        {/* Action Buttons - Full Width at Bottom */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          className="flex space-x-3  dark:border-gray-700"
          >
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gradient-maroon hover:opacity-90"
              onClick={() => {
                if (needsVehicleType) {
                  setShowVehicleTypeModal(true);
                } else {
                  handleProcessExit();
                }
              }}
              disabled={isProcessing || !selectedGate}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing Exit...
                </>
              ) : (
                <>
                  <span className={`text-lg mr-2 ${vehicleIcon.color}`}>
                    {vehicleIcon.icon}
                  </span>
                  Process Exit
                </>
              )}
            </Button>
          </motion.div>
      </DialogContent>
      
      {/* Vehicle Type Selection Modal for Exit */}
      <Dialog open={showVehicleTypeModal} onOpenChange={setShowVehicleTypeModal}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gradient flex items-center space-x-3">
              <Car className="w-6 h-6" />
              <span>Select Vehicle Type for Exit</span>
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Vehicle type is required to calculate payment for exit. Please select the vehicle body type.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Vehicle Info */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <Car className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Plate Number
                  </Label>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                    {displayVehicle?.vehicle?.plate_number}
                  </p>
                </div>
              </div>
            </div>

            {/* Vehicle Body Type Selection */}
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
                          <span className={`text-lg ${vehicleIcon.color}`}>
                            {vehicleIcon.icon}
                          </span>
                          <div>
                            <span className="font-medium">{type.name}</span>
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

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowVehicleTypeModal(false);
                  setSelectedBodyTypeId(null);
                }}
                disabled={isProcessing}
                className="flex-1 h-11"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedBodyTypeId) {
                    handleVehicleTypeSelected(selectedBodyTypeId);
                  } else {
                    toast.error("Please select a vehicle body type");
                  }
                }}
                disabled={!selectedBodyTypeId || isProcessing || bodyTypesLoading}
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
                    Continue
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
