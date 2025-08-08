"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
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

  // Check if user is authenticated
  const isAuthenticated = !isLoading && !!user && !!token;

  useEffect(() => {
    setMounted(true);

    // Only check localStorage on the client side
    if (typeof window !== "undefined") {
      try {
        const storedUser = localStorage.getItem("auth_user");
        const storedToken = getAuthToken();

        console.log("Auth initialization:", {
          storedUser: !!storedUser,
          storedToken: !!storedToken,
          window: typeof window,
          userAgent: navigator.userAgent,
        });

        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setToken(storedToken);
          console.log(
            "User restored from localStorage:",
            userData.username,
            userData.role?.name
          );
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
    console.log("Auth provider initialized, loading set to false");
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      const response = await post<ApiResponse<LoginResponse>>(
        API_ENDPOINTS.AUTH.LOGIN,
        {
          email,
          password,
        }
      );

      if (response.success && response.data) {
        const { user: userData, token: accessToken } = response.data;

        setUser(userData);
        setToken(accessToken);

        // Store in localStorage
        if (mounted) {
          try {
            localStorage.setItem("authToken", accessToken);
            localStorage.setItem("auth_user", JSON.stringify(userData));
          } catch (error) {
            console.error("Failed to save auth data to localStorage:", error);
          }
        }

        // Redirect based on role
        if (
          userData.role.name === "System Administrator" ||
          userData.role.name === "Stations Manager" ||
          userData.role.level <= 2
        ) {
          router.push("/manager/dashboard");
        } else {
          router.push("/operator/dashboard");
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error("Login failed:", error);
      // Re-throw the error so the login page can handle it
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    role: "admin" | "manager" | "operator",
    name: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);

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

        setUser(userData);
        setToken(accessToken);

        // Store in localStorage
        if (mounted) {
          try {
            localStorage.setItem("authToken", accessToken);
            localStorage.setItem("auth_user", JSON.stringify(userData));
          } catch (error) {
            console.error("Failed to save auth data to localStorage:", error);
          }
        }

        // Redirect based on role
        if (
          userData.role.name === "System Administrator" ||
          userData.role.name === "Stations Manager" ||
          userData.role.level <= 2
        ) {
          router.push("/manager/dashboard");
        } else {
          router.push("/operator/dashboard");
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error("Registration failed:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear local state
    setUser(null);
    setToken(null);

    // Clear localStorage
    if (mounted) {
      try {
        localStorage.removeItem("authToken");
        localStorage.removeItem("auth_user");
      } catch (error) {
        console.error("Failed to clear auth data from localStorage:", error);
      }
    }

    // Redirect to login page
    router.push("/auth/login");
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
