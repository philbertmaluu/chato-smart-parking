"use client";

import { useMemo, useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
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
import { Users, MapPin, Activity, Building2, Eye, X, Plus } from "lucide-react";
import { OperatorsTable } from "./components/operators-table";
import { useOperators, type CreateOperatorData } from "./hooks/use-operators";
import { useStations } from "@/app/manager/settings/hooks/use-stations";
import { useGates } from "@/app/manager/settings/hooks/use-gates";
import { toast } from "sonner";
import { get } from "@/utils/api/api";
import { API_ENDPOINTS } from "@/utils/api/endpoints";

export default function OperatorsManagement() {
  const {
    operators,
    pagination,
    loading,
    fetchOperatorDetails,
    getOperatorStations,
    getAvailableGates,
    createOperator,
    fetchOperators,
    activateOperator,
    deactivateOperator,
  } = useOperators();
  const { stations } = useStations();
  const { gates } = useGates();

  const [selectedOperator, setSelectedOperator] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [operatorStations, setOperatorStations] = useState<any[]>([]);
  const [availableGates, setAvailableGates] = useState<any[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [gateOperatorRoleId, setGateOperatorRoleId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CreateOperatorData>({
    username: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
    address: "",
    gender: "male",
    date_of_birth: "",
    role_id: 0,
  });

  // Fetch roles to get Gate Operator role ID
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await get<{ success: boolean; data: any[] }>(
          API_ENDPOINTS.ROLES.LIST
        );
        if (response.success && response.data) {
          setRoles(response.data);
          const gateOperatorRole = response.data.find(
            (role: any) => role.name === "Gate Operator"
          );
          if (gateOperatorRole) {
            setGateOperatorRoleId(gateOperatorRole.id);
            setFormData((prev) => ({ ...prev, role_id: gateOperatorRole.id }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch roles:", error);
      }
    };
    fetchRoles();
  }, []);

  // Calculate analytics from operators data
  const analytics = useMemo(() => {
    const totalOperators = pagination.total || operators.length;
    const activeOperators = operators.filter((op) => op.is_active).length;
    const totalStationsAssigned = operators.reduce((sum, op) => {
      // Count unique stations across all operators
      return sum + (op.assigned_stations?.length || 0);
    }, 0);
    const operatorsWithStations = operators.filter(
      (op) => op.assigned_stations && op.assigned_stations.length > 0
    ).length;

    return {
      totalOperators,
      activeOperators,
      totalStationsAssigned,
      operatorsWithStations,
    };
  }, [operators, pagination]);

  const openOperatorDetails = async (operator: any) => {
    setSelectedOperator(operator);
    setIsDetailsDialogOpen(true);
    setSelectedStationId(null);
    setAvailableGates([]);

    try {
      // Fetch operator details with all relationships
      const details = await fetchOperatorDetails(operator.id);
      setSelectedOperator(details);

      // Fetch assigned stations
      const stations = await getOperatorStations(operator.id);
      setOperatorStations(stations || []);
    } catch (error) {
      console.error("Failed to fetch operator details:", error);
    }
  };

  const handleStationSelect = async (stationId: number) => {
    if (!selectedOperator) return;

    setSelectedStationId(stationId);
    try {
      const gates = await getAvailableGates(selectedOperator.id, stationId);
      setAvailableGates(gates || []);
    } catch (error) {
      console.error("Failed to fetch available gates:", error);
      setAvailableGates([]);
    }
  };

  const handleCreateOperator = async () => {
    if (!formData.username || !formData.email || !formData.phone || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      toast.error("Passwords do not match");
      return;
    }

    if (!gateOperatorRoleId) {
      toast.error("Gate Operator role not found");
      return;
    }

    try {
      await createOperator({
        ...formData,
        role_id: gateOperatorRoleId,
      });
      toast.success("Operator created successfully");
      setIsCreateDialogOpen(false);
    setFormData({
        username: "",
        email: "",
        phone: "",
      password: "",
        password_confirmation: "",
        address: "",
        gender: "male",
        date_of_birth: "",
        role_id: gateOperatorRoleId,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create operator"
      );
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
              Operators Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage parking operators and gate assignments
            </p>
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="gradient-maroon hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Operator
          </Button>
        </motion.div>

        {/* Analytics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <Card className="glass-effect border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Operators
                  </p>
                  <p className="text-2xl font-bold">
                    {analytics.totalOperators}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Operators
                  </p>
                  <p className="text-2xl font-bold">
                    {analytics.activeOperators}
                  </p>
                </div>
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <Activity className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Operators with Stations
                  </p>
                  <p className="text-2xl font-bold">
                    {analytics.operatorsWithStations}
                  </p>
                </div>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                  <Building2 className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Assignments
                  </p>
                  <p className="text-2xl font-bold">
                    {analytics.totalStationsAssigned}
                  </p>
                </div>
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                  <MapPin className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Operators Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
         
              <OperatorsTable 
                onViewDetails={openOperatorDetails}
                onStatusChange={async (operator, isActive) => {
                  try {
                    if (isActive) {
                      await activateOperator(operator.id);
                      toast.success("Operator activated successfully");
                    } else {
                      await deactivateOperator(operator.id);
                      toast.success("Operator deactivated successfully");
                    }
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Failed to update operator status");
                  }
                }}
              />
          
        </motion.div>
      </div>

      {/* Operator Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Operator Details</DialogTitle>
            <DialogDescription>
              View operator information, assigned stations, and available gates
            </DialogDescription>
          </DialogHeader>

          {selectedOperator && (
            <div className="space-y-6 py-4">
              {/* Operator Info */}
          <div className="space-y-4">
                <h3 className="font-semibold text-lg">Operator Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Username</p>
                    <p className="font-medium">{selectedOperator.username}</p>
            </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedOperator.email}</p>
            </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">
                      {selectedOperator.phone || "-"}
                    </p>
            </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge
                      variant={selectedOperator.is_active ? "default" : "secondary"}
                    >
                      {selectedOperator.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
            </div>
              </div>

              {/* Assigned Stations */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Assigned Stations</h3>
                  <Badge variant="secondary">
                    {operatorStations.length} station
                    {operatorStations.length !== 1 ? "s" : ""}
                  </Badge>
                </div>

                {operatorStations.length > 0 ? (
                  <div className="space-y-3">
                    {operatorStations.map((station: any) => (
                      <Card key={station.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-full">
                              <MapPin className="h-4 w-4 text-primary" />
            </div>
                            <div>
                              <p className="font-medium">{station.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {station.location}
                              </p>
            </div>
          </div>
            <Button
              variant="outline"
                            size="sm"
                            onClick={() => handleStationSelect(station.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Gates
            </Button>
            </div>

                        {/* Available Gates for Selected Station */}
                        {selectedStationId === station.id &&
                          availableGates.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-sm font-medium mb-2">
                                Available Gates:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {availableGates.map((gate: any) => (
                                  <Badge key={gate.id} variant="outline">
                                    {gate.name} ({gate.gate_type})
                                  </Badge>
                                ))}
            </div>
            </div>
                          )}
                      </Card>
                    ))}
            </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No stations assigned to this operator
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsDetailsDialogOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Operator Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Operator</DialogTitle>
            <DialogDescription>
              Create a new operator account with Gate Operator role
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                placeholder="Enter username"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Enter email address"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+255 712 345 678"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Enter address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value: "male" | "female" | "other") =>
                    setFormData({ ...formData, gender: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="date_of_birth">Date of Birth *</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) =>
                    setFormData({ ...formData, date_of_birth: e.target.value })
                  }
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Enter password (min 8 characters)"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password_confirmation">Confirm Password *</Label>
              <Input
                id="password_confirmation"
                type="password"
                value={formData.password_confirmation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    password_confirmation: e.target.value,
                  })
                }
                placeholder="Confirm password"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateOperator}
              disabled={loading || !gateOperatorRoleId}
              className="gradient-maroon hover:opacity-90"
            >
              Create Operator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
