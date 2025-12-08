import { useState, useEffect } from 'react';
import { VehiclePassageService, type VehiclePassage } from '@/utils/api/vehicle-passage-service';
import { toast } from 'sonner';

export interface ActivePassage extends VehiclePassage {
  // Additional computed fields for display
  duration: string;
  currentFee: string;
  spot?: string; // Parking spot (if applicable)
}

export const useActivePassages = () => {
  const [activePassages, setActivePassages] = useState<ActivePassage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState<{
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  // Calculate duration from entry time
  const calculateDuration = (entryTime: string): string => {
    const entry = new Date(entryTime);
    const now = new Date();
    const diffMs = now.getTime() - entry.getTime();
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Check if vehicle has paid_until in the future (within 24-hour paid window)
  const isPaidPassActive = (passage: VehiclePassage): boolean => {
    const paidUntil = passage?.vehicle?.paid_until ? new Date(passage.vehicle.paid_until) : null;
    return !!paidUntil && paidUntil.getTime() > Date.now();
  };

  // Calculate current fee based on duration and rate using days-based charging (rolling 24-hour periods)
  const calculateCurrentFee = (passage: VehiclePassage): string => {
    // ONLY check paid_until - backend handles the rest
    if (isPaidPassActive(passage)) {
      return 'Paid (within 24h)';
    }
    
    // If no body type, can't calculate
    if (!passage.vehicle?.body_type_id && !passage.base_amount) {
      return 'N/A (Type required)';
    }
    
    // If base_amount is 0, show it as 0 (not "Paid")
    const dailyRate = parseFloat(passage.base_amount?.toString() || '0');
    if (dailyRate === 0) {
      return 'Tsh. 0.00';
    }
    
    // Calculate normally
    const entry = new Date(passage.entry_time);
    const now = new Date();
    const diffHours = (now.getTime() - entry.getTime()) / (1000 * 60 * 60);
    const daysToCharge = calculateDaysToCharge(diffHours);
    const currentFee = dailyRate * daysToCharge;
    
    return `Tsh. ${currentFee.toFixed(2)}`;
  };

  // Calculate total billable days based on parking time using rolling 24-hour periods.
  // Same logic as backend for consistency
  const calculateDaysToCharge = (hoursSpent: number): number => {
    // Minimum charge — always 1 day
    if (hoursSpent <= 0) {
      return 1;
    }

    // If parked less than 24 hours, charge 1 day
    if (hoursSpent < 24) {
      return 1;
    }

    // If parked 24 hours or more, calculate number of full 24-hour periods
    // Round up to next full day if there's any partial day
    const daysSpent = hoursSpent / 24;
    return Math.ceil(daysSpent);
  };

  // Transform passage data for display
  const transformPassageForDisplay = (passage: VehiclePassage): ActivePassage => {
    return {
      ...passage,
      duration: calculateDuration(passage.entry_time),
      currentFee: calculateCurrentFee(passage),
      spot: `A-${passage.id.toString().padStart(2, '0')}`, // Generate spot number based on passage ID
    };
  };

  // Fetch active passages
  const fetchActivePassages = async (page: number = currentPage, itemsPerPage: number = perPage) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching active passages...', { page, itemsPerPage });
      const response = await VehiclePassageService.getActivePassages(page, itemsPerPage);
      console.log('Active passages response:', response);
      
      // Handle the API response structure
      let passages: VehiclePassage[] = [];
      let paginationData = null;
      
      if (response && response.success) {
        // Check if response is paginated
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          // Paginated response
          passages = response.data.data;
          paginationData = {
            current_page: response.data.current_page || page,
            last_page: response.data.last_page || 1,
            per_page: response.data.per_page || itemsPerPage,
            total: response.data.total || 0,
          };
        } else if (Array.isArray(response.data)) {
          // Non-paginated response (backward compatibility)
          passages = response.data;
        } else {
          console.error('Invalid response format:', response);
          throw new Error('Invalid response format: passages data is not available');
        }
      } else {
        console.error('Invalid response format:', response);
        throw new Error('Invalid response format: passages data is not available');
      }
      
      // For each passage, fetch server-side preview to ensure currentFee and base_amount are authoritative
      const enrichedPassages = await Promise.allSettled(
        passages.map(async (p) => {
          try {
            const previewResp: any = await VehiclePassageService.previewExit(p.id);
            if (previewResp && previewResp.success && previewResp.data) {
              const preview = previewResp.data;
              // Merge server preview into passage
              return {
                ...p,
                base_amount: preview.base_amount ?? p.base_amount,
                total_amount: preview.amount ?? p.total_amount,
                // Use preview.is_free_reentry to show paid state
                _preview: preview,
              } as VehiclePassage;
            }
            return p;
          } catch (e) {
            return p;
          }
        })
      );

      const resolvedPassages = enrichedPassages.map((r) => (r.status === 'fulfilled' ? (r.value as VehiclePassage) : (r as any).reason || r));
      const transformedPassages = resolvedPassages.map(transformPassageForDisplay);
      console.log('Transformed passages:', transformedPassages.length);
      setActivePassages(transformedPassages);
      setPagination(paginationData);
      setCurrentPage(page);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch active passages';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching active passages:', err);
    } finally {
      setLoading(false);
    }
  };

  // Refresh active passages
  const refreshActivePassages = async () => {
    setRefreshing(true);
    try {
      await fetchActivePassages(currentPage, perPage);
      toast.success('Active passages refreshed');
    } catch (err: any) {
      toast.error('Failed to refresh active passages');
    } finally {
      setRefreshing(false);
    }
  };

  // Process vehicle exit
  const processVehicleExit = async (
    plateNumber: string,
    gateId: number,
    paymentConfirmed: boolean = false,
    notes?: string
  ) => {
    try {
      const result = await VehiclePassageService.processExit({
        plate_number: plateNumber,
        gate_id: gateId,
        payment_confirmed: paymentConfirmed,
        notes: notes,
      });

      if (result.success) {
        toast.success('Vehicle exit processed successfully');
        // Refresh the list to remove the exited vehicle
        await fetchActivePassages();
        return result;
      } else {
        toast.error(result.message || 'Failed to process vehicle exit');
        return result;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to process vehicle exit';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Search active passages
  const searchActivePassages = (searchTerm: string): ActivePassage[] => {
    if (!searchTerm.trim()) {
      return activePassages;
    }

    const term = searchTerm.toLowerCase();
    return activePassages.filter(
      (passage) =>
        passage.vehicle?.plate_number?.toLowerCase().includes(term) ||
        passage.passage_number?.toLowerCase().includes(term) ||
        passage.spot?.toLowerCase().includes(term)
    );
  };

  // Get passage statistics
  const getPassageStatistics = () => {
    if (activePassages.length === 0) {
      return {
        totalParked: 0,
        averageDuration: '0m',
        totalRevenue: 'Tsh. 0.00',
      };
    }

    // Calculate total parked
    const totalParked = activePassages.length;

    // Calculate average duration
    const totalMinutes = activePassages.reduce((acc, passage) => {
      const entry = new Date(passage.entry_time);
      const now = new Date();
      return acc + (now.getTime() - entry.getTime()) / (1000 * 60);
    }, 0);
    
    const avgMinutes = Math.floor(totalMinutes / totalParked);
    const avgHours = Math.floor(avgMinutes / 60);
    const avgMins = avgMinutes % 60;
    const averageDuration = avgHours > 0 ? `${avgHours}h ${avgMins}m` : `${avgMins}m`;

    // Calculate total potential revenue
    const totalRevenue = activePassages.reduce((acc, passage) => {
      const currentFee = parseFloat(passage.currentFee.replace('Tsh. ', ''));
      return acc + currentFee;
    }, 0);

    return {
      totalParked,
      averageDuration,
      totalRevenue: `Tsh. ${totalRevenue.toFixed(2)}`,
    };
  };

  // Load active passages on mount
  useEffect(() => {
    fetchActivePassages(currentPage, perPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    activePassages,
    loading,
    error,
    refreshing,
    pagination,
    currentPage,
    perPage,
    fetchActivePassages,
    refreshActivePassages,
    processVehicleExit,
    searchActivePassages,
    getPassageStatistics,
    setCurrentPage,
    setPerPage,
  };
};
