import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { getUserJobs } from '../../lib/api/jobsApi';
import type { VideoJob, Job } from '../../types/api';
import VideoGenerationTool from '../VideoGenerationTool/VideoGenerationTool';
import '../../pages/Dashboard.css';

export default function TextToVideoTab() {
  const { user } = useAuth();
  const [videoHistory, setVideoHistory] = useState<VideoJob[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Fetch video job history
  useEffect(() => {
    const fetchVideoHistory = async () => {
      if (!user) return;
      
      setHistoryLoading(true);
      setHistoryError(null);
      
      try {
        const response = await getUserJobs(user.id);
        if (response.success && response.jobs) {
          // Filter for video jobs only
          const videoJobs = response.jobs.filter(
            (job: Job) => (job as any).job_type === 'video'
          ).map((job: Job) => job as unknown as VideoJob);
          
          // Sort by created_at (newest first)
          videoJobs.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return dateB - dateA;
          });
          
          setVideoHistory(videoJobs);
        }
      } catch (err: any) {
        console.error('Error fetching video history:', err);
        setHistoryError(err?.message || 'Failed to load video history');
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchVideoHistory();
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

  const handleVideoJobClick = (job: VideoJob) => {
    // This will be handled by VideoGenerationTool if needed
    // For now, we can just refresh the history
    if (job.result?.video_url || job.video_output_url) {
      // Trigger a refresh
      const fetchVideoHistory = async () => {
        try {
          const response = await getUserJobs(user!.id);
          if (response.success && response.jobs) {
            const videoJobs = response.jobs.filter(
              (job: Job) => (job as any).job_type === 'video'
            ).map((job: Job) => job as unknown as VideoJob);
            
            videoJobs.sort((a, b) => {
              const dateA = new Date(a.created_at).getTime();
              const dateB = new Date(b.created_at).getTime();
              return dateB - dateA;
            });
            
            setVideoHistory(videoJobs);
          }
        } catch (err) {
          console.error('Error refreshing video history:', err);
        }
      };
      fetchVideoHistory();
    }
  };

  return <VideoGenerationTool />;
}

// Export VideoHistory as a separate component
export function VideoHistory() {
  const { user } = useAuth();
  const [videoHistory, setVideoHistory] = useState<VideoJob[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedVideoJob, setSelectedVideoJob] = useState<VideoJob | null>(null);
  const [selectedJobDetails, setSelectedJobDetails] = useState<any | null>(null);

  // Fetch video job history
  useEffect(() => {
    const fetchVideoHistory = async () => {
      if (!user) return;
      
      setHistoryLoading(true);
      setHistoryError(null);
      
      try {
        const response = await getUserJobs(user.id);
        if (response.success && response.jobs) {
          // Filter for video jobs only
          const videoJobs = response.jobs.filter(
            (job: Job) => (job as any).job_type === 'video'
          ).map((job: Job) => job as unknown as VideoJob);
          
          // Sort by created_at (newest first)
          videoJobs.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return dateB - dateA;
          });
          
          setVideoHistory(videoJobs);
        }
      } catch (err: any) {
        console.error('Error fetching video history:', err);
        setHistoryError(err?.message || 'Failed to load video history');
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchVideoHistory();
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

  const handleVideoJobClick = async (job: VideoJob) => {
    if (job.result?.video_url || job.video_output_url) {
      setSelectedVideoJob(job);
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
        <h2 className="history-title">Video History</h2>
        <div className="history-content">
          {historyLoading ? (
            <div className="loading-state">
              Loading video history...
            </div>
          ) : historyError ? (
            <div className="error-state">
              {historyError && !historyError.includes('Authentication failed') && !historyError.includes('Authentication service unavailable') ? (
                <>Error: {historyError}</>
              ) : (
                <p>Unable to load video history. Please refresh the page or log in again.</p>
              )}
            </div>
          ) : videoHistory.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text">No video generations yet</p>
              <p className="empty-state-subtext">
                Start generating videos using the form on the left.
              </p>
            </div>
          ) : (
            <div className="transcriptions-grid">
              {videoHistory.map((job) => {
                const hasVideo = !!(job.result?.video_url || job.video_output_url);
                return (
                  <div
                    key={job._id}
                    className="transcription-card"
                    onClick={() => hasVideo && handleVideoJobClick(job)}
                    style={{
                      ...(hasVideo ? {} : { opacity: 0.7, cursor: 'default' }),
                    }}
                  >
                    <div className="transcription-header">
                      <div className="transcription-title">
                        <span className="transcription-icon">🎥</span>
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
                      {(job as any).duration && (
                        <>
                          <span>Duration: {(job as any).duration}s</span>
                          <span className="meta-separator">•</span>
                        </>
                      )}
                      {(job as any).resolution && (
                        <>
                          <span>Resolution: {(job as any).resolution}</span>
                          <span className="meta-separator">•</span>
                        </>
                      )}
                      <span className="transcription-date">{formatDate(job.created_at)}</span>
                    </div>
                    {job.prompt && job.prompt.length > 100 && (
                      <div className="transcription-preview">
                        <p className="transcription-preview-text">
                          {job.prompt.length > 100 
                            ? `${job.prompt.substring(0, 100)}...` 
                            : job.prompt}
                        </p>
                      </div>
                    )}
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

      {/* Video Detail Modal */}
      {selectedVideoJob && (
        <div 
          className="modal-overlay"
          onClick={() => {
            setSelectedVideoJob(null);
            setSelectedJobDetails(null);
          }}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">
                {selectedVideoJob.prompt.length > 50 
                  ? `${selectedVideoJob.prompt.substring(0, 50)}...` 
                  : selectedVideoJob.prompt}
              </h2>
              <button 
                onClick={() => {
                  setSelectedVideoJob(null);
                  setSelectedJobDetails(null);
                }}
                className="modal-close-button"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            
            <div className="modal-actions">
              {(selectedVideoJob.result?.video_url || selectedVideoJob.video_output_url) && (
                <a
                  href={selectedVideoJob.result?.video_url || selectedVideoJob.video_output_url || '#'}
                  download={`video-${selectedVideoJob._id}.mp4`}
                  className="modal-download-button"
                >
                  Download Video
                </a>
              )}
            </div>
            
            <div className="modal-details">
              <div className="modal-detail-item">
                <span className="modal-detail-label">Status: </span>
                <span 
                  className="modal-detail-value"
                  style={{ color: getStatusColor(selectedVideoJob.status) }}
                >
                  {selectedVideoJob.status.toUpperCase()}
                </span>
              </div>
              {(selectedVideoJob as any).duration && (
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Duration: </span>
                  <span className="modal-detail-value">{(selectedVideoJob as any).duration}s</span>
                </div>
              )}
              {(selectedVideoJob as any).resolution && (
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Resolution: </span>
                  <span className="modal-detail-value">{(selectedVideoJob as any).resolution}</span>
                </div>
              )}
              {(selectedVideoJob as any).aspect_ratio && (
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Aspect Ratio: </span>
                  <span className="modal-detail-value">{(selectedVideoJob as any).aspect_ratio}</span>
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
                <span className="modal-detail-value">{formatDate(selectedVideoJob.created_at)}</span>
              </div>
              {selectedVideoJob.error && (
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Error: </span>
                  <span className="modal-detail-value" style={{ color: '#f44336' }}>{selectedVideoJob.error}</span>
                </div>
              )}
            </div>

            {(selectedVideoJob.result?.video_url || selectedVideoJob.video_output_url) && (
              <div>
                <h3 className="modal-section-title">Generated Video</h3>
                <video 
                  src={selectedVideoJob.result?.video_url || selectedVideoJob.video_output_url || ''} 
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

            {selectedVideoJob.prompt && (
              <div style={{ marginTop: '1.5rem' }}>
                <h3 className="modal-section-title">Prompt</h3>
                <div className="modal-transcription-text">
                  {selectedVideoJob.prompt}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
