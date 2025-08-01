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
import {
  Search,
  Car,
  Truck,
  Bike,
  Clock,
  DollarSign,
  Grid,
  List,
} from "lucide-react";

export default function ParkedVehicles() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const parkedVehicles = [
    {
      id: "1",
      plateNumber: "ABC-123",
      vehicleType: "car",
      entryTime: "08:30 AM",
      duration: "2h 15m",
      currentFee: "Tsh. 11.25",
      spot: "A-15",
    },
    {
      id: "2",
      plateNumber: "XYZ-789",
      vehicleType: "motorcycle",
      entryTime: "09:15 AM",
      duration: "1h 30m",
      currentFee: "Tsh. 4.50",
      spot: "B-08",
    },
    {
      id: "3",
      plateNumber: "DEF-456",
      vehicleType: "truck",
      entryTime: "07:45 AM",
      duration: "3h 00m",
      currentFee: "Tsh. 24.00",
      spot: "C-03",
    },
    {
      id: "4",
      plateNumber: "GHI-789",
      vehicleType: "car",
      entryTime: "10:00 AM",
      duration: "45m",
      currentFee: "Tsh. 3.75",
      spot: "A-22",
    },
    {
      id: "5",
      plateNumber: "JKL-012",
      vehicleType: "car",
      entryTime: "09:30 AM",
      duration: "1h 15m",
      currentFee: "Tsh. 6.25",
      spot: "B-14",
    },
    {
      id: "6",
      plateNumber: "MNO-345",
      vehicleType: "motorcycle",
      entryTime: "08:00 AM",
      duration: "2h 45m",
      currentFee: "Tsh. 8.25",
      spot: "A-05",
    },
  ];

  const filteredVehicles = parkedVehicles.filter(
    (vehicle) =>
      vehicle.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.spot.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case "car":
        return Car;
      case "motorcycle":
        return Bike;
      case "truck":
        return Truck;
      default:
        return Car;
    }
  };

  const getVehicleColor = (type: string) => {
    switch (type) {
      case "car":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "motorcycle":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "truck":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
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
          </div>

          <div className="flex items-center space-x-2">
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

        {/* Search and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="lg:col-span-1"
          >
            <Card className="glass-effect border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by plate or spot..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 glass-effect border-0"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="lg:col-span-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="glass-effect border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Parked
                      </p>
                      <p className="text-2xl font-bold">
                        {filteredVehicles.length}
                      </p>
                    </div>
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                      <Car className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Avg Duration
                      </p>
                      <p className="text-2xl font-bold">1h 45m</p>
                    </div>
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                      <Clock className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Revenue
                      </p>
                      <p className="text-2xl font-bold">Tsh. 58.00</p>
                    </div>
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                      <DollarSign className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>

        {/* Vehicles Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVehicles.map((vehicle, index) => {
                const VehicleIcon = getVehicleIcon(vehicle.vehicleType);
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
                            <div className="p-2 bg-primary/10 rounded-full">
                              <VehicleIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">
                                {vehicle.plateNumber}
                              </h3>
                              <Badge
                                className={getVehicleColor(vehicle.vehicleType)}
                              >
                                {vehicle.vehicleType}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              Spot
                            </p>
                            <p className="font-bold">{vehicle.spot}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">
                              Entry Time:
                            </span>
                            <span className="text-sm font-medium">
                              {vehicle.entryTime}
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
                              Current Fee:
                            </span>
                            <span className="text-sm font-bold text-primary">
                              {vehicle.currentFee}
                            </span>
                          </div>
                        </div>

                        <Button className="w-full mt-4 gradient-maroon hover:opacity-90 transition-opacity">
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
                    const VehicleIcon = getVehicleIcon(vehicle.vehicleType);
                    return (
                      <motion.div
                        key={vehicle.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1, duration: 0.3 }}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-primary/10 rounded-full">
                            <VehicleIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-bold">{vehicle.plateNumber}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge
                                className={getVehicleColor(vehicle.vehicleType)}
                              >
                                {vehicle.vehicleType}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                Spot: {vehicle.spot}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">
                              Entry
                            </p>
                            <p className="font-medium">{vehicle.entryTime}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">
                              Duration
                            </p>
                            <p className="font-medium">{vehicle.duration}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Fee</p>
                            <p className="font-bold text-primary">
                              {vehicle.currentFee}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            className="gradient-maroon hover:opacity-90 transition-opacity"
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

        {filteredVehicles.length === 0 && (
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
      </div>
    </MainLayout>
  );
}
