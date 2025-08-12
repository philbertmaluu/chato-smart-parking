"use client";

import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { motion } from "framer-motion";
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
import { DataTable, type TableColumn } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Package, Plus, Edit, Trash2, MoreHorizontal } from "lucide-react";
import {
  useBundleTypes,
  type BundleType,
} from "../settings/hooks/use-bundle-types";

type Bundle = {
  id: number;
  bundle_type_id: number;
  name: string;
  amount: number;
  max_vehicles: number;
  max_passages?: number | null;
  description?: string | null;
  is_active: boolean;
  created_at: string;
};

const mockBundles: Bundle[] = [
  {
    id: 1,
    bundle_type_id: 1,
    name: "Daily Small Fleet",
    amount: 5000,
    max_vehicles: 2,
    max_passages: 10,
    description: "Up to 2 vehicles, 10 passages in a day",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    bundle_type_id: 3,
    name: "Monthly Corporate",
    amount: 150000,
    max_vehicles: 10,
    max_passages: null,
    description: "Ideal for companies with many vehicles",
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

export default function BundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>(mockBundles);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);

  const { bundleTypes, fetchBundleTypes } = useBundleTypes();
  useEffect(() => {
    fetchBundleTypes?.();
  }, [fetchBundleTypes]);

  const bundleTypeById = useMemo(() => {
    const map = new Map<number, BundleType>();
    (bundleTypes || []).forEach((bt) =>
      map.set(bt.id as unknown as number, bt)
    );
    return map;
  }, [bundleTypes]);

  const [formData, setFormData] = useState({
    bundle_type_id: undefined as number | undefined,
    name: "",
    amount: "",
    max_vehicles: "1",
    max_passages: "",
    description: "",
    is_active: true,
  });

  const columns: TableColumn<Bundle>[] = useMemo(
    () => [
      {
        key: "id",
        title: "#",
        dataIndex: "id",
        align: "center",
        searchable: false,
        width: "10px",
        render: (v) => <span className="font-medium">{v}</span>,
      },
      { key: "name", title: "Name", dataIndex: "name", searchable: true },
      {
        key: "bundle_type",
        title: "Type",
        searchable: true,
        render: (_, r) => (
          <Badge className="bg-blue-100 text-blue-700">
            {bundleTypeById.get(r.bundle_type_id)?.name ||
              `#${r.bundle_type_id}`}
          </Badge>
        ),
      },
      {
        key: "amount",
        title: "Amount",
        dataIndex: "amount",
        searchable: true,
        render: (v) => (
          <span className="font-medium">{Number(v).toLocaleString()}</span>
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
        render: (v) =>
          v === null || v === undefined || v === "" ? (
            <span className="text-muted-foreground">Unlimited</span>
          ) : (
            <span>{v}</span>
          ),
      },
      {
        key: "description",
        title: "Description",
        dataIndex: "description",
        searchable: true,
        render: (v) => (
          <span className="truncate max-w-xs inline-block">{v || "-"}</span>
        ),
      },
      {
        key: "is_active",
        title: "Status",
        dataIndex: "is_active",
        render: (v: boolean) => (
          <Badge
            className={
              v ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
            }
          >
            {v ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        key: "created_at",
        title: "Created",
        dataIndex: "created_at",
        render: (v) => new Date(v).toLocaleDateString(),
      },
      {
        key: "actions",
        title: "Actions",
        align: "right",
        render: (_, r) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEditDialog(r)}>
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => handleDelete(r)}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [bundleTypeById]
  );

  const resetForm = () =>
    setFormData({
      bundle_type_id: undefined,
      name: "",
      amount: "",
      max_vehicles: "1",
      max_passages: "",
      description: "",
      is_active: true,
    });
  const openCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
  };
  const openEditDialog = (b: Bundle) => {
    setSelectedBundle(b);
    setFormData({
      bundle_type_id: b.bundle_type_id,
      name: b.name,
      amount: String(b.amount),
      max_vehicles: String(b.max_vehicles),
      max_passages: b.max_passages == null ? "" : String(b.max_passages),
      description: b.description || "",
      is_active: b.is_active,
    });
    setShowEditDialog(true);
  };

  const handleCreate = () => {
    if (!formData.name || !formData.bundle_type_id || !formData.amount) return;
    const next: Bundle = {
      id: bundles.length ? bundles[0].id + 1 : 1,
      bundle_type_id: formData.bundle_type_id!,
      name: formData.name,
      amount: Number(formData.amount),
      max_vehicles: Number(formData.max_vehicles || 1),
      max_passages: formData.max_passages
        ? Number(formData.max_passages)
        : null,
      description: formData.description || null,
      is_active: formData.is_active,
      created_at: new Date().toISOString(),
    };
    setBundles((prev) => [next, ...prev]);
    setShowCreateDialog(false);
    resetForm();
  };
  const handleEdit = () => {
    if (!selectedBundle) return;
    setBundles((prev) =>
      prev.map((b) =>
        b.id === selectedBundle.id
          ? {
              ...b,
              bundle_type_id: formData.bundle_type_id || b.bundle_type_id,
              name: formData.name,
              amount: Number(formData.amount),
              max_vehicles: Number(formData.max_vehicles || 1),
              max_passages: formData.max_passages
                ? Number(formData.max_passages)
                : null,
              description: formData.description || null,
              is_active: formData.is_active,
            }
          : b
      )
    );
    setShowEditDialog(false);
    setSelectedBundle(null);
    resetForm();
  };
  const handleDelete = (r: Bundle) =>
    setBundles((prev) => prev.filter((b) => b.id !== r.id));

  return (
    <MainLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gradient">Bundles</h1>
            <p className="text-muted-foreground mt-2">
              Manage pricing bundles for frequent customers
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <DataTable
            dataSource={bundles}
            columns={columns}
            loading={loading}
            exportable
            searchable
            searchPlaceholder="Search bundles..."
            exportFileName="bundles"
            searchFields={[
              "name",
              "amount",
              "max_vehicles",
              "max_passages",
              "description",
            ]}
            actionButtons={
              <Button
                onClick={openCreateDialog}
                className="gradient-maroon hover:opacity-90"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Bundle
              </Button>
            }
          />
        </motion.div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="glass-effect border-0 shadow-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Bundle</DialogTitle>
            <DialogDescription>Create a new pricing bundle</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="b-name">Name *</Label>
              <Input
                id="b-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Daily Small Fleet"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="b-type">Bundle Type *</Label>
              <Select
                value={
                  formData.bundle_type_id ? String(formData.bundle_type_id) : ""
                }
                onValueChange={(v) =>
                  setFormData({ ...formData, bundle_type_id: Number(v) })
                }
              >
                <SelectTrigger id="b-type">
                  <SelectValue placeholder="Select bundle type" />
                </SelectTrigger>
                <SelectContent>
                  {(bundleTypes || []).map((bt) => (
                    <SelectItem key={bt.id} value={String(bt.id)}>
                      {bt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="b-amount">Amount *</Label>
              <Input
                id="b-amount"
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="e.g., 5000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="b-vehicles">Max Vehicles *</Label>
              <Input
                id="b-vehicles"
                type="number"
                value={formData.max_vehicles}
                onChange={(e) =>
                  setFormData({ ...formData, max_vehicles: e.target.value })
                }
                placeholder="e.g., 2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="b-passages">Max Passages</Label>
              <Input
                id="b-passages"
                type="number"
                value={formData.max_passages}
                onChange={(e) =>
                  setFormData({ ...formData, max_passages: e.target.value })
                }
                placeholder="Leave blank for unlimited"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="b-desc">Description</Label>
              <Input
                id="b-desc"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional description"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="b-active">Active</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="b-active"
                  checked={formData.is_active}
                  onCheckedChange={(c) =>
                    setFormData({ ...formData, is_active: c })
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
            <DialogTitle>Edit Bundle</DialogTitle>
            <DialogDescription>Update bundle information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="e-name">Name *</Label>
              <Input
                id="e-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-type">Bundle Type *</Label>
              <Select
                value={
                  formData.bundle_type_id ? String(formData.bundle_type_id) : ""
                }
                onValueChange={(v) =>
                  setFormData({ ...formData, bundle_type_id: Number(v) })
                }
              >
                <SelectTrigger id="e-type">
                  <SelectValue placeholder="Select bundle type" />
                </SelectTrigger>
                <SelectContent>
                  {(bundleTypes || []).map((bt) => (
                    <SelectItem key={bt.id} value={String(bt.id)}>
                      {bt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-amount">Amount *</Label>
              <Input
                id="e-amount"
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-vehicles">Max Vehicles *</Label>
              <Input
                id="e-vehicles"
                type="number"
                value={formData.max_vehicles}
                onChange={(e) =>
                  setFormData({ ...formData, max_vehicles: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-passages">Max Passages</Label>
              <Input
                id="e-passages"
                type="number"
                value={formData.max_passages}
                onChange={(e) =>
                  setFormData({ ...formData, max_passages: e.target.value })
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="e-desc">Description</Label>
              <Input
                id="e-desc"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="e-active">Active</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="e-active"
                  checked={formData.is_active}
                  onCheckedChange={(c) =>
                    setFormData({ ...formData, is_active: c })
                  }
                />
                <span className="text-sm text-muted-foreground">
                  {formData.is_active ? "Active" : "Inactive"}
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
