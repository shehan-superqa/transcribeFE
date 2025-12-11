import { useState, useEffect, useRef } from 'react';
import { getCurrentUser, User } from '../../lib/api';
import { getEnergyPointsBalance } from '../../lib/api/paymentApi';

// Cache duration: 30 seconds
const CACHE_DURATION = 30 * 1000;

interface CacheEntry {
  balance: number;
  timestamp: number;
}

export const useEnergyPoints = (user: User | null) => {
  const [energyPoints, setEnergyPoints] = useState(100); // Default to 100
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<CacheEntry | null>(null);

  const fetchEnergyPoints = async (forceRefresh = false) => {
    if (!user) {
      setEnergyPoints(0);
      cacheRef.current = null;
      return;
    }

    // Check cache if not forcing refresh
    if (!forceRefresh && cacheRef.current) {
      const now = Date.now();
      const cacheAge = now - cacheRef.current.timestamp;
      if (cacheAge < CACHE_DURATION) {
        // Use cached value
        setEnergyPoints(cacheRef.current.balance);
        return;
      }
    }

    try {
      setLoading(true);
      
      // Try to fetch from payment API first (more accurate)
      try {
        const balanceResponse = await getEnergyPointsBalance();
        if (balanceResponse.success && balanceResponse.data) {
          const balance = balanceResponse.data.energyPoints;
          setEnergyPoints(balance);
          // Update cache
          cacheRef.current = {
            balance,
            timestamp: Date.now(),
          };
          return;
        }
      } catch (balanceError) {
        console.warn('Could not fetch balance from payment API, trying user API:', balanceError);
      }

      // Fallback to user data API
      const response = await getCurrentUser();
      if (response.success && response.data) {
        const balance = response.data.energyPoints ?? 100;
        setEnergyPoints(balance);
        // Update cache
        cacheRef.current = {
          balance,
          timestamp: Date.now(),
        };
      } else {
        // Fallback to default if fetch fails
        setEnergyPoints(100);
        cacheRef.current = null;
      }
    } catch (err) {
      console.warn('Could not fetch energy points from backend:', err);
      // Fallback to default energy points if API call fails
      setEnergyPoints(100);
      cacheRef.current = null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      // Use energyPoints from user object if available and cache is empty, otherwise fetch
      if (user.energyPoints !== undefined && !cacheRef.current) {
        setEnergyPoints(user.energyPoints);
        // Set initial cache
        cacheRef.current = {
          balance: user.energyPoints,
          timestamp: Date.now(),
        };
      } else {
        fetchEnergyPoints();
      }
    } else {
      setEnergyPoints(0);
      cacheRef.current = null;
    }
  }, [user]);

  // Refresh energy points when user ID changes (force refresh)
  useEffect(() => {
    if (user) {
      fetchEnergyPoints(true); // Force refresh on user change
    }
  }, [user?.id]); // Only refetch when user ID changes

  // Function to manually refresh (bypasses cache)
  const refreshEnergyPoints = () => {
    fetchEnergyPoints(true);
  };

  // Function to invalidate cache (useful after purchases)
  const invalidateCache = () => {
    cacheRef.current = null;
  };

  return {
    energyPoints,
    setEnergyPoints,
    refreshEnergyPoints,
    invalidateCache,
    loading,
  };
};
