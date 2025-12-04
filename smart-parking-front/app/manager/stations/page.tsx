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
import { formatDateTime } from "@/utils/date-utils";
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Building2,
  Users,
  Car,
  DollarSign,
  Clock,
  Activity,
  MoreHorizontal,
  Globe,
  Phone,
  Mail,
  Settings,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data for parking stations
const mockStations = [
  {
    id: "1",
    name: "Downtown Central Parking",
    location: "Dar es Salaam, Tanzania",
    address: "123 City Center, Dar es Salaam",
    region: "Dar es Salaam",
    status: "active",
    totalGates: 4,
    totalSpots: 200,
    occupiedSpots: 156,
    availableSpots: 44,
    operators: 8,
    todayRevenue: "Tsh. 1,247",
    todayVehicles: 324,
    contact: {
      phone: "+255 22 123 4567",
      email: "downtown@parking.com",
      manager: "John Manager",
    },
    features: [
      "24/7 Access",
      "Security Cameras",
      "Payment Cards",
      "Mobile App",
    ],
    alerts: [],
    lastUpdated: "2024-01-20 16:30:00",
  },
  {
    id: "2",
    name: "Airport Express Parking",
    location: "Dar es Salaam, Tanzania",
    address: "456 Airport Road, Dar es Salaam",
    region: "Dar es Salaam",
    status: "active",
    totalGates: 3,
    totalSpots: 150,
    occupiedSpots: 142,
    availableSpots: 8,
    operators: 6,
    todayRevenue: "Tsh. 890",
    todayVehicles: 245,
    contact: {
      phone: "+255 22 234 5678",
      email: "airport@parking.com",
      manager: "Sarah Wilson",
    },
    features: [
      "Airport Shuttle",
      "Long-term Parking",
      "Security Cameras",
      "Payment Cards",
    ],
    alerts: ["High occupancy - 94% full"],
    lastUpdated: "2024-01-20 15:45:00",
  },
  {
    id: "3",
    name: "Mall Plaza Parking",
    location: "Arusha, Tanzania",
    address: "789 Mall Street, Arusha",
    region: "Arusha",
    status: "active",
    totalGates: 2,
    totalSpots: 100,
    occupiedSpots: 78,
    availableSpots: 22,
    operators: 4,
    todayRevenue: "Tsh. 456",
    todayVehicles: 189,
    contact: {
      phone: "+255 27 345 6789",
      email: "mall@parking.com",
      manager: "Mike Johnson",
    },
    features: ["Mall Access", "Security Cameras", "Payment Cards"],
    alerts: [],
    lastUpdated: "2024-01-20 14:20:00",
  },
  {
    id: "4",
    name: "University Campus Parking",
    location: "Mwanza, Tanzania",
    address: "321 University Avenue, Mwanza",
    region: "Mwanza",
    status: "maintenance",
    totalGates: 2,
    totalSpots: 80,
    occupiedSpots: 0,
    availableSpots: 80,
    operators: 0,
    todayRevenue: "Tsh. 0",
    todayVehicles: 0,
    contact: {
      phone: "+255 28 456 7890",
      email: "university@parking.com",
      manager: "Lisa Brown",
    },
    features: ["Student Discount", "Security Cameras", "Payment Cards"],
    alerts: ["Under maintenance", "No operators assigned"],
    lastUpdated: "2024-01-20 12:00:00",
  },
  {
    id: "5",
    name: "Beach Resort Parking",
    location: "Zanzibar, Tanzania",
    address: "654 Beach Road, Zanzibar",
    region: "Zanzibar",
    status: "active",
    totalGates: 1,
    totalSpots: 60,
    occupiedSpots: 45,
    availableSpots: 15,
    operators: 2,
    todayRevenue: "Tsh. 234",
    todayVehicles: 98,
    contact: {
      phone: "+255 24 567 8901",
      email: "beach@parking.com",
      manager: "David Lee",
    },
    features: ["Beach Access", "Security Cameras", "Payment Cards"],
    alerts: ["Medium occupancy - 75% full"],
    lastUpdated: "2024-01-20 16:15:00",
  },
  {
    id: "6",
    name: "Industrial Zone Parking",
    location: "Tanga, Tanzania",
    address: "987 Industrial Park, Tanga",
    region: "Tanga",
    status: "inactive",
    totalGates: 1,
    totalSpots: 40,
    occupiedSpots: 0,
    availableSpots: 40,
    operators: 0,
    todayRevenue: "Tsh. 0",
    todayVehicles: 0,
    contact: {
      phone: "+255 27 678 9012",
      email: "industrial@parking.com",
      manager: "Robert Chen",
    },
    features: ["Truck Parking", "Security Cameras", "Payment Cards"],
    alerts: ["Station inactive", "No operators assigned"],
    lastUpdated: "2024-01-19 18:00:00",
  },
];

const regions = [
  "All Regions",
  "Dar es Salaam",
  "Arusha",
  "Mwanza",
  "Zanzibar",
  "Tanga",
  "Dodoma",
  "Mbeya",
];

export default function StationsManagement() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState("All Regions");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedStation, setSelectedStation] = useState<any>(null);

  // Form state for creating/editing stations
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    address: "",
    region: "",
    phone: "",
    email: "",
    manager: "",
    totalGates: "",
    totalSpots: "",
    features: [] as string[],
  });

  // Filter stations based on search and filters
  const filteredStations = useMemo(() => {
    return mockStations.filter((station) => {
      const matchesSearch =
        station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.contact.manager
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesRegion =
        regionFilter === "All Regions" || station.region === regionFilter;

      const matchesStatus =
        statusFilter === "all" || station.status === statusFilter;

      return matchesSearch && matchesRegion && matchesStatus;
    });
  }, [searchTerm, regionFilter, statusFilter]);

  // Calculate analytics
  const analytics = useMemo(() => {
    const totalStations = mockStations.length;
    const activeStations = mockStations.filter(
      (s) => s.status === "active"
    ).length;
    const totalSpots = mockStations.reduce((sum, s) => sum + s.totalSpots, 0);
    const totalRevenue = mockStations.reduce(
      (sum, s) =>
        sum + parseFloat(s.todayRevenue.replace("Tsh. ", "").replace(",", "")),
      0
    );

    return {
      totalStations,
      activeStations,
      totalSpots,
      totalRevenue: totalRevenue.toFixed(0),
    };
  }, []);

  const handleCreateStation = () => {
    // Validate form data
    if (
      !formData.name ||
      !formData.location ||
      !formData.address ||
      !formData.region
    ) {
      alert("Please fill in all required fields");
      return;
    }

    // Here you would typically make an API call to create the station
    console.log("Creating station:", formData);

    // Reset form and close dialog
    setFormData({
      name: "",
      location: "",
      address: "",
      region: "",
      phone: "",
      email: "",
      manager: "",
      totalGates: "",
      totalSpots: "",
      features: [],
    });
    setShowCreateDialog(false);
  };

  const handleEditStation = () => {
    if (
      !formData.name ||
      !formData.location ||
      !formData.address ||
      !formData.region
    ) {
      alert("Please fill in all required fields");
      return;
    }

    // Here you would typically make an API call to update the station
    console.log("Updating station:", selectedStation.id, formData);

    setShowEditDialog(false);
    setSelectedStation(null);
  };

  const handleDeleteStation = () => {
    // Here you would typically make an API call to delete the station
    console.log("Deleting station:", selectedStation.id);

    setShowDeleteDialog(false);
    setSelectedStation(null);
  };

  const openEditDialog = (station: any) => {
    setSelectedStation(station);
    setFormData({
      name: station.name,
      location: station.location,
      address: station.address,
      region: station.region,
      phone: station.contact.phone,
      email: station.contact.email,
      manager: station.contact.manager,
      totalGates: station.totalGates.toString(),
      totalSpots: station.totalSpots.toString(),
      features: station.features,
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (station: any) => {
    setSelectedStation(station);
    setShowDeleteDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "inactive":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "maintenance":
        return <AlertCircle className="w-4 h-4" />;
      case "inactive":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getCapacityPercentage = (occupied: number, total: number) => {
    return Math.round((occupied / total) * 100);
  };

  const getCapacityColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 75) return "text-yellow-600";
    return "text-green-600";
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
              Parking Stations
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage multiple parking locations across different regions
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="gradient-maroon hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Station
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
                    Total Stations
                  </p>
                  <p className="text-2xl font-bold">
                    {analytics.totalStations}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Stations
                  </p>
                  <p className="text-2xl font-bold">
                    {analytics.activeStations}
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
                    Total Spots
                  </p>
                  <p className="text-2xl font-bold">{analytics.totalSpots}</p>
                </div>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                  <Car className="w-5 h-5 text-purple-600" />
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
                  <DollarSign className="w-5 h-5 text-orange-600" />
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
              placeholder="Search stations by name, location, or manager..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((region) => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Stations Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {filteredStations.map((station, index) => (
            <motion.div
              key={station.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
            >
              <Card className="glass-effect border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">
                          {station.name}
                        </CardTitle>
                        <CardDescription className="flex items-center space-x-2">
                          <Globe className="w-4 h-4" />
                          <span>{station.location}</span>
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(station.status)}>
                      {getStatusIcon(station.status)}
                      <span className="ml-1">{station.status}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Contact Info */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {station.contact.manager
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {station.contact.manager}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Manager
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {station.contact.phone}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {station.contact.email}
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-2xl font-bold">
                          {station.totalGates}
                        </p>
                        <p className="text-sm text-muted-foreground">Gates</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-2xl font-bold">
                          {station.operators}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Operators
                        </p>
                      </div>
                    </div>

                    {/* Capacity */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Capacity</span>
                        <span
                          className={getCapacityColor(
                            getCapacityPercentage(
                              station.occupiedSpots,
                              station.totalSpots
                            )
                          )}
                        >
                          {getCapacityPercentage(
                            station.occupiedSpots,
                            station.totalSpots
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            getCapacityPercentage(
                              station.occupiedSpots,
                              station.totalSpots
                            ) >= 90
                              ? "bg-red-500"
                              : getCapacityPercentage(
                                  station.occupiedSpots,
                                  station.totalSpots
                                ) >= 75
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{
                            width: `${getCapacityPercentage(
                              station.occupiedSpots,
                              station.totalSpots
                            )}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{station.occupiedSpots} occupied</span>
                        <span>{station.availableSpots} available</span>
                      </div>
                    </div>

                    {/* Today's Performance */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">
                          {station.todayRevenue}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Today's Revenue
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">
                          {station.todayVehicles}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Vehicles Today
                        </p>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-1">
                      {station.features
                        .slice(0, 3)
                        .map((feature, featureIndex) => (
                          <Badge
                            key={featureIndex}
                            variant="outline"
                            className="text-xs"
                          >
                            {feature}
                          </Badge>
                        ))}
                      {station.features.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{station.features.length - 3} more
                        </Badge>
                      )}
                    </div>

                    {/* Alerts */}
                    {station.alerts.length > 0 && (
                      <div className="space-y-2">
                        {station.alerts.map((alert, alertIndex) => (
                          <div
                            key={alertIndex}
                            className="flex items-center space-x-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
                          >
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm text-yellow-800 dark:text-yellow-200">
                              {alert}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Last updated: {formatDateTime(station.lastUpdated)}
                      </p>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => openEditDialog(station)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Station
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="w-4 h-4 mr-2" />
                            Manage Gates
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Users className="w-4 h-4 mr-2" />
                            Manage Operators
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(station)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Station
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Create Station Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="glass-effect border-0 shadow-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Parking Station</DialogTitle>
            <DialogDescription>
              Create a new parking station in a specific region
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Station Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter station name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Region *</Label>
              <Select
                value={formData.region}
                onValueChange={(value) =>
                  setFormData({ ...formData, region: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.slice(1).map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">City/Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="e.g., Dar es Salaam, Tanzania"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Enter full address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+255 22 123 4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="station@parking.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager">Manager Name</Label>
              <Input
                id="manager"
                value={formData.manager}
                onChange={(e) =>
                  setFormData({ ...formData, manager: e.target.value })
                }
                placeholder="Enter manager name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalGates">Number of Gates</Label>
              <Input
                id="totalGates"
                type="number"
                value={formData.totalGates}
                onChange={(e) =>
                  setFormData({ ...formData, totalGates: e.target.value })
                }
                placeholder="4"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalSpots">Total Parking Spots</Label>
              <Input
                id="totalSpots"
                type="number"
                value={formData.totalSpots}
                onChange={(e) =>
                  setFormData({ ...formData, totalSpots: e.target.value })
                }
                placeholder="200"
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
              onClick={handleCreateStation}
              className="gradient-maroon hover:opacity-90"
            >
              Create Station
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Station Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="glass-effect border-0 shadow-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Parking Station</DialogTitle>
            <DialogDescription>
              Update station information and settings
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Station Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter station name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-region">Region *</Label>
              <Select
                value={formData.region}
                onValueChange={(value) =>
                  setFormData({ ...formData, region: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.slice(1).map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-location">City/Location *</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="e.g., Dar es Salaam, Tanzania"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address *</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Enter full address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+255 22 123 4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="station@parking.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-manager">Manager Name</Label>
              <Input
                id="edit-manager"
                value={formData.manager}
                onChange={(e) =>
                  setFormData({ ...formData, manager: e.target.value })
                }
                placeholder="Enter manager name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-totalGates">Number of Gates</Label>
              <Input
                id="edit-totalGates"
                type="number"
                value={formData.totalGates}
                onChange={(e) =>
                  setFormData({ ...formData, totalGates: e.target.value })
                }
                placeholder="4"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-totalSpots">Total Parking Spots</Label>
              <Input
                id="edit-totalSpots"
                type="number"
                value={formData.totalSpots}
                onChange={(e) =>
                  setFormData({ ...formData, totalSpots: e.target.value })
                }
                placeholder="200"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditStation}
              className="gradient-maroon hover:opacity-90"
            >
              Update Station
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="glass-effect border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle>Delete Parking Station</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedStation?.name}? This
              action cannot be undone and will affect all associated gates and
              operators.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleDeleteStation} variant="destructive">
              Delete Station
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
