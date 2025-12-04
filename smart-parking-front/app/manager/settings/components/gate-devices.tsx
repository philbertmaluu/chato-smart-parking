"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  useGateDevices,
  type GateDevice,
  type CreateGateDeviceData,
} from "../hooks/use-gate-devices";
import { useGates } from "../hooks/use-gates";
import { useStations } from "../hooks/use-stations";
import { Edit, MoreHorizontal, Plus, Trash2, Wifi, WifiOff, ChevronDown, ChevronUp } from "lucide-react";
import { formatDate } from "@/utils/date-utils";

export function GateDevices() {
  const {
    gateDevices,
    loading,
    error,
    pagination,
    fetchGateDevices,
    handlePageChange,
    createGateDevice,
    updateGateDevice,
    deleteGateDevice,
    toggleActiveStatus,
  } = useGateDevices();

  const { gates, fetchGates } = useGates();
  const { stations, fetchStations } = useStations();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<GateDevice | null>(null);
  const [openStatusDropdowns, setOpenStatusDropdowns] = useState<Record<number, boolean>>({});
  const [formData, setFormData] = useState<CreateGateDeviceData>({
    gate_id: 0,
    device_type: "camera",
    name: "",
    ip_address: "",
    http_port: 80,
    rtsp_port: 554,
    username: "",
    password: "",
    direction: "both",
    status: "active",
  });

  useEffect(() => {
    fetchGates();
    fetchStations();
  }, []);

  // Define table columns
  const columns: TableColumn<GateDevice>[] = useMemo(
    () => [
      {
        key: "id",
        title: "#",
        dataIndex: "id",
        searchable: false,
        render: (value) => <span className="font-medium">{value}</span>,
        width: "10px",
        align: "center",
      },
      {
        key: "device_type",
        title: "Type",
        dataIndex: "device_type",
        searchable: true,
        render: (value) => {
          return (
            <div className="flex items-center space-x-2">
              <span className="text-lg">📷</span>
              <span className="font-medium">Camera</span>
            </div>
          );
        },
      },
      {
        key: "gate",
        title: "Gate",
        dataIndex: "gate",
        searchable: false,
        render: (_, record) => {
          const gate = gates.find((g) => g.id === record.gate_id);
          const station = stations.find((s) => s.id === gate?.station_id) || gate?.station;
          const stationName = station?.name || `Station #${gate?.station_id || record.gate_id}`;
          return (
            <span className="text-muted-foreground">
              {stationName} - {gate?.name || `Gate #${record.gate_id}`}
            </span>
          );
        },
      },
      {
        key: "ip_address",
        title: "IP Address & Port",
        dataIndex: "ip_address",
        searchable: true,
        render: (value, record) => (
          <span className="font-mono text-sm">
            {value}:{record.http_port}
          </span>
        ),
      },
      {
        key: "status",
        title: "Status",
        dataIndex: "status",
        render: (value, record) => {
          const getStatusEmoji = (status: string | null | undefined) => {
            if (!status || typeof status !== 'string') return "⚪";
            switch (status) {
              case "active":
                return "🟢";
              case "inactive":
                return "⚪";
              case "maintenance":
                return "🟡";
              case "error":
                return "🔴";
              default:
                return "⚪";
            }
          };

          const getStatusLabel = (status: string | null | undefined) => {
            if (!status || typeof status !== 'string') return "Unknown";
            return status.charAt(0).toUpperCase() + status.slice(1);
          };
          
          // Ensure we have a valid string status value
          const statusValue = typeof value === 'string' ? value : 
                             typeof record.status === 'string' ? record.status : 
                             "inactive";
          const isOpen = openStatusDropdowns[record.id] || false;
          
          return (
            <div className="flex items-center space-x-2">
              {record.is_online ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-gray-400" />
              )}
              <DropdownMenu 
                onOpenChange={(open) => 
                  setOpenStatusDropdowns(prev => ({ ...prev, [record.id]: open }))
                }
              >
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2 justify-start">
                    <span className="mr-2">{getStatusEmoji(statusValue)}</span>
                    {getStatusLabel(statusValue)}
                    {isOpen ? (
                      <ChevronUp className="h-3 w-3 ml-auto" />
                    ) : (
                      <ChevronDown className="h-3 w-3 ml-auto" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => handleStatusChange(record, "active")}>
                    <span className="mr-2">🟢</span>
                    Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange(record, "inactive")}>
                    <span className="mr-2">⚪</span>
                    Inactive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange(record, "maintenance")}>
                    <span className="mr-2">🟡</span>
                    Maintenance
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange(record, "error")}>
                    <span className="mr-2">🔴</span>
                    Error
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
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
                      <AlertDialogTitle>Delete Device</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{record.name || "this device"}"? This
                        action cannot be undone.
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
    ],
    [gates]
  );

  const handleCreate = async () => {
    if (!formData.gate_id || formData.gate_id === 0) {
      toast.error("Please select a gate");
      return;
    }
    if (!formData.ip_address || !formData.username || !formData.password) {
      toast.error("Please fill in required fields (IP Address, Username, Password)");
      return;
    }

    try {
      await createGateDevice(formData);
      toast.success("Gate device created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
      await fetchGateDevices(pagination.currentPage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create gate device"
      );
    }
  };

  const handleEdit = async () => {
    if (!selectedDevice) return;
    if (!formData.gate_id || formData.gate_id === 0) {
      toast.error("Please select a gate");
      return;
    }
    if (!formData.ip_address || !formData.username || !formData.password) {
      toast.error("Please fill in required fields (IP Address, Username, Password)");
      return;
    }

    try {
      await updateGateDevice({
        id: selectedDevice.id,
        ...formData,
      });
      toast.success("Gate device updated successfully");
      setIsEditDialogOpen(false);
      resetForm();
      await fetchGateDevices(pagination.currentPage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update gate device"
      );
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteGateDevice(id);
      toast.success("Gate device deleted successfully");
      await fetchGateDevices(pagination.currentPage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete gate device"
      );
    }
  };

  const handleStatusChange = async (record: GateDevice, newStatus: string) => {
    // Ensure newStatus is a string
    const statusString = String(newStatus || '');
    const currentStatus = String(record.status || '');
    
    if (currentStatus === statusString) {
      return; // No change needed
    }

    try {
      await toggleActiveStatus(record.id, statusString);
      toast.success(`Status changed to ${statusString}`);
      await fetchGateDevices(pagination.currentPage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update status"
      );
    }
  };

  const openEditDialog = (device: GateDevice) => {
    setSelectedDevice(device);
    setFormData({
      gate_id: device.gate_id,
      device_type: device.device_type,
      name: device.name || "",
      ip_address: device.ip_address,
      http_port: device.http_port,
      rtsp_port: device.rtsp_port,
      username: device.username,
      password: device.password,
      direction: device.direction,
      status: device.status,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      gate_id: 0,
      device_type: "camera",
      name: "",
      ip_address: "",
      http_port: 80,
      rtsp_port: 554,
      username: "",
      password: "",
      direction: "both",
      status: "active",
    });
    setSelectedDevice(null);
  };

  const isCamera = formData.device_type === "camera";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground">
          Manage camera devices integrated with parking gates
        </p>
      </div>

      <DataTable
        dataSource={gateDevices}
        columns={columns}
        loading={loading}
        searchable={true}
        exportable={true}
        searchPlaceholder="Search devices..."
        exportFileName="gate-devices"
        searchFields={["name", "ip_address", "device_type"]}
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
            Add Device
          </Button>
        }
      />

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Hardware Device</DialogTitle>
            <DialogDescription>
              Configure a new camera device for a parking gate.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="gate_id">Gate *</Label>
              <Select
                value={formData.gate_id ? String(formData.gate_id) : ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, gate_id: Number(value) })
                }
              >
                <SelectTrigger id="gate_id" className="w-full">
                  <SelectValue placeholder="Select a gate" />
                </SelectTrigger>
                <SelectContent>
                  {gates.map((gate) => {
                    const station = stations.find((s) => s.id === gate.station_id) || gate.station;
                    const stationName = station?.name || `Station #${gate.station_id}`;
                    return (
                      <SelectItem key={gate.id} value={String(gate.id)}>
                        {stationName} - {gate.name} ({gate.gate_type})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="device_type">Device Type *</Label>
                <Select
                  value={formData.device_type}
                  onValueChange={(value: "camera") =>
                    setFormData({ ...formData, device_type: value })
                  }
                >
                  <SelectTrigger id="device_type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="camera">Camera</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="direction">Direction</Label>
                <Select
                  value={formData.direction}
                  onValueChange={(value: "entry" | "exit" | "both") =>
                    setFormData({ ...formData, direction: value })
                  }
                >
                  <SelectTrigger id="direction" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry</SelectItem>
                    <SelectItem value="exit">Exit</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ip_address">IP Address *</Label>
              <Input
                id="ip_address"
                value={formData.ip_address}
                onChange={(e) =>
                  setFormData({ ...formData, ip_address: e.target.value })
                }
                placeholder="192.168.0.109"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="http_port">HTTP Port</Label>
                <Input
                  id="http_port"
                  type="number"
                  value={formData.http_port}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      http_port: Number(e.target.value) || 80,
                    })
                  }
                />
              </div>

              {isCamera && (
                <div className="grid gap-2">
                  <Label htmlFor="rtsp_port">RTSP Port</Label>
                  <Input
                    id="rtsp_port"
                    type="number"
                    value={formData.rtsp_port || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rtsp_port: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    placeholder="554"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="admin"
                />
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
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(
                  value: "active" | "inactive" | "maintenance" | "error"
                ) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Hardware Device</DialogTitle>
            <DialogDescription>
              Update the hardware device configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-gate_id">Gate *</Label>
              <Select
                value={formData.gate_id ? String(formData.gate_id) : ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, gate_id: Number(value) })
                }
              >
                <SelectTrigger id="edit-gate_id" className="w-full">
                  <SelectValue placeholder="Select a gate" />
                </SelectTrigger>
                <SelectContent>
                  {gates.map((gate) => {
                    const station = stations.find((s) => s.id === gate.station_id) || gate.station;
                    const stationName = station?.name || `Station #${gate.station_id}`;
                    return (
                      <SelectItem key={gate.id} value={String(gate.id)}>
                        {stationName} - {gate.name} ({gate.gate_type})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-device_type">Device Type *</Label>
                <Select
                  value={formData.device_type}
                  onValueChange={(value: "camera") =>
                    setFormData({ ...formData, device_type: value })
                  }
                >
                  <SelectTrigger id="edit-device_type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="camera">Camera</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-direction">Direction</Label>
                <Select
                  value={formData.direction}
                  onValueChange={(value: "entry" | "exit" | "both") =>
                    setFormData({ ...formData, direction: value })
                  }
                >
                  <SelectTrigger id="edit-direction" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry</SelectItem>
                    <SelectItem value="exit">Exit</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-ip_address">IP Address *</Label>
              <Input
                id="edit-ip_address"
                value={formData.ip_address}
                onChange={(e) =>
                  setFormData({ ...formData, ip_address: e.target.value })
                }
                placeholder="192.168.0.109"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-http_port">HTTP Port</Label>
                <Input
                  id="edit-http_port"
                  type="number"
                  value={formData.http_port}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      http_port: Number(e.target.value) || 80,
                    })
                  }
                />
              </div>

              {isCamera && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-rtsp_port">RTSP Port</Label>
                  <Input
                    id="edit-rtsp_port"
                    type="number"
                    value={formData.rtsp_port || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rtsp_port: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    placeholder="554"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-username">Username *</Label>
                <Input
                  id="edit-username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="admin"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-password">Password *</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Leave empty to keep current"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(
                  value: "active" | "inactive" | "maintenance" | "error"
                ) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="edit-status" className="w-full"      >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
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

