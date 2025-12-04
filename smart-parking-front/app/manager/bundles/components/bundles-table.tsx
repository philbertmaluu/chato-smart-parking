"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type TableColumn } from "@/components/ui/table";
import { toast } from "sonner";
import {
  useBundles,
  type Bundle,
  type BundleType,
  type CreateBundleData,
} from "../hooks/use-bundles";
import { formatDate } from "@/utils/date-utils";
import { formatCurrency } from "@/utils/currency-formater";
import { Plus, Edit, Trash2, MoreHorizontal } from "lucide-react";

interface BundlesTableProps {
  bundleTypes: BundleType[];
}

export function BundlesTable({ bundleTypes }: BundlesTableProps) {
  const {
    bundles,
    loading,
    error,
    pagination,
    fetchBundles,
    handlePageChange,
    createBundle,
    updateBundle,
    deleteBundle,
    toggleActiveStatus,
  } = useBundles();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [formData, setFormData] = useState<CreateBundleData>({
    bundle_type_id: 0,
    name: "",
    amount: 0,
    max_vehicles: 1,
    max_passages: null,
    description: "",
    is_active: true,
  });

  const columns: TableColumn<Bundle>[] = [
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
      key: "name",
      title: "Name",
      dataIndex: "name",
      searchable: true,
      render: (value) => (
        <span className="font-medium truncate">
          {value || "Unnamed Bundle"}
        </span>
      ),
    },
    {
      key: "bundle_type",
      title: "Duration",
      searchable: true,
      render: (_, record) => {
        const bundleType = bundleTypes.find(bt => bt.id === record.bundle_type_id);
        return (
          <Badge className="bg-blue-100 text-blue-700">
            {bundleType?.name || `#${record.bundle_type_id}`}
          </Badge>
        );
      },
    },
    {
      key: "amount",
      title: "Amount",
      dataIndex: "amount",
      searchable: true,
      render: (value) => (
        <span className="font-medium">{formatCurrency(value)}</span>
      ),
    },
    {
      key: "max_vehicles",
      title: "Max Vehicles",
      dataIndex: "max_vehicles",
      searchable: true,
    },
    {
      key: "max_passages",
      title: "Max Passages",
      dataIndex: "max_passages",
      searchable: true,
      render: (value) =>
        value === null || value === undefined || value === "" ? (
          <span className="text-muted-foreground">Unlimited</span>
        ) : (
          <span>{value}</span>
        ),
    },
    {
      key: "description",
      title: "Description",
      dataIndex: "description",
      searchable: true,
      render: (value) => (
        <span className="max-w-xs truncate">{value || "-"}</span>
      ),
    },
    {
      key: "is_active",
      title: "Status",
      dataIndex: "is_active",
      render: (value, record) => (
        <Switch
          checked={value}
          onCheckedChange={() => handleToggleStatus(record.id, value)}
          disabled={loading}
        />
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
                    <AlertDialogTitle>Delete Bundle</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{record.name}"? This
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
  ];

  const handleCreate = async () => {
    try {
      await createBundle(formData);
      toast.success("Bundle created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
      await fetchBundles(pagination.currentPage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create bundle"
      );
    }
  };

  const handleEdit = async () => {
    if (!selectedBundle) return;
    try {
      await updateBundle({ id: selectedBundle.id, ...formData });
      toast.success("Bundle updated successfully");
      setIsEditDialogOpen(false);
      resetForm();
      await fetchBundles(pagination.currentPage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update bundle"
      );
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteBundle(id);
      toast.success("Bundle deleted successfully");
      await fetchBundles(pagination.currentPage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete bundle"
      );
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await toggleActiveStatus(id, !currentStatus);
      toast.success("Status updated successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update status"
      );
    }
  };

  const openEditDialog = (bundle: Bundle) => {
    setSelectedBundle(bundle);
    setFormData({
      bundle_type_id: bundle.bundle_type_id,
      name: bundle.name,
      amount: bundle.amount,
      max_vehicles: bundle.max_vehicles,
      max_passages: bundle.max_passages,
      description: bundle.description || "",
      is_active: bundle.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      bundle_type_id: 0,
      name: "",
      amount: 0,
      max_vehicles: 1,
      max_passages: null,
      description: "",
      is_active: true,
    });
    setSelectedBundle(null);
  };

  return (
    <div className="space-y-6">
      <DataTable
        dataSource={bundles}
        columns={columns}
        loading={loading}
        searchable={true}
        exportable={true}
        searchPlaceholder="Search bundles..."
        exportFileName="bundles"
        searchFields={["name", "description"]}
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
            Add Bundle
          </Button>
        }
      />

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Bundle</DialogTitle>
            <DialogDescription>Create a new pricing bundle</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Daily Small Fleet"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="bundle_type_id">Bundle Type *</Label>
                <Select
                  value={formData.bundle_type_id ? String(formData.bundle_type_id) : ""}
                  onValueChange={(v) =>
                    setFormData({ ...formData, bundle_type_id: Number(v) })
                  }
                >
                  <SelectTrigger id="bundle_type_id" className="w-full">
                    <SelectValue placeholder="Select bundle type" />
                  </SelectTrigger>
                  <SelectContent>
                    {bundleTypes.map((bt) => (
                      <SelectItem key={bt.id} value={String(bt.id)}>
                        {bt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: Number(e.target.value) })
                  }
                  placeholder="e.g., 5000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="max_vehicles">Max Vehicles *</Label>
                <Input
                  id="max_vehicles"
                  type="number"
                  value={formData.max_vehicles}
                  onChange={(e) =>
                    setFormData({ ...formData, max_vehicles: Number(e.target.value) })
                  }
                  placeholder="e.g., 2"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="max_passages">Max Passages</Label>
                <Input
                  id="max_passages"
                  type="number"
                  value={formData.max_passages || ""}
                  onChange={(e) =>
                    setFormData({ 
                      ...formData, 
                      max_passages: e.target.value ? Number(e.target.value) : null 
                    })
                  }
                  placeholder="Leave blank for unlimited"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="is_active">Status</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <span className="text-sm text-muted-foreground">
                  {formData.is_active ? "Active" : "Inactive"}
                </span>
              </div>
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
            <DialogTitle>Edit Bundle</DialogTitle>
            <DialogDescription>Update bundle information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Daily Small Fleet"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-bundle_type_id">Bundle Type *</Label>
                <Select
                  value={formData.bundle_type_id ? String(formData.bundle_type_id) : ""}
                  onValueChange={(v) =>
                    setFormData({ ...formData, bundle_type_id: Number(v) })
                  }
                >
                  <SelectTrigger id="edit-bundle_type_id" className="w-full">
                    <SelectValue placeholder="Select bundle type" />
                  </SelectTrigger>
                  <SelectContent>
                    {bundleTypes.map((bt) => (
                      <SelectItem key={bt.id} value={String(bt.id)}>
                        {bt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-amount">Amount *</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-max_vehicles">Max Vehicles *</Label>
                <Input
                  id="edit-max_vehicles"
                  type="number"
                  value={formData.max_vehicles}
                  onChange={(e) =>
                    setFormData({ ...formData, max_vehicles: Number(e.target.value) })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-max_passages">Max Passages</Label>
                <Input
                  id="edit-max_passages"
                  type="number"
                  value={formData.max_passages || ""}
                  onChange={(e) =>
                    setFormData({ 
                      ...formData, 
                      max_passages: e.target.value ? Number(e.target.value) : null 
                    })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-is_active">Status</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="edit-is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <span className="text-sm text-muted-foreground">
                  {formData.is_active ? "Active" : "Inactive"}
                </span>
              </div>
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
