"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { VehicleEntryDrawer } from "./components/vehicle-entry";
import { CameraInterface } from "./components/camera-interface";
import { useGates } from "@/app/manager/settings/hooks/use-gates";
import { useCurrentGate } from "@/hooks/use-current-gate";
import { zktecoConfig } from "@/utils/config/zkteco-config";
import { ChevronDown, MapPin, Pencil, Camera, Video, CheckCircle, AlertCircle } from "lucide-react";

export default function VehicleEntry() {
  const { gates, loading: gatesLoading, fetchActive } = useGates();
  const { currentGate, selectGate, getGateDisplayName } = useCurrentGate();
  const [showGateDropdown, setShowGateDropdown] = useState(false);
  const [showEntryDrawer, setShowEntryDrawer] = useState(false);
  const [cameraConfig] = useState(zktecoConfig.getConfig());
  const imageRef = useRef<HTMLImageElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-refresh camera feed
  useEffect(() => {
    const refreshCamera = () => {
      if (imageRef.current) {
        const timestamp = new Date().toISOString();
        imageRef.current.src = `http://${cameraConfig.ip}/edge/cgi-bin/vparcgi.cgi?computerid=1&oper=snapshot&resolution=800x600&i=${timestamp}`;
      }
    };

    // Start auto-refresh
    refreshIntervalRef.current = setInterval(refreshCamera, 500);

    // Cleanup on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [cameraConfig.ip]);

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

  const handleEntrySuccess = (data: any) => {
    console.log("Entry processed successfully:", data);
    // Handle success - could show receipt, update UI, etc.
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
                Simple vehicle entry processing
              </p>
              {!currentGate && (
                <div className="mt-2 flex items-center space-x-2 text-sm text-orange-600 dark:text-orange-400">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span>Please select a gate to start processing vehicles</span>
                </div>
              )}
            </div>
            
            {/* Gate Selection */}
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
                  {getGateDisplayName() || "Select Gate"}
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

        {/* Camera Interface Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="relative">
            {/* Camera Feed - Full Width */}
            <Card className="glass-effect">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    <div>
                      <CardTitle>Live Camera Feed</CardTitle>
                      <CardDescription>
                        Real-time monitoring from ZKTeco camera at {cameraConfig.ip}
                      </CardDescription>
                    </div>
                  </div>
                  
                  {/* Manual Entry Button - Top Right */}
                  <div className="flex items-center gap-3">
                    {currentGate && (
                      <div className="hidden md:block text-right">
                        <p className="text-sm font-medium text-muted-foreground">Active Gate</p>
                        <p className="text-base font-bold text-gradient">{currentGate.name}</p>
                      </div>
                    )}
                    <Button
                      size="lg"
                      className={`${
                        currentGate
                          ? "gradient-maroon hover:opacity-90"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      } transition-opacity shadow-lg`}
                      onClick={() => setShowEntryDrawer(true)}
                      disabled={!currentGate}
                      title={!currentGate ? "Please select a gate first" : ""}
                    >
                      <Pencil className="w-5 h-5 mr-2" />
                      Manual Entry
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9', minHeight: '500px' }}>
                  <img
                    ref={imageRef}
                    src={`http://${cameraConfig.ip}/edge/cgi-bin/vparcgi.cgi?computerid=1&oper=snapshot&resolution=800x600&i=${new Date().toISOString()}`}
                    alt="Camera Feed"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const errorDiv = target.nextElementSibling as HTMLElement;
                      if (errorDiv && errorDiv.classList.contains('error-message')) {
                        errorDiv.style.display = 'flex';
                      }
                    }}
                  />
                  <div className="error-message absolute inset-0 flex items-center justify-center bg-gray-800 text-white p-4" style={{ display: 'none' }}>
                    <div className="text-center space-y-2">
                      <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
                      <p className="font-semibold">Cannot connect to camera</p>
                      <p className="text-sm text-gray-400">
                        Camera at {cameraConfig.ip} is not accessible from this browser.
                      </p>
                    </div>
                  </div>
                  
                  {/* Live Indicator */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/70 px-3 py-2 rounded-lg backdrop-blur-sm">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-white font-medium text-sm">LIVE</span>
                  </div>
                  
                  {/* Camera Info */}
                  <div className="absolute bottom-4 right-4 bg-black/70 px-3 py-2 rounded-lg backdrop-blur-sm">
                    <p className="text-white text-sm font-mono">{cameraConfig.ip}</p>
                  </div>
                  
                  {/* Current Gate Overlay (Mobile) */}
                  {currentGate && (
                    <div className="md:hidden absolute bottom-4 left-4 bg-black/70 px-3 py-2 rounded-lg backdrop-blur-sm">
                      <p className="text-white text-xs">Gate: {currentGate.name}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <Alert className="flex-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <AlertDescription>
                      <strong>Live monitoring active</strong> - Auto-refreshing every 500ms for real-time vehicle detection.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>

      {/* Vehicle Entry Drawer */}
      <VehicleEntryDrawer
        open={showEntryDrawer}
        onOpenChange={setShowEntryDrawer}
        gateId={currentGate?.id}
        onSuccess={handleEntrySuccess}
      />
    </MainLayout>
  );
}
