import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { InputMode, TranscriptionToolProps, Recording } from './types';
import { formatTime } from './utils';
import { useEnergyPoints } from './useEnergyPoints';
import { useTranscription } from './useTranscription';
import { useMicrophonePreview } from './useMicrophonePreview';
import { useRecording } from './useRecording';
import { useWaveforms } from './useWaveforms';
import { FaMicrophone, FaPause, FaPlay, FaStop, FaYoutube, FaFileUpload } from 'react-icons/fa';
import FileImage from './img2.png';
import YoutubeImage from './img3.jpg';
import RecorderImage from './img4.png';

import './TranscriptionTool.css';

// Define consistent colors
const PRIMARY_COLOR = '#00c6ff';
const SECONDARY_COLOR = '#9b5de5';
const BACKGROUND_DARK = '#0a0a0a';
const CARD_BG = '#1a1a1a';
const ERROR_COLOR = '#DC3545';

// --- IMAGE MAPPING using imported variables ---
const MODE_IMAGES = {
  file: FileImage,
  youtube: YoutubeImage,
  recording: RecorderImage,
};

// 💡 Component for the Image Reference
const ImageReference = ({ mode, position, width = '40%' }: { mode: InputMode; position: string; width?: string }) => {
  const src = MODE_IMAGES[mode as keyof typeof MODE_IMAGES];
  return (
    <div
      style={{
        width: width,
        minHeight: '150px',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        margin: position === 'left' ? '0 1rem 0 0' : '0 0 0 1rem',
        border: `1px solid ${PRIMARY_COLOR}`,
        backgroundColor: '#111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {src ? (
        <img
          src={src}
          alt={`Reference image for ${mode} functionality`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{ padding: '1rem', color: '#888' }}>Image preview</div>
      )}
    </div>
  );
};

export default function TranscriptionTool({ onTranscriptionStart }: TranscriptionToolProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<InputMode>('file');
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const [recordButtonHover, setRecordButtonHover] = useState(false);
  const [pauseButtonHover, setPauseButtonHover] = useState(false);

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
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    audioChunksRef,
  } = useRecording(mode, totalWaveformRef, canvasRef);

  useMicrophonePreview(mode, isRecording, canvasRef);
  const { cleanup: cleanupWaveforms } = useWaveforms(recordings, recordingsContainerRef);

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = 120;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  useEffect(() => {
    return () => {
      cleanupWaveforms();
      recordingsRef.current.forEach((recording) => {
        if (recording.url && recording.url.startsWith('blob:')) {
          URL.revokeObjectURL(recording.url);
        }
      });
    };
  }, []);

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (err: any) {
      setError(err.message || 'Could not access microphone. Please check permissions.');
    }
  };

  // Styles
  const selectedModeStyle = {
    border: `2px solid ${PRIMARY_COLOR}`,
    boxShadow: `0 0 15px ${PRIMARY_COLOR}50`,
    opacity: 1,
  };

  const unselectedModeStyle = {
    border: `1px solid rgba(255, 255, 255, 0.1)`,
    opacity: 0.6,
  };

  const modeCardStyle = {
    backgroundColor: CARD_BG,
    padding: '0',
    borderRadius: '1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '1rem',
    overflow: 'hidden',
  };

  const contentContainerStyle = {
    display: 'flex',
    alignItems: 'stretch',
    gap: '2rem',
    marginTop: '0',
    width: '100%',
  };

  const formCardStyle = {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: '2rem',
    borderRadius: '0',
    color: '#000',
  };

  return (
    <div className="transcription-tool-container">
      <div className="energy-badge">
        <span className="energy-icon">⚡</span>
        <span className="energy-text">{energyPoints} Energy Points</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {/* 1. UPLOAD FILE SECTION */}
          <div
            className="mode-card file-mode"
            onClick={() => setMode('file')}
            style={{
              ...modeCardStyle,
              ...(mode === 'file' ? selectedModeStyle : unselectedModeStyle),
            }}
          >
            <div style={{ padding: '1.5rem', backgroundColor: CARD_BG }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: mode === 'file' ? PRIMARY_COLOR : 'white', marginBottom: '0' }}>
                <FaFileUpload /> Upload Audio/Video File
              </h3>
            </div>

            <div className="alternating-content" style={contentContainerStyle}>
              {/* LEFT: Form Card */}
              <div style={formCardStyle}>
                <h4 style={{ marginTop: 0, marginBottom: '1rem', color: '#333', fontSize: '1rem', fontWeight: 600 }}>Select Your File</h4>
                <label style={{ cursor: 'pointer', width: '100%', display: 'block' }}>
                  <input
                    type="file"
                    accept="audio/*,video/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    hidden
                    disabled={mode !== 'file'}
                  />
                  <div
                    className="file-upload-box"
                    style={{
                      padding: '2rem 1rem',
                      border: `2px dashed ${PRIMARY_COLOR}`,
                      borderRadius: '0.5rem',
                      textAlign: 'center',
                      backgroundColor: '#fafafa',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {file ? (
                      <p style={{ color: PRIMARY_COLOR, fontWeight: 600, margin: 0 }}>✓ File Selected: {file.name}</p>
                    ) : (
                      <>
                        <p style={{ color: '#666', fontWeight: 500, margin: '0 0 0.5rem 0' }}>Click to upload or drag and drop</p>
                        <p style={{ color: '#999', fontSize: '0.85rem', margin: 0 }}>MP3, WAV, M4A, or video files</p>
                      </>
                    )}
                  </div>
                </label>
              </div>

              {/* RIGHT: Reference Image */}
              <ImageReference mode="file" position="right" width="40%" />
            </div>
          </div>

          {/* 2. YOUTUBE LINK SECTION */}
          <div
            className="mode-card youtube-mode"
            onClick={() => setMode('youtube')}
            style={{
              ...modeCardStyle,
              ...(mode === 'youtube' ? selectedModeStyle : unselectedModeStyle),
            }}
          >
            <div style={{ padding: '1.5rem', backgroundColor: CARD_BG }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: mode === 'youtube' ? PRIMARY_COLOR : 'white', marginBottom: '0' }}>
                <FaYoutube /> Use YouTube Link
              </h3>
            </div>

            <div className="alternating-content" style={{ ...contentContainerStyle, flexDirection: 'row-reverse' }}>
              {/* LEFT: Form Card */}
              <div style={formCardStyle}>
                <h4 style={{ marginTop: 0, marginBottom: '1rem', color: '#333', fontSize: '1rem', fontWeight: 600 }}>Enter Video URL</h4>
                <label style={{ display: 'block', marginBottom: '1rem' }}>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    disabled={converting || mode !== 'youtube'}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid ${PRIMARY_COLOR}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box',
                      backgroundColor: '#fff',
                      color: '#333',
                    }}
                  />
                </label>
                {converting && conversionProgress && (
                  <div className="conversion-progress">
                    <div className="progress-bar-container">
                      <div className="progress-bar" style={{ width: `${conversionProgress.progress}%` }} />
                    </div>
                    <div className="progress-text" style={{ color: '#333' }}>
                      {conversionProgress.stage === 'loading' && 'Loading FFmpeg...'}
                      {conversionProgress.stage === 'fetching' && 'Fetching video...'}
                      {conversionProgress.stage === 'converting' && 'Converting to M4A...'}
                      {conversionProgress.stage === 'complete' && 'Conversion complete!'}
                      <span className="progress-percent"> ({Math.round(conversionProgress.progress)}%)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT: Reference Image */}
              <ImageReference mode="youtube" position="right" width="40%" />
            </div>
          </div>

          {/* 3. RECORD AUDIO SECTION */}
          <div
            className="mode-card recording-mode"
            onClick={() => setMode('recording')}
            style={{
              ...modeCardStyle,
              ...(mode === 'recording' ? selectedModeStyle : unselectedModeStyle),
              backgroundColor: mode === 'recording' ? BACKGROUND_DARK : CARD_BG,
            }}
          >
            <div style={{ padding: '1.5rem', backgroundColor: CARD_BG }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: mode === 'recording' ? PRIMARY_COLOR : 'white', marginBottom: '0' }}>
                <FaMicrophone /> Record Live Audio
              </h3>
            </div>

            <div className="alternating-content" style={{ ...contentContainerStyle, flexDirection: 'row-reverse' }}>
              {/* LEFT: Functionality */}
              <div className="functionality-section" style={{ flex: 1, pointerEvents: mode !== 'recording' ? 'none' : 'auto', padding: '2rem' }}>
                <div className="recording-display">
                  <div className={`recording-indicator ${isRecording ? 'active' : ''}`}></div>
                  <span className="recording-time" style={{ color: PRIMARY_COLOR, fontWeight: 700, fontSize: '1.25rem' }}>
                    {formatTime(recordingTime)}
                  </span>
                </div>
                <div className="waveform-container">
                  <div className="waveform-label">Total Waveform</div>
                  <div ref={totalWaveformRef} className="total-waveform-canvas" />
                </div>
                <canvas ref={canvasRef} className="waveform-canvas" />

                <div className="recording-buttons" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button
                    type="button"
                    className={`record-button ${isRecording ? 'active' : ''}`}
                    onClick={isRecording ? stopRecording : handleStartRecording}
                    onMouseEnter={() => setRecordButtonHover(true)}
                    onMouseLeave={() => setRecordButtonHover(false)}
                    style={{
                      background: isRecording
                        ? ERROR_COLOR
                        : recordButtonHover
                        ? `linear-gradient(90deg, ${PRIMARY_COLOR}e0, ${SECONDARY_COLOR}e0)`
                        : `linear-gradient(90deg, ${PRIMARY_COLOR}, ${SECONDARY_COLOR})`,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '1rem',
                      fontWeight: 600,
                      transition: 'all 0.3s ease',
                      minWidth: '180px',
                      justifyContent: 'center',
                    }}
                  >
                    {isRecording ? <FaStop /> : <FaMicrophone />}
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                  </button>
                  {isRecording && (
                    <button
                      type="button"
                      className="pause-button"
                      onClick={isPaused ? resumeRecording : pauseRecording}
                      onMouseEnter={() => setPauseButtonHover(true)}
                      onMouseLeave={() => setPauseButtonHover(false)}
                      style={{
                        background: isPaused ? PRIMARY_COLOR : CARD_BG,
                        color: isPaused ? 'white' : PRIMARY_COLOR,
                        border: `2px solid ${PRIMARY_COLOR}`,
                        opacity: pauseButtonHover ? 0.9 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '1rem',
                        fontWeight: 600,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {isPaused ? <FaPlay /> : <FaPause />}
                      {isPaused ? 'Resume' : 'Pause'}
                    </button>
                  )}
                </div>

                {recordings.length > 0 && (
                  <div className="recordings-container" style={{ marginTop: '1.5rem' }}>
                    <div className="recordings-title" style={{ color: PRIMARY_COLOR }}>
                      Recorded Audio ({recordings.length})
                    </div>
                    <div ref={recordingsContainerRef} className="recordings-list">
                      {recordings.map((recording) => (
                        <div
                          key={recording.id}
                          className="recording-item"
                          style={{
                            backgroundColor: CARD_BG,
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(255,255,255,0.1)',
                            marginTop: '1rem',
                          }}
                        >
                          <div
                            data-waveform
                            style={{
                              marginBottom: '0.5rem',
                              minHeight: '60px',
                              width: '100%',
                              backgroundColor: BACKGROUND_DARK,
                              borderRadius: 'var(--border-radius-sm)',
                            }}
                          />
                          <div className="recording-controls">
                            <button data-play-button className="play-button">
                              Play
                            </button>
                            <button className="transcribe-button">Transcribe</button>
                            <a href={recording.url} download={`recording-${recording.id}.webm`} className="download-link">
                              Download
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT: Reference Image */}
              <ImageReference mode="recording" position="right" width="30%" />
            </div>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <button
          type="submit"
          className={`submit-button ${loading || converting || !user || energyPoints < 10 ? 'disabled' : ''}`}
          disabled={loading || converting || !user || energyPoints < 10 || (mode === 'file' && !file) || (mode === 'youtube' && !youtubeUrl)}
          style={{
            marginTop: '1.5rem',
            width: '100%',
            padding: '1rem',
            background: `linear-gradient(90deg, ${PRIMARY_COLOR}, ${SECONDARY_COLOR})`,
            color: 'white',
            borderRadius: '1rem',
            fontWeight: 700,
          }}
        >
          {converting ? 'Converting...' : loading ? 'Processing...' : 'Transcribe (10 points)'}
        </button>

        {!user && (
          <p className="sign-in-prompt">
            Please <a href="/login">sign in</a> to use transcription
          </p>
        )}
      </form>
    </div>
  );
}
