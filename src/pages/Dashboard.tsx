import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { useDispatch, useSelector } from "react-redux";
import { fetchTranscriptions, Transcription } from "../store/transcriptionsSlice";
import { RootState, AppDispatch } from "../store";

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
        return "var(--color-success)";
      case "processing":
        return "var(--color-warning)";
      case "failed":
        return "var(--color-error)";
      default:
        return "var(--color-gray-500)";
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

  if (loading) return <div style={{ padding: "4rem" }}>Loading dashboard...</div>;
  if (error) return <div style={{ padding: "4rem", color: "red" }}>Error: {error}</div>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Welcome, {user?.name || user?.email}</h1>
      <p>Total Transcriptions: {transcriptions.length}</p>

      {transcriptions.length === 0 ? (
        <div>No transcriptions yet</div>
      ) : (
        <div>
          {transcriptions.map((t) => (
            <div
              key={t.id}
              style={{ border: "1px solid #ccc", marginBottom: "1rem", padding: "1rem", cursor: "pointer" }}
              onClick={() => setSelectedTranscription(t)}
            >
              {getInputTypeIcon(t.input_type)} {t.input_source} — {t.status}
            </div>
          ))}
        </div>
      )}

      {selectedTranscription && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#00000080", display: "flex", justifyContent: "center", alignItems: "center" }} onClick={() => setSelectedTranscription(null)}>
          <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "8px", maxWidth: "600px", width: "100%" }} onClick={(e) => e.stopPropagation()}>
            <h2>{selectedTranscription.input_source}</h2>
            <p>Status: <span style={{ color: getStatusColor(selectedTranscription.status) }}>{selectedTranscription.status}</span></p>
            <p>Type: {selectedTranscription.input_type}</p>
            <p>Duration: {formatDuration(selectedTranscription.duration_seconds)}</p>
            <p>Energy Cost: {selectedTranscription.energy_cost}</p>
            <p>Created: {formatDate(selectedTranscription.created_at)}</p>
            {selectedTranscription.transcription_text && <pre>{selectedTranscription.transcription_text}</pre>}
            <button onClick={() => setSelectedTranscription(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
