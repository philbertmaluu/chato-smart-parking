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
  Activity,
  DollarSign,
  BarChart3
} from "lucide-react";
import { API_ENDPOINTS } from "@/utils/api/endpoints";
import { get } from "@/utils/api/api";
import { useLanguage } from "@/components/language-provider";
import { formatCurrency } from "@/utils/currency-formater";
import { formatDate, formatTime } from "@/utils/date-utils";

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
        return (
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-blue-100 text-blue-600">
                <Car className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{record.vehicle?.plate_number || 'Unknown'}</div>
              <div className="text-sm text-muted-foreground">
                {record.vehicle?.body_type?.name || 'Unknown Type'}
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
      </div>
    </MainLayout>
  );
}