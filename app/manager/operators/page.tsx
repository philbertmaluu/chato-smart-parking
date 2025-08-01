"use client";

import { useState, useMemo } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/components/language-provider";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Filter,
  UserPlus,
  Shield,
  MapPin,
  Clock,
  Activity,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data for operators
const mockOperators = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@parking.com",
    phone: "+255 712 345 678",
    gate: "Gate A",
    status: "active",
    joinDate: "2024-01-15",
    lastActive: "2024-01-20 14:30:00",
    totalVehicles: 156,
    totalRevenue: "Tsh. 780",
    avatar: "/placeholder-user.jpg",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@parking.com",
    phone: "+255 713 456 789",
    gate: "Gate B",
    status: "active",
    joinDate: "2024-01-10",
    lastActive: "2024-01-20 15:45:00",
    totalVehicles: 142,
    totalRevenue: "Tsh. 710",
    avatar: "/placeholder-user.jpg",
  },
  {
    id: "3",
    name: "Mike Johnson",
    email: "mike.johnson@parking.com",
    phone: "+255 714 567 890",
    gate: "Gate C",
    status: "inactive",
    joinDate: "2024-01-05",
    lastActive: "2024-01-19 12:15:00",
    totalVehicles: 168,
    totalRevenue: "Tsh. 840",
    avatar: "/placeholder-user.jpg",
  },
  {
    id: "4",
    name: "Sarah Wilson",
    email: "sarah.wilson@parking.com",
    phone: "+255 715 678 901",
    gate: "Gate D",
    status: "active",
    joinDate: "2024-01-12",
    lastActive: "2024-01-20 16:20:00",
    totalVehicles: 134,
    totalRevenue: "Tsh. 670",
    avatar: "/placeholder-user.jpg",
  },
];

const gates = [
  { id: "A", name: "Gate A", location: "Main Entrance" },
  { id: "B", name: "Gate B", location: "East Side" },
  { id: "C", name: "Gate C", location: "West Side" },
  { id: "D", name: "Gate D", location: "Back Entrance" },
];

export default function OperatorsManagement() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gateFilter, setGateFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form state for creating/editing operators
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gate: "",
    password: "",
    confirmPassword: "",
  });

  // Filter operators based on search and filters
  const filteredOperators = useMemo(() => {
    return mockOperators.filter((operator) => {
      const matchesSearch =
        operator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        operator.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        operator.phone.includes(searchTerm);

      const matchesStatus =
        statusFilter === "all" || operator.status === statusFilter;

      const matchesGate = gateFilter === "all" || operator.gate === gateFilter;

      return matchesSearch && matchesStatus && matchesGate;
    });
  }, [searchTerm, statusFilter, gateFilter]);

  // Calculate analytics
  const analytics = useMemo(() => {
    const totalOperators = mockOperators.length;
    const activeOperators = mockOperators.filter(
      (op) => op.status === "active"
    ).length;
    const totalVehicles = mockOperators.reduce(
      (sum, op) => sum + op.totalVehicles,
      0
    );
    const totalRevenue = mockOperators.reduce(
      (sum, op) => sum + parseFloat(op.totalRevenue.replace("Tsh. ", "")),
      0
    );

    return {
      totalOperators,
      activeOperators,
      totalVehicles,
      totalRevenue: totalRevenue.toFixed(0),
    };
  }, []);

  const handleCreateOperator = () => {
    // Validate form data
    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.gate ||
      !formData.password
    ) {
      alert("Please fill in all required fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    // Here you would typically make an API call to create the operator
    console.log("Creating operator:", formData);

    // Reset form and close dialog
    setFormData({
      name: "",
      email: "",
      phone: "",
      gate: "",
      password: "",
      confirmPassword: "",
    });
    setShowCreateDialog(false);
  };

  const handleEditOperator = () => {
    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.gate
    ) {
      alert("Please fill in all required fields");
      return;
    }

    // Here you would typically make an API call to update the operator
    console.log("Updating operator:", selectedOperator.id, formData);

    setShowEditDialog(false);
    setSelectedOperator(null);
  };

  const handleDeleteOperator = () => {
    // Here you would typically make an API call to delete the operator
    console.log("Deleting operator:", selectedOperator.id);

    setShowDeleteDialog(false);
    setSelectedOperator(null);
  };

  const openEditDialog = (operator: any) => {
    setSelectedOperator(operator);
    setFormData({
      name: operator.name,
      email: operator.email,
      phone: operator.phone,
      gate: operator.gate,
      password: "",
      confirmPassword: "",
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (operator: any) => {
    setSelectedOperator(operator);
    setShowDeleteDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "inactive":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const getGateColor = (gate: string) => {
    switch (gate) {
      case "Gate A":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "Gate B":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "Gate C":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300";
      case "Gate D":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
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
            <h1 className="text-3xl font-bold text-gradient">
              Operators Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage parking operators and gate assignments
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="gradient-maroon hover:opacity-90"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Operator
          </Button>
        </motion.div>

        {/* Analytics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <Card className="glass-effect border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Operators
                  </p>
                  <p className="text-2xl font-bold">
                    {analytics.totalOperators}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Operators
                  </p>
                  <p className="text-2xl font-bold">
                    {analytics.activeOperators}
                  </p>
                </div>
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <Activity className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Vehicles
                  </p>
                  <p className="text-2xl font-bold">
                    {analytics.totalVehicles}
                  </p>
                </div>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold">
                    Tsh. {analytics.totalRevenue}
                  </p>
                </div>
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search operators by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={gateFilter} onValueChange={setGateFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Gate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Gates</SelectItem>
              {gates.map((gate) => (
                <SelectItem key={gate.id} value={gate.name}>
                  {gate.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Operators Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Card className="glass-effect border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Operators</CardTitle>
              <CardDescription>
                Showing {filteredOperators.length} of {mockOperators.length}{" "}
                operators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Operator</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Gate Assignment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOperators.map((operator) => (
                      <TableRow key={operator.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={operator.avatar} />
                              <AvatarFallback>
                                {operator.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{operator.name}</p>
                              <p className="text-sm text-muted-foreground">
                                ID: {operator.id}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{operator.email}</p>
                            <p className="text-sm text-muted-foreground">
                              {operator.phone}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getGateColor(operator.gate)}>
                            <MapPin className="w-3 h-3 mr-1" />
                            {operator.gate}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(operator.status)}>
                            {operator.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {operator.totalVehicles} vehicles
                            </p>
                            <p className="text-sm text-green-600">
                              {operator.totalRevenue}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {new Date(operator.lastActive).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(operator.lastActive).toLocaleTimeString()}
                          </p>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => openEditDialog(operator)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Operator
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => openDeleteDialog(operator)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Operator
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Create Operator Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="glass-effect border-0 shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Operator</DialogTitle>
            <DialogDescription>
              Create a new operator account and assign them to a gate
            </DialogDescription>
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
              <Label htmlFor="gate">Gate Assignment *</Label>
              <Select
                value={formData.gate}
                onValueChange={(value) =>
                  setFormData({ ...formData, gate: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a gate" />
                </SelectTrigger>
                <SelectContent>
                  {gates.map((gate) => (
                    <SelectItem key={gate.id} value={gate.name}>
                      {gate.name} - {gate.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Enter password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                placeholder="Confirm password"
              />
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
              onClick={handleCreateOperator}
              className="gradient-maroon hover:opacity-90"
            >
              Create Operator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Operator Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="glass-effect border-0 shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Operator</DialogTitle>
            <DialogDescription>
              Update operator information and gate assignment
            </DialogDescription>
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
              <Label htmlFor="edit-gate">Gate Assignment *</Label>
              <Select
                value={formData.gate}
                onValueChange={(value) =>
                  setFormData({ ...formData, gate: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a gate" />
                </SelectTrigger>
                <SelectContent>
                  {gates.map((gate) => (
                    <SelectItem key={gate.id} value={gate.name}>
                      {gate.name} - {gate.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">New Password (optional)</Label>
              <div className="relative">
                <Input
                  id="edit-password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Leave blank to keep current password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditOperator}
              className="gradient-maroon hover:opacity-90"
            >
              Update Operator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="glass-effect border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle>Delete Operator</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedOperator?.name}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleDeleteOperator} variant="destructive">
              Delete Operator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
