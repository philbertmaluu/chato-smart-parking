"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { RouteGuard } from "@/components/auth/route-guard";
import { useProfile } from "@/hooks/use-profile";
import { motion } from "framer-motion";
import { toast } from "sonner";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/components/language-provider";
import {
  Settings,
  Car,
  Clock,
  User,
  Save,
  Plus,
  Trash2,
  Edit,
  DollarSign,
  Building2,
  Calendar,
  Bell,
  Shield,
  Palette,
  Globe,
  Smartphone,
  Mail,
  MapPin,
  CreditCard,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

// Mock data for system settings
const mockVehicleTypes = [
  {
    id: "1",
    name: "Car",
    icon: "🚗",
    baseRate: 5.0,
    description: "Standard passenger vehicles",
    isActive: true,
  },
  {
    id: "2",
    name: "Motorcycle",
    icon: "🏍️",
    baseRate: 3.0,
    description: "Two-wheeled vehicles",
    isActive: true,
  },
  {
    id: "3",
    name: "Truck",
    icon: "🚛",
    baseRate: 8.0,
    description: "Commercial vehicles and trucks",
    isActive: true,
  },
  {
    id: "4",
    name: "Bus",
    icon: "🚌",
    baseRate: 12.0,
    description: "Public transport and large vehicles",
    isActive: false,
  },
];

const mockOperatingHours = {
  monday: { open: "06:00", close: "22:00", isOpen: true },
  tuesday: { open: "06:00", close: "22:00", isOpen: true },
  wednesday: { open: "06:00", close: "22:00", isOpen: true },
  thursday: { open: "06:00", close: "22:00", isOpen: true },
  friday: { open: "06:00", close: "23:00", isOpen: true },
  saturday: { open: "07:00", close: "23:00", isOpen: true },
  sunday: { open: "08:00", close: "20:00", isOpen: true },
};

const mockSystemSettings = {
  currency: "Tsh.",
  timezone: "Africa/Dar_es_Salaam",
  autoLogout: 30,
  notifications: {
    email: true,
    sms: false,
    push: true,
  },
  security: {
    requirePasswordChange: 90,
    maxLoginAttempts: 5,
    sessionTimeout: 30,
  },
};

export default function SettingsPage() {
  const { t } = useLanguage();
  const {
    user,
    updateProfile,
    changePassword,
    isUpdating,
    isChangingPassword,
  } = useProfile();
  const [activeTab, setActiveTab] = useState("system");
  const [vehicleTypes, setVehicleTypes] = useState(mockVehicleTypes);
  const [operatingHours, setOperatingHours] = useState(mockOperatingHours);
  const [systemSettings, setSystemSettings] = useState(mockSystemSettings);
  const [isEditingVehicle, setIsEditingVehicle] = useState<string | null>(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    phone: "",
    address: "",
    gender: "",
    date_of_birth: "",
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize profile data when user is loaded
  useEffect(() => {
    if (user && mounted) {
      setProfileData({
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        gender: user.gender || "",
        date_of_birth: user.date_of_birth
          ? user.date_of_birth.split("T")[0]
          : "",
      });
    }
  }, [user, mounted]);

  const handleSaveSettings = () => {
    // Simulate saving settings
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  const handleUpdateProfile = async () => {
    const success = await updateProfile(profileData);
    if (success) {
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      toast.error("New passwords do not match");
      return;
    }

    const success = await changePassword(passwordData);
    if (success) {
      // Reset password form
      setPasswordData({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      });
    }
  };

  const handleVehicleTypeEdit = (id: string) => {
    setIsEditingVehicle(id);
  };

  const handleVehicleTypeSave = (id: string, updatedData: any) => {
    setVehicleTypes((prev) =>
      prev.map((vt) => (vt.id === id ? { ...vt, ...updatedData } : vt))
    );
    setIsEditingVehicle(null);
  };

  const handleVehicleTypeDelete = (id: string) => {
    setVehicleTypes((prev) => prev.filter((vt) => vt.id !== id));
  };

  const handleAddVehicleType = () => {
    const newVehicleType = {
      id: Date.now().toString(),
      name: "New Vehicle Type",
      icon: "🚗",
      baseRate: 5.0,
      description: "New vehicle type description",
      isActive: true,
    };
    setVehicleTypes((prev) => [...prev, newVehicleType]);
    setIsEditingVehicle(newVehicleType.id);
  };

  const daysOfWeek = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ];

  return (
    <RouteGuard>
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
              <h1 className="text-3xl font-bold text-gradient">Settings</h1>
              <p className="text-muted-foreground mt-2">
                Manage system configuration and user preferences
              </p>
            </div>
            <Button
              onClick={handleSaveSettings}
              className="gradient-maroon hover:opacity-90"
            >
              <Save className="w-4 h-4 mr-2" />
              Save All Changes
            </Button>
          </motion.div>

          {/* Success Message */}
          {showSaveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center space-x-2"
            >
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-800 dark:text-green-200 font-medium">
                Settings saved successfully!
              </span>
            </motion.div>
          )}

          {/* Settings Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="system"
                  className="flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>System Settings</span>
                </TabsTrigger>
                <TabsTrigger
                  value="profile"
                  className="flex items-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>Profile Settings</span>
                </TabsTrigger>
              </TabsList>

              {/* System Settings Tab */}
              <TabsContent value="system" className="space-y-6">
                {/* Vehicle Types */}
                <Card className="glass-effect border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Car className="w-5 h-5" />
                      <span>Vehicle Types & Pricing</span>
                    </CardTitle>
                    <CardDescription>
                      Configure vehicle types and their base parking rates
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Vehicle Types</h3>
                      <Button
                        onClick={handleAddVehicleType}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Vehicle Type
                      </Button>
                    </div>

                    <div className="grid gap-4">
                      {vehicleTypes.map((vehicleType) => (
                        <div
                          key={vehicleType.id}
                          className="border rounded-lg p-4 flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="text-2xl">{vehicleType.icon}</div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium">
                                  {vehicleType.name}
                                </h4>
                                <Badge
                                  variant={
                                    vehicleType.isActive
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {vehicleType.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {vehicleType.description}
                              </p>
                              <p className="text-sm font-medium text-green-600">
                                Base Rate: Tsh.{" "}
                                {vehicleType.baseRate.toFixed(2)}
                                /hour
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleVehicleTypeEdit(vehicleType.id)
                              }
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleVehicleTypeDelete(vehicleType.id)
                              }
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* System Configuration */}
                <Card className="glass-effect border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="w-5 h-5" />
                      <span>System Configuration</span>
                    </CardTitle>
                    <CardDescription>
                      General system settings and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <Select
                          value={systemSettings.currency}
                          onValueChange={(value) =>
                            setSystemSettings((prev) => ({
                              ...prev,
                              currency: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Tsh.">
                              Tanzanian Shilling (Tsh.)
                            </SelectItem>
                            <SelectItem value="$">US Dollar ($)</SelectItem>
                            <SelectItem value="€">Euro (€)</SelectItem>
                            <SelectItem value="£">British Pound (£)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Timezone</Label>
                        <Select
                          value={systemSettings.timezone}
                          onValueChange={(value) =>
                            setSystemSettings((prev) => ({
                              ...prev,
                              timezone: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Africa/Dar_es_Salaam">
                              Dar es Salaam (GMT+3)
                            </SelectItem>
                            <SelectItem value="Africa/Nairobi">
                              Nairobi (GMT+3)
                            </SelectItem>
                            <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Auto Logout (minutes)</Label>
                        <Input
                          type="number"
                          value={systemSettings.autoLogout}
                          onChange={(e) =>
                            setSystemSettings((prev) => ({
                              ...prev,
                              autoLogout: parseInt(e.target.value),
                            }))
                          }
                          min="5"
                          max="120"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Session Timeout (minutes)</Label>
                        <Input
                          type="number"
                          value={systemSettings.security.sessionTimeout}
                          onChange={(e) =>
                            setSystemSettings((prev) => ({
                              ...prev,
                              security: {
                                ...prev.security,
                                sessionTimeout: parseInt(e.target.value),
                              },
                            }))
                          }
                          min="5"
                          max="60"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-semibold">Notifications</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4" />
                            <span>Email Notifications</span>
                          </div>
                          <Switch
                            checked={systemSettings.notifications.email}
                            onCheckedChange={(checked) =>
                              setSystemSettings((prev) => ({
                                ...prev,
                                notifications: {
                                  ...prev.notifications,
                                  email: checked,
                                },
                              }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Smartphone className="w-4 h-4" />
                            <span>SMS Notifications</span>
                          </div>
                          <Switch
                            checked={systemSettings.notifications.sms}
                            onCheckedChange={(checked) =>
                              setSystemSettings((prev) => ({
                                ...prev,
                                notifications: {
                                  ...prev.notifications,
                                  sms: checked,
                                },
                              }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Bell className="w-4 h-4" />
                            <span>Push Notifications</span>
                          </div>
                          <Switch
                            checked={systemSettings.notifications.push}
                            onCheckedChange={(checked) =>
                              setSystemSettings((prev) => ({
                                ...prev,
                                notifications: {
                                  ...prev.notifications,
                                  push: checked,
                                },
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Profile Settings Tab */}
              <TabsContent value="profile" className="space-y-6">
                {/* Personal Information */}
                <Card className="glass-effect border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="w-5 h-5" />
                      <span>Personal Information</span>
                    </CardTitle>
                    <CardDescription>
                      Update your personal details and contact information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Username</Label>
                        <Input
                          value={profileData.username}
                          onChange={(e) =>
                            setProfileData((prev) => ({
                              ...prev,
                              username: e.target.value,
                            }))
                          }
                          placeholder="Enter your username"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email Address</Label>
                        <Input
                          type="email"
                          value={profileData.email}
                          onChange={(e) =>
                            setProfileData((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          placeholder="Enter your email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input
                          value={profileData.phone}
                          onChange={(e) =>
                            setProfileData((prev) => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                          placeholder="Enter your phone number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Gender</Label>
                        <Select
                          value={profileData.gender}
                          onValueChange={(value) =>
                            setProfileData((prev) => ({
                              ...prev,
                              gender: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Date of Birth</Label>
                        <Input
                          type="date"
                          value={profileData.date_of_birth}
                          onChange={(e) =>
                            setProfileData((prev) => ({
                              ...prev,
                              date_of_birth: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Address</Label>
                        <Input
                          value={profileData.address}
                          onChange={(e) =>
                            setProfileData((prev) => ({
                              ...prev,
                              address: e.target.value,
                            }))
                          }
                          placeholder="Enter your address"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleUpdateProfile}
                        disabled={isUpdating}
                        className="gradient-maroon hover:opacity-90"
                      >
                        {isUpdating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Update Profile
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Security Settings */}
                <Card className="glass-effect border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="w-5 h-5" />
                      <span>Security Settings</span>
                    </CardTitle>
                    <CardDescription>
                      Manage your account security and privacy
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Current Password</Label>
                        <Input
                          type="password"
                          value={passwordData.current_password}
                          onChange={(e) =>
                            setPasswordData((prev) => ({
                              ...prev,
                              current_password: e.target.value,
                            }))
                          }
                          placeholder="Enter current password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>New Password</Label>
                        <Input
                          type="password"
                          value={passwordData.new_password}
                          onChange={(e) =>
                            setPasswordData((prev) => ({
                              ...prev,
                              new_password: e.target.value,
                            }))
                          }
                          placeholder="Enter new password"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm New Password</Label>
                      <Input
                        type="password"
                        value={passwordData.new_password_confirmation}
                        onChange={(e) =>
                          setPasswordData((prev) => ({
                            ...prev,
                            new_password_confirmation: e.target.value,
                          }))
                        }
                        placeholder="Confirm new password"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={handleChangePassword}
                        disabled={isChangingPassword}
                        variant="outline"
                        className="mt-4"
                      >
                        {isChangingPassword ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                            Changing...
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4 mr-2" />
                            Change Password
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </MainLayout>
    </RouteGuard>
  );
}
