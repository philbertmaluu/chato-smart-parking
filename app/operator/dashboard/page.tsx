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
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";
import { useAuth } from "@/components/auth-provider";
import { ZKTecoCameraWidget } from "@/components/camera/zkteco-camera-widget";
import { Car, ScanLine, ParkingCircle, DollarSign, Clock } from "lucide-react";
import Link from "next/link";

export default function OperatorDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const stats = [
    {
      title: t("dashboard.totalParked"),
      value: "24",
      icon: ParkingCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: t("dashboard.todayRevenue"),
      value: "Tsh. 480",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: t("dashboard.totalEntries"),
      value: "156",
      icon: Car,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: "Active Hours",
      value: "8.5h",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
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
              Operator Dashboard - Manage vehicle entries and parking
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

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks for vehicle management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/operator/entry">
                    <Button className="w-full h-20 gradient-maroon hover:opacity-90 transition-opacity">
                      <div className="flex flex-col items-center space-y-2">
                        <ScanLine className="w-8 h-8" />
                        <span className="font-medium">Scan Vehicle Entry</span>
                      </div>
                    </Button>
                  </Link>

                  <Link href="/operator/parked">
                    <Button
                      variant="outline"
                      className="w-full h-20 glass-effect border-0 bg-transparent"
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <ParkingCircle className="w-8 h-8" />
                        <span className="font-medium">
                          View Parked Vehicles
                        </span>
                      </div>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Camera Feed Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <ZKTecoCameraWidget
              className="w-full"
              showControls={true}
              defaultStreamType="mjpeg"
              autoConnect={true}
            />
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest vehicle entries and exits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      plate: "ABC-123",
                      action: "Entry",
                      time: "10:30 AM",
                      amount: "Tsh. 5.00",
                    },
                    {
                      plate: "XYZ-789",
                      action: "Exit",
                      time: "10:15 AM",
                      amount: "Tsh. 12.50",
                    },
                    {
                      plate: "DEF-456",
                      action: "Entry",
                      time: "09:45 AM",
                      amount: "Tsh. 5.00",
                    },
                  ].map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            activity.action === "Entry"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        />
                        <div>
                          <p className="font-medium">{activity.plate}</p>
                          <p className="text-sm text-muted-foreground">
                            {activity.action}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{activity.amount}</p>
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
      </MainLayout>
    </RouteGuard>
  );
}
