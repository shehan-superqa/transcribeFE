import { useEffect, useState } from 'react';
import type { AdGenerationPipeline } from '../../../types/videoAds';
import './Steps.css';

interface GenerationStepProps {
  pipeline: AdGenerationPipeline;
  onComplete: () => void;
}

export default function GenerationStep({ pipeline, onComplete }: GenerationStepProps) {
  useEffect(() => {
    if (pipeline.status === 'completed' && pipeline.finalVideoUrl) {
      setTimeout(onComplete, 2000);
    }
  }, [pipeline.status, pipeline.finalVideoUrl]);

  const getStatusMessage = () => {
    switch (pipeline.status) {
      case 'generating-images':
        return 'Generating scene images...';
      case 'generating-videos':
        return 'Creating video clips...';
      case 'generating-voiceover':
        return 'Generating voiceover...';
      case 'assembling':
        return 'Assembling final video...';
      case 'completed':
        return 'Video generation completed!';
      case 'error':
        return 'Generation failed';
      default:
        return 'Starting generation...';
    }
  };

  return (
    <div className="generation-step">
      <div className="generation-container">
        <h2>Your ad is being generated...</h2>

        <div className="progress-section">
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${pipeline.progress}%` }} />
          </div>
          <p className="progress-text">{Math.round(pipeline.progress)}%</p>
        </div>

        <div className="status-message">
          <div className="spinner" />
          <p>{pipeline.message || getStatusMessage()}</p>
        </div>

        {pipeline.status === 'generating-images' && (
          <div className="pipeline-steps">
            <div className="pipeline-step active">
              <span className="step-icon">✓</span>
              <span>Generating scene images</span>
            </div>
            <div className="pipeline-step">
              <span className="step-icon">○</span>
              <span>Creating video clips</span>
            </div>
            <div className="pipeline-step">
              <span className="step-icon">○</span>
              <span>Generating voiceover</span>
            </div>
            <div className="pipeline-step">
              <span className="step-icon">○</span>
              <span>Assembling final video</span>
            </div>
          </div>
        )}

        {pipeline.status === 'generating-videos' && (
          <div className="pipeline-steps">
            <div className="pipeline-step completed">
              <span className="step-icon">✓</span>
              <span>Scene images generated</span>
            </div>
            <div className="pipeline-step active">
              <span className="step-icon">⟳</span>
              <span>Creating video clips</span>
            </div>
            <div className="pipeline-step">
              <span className="step-icon">○</span>
              <span>Generating voiceover</span>
            </div>
            <div className="pipeline-step">
              <span className="step-icon">○</span>
              <span>Assembling final video</span>
            </div>
          </div>
        )}

        {pipeline.status === 'generating-voiceover' && (
          <div className="pipeline-steps">
            <div className="pipeline-step completed">
              <span className="step-icon">✓</span>
              <span>Scene images generated</span>
            </div>
            <div className="pipeline-step completed">
              <span className="step-icon">✓</span>
              <span>Video clips created</span>
            </div>
            <div className="pipeline-step active">
              <span className="step-icon">⟳</span>
              <span>Generating voiceover</span>
            </div>
            <div className="pipeline-step">
              <span className="step-icon">○</span>
              <span>Assembling final video</span>
            </div>
          </div>
        )}

        {pipeline.status === 'assembling' && (
          <div className="pipeline-steps">
            <div className="pipeline-step completed">
              <span className="step-icon">✓</span>
              <span>Scene images generated</span>
            </div>
            <div className="pipeline-step completed">
              <span className="step-icon">✓</span>
              <span>Video clips created</span>
            </div>
            <div className="pipeline-step completed">
              <span className="step-icon">✓</span>
              <span>Voiceover generated</span>
            </div>
            <div className="pipeline-step active">
              <span className="step-icon">⟳</span>
              <span>Assembling final video</span>
            </div>
          </div>
        )}

        {pipeline.status === 'completed' && (
          <div className="pipeline-steps">
            <div className="pipeline-step completed">
              <span className="step-icon">✓</span>
              <span>Scene images generated</span>
            </div>
            <div className="pipeline-step completed">
              <span className="step-icon">✓</span>
              <span>Video clips created</span>
            </div>
            <div className="pipeline-step completed">
              <span className="step-icon">✓</span>
              <span>Voiceover generated</span>
            </div>
            <div className="pipeline-step completed">
              <span className="step-icon">✓</span>
              <span>Final video assembled</span>
            </div>
          </div>
        )}

        {pipeline.error && (
          <div className="error-message">
            <p>Error: {pipeline.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}











