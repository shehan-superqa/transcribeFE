import { useState } from 'react';
import type { OnboardingData, PromotionType, Platform } from '../../../types/videoAds';
import './Steps.css';

interface OnboardingStepProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
}

export default function OnboardingStep({ data, onUpdate, onNext }: OnboardingStepProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const questions = [
    {
      id: 'promotionType',
      title: 'What are you promoting?',
      options: [
        { value: 'product', label: 'Product' },
        { value: 'service', label: 'Service' },
        { value: 'app', label: 'App' },
        { value: 'event', label: 'Event' },
      ],
    },
    {
      id: 'platform',
      title: 'Target platform?',
      options: [
        { value: 'facebook', label: 'Facebook / Instagram' },
        { value: 'tiktok', label: 'TikTok' },
        { value: 'youtube', label: 'YouTube' },
        { value: 'tv', label: 'TV / Other' },
      ],
    },
    {
      id: 'language',
      title: 'Language(s)?',
      type: 'text',
      placeholder: 'e.g., English, Spanish',
    },
    {
      id: 'targetAudience',
      title: 'Target audience?',
      type: 'audience',
    },
  ];

  const handleOptionSelect = (questionId: string, value: any) => {
    if (questionId === 'promotionType') {
      onUpdate({ promotionType: value as PromotionType });
    } else if (questionId === 'platform') {
      onUpdate({ platform: value as Platform });
    }
    
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      setTimeout(onNext, 300);
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const languages = e.target.value.split(',').map(l => l.trim()).filter(Boolean);
    onUpdate({ languages });
  };

  const handleAudienceSubmit = () => {
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      setTimeout(onNext, 300);
    }
  };

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="onboarding-step">
      <div className="step-progress">
        <div className="progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <div className="question-container">
        <h2 className="question-title">{currentQ.title}</h2>

        {currentQ.type === 'text' && currentQ.id === 'language' ? (
          <div className="text-input-container">
            <input
              type="text"
              className="text-input"
              placeholder={currentQ.placeholder}
              value={data.languages.join(', ')}
              onChange={handleLanguageChange}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAudienceSubmit();
                }
              }}
            />
            <button className="next-button" onClick={handleAudienceSubmit}>
              Continue
            </button>
          </div>
        ) : currentQ.type === 'audience' ? (
          <div className="audience-input-container">
            <div className="input-group">
              <label>Age Range (optional)</label>
              <div className="age-range-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={data.targetAudience.ageRange?.min || ''}
                  onChange={(e) =>
                    onUpdate({
                      targetAudience: {
                        ...data.targetAudience,
                        ageRange: {
                          min: parseInt(e.target.value) || undefined,
                          max: data.targetAudience.ageRange?.max,
                        },
                      },
                    })
                  }
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={data.targetAudience.ageRange?.max || ''}
                  onChange={(e) =>
                    onUpdate({
                      targetAudience: {
                        ...data.targetAudience,
                        ageRange: {
                          min: data.targetAudience.ageRange?.min,
                          max: parseInt(e.target.value) || undefined,
                        },
                      },
                    })
                  }
                />
              </div>
            </div>
            <div className="input-group">
              <label>Location (optional)</label>
              <input
                type="text"
                placeholder="e.g., United States"
                value={data.targetAudience.location || ''}
                onChange={(e) =>
                  onUpdate({
                    targetAudience: {
                      ...data.targetAudience,
                      location: e.target.value || undefined,
                    },
                  })
                }
              />
            </div>
            <button className="next-button" onClick={handleAudienceSubmit}>
              Continue
            </button>
          </div>
        ) : (
          <div className="options-grid">
            {currentQ.options?.map((option) => (
              <button
                key={option.value}
                className={`option-button ${
                  (currentQ.id === 'promotionType' && data.promotionType === option.value) ||
                  (currentQ.id === 'platform' && data.platform === option.value)
                  ? 'selected'
                  : ''
                }`}
                onClick={() => handleOptionSelect(currentQ.id, option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="step-navigation">
        {currentQuestion > 0 && (
          <button className="back-button" onClick={() => setCurrentQuestion(currentQuestion - 1)}>
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}



