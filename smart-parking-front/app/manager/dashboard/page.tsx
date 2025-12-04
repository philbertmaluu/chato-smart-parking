"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { RouteGuard } from "@/components/auth/route-guard";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLanguage } from "@/components/language-provider";
import { useAuth } from "@/components/auth-provider";
import { Car, DollarSign, Users, ParkingCircle } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function ManagerDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const stats = [
    {
      title: t("dashboard.totalParked"),
      value: "47",
      change: "+12%",
      icon: ParkingCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: t("dashboard.todayRevenue"),
      value: "Tsh. 1,247",
      change: "+8.2%",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: t("dashboard.totalEntries"),
      value: "324",
      change: "+15%",
      icon: Car,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: "Active Operators",
      value: "8",
      change: "+2",
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
  ];

  const revenueData = [
    { name: "Mon", revenue: 850 },
    { name: "Tue", revenue: 920 },
    { name: "Wed", revenue: 1100 },
    { name: "Thu", revenue: 980 },
    { name: "Fri", revenue: 1350 },
    { name: "Sat", revenue: 1600 },
    { name: "Sun", revenue: 1247 },
  ];

  const hourlyData = [
    { hour: "6AM", vehicles: 5 },
    { hour: "8AM", vehicles: 25 },
    { hour: "10AM", vehicles: 45 },
    { hour: "12PM", vehicles: 52 },
    { hour: "2PM", vehicles: 48 },
    { hour: "4PM", vehicles: 38 },
    { hour: "6PM", vehicles: 42 },
    { hour: "8PM", vehicles: 28 },
    { hour: "10PM", vehicles: 15 },
  ];

  const vehicleTypeData = [
    { name: "Cars", value: 65, color: "#3B82F6" },
    { name: "Motorcycles", value: 25, color: "#10B981" },
    { name: "Trucks", value: 10, color: "#F59E0B" },
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
          >
            <h1 className="text-3xl font-bold text-gradient">
              {t("dashboard.welcome")}, {user?.username}!
            </h1>
            <p className="text-muted-foreground mt-2">
              Manager Dashboard - Real-time parking analytics and management
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Card className="glass-effect border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-bold mt-2">{stat.value}</p>
                        <p className="text-sm text-green-600 mt-1">
                          {stat.change}
                        </p>
                      </div>
                      <div className={`p-3 rounded-full ${stat.bgColor}`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

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
                  <CardTitle>Weekly Revenue</CardTitle>
                  <CardDescription>
                    Revenue trends for the past 7 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [`Tsh. ${value}`, "Revenue"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#800000"
                        strokeWidth={3}
                        dot={{ fill: "#800000", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Hourly Traffic */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <Card className="glass-effect border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Hourly Traffic</CardTitle>
                  <CardDescription>
                    Vehicle count throughout the day
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [`${value}`, "Vehicles"]}
                      />
                      <Bar
                        dataKey="vehicles"
                        fill="#800000"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Vehicle Types */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <Card className="glass-effect border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Vehicle Types</CardTitle>
                  <CardDescription>
                    Distribution of parked vehicles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={vehicleTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {vehicleTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value}%`, "Percentage"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {vehicleTypeData.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <span className="text-sm font-medium">
                          {item.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.5 }}
              className="lg:col-span-2"
            >
              <Card className="glass-effect border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest parking transactions and events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(
                      [
                        {
                          type: "entry",
                          plate: "ABC-123",
                          operator: "John Doe",
                          time: "2 minutes ago",
                          amount: "Tsh. 5.00",
                        },
                        {
                          type: "exit",
                          plate: "XYZ-789",
                          operator: "Jane Smith",
                          time: "5 minutes ago",
                          amount: "Tsh. 12.50",
                        },
                        {
                          type: "entry",
                          plate: "DEF-456",
                          operator: "Mike Johnson",
                          time: "8 minutes ago",
                          amount: "Tsh. 5.00",
                        },
                        {
                          type: "exit",
                          plate: "GHI-789",
                          operator: "Sarah Wilson",
                          time: "12 minutes ago",
                          amount: "Tsh. 18.75",
                        },
                      ] as const
                    ).map((activity, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.2 + index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              activity.type === "entry"
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          />
                          <div>
                            <p className="font-medium">{activity.plate}</p>
                            <p className="text-sm text-muted-foreground">
                              {activity.type === "entry" ? "Entry" : "Exit"} by{" "}
                              {activity.operator}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-primary">
                            {activity.amount}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {activity.time}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </MainLayout>
    </RouteGuard>
  );
}
