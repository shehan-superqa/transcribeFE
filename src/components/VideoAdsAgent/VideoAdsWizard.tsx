import { useState, useEffect } from 'react';
import OnboardingStep from './steps/OnboardingStep';
import StrategyStep from './steps/StrategyStep';
import ScriptStep from './steps/ScriptStep';
import BuilderStep from './steps/BuilderStep';
import PaymentStep from './steps/PaymentStep';
import GenerationStep from './steps/GenerationStep';
import DeliveryStep from './steps/DeliveryStep';
import { useAdGenerationPipeline } from '../../hooks/useAdGenerationPipeline';
import type {
  OnboardingData,
  AdStrategy,
  AdScript,
  AdConfiguration,
  AdResult,
} from '../../types/videoAds';
import './VideoAdsAgent.css';

type WizardStep =
  | 'onboarding'
  | 'strategy'
  | 'script'
  | 'builder'
  | 'payment'
  | 'generation'
  | 'delivery';

export default function VideoAdsWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>('onboarding');
  const [onboarding, setOnboarding] = useState<OnboardingData>({
    promotionType: 'product',
    platform: 'facebook',
    languages: ['en'],
    targetAudience: {},
  });
  const [strategy, setStrategy] = useState<AdStrategy | null>(null);
  const [script, setScript] = useState<AdScript | null>(null);
  const [configuration, setConfiguration] = useState<AdConfiguration | null>(null);
  const [result, setResult] = useState<AdResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { pipeline, startGeneration, reset } = useAdGenerationPipeline();

  // Save progress to localStorage
  useEffect(() => {
    const progress = {
      currentStep,
      onboarding,
      strategy,
      script,
    };
    localStorage.setItem('videoAdsProgress', JSON.stringify(progress));
  }, [currentStep, onboarding, strategy, script]);

  // Load progress from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('videoAdsProgress');
    if (saved) {
      try {
        const progress = JSON.parse(saved);
        if (progress.onboarding) setOnboarding(progress.onboarding);
        if (progress.strategy) setStrategy(progress.strategy);
        if (progress.script) setScript(progress.script);
        // Optionally restore step, but usually start fresh
      } catch (err) {
        console.error('Failed to load saved progress:', err);
      }
    }
  }, []);

  const handleOnboardingComplete = () => {
    setCurrentStep('strategy');
  };

  const handleStrategyGenerated = (generatedStrategy: AdStrategy) => {
    setStrategy(generatedStrategy);
    setCurrentStep('script');
  };

  const handleScriptGenerated = (generatedScript: AdScript) => {
    setScript(generatedScript);
    if (strategy) {
      setConfiguration({
        onboarding,
        strategy,
        script: generatedScript,
      });
    }
  };

  const handleBuilderComplete = () => {
    if (configuration) {
      setConfiguration(configuration); // Update with any changes
    }
    setCurrentStep('payment');
  };

  const handlePaymentComplete = async () => {
    if (!script || !configuration) {
      setError('Missing script or configuration');
      return;
    }

    setCurrentStep('generation');
    reset();
    await startGeneration(script, configuration);
  };

  const handleGenerationComplete = () => {
    if (!script || !configuration || !pipeline.finalVideoUrl) {
      setError('Generation incomplete');
      return;
    }

    const adResult: AdResult = {
      id: `ad-${Date.now()}`,
      videoUrl: pipeline.finalVideoUrl,
      script,
      configuration,
      createdAt: new Date().toISOString(),
    };

    setResult(adResult);
    setCurrentStep('delivery');
  };

  const handleGenerateVariation = () => {
    // Reset to script step to regenerate
    setScript(null);
    setCurrentStep('script');
  };

  const handleDuplicate = () => {
    // Reset to builder step
    setCurrentStep('builder');
  };

  return (
    <div className="video-ads-wizard">
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="wizard-content">
        {currentStep === 'onboarding' && (
          <OnboardingStep
            data={onboarding}
            onUpdate={(updates) => setOnboarding({ ...onboarding, ...updates })}
            onNext={handleOnboardingComplete}
          />
        )}

        {currentStep === 'strategy' && (
          <StrategyStep
            onboarding={onboarding}
            onStrategyGenerated={handleStrategyGenerated}
            onError={setError}
          />
        )}

        {currentStep === 'script' && strategy && (
          <ScriptStep
            onboarding={onboarding}
            strategy={strategy}
            onScriptGenerated={handleScriptGenerated}
            onError={setError}
            onNext={() => setCurrentStep('builder')}
          />
        )}

        {currentStep === 'builder' && script && strategy && configuration && (
          <BuilderStep
            script={script}
            strategy={strategy}
            configuration={configuration}
            onConfigurationUpdate={(updates) =>
              setConfiguration({ ...configuration, ...updates })
            }
            onNext={handleBuilderComplete}
          />
        )}

        {currentStep === 'payment' && (
          <PaymentStep onPaymentComplete={handlePaymentComplete} onError={setError} />
        )}

        {currentStep === 'generation' && (
          <GenerationStep pipeline={pipeline} onComplete={handleGenerationComplete} />
        )}

        {currentStep === 'delivery' && result && (
          <DeliveryStep
            result={result}
            onGenerateVariation={handleGenerateVariation}
            onDuplicate={handleDuplicate}
          />
        )}
      </div>
    </div>
  );
}

















