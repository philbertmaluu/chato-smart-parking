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

interface DashboardStats {
  totalParked: number;
  todayRevenue: number;
  totalEntries: number;
  activeOperators: number;
  loading: boolean;
  error: string | null;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalParked: 0,
    todayRevenue: 0,
    totalEntries: 0,
    activeOperators: 0,
    loading: true,
    error: null,
  });

  const fetchStats = useCallback(async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));

      // Fetch dashboard summary (passages, revenue)
      const summaryResponse = await get<{ data: DashboardSummary }>(
        API_ENDPOINTS.VEHICLE_PASSAGES.DASHBOARD_SUMMARY
      );

      // Fetch operators count
      const operatorsResponse = await get<{ data: { data: any[] } }>(
        API_ENDPOINTS.OPERATORS.LIST
      );

      const summary = summaryResponse?.data;
      const operators = operatorsResponse?.data?.data || [];

      // Count active operators (those with active status)
      const activeOperators = operators.filter(
        (op: any) => op.user?.is_active === true || op.is_active === true
      ).length;

      setStats({
        totalParked: summary?.active_passages || 0,
        todayRevenue: summary?.revenue_today || 0,
        totalEntries: summary?.entries_today || summary?.completed_today || 0,
        activeOperators: activeOperators || operators.length,
        loading: false,
        error: null,
      });
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

