import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { InputMode, TranscriptionToolProps, Recording } from './types';
import { formatTime } from './utils';
import { useEnergyPoints } from './useEnergyPoints';
import { useTranscription } from './useTranscription';
import { useMicrophonePreview } from './useMicrophonePreview';
import { useRecording } from './useRecording';
import { useWaveforms } from './useWaveforms';

import './TranscriptionTool.css';

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

  return (
    <div className="transcription-tool-container">
      <div className="energy-badge">
        <span className="energy-icon">⚡</span>
        <span className="energy-text">{energyPoints} Energy Points</span>
      </div>

      <div className="mode-selector">
        <button
          type="button"
          className={mode === 'file' ? 'active' : ''}
          onClick={() => setMode('file')}
        >
          Upload File
        </button>
        <button
          type="button"
          className={mode === 'youtube' ? 'active' : ''}
          onClick={() => setMode('youtube')}
        >
          YouTube Link
        </button>
        <button
          type="button"
          className={mode === 'recording' ? 'active' : ''}
          onClick={() => setMode('recording')}
        >
          Record Audio
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === 'file' && (
          <div className="input-group">
            <label>
              <input
                type="file"
                accept="audio/*,video/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                hidden
              />
              <div className="file-upload-box">
                <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="upload-icon">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="upload-text">{file ? file.name : 'Click to upload or drag and drop'}</p>
                <p className="upload-subtext">MP3, WAV, M4A, or video files</p>
              </div>
            </label>
          </div>
        )}

        {mode === 'youtube' && (
          <div className="input-group">
            <label>YouTube URL</label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              disabled={converting}
            />
            {converting && conversionProgress && (
              <div className="conversion-progress">
                <div className="progress-bar-container">
                  <div
                    className="progress-bar"
                    style={{ width: `${conversionProgress.progress}%` }}
                  />
                </div>
                <div className="progress-text">
                  {conversionProgress.stage === 'loading' && 'Loading FFmpeg...'}
                  {conversionProgress.stage === 'fetching' && 'Fetching video...'}
                  {conversionProgress.stage === 'converting' && 'Converting to M4A...'}
                  {conversionProgress.stage === 'complete' && 'Conversion complete!'}
                  <span className="progress-percent"> ({Math.round(conversionProgress.progress)}%)</span>
                </div>
              </div>
            )}
          </div>
        )}

        {mode === 'recording' && (
          <div className="recording-section">
            <div className="recording-display">
              <div className={`recording-indicator ${isRecording ? 'active' : ''}`}></div>
              <span className="recording-time">{formatTime(recordingTime)}</span>
            </div>
            <div className="waveform-container">
              <div className="waveform-label">Total Waveform</div>
              <div ref={totalWaveformRef} className="total-waveform-canvas" />
            </div>
            <canvas ref={canvasRef} className="waveform-canvas" />

            <div className="recording-buttons">
              <button
                type="button"
                className={`record-button ${isRecording ? 'active' : ''}`}
                onClick={isRecording ? stopRecording : handleStartRecording}
              >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </button>
              {isRecording && (
                <button
                  type="button"
                  className="pause-button"
                  onClick={isPaused ? resumeRecording : pauseRecording}
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
              )}
            </div>

            {recordings.length > 0 && (
              <div className="recordings-container">
                <div className="recordings-title">Recorded Audio ({recordings.length})</div>
                <div ref={recordingsContainerRef} className="recordings-list">
                  {recordings.map((recording) => (
                    <div key={recording.id} className="recording-item">
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
                      <div className="recording-controls">
                        <button data-play-button className="play-button">Play</button>
                        <button className="transcribe-button">Transcribe</button>
                        <a href={recording.url} download={`recording-${recording.id}.webm`} className="download-link">Download</a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {error && <div className="error">{error}</div>}

        <button
          type="submit"
          className={`submit-button ${(loading || converting || !user || energyPoints < 10) ? 'disabled' : ''}`}
          disabled={loading || converting || !user || energyPoints < 10}
        >
          {converting 
            ? 'Converting...' 
            : loading 
            ? 'Processing...' 
            : `Transcribe (10 points)`}
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
