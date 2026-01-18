"use client";

import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  usePaymentTypes,
  type PaymentType,
  type CreatePaymentTypeData,
} from "../hooks/use-payment-types";
import { getPaymentTypeIcon } from "@/utils/utils";
import { formatDate } from "@/utils/date-utils";
import { Plus, Edit, Trash2, FileDown, MoreHorizontal } from "lucide-react";

export function PaymentTypes() {
  const {
    paymentTypes,
    loading,
    error,
    pagination,
    fetchPaymentTypes,
    handlePageChange,
    createPaymentType,
    updatePaymentType,
    deletePaymentType,
    toggleActiveStatus,
  } = usePaymentTypes();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] =
    useState<PaymentType | null>(null);
  const [formData, setFormData] = useState<CreatePaymentTypeData>({
    name: "",
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
      doc.text("Payment Methods Report", margin, 20);

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

      // Total methods box
      doc.setFillColor(230, 230, 250);
      doc.rect(margin, summaryBoxY, summaryBoxWidth, summaryBoxHeight, "F");
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text("Total Payment Methods", margin + 5, summaryBoxY + 8);
      doc.setFontSize(16);
      doc.text(paymentTypes.length.toString(), margin + 5, summaryBoxY + 18);

      // Active methods box
      const activeCount = paymentTypes.filter((p) => p.is_active).length;
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
      const tableData = paymentTypes.map((type) => [
        type.id.toString(),
        type.name,
        type.description || "-",
        type.is_active ? "Active" : "Inactive",
        formatDate(type.created_at),
      ]);

      // Generate table
      autoTable(doc, {
        head: [["ID", "Name", "Description", "Status", "Created"]],
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
      doc.save("payment-methods.pdf");

      // Show modal for 1.5 seconds
      setTimeout(() => setIsExporting(false), 1500);
    } catch (error) {
      setIsExporting(false);
      alert("Error exporting PDF. Check console for details.");
      console.error(error);
    }
  };

  // Define table columns
  const columns: TableColumn<PaymentType>[] = [
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
      render: (value) => {
        const iconData = getPaymentTypeIcon(value || "");
        return (
          <div className="flex items-center space-x-3">
            <div
              className={`${iconData.bgColor} ${iconData.color} p-2 rounded-full flex-shrink-0`}
            >
              <span className="text-lg">{iconData.icon}</span>
            </div>
            <span className="font-medium truncate">
              {value || "Unnamed Payment Type"}
            </span>
          </div>
        );
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
                    <AlertDialogTitle>Delete Payment Type</AlertDialogTitle>
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
      await createPaymentType(formData);
      toast.success("Payment type created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
      // Refresh the data to show the new payment type
      await fetchPaymentTypes(pagination.currentPage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create payment type"
      );
      // Don't close dialog on error, let user fix the issue
    }
  };

  const handleEdit = async () => {
    if (!selectedPaymentType) return;

    try {
      await updatePaymentType({
        id: selectedPaymentType.id,
        ...formData,
      });
      toast.success("Payment type updated successfully");
      setIsEditDialogOpen(false);
      resetForm();
      // Refresh the data to show the updated payment type
      await fetchPaymentTypes(pagination.currentPage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update payment type"
      );
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePaymentType(id);
      toast.success("Payment type deleted successfully");
      // Refresh the data to reflect the deletion
      await fetchPaymentTypes(pagination.currentPage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete payment type"
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

  const openEditDialog = (paymentType: PaymentType) => {
    setSelectedPaymentType(paymentType);
    setFormData({
      name: paymentType.name,
      description: paymentType.description || "",
      is_active: paymentType.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      is_active: true,
    });
    setSelectedPaymentType(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground">
          Manage different payment methods accepted by the parking system
        </p>
      </div>

      <DataTable
        dataSource={paymentTypes}
        columns={columns}
        loading={loading}
        searchable={true}
        exportable={true}
        onExportPDF={handleExportPDF}
        searchPlaceholder="Search payment types..."
        exportFileName="payment-types"
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
            Add Payment Type
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
            <DialogTitle>Add Payment Type</DialogTitle>
            <DialogDescription>
              Create a new payment type for the parking system.
            </DialogDescription>
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
                placeholder="e.g., Cash, Card, Mobile Money"
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
            <DialogTitle>Edit Payment Type</DialogTitle>
            <DialogDescription>
              Update the payment type information.
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
                placeholder="e.g., Cash, Card, Mobile Money"
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


