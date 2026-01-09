import { useState, useRef } from 'react';
import { Box, Typography, Paper, IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import testAudio from '../../assets/testaudio.mp3';
import testAudioConference from '../../assets/testaudioconference.mp3';
import testAudioLec from '../../assets/testaudiolec.mp3';
import '../../css/components/common/TranscriptionExample.css';

interface TranscriptionExampleProps {
  audioUrl?: string;
  transcriptionText?: string;
  useCaseId?: string;
}

// Default transcription text for meeting notes
const defaultMeetingTranscription = `Thank you very much. This is the RM Springfield meeting agenda for November the 20th of 2025, starting at exactly 6pm. I'm Mayor Patrick Tarian and all of Council is present in person and I'll identify them. In descending order is Deputy Mayor Glenn Fuel, Councillor Andy Kaczynski, Councillor Mark Miller and Councillor Melinda Warren. We'll go to the approval of the agenda please. If I can get a mover and a seconder for that please. Councillors Fuel and Warren.`;

// Transcription text for conference calls
const conferenceCallTranscription = `Hello everyone. My name is Tom. Today I have with me two of my awesome colleagues, and we can start by getting them introduced. Sameer. Hey everyone. This is Sameer, and I help in articulating the value provided by our open platform and the plethora of use cases that can be supported. Let's go to the next one. Hi everyone. My name is Will, and I talk about how do we use the APIs, how do we integrate them, how do we deploy them go live in our production applications.`;

// Transcription text for lecture recordings
const lectureRecordingTranscription = `Okay, welcome to the last class of the semester. What we have upcoming is the final project, as you know, and you also have the final, which I will go, and I'll go over what's on that today. As of course, this has been an unprecedented semester, partly online and partly in class. So I've tried to make sure that the final is pretty reasonable, but I will go over it. What I want to do now is cover the quiz, which threw a lot of people. So I see there's a... Not a very clear understanding of how reinforcement learning works. And I'll go over the questions and then go through the reinforcement learning.`;

export default function TranscriptionExample({ 
  audioUrl,
  transcriptionText,
  useCaseId
}: TranscriptionExampleProps) {
  // Determine audio file and transcription text based on use case ID
  let finalAudioUrl: string;
  let finalTranscriptionText: string;

  if (useCaseId === 'conference-calls') {
    finalAudioUrl = audioUrl || testAudioConference;
    finalTranscriptionText = transcriptionText || conferenceCallTranscription;
  } else if (useCaseId === 'lecture-recordings') {
    finalAudioUrl = audioUrl || testAudioLec;
    finalTranscriptionText = transcriptionText || lectureRecordingTranscription;
  } else {
    // Default to meeting notes
    finalAudioUrl = audioUrl || testAudio;
    finalTranscriptionText = transcriptionText || defaultMeetingTranscription;
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
    <Box className="transcription-example-container">
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
      
      <Box className="transcription-example-content">
        {/* Left Side - Audio Player */}
        <Paper
          className="transcription-example-player"
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
            Input Audio
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

        {/* Right Side - Transcription Result */}
        <Paper
          className="transcription-example-result"
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
            Transcribed Text
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
            {finalTranscriptionText}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}


