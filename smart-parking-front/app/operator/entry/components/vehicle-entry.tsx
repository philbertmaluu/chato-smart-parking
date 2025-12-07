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
import { Car, Loader2, CheckCircle, AlertCircle } from "lucide-react";


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

  const handleProcessEntry = async (e: React.FormEvent) => {
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
      toast.success("Vehicle entry processed successfully");
      onSuccess?.(result.data);
      // Reset form and close drawer
      setPlateNumber("");
      setBodyTypeId(undefined);
      setOwnerName("");
      onOpenChange(false);
    } else {
      toast.error(result.message || "Failed to process entry");
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
            <form onSubmit={handleProcessEntry} className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Manual Vehicle Entry</h3>
                <p className="text-muted-foreground">Enter vehicle details to process entry</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="plateNumber">License Plate Number *</Label>
                  <Input
                    id="plateNumber"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                    placeholder="Enter plate number (e.g., ABC-123)"
                    className="text-lg font-mono h-12"
                    required
                    autoFocus
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
                    <SelectTrigger className="w-full h-12">
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
                    className="h-12"
                  />
                </div>

                {!gateId && (
                  <div className="flex items-center space-x-2 text-sm text-orange-600 dark:text-orange-400 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span>Please select a gate first</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || !plateNumber.trim() || !bodyTypeId || !gateId}
                  className="w-full h-12 text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing Entry...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Process Entry
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
