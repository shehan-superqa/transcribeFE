import { useState } from 'react';
import type { AdScript, AdStrategy, AdConfiguration } from '../../../types/videoAds';
import SceneCard from '../SceneCard';
import './Steps.css';

interface BuilderStepProps {
  script: AdScript;
  strategy: AdStrategy;
  configuration: AdConfiguration;
  onConfigurationUpdate: (updates: Partial<AdConfiguration>) => void;
  onNext: () => void;
}

export default function BuilderStep({
  script,
  strategy,
  configuration,
  onConfigurationUpdate,
  onNext,
}: BuilderStepProps) {
  const [selectedTone, setSelectedTone] = useState(strategy.tone);

  const tones: Array<{ value: string; label: string }> = [
    { value: 'emotional', label: 'Emotional' },
    { value: 'trust-based', label: 'Trust-Based' },
    { value: 'high-energy', label: 'High-Energy' },
    { value: 'luxury', label: 'Luxury' },
    { value: 'informative', label: 'Informative' },
    { value: 'bold', label: 'Bold' },
  ];

  const handleToneChange = (tone: string) => {
    setSelectedTone(tone);
    onConfigurationUpdate({ strategy: { ...strategy, tone: tone as any } });
  };

  return (
    <div className="builder-step">
      <div className="builder-container">
        <div className="builder-left-panel">
          <h2>Creative Controls</h2>

          <div className="control-group">
            <label>Tone</label>
            <div className="tone-selector">
              {tones.map((tone) => (
                <button
                  key={tone.value}
                  className={`tone-button ${selectedTone === tone.value ? 'active' : ''}`}
                  onClick={() => handleToneChange(tone.value)}
                >
                  {tone.label}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <label>Platform</label>
            <select
              value={configuration.onboarding.platform}
              onChange={(e) =>
                onConfigurationUpdate({
                  onboarding: {
                    ...configuration.onboarding,
                    platform: e.target.value as any,
                  },
                })
              }
              className="platform-select"
            >
              <option value="facebook">Facebook / Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
              <option value="tv">TV / Other</option>
            </select>
          </div>

          <div className="control-group">
            <label>Duration</label>
            <select
              value={strategy.adLength}
              onChange={(e) =>
                onConfigurationUpdate({
                  strategy: { ...strategy, adLength: parseInt(e.target.value) as any },
                })
              }
              className="duration-select"
            >
              <option value="6">6 seconds</option>
              <option value="15">15 seconds</option>
              <option value="30">30 seconds</option>
            </select>
          </div>

          <div className="script-preview">
            <h3>Script Preview</h3>
            <div className="script-text-preview">
              {script.scenes.map((scene, index) => (
                <div key={scene.id} className="script-line">
                  <span className="scene-number">{index + 1}</span>
                  <span className="scene-text">{scene.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="builder-right-panel">
          <h2>Scene Breakdown</h2>
          <p className="preview-subtitle">This is how your ad will look</p>

          <div className="scenes-preview">
            {script.scenes.map((scene, index) => (
              <SceneCard
                key={scene.id}
                scene={scene}
                index={index}
                strategy={strategy}
                totalScenes={script.scenes.length}
              />
            ))}
          </div>

          <div className="builder-actions">
            <button className="proceed-button" onClick={onNext}>
              Your ad is ready! Continue →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
















