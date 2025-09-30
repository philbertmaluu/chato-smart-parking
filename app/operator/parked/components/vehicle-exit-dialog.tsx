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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useExitGates } from "../hooks/use-exit-gates";
import { useCurrentGate } from "@/hooks/use-current-gate";
import { type ActivePassage } from "../hooks/use-active-passages";
import { getVehicleTypeIcon } from "@/utils/utils";
import { formatDateTime } from "@/utils/date-utils";
import {
  Car,
  Clock,
  DollarSign,
  MapPin,
  Receipt,
  Loader2,
  AlertCircle,
  CheckCircle,
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
  const { currentGate } = useCurrentGate();
  const {
    exitGates,
    selectedGateId,
    selectExitGate,
    loading: gatesLoading,
  } = useExitGates();

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [notes, setNotes] = useState("");
  const [exitResult, setExitResult] = useState<any>(null);

  const handleProcessExit = async () => {
    if (!vehicle || !currentGate) {
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

      const result = await VehiclePassageService.processExit({
        plate_number: vehicle.vehicle?.plate_number || "",
        gate_id: currentGate.id,
        payment_confirmed: paymentConfirmed,
        notes: notes || undefined,
      });

      setExitResult(result);

      if (result.success) {
        toast.success("Vehicle exit processed successfully");

        // Call the callback to refresh the parent component
        onExitProcessed();

        // Close dialog after a short delay
        setTimeout(() => {
          onOpenChange(false);
          setExitResult(null);
          setPaymentConfirmed(false);
          setNotes("");
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
      <DialogContent className="bg-white border border-gray-200 shadow-2xl max-w-2xl">
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 p-6 rounded-xl border border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className={`p-3 rounded-full ${vehicleIcon.bgColor}`}>
                <span className={`text-xl ${vehicleIcon.color}`}>
                  {vehicleIcon.icon}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {vehicle.vehicle?.plate_number}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${vehicleIcon.bgColor} ${vehicleIcon.color}`}
                  >
                    {vehicleType}
                  </span>
                  {/* {vehicle.spot && (
                    <span className="text-sm text-muted-foreground">
                      Spot: {vehicle.spot}
                    </span>
                  )} */}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Entry Time</p>
                  <p className="font-medium">
                    {formatDateTime(vehicle.entry_time)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">{vehicle.duration}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Fee</p>
                  <p className="font-bold text-primary">{vehicle.currentFee}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Passage Number</p>
                  <p className="font-mono text-xs">{vehicle.passage_number}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Exit Configuration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h4 className="font-semibold text-lg">Exit Configuration</h4>

            {/* Current Gate Display */}
            <div className="space-y-2">
              <Label>Exit Gate</Label>
              <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <span className="font-medium">{currentGate?.name}</span>
                  {currentGate?.stationName && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({currentGate.stationName})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Confirmation */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Payment Status</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="paymentConfirmed"
                  checked={paymentConfirmed}
                  onChange={(e) => setPaymentConfirmed(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="paymentConfirmed" className="text-sm">
                  Payment has been confirmed
                </Label>
              </div>
              {!paymentConfirmed && (
                <div className="flex items-center space-x-2 text-sm text-orange-600 dark:text-orange-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>Payment confirmation required for exit</span>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="exitNotes">Exit Notes (Optional)</Label>
              <Textarea
                id="exitNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter any additional notes about the exit..."
                className="h-20"
              />
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

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex space-x-3"
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
              onClick={handleProcessExit}
              disabled={isProcessing || !currentGate}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
