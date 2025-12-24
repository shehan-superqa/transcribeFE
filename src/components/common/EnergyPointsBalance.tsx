import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { getEnergyPointsBalance } from '../../lib/api/paymentApi';
import { clearAuthData } from '../../lib/api';
import { useState, useEffect } from 'react';

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
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    if (!user) {
      setBalance(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await getEnergyPointsBalance();
      if (response.success && response.data) {
        setBalance(response.data.energyPoints);
      } else {
        // Fallback to user object energyPoints if available
        setBalance(user.energyPoints ?? 0);
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
        // Fallback to user object energyPoints if available
        setBalance(user.energyPoints ?? 0);
        setError('Failed to load balance');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/payment/purchase');
    }
  };

  const isLowBalance = balance !== null && balance < 50;
  const displayBalance = balance !== null ? balance : 0;

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
    ...(isLowBalance && showLowWarning
      ? {
          color: '#856404',
          border: '1px solid #ffc107',
        }
      : {}),
  };

  if (loading && balance === null) {
    return (
      <div style={{ ...styles, cursor: 'default', opacity: 0.6 }}>
        <span>⚡</span>
        {showLabel && <span>Loading...</span>}
      </div>
    );
  }

  if (error && balance === null) {
    return (
      <div style={{ ...styles, cursor: 'default', color: '#dc3545' }} onClick={fetchBalance}>
        <span>⚡</span>
        {showLabel && <span>Error</span>}
      </div>
    );
  }

  return (
    <div style={styles} onClick={handleClick} className={className}>
      <span style={{ fontSize: '1rem' }}>⚡</span>
      <span>
        {displayBalance} {showLabel ? 'Energy Points' : 'Points'}
      </span>
      {isLowBalance && showLowWarning && (
        <span style={{ fontSize: '0.7rem', marginLeft: '0.25rem' }}>(Low)</span>
      )}
    </div>
  );
}

export { EnergyPointsBalance };

