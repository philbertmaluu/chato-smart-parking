"use client";

import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Car, Shield, BarChart3 } from "lucide-react";

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("Redirecting to login - not authenticated");
      router.push("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Redirect authenticated users to their appropriate dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      console.log(
        "Redirecting authenticated user to dashboard:",
        user.role?.name
      );
      if (
        user.role?.name === "System Administrator" ||
        user.role?.name === "Stations Manager" ||
        (user.role?.level && user.role.level <= 2)
      ) {
        router.push("/manager/dashboard");
      } else {
        router.push("/operator/dashboard");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show loading while redirecting
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  // If authenticated, show loading while redirecting to dashboard
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Fallback - this should not be reached
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Loading...</p>
      </div>
    </div>
  );
}
