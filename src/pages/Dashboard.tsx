import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { useDispatch, useSelector } from "react-redux";
import { fetchTranscriptions, Transcription } from "../store/transcriptionsSlice";
import { RootState, AppDispatch } from "../store";
import { Link } from "react-router-dom";
import { FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";
import TranscriptionTool from "../components/TranscriptionTool";

export default function Dashboard() {
  const { user } = useAuth();
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
    // Refresh transcriptions after starting a new transcription
    if (user) {
      setTimeout(() => {
        dispatch(fetchTranscriptions());
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
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: "#121212",
      padding: "2rem 1rem"
    }}>
      <div style={{ 
        maxWidth: "1200px", 
        margin: "0 auto" 
      }}>
        {/* Header with welcome message */}
        <div style={{ 
          marginBottom: "2rem",
          textAlign: "center"
        }}>
          <h1 style={{ 
            color: "#e0e0e0", 
            fontSize: "2rem", 
            marginBottom: "0.5rem",
            fontWeight: 700
          }}>
            Welcome, {user?.name || user?.email}
          </h1>
        </div>

        {/* Email Verification Banner */}
        {user && !user.isEmailVerified && (
          <div style={{ 
            padding: "1rem", 
            backgroundColor: "#fff3cd", 
            color: "#856404", 
            borderRadius: "8px", 
            marginBottom: "2rem",
            border: "1px solid #ffc107",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem"
          }}>
            <FaExclamationTriangle />
            <div style={{ flex: 1 }}>
              <strong>Email Verification Required</strong>
              <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.875rem" }}>
                Please verify your email address to access all features. Check your inbox for the verification link.
              </p>
              <Link 
                to="/auth/verify-email" 
                style={{ 
                  display: "inline-block", 
                  marginTop: "0.5rem", 
                  color: "#856404", 
                  textDecoration: "underline",
                  fontSize: "0.875rem"
                }}
              >
                Go to verification page →
              </Link>
            </div>
          </div>
        )}

        {user && user.isEmailVerified && (
          <div style={{ 
            padding: "0.75rem 1rem", 
            backgroundColor: "#d4edda", 
            color: "#155724", 
            borderRadius: "8px", 
            marginBottom: "2rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.875rem",
            justifyContent: "center"
          }}>
            <FaCheckCircle />
            Email verified
          </div>
        )}

        {/* Transcription Tool */}
        <div style={{ 
          marginBottom: "3rem",
          display: "flex",
          justifyContent: "center"
        }}>
          <div style={{ 
            width: "100%",
            maxWidth: "600px"
          }}>
            <TranscriptionTool onTranscriptionStart={handleTranscriptionStart} />
          </div>
        </div>

        {/* Transcriptions History */}
        <div style={{
          backgroundColor: "#1e1e1e",
          borderRadius: "12px",
          padding: "2rem",
          border: "1px solid #333333"
        }}>
          <h2 style={{ 
            color: "#e0e0e0", 
            marginBottom: "1.5rem",
            fontSize: "1.5rem",
            fontWeight: 600
          }}>
            Transcription History
          </h2>

          {loading ? (
            <div style={{ 
              padding: "2rem", 
              textAlign: "center",
              color: "#a0a0a0"
            }}>
              Loading transcriptions...
            </div>
          ) : error ? (
            <div style={{ 
              padding: "2rem", 
              color: "#f44336",
              textAlign: "center"
            }}>
              Error: {error}
            </div>
          ) : transcriptions.length === 0 ? (
            <div style={{ 
              padding: "3rem", 
              textAlign: "center",
              color: "#a0a0a0"
            }}>
              <p style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>No transcriptions yet</p>
              <p style={{ fontSize: "0.9rem" }}>Start transcribing by uploading a file, pasting a YouTube link, or recording audio above.</p>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gap: "1rem"
            }}>
              {transcriptions.map((t) => (
                <div
                  key={t.id}
                  style={{ 
                    border: "1px solid #333333", 
                    borderRadius: "8px",
                    padding: "1rem", 
                    cursor: "pointer",
                    backgroundColor: "#121212",
                    transition: "all 0.2s",
                  }}
                  onClick={() => setSelectedTranscription(t)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#00c6ff";
                    e.currentTarget.style.backgroundColor = "#1a1a1a";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#333333";
                    e.currentTarget.style.backgroundColor = "#121212";
                  }}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem"
                  }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem"
                    }}>
                      <span style={{ fontSize: "1.2rem" }}>{getInputTypeIcon(t.input_type)}</span>
                      <span style={{ color: "#e0e0e0", fontWeight: 500 }}>{t.input_source}</span>
                    </div>
                    <span style={{ 
                      color: getStatusColor(t.status),
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      textTransform: "uppercase"
                    }}>
                      {t.status}
                    </span>
                  </div>
                  <div style={{
                    display: "flex",
                    gap: "1rem",
                    fontSize: "0.875rem",
                    color: "#a0a0a0"
                  }}>
                    <span>Duration: {formatDuration(t.duration_seconds)}</span>
                    <span>•</span>
                    <span>Cost: {t.energy_cost} points</span>
                    <span>•</span>
                    <span>{formatDate(t.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transcription Detail Modal */}
        {selectedTranscription && (
          <div 
            style={{ 
              position: "fixed", 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              backgroundColor: "rgba(0, 0, 0, 0.8)", 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center",
              zIndex: 1000,
              padding: "1rem"
            }} 
            onClick={() => setSelectedTranscription(null)}
          >
            <div 
              style={{ 
                backgroundColor: "#1e1e1e", 
                padding: "2rem", 
                borderRadius: "12px", 
                maxWidth: "700px", 
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                border: "1px solid #333333"
              }} 
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
                marginBottom: "1.5rem"
              }}>
                <h2 style={{ 
                  color: "#e0e0e0", 
                  margin: 0,
                  fontSize: "1.5rem"
                }}>
                  {selectedTranscription.input_source}
                </h2>
                <button 
                  onClick={() => setSelectedTranscription(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#a0a0a0",
                    fontSize: "1.5rem",
                    cursor: "pointer",
                    padding: "0.25rem 0.5rem"
                  }}
                >
                  ×
                </button>
              </div>
              
              <div style={{
                display: "grid",
                gap: "1rem",
                marginBottom: "1.5rem"
              }}>
                <div>
                  <span style={{ color: "#a0a0a0", fontSize: "0.875rem" }}>Status: </span>
                  <span style={{ 
                    color: getStatusColor(selectedTranscription.status),
                    fontWeight: 600,
                    textTransform: "uppercase"
                  }}>
                    {selectedTranscription.status}
                  </span>
                </div>
                <div>
                  <span style={{ color: "#a0a0a0", fontSize: "0.875rem" }}>Type: </span>
                  <span style={{ color: "#e0e0e0" }}>{selectedTranscription.input_type}</span>
                </div>
                <div>
                  <span style={{ color: "#a0a0a0", fontSize: "0.875rem" }}>Duration: </span>
                  <span style={{ color: "#e0e0e0" }}>{formatDuration(selectedTranscription.duration_seconds)}</span>
                </div>
                <div>
                  <span style={{ color: "#a0a0a0", fontSize: "0.875rem" }}>Energy Cost: </span>
                  <span style={{ color: "#e0e0e0" }}>{selectedTranscription.energy_cost} points</span>
                </div>
                <div>
                  <span style={{ color: "#a0a0a0", fontSize: "0.875rem" }}>Created: </span>
                  <span style={{ color: "#e0e0e0" }}>{formatDate(selectedTranscription.created_at)}</span>
                </div>
              </div>

              {selectedTranscription.transcription_text && (
                <div>
                  <h3 style={{ 
                    color: "#e0e0e0", 
                    marginBottom: "0.75rem",
                    fontSize: "1.1rem"
                  }}>
                    Transcription
                  </h3>
                  <div style={{
                    backgroundColor: "#121212",
                    padding: "1.5rem",
                    borderRadius: "8px",
                    border: "1px solid #333333",
                    color: "#e0e0e0",
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.6",
                    fontFamily: "inherit"
                  }}>
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
