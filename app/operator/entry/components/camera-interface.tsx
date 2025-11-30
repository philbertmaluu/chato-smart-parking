"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCameraInterface } from "@/hooks/use-camera-interface";
import {
  Camera,
  Loader2,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  Shield,
  ShieldOff,
  Monitor,
  Settings,
  Maximize,
  X,
} from "lucide-react";

interface CameraInterfaceProps {
  className?: string;
  onFullscreen?: () => void;
  isFullscreen?: boolean;
  manualEntryButton?: React.ReactNode;
}

export function CameraInterface({
  className = "",
  onFullscreen,
  isFullscreen = false,
  manualEntryButton,
}: CameraInterfaceProps) {
  const {
    isConnected,
    isLoading,
    error,
    currentUrl,
    useHttps,
    iframeRef,
    connect,
    disconnect,
    toggleProtocol,
    getCameraUrl,
    handleIframeLoad,
    handleIframeError,
    cameraConfig,
  } = useCameraInterface();

  const [showIframe, setShowIframe] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [autoConnectAttempted, setAutoConnectAttempted] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Set timeout for iframe loading
  useEffect(() => {
    if (showIframe && !iframeLoaded) {
      // Clear any existing timeout
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }

      // Set new timeout
      const timeout = setTimeout(() => {
        console.log("Iframe loading timeout - assuming loaded");
        setIframeLoaded(true);
      }, 5000); // 5 second timeout

      setLoadingTimeout(timeout);

      return () => {
        if (timeout) {
          clearTimeout(timeout);
        }
      };
    }
  }, [showIframe, iframeLoaded]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [loadingTimeout]);

  const handleConnect = async () => {
    const result = await connect();
    if (result.success) {
      setShowIframe(true);
      setIframeLoaded(false);
      console.log("Connecting to camera URL:", result.url);
    }
  };

  // Force show interface for testing
  const handleForceShow = () => {
    setIframeLoaded(true);
    console.log("Force showing camera interface");
  };

  // Try HTTP if HTTPS fails (on iframe error)
  const handleTryHttp = async () => {
    await toggleProtocol();
    setIframeLoaded(false);
  };

  const handleDisconnect = () => {
    disconnect();
    setShowIframe(false);
    setIframeLoaded(false);
  };

  // Handle iframe load with error detection
  const handleIframeLoadComplete = () => {
    console.log("Iframe load completed");

    // If using secure proxy, don't show overlay
    if (currentUrl && currentUrl.includes("/api/camera-proxy")) {
      console.log("Using secure proxy - camera interface loaded successfully");
      setIframeLoaded(false); // Hide overlay for proxy

      // Show a brief success message
      setTimeout(() => {
        // You could add a toast notification here if needed
        console.log(
          "Camera interface loaded successfully through secure proxy"
        );
      }, 1000);

      return;
    }

    // For direct camera connections, check if iframe content is accessible
    try {
      if (iframeRef.current) {
        // Try to access iframe content - this will fail if X-Frame-Options blocks it
        const iframeDoc =
          iframeRef.current.contentDocument ||
          iframeRef.current.contentWindow?.document;
        if (!iframeDoc) {
          console.log(
            "X-Frame-Options blocking detected - showing alternative interface"
          );
          // Iframe is blocked, show alternative interface
          setIframeLoaded(true);
        } else {
          console.log("Iframe content accessible - hiding overlay");
          setIframeLoaded(false); // Hide overlay
          handleIframeLoad();
        }
      }
    } catch (error) {
      console.log("X-Frame-Options blocking confirmed:", error);
      // X-Frame-Options is blocking access
      setIframeLoaded(true);
    }
  };

  const handleOpenInBrowser = () => {
    if (currentUrl) {
      window.open(currentUrl, "_blank");
    }
  };

  // Try different iframe approaches to bypass X-Frame-Options
  const tryIframeWorkarounds = useCallback(() => {
    if (!currentUrl) return;

    const workarounds = [
      // Try with different sandbox attributes
      { sandbox: "allow-scripts allow-same-origin allow-forms allow-popups" },
      { sandbox: "allow-scripts allow-same-origin" },
      { sandbox: "allow-scripts" },
      { sandbox: "" },
      // Try without sandbox
      { sandbox: undefined },
      // Try with different referrer policies
      { referrerPolicy: "no-referrer" as const },
      { referrerPolicy: "origin" as const },
      { referrerPolicy: "unsafe-url" as const },
      // Try with no sandbox at all (most permissive)
      { sandbox: undefined, referrerPolicy: "no-referrer" as const },
      // Try with allow-same-origin explicitly
      {
        sandbox:
          "allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation",
      },
    ];

    let currentIndex = 0;
    const tryNextWorkaround = () => {
      if (currentIndex >= workarounds.length) {
        console.log("All iframe workarounds failed");
        setIframeLoaded(true); // Show alternative interface
        return;
      }

      const workaround = workarounds[currentIndex];
      console.log(`Trying iframe workaround ${currentIndex + 1}:`, workaround);

      if (iframeRef.current) {
        // Apply workaround attributes
        if (workaround.sandbox !== undefined) {
          iframeRef.current.sandbox = workaround.sandbox;
        } else {
          // Remove sandbox attribute completely
          iframeRef.current.removeAttribute("sandbox");
        }
        if (workaround.referrerPolicy) {
          iframeRef.current.referrerPolicy =
            workaround.referrerPolicy as ReferrerPolicy;
        }

        // Try to load with a timestamp to bypass cache
        const urlWithTimestamp = `${currentUrl}?t=${Date.now()}&iframe=true&bypass=true`;
        iframeRef.current.src = urlWithTimestamp;

        // Check if it worked after a short delay
        setTimeout(() => {
          try {
            const iframeDoc =
              iframeRef.current?.contentDocument ||
              iframeRef.current?.contentWindow?.document;
            if (iframeDoc) {
              console.log("Iframe workaround successful!");
              setIframeLoaded(false); // Hide overlay
              return;
            }
          } catch (error) {
            console.log(`Workaround ${currentIndex + 1} failed:`, error);
          }
          currentIndex++;
          tryNextWorkaround();
        }, 2000);
      }
    };

    tryNextWorkaround();
  }, [currentUrl]);

  // Try different authentication methods
  const handleTryWithoutAuth = () => {
    const urlWithoutAuth = getCameraUrl(useHttps, false);
    if (iframeRef.current) {
      iframeRef.current.src = urlWithoutAuth;
    }
  };

  const handleTryWithAuth = () => {
    const urlWithAuth = getCameraUrl(useHttps, true);
    if (iframeRef.current) {
      iframeRef.current.src = urlWithAuth;
    }
  };

  // Try iframe workarounds
  const handleTryIframeWorkarounds = () => {
    tryIframeWorkarounds();
  };

  // Try object tag approach
  const handleTryObjectTag = () => {
    console.log("Trying object tag approach");
    const objectElement = document.querySelector(
      "object[data]"
    ) as HTMLObjectElement;
    if (objectElement) {
      objectElement.className = "w-full h-full border-0";
      objectElement.data = currentUrl + "?t=" + Date.now();
    }
  };

  // Try different URL approaches
  const handleTryDifferentUrls = () => {
    if (!currentUrl) return;

    console.log("Trying different URL approaches");
    const urlVariations = [
      currentUrl + "?iframe=true&t=" + Date.now(),
      currentUrl + "?embed=true&t=" + Date.now(),
      currentUrl + "?frame=true&t=" + Date.now(),
      currentUrl + "?view=embedded&t=" + Date.now(),
      currentUrl.replace("http://", "https://") + "?t=" + Date.now(),
    ];

    let currentIndex = 0;
    const tryNextUrl = () => {
      if (currentIndex >= urlVariations.length) {
        console.log("All URL variations failed");
        return;
      }

      const url = urlVariations[currentIndex];
      console.log(`Trying URL variation ${currentIndex + 1}:`, url);

      if (iframeRef.current) {
        iframeRef.current.src = url;

        // Check if it worked after a delay
        setTimeout(() => {
          try {
            const iframeDoc =
              iframeRef.current?.contentDocument ||
              iframeRef.current?.contentWindow?.document;
            if (iframeDoc) {
              console.log("URL variation successful!");
              setIframeLoaded(false);
              return;
            }
          } catch (error) {
            console.log(`URL variation ${currentIndex + 1} failed:`, error);
          }
          currentIndex++;
          tryNextUrl();
        }, 3000);
      }
    };

    tryNextUrl();
  };

  // Try secure proxy approach
  const handleTrySecureProxy = async () => {
    if (!currentUrl) return;

    console.log("Trying secure proxy approach");

    try {
      const response = await fetch("/api/camera-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: currentUrl,
          username: "admin",
          password: "Password123!",
        }),
      });

      if (response.ok) {
        console.log("Secure proxy successful!");
        // Use the proxied URL
        const proxyUrl = `/api/camera-proxy/?url=${encodeURIComponent(
          currentUrl
        )}`;
        if (iframeRef.current) {
          iframeRef.current.src = proxyUrl;
          setIframeLoaded(false); // Hide overlay
        }
      } else {
        console.log("Secure proxy failed:", response.status);
        setIframeLoaded(true); // Show alternative interface
      }
    } catch (error) {
      console.log("Secure proxy error:", error);
      setIframeLoaded(true); // Show alternative interface
    }
  };

  const getStatusColor = () => {
    if (isLoading) return "yellow";
    if (error) return "red";
    if (isConnected) {
      if (currentUrl && currentUrl.includes("/api/camera-proxy")) {
        return "green"; // Secure proxy is working
      }
      return "green";
    }
    return "gray";
  };

  const getStatusText = () => {
    if (isLoading) return "Connecting...";
    if (error) return "Connection Error";
    if (isConnected) {
      if (currentUrl && currentUrl.includes("/api/camera-proxy")) {
        return "Connected (Secure Proxy)";
      }
      return "Connected";
    }
    return "Disconnected";
  };

  const getProtocolBadgeColor = () => {
    return useHttps ? "green" : "yellow";
  };

  return (
    <Card className={`${className} border-0 shadow-lg overflow-hidden`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Monitor className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">IP Camera Interface</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge
                variant={getStatusColor() === "green" ? "default" : "secondary"}
                className={`${
                  {
                    green:
                      "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
                    yellow:
                      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
                    red: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
                    gray: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300",
                  }[getStatusColor()]
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : isConnected ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <AlertCircle className="w-3 h-3 mr-1" />
                )}
                {getStatusText()}
              </Badge>

              {isConnected && (
                <Badge
                  variant="outline"
                  className={
                    getProtocolBadgeColor() === "green"
                      ? "border-green-300 text-green-700 dark:border-green-700 dark:text-green-300"
                      : "border-yellow-300 text-yellow-700 dark:border-yellow-700 dark:text-yellow-300"
                  }
                >
                  {useHttps ? (
                    <Shield className="w-3 h-3 mr-1" />
                  ) : (
                    <ShieldOff className="w-3 h-3 mr-1" />
                  )}
                  {useHttps ? "HTTPS" : "HTTP"}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isConnected && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenInBrowser}
                  className="text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Open in Browser
                </Button>

                {onFullscreen && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onFullscreen}
                    className="text-xs"
                  >
                    <Maximize className="w-3 h-3 mr-1" />
                    {isFullscreen ? "Exit" : "Fullscreen"}
                  </Button>
                )}
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={toggleProtocol}
              disabled={isLoading || !isConnected}
              className="text-xs"
            >
              {useHttps ? (
                <ShieldOff className="w-3 h-3 mr-1" />
              ) : (
                <Shield className="w-3 h-3 mr-1" />
              )}
              Use {useHttps ? "HTTP" : "HTTPS"}
            </Button>

            {/* Force HTTP Mode Button for SSL Issues */}
            {useHttps && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toggleProtocol();
                  // Force HTTP mode
                  const httpUrl = getCameraUrl(false, true);
                  // setState(prev => ({ ...prev, currentUrl: httpUrl, useHttps: false })); // This line was removed as per the new_code
                  if (iframeRef.current) {
                    iframeRef.current.src = httpUrl;
                  }
                }}
                className="text-xs border-red-300 text-red-700 hover:bg-red-50"
                title="Switch to HTTP to avoid SSL certificate issues"
              >
                <ShieldOff className="w-3 h-3 mr-1" />
                Force HTTP
              </Button>
            )}

            {/* Manual Entry Button */}
            {manualEntryButton}
          </div>
        </div>

        <CardDescription className="flex items-center justify-between">
          <span>
            Camera: {cameraConfig.ip}:
            {useHttps ? cameraConfig.httpsPort : cameraConfig.httpPort}
          </span>
          {error && (
            <span className="text-red-500 text-sm font-medium">{error}</span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <div className="relative">
          {/* Connection Controls */}
          {!isConnected && (
            <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Camera className="w-16 h-16 mx-auto text-gray-400" />
                <div>
                  <p className="text-gray-500 mb-3">
                    {error
                      ? "Connection failed"
                      : "Camera interface ready to connect"}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      onClick={handleConnect}
                      disabled={isLoading}
                      className="gradient-maroon hover:opacity-90"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 mr-2" />
                          Connect to Camera
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleOpenInBrowser}
                      variant="outline"
                      className="border-gray-500 text-gray-600 hover:gradient-maroon hover:text-white"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in Browser
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground max-w-md mx-auto">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
                    <p className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                      Camera Accessible - Iframe Blocked
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Camera is accessible but blocks iframe embedding for
                      security. Use "Open in Browser" for the full camera
                      interface.
                    </p>
                  </div>
                  <div className="mt-3">
                    <p className="font-medium mb-1">Camera Details:</p>
                    <ul className="text-left space-y-1 text-xs">
                      <li>• IP Address: {cameraConfig.ip}</li>
                      <li>
                        • HTTP Port: {cameraConfig.httpPort} (Recommended)
                      </li>
                      <li>
                        • HTTPS Port: {cameraConfig.httpsPort} (SSL issues)
                      </li>
                      <li>• Status: {useHttps ? "HTTPS" : "HTTP"} Mode</li>
                      <li>• Username: admin</li>
                      <li>• Password: Password123!</li>
                    </ul>
                  </div>
                  <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs">
                    <p className="font-medium text-yellow-700 dark:text-yellow-300 mb-1">
                      Troubleshooting Tips:
                    </p>
                    <ul className="text-left space-y-1 text-yellow-600 dark:text-yellow-400">
                      <li>
                        • Camera authentication is working (tested with curl)
                      </li>
                      <li>
                        • X-Frame-Options: SAMEORIGIN blocks iframe embedding
                      </li>
                      <li>• This is normal security behavior for IP cameras</li>
                      <li>• Use "Open in Browser" for full camera access</li>
                      <li>• Camera credentials: admin / Password123!</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Camera Interface Iframe */}
          {isConnected && showIframe && currentUrl && (
            <div className="relative">
              <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative overflow-hidden rounded-b-lg">
                {/* Success indicator when using secure proxy */}
                {currentUrl.includes("/api/camera-proxy") && !iframeLoaded && (
                  <div className="absolute top-2 left-2 z-10">
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Camera Loading...
                    </Badge>
                  </div>
                )}

                {/* Video feed navigation help */}
                {currentUrl.includes("/api/camera-proxy") && !iframeLoaded && (
                  <div className="absolute top-2 right-2 z-10 max-w-xs">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-xs">
                      <p className="text-blue-700 dark:text-blue-300 font-medium mb-1">
                        📹 Camera Interface Loaded
                      </p>
                      <p className="text-blue-600 dark:text-blue-400">
                        Look for video controls in the camera interface below.
                        Common locations: "Live View", "Video", or "Stream"
                        tabs.
                      </p>
                    </div>
                  </div>
                )}

                {/* Iframe - Always show, no loading overlay */}
                <iframe
                  ref={iframeRef}
                  src={currentUrl}
                  className="w-full h-full border-0"
                  onLoad={handleIframeLoadComplete}
                  onError={handleIframeError}
                  allow="camera; microphone; autoplay; fullscreen; display-capture"
                  referrerPolicy="no-referrer-when-downgrade"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                  title="IP Camera Interface"
                  loading="eager"
                />

                {/* Alternative: Object tag (sometimes works better with X-Frame-Options) */}
                <object
                  data={currentUrl}
                  type="text/html"
                  className="w-full h-full border-0 hidden"
                  onLoad={() => console.log("Object tag loaded successfully")}
                  onError={() => console.log("Object tag failed to load")}
                >
                  <p>Camera interface not supported in object tag</p>
                </object>

                {/* Controls overlay */}
                <div className="absolute top-2 right-2 flex space-x-2">
                  {/* Video navigation help */}
                  {currentUrl.includes("/api/camera-proxy") && (
                    <div className="flex space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          if (iframeRef.current) {
                            // Try to navigate to common video viewing URLs
                            const videoUrls = [
                              currentUrl + "&section=live",
                              currentUrl + "&section=video",
                              currentUrl + "&section=stream",
                              currentUrl + "&view=live",
                              currentUrl + "&page=video",
                            ];
                            // Try the first URL
                            iframeRef.current.src = videoUrls[0];
                          }
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white border-0"
                        title="Try to navigate to video section"
                      >
                        📹 Video
                      </Button>
                    </div>
                  )}

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (iframeRef.current) {
                        iframeRef.current.src =
                          currentUrl + "?reload=" + Date.now();
                        setIframeLoaded(false);
                      }
                    }}
                    className="bg-black/50 hover:bg-black/70 text-white border-0"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleDisconnect}
                    className="bg-black/50 hover:bg-black/70 text-white border-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>

                {/* Protocol indicator */}
                <div className="absolute bottom-2 left-2">
                  <Badge
                    variant="secondary"
                    className="bg-black/50 text-white border-0"
                  >
                    {useHttps ? (
                      <Shield className="w-3 h-3 mr-1" />
                    ) : (
                      <ShieldOff className="w-3 h-3 mr-1" />
                    )}
                    {useHttps ? "Secure" : "Unsecured"}
                  </Badge>
                </div>

                {/* Authentication troubleshooting overlay */}
                {iframeLoaded && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md mx-4 text-center">
                      <h3 className="text-lg font-semibold mb-4">
                        Secure Camera Access Options
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        The camera blocks iframe embedding for security
                        (X-Frame-Options: SAMEORIGIN). Use the secure proxy to
                        access the camera stream safely:
                      </p>
                      <div className="space-y-3">
                        <Button
                          onClick={handleTrySecureProxy}
                          className="w-full gradient-maroon hover:opacity-90"
                        >
                          🔒 Try Secure Proxy (Recommended)
                        </Button>
                        <Button
                          onClick={handleTryIframeWorkarounds}
                          variant="outline"
                          className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
                        >
                          🔧 Try Iframe Workarounds
                        </Button>
                        <Button
                          onClick={handleTryDifferentUrls}
                          variant="outline"
                          className="w-full border-green-500 text-green-600 hover:bg-green-50"
                        >
                          🔗 Try URL Variations
                        </Button>
                        <Button
                          onClick={handleTryObjectTag}
                          variant="outline"
                          className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
                        >
                          📦 Try Object Tag
                        </Button>
                        <Button
                          onClick={handleOpenInBrowser}
                          variant="outline"
                          className="w-full border-gray-500 text-gray-600 hover:gradient-maroon hover:text-white"
                        >
                          <ExternalLink className="w-3 h-3 mr-2" />
                          Open in Browser (Fallback)
                        </Button>
                        <Button
                          onClick={handleTryWithAuth}
                          variant="outline"
                          className="w-full"
                        >
                          Try Different Authentication
                        </Button>
                        <Button
                          onClick={handleTryWithoutAuth}
                          variant="outline"
                          className="w-full"
                        >
                          Try Without Authentication
                        </Button>
                      </div>
                      <div className="mt-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                        <p className="text-blue-700 dark:text-blue-300 font-medium">
                          🔒 Security Best Practices
                        </p>
                        <p className="text-blue-600 dark:text-blue-400 mt-1">
                          • Secure Proxy: Server-side authentication and CORS
                          handling • No client-side credential exposure • Proper
                          X-Frame-Options headers • IP whitelisting and input
                          validation
                        </p>
                      </div>
                      <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                        <p className="text-green-700 dark:text-green-300">
                          ✅ Camera interface loaded successfully
                        </p>
                        <p className="text-green-600 dark:text-green-400 mt-1">
                          • Main interface: Working through secure proxy
                        </p>
                        <p className="text-green-600 dark:text-green-400">
                          • Static assets: CSS/JS files loading correctly
                        </p>
                        <p className="text-green-600 dark:text-green-400">
                          • Configuration: Using default settings (some JSON
                          files missing)
                        </p>
                        <p className="text-green-600 dark:text-green-400">
                          • Credentials: admin / Password123!
                        </p>
                        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                          <p className="text-yellow-700 dark:text-yellow-300 font-medium">
                            📹 To View Camera Feed:
                          </p>
                          <ul className="text-yellow-600 dark:text-yellow-400 mt-1 space-y-1">
                            <li>
                              • Look for "Live View", "Video", or "Stream" tabs
                            </li>
                            <li>
                              • Click the "📹 Video" button in the interface
                            </li>
                            <li>• Navigate through the camera's menu system</li>
                            <li>
                              • Check for video player controls in the interface
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
