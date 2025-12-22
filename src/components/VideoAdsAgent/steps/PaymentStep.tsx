import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth';
import { getEnergyPointsBalance } from '../../../lib/api/paymentApi';
import { useAuthModal } from '../../../contexts/AuthModalContext';
import { checkAuthAndTriggerModal } from '../../../lib/authCheck';
import type { PaymentInfo } from '../../../types/videoAds';
import './Steps.css';

interface PaymentStepProps {
  onPaymentComplete: () => void;
  onError: (error: string) => void;
}

const AD_COST = 50; // Energy points cost per ad

export default function PaymentStep({ onPaymentComplete, onError }: PaymentStepProps) {
  const { user } = useAuth();
  const { openModal } = useAuthModal();
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      // Check authentication before proceeding
      const executeFetch = async () => {
        try {
          const response = await getEnergyPointsBalance();
          if (response.success && response.data) {
            const balance = response.data.energyPoints;
            setPaymentInfo({
              cost: AD_COST,
              userBalance: balance,
              canAfford: balance >= AD_COST,
            });
          } else {
            onError('Failed to fetch balance');
          }
        } catch (err: any) {
          // Check if this is an authentication error
          const errorMessage = err.message || err.response?.data?.message || '';
          const isAuthError = 
            errorMessage.includes('not authenticated') ||
            errorMessage.includes('Please log in') ||
            errorMessage.includes('Authentication failed') ||
            errorMessage.includes('Authentication required') ||
            err.response?.status === 401;

          if (isAuthError) {
            // Show auth modal - will retry fetch after successful auth
            // Use setTimeout to ensure modal appears
            setTimeout(() => {
              checkAuthAndTriggerModal(openModal, executeFetch);
            }, 100);
            return;
          }
          onError(err.message || 'Failed to fetch balance');
        } finally {
          setLoading(false);
        }
      };

      // Check auth first
      if (!checkAuthAndTriggerModal(openModal, executeFetch)) {
        // Auth modal was opened, stop here
        setLoading(false);
        return;
      }

      // User is authenticated, proceed with fetch
      executeFetch();
    };

    fetchBalance();
  }, [user, openModal, onError]);

  const handlePayment = async () => {
    if (!paymentInfo?.canAfford) {
      onError('Insufficient energy points. Please purchase more.');
      return;
    }

    // Check authentication before proceeding
    const executePayment = async () => {
      setProcessing(true);
      try {
        // TODO: Call backend API to consume energy points and initiate video generation
        // For now, simulate payment success
        setTimeout(() => {
          onPaymentComplete();
        }, 1000);
      } catch (err: any) {
        // Check if this is an authentication error
        const errorMessage = err.message || err.response?.data?.message || '';
        const isAuthError = 
          errorMessage.includes('not authenticated') ||
          errorMessage.includes('Please log in') ||
          errorMessage.includes('Authentication failed') ||
          errorMessage.includes('Authentication required') ||
          err.response?.status === 401;

        if (isAuthError) {
          // Show auth modal - will retry payment after successful auth
          // Use setTimeout to ensure modal appears
          setTimeout(() => {
            checkAuthAndTriggerModal(openModal, executePayment);
          }, 100);
          setProcessing(false);
          return;
        }
        onError(err.message || 'Payment failed');
        setProcessing(false);
      }
    };

    // Check auth before proceeding
    if (!checkAuthAndTriggerModal(openModal, executePayment)) {
      // Auth modal was opened, stop here
      return;
    }

    // User is authenticated, proceed with payment
    await executePayment();
  };

  if (loading) {
    return (
      <div className="payment-step">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading payment information...</p>
        </div>
      </div>
    );
  }

  if (!paymentInfo) {
    return (
      <div className="payment-step">
        <div className="error-container">
          <p>Failed to load payment information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-step">
      <div className="payment-container">
        <h2>Your ad is ready!</h2>
        <p className="payment-subtitle">Render your final video</p>

        <div className="payment-card">
          <div className="payment-value">
            <h3>What you'll get:</h3>
            <ul className="value-list">
              <li>✓ Final HD video ({paymentInfo.cost} energy points)</li>
              <li>✓ Multiple formats (MP4, WebM)</li>
              <li>✓ Subtitles file (.srt)</li>
              <li>✓ Download access</li>
              <li>✓ No watermark</li>
            </ul>
          </div>

          <div className="payment-balance">
            <div className="balance-info">
              <span>Your Balance:</span>
              <span className={`balance-amount ${paymentInfo.canAfford ? 'sufficient' : 'insufficient'}`}>
                {paymentInfo.userBalance} points
              </span>
            </div>
            <div className="cost-info">
              <span>Cost:</span>
              <span className="cost-amount">{paymentInfo.cost} points</span>
            </div>
          </div>

          {!paymentInfo.canAfford && (
            <div className="insufficient-balance">
              <p>You need {paymentInfo.cost - paymentInfo.userBalance} more energy points.</p>
              <a href="/pricing" className="purchase-link">
                Purchase Energy Points →
              </a>
            </div>
          )}

          <button
            className={`payment-button ${!paymentInfo.canAfford ? 'disabled' : ''}`}
            onClick={handlePayment}
            disabled={!paymentInfo.canAfford || processing}
          >
            {processing ? 'Processing...' : `Render Video (${paymentInfo.cost} points)`}
          </button>

          <p className="payment-note">30-second render • Cancel anytime</p>
        </div>
      </div>
    </div>
  );
}



