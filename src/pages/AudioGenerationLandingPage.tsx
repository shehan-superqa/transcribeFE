import { useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, CardActionArea } from '@mui/material';
import './AudioGenerationLandingPage.css';

interface AudioTool {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  color: string;
}

const audioTools: AudioTool[] = [
  {
    id: 'transcribe',
    title: 'Transcribe (Single & Batch)',
    description: 'Convert audio files to accurate text transcriptions instantly',
    icon: '🎤',
    path: '/voice/transcribe',
    color: '#4A90E2',
  },
  {
    id: 'live',
    title: 'Live Mic VAD',
    description: 'Real-time voice activity detection and transcription',
    icon: '🔴',
    path: '/voice/live',
    color: '#E94B3C',
  },
  {
    id: 'tts',
    title: 'Text-to-Speech',
    description: 'Convert text to natural-sounding speech with multiple voices',
    icon: '🔊',
    path: '/voice/tts',
    color: '#50E3C2',
  },
  {
    id: 'trainer',
    title: 'Trainer',
    description: 'Train custom language models for improved transcription accuracy',
    icon: '🎓',
    path: '/voice/trainer',
    color: '#F5A623',
  },
  {
    id: 'audio-translator',
    title: 'Audio Translator',
    description: 'Translate audio content to different languages automatically',
    icon: '🌐',
    path: '/voice/translator',
    color: '#9B59B6',
  },
];

export default function AudioGenerationLandingPage() {
  const navigate = useNavigate();

  return (
    <Box className="audio-generation-landing">
      <Box className="landing-content">
        <Box className="landing-header">
          <Typography variant="h2" className="landing-title">
            Audio Generation Tools
          </Typography>
          <Typography variant="body1" className="landing-subtitle">
            Explore our powerful AI-powered audio tools to transcribe, translate, and generate audio content
          </Typography>
        </Box>

        <Box className="tools-grid">
          {audioTools.map((tool) => (
            <Card
              key={tool.id}
              className="tool-card"
              onClick={() => navigate(tool.path)}
              sx={{
                background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #4a5568 100%)',
                border: '1px solid rgba(74, 144, 226, 0.3)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(74, 144, 226, 0.5)',
                  borderColor: 'rgba(74, 144, 226, 0.6)',
                  background: 'linear-gradient(135deg, #0a0a0a 0%, #1e2a3e 50%, #5a6578 100%)',
                },
              }}
            >
              <CardActionArea
                onClick={(e) => {
                  e.preventDefault();
                  navigate(tool.path);
                }}
                sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
              >
                <CardContent sx={{ width: '100%', p: 2 }}>
                  <Typography variant="h6" className="tool-title" sx={{ color: '#e0e0e0', mb: 1, fontWeight: 600, fontSize: '1.1rem' }}>
                    {tool.title}
                  </Typography>
                  <Typography variant="body2" className="tool-description" sx={{ color: '#a0a0a0', lineHeight: 1.5, fontSize: '0.875rem' }}>
                    {tool.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

