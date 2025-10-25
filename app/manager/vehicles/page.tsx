"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DataTable, type TableColumn } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Car, Plus, Edit, Trash2, MoreHorizontal, Search, Filter, Download, RefreshCw, TrendingUp, Users, Clock, DollarSign, Activity, BarChart3, PieChart } from "lucide-react";
import { getVehicleTypeIcon } from "@/utils/utils";
import { formatDate } from "@/utils/date-utils";
import { useVehicles } from "@/hooks/use-vehicles";
import {
  useVehicleBodyTypes,
  type VehicleBodyType,
} from "../settings/hooks/use-vehicle-body-types";
import { toast } from "sonner";
import { get } from "@/utils/api/api";
import { API_ENDPOINTS } from "@/utils/api/endpoints";

type Vehicle = {
  id: number;
  body_type_id: number;
  plate_number: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  color?: string | null;
  owner_name?: string | null;
  is_registered: boolean;
  created_at: string;
  body_type?: {
    id: number;
    name: string;
    category?: string;
  };
  vehicle_passages?: any[];
};

export default function VehiclesPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "registered" | "unregistered">("all");
  
  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalPassages: 0,
    averageStayTime: 0,
    bodyTypeDistribution: [],
    recentActivity: [],
    monthlyTrends: []
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Use the vehicles hook for real API data
  const {
    vehicles,
    loading,
    error,
    pagination,
    fetchVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    toggleVehicleStatus,
    handlePageChange,
  } = useVehicles();

  // Load body types for dropdown and rendering
  const { vehicleBodyTypes, fetchVehicleBodyTypes } = useVehicleBodyTypes();

  // Fetch analytics data - temporarily disabled due to backend issues
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      // For now, use mock data since backend endpoints are returning 500 errors
      // TODO: Fix backend endpoints and re-enable real data fetching
      setAnalytics({
        totalRevenue: 0,
        totalPassages: 0,
        averageStayTime: 0,
        bodyTypeDistribution: [],
        recentActivity: [],
        monthlyTrends: []
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicleBodyTypes?.();
    fetchVehicles(1);
    // fetchAnalytics(); // Temporarily disabled due to backend 500 errors
  }, [fetchVehicleBodyTypes, fetchVehicles]);

  // Filter vehicles based on status
  const filteredVehicles = useMemo(() => {
    if (filterStatus === "all") return vehicles;
    return vehicles.filter(vehicle => 
      filterStatus === "registered" ? vehicle.is_registered : !vehicle.is_registered
    );
  }, [vehicles, filterStatus]);

  const bodyTypeById = useMemo(() => {
    const map = new Map<number, VehicleBodyType>();
    (vehicleBodyTypes || []).forEach((bt) => map.set(bt.id, bt));
    return map;
  }, [vehicleBodyTypes]);

  const [formData, setFormData] = useState<{
    body_type_id: number | undefined;
    plate_number: string;
    make: string;
    model: string;
    year: string;
    color: string;
    owner_name: string;
    is_registered: boolean;
  }>({
    body_type_id: undefined,
    plate_number: "",
    make: "",
    model: "",
    year: "",
    color: "",
    owner_name: "",
    is_registered: false,
  });

  const columns: TableColumn<Vehicle>[] = useMemo(
    () => [
      {
        key: "id",
        title: "#",
        dataIndex: "id",
        searchable: false,
        align: "center",
        width: "10px",
        render: (value) => <span className="font-medium">{value}</span>,
      },
      {
        key: "plate_number",
        title: "Plate",
        dataIndex: "plate_number",
        searchable: true,
        render: (value, record) => (
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback>
                {String(value || "")
                  .replace(/[^A-Z]/g, "")
                  .slice(0, 2) || "VH"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold tracking-wide">{value}</p>
              <p className="text-xs text-muted-foreground">
                {bodyTypeById.get(record.body_type_id)?.name || "Unknown"}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "body_type_id",
        title: "Body Type",
        dataIndex: "body_type_id",
        searchable: true,
        render: (value: number) => {
          const bt = bodyTypeById.get(value);
          const icon = getVehicleTypeIcon(bt?.name || "");
          return (
            <div className="flex items-center space-x-2">
              <div className={`${icon.bgColor} ${icon.color} p-2 rounded-full`}>
                <span className="text-lg">{icon.icon}</span>
              </div>
              <span className="font-medium">{bt?.name || "Unknown"}</span>
            </div>
          );
        },
      },
      { key: "make", title: "Make", dataIndex: "make", searchable: true },
      { key: "model", title: "Model", dataIndex: "model", searchable: true },
      {
        key: "year",
        title: "Year",
        dataIndex: "year",
        searchable: true,
        render: (v) =>
          v ? (
            <span>{v}</span>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        key: "color",
        title: "Color",
        dataIndex: "color",
        searchable: true,
        render: (v) => (
          <div className="flex items-center space-x-2">
            <span
              className="inline-block w-3 h-3 rounded-full border"
              style={{ backgroundColor: String(v || "").toLowerCase() }}
            />
            <span>{v || "-"}</span>
          </div>
        ),
      },
      {
        key: "owner_name",
        title: "Owner",
        dataIndex: "owner_name",
        searchable: true,
      },
      {
        key: "is_registered",
        title: "Registered",
        dataIndex: "is_registered",
        render: (v: boolean) => (
          <Badge
            className={
              v ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
            }
          >
            {v ? "Yes" : "No"}
          </Badge>
        ),
      },
      {
        key: "created_at",
        title: "Added",
        dataIndex: "created_at",
        render: (value) => formatDate(value),
      },
      {
        key: "actions",
        title: "Actions",
        align: "right",
        render: (_, record) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEditDialog(record)}>
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => handleDelete(record)}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [bodyTypeById]
  );

  const resetForm = () =>
    setFormData({
      body_type_id: undefined,
      plate_number: "",
      make: "",
      model: "",
      year: "",
      color: "",
      owner_name: "",
      is_registered: false,
    });

  const openCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const openEditDialog = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData({
      body_type_id: vehicle.body_type_id,
      plate_number: vehicle.plate_number,
      make: vehicle.make || "",
      model: vehicle.model || "",
      year: vehicle.year ? String(vehicle.year) : "",
      color: vehicle.color || "",
      owner_name: vehicle.owner_name || "",
      is_registered: vehicle.is_registered,
    });
    setShowEditDialog(true);
  };

  const handleCreate = async () => {
    try {
      if (!formData.plate_number || !formData.body_type_id) return;
      await createVehicle({
        body_type_id: formData.body_type_id,
        plate_number: formData.plate_number,
        make: formData.make || '',
        model: formData.model || '',
        year: formData.year ? Number(formData.year) : 0,
        color: formData.color || '',
        owner_name: formData.owner_name || '',
        is_registered: formData.is_registered,
        is_exempted: false,
      });
      toast.success("Vehicle created successfully");
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to create vehicle");
    }
  };

  const handleEdit = async () => {
    try {
      if (!selectedVehicle) return;
      await updateVehicle(selectedVehicle.id, {
        body_type_id: formData.body_type_id!,
        plate_number: formData.plate_number,
        make: formData.make || '',
        model: formData.model || '',
        year: formData.year ? Number(formData.year) : 0,
        color: formData.color || '',
        owner_name: formData.owner_name || '',
        is_registered: formData.is_registered,
      });
      toast.success("Vehicle updated successfully");
      setShowEditDialog(false);
      setSelectedVehicle(null);
      resetForm();
    } catch (error) {
      toast.error("Failed to update vehicle");
    }
  };

  const handleDelete = async (record: Vehicle) => {
    try {
      await deleteVehicle(record.id);
      toast.success("Vehicle deleted successfully");
    } catch (error) {
      toast.error("Failed to delete vehicle");
    }
  };

  const handleToggleStatus = async (record: Vehicle) => {
    try {
      await toggleVehicleStatus(record.id);
      toast.success(`Vehicle ${record.is_registered ? 'unregistered' : 'registered'} successfully`);
    } catch (error) {
      toast.error("Failed to update vehicle status");
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
            <h1 className="text-3xl font-bold text-gradient">Vehicle Fleet</h1>
            <p className="text-muted-foreground mt-2">
              Manage and monitor all vehicles in the system
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => fetchVehicles(1)}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="gradient-maroon hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          </div>
        </motion.div>

        {/* Analytics Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {/* Total Vehicles */}
          <Card className="relative overflow-hidden border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{vehicles.length}</p>
                  <p className="text-sm text-muted-foreground">Total Vehicles</p>
                </div>
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full">
                  <Car className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Analytics */}
          <Card className="relative overflow-hidden border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">$0</p>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </div>
                <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-full">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Passages */}
          <Card className="relative overflow-hidden border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Total Passages</p>
                </div>
                <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full">
                  <Activity className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Average Stay Time */}
          <Card className="relative overflow-hidden border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">0.0h</p>
                  <p className="text-sm text-muted-foreground">Avg Stay Time</p>
                </div>
                <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Additional Analytics Row - Compact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          {/* Registration Status - Compact */}
          <Card className="h-20 border-0 shadow-sm">
            <CardContent className="p-3 h-full flex items-center">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Registration</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs">{vehicles.filter(v => v.is_registered).length}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-xs">{vehicles.filter(v => !v.is_registered).length}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Types - Compact */}
          <Card className="h-20 border-0 shadow-sm">
            <CardContent className="p-3 h-full flex items-center">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <PieChart className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">Types</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Analytics disabled
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity - Compact */}
          <Card className="h-20 border-0 shadow-sm">
            <CardContent className="p-3 h-full flex items-center">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Activity</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-green-600">+24</span>
                  <span className="text-xs text-blue-600">+18</span>
                  <span className="text-xs text-purple-600">6</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search vehicles by plate, make, model, or owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vehicles</SelectItem>
              <SelectItem value="registered">Registered Only</SelectItem>
              <SelectItem value="unregistered">Unregistered Only</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Vehicles Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <DataTable
            dataSource={filteredVehicles}
            columns={columns}
            loading={loading}
            exportable
            searchable
            searchPlaceholder="Search vehicles..."
            exportFileName="vehicle-fleet"
            searchFields={[
              "plate_number",
              "make",
              "model",
              "color",
              "owner_name",
            ]}
            pagination={{
              currentPage: pagination.current_page,
              total: pagination.total,
              perPage: pagination.per_page,
              lastPage: pagination.last_page,
              onPageChange: handlePageChange,
            }}
          />
        </motion.div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-white border-0 shadow-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
            <DialogDescription>Create a new vehicle record</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="plate">Plate Number *</Label>
              <Input
                id="plate"
                value={formData.plate_number}
                onChange={(e) =>
                  setFormData({ ...formData, plate_number: e.target.value })
                }
                placeholder="e.g., T123 ABC"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Body Type *</Label>
              <Select
                value={
                  formData.body_type_id ? String(formData.body_type_id) : ""
                }
                onValueChange={(val) =>
                  setFormData({ ...formData, body_type_id: Number(val) })
                }
              >
                <SelectTrigger id="body">
                  <SelectValue placeholder="Select body type" />
                </SelectTrigger>
                <SelectContent>
                  {(vehicleBodyTypes || []).map((bt) => (
                    <SelectItem key={bt.id} value={String(bt.id)}>
                      {bt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                value={formData.make}
                onChange={(e) =>
                  setFormData({ ...formData, make: e.target.value })
                }
                placeholder="e.g., Toyota"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                placeholder="e.g., Corolla"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: e.target.value })
                }
                placeholder="e.g., 2018"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                placeholder="e.g., Silver"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="owner">Owner Name</Label>
              <Input
                id="owner"
                value={formData.owner_name}
                onChange={(e) =>
                  setFormData({ ...formData, owner_name: e.target.value })
                }
                placeholder="e.g., John Doe"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="reg">Registered</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="reg"
                  checked={formData.is_registered}
                  onCheckedChange={(c) =>
                    setFormData({ ...formData, is_registered: c })
                  }
                />
                <span className="text-sm text-muted-foreground">
                  {formData.is_registered ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              className="gradient-maroon hover:opacity-90"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-white border-0 shadow-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
            <DialogDescription>Update vehicle information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="e-plate">Plate Number *</Label>
              <Input
                id="e-plate"
                value={formData.plate_number}
                onChange={(e) =>
                  setFormData({ ...formData, plate_number: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-body">Body Type *</Label>
              <Select
                value={
                  formData.body_type_id ? String(formData.body_type_id) : ""
                }
                onValueChange={(val) =>
                  setFormData({ ...formData, body_type_id: Number(val) })
                }
              >
                <SelectTrigger id="e-body">
                  <SelectValue placeholder="Select body type" />
                </SelectTrigger>
                <SelectContent>
                  {(vehicleBodyTypes || []).map((bt) => (
                    <SelectItem key={bt.id} value={String(bt.id)}>
                      {bt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-make">Make</Label>
              <Input
                id="e-make"
                value={formData.make}
                onChange={(e) =>
                  setFormData({ ...formData, make: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-model">Model</Label>
              <Input
                id="e-model"
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-year">Year</Label>
              <Input
                id="e-year"
                type="number"
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-color">Color</Label>
              <Input
                id="e-color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="e-owner">Owner Name</Label>
              <Input
                id="e-owner"
                value={formData.owner_name}
                onChange={(e) =>
                  setFormData({ ...formData, owner_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="e-reg">Registered</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="e-reg"
                  checked={formData.is_registered}
                  onCheckedChange={(c) =>
                    setFormData({ ...formData, is_registered: c })
                  }
                />
                <span className="text-sm text-muted-foreground">
                  {formData.is_registered ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              className="gradient-maroon hover:opacity-90"
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
