"use client";

import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  useBundleTypes,
  type BundleType,
  type CreateBundleTypeData,
} from "../hooks/use-bundle-types";
import { formatDate } from "@/utils/date-utils";
import { Plus, Edit, Trash2, FileDown, MoreHorizontal } from "lucide-react";

function getDurationBadge(durationDays: number) {
  switch (durationDays) {
    case 1:
      return { label: "Daily", className: "bg-blue-100 text-blue-700" };
    case 7:
      return { label: "Weekly", className: "bg-green-100 text-green-700" };
    case 30:
      return { label: "Monthly", className: "bg-purple-100 text-purple-700" };
    case 365:
      return { label: "Yearly", className: "bg-orange-100 text-orange-700" };
    default:
      return {
        label: `${durationDays} days`,
        className: "bg-gray-100 text-gray-700",
      };
  }
}

export function BundleTypes() {
  const {
    bundleTypes,
    loading,
    error,
    pagination,
    fetchBundleTypes,
    handlePageChange,
    createBundleType,
    updateBundleType,
    deleteBundleType,
    toggleActiveStatus,
  } = useBundleTypes();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedBundleType, setSelectedBundleType] =
    useState<BundleType | null>(null);
  const [formData, setFormData] = useState<CreateBundleTypeData>({
    name: "",
    duration_days: 30,
    description: "",
    is_active: true,
  });

  // PDF Export Handler
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      // Header
      doc.setFillColor(153, 51, 102);
      doc.rect(0, 0, pageWidth, 30, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, "bold");
      doc.text("Bundle Types Report", margin, 20);

      // Timestamp
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.text(
        `Generated on ${new Date().toLocaleString()}`,
        pageWidth - margin - 80,
        20
      );

      yPosition = 40;

      // Summary boxes
      const summaryBoxWidth = (pageWidth - margin * 2 - 10) / 2;
      const summaryBoxHeight = 25;
      const summaryBoxY = yPosition;

      // Total bundles box
      doc.setFillColor(230, 230, 250);
      doc.rect(margin, summaryBoxY, summaryBoxWidth, summaryBoxHeight, "F");
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text("Total Bundle Types", margin + 5, summaryBoxY + 8);
      doc.setFontSize(16);
      doc.text(bundleTypes.length.toString(), margin + 5, summaryBoxY + 18);

      // Active bundles box
      const activeCount = bundleTypes.filter((b) => b.is_active).length;
      doc.setFillColor(200, 230, 201);
      doc.rect(
        margin + summaryBoxWidth + 5,
        summaryBoxY,
        summaryBoxWidth,
        summaryBoxHeight,
        "F"
      );
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text("Active", margin + summaryBoxWidth + 10, summaryBoxY + 8);
      doc.setFontSize(16);
      doc.text(
        activeCount.toString(),
        margin + summaryBoxWidth + 10,
        summaryBoxY + 18
      );

      yPosition = summaryBoxY + summaryBoxHeight + 10;

      // Prepare table data
      const tableData = bundleTypes.map((bundle) => [
        bundle.id.toString(),
        bundle.name,
        `${bundle.duration_days} days`,
        bundle.description || "-",
        bundle.is_active ? "Active" : "Inactive",
        formatDate(bundle.created_at),
      ]);

      // Generate table
      autoTable(doc, {
        head: [["ID", "Name", "Duration", "Description", "Status", "Created"]],
        body: tableData,
        startY: yPosition,
        margin: margin,
        theme: "grid",
        headStyles: {
          fillColor: [153, 51, 102],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "left",
          valign: "middle",
        },
        bodyStyles: {
          textColor: [0, 0, 0],
          halign: "left",
          valign: "middle",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 15 },
        },
        didDrawPage: (data) => {
          const pageCount = (doc as any).internal.pages.length - 1;
          if (pageCount > 0) {
            doc.setFontSize(10);
            doc.setTextColor(128, 128, 128);
            doc.text(
              `Page ${data.pageNumber} of ${pageCount}`,
              pageWidth - margin - 30,
              pageHeight - 10
            );
          }
        },
      });

      // Save the PDF
      doc.save("bundle-types.pdf");

      // Show modal for 1.5 seconds
      setTimeout(() => setIsExporting(false), 1500);
    } catch (error) {
      setIsExporting(false);
      alert("Error exporting PDF. Check console for details.");
      console.error(error);
    }
  };

  const columns: TableColumn<BundleType>[] = [
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
      key: "duration_days",
      title: "Duration",
      dataIndex: "duration_days",
      searchable: true,
      render: (value: number) => {
        const badge = getDurationBadge(value);
        return <Badge className={badge.className}>{badge.label}</Badge>;
      },
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
                    <AlertDialogTitle>Delete Bundle Type</AlertDialogTitle>
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
      await createBundleType(formData);
      toast.success("Bundle type created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
      await fetchBundleTypes(pagination.currentPage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create bundle type"
      );
    }
  };

  const handleEdit = async () => {
    if (!selectedBundleType) return;
    try {
      await updateBundleType({ id: selectedBundleType.id, ...formData });
      toast.success("Bundle type updated successfully");
      setIsEditDialogOpen(false);
      resetForm();
      await fetchBundleTypes(pagination.currentPage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update bundle type"
      );
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteBundleType(id);
      toast.success("Bundle type deleted successfully");
      await fetchBundleTypes(pagination.currentPage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete bundle type"
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

  const openEditDialog = (bundleType: BundleType) => {
    setSelectedBundleType(bundleType);
    setFormData({
      name: bundleType.name,
      duration_days: bundleType.duration_days,
      description: bundleType.description || "",
      is_active: bundleType.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      duration_days: 30,
      description: "",
      is_active: true,
    });
    setSelectedBundleType(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground">
          Manage bundle types (daily, weekly, monthly, yearly)
        </p>
      </div>

      <DataTable
        dataSource={bundleTypes}
        columns={columns}
        loading={loading}
        searchable={true}
        exportable={true}
        onExportPDF={handleExportPDF}
        searchPlaceholder="Search bundle types..."
        exportFileName="bundle-types"
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
            Add Bundle Type
          </Button>
        }
      />

      {/* Exporting PDF Modal */}
      {isExporting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl p-8 w-full max-w-md mx-4"
          >
            <div className="flex flex-col items-center space-y-4">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <FileDown className="w-12 h-12 text-maroon animate-bounce" />
              </motion.div>

              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Exporting PDF...
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Please wait while we generate your report
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-maroon to-maroon-dark h-full"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "linear",
                  }}
                  style={{ width: "30%" }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Bundle Type</DialogTitle>
            <DialogDescription>Create a new bundle type.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Daily, Weekly, Monthly, Yearly"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="duration_days">Duration (days)</Label>
              <Input
                id="duration_days"
                type="number"
                value={formData.duration_days}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_days: Number(e.target.value || 0),
                  })
                }
                min={1}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Bundle Type</DialogTitle>
            <DialogDescription>
              Update the bundle type information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Daily, Weekly, Monthly, Yearly"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-duration_days">Duration (days)</Label>
              <Input
                id="edit-duration_days"
                type="number"
                value={formData.duration_days}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_days: Number(e.target.value || 0),
                  })
                }
                min={1}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional description"
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
