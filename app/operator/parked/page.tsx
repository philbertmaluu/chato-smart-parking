"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/language-provider";
import { useOperatorGates } from "@/hooks/use-operator-gates";
import { formatTime, formatDateTime } from "@/utils/date-utils";
import {
  useActivePassages,
  type ActivePassage,
} from "./hooks/use-active-passages";
import { VehicleExitDialog } from "./components/vehicle-exit-dialog";
import { getVehicleTypeIcon, getVehicleTypeBadge } from "@/utils/utils";
import {
  Search,
  Car,
  Grid,
  List,
  RefreshCw,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function ParkedVehicles() {
  const { t } = useLanguage();
  const { selectedGate } = useOperatorGates();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedVehicle, setSelectedVehicle] = useState<ActivePassage | null>(
    null
  );
  const [showExitDialog, setShowExitDialog] = useState(false);

  const {
    activePassages,
    loading,
    error,
    refreshing,
    pagination,
    currentPage,
    perPage,
    fetchActivePassages,
    refreshActivePassages,
    searchActivePassages,
    setCurrentPage,
  } = useActivePassages();

  // Filter vehicles based on search term
  const filteredVehicles = searchActivePassages(searchTerm);

  const handleProcessExit = (vehicle: ActivePassage) => {
    setSelectedVehicle(vehicle);
    setShowExitDialog(true);
  };

  const handleExitProcessed = () => {
    // Refresh the active passages list to remove the exited vehicle
    fetchActivePassages(currentPage, perPage);
    setShowExitDialog(false);
    setSelectedVehicle(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchActivePassages(page, perPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gradient">
              {t("nav.parked")}
            </h1>
            <p className="text-muted-foreground mt-2">
              Currently parked vehicles and their details
            </p>
            {!selectedGate && (
              <div className="mt-2 flex items-center space-x-2 text-sm text-orange-600 dark:text-orange-400">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span>
                  Please select a gate from the entry page to process exits
                </span>
              </div>
            )}
            {selectedGate && (
              <div className="mt-2 flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>
                  Active Gate: <strong>{selectedGate.name}</strong> at {selectedGate.station?.name}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshActivePassages()}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={viewMode === "grid" ? "gradient-maroon" : ""}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "gradient-maroon" : ""}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card className="glass-effect border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search by plate number, passage number, or vehicle type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 h-12 text-base glass-effect border-0 focus:ring-2 focus:ring-primary/20"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  >
                    <span className="text-muted-foreground">×</span>
                  </Button>
                )}
              </div>
              {searchTerm && (
                <div className="mt-3 text-sm text-muted-foreground">
                  Found {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? 's' : ''} matching "{searchTerm}"
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading parked vehicles...</p>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <AlertCircle className="w-8 h-8 mx-auto text-red-500 mb-4" />
            <p className="text-red-600 font-medium mb-2">
              Error loading vehicles
            </p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => fetchActivePassages(currentPage, perPage)} variant="outline">
              Try Again
            </Button>
          </motion.div>
        )}

        {/* Vehicles Display */}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVehicles.map((vehicle, index) => {
                  const vehicleType =
                    vehicle.vehicle?.body_type?.name || "Unknown";
                  const vehicleIcon = getVehicleTypeIcon(vehicleType);
                  const vehicleBadge = getVehicleTypeBadge(vehicleType);

                  return (
                    <motion.div
                      key={vehicle.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + index * 0.1, duration: 0.3 }}
                    >
                      <Card className="glass-effect border-0 shadow-lg hover:shadow-xl transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`p-2 rounded-full ${vehicleIcon.bgColor}`}
                              >
                                <span
                                  className={`text-lg ${vehicleIcon.color}`}
                                >
                                  {vehicleIcon.icon}
                                </span>
                              </div>
                              <div>
                                <h3 className="font-bold text-lg">
                                  {vehicle.vehicle?.plate_number}
                                </h3>
                                <Badge
                                  className={`${vehicleIcon.bgColor} ${vehicleIcon.color} border-0`}
                                >
                                  {vehicleType}
                                </Badge>
                              </div>
                            </div>
                            {/* <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                Spot
                              </p>
                              <p className="font-bold">{vehicle.spot}</p>
                            </div> */}
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">
                                Entry Time:
                              </span>
                              <span className="text-sm font-medium">
                                {formatTime(vehicle.entry_time)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">
                                Duration:
                              </span>
                              <span className="text-sm font-medium">
                                {vehicle.duration}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">
                                Fee:
                              </span>
                              <span className="text-sm font-bold text-primary">
                                {vehicle.currentFee}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">
                                Passage:
                              </span>
                              <span className="text-sm font-mono text-xs">
                                {vehicle.passage_number}
                              </span>
                            </div>
                          </div>

                          <Button
                            className="w-full mt-4 gradient-maroon hover:opacity-90 transition-opacity"
                            onClick={() => handleProcessExit(vehicle)}
                          >
                            Process Exit
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <Card className="glass-effect border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Parked Vehicles List</CardTitle>
                  <CardDescription>
                    Detailed view of all currently parked vehicles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredVehicles.map((vehicle, index) => {
                      const vehicleType =
                        vehicle.vehicle?.body_type?.name || "Unknown";
                      const vehicleIcon = getVehicleTypeIcon(vehicleType);

                      return (
                        <motion.div
                          key={vehicle.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: 0.6 + index * 0.1,
                            duration: 0.3,
                          }}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div
                              className={`p-2 rounded-full ${vehicleIcon.bgColor}`}
                            >
                              <span className={`text-lg ${vehicleIcon.color}`}>
                                {vehicleIcon.icon}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-bold">
                                {vehicle.vehicle?.plate_number}
                              </h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge
                                  className={`${vehicleIcon.bgColor} ${vehicleIcon.color} border-0`}
                                >
                                  {vehicleType}
                                </Badge>
                                {/* <span className="text-sm text-muted-foreground">
                                  Spot: {vehicle.spot}
                                </span> */}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-6">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">
                                Entry
                              </p>
                              <p className="font-medium">
                                {formatTime(vehicle.entry_time)}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">
                                Duration
                              </p>
                              <p className="font-medium">{vehicle.duration}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">
                                Fee
                              </p>
                              <p className="font-bold text-primary">
                                {vehicle.currentFee}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              className="gradient-maroon hover:opacity-90 transition-opacity"
                              onClick={() => handleProcessExit(vehicle)}
                            >
                              Exit
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredVehicles.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-center py-12"
          >
            <Car className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No vehicles found
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm
                ? "Try adjusting your search terms"
                : "No vehicles are currently parked"}
            </p>
          </motion.div>
        )}

        {/* Pagination - Only show when not searching (search is client-side) */}
        {!loading && !error && !searchTerm && pagination && pagination.last_page > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="flex items-center justify-between"
          >
            <div className="text-sm text-muted-foreground">
              Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{" "}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{" "}
              {pagination.total} vehicles
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => pagination.current_page > 1 && handlePageChange(pagination.current_page - 1)}
                    className={pagination.current_page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 ||
                    page === pagination.last_page ||
                    (page >= pagination.current_page - 1 && page <= pagination.current_page + 1)
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={page === pagination.current_page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (
                    page === pagination.current_page - 2 ||
                    page === pagination.current_page + 2
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <span className="px-2">...</span>
                      </PaginationItem>
                    );
                  }
                  return null;
                })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => pagination.current_page < pagination.last_page && handlePageChange(pagination.current_page + 1)}
                    className={pagination.current_page === pagination.last_page ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </motion.div>
        )}
      </div>

      {/* Vehicle Exit Dialog */}
      <VehicleExitDialog
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        vehicle={selectedVehicle}
        onExitProcessed={handleExitProcessed}
      />
    </MainLayout>
  );
}
