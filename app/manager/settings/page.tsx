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
import { useLanguage } from "@/components/language-provider";
import { VehicleBodyTypes } from "./components/vehicle-body-types";
import { PaymentTypes } from "./components/payment-types";
import { BundleTypes } from "./components/bandle-types";
import { StationGates } from "./components/station-gates";
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
  CarIcon,
  Settings2Icon,
} from "lucide-react";

// Mock data for payment types
const mockPaymentTypes = [
  {
    id: "1",
    name: "Cash",
    icon: "💵",
    description: "Cash payment",
    isActive: true,
    createdAt: "2024-01-01",
  },
  {
    id: "2",
    name: "Card",
    icon: "💳",
    description: "Credit/Debit card payment",
    isActive: true,
    createdAt: "2024-01-01",
  },
  {
    id: "3",
    name: "Mobile Money",
    icon: "📱",
    description: "Mobile money payment (M-Pesa, Airtel Money, etc.)",
    isActive: true,
    createdAt: "2024-01-01",
  },
  {
    id: "4",
    name: "Bank Transfer",
    icon: "🏦",
    description: "Direct bank transfer",
    isActive: false,
    createdAt: "2024-01-01",
  },
];

// Mock data for bundle types
const mockBundleTypes = [
  {
    id: "1",
    name: "Daily",
    icon: "📅",
    duration: "24 hours",
    discount: 10,
    description: "Daily parking bundle",
    isActive: true,
    createdAt: "2024-01-01",
  },
  {
    id: "2",
    name: "Weekly",
    icon: "📆",
    duration: "7 days",
    discount: 20,
    description: "Weekly parking bundle",
    isActive: true,
    createdAt: "2024-01-01",
  },
  {
    id: "3",
    name: "Monthly",
    icon: "🗓️",
    duration: "30 days",
    discount: 30,
    description: "Monthly parking bundle",
    isActive: true,
    createdAt: "2024-01-01",
  },
  {
    id: "4",
    name: "Yearly",
    icon: "📊",
    duration: "365 days",
    discount: 40,
    description: "Yearly parking bundle",
    isActive: false,
    createdAt: "2024-01-01",
  },
];

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
  const [activeTab, setActiveTab] = useState("vehicle-types");
  const [systemSettings, setSystemSettings] = useState(mockSystemSettings);
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
          </motion.div>

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
              <TabsList className="flex w-full justify-start space-x-2">
                <TabsTrigger
                  value="vehicle-types"
                  className="flex items-center space-x-2"
                >
                  <CarIcon className="w-4 h-4" />
                  <span>Vehicle Types</span>
                </TabsTrigger>

                <TabsTrigger
                  value="payment-types"
                  className="flex items-center space-x-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Payment Types</span>
                </TabsTrigger>

                <TabsTrigger
                  value="bundle-types"
                  className="flex items-center space-x-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Bundle Types</span>
                </TabsTrigger>

                <TabsTrigger
                  value="gates-and-stations"
                  className="flex items-center space-x-2"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Gates and Stations</span>
                </TabsTrigger>

                <TabsTrigger
                  value="profile"
                  className="flex items-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </TabsTrigger>

                <TabsTrigger
                  value="system-configuration"
                  className="flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>System Configuration</span>
                </TabsTrigger>

                <TabsTrigger
                  value="integration"
                  className="flex items-center space-x-2"
                >
                  <Settings2Icon className="w-4 h-4" />
                  <span>Hardware Integrations</span>
                </TabsTrigger>
              </TabsList>

              {/* Vehicle Types Tab */}
              <TabsContent value="vehicle-types" className="space-y-6">
                <VehicleBodyTypes />
              </TabsContent>

              {/* Payment Types Tab */}
              <TabsContent value="payment-types" className="space-y-6">
                <PaymentTypes />
              </TabsContent>

              {/* Bundle Types Tab */}
              <TabsContent value="bundle-types" className="space-y-6">
                <BundleTypes />
              </TabsContent>

              {/* Gates and Stations Tab */}
              <TabsContent value="gates-and-stations" className="space-y-6">
                <StationGates />
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
                          <SelectTrigger className="w-full">
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

              <TabsContent value="system-configuration" className="space-y-6">
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
                          <SelectTrigger className="w-full">
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
                          <SelectTrigger className="w-full">
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

              {/* Hardware Integrations Tab */}
              <TabsContent value="integration" className="space-y-6">
                <div className="flex flex-col gap-4">
                  <h1 className="text-2xl font-bold">Hardware Integrations</h1>
                  <p className="text-sm text-muted-foreground">
                    Manage hardware integrations for the parking system is under
                    development.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </MainLayout>
    </RouteGuard>
  );
}
