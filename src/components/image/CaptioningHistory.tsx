import { useState, useEffect, useCallback } from 'react';
import JSZip from 'jszip';
import '../../pages/Dashboard.css';

interface CaptioningSession {
  id: string;
  timestamp: number;
  imageCount: number;
  captionedCount: number;
  images: Array<{
    fileName: string;
    caption: string;
    fileData: string; // base64 data URL
  }>;
}

const STORAGE_KEY = 'image_captioning_history';

export function CaptioningHistory() {
  const [history, setHistory] = useState<CaptioningSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isCreatingZip, setIsCreatingZip] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    const loadHistory = () => {
      setHistoryLoading(true);
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const sessions = JSON.parse(stored) as CaptioningSession[];
          // Sort by timestamp (newest first)
          sessions.sort((a, b) => b.timestamp - a.timestamp);
          setHistory(sessions);
        }
      } catch (error) {
        console.error('Error loading captioning history:', error);
      } finally {
        setHistoryLoading(false);
      }
    };
    loadHistory();

    // Listen for storage changes to update history when new sessions are saved
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        loadHistory();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events from the same window
    const handleCustomStorageChange = () => {
      loadHistory();
    };
    window.addEventListener('captioningHistoryUpdated', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('captioningHistoryUpdated', handleCustomStorageChange);
    };
  }, []);

  // Format date for display
  const formatDate = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  // Download ZIP from history
  const downloadZipFromHistory = useCallback(async (session: CaptioningSession) => {
    setIsCreatingZip(true);
    
    try {
      const zip = new JSZip();

      // Add each image and its corresponding caption text file
      for (const imageData of session.images) {
        // Convert data URL back to blob
        const response = await fetch(imageData.fileData);
        const blob = await response.blob();
        
        // Get the base name without extension
        const fileName = imageData.fileName;
        const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
        
        // Add the image file
        zip.file(fileName, blob);
        
        // Add the caption text file with the same base name
        if (imageData.caption) {
          const txtFileName = `${baseName}.txt`;
          zip.file(txtFileName, imageData.caption);
        }
      }

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Create download link
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `image-captions-${session.timestamp}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error: any) {
      console.error('Error creating ZIP from history:', error);
      alert('Failed to create ZIP file: ' + (error.message || 'Unknown error'));
    } finally {
      setIsCreatingZip(false);
    }
  }, []);

  return (
    <div className="history-container">
      <h2 className="history-title">Captioning History</h2>
      <div className="history-content">
        {historyLoading ? (
          <div className="loading-state">Loading captioning history...</div>
        ) : history.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">No captioning history yet</p>
            <p className="empty-state-subtext">
              Create and download a ZIP to save it to history.
            </p>
          </div>
        ) : (
          <div className="transcriptions-grid">
            {history.map((session) => (
              <div
                key={session.id}
                className="transcription-card"
                style={{ cursor: 'pointer' }}
              >
                <div className="transcription-header">
                  <div className="transcription-title">
                    <span className="transcription-icon">📝</span>
                    <span className="transcription-name">
                      {session.captionedCount} Image{session.captionedCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="transcription-meta">
                  <span className="transcription-date">{formatDate(session.timestamp)}</span>
                </div>
                <button
                  onClick={() => downloadZipFromHistory(session)}
                  disabled={isCreatingZip}
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.5rem 1rem',
                    background: isCreatingZip 
                      ? 'rgba(16, 185, 129, 0.2)' 
                      : 'rgba(16, 185, 129, 0.3)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#6ee7b7',
                    borderRadius: '0.5rem',
                    cursor: isCreatingZip ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    width: '100%',
                    transition: 'all 0.2s ease',
                    opacity: isCreatingZip ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isCreatingZip) {
                      e.currentTarget.style.background = 'rgba(16, 185, 129, 0.4)';
                      e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.6)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCreatingZip) {
                      e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)';
                      e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                    }
                  }}
                >
                  {isCreatingZip ? 'Creating ZIP...' : '📥 Download ZIP'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



