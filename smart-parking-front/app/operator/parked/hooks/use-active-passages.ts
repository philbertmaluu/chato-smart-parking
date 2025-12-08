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

  // Calculate current fee based on duration and rate using days-based charging (rolling 24-hour periods)
  const calculateCurrentFee = (passage: VehiclePassage): string => {
    // Check if vehicle has body_type_id or base_amount - if not, can't calculate fee
    if (!passage.vehicle?.body_type_id && !passage.base_amount) {
      return 'N/A (Type required)';
    }
    
    const entry = new Date(passage.entry_time);
    const now = new Date();
    const diffHours = (now.getTime() - entry.getTime()) / (1000 * 60 * 60);
    
    // Use the base amount as DAILY rate (not hourly)
    // base_amount should contain the daily price for this vehicle type
    let dailyRate = parseFloat(passage.base_amount?.toString() || '0');
    
    // If base_amount is 0, show 0.00 - don't assume "Paid"
    if (dailyRate === 0) {
      return 'Tsh. 0.00';
    }
    
    // Apply days-based calculation (rolling 24-hour periods)
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
      
      // Fetch server preview for each passage in parallel
      const previewResults = await Promise.allSettled(
        passages.map((passage) =>
          VehiclePassageService.previewExit(passage.id).catch((err) => {
            console.warn(`Failed to fetch preview for passage ${passage.id}:`, err);
            return null;
          })
        )
      );

      // Merge preview data into passages
      const passagesWithPreview = passages.map((passage, index) => {
        const previewResult = previewResults[index];
        let previewData: any = null;

        if (previewResult.status === 'fulfilled' && previewResult.value?.data) {
          previewData = previewResult.value.data;
        }

        // Create enhanced passage with preview data
        return {
          ...passage,
          // Use server preview if available, otherwise fall back to local calculation
          ...(previewData && {
            _serverPreview: previewData,
          }),
        };
      });

      const transformedPassages = passagesWithPreview.map((passage) =>
        transformPassageForDisplay(passage)
      );
      
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
