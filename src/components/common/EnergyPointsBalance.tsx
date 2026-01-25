import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { getEnergyPointsBalance } from '../../lib/api/paymentApi';
import { clearAuthData } from '../../lib/api';
import { useState, useEffect, useRef } from 'react';

interface EnergyPointsBalanceProps {
  showLabel?: boolean;
  showLowWarning?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function EnergyPointsBalance({
  showLabel = true,
  showLowWarning = true,
  onClick,
  className,
}: EnergyPointsBalanceProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  // Initialize balance with user's energyPoints if available, so it shows immediately
  // Default to 0 instead of null to avoid showing "Loading..." when user exists
  const [balance, setBalance] = useState<number>(user?.energyPoints ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);

  const fetchBalance = async () => {
    if (!user || isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    try {
      setError(null);
      // Only show loading spinner if we haven't fetched yet and don't have initial balance
      // But since we show 0 as default, we typically won't show loading
      if (!hasFetchedRef.current && user.energyPoints === undefined) {
        setLoading(true);
      }
      
      const response = await getEnergyPointsBalance();
      if (response.success && response.data) {
        setBalance(response.data.energyPoints);
        hasFetchedRef.current = true;
      } else {
        // Fallback to user object energyPoints if available
        setBalance(user.energyPoints ?? 0);
        hasFetchedRef.current = true;
      }
    } catch (err: any) {
      // Handle "User not found" error specifically
      if (err.message?.includes('User account not found')) {
        console.warn('User account not found, clearing auth data');
        // Clear auth data and redirect to login if user account doesn't exist
        clearAuthData();
        setError('Session expired. Please log in again.');
        setBalance(0);
      } else {
        console.warn('Could not fetch energy points balance:', err);
        // Fallback to user object energyPoints if available, or keep current balance
        setBalance(user?.energyPoints ?? balance ?? 0);
        setError(null); // Don't show error, just use fallback value
      }
      hasFetchedRef.current = true; // Mark as fetched even on error to avoid retrying immediately
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  // Update balance immediately when user changes (e.g., after login)
  // This ensures energy points show immediately without waiting for API call
  useEffect(() => {
    if (!user) {
      setBalance(0);
      setLoading(false);
      hasFetchedRef.current = false;
      return;
    }

    // If user has energyPoints in the user object, use it immediately
    if (user.energyPoints !== undefined && user.energyPoints !== null) {
      setBalance(user.energyPoints);
      setLoading(false);
    } else {
      // User exists but no energyPoints - show 0 as default (don't show loading)
      setBalance(0);
      setLoading(false);
    }
  }, [user?.energyPoints, user]);

  // Fetch latest balance from API when user ID changes (e.g., after login)
  // This runs separately to ensure we always fetch fresh data
  useEffect(() => {
    if (user?.id) {
      // Reset fetch flag when user changes
      hasFetchedRef.current = false;
      // Fetch balance - this will update in background
      fetchBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/payment/purchase');
    }
  };

  const isLowBalance = balance < 50;
  const displayBalance = balance;

  const styles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.85rem',
    color: 'var(--text-primary)',
    fontWeight: 500,
    padding: '0.4rem 0.75rem',
    borderRadius: '9999px',
    backgroundColor: isLowBalance && showLowWarning ? '#fff3cd' : 'transparent',
    transition: 'all 0.2s ease-in-out',
    opacity: loading ? 0.6 : 1,
    ...(isLowBalance && showLowWarning
      ? {
          color: '#856404',
          border: '1px solid #ffc107',
        }
      : {}),
  };

  // Only show loading spinner if we're actively loading and haven't shown any balance yet
  // Otherwise, show the balance (even if 0) while fetching updates in background
  if (loading && !hasFetchedRef.current && user?.energyPoints === undefined) {
    return (
      <div style={{ ...styles, cursor: 'default' }}>
        <span>⚡</span>
        {showLabel && <span>Loading...</span>}
        {!showLabel && <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Loading...</span>}
      </div>
    );
  }

  return (
    <div style={styles} onClick={handleClick} className={className}>
      {!showLabel && <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{displayBalance.toLocaleString()} Points</span>}
      {showLabel && (
        <>
          <span style={{ fontSize: '1rem' }}>⚡</span>
          <span>
            {displayBalance} {showLabel ? 'Energy Points' : 'Points'}
          </span>
          {isLowBalance && showLowWarning && (
            <span style={{ fontSize: '0.7rem', marginLeft: '0.25rem' }}>(Low)</span>
          )}
        </>
      )}
    </div>
  );
}

export { EnergyPointsBalance };

