import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth';
import { getEnergyPointsBalance } from '../../../lib/api/paymentApi';
import type { PaymentInfo } from '../../../types/videoAds';
import './Steps.css';

interface PaymentStepProps {
  onPaymentComplete: () => void;
  onError: (error: string) => void;
}

const AD_COST = 50; // Energy points cost per ad

export default function PaymentStep({ onPaymentComplete, onError }: PaymentStepProps) {
  const { user } = useAuth();
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!user) {
        onError('Please log in to continue');
        return;
      }

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
        onError(err.message || 'Failed to fetch balance');
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [user]);

  const handlePayment = async () => {
    if (!paymentInfo?.canAfford) {
      onError('Insufficient energy points. Please purchase more.');
      return;
    }

    setProcessing(true);
    try {
      // TODO: Call backend API to consume energy points and initiate video generation
      // For now, simulate payment success
      setTimeout(() => {
        onPaymentComplete();
      }, 1000);
    } catch (err: any) {
      onError(err.message || 'Payment failed');
      setProcessing(false);
    }
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


