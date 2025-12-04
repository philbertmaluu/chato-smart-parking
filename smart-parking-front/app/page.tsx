"use client";

import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Optimized redirect logic - combine both effects
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        console.log("Redirecting to login - not authenticated");
        router.replace("/auth/login");
      } else if (user) {
        console.log(
          "Redirecting authenticated user to dashboard:",
          user.role?.name
        );
        const targetPath =
          user.role?.name === "System Administrator" ||
          user.role?.name === "Stations Manager" ||
          (user.role?.level && user.role.level <= 2)
            ? "/manager/dashboard"
            : "/operator/dashboard";
        router.replace(targetPath);
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Simplified loading state - only show when actually loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  // Fallback - this should not be reached during normal operation
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <LoadingSpinner size="lg" text="Redirecting..." />
    </div>
  );
}
