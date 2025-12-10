"use client";

import { useState, useEffect, useMemo } from "react";
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
  Eye,
  Car,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useDetectionLogs, type CameraDetection } from "@/hooks/use-detection-logs";
import { usePageVisibility } from "@/hooks/use-page-visibility";
import { useLanguage } from "@/components/language-provider";
import { formatDate, formatTime } from "@/utils/date-utils";
import { useOperatorGates } from "@/hooks/use-operator-gates";
import { useCameraLocalPolling } from "@/hooks/use-camera-local-polling";
import { RawCameraDetection } from "@/utils/camera-local-client";
import { useDetectionContext } from "@/contexts/detection-context";
import { useCallback } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function OperatorDetectionLogsPage() {
  const { t } = useLanguage();
  const { selectedGate, selectedGateDevices } = useOperatorGates();
  const { detections, loading, error, count, fetchDetectionLogs } = useDetectionLogs(selectedGate?.id);
  const { setLatestNewDetection } = useDetectionContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDetection, setSelectedDetection] = useState<CameraDetection | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const isPageVisible = usePageVisibility();

  // Get camera device
  const cameraDevice = selectedGateDevices?.find(
    (device) => device.device_type === "camera" && device.status === "active"
  );

  // Calculate direction from gate type
  const directionFromGate = selectedGate?.gate_type === "exit" ? 1 : 0;
  const directionFromDevice =
    cameraDevice?.direction?.toLowerCase() === "exit"
      ? 1
      : cameraDevice?.direction?.toLowerCase() === "entry"
        ? 0
        : null;
  const effectiveDirection = directionFromDevice ?? directionFromGate;

  // Handle local detections from camera polling
  const handleLocalDetections = useCallback(
    (detections: RawCameraDetection[]) => {
      if (!detections || detections.length === 0) return;
      const latest = detections[detections.length - 1];
      
      // Normalize to CameraDetection format
      const normalized: CameraDetection = {
        id: latest.id || 0,
        camera_detection_id: latest.id || 0,
        gate_id: selectedGate?.id || null,
        gate: selectedGate
          ? { id: selectedGate.id, name: selectedGate.name, station_id: selectedGate.station?.id || 0 }
          : undefined,
        numberplate: latest.numberplate || latest.originalplate || (latest as any).plate_number || "",
        originalplate: latest.originalplate || latest.numberplate || null,
        detection_timestamp:
          (latest as any).detection_timestamp ||
          latest.timestamp ||
          latest.utc_time ||
          new Date().toISOString(),
        utc_time: latest.utc_time || latest.timestamp || "",
        located_plate: Boolean((latest as any).locatedPlate ?? (latest as any).located_plate ?? true),
        global_confidence: (latest as any).globalconfidence ?? (latest as any).global_confidence ?? "",
        average_char_height: (latest as any).averagecharheight ?? "",
        process_time: (latest as any).processtime ?? 0,
        plate_format: (latest as any).plateformat ?? 0,
        country: latest.country ?? 0,
        country_str: (latest as any).country_str ?? "",
        vehicle_left: (latest as any).vehicleleft ?? 0,
        vehicle_top: (latest as any).vehicletop ?? 0,
        vehicle_right: (latest as any).vehicleright ?? 0,
        vehicle_bottom: (latest as any).vehiclebottom ?? 0,
        result_left: (latest as any).resultleft ?? 0,
        result_top: (latest as any).resulttop ?? 0,
        result_right: (latest as any).resultright ?? 0,
        result_bottom: (latest as any).resultbottom ?? 0,
        speed: latest.speed ?? "0",
        lane_id: (latest as any).laneid ?? (latest as any).lane_id ?? 0,
        direction: latest.direction ?? effectiveDirection ?? 0,
        make: latest.make ?? 0,
        model: latest.model ?? 0,
        color: latest.color ?? 0,
        make_str: (latest as any).make_str ?? "",
        model_str: (latest as any).model_str ?? "",
        color_str: (latest as any).color_str ?? "",
        veclass_str: (latest as any).veclass_str ?? "",
        image_path: (latest as any).imagepath ?? "",
        image_retail_path: (latest as any).imageretailpath ?? "",
        width: latest.width ?? 0,
        height: latest.height ?? 0,
        list_id: (latest as any).listid ?? "",
        name_list_id: (latest as any).namelistid ?? "",
        evidences: latest.evidences ?? 0,
        br_ocurr: latest.br_ocurr ?? 0,
        br_time: latest.br_time ?? 0,
        raw_data: latest,
        processed: false,
        processed_at: null,
        processing_status: (latest as any).processing_status ?? "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setLatestNewDetection(normalized);
      if (normalized.numberplate) {
        toast.success(`📷 Camera detected ${normalized.numberplate}`);
      }
    },
    [selectedGate, setLatestNewDetection, effectiveDirection]
  );

  // Frontend camera polling - fetches from camera and pushes to DB
  const {
    featureEnabled: localPollingEnabled,
    lastError: localPollingError,
    isPosting,
  } = useCameraLocalPolling({
    gateId: selectedGate?.id,
    cameraDevice,
    enabled: true,
    direction: effectiveDirection,
    onNewDetections: handleLocalDetections,
    onPosted: () => {
      // Refresh DB list after successful post
      setTimeout(() => {
        fetchDetectionLogs(true);
        setLastUpdate(new Date());
      }, 500);
    },
  });

  // Initial fetch from DB
  useEffect(() => {
    if (isPageVisible && selectedGate) {
      fetchDetectionLogs();
    }
  }, [isPageVisible, selectedGate, fetchDetectionLogs]);

  // Auto-refresh from DB (after camera polling pushes new detections)
  useEffect(() => {
    if (!autoRefresh || !isPageVisible || !selectedGate) return;

    const intervalId = setInterval(() => {
      fetchDetectionLogs(true); // Silent mode
      setLastUpdate(new Date());
    }, 5000); // Every 5 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, [autoRefresh, isPageVisible, selectedGate, fetchDetectionLogs]);

  // Filter detections based on search term
  const filteredDetections = useMemo(() => {
    if (!searchTerm) return detections;
    const search = searchTerm.toLowerCase();
    return detections.filter(
      (detection) =>
        detection.numberplate?.toLowerCase().includes(search) ||
        detection.originalplate?.toLowerCase().includes(search) ||
        detection.country_str?.toLowerCase().includes(search)
    );
  }, [detections, searchTerm]);

  // Get confidence badge color
  const getConfidenceColor = (confidence: string | number) => {
    const conf = typeof confidence === "string" ? parseFloat(confidence) : confidence;
    if (conf >= 90) return "bg-green-500";
    if (conf >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Get processing status badge
  const getProcessingStatusBadge = (status: string | null | undefined) => {
    if (!status) return <Badge variant="outline">Pending</Badge>;
    if (status === "pending_vehicle_type")
      return <Badge variant="outline" className="text-yellow-600">Awaiting Type</Badge>;
    if (status === "pending_exit")
      return <Badge variant="outline" className="text-blue-600">Awaiting Exit</Badge>;
    if (status === "processed")
      return <Badge variant="outline" className="text-green-600">Processed</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  // Table columns
  const columns: TableColumn<CameraDetection>[] = [
    {
      key: "id",
      title: "ID",
      dataIndex: "id",
      width: 80,
      align: "center",
    },
    {
      key: "timestamp",
      title: "Timestamp",
      render: (_, record) => {
        const timestamp = record.detection_timestamp || record.timestamp;
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium">{formatDate(timestamp)}</span>
            <span className="text-xs text-muted-foreground">{formatTime(timestamp)}</span>
          </div>
        );
      },
      width: 150,
    },
    {
      key: "numberplate",
      title: "Plate Number",
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          <span className="font-mono font-semibold text-lg">{record.numberplate}</span>
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
      title: "Country",
      render: (_, record) => <Badge variant="secondary">{record.country_str || "N/A"}</Badge>,
      width: 120,
    },
    {
      key: "confidence",
      title: "Confidence",
      render: (_, record) => {
        const confidence = record.global_confidence || record.globalconfidence || "0";
        return (
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${getConfidenceColor(confidence)}`} />
              <span className="font-medium">{confidence}%</span>
            </div>
          </div>
        );
      },
      width: 130,
    },
    {
      key: "status",
      title: "Status",
      render: (_, record) => getProcessingStatusBadge(record.processing_status),
      width: 140,
    },
    {
      key: "speed",
      title: "Speed",
      render: (_, record) => (
        <span className="text-sm">{parseFloat(record.speed || "0").toFixed(2)} km/h</span>
      ),
      width: 100,
    },
    {
      key: "actions",
      title: "Actions",
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
          View
        </Button>
      ),
      width: 100,
      align: "center",
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
            <h1 className="text-3xl font-bold text-gradient">Detection Logs</h1>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground mt-2">
                Fetching from camera and posting to database. Shows stored detections from DB.
              </p>
              {selectedGate && (
                <Badge variant="outline" className="mt-2">
                  Gate: {selectedGate.name}
                </Badge>
              )}
              {autoRefresh && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                  <Clock className="w-3 h-3" />
                  <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
            {!selectedGate && (
              <div className="mt-2 flex items-center space-x-2 text-sm text-orange-600 dark:text-orange-400">
                <AlertCircle className="w-4 h-4" />
                <span>Please select a gate to view detection logs</span>
              </div>
            )}
            {localPollingEnabled && selectedGate && cameraDevice && (
              <div className="mt-2 flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                <div className={`w-2 h-2 rounded-full ${isPosting ? "bg-yellow-500 animate-pulse" : "bg-green-500"}`} />
                <span>
                  {isPosting ? "Posting to database..." : "Camera polling active"}
                </span>
              </div>
            )}
            {localPollingEnabled && localPollingError && (
              <div className="mt-2 flex items-center space-x-2 text-sm text-yellow-500 dark:text-yellow-400">
                <AlertCircle className="w-4 h-4" />
                <span>Camera polling issue: {localPollingError}</span>
              </div>
            )}
            {localPollingEnabled && !cameraDevice && selectedGate && (
              <div className="mt-2 flex items-center space-x-2 text-sm text-orange-600 dark:text-orange-400">
                <AlertCircle className="w-4 h-4" />
                <span>No active camera device configured for this gate</span>
              </div>
            )}
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
                  Auto-Refresh ON
                </>
              ) : (
                <>Auto-Refresh OFF</>
              )}
            </Button>
            <Button variant="outline" onClick={() => fetchDetectionLogs()} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Detections</CardTitle>
                <Camera className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-muted-foreground">All time for this gate</p>
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
                <CardTitle className="text-sm font-medium">Pending Processing</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {detections.filter((d) => !d.processed && !d.processing_status).length}
                </div>
                <p className="text-xs text-muted-foreground">Awaiting processing</p>
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
                <CardTitle className="text-sm font-medium">Processed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {detections.filter((d) => d.processed || d.processing_status === "processed").length}
                </div>
                <p className="text-xs text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Detection Logs</CardTitle>
            <CardDescription>
              This page fetches detections directly from the camera (LAN) and posts them to the database.
              The table below shows all stored detections from the database for your assigned gate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by plate number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-600">{error}</span>
                </div>
              </div>
            )}

            {loading && !detections.length ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading detection logs...</p>
                </div>
              </div>
            ) : filteredDetections.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? "No detections match your search" : "No detections found"}
                  </p>
                </div>
              </div>
            ) : (
              <DataTable columns={columns} data={filteredDetections} />
            )}
          </CardContent>
        </Card>

        {/* Detection Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detection Details</DialogTitle>
              <DialogDescription>Complete information about this camera detection</DialogDescription>
            </DialogHeader>
            {selectedDetection && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Plate Number</label>
                    <p className="text-lg font-mono font-semibold">{selectedDetection.numberplate}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Original Plate</label>
                    <p className="text-lg font-mono">{selectedDetection.originalplate || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
                    <p className="text-sm">
                      {formatDate(selectedDetection.detection_timestamp || selectedDetection.timestamp)}
                      {" "}
                      {formatTime(selectedDetection.detection_timestamp || selectedDetection.timestamp)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Confidence</label>
                    <p className="text-sm">
                      {selectedDetection.global_confidence || selectedDetection.globalconfidence || "0"}%
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Gate</label>
                    <p className="text-sm">{selectedDetection.gate?.name || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Lane</label>
                    <p className="text-sm">Lane {selectedDetection.lane_id || selectedDetection.laneid || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Speed</label>
                    <p className="text-sm">{parseFloat(selectedDetection.speed || "0").toFixed(2)} km/h</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Direction</label>
                    <p className="text-sm">
                      {selectedDetection.direction === 0 ? "Entry" : selectedDetection.direction === 1 ? "Exit" : "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Country</label>
                    <p className="text-sm">{selectedDetection.country_str || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Processing Status</label>
                    <p className="text-sm">{selectedDetection.processing_status || "Pending"}</p>
                  </div>
                  {selectedDetection.make_str && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Vehicle Make</label>
                      <p className="text-sm">{selectedDetection.make_str}</p>
                    </div>
                  )}
                  {selectedDetection.model_str && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Vehicle Model</label>
                      <p className="text-sm">{selectedDetection.model_str}</p>
                    </div>
                  )}
                  {selectedDetection.color_str && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Vehicle Color</label>
                      <p className="text-sm">{selectedDetection.color_str}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
