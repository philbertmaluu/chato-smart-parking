"use client";

import { useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTable, type TableColumn } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Mail,
  Phone,
} from "lucide-react";
import { formatDate } from "@/utils/date-utils";

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
  createdAt: string;
  avatar?: string;
};

const mockCustomers: Customer[] = [
  {
    id: "C-001",
    name: "Alice Johnson",
    email: "alice.johnson@example.com",
    phone: "+255 712 000 111",
    status: "active",
    createdAt: "2024-01-12",
    avatar: "/placeholder-user.jpg",
  },
  {
    id: "C-002",
    name: "Brian Lee",
    email: "brian.lee@example.com",
    phone: "+255 713 222 333",
    status: "inactive",
    createdAt: "2024-01-05",
    avatar: "/placeholder-user.jpg",
  },
  {
    id: "C-003",
    name: "Christine Adams",
    email: "christine.adams@example.com",
    phone: "+255 714 444 555",
    status: "active",
    createdAt: "2024-01-18",
    avatar: "/placeholder-user.jpg",
  },
];

function getStatusBadgeClasses(status: Customer["status"]) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
    case "inactive":
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
  }
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "active" as Customer["status"],
  });

  const columns: TableColumn<Customer>[] = useMemo(
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
        key: "name",
        title: "Customer",
        dataIndex: "name",
        searchable: true,
        render: (_, record) => (
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={record.avatar} />
              <AvatarFallback>
                {record.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{record.name}</p>
              <p className="text-xs text-muted-foreground">ID: {record.id}</p>
            </div>
          </div>
        ),
      },
      {
        key: "contact",
        title: "Contact",
        searchable: true,
        render: (_, record) => (
          <div className="space-y-1">
            <div className="flex items-center text-sm">
              <Mail className="w-3 h-3 mr-2" /> {record.email}
            </div>
            <div className="flex items-center text-sm">
              <Phone className="w-3 h-3 mr-2" /> {record.phone}
            </div>
          </div>
        ),
      },
      {
        key: "status",
        title: "Status",
        dataIndex: "status",
        searchable: true,
        render: (value: Customer["status"]) => (
          <Badge className={getStatusBadgeClasses(value)}>{value}</Badge>
        ),
      },
      {
        key: "createdAt",
        title: "Joined",
        dataIndex: "createdAt",
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
    []
  );

  const openCreateDialog = () => {
    setFormData({ name: "", email: "", phone: "", status: "active" });
    setShowCreateDialog(true);
  };

  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      status: customer.status,
    });
    setShowEditDialog(true);
  };

  const handleCreate = () => {
    setLoading(true);
    setTimeout(() => {
      setCustomers((prev) => [
        {
          id: `C-${(prev.length + 1).toString().padStart(3, "0")}`,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          status: formData.status,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setShowCreateDialog(false);
      setLoading(false);
    }, 400);
  };

  const handleEdit = () => {
    if (!selectedCustomer) return;
    setLoading(true);
    setTimeout(() => {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === selectedCustomer.id ? { ...c, ...formData } : c
        )
      );
      setShowEditDialog(false);
      setSelectedCustomer(null);
      setLoading(false);
    }, 400);
  };

  const handleDelete = (record: Customer) => {
    setCustomers((prev) => prev.filter((c) => c.id !== record.id));
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
            <h1 className="text-3xl font-bold text-gradient">Customers</h1>
            <p className="text-muted-foreground mt-2">
              Manage the list of registered customers
            </p>
          </div>
        </motion.div>

        {/* Customers Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <DataTable
            dataSource={customers}
            columns={columns}
            loading={loading}
            exportable
            searchable
            searchPlaceholder="Search customers..."
            exportFileName="customers"
            searchFields={["name", "email", "phone", "status"]}
            actionButtons={
              <Button
                onClick={openCreateDialog}
                className="gradient-maroon hover:opacity-90"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Customer
              </Button>
            }
          />
        </motion.div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="glass-effect border-0 shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>Create a new customer profile</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
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
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+255 712 345 678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: Customer["status"]) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
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
              disabled={loading}
            >
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="glass-effect border-0 shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update customer information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email Address *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number *</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+255 712 345 678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: Customer["status"]) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="edit-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              className="gradient-maroon hover:opacity-90"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
