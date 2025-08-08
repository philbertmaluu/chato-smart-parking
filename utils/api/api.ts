import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig, AxiosHeaders } from "axios";
import { API_BASE_URL } from "../config/config";
import { getAuthToken, logout } from "../auth/auth";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 second timeout
});

// Add auth token to requests
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAuthToken();
  if (token && config.headers && typeof (config.headers as AxiosHeaders).set === "function") {
    (config.headers as AxiosHeaders).set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      logout();
    }
    return Promise.reject(error);
  }
);

// Helper function to handle API errors
function handleApiError(error: AxiosError): never {
  if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
    throw new Error('Unable to connect to server. Please check your internet connection and try again.');
  }
  
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const data = error.response.data as any;
    
    switch (status) {
      case 400:
        throw new Error(data?.message || 'Invalid request. Please check your input.');
      case 401:
        throw new Error('Invalid credentials. Please check your email and password.');
      case 403:
        throw new Error('Access denied. You do not have permission to perform this action.');
      case 404:
        throw new Error('Resource not found. Please check the URL and try again.');
      case 422:
        throw new Error(data?.message || 'Validation error. Please check your input.');
      case 500:
        throw new Error('Server error. Please try again later.');
      default:
        throw new Error(data?.message || `Server error (${status}). Please try again.`);
    }
  }
  
  // Network or other error
  throw new Error('Network error. Please check your connection and try again.');
}

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/login",
    REGISTER: "/register",
    LOGOUT: "/logout",
    USER: "/user",
    UPDATE_PROFILE: "/profile",
    CHANGE_PASSWORD: "/change-password",
    REFRESH_TOKEN: "/refresh-token",
  },

};

export async function get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const response: AxiosResponse<T> = await api.get(url, config);
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError);
  }
}

export async function post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  try {
    const response: AxiosResponse<T> = await api.post(url, data, config);
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError);
  }
}

export async function put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  try {
    const response: AxiosResponse<T> = await api.put(url, data, config);
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError);
  }
}

export async function patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  try {
    const response: AxiosResponse<T> = await api.patch(url, data, config);
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError);
  }
}

export async function del<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const response: AxiosResponse<T> = await api.delete(url, config);
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError);
  }
}

export default api;
