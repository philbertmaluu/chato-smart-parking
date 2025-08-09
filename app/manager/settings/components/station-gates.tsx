"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  useStations,
  type Station,
  type CreateStationData,
} from "../hooks/use-stations";
import { useGates, type Gate, type CreateGateData } from "../hooks/use-gates";
import { Edit, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { getGateTypeIcon } from "@/utils/utils";

export function StationGates() {
  // Stations hook
  const {
    stations,
    loading: stationsLoading,
    pagination: stationsPagination,
    fetchStations,
    handlePageChange: handleStationsPageChange,
    createStation,
    updateStation,
    deleteStation,
    toggleActiveStatus: toggleStationStatus,
  } = useStations();

  // Gates hook
  const {
    gates,
    loading: gatesLoading,
    pagination: gatesPagination,
    fetchGates,
    handlePageChange: handleGatesPageChange,
    createGate,
    updateGate,
    deleteGate,
    toggleActiveStatus: toggleGateStatus,
  } = useGates();

  const [isCreateStationOpen, setIsCreateStationOpen] = useState(false);
  const [isEditStationOpen, setIsEditStationOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [stationForm, setStationForm] = useState<CreateStationData>({
    name: "",
    location: "",
    code: "",
    is_active: true,
  });

  const [isCreateGateOpen, setIsCreateGateOpen] = useState(false);
  const [isEditGateOpen, setIsEditGateOpen] = useState(false);
  const [selectedGate, setSelectedGate] = useState<Gate | null>(null);
  const [gateForm, setGateForm] = useState<CreateGateData>({
    station_id: 0,
    name: "",
    gate_type: "both",
    is_active: true,
  });

  const stationColumns: TableColumn<Station>[] = useMemo(
    () => [
      {
        key: "id",
        title: "#",
        dataIndex: "id",
        searchable: false,
        align: "center",
        render: (value) => <span className="font-medium">{value}</span>,
        width: "10px",
      },
      {
        key: "name",
        title: "Name",
        dataIndex: "name",
        searchable: true,
        render: (value) => <span className="font-medium">{value}</span>,
      },
      {
        key: "location",
        title: "Location",
        dataIndex: "location",
        searchable: true,
        render: (value) => (
          <span className="text-muted-foreground">{value || "-"}</span>
        ),
      },
      {
        key: "code",
        title: "Code",
        dataIndex: "code",
        searchable: true,
        render: (value) => <span className="font-mono text-sm">{value}</span>,
      },
      {
        key: "is_active",
        title: "Status",
        dataIndex: "is_active",
        render: (value, record) => (
          <Switch
            checked={value}
            onCheckedChange={() => handleToggleStationStatus(record.id, value)}
            disabled={stationsLoading}
          />
        ),
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
                <DropdownMenuItem onClick={() => openEditStation(record)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Station</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{record.name}"? This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteStation(record.id)}
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
    [stationsLoading]
  );

  const gateColumns: TableColumn<Gate>[] = useMemo(
    () => [
      {
        key: "id",
        title: "#",
        dataIndex: "id",
        align: "center",
        searchable: false,
        render: (v) => <span className="font-medium">{v}</span>,
        width: "10px",
      },
      {
        key: "name",
        title: "Name",
        dataIndex: "name",
        searchable: true,
        render: (v) => <span className="font-medium">{v}</span>,
      },
      {
        key: "station",
        title: "Station",
        searchable: true,
        render: (_, record) => (
          <span className="font-medium">
            {record.station?.name || `#${record.station_id}`}
          </span>
        ),
      },
      {
        key: "gate_type",
        title: "Type",
        dataIndex: "gate_type",
        searchable: true,
        render: (v) => {
          const icon = getGateTypeIcon(v || "");
          return (
            <div className="flex items-center space-x-2">
              <div
                className={`${icon.bgColor} ${icon.color} p-2 rounded-full flex-shrink-0`}
              >
                <span className="text-lg">{icon.icon}</span>
              </div>
              <span className="uppercase font-medium">{v}</span>
            </div>
          );
        },
      },
      {
        key: "is_active",
        title: "Status",
        dataIndex: "is_active",
        render: (value, record) => (
          <Switch
            checked={value}
            onCheckedChange={() => handleToggleGateStatus(record.id, value)}
            disabled={gatesLoading}
          />
        ),
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
                <DropdownMenuItem onClick={() => openEditGate(record)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Gate</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{record.name}"? This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteGate(record.id)}
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
    [gatesLoading]
  );

  const openEditStation = (station: Station) => {
    setSelectedStation(station);
    setStationForm({
      name: station.name,
      location: station.location || "",
      code: station.code,
      is_active: station.is_active,
    });
    setIsEditStationOpen(true);
  };

  const openEditGate = (gate: Gate) => {
    setSelectedGate(gate);
    setGateForm({
      station_id: gate.station_id,
      name: gate.name,
      gate_type: gate.gate_type,
      is_active: gate.is_active,
    });
    setIsEditGateOpen(true);
  };

  const handleCreateStation = async () => {
    try {
      await createStation(stationForm);
      toast.success("Station created successfully");
      setIsCreateStationOpen(false);
      resetStationForm();
      await fetchStations(stationsPagination.currentPage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create station"
      );
    }
  };

  const handleEditStation = async () => {
    if (!selectedStation) return;
    try {
      await updateStation({ id: selectedStation.id, ...stationForm });
      toast.success("Station updated successfully");
      setIsEditStationOpen(false);
      resetStationForm();
      await fetchStations(stationsPagination.currentPage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update station"
      );
    }
  };

  const handleDeleteStation = async (id: number) => {
    try {
      await deleteStation(id);
      toast.success("Station deleted successfully");
      await fetchStations(stationsPagination.currentPage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete station"
      );
    }
  };

  const handleToggleStationStatus = async (
    id: number,
    currentStatus: boolean
  ) => {
    try {
      await toggleStationStatus(id, !currentStatus);
      toast.success("Status updated successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update status"
      );
    }
  };

  const handleCreateGate = async () => {
    try {
      await createGate(gateForm);
      toast.success("Gate created successfully");
      setIsCreateGateOpen(false);
      resetGateForm();
      await fetchGates(gatesPagination.currentPage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create gate"
      );
    }
  };

  const handleEditGate = async () => {
    if (!selectedGate) return;
    try {
      await updateGate({ id: selectedGate.id, ...gateForm });
      toast.success("Gate updated successfully");
      setIsEditGateOpen(false);
      resetGateForm();
      await fetchGates(gatesPagination.currentPage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update gate"
      );
    }
  };

  const handleDeleteGate = async (id: number) => {
    try {
      await deleteGate(id);
      toast.success("Gate deleted successfully");
      await fetchGates(gatesPagination.currentPage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete gate"
      );
    }
  };

  const handleToggleGateStatus = async (id: number, currentStatus: boolean) => {
    try {
      await toggleGateStatus(id, !currentStatus);
      toast.success("Status updated successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update status"
      );
    }
  };

  const resetStationForm = () => {
    setStationForm({ name: "", location: "", code: "", is_active: true });
    setSelectedStation(null);
  };

  const resetGateForm = () => {
    setGateForm({
      station_id: 0,
      name: "",
      gate_type: "both",
      is_active: true,
    });
    setSelectedGate(null);
  };

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <div className="flex items-center justify-between">

          <p className="text-muted-foreground">
            Manage stations for the parking system.
          </p>
        </div>
        <DataTable
          dataSource={stations}
          columns={stationColumns}
          loading={stationsLoading}
          searchable
          exportable
          searchPlaceholder="Search stations..."
          exportFileName="stations"
          searchFields={["name", "location", "code"]}
          actionButtons={
            <Button
              className="gradient-maroon hover:opacity-90"
              onClick={() => {
                resetStationForm();
                setIsCreateStationOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> New Station
            </Button>
          }
          pagination={{
            currentPage: stationsPagination.currentPage,
            total: stationsPagination.total,
            perPage: stationsPagination.perPage,
            lastPage: stationsPagination.lastPage,
            onPageChange: handleStationsPageChange,
            showTotal: true,
          }}
        />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Manage gates for the parking system.
          </p>
        </div>
        <DataTable
          dataSource={gates}
          columns={gateColumns}
          loading={gatesLoading}
          searchable
          exportable
          searchPlaceholder="Search gates..."
          exportFileName="gates"
          searchFields={["name", "gate_type"]}
          actionButtons={
            <Button
              className="gradient-maroon hover:opacity-90"
              onClick={() => {
                resetGateForm();
                setIsCreateGateOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> New Gate
            </Button>
          }
          pagination={{
            currentPage: gatesPagination.currentPage,
            total: gatesPagination.total,
            perPage: gatesPagination.perPage,
            lastPage: gatesPagination.lastPage,
            onPageChange: handleGatesPageChange,
            showTotal: true,
          }}
        />
      </div>

      {/* Create Station Dialog */}
      <Dialog open={isCreateStationOpen} onOpenChange={setIsCreateStationOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Create Station</DialogTitle>
            <DialogDescription>
              Add a new station to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="s-name">Name</Label>
              <Input
                id="s-name"
                value={stationForm.name}
                onChange={(e) =>
                  setStationForm({ ...stationForm, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="s-location">Location</Label>
              <Input
                id="s-location"
                value={stationForm.location || ""}
                onChange={(e) =>
                  setStationForm({ ...stationForm, location: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="s-code">Code</Label>
              <Input
                id="s-code"
                value={stationForm.code}
                onChange={(e) =>
                  setStationForm({ ...stationForm, code: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="s-active">Status</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="s-active"
                  checked={stationForm.is_active}
                  onCheckedChange={(c) =>
                    setStationForm({ ...stationForm, is_active: c })
                  }
                />
                <span className="text-sm text-muted-foreground">
                  {stationForm.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateStationOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateStation} disabled={stationsLoading}>
              {stationsLoading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Station Dialog */}
      <Dialog open={isEditStationOpen} onOpenChange={setIsEditStationOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Station</DialogTitle>
            <DialogDescription>Update station details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="se-name">Name</Label>
              <Input
                id="se-name"
                value={stationForm.name}
                onChange={(e) =>
                  setStationForm({ ...stationForm, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="se-location">Location</Label>
              <Input
                id="se-location"
                value={stationForm.location || ""}
                onChange={(e) =>
                  setStationForm({ ...stationForm, location: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="se-code">Code</Label>
              <Input
                id="se-code"
                value={stationForm.code}
                onChange={(e) =>
                  setStationForm({ ...stationForm, code: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="se-active">Status</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="se-active"
                  checked={stationForm.is_active}
                  onCheckedChange={(c) =>
                    setStationForm({ ...stationForm, is_active: c })
                  }
                />
                <span className="text-sm text-muted-foreground">
                  {stationForm.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditStationOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditStation} disabled={stationsLoading}>
              {stationsLoading ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Gate Dialog */}
      <Dialog open={isCreateGateOpen} onOpenChange={setIsCreateGateOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Create Gate</DialogTitle>
            <DialogDescription>Add a new gate to the system.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="g-station">Station</Label>
              <Select
                value={gateForm.station_id ? String(gateForm.station_id) : ""}
                onValueChange={(value) =>
                  setGateForm({ ...gateForm, station_id: Number(value) })
                }
              >
                <SelectTrigger id="g-station" className="w-full">
                  <SelectValue placeholder="Select station" />
                </SelectTrigger>
                <SelectContent>
                  {stations.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name} ({s.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="g-name">Name</Label>
              <Input
                id="g-name"
                value={gateForm.name}
                onChange={(e) =>
                  setGateForm({ ...gateForm, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="g-type">Type</Label>
              <Select
                value={gateForm.gate_type}
                onValueChange={(value) =>
                  setGateForm({
                    ...gateForm,
                    gate_type: value as "entry" | "exit" | "both",
                  })
                }
              >
                <SelectTrigger id="g-type" className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">IN</SelectItem>
                  <SelectItem value="exit">OUT</SelectItem>
                  <SelectItem value="both">BOTH</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="g-active">Status</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="g-active"
                  checked={gateForm.is_active}
                  onCheckedChange={(c) =>
                    setGateForm({ ...gateForm, is_active: c })
                  }
                />
                <span className="text-sm text-muted-foreground">
                  {gateForm.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateGateOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateGate} disabled={gatesLoading}>
              {gatesLoading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Gate Dialog */}
      <Dialog open={isEditGateOpen} onOpenChange={setIsEditGateOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Gate</DialogTitle>
            <DialogDescription>Update gate details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="ge-station">Station</Label>
              <Select
                value={gateForm.station_id ? String(gateForm.station_id) : ""}
                onValueChange={(value) =>
                  setGateForm({ ...gateForm, station_id: Number(value) })
                }
              >
                <SelectTrigger id="ge-station" className="w-full">
                  <SelectValue placeholder="Select station" />
                </SelectTrigger>
                <SelectContent>
                  {stations.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name} ({s.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ge-name">Name</Label>
              <Input
                id="ge-name"
                value={gateForm.name}
                onChange={(e) =>
                  setGateForm({ ...gateForm, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ge-type">Type</Label>
              <Select
                value={gateForm.gate_type}
                onValueChange={(value) =>
                  setGateForm({
                    ...gateForm,
                    gate_type: value as "entry" | "exit" | "both",
                  })
                }
              >
                <SelectTrigger id="ge-type" className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">IN</SelectItem>
                  <SelectItem value="exit">OUT</SelectItem>
                  <SelectItem value="both">BOTH</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ge-active">Status</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="ge-active"
                  checked={gateForm.is_active}
                  onCheckedChange={(c) =>
                    setGateForm({ ...gateForm, is_active: c })
                  }
                />
                <span className="text-sm text-muted-foreground">
                  {gateForm.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditGateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditGate} disabled={gatesLoading}>
              {gatesLoading ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
