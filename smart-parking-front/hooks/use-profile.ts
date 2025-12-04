import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { put, post } from "@/utils/api/api";
import { API_ENDPOINTS } from "@/utils/api/endpoints";
import { toast } from "sonner";

interface UpdateProfileData {
  username?: string;
  email?: string;
  phone?: string;
  address?: string;
  gender?: string;
  date_of_birth?: string;
}

interface ChangePasswordData {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export function useProfile() {
  const { user, setUser } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const updateProfile = async (data: UpdateProfileData) => {
    try {
      setIsUpdating(true);
      
      const response = await put<ApiResponse>(API_ENDPOINTS.AUTH.UPDATE_PROFILE, data);
      
      if (response?.success && response.data) {
        // Update the user in auth context
        setUser(response.data);
        
        // Update localStorage
        try {
          localStorage.setItem("auth_user", JSON.stringify(response.data));
        } catch (error) {
          console.error("Failed to update user in localStorage:", error);
        }
        
        toast.success("Profile updated successfully!");
        return true;
      } else {
        toast.error(response?.message || "Failed to update profile");
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile";
      toast.error(errorMessage);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const changePassword = async (data: ChangePasswordData) => {
    try {
      setIsChangingPassword(true);
      
      const response = await post<ApiResponse>(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
      
      if (response?.success) {
        toast.success("Password changed successfully! Please log in again.");
        
        // Clear auth data since password change revokes all tokens
        try {
          localStorage.removeItem("authToken");
          localStorage.removeItem("auth_user");
        } catch (error) {
          console.error("Failed to clear auth data:", error);
        }
        
        // Redirect to login (this will be handled by the auth provider)
        window.location.href = "/auth/login";
        return true;
      } else {
        toast.error(response?.message || "Failed to change password");
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to change password";
      toast.error(errorMessage);
      return false;
    } finally {
      setIsChangingPassword(false);
    }
  };

  return {
    user,
    updateProfile,
    changePassword,
    isUpdating,
    isChangingPassword,
  };
}
