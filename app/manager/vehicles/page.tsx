"use client";

import { useMemo, useState, useEffect } from "react";
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
import { Car, Plus, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { getVehicleTypeIcon } from "@/utils/utils";
import { formatDate } from "@/utils/date-utils";
import {
  useVehicleBodyTypes,
  type VehicleBodyType,
} from "../settings/hooks/use-vehicle-body-types";

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
};

// Mock data for demonstration
const mockVehicles: Vehicle[] = [
  {
    id: 1,
    body_type_id: 1,
    plate_number: "T123 ABC",
    make: "Toyota",
    model: "Corolla",
    year: 2018,
    color: "Silver",
    owner_name: "John Doe",
    is_registered: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    body_type_id: 2,
    plate_number: "T456 XYZ",
    make: "Honda",
    model: "Civic",
    year: 2020,
    color: "Blue",
    owner_name: "Jane Smith",
    is_registered: false,
    created_at: new Date().toISOString(),
  },
];

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Load body types for dropdown and rendering
  const { vehicleBodyTypes, fetchVehicleBodyTypes } = useVehicleBodyTypes();

  useEffect(() => {
    fetchVehicleBodyTypes?.();
  }, [fetchVehicleBodyTypes]);

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

  const handleCreate = () => {
    // Simple client-side create
    if (!formData.plate_number || !formData.body_type_id) return;
    const next: Vehicle = {
      id: vehicles.length ? vehicles[0].id + 1 : 1,
      body_type_id: formData.body_type_id,
      plate_number: formData.plate_number,
      make: formData.make || null,
      model: formData.model || null,
      year: formData.year ? Number(formData.year) : null,
      color: formData.color || null,
      owner_name: formData.owner_name || null,
      is_registered: formData.is_registered,
      created_at: new Date().toISOString(),
    };
    setVehicles((prev) => [next, ...prev]);
    setShowCreateDialog(false);
    resetForm();
  };

  const handleEdit = () => {
    if (!selectedVehicle) return;
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === selectedVehicle.id
          ? {
              ...v,
              body_type_id: formData.body_type_id || v.body_type_id,
              plate_number: formData.plate_number,
              make: formData.make || null,
              model: formData.model || null,
              year: formData.year ? Number(formData.year) : null,
              color: formData.color || null,
              owner_name: formData.owner_name || null,
              is_registered: formData.is_registered,
            }
          : v
      )
    );
    setShowEditDialog(false);
    setSelectedVehicle(null);
    resetForm();
  };

  const handleDelete = (record: Vehicle) => {
    setVehicles((prev) => prev.filter((v) => v.id !== record.id));
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
            <h1 className="text-3xl font-bold text-gradient">Vehicles</h1>
            <p className="text-muted-foreground mt-2">
              Manage registered and frequent vehicles
            </p>
          </div>
        </motion.div>

        {/* Vehicles Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <DataTable
            dataSource={vehicles}
            columns={columns}
            loading={loading}
            exportable
            searchable
            searchPlaceholder="Search vehicles..."
            exportFileName="vehicles"
            searchFields={[
              "plate_number",
              "make",
              "model",
              "color",
              "owner_name",
            ]}
            actionButtons={
              <Button
                onClick={openCreateDialog}
                className="gradient-maroon hover:opacity-90"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Vehicle
              </Button>
            }
          />
        </motion.div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="glass-effect border-0 shadow-2xl max-w-lg">
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
        <DialogContent className="glass-effect border-0 shadow-2xl max-w-lg">
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
