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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/components/language-provider";
import { formatTime, formatDateTime } from "@/utils/date-utils";
import {
  MapPin,
  Users,
  Car,
  Clock,
  Activity,
  Settings,
  Eye,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Label } from "@/components/ui/label";

// Mock data for gates
const mockGates = [
  {
    id: "A",
    name: "Gate A",
    location: "Main Entrance",
    status: "active",
    currentOperator: {
      name: "John Doe",
      avatar: "/placeholder-user.jpg",
      lastActive: "2024-01-20 14:30:00",
    },
    todayStats: {
      vehicles: 45,
      revenue: "Tsh. 225",
      avgDuration: "2h 15m",
    },
    capacity: {
      total: 50,
      occupied: 38,
      available: 12,
    },
    alerts: [],
  },
  {
    id: "B",
    name: "Gate B",
    location: "East Side",
    status: "active",
    currentOperator: {
      name: "Jane Smith",
      avatar: "/placeholder-user.jpg",
      lastActive: "2024-01-20 15:45:00",
    },
    todayStats: {
      vehicles: 52,
      revenue: "Tsh. 260",
      avgDuration: "1h 45m",
    },
    capacity: {
      total: 40,
      occupied: 35,
      available: 5,
    },
    alerts: ["High occupancy - 87% full"],
  },
  {
    id: "C",
    name: "Gate C",
    location: "West Side",
    status: "maintenance",
    currentOperator: null,
    todayStats: {
      vehicles: 0,
      revenue: "Tsh. 0",
      avgDuration: "0h 0m",
    },
    capacity: {
      total: 35,
      occupied: 0,
      available: 35,
    },
    alerts: ["Gate under maintenance", "No operator assigned"],
  },
  {
    id: "D",
    name: "Gate D",
    location: "Back Entrance",
    status: "active",
    currentOperator: {
      name: "Sarah Wilson",
      avatar: "/placeholder-user.jpg",
      lastActive: "2024-01-20 16:20:00",
    },
    todayStats: {
      vehicles: 38,
      revenue: "Tsh. 190",
      avgDuration: "2h 30m",
    },
    capacity: {
      total: 30,
      occupied: 25,
      available: 5,
    },
    alerts: ["Medium occupancy - 83% full"],
  },
];

export default function GatesManagement() {
  const { t } = useLanguage();
  const [selectedGate, setSelectedGate] = useState<any>(null);
  const [showGateDetails, setShowGateDetails] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "inactive":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "maintenance":
        return <AlertCircle className="w-4 h-4" />;
      case "inactive":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getGateColor = (gateId: string) => {
    switch (gateId) {
      case "A":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "B":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "C":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300";
      case "D":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const getCapacityPercentage = (occupied: number, total: number) => {
    return Math.round((occupied / total) * 100);
  };

  const getCapacityColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 75) return "text-yellow-600";
    return "text-green-600";
  };

  const openGateDetails = (gate: any) => {
    setSelectedGate(gate);
    setShowGateDetails(true);
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
              Gates Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Monitor and manage all parking gates
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="glass-effect border-0 bg-transparent"
            >
              <Settings className="w-4 h-4 mr-2" />
              Gate Settings
            </Button>
          </div>
        </motion.div>

        {/* Gates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockGates.map((gate, index) => (
            <motion.div
              key={gate.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card className="glass-effect border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-full ${getGateColor(gate.id)}`}
                      >
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{gate.name}</CardTitle>
                        <CardDescription>{gate.location}</CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(gate.status)}>
                      {getStatusIcon(gate.status)}
                      <span className="ml-1">{gate.status}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Current Operator */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {gate.currentOperator ? (
                          <>
                            <Avatar>
                              <AvatarImage src={gate.currentOperator.avatar} />
                              <AvatarFallback>
                                {gate.currentOperator.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {gate.currentOperator.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Last active:{" "}
                                {formatTime(gate.currentOperator.lastActive)}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-medium text-muted-foreground">
                                No Operator
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Unassigned
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Today's Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold">
                          {gate.todayStats.vehicles}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Vehicles
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {gate.todayStats.revenue}
                        </p>
                        <p className="text-sm text-muted-foreground">Revenue</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">
                          {gate.todayStats.avgDuration}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Avg Duration
                        </p>
                      </div>
                    </div>

                    {/* Capacity */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Capacity</span>
                        <span
                          className={getCapacityColor(
                            getCapacityPercentage(
                              gate.capacity.occupied,
                              gate.capacity.total
                            )
                          )}
                        >
                          {getCapacityPercentage(
                            gate.capacity.occupied,
                            gate.capacity.total
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            getCapacityPercentage(
                              gate.capacity.occupied,
                              gate.capacity.total
                            ) >= 90
                              ? "bg-red-500"
                              : getCapacityPercentage(
                                  gate.capacity.occupied,
                                  gate.capacity.total
                                ) >= 75
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{
                            width: `${getCapacityPercentage(
                              gate.capacity.occupied,
                              gate.capacity.total
                            )}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{gate.capacity.occupied} occupied</span>
                        <span>{gate.capacity.available} available</span>
                      </div>
                    </div>

                    {/* Alerts */}
                    {gate.alerts.length > 0 && (
                      <div className="space-y-2">
                        {gate.alerts.map((alert, alertIndex) => (
                          <div
                            key={alertIndex}
                            className="flex items-center space-x-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
                          >
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm text-yellow-800 dark:text-yellow-200">
                              {alert}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action Button */}
                    <Button
                      onClick={() => openGateDetails(gate)}
                      variant="outline"
                      className="w-full glass-effect border-0 bg-transparent"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Gate Details Modal */}
      <Dialog open={showGateDetails} onOpenChange={setShowGateDetails}>
        <DialogContent className="glass-effect border-0 shadow-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <div
                className={`p-2 rounded-full ${getGateColor(selectedGate?.id)}`}
              >
                <MapPin className="w-5 h-5" />
              </div>
              <span>
                {selectedGate?.name} - {selectedGate?.location}
              </span>
            </DialogTitle>
            <DialogDescription>
              Detailed information and statistics for this gate
            </DialogDescription>
          </DialogHeader>

          {selectedGate && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Status and Operator */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Gate Status
                    </Label>
                    <div className="mt-2">
                      <Badge className={getStatusColor(selectedGate.status)}>
                        {getStatusIcon(selectedGate.status)}
                        <span className="ml-1">{selectedGate.status}</span>
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Current Operator
                    </Label>
                    <div className="mt-2">
                      {selectedGate.currentOperator ? (
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <Avatar>
                            <AvatarImage
                              src={selectedGate.currentOperator.avatar}
                            />
                            <AvatarFallback>
                              {selectedGate.currentOperator.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {selectedGate.currentOperator.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Last active:{" "}
                              {formatDateTime(
                                selectedGate.currentOperator.lastActive
                              )}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                          <Users className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-muted-foreground">
                            No operator assigned
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Today's Performance
                    </Label>
                    <div className="mt-2 space-y-3">
                      <div className="flex justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <span>Vehicles Processed</span>
                        <span className="font-bold">
                          {selectedGate.todayStats.vehicles}
                        </span>
                      </div>
                      <div className="flex justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <span>Revenue Generated</span>
                        <span className="font-bold text-green-600">
                          {selectedGate.todayStats.revenue}
                        </span>
                      </div>
                      <div className="flex justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <span>Average Duration</span>
                        <span className="font-bold">
                          {selectedGate.todayStats.avgDuration}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Capacity Details */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Parking Capacity
                </Label>
                <div className="mt-2 space-y-3">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-2xl font-bold">
                        {selectedGate.capacity.total}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total Spots
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {selectedGate.capacity.occupied}
                      </p>
                      <p className="text-sm text-muted-foreground">Occupied</p>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedGate.capacity.available}
                      </p>
                      <p className="text-sm text-muted-foreground">Available</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Utilization Rate</span>
                      <span
                        className={getCapacityColor(
                          getCapacityPercentage(
                            selectedGate.capacity.occupied,
                            selectedGate.capacity.total
                          )
                        )}
                      >
                        {getCapacityPercentage(
                          selectedGate.capacity.occupied,
                          selectedGate.capacity.total
                        )}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          getCapacityPercentage(
                            selectedGate.capacity.occupied,
                            selectedGate.capacity.total
                          ) >= 90
                            ? "bg-red-500"
                            : getCapacityPercentage(
                                selectedGate.capacity.occupied,
                                selectedGate.capacity.total
                              ) >= 75
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{
                          width: `${getCapacityPercentage(
                            selectedGate.capacity.occupied,
                            selectedGate.capacity.total
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Alerts */}
              {selectedGate.alerts.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Current Alerts
                  </Label>
                  <div className="mt-2 space-y-2">
                    {selectedGate.alerts.map((alert, alertIndex) => (
                      <div
                        key={alertIndex}
                        className="flex items-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
                      >
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm text-yellow-800 dark:text-yellow-200">
                          {alert}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => {
                    // Navigate to operators page to assign operator
                    console.log("Assign operator to gate:", selectedGate.id);
                  }}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Assign Operator
                </Button>
                <Button
                  className="flex-1 gradient-maroon hover:opacity-90"
                  onClick={() => setShowGateDetails(false)}
                >
                  Close
                </Button>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
