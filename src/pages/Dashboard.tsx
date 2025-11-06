import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface Transcription {
  id: string;
  input_type: 'file' | 'youtube' | 'recording';
  input_source: string;
  transcription_text: string | null;
  duration_seconds: number | null;
  energy_cost: number;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
}

interface Profile {
  energy_points: number;
  subscription_plan: string;
  full_name: string | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTranscription, setSelectedTranscription] = useState<Transcription | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    if (!user) return;

    const [profileData, transcriptionsData] = await Promise.all([
      supabase
        .from('profiles')
        .select('energy_points, subscription_plan, full_name')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('transcriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    if (profileData.data) {
      setProfile(profileData.data);
    }

    if (transcriptionsData.data) {
      setTranscriptions(transcriptionsData.data);
    }

    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'var(--color-success)';
      case 'processing':
        return 'var(--color-warning)';
      case 'failed':
        return 'var(--color-error)';
      default:
        return 'var(--color-gray-500)';
    }
  };

  const getInputTypeIcon = (type: string) => {
    switch (type) {
      case 'file':
        return '📁';
      case 'youtube':
        return '🎥';
      case 'recording':
        return '🎤';
      default:
        return '📄';
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>Welcome back, {profile?.full_name || user?.email}</p>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>⚡</div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>{profile?.energy_points || 0}</div>
            <div style={styles.statLabel}>Energy Points</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>📊</div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>{transcriptions.length}</div>
            <div style={styles.statLabel}>Total Transcriptions</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>⭐</div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>{profile?.subscription_plan || 'Free'}</div>
            <div style={styles.statLabel}>Current Plan</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>✅</div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>
              {transcriptions.filter((t) => t.status === 'completed').length}
            </div>
            <div style={styles.statLabel}>Completed</div>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Recent Transcriptions</h2>
          <button onClick={() => navigate('/')} style={styles.newButton}>
            + New Transcription
          </button>
        </div>

        {transcriptions.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📝</div>
            <h3 style={styles.emptyTitle}>No transcriptions yet</h3>
            <p style={styles.emptyText}>
              Start your first transcription from the home page
            </p>
            <button onClick={() => navigate('/')} style={styles.emptyButton}>
              Get Started
            </button>
          </div>
        ) : (
          <div style={styles.transcriptionsList}>
            {transcriptions.map((transcription) => (
              <div
                key={transcription.id}
                style={styles.transcriptionCard}
                onClick={() => setSelectedTranscription(transcription)}
              >
                <div style={styles.transcriptionHeader}>
                  <div style={styles.transcriptionIcon}>
                    {getInputTypeIcon(transcription.input_type)}
                  </div>
                  <div style={styles.transcriptionMeta}>
                    <div style={styles.transcriptionSource}>
                      {transcription.input_source}
                    </div>
                    <div style={styles.transcriptionDate}>
                      {formatDate(transcription.created_at)}
                    </div>
                  </div>
                  <div
                    style={{
                      ...styles.transcriptionStatus,
                      backgroundColor: getStatusColor(transcription.status),
                    }}
                  >
                    {transcription.status}
                  </div>
                </div>

                <div style={styles.transcriptionDetails}>
                  <span style={styles.transcriptionDetail}>
                    ⏱ {formatDuration(transcription.duration_seconds)}
                  </span>
                  <span style={styles.transcriptionDetail}>
                    ⚡ {transcription.energy_cost} points
                  </span>
                  <span style={styles.transcriptionDetail}>
                    📍 {transcription.input_type}
                  </span>
                </div>

                {transcription.transcription_text && (
                  <div style={styles.transcriptionPreview}>
                    {transcription.transcription_text.substring(0, 100)}
                    {transcription.transcription_text.length > 100 ? '...' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTranscription && (
        <div style={styles.modal} onClick={() => setSelectedTranscription(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Transcription Details</h3>
              <button
                onClick={() => setSelectedTranscription(null)}
                style={styles.modalClose}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.modalInfo}>
                <strong>Source:</strong> {selectedTranscription.input_source}
              </div>
              <div style={styles.modalInfo}>
                <strong>Type:</strong> {selectedTranscription.input_type}
              </div>
              <div style={styles.modalInfo}>
                <strong>Duration:</strong> {formatDuration(selectedTranscription.duration_seconds)}
              </div>
              <div style={styles.modalInfo}>
                <strong>Status:</strong> {selectedTranscription.status}
              </div>
              <div style={styles.modalInfo}>
                <strong>Date:</strong> {formatDate(selectedTranscription.created_at)}
              </div>

              {selectedTranscription.transcription_text && (
                <div style={styles.modalTranscription}>
                  <strong>Transcription:</strong>
                  <div style={styles.modalText}>
                    {selectedTranscription.transcription_text}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: 'calc(100vh - 80px)',
    padding: '2rem 1.5rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  loading: {
    textAlign: 'center' as const,
    padding: '4rem',
    fontSize: '1.25rem',
    color: 'var(--color-gray-600)',
  },
  header: {
    marginBottom: '2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 700,
    marginBottom: '0.5rem',
    color: 'var(--color-gray-900)',
  },
  subtitle: {
    fontSize: '1.125rem',
    color: 'var(--color-gray-600)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.5rem',
    marginBottom: '3rem',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: 'var(--border-radius-lg)',
    boxShadow: 'var(--shadow-md)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  statIcon: {
    fontSize: '2.5rem',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 700,
    color: 'var(--color-gray-900)',
    lineHeight: 1,
    marginBottom: '0.25rem',
  },
  statLabel: {
    fontSize: '0.875rem',
    color: 'var(--color-gray-600)',
    fontWeight: 500,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 'var(--border-radius-lg)',
    padding: '2rem',
    boxShadow: 'var(--shadow-md)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--color-gray-900)',
  },
  newButton: {
    padding: '0.625rem 1.25rem',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    borderRadius: 'var(--border-radius-md)',
    fontWeight: 600,
    fontSize: '0.938rem',
    transition: 'all var(--transition-fast)',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '3rem 1rem',
  },
  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  },
  emptyTitle: {
    fontSize: '1.5rem',
    fontWeight: 600,
    marginBottom: '0.5rem',
    color: 'var(--color-gray-900)',
  },
  emptyText: {
    color: 'var(--color-gray-600)',
    marginBottom: '1.5rem',
  },
  emptyButton: {
    padding: '0.75rem 2rem',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    borderRadius: 'var(--border-radius-md)',
    fontWeight: 600,
    fontSize: '1rem',
    transition: 'all var(--transition-fast)',
  },
  transcriptionsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  transcriptionCard: {
    padding: '1.5rem',
    border: '1px solid var(--color-gray-200)',
    borderRadius: 'var(--border-radius-md)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  transcriptionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem',
  },
  transcriptionIcon: {
    fontSize: '1.5rem',
  },
  transcriptionMeta: {
    flex: 1,
  },
  transcriptionSource: {
    fontWeight: 600,
    color: 'var(--color-gray-900)',
    marginBottom: '0.25rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  transcriptionDate: {
    fontSize: '0.813rem',
    color: 'var(--color-gray-600)',
  },
  transcriptionStatus: {
    padding: '0.375rem 0.75rem',
    borderRadius: 'var(--border-radius-sm)',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'capitalize' as const,
  },
  transcriptionDetails: {
    display: 'flex',
    gap: '1.5rem',
    marginBottom: '0.75rem',
  },
  transcriptionDetail: {
    fontSize: '0.875rem',
    color: 'var(--color-gray-600)',
  },
  transcriptionPreview: {
    padding: '1rem',
    backgroundColor: 'var(--color-gray-50)',
    borderRadius: 'var(--border-radius-sm)',
    fontSize: '0.875rem',
    color: 'var(--color-gray-700)',
    lineHeight: 1.6,
  },
  modal: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 'var(--border-radius-xl)',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: 'var(--shadow-xl)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: '1px solid var(--color-gray-200)',
  },
  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--color-gray-900)',
  },
  modalClose: {
    fontSize: '1.5rem',
    color: 'var(--color-gray-500)',
    background: 'none',
    padding: '0.25rem 0.5rem',
  },
  modalBody: {
    padding: '1.5rem',
  },
  modalInfo: {
    marginBottom: '1rem',
    color: 'var(--color-gray-700)',
  },
  modalTranscription: {
    marginTop: '1.5rem',
  },
  modalText: {
    marginTop: '0.5rem',
    padding: '1rem',
    backgroundColor: 'var(--color-gray-50)',
    borderRadius: 'var(--border-radius-md)',
    whiteSpace: 'pre-wrap' as const,
    lineHeight: 1.7,
    color: 'var(--color-gray-700)',
  },
};
