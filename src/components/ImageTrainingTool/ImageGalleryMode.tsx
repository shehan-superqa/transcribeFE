import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../contexts/ThemeContext';
import { getUserJobs } from '../../lib/api/jobsApi';
import type { ImageJob, Job } from '../../types/api';

interface ImageGalleryModeProps {
  imageHistory: ImageJob[];
  historyLoading: boolean;
  historyError: string | null;
  onRefresh?: () => void;
}

const getStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: 0,
  },
  refreshButton: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--primary-color)',
    color: 'var(--primary-color)',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  searchInput: {
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    outline: 'none',
    fontSize: '0.95rem',
    width: '100%',
    marginBottom: '1rem',
  },
  imagesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem',
  },
  imageCard: {
    background: 'var(--bg-paper)',
    border: '1px solid var(--border-color)',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  },
  imageWrapper: {
    position: 'relative' as const,
    width: '100%',
    paddingTop: '100%',
    background: 'rgba(0, 0, 0, 0.2)',
    overflow: 'hidden',
  },
  image: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  imageInfo: {
    padding: '1rem',
  },
  prompt: {
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
    marginBottom: '0.5rem',
    lineHeight: '1.4',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  },
  metadata: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
    marginBottom: '0.75rem',
  },
  metadataItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
  },
  button: {
    flex: 1,
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    border: 'none',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  viewButton: {
    background: 'var(--bg-secondary)',
    color: 'var(--primary-color)',
    border: '1px solid var(--primary-color)',
  },
  downloadButton: {
    background: 'rgba(16, 185, 129, 0.1)',
    color: '#4caf50',
    border: '1px solid rgba(16, 185, 129, 0.3)',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '4rem 2rem',
    color: 'var(--text-tertiary)',
  },
  emptyStateTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '0.5rem',
  },
  modal: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '2rem',
  },
  modalContent: {
    position: 'relative' as const,
    maxWidth: '90vw',
    maxHeight: '90vh',
  },
  modalImage: {
    maxWidth: '100%',
    maxHeight: '90vh',
    objectFit: 'contain' as const,
    borderRadius: '0.5rem',
  },
  modalClose: {
    position: 'absolute' as const,
    top: '1rem',
    right: '1rem',
    background: 'rgba(0, 0, 0, 0.7)',
    color: 'var(--text-primary)',
    border: 'none',
    borderRadius: '50%',
    width: '2.5rem',
    height: '2.5rem',
    fontSize: '1.5rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalInfo: {
    position: 'absolute' as const,
    bottom: '1rem',
    left: '1rem',
    right: '1rem',
    background: 'rgba(0, 0, 0, 0.8)',
    padding: '1rem',
    borderRadius: '0.5rem',
    color: 'var(--text-primary)',
  },
  loading: {
    textAlign: 'center' as const,
    padding: '4rem 2rem',
    color: 'var(--text-tertiary)',
  },
  error: {
    textAlign: 'center' as const,
    padding: '2rem',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '0.75rem',
    color: '#f44336',
  },
});

export default function ImageGalleryMode({ imageHistory, historyLoading, historyError, onRefresh }: ImageGalleryModeProps) {
  const { theme } = useTheme();
  const styles = getStyles();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ url: string; job: ImageJob } | null>(null);

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

  const getImageUrls = (job: ImageJob): string[] => {
    return job.result?.image_urls || 
           (job.result?.image_url ? [job.result.image_url] : []) ||
           job.image_output_urls ||
           (job.image_output_url ? [job.image_output_url] : []);
  };

  const filteredImages = imageHistory.filter(job => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const prompt = job.prompt?.toLowerCase() || '';
    const model = job.result?.model?.toLowerCase() || '';
    return prompt.includes(query) || model.includes(query);
  });

  const handleDownload = (url: string, index: number, jobId: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `image-${jobId}-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageClick = (url: string, job: ImageJob) => {
    setSelectedImage({ url, job });
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    if (selectedImage) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [selectedImage]);

  if (historyLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading gallery...</div>
      </div>
    );
  }

  if (historyError) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{historyError}</div>
        {onRefresh && (
          <button onClick={onRefresh} style={styles.refreshButton}>
            Retry
          </button>
        )}
      </div>
    );
  }

  if (filteredImages.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Gallery</h2>
          {onRefresh && (
            <button onClick={onRefresh} style={styles.refreshButton}>
              Refresh
            </button>
          )}
        </div>
        {searchQuery ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyStateTitle}>No images found</p>
            <p>Try adjusting your search query.</p>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <p style={styles.emptyStateTitle}>No images yet</p>
            <p>Generate images in Generation Mode to see them here.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Gallery ({filteredImages.length} {filteredImages.length === 1 ? 'image' : 'images'})</h2>
        {onRefresh && (
          <button onClick={onRefresh} style={styles.refreshButton}>
            Refresh
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Search by prompt or model..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={styles.searchInput}
      />

      <div style={styles.imagesGrid}>
        {filteredImages.map((job) => {
          const urls = getImageUrls(job);
          if (urls.length === 0) return null;

          return urls.map((url, index) => (
            <div key={`${job._id}-${index}`} style={styles.imageCard}>
              <div 
                style={styles.imageWrapper}
                onClick={() => handleImageClick(url, job)}
                onMouseEnter={(e) => {
                  e.currentTarget.parentElement!.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                  e.currentTarget.parentElement!.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.parentElement!.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.parentElement!.style.background = 'rgba(255, 255, 255, 0.03)';
                }}
              >
                <img src={url} alt={`Generated ${index + 1}`} style={styles.image} />
              </div>
              <div style={styles.imageInfo}>
                <div style={styles.prompt}>
                  {job.prompt || 'No prompt'}
                </div>
                <div style={styles.metadata}>
                  {job.result?.model && (
                    <span style={styles.metadataItem}>
                      Model: {job.result.model.split('/').pop()}
                    </span>
                  )}
                  {job.width && job.height && (
                    <span style={styles.metadataItem}>
                      {job.width}×{job.height}
                    </span>
                  )}
                  <span style={styles.metadataItem}>
                    {formatDate(job.created_at)}
                  </span>
                </div>
                <div style={styles.actions}>
                  <button
                    onClick={() => handleImageClick(url, job)}
                    style={{ ...styles.button, ...styles.viewButton }}
                  >
                    View
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(url, index, job._id);
                    }}
                    style={{ ...styles.button, ...styles.downloadButton }}
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>
          ));
        })}
      </div>

      {/* Modal for full-size image */}
      {selectedImage && (
        <div style={styles.modal} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button onClick={closeModal} style={styles.modalClose}>
              ×
            </button>
            <img src={selectedImage.url} alt="Full size" style={styles.modalImage} />
            <div style={styles.modalInfo}>
              <div style={{ marginBottom: '0.5rem', fontWeight: 600 }}>
                {selectedImage.job.prompt || 'No prompt'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                {selectedImage.job.result?.model && `Model: ${selectedImage.job.result.model} • `}
                {selectedImage.job.width && selectedImage.job.height && `${selectedImage.job.width}×${selectedImage.job.height} • `}
                {formatDate(selectedImage.job.created_at)}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(selectedImage.url, 0, selectedImage.job._id);
                }}
                style={{
                  ...styles.button,
                  ...styles.downloadButton,
                  marginTop: '1rem',
                  width: '100%',
                }}
              >
                Download Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}









