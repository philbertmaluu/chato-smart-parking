"use client";

import { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Filter,
  Download,
  RefreshCw, 
  Clock,
  Car, 
  MapPin, 
  User,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  BarChart3,
  Users
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { API_ENDPOINTS } from "@/utils/api/endpoints";
import { get } from "@/utils/api/api";
import { useLanguage } from "@/components/language-provider";
import { formatCurrency } from "@/utils/currency-formater";
import { formatDate, formatTime } from "@/utils/date-utils";
import { getVehicleTypeIcon } from "@/utils/utils";

interface VehiclePassage {
  id: number;
  passage_number?: string;
  vehicle_id?: number;
  vehicle?: {
    id: number;
    plate_number: string;
    make?: string;
    model?: string;
    year?: number;
    color?: string;
    owner_name?: string;
    body_type?: {
      id: number;
      name: string;
      category?: string;
    };
  };
  entry_time?: string;
  exit_time?: string;
  status?: 'active' | 'completed' | 'cancelled';
  total_amount?: number;
  payment_status?: 'pending' | 'paid' | 'failed';
  entry_operator?: {
    id: number;
    username: string;
    name?: string;
  };
  exit_operator?: {
    id: number;
    username: string;
    name?: string;
  };
  entry_gate?: {
    id: number;
    name: string;
  };
  exit_gate?: {
    id: number;
    name: string;
  };
  entry_station?: {
    id: number;
    name: string;
  };
  exit_station?: {
    id: number;
    name: string;
  };
  created_at?: string;
  updated_at?: string;
}

interface PassageHistoryState {
  passages: VehiclePassage[];
  loading: boolean;
  error: string | null;
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export default function PassageHistoryPage() {
  const { t } = useLanguage();
  const [state, setState] = useState<PassageHistoryState>({
    passages: [],
    loading: false,
    error: null,
    pagination: {
      current_page: 1,
      last_page: 1,
      per_page: 15,
      total: 0,
    },
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [activeTab, setActiveTab] = useState("history");
  const [timeRange, setTimeRange] = useState("7d");
  const [mounted, setMounted] = useState(false);

  // Analytics data
  const mockAnalyticsData = {
    dailyRevenue: [
      { date: "Mon", revenue: 850, vehicles: 45 },
      { date: "Tue", revenue: 920, vehicles: 52 },
      { date: "Wed", revenue: 1100, vehicles: 68 },
      { date: "Thu", revenue: 980, vehicles: 55 },
      { date: "Fri", revenue: 1350, vehicles: 78 },
      { date: "Sat", revenue: 1600, vehicles: 85 },
      { date: "Sun", revenue: 1247, vehicles: 72 },
    ],
    hourlyTraffic: [
      { hour: "6AM", vehicles: 5, revenue: 25 },
      { hour: "8AM", vehicles: 25, revenue: 125 },
      { hour: "10AM", vehicles: 45, revenue: 225 },
      { hour: "12PM", vehicles: 52, revenue: 260 },
      { hour: "2PM", vehicles: 48, revenue: 240 },
      { hour: "4PM", vehicles: 38, revenue: 190 },
      { hour: "6PM", vehicles: 42, revenue: 210 },
      { hour: "8PM", vehicles: 28, revenue: 140 },
      { hour: "10PM", vehicles: 15, revenue: 75 },
    ],
    vehicleTypeDistribution: [
      { name: "Cars", value: 65, color: "#3B82F6" },
      { name: "Motorcycles", value: 25, color: "#10B981" },
      { name: "Trucks", value: 10, color: "#F59E0B" },
    ],
    monthlyRevenue: [
      { month: "Jan", revenue: 28500, vehicles: 1250 },
      { month: "Feb", revenue: 31200, vehicles: 1380 },
      { month: "Mar", revenue: 29800, vehicles: 1320 },
      { month: "Apr", revenue: 32400, vehicles: 1450 },
      { month: "May", revenue: 35600, vehicles: 1580 },
      { month: "Jun", revenue: 38900, vehicles: 1720 },
    ],
    operatorPerformance: [
      { name: "John Doe", vehicles: 156, revenue: 780, efficiency: 95 },
      { name: "Jane Smith", vehicles: 142, revenue: 710, efficiency: 92 },
      { name: "Mike Johnson", vehicles: 168, revenue: 840, efficiency: 88 },
      { name: "Sarah Wilson", vehicles: 134, revenue: 670, efficiency: 90 },
    ],
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Analytics calculations
  const analytics = useMemo(() => {
    const data = mockAnalyticsData.dailyRevenue;
    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
    const totalVehicles = data.reduce((sum, item) => sum + item.vehicles, 0);
    const avgRevenue = totalRevenue / data.length;
    const avgVehicles = totalVehicles / data.length;

    const revenueChange =
      ((data[data.length - 1].revenue - data[0].revenue) / data[0].revenue) *
      100;
    const vehicleChange =
      ((data[data.length - 1].vehicles - data[0].vehicles) / data[0].vehicles) *
      100;

    return {
      totalRevenue,
      totalVehicles,
      avgRevenue: avgRevenue.toFixed(0),
      avgVehicles: avgVehicles.toFixed(0),
      revenueChange: revenueChange.toFixed(1),
      vehicleChange: vehicleChange.toFixed(1),
    };
  }, []);

  const exportAnalytics = () => {
    if (!mounted) return;

    const data = JSON.stringify(mockAnalyticsData, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `parking_analytics_${
      mounted ? new Date().toISOString().split("T")[0] : "data"
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Fetch passages
  const fetchPassages = async (page: number = 1) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: state.pagination.per_page.toString(),
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (filterStatus !== "all") {
        params.append('status', filterStatus);
      }
      if (filterDate) {
        params.append('start_date', filterDate);
        params.append('end_date', filterDate);
      }

      const response = await get<{
        success: boolean;
        data: {
          current_page: number;
          data: VehiclePassage[];
          last_page: number;
          per_page: number;
          total: number;
        };
        message: string;
        status: number;
      }>(`${API_ENDPOINTS.VEHICLE_PASSAGES.LIST}?${params.toString()}`);


      setState(prev => ({
        ...prev,
        passages: response.data?.data || [],
        pagination: {
          current_page: response.data?.current_page || 1,
          last_page: response.data?.last_page || 1,
          per_page: response.data?.per_page || 15,
          total: response.data?.total || 0,
        },
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch passages',
      }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchPassages(1);
  }, [searchTerm, filterStatus, filterDate]);

  // Filter passages based on status
  const filteredPassages = useMemo(() => {
    if (!state.passages || !Array.isArray(state.passages)) return [];
    if (filterStatus === "all") return state.passages;
    return state.passages.filter(passage => passage && passage.status === filterStatus);
  }, [state.passages, filterStatus]);

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchPassages(page);
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Get payment status badge variant
  const getPaymentStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Calculate duration
  const calculateDuration = (entryTime?: string, exitTime?: string) => {
    if (!entryTime) return 'N/A';
    if (!exitTime) return 'Active';
    const entry = new Date(entryTime);
    const exit = new Date(exitTime);
    const diffMs = exit.getTime() - entry.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}m`;
  };

  // Table columns
  const columns = [
    {
      key: "passage_number",
      title: "Passage #",
      render: (value: any, record: VehiclePassage, index: number) => {
        if (!record) return <div className="text-muted-foreground">N/A</div>;
        return (
          <div className="font-mono text-sm">
            {record.passage_number || `#${record.id}`}
          </div>
        );
      },
    },
    {
      key: "vehicle",
      title: "Vehicle",
      render: (value: any, record: VehiclePassage, index: number) => {
        if (!record) return <div className="text-muted-foreground">N/A</div>;
        
        const vehicleType = record.vehicle?.body_type?.name || 'Unknown';
        const vehicleIcon = getVehicleTypeIcon(vehicleType);
        
        return (
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className={`${vehicleIcon.bgColor} ${vehicleIcon.color}`}>
                <span className="text-lg">{vehicleIcon.icon}</span>
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{record.vehicle?.plate_number || 'Unknown'}</div>
              <div className="text-sm text-muted-foreground">
                {vehicleType}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "entry_time",
      title: "Entry Time",
      render: (value: any, record: VehiclePassage, index: number) => {
        if (!record) return <div className="text-muted-foreground">N/A</div>;
        return (
          <div>
            <div className="font-medium">{record.entry_time ? formatDate(record.entry_time) : 'N/A'}</div>
            <div className="text-sm text-muted-foreground">
              {record.entry_time ? formatTime(record.entry_time) : 'N/A'}
            </div>
          </div>
        );
      },
    },
    {
      key: "exit_time",
      title: "Exit Time",
      render: (value: any, record: VehiclePassage, index: number) => {
        if (!record) return <div className="text-muted-foreground">N/A</div>;
        return (
          <div>
            {record.exit_time ? (
              <>
                <div className="font-medium">{formatDate(record.exit_time)}</div>
                <div className="text-sm text-muted-foreground">
                  {formatTime(record.exit_time)}
                </div>
              </>
            ) : (
              <span className="text-muted-foreground">Active</span>
            )}
          </div>
        );
      },
    },
    {
      key: "duration",
      title: "Duration",
      render: (value: any, record: VehiclePassage, index: number) => {
        if (!record) return <div className="text-muted-foreground">N/A</div>;
        return (
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              {calculateDuration(record.entry_time, record.exit_time)}
            </span>
          </div>
        );
      },
    },
    {
      key: "amount",
      title: "Amount",
      render: (value: any, record: VehiclePassage, index: number) => {
        if (!record) return <div className="text-muted-foreground">N/A</div>;
        return (
          <div className="text-right">
            {record.total_amount ? (
              <div className="font-medium text-green-600">
                {formatCurrency(record.total_amount)}
              </div>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      title: "Status",
      render: (value: any, record: VehiclePassage, index: number) => {
        if (!record) return <div className="text-muted-foreground">N/A</div>;
        return (
          <Badge variant={getStatusBadgeVariant(record.status || 'unknown')}>
            {record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : 'Unknown'}
          </Badge>
        );
      },
    },
    {
      key: "payment_status",
      title: "Payment",
      render: (value: any, record: VehiclePassage, index: number) => {
        if (!record) return <div className="text-muted-foreground">N/A</div>;
        return (
          <Badge variant={getPaymentStatusBadgeVariant(record.payment_status)}>
            {record.payment_status ? 
              record.payment_status.charAt(0).toUpperCase() + record.payment_status.slice(1) : 
              'N/A'
            }
          </Badge>
        );
      },
    },
  ];

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
            <h1 className="text-3xl font-bold text-gradient">Passage History</h1>
            <p className="text-muted-foreground mt-2">
              View and manage all vehicle passage history
            </p>
          </div>
            <div className="flex items-center space-x-2">
            <Button
              variant="outline"
                onClick={() => fetchPassages(1)}
                disabled={state.loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${state.loading ? 'animate-spin' : ''}`} />
                Refresh
            </Button>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history">Passage History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-6">
        {/* Analytics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {/* Total Passages */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{state.pagination.total}</p>
                  <p className="text-sm text-muted-foreground">Total Passages</p>
                </div>
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full">
                  <Activity className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Passages */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    {state.passages?.filter(p => p && p.status === 'active').length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Active Now</p>
                </div>
                <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-full">
                  <Car className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed Today */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    {state.passages?.filter(p => {
                      if (!p) return false;
                      const today = new Date().toDateString();
                      return p.status === 'completed' && 
                             new Date(p.exit_time || '').toDateString() === today;
                    }).length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Completed Today</p>
                </div>
                <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      state.passages?.reduce((sum, p) => sum + (p?.total_amount || 0), 0) || 0
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </div>
                <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
          <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
                placeholder="Search by plate number, passage number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
                    </div>
                  </div>
          <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
              <SelectItem value="all">All Passages</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="completed">Completed Only</SelectItem>
              <SelectItem value="cancelled">Cancelled Only</SelectItem>
                      </SelectContent>
                    </Select>
          <Input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-[180px]"
            placeholder="Filter by date"
          />
          </motion.div>

        {/* Passages Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <DataTable
            dataSource={filteredPassages}
            columns={columns}
            loading={state.loading}
            exportable
            searchable
            searchPlaceholder="Search passages..."
            exportFileName="passage-history"
            searchFields={[
              "passage_number",
            ]}
            pagination={{
              currentPage: state.pagination.current_page,
              total: state.pagination.total,
              perPage: state.pagination.per_page,
              lastPage: state.pagination.last_page,
              onPageChange: handlePageChange,
            }}
          />
        </motion.div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Analytics Header */}
        <motion.div
              initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
                                <div>
                <h1 className="text-3xl font-bold text-gradient">
                  Analytics Dashboard
                </h1>
                <p className="text-muted-foreground mt-2">
                  Comprehensive parking analytics and insights
                </p>
                                </div>
              <div className="flex gap-2">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>
                                <Button
                  onClick={exportAnalytics}
                              variant="outline"
                  className="glass-effect border-0 bg-transparent"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                            </Button>
                          </div>
        </motion.div>

            {/* Key Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <Card className="glass-effect border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                  <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Revenue
                      </p>
                      <p className="text-2xl font-bold mt-2">
                        Tsh. {analytics.totalRevenue.toLocaleString()}
                      </p>
                      <div className="flex items-center mt-2">
                        {parseFloat(analytics.revenueChange) >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                        )}
                        <span
                          className={`text-sm ${
                            parseFloat(analytics.revenueChange) >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {analytics.revenueChange}%
                        </span>
                      </div>
                      </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                  <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Vehicles
                      </p>
                      <p className="text-2xl font-bold mt-2">
                        {analytics.totalVehicles.toLocaleString()}
                      </p>
                      <div className="flex items-center mt-2">
                        {parseFloat(analytics.vehicleChange) >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                        )}
                        <span
                          className={`text-sm ${
                            parseFloat(analytics.vehicleChange) >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {analytics.vehicleChange}%
                        </span>
                      </div>
                      </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                      <Car className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                </CardContent>
              </Card>

              <Card className="glass-effect border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                  <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Avg Daily Revenue
                      </p>
                      <p className="text-2xl font-bold mt-2">
                        Tsh. {analytics.avgRevenue}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Per day average
                      </p>
                      </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                </CardContent>
              </Card>

              <Card className="glass-effect border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                  <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Avg Daily Vehicles
                      </p>
                      <p className="text-2xl font-bold mt-2">
                        {analytics.avgVehicles}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Per day average
                      </p>
                      </div>
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                      <Clock className="w-6 h-6 text-orange-600" />
                      </div>
                      </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <Card className="glass-effect border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                    <CardDescription>
                      Daily revenue over the selected period
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={mockAnalyticsData.dailyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [`Tsh. ${value}`, "Revenue"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#3B82F6"
                          fill="#3B82F6"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Vehicle Traffic Chart */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <Card className="glass-effect border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Vehicle Traffic</CardTitle>
                    <CardDescription>
                      Daily vehicle count over the selected period
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={mockAnalyticsData.dailyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="vehicles" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
              </div>

            {/* Hourly Traffic and Vehicle Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Hourly Traffic */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <Card className="glass-effect border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Hourly Traffic Pattern</CardTitle>
                    <CardDescription>
                      Vehicle traffic by hour of the day
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={mockAnalyticsData.hourlyTraffic}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="vehicles"
                          stroke="#3B82F6"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
            </motion.div>

              {/* Vehicle Type Distribution */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.5 }}
              >
                <Card className="glass-effect border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Vehicle Type Distribution</CardTitle>
                    <CardDescription>Breakdown by vehicle type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={mockAnalyticsData.vehicleTypeDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name} ${((percent || 0) * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {mockAnalyticsData.vehicleTypeDistribution.map(
                            (entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            )
                          )}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
              </div>

            {/* Monthly Revenue and Operator Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Revenue */}
                      <motion.div
                initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
              >
                <Card className="glass-effect border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Monthly Revenue</CardTitle>
                    <CardDescription>
                      Revenue trends over the past 6 months
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={mockAnalyticsData.monthlyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [
                            `Tsh. ${value.toLocaleString()}`,
                            "Revenue",
                          ]}
                        />
                        <Bar dataKey="revenue" fill="#8B5CF6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Operator Performance */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 0.5 }}
              >
                <Card className="glass-effect border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Operator Performance</CardTitle>
                    <CardDescription>
                      Operator efficiency and revenue generation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockAnalyticsData.operatorPerformance.map(
                        (operator, index) => (
                          <div
                            key={operator.name}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                <Users className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="font-medium">{operator.name}</p>
                              <p className="text-sm text-muted-foreground">
                                  {operator.vehicles} vehicles
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                              <p className="font-bold text-green-600">
                                Tsh. {operator.revenue}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                {operator.efficiency}% efficiency
                              </p>
                              </div>
                            </div>
                        )
                      )}
                          </div>
                  </CardContent>
                </Card>
                      </motion.div>
                </div>
          </TabsContent>
        </Tabs>
              </div>
    </MainLayout>
  );
}