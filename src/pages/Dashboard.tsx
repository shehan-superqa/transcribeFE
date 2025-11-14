import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { useDispatch, useSelector } from "react-redux";
import { fetchTranscriptions, Transcription } from "../store/transcriptionsSlice";
import { RootState, AppDispatch } from "../store";
import { Link } from "react-router-dom";
import { FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";
import TranscriptionTool from "../components/TranscriptionTool";
import "./Dashboard.css";

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const { items: transcriptions, loading, error } = useSelector(
    (state: RootState) => state.transcriptions
  );

  const [selectedTranscription, setSelectedTranscription] = useState<Transcription | null>(null);

  useEffect(() => {
    if (user) {
      dispatch(fetchTranscriptions());
    }
  }, [user, dispatch]);

  const handleTranscriptionStart = () => {
    // Refresh transcriptions and user data (including energy points) after starting a new transcription
    if (user) {
      setTimeout(() => {
        dispatch(fetchTranscriptions());
        refreshUser(); // Refresh user data to get updated energy points
      }, 1000);
    }
  };

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

  return (
    <div className="dashboard-container">
      <div className="dashboard-content-wrapper">
        {/* Header with welcome message */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            Welcome, {user?.name || user?.email}
          </h1>
        </div>

        {/* Email Verification Banner */}
        {user && !user.isEmailVerified && (
          <div className="verification-banner">
            <FaExclamationTriangle className="verification-icon" />
            <div className="verification-content">
              <strong>Email Verification Required</strong>
              <p className="verification-text">
                Please verify your email address to access all features. Check your inbox for the verification link.
              </p>
              <Link 
                to="/auth/verify-email" 
                className="verification-link"
              >
                Go to verification page →
              </Link>
            </div>
          </div>
        )}

        {user && user.isEmailVerified && (
          <div className="verified-banner">
            <FaCheckCircle />
            Email verified
          </div>
        )}

        {/* Transcription Tool */}
        <div className="tool-wrapper">
          <div className="tool-container">
            <TranscriptionTool onTranscriptionStart={handleTranscriptionStart} />
          </div>
        </div>

        {/* Transcriptions History */}
        <div className="history-container">
          <h2 className="history-title">
            Transcription History
          </h2>

          {loading ? (
            <div className="loading-state">
              Loading transcriptions...
            </div>
          ) : error ? (
            <div className="error-state">
              Error: {error}
            </div>
          ) : transcriptions.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text">No transcriptions yet</p>
              <p className="empty-state-subtext">
                Start transcribing by uploading a file, pasting a YouTube link, or recording audio above.
              </p>
            </div>
          ) : (
            <div className="transcriptions-grid">
              {transcriptions.map((t) => (
                <div
                  key={t.id}
                  className="transcription-card"
                  onClick={() => setSelectedTranscription(t)}
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
                    <span>Duration: {formatDuration(t.duration_seconds)}</span>
                    <span className="meta-separator">•</span>
                    <span>Cost: {t.energy_cost} points</span>
                    <span className="meta-separator">•</span>
                    <span className="transcription-date">{formatDate(t.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                  onClick={() => setSelectedTranscription(null)}
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
                    style={{ color: getStatusColor(selectedTranscription.status) }}
                  >
                    {selectedTranscription.status.toUpperCase()}
                  </span>
                </div>
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Type: </span>
                  <span className="modal-detail-value">{selectedTranscription.input_type}</span>
                </div>
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Duration: </span>
                  <span className="modal-detail-value">{formatDuration(selectedTranscription.duration_seconds)}</span>
                </div>
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Energy Cost: </span>
                  <span className="modal-detail-value">{selectedTranscription.energy_cost} points</span>
                </div>
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Created: </span>
                  <span className="modal-detail-value">{formatDate(selectedTranscription.created_at)}</span>
                </div>
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
