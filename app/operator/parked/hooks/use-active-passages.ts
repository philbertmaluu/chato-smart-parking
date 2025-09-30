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

  // Calculate current fee based on duration and rate
  const calculateCurrentFee = (passage: VehiclePassage): string => {
    const entry = new Date(passage.entry_time);
    const now = new Date();
    const diffHours = (now.getTime() - entry.getTime()) / (1000 * 60 * 60);
    
    // Use the base amount as hourly rate, or default to 5 Tsh per hour
    const hourlyRate = parseFloat(passage.base_amount?.toString() || '5');
    const currentFee = diffHours * hourlyRate;
    
    return `Tsh. ${currentFee.toFixed(2)}`;
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
  const fetchActivePassages = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching active passages...');
      const response = await VehiclePassageService.getActivePassages();
      console.log('Active passages response:', response);
      
      // Handle the API response structure
      let passages: VehiclePassage[] = [];
      
      if (response && response.success && Array.isArray(response.data)) {
        passages = response.data;
        console.log('Found passages:', passages.length);
      } else {
        console.error('Invalid response format:', response);
        throw new Error('Invalid response format: passages data is not available');
      }
      
      const transformedPassages = passages.map(transformPassageForDisplay);
      console.log('Transformed passages:', transformedPassages.length);
      setActivePassages(transformedPassages);
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
      await fetchActivePassages();
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
    fetchActivePassages();
  }, []);

  return {
    activePassages,
    loading,
    error,
    refreshing,
    fetchActivePassages,
    refreshActivePassages,
    processVehicleExit,
    searchActivePassages,
    getPassageStatistics,
  };
};
