import { useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, CardActionArea } from '@mui/material';
import './VideoGenerationLandingPage.css';

interface VideoTool {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  color: string;
}

const videoTools: VideoTool[] = [
  {
    id: 'text-to-video',
    title: 'Text to Video',
    description: 'Generate videos from text descriptions using advanced AI models',
    icon: '🎬',
    path: '/video/text-to-video',
    color: '#4A90E2',
  },
  {
    id: 'ads',
    title: 'Video Ads Generator',
    description: 'Create high-converting video ads with AI-powered script generation and video creation',
    icon: '📺',
    path: '/video/ads',
    color: '#E67E22',
  },
  {
    id: 'to-text',
    title: 'Video to Text',
    description: 'Extract text and transcriptions from video files',
    icon: '📝',
    path: '/video/to-text',
    color: '#50E3C2',
  },
  {
    id: 'dubber',
    title: 'Video Dubber',
    description: 'Dub videos with new audio in different languages',
    icon: '🎙️',
    path: '/video/dubber',
    color: '#F5A623',
  },
];

export default function VideoGenerationLandingPage() {
  const navigate = useNavigate();

  return (
    <Box className="video-generation-landing">
      <Box className="landing-content">
        <Box className="landing-header">
          <Typography variant="h2" className="landing-title">
            Video Generation Tools
          </Typography>
          <Typography variant="body1" className="landing-subtitle">
            Explore our powerful AI-powered video tools to create, translate, and enhance videos
          </Typography>
        </Box>

        <Box className="tools-grid">
          {videoTools.map((tool) => (
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

