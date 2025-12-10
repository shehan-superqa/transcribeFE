import { Box, Typography, Card, CardContent, CardActionArea } from '@mui/material';
import './UseCasesPage.css';

interface UseCase {
  id: string;
  title: string;
  description: string;
  color: string;
}

const useCases: UseCase[] = [
  {
    id: 'contact-center',
    title: 'Contact Center Security',
    description: 'Protect customer PII and meet compliance standards with secure voice processing and data tokenization',
    color: '#4A90E2',
  },
  {
    id: 'remote-work',
    title: 'Remote Work Security',
    description: 'Secure virtual meetings and team collaborations with end-to-end encryption and voice biometrics',
    color: '#50E3C2',
  },
  {
    id: 'content-creation',
    title: 'Content Creation',
    description: 'Generate images, videos, and audio content from text prompts for marketing and creative projects',
    color: '#F5A623',
  },
  {
    id: 'media-transcription',
    title: 'Media Transcription',
    description: 'Convert audio and video files to text transcriptions for accessibility and content indexing',
    color: '#9B59B6',
  },
  {
    id: 'multilingual',
    title: 'Multilingual Content',
    description: 'Translate and dub videos and audio content to reach global audiences in multiple languages',
    color: '#E94B3C',
  },
  {
    id: 'live-broadcasting',
    title: 'Live Broadcasting',
    description: 'Real-time transcription and captioning for live streams, webinars, and online events',
    color: '#3498DB',
  },
  {
    id: 'advertisement',
    title: 'Advertisement Generation',
    description: 'Create compelling ad content with AI-generated images, videos, and voiceovers for marketing campaigns',
    color: '#E67E22',
  },
  {
    id: 'stock-footage',
    title: 'Stock Footage',
    description: 'Generate high-quality video content and images for stock footage libraries and creative projects',
    color: '#1ABC9C',
  },
  {
    id: 'live-mic-vad',
    title: 'Live Mic VAD',
    description: 'Real-time voice activity detection and transcription for meetings, interviews, and voice recordings',
    color: '#E74C3C',
  },
  {
    id: 'podcast',
    title: 'Podcast Production',
    description: 'Transcribe podcast episodes, generate show notes, and create multilingual versions for global audiences',
    color: '#8E44AD',
  },
  {
    id: 'e-learning',
    title: 'E-Learning Content',
    description: 'Create educational videos with automatic transcription, subtitles, and multilingual support for online courses',
    color: '#16A085',
  },
  {
    id: 'social-media',
    title: 'Social Media Content',
    description: 'Generate engaging video content, captions, and audio for social media platforms and digital marketing',
    color: '#F39C12',
  },
  {
    id: 'video-production',
    title: 'Video Production',
    description: 'Streamline video production workflows with automated transcription, dubbing, and subtitle generation',
    color: '#34495E',
  },
];

export default function UseCasesPage() {
  return (
    <Box className="use-cases-page">
      <Box className="use-cases-content">
        <Box className="use-cases-header">
          <Typography variant="h2" className="use-cases-title">
            Use Cases
          </Typography>
          <Typography variant="body1" className="use-cases-subtitle">
            Discover how our AI-powered tools can transform your workflow
          </Typography>
        </Box>

        <Box className="use-cases-grid">
          {useCases.map((useCase) => (
            <Card
              key={useCase.id}
              className="use-case-card"
              sx={{
                background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 50%,rgb(61, 66, 75) 100%)',
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
                sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
              >
                <CardContent sx={{ width: '100%', p: 2 }}>
                  <Typography variant="h6" className="use-case-title" sx={{ color: '#e0e0e0', mb: 1, fontWeight: 600, fontSize: '1.1rem', textAlign: 'center' }}>
                    {useCase.title}
                  </Typography>
                  <Typography variant="body2" className="use-case-description" sx={{ color: '#a0a0a0', lineHeight: 1.5, fontSize: '0.875rem' }}>
                    {useCase.description}
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

