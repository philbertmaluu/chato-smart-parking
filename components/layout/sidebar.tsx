"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { useLanguage } from "@/components/language-provider";
import { useTheme } from "next-themes";
import {
  Car,
  LayoutDashboard,
  Users,
  History,
  BarChart3,
  Settings,
  LogOut,
  Moon,
  Sun,
  Globe,
  ParkingCircle,
  ScanLine,
  MapPin,
  Building2,
  User,
  Maximize2,
  Minimize2,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
  CreditCard,
  UserCheck,
  Shield,
  Camera,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ className, isOpen = true, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close sidebar when clicking a link on mobile
  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch((err) => {
          console.error("Error attempting to enable fullscreen:", err);
        });
    } else {
      document
        .exitFullscreen()
        .then(() => {
          setIsFullscreen(false);
        })
        .catch((err) => {
          console.error("Error attempting to exit fullscreen:", err);
        });
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const operatorNavItems = [
    {
      title: t("nav.dashboard"),
      href: "/operator/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: t("nav.entry"),
      href: "/operator/entry",
      icon: ScanLine,
    },
    {
      title: t("nav.parked"),
      href: "/operator/parked",
      icon: ParkingCircle,
    },
    {
      title: "Profile",
      href: "/operator/profile",
      icon: User,
    },
  ];

  const managerNavItems = [
    {
      title: t("nav.dashboard"),
      href: "/manager/dashboard",
      icon: LayoutDashboard,
    },
   
    {
      title: t("nav.accounts"),
      href: "/manager/accounts",
      icon: CreditCard,
    },
    {
      title: t("nav.bundles"),
      href: "/manager/bundles",
      icon: Package,  
    },
    {
      title: t("nav.bundleSubscriptions"),
      href: "/manager/bundle-subscriptions",
      icon: UserCheck,
    },
    {
      title: t("nav.vehicleFleet"),
      href: "/manager/vehicles",
      icon: Car,
    },
    {
      title: t("nav.history"),
      href: "/manager/history",
      icon: History,
    },
    {
      title: t("nav.detectionLogs"),
      href: "/manager/detection-logs",
      icon: Camera,
    },
    // {
    //   title: t("nav.analytics"),
    //   href: "/manager/analytics",
    //   icon: BarChart3,
    // },0620
    {
      title: t("nav.operators"),
      href: "/manager/operators",
      icon: Users,
    },
    
    {
      title: t("nav.settings"),
      href: "/manager/settings",
      icon: Settings,
    },
  ];

  const navItems =
    user?.role?.name === "System Administrator" ||
    user?.role?.name === "Stations Manager" ||
    user?.role?.name === "manager" ||
    (user?.role?.level && user.role.level <= 2)
      ? managerNavItems
      : operatorNavItems;

  // Don't render sidebar at all on mobile when closed
  if (isMobile && !isOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && onClose && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            e.stopPropagation();
            if (onClose) onClose();
          }}
          className="fixed inset-0 bg-black/50 z-[35] md:hidden"
          style={{ pointerEvents: 'auto' }}
        />
      )}
      <motion.div
        initial={{ x: isMobile ? -300 : 0 }}
        animate={{ 
          x: isMobile ? (isOpen ? 0 : -300) : 0 
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "fixed left-0 top-0 z-[45] h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-lg",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header - Fixed */}
        <div className="border-b border-gray-200 dark:border-gray-700 relative flex-shrink-0">
          {/* Mobile Close Button */}
          {isMobile && onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-2 right-2 z-50 md:hidden"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
          <div className="flex items-center justify-center w-full">
            <div className="w-full h-46 py-0 flex items-center justify-center">
              <Image
                src="/chato-logo.png"
                alt="Chato Logo"
                width={120}
                height={120}
                className="object-contain w-full "
              />
            </div>
          </div>
        </div>  

        {/* Navigation - Scrollable on mobile/web, fixed on desktop */}
        <nav className={cn(
          "flex-1 p-4 space-y-2",
          "overflow-y-auto overflow-x-hidden", // Scrollable on mobile/web
          "md:overflow-y-visible" // Not scrollable on desktop (md and above)
        )}>
          {navItems.map((item, index) => {
            // Improved active state detection
            const isActive =
              pathname === item.href ||
              pathname === item.href + "/" ||
              pathname.startsWith(item.href + "/") ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={item.href} onClick={handleLinkClick}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start space-x-3 h-12",
                      isActive && "gradient-maroon text-white shadow-lg"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </Button>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Controls */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3 flex-shrink-0">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLanguage(language === "en" ? "sw" : "en")}
              className="flex-1"
            >
              <Globe className="w-4 h-4 mr-2" />
              {language === "en" ? "SW" : "EN"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex-1"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
            {/* </div>

          <div className="flex space-x-2"> */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="flex-1"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* User Info */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="font-medium text-sm">{user?.username}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>

          <Button
            variant="outline"
            onClick={logout}
            className="w-full justify-start space-x-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 bg-transparent"
          >
            <LogOut className="w-5 h-5" />
            <span>{t("nav.logout")}</span>
          </Button>
        </div>
      </div>
    </motion.div>
    </>
  );
}
