"use client";

import { useState, useEffect, useCallback } from "react";
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
import { toast } from "sonner";
import { useOperatorGates } from "@/hooks/use-operator-gates";
import { type ActivePassage } from "../hooks/use-active-passages";
import { getVehicleTypeIcon } from "@/utils/utils";
import { formatDateTime } from "@/utils/date-utils";
import { useVehicleBodyTypes } from "@/app/manager/settings/hooks/use-vehicle-body-types";
import { useAuth } from "@/components/auth-provider";
import {
  Car,
  Loader2,
  AlertCircle,
  CheckCircle,
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

  const operatorName = user?.username || "OPERATOR";

  const [isProcessing, setIsProcessing] = useState(false);
  const [exitResult, setExitResult] = useState<any>(null);
  const [showVehicleTypeModal, setShowVehicleTypeModal] = useState(false);
  const [selectedBodyTypeId, setSelectedBodyTypeId] = useState<number | null>(null);
  const { vehicleBodyTypes, loading: bodyTypesLoading } = useVehicleBodyTypes();
  const [updatedVehicle, setUpdatedVehicle] = useState<ActivePassage | null>(null);

  // ── AUTO GATE OPENING ─────────────────────────────────────────────────────
  const openGateAutomatically = useCallback(async () => {
    try {
      const isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;
      if (!isTauri) return;

      console.log('[VehicleExitDialog] Opening gate after exit...');

      const { invoke } = await import('@tauri-apps/api/core');
      const result: any = await invoke('open_gate_all_ports', {
        command: 'hell'
      });

      toast.success("🚧 Gate opened automatically!", {
        description: result.successful_port 
          ? `Via ${result.successful_port}`
          : `Command sent to ${result.ports_tried?.length || 0} port(s)`,
        duration: 3000,
      });
    } catch (error: any) {
      console.error('[VehicleExitDialog] Gate control error:', error);
      console.warn('[VehicleExitDialog] Gate failed to open, but exit was successful');
    }
  }, []);
  // ───────────────────────────────────────────────────────────────────────────

  const handleProcessExit = async (bodyTypeId?: number) => {
    if (!vehicle || !selectedGate) {
      toast.error("Vehicle and gate selection required");
      return;
    }

    const vehicleToCheck = updatedVehicle || vehicle;

    if (!vehicleToCheck.vehicle?.body_type_id && !bodyTypeId) {
      setShowVehicleTypeModal(true);
      return;
    }

    setIsProcessing(true);
    setExitResult(null);

    try {
      const { VehiclePassageService } = await import(
        "@/utils/api/vehicle-passage-service"
      );

      const result = await VehiclePassageService.processExit({
        plate_number: vehicle.vehicle?.plate_number || "",
        gate_id: selectedGate.id,
      });

      setExitResult(result);

      if (result?.success) {
        toast.success("Vehicle exit processed successfully");

        const passageData = result.data?.passage || result.data;

        if (passageData) {
          try {
            const { printReceiptDirect } = await import(
              "@/utils/printer/direct-printer"
            );

            toast.loading("Printing receipt...", { id: "print-exit-receipt" });

            const formatAmount = (value: any) => {
              const num = Number(value ?? 0);
              return num.toLocaleString("en-US");
            };

            const formatDateTimeTZ = (dateStr: string) => {
              if (!dateStr) return "N/A";
              const date = new Date(dateStr);
              const day = date.getDate().toString().padStart(2, '0');
              const month = (date.getMonth() + 1).toString().padStart(2, '0');
              const year = date.getFullYear();
              const hours = date.getHours().toString().padStart(2, '0');
              const minutes = date.getMinutes().toString().padStart(2, '0');
              const seconds = date.getSeconds().toString().padStart(2, '0');
              return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
            };

            // ── BILLING CALCULATION ───────────────────────────────────────────
            const entryTime = new Date(passageData.entry_time);
            const exitTime = new Date(passageData.exit_time || new Date());

            const durationMs = exitTime.getTime() - entryTime.getTime();
            const durationMinutes = Math.max(1, Math.ceil(durationMs / (1000 * 60)));
            const durationHours = durationMinutes / 60;

            let billableDays = Math.ceil(durationHours / 12) * 0.5;
            if (billableDays < 0.5) billableDays = 0.5;

            const siku = billableDays.toFixed(1);
            // ─────────────────────────────────────────────────────────────────

            const receiptId = passageData.passage_number || `EXIT-${passageData.id}`;

            // ── KUMBUKUMBU NA PREPARATION ────────────────────────────────────
            const kumbukumbuNa = passageData.passage_number
              ? `Kumb. Na ${passageData.passage_number}`
              : receiptId;
            // ─────────────────────────────────────────────────────────────────

            const receiptData = {
              company_name: "CHATO DISTRICT COUNCIL",
              company_subtitle: "STAKABADHI YA MALIPO",
              receipt_type: "EXIT RECEIPT",
              receipt_id: receiptId,
              passage_number: passageData.passage_number,
              plate_number: passageData.vehicle?.plate_number || vehicle?.vehicle?.plate_number || "N/A",
              vehicle_type: passageData.vehicle?.body_type?.name ||
                updatedVehicle?.vehicle?.body_type?.name ||
                vehicle?.vehicle?.body_type?.name ||
                "Large Buses Stand Fee (Bus)",
              operator: passageData.exit_operator?.name ||
                passageData.entry_operator?.name ||
                operatorName ||
                "LINDA B. SARTAA",
              entry_time: passageData.entry_time ? formatDateTimeTZ(passageData.entry_time) : "N/A",
              exit_time: passageData.exit_time ? formatDateTimeTZ(passageData.exit_time) : formatDateTimeTZ(new Date().toISOString()),
              total_amount: formatAmount(passageData.total_amount),
              gate: passageData.exit_gate?.name ||
                passageData.entry_gate?.name ||
                selectedGate?.name ||
                "JOHANUTA",
              item_quantity: siku,
              item_day: "Day",

              // ── NEW: KUMBUKUMBU NA FIELDS ────────────────────────────────
              kumbukumbu_na: kumbukumbuNa,
              kumbukumbu_label: "Kumbukumbu Na",
              // ──────────────────────────────────────────────────────────────

              tigopesa_number: "45107230",
            };

            console.log("Receipt data sent to printer:", receiptData);

            await printReceiptDirect(receiptData);
            toast.success("🖨️ Exit receipt printed with TigoPesa QR!", { id: "print-exit-receipt" });

            // Automatic gate opening after printing
            setTimeout(() => {
              openGateAutomatically();
            }, 500);

          } catch (printError: any) {
            console.error("Direct print error:", printError);
            toast.error(
              "Could not print receipt: " +
                (printError?.message || "Printer communication error"),
              { id: "print-exit-receipt", duration: 6000 }
            );
          }
        }

        onExitProcessed();

        setTimeout(() => {
          onOpenChange(false);
          setExitResult(null);
          setShowVehicleTypeModal(false);
          setUpdatedVehicle(null);
        }, 2000);
      } else {
        toast.error(result?.message || "Failed to process vehicle exit");
      }
    } catch (error: any) {
      console.error("Exit processing error:", error);
      toast.error(error.message || "Failed to process vehicle exit");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVehicleTypeSelected = async (bodyTypeId: number) => {
    setSelectedBodyTypeId(bodyTypeId);
    setShowVehicleTypeModal(false);
    await handleProcessExit(bodyTypeId);
  };

  useEffect(() => {
    if (!open) {
      setSelectedBodyTypeId(null);
      setExitResult(null);
      setUpdatedVehicle(null);
    }
  }, [open]);

  if (!vehicle) return null;

  const displayVehicle = updatedVehicle || vehicle;
  const vehicleType = displayVehicle.vehicle?.body_type?.name || "Unknown";
  const vehicleIcon = getVehicleTypeIcon(vehicleType);
  const needsVehicleType = !displayVehicle.vehicle?.body_type_id;

  const paidUntil = displayVehicle.vehicle?.paid_until
    ? new Date(displayVehicle.vehicle.paid_until)
    : null;
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
          {/* Receipt Preview Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6"
          >
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-5">
              <div className="flex items-center space-x-3 mb-5 pb-3 border-b border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 gradient-maroon rounded-lg flex items-center justify-center">
                  <Car className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Chato District Council</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Stakabadhi ya Malipo
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-sm">
                {isPaidPass && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3 mb-3">
                    <div className="flex items-center space-x-2 text-green-700 dark:text-green-300">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-semibold">
                        Paid within 24 hours - No charge
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Namba ya Risiti:</span>
                  <span className="font-mono">{displayVehicle?.passage_number || "N/A"}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Namba ya Gari:</span>
                  <span className="font-mono font-medium">
                    {displayVehicle?.vehicle?.plate_number || "N/A"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Aina ya Gari:</span>
                  <span>
                    {needsVehicleType ? (
                      <span className="text-orange-600 font-semibold">
                        Required for Exit
                      </span>
                    ) : (
                      vehicleType
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Muda wa Kuingia:</span>
                  <span>{formatDateTime(displayVehicle?.entry_time || "")}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Muda:</span>
                  <span>{displayVehicle?.duration || "Calculating..."}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Mpokea Fedha:</span>
                  <span className="font-medium">{operatorName || "N/A"}</span>
                </div>

                <div className="flex justify-between font-bold text-lg border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                  <span>JUMLA:</span>
                  <span className="text-primary">
                    {displayVehicle?.currentFee || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex space-x-3 pt-4"
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

      {/* Vehicle Type Selection Modal */}
      <Dialog open={showVehicleTypeModal} onOpenChange={setShowVehicleTypeModal}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gradient flex items-center space-x-3">
              <Car className="w-6 h-6" />
              <span>Chagua Aina ya Gari</span>
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Aina ya gari inahitajika kuhesabu malipo. Tafadhali chagua aina ya mwili wa gari.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <Car className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Namba ya Gari
                  </Label>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                    {displayVehicle?.vehicle?.plate_number}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="bodyType" className="text-sm font-medium">
                Aina ya Mwili wa Gari *
              </Label>
              <Select
                value={selectedBodyTypeId?.toString() || ""}
                onValueChange={(value) => setSelectedBodyTypeId(parseInt(value))}
                disabled={isProcessing || bodyTypesLoading}
              >
                <SelectTrigger className="h-12 w-full">
                  <SelectValue placeholder="Chagua aina ya mwili wa gari" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleBodyTypes.map((type: any) => {
                    const vehicleIcon = getVehicleTypeIcon(type.name);
                    return (
                      <SelectItem key={type.id} value={type.id.toString()}>
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
                  Tafadhali chagua aina ya gari ili kuendelea
                </p>
              )}
            </div>

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
                Ghairi
              </Button>

              <Button
                onClick={() => {
                  if (selectedBodyTypeId) {
                    handleVehicleTypeSelected(selectedBodyTypeId);
                  } else {
                    toast.error("Tafadhali chagua aina ya gari");
                  }
                }}
                disabled={!selectedBodyTypeId || isProcessing || bodyTypesLoading}
                className="flex-1 h-11 gradient-maroon"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Inachakata...
                  </>
                ) : (
                  <>
                    <Car className="w-4 h-4 mr-2" />
                    Endelea
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