"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { RouteGuard } from "@/components/auth/route-guard";
import { zktecoConfig } from "@/utils/config/zkteco-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";
import {
  Camera,
  CheckCircle,
  AlertCircle,
  Video,
} from "lucide-react";

export default function CameraSetupPage() {
  const [formData] = useState(zktecoConfig.getConfig());

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
            <div className="flex items-center gap-3">
              <Camera className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Live Camera Feed</h1>
                <p className="text-muted-foreground mt-1">
                  ZKTeco Camera - Real-time monitoring
                </p>
              </div>
            </div>
          </motion.div>

          {/* Live Camera Preview - Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Live Camera Preview
                </CardTitle>
                <CardDescription>
                  Real-time camera feed from ZKTeco camera at {formData.ip}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <img
                    key={Date.now()}
                    src={`http://${formData.ip}/edge/cgi-bin/vparcgi.cgi?computerid=1&oper=snapshot&resolution=800x600&i=${new Date().toISOString()}`}
                    alt="Camera Feed"
                    className="w-full h-full object-contain"
                    onLoad={() => {
                      // Auto-refresh every 500ms for smooth video
                      setTimeout(() => {
                        const img = document.querySelector('img[alt="Camera Feed"]') as HTMLImageElement;
                        if (img) {
                          img.src = `http://${formData.ip}/edge/cgi-bin/vparcgi.cgi?computerid=1&oper=snapshot&resolution=800x600&i=${new Date().toISOString()}`;
                        }
                      }, 500);
                    }}
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const errorDiv = target.nextElementSibling as HTMLElement;
                      if (errorDiv && errorDiv.classList.contains('error-message')) {
                        errorDiv.style.display = 'flex';
                      }
                    }}
                  />
                  <div className="error-message absolute inset-0 flex items-center justify-center bg-gray-800 text-white p-4" style={{ display: 'none' }}>
                    <div className="text-center space-y-2">
                      <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
                      <p className="font-semibold">Cannot connect to camera</p>
                      <p className="text-sm text-gray-400">
                        Camera at {formData.ip} is not accessible from this browser.
                        <br />
                        Try opening <a href={`http://${formData.ip}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">http://{formData.ip}</a> in Safari.
                      </p>
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
                    🔴 Live • {formData.ip}
                  </div>
                </div>
                <Alert>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <AlertDescription>
                    <strong>Using camera's native snapshot endpoint:</strong> <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">/edge/cgi-bin/vparcgi.cgi</code>
                    <br />
                    Auto-refreshing every 500ms for smooth real-time monitoring.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </MainLayout>
    </RouteGuard>
  );
}