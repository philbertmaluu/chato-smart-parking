import { useState, useEffect, useCallback } from 'react';
import { get, API_ENDPOINTS } from '@/utils/api';

interface DashboardSummary {
  total_passages: number;
  active_passages: number;
  completed_today: number;
  total_revenue: number;
  revenue_today: number;
  entries_today: number;
  exits_today: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  messages?: string;
  status: number;
}

interface PaginatedApiResponse<T> {
  success: boolean;
  data: {
    data: T[];
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
  };
  messages?: string;
  status: number;
}

interface RevenueDataPoint {
  name: string;
  revenue: number;
  vehicles: number;
}

interface HourlyDataPoint {
  hour: string;
  vehicles: number;
}

interface VehicleTypeDataPoint {
  name: string;
  value: number;
  color: string;
}

interface RecentActivity {
  type: 'entry' | 'exit';
  plate: string;
  operator: string;
  time: string;
  amount: string;
  passageId: number;
}

interface VehiclePassage {
  id: number;
  passage_number: string;
  entry_time: string;
  exit_time?: string;
  total_amount: number;
  status: string;
  vehicle?: {
    plate_number: string;
    body_type?: {
      name: string;
    };
  };
  entry_operator?: {
    user?: {
      username: string;
      name?: string;
    };
  };
  exit_operator?: {
    user?: {
      username: string;
      name?: string;
    };
  };
}

interface DashboardStats {
  totalParked: number;
  todayRevenue: number;
  totalEntries: number;
  activeOperators: number;
  loading: boolean;
  error: string | null;
  // Chart data
  weeklyRevenueData: RevenueDataPoint[];
  hourlyTrafficData: HourlyDataPoint[];
  vehicleTypeData: VehicleTypeDataPoint[];
  recentActivity: RecentActivity[];
}

// Vehicle type colors
const VEHICLE_TYPE_COLORS: Record<string, string> = {
  'Car': '#3B82F6',
  'Motorcycle': '#10B981',
  'Truck': '#F59E0B',
  'Bus': '#8B5CF6',
  'Van': '#EC4899',
  'SUV': '#06B6D4',
  'Pickup': '#84CC16',
  'Other': '#6B7280',
  'default': '#6B7280',
};

// Day names for weekly chart
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Format time ago
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
};

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalParked: 0,
    todayRevenue: 0,
    totalEntries: 0,
    activeOperators: 0,
    loading: true,
    error: null,
    weeklyRevenueData: [],
    hourlyTrafficData: [],
    vehicleTypeData: [],
    recentActivity: [],
  });

  const fetchStats = useCallback(async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));

      // Try to fetch dashboard summary, but don't fail if it doesn't exist
      let summary: DashboardSummary | null = null;
      try {
        const summaryResponse = await get<ApiResponse<DashboardSummary>>(API_ENDPOINTS.VEHICLE_PASSAGES.DASHBOARD_SUMMARY);
        console.log('[Dashboard Stats] Summary Response:', summaryResponse);
        if (summaryResponse?.success) {
          summary = summaryResponse.data;
        }
      } catch (summaryError: any) {
        console.warn('[Dashboard Stats] Dashboard summary endpoint not available, will calculate from other endpoints:', summaryError.message);
      }

      // Fetch other data in parallel (these are more likely to work)
      const [operatorsResponse, passagesResponse, completedPassagesResponse] = await Promise.all([
        // Operators list
        get<ApiResponse<any> | PaginatedApiResponse<any>>(API_ENDPOINTS.OPERATORS.LIST).catch(err => {
          console.warn('[Dashboard Stats] Failed to fetch operators:', err);
          return { success: false, data: [] };
        }),
        // Recent passages (for activity and charts)
        get<ApiResponse<any> | PaginatedApiResponse<any>>(`${API_ENDPOINTS.VEHICLE_PASSAGES.LIST}?per_page=100`).catch(err => {
          console.warn('[Dashboard Stats] Failed to fetch passages:', err);
          return { success: false, data: [] };
        }),
        // Completed passages for revenue calculations - fetch more to cover full week
        get<ApiResponse<any> | PaginatedApiResponse<any>>(`${API_ENDPOINTS.VEHICLE_PASSAGES.COMPLETED_LIST}?per_page=1000`).catch(err => {
          console.warn('[Dashboard Stats] Failed to fetch completed passages:', err);
          return { success: false, data: [] };
        }),
      ]);

      // Debug: Log API responses
      console.log('[Dashboard Stats] Parsed Summary:', summary);
      console.log('[Dashboard Stats] Operators Response:', operatorsResponse);
      console.log('[Dashboard Stats] Passages Response:', passagesResponse);
      console.log('[Dashboard Stats] Completed Passages Response:', completedPassagesResponse);
      
      // Parse operators
      let operators: any[] = [];
      if (operatorsResponse?.success) {
        const responseData = operatorsResponse.data;
        if (responseData && typeof responseData === 'object' && 'data' in responseData && Array.isArray((responseData as any).data)) {
          operators = (responseData as any).data;
        } else if (Array.isArray(responseData)) {
          operators = responseData;
        }
      }

      // Parse passages
      let allPassages: VehiclePassage[] = [];
      if (passagesResponse?.success) {
        const responseData = passagesResponse.data;
        if (responseData && typeof responseData === 'object' && 'data' in responseData && Array.isArray((responseData as any).data)) {
          allPassages = (responseData as any).data;
        } else if (Array.isArray(responseData)) {
          allPassages = responseData;
        }
      }

      // Parse completed passages
      let completedPassages: VehiclePassage[] = [];
      if (completedPassagesResponse?.success) {
        const responseData = completedPassagesResponse.data;
        if (responseData && typeof responseData === 'object' && 'data' in responseData && Array.isArray((responseData as any).data)) {
          completedPassages = (responseData as any).data;
        } else if (Array.isArray(responseData)) {
          completedPassages = responseData;
        }
      }

      // Count active operators - only count truly active ones
      const activeOperators = operators.filter(
        (op: any) => {
          // Check if operator user is active
          const userActive = op?.user?.is_active === true;
          // Check if operator itself is active (fallback if no user object)
          const operatorActive = op?.is_active === true;
          // Only count if user exists and is active, or operator is explicitly active
          return (op?.user && userActive) || (!op?.user && operatorActive);
        }
      ).length;
      
      console.log('[Dashboard Stats] Total Operators:', operators.length);
      console.log('[Dashboard Stats] Active Operators Count:', activeOperators);

      // Calculate stats from passages if summary is not available
      let totalParked = summary?.active_passages ?? 0;
      let todayRevenue = summary?.revenue_today ?? 0;
      let totalEntries = summary?.entries_today ?? summary?.completed_today ?? 0;

      // If summary is not available, calculate from passages
      if (!summary) {
        // Calculate total parked (active passages without exit_time)
        totalParked = allPassages.filter(p => !p.exit_time || p.status === 'active').length;
        
        // Calculate today's revenue from completed passages - use sum function
        const today = new Date().toISOString().split('T')[0];
        todayRevenue = completedPassages
          .filter(p => {
            if (!p.exit_time) return false;
            const exitDate = new Date(p.exit_time).toISOString().split('T')[0];
            return exitDate === today;
          })
          .reduce((sum, p) => {
            const amount = typeof p.total_amount === 'number' ? p.total_amount : parseFloat(p.total_amount || '0');
            return sum + (isNaN(amount) ? 0 : amount);
          }, 0);
        
        // Calculate today's entries
        totalEntries = allPassages.filter(p => p.entry_time && p.entry_time.startsWith(today)).length;
        
        console.log('[Dashboard Stats] Calculated from passages - Total Parked:', totalParked, 'Today Revenue:', todayRevenue, 'Today Entries:', totalEntries);
      }

      // Calculate weekly revenue data (last 7 days)
      const weeklyRevenueData = calculateWeeklyRevenue(completedPassages);
      
      // Calculate hourly traffic (today)
      const hourlyTrafficData = calculateHourlyTraffic(allPassages);
      
      // Calculate vehicle type distribution
      const vehicleTypeData = calculateVehicleTypeDistribution(allPassages);
      
      // Get recent activity
      const recentActivity = getRecentActivity(allPassages);

      const finalStats = {
        totalParked,
        todayRevenue,
        totalEntries,
        activeOperators: activeOperators > 0 ? activeOperators : (operators.length > 0 ? operators.length : 0),
        loading: false,
        error: null,
        weeklyRevenueData,
        hourlyTrafficData,
        vehicleTypeData,
        recentActivity,
      };
      
      console.log('[Dashboard Stats] Final Stats Being Set:', finalStats);
      
      setStats(finalStats);
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch dashboard statistics',
      }));
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { ...stats, refresh: fetchStats };
}

// Calculate weekly revenue from completed passages
function calculateWeeklyRevenue(passages: VehiclePassage[]): RevenueDataPoint[] {
  const today = new Date();
  const weekData: Record<string, { revenue: number; vehicles: number }> = {};
  
  // Initialize last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayName = DAY_NAMES[date.getDay()];
    weekData[dayName] = { revenue: 0, vehicles: 0 };
  }
  
  // Calculate revenue per day - use proper sum function
  passages.forEach(passage => {
    const exitDate = passage.exit_time ? new Date(passage.exit_time) : null;
    if (!exitDate) return;
    
    // Check if within last 7 days
    const diffDays = Math.floor((today.getTime() - exitDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7 && diffDays >= 0) {
      const dayName = DAY_NAMES[exitDate.getDay()];
      if (weekData[dayName]) {
        // Use proper sum with type conversion
        const amount = typeof passage.total_amount === 'number' 
          ? passage.total_amount 
          : parseFloat(passage.total_amount || '0');
        weekData[dayName].revenue += (isNaN(amount) ? 0 : amount);
        weekData[dayName].vehicles += 1;
      }
    }
  });
  
  // Convert to array maintaining order (last 7 days) - always return 7 days even if empty
  const result: RevenueDataPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayName = DAY_NAMES[date.getDay()];
    result.push({
      name: dayName,
      revenue: weekData[dayName]?.revenue || 0, // Real data or 0
      vehicles: weekData[dayName]?.vehicles || 0, // Real data or 0
    });
  }
  
  return result; // Always returns 7 days with real data or zeros
}

// Calculate hourly traffic for today
function calculateHourlyTraffic(passages: VehiclePassage[]): HourlyDataPoint[] {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // Initialize hourly data
  const hourlyData: Record<number, number> = {};
  for (let i = 0; i < 24; i++) {
    hourlyData[i] = 0;
  }
  
  // Count entries per hour for today
  passages.forEach(passage => {
    const entryDate = new Date(passage.entry_time);
    const entryDateStr = entryDate.toISOString().split('T')[0];
    
    if (entryDateStr === todayStr) {
      const hour = entryDate.getHours();
      hourlyData[hour] = (hourlyData[hour] || 0) + 1;
    }
  });
  
  // Convert to array with hour labels
  const hourLabels = ['12AM', '1AM', '2AM', '3AM', '4AM', '5AM', '6AM', '7AM', '8AM', '9AM', '10AM', '11AM',
                      '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM', '10PM', '11PM'];
  
  // Return only business hours (6AM - 10PM) for cleaner chart - always returns same hours with real data or zeros
  return [6, 8, 10, 12, 14, 16, 18, 20, 22].map(hour => ({
    hour: hourLabels[hour],
    vehicles: hourlyData[hour] || 0, // Real data or 0
  }));
}

// Calculate vehicle type distribution
function calculateVehicleTypeDistribution(passages: VehiclePassage[]): VehicleTypeDataPoint[] {
  const typeCount: Record<string, number> = {};
  let total = 0;
  
  passages.forEach(passage => {
    const typeName = passage.vehicle?.body_type?.name || 'Other';
    typeCount[typeName] = (typeCount[typeName] || 0) + 1;
    total++;
  });
  
  if (total === 0) {
    // Return empty array if no passages - use real data only
    return [];
  }
  
  // Convert to percentages and sort by count
  const result = Object.entries(typeCount)
    .map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
      color: VEHICLE_TYPE_COLORS[name] || VEHICLE_TYPE_COLORS['default'],
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5 types
  
  // Ensure percentages sum to 100
  const sum = result.reduce((acc, item) => acc + item.value, 0);
  if (sum !== 100 && result.length > 0) {
    result[0].value += (100 - sum);
  }
  
  return result;
}

// Get recent activity (entries and exits)
function getRecentActivity(passages: VehiclePassage[]): RecentActivity[] {
  const activities: RecentActivity[] = [];
  
  // Sort passages by most recent activity
  const sortedPassages = [...passages]
    .sort((a, b) => {
      const timeA = a.exit_time ? new Date(a.exit_time).getTime() : new Date(a.entry_time).getTime();
      const timeB = b.exit_time ? new Date(b.exit_time).getTime() : new Date(b.entry_time).getTime();
      return timeB - timeA;
    })
    .slice(0, 10); // Get last 10
  
  sortedPassages.forEach(passage => {
    const plateNumber = passage.vehicle?.plate_number || passage.passage_number;
    
    // Add exit activity if exists
    if (passage.exit_time && passage.status === 'completed') {
      activities.push({
        type: 'exit',
        plate: plateNumber,
        operator: passage.exit_operator?.user?.username || passage.exit_operator?.user?.name || 'System',
        time: formatTimeAgo(passage.exit_time),
        amount: `Tsh. ${(passage.total_amount || 0).toLocaleString()}`,
        passageId: passage.id,
      });
    }
    
    // Add entry activity
    activities.push({
      type: 'entry',
      plate: plateNumber,
      operator: passage.entry_operator?.user?.username || passage.entry_operator?.user?.name || 'System',
      time: formatTimeAgo(passage.entry_time),
      amount: `Tsh. ${(passage.total_amount || 0).toLocaleString()}`,
      passageId: passage.id,
    });
  });
  
  // Sort by most recent and take top 4
  return activities.slice(0, 4);
}
