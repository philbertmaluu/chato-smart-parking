"use client";

import type React from "react";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth-provider";
import { useLanguage } from "@/components/language-provider";
import { Car, Eye, EyeOff, Globe, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const success = await login(email, password);
      if (success) {
        toast.success("Login successful!");
        // No need to manually navigate - auth provider handles it
      } else {
        setError("Invalid email or password. Please try again.");
        toast.error("Login failed. Please check your credentials.");
        setIsLoading(false);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-900 relative">
      {/* Language and Theme Toggle - Top Right Corner */}
      <div className="absolute top-4 right-4 z-50 flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLanguage(language === "en" ? "sw" : "en")}
          className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Globe className="w-4 h-4 mr-2" />
          {language === "en" ? "SW" : "EN"}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Left Side - Parking Theme Pattern */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        {/* Parking Pattern Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="parking-pattern"></div>
        </div>
        
        {/* Animated Parking Spaces */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid grid-cols-3 gap-8 opacity-30">
            {[...Array(9)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="relative"
              >
                <div className="w-24 h-32 border-2 border-white/20 rounded-lg bg-white/5 backdrop-blur-sm">
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                    <Car className="w-4 h-4 text-white/40" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <div className="w-64 h-36 flex items-center justify-start mb-6">
                <Image
                  src="/chato-logo.png"
                  alt="Chato Logo"
                  width={288}
                  height={288}
                  className="object-contain"
                  priority
                />
              </div>
              <h1 className="text-4xl font-bold mb-2 text-left">Chato Parking</h1>
              <p className="text-gray-300 text-lg text-left">
                Smart Parking Management System
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="space-y-4"
          >
            <div className="flex items-center space-x-3 text-gray-300">
              <div className="p-2 bg-white/10 rounded-lg">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">Real-time Monitoring</p>
                <p className="text-sm text-gray-400">Track vehicles in real-time</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-gray-300">
              <div className="p-2 bg-white/10 rounded-lg">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">Automated Entry/Exit</p>
                <p className="text-sm text-gray-400">Seamless vehicle management</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-gray-300">
              <div className="p-2 bg-white/10 rounded-lg">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">Smart Analytics</p>
                <p className="text-sm text-gray-400">Data-driven insights</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 bg-white dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Login Form Card */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center space-y-4 pb-6">
              {/* Logo - Only visible on mobile */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-64 mx-auto h-36 flex items-center justify-center lg:hidden mb-4"
              >
                <Image
                  src="/chato-logo.png"
                  alt="Chato Logo"
                  width={288}
                  height={288}
                  className="object-contain"
                  priority
                />
              </motion.div>
              <div>
                <CardTitle className="text-3xl font-bold text-gradient mb-2">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-base">
                  Sign in to your account to continue
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2 text-red-600 dark:text-red-400"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    {t("auth.email")}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 border-gray-300 dark:border-gray-700 focus:border-primary"
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    {t("auth.password")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 border-gray-300 dark:border-gray-700 focus:border-primary pr-10"
                      placeholder="Enter your password"
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    {t("auth.forgotPassword")}
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 gradient-maroon hover:opacity-90 transition-opacity text-white font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t("common.loading")}
                    </>
                  ) : (
                    t("auth.login")
                  )}
                </Button>
              </form>

              <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                Don't have an account?{" "}
                <Link
                  href="/auth/register"
                  className="text-primary hover:underline font-medium"
                >
                  {t("auth.register")}
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
