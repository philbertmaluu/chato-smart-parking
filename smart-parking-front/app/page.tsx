"use client";

import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Debug logging
  useEffect(() => {
    setMounted(true);
    console.log("HomePage mounted");
    console.log("Auth state:", { isLoading, isAuthenticated, user: user?.username });
    
    // Test if we can write to DOM
    const testDiv = document.createElement('div');
    testDiv.id = 'test-mount';
    testDiv.textContent = 'App is mounted';
    testDiv.style.position = 'fixed';
    testDiv.style.top = '10px';
    testDiv.style.left = '10px';
    testDiv.style.zIndex = '9999';
    testDiv.style.background = 'red';
    testDiv.style.color = 'white';
    testDiv.style.padding = '10px';
    document.body.appendChild(testDiv);
    
    setTimeout(() => {
      const el = document.getElementById('test-mount');
      if (el) el.remove();
    }, 3000);
  }, []);

  // Optimized redirect logic - combine both effects
  useEffect(() => {
    if (!mounted) return;
    
    console.log("Redirect effect triggered:", { isLoading, isAuthenticated, user: user?.username });
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
  }, [mounted, isLoading, isAuthenticated, user, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-red-500 flex items-center justify-center">
        <div className="text-white text-2xl">Initializing...</div>
      </div>
    );
  }

  // Simplified loading state - only show when actually loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" text="Loading..." />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Initializing application...</p>
        </div>
      </div>
    );
  }

  // Fallback - this should not be reached during normal operation
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" text="Redirecting..." />
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Preparing your dashboard...</p>
      </div>
    </div>
  );
}
