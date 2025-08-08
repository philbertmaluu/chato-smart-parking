"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: "System Administrator" | "Stations Manager" | "Gate Operator";
  minRoleLevel?: number;
  redirectTo?: string;
}

export function RouteGuard({
  children,
  requiredRole,
  minRoleLevel,
  redirectTo = "/auth/login",
}: RouteGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        router.push(redirectTo);
        return;
      }

      // If role requirements are specified, check them
      if (requiredRole || minRoleLevel) {
        const userRole = user?.role;

        if (!userRole) {
          router.push(redirectTo);
          return;
        }

        // Check specific role requirement
        if (requiredRole && userRole.name !== requiredRole) {
          // Redirect based on user's actual role
          if (
            userRole.name === "System Administrator" ||
            userRole.name === "Stations Manager" ||
            (userRole.level && userRole.level <= 2)
          ) {
            router.push("/manager/dashboard");
          } else {
            router.push("/operator/dashboard");
          }
          return;
        }

        // Check minimum role level requirement
        if (
          minRoleLevel &&
          (!userRole.level || userRole.level > minRoleLevel)
        ) {
          // Redirect based on user's actual role
          if (
            userRole.name === "System Administrator" ||
            userRole.name === "Stations Manager" ||
            (userRole.level && userRole.level <= 2)
          ) {
            router.push("/manager/dashboard");
          } else {
            router.push("/operator/dashboard");
          }
          return;
        }
      }
    }
  }, [
    isLoading,
    isAuthenticated,
    user,
    requiredRole,
    minRoleLevel,
    redirectTo,
    router,
  ]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show loading while redirecting
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  // Check role requirements
  if (requiredRole || minRoleLevel) {
    const userRole = user?.role;

    if (!userRole) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">
              Checking permissions...
            </p>
          </div>
        </div>
      );
    }

    // Check specific role requirement
    if (requiredRole && userRole.name !== requiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Redirecting...</p>
          </div>
        </div>
      );
    }

    // Check minimum role level requirement
    if (minRoleLevel && (!userRole.level || userRole.level > minRoleLevel)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Redirecting...</p>
          </div>
        </div>
      );
    }
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
}
