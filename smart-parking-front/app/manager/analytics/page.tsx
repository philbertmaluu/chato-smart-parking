"use client";

import { useState, useMemo, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/components/language-provider";
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
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Car,
  Clock,
  Users,
  Calendar,
  Download,
  Filter,
} from "lucide-react";

// Mock data for analytics
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

export default function Analytics() {
  const { t } = useLanguage();
  const [timeRange, setTimeRange] = useState("7d");
  const [selectedChart, setSelectedChart] = useState("revenue");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
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
                        `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
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
      </div>
    </MainLayout>
  );
}
