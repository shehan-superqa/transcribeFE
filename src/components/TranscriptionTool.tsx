import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

type InputMode = 'file' | 'youtube' | 'recording';

interface TranscriptionToolProps {
  onTranscriptionStart?: () => void;
}

export default function TranscriptionTool({ onTranscriptionStart }: TranscriptionToolProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<InputMode>('file');
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [energyPoints, setEnergyPoints] = useState(0);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchEnergyPoints();
    }
  }, [user]);

  const fetchEnergyPoints = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('energy_points')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setEnergyPoints(data.energy_points);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setError('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('Please sign in to use transcription');
      return;
    }

    if (energyPoints < 10) {
      setError('Not enough energy points. Please upgrade your plan.');
      return;
    }

    if (mode === 'file' && !file) {
      setError('Please select a file');
      return;
    }

    if (mode === 'youtube' && !youtubeUrl) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (mode === 'recording' && audioChunksRef.current.length === 0) {
      setError('Please record audio first');
      return;
    }

    setLoading(true);
    onTranscriptionStart?.();

    try {
      let inputSource = '';
      let inputType: InputMode = mode;

      if (mode === 'file' && file) {
        inputSource = file.name;
      } else if (mode === 'youtube') {
        inputSource = youtubeUrl;
      } else if (mode === 'recording') {
        inputSource = 'live_recording';
      }

      const energyCost = 10;

      const { error: insertError } = await supabase
        .from('transcriptions')
        .insert({
          user_id: user.id,
          input_type: inputType,
          input_source: inputSource,
          energy_cost: energyCost,
          status: 'processing',
        });

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ energy_points: energyPoints - energyCost })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setEnergyPoints(energyPoints - energyCost);

      setFile(null);
      setYoutubeUrl('');
      setRecordingTime(0);
      audioChunksRef.current = [];

      setTimeout(async () => {
        const { data: transcriptions } = await supabase
          .from('transcriptions')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'processing')
          .order('created_at', { ascending: false })
          .limit(1);

        if (transcriptions && transcriptions.length > 0) {
          await supabase
            .from('transcriptions')
            .update({
              status: 'completed',
              transcription_text: 'This is a sample transcription. In production, this would be processed by a transcription service.',
              duration_seconds: Math.floor(Math.random() * 180) + 30,
            })
            .eq('id', transcriptions[0].id);
        }
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Failed to start transcription');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.energyBadge}>
        <span style={styles.energyIcon}>⚡</span>
        <span style={styles.energyText}>{energyPoints} Energy Points</span>
      </div>

      <div style={styles.modeSelector}>
        <button
          style={{ ...styles.modeButton, ...(mode === 'file' ? styles.modeButtonActive : {}) }}
          onClick={() => setMode('file')}
          type="button"
        >
          Upload File
        </button>
        <button
          style={{ ...styles.modeButton, ...(mode === 'youtube' ? styles.modeButtonActive : {}) }}
          onClick={() => setMode('youtube')}
          type="button"
        >
          YouTube Link
        </button>
        <button
          style={{ ...styles.modeButton, ...(mode === 'recording' ? styles.modeButtonActive : {}) }}
          onClick={() => setMode('recording')}
          type="button"
        >
          Record Audio
        </button>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {mode === 'file' && (
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <input
                type="file"
                accept="audio/*,video/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={styles.fileInput}
              />
              <div style={styles.fileUploadBox}>
                <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={styles.uploadIcon}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p style={styles.uploadText}>{file ? file.name : 'Click to upload or drag and drop'}</p>
                <p style={styles.uploadSubtext}>MP3, WAV, M4A, or video files</p>
              </div>
            </label>
          </div>
        )}

        {mode === 'youtube' && (
          <div style={styles.inputGroup}>
            <label style={styles.label}>YouTube URL</label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              style={styles.input}
            />
          </div>
        )}

        {mode === 'recording' && (
          <div style={styles.recordingSection}>
            <div style={styles.recordingDisplay}>
              <div style={{ ...styles.recordingIndicator, ...(isRecording ? styles.recordingIndicatorActive : {}) }}></div>
              <span style={styles.recordingTime}>{formatTime(recordingTime)}</span>
            </div>
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              style={{ ...styles.recordButton, ...(isRecording ? styles.recordButtonActive : {}) }}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
          </div>
        )}

        {error && <div style={styles.error}>{error}</div>}

        <button
          type="submit"
          disabled={loading || !user || energyPoints < 10}
          style={{
            ...styles.submitButton,
            ...(loading || !user || energyPoints < 10 ? styles.submitButtonDisabled : {}),
          }}
        >
          {loading ? 'Processing...' : `Transcribe (10 points)`}
        </button>

        {!user && (
          <p style={styles.signInPrompt}>
            Please <a href="/login" style={styles.link}>sign in</a> to use transcription
          </p>
        )}
      </form>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: 'var(--border-radius-xl)',
    padding: '2rem',
    boxShadow: 'var(--shadow-lg)',
    maxWidth: '600px',
    margin: '0 auto',
  },
  energyBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: 'var(--color-gray-100)',
    borderRadius: 'var(--border-radius-lg)',
    marginBottom: '1.5rem',
    fontWeight: 600,
    color: 'var(--color-gray-700)',
  },
  energyIcon: {
    fontSize: '1.5rem',
  },
  energyText: {
    fontSize: '1rem',
  },
  modeSelector: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.5rem',
    marginBottom: '2rem',
  },
  modeButton: {
    padding: '0.75rem 1rem',
    backgroundColor: 'var(--color-gray-100)',
    color: 'var(--color-gray-700)',
    borderRadius: 'var(--border-radius-md)',
    fontWeight: 600,
    fontSize: '0.875rem',
    transition: 'all var(--transition-fast)',
  },
  modeButtonActive: {
    backgroundColor: 'var(--color-primary)',
    color: 'white',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--color-gray-700)',
  },
  input: {
    padding: '0.75rem 1rem',
    border: '2px solid var(--color-gray-200)',
    borderRadius: 'var(--border-radius-md)',
    fontSize: '1rem',
    transition: 'border-color var(--transition-fast)',
  },
  fileInput: {
    display: 'none',
  },
  fileUploadBox: {
    border: '2px dashed var(--color-gray-300)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '2rem',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  uploadIcon: {
    color: 'var(--color-gray-400)',
    margin: '0 auto 1rem',
  },
  uploadText: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--color-gray-700)',
    marginBottom: '0.25rem',
  },
  uploadSubtext: {
    fontSize: '0.875rem',
    color: 'var(--color-gray-500)',
  },
  recordingSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '1.5rem',
    padding: '2rem',
  },
  recordingDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  recordingIndicator: {
    width: '1rem',
    height: '1rem',
    borderRadius: '50%',
    backgroundColor: 'var(--color-gray-300)',
    transition: 'all var(--transition-fast)',
  },
  recordingIndicatorActive: {
    backgroundColor: 'var(--color-error)',
    animation: 'pulse 1.5s infinite',
  },
  recordingTime: {
    fontSize: '2rem',
    fontWeight: 700,
    color: 'var(--color-gray-700)',
    fontVariantNumeric: 'tabular-nums',
  },
  recordButton: {
    padding: '1rem 2rem',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    borderRadius: 'var(--border-radius-lg)',
    fontWeight: 600,
    fontSize: '1rem',
    transition: 'all var(--transition-fast)',
  },
  recordButtonActive: {
    backgroundColor: 'var(--color-error)',
  },
  error: {
    padding: '0.75rem 1rem',
    backgroundColor: '#fef2f2',
    color: 'var(--color-error)',
    borderRadius: 'var(--border-radius-md)',
    fontSize: '0.875rem',
    border: '1px solid #fee2e2',
  },
  submitButton: {
    padding: '1rem 2rem',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    borderRadius: 'var(--border-radius-lg)',
    fontWeight: 600,
    fontSize: '1.125rem',
    transition: 'all var(--transition-fast)',
    marginTop: '0.5rem',
  },
  submitButtonDisabled: {
    backgroundColor: 'var(--color-gray-300)',
    cursor: 'not-allowed',
  },
  signInPrompt: {
    textAlign: 'center' as const,
    color: 'var(--color-gray-600)',
    fontSize: '0.875rem',
  },
  link: {
    color: 'var(--color-primary)',
    fontWeight: 600,
  },
};
