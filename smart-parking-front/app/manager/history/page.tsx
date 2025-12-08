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
  const [dashboardSummary, setDashboardSummary] = useState<{
    total_passages: number;
    active_passages: number;
    completed_today: number;
    total_revenue: number;
    revenue_today: number;
  } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

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

  // Fetch dashboard summary
  const fetchDashboardSummary = async () => {
    setSummaryLoading(true);
    try {
      const response = await get<{
        success: boolean;
        data:
          | {
              total_passages: number;
              active_passages: number;
              completed_today: number;
              total_revenue: number;
              revenue_today: number;
            }
          | { data: any } // handle nested data payloads
          | null;
        message: string;
      }>(API_ENDPOINTS.VEHICLE_PASSAGES.DASHBOARD_SUMMARY);
      
      console.log('Dashboard summary response', response);

      if (response?.success) {
        // Some endpoints may return { data: {...} } or nested structures
        const summary =
          (response.data as any)?.data ||
          response.data ||
          null;

        if (summary) {
          setDashboardSummary(summary);
        } else {
          console.warn('Dashboard summary missing data payload', response);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardSummary();
  }, []);

  // Augment passages to avoid double-charging within 24h for the same vehicle
  const processedPassages = useMemo(() => {
    if (!state.passages || !Array.isArray(state.passages)) return [];

    // Sort by entry_time descending (latest first)
    const sorted = [...state.passages].sort((a, b) => {
      const at = a?.entry_time ? new Date(a.entry_time).getTime() : 0;
      const bt = b?.entry_time ? new Date(b.entry_time).getTime() : 0;
      return bt - at;
    });

    const lastPaidMap = new Map<string, number>();

    const augmented = sorted.map((p) => {
      const vehicleKey = p.vehicle?.plate_number || p.vehicle_id?.toString() || `p-${p.id}`;
      const entryTimeMs = p.entry_time ? new Date(p.entry_time).getTime() : 0;

      const lastPaid = lastPaidMap.get(vehicleKey);
      const within24h = lastPaid !== undefined && entryTimeMs - lastPaid < 24 * 60 * 60 * 1000;

      const paid_within_24h = within24h;
      const revenue_counted = !within24h;

      // Update last paid marker if this passage is counted (or if no exit_time, use entry_time)
      const referenceTime = p.exit_time ? new Date(p.exit_time).getTime() : entryTimeMs;
      if (revenue_counted) {
        lastPaidMap.set(vehicleKey, referenceTime);
      }

      return {
        ...p,
        paid_within_24h,
        revenue_counted,
      };
    });

    return augmented;
  }, [state.passages]);

  const derivedSummary = useMemo(() => {
    const passages = processedPassages || [];
    // Use total from pagination when available to reflect full dataset, not just current page
    const total_passages = state.pagination?.total ?? passages.length;
    const active_passages = passages.filter(p => !p.exit_time).length;
    const todayStr = new Date().toISOString().slice(0,10);
    const completed_today = passages.filter(p => p.exit_time && p.exit_time.startsWith(todayStr)).length;
    const total_revenue = passages.reduce((sum, p) => sum + (p.revenue_counted ? (p.total_amount || 0) : 0), 0);
    const revenue_today = passages
      .filter(p => p.exit_time && p.exit_time.startsWith(todayStr))
      .reduce((sum, p) => sum + (p.revenue_counted ? (p.total_amount || 0) : 0), 0);
    return { total_passages, active_passages, completed_today, total_revenue, revenue_today };
  }, [processedPassages, state.pagination?.total]);

  const displaySummary = useMemo(() => {
    if (!dashboardSummary) return derivedSummary;

    // If the server summary is entirely zero/empty, fall back to derived client summary
    const hasPositive = Object.values(dashboardSummary || {}).some(
      (v) => typeof v === 'number' && v > 0
    );

    if (!hasPositive) return derivedSummary;

    // Prefer server values where available, otherwise use derived values
    return {
      total_passages:
        dashboardSummary.total_passages ?? derivedSummary.total_passages,
      active_passages:
        dashboardSummary.active_passages ?? derivedSummary.active_passages,
      completed_today:
        dashboardSummary.completed_today ?? derivedSummary.completed_today,
      total_revenue: dashboardSummary.total_revenue ?? derivedSummary.total_revenue,
      revenue_today: dashboardSummary.revenue_today ?? derivedSummary.revenue_today,
    };
  }, [dashboardSummary, derivedSummary]);

  // Periodic refresh for real-time counts (dashboard cards + list)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPassages(1);
      fetchDashboardSummary();
    }, 30000); // every 30s
    return () => clearInterval(interval);
  }, []);

  // Real analytics calculations from processed passages data
  const analytics = useMemo(() => {
    const passages = processedPassages || [];
    const completedPassages = passages.filter(p => p?.exit_time);
    const activePassages = passages.filter(p => p && !p.exit_time);
    
    // Revenue metrics
    // Revenue counted only once per vehicle per 24h
    const totalRevenue = passages.reduce((sum, p) => sum + ((p?.revenue_counted ? (p?.total_amount || 0) : 0)), 0);
    const completedRevenue = completedPassages.reduce((sum, p) => sum + ((p?.revenue_counted ? (p?.total_amount || 0) : 0)), 0);
    
    // Vehicle metrics
    const totalVehicles = passages.length;
    const completedVehicles = completedPassages.length;
    
    // Duration calculations
    const durations = completedPassages
      .map(p => {
        if (!p?.entry_time || !p?.exit_time) return null;
        const entry = new Date(p.entry_time);
        const exit = new Date(p.exit_time);
        return (exit.getTime() - entry.getTime()) / (1000 * 60 * 60); // hours
      })
      .filter((d): d is number => d !== null);
    
    const avgDuration = durations.length > 0 
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length 
      : 0;
    
    // Revenue per vehicle
    const revenuePerVehicle = completedVehicles > 0 
      ? completedRevenue / completedVehicles 
      : 0;
    
    // Peak hours analysis
    const hourlyData: Record<number, { count: number; revenue: number }> = {};
    completedPassages.forEach(p => {
      if (p?.exit_time) {
        const hour = new Date(p.exit_time).getHours();
        if (!hourlyData[hour]) {
          hourlyData[hour] = { count: 0, revenue: 0 };
        }
        hourlyData[hour].count++;
        hourlyData[hour].revenue += p.revenue_counted ? (p.total_amount || 0) : 0;
      }
    });
    
    const peakHour = Object.entries(hourlyData)
      .sort(([, a], [, b]) => b.count - a.count)[0];
    
    // Vehicle type distribution
    const vehicleTypeData: Record<string, { count: number; revenue: number }> = {};
    completedPassages.forEach(p => {
      const type = p?.vehicle?.body_type?.name || 'Unknown';
      if (!vehicleTypeData[type]) {
        vehicleTypeData[type] = { count: 0, revenue: 0 };
      }
      vehicleTypeData[type].count++;
      vehicleTypeData[type].revenue += p.revenue_counted ? (p.total_amount || 0) : 0;
    });
    
    // Station performance
    const stationData: Record<string, { count: number; revenue: number }> = {};
    completedPassages.forEach(p => {
      const station = p?.entry_station?.name || 'Unknown';
      if (!stationData[station]) {
        stationData[station] = { count: 0, revenue: 0 };
      }
      stationData[station].count++;
      stationData[station].revenue += p.revenue_counted ? (p.total_amount || 0) : 0;
    });
    
    // Daily breakdown for chart
    const dailyData: Record<string, { revenue: number; vehicles: number }> = {};
    completedPassages.forEach(p => {
      if (p?.exit_time) {
        const date = new Date(p.exit_time).toLocaleDateString('en-US', { weekday: 'short' });
        if (!dailyData[date]) {
          dailyData[date] = { revenue: 0, vehicles: 0 };
        }
        dailyData[date].revenue += p.revenue_counted ? (p.total_amount || 0) : 0;
        dailyData[date].vehicles++;
      }
    });
    
    const dailyChartData = Object.entries(dailyData).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      vehicles: data.vehicles,
    }));
    
    // Hourly chart data
    const hourlyChartData = Array.from({ length: 24 }, (_, i) => {
      const hourData = hourlyData[i] || { count: 0, revenue: 0 };
    return {
        hour: `${i}:00`,
        vehicles: hourData.count,
        revenue: hourData.revenue,
      };
    });
    
    // Vehicle type chart data
    const vehicleTypeChartData = Object.entries(vehicleTypeData).map(([name, data]) => ({
      name,
      value: data.count,
      revenue: data.revenue,
      color: name.includes('Motorcycle') ? '#10B981' : 
             name.includes('Large') ? '#F59E0B' : 
             name.includes('Small') ? '#3B82F6' : '#8B5CF6',
    }));
    
    // Calculate trends (comparing last 7 days if available)
    const today = new Date();
    const last7Days = completedPassages.filter(p => {
      if (!p?.exit_time) return false;
      const exitDate = new Date(p.exit_time);
      const diffDays = (today.getTime() - exitDate.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    });
    
    const last7DaysRevenue = last7Days.reduce((sum, p) => sum + (p?.revenue_counted ? (p?.total_amount || 0) : 0), 0);
    const prev7DaysRevenue = completedPassages
      .filter(p => {
        if (!p?.exit_time) return false;
        const exitDate = new Date(p.exit_time);
        const diffDays = (today.getTime() - exitDate.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays > 7 && diffDays <= 14;
      })
      .reduce((sum, p) => sum + (p?.revenue_counted ? (p?.total_amount || 0) : 0), 0);
    
    const revenueChange = prev7DaysRevenue > 0
      ? ((last7DaysRevenue - prev7DaysRevenue) / prev7DaysRevenue) * 100
      : 0;
    
    const last7DaysVehicles = last7Days.length;
    const prev7DaysVehicles = completedPassages.filter(p => {
      if (!p?.exit_time) return false;
      const exitDate = new Date(p.exit_time);
      const diffDays = (today.getTime() - exitDate.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays > 7 && diffDays <= 14;
    }).length;
    
    const vehicleChange = prev7DaysVehicles > 0
      ? ((last7DaysVehicles - prev7DaysVehicles) / prev7DaysVehicles) * 100
      : 0;

    return {
      // Summary metrics
      totalRevenue,
      completedRevenue,
      totalVehicles,
      completedVehicles,
      activeVehicles: activePassages.length,
      
      // Performance metrics
      avgDuration: avgDuration.toFixed(1),
      revenuePerVehicle: revenuePerVehicle.toFixed(0),
      peakHour: peakHour ? `${peakHour[0]}:00 (${peakHour[1].count} vehicles)` : 'N/A',
      
      // Trends
      revenueChange: revenueChange.toFixed(1),
      vehicleChange: vehicleChange.toFixed(1),
      
      // Chart data
      dailyChartData: dailyChartData.length > 0 ? dailyChartData : mockAnalyticsData.dailyRevenue,
      hourlyChartData,
      vehicleTypeChartData: vehicleTypeChartData.length > 0 ? vehicleTypeChartData : mockAnalyticsData.vehicleTypeDistribution,
      stationData: Object.entries(stationData).map(([name, data]) => ({
        name,
        vehicles: data.count,
        revenue: data.revenue,
      })),
      
      // Additional insights
      avgRevenue: completedVehicles > 0 ? (completedRevenue / completedVehicles).toFixed(0) : '0',
      avgVehicles: dailyChartData.length > 0 
        ? (dailyChartData.reduce((sum, d) => sum + d.vehicles, 0) / dailyChartData.length).toFixed(0)
        : '0',
    };
  }, [processedPassages]);

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
    if (!processedPassages || !Array.isArray(processedPassages)) return [];
    if (filterStatus === "all") return processedPassages;
    return processedPassages.filter(passage => passage && passage.status === filterStatus);
  }, [processedPassages, filterStatus]);

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
        
        // Check if this is a free re-entry (total_amount = 0 with notes mentioning paid within 24h)
        const isFreeReEntry = record.total_amount === 0 && 
                              record.notes && 
                              record.notes.includes('Free re-entry');
        
        return (
          <div className="text-right">
            {record.total_amount && record.total_amount > 0 ? (
              <div className="font-medium text-green-600">
                {formatCurrency(record.total_amount)}
              </div>
            ) : isFreeReEntry ? (
              <div className="font-medium text-blue-600">
                Paid
              </div>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        );
      },
    },
    // {
    //   key: "status",
    //   title: "Status",
    //   render: (value: any, record: VehiclePassage, index: number) => {
    //     if (!record) return <div className="text-muted-foreground">N/A</div>;
    //     return (
    //       <Badge variant={getStatusBadgeVariant(record.status || 'unknown')}>
    //         {record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : 'Unknown'}
    //       </Badge>
    //     );
    //   },
    // },
    // {
    //   key: "payment_status",
    //   title: "Payment",
    //   render: (value: any, record: VehiclePassage, index: number) => {
    //     if (!record) return <div className="text-muted-foreground">N/A</div>;
    //     return (
    //       <Badge variant={getPaymentStatusBadgeVariant(record.payment_status)}>
    //         {record.payment_status ? 
    //           record.payment_status.charAt(0).toUpperCase() + record.payment_status.slice(1) : 
    //           'N/A'
    //         }
    //       </Badge>
    //     );
    //   },
    // },
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
                onClick={() => {
                  fetchPassages(1);
                  fetchDashboardSummary();
                }}
                disabled={state.loading || summaryLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${(state.loading || summaryLoading) ? 'animate-spin' : ''}`} />
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
        {/* Summary Cards - showing key metrics from displaySummary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {/* Total Passages */}
          <Card className="border-0 shadow-lg glass-effect">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Total Passages
                  </p>
                  <p className="text-3xl font-bold">
                    {summaryLoading ? (
                      <span className="text-muted-foreground">...</span>
                    ) : (
                      displaySummary?.total_passages?.toLocaleString() || '0'
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All time records
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Passages */}
          <Card className="border-0 shadow-lg glass-effect">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Active Now
                  </p>
                  <p className="text-3xl font-bold">
                    {summaryLoading ? (
                      <span className="text-muted-foreground">...</span>
                    ) : (
                      displaySummary?.active_passages?.toLocaleString() || '0'
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Currently parked
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-full shadow-lg">
                  <Car className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed Today */}
          <Card className="border-0 shadow-lg glass-effect">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Completed Today
                  </p>
                  <p className="text-3xl font-bold">
                    {summaryLoading ? (
                      <span className="text-muted-foreground">...</span>
                    ) : (
                      displaySummary?.completed_today?.toLocaleString() || '0'
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Exited today
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full shadow-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card className="border-0 shadow-lg glass-effect">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold">
                    {summaryLoading ? (
                      <span className="text-muted-foreground">...</span>
                    ) : (
                      formatCurrency(displaySummary?.total_revenue || 0)
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {displaySummary?.revenue_today ? 
                      `Today: ${formatCurrency(displaySummary.revenue_today)}` : 
                      'All time revenue'
                    }
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full shadow-lg">
                  <DollarSign className="w-6 h-6 text-white" />
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
              className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4"
            >
               
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

            {/* Key Metrics - Comprehensive KPIs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {/* Total Revenue */}
              <Card className="glass-effect border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                  <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Revenue
                      </p>
                      <p className="text-2xl font-bold mt-2">
                        {formatCurrency(analytics.completedRevenue)}
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
                          {analytics.revenueChange}% vs last week
                        </span>
                      </div>
                      </div>
                    <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-full">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Vehicles */}
              <Card className="glass-effect border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                  <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Completed Vehicles
                      </p>
                      <p className="text-2xl font-bold mt-2">
                        {analytics.completedVehicles.toLocaleString()}
                      </p>
                      <div className="flex items-center mt-2">
                        <span className="text-sm text-muted-foreground">
                          {analytics.activeVehicles} active now
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full">
                      <Car className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Per Vehicle */}
              <Card className="glass-effect border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Avg Revenue/Vehicle
                      </p>
                      <p className="text-2xl font-bold mt-2">
                        {formatCurrency(parseFloat(analytics.revenuePerVehicle))}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Per completed passage
                      </p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Average Stay Duration */}
              <Card className="glass-effect border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Avg Stay Duration
                      </p>
                      <p className="text-2xl font-bold mt-2">
                        {analytics.avgDuration}h
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Average parking time
                      </p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Secondary Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {/* Peak Hour */}
              <Card className="glass-effect border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Peak Hour
                      </p>
                      <p className="text-xl font-bold mt-2">
                        {analytics.peakHour}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Highest traffic time
                      </p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Passages */}
              <Card className="glass-effect border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Passages
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
                          {analytics.vehicleChange}% vs last week
                        </span>
                      </div>
                      </div>
                    <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full">
                      <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                    </div>
                </CardContent>
              </Card>

              {/* Avg Daily Revenue */}
              <Card className="glass-effect border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                  <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Avg Daily Revenue
                      </p>
                      <p className="text-2xl font-bold mt-2">
                        {formatCurrency(parseFloat(analytics.avgRevenue))}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Per day average
                      </p>
                      </div>
                    <div className="p-3 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full">
                      <DollarSign className="w-6 h-6 text-white" />
                      </div>
                    </div>
                </CardContent>
              </Card>

              {/* Avg Daily Vehicles */}
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
                    <div className="p-3 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full">
                      <Car className="w-6 h-6 text-white" />
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
                      <AreaChart data={analytics.dailyChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip
                          formatter={(value: any) => [formatCurrency(value), "Revenue"]}
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
                      <BarChart data={analytics.dailyChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="vehicles" fill="#10B981" name="Vehicles" />
                        <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
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
                      <LineChart data={analytics.hourlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="vehicles"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          name="Vehicles"
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#10B981"
                          strokeWidth={2}
                          name="Revenue"
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
                          data={analytics.vehicleTypeChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analytics.vehicleTypeChartData.map(
                            (entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            )
                          )}
                        </Pie>
                        <Tooltip formatter={(value: any, name: string) => {
                          const entry = analytics.vehicleTypeChartData.find((e: any) => e.value === value);
                          return [
                            `${value} vehicles (${formatCurrency((entry as any)?.revenue || 0)})`,
                            name
                          ];
                        }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
              </div>

            {/* Station Performance and Vehicle Type Revenue */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Station Performance */}
                      <motion.div
                initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
              >
                <Card className="glass-effect border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Station Performance</CardTitle>
                    <CardDescription>
                      Revenue and traffic by station
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics.stationData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.stationData}>
                        <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip
                            formatter={(value: any) => [
                              typeof value === 'number' ? formatCurrency(value) : value,
                              "Revenue"
                            ]}
                          />
                          <Legend />
                          <Bar dataKey="revenue" fill="#8B5CF6" name="Revenue" />
                          <Bar dataKey="vehicles" fill="#10B981" name="Vehicles" />
                      </BarChart>
                    </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        <p>No station data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Vehicle Type Revenue */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 0.5 }}
              >
                <Card className="glass-effect border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Vehicle Type Revenue</CardTitle>
                    <CardDescription>
                      Revenue breakdown by vehicle type
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.vehicleTypeChartData.length > 0 ? (
                        analytics.vehicleTypeChartData
                          .sort((a: any, b: any) => (b.revenue || 0) - (a.revenue || 0))
                          .map((type: any, index: number) => (
                            <div
                              key={type.name}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                                <div 
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: type.color }}
                                />
                              <div>
                                  <p className="font-medium">{type.name}</p>
                              <p className="text-sm text-muted-foreground">
                                    {type.value} vehicles
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                              <p className="font-bold text-green-600">
                                  {formatCurrency(type.revenue || 0)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {type.value > 0 
                                    ? formatCurrency((type.revenue || 0) / type.value)
                                    : formatCurrency(0)
                                  } avg
                              </p>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No vehicle type data available</p>
                        </div>
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