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

  const [isProcessing, setIsProcessing] = useState(false);
  const [exitResult, setExitResult] = useState<any>(null);
  const [showVehicleTypeModal, setShowVehicleTypeModal] = useState(false);
  const [selectedBodyTypeId, setSelectedBodyTypeId] = useState<number | null>(null);
  const [pricingPreview, setPricingPreview] = useState<any>(null);
  const [showPricingPreview, setShowPricingPreview] = useState(false);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);
  const [previewVehicleKey, setPreviewVehicleKey] = useState<string | null>(null);
  const { vehicleBodyTypes, loading: bodyTypesLoading } = useVehicleBodyTypes();



  const handleProcessExit = async (bodyTypeId?: number) => {
    if (!vehicle || !selectedGate) {
      toast.error("Vehicle and gate selection required");
      return;
    }

    // Check if vehicle has body_type_id, if not, show selection modal
    if (!vehicle.vehicle?.body_type_id && !bodyTypeId) {
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
        body_type_id: bodyTypeId || vehicle.vehicle?.body_type_id,
      });

      setExitResult(result);

      // Check if backend requires vehicle type
      if (!result.success && result.gate_action === 'require_vehicle_type') {
        setShowVehicleTypeModal(true);
        setIsProcessing(false);
        return;
      }

      if (result.success) {
        toast.success("Vehicle exit processed successfully");

        // Print receipt if payment was made (not no fee)
        const receiptAmount = pricingPreview?.total_amount || result.data?.total_amount || 0;
        if (result.data?.receipts && result.data.receipts.length > 0 && !pricingPreview?.no_fee && !isPaidPass && receiptAmount > 0) {
          try {
            const { generateReceiptHTML, printContent } = await import("@/utils/print-utils");
            const receipt = result.data.receipts[0];
            const receiptData = {
              receiptId: receipt.receipt_number || receipt.id,
              passageNumber: result.data.passage_number || vehicle?.passage_number,
              plateNumber: vehicle?.vehicle?.plate_number || "",
              vehicleType: vehicle?.vehicle?.body_type?.name || "Unknown",
              entryTime: formatDateTime(result.data.entry_time || vehicle?.entry_time),
              exitTime: formatDateTime(result.data.exit_time),
              gate: selectedGate?.name || "",
              passageType: result.data.passage_type || "toll",
              paymentMethod: receipt.payment_method || "Cash",
              amount: receiptAmount,
            };
            const htmlContent = generateReceiptHTML(receiptData);
            await printContent({
              title: "Parking Exit Receipt",
              content: htmlContent,
            });
            toast.success("Receipt printed successfully");
          } catch (printError: any) {
            console.error("Error printing receipt:", printError);
            toast.error("Exit processed but failed to print receipt");
          }
        }

        // Call the callback to refresh the parent component
        onExitProcessed();

        // Close dialog after a short delay
        setTimeout(() => {
          onOpenChange(false);
          setExitResult(null);
          setShowVehicleTypeModal(false);
          setShowPricingPreview(false);
          setPricingPreview(null);
        }, 2000);
      } else {
        toast.error(result.message || "Failed to process vehicle exit");
      }
    } catch (error: any) {
      console.error("Exit processing error:", error);
      toast.error(error.message || "Failed to process vehicle exit");
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchPricingPreview = async (bodyTypeId?: number) => {
    if (!vehicle?.vehicle?.plate_number) return;
    setIsLoadingPricing(true);
    try {
      const { VehiclePassageService } = await import(
        "@/utils/api/vehicle-passage-service"
      );

      const preview = await VehiclePassageService.getExitPricingPreview({
        plate_number: vehicle?.vehicle?.plate_number || "",
        body_type_id: bodyTypeId || vehicle?.vehicle?.body_type_id || undefined,
      });

      if (preview.success && preview.data) {
        setPricingPreview(preview.data);
        setShowPricingPreview(true);
        setPreviewVehicleKey(`${vehicle.vehicle.plate_number}-${vehicle.entry_time}`);

        // Log for debugging
        if (preview.data.paid_pass_active) {
          console.log('Paid pass is active for vehicle:', vehicle?.vehicle?.plate_number);
        }
      } else {
        toast.error(preview.message || "Failed to calculate pricing");
      }
    } catch (error: any) {
      console.error("Error getting pricing preview:", error);
      toast.error(error.message || "Failed to calculate pricing");
    } finally {
      setIsLoadingPricing(false);
    }
  };

  const handleVehicleTypeSelected = async (bodyTypeId: number) => {
    setSelectedBodyTypeId(bodyTypeId);
    setShowVehicleTypeModal(false);
    // Immediately show loading state and preview section
    setIsLoadingPricing(true);
    setShowPricingPreview(true);
    await fetchPricingPreview(bodyTypeId);
  };

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setPricingPreview(null);
      setShowPricingPreview(false);
      setPreviewVehicleKey(null);
      setSelectedBodyTypeId(null);
      setExitResult(null);
    }
  }, [open]);

  // Auto-fetch pricing preview on first open when vehicle already has body type
  useEffect(() => {
    if (!open || !vehicle) return;
    const key = `${vehicle.vehicle?.plate_number || ''}-${vehicle.entry_time}`;
    if (previewVehicleKey === key) return;
    if (vehicle.vehicle?.body_type_id) {
      fetchPricingPreview(vehicle.vehicle.body_type_id);
    }
  }, [open, vehicle, previewVehicleKey]);

  const handleConfirmExit = async () => {
    if (!pricingPreview) return;
    
    // Process exit with the selected vehicle type
    await handleProcessExit(selectedBodyTypeId || vehicle?.vehicle?.body_type_id || undefined);
  };

  if (!vehicle) return null;

  const vehicleType = vehicle.vehicle?.body_type?.name || "Unknown";
  const vehicleIcon = getVehicleTypeIcon(vehicleType);
  const needsVehicleType = !vehicle.vehicle?.body_type_id;
  
  // Check for paid pass status from vehicle (paid_until), pricing preview, or exit result
  const paidUntil = vehicle.vehicle?.paid_until ? new Date(vehicle.vehicle.paid_until) : null;
  const isPaidFromVehicle = !!paidUntil && paidUntil.getTime() > Date.now();
  const isPaidPass = isPaidFromVehicle || pricingPreview?.paid_pass_active === true || exitResult?.data?.paid_pass_active === true;
  
  // Debug logging
  if (pricingPreview || exitResult) {
    console.log('Paid pass check:', {
      pricingPreview: pricingPreview?.paid_pass_active,
      exitResult: exitResult?.data?.paid_pass_active,
      isPaidPass
    });
  }

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

              {/* Receipt Details */}
              <div className="space-y-2 text-sm">
                {isPaidPass && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-center">
                      <div className="bg-green-500 text-white px-5 py-2 rounded-full font-semibold shadow-lg flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5" />
                        <span>PAID</span>
                      </div>
                    </div>
                    <div className="text-center space-y-1">
                      <h3 className="text-lg font-bold text-green-800 dark:text-green-200">Already paid within last 24 hours</h3>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        No additional payment is required for this exit. Paid status stays active for 24 hours from last payment.
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Receipt #:</span>
                  <span className="font-mono">{vehicle?.passage_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Plate Number:</span>
                  <span className="font-mono font-medium">{vehicle?.vehicle?.plate_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Vehicle Type:</span>
                  <span>
                    {needsVehicleType ? (
                      <span className="text-orange-600 font-semibold">Required for Exit</span>
                    ) : (
                      pricingPreview?.vehicle?.body_type?.name || vehicleType
                    )}
                  </span>
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
                          Please select a vehicle type to calculate payment for exit.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Entry Time:</span>
                  <span>{formatDateTime(vehicle?.entry_time || "")}</span>
                </div>
                {!isPaidPass && (showPricingPreview || isLoadingPricing || vehicle.vehicle?.body_type_id) && (
                  <>
                    {isLoadingPricing ? (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Calculating...</span>
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    ) : pricingPreview ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Time Stayed:</span>
                          <span className="font-semibold">
                            {pricingPreview.duration_hours < 1
                              ? `${pricingPreview.duration_minutes} minutes`
                              : pricingPreview.duration_hours < 24
                              ? `${Math.floor(pricingPreview.duration_hours)}h ${pricingPreview.duration_minutes % 60}m`
                              : `${Math.floor(pricingPreview.duration_hours / 24)} days, ${Math.floor(pricingPreview.duration_hours % 24)}h ${pricingPreview.duration_minutes % 60}m`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Days to Charge:</span>
                          <span className="font-semibold">{pricingPreview.days_to_charge} day{pricingPreview.days_to_charge !== 1 ? 's' : ''}</span>
                        </div>
                        {pricingPreview.no_fee ? (
                          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <div>
                                <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                                  No Fee - Already Paid
                                </p>
                                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                                  Vehicle has already paid within 24 hours. Proceed with exit at no additional charge.
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between font-bold text-lg border-t border-gray-200 dark:border-gray-700 pt-2 mt-3">
                            <span>Total Fee:</span>
                            <span className="text-primary">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                              }).format(pricingPreview.total_amount)}
                            </span>
                          </div>
                        )}
                      </>
                    ) : null}
                  </>
                )}
                {!isPaidPass && !showPricingPreview && !isLoadingPricing && !vehicle.vehicle?.body_type_id && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                      <span>{vehicle?.duration || 'Calculating...'}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t border-gray-200 dark:border-gray-700 pt-2 mt-3">
                      <span>Total Fee:</span>
                      <span className="text-primary">{vehicle?.currentFee || 'N/A'}</span>
                    </div>
                  </>
                )}
              </div>

              {!isPaidPass && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex flex-col justify-between">
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
              )}
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
            {showPricingPreview && pricingPreview ? (
              <Button
                className="flex-1 gradient-maroon hover:opacity-90"
                onClick={handleConfirmExit}
                disabled={isProcessing || !selectedGate}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing Exit...
                  </>
                ) : pricingPreview.no_fee ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Proceed Exit (No Fee)
                  </>
                ) : (
                  <>
                    <Receipt className="w-4 h-4 mr-2" />
                    Process Exit & Print Receipt
                  </>
                )}
              </Button>
            ) : (
              <Button
                className="flex-1 gradient-maroon hover:opacity-90"
                onClick={() => {
                  if (needsVehicleType) {
                    setShowVehicleTypeModal(true);
                  } else {
                    handleProcessExit();
                  }
                }}
                disabled={isProcessing || !selectedGate || isLoadingPricing}
              >
                {isLoadingPricing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing Exit...
                  </>
                ) : (
                  <>
                    <span className={`text-lg mr-2 ${vehicleIcon.color}`}>
                      {vehicleIcon.icon}
                    </span>
                    {needsVehicleType ? 'Select Vehicle Type' : 'Process Exit'}
                  </>
                )}
              </Button>
            )}
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
                    {vehicle?.vehicle?.plate_number}
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
                disabled={!selectedBodyTypeId || isProcessing || bodyTypesLoading || isLoadingPricing}
                className="flex-1 h-11 gradient-maroon"
              >
                {isLoadingPricing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : isProcessing ? (
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
