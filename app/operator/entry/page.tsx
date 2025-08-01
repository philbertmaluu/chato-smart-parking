"use client";

import { useState, useRef } from "react";
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
import { Camera, ScanLine, Car, Truck, Bike, Receipt, X } from "lucide-react";

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
  const [scannedPlate, setScannedPlate] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleStartCamera = async () => {
    const success = await startCamera();
    if (success) {
      // Simulate plate detection after 3 seconds
      setTimeout(() => {
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

  const handleRegisterVehicle = () => {
    if (!scannedPlate || !vehicleType) {
      alert("Please scan plate and select vehicle type");
      return;
    }

    const receipt = {
      plateNumber: scannedPlate,
      vehicleType,
      entryTime: new Date().toLocaleString(),
      rate: vehicleType === "car" ? 5 : vehicleType === "motorcycle" ? 3 : 8,
      receiptId: `RCP-${Date.now()}`,
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
          <h1 className="text-3xl font-bold text-gradient">Vehicle Entry</h1>
          <p className="text-muted-foreground mt-2">
            Scan license plates and register incoming vehicles
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Camera Scanner */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ScanLine className="w-5 h-5" />
                  <span>{t("entry.scanPlate")}</span>
                </CardTitle>
                <CardDescription>
                  Use camera to automatically detect license plates
                </CardDescription>
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

          {/* Manual Entry Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle>{t("entry.manualEntry")}</CardTitle>
                <CardDescription>
                  Enter vehicle details manually or review scanned data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="plateNumber">
                      {t("entry.plateNumber")}
                    </Label>
                    <Input
                      id="plateNumber"
                      value={scannedPlate}
                      onChange={(e) => setScannedPlate(e.target.value)}
                      placeholder="ABC-123"
                      className="glass-effect border-0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("entry.vehicleType")}</Label>
                    <Select onValueChange={setVehicleType}>
                      <SelectTrigger className="glass-effect border-0">
                        <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center space-x-2">
                              <type.icon className="w-4 h-4" />
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleRegisterVehicle}
                    className="w-full gradient-maroon hover:opacity-90 transition-opacity"
                    disabled={!scannedPlate || !vehicleType}
                  >
                    <Receipt className="w-4 h-4 mr-2" />
                    {t("entry.registerVehicle")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

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
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Hourly Rate:</span>
                    <span>Tsh. {receiptData.rate}.00</span>
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
