import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../lib/auth';
import { getUserJobs, getJobStatus } from '../../lib/api/jobsApi';
import { getLoRAsFromReplicate, type LoRAModel } from '../../lib/api/imageTrainingApi';
import type { ImageTrainingJob, Job } from '../../types/api';
import '../../pages/Dashboard.css';

interface TrainingHistoryProps {
  onTrainingJobClick?: (job: ImageTrainingJob) => void;
  onLoRAClick?: (loraUrl: string) => void;
}

export function TrainingHistory({ onTrainingJobClick, onLoRAClick }: TrainingHistoryProps) {
  const { user } = useAuth();
  const [trainingHistory, setTrainingHistory] = useState<ImageTrainingJob[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [loras, setLoras] = useState<LoRAModel[]>([]);
  const [lorasLoading, setLorasLoading] = useState(false);
  const [lorasError, setLorasError] = useState<string | null>(null);
  const [selectedTrainingJob, setSelectedTrainingJob] = useState<ImageTrainingJob | null>(null);
  const [selectedJobDetails, setSelectedJobDetails] = useState<any | null>(null);

  // Fetch LoRAs from Replicate
  useEffect(() => {
    const fetchLoRAs = async () => {
      if (!user) return;
      
      setLorasLoading(true);
      setLorasError(null);
      
      try {
        const response = await getLoRAsFromReplicate();
        if (response.success && response.loras) {
          // Sort by updated_at (newest first)
          const sortedLoras = [...response.loras].sort((a, b) => {
            const dateA = new Date(a.updated_at || a.created_at).getTime();
            const dateB = new Date(b.updated_at || b.created_at).getTime();
            return dateB - dateA;
          });
          setLoras(sortedLoras);
        } else {
          setLorasError(response.error || response.message || 'Failed to load LoRAs');
        }
      } catch (err: any) {
        console.error('Error fetching LoRAs:', err);
        setLorasError(err?.message || 'Failed to load LoRAs');
      } finally {
        setLorasLoading(false);
      }
    };

    fetchLoRAs();
  }, [user]);

  // Fetch training job history
  useEffect(() => {
    const fetchTrainingHistory = async () => {
      if (!user) return;
      
      setHistoryLoading(true);
      setHistoryError(null);
      
      try {
        const response = await getUserJobs(user.id);
        if (response.success && response.jobs) {
          // Filter for image training jobs only
          const trainingJobs = response.jobs.filter(
            (job: Job) => (job as any).job_type === 'image_training'
          ).map((job: Job) => job as unknown as ImageTrainingJob);
          
          // Sort by created_at (newest first)
          trainingJobs.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return dateB - dateA;
          });
          
          setTrainingHistory(trainingJobs);
        }
      } catch (err: any) {
        console.error('Error fetching training history:', err);
        setHistoryError(err?.message || 'Failed to load training history');
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchTrainingHistory();

    // Refresh periodically
    const refreshInterval = setInterval(fetchTrainingHistory, 30000); // Every 30 seconds
    return () => clearInterval(refreshInterval);
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "#4caf50";
      case "processing": case "starting": return "#ff9800";
      case "error": case "cancelled": return "#f44336";
      case "queued": return "#2196f3";
      default: return "#666666";
    }
  };

  const handleTrainingJobClick = async (job: ImageTrainingJob) => {
    const hasModel = !!job.trained_model;
    if (hasModel) {
      if (onTrainingJobClick) {
        onTrainingJobClick(job);
      }
      setSelectedTrainingJob(job);
      try {
        const response = await getJobStatus(job._id);
        if (response.job) {
          setSelectedJobDetails(response.job);
        }
      } catch (error) {
        console.error("Error fetching job details:", error);
      }
    }
  };

  const handleLoRAClick = (lora: LoRAModel) => {
    const loraUrl = lora.url || `${lora.owner}/${lora.name}`;
    if (onLoRAClick) {
      onLoRAClick(loraUrl);
    }
    navigator.clipboard.writeText(loraUrl);
  };

  return (
    <>
      <div className="history-container">
        <h2 className="history-title">My LoRAs</h2>
        <div className="history-content">
          {lorasLoading ? (
            <div className="loading-state">Loading LoRAs...</div>
          ) : lorasError ? (
            <div className="error-state">
              {lorasError && !lorasError.includes('Authentication failed') && !lorasError.includes('Authentication service unavailable') ? (
                <>Error: {lorasError}</>
              ) : (
                <p>Unable to load LoRAs. Please refresh the page or log in again.</p>
              )}
            </div>
          ) : loras.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text">No LoRAs found</p>
              <p className="empty-state-subtext">
                Train a model to create your first LoRA.
              </p>
            </div>
          ) : (
            <div className="transcriptions-grid">
              {loras.map((lora) => {
                const loraUrl = lora.url || `${lora.owner}/${lora.name}`;
                return (
                  <div
                    key={lora.id}
                    className="transcription-card"
                    onClick={() => handleLoRAClick(lora)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="transcription-header">
                      <div className="transcription-title">
                        <span className="transcription-icon">🎨</span>
                        <span className="transcription-name">
                          {lora.name}
                        </span>
                      </div>
                      <span
                        className="transcription-status"
                        style={{ 
                          color: lora.visibility === 'public' ? '#4caf50' : '#ff9800' 
                        }}
                      >
                        {lora.visibility}
                      </span>
                    </div>
                    {lora.description && (
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                        {lora.description.length > 60 
                          ? `${lora.description.substring(0, 60)}...` 
                          : lora.description}
                      </div>
                    )}
                    <div className="transcription-meta">
                      <span className="transcription-date">{formatDate(lora.updated_at || lora.created_at)}</span>
                      {lora.owner && <span className="meta-separator">• {lora.owner}</span>}
                    </div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#60a5fa' }}>
                      {loraUrl} - Click to copy
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="history-container" style={{ marginTop: '2rem' }}>
        <h2 className="history-title">Training History</h2>
        <div className="history-content">
          {historyLoading ? (
            <div className="loading-state">Loading training history...</div>
          ) : historyError ? (
            <div className="error-state">
              {historyError && !historyError.includes('Authentication failed') && !historyError.includes('Authentication service unavailable') ? (
                <>Error: {historyError}</>
              ) : (
                <p>Unable to load training history. Please refresh the page or log in again.</p>
              )}
            </div>
          ) : trainingHistory.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text">No training jobs yet</p>
              <p className="empty-state-subtext">
                Start training a model using the form on the left.
              </p>
            </div>
          ) : (
            <div className="transcriptions-grid">
              {trainingHistory.map((job) => {
                const hasModel = !!job.trained_model;
                const actualStatus = hasModel ? 'completed' : (job.status || 'unknown');
                return (
                  <div
                    key={job._id}
                    className="transcription-card"
                    onClick={() => hasModel && handleTrainingJobClick(job)}
                    style={{ 
                      ...(hasModel ? { cursor: 'pointer' } : { opacity: 0.7, cursor: 'default' })
                    }}
                  >
                    <div className="transcription-header">
                      <div className="transcription-title">
                        <span className="transcription-icon">🎓</span>
                        <span className="transcription-name">
                          {job.trigger_word}
                        </span>
                      </div>
                      <span
                        className="transcription-status"
                        style={{ color: getStatusColor(actualStatus) }}
                      >
                        {actualStatus}
                      </span>
                    </div>
                    <div className="transcription-meta">
                      <span className="transcription-date">{formatDate(job.created_at)}</span>
                      {job.lora_type && <span className="meta-separator">• {job.lora_type}</span>}
                      {job.image_urls && <span className="meta-separator">• {job.image_urls.length} images</span>}
                    </div>
                    {hasModel && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#4caf50' }}>
                        ✓ Model ready - Click to view
                      </div>
                    )}
                    {job.error && (
                      <div className="transcription-error">
                        <span style={{ color: '#f44336', fontSize: '0.875rem' }}>
                          Error: {job.error}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Training Job Detail Modal */}
      {selectedTrainingJob && (
        <div
          className="modal-overlay"
          onClick={() => {
            setSelectedTrainingJob(null);
            setSelectedJobDetails(null);
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">
                Training: {selectedTrainingJob.trigger_word}
              </h2>
              <button
                onClick={() => {
                  setSelectedTrainingJob(null);
                  setSelectedJobDetails(null);
                }}
                className="modal-close-button"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div className="modal-details">
              <div className="modal-detail-item">
                <span className="modal-detail-label">Status: </span>
                <span
                  className="modal-detail-value"
                  style={{ color: getStatusColor(selectedTrainingJob.status || 'unknown') }}
                >
                  {(selectedTrainingJob.trained_model ? 'completed' : selectedTrainingJob.status || 'unknown').toUpperCase()}
                </span>
              </div>
              {selectedTrainingJob.trained_model && (
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Trained Model: </span>
                  <span className="modal-detail-value">{selectedTrainingJob.trained_model}</span>
                </div>
              )}
              {selectedTrainingJob.lora_type && (
                <div className="modal-detail-item">
                  <span className="modal-detail-label">LoRA Type: </span>
                  <span className="modal-detail-value">{selectedTrainingJob.lora_type}</span>
                </div>
              )}
              {selectedTrainingJob.image_urls && (
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Images: </span>
                  <span className="modal-detail-value">{selectedTrainingJob.image_urls.length}</span>
                </div>
              )}
              {selectedJobDetails?.result?.processing_time && (
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Processing Time: </span>
                  <span className="modal-detail-value">
                    {selectedJobDetails.result.processing_time.formatted ||
                     `${Math.round(selectedJobDetails.result.processing_time.total_seconds)}s`}
                  </span>
                </div>
              )}
              <div className="modal-detail-item">
                <span className="modal-detail-label">Created: </span>
                <span className="modal-detail-value">{formatDate(selectedTrainingJob.created_at)}</span>
              </div>
              {selectedTrainingJob.error && (
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Error: </span>
                  <span className="modal-detail-value" style={{ color: '#f44336' }}>{selectedTrainingJob.error}</span>
                </div>
              )}
            </div>

            {selectedTrainingJob.trained_model && (
              <div>
                <h3 className="modal-section-title">Model ID</h3>
                <div className="modal-transcription-text">
                  {selectedTrainingJob.trained_model}
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedTrainingJob.trained_model!);
                    }}
                    className="modal-download-button"
                  >
                    Copy Model ID
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}





