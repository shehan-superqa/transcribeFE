import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { getUserJobs, getJobStatus } from '../../lib/api/jobsApi';
import type { ImageJob, Job } from '../../types/api';
import '../../css/pages/Dashboard.css';

export function ImageHistory() {
  const { user } = useAuth();
  const [imageHistory, setImageHistory] = useState<ImageJob[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedImageJob, setSelectedImageJob] = useState<ImageJob | null>(null);
  const [selectedJobDetails, setSelectedJobDetails] = useState<any | null>(null);

  // Fetch image job history
  useEffect(() => {
    const fetchImageHistory = async () => {
      if (!user) return;
      
      setHistoryLoading(true);
      setHistoryError(null);
      
      try {
        const response = await getUserJobs(user.id);
        if (response.success && response.jobs) {
          // Filter for image jobs only
          const imageJobs = response.jobs.filter(
            (job: Job) => (job as any).job_type === 'image'
          ).map((job: Job) => job as unknown as ImageJob);
          
          // Sort by created_at (newest first)
          imageJobs.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return dateB - dateA;
          });
          
          setImageHistory(imageJobs);
        }
      } catch (err: any) {
        console.error('Error fetching image history:', err);
        setHistoryError(err?.message || 'Failed to load image history');
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchImageHistory();
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
      case "completed":
        return "#4caf50";
      case "processing":
      case "starting":
        return "#ff9800";
      case "error":
      case "cancelled":
        return "#f44336";
      case "queued":
        return "#2196f3";
      default:
        return "#666666";
    }
  };

  const getImageUrls = (job: ImageJob): string[] => {
    return job.result?.image_urls || 
           (job.result?.image_url ? [job.result.image_url] : []) ||
           job.image_output_urls ||
           (job.image_output_url ? [job.image_output_url] : []);
  };

  const handleImageJobClick = async (job: ImageJob) => {
    const urls = getImageUrls(job);
    if (urls.length > 0) {
      setSelectedImageJob(job);
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

  return (
    <>
      <div className="history-container">
        <h2 className="history-title">Image History</h2>
        <div className="history-content">
          {historyLoading ? (
            <div className="loading-state">Loading image history...</div>
          ) : historyError ? (
            <div className="error-state">
              {historyError && !historyError.includes('Authentication failed') && !historyError.includes('Authentication service unavailable') ? (
                <>Error: {historyError}</>
              ) : (
                <p>Unable to load image history. Please refresh the page or log in again.</p>
              )}
            </div>
          ) : imageHistory.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text">No image generations yet</p>
              <p className="empty-state-subtext">
                Start generating images using the form on the left.
              </p>
            </div>
          ) : (
            <div className="transcriptions-grid">
              {imageHistory.map((job) => {
                const urls = getImageUrls(job);
                const hasImage = urls.length > 0;
                return (
                  <div
                    key={job._id}
                    className="transcription-card"
                    onClick={() => hasImage && handleImageJobClick(job)}
                    style={{
                      ...(hasImage ? {} : { opacity: 0.7, cursor: 'default' }),
                    }}
                  >
                    <div className="transcription-header">
                      <div className="transcription-title">
                        <span className="transcription-icon">🖼️</span>
                        <span className="transcription-name">
                          {job.prompt && job.prompt.length > 30 ? `${job.prompt.substring(0, 30)}...` : job.prompt || 'Image Generation'}
                        </span>
                      </div>
                      <span 
                        className="transcription-status"
                        style={{ color: getStatusColor(job.status) }}
                      >
                        {job.status}
                      </span>
                    </div>
                    <div className="transcription-meta">
                      {job.width && job.height && (
                        <>
                          <span>{job.width}x{job.height}</span>
                          <span className="meta-separator">•</span>
                        </>
                      )}
                      {job.result?.model && (
                        <>
                          <span>{job.result.model.split('/').pop()}</span>
                          <span className="meta-separator">•</span>
                        </>
                      )}
                      <span className="transcription-date">{formatDate(job.created_at)}</span>
                    </div>
                    {job.prompt && job.prompt.length > 100 && (
                      <div className="transcription-preview">
                        <p className="transcription-preview-text">
                          {job.prompt.length > 100 ? `${job.prompt.substring(0, 100)}...` : job.prompt}
                        </p>
                      </div>
                    )}
                    {hasImage && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#4caf50' }}>
                        ✓ Image available - Click to view
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

      {/* Image Detail Modal */}
      {selectedImageJob && (
        <div 
          className="modal-overlay"
          onClick={() => {
            setSelectedImageJob(null);
            setSelectedJobDetails(null);
          }}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '90vh' }}
          >
            <div className="modal-header">
              <h2 className="modal-title">
                {selectedImageJob.prompt && selectedImageJob.prompt.length > 50 
                  ? `${selectedImageJob.prompt.substring(0, 50)}...` 
                  : selectedImageJob.prompt || 'Generated Image'}
              </h2>
              <button 
                onClick={() => {
                  setSelectedImageJob(null);
                  setSelectedJobDetails(null);
                }}
                className="modal-close-button"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            
            <div className="modal-actions">
              {getImageUrls(selectedImageJob).map((url, index) => (
                <a
                  key={index}
                  href={url}
                  download={`image-${selectedImageJob._id}-${index + 1}.png`}
                  className="modal-download-button"
                  style={{ marginRight: '0.5rem' }}
                >
                  Download Image {getImageUrls(selectedImageJob).length > 1 ? index + 1 : ''}
                </a>
              ))}
            </div>
            
            <div className="modal-details">
              <div className="modal-detail-item">
                <span className="modal-detail-label">Status: </span>
                <span 
                  className="modal-detail-value"
                  style={{ color: getStatusColor(selectedImageJob.status) }}
                >
                  {selectedImageJob.status.toUpperCase()}
                </span>
              </div>
              {selectedImageJob.width && selectedImageJob.height && (
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Dimensions: </span>
                  <span className="modal-detail-value">{selectedImageJob.width}x{selectedImageJob.height}</span>
                </div>
              )}
              {selectedImageJob.result?.model && (
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Model: </span>
                  <span className="modal-detail-value">{selectedImageJob.result.model}</span>
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
                <span className="modal-detail-value">{formatDate(selectedImageJob.created_at)}</span>
              </div>
              {selectedImageJob.error && (
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Error: </span>
                  <span className="modal-detail-value" style={{ color: '#f44336' }}>{selectedImageJob.error}</span>
                </div>
              )}
            </div>

            {getImageUrls(selectedImageJob).length > 0 && (
              <div>
                <h3 className="modal-section-title">Generated Images</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                  {getImageUrls(selectedImageJob).map((url, index) => (
                    <div key={index} style={{ position: 'relative' }}>
                      <img 
                        src={url} 
                        alt={`Generated image ${index + 1}`}
                        style={{
                          width: '100%',
                          height: 'auto',
                          borderRadius: '8px',
                          maxHeight: '400px',
                          objectFit: 'contain',
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedImageJob.prompt && (
              <div>
                <h3 className="modal-section-title">Prompt</h3>
                <div className="modal-transcription-text">
                  {selectedImageJob.prompt}
                </div>
              </div>
            )}

            {selectedImageJob.negative_prompt && (
              <div>
                <h3 className="modal-section-title">Negative Prompt</h3>
                <div className="modal-transcription-text">
                  {selectedImageJob.negative_prompt}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}





