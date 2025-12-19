import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { getUserJobs, getJobStatus } from '../../lib/api/jobsApi';
import type { ImageEditJob, Job } from '../../types/api';
import '../../pages/Dashboard.css';

export function EditHistory() {
  const { user } = useAuth();
  const [editHistory, setEditHistory] = useState<ImageEditJob[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedEditJob, setSelectedEditJob] = useState<ImageEditJob | null>(null);
  const [selectedJobDetails, setSelectedJobDetails] = useState<any | null>(null);

  // Fetch edit history
  useEffect(() => {
    const fetchEditHistory = async () => {
      if (!user) return;
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const response = await getUserJobs(user.id);
        if (response.success && response.jobs) {
          const editJobs = response.jobs.filter(
            (job: Job) => (job as any).job_type === 'image_edit'
          ).map((job: Job) => job as unknown as ImageEditJob);
          
          editJobs.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return dateB - dateA;
          });
          
          setEditHistory(editJobs);
        }
      } catch (err: any) {
        console.error('Error fetching edit history:', err);
        setHistoryError(err?.message || 'Failed to load edit history');
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchEditHistory();
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

  const handleEditJobClick = async (job: ImageEditJob) => {
    const hasImage = !!(job.result?.image_url || job.image_output_url);
    if (hasImage) {
      setSelectedEditJob(job);
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

  const handleDownloadImageFile = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="history-container">
        <h2 className="history-title">Edit History</h2>
        <div className="history-content">
          {historyLoading ? (
            <div className="loading-state">Loading edit history...</div>
          ) : historyError ? (
            <div className="error-state">
              {historyError && !historyError.includes('Authentication failed') && !historyError.includes('Authentication service unavailable') ? (
                <>Error: {historyError}</>
              ) : (
                <p>Unable to load edit history. Please refresh the page or log in again.</p>
              )}
            </div>
          ) : editHistory.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text">No edit history yet</p>
              <p className="empty-state-subtext">
                Start editing images using the form on the left.
              </p>
            </div>
          ) : (
            <div className="transcriptions-grid">
              {editHistory.map((job) => {
                const hasImage = !!(job.result?.image_url || job.image_output_url);
                return (
                  <div
                    key={job._id}
                    className="transcription-card"
                    onClick={() => hasImage && handleEditJobClick(job)}
                    style={{ ...(hasImage ? {} : { opacity: 0.7, cursor: 'default' }) }}
                  >
                    <div className="transcription-header">
                      <div className="transcription-title">
                        <span className="transcription-icon">✏️</span>
                        <span className="transcription-name">
                          {job.prompt.length > 30 ? `${job.prompt.substring(0, 30)}...` : job.prompt}
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
                      <span className="transcription-date">{formatDate(job.created_at)}</span>
                    </div>
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

      {/* Edit Detail Modal */}
      {selectedEditJob && (
        <div
          className="modal-overlay"
          onClick={() => {
            setSelectedEditJob(null);
            setSelectedJobDetails(null);
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">
                {selectedEditJob.prompt.length > 50 ? `${selectedEditJob.prompt.substring(0, 50)}...` : selectedEditJob.prompt}
              </h2>
              <button
                onClick={() => {
                  setSelectedEditJob(null);
                  setSelectedJobDetails(null);
                }}
                className="modal-close-button"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div className="modal-actions">
              {(selectedEditJob.result?.image_url || selectedEditJob.image_output_url) && (
                <button
                  onClick={() => handleDownloadImageFile(
                    selectedEditJob.result?.image_url || selectedEditJob.image_output_url!,
                    `edited-image-${selectedEditJob._id || 'output'}.png`
                  )}
                  className="modal-download-button"
                >
                  Download Edited Image
                </button>
              )}
            </div>

            <div className="modal-details">
              <div className="modal-detail-item">
                <span className="modal-detail-label">Status: </span>
                <span
                  className="modal-detail-value"
                  style={{ color: getStatusColor(selectedEditJob.status) }}
                >
                  {selectedEditJob.status.toUpperCase()}
                </span>
              </div>
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
                <span className="modal-detail-value">{formatDate(selectedEditJob.created_at)}</span>
              </div>
              {selectedEditJob.error && (
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Error: </span>
                  <span className="modal-detail-value" style={{ color: '#f44336' }}>{selectedEditJob.error}</span>
                </div>
              )}
            </div>

            {(selectedEditJob.result?.image_url || selectedEditJob.image_output_url) && (
              <div>
                <h3 className="modal-section-title">Edited Image</h3>
                <div style={{ marginTop: '1rem' }}>
                  <img
                    src={selectedEditJob.result?.image_url || selectedEditJob.image_output_url}
                    alt="Edited"
                    style={{
                      width: '100%',
                      height: 'auto',
                      borderRadius: '8px',
                      maxHeight: '400px',
                      objectFit: 'contain',
                    }}
                  />
                </div>
              </div>
            )}

            {selectedEditJob.original_image_url && (
              <div>
                <h3 className="modal-section-title">Original Image</h3>
                <div style={{ marginTop: '1rem' }}>
                  <img
                    src={selectedEditJob.original_image_url}
                    alt="Original"
                    style={{
                      width: '100%',
                      height: 'auto',
                      borderRadius: '8px',
                      maxHeight: '400px',
                      objectFit: 'contain',
                    }}
                  />
                </div>
              </div>
            )}

            {selectedEditJob.prompt && (
              <div>
                <h3 className="modal-section-title">Prompt</h3>
                <div className="modal-transcription-text">
                  {selectedEditJob.prompt}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

