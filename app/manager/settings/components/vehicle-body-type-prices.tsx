"use client";

import React, { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DataTable, type TableColumn } from "@/components/ui/table";
import { toast } from "sonner";
import {
  useVehicleBodyTypePrices,
  type VehicleBodyTypePrice,
  type CreateVehicleBodyTypePriceData,
} from "../hooks/use-vehicle-body-type-prices";
import { useVehicleBodyTypes } from "../hooks/use-vehicle-body-types";
import { useStations } from "../hooks/use-stations";
import { getVehicleTypeIcon } from "@/utils/utils";
import { formatDate } from "@/utils/date-utils";
import {
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Car,
  Building2,
  MoreHorizontal,
  Calendar,
  TrendingUp,
} from "lucide-react";

export function VehicleBodyTypePrices() {
  const {
    vehicleBodyTypePrices,
    loading,
    error,
    pagination,
    fetchVehicleBodyTypePrices,
    createVehicleBodyTypePrice,
    updateVehicleBodyTypePrice,
    deleteVehicleBodyTypePrice,
    toggleActiveStatus,
  } = useVehicleBodyTypePrices();

  const { vehicleBodyTypes } = useVehicleBodyTypes();
  const { stations } = useStations();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPrice, setSelectedPrice] =
    useState<VehicleBodyTypePrice | null>(null);
  const [formData, setFormData] = useState<CreateVehicleBodyTypePriceData>({
    body_type_id: 0,
    station_id: 0,
    base_price: 0,
    effective_from: new Date().toISOString().split("T")[0],
    effective_to: undefined,
    is_active: true,
  });

  // Load data on component mount
  useEffect(() => {
    fetchVehicleBodyTypePrices();
  }, [fetchVehicleBodyTypePrices]);

  // Define table columns
  const columns: TableColumn<VehicleBodyTypePrice>[] = [
    {
      key: "id",
      title: "#",
      dataIndex: "id",
      searchable: false,
      render: (value) => <span className="font-medium">{value}</span>,
      width: "60px",
      align: "center",
    },
    {
      key: "body_type",
      title: "Vehicle Type",
      dataIndex: "body_type",
      searchable: true,
      render: (value, record) => {
        const bodyType = record.body_type;
        if (!bodyType) return <span className="text-muted-foreground">-</span>;

        const iconData = getVehicleTypeIcon(bodyType.name);
        return (
          <div className="flex items-center space-x-3">
            <div
              className={`${iconData.bgColor} ${iconData.color} p-2 rounded-full flex-shrink-0`}
            >
              <span className="text-lg">{iconData.icon}</span>
            </div>
            <div>
              <span className="font-medium">{bodyType.name}</span>
              <div className="text-xs text-muted-foreground">
                {bodyType.category}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "station",
      title: "Station",
      dataIndex: "station",
      searchable: true,
      render: (value, record) => {
        const station = record.station;
        if (!station) return <span className="text-muted-foreground">-</span>;

        return (
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <div>
              <span className="font-medium">{station.name}</span>
              {station.code && (
                <div className="text-xs text-muted-foreground">
                  {station.code}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "base_price",
      title: "Base Price",
      dataIndex: "base_price",
      searchable: false,
      render: (value) => (
        <div className="flex items-center space-x-1">
          <span className="font-semibold text-green-700">
            Tsh {Number(value).toFixed(2)}
          </span>
        </div>
      ),
    },
    {
      key: "effective_from",
      title: "Effective From",
      dataIndex: "effective_from",
      searchable: false,
      render: (value) => (
        <div className="flex items-center space-x-1">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>{formatDate(value)}</span>
        </div>
      ),
    },
    {
      key: "effective_to",
      title: "Effective To",
      dataIndex: "effective_to",
      searchable: false,
      render: (value) => (
        <div className="flex items-center space-x-1">
          <Calendar className="w-4 h-4 text-orange-600" />
          <span>{value ? formatDate(value) : "Ongoing"}</span>
        </div>
      ),
    },
    {
      key: "is_active",
      title: "Status",
      dataIndex: "is_active",
      render: (value, record) => (
        <div className="flex items-center space-x-2">
          <Switch
            checked={value}
            onCheckedChange={() => handleToggleStatus(record.id, value)}
            disabled={loading}
          />
          <Badge
            variant={value ? "default" : "secondary"}
            className={
              value
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }
          >
            {value ? "Active" : "Inactive"}
          </Badge>
        </div>
      ),
    },
    {
      key: "created_at",
      title: "Created",
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
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEditDialog(record)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete Pricing Configuration
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this pricing
                      configuration? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(record.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const handleCreate = async () => {
    try {
      await createVehicleBodyTypePrice(formData);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleEdit = async () => {
    if (!selectedPrice) return;

    try {
      await updateVehicleBodyTypePrice({
        id: selectedPrice.id,
        ...formData,
      });
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteVehicleBodyTypePrice(id);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await toggleActiveStatus(id, !currentStatus);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const openEditDialog = (price: VehicleBodyTypePrice) => {
    setSelectedPrice(price);
    setFormData({
      body_type_id: price.body_type_id,
      station_id: price.station_id,
      base_price: price.base_price,
      effective_from: price.effective_from.split("T")[0],
      effective_to: price.effective_to
        ? price.effective_to.split("T")[0]
        : undefined,
      is_active: price.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      body_type_id: 0,
      station_id: 0,
      base_price: 0,
      effective_from: new Date().toISOString().split("T")[0],
      effective_to: undefined,
      is_active: true,
    });
    setSelectedPrice(null);
  };

  const handlePageChange = (page: number) => {
    fetchVehicleBodyTypePrices(page);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground">
          Configure pricing for different vehicle types at each station
        </p>
      </div>

      <DataTable
        dataSource={vehicleBodyTypePrices}
        columns={columns}
        loading={loading}
        searchable={true}
        exportable={true}
        searchPlaceholder="Search pricing configurations..."
        exportFileName="vehicle-body-type-prices"
        searchFields={["base_price"]}
        pagination={{
          currentPage: pagination.currentPage,
          total: pagination.total,
          perPage: pagination.perPage,
          lastPage: pagination.lastPage,
          onPageChange: handlePageChange,
          showTotal: true,
        }}
        actionButtons={
          <Button
            className="gradient-maroon hover:opacity-90"
            onClick={() => {
              resetForm();
              setIsCreateDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Pricing Configuration
          </Button>
        }
      />

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Pricing Configuration</DialogTitle>
            <DialogDescription>
              Create a new pricing configuration for a vehicle type at a
              specific station.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="body_type_id">Vehicle Type</Label>
                <Select
                  value={formData.body_type_id.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, body_type_id: parseInt(value) })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleBodyTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="station_id">Station</Label>
                <Select
                  value={formData.station_id.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, station_id: parseInt(value) })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select station" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((station) => (
                      <SelectItem
                        key={station.id}
                        value={station.id.toString()}
                      >
                        {station.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="base_price">Base Price</Label>
              <div className="relative">
                <Input
                  id="base_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.base_price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      base_price: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="pl-10"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="effective_from">Effective From</Label>
                <Input
                  id="effective_from"
                  type="date"
                  value={formData.effective_from}
                  onChange={(e) =>
                    setFormData({ ...formData, effective_from: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="effective_to">Effective To (Optional)</Label>
                <Input
                  id="effective_to"
                  type="date"
                  value={formData.effective_to || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      effective_to: e.target.value || undefined,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Pricing Configuration</DialogTitle>
            <DialogDescription>
              Update the pricing configuration for this vehicle type and
              station.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-body_type_id">Vehicle Type</Label>
                <Select
                  value={formData.body_type_id.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, body_type_id: parseInt(value) })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleBodyTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-station_id">Station</Label>
                <Select
                  value={formData.station_id.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, station_id: parseInt(value) })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select station" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((station) => (
                      <SelectItem
                        key={station.id}
                        value={station.id.toString()}
                      >
                        {station.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-base_price">Base Price</Label>
              <div className="relative">
                <Input
                  id="edit-base_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.base_price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      base_price: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="pl-10"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-effective_from">Effective From</Label>
                <Input
                  id="edit-effective_from"
                  type="date"
                  value={formData.effective_from}
                  onChange={(e) =>
                    setFormData({ ...formData, effective_from: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-effective_to">
                  Effective To (Optional)
                </Label>
                <Input
                  id="edit-effective_to"
                  type="date"
                  value={formData.effective_to || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      effective_to: e.target.value || undefined,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label htmlFor="edit-is_active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={loading}>
              {loading ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
