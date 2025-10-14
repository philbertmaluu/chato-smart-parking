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
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
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
      title: t("nav.vehicles"),
      href: "/manager/vehicles",
      icon: Car,
    },
    {
      title: t("nav.history"),
      href: "/manager/history",
      icon: History,
    },
    {
      title: t("nav.analytics"),
      href: "/manager/analytics",
      icon: BarChart3,
    },
    {
      title: "Stations",
      href: "/manager/stations",
      icon: Building2,
    },
    {
      title: t("nav.operators"),
      href: "/manager/operators",
      icon: Users,
    },
    {
      title: "Gates",
      href: "/manager/gates",
      icon: MapPin,
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

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "fixed left-0 top-0 z-40 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-lg",
        className
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-gradient">Smart Parking</h2>
              <p className="text-sm text-muted-foreground capitalize">
                {user?.role?.name === "System Administrator"
                  ? "Admin Panel"
                  : user?.role?.name === "Stations Manager"
                  ? "Manager Panel"
                  : `${user?.role?.name} Panel`}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
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
                <Link href={item.href}>
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
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
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
  );
}
