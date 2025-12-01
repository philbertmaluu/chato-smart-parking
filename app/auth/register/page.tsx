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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/components/auth-provider";
import { useLanguage } from "@/components/language-provider";
import { Car, Eye, EyeOff, Globe } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import Image from "next/image";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "" as "operator" | "manager" | "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    if (!formData.role) {
      alert("Please select a role");
      return;
    }

    setIsLoading(true);
    await register(
      formData.email,
      formData.password,
      formData.role,
      formData.name
    );
    setIsLoading(false);
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

      {/* Left Side - Parking Theme Pattern (Different Style) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-gray-800 via-gray-900 to-black">
        {/* Different Parking Pattern Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="parking-pattern-register"></div>
        </div>
        
        {/* Circular Parking Indicators */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid grid-cols-4 gap-6 opacity-25">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08, duration: 0.6, type: "spring" }}
                className="relative"
              >
                <div className="w-16 h-16 border-2 border-white/30 rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center">
                  <Car className="w-6 h-6 text-white/50" />
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
                <p className="font-semibold">Secure Registration</p>
                <p className="text-sm text-gray-400">Your data is protected</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-gray-300">
              <div className="p-2 bg-white/10 rounded-lg">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">Easy Access</p>
                <p className="text-sm text-gray-400">Get started in minutes</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-gray-300">
              <div className="p-2 bg-white/10 rounded-lg">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">24/7 Support</p>
                <p className="text-sm text-gray-400">We're here to help</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 bg-white dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Register Form Card */}
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
                  Create Account
                </CardTitle>
                <CardDescription className="text-base">
                  Sign up to get started with Chato Parking
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="h-11 border-gray-300 dark:border-gray-700 focus:border-primary"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    {t("auth.email")}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    className="h-11 border-gray-300 dark:border-gray-700 focus:border-primary"
                    placeholder="Enter your email"
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
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                      className="h-11 border-gray-300 dark:border-gray-700 focus:border-primary pr-10"
                      placeholder="Enter your password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    {t("auth.confirmPassword")}
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                    className="h-11 border-gray-300 dark:border-gray-700 focus:border-primary"
                    placeholder="Confirm your password"
                  />
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
                    t("auth.register")
                  )}
                </Button>
              </form>

              <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="text-primary hover:underline font-medium"
                >
                  {t("auth.login")}
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
