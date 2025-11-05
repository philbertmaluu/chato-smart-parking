import { useState, useEffect } from "react";

interface Station {
  id: number;
  name: string;
  code?: string;
  location?: string;
}

interface CurrentStation {
  id: number;
  name: string;
  code?: string;
  location?: string;
}

const CURRENT_STATION_KEY = "smart-parking-current-station";

export function useCurrentStation() {
  const [currentStation, setCurrentStation] = useState<CurrentStation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load current station from localStorage on mount
  useEffect(() => {
    const loadCurrentStation = () => {
      try {
        const stored = localStorage.getItem(CURRENT_STATION_KEY);
        if (stored) {
          const station = JSON.parse(stored);
          setCurrentStation(station);
        }
      } catch (error) {
        console.error("Error loading current station:", error);
        localStorage.removeItem(CURRENT_STATION_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrentStation();
  }, []);

  // Save to localStorage whenever current station changes
  useEffect(() => {
    if (!isLoading) {
      if (currentStation) {
        localStorage.setItem(CURRENT_STATION_KEY, JSON.stringify(currentStation));
      } else {
        localStorage.removeItem(CURRENT_STATION_KEY);
      }
    }
  }, [currentStation, isLoading]);

  const selectStation = (station: Station | null) => {
    if (station) {
      setCurrentStation({
        id: station.id,
        name: station.name,
        code: station.code,
        location: station.location,
      });
    } else {
      setCurrentStation(null);
    }
  };

  const clearStation = () => {
    setCurrentStation(null);
  };

  const getStationDisplayName = () => {
    if (!currentStation) return null;
    return currentStation.code 
      ? `${currentStation.name} (${currentStation.code})`
      : currentStation.name;
  };

  return {
    currentStation,
    selectStation,
    clearStation,
    getStationDisplayName,
    isLoading,
  };
}
