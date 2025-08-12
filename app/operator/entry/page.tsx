"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/components/language-provider";
import { useCamera } from "@/hooks/use-camera";
import { VehicleEntryDrawer } from "./components/vehicleEntrydrawer";
import { TestVehiclePassage } from "./components/test-vehicle-passage";
import { type Vehicle } from "@/hooks/use-vehicles";
import { useGates } from "@/app/manager/settings/hooks/use-gates";
import {
  Camera,
  ScanLine,
  Car,
  Truck,
  Bike,
  Receipt,
  X,
  Pencil,
  ChevronDown,
  MapPin,
} from "lucide-react";

export default function VehicleEntry() {
  const { t } = useLanguage();
  const {
    isScanning,
    error,
    videoRef,
    startCamera,
    stopCamera,
    isMediaDevicesSupported,
  } = useCamera();

  const { gates, loading: gatesLoading, fetchActive } = useGates();

  const [scannedPlate, setScannedPlate] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [selectedGate, setSelectedGate] = useState<string>("");
  const [showGateDropdown, setShowGateDropdown] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchActive();
  }, []);

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

  const handleStartCamera = async () => {
    const success = await startCamera();
    if (success) {
      // Simulate plate detection after 3 seconds
      setTimeout(() => {
        if (!mounted) return;

        const mockPlates = [
          "ABC-123",
          "XYZ-789",
          "DEF-456",
          "GHI-789",
          "JKL-012",
        ];
        const randomPlate =
          mockPlates[Math.floor(Math.random() * mockPlates.length)];
        setScannedPlate(randomPlate);
        stopCamera();
      }, 3000);
    }
  };

  const handleManualEntry = () => {
    setShowManualEntry(true);
  };

  const handleVehicleRegistered = (
    vehicle: Vehicle,
    passageData?: any,
    receiptData?: any
  ) => {
    const receipt = {
      plateNumber: vehicle.plate_number,
      vehicleType: vehicle.body_type?.name || "Unknown",
      entryTime: mounted ? new Date().toLocaleString() : "",
      rate: passageData?.total_amount || 5,
      receiptId:
        receiptData?.receipt_number || mounted ? `RCP-${Date.now()}` : "",
      vehicleDetails: vehicle,
      gate: selectedGate,
      passageNumber: passageData?.passage_number,
      passageType: passageData?.passage_type,
      paymentMethod: receiptData?.payment_method,
      amount: receiptData?.amount,
    };

    setReceiptData(receipt);
    setShowReceipt(true);
  };

  const handleRegisterVehicle = () => {
    if (!scannedPlate || !vehicleType) {
      alert("Please scan plate and select vehicle type");
      return;
    }

    const receipt = {
      plateNumber: scannedPlate,
      vehicleType,
      entryTime: mounted ? new Date().toLocaleString() : "",
      rate: vehicleType === "car" ? 5 : vehicleType === "motorcycle" ? 3 : 8,
      receiptId: mounted ? `RCP-${Date.now()}` : "",
      gate: selectedGate,
    };

    setReceiptData(receipt);
    setShowReceipt(true);
  };

  const vehicleTypes = [
    { value: "car", label: t("entry.car"), icon: Car },
    { value: "motorcycle", label: t("entry.motorcycle"), icon: Bike },
    { value: "truck", label: t("entry.truck"), icon: Truck },
  ];

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
              {!selectedGate && (
                <div className="mt-2 flex items-center space-x-2 text-sm text-orange-600 dark:text-orange-400">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span>Please select a gate to start processing vehicles</span>
                </div>
              )}
            </div>
            <div className="relative gate-dropdown-container">
              <Button
                onClick={() => setShowGateDropdown(!showGateDropdown)}
                variant={selectedGate ? "default" : "outline"}
                className={`${
                  selectedGate
                    ? "bg-gradient-maroon text-white border-0"
                    : "border-maroon-500 text-maroon-600 hover:bg-gradient-maroon hover:text-white"
                } transition-all duration-200 flex items-center space-x-2`}
              >
                <MapPin className="w-4 h-4" />
                <span>
                  {selectedGate || "Select Gate Linked To Your Station"}
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
                              setSelectedGate(
                                `${gate.name} - ${
                                  gate.station?.name || "Unknown Station"
                                }`
                              );
                              setShowGateDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                              selectedGate ===
                              `${gate.name} - ${
                                gate.station?.name || "Unknown Station"
                              }`
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

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Camera Scanner */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <ScanLine className="w-5 h-5" />
                      <span>{t("entry.scanPlate")}</span>
                    </CardTitle>
                    <CardDescription>
                      Use camera to automatically detect license plates
                    </CardDescription>
                  </div>
                  <div>
                    <Button
                      className={`${
                        selectedGate
                          ? "gradient-maroon hover:opacity-90"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      } transition-opacity`}
                      onClick={handleManualEntry}
                      disabled={!selectedGate}
                      title={!selectedGate ? "Please select a gate first" : ""}
                    >
                      <Pencil className="w-5 h-5" />
                      <span>{t("entry.manualEntry")}</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Camera View */}
                  <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    {isScanning ? (
                      <div className="relative w-full h-full">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-64 h-16 border-2 border-primary border-dashed rounded-lg flex items-center justify-center">
                            <span className="text-primary font-medium">
                              Scanning...
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={stopCamera}
                          variant="destructive"
                          size="sm"
                          className="absolute top-4 right-4"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : error ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <Camera className="w-16 h-16 mx-auto text-red-500 mb-4" />
                          <p className="text-red-500 font-medium mb-2">
                            Camera Error
                          </p>
                          <p className="text-sm text-muted-foreground px-4">
                            {error}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <Camera className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">
                            Camera preview will appear here
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleStartCamera}
                    disabled={isScanning || !isMediaDevicesSupported}
                    className="w-full gradient-maroon hover:opacity-90 transition-opacity"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {isScanning
                      ? "Scanning..."
                      : !isMediaDevicesSupported
                      ? "Camera Not Supported"
                      : "Start Camera Scan"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Test Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <TestVehiclePassage />
        </motion.div>

        {/* Recent Entries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Card className="glass-effect border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Recent Entries</CardTitle>
              <CardDescription>
                Latest vehicle entries processed today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    plate: "ABC-123",
                    type: "Car",
                    time: "10:30 AM",
                    status: "Parked",
                  },
                  {
                    plate: "XYZ-789",
                    type: "Motorcycle",
                    time: "10:15 AM",
                    status: "Parked",
                  },
                  {
                    plate: "DEF-456",
                    type: "Truck",
                    time: "09:45 AM",
                    status: "Parked",
                  },
                  {
                    plate: "GHI-789",
                    type: "Car",
                    time: "09:30 AM",
                    status: "Exited",
                  },
                ].map((entry, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          entry.status === "Parked"
                            ? "bg-green-500"
                            : "bg-gray-400"
                        }`}
                      />
                      <div>
                        <p className="font-medium">{entry.plate}</p>
                        <p className="text-sm text-muted-foreground">
                          {entry.type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{entry.status}</p>
                      <p className="text-sm text-muted-foreground">
                        {entry.time}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Vehicle Entry Drawer */}
      <VehicleEntryDrawer
        open={showManualEntry}
        onOpenChange={setShowManualEntry}
        onVehicleRegistered={handleVehicleRegistered}
        selectedGateId={
          selectedGate
            ? parseInt(selectedGate.split(" - ")[0].match(/\d+/)?.[0] || "0")
            : undefined
        }
      />

      {/* Receipt Modal */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="glass-effect border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-gradient">
              Parking Receipt
            </DialogTitle>
            <DialogDescription className="text-center">
              Vehicle successfully registered
            </DialogDescription>
          </DialogHeader>

          {receiptData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-dashed border-primary">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 mx-auto bg-primary rounded-full flex items-center justify-center mb-2">
                    <Receipt className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg">Smart Parking System</h3>
                  <p className="text-sm text-muted-foreground">Entry Receipt</p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Receipt ID:</span>
                    <span className="font-mono">{receiptData.receiptId}</span>
                  </div>
                  {receiptData.passageNumber && (
                    <div className="flex justify-between">
                      <span>Passage Number:</span>
                      <span className="font-mono">
                        {receiptData.passageNumber}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>License Plate:</span>
                    <span className="font-bold">{receiptData.plateNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vehicle Type:</span>
                    <span className="capitalize">
                      {receiptData.vehicleType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entry Time:</span>
                    <span>{receiptData.entryTime}</span>
                  </div>
                  {receiptData.gate && (
                    <div className="flex justify-between">
                      <span>Gate:</span>
                      <span className="font-medium">{receiptData.gate}</span>
                    </div>
                  )}
                  {receiptData.passageType && (
                    <div className="flex justify-between">
                      <span>Passage Type:</span>
                      <span
                        className={`capitalize font-medium ${
                          receiptData.passageType === "free"
                            ? "text-green-600"
                            : receiptData.passageType === "exempted"
                            ? "text-yellow-600"
                            : "text-blue-600"
                        }`}
                      >
                        {receiptData.passageType}
                      </span>
                    </div>
                  )}
                  {receiptData.paymentMethod && (
                    <div className="flex justify-between">
                      <span>Payment Method:</span>
                      <span className="capitalize">
                        {receiptData.paymentMethod}
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Amount:</span>
                    <span
                      className={`${
                        receiptData.passageType === "free" ||
                        receiptData.passageType === "exempted"
                          ? "text-green-600"
                          : ""
                      }`}
                    >
                      {receiptData.passageType === "free" ||
                      receiptData.passageType === "exempted"
                        ? "FREE"
                        : `Tsh. ${receiptData.amount || receiptData.rate}.00`}
                    </span>
                  </div>
                </div>

                <div className="mt-4 text-center text-xs text-muted-foreground">
                  <p>Please keep this receipt for exit</p>
                  <p>Lost receipts subject to maximum daily rate</p>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => window.print()}
                >
                  Print Receipt
                </Button>
                <Button
                  className="flex-1 gradient-maroon hover:opacity-90"
                  onClick={() => setShowReceipt(false)}
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
