"use client";

import { useState, useEffect } from "react";
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
import { Car, ScanLine, ParkingCircle, DollarSign, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { get } from "@/utils/api/api";
import { API_ENDPOINTS } from "@/utils/api/endpoints";
import { formatTime, formatDateTime } from "@/utils/date-utils";

// Helper function to calculate duration
const calculateDuration = (entryTime: string, exitTime: string | null): string => {
  if (!exitTime) return 'N/A';
  const entry = new Date(entryTime);
  const exit = new Date(exitTime);
  const diffMs = exit.getTime() - entry.getTime();
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

interface VehiclePassage {
  id: number;
  passage_number: string;
  entry_time: string;
  exit_time: string | null;
  total_amount: string;
  vehicle: {
    id: number;
    plate_number: string;
    body_type?: {
      name: string;
    };
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
  payment_type?: {
    name: string;
  };
}

interface RecentVehicles {
  parked: VehiclePassage[];
  exited: VehiclePassage[];
}

export default function OperatorDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [recentVehicles, setRecentVehicles] = useState<RecentVehicles>({ parked: [], exited: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentVehicles = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await get<{
          success: boolean;
          data: RecentVehicles;
          message: string;
        }>(`${API_ENDPOINTS.OPERATORS.MY_RECENT_VEHICLES}?limit=5`);
        
        if (response.success && response.data) {
          setRecentVehicles(response.data);
        } else {
          throw new Error(response.message || 'Failed to fetch recent vehicles');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        console.error('Error fetching recent vehicles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentVehicles();
  }, []);

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

        
          {/* Recent Vehicles - Merged Parked and Exited */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Recent Vehicles</CardTitle>
                <CardDescription>
                  Parked and exited vehicles that you processed
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-red-600">
                    <p>{error}</p>
                  </div>
                ) : recentVehicles.parked.length === 0 && recentVehicles.exited.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Car className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No recent vehicles</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(() => {
                      // Combine and sort by time (most recent first)
                      const allVehicles = [
                        ...recentVehicles.parked.map(v => ({ ...v, type: 'parked', sortTime: new Date(v.entry_time).getTime() })),
                        ...recentVehicles.exited.map(v => ({ ...v, type: 'exited', sortTime: new Date(v.exit_time || v.entry_time).getTime() }))
                      ].sort((a, b) => b.sortTime - a.sortTime);

                      return allVehicles.map((vehicle, index) => (
                        <motion.div
                          key={`${vehicle.type}-${vehicle.id}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">{vehicle.type === 'parked' ? '🟢' : '🔴'}</span>
                            <div>
                              <p className="font-medium">{vehicle.vehicle?.plate_number || 'N/A'}</p>
                              <p className="text-sm text-muted-foreground">
                                {vehicle.type === 'parked' 
                                  ? `${vehicle.entry_gate?.name || 'Gate N/A'} • Entry: ${formatTime(vehicle.entry_time)}`
                                  : `${vehicle.exit_gate?.name || vehicle.entry_gate?.name || 'Gate N/A'} • Entry: ${formatTime(vehicle.entry_time)} • Exit: ${formatTime(vehicle.exit_time || vehicle.entry_time)} • Duration: ${calculateDuration(vehicle.entry_time, vehicle.exit_time)}`
                                }
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {vehicle.type === 'parked' ? (
                              <>
                                <p className="text-sm font-medium text-muted-foreground">
                                  {vehicle.vehicle?.body_type?.name || 'Unknown'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {vehicle.passage_number}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="font-medium">Tsh. {parseFloat(vehicle.total_amount || '0').toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground">
                                  {vehicle.payment_type?.name || 'N/A'}
                                </p>
                              </>
                            )}
                          </div>
                        </motion.div>
                      ));
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </MainLayout>
    </RouteGuard>
  );
}
