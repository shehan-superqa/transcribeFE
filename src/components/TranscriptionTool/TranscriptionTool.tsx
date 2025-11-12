import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { InputMode, TranscriptionToolProps, Recording } from './types';
import { styles } from './transcriptionTool.styles';
import { formatTime } from './utils';
import { useEnergyPoints } from './useEnergyPoints';
import { useTranscription } from './useTranscription';
import { useMicrophonePreview } from './useMicrophonePreview';
import { useRecording } from './useRecording';
import { useWaveforms } from './useWaveforms';

export default function TranscriptionTool({ onTranscriptionStart }: TranscriptionToolProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<InputMode>('file');
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const totalWaveformRef = useRef<HTMLDivElement | null>(null);
  const recordingsContainerRef = useRef<HTMLDivElement | null>(null);
  const recordingsRef = useRef<Recording[]>([]);

  const { energyPoints, setEnergyPoints } = useEnergyPoints(user);

  const {
    isRecording,
    isPaused,
    recordingTime,
    recordings,
    setRecordings,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    audioChunksRef,
  } = useRecording(mode, totalWaveformRef, canvasRef);

  const { previewStreamRef } = useMicrophonePreview(mode, isRecording, canvasRef);

  const { waveformsRef, cleanup: cleanupWaveforms } = useWaveforms(recordings, recordingsContainerRef);

  // Keep recordings ref in sync
  useEffect(() => {
    recordingsRef.current = recordings;
  }, [recordings]);

  const {
    loading,
    error,
    converting,
    conversionProgress,
    handleSubmit,
    setError,
  } = useTranscription(
    mode,
    file,
    youtubeUrl,
    audioChunksRef,
    energyPoints,
    setEnergyPoints,
    onTranscriptionStart
  );

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width) {
        canvas.width = rect.width;
      }
      if (canvas.height !== 120) {
        canvas.height = 120;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Cleanup waveforms and blob URLs on unmount only
  useEffect(() => {
    return () => {
      cleanupWaveforms();
      // Only revoke URLs on unmount, using ref to get latest recordings
      recordingsRef.current.forEach((recording) => {
        if (recording.url && recording.url.startsWith('blob:')) {
          URL.revokeObjectURL(recording.url);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on unmount

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (err: any) {
      setError(err.message || 'Could not access microphone. Please check permissions.');
    }
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
              disabled={converting}
            />
            {converting && conversionProgress && (
              <div style={styles.conversionProgress}>
                <div style={styles.progressBarContainer}>
                  <div 
                    style={{
                      ...styles.progressBar,
                      width: `${conversionProgress.progress}%`,
                    }}
                  />
                </div>
                <div style={styles.progressText}>
                  {conversionProgress.stage === 'loading' && 'Loading FFmpeg...'}
                  {conversionProgress.stage === 'fetching' && 'Fetching video...'}
                  {conversionProgress.stage === 'converting' && 'Converting to M4A...'}
                  {conversionProgress.stage === 'complete' && 'Conversion complete!'}
                  <span style={styles.progressPercent}>
                    {' '}({Math.round(conversionProgress.progress)}%)
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {mode === 'recording' && (
          <div style={styles.recordingSection}>
            <div style={styles.recordingDisplay}>
              <div style={{ ...styles.recordingIndicator, ...(isRecording ? styles.recordingIndicatorActive : {}) }}></div>
              <span style={styles.recordingTime}>{formatTime(recordingTime)}</span>
            </div>
            <div style={styles.waveformContainer}>
              <div style={styles.waveformLabel}>Total Waveform</div>
              <div
                ref={totalWaveformRef}
                style={styles.totalWaveformCanvas}
              />
            </div>
            <canvas
              ref={canvasRef}
              width={600}
              height={120}
              style={styles.waveformCanvas}
            />
            <div style={styles.recordingButtons}>
              <button
                type="button"
                onClick={isRecording ? stopRecording : handleStartRecording}
                style={{ ...styles.recordButton, ...(isRecording ? styles.recordButtonActive : {}) }}
              >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </button>
              {isRecording && (
                <button
                  type="button"
                  onClick={isPaused ? resumeRecording : pauseRecording}
                  style={styles.pauseButton}
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
              )}
            </div>
            
            {/* Recordings list */}
            {recordings.length > 0 && (
              <div style={styles.recordingsContainer}>
                <div style={styles.recordingsTitle}>Recorded Audio ({recordings.length})</div>
                <div ref={recordingsContainerRef} style={styles.recordingsList}>
                  {recordings.map((recording) => (
                    <div key={recording.id} id={recording.id} style={styles.recordingItem}>
                      <div 
                        data-waveform 
                        style={{ 
                          marginBottom: '0.5rem', 
                          minHeight: '60px',
                          width: '100%',
                          backgroundColor: '#0a0a0a',
                          borderRadius: 'var(--border-radius-sm)',
                        }} 
                      />
                      <div style={styles.recordingControls}>
                        <button
                          data-play-button
                          style={styles.playButton}
                        >
                          Play
                        </button>
                        <button
                          style={styles.transcribeButton}
                        >
                          Transcribe
                        </button>
                        <a
                          href={recording.url}
                          download={`recording-${recording.id}.webm`}
                          style={styles.downloadLink}
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {error && <div style={styles.error}>{error}</div>}

        <button
          type="submit"
          disabled={loading || converting || !user || energyPoints < 10}
          style={{
            ...styles.submitButton,
            ...(loading || converting || !user || energyPoints < 10 ? styles.submitButtonDisabled : {}),
          }}
        >
          {converting 
            ? 'Converting...' 
            : loading 
            ? 'Processing...' 
            : `Transcribe (10 points)`}
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

