import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../lib/auth';
import { submitImageJob, getImageJobStatus } from '../../lib/api/imageApi';
import { useSSE } from '../../hooks/useSSE';
import { useTheme } from '../../contexts/ThemeContext';
import type { ImageJobRequest, ImageJobResult, LoRAModel } from '../../types/api';
import type { ImageJob } from '../../types/api';

interface ImageGenerationModeProps {
  loras: LoRAModel[];
  lorasLoading: boolean;
  lorasError: string | null;
  onGenerationComplete?: () => void;
}

const getStyles = () => ({
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.25rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  label: {
    fontWeight: 600,
    fontSize: '0.95rem',
    color: 'var(--text-primary)',
  },
  textarea: {
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    outline: 'none',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    resize: 'vertical' as const,
    minHeight: '120px',
  },
  input: {
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    outline: 'none',
    fontSize: '0.95rem',
  },
  select: {
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-primary)',
    backgroundColor: 'var(--bg-paper)',
    color: 'var(--text-primary)',
    outline: 'none',
    fontSize: '0.95rem',
    cursor: 'pointer',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    MozAppearance: 'none' as const,
  },
  advancedToggle: {
    background: 'transparent',
    border: 'none',
    color: 'var(--primary-color)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: '0.5rem 0',
    textAlign: 'left' as const,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  submitButton: {
    background: 'linear-gradient(90deg, var(--primary-color), var(--primary-hover))',
    color: 'var(--text-primary)',
    border: 'none',
    borderRadius: '0.75rem',
    padding: '0.875rem 1.5rem',
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    boxShadow: '0 4px 12px var(--shadow)',
  },
  submitButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  error: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#f44336',
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    fontSize: '0.9rem',
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    padding: '1rem',
    background: 'var(--bg-secondary)',
    borderRadius: '0.75rem',
  },
  progressBarContainer: {
    background: 'var(--bg-secondary)',
    borderRadius: '1rem',
    height: '0.5rem',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, var(--primary-color), var(--primary-hover))',
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  imagesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '1rem',
    marginTop: '1rem',
  },
  imageCard: {
    position: 'relative' as const,
    borderRadius: '0.75rem',
    overflow: 'hidden',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
  },
  image: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  downloadButton: {
    position: 'absolute' as const,
    top: '0.5rem',
    right: '0.5rem',
    background: 'rgba(0, 0, 0, 0.7)',
    color: 'var(--text-primary)',
    border: 'none',
    borderRadius: '0.5rem',
    padding: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.75rem',
  },
  infoBox: {
    padding: '0.75rem 1rem',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--primary-color)',
    borderRadius: '0.75rem',
    fontSize: '0.85rem',
    color: 'var(--primary-color)',
    marginBottom: '0.5rem',
  },
});

export default function ImageGenerationMode({ loras, lorasLoading, lorasError, onGenerationComplete }: ImageGenerationModeProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = getStyles();
  const [selectedLora, setSelectedLora] = useState<LoRAModel | null>(null);
  const [customModel, setCustomModel] = useState('');
  const [useCustomModel, setUseCustomModel] = useState(false);
  const [triggerWord, setTriggerWord] = useState('');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [numOutputs, setNumOutputs] = useState(1);
  const [guidanceScale, setGuidanceScale] = useState(3.5);
  const [numInferenceSteps, setNumInferenceSteps] = useState(28);
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [usePolling, setUsePolling] = useState(false);
  const [pollingProgress, setPollingProgress] = useState<number>(0);
  const [pollingStatus, setPollingStatus] = useState<string>('');
  const [pollingMessage, setPollingMessage] = useState<string>('');

  // Use SSE hook for progress tracking
  const { progress, status, message, result, error: sseError, isConnected } = useSSE(jobId);

  // Auto-populate trigger word when LoRA is selected
  useEffect(() => {
    if (selectedLora && !useCustomModel) {
      // Try to extract trigger word from LoRA name or description
      const loraName = selectedLora.name.toLowerCase();
      // Remove common suffixes like "-lora"
      const trigger = loraName.replace(/-lora$/, '').replace(/[^a-z0-9]+/g, '');
      if (trigger) {
        setTriggerWord(trigger);
      }
    }
  }, [selectedLora, useCustomModel]);

  const startPolling = useCallback(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const response = await getImageJobStatus(jobId!);
        if (response.success && response.job) {
          const jobStatus = response.job.status;
          setPollingStatus(jobStatus);
          
          // Extract progress from various possible locations
          let extractedProgress = 0;
          let extractedMessage = '';
          
          // Check replicate_data for progress
          const replicateData = (response.job as any).replicate_data;
          if (replicateData) {
            if (typeof replicateData.progress === 'number') {
              extractedProgress = Math.min(Math.max(replicateData.progress * 100, 0), 100);
            }
            if (replicateData.status) {
              extractedMessage = replicateData.status;
            }
          }
          
          // Estimate progress based on status if no explicit progress
          if (!extractedProgress) {
            switch (jobStatus) {
              case 'queued':
                extractedProgress = 5;
                extractedMessage = extractedMessage || 'Job queued...';
                break;
              case 'processing':
              case 'starting':
                extractedProgress = 50;
                extractedMessage = extractedMessage || 'Generating image...';
                break;
              case 'completed':
                extractedProgress = 100;
                extractedMessage = extractedMessage || 'Generation completed!';
                break;
              default:
                extractedProgress = 0;
            }
          }
          
          setPollingProgress(extractedProgress);
          setPollingMessage(extractedMessage);
          
          if (jobStatus === 'completed' && response.job.result) {
            const jobResult = response.job.result as ImageJobResult;
            if (jobResult.image_urls && jobResult.image_urls.length > 0) {
              setImageUrls(jobResult.image_urls);
            } else if (jobResult.image_url) {
              setImageUrls([jobResult.image_url]);
            }
            setLoading(false);
            setPollingProgress(100);
            setPollingMessage('Generation completed!');
            setPollingInterval((prev) => {
              if (prev) {
                clearInterval(prev);
              }
              return null;
            });
            // Refresh gallery history
            if (onGenerationComplete) {
              setTimeout(() => onGenerationComplete(), 1000);
            }
          } else if (jobStatus === 'error') {
            setError(response.job.error || 'Image generation failed');
            setLoading(false);
            setPollingInterval((prev) => {
              if (prev) {
                clearInterval(prev);
              }
              return null;
            });
          }
        }
      } catch (err: any) {
        console.error('Polling error:', err);
      }
    };

    poll(); // Poll immediately
    const interval = setInterval(poll, 5000); // Poll every 5 seconds
    setPollingInterval(interval);
  }, [jobId, onGenerationComplete]);

  // Fallback to polling if SSE fails
  useEffect(() => {
    if (jobId && !isConnected && !usePolling && status !== 'completed' && status !== 'error') {
      setUsePolling(true);
      startPolling();
    }
  }, [jobId, isConnected, usePolling, status, startPolling]);

  // Handle SSE result
  useEffect(() => {
    if (result && 'image_urls' in result) {
      const imageResult = result as ImageJobResult;
      if (imageResult.image_urls && imageResult.image_urls.length > 0) {
        setImageUrls(imageResult.image_urls);
        setLoading(false);
        setPollingInterval((prev) => {
          if (prev) {
            clearInterval(prev);
          }
          return null;
        });
        // Refresh gallery history
        if (onGenerationComplete) {
          setTimeout(() => onGenerationComplete(), 1000);
        }
      } else if (imageResult.image_url) {
        setImageUrls([imageResult.image_url]);
        setLoading(false);
        setPollingInterval((prev) => {
          if (prev) {
            clearInterval(prev);
          }
          return null;
        });
        // Refresh gallery history
        if (onGenerationComplete) {
          setTimeout(() => onGenerationComplete(), 1000);
        }
      }
    }
  }, [result, onGenerationComplete]);

  // Handle SSE errors
  useEffect(() => {
    if (sseError) {
      setError(sseError);
      if (!usePolling) {
        setUsePolling(true);
        startPolling();
      }
    }
  }, [sseError, usePolling, startPolling]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setImageUrls([]);
    setLoading(true);
    setJobId(null);
    setUsePolling(false);
    setPollingProgress(0);
    setPollingStatus('');
    setPollingMessage('');

    if (!prompt.trim()) {
      setError('Please enter a prompt');
      setLoading(false);
      return;
    }

    // Determine model to use
    let modelToUse: string | undefined;
    if (useCustomModel && customModel.trim()) {
      modelToUse = customModel.trim() as any;
    } else if (selectedLora) {
      // Use the full LoRA URL with version if available, otherwise just owner/name
      const loraUrl = selectedLora.url || `${selectedLora.owner}/${selectedLora.name}`;
      modelToUse = loraUrl as any;
    }

    if (!modelToUse) {
      setError('Please select a LoRA model or enter a custom model URL');
      setLoading(false);
      return;
    }

    // Combine trigger word with prompt
    const fullPrompt = triggerWord.trim() 
      ? `${triggerWord.trim()} ${prompt.trim()}`
      : prompt.trim();

    const request: ImageJobRequest = {
      prompt: fullPrompt,
      negative_prompt: negativePrompt.trim() || undefined,
      width,
      height,
      num_outputs: numOutputs,
      guidance_scale: guidanceScale,
      num_inference_steps: numInferenceSteps,
      seed: seed || undefined,
      // Note: model field accepts LoRA URLs as strings, backend will handle it
      model: modelToUse as any,
    };

    try {
      const response = await submitImageJob(request);
      if (response.success && response.job_id) {
        setJobId(response.job_id);
        setPollingProgress(5);
        setPollingStatus('queued');
        setPollingMessage('Job submitted, starting...');
        setTimeout(() => {
          if (!isConnected) {
            startPolling();
          }
        }, 1000);
      } else {
        setError('Failed to submit image generation job');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit image generation job');
      setLoading(false);
    }
  };

  const handleDownload = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `image-${jobId || 'output'}-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Use polling progress/status if SSE is not connected, otherwise use SSE data
  const currentStatus = loading ? (isConnected ? status : pollingStatus || 'queued') : '';
  const displayProgress = isConnected ? (progress || 0) : (pollingProgress || 0);
  const displayMessage = isConnected 
    ? (message || (currentStatus === 'queued' ? 'Job queued...' : currentStatus === 'processing' ? 'Generating image...' : ''))
    : (pollingMessage || (currentStatus === 'queued' ? 'Job queued...' : currentStatus === 'processing' ? 'Generating image...' : currentStatus === 'starting' ? 'Starting image generation...' : ''));

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.infoBox}>
        <strong>Generation Guide:</strong> Select a trained LoRA model, enter your prompt, and the trigger word will be automatically included. Adjust parameters for best results.
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>
          LoRA Model <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
          <input
            type="checkbox"
            checked={useCustomModel}
            onChange={(e) => {
              setUseCustomModel(e.target.checked);
              if (e.target.checked) {
                setSelectedLora(null);
              }
            }}
            style={{ cursor: 'pointer' }}
            disabled={loading}
          />
          <label style={{ fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
            Use custom model URL
          </label>
        </div>
        {useCustomModel ? (
          <input
            type="text"
            value={customModel}
            onChange={(e) => setCustomModel(e.target.value)}
            placeholder="owner/model-name or full URL"
            style={styles.input}
            disabled={loading}
            required
          />
        ) : (
          <select
            value={selectedLora?.id || ''}
            onChange={(e) => {
              const lora = loras.find(l => l.id === e.target.value);
              setSelectedLora(lora || null);
            }}
            style={styles.select}
            disabled={loading || lorasLoading || loras.length === 0}
            required
          >
            <option value="">Select a LoRA model...</option>
            {loras.map((lora) => (
              <option key={lora.id} value={lora.id}>
                {lora.name} ({lora.owner})
              </option>
            ))}
          </select>
        )}
        {lorasLoading && (
          <small style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Loading LoRAs...</small>
        )}
        {lorasError && (
          <small style={{ fontSize: '0.75rem', color: '#f44336' }}>{lorasError}</small>
        )}
        {selectedLora && !useCustomModel && (
          <small style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Model: {selectedLora.url || `${selectedLora.owner}/${selectedLora.name}`}
          </small>
        )}
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>
          Trigger Word
        </label>
        <input
          type="text"
          value={triggerWord}
          onChange={(e) => setTriggerWord(e.target.value)}
          placeholder="Auto-populated from LoRA name"
          style={styles.input}
          disabled={loading}
        />
        <small style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
          This will be automatically prepended to your prompt. You can override it here.
        </small>
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>
          Prompt <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to generate..."
          style={styles.textarea}
          disabled={loading}
          required
        />
        <small style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
          Full prompt will be: "{triggerWord.trim() ? `${triggerWord.trim()} ` : ''}{prompt}"
        </small>
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>Negative Prompt</label>
        <textarea
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          placeholder="What you don't want in the image..."
          style={{ ...styles.textarea, minHeight: '80px' }}
          disabled={loading}
        />
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Progress */}
      {(currentStatus || (loading && jobId)) && (
        <div style={styles.progressContainer}>
          <div style={styles.progressText}>
            {displayMessage || 'Processing...'}
            <span> ({Math.round(displayProgress)}%)</span>
          </div>
          <div style={styles.progressBarContainer}>
            <div style={{ ...styles.progressBar, width: `${Math.max(displayProgress, 5)}%` }} />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        style={styles.advancedToggle}
      >
        {showAdvanced ? '▼' : '▶'} Advanced Options
      </button>

      {showAdvanced && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '0.75rem', marginTop: '0.5rem' }}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Width</label>
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(parseInt(e.target.value) || 1024)}
              min={256}
              max={2048}
              step={64}
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Height</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(parseInt(e.target.value) || 1024)}
              min={256}
              max={2048}
              step={64}
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Number of Outputs</label>
            <input
              type="number"
              value={numOutputs}
              onChange={(e) => setNumOutputs(parseInt(e.target.value) || 1)}
              min={1}
              max={4}
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Guidance Scale</label>
            <input
              type="number"
              value={guidanceScale}
              onChange={(e) => setGuidanceScale(parseFloat(e.target.value) || 3.5)}
              min={1}
              max={20}
              step={0.5}
              style={styles.input}
              disabled={loading}
            />
            <small style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Higher values make the model follow the prompt more closely
            </small>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Inference Steps</label>
            <input
              type="number"
              value={numInferenceSteps}
              onChange={(e) => setNumInferenceSteps(parseInt(e.target.value) || 28)}
              min={1}
              max={100}
              style={styles.input}
              disabled={loading}
            />
            <small style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              More steps = higher quality but slower generation
            </small>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Seed (Optional)</label>
            <input
              type="number"
              value={seed || ''}
              onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Random"
              style={styles.input}
              disabled={loading}
            />
            <small style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Use the same seed to reproduce results
            </small>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !user || (!selectedLora && !useCustomModel) || !prompt.trim()}
        style={{
          ...styles.submitButton,
          ...(loading || !user || (!selectedLora && !useCustomModel) || !prompt.trim() ? styles.submitButtonDisabled : {}),
        }}
      >
        {loading ? 'Generating...' : 'Generate Images'}
      </button>

      {!user && (
        <p style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '0.9rem' }}>
          Please <a href="/auth/login" style={{ color: '#60a5fa' }}>sign in</a> to generate images
        </p>
      )}

      {/* Generated Images */}
      {imageUrls.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', marginBottom: '1rem' }}>Generated Images</h3>
          <div style={styles.imagesGrid}>
            {imageUrls.map((url, index) => (
              <div key={index} style={styles.imageCard}>
                <img src={url} alt={`Generated ${index + 1}`} style={styles.image} />
                <button
                  onClick={() => handleDownload(url, index)}
                  style={styles.downloadButton}
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}

