"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToll } from "@/hooks/use-toll";
import { useVehicleBodyTypes } from "@/app/manager/settings/hooks/use-vehicle-body-types";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";
import { Car, Loader2, CheckCircle, AlertCircle, Search } from "lucide-react";
import { get } from "@/utils/api/api";

interface VehicleSearchResponse {
  success: boolean;
  data?: any;
  messages?: string;
  status?: number;
}


interface VehicleEntryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gateId?: number;
  onSuccess?: (data: any) => void;
}

export function VehicleEntryDrawer({ open, onOpenChange, gateId, onSuccess }: VehicleEntryDrawerProps) {
  const { user } = useAuth();
  const { loading, processEntry } = useToll();
  const { vehicleBodyTypes, loading: bodyTypesLoading } = useVehicleBodyTypes();
  
  const [plateNumber, setPlateNumber] = useState("");
  const [bodyTypeId, setBodyTypeId] = useState<number | undefined>();
  const [ownerName, setOwnerName] = useState("");
  const [searchStep, setSearchStep] = useState<'search' | 'create' | 'found'>('search');
  const [foundVehicle, setFoundVehicle] = useState<any>(null);


  const handleSearch = async () => {
    if (!plateNumber.trim()) {
      toast.error("Please enter a plate number");
      return;
    }

    if (!gateId) {
      toast.error("Please select a gate first");
      return;
    }

    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    try {
      // Search for existing vehicle using base API
      const response = await get<VehicleSearchResponse>(`/vehicles/search/plate/${plateNumber.trim()}`);

      if (response.success && response.data) {
        // Vehicle found - show details
        setFoundVehicle(response.data);
        setSearchStep('found');
      } else {
        // Vehicle not found - show create form
        setSearchStep('create');
      }
    } catch (error: any) {
      // If it's a 404 error or "Vehicle not found" message, show create form (this is expected)
      if (error.message && (error.message.includes('404') || error.message.includes('Vehicle not found') || error.message.includes('Resource not found'))) {
        setSearchStep('create');
      } else {
        // For any other error, log it and show create form as fallback
        console.error('Error searching vehicle:', error);
        setSearchStep('create');
      }
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!plateNumber.trim()) {
      toast.error("Please enter a plate number");
      return;
    }
    
    if (!bodyTypeId) {
      toast.error("Please select a vehicle body type");
      return;
    }
    
    if (!gateId) {
      toast.error("Please select a gate first");
      return;
    }
    
    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    const entryData = {
      plate_number: plateNumber.trim(),
      gate_id: gateId,
      operator_id: user.id,
      body_type_id: bodyTypeId,
      ...(ownerName.trim() && { owner_name: ownerName.trim() }),
    };

    const result = await processEntry(entryData);
    
    if (result.success && result.data) {
      onSuccess?.(result.data);
      // Reset form and close drawer
      setPlateNumber("");
      setBodyTypeId(undefined);
      setOwnerName("");
      setSearchStep('search');
      setFoundVehicle(null);
      onOpenChange(false);
    }
  };

  const handleProcessExistingVehicle = async () => {
    if (!foundVehicle || !gateId || !user) return;

    const entryData = {
      plate_number: foundVehicle.plate_number,
      gate_id: gateId,
      operator_id: user.id,
      body_type_id: foundVehicle.body_type_id,
      ...(foundVehicle.owner_name && { owner_name: foundVehicle.owner_name }),
    };

    const result = await processEntry(entryData);
    
    if (result.success && result.data) {
      onSuccess?.(result.data);
      // Reset form and close drawer
      setPlateNumber("");
      setBodyTypeId(undefined);
      setOwnerName("");
      setSearchStep('search');
      setFoundVehicle(null);
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[600px] sm:w-[700px] p-0 overflow-hidden">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-6 border-b bg-gradient-to-r from-primary/5 to-primary/10">
            <SheetTitle className="text-2xl font-bold text-gradient flex items-center space-x-3">
              <Car className="w-6 h-6" />
              <span>Vehicle Entry</span>
            </SheetTitle>
            <SheetDescription className="text-base mt-2">
              Enter vehicle details for processing
            </SheetDescription>
            {gateId && (
              <div className="mt-2 flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Gate selected and ready for processing</span>
              </div>
            )}
            {!gateId && (
              <div className="mt-2 flex items-center space-x-2 text-sm text-orange-600 dark:text-orange-400">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span>Please select a gate from the main page first</span>
              </div>
            )}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6">
            {/* Search Step */}
            {searchStep === 'search' && (
              <div className="space-y-6">
                <div className="text-start">
                  <h3 className="text-xl font-semibold mb-2">Search Vehicle</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="plateNumber">License Plate Number *</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="plateNumber"
                        value={plateNumber}
                        onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                        placeholder="Enter plate number (e.g., ABC-123)"
                        className="text-lg font-mono flex-1 h-12"
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      />
                      <Button
                        onClick={handleSearch}
                        disabled={loading || !plateNumber.trim() || !gateId}
                        className="h-12 px-6 text-lg"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                          </>
                        ) : (
                          <>
                            <Search className="w-5 h-5" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {!gateId && (
                    <div className="flex items-center space-x-2 text-sm text-orange-600 dark:text-orange-400">
                      <AlertCircle className="w-4 h-4" />
                      <span>Please select a gate first</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Found Vehicle Step */}
            {searchStep === 'found' && foundVehicle && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2 text-green-600">Vehicle Found</h3>
                  <p className="text-muted-foreground">Vehicle details and pricing information</p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Plate Number:</span>
                      <span className="font-bold text-lg">{foundVehicle.plate_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Vehicle Type:</span>
                      <span className="font-semibold">{foundVehicle.body_type?.name || 'Unknown'}</span>
                    </div>
                    {foundVehicle.owner_name && (
                      <div className="flex justify-between">
                        <span className="font-medium">Owner:</span>
                        <span className="font-semibold">{foundVehicle.owner_name}</span>
                      </div>
                    )}
                    {foundVehicle.body_type?.prices && foundVehicle.body_type.prices.length > 0 && (
                      <div className="flex justify-between">
                        <span className="font-medium">Base Price:</span>
                        <span className="font-semibold text-blue-600">Tsh {foundVehicle.body_type.prices[0]?.base_price || 0}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchStep('search');
                      setFoundVehicle(null);
                    }}
                    className="flex-1"
                  >
                    Search Another
                  </Button>
                  <Button
                    onClick={handleProcessExistingVehicle}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Process Entry
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Create Vehicle Step */}
            {searchStep === 'create' && (
              <form onSubmit={handleCreateVehicle} className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2 text-orange-600">Vehicle Not Found</h3>
                  <p className="text-muted-foreground">Please provide vehicle details to register</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="plateNumber">License Plate Number *</Label>
                    <Input
                      id="plateNumber"
                      value={plateNumber}
                      onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                      placeholder="Enter plate number (e.g., ABC-123)"
                      className="text-lg font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bodyType">Vehicle Body Type *</Label>
                    <Select
                      value={bodyTypeId?.toString() || ""}
                      onValueChange={(value) => {
                        if (value !== "loading") {
                          setBodyTypeId(parseInt(value));
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select vehicle body type" />
                      </SelectTrigger>
                      <SelectContent>
                        {bodyTypesLoading ? (
                          <SelectItem value="loading" disabled>
                            <div className="flex items-center space-x-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Loading body types...</span>
                            </div>
                          </SelectItem>
                        ) : (
                          vehicleBodyTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              <div className="flex items-center space-x-2">
                                <Car className="w-4 h-4" />
                                <span>{type.name}</span>
                                {type.category && (
                                  <span className="text-xs text-muted-foreground">
                                    ({type.category})
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ownerName">Owner Name (Optional)</Label>
                    <Input
                      id="ownerName"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Enter owner name"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSearchStep('search')}
                      className="flex-1"
                    >
                      Back to Search
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || !plateNumber.trim() || !bodyTypeId || !gateId}
                      className="flex-1"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Create & Process
                        </>
                      )}
                    </Button>
                  </div>

                  {!gateId && (
                    <div className="flex items-center space-x-2 text-sm text-orange-600 dark:text-orange-400">
                      <AlertCircle className="w-4 h-4" />
                      <span>Please select a gate first</span>
                    </div>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
