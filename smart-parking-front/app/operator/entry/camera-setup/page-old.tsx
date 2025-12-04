"use client";

import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { RouteGuard } from "@/components/auth/route-guard";
import { useZKTecoCamera } from "@/hooks/use-zkteco-camera";
import { ZKTecoCameraConfig, zktecoConfig } from "@/utils/config/zkteco-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ZKTecoCameraWidget } from "@/components/camera/zkteco-camera-widget";
import { motion } from "framer-motion";
import { 
  Camera,
  Video, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Search,
  Save,
  Settings,
  TestTube,
} from "lucide-react";

export default function CameraSetupPage() {
  const [formData, setFormData] = useState<ZKTecoCameraConfig>(zktecoConfig.getConfig());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{success: boolean; message: string} | null>(null);
  
  const {
    isConnected,
    connectionStatus,
    error,
    testConnection,
    updateCredentials,
  } = useZKTecoCamera({ autoConnect: false });

  // Test camera connection
  const testCamera = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Try to access camera via our API proxy
      const response = await fetch('/api/zkteco-stream?type=snapshot&test=true', {
        method: 'GET',
        headers: {
          'X-Camera-IP': cameraIp,
          'X-Camera-Username': username,
          'X-Camera-Password': password,
        },
      });

      if (response.ok) {
        setTestResult({
          success: true,
          message: '✅ Camera is accessible! You can now view the live stream.'
        });
      } else {
        setTestResult({
          success: false,
          message: `❌ Camera not accessible (HTTP ${response.status}). Check IP address and credentials.`
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: '❌ Cannot reach camera. Check network connection and IP address.'
      });
    } finally {
      setTesting(false);
    }
  };

  // Save configuration
  const saveConfig = () => {
    localStorage.setItem('camera_config', JSON.stringify({
      ip: cameraIp,
      username,
      password,
    }));
    alert('Camera configuration saved!');
  };

  // Load saved configuration
  useEffect(() => {
    const saved = localStorage.getItem('camera_config');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        setCameraIp(config.ip || "192.168.0.109");
        setUsername(config.username || "admin");
        setPassword(config.password || "Password123!");
      } catch (e) {
        console.error('Failed to load saved config');
      }
    }
  }, []);

  // Start demo mode with webcam
  const startDemoMode = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setDemoMode(true);
      }
    } catch (error) {
      alert('Cannot access webcam. Please allow camera access in your browser.');
    }
  };

  // Stop demo mode
  const stopDemoMode = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setDemoMode(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Camera Setup & Testing</h1>
        <p className="text-muted-foreground">
          Configure your ZKTeco camera connection or test with your webcam
        </p>
      </div>

      {/* Camera Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Camera Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="camera-ip">Camera IP Address</Label>
              <Input
                id="camera-ip"
                value={cameraIp}
                onChange={(e) => setCameraIp(e.target.value)}
                placeholder="192.168.0.109"
              />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password123!"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={testCamera}
              disabled={testing}
              className="flex-1"
            >
              {testing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Test Connection
            </Button>
            
            <Button
              onClick={saveConfig}
              variant="outline"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Config
            </Button>
          </div>

          {testResult && (
            <Alert variant={testResult.success ? "default" : "destructive"}>
              {testResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{testResult.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Demo Mode */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Demo Mode (Use Your Webcam)</span>
            <Badge variant={demoMode ? "default" : "secondary"}>
              {demoMode ? "Active" : "Inactive"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Test the live video interface using your computer's webcam while you troubleshoot the IP camera connection.
          </p>

          <div className="flex gap-2">
            {!demoMode ? (
              <Button onClick={startDemoMode} className="w-full">
                <Video className="w-4 h-4 mr-2" />
                Start Demo with Webcam
              </Button>
            ) : (
              <Button onClick={stopDemoMode} variant="destructive" className="w-full">
                Stop Demo
              </Button>
            )}
          </div>

          {/* Webcam Preview */}
          {demoMode && (
            <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
                style={{ minHeight: '400px' }}
              />
              <div className="absolute top-2 left-2">
                <Badge className="bg-red-600">
                  🔴 DEMO MODE - Using Webcam
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      {testResult?.success && (
        <Card>
          <CardHeader>
            <CardTitle>✅ Camera Connected - Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={() => window.location.href = '/operator/entry/zkteco-test'}
              className="w-full"
            >
              Go to Live Video Test Page
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => window.open(`http://${cameraIp}`, '_blank')}
                variant="outline"
                size="sm"
              >
                Open Camera Web UI
              </Button>
              <Button
                onClick={() => {
                  const rtsp = `rtsp://${username}:${password}@${cameraIp}:554/Streaming/Channels/101`;
                  navigator.clipboard.writeText(rtsp);
                  alert('RTSP URL copied! Paste in VLC.');
                }}
                variant="outline"
                size="sm"
              >
                Copy RTSP URL
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Troubleshooting Guide */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>🔧 Troubleshooting Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold mb-1">Camera Not Found?</p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                <li>Check if camera is powered on (look for LED lights)</li>
                <li>Verify network cable is connected</li>
                <li>Check your router's DHCP client list for camera IP</li>
                <li>Try common IPs: 192.168.1.64, 192.168.0.64, 192.168.1.108</li>
                <li>Use manufacturer's tool to find camera (ZKTeco Smart PSS)</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-1">Check Camera from Terminal:</p>
              <div className="bg-muted p-2 rounded font-mono text-xs">
                # Find devices on your network<br/>
                arp -a | grep -i "192.168"<br/>
                <br/>
                # Or scan network (if nmap installed)<br/>
                nmap -sn 192.168.0.0/24
              </div>
            </div>

            <div>
              <p className="font-semibold mb-1">Authentication Failed?</p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                <li>Try default: admin/admin or admin/12345</li>
                <li>Check camera manual for default credentials</li>
                <li>Reset camera to factory defaults if needed</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-1">Still Not Working?</p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                <li>Use Demo Mode above to test the UI with your webcam</li>
                <li>Connect camera directly to your computer (not via router)</li>
                <li>Check if camera web interface works: http://{cameraIp}</li>
                <li>Try accessing from VLC: Media → Open Network Stream → rtsp://{cameraIp}:554</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
