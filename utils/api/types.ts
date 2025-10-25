// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

// Pricing System Types
export interface PricingData {
  amount: number;
  payment_type: 'Cash' | 'Bundle' | 'Exemption';
  payment_type_id: number;
  requires_payment: boolean;
  description: string;
  base_amount: number;
  discount_amount: number;
  total_amount: number;
  bundle_subscription_id?: number | null;
}

export interface VehiclePassageEntryData {
  id: number;
  passage_number: string;
  vehicle_id: number;
  account_id?: number | null;
  bundle_subscription_id?: number | null;
  payment_type_id: number;
  entry_time: string;
  entry_station_id: number;
  entry_gate_id: number;
  passage_type: 'toll' | 'free' | 'exempted';
  base_amount: number;
  discount_amount: number;
  total_amount: number;
  status: 'active' | 'completed' | 'cancelled';
}

export interface GateControlResponse {
  vehicle: any;
  pricing: PricingData;
  gate_action: 'allow' | 'require_payment' | 'deny';
  receipt?: any;
}

export interface PlateDetectionRequest {
  plate_number: string;
  gate_id: number;
  operator_id: number;
  direction: 'entry' | 'exit';
  additional_data?: {
    account_id?: number;
    notes?: string;
  };
}

export interface PricingCalculationRequest {
  vehicle_id?: number;
  plate_number?: string;
  station_id: number;
  account_id?: number;
}

// User Types
export interface Role {
  id: number;
  name: string;
  description: string;
  level: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Permission {
  id: number;
  name: string;
  guard: string;
  description: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  pivot: {
    user_id: number;
    permission_id: number;
    assigned_at: string | null;
    assigned_by: number | null;
    created_at: string;
    updated_at: string;
  };
}

export interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  profile_photo: string | null;
  address: string;
  gender: string;
  date_of_birth: string;
  last_login: string;
  email_verified_at: string;
  role_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  role: Role;
  permissions: Permission[];
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  password_confirmation: string;
  role: "admin" | "manager" | "operator";
  name: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  token_type: string;
}

// Parking Types
export interface ParkingStation {
  id: number;
  name: string;
  address: string;
  total_spaces: number;
  available_spaces: number;
  hourly_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ParkingEntry {
  id: number;
  station_id: number;
  vehicle_number: string;
  entry_time: string;
  exit_time: string | null;
  duration: number | null;
  amount: number | null;
  status: "active" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
  station: ParkingStation;
}

// Gate Types
export interface Gate {
  id: number;
  name: string;
  station_id: number;
  type: "entry" | "exit" | "both";
  is_active: boolean;
  status: "open" | "closed" | "maintenance";
  created_at: string;
  updated_at: string;
  station: ParkingStation;
}

// Operator Types
export interface Operator {
  id: number;
  user_id: number;
  station_id: number;
  shift_start: string;
  shift_end: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user: User;
  station: ParkingStation;
}

// Analytics Types
export interface DashboardStats {
  total_revenue: number;
  total_entries: number;
  active_entries: number;
  occupancy_rate: number;
  average_duration: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  entries: number;
}

export interface OccupancyData {
  station_id: number;
  station_name: string;
  total_spaces: number;
  occupied_spaces: number;
  occupancy_rate: number;
} 