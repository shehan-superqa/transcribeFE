import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '../../lib/api';

export const useEnergyPoints = (user: User | null) => {
  const [energyPoints, setEnergyPoints] = useState(0);

  const fetchEnergyPoints = async () => {
    if (!user) return;

    // If Supabase is not configured, set default energy points
    if (!supabase) {
      setEnergyPoints(100); // Default free tier points
      return;
    }

    // Note: JWT auth uses user_id (email) instead of UUID id
    // Supabase profiles table expects UUID from auth.users
    // Since we're using JWT auth, we need to handle this differently
    // For now, try to find by email, but this may not work if email column doesn't exist
    try {
      const { data } = await supabase
        .from('profiles')
        .select('energy_points')
        .eq('email', user.user_id) // Try email first
        .maybeSingle();

      if (data) {
        setEnergyPoints(data.energy_points);
        return;
      }
    } catch (err) {
      // If email column doesn't exist or query fails, use default
      console.warn('Could not fetch energy points from Supabase:', err);
    }
    
    // Fallback: use default energy points if Supabase query fails
    setEnergyPoints(100);
  };

  useEffect(() => {
    if (user) {
      fetchEnergyPoints();
    }
  }, [user]);

  return { energyPoints, setEnergyPoints };
};

