import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { getUserJobs } from '../../lib/api/jobsApi';
import type { VideoDubJob, Job } from '../../types/api';
import VideoDubberTool from '../VideoDubberTool/VideoDubberTool';
import '../../css/pages/Dashboard.css';

export default function VideoDubberTab() {
  return <VideoDubberTool />;
}

// Export DubHistory as a separate component
export function DubHistory() {
  const { user } = useAuth();
  const [dubHistory, setDubHistory] = useState<VideoDubJob[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedDubJob, setSelectedDubJob] = useState<VideoDubJob | null>(null);
  const [selectedJobDetails, setSelectedJobDetails] = useState<any | null>(null);

  // Fetch video dubbing history
  useEffect(() => {
    const fetchDubHistory = async () => {
      if (!user) return;
      
      setHistoryLoading(true);
      setHistoryError(null);
      
      try {
        const response = await getUserJobs(user.id);
        if (response.success && response.jobs) {
          // Filter for video dubbing jobs only
          const dubJobs = response.jobs.filter(
            (job: Job) => (job as any).job_type === 'video_dub'
          ).map((job: Job) => job as unknown as VideoDubJob);
          
          // Sort by created_at (newest first)
          dubJobs.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return dateB - dateA;
          });
          
          setDubHistory(dubJobs);
        }
      } catch (err: any) {
        console.error('Error fetching dubbing history:', err);
        setHistoryError(err?.message || 'Failed to load dubbing history');
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchDubHistory();
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

  const handleDubJobClick = async (job: VideoDubJob) => {
    const hasVideo = !!(job.video_output_url || 
                       (job.result as any)?.dubbed_video_url ||
                       (job.result as any)?.output_video_url ||
                       job.result?.video_url);
    
    if (hasVideo) {
      setSelectedDubJob(job);
      // Fetch full job details
      try {
        const { getJobStatus } = await import('../../lib/api/jobsApi');
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
        <h2 className="history-title">Dubbing History</h2>
        <div className="history-content">
          {historyLoading ? (
            <div className="loading-state">
              Loading dubbing history...
            </div>
          ) : historyError ? (
            <div className="error-state">
              {historyError && !historyError.includes('Authentication failed') && !historyError.includes('Authentication service unavailable') ? (
                <>Error: {historyError}</>
              ) : (
                <p>Unable to load dubbing history. Please refresh the page or log in again.</p>
              )}
            </div>
          ) : dubHistory.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text">No dubbing history yet</p>
              <p className="empty-state-subtext">
                Start dubbing videos using the form on the left.
              </p>
            </div>
          ) : (
            <div className="transcriptions-grid">
              {dubHistory.map((job) => {
                const hasVideo = !!(job.video_output_url || 
                                   (job.result as any)?.dubbed_video_url ||
                                   (job.result as any)?.output_video_url ||
                                   job.result?.video_url);
                return (
                  <div
                    key={job._id}
                    className="transcription-card"
                    onClick={() => hasVideo && handleDubJobClick(job)}
                    style={{
                      ...(hasVideo ? {} : { opacity: 0.7, cursor: 'default' }),
                    }}
                  >
                    <div className="transcription-header">
                      <div className="transcription-title">
                        <span className="transcription-icon">🎬</span>
                        <span className="transcription-name">
                          {job.output_language || 'Unknown Language'}
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
                      {job.video && (
                        <>
                          <span>Video: {job.video.length > 20 ? `${job.video.substring(0, 20)}...` : job.video}</span>
                          <span className="meta-separator">•</span>
                        </>
                      )}
                      <span className="transcription-date">{formatDate(job.created_at)}</span>
                    </div>
                    {hasVideo && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#4caf50' }}>
                        ✓ Video available - Click to view
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

      {/* Dubbing Detail Modal */}
      {selectedDubJob && (
        <div 
          className="modal-overlay"
          onClick={() => {
            setSelectedDubJob(null);
            setSelectedJobDetails(null);
          }}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">
                {selectedDubJob.output_language || 'Dubbed Video'}
              </h2>
              <button 
                onClick={() => {
                  setSelectedDubJob(null);
                  setSelectedJobDetails(null);
                }}
                className="modal-close-button"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            
            <div className="modal-actions">
              {(selectedDubJob.video_output_url || 
                (selectedDubJob.result as any)?.dubbed_video_url ||
                (selectedDubJob.result as any)?.output_video_url ||
                selectedDubJob.result?.video_url) && (
                <a
                  href={selectedDubJob.video_output_url || 
                       (selectedDubJob.result as any)?.dubbed_video_url ||
                       (selectedDubJob.result as any)?.output_video_url ||
                       selectedDubJob.result?.video_url || '#'}
                  download={`dubbed_video_${selectedDubJob._id}.mp4`}
                  className="modal-download-button"
                >
                  Download Dubbed Video
                </a>
              )}
            </div>
            
            <div className="modal-details">
              <div className="modal-detail-item">
                <span className="modal-detail-label">Status: </span>
                <span 
                  className="modal-detail-value"
                  style={{ color: getStatusColor(selectedDubJob.status) }}
                >
                  {selectedDubJob.status.toUpperCase()}
                </span>
              </div>
              {selectedDubJob.output_language && (
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Output Language: </span>
                  <span className="modal-detail-value">{selectedDubJob.output_language}</span>
                </div>
              )}
              {selectedDubJob.video && (
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Source Video: </span>
                  <span className="modal-detail-value">
                    {selectedDubJob.video.length > 50 
                      ? `${selectedDubJob.video.substring(0, 50)}...` 
                      : selectedDubJob.video}
                  </span>
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
                <span className="modal-detail-value">{formatDate(selectedDubJob.created_at)}</span>
              </div>
              {selectedDubJob.error && (
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Error: </span>
                  <span className="modal-detail-value" style={{ color: '#f44336' }}>{selectedDubJob.error}</span>
                </div>
              )}
            </div>

            {(selectedDubJob.video_output_url || 
              (selectedDubJob.result as any)?.dubbed_video_url ||
              (selectedDubJob.result as any)?.output_video_url ||
              selectedDubJob.result?.video_url) && (
              <div>
                <h3 className="modal-section-title">Dubbed Video</h3>
                <video 
                  src={selectedDubJob.video_output_url || 
                       (selectedDubJob.result as any)?.dubbed_video_url ||
                       (selectedDubJob.result as any)?.output_video_url ||
                       selectedDubJob.result?.video_url || ''} 
                  controls 
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    maxHeight: '500px',
                    backgroundColor: '#121212',
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}





