"use client";

import { useState, useEffect, useCallback } from "react";
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
import { useLanguage } from "@/components/language-provider";
import { VehicleEntryDrawer } from "./components/vehicleEntrydrawer";
import { ReceiptDialog } from "./components/receipt-dialog";
import { PricingDisplay } from "./components/pricing-display";
import { CameraInterface } from "./components/camera-interface";
import { type Vehicle } from "@/hooks/use-vehicles";
import { useGates } from "@/app/manager/settings/hooks/use-gates";
import { useCurrentGate } from "@/hooks/use-current-gate";
import { usePricing } from "@/hooks/use-pricing";
import { useAuth } from "@/components/auth-provider";
import { formatDateTime } from "@/utils/date-utils";
import { Pencil, ChevronDown, MapPin, X, CheckCircle } from "lucide-react";

export default function VehicleEntry() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const { gates, loading: gatesLoading, fetchActive } = useGates();
  const { currentGate, selectGate, getGateDisplayName } = useCurrentGate();
  const {
    pricing,
    gateAction,
    vehicle: detectedVehicle,
    receipt,
    isLoading: pricingLoading,
    error: pricingError,
    processPlateDetection,
    resetPricing,
  } = usePricing();

  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showGateDropdown, setShowGateDropdown] = useState(false);
  const [showPricingDisplay, setShowPricingDisplay] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchActive();
  }, [fetchActive]);

  // Close dropdown when clicking outside
  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as Element;
    if (!target.closest(".gate-dropdown-container")) {
      setShowGateDropdown(false);
    }
  }, []);

  useEffect(() => {
    if (showGateDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showGateDropdown, handleClickOutside]);

  const handleManualEntry = () => {
    setShowManualEntry(true);
  };

  const handleProcessPayment = () => {
    // TODO: Implement payment processing
    console.log("Processing payment for:", pricing);
  };

  const handleAllowPassage = () => {
    // TODO: Implement gate opening
    console.log("Allowing passage for vehicle:", detectedVehicle);
    setShowPricingDisplay(false);
    resetPricing();
  };

  const handleClosePricingDisplay = () => {
    setShowPricingDisplay(false);
    resetPricing();
  };

  const handleVehicleRegistered = (
    vehicle: Vehicle,
    passageData?: any,
    receiptData?: any
  ) => {
    const receipt = {
      plateNumber: vehicle.plate_number,
      vehicleType: vehicle.body_type?.name || "Unknown",
      entryTime: mounted ? formatDateTime(new Date()) : "",
      rate: passageData?.total_amount || 5,
      receiptId:
        receiptData?.receipt_number || mounted ? `RCP-${Date.now()}` : "",
      vehicleDetails: vehicle,
      gate: getGateDisplayName(),
      passageNumber: passageData?.passage_number,
      passageType: passageData?.passage_type,
      paymentMethod: receiptData?.payment_method,
      amount: receiptData?.amount,
    };

    setReceiptData(receipt);
    setShowReceipt(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gradient">
                Vehicle Entry
              </h1>
              <p className="text-muted-foreground mt-2">
                Scan license plates and register incoming vehicles
              </p>
              {!currentGate && (
                <div className="mt-2 flex items-center space-x-2 text-sm text-orange-600 dark:text-orange-400">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span>Please select a gate to start processing vehicles</span>
                </div>
              )}
            </div>
            <div className="relative gate-dropdown-container">
              <Button
                onClick={() => setShowGateDropdown(!showGateDropdown)}
                variant={currentGate ? "default" : "outline"}
                className={`${
                  currentGate
                    ? "bg-gradient-maroon text-white border-0"
                    : "border-maroon-500 text-maroon-600 hover:bg-gradient-maroon hover:text-white"
                } transition-all duration-200 flex items-center space-x-2`}
              >
                <MapPin className="w-4 h-4" />
                <span>
                  {getGateDisplayName() || "Select Gate Linked To Your Station"}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showGateDropdown ? "rotate-180" : ""
                  }`}
                />
              </Button>

              {/* Gate Dropdown */}
              {showGateDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full right-0 mt-2 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
                >
                  <div className="p-2">
                    <div className="text-xs font-medium text-muted-foreground px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                      Select Your Gate
                    </div>
                    {gatesLoading ? (
                      <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                        Loading gates...
                      </div>
                    ) : gates.length === 0 ? (
                      <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                        No gates available
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto">
                        {gates.map((gate) => (
                          <button
                            key={gate.id}
                            onClick={() => {
                              selectGate(gate);
                              setShowGateDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                              currentGate?.id === gate.id
                                ? "bg-gradient-maroon text-white"
                                : "hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{gate.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {gate.station?.name || "Unknown Station"}
                                  {gate.station?.code && (
                                    <span className="ml-1 text-xs font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">
                                      ({gate.station.code})
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div
                                className={`text-xs px-2 py-1 rounded-full ${
                                  gate.gate_type === "entry"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                    : gate.gate_type === "exit"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                                }`}
                              >
                                {gate.gate_type}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* IP Camera Interface Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <CameraInterface
            className="glass-effect"
            manualEntryButton={
              <Button
                className={`${
                  currentGate
                    ? "gradient-maroon hover:opacity-90"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                } transition-opacity`}
                onClick={handleManualEntry}
                disabled={!currentGate}
                title={!currentGate ? "Please select a gate first" : ""}
              >
                <Pencil className="w-5 h-5" />
                <span>{t("entry.manualEntry")}</span>
              </Button>
            }
          />
        </motion.div>

        {/* Pricing Display Panel */}
        {showPricingDisplay && pricing && detectedVehicle && gateAction && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="lg:col-span-1"
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Vehicle Detected</span>
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClosePricingDisplay}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <CardDescription>
                  Plate: {detectedVehicle.plate_number} • {pricing.payment_type}{" "}
                  Payment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PricingDisplay
                  pricing={pricing}
                  vehicle={detectedVehicle}
                  gateAction={gateAction}
                  onProcessPayment={handleProcessPayment}
                  onAllowPassage={handleAllowPassage}
                  isLoading={pricingLoading}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Vehicle Entry Drawer */}
      <VehicleEntryDrawer
        open={showManualEntry}
        onOpenChange={setShowManualEntry}
        onVehicleRegistered={handleVehicleRegistered}
        selectedGateId={currentGate?.id}
      />

      {/* Receipt Dialog */}
      <ReceiptDialog
        open={showReceipt}
        onOpenChange={setShowReceipt}
        receiptData={receiptData}
      />
    </MainLayout>
  );
}
