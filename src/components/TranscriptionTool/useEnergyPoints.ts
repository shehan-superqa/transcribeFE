import { useState, useEffect } from 'react';
import { getCurrentUser, User } from '../../lib/api';

export const useEnergyPoints = (user: User | null) => {
  const [energyPoints, setEnergyPoints] = useState(100); // Default to 100

  const fetchEnergyPoints = async () => {
    if (!user) {
      setEnergyPoints(0);
      return;
    }

    try {
      // Fetch user data which should include energyPoints
      const response = await getCurrentUser();
      if (response.success && response.data) {
        // If backend returns energyPoints, use it; otherwise default to 100
        setEnergyPoints(response.data.energyPoints ?? 100);
      } else {
        // Fallback to default if fetch fails
        setEnergyPoints(100);
      }
    } catch (err) {
      console.warn('Could not fetch energy points from backend:', err);
      // Fallback to default energy points if API call fails
      setEnergyPoints(100);
    }
  };

  useEffect(() => {
    if (user) {
      // Use energyPoints from user object if available, otherwise fetch
      if (user.energyPoints !== undefined) {
        setEnergyPoints(user.energyPoints);
      } else {
        fetchEnergyPoints();
      }
    } else {
      setEnergyPoints(0);
    }
  }, [user]);

  // Refresh energy points when user changes
  useEffect(() => {
    if (user) {
      fetchEnergyPoints();
    }
  }, [user?.id]); // Only refetch when user ID changes

  return { energyPoints, setEnergyPoints, refreshEnergyPoints: fetchEnergyPoints };
};
