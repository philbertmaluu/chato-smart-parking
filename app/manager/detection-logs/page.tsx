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
  MapPin,
  TrendingUp,
  Eye,
} from "lucide-react";
import { useDetectionLogs, type CameraDetection } from "@/hooks/use-detection-logs";
import { useLanguage } from "@/components/language-provider";
import { formatDate, formatTime } from "@/utils/date-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DetectionLogsPage() {
  const { t } = useLanguage();
  const { detections, loading, error, count, fetchDetectionLogs } = useDetectionLogs();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDetection, setSelectedDetection] = useState<CameraDetection | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    fetchDetectionLogs();
  }, [fetchDetectionLogs]);

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
  const getConfidenceColor = (confidence: string) => {
    const conf = parseFloat(confidence);
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
      key: "timestamp",
      title: t("detectionLogs.timestamp") || "Timestamp",
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {formatDate(record.timestamp)}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTime(record.timestamp)}
          </span>
        </div>
      ),
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
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div
              className={`w-2 h-2 rounded-full ${getConfidenceColor(record.globalconfidence)}`}
            />
            <span className="font-medium">{record.globalconfidence}%</span>
          </div>
        </div>
      ),
      width: 130,
    },
    {
      key: "lane",
      title: t("detectionLogs.lane") || "Lane",
      render: (_, record) => (
        <Badge variant="outline">Lane {record.laneid}</Badge>
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
            <p className="text-muted-foreground mt-2">
              {t("detectionLogs.description") || "View camera detection logs and vehicle plate recognition data"}
            </p>
          </div>
          <div className="flex items-center space-x-2">
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("detectionLogs.totalDetections") || "Total Detections"}
                </CardTitle>
                <Camera className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
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
                          (sum, d) => sum + parseFloat(d.globalconfidence || "0"),
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
                      <span className="text-muted-foreground">{t("detectionLogs.timestamp") || "Timestamp"}:</span>
                      <span className="font-medium">{formatDate(selectedDetection.timestamp)} {formatTime(selectedDetection.timestamp)}</span>
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
                      <span className="font-medium">{selectedDetection.globalconfidence}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("detectionLogs.lane") || "Lane"}:</span>
                      <span className="font-medium">Lane {selectedDetection.laneid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("detectionLogs.speed") || "Speed"}:</span>
                      <span className="font-medium">{parseFloat(selectedDetection.speed).toFixed(2)} km/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("detectionLogs.processTime") || "Process Time"}:</span>
                      <span className="font-medium">{selectedDetection.processtime}ms</span>
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
                      <span className="font-mono text-xs truncate max-w-[200px]">{selectedDetection.imagepath}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("detectionLogs.retailPath") || "Retail Path"}:</span>
                      <span className="font-mono text-xs truncate max-w-[200px]">{selectedDetection.imageretailpath}</span>
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

