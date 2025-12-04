"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  post,
  API_ENDPOINTS,
  User,
  ApiResponse,
  LoginResponse,
} from "@/utils/api";
import { getAuthToken } from "@/utils/auth/auth";

interface AuthContextType {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    email: string,
    password: string,
    role: "admin" | "manager" | "operator",
    name: string
  ) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Check if user is authenticated - memoized to prevent unnecessary re-renders
  const isAuthenticated = useMemo(
    () => !isLoading && !!user && !!token,
    [isLoading, user, token]
  );

  useEffect(() => {
    setMounted(true);

    // Only check localStorage on the client side
    if (typeof window !== "undefined") {
      try {
        const storedUser = localStorage.getItem("auth_user");
        const storedToken = getAuthToken();

        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setToken(storedToken);
          console.log("User restored from localStorage:", userData.username);
        }
      } catch (error) {
        console.error("Failed to parse stored user data:", error);
        // Clear invalid data
        try {
          localStorage.removeItem("authToken");
          localStorage.removeItem("auth_user");
        } catch (clearError) {
          console.error("Failed to clear invalid auth data:", clearError);
        }
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await post<ApiResponse<LoginResponse>>(
        API_ENDPOINTS.AUTH.LOGIN,
        {
          email,
          password,
        }
      );

      if (response.success && response.data) {
        const { user: userData, token: accessToken } = response.data;

        // Store in localStorage first for immediate access
        if (mounted) {
          try {
            localStorage.setItem("authToken", accessToken);
            localStorage.setItem("auth_user", JSON.stringify(userData));
          } catch (error) {
            console.error("Failed to save auth data to localStorage:", error);
          }
        }

        // Update state
        setUser(userData);
        setToken(accessToken);

        // Immediate redirect without waiting for state updates
        const targetPath =
          userData.role.name === "System Administrator" ||
          userData.role.name === "Stations Manager" ||
          userData.role.level <= 2
            ? "/manager/dashboard"
            : "/operator/dashboard";

        router.replace(targetPath);

        return true;
      }

      return false;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const register = async (
    email: string,
    password: string,
    role: "admin" | "manager" | "operator",
    name: string
  ): Promise<boolean> => {
    try {
      const response = await post<ApiResponse<LoginResponse>>(
        API_ENDPOINTS.AUTH.REGISTER,
        {
          email,
          password,
          password_confirmation: password,
          role,
          name,
        }
      );

      if (response.success && response.data) {
        const { user: userData, token: accessToken } = response.data;

        // Store in localStorage first for immediate access
        if (mounted) {
          try {
            localStorage.setItem("authToken", accessToken);
            localStorage.setItem("auth_user", JSON.stringify(userData));
          } catch (error) {
            console.error("Failed to save auth data to localStorage:", error);
          }
        }

        // Update state
        setUser(userData);
        setToken(accessToken);

        // Immediate redirect without waiting for state updates
        const targetPath =
          userData.role.name === "System Administrator" ||
          userData.role.name === "Stations Manager" ||
          userData.role.level <= 2
            ? "/manager/dashboard"
            : "/operator/dashboard";

        router.replace(targetPath);

        return true;
      }

      return false;
    } catch (error) {
      console.error("Registration failed:", error);
      return false;
    }
  };

  const logout = () => {
    // Clear localStorage first for immediate effect
    if (mounted) {
      try {
        localStorage.removeItem("authToken");
        localStorage.removeItem("auth_user");
        localStorage.removeItem("smart-parking-current-gate");
      } catch (error) {
        console.error("Failed to clear auth data from localStorage:", error);
      }
    }

    // Clear local state
    setUser(null);
    setToken(null);

    // Immediate redirect
    router.replace("/auth/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        setUser,
        login,
        register,
        logout,
        isLoading,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
