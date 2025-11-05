"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useOperatorGates } from "@/hooks/use-operator-gates";
import { 
  MapPin, 
  CheckCircle, 
  Lock, 
  Loader2, 
  AlertCircle,
  ArrowRight,
  Building2,
  LogIn
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GateSelectionModalProps {
  open: boolean;
  onGateSelected: (gate: any) => void;
  onClose?: () => void;
}

export function GateSelectionModal({ open, onGateSelected, onClose }: GateSelectionModalProps) {
  const { availableGates, selectedGate, loading, error, fetchAvailableGates, selectGate } = useOperatorGates();
  const [selectingGateId, setSelectingGateId] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      fetchAvailableGates();
    }
  }, [open, fetchAvailableGates]);

  // If a gate is already selected, notify parent and close
  useEffect(() => {
    if (selectedGate && !selectingGateId) {
      onGateSelected(selectedGate);
      if (onClose) {
        onClose();
      }
    }
  }, [selectedGate, onGateSelected, onClose, selectingGateId]);

  const handleSelectGate = async (gateId: number) => {
    setSelectingGateId(gateId);
    const success = await selectGate(gateId);
    if (success) {
      // The useEffect above will handle calling onGateSelected
      setTimeout(() => setSelectingGateId(null), 500);
    } else {
      setSelectingGateId(null);
    }
  };

  const getGateTypeBadge = (type: string) => {
    const config = {
      entry: { color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300", label: "Entry" },
      exit: { color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300", label: "Exit" },
      both: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300", label: "Both" },
    };
    return config[type as keyof typeof config] || config.both;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <MapPin className="w-6 h-6 text-primary" />
            Select Your Gate
          </DialogTitle>
          <DialogDescription>
            Choose a gate to start monitoring and processing vehicle entries
          </DialogDescription>
        </DialogHeader>

        {/* Loading State */}
        {loading && !selectingGateId && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Loading available gates...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert variant="destructive" className="my-4">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Selected Gate Info */}
        {selectedGate && !selectingGateId && (
          <Alert className="my-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>Gate already selected:</strong> {selectedGate.name} at {selectedGate.station?.name}
            </AlertDescription>
          </Alert>
        )}

        {/* Gates Grid */}
        {!loading && availableGates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <AnimatePresence>
              {availableGates.map((gate, index) => {
                const badgeConfig = getGateTypeBadge(gate.gate_type);
                const isSelected = selectedGate?.id === gate.id;
                const isSelecting = selectingGateId === gate.id;
                const isOccupied = gate.is_selected && !isSelected;

                return (
                  <motion.div
                    key={gate.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        isSelected 
                          ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20' 
                          : isOccupied 
                            ? 'opacity-60 cursor-not-allowed' 
                            : 'hover:ring-2 hover:ring-primary'
                      }`}
                      onClick={() => !isOccupied && !isSelecting && !isSelected && handleSelectGate(gate.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2">
                              {gate.name}
                              {isSelected && <CheckCircle className="w-5 h-5 text-green-600" />}
                              {isOccupied && <Lock className="w-5 h-5 text-gray-400" />}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-1">
                              <Building2 className="w-3 h-3" />
                              {gate.station?.name || 'Unknown Station'}
                            </CardDescription>
                          </div>
                          <Badge className={badgeConfig.color}>
                            {badgeConfig.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {isOccupied && gate.selected_by && (
                            <Alert variant="destructive" className="py-2">
                              <Lock className="w-3 h-3" />
                              <AlertDescription className="text-xs">
                                Currently used by {gate.selected_by}
                              </AlertDescription>
                            </Alert>
                          )}
                          
                          {isSelected && (
                            <Alert className="py-2 bg-green-100 dark:bg-green-900/30 border-green-200">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              <AlertDescription className="text-xs text-green-800 dark:text-green-200">
                                Currently active
                              </AlertDescription>
                            </Alert>
                          )}

                          {!isSelected && !isOccupied && (
                            <Button 
                              className="w-full gradient-maroon"
                              disabled={isSelecting}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectGate(gate.id);
                              }}
                            >
                              {isSelecting ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Selecting...
                                </>
                              ) : (
                                <>
                                  <LogIn className="w-4 h-4 mr-2" />
                                  Select Gate
                                  <ArrowRight className="w-4 h-4 ml-2" />
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* No Gates Available */}
        {!loading && availableGates.length === 0 && !error && (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">No Gates Available</p>
            <p className="text-sm text-muted-foreground mt-2">
              No gates are assigned to your account. Please contact your administrator.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
