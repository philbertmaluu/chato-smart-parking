"use client";

import { useState, useCallback } from "react";
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
import {
  useVehicles,
  type Vehicle,
  type CreateVehicleData,
} from "@/hooks/use-vehicles";
import { useVehicleBodyTypes } from "@/app/manager/settings/hooks/use-vehicle-body-types";
import { usePaymentTypes } from "@/app/manager/settings/hooks/use-payment-types";
import { usePricing } from "@/hooks/use-pricing";
import { useVehicleBodyTypePrices } from "@/app/manager/settings/hooks/use-vehicle-body-type-prices";
import { useAuth } from "@/components/auth-provider";
import { PricingDisplay } from "./pricing-display";
import {
  VehiclePassageService,
  type VehiclePassageData,
  type VehiclePassageResponse,
} from "@/utils/api/vehicle-passage-service";
import { getVehicleTypeIcon } from "@/utils/utils";
import {
  Search,
  CheckCircle,
  AlertCircle,
  Loader2,
  Car,
  ArrowRight,
  X,
  CreditCard,
  Receipt,
  Shield,
  Zap,
  Camera,
  Keyboard,
  DollarSign,
} from "lucide-react";

interface VehicleEntryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVehicleRegistered: (
    vehicle: Vehicle,
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
  const {
    lookupVehicleByPlate,
    createVehicle,
    loading: vehicleLoading,
  } = useVehicles();
  const { vehicleBodyTypes, loading: bodyTypesLoading } = useVehicleBodyTypes();
  const { paymentTypes, loading: paymentTypesLoading } = usePaymentTypes();
  const { getCurrentPrice } = useVehicleBodyTypePrices();
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

  const [manualPlateNumber, setManualPlateNumber] = useState("");
  const [foundVehicle, setFoundVehicle] = useState<Vehicle | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vehicleFormData, setVehicleFormData] = useState<CreateVehicleData>({
    body_type_id: 0,
    plate_number: "",
    make: "",
    model: "",
    year: undefined,
    color: "",
    owner_name: "",
    is_registered: false,
  });
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [actualPricing, setActualPricing] = useState<any>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);
  const [paymentTypeId, setPaymentTypeId] = useState<number | undefined>();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isProcessingEntry, setIsProcessingEntry] = useState(false);
  const [passageType, setPassageType] = useState<"toll" | "free" | "exempted">(
    "toll"
  );
  const [isExempted, setIsExempted] = useState(false);
  const [exemptionReason, setExemptionReason] = useState("");
  const [notes, setNotes] = useState("");
  const [showPricingDisplay, setShowPricingDisplay] = useState(false);

  // Initialize plate number from detection or manual input
  const currentPlateNumber = detectedPlateNumber || manualPlateNumber;

  const fetchVehiclePricing = useCallback(
    async (vehicle: Vehicle) => {
      if (!selectedGateId || !vehicle.body_type_id) return;

      setIsLoadingPricing(true);
      try {
        // Get the station ID from the gate (you might need to adjust this based on your gate structure)
        const stationId = selectedGateId; // Assuming gate ID can be used as station ID for now

        const pricing = await getCurrentPrice(vehicle.body_type_id, stationId);

        if (pricing) {
          setActualPricing(pricing);
          setPaymentAmount(pricing.base_price);
        } else {
          // No pricing configured - set to 0 and show appropriate message
          setPaymentAmount(0);
          setActualPricing(null);
        }
      } catch (error) {
        console.error("Failed to fetch pricing:", error);
        // On error, set to 0 and show appropriate message
        setPaymentAmount(0);
        setActualPricing(null);
      } finally {
        setIsLoadingPricing(false);
      }
    },
    [selectedGateId, getCurrentPrice]
  );

  const handleSearchVehicle = useCallback(async () => {
    const plateToSearch = currentPlateNumber.trim();

    if (!plateToSearch) {
      toast.error("Please enter a plate number");
      return;
    }

    if (!selectedGateId || !user) {
      toast.error("Please select a gate first");
      return;
    }

    setIsSearching(true);
    try {
      // Use the new pricing system for plate detection
      const success = await processPlateDetection(
        plateToSearch,
        selectedGateId,
        user.id,
        'entry' // Direction: entry for vehicle entry processing
      );

      if (success && detectedVehicle) {
        setFoundVehicle(detectedVehicle);
        setShowVehicleForm(false);
        setShowPricingDisplay(true);
        toast.success("Vehicle processed successfully");
      } else {
        // Fallback to old vehicle lookup if pricing system fails
        const result = await lookupVehicleByPlate(plateToSearch);

        if (result.success && result.exists && result.data) {
          setFoundVehicle(result.data);
          setShowVehicleForm(false);

          // Fetch actual pricing for the found vehicle
          await fetchVehiclePricing(result.data);

          toast.success("Vehicle found in database");
        } else {
          setFoundVehicle(null);
          setShowVehicleForm(true);
          setVehicleFormData((prev) => ({
            ...prev,
            plate_number: plateToSearch,
          }));
          toast.info("Vehicle not found. Please register new vehicle.");
        }
      }
    } catch (error) {
      toast.error("Failed to search vehicle");
    } finally {
      setIsSearching(false);
    }
  }, [
    currentPlateNumber,
    selectedGateId,
    user,
    processPlateDetection,
    detectedVehicle,
    lookupVehicleByPlate,
    fetchVehiclePricing,
  ]);

  const handleCreateVehicle = useCallback(async () => {
    if (!vehicleFormData.body_type_id || !vehicleFormData.plate_number) {
      toast.error(
        "Please fill in required fields (Body Type and Plate Number)"
      );
      return;
    }

    try {
      const newVehicle = await createVehicle(vehicleFormData);
      setFoundVehicle(newVehicle);
      setShowVehicleForm(false);

      // Fetch pricing for the newly created vehicle
      await fetchVehiclePricing(newVehicle);

      toast.success("Vehicle registered successfully");
    } catch (error) {
      toast.error("Failed to register vehicle");
    }
  }, [vehicleFormData, createVehicle, fetchVehiclePricing]);

  const handleProceedToPayment = () => {
    const vehicle = foundVehicle;
    if (!vehicle) {
      toast.error("No vehicle selected");
      return;
    }

    if (!selectedGateId) {
      toast.error("Please select a gate first");
      return;
    }

    // Use the pricing that was already fetched
    if (actualPricing && actualPricing.base_price > 0) {
      setPaymentAmount(actualPricing.base_price);
      setShowPaymentDialog(true);
    } else {
      toast.error(
        "No pricing configured for this vehicle type at this station"
      );
    }
  };

  const handleProcessEntry = async () => {
    if (!foundVehicle || !selectedGateId) {
      toast.error("Vehicle and gate selection required");
      return;
    }

    if (passageType === "toll" && !paymentTypeId) {
      toast.error("Please select a payment type for toll passage");
      return;
    }

    setIsProcessingEntry(true);
    try {
      const passageData: VehiclePassageData = {
        plate_number: foundVehicle.plate_number,
        gate_id: selectedGateId,
        body_type_id: foundVehicle.body_type_id,
        make: foundVehicle.make || undefined,
        model: foundVehicle.model || undefined,
        year: foundVehicle.year || undefined,
        color: foundVehicle.color || undefined,
        owner_name: foundVehicle.owner_name || undefined,
        passage_type: passageType,
        is_exempted: isExempted,
        exemption_reason: exemptionReason || undefined,
        notes: notes || undefined,
        payment_amount: passageType === "toll" ? paymentAmount : undefined,
        payment_type_id: paymentTypeId,
      };

      const result: VehiclePassageResponse =
        await VehiclePassageService.processEntry(passageData);

      if (result.success) {
        toast.success(result.message || "Vehicle entry processed successfully");

        // Call the callback with vehicle, passage, and receipt data
        onVehicleRegistered(foundVehicle, result.data, result.receipt);

        // Reset form
        resetForm();
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

  const resetForm = useCallback(() => {
    setManualPlateNumber("");
    setFoundVehicle(null);
    setShowVehicleForm(false);
    setVehicleFormData({
      body_type_id: 0,
      plate_number: "",
      make: "",
      model: "",
      year: undefined,
      color: "",
      owner_name: "",
      is_registered: false,
    });
    setPaymentAmount(0);
    setActualPricing(null);
    setIsLoadingPricing(false);
    setPaymentTypeId(undefined);
    setShowPaymentDialog(false);
    setPassageType("toll");
    setIsExempted(false);
    setExemptionReason("");
    setNotes("");
    setShowPricingDisplay(false);
    resetPricing();
  }, [resetPricing]);

  const getPassageTypeIcon = (type: string) => {
    switch (type) {
      case "free":
        return <Shield className="w-4 h-4 text-green-600" />;
      case "exempted":
        return <Zap className="w-4 h-4 text-yellow-600" />;
      default:
        return <CreditCard className="w-4 h-4 text-blue-600" />;
    }
  };

  const getPassageTypeLabel = (type: string) => {
    switch (type) {
      case "free":
        return "Free Passage";
      case "exempted":
        return "Exempted Passage";
      default:
        return "Toll Passage";
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
                {isPlateDetectionEnabled
                  ? "Plate detection failed. Please enter vehicle details manually."
                  : "Search for existing vehicles or register new ones with complete details"}
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
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Vehicle Search Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="searchPlate" className="text-sm font-medium">
                    License Plate Number
                  </Label>
                  <div className="flex space-x-3">
                    <Input
                      id="searchPlate"
                      value={currentPlateNumber}
                      onChange={(e) => setManualPlateNumber(e.target.value)}
                      placeholder="Enter plate number (e.g., ABC-123)"
                      className="flex-1 h-12 text-base"
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSearchVehicle()
                      }
                      // Allow manual entry even when plate is detected
                    />
                    <Button
                      onClick={handleSearchVehicle}
                      disabled={
                        isSearching ||
                        !currentPlateNumber.trim() ||
                        !selectedGateId
                      }
                      className="h-12 px-6 gradient-maroon hover:opacity-90 transition-all duration-200"
                    >
                      {isSearching ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Search className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                  {detectedPlateNumber && (
                    <p className="text-sm text-muted-foreground">
                      Plate number detected automatically. Click search to
                      proceed.
                    </p>
                  )}
                  {!currentPlateNumber.trim() && (
                    <p className="text-sm text-red-500">
                      Please enter a plate number to search
                    </p>
                  )}
                  {!selectedGateId && currentPlateNumber.trim() && (
                    <p className="text-sm text-red-500">
                      Please select a gate first
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Found Vehicle Display */}
            <AnimatePresence>
              {foundVehicle && !showPricingDisplay && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-200 dark:border-green-800 rounded-xl"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                        Vehicle Found
                      </h3>
                      <p className="text-sm text-green-600 dark:text-green-300">
                        Vehicle details retrieved successfully
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-muted-foreground">
                          Plate:
                        </span>
                        <span className="font-bold text-lg">
                          {foundVehicle.plate_number}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-muted-foreground">
                          Type:
                        </span>
                        <span className="font-semibold">
                          {foundVehicle.body_type?.name || "Unknown"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {foundVehicle.make && (
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-muted-foreground">
                            Make:
                          </span>
                          <span>{foundVehicle.make}</span>
                        </div>
                      )}
                      {foundVehicle.model && (
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-muted-foreground">
                            Model:
                          </span>
                          <span>{foundVehicle.model}</span>
                        </div>
                      )}
                    </div>
                    {foundVehicle.owner_name && (
                      <div className="col-span-2 flex justify-between items-center">
                        <span className="font-medium text-muted-foreground">
                          Owner:
                        </span>
                        <span className="font-semibold">
                          {foundVehicle.owner_name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Pricing Information */}
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center space-x-2 mb-3">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-blue-800 dark:text-blue-200">
                        Pricing Information
                      </span>
                      {isLoadingPricing && (
                        <div className="ml-2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-muted-foreground">
                          Base Price:
                        </span>
                        <span className="font-bold text-green-700 dark:text-green-300">
                          {actualPricing?.base_price
                            ? `Tsh ${actualPricing.base_price}`
                            : "Not configured"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-muted-foreground">
                          Payment Type:
                        </span>
                        <span className="font-semibold">
                          {actualPricing ? "Cash Payment" : "Default"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-6"
                  >
                    <Button
                      onClick={handleProceedToPayment}
                      className="w-full h-12 gradient-maroon hover:opacity-90 transition-all duration-200 group"
                    >
                      <span>Proceed to Entry Processing</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pricing Display */}
            <AnimatePresence>
              {showPricingDisplay &&
                pricing &&
                detectedVehicle &&
                gateAction && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <PricingDisplay
                      pricing={pricing}
                      vehicle={detectedVehicle}
                      gateAction={gateAction}
                      onProcessPayment={() => {
                        // TODO: Implement payment processing
                        console.log("Processing payment for:", pricing);
                      }}
                      onAllowPassage={() => {
                        // TODO: Implement gate opening
                        console.log(
                          "Allowing passage for vehicle:",
                          detectedVehicle
                        );
                        setShowPricingDisplay(false);
                        resetPricing();
                        onOpenChange(false);
                      }}
                      isLoading={pricingLoading}
                    />
                  </motion.div>
                )}
            </AnimatePresence>

            {/* New Vehicle Registration Form */}
            <AnimatePresence>
              {showVehicleForm && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
                        Register New Vehicle
                      </h3>
                      <p className="text-sm text-orange-600 dark:text-orange-300">
                        Please provide vehicle details to register
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Required Fields */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Required Information
                      </h4>

                      <div className="space-y-3">
                        <Label
                          htmlFor="bodyType"
                          className="text-sm font-medium"
                        >
                          Vehicle Body Type *
                        </Label>
                        <Select
                          value={vehicleFormData.body_type_id.toString()}
                          onValueChange={(value) =>
                            setVehicleFormData((prev) => ({
                              ...prev,
                              body_type_id: parseInt(value),
                            }))
                          }
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
                      </div>
                    </div>

                    {/* Optional Fields */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Additional Information (Optional)
                      </h4>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="make" className="text-sm font-medium">
                            Make
                          </Label>
                          <Input
                            id="make"
                            value={vehicleFormData.make}
                            onChange={(e) =>
                              setVehicleFormData((prev) => ({
                                ...prev,
                                make: e.target.value,
                              }))
                            }
                            placeholder="Toyota"
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="model"
                            className="text-sm font-medium"
                          >
                            Model
                          </Label>
                          <Input
                            id="model"
                            value={vehicleFormData.model}
                            onChange={(e) =>
                              setVehicleFormData((prev) => ({
                                ...prev,
                                model: e.target.value,
                              }))
                            }
                            placeholder="Camry"
                            className="h-11"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="year" className="text-sm font-medium">
                            Year
                          </Label>
                          <Input
                            id="year"
                            type="number"
                            value={vehicleFormData.year || ""}
                            onChange={(e) =>
                              setVehicleFormData((prev) => ({
                                ...prev,
                                year: e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                              }))
                            }
                            placeholder="2020"
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="color"
                            className="text-sm font-medium"
                          >
                            Color
                          </Label>
                          <Input
                            id="color"
                            value={vehicleFormData.color}
                            onChange={(e) =>
                              setVehicleFormData((prev) => ({
                                ...prev,
                                color: e.target.value,
                              }))
                            }
                            placeholder="Red"
                            className="h-11"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="ownerName"
                          className="text-sm font-medium"
                        >
                          Owner Name
                        </Label>
                        <Input
                          id="ownerName"
                          value={vehicleFormData.owner_name}
                          onChange={(e) =>
                            setVehicleFormData((prev) => ({
                              ...prev,
                              owner_name: e.target.value,
                            }))
                          }
                          placeholder="John Doe"
                          className="h-11"
                        />
                      </div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Button
                        onClick={handleCreateVehicle}
                        disabled={vehicleLoading}
                        className="w-full h-12 gradient-maroon hover:opacity-90 transition-all duration-200 group"
                      >
                        {vehicleLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Registering Vehicle...
                          </>
                        ) : (
                          <>
                            <span>Register Vehicle</span>
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 border-t bg-gray-50 dark:bg-gray-900/50"
          >
            <div className="flex justify-end items-center">
              <Button variant="outline" onClick={resetForm} className="h-10">
                <X className="w-4 h-4 mr-2" />
                Reset Form
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Payment Dialog */}
        <AnimatePresence>
          {showPaymentDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
              >
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CreditCard className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold">
                      Vehicle Entry Processing
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Configure entry settings and process vehicle entry
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <h4 className="font-semibold mb-3">Vehicle Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Plate Number:</span>
                          <span className="font-medium">
                            {foundVehicle?.plate_number}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Vehicle Type:</span>
                          <span className="font-medium">
                            {foundVehicle?.body_type?.name}
                          </span>
                        </div>
                        {foundVehicle?.owner_name && (
                          <div className="flex justify-between">
                            <span>Owner:</span>
                            <span className="font-medium">
                              {foundVehicle.owner_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Passage Type Selection */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        Passage Type
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          {
                            value: "toll",
                            label: "Toll",
                            icon: CreditCard,
                            color: "blue",
                          },
                          {
                            value: "free",
                            label: "Free",
                            icon: Shield,
                            color: "green",
                          },
                          {
                            value: "exempted",
                            label: "Exempted",
                            icon: Zap,
                            color: "yellow",
                          },
                        ].map((type) => (
                          <button
                            key={type.value}
                            onClick={() => setPassageType(type.value as any)}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              passageType === type.value
                                ? `border-${type.color}-500 bg-${type.color}-50 dark:bg-${type.color}-900/20`
                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                            }`}
                          >
                            <div className="flex flex-col items-center space-y-1">
                              <type.icon
                                className={`w-4 h-4 text-${type.color}-600`}
                              />
                              <span className="text-xs font-medium">
                                {type.label}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Exemption Settings */}
                    {passageType === "exempted" && (
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">
                          Exemption Reason
                        </Label>
                        <Input
                          value={exemptionReason}
                          onChange={(e) => setExemptionReason(e.target.value)}
                          placeholder="Enter exemption reason"
                          className="h-11"
                        />
                      </div>
                    )}

                    {/* Payment Settings for Toll */}
                    {passageType === "toll" && (
                      <>
                        <div className="bg-blue-50 dark:bg-red-900/20 p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Hourly Rate:</span>
                            <span className="text-2xl font-bold text-primary">
                              Tsh. {paymentAmount}.00
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-medium">
                            Payment Type
                          </Label>
                          <Select
                            value={paymentTypeId?.toString() || ""}
                            onValueChange={(value) => {
                              const typeId = parseInt(value);
                              setPaymentTypeId(typeId);
                            }}
                          >
                            <SelectTrigger className="h-11 w-full">
                              <SelectValue placeholder="Select payment type" />
                            </SelectTrigger>
                            <SelectContent>
                              {paymentTypes.map((type: any) => (
                                <SelectItem
                                  key={type.id}
                                  value={type.id.toString()}
                                >
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    {/* Notes */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        Notes (Optional)
                      </Label>
                      <Input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Enter any additional notes"
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      className="flex-1 h-11"
                      onClick={() => setShowPaymentDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 h-11 gradient-maroon"
                      onClick={handleProcessEntry}
                      disabled={
                        isProcessingEntry ||
                        (passageType === "toll" && !paymentTypeId)
                      }
                    >
                      {isProcessingEntry ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Receipt className="w-4 h-4 mr-2" />
                          Process Entry
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
}
