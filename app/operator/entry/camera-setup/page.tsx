"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { RouteGuard } from "@/components/auth/route-guard";
import { useZKTecoCamera } from "@/hooks/use-zkteco-camera";
import { ZKTecoCameraConfig, zktecoConfig } from "@/utils/config/zkteco-config";
import { ZKTecoCameraWidget } from "@/components/camera/zkteco-camera-widget";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  Camera,
  Settings,
  TestTube,
  Loader2,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Monitor,
  Network,
  Key,
  Save,
  Video,
} from "lucide-react";

export default function CameraSetupPage() {
  const [formData, setFormData] = useState<ZKTecoCameraConfig>(zktecoConfig.getConfig());
  const [testResults, setTestResults] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [forceStream, setForceStream] = useState(false);

  const {
    isConnected,
    connectionStatus,
    error,
    deviceInfo,
    testConnection,
    updateCredentials,
    getRtspUrls,
    getDeviceInfo,
  } = useZKTecoCamera({ autoConnect: false });

  const handleInputChange = (field: keyof ZKTecoCameraConfig, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResults(null);

    try {
      // Test with form data
      const result = await updateCredentials(formData);
      
      if (result.success) {
        // Get additional info
        const deviceResult = await getDeviceInfo();
        const rtspMain = await getRtspUrls('main');
        const rtspSub = await getRtspUrls('sub');
        
        setTestResults({
          connection: result,
          device: deviceResult,
          rtsp: {
            main: rtspMain.data?.rtsp_url,
            sub: rtspSub.data?.rtsp_url,
          },
        });
      } else {
        setTestResults({ connection: result });
      }
    } catch (error) {
      setTestResults({
        connection: {
          success: false,
          message: error instanceof Error ? error.message : 'Test failed',
        },
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfiguration = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Validate first
      zktecoConfig.updateConfig(formData);
      const validation = zktecoConfig.validateConfig();
      
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Test connection with new config
      const result = await updateCredentials(formData);
      
      if (result.success) {
        setSaveMessage('Configuration saved and validated successfully!');
      } else {
        throw new Error(result.message || 'Configuration validation failed');
      }
    } catch (error) {
      setSaveMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'default';
      case 'connecting': return 'secondary';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <CheckCircle className="w-4 h-4" />;
      case 'connecting': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

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
                <h1 className="text-3xl font-bold">ZKTeco Camera Setup</h1>
                <p className="text-muted-foreground mt-1">
                  Configure and test your ZKTeco camera connection
                </p>
              </div>
            </div>
          </motion.div>

          <Tabs defaultValue="configuration" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="configuration" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Configuration
              </TabsTrigger>
              <TabsTrigger value="testing" className="flex items-center gap-2">
                <TestTube className="w-4 h-4" />
                Testing & Preview
              </TabsTrigger>
             
            </TabsList>

            {/* Configuration Tab */}
            <TabsContent value="configuration" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Network className="w-5 h-5" />
                      Network Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure the network settings for your ZKTeco camera
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ip">IP Address</Label>
                        <Input
                          id="ip"
                          placeholder="192.168.0.109"
                          value={formData.ip}
                          onChange={(e) => handleInputChange('ip', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="httpPort">HTTP Port</Label>
                        <Input
                          id="httpPort"
                          type="number"
                          placeholder="80"
                          value={formData.httpPort}
                          onChange={(e) => handleInputChange('httpPort', parseInt(e.target.value) || 80)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rtspPort">RTSP Port</Label>
                      <Input
                        id="rtspPort"
                        type="number"
                        placeholder="554"
                        value={formData.rtspPort}
                        onChange={(e) => handleInputChange('rtspPort', parseInt(e.target.value) || 554)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="w-5 h-5" />
                      Authentication
                    </CardTitle>
                    <CardDescription>
                      Enter your camera login credentials
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        placeholder="admin"
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Password123!"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Save Configuration */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {saveMessage && (
                      <Alert className={saveMessage.startsWith('Error') ? 'border-red-500' : 'border-green-500'}>
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription>{saveMessage}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                  
                  <Button 
                    onClick={handleSaveConfiguration}
                    disabled={isSaving}
                    className="ml-4"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Configuration
                  </Button>
                </div>
              </motion.div>
            </TabsContent>

            {/* Testing Tab */}
            <TabsContent value="testing" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {/* Connection Test */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Connection Test</span>
                      <Badge variant={getStatusColor()}>
                        {getStatusIcon()}
                        {connectionStatus}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Test the connection to your ZKTeco camera with current settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleTestConnection}
                        disabled={isTesting}
                        className="flex-1"
                      >
                        {isTesting ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <TestTube className="w-4 h-4 mr-2" />
                        )}
                        Test Connection
                      </Button>

                      <Button 
                        onClick={() => {
                          // Force streaming mode even if validation fails
                          setForceStream(true);
                          // Update config with current form data
                          zktecoConfig.updateConfig(formData);
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        <Video className="w-4 h-4 mr-2" />
                        Skip & Stream
                      </Button>
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {testResults && (
                      <div className="space-y-4">
                        <Separator />
                        
                        {/* Connection Results */}
                        <div>
                          <h4 className="font-semibold mb-2">Connection Results</h4>
                          <Alert variant={testResults.connection.success ? "default" : "destructive"}>
                            <AlertDescription>
                              {testResults.connection.message}
                            </AlertDescription>
                          </Alert>
                        </div>

                        {/* Device Info */}
                        {testResults.device && testResults.device.success && (
                          <div>
                            <h4 className="font-semibold mb-2">Device Information</h4>
                            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                              <pre className="text-sm overflow-x-auto">
                                {JSON.stringify(testResults.device.data, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* RTSP URLs */}
                        {testResults.rtsp && (
                          <div>
                            <h4 className="font-semibold mb-2">RTSP Stream URLs</h4>
                            <div className="space-y-2">
                              {testResults.rtsp.main && (
                                <div className="flex items-center gap-2">
                                  <Label className="w-20">Main:</Label>
                                  <Input 
                                    value={testResults.rtsp.main} 
                                    readOnly 
                                    className="flex-1"
                                  />
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => copyToClipboard(testResults.rtsp.main)}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                              
                              {testResults.rtsp.sub && (
                                <div className="flex items-center gap-2">
                                  <Label className="w-20">Sub:</Label>
                                  <Input 
                                    value={testResults.rtsp.sub} 
                                    readOnly 
                                    className="flex-1"
                                  />
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => copyToClipboard(testResults.rtsp.sub)}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Live Camera Preview */}
                {(isConnected || forceStream) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Video className="w-5 h-5" />
                        Live Camera Preview
                      </CardTitle>
                      <CardDescription>
                        {forceStream && !isConnected 
                          ? "Attempting direct camera access (works best in Safari)"
                          : "Real-time camera feed from your ZKTeco camera"}
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
                          Auto-refreshing every 500ms. If not visible in Chrome, open in Safari where camera access works.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </TabsContent>

          </Tabs>
        </div>
      </MainLayout>
    </RouteGuard>
  );
}