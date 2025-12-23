import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTranscriptions, Transcription } from '../store/transcriptionsSlice';
import { RootState, AppDispatch } from '../store';
import { useAuth } from '../lib/auth';
import Sidebar from '../components/Sidebar';
import VideoToTextPage from './tools/VideoToTextPage';
import VideoGenerationPage from './tools/VideoGenerationPage';
import VideoDubberPage from './tools/VideoDubberPage';
import { DubHistory } from '../components/video/VideoDubberTab';
import VideoAdsPage from './tools/VideoAdsPage';
import FreeToolsPage from './tools/FreeToolsPage';
import LiveTranscribePage from './tools/LiveTranscribePage';
import RealTimeTranslatorPage from './tools/RealTimeTranslatorPage';
import LiveVoiceTranslatorPage from './tools/LiveVoiceTranslatorPage';
import TextToVideoTab, { VideoHistory } from '../components/video/TextToVideoTab';
import '../pages/Dashboard.css';

// Create Material-UI dark theme matching Dashboard colors
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00c6ff',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#e0e0e0',
      secondary: '#a0a0a0',
    },
    divider: '#333333',
  },
});

export default function ToolsDashboard() {
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  const { items: transcriptions, loading, error } = useSelector(
    (state: RootState) => state.transcriptions
  );
  const [selectedTranscription, setSelectedTranscription] = useState<Transcription | null>(null);
  const [selectedJobDetails, setSelectedJobDetails] = useState<any | null>(null);
  
  const isTextToVideoRoute = location.pathname.includes('text-to-video') || location.pathname === '/video' || location.pathname === '/video/';
  const isDubberRoute = location.pathname.includes('dubber');
  const isVideoToTextRoute = location.pathname.includes('to-text');

  // Fetch transcriptions when on video-to-text route
  useEffect(() => {
    if (isVideoToTextRoute && user) {
      dispatch(fetchTranscriptions());
    }
  }, [isVideoToTextRoute, user, dispatch]);

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

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#4caf50";
      case "processing":
        return "#ff9800";
      case "failed":
        return "#f44336";
      default:
        return "#757575";
    }
  };

  const getInputTypeIcon = (type: string) => {
    switch (type) {
      case "file":
        return "📁";
      case "youtube":
        return "🎥";
      case "recording":
        return "🎤";
      default:
        return "📄";
    }
  };

  const handleDownloadAudioFile = async (jobId: string, filename: string) => {
    try {
      const { getAccessToken } = await import("../lib/api");
      const token = getAccessToken();
      const apiBaseUrl = import.meta.env.VITE_TRANSCRIBE_API_BASE_URL || 'http://localhost:5000';
      
      const response = await fetch(`${apiBaseUrl}/api/jobs/${jobId}/file`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `audio_file_${jobId}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading audio file:', error);
      alert('Failed to download audio file. Please try again.');
    }
  };

  const formatSRTTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
  };

  const convertSegmentsToSRT = (segments: Array<{ start_time: number; end_time: number; segment_id: number; text: string }>): string => {
    return segments
      .sort((a, b) => a.segment_id - b.segment_id)
      .map((segment, index) => {
        return `${index + 1}\n${formatSRTTime(segment.start_time)} --> ${formatSRTTime(segment.end_time)}\n${segment.text.trim()}\n`;
      })
      .join('\n');
  };

  const handleDownloadSegments = (segments: Array<{ start_time: number; end_time: number; segment_id: number; text: string }>, filename: string) => {
    try {
      const srtContent = convertSegmentsToSRT(segments);
      const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename.replace(/\.[^/.]+$/, '')}_segments.srt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading segments:', error);
      alert('Failed to download segments. Please try again.');
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content-wrapper">
        <Sidebar />
        <div className="dashboard-main-layout">
          <div className="tool-wrapper">
            <div className="tool-container">
              <ThemeProvider theme={darkTheme}>
                <CssBaseline />
                <Routes>
                  <Route path="/" element={<Navigate to="/video/text-to-video" replace />} />
                  {/* Video Tools */}
                  <Route path="text-to-video" element={<TextToVideoTab />} />
                  <Route path="ads" element={<VideoAdsPage />} />
                  <Route path="to-text" element={<VideoToTextPage />} />
                  <Route path="dubber" element={<VideoDubberPage />} />
                  {/* Legacy routes - redirect to new paths */}
                  <Route path="video-generation" element={<Navigate to="/video/text-to-video" replace />} />
                  <Route path="video-dubber" element={<Navigate to="/video/dubber" replace />} />
                  <Route path="*" element={<Navigate to="/video/text-to-video" replace />} />
                </Routes>
              </ThemeProvider>
            </div>
          </div>
          
          {/* Video History Section - Right Side (only for text-to-video route) */}
          {isTextToVideoRoute && <VideoHistory />}
          
          {/* Dubbing History Section - Right Side (only for dubber route) */}
          {isDubberRoute && <DubHistory />}
          
          {/* Transcription History Section - Right Side (only for video-to-text route) */}
          {isVideoToTextRoute && (
            <div className="history-container">
              <h2 className="history-title">
                Transcription History
              </h2>
              <div className="history-content">
                {loading ? (
                  <div className="loading-state">
                    Loading transcriptions...
                  </div>
                ) : error && !error.includes('Authentication failed') && !error.includes('Authentication service unavailable') ? (
                  <div className="error-state">
                    Error: {error}
                  </div>
                ) : error && (error.includes('Authentication failed') || error.includes('Authentication service unavailable')) ? (
                  <div className="error-state">
                    <p>Unable to load transcription history. Please refresh the page or log in again.</p>
                  </div>
                ) : transcriptions.length === 0 ? (
                  <div className="empty-state">
                    <p className="empty-state-text">No transcriptions yet</p>
                    <p className="empty-state-subtext">
                      Start transcribing by uploading a video file, pasting a YouTube link, or recording audio above.
                    </p>
                  </div>
                ) : (
                  <div className="transcriptions-grid">
                    {transcriptions.map((t) => (
                      <div
                        key={t.id}
                        className="transcription-card"
                        onClick={async () => {
                          setSelectedTranscription(t);
                          try {
                            const { getJobStatus } = await import("../lib/api/jobsApi");
                            const response = await getJobStatus(t.id);
                            if (response.job) {
                              setSelectedJobDetails(response.job);
                              if (response.job.result?.segments && !t.duration_seconds) {
                                const segments = response.job.result.segments;
                                if (segments.length > 0) {
                                  const lastSegment = segments[segments.length - 1];
                                  const duration = Math.ceil(lastSegment.end);
                                  if (duration > 0) {
                                    dispatch({
                                      type: 'transcriptions/updateDuration',
                                      payload: { id: t.id, duration_seconds: duration }
                                    });
                                  }
                                }
                              }
                            }
                          } catch (error) {
                            console.error("Error fetching job details:", error);
                          }
                        }}
                      >
                        <div className="transcription-header">
                          <div className="transcription-title">
                            <span className="transcription-icon">{getInputTypeIcon(t.input_type)}</span>
                            <span className="transcription-name">{t.input_source}</span>
                          </div>
                          <span 
                            className="transcription-status"
                            style={{ color: getStatusColor(t.status) }}
                          >
                            {t.status}
                          </span>
                        </div>
                        <div className="transcription-meta">
                          {t.duration_seconds !== null && (
                            <>
                              <span>Duration: {formatDuration(t.duration_seconds)}</span>
                              <span className="meta-separator">•</span>
                            </>
                          )}
                          {t.file_size_mb && (
                            <>
                              <span>Size: {t.file_size_mb.toFixed(2)} MB</span>
                              <span className="meta-separator">•</span>
                            </>
                          )}
                          {t.engine_used && (
                            <>
                              <span>Engine: {t.engine_used}</span>
                              <span className="meta-separator">•</span>
                            </>
                          )}
                          <span>Cost: {t.energy_cost} points</span>
                          <span className="meta-separator">•</span>
                          <span className="transcription-date">{formatDate(t.created_at)}</span>
                        </div>
                        {t.transcription_text && (
                          <div className="transcription-preview">
                            <p className="transcription-preview-text">
                              {t.transcription_text.length > 100 
                                ? `${t.transcription_text.substring(0, 100)}...` 
                                : t.transcription_text}
                            </p>
                          </div>
                        )}
                        {t.error && (
                          <div className="transcription-error">
                            <span style={{ color: '#f44336', fontSize: '0.875rem' }}>
                              Error: {t.error}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transcription Detail Modal */}
      {isVideoToTextRoute && selectedTranscription && (
        <div 
          className="modal-overlay"
          onClick={() => setSelectedTranscription(null)}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">
                {selectedTranscription.input_source}
              </h2>
              <button 
                onClick={() => {
                  setSelectedTranscription(null);
                  setSelectedJobDetails(null);
                }}
                className="modal-close-button"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            
            <div className="modal-actions">
              {selectedTranscription.transcription_text && (
                <a
                  href={`data:text/plain;charset=utf-8,${encodeURIComponent(selectedTranscription.transcription_text)}`}
                  download={`${selectedTranscription.input_source.replace(/\.[^/.]+$/, '')}_transcription.txt`}
                  className="modal-download-button"
                >
                  Download Transcription
                </a>
              )}
              {selectedJobDetails?.text_segments && selectedJobDetails.text_segments.length > 0 && (
                <button
                  onClick={() => handleDownloadSegments(selectedJobDetails.text_segments, selectedJobDetails.file_info?.filename || selectedTranscription.input_source)}
                  className="modal-download-button"
                  style={{ 
                    marginLeft: selectedTranscription.transcription_text ? '0.5rem' : '0',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Download Segments (SRT)
                </button>
              )}
              {selectedJobDetails?.file_info?.filename && (
                <button
                  onClick={() => handleDownloadAudioFile(selectedTranscription.id, selectedJobDetails.file_info.filename)}
                  className="modal-download-button"
                  style={{ 
                    marginLeft: (selectedTranscription.transcription_text || (selectedJobDetails?.text_segments && selectedJobDetails.text_segments.length > 0)) ? '0.5rem' : '0',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Download Audio/Video File
                </button>
              )}
            </div>
            
            <div className="modal-details">
              <div className="modal-detail-item">
                <span className="modal-detail-label">Status: </span>
                <span 
                  className="modal-detail-value"
                  style={{ color: getStatusColor(selectedTranscription.status) }}
                >
                  {selectedTranscription.status.toUpperCase()}
                </span>
              </div>
              <div className="modal-detail-item">
                <span className="modal-detail-label">Type: </span>
                <span className="modal-detail-value">{selectedTranscription.input_type}</span>
              </div>
              {(() => {
                let duration = selectedTranscription.duration_seconds;
                if (!duration && selectedJobDetails?.text_segments && selectedJobDetails.text_segments.length > 0) {
                  const lastSegment = selectedJobDetails.text_segments[selectedJobDetails.text_segments.length - 1];
                  duration = Math.ceil(lastSegment.end_time);
                }
                if (!duration && selectedJobDetails?.result?.segments && selectedJobDetails.result.segments.length > 0) {
                  const lastSegment = selectedJobDetails.result.segments[selectedJobDetails.result.segments.length - 1];
                  duration = Math.ceil(lastSegment.end);
                }
                return duration !== null && duration !== undefined ? (
                  <div className="modal-detail-item">
                    <span className="modal-detail-label">Duration: </span>
                    <span className="modal-detail-value">{formatDuration(duration)}</span>
                  </div>
                ) : null;
              })()}
              {selectedTranscription.file_size_mb && (
                <div className="modal-detail-item">
                  <span className="modal-detail-label">File Size: </span>
                  <span className="modal-detail-value">{selectedTranscription.file_size_mb.toFixed(2)} MB</span>
                </div>
              )}
              {selectedTranscription.engine_used && (
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Engine: </span>
                  <span className="modal-detail-value">{selectedTranscription.engine_used}</span>
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
              {selectedJobDetails?.result?.language && (
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Language: </span>
                  <span className="modal-detail-value">{selectedJobDetails.result.language}</span>
                </div>
              )}
              {selectedJobDetails?.result?.model && (
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Model: </span>
                  <span className="modal-detail-value">{selectedJobDetails.result.model}</span>
                </div>
              )}
              {selectedJobDetails?.file_info?.extension && (
                <div className="modal-detail-item">
                  <span className="modal-detail-label">File Format: </span>
                  <span className="modal-detail-value">{selectedJobDetails.file_info.extension.toUpperCase()}</span>
                </div>
              )}
              {selectedJobDetails?.text_segments_count !== undefined && (
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Segments: </span>
                  <span className="modal-detail-value">{selectedJobDetails.text_segments_count}</span>
                </div>
              )}
              {selectedTranscription.started_at && (
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Started: </span>
                  <span className="modal-detail-value">{formatDate(selectedTranscription.started_at)}</span>
                </div>
              )}
              {selectedTranscription.finished_at && (
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Finished: </span>
                  <span className="modal-detail-value">{formatDate(selectedTranscription.finished_at)}</span>
                </div>
              )}
              <div className="modal-detail-item">
                <span className="modal-detail-label">Energy Cost: </span>
                <span className="modal-detail-value">{selectedTranscription.energy_cost} points</span>
              </div>
              <div className="modal-detail-item">
                <span className="modal-detail-label">Created: </span>
                <span className="modal-detail-value">{formatDate(selectedTranscription.created_at)}</span>
              </div>
              {selectedTranscription.error && (
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Error: </span>
                  <span className="modal-detail-value" style={{ color: '#f44336' }}>{selectedTranscription.error}</span>
                </div>
              )}
            </div>

            {selectedTranscription.transcription_text && (
              <div>
                <h3 className="modal-section-title">
                  Transcription
                </h3>
                <div className="modal-transcription-text">
                  {selectedTranscription.transcription_text}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

