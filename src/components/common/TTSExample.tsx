import { useState, useRef } from 'react';
import { Box, Typography, Paper, IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import testBusinessAudio from '../../assets/testbusiness.mp3';
import testCustomerAudio from '../../assets/testcustomer.mp3';
import testAnnouncementAudio from '../../assets/testannouncement.mp3';
import '../../css/components/common/TTSExample.css';

interface TTSExampleProps {
  inputText?: string;
  audioUrl?: string;
  useCaseId?: string;
}

// Default input text for business presentations
const defaultBusinessPresentationText = `Welcome to our quarterly business review. Today, I'll be presenting our company's performance for Q4 2025, highlighting key achievements, challenges, and our strategic roadmap for the upcoming year.

Let me start with our financial highlights. We've achieved a 25% increase in revenue compared to the previous quarter, reaching $2.5 million in total sales. Our customer base has grown by 15%, and we've successfully launched three new product lines.

Moving to our operational metrics, we've improved customer satisfaction scores by 20% and reduced response times by 30%. Our team has completed all major projects on schedule, and we've expanded our operations to two new markets.

Looking ahead, our focus for the next quarter will be on digital transformation initiatives, expanding our market presence, and continuing to deliver exceptional value to our customers. We're confident that with our dedicated team and strategic vision, we'll continue to achieve outstanding results.

Thank you for your attention. I'm now open to questions and discussion.`;

// Input text for customer voice messages
const customerVoiceMessageText = `Hello! This is a confirmation message from BrightNest Store. We've successfully received your order number BN-45827. Your items will be shipped within 2–3 business days, and you'll receive a tracking number via email once your order ships.

Thank you for choosing us`;

// Input text for audio announcements
const audioAnnouncementText = `Ladies and gentlemen, may we have your attention please. Our facility will be closing in 30 minutes. Kindly complete your transactions and proceed toward the exits. We appreciate your visit and look forward to welcoming you again soon. Thank you.`;

export default function TTSExample({ 
  inputText,
  audioUrl,
  useCaseId
}: TTSExampleProps) {
  // Determine audio file and input text based on use case ID
  let finalAudioUrl: string;
  let finalInputText: string;

  if (useCaseId === 'business-presentations') {
    finalAudioUrl = audioUrl || testBusinessAudio;
    finalInputText = inputText || defaultBusinessPresentationText;
  } else if (useCaseId === 'voice-messages-customers') {
    finalAudioUrl = audioUrl || testCustomerAudio;
    finalInputText = inputText || customerVoiceMessageText;
  } else if (useCaseId === 'audio-announcements') {
    finalAudioUrl = audioUrl || testAnnouncementAudio;
    finalInputText = inputText || audioAnnouncementText;
  } else {
    // Default to business presentation
    finalAudioUrl = audioUrl || testBusinessAudio;
    finalInputText = inputText || defaultBusinessPresentationText;
  }

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (!duration) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Box className="tts-example-container">
      <Typography
        variant="h6"
        sx={{
          color: '#cbd5e1',
          fontWeight: 600,
          mb: 2,
        }}
      >
        Example
      </Typography>
      
      <Box className="tts-example-content">
        {/* Left Side - Input Text */}
        <Paper
          className="tts-example-input"
          sx={{
            p: 3,
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: '1px solid rgba(74, 144, 226, 0.3)',
            borderRadius: '12px',
            minHeight: '300px',
            maxHeight: '500px',
            overflowY: 'auto',
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              color: '#94a3b8',
              mb: 2,
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            Input Text
          </Typography>
          
          <Typography
            variant="body1"
            sx={{
              color: '#e2e8f0',
              lineHeight: 1.8,
              fontSize: '1rem',
              whiteSpace: 'pre-wrap',
            }}
          >
            {finalInputText}
          </Typography>
        </Paper>

        {/* Right Side - Audio Player */}
        <Paper
          className="tts-example-player"
          sx={{
            p: 3,
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: '1px solid rgba(74, 144, 226, 0.3)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '300px',
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              color: '#94a3b8',
              mb: 2,
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            Generated Audio
          </Typography>
          
          <Box sx={{ width: '100%', maxWidth: '400px' }}>
            <audio
              ref={audioRef}
              src={finalAudioUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
            />
            
            {/* Play/Pause Button */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <IconButton
                onClick={handlePlayPause}
                sx={{
                  width: 64,
                  height: 64,
                  backgroundColor: '#00c6ff',
                  color: '#000',
                  '&:hover': {
                    backgroundColor: '#00b0e6',
                  },
                }}
              >
                {isPlaying ? <PauseIcon sx={{ fontSize: 32 }} /> : <PlayArrowIcon sx={{ fontSize: 32 }} />}
              </IconButton>
            </Box>

            {/* Progress Bar */}
            <Box sx={{ width: '100%', mb: 1 }}>
              <Box
                sx={{
                  width: '100%',
                  height: 4,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    width: `${progress}%`,
                    height: '100%',
                    backgroundColor: '#00c6ff',
                    transition: 'width 0.1s linear',
                  }}
                />
              </Box>
            </Box>

            {/* Time Display */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.875rem' }}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

