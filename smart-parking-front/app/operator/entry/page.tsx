"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { motion, AnimatePresence } from "framer-motion";
import { VehicleEntryDrawer } from "./components/vehicleEntrydrawer";
import { VehicleTypeSelectionModal } from "./components/vehicle-type-selection-modal";
import { CameraExitDialog } from "./components/camera-exit-dialog";
import { useOperatorGates } from "@/hooks/use-operator-gates";
import { usePendingDetections } from "@/hooks/use-pending-detections";
import { usePendingExitDetections } from "@/hooks/use-pending-exit-detections";
import { usePageVisibility } from "@/hooks/use-page-visibility";
import { zktecoConfig } from "@/utils/config/zkteco-config";
import { GateSelectionModal } from "@/components/operator/gate-selection-modal";
import { useDetectionContext } from "@/contexts/detection-context";
import {
  MapPin, Pencil, AlertCircle, Building2, RotateCcw,
  RefreshCw, ScanLine, Loader2, Wifi, WifiOff,
  Camera, Shield, Activity, Zap, ZapOff, ChevronRight,
} from "lucide-react";
import { CameraDetectionService } from "@/utils/api/camera-detection-service";
import { toast } from "sonner";
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { OpenGateButton } from "@/components/open-gate-button";
import cn from "clsx";

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<any>;
  }
}

/* ─────────────────────────────────────────────────────────
   STATUS PILL
───────────────────────────────────────────────────────── */
function StatusPill({
  active,
  activeLabel,
  inactiveLabel,
  activeIcon: ActiveIcon,
  inactiveIcon: InactiveIcon,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
  activeIcon: React.ElementType;
  inactiveIcon: React.ElementType;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase transition-colors select-none",
        active
          ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
          : "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20"
      )}
    >
      {active
        ? <ActiveIcon className="w-3 h-3 flex-shrink-0" />
        : <InactiveIcon className="w-3 h-3 flex-shrink-0" />}
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────
   ACTION BUTTON
───────────────────────────────────────────────────────── */
function ActionBtn({
  onClick,
  disabled,
  loading,
  variant = "default",
  icon: Icon,
  label,
  pulse,
  className,
}: {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "success" | "danger" | "outline" | "default" | "maroon";
  icon: React.ElementType;
  label: string;
  pulse?: boolean;
  className?: string;
}) {
  const base =
    "relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 rounded-xl px-2 sm:px-4 py-3 sm:py-2.5 text-[11px] sm:text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 select-none overflow-hidden w-full";

  const variants: Record<string, string> = {
    primary:
      "bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.35)] hover:bg-blue-500 hover:shadow-[0_0_28px_rgba(59,130,246,0.5)]",
    success:
      "bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-500",
    danger:
      "bg-rose-600/20 text-rose-400 ring-1 ring-rose-500/30 hover:bg-rose-600/30",
    outline:
      "bg-white/5 text-slate-300 ring-1 ring-white/10 hover:bg-white/10 hover:text-white",
    default:
      "bg-gradient-to-br from-slate-700 to-slate-800 text-white ring-1 ring-white/10 hover:from-slate-600 hover:to-slate-700",
    maroon:
      "bg-gradient-to-br from-[#8b1a1a] to-[#6b1212] text-white ring-1 ring-red-900/40 hover:from-[#a01e1e] hover:to-[#7a1515] shadow-[0_0_18px_rgba(139,26,26,0.3)]",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(base, variants[variant], className)}
    >
      {pulse && !loading && (
        <span className="absolute inset-0 rounded-xl ring-2 ring-blue-400/30 animate-ping pointer-events-none" />
      )}
      {loading
        ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
        : <Icon className="w-4 h-4 flex-shrink-0" />
      }
      <span className="leading-none whitespace-nowrap">{loading ? "Wait…" : label}</span>
    </button>
  );
}

/* ═════════════════════════════════════════════════════════
   MAIN PAGE
═════════════════════════════════════════════════════════ */
export default function VehicleEntry() {
  const {
    availableGates, selectedGate, selectedGateDevices,
    loading: gatesLoading, error: gatesError,
    selectGate, deselectGate,
  } = useOperatorGates();

  const [showGateModal, setShowGateModal] = useState(false);
  const [showEntryDrawer, setShowEntryDrawer] = useState(false);
  const [showVehicleTypeModal, setShowVehicleTypeModal] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [captureLoading, setCaptureLoading] = useState(false);
  const [detectedPlateNumber, setDetectedPlateNumber] = useState<string | undefined>(undefined);
  const [capturedDetection, setCapturedDetection] = useState<any>(null);
  const [websocketConnected, setWebsocketConnected] = useState(false);
  const isPageVisible = usePageVisibility();
  const { setLatestNewDetection } = useDetectionContext();

  /* ── Sound ── */
  const notificationSound = useRef<HTMLAudioElement | null>(null);
  const lastSoundPlayed = useRef<number>(0);

  const playDetectionSound = useCallback(() => {
    const now = Date.now();
    if (now - lastSoundPlayed.current < 2200) return;
    if (notificationSound.current) {
      notificationSound.current.currentTime = 0;
      notificationSound.current.play().catch(() => {});
      lastSoundPlayed.current = now;
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      notificationSound.current = new Audio("/sounds/detectionsound.mp3");
      notificationSound.current.preload = "auto";
      notificationSound.current.volume = 0.8;
    }
    return () => { notificationSound.current?.pause(); notificationSound.current = null; };
  }, []);

  /* ── Camera device ── */
  const cameraDevice = selectedGateDevices.find(
    (d) => d.device_type === "camera" && d.status === "active"
  );
  const cameraConfig = zktecoConfig.getConfig();
  const cameraIp = cameraDevice?.ip_address || cameraConfig?.ip || null;
  const cameraHttpPort = cameraDevice?.http_port || cameraConfig?.httpPort || 80;

  /* ── WebSocket ── */
  useEffect(() => {
    if (!selectedGate) return;
    const reverbAppKey = process.env.NEXT_PUBLIC_REVERB_APP_KEY;
    const reverbHost = process.env.NEXT_PUBLIC_REVERB_HOST || "192.168.0.112";
    const reverbPort = parseInt(process.env.NEXT_PUBLIC_REVERB_PORT || "8080");
    const reverbScheme = process.env.NEXT_PUBLIC_REVERB_SCHEME || "http";

    if (!reverbAppKey) { setWebsocketConnected(false); return; }

    try {
      window.Pusher = Pusher;
      window.Echo = new Echo({
        broadcaster: "reverb",
        key: reverbAppKey,
        wsHost: reverbHost,
        wsPort: reverbPort,
        wssPort: reverbPort,
        forceTLS: reverbScheme === "https",
        enabledTransports: ["ws", "wss"],
        authEndpoint: `${process.env.NEXT_PUBLIC_API_URL || "http://192.168.0.112"}/broadcasting/auth`,
        auth: {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            Accept: "application/json",
          },
        },
      });

      const channel = window.Echo.private(`gate.${selectedGate.id}`);
      channel.listen(".new-detection", (event: any) => {
        if ((event.direction ?? 0) !== 0) return;
        playDetectionSound();
        if (isPageVisible) {
          setCapturedDetection({
            id: event.id,
            numberplate: event.numberplate,
            detection_timestamp: event.detection_timestamp,
            gate_id: event.gate_id,
            direction: 0,
            processing_status: "pending_vehicle_type",
            global_confidence: event.global_confidence,
          });
          setDetectedPlateNumber(event.numberplate);
          setShowVehicleTypeModal(true);
          toast.success(`📷 ${event.numberplate}`, { description: `${event.gate_name} · Entry` });
        }
      });

      window.Echo.connector.pusher.connection.bind("connected", () => { setWebsocketConnected(true); });
      window.Echo.connector.pusher.connection.bind("disconnected", () => { setWebsocketConnected(false); });

      return () => {
        try { channel.stopListening(".new-detection"); window.Echo.leave(`gate.${selectedGate.id}`); } catch {}
      };
    } catch { setWebsocketConnected(false); }
  }, [selectedGate, isPageVisible, playDetectionSound]);

  /* ── Polling fallback ── */
  const { latestDetection, fetchPendingDetections, clearLatestDetection } = usePendingDetections({
    enabled: isPageVisible && !websocketConnected,
    pollInterval: websocketConnected ? 0 : 3000,
    onNewDetection: (detection) => {
      if (detection && (detection.direction === 0 || detection.direction == null)) {
        playDetectionSound();
        if (isPageVisible) {
          setCapturedDetection({ ...detection, direction: 0 });
          setDetectedPlateNumber(detection.numberplate);
          setShowVehicleTypeModal(true);
        }
      }
    },
  });

  const { latestDetection: latestExitDetection, fetchPendingExitDetections, clearLatestExitDetection } =
    usePendingExitDetections({
      enabled: true,
      pollInterval: 5000,
      onNewDetection: () => { if (isPageVisible) setShowExitDialog(true); },
    });

  useEffect(() => { if (latestExitDetection && isPageVisible) setShowExitDialog(true); }, [latestExitDetection, isPageVisible]);
  useEffect(() => { if (!gatesLoading && !selectedGate) setShowGateModal(true); }, [gatesLoading, selectedGate]);
  useEffect(() => {
    if (isPageVisible && selectedGate) { fetchPendingDetections(); fetchPendingExitDetections(); }
  }, [isPageVisible, selectedGate]);

  /* ── Camera feed refresh ── */
  useEffect(() => {
    if (!isPageVisible || !selectedGate || !cameraIp || !cameraDevice) return;
    const img = document.getElementById("camera-feed-img") as HTMLImageElement | null;
    if (!img) return;

    const isTauri =
      typeof window !== "undefined" &&
      ((window as any).__TAURI__ || window.location.protocol.includes("tauri"));

    const username = cameraDevice.username || "admin";
    const password = cameraDevice.password || "";
    const port = cameraHttpPort || 80;
    const authPrefix = username || password ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@` : "";
    const buildUrl = (path: string, cacheBust = true) =>
      `http://${authPrefix}${cameraIp}:${port}${path}${cacheBust ? `${path.includes("?") ? "&" : "?"}t=${Date.now()}` : ""}`;

    const snapshotCandidates = [
      "/cgi-bin/snapshot.cgi", "/cgi-bin/snapshot.jpg", "/snapshot.jpg",
      "/Streaming/Channels/1/picture", "/mjpeg", "/video.cgi",
    ];

    let intervalId: NodeJS.Timeout | null = null;
    let currentCandidate = 0;
    let isMjpegActive = false;

    const startSnapshotLoop = () => {
      intervalId = setInterval(async () => {
        const path = snapshotCandidates[currentCandidate % snapshotCandidates.length];
        try {
          const resp = await fetch(buildUrl(path, true));
          if (!resp.ok) throw new Error("fail");
          const blob = await resp.blob();
          const objectUrl = URL.createObjectURL(blob);
          if (img.src?.startsWith("blob:")) URL.revokeObjectURL(img.src);
          img.src = objectUrl;
        } catch {
          currentCandidate = (currentCandidate + 1) % snapshotCandidates.length;
        }
      }, 300);
    };

    if (isTauri) {
      isMjpegActive = true;
      img.src = buildUrl("/cgi-bin/mjpeg", false);
      img.onerror = () => { isMjpegActive = false; startSnapshotLoop(); };
    } else {
      startSnapshotLoop();
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (img.src?.startsWith("blob:")) URL.revokeObjectURL(img.src);
      if (isMjpegActive) img.src = "";
    };
  }, [isPageVisible, selectedGate, cameraIp, cameraHttpPort, cameraDevice]);

  /* ── Manual capture ── */
  const handleCaptureVehicle = async () => {
    if (!selectedGate) { toast.error("Select a gate first"); return; }
    try {
      setCaptureLoading(true);
      const result = await CameraDetectionService.quickCapture({ direction: 0 });
      if (result.success && result.data?.detection?.plate_number) {
        setCapturedDetection({
          id: result.data.detection.id,
          numberplate: result.data.detection.plate_number,
          detection_timestamp: result.data.detection.detection_timestamp,
          gate_id: selectedGate.id,
          direction: 0,
          processing_status: "manual_processing",
          make_str: null, model_str: null, color_str: null,
        });
        setShowVehicleTypeModal(true);
        toast.success(`Plate: ${result.data.detection.plate_number}`);
      } else {
        toast.warning("No vehicle detected");
      }
    } catch { toast.error("Capture failed"); }
    finally { setCaptureLoading(false); }
  };

  const handleVehicleTypeModalSuccess = () => {
    setShowVehicleTypeModal(false);
    clearLatestDetection();
    setCapturedDetection(null);
  };

  /* ─────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────── */
  return (
    <MainLayout>
      <div className="min-h-screen bg-[#090d14] text-slate-200 font-sans">

        {/* ══ STICKY HEADER ══ */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#090d14]/90 backdrop-blur-md px-4 sm:px-6 py-3"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">

            {/* Left */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <Camera className="w-4 h-4 text-blue-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none">
                  Vehicle Entry
                </h1>
                {selectedGate ? (
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {selectedGate.name}
                    </span>
                    {selectedGate.station?.name && (
                      <>
                        <span className="text-slate-600 text-[10px]">·</span>
                        <span className="text-[11px] text-slate-500 truncate max-w-[100px] sm:max-w-none">
                          {selectedGate.station.name}
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-400 mt-0.5">No gate selected</p>
                )}
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {selectedGate && (
                <StatusPill
                  active={websocketConnected}
                  activeLabel="Live"
                  inactiveLabel="Polling"
                  activeIcon={Wifi}
                  inactiveIcon={WifiOff}
                />
              )}
              <button
                onClick={async () => {
                  if (selectedGate) await deselectGate();
                  setShowGateModal(true);
                }}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 ring-1 ring-white/10 hover:bg-white/5 hover:text-white transition-colors"
              >
                <MapPin className="w-3 h-3" />
                <span className="hidden sm:inline">{selectedGate ? "Change Gate" : "Select Gate"}</span>
                <span className="sm:hidden">{selectedGate ? "Gate" : "Gate"}</span>
              </button>
            </div>
          </div>
        </motion.header>

        {/* ══ BODY ══ */}
        <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">

          {/* ── No gate empty state ── */}
          <AnimatePresence>
            {!selectedGate && !gatesLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center gap-5"
              >
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-white/[0.07] flex items-center justify-center">
                  <Shield className="w-7 h-7 text-slate-500" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">No Gate Selected</h2>
                  <p className="text-sm text-slate-500 mt-1 max-w-xs">
                    Select an entry gate to begin monitoring and processing vehicles.
                  </p>
                </div>
                <button
                  onClick={() => setShowGateModal(true)}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:bg-blue-500 transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  Select Gate
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Loading ── */}
          {gatesLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          )}

          {/* ── Gate selected ── */}
          {selectedGate && !gatesLoading && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-4"
            >

              {/* ── ACTION BAR: 2-col on mobile, 4-col on desktop ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">

                {/* Capture — only if camera configured */}
                {cameraDevice ? (
                  <ActionBtn
                    variant="primary"
                    icon={ScanLine}
                    label="Capture"
                    loading={captureLoading}
                    pulse={!captureLoading}
                    onClick={handleCaptureVehicle}
                  />
                ) : (
                  /* Placeholder so grid stays aligned */
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] flex flex-col items-center justify-center gap-1 py-3 text-[11px] text-slate-700 select-none">
                    <Camera className="w-4 h-4" />
                    <span>No Camera</span>
                  </div>
                )}

                {/* Open Gate */}
                <div className="contents">
                  <OpenGateButton
                    selectedGate={selectedGate}
                    size="lg"
                    className="w-full rounded-xl text-[11px] sm:text-sm font-semibold flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 sm:py-2.5"
                  />
                </div>

                {/* Manual Entry */}
                <ActionBtn
                  variant="maroon"
                  icon={Pencil}
                  label="Manual Entry"
                  onClick={() => setShowEntryDrawer(true)}
                />

                {/* Refresh feed — shown only if camera configured */}
                {cameraIp ? (
                  <ActionBtn
                    variant="outline"
                    icon={RefreshCw}
                    label="Refresh Feed"
                    onClick={() => {
                      const img = document.getElementById("camera-feed-img") as HTMLImageElement;
                      if (img && cameraIp) {
                        img.src = `http://${cameraIp}:${cameraHttpPort}/edge/cgi-bin/vparcgi.cgi?computerid=1&oper=snapshot&resolution=800x600&i=${Date.now()}`;
                      }
                    }}
                  />
                ) : (
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.05]" />
                )}
              </div>

              {/* ── CAMERA VIEWPORT ── */}
              <div className="rounded-2xl overflow-hidden border border-white/[0.07] bg-[#0c1220] shadow-2xl">

                {/* Viewport top bar */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                      Live Feed
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    {cameraIp && (
                      <span className="text-[10px] text-slate-700 font-mono hidden sm:inline">
                        {cameraIp}:{cameraHttpPort}
                      </span>
                    )}
                    <StatusPill
                      active={websocketConnected}
                      activeLabel="Real-time"
                      inactiveLabel="Polling"
                      activeIcon={Zap}
                      inactiveIcon={ZapOff}
                    />
                  </div>
                </div>

                {/* Feed area — 16:9 on desktop, taller on mobile for readability */}
                <div className="relative w-full bg-[#080c13]"
                  style={{ aspectRatio: "16/9", minHeight: "clamp(220px, 40vw, 520px)" }}>

                  {/* Loading */}
                  {gatesLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                      <p className="text-sm text-slate-500">Initialising gate…</p>
                    </div>
                  )}

                  {/* No camera */}
                  {!gatesLoading && !cameraIp && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-300">Camera Not Configured</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Assign a camera device to this gate in Gate Settings.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Live image */}
                  {!gatesLoading && cameraIp && (
                    <>
                      <img
                        id="camera-feed-img"
                        src={`http://${cameraIp}:${cameraHttpPort}/edge/cgi-bin/vparcgi.cgi?computerid=1&oper=snapshot&resolution=800x600&i=${Date.now()}`}
                        alt="Camera Feed"
                        className="w-full h-full object-contain"
                        onError={(e) => console.error("Camera feed error", e)}
                      />

                      {/* Corner brackets — scanframe UI */}
                      <span className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-blue-400/50 rounded-tl-sm pointer-events-none" />
                      <span className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-blue-400/50 rounded-tr-sm pointer-events-none" />
                      <span className="absolute bottom-10 left-3 w-5 h-5 border-b-2 border-l-2 border-blue-400/50 rounded-bl-sm pointer-events-none" />
                      <span className="absolute bottom-10 right-3 w-5 h-5 border-b-2 border-r-2 border-blue-400/50 rounded-br-sm pointer-events-none" />

                      {/* REC pill */}
                      <div className="absolute bottom-12 left-4 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-widest ring-1 ring-white/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        REC
                      </div>

                      {/* Gate label */}
                      <div className="absolute bottom-12 right-4 rounded-lg bg-black/60 backdrop-blur-sm px-2.5 py-1 text-[10px] font-semibold text-slate-300 ring-1 ring-white/10">
                        {selectedGate.name} · Entry
                      </div>
                    </>
                  )}
                </div>

                {/* Footer stat strip — 2-col mobile, 4-col desktop */}
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/[0.05] border-t border-white/[0.06]">
                  {[
                    { label: "Gate", value: selectedGate.name, icon: Building2 },
                    { label: "Direction", value: "Entry", icon: Activity },
                    { label: "Camera", value: cameraIp ?? "Not set", icon: Camera },
                    { label: "Connection", value: websocketConnected ? "Real-time" : "Polling", icon: websocketConnected ? Wifi : WifiOff },
                  ].map(({ label, value, icon: Icon }, i) => (
                    <div key={label} className={cn(
                      "flex items-center gap-2 px-3 sm:px-4 py-2.5",
                      // on mobile, bottom row (index 2,3) gets a top border since we have 2 cols
                      i >= 2 ? "border-t border-white/[0.05] sm:border-t-0" : ""
                    )}>
                      <Icon className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase tracking-wider text-slate-600 leading-none">
                          {label}
                        </p>
                        <p className="text-[11px] font-semibold text-slate-300 truncate mt-0.5">
                          {value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}
        </main>

        {/* ══ MODALS & DRAWERS ══ */}
        <VehicleEntryDrawer
          open={showEntryDrawer}
          onOpenChange={(open) => {
            setShowEntryDrawer(open);
            if (!open) setDetectedPlateNumber(undefined);
          }}
          selectedGateId={selectedGate?.id}
          detectedPlateNumber={detectedPlateNumber}
          isPlateDetectionEnabled={!!detectedPlateNumber}
          onVehicleRegistered={() => {
            setDetectedPlateNumber(undefined);
            setShowEntryDrawer(false);
          }}
        />

        <GateSelectionModal
          open={showGateModal}
          onClose={() => setShowGateModal(false)}
          onGateSelected={() => {}}
        />

        <VehicleTypeSelectionModal
          open={showVehicleTypeModal && capturedDetection !== null}
          onOpenChange={(open) => {
            setShowVehicleTypeModal(open);
            if (!open) setCapturedDetection(null);
          }}
          detection={capturedDetection}
          onSuccess={handleVehicleTypeModalSuccess}
        />

        <CameraExitDialog
          open={showExitDialog && latestExitDetection !== null}
          onOpenChange={(open) => {
            setShowExitDialog(open);
            if (!open) clearLatestExitDetection();
          }}
          detection={latestExitDetection}
          onExitProcessed={() => {
            clearLatestExitDetection();
            setTimeout(fetchPendingExitDetections, 200);
          }}
        />
      </div>
    </MainLayout>
  );
}