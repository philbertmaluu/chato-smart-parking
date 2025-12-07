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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useOperatorGates } from "@/hooks/use-operator-gates";
import { type ActivePassage } from "../hooks/use-active-passages";
import { PrinterService } from "@/utils/api/printer-service";
import { getVehicleTypeIcon } from "@/utils/utils";
import { formatDateTime } from "@/utils/date-utils";
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
  Printer,
  User,
} from "lucide-react";

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

  const [isProcessing, setIsProcessing] = useState(false);
  const [exitResult, setExitResult] = useState<any>(null);
  
  // Auto-populate operator name from logged-in user
  const operatorName = user?.username || "";



  const handleProcessExit = async () => {
    if (!vehicle || !selectedGate) {
      toast.error("Vehicle and gate selection required");
      return;
    }

    setIsProcessing(true);
    setExitResult(null);

    try {
      // Import the service directly
      const { VehiclePassageService } = await import(
        "@/utils/api/vehicle-passage-service"
      );

      if (!operatorName.trim()) {
        toast.error("Operator name is required. Please ensure you are logged in.");
        setIsProcessing(false);
        return;
      }

      const result = await VehiclePassageService.processExit({
        plate_number: vehicle.vehicle?.plate_number || "",
        gate_id: selectedGate.id,
        operator_name: operatorName.trim(),
        payment_method: 'cash',
      });

      setExitResult(result);

      if (result.success) {
        toast.success("Vehicle exit processed successfully");

        // Auto-print exit receipt
        if (vehicle.id) {
          try {
            toast.loading("🖨️ Printing receipt...", { id: "print-exit" });
            const printResult = await PrinterService.printExitReceipt(vehicle.id);
            
            if (printResult.success) {
              toast.success("🖨️ Receipt printed!", { id: "print-exit" });
            } else {
              toast.error("Print failed: " + (printResult.messages || "Check printer"), { id: "print-exit" });
            }
          } catch (printError: any) {
            console.error("Print error:", printError);
            toast.error("Could not print. Check printer connection.", { id: "print-exit" });
          }
        }

        // Call the callback to refresh the parent component
        onExitProcessed();

        // Close dialog after a short delay
        setTimeout(() => {
          onOpenChange(false);
          setExitResult(null);
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

  if (!vehicle) return null;

  const vehicleType = vehicle.vehicle?.body_type?.name || "Unknown";
  const vehicleIcon = getVehicleTypeIcon(vehicleType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border border-gray-200 shadow-2xl w-[95vw] max-w-7xl mx-4 max-h-[90vh] overflow-y-auto">
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
          {/* Operator Name Display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6"
          >
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Operator Name</span>
              </Label>
              <div className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                <span className="font-medium">{operatorName || "Not available"}</span>
              </div>
              <p className="text-xs text-gray-500">This name will appear on the receipt (from your login credentials)</p>
            </div>
          </motion.div>

          {/* Receipt Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
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

            {/* Receipt Content */}
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
                  <span>{vehicleType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Entry Time:</span>
                  <span>{formatDateTime(vehicle?.entry_time || "")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                  <span>{vehicle?.duration}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-gray-200 dark:border-gray-700 pt-2 mt-3">
                  <span>Total Fee:</span>
                  <span className="text-primary">{vehicle?.currentFee}</span>
                </div>
              </div>

              {/* Right Column - QR Code and Footer */}
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
            {/* Manual Print Button - only show after successful exit */}
            {exitResult?.success && vehicle?.id && (
              <Button
                variant="outline"
                className="flex-1 border-blue-500 text-blue-600 hover:bg-blue-50"
                onClick={async () => {
                  try {
                    toast.loading("🖨️ Printing...", { id: "manual-print" });
                    const printResult = await PrinterService.printExitReceipt(vehicle.id);
                    if (printResult.success) {
                      toast.success("🖨️ Receipt printed!", { id: "manual-print" });
                    } else {
                      toast.error("Print failed", { id: "manual-print" });
                    }
                  } catch (e) {
                    toast.error("Print error", { id: "manual-print" });
                  }
                }}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Again
              </Button>
            )}
            <Button
              className="flex-1 gradient-maroon hover:opacity-90"
              onClick={handleProcessExit}
              disabled={isProcessing || !selectedGate || !operatorName.trim() || !user}
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
    </Dialog>
  );
}
