import { useEffect } from 'react';
import { useAdStrategy } from '../../../hooks/useAdStrategy';
import type { OnboardingData } from '../../../types/videoAds';
import './Steps.css';

interface StrategyStepProps {
  onboarding: OnboardingData;
  onStrategyGenerated: (strategy: any) => void;
  onError: (error: string) => void;
}

export default function StrategyStep({ onboarding, onStrategyGenerated, onError }: StrategyStepProps) {
  const { strategy, loading, error, generateStrategy } = useAdStrategy();

  useEffect(() => {
    if (!strategy && !loading && !error) {
      generateStrategy(onboarding);
    }
  }, []);

  useEffect(() => {
    if (strategy) {
      onStrategyGenerated(strategy);
    }
  }, [strategy]);

  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error]);

  return (
    <div className="strategy-step">
      <div className="loading-container">
        <div className="spinner" />
        <h3>Analyzing audience...</h3>
        <p>Choosing best ad structure...</p>
        <p className="sub-text">Optimizing for {onboarding.platform}...</p>
      </div>
    </div>
  );
}















