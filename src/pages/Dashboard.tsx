import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { useDispatch, useSelector } from "react-redux";
import { fetchTranscriptions, Transcription } from "../store/transcriptionsSlice";
import { RootState, AppDispatch } from "../store";
import { ThemeProvider, useMediaQuery, Button, ButtonGroup, Box, IconButton } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import MenuIcon from "@mui/icons-material/Menu";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import Sidebar from "../components/Sidebar";
import TranscribeTab from "../components/transcription/TranscribeTab";
import LiveMicTab from "../components/transcription/LiveMicTab";
import TTSTab from "../components/transcription/TTSTab";
import HistoryTab from "../components/transcription/HistoryTab";
import SettingsTab from "../components/transcription/SettingsTab";
import TrainerTab from "../components/transcription/TrainerTab";
import AudioTranslatorPage from "./tools/AudioTranslatorPage";
import LiveTranscribePage from "./tools/LiveTranscribePage";
import LiveMicVADPage from "./tools/LiveMicVADPage";
import "./Dashboard.css";

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const { theme } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const navigate = useNavigate();
  const { items: transcriptions, loading, error } = useSelector(
    (state: RootState) => state.transcriptions
  );

  const [selectedTranscription, setSelectedTranscription] = useState<Transcription | null>(null);
  const [selectedJobDetails, setSelectedJobDetails] = useState<any | null>(null);
  const [userRefreshed, setUserRefreshed] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'tool' | 'history'>('tool');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Detect if we're on a laptop L size or smaller - tabs show at 1440px and below
  // Toggle buttons show when viewport width is <= 1440px
  const isSmallScreen = useMediaQuery('(max-width: 1440px)');
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Only show toggle buttons on small screens, and only when on audio tool routes or real-time tool routes
  const showToggleButtons = isSmallScreen && (
    location.pathname === '/voice/transcribe' || 
    location.pathname === '/voice/live' ||
    location.pathname === '/voice/vad' ||
    location.pathname === '/voice/tts' ||
    location.pathname === '/voice/translator' ||
    location.pathname === '/voice/trainer' ||
    location.pathname === '/voice/live-transcribe' ||
    location.pathname === '/voice/live-captioner' ||
    location.pathname === '/voice/live-translator' ||
    location.pathname === '/voice/live-voice-translator'
  );

  // Reset active tab when screen expands to large size (both sections visible)
  useEffect(() => {
    if (!isSmallScreen) {
      setActiveMobileTab('tool');
    }
  }, [isSmallScreen]);

  // Redirect /dashboard to /voice/transcribe
  useEffect(() => {
    if (location.pathname === '/dashboard' || location.pathname === '/dashboard/') {
      navigate('/voice/transcribe', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Refresh user data when Dashboard mounts (after login)
  useEffect(() => {
    const refreshUserData = async () => {
      if (!userRefreshed) {
        try {
          await refreshUser();
          setUserRefreshed(true);
        } catch (error) {
          console.error('Failed to refresh user data:', error);
          setUserRefreshed(true); // Set to true even on error to prevent infinite loop
        }
      }
    };
    
    refreshUserData();
  }, [refreshUser, userRefreshed]);

  useEffect(() => {
    if (user && userRefreshed) {
      dispatch(fetchTranscriptions());
    }
  }, [user, userRefreshed, dispatch]);

  // Note: handleTranscriptionStart removed as TranscriptionTool is replaced with tab-based interface
  // Transcription start handling is now managed within individual tab components

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
        return theme.palette.success.main;
      case "processing":
        return theme.palette.warning.main;
      case "failed":
        return theme.palette.error.main;
      default:
        return theme.palette.text.secondary;
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

  // Convert seconds to SRT time format (HH:MM:SS,mmm)
  const formatSRTTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
  };

  // Convert text segments to SRT format
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
        {/* Mobile Hamburger Menu Button */}
        {isMobile && (
          <IconButton
            onClick={() => setSidebarOpen(!sidebarOpen)}
            sx={{
              position: 'fixed',
              top: 16,
              left: 16,
              zIndex: 1301,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(18, 18, 18, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.shadows[2],
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(18, 18, 18, 1)' : 'rgba(255, 255, 255, 1)',
              },
            }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        {/* Sidebar Navigation */}
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Main Content Area - Side by Side Layout */}
        <div className="dashboard-main-layout">
          {/* Mobile Toggle Buttons - Only visible on small screens and when on audio tool routes */}
          {showToggleButtons && (
            <Box
              sx={{
                display: isSmallScreen ? 'flex' : 'none',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 1,
                mb: 2,
                width: '100%',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                backgroundColor: theme.palette.mode === 'dark' ? '#000000' : '#ffffff',
                padding: '0.5rem 0',
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <ButtonGroup
                variant="outlined"
                aria-label="Tool and History toggle"
                sx={{
                  maxWidth: '300px',
                  '& .MuiButton-root': {
                    flex: 1,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    borderColor: theme.palette.divider,
                    color: theme.palette.text.primary,
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f3f4f6',
                    },
                  },
                }}
              >
                <Button
                  onClick={() => setActiveMobileTab('tool')}
                  variant={activeMobileTab === 'tool' ? 'contained' : 'outlined'}
                  sx={{
                    backgroundColor: activeMobileTab === 'tool' ? theme.palette.primary.main : 'transparent',
                    color: activeMobileTab === 'tool' ? '#ffffff' : theme.palette.text.primary,
                    '&:hover': {
                      backgroundColor: activeMobileTab === 'tool' ? theme.palette.primary.dark : theme.palette.mode === 'dark' ? '#1a1a1a' : '#f3f4f6',
                    },
                  }}
                >
                  Tool
                </Button>
                <Button
                  onClick={() => setActiveMobileTab('history')}
                  variant={activeMobileTab === 'history' ? 'contained' : 'outlined'}
                  sx={{
                    backgroundColor: activeMobileTab === 'history' ? theme.palette.primary.main : 'transparent',
                    color: activeMobileTab === 'history' ? '#ffffff' : theme.palette.text.primary,
                    '&:hover': {
                      backgroundColor: activeMobileTab === 'history' ? theme.palette.primary.dark : theme.palette.mode === 'dark' ? '#1a1a1a' : '#f3f4f6',
                    },
                  }}
                >
                  History
                </Button>
              </ButtonGroup>
            </Box>
          )}

          {/* Transcription Tool with Tabs - Left Side */}
          <div 
            className="tool-wrapper"
            style={{
              display: showToggleButtons && activeMobileTab !== 'tool' ? 'none' : 'flex',
            }}
          >
            <div className="tool-container">
              <ThemeProvider theme={theme}>
                <CssBaseline />
                <Routes>
                  <Route path="/" element={<Navigate to="/voice/transcribe" replace />} />
                  <Route path="transcribe" element={<TranscribeTab />} />
                  <Route path="batch" element={<Navigate to="/voice/transcribe" replace />} />
                  <Route path="live" element={<LiveMicTab />} />
                  <Route path="livemicvad" element={<Navigate to="/voice/live" replace />} />
                  <Route path="tts" element={<TTSTab />} />
                  <Route path="translator" element={<AudioTranslatorPage />} />
                  <Route path="history" element={<HistoryTab />} />
                  <Route path="settings" element={<SettingsTab />} />
                  <Route path="trainer" element={<TrainerTab />} />
                  <Route path="live-transcribe" element={<LiveTranscribePage />} />
                  <Route path="live-captioner" element={<TranscribeTab />} />
                  <Route path="live-translator" element={<LiveMicTab />} />
                  <Route path="live-voice-translator" element={<LiveMicTab />} />
                  <Route path="vad" element={<LiveMicVADPage />} />
                  <Route path="*" element={<Navigate to="/voice/transcribe" replace />} />
                </Routes>
              </ThemeProvider>
            </div>
          </div>

          {/* Transcriptions History - Right Side */}
          <div 
            className="history-container"
            style={{
              display: showToggleButtons && activeMobileTab !== 'history' ? 'none' : 'block',
            }}
          >
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
                    Start transcribing by uploading an audio or video file, pasting a YouTube link, or recording audio above.
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
                    // Fetch full job details to get file download URL and additional info
                    try {
                      const { getJobStatus } = await import("../lib/api/jobsApi");
                      const response = await getJobStatus(t.id);
                      if (response.job) {
                        setSelectedJobDetails(response.job);
                        // Update transcription with any additional info from job
                        if (response.job.result?.segments && !t.duration_seconds) {
                          const segments = response.job.result.segments;
                          if (segments.length > 0) {
                            const lastSegment = segments[segments.length - 1];
                            const duration = Math.ceil(lastSegment.end);
                            // Update the transcription in the list if duration was missing
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
                      <span style={{ color: theme.palette.error.main, fontSize: '0.875rem' }}>
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
        </div>

        {/* Transcription Detail Modal */}
        {selectedTranscription && (
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
                  // Calculate duration from segments if available, otherwise use stored duration
                  let duration = selectedTranscription.duration_seconds;
                  // Try text_segments first (new format)
                  if (!duration && selectedJobDetails?.text_segments && selectedJobDetails.text_segments.length > 0) {
                    const lastSegment = selectedJobDetails.text_segments[selectedJobDetails.text_segments.length - 1];
                    duration = Math.ceil(lastSegment.end_time);
                  }
                  // Fallback to result.segments (old format)
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
                    <span className="modal-detail-value" style={{ color: theme.palette.error.main }}>{selectedTranscription.error}</span>
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
    </div>
  );
}
