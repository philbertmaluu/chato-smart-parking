"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/language-provider";
import { useOperatorGates } from "@/hooks/use-operator-gates";
import { formatTime, formatDate } from "@/utils/date-utils";
import { getVehicleTypeIcon } from "@/utils/utils";
import {
  Search, Car, Grid, List, RefreshCw, Loader2, AlertCircle,
  Clock, DollarSign, Building2, CheckCircle, LogOut, X,
  TrendingUp, Activity, Shield,
} from "lucide-react";
import { ActivePassage, useActivePassages } from "./hooks/use-active-passages";
import { VehicleExitDialog } from "./components/vehicle-exit-dialog";
import { CameraExitDialog } from "@/app/operator/entry/components/camera-exit-dialog";
import { usePendingDetections } from "@/hooks/use-pending-detections";
import { usePendingExitDetections } from "@/hooks/use-pending-exit-detections";
import { usePageVisibility } from "@/hooks/use-page-visibility";
import { VehicleTypeSelectionModal } from "@/app/operator/entry/components/vehicle-type-selection-modal";
import { toast } from "sonner";
import { useDetectionContext } from "@/contexts/detection-context";
import { CameraDetection } from "@/hooks/use-detection-logs";
import cn from "clsx";

/* ─────────────────────────────────────────────────────────
   STAT CARD — top summary strip
───────────────────────────────────────────────────────── */
function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white border border-gray-200 px-4 py-3">
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
          accent ?? "bg-blue-500/15 border border-blue-500/25"
        )}
      >
        <Icon className="w-4 h-4 text-blue-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold leading-none">
          {label}
        </p>
        <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   VEHICLE CARD — grid mode
───────────────────────────────────────────────────────── */
function VehicleGridCard({
  passage,
  selectedGate,
  onExit,
  index,
}: {
  passage: ActivePassage;
  selectedGate: any;
  onExit: (p: ActivePassage) => void;
  index: number;
}) {
  const vehicleType = passage.vehicle?.body_type?.name || "Unknown";
  const vehicleIcon = getVehicleTypeIcon(vehicleType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.05 * index, duration: 0.3, ease: "easeOut" }}
    >
      <div className="group relative rounded-2xl bg-white border border-gray-200 overflow-hidden hover:border-gray-300 transition-all duration-300 hover:shadow-lg flex flex-col">

        {/* Top accent bar */}
        <div className="h-[2px] w-full bg-gradient-to-r from-blue-600/60 via-blue-400/40 to-transparent" />

        <div className="p-4 flex flex-col gap-3 flex-1">

          {/* Plate + type */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base", vehicleIcon.bgColor)}>
                <span className={vehicleIcon.color}>{vehicleIcon.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 text-base font-mono tracking-wide truncate">
                  {passage.vehicle?.plate_number || "—"}
                </p>
                <span className={cn("text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md", vehicleIcon.bgColor, vehicleIcon.color)}>
                  {vehicleType}
                </span>
              </div>
            </div>
            {passage.passage_number && (
              <span className="text-[10px] text-gray-500 font-mono flex-shrink-0 pt-0.5">
                #{passage.passage_number}
              </span>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: "Entry", value: formatTime(passage.entry_time), icon: Clock },
              { label: "Duration", value: passage.duration || "0m", icon: Activity },
              { label: "Fee", value: passage.currentFee || "Tsh 0", icon: DollarSign, highlight: true },
            ].map(({ label, value, icon: Icon, highlight }) => (
              <div key={label} className="rounded-lg bg-gray-50 border border-gray-200 px-2 py-2 text-center">
                <Icon className={cn("w-3 h-3 mx-auto mb-1", highlight ? "text-emerald-600" : "text-gray-500")} />
                <p className="text-[9px] uppercase tracking-wider text-gray-500 leading-none">{label}</p>
                <p className={cn("text-[11px] font-bold mt-0.5 truncate", highlight ? "text-emerald-600" : "text-gray-700")}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {passage.spot && (
            <p className="text-[10px] text-gray-500">
              Spot: <span className="text-gray-600 font-mono">{passage.spot}</span>
            </p>
          )}
        </div>

        {/* Exit button */}
        <div className="px-4 pb-4">
          <button
            onClick={() => onExit(passage)}
            disabled={!selectedGate}
            className={cn(
              "w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200",
              selectedGate
                ? "bg-rose-100 border border-rose-300 text-rose-700 hover:bg-rose-200 hover:border-rose-400 active:scale-[0.98]"
                : "bg-gray-100 border border-gray-300 text-gray-500 cursor-not-allowed"
            )}
          >
            <LogOut className="w-4 h-4" />
            {selectedGate ? "Process Exit" : "Select Gate"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   VEHICLE ROW — list mode
───────────────────────────────────────────────────────── */
function VehicleListRow({
  passage,
  selectedGate,
  onExit,
  index,
}: {
  passage: ActivePassage;
  selectedGate: any;
  onExit: (p: ActivePassage) => void;
  index: number;
}) {
  const vehicleType = passage.vehicle?.body_type?.name || "Unknown";
  const vehicleIcon = getVehicleTypeIcon(vehicleType);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.04 * index, duration: 0.3, ease: "easeOut" }}
      className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-xl bg-white border border-gray-200 px-4 py-3.5 hover:border-gray-300 transition-all duration-200"
    >
      {/* Vehicle identity */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-base", vehicleIcon.bgColor)}>
          <span className={vehicleIcon.color}>{vehicleIcon.icon}</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-900 font-mono tracking-wide text-base">
              {passage.vehicle?.plate_number || "—"}
            </span>
            <span className={cn("text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md", vehicleIcon.bgColor, vehicleIcon.color)}>
              {vehicleType}
            </span>
            {passage.passage_number && (
              <span className="text-[10px] text-gray-500 font-mono">
                #{passage.passage_number}
              </span>
            )}
          </div>
          {/* Mobile: inline stats under plate */}
          <div className="flex items-center gap-3 mt-1 sm:hidden">
            <span className="text-[11px] text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />{formatTime(passage.entry_time)}
            </span>
            <span className="text-[11px] text-gray-500">{passage.duration || "0m"}</span>
            <span className="text-[11px] font-semibold text-emerald-600">
              {passage.currentFee || "Tsh 0"}
            </span>
          </div>
        </div>
      </div>

      {/* Desktop: stat columns */}
      <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-gray-500">Entry</p>
          <p className="text-xs font-semibold text-gray-700">{formatDate(passage.entry_time)}</p>
          <p className="text-xs text-gray-600">{formatTime(passage.entry_time)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-gray-500">Duration</p>
          <p className="text-sm font-bold text-gray-700">{passage.duration || "0m"}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-gray-500">Fee</p>
          <p className="text-sm font-bold text-emerald-600">{passage.currentFee || "Tsh 0"}</p>
        </div>
      </div>

      {/* Exit button */}
      <button
        onClick={() => onExit(passage)}
        disabled={!selectedGate}
        className={cn(
          "flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold flex-shrink-0 transition-all duration-200 w-full sm:w-auto",
          selectedGate
            ? "bg-rose-100 border border-rose-300 text-rose-700 hover:bg-rose-200 hover:border-rose-400 active:scale-[0.98]"
            : "bg-gray-100 border border-gray-300 text-gray-500 cursor-not-allowed"
        )}
      >
        <LogOut className="w-3.5 h-3.5" />
        {selectedGate ? "Process Exit" : "Select Gate"}
      </button>
    </motion.div>
  );
}

/* ═════════════════════════════════════════════════════════
   MAIN PAGE
═════════════════════════════════════════════════════════ */
export default function ParkedVehicles() {
  const { t } = useLanguage();
  const { selectedGate, selectedGateDevices } = useOperatorGates();
  const { latestNewDetection, clearLatestDetection: clearContextDetection } = useDetectionContext();

  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedPassage, setSelectedPassage] = useState<ActivePassage | null>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showCameraExitDialog, setShowCameraExitDialog] = useState(false);
  const [showVehicleTypeModal, setShowVehicleTypeModal] = useState(false);
  const [contextDetection, setContextDetection] = useState<CameraDetection | null>(null);
  const isPageVisible = usePageVisibility();

  const cameraDevice = selectedGateDevices?.find(
    (d) => d.device_type === "camera" && d.status === "active"
  );

  /* ── Sound ── */
  const notificationSound = useRef<HTMLAudioElement | null>(null);
  const lastSoundPlayed = useRef(0);

  const playDetectionSound = useCallback(() => {
    const now = Date.now();
    if (now - lastSoundPlayed.current < 2200) return;
    notificationSound.current?.play().catch(() => {});
    lastSoundPlayed.current = now;
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      notificationSound.current = new Audio("/sounds/detectionsound.mp3");
      notificationSound.current.preload = "auto";
      notificationSound.current.volume = 0.8;
    }
    return () => { notificationSound.current?.pause(); notificationSound.current = null; };
  }, []);

  /* ── Pending detections ── */
  const { latestDetection: pendingDetection, fetchPendingDetections, clearLatestDetection } =
    usePendingDetections({
      enabled: true,
      onNewDetection: () => { playDetectionSound(); if (isPageVisible) setShowVehicleTypeModal(true); },
    });

  const { latestDetection: latestExitDetection, fetchPendingExitDetections, clearLatestDetection: clearLatestExitDetection } =
    usePendingExitDetections({
      enabled: true,
      onNewDetection: () => { playDetectionSound(); if (isPageVisible) setShowCameraExitDialog(true); },
    });

  useEffect(() => { if (pendingDetection && isPageVisible) setShowVehicleTypeModal(true); }, [pendingDetection, isPageVisible]);
  useEffect(() => { if (latestExitDetection && isPageVisible) setShowCameraExitDialog(true); }, [latestExitDetection, isPageVisible]);

  const { activePassages, loading, error, fetchActivePassages, processVehicleExit, searchActivePassages } =
    useActivePassages();

  useEffect(() => {
    if (isPageVisible) { fetchPendingDetections(); fetchPendingExitDetections(); }
  }, [isPageVisible]);

  useEffect(() => {
    if (!latestNewDetection || !isPageVisible) return;
    const detection = latestNewDetection;
    playDetectionSound();
    setContextDetection(detection);

    if (detection.processing_status === "pending_exit") {
      setShowCameraExitDialog(true);
      clearContextDetection();
      return;
    }
    if (detection.processing_status === "pending_vehicle_type") {
      setShowVehicleTypeModal(true);
      clearContextDetection();
      return;
    }
    const hasActive = activePassages.some(
      (p) => p.vehicle?.plate_number?.toLowerCase() === detection.numberplate?.toLowerCase()
    );
    if (hasActive) { setShowCameraExitDialog(true); } else { setShowVehicleTypeModal(true); }
    clearContextDetection();
  }, [latestNewDetection, isPageVisible, activePassages, clearContextDetection]);

  const filteredPassages = useMemo(
    () => (searchTerm.trim() ? searchActivePassages(searchTerm) : activePassages),
    [activePassages, searchTerm, searchActivePassages]
  );

  const handleProcessExit = (passage: ActivePassage) => {
    if (!selectedGate) { toast.error("Please select a gate first"); return; }
    setSelectedPassage(passage);
    setShowExitDialog(true);
  };

  const handleExitProcessed = () => {
    fetchActivePassages();
    setShowExitDialog(false);
    setSelectedPassage(null);
  };

  const handleVehicleTypeModalSuccess = () => {
    clearLatestDetection();
    setTimeout(() => { fetchPendingDetections(); fetchActivePassages(); }, 200);
  };

  /* ── Derived stats ── */
  const totalFee = useMemo(() => {
    const sum = activePassages.reduce((acc, p) => {
      const raw = p.currentFee?.replace(/[^0-9.]/g, "") || "0";
      return acc + parseFloat(raw);
    }, 0);
    return `Tsh ${sum.toLocaleString()}`;
  }, [activePassages]);

  /* ─────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────── */
  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">

        {/* ══ STICKY HEADER ══ */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur-md px-4 sm:px-6 py-3"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">

            {/* Left: title + gate */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
                <Car className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight leading-none truncate">
                  {t("nav.parked") || "Detected Vehicles"}
                </h1>
                {selectedGate ? (
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {selectedGate.name}
                    </span>
                    {selectedGate.station?.name && (
                      <>
                        <span className="text-gray-500 text-[10px]">·</span>
                        <span className="text-[11px] text-gray-600 truncate max-w-[120px]">
                          {selectedGate.station.name}
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-600 mt-0.5">No gate selected</p>
                )}
              </div>
            </div>

            {/* Right: view toggle + refresh */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => fetchActivePassages()}
                disabled={loading}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin text-blue-600")} />
              </button>

              <div className="flex rounded-lg ring-1 ring-gray-300 overflow-hidden">
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "px-2.5 py-1.5 transition-colors",
                    viewMode === "list"
                      ? "bg-blue-600 text-white"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  )}
                  title="List view"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "px-2.5 py-1.5 transition-colors",
                    viewMode === "grid"
                      ? "bg-blue-600 text-white"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  )}
                  title="Grid view"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.header>

        {/* ══ BODY ══ */}
        <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">

          {/* ── Summary strip ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-2"
          >
            <StatCard icon={Car} label="Total Vehicles" value={activePassages.length} />
            <StatCard
              icon={DollarSign}
              label="Accrued Fees"
              value={totalFee}
              accent="bg-emerald-500/15 border border-emerald-500/25"
            />
            <StatCard
              icon={Activity}
              label="Detections"
              value={pendingDetection ? "Pending" : "None"}
              accent="bg-amber-500/10 border border-amber-500/20"
            />
            <StatCard
              icon={Shield}
              label="Gate"
              value={selectedGate?.name ?? "—"}
              accent="bg-violet-500/15 border border-violet-500/25"
            />
          </motion.div>

          {/* ── Search bar ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            className="relative"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search plate or passage #…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 rounded-xl bg-white border border-gray-300 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
            <AnimatePresence>
              {searchTerm && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-100 text-gray-500 hover:text-gray-700 flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </motion.button>
              )}
            </AnimatePresence>
            {searchTerm && (
              <p className="mt-1.5 px-1 text-[11px] text-gray-600">
                {filteredPassages.length} result{filteredPassages.length !== 1 ? "s" : ""} for "{searchTerm}"
              </p>
            )}
          </motion.div>

          {/* ── Loading ── */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 gap-3"
              >
                <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                <p className="text-sm text-gray-600">Loading active passages…</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Error ── */}
          <AnimatePresence>
            {error && !loading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 gap-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900">Failed to load vehicles</p>
                  <p className="text-xs text-gray-600 mt-1 max-w-xs">{error}</p>
                </div>
                <button
                  onClick={() => fetchActivePassages()}
                  className="flex items-center gap-2 rounded-lg bg-gray-100 border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Try Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Vehicles ── */}
          {!loading && !error && filteredPassages.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredPassages.map((passage, i) => (
                    <VehicleGridCard
                      key={passage.id}
                      passage={passage}
                      selectedGate={selectedGate}
                      onExit={handleProcessExit}
                      index={i}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPassages.map((passage, i) => (
                    <VehicleListRow
                      key={passage.id}
                      passage={passage}
                      selectedGate={selectedGate}
                      onExit={handleProcessExit}
                      index={i}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Empty state ── */}
          {!loading && !error && filteredPassages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center justify-center py-20 gap-4 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-300 flex items-center justify-center">
                <Car className="w-7 h-7 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">No vehicles found</p>
                <p className="text-xs text-gray-600 mt-1 max-w-xs">
                  {searchTerm
                    ? "Try a different plate or passage number"
                    : "Active passages will appear here once vehicles enter the parking area"}
                </p>
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-xs text-blue-600 hover:text-blue-700 underline underline-offset-2"
                >
                  Clear search
                </button>
              )}
            </motion.div>
          )}
        </main>

        {/* ══ MODALS ══ */}
        <VehicleExitDialog
          open={showExitDialog}
          onOpenChange={setShowExitDialog}
          vehicle={selectedPassage}
          onExitProcessed={handleExitProcessed}
        />

        <CameraExitDialog
          open={showCameraExitDialog && (latestExitDetection !== null || contextDetection !== null)}
          onOpenChange={(open) => {
            setShowCameraExitDialog(open);
            if (!open) {
              clearLatestExitDetection();
              if (contextDetection) { setContextDetection(null); clearContextDetection(); }
            }
          }}
          detection={latestExitDetection || (contextDetection as any) || null}
          onExitProcessed={() => {
            clearLatestExitDetection();
            if (contextDetection) { setContextDetection(null); clearContextDetection(); }
            setTimeout(() => { fetchPendingExitDetections(); fetchActivePassages(); }, 200);
          }}
        />

        <VehicleTypeSelectionModal
          open={showVehicleTypeModal && (pendingDetection !== null || contextDetection !== null)}
          onOpenChange={(open) => {
            setShowVehicleTypeModal(open);
            if (!open) {
              clearLatestDetection();
              if (contextDetection) { setContextDetection(null); clearContextDetection(); }
            }
          }}
          detection={pendingDetection || (contextDetection as any) || null}
          onSuccess={() => {
            handleVehicleTypeModalSuccess();
            if (contextDetection) { setContextDetection(null); clearContextDetection(); }
          }}
        />
      </div>
    </MainLayout>
  );
}