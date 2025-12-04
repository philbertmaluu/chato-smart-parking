"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableColumn } from "@/components/ui/table";
import {
  Search,
  RefreshCw,
  Camera,
  Clock,
  MapPin,
  TrendingUp,
  Eye,
  Car,
  CheckCircle,
} from "lucide-react";
import { useDetectionLogs, type CameraDetection } from "@/hooks/use-detection-logs";
import { CameraDetectionService } from "@/utils/api/camera-detection-service";
import { usePageVisibility } from "@/hooks/use-page-visibility";
import { useAdaptivePolling } from "@/hooks/use-adaptive-polling";
import { useLanguage } from "@/components/language-provider";
import { formatDate, formatTime } from "@/utils/date-utils";
import { useDetectionContext } from "@/contexts/detection-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Optimized polling interval: 5 seconds (camera detection takes 10-25s, so 1.5s was too frequent)
const POLL_INTERVAL = 5000; // 5 seconds - reduced frequency to prevent server overload

export default function DetectionLogsPage() {
  const { t } = useLanguage();
  const { detections, loading, error, count, fetchDetectionLogs, checkForNewData, checkForNewDetections } = useDetectionLogs();
  const { setLatestNewDetection } = useDetectionContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDetection, setSelectedDetection] = useState<CameraDetection | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [newDataArrived, setNewDataArrived] = useState(false);
  const [showNewCarPopup, setShowNewCarPopup] = useState(false);
  const [latestDetection, setLatestDetection] = useState<CameraDetection | null>(null);
  const isPageVisible = usePageVisibility();
  const previousLatestIdRef = useRef<number>(0);
  const isInitialLoadRef = useRef<boolean>(true);

  // Initial fetch
  useEffect(() => {
    if (isPageVisible) {
      fetchDetectionLogs();
    }
  }, [isPageVisible, fetchDetectionLogs]);

  // Track camera availability to skip polling when unavailable
  const cameraAvailableRef = useRef<boolean>(true);
  const consecutiveCameraFailuresRef = useRef<number>(0);

  // Polling: Fetch from camera API and compare with DB every 5 seconds
  useEffect(() => {
    if (!autoRefresh || !isPageVisible) return;

    let intervalId: NodeJS.Timeout | null = null;

    const pollCameraAndUpdate = async () => {
      // Skip camera polling if camera has been unavailable multiple times
      // This prevents 10-second timeouts on every poll
      if (!cameraAvailableRef.current && consecutiveCameraFailuresRef.current >= 3) {
        // Only fetch from DB, skip camera API call
        console.log('[Detection Logs] Camera unavailable, skipping camera poll, fetching from DB only');
        await fetchDetectionLogs(true);
        return;
      }

      try {
        console.log('[Detection Logs] Polling camera API and checking DB...');
        // Step 1: Fetch from camera API and store new detections
        // This compares camera detections with DB and stores new ones
        const fetchResult = await CameraDetectionService.fetchAndStoreFromCamera();
        
        if (fetchResult.success && fetchResult.data) {
          const { fetched, stored, skipped } = fetchResult.data;
          console.log('[Detection Logs] Camera poll result:', { fetched, stored, skipped });
          
          // Reset failure counter on success
          cameraAvailableRef.current = true;
          consecutiveCameraFailuresRef.current = 0;
          
          // Step 2: If new detections were stored, fetch updated list from DB
          if (stored > 0) {
            console.log('[Detection Logs] New detections stored, fetching updated list from DB...');
            await fetchDetectionLogs(true); // Silent mode to avoid loading spinner
          } else {
            // Even if no new detections, refresh from DB to ensure we have latest data
            await fetchDetectionLogs(true);
          }
        } else {
          // If fetch-and-store failed (e.g., camera unreachable), still try to get data from DB
          // Don't log as error - camera unavailability is expected in some scenarios
          if (fetchResult.data?.camera_unavailable) {
            console.log('[Detection Logs] Camera unavailable, fetching from DB only');
            cameraAvailableRef.current = false;
            consecutiveCameraFailuresRef.current += 1;
          } else {
            console.warn('[Detection Logs] Camera fetch failed, fetching from DB only');
            consecutiveCameraFailuresRef.current += 1;
          }
          await fetchDetectionLogs(true);
        }
      } catch (err) {
        console.error('[Detection Logs] Error polling camera and DB:', err);
        consecutiveCameraFailuresRef.current += 1;
        // On error, still try to fetch from DB
        try {
          await fetchDetectionLogs(true);
        } catch (dbErr) {
          console.error('[Detection Logs] Error fetching from DB:', dbErr);
        }
      }
    };

    // Poll every 5 seconds
    intervalId = setInterval(pollCameraAndUpdate, POLL_INTERVAL);
    
    // Don't poll immediately - initial fetch is handled separately
    // This prevents duplicate fetches and race conditions

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, isPageVisible, fetchDetectionLogs]);

  // Watch for new detections and show popup
  useEffect(() => {
    if (!detections || !Array.isArray(detections) || detections.length === 0) {
      // Reset initial load flag if no detections
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
      }
      return;
    }
    
    const currentLatestDetection = detections[0];
    if (!currentLatestDetection || typeof currentLatestDetection.id !== 'number') {
      return;
    }
    
    const currentLatestId = currentLatestDetection.id;
    const previousId = previousLatestIdRef.current;
    const isInitialLoad = isInitialLoadRef.current;
    
    // On initial load, just set the ref and return
    if (isInitialLoad) {
      previousLatestIdRef.current = currentLatestId;
      setLatestDetection(currentLatestDetection);
      isInitialLoadRef.current = false;
      return;
    }
    
    // Check if we have a new detection
    if (currentLatestId > previousId) {
      // New detection found
      console.log('[Detection Logs] New detection found! ID:', currentLatestId, 'Plate:', currentLatestDetection.numberplate);
      setLastUpdate(new Date());
      setNewDataArrived(true);
      setShowNewCarPopup(true);
      
      // Notify other pages (parked/entry) about the new detection via context
      setLatestNewDetection(currentLatestDetection);
      
      setTimeout(() => {
        setNewDataArrived(false);
        setShowNewCarPopup(false);
      }, 3000);
    }
    
    // Update ref for next comparison
    previousLatestIdRef.current = currentLatestId;
    setLatestDetection(currentLatestDetection);
  }, [detections]);

  // Filter detections based on search term
  const filteredDetections = useMemo(() => {
    if (!searchTerm) return detections;
    const search = searchTerm.toLowerCase();
    return detections.filter((detection) =>
      detection.numberplate?.toLowerCase().includes(search) ||
      detection.originalplate?.toLowerCase().includes(search) ||
      detection.country_str?.toLowerCase().includes(search)
    );
  }, [detections, searchTerm]);

  // Get confidence badge color
  const getConfidenceColor = (confidence: string | number) => {
    const conf = typeof confidence === 'string' ? parseFloat(confidence) : confidence;
    if (conf >= 90) return "bg-green-500";
    if (conf >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Table columns
  const columns: TableColumn<CameraDetection>[] = [
    {
      key: "id",
      title: t("detectionLogs.id") || "ID",
      dataIndex: "id",
      width: 80,
      align: "center",
    },
    {
      key: "gate",
      title: t("detectionLogs.gate") || "Gate",
      render: (_, record) => (
        <Badge variant="default" className="font-medium">
          {record.gate?.name || "N/A"}
        </Badge>
      ),
      width: 120,
    },
    {
      key: "timestamp",
      title: t("detectionLogs.timestamp") || "Timestamp",
      render: (_, record) => {
        const timestamp = record.detection_timestamp || record.timestamp;
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {formatDate(timestamp)}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTime(timestamp)}
            </span>
          </div>
        );
      },
      width: 150,
    },
    {
      key: "numberplate",
      title: t("detectionLogs.plateNumber") || "Plate Number",
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          <span className="font-mono font-semibold text-lg">
            {record.numberplate}
          </span>
          {record.originalplate !== record.numberplate && (
            <Badge variant="outline" className="text-xs">
              {record.originalplate}
            </Badge>
          )}
        </div>
      ),
      width: 180,
    },
    {
      key: "country",
      title: t("detectionLogs.country") || "Country",
      render: (_, record) => (
        <Badge variant="secondary">{record.country_str || "N/A"}</Badge>
      ),
      width: 120,
    },
    {
      key: "confidence",
      title: t("detectionLogs.confidence") || "Confidence",
      render: (_, record) => {
        const confidence = record.global_confidence || record.globalconfidence || '0';
        return (
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div
                className={`w-2 h-2 rounded-full ${getConfidenceColor(confidence)}`}
              />
              <span className="font-medium">{confidence}%</span>
            </div>
          </div>
        );
      },
      width: 130,
    },
    {
      key: "lane",
      title: t("detectionLogs.lane") || "Lane",
      render: (_, record) => (
        <Badge variant="outline">Lane {record.lane_id || record.laneid}</Badge>
      ),
      width: 100,
    },
    {
      key: "speed",
      title: t("detectionLogs.speed") || "Speed",
      render: (_, record) => (
        <span className="text-sm">
          {parseFloat(record.speed).toFixed(2)} km/h
        </span>
      ),
      width: 100,
    },
    {
      key: "actions",
      title: t("common.actions") || "Actions",
      render: (_, record) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedDetection(record);
            setShowDetailsDialog(true);
          }}
        >
          <Eye className="w-4 h-4 mr-1" />
          {t("common.view") || "View"}
        </Button>
      ),
      width: 100,
      align: "center",
    },
  ];

  return (
    <MainLayout>
      {/* New Car Detection Popup */}
      {showNewCarPopup && latestDetection && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50"
        >
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 border-0 shadow-2xl shadow-green-500/50 min-w-[400px]">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/30 rounded-full animate-ping" />
                    <div className="relative bg-white rounded-full p-3">
                      <Car className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-white" />
                    <h3 className="text-xl font-bold text-white">
                      New Vehicle Detected!
                    </h3>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-white/90 text-sm font-medium">Plate Number:</span>
                      <span className="text-white font-bold text-lg font-mono bg-white/20 px-3 py-1 rounded">
                        {latestDetection.numberplate}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-white/80">
                      {latestDetection.gate && (
                        <>
                          <span className="bg-white/30 px-2 py-1 rounded font-semibold">{latestDetection.gate.name}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>Lane {latestDetection.lane_id || latestDetection.laneid}</span>
                      <span>•</span>
                      <span>Confidence: {latestDetection.global_confidence || latestDetection.globalconfidence || '0'}%</span>
                      <span>•</span>
                      <span>{parseFloat(latestDetection.speed).toFixed(0)} km/h</span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="bg-white/20 rounded-full p-2">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

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
              {t("detectionLogs.title") || "Detection Logs"}
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground mt-2">
                {t("detectionLogs.description") || "View stored camera detection logs and vehicle plate recognition data from database"}
              </p>
              {autoRefresh && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                  <Clock className="w-3 h-3" />
                  <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
              size="sm"
            >
              {autoRefresh ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2" />
                  {t("detectionLogs.autoRefreshOn") || "Auto-Refresh ON"}
                </>
              ) : (
                <>
                  {t("detectionLogs.autoRefreshOff") || "Auto-Refresh OFF"}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => fetchDetectionLogs()}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {t("common.refresh") || "Refresh"}
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className={newDataArrived ? "border-green-500 shadow-lg shadow-green-500/20" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("detectionLogs.totalDetections") || "Total Detections"}
                </CardTitle>
                <Camera className={`h-4 w-4 ${newDataArrived ? "text-green-500" : "text-muted-foreground"}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${newDataArrived ? "text-green-500" : ""}`}>
                  {count}
                  {newDataArrived && (
                    <span className="ml-2 text-xs text-green-500 animate-pulse">NEW!</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("detectionLogs.allTime") || "All time"}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("detectionLogs.currentView") || "Current View"}
                </CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredDetections.length}</div>
                <p className="text-xs text-muted-foreground">
                  {t("detectionLogs.filteredResults") || "Filtered results"}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("detectionLogs.avgConfidence") || "Avg Confidence"}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredDetections.length > 0
                    ? (
                        filteredDetections.reduce(
                          (sum, d) => sum + parseFloat(String(d.global_confidence || d.globalconfidence || "0")),
                          0
                        ) / filteredDetections.length
                      ).toFixed(1)
                    : "0.0"}
                  %
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("detectionLogs.accuracy") || "Detection accuracy"}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("detectionLogs.uniquePlates") || "Unique Plates"}
                </CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(filteredDetections.map((d) => d.numberplate)).size}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("detectionLogs.distinctVehicles") || "Distinct vehicles"}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder={t("detectionLogs.searchPlaceholder") || "Search by plate number, country..."}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </motion.div>
        )}

        {/* Detection Logs Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <DataTable
            dataSource={filteredDetections}
            columns={columns}
            loading={loading}
            exportable
            searchable={false}
            exportFileName="detection-logs"
            searchFields={["numberplate", "originalplate", "country_str"]}
          />
        </motion.div>

        {/* Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {t("detectionLogs.details") || "Detection Details"}
              </DialogTitle>
              <DialogDescription>
                {t("detectionLogs.detailsDescription") || "Complete information about this detection"}
              </DialogDescription>
            </DialogHeader>
            {selectedDetection && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <h4 className="font-semibold mb-2">{t("detectionLogs.basicInfo") || "Basic Information"}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID:</span>
                      <span className="font-medium">{selectedDetection.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("detectionLogs.gate") || "Gate"}:</span>
                      <span className="font-medium">{selectedDetection.gate?.name || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("detectionLogs.timestamp") || "Timestamp"}:</span>
                      <span className="font-medium">{formatDate(selectedDetection.detection_timestamp || selectedDetection.timestamp)} {formatTime(selectedDetection.detection_timestamp || selectedDetection.timestamp)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("detectionLogs.plateNumber") || "Plate Number"}:</span>
                      <span className="font-mono font-semibold">{selectedDetection.numberplate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("detectionLogs.originalPlate") || "Original Plate"}:</span>
                      <span className="font-mono">{selectedDetection.originalplate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("detectionLogs.country") || "Country"}:</span>
                      <span className="font-medium">{selectedDetection.country_str}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">{t("detectionLogs.detectionInfo") || "Detection Information"}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("detectionLogs.confidence") || "Confidence"}:</span>
                      <span className="font-medium">{selectedDetection.global_confidence || selectedDetection.globalconfidence || '0'}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("detectionLogs.lane") || "Lane"}:</span>
                      <span className="font-medium">Lane {selectedDetection.lane_id || selectedDetection.laneid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("detectionLogs.speed") || "Speed"}:</span>
                      <span className="font-medium">{parseFloat(selectedDetection.speed).toFixed(2)} km/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("detectionLogs.processTime") || "Process Time"}:</span>
                      <span className="font-medium">{selectedDetection.process_time || selectedDetection.processtime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("detectionLogs.direction") || "Direction"}:</span>
                      <span className="font-medium">{selectedDetection.direction === 0 ? t("detectionLogs.entry") || "Entry" : t("detectionLogs.exit") || "Exit"}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">{t("detectionLogs.vehicleInfo") || "Vehicle Information"}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("detectionLogs.make") || "Make"}:</span>
                      <span className="font-medium">{selectedDetection.make_str || selectedDetection.make || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("detectionLogs.model") || "Model"}:</span>
                      <span className="font-medium">{selectedDetection.model_str || selectedDetection.model || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("detectionLogs.color") || "Color"}:</span>
                      <span className="font-medium">{selectedDetection.color_str || selectedDetection.color || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("detectionLogs.vehicleClass") || "Vehicle Class"}:</span>
                      <span className="font-medium">{selectedDetection.veclass_str || "N/A"}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">{t("detectionLogs.imageInfo") || "Image Information"}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("detectionLogs.resolution") || "Resolution"}:</span>
                      <span className="font-medium">{selectedDetection.width} x {selectedDetection.height}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("detectionLogs.imagePath") || "Image Path"}:</span>
                      <span className="font-mono text-xs truncate max-w-[200px]">{selectedDetection.image_path || selectedDetection.imagepath}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("detectionLogs.retailPath") || "Retail Path"}:</span>
                      <span className="font-mono text-xs truncate max-w-[200px]">{selectedDetection.image_retail_path || selectedDetection.imageretailpath}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

