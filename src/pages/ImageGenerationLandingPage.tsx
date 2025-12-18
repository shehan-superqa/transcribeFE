import { useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, CardActionArea } from '@mui/material';
import './ImageGenerationLandingPage.css';

interface ImageTool {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  color: string;
}

const imageTools: ImageTool[] = [
  {
    id: 'generate',
    title: 'Image Generation',
    description: 'Generate high-quality images from text prompts using advanced AI models',
    icon: '🎨',
    path: '/images/generate',
    color: '#4A90E2',
  },
  {
    id: 'edit',
    title: 'Image Editing',
    description: 'Transform existing images with precision using AI-powered editing prompts',
    icon: '✏️',
    path: '/images/edit',
    color: '#9B59B6',
  },
  {
    id: 'caption',
    title: 'Image Captioning',
    description: 'Generate detailed descriptions and captions for your images using AI',
    icon: '📝',
    path: '/images/caption',
    color: '#50E3C2',
  },
  {
    id: 'train',
    title: 'Image Training (LoRA)',
    description: 'Train custom AI models using your own images for personalized generation',
    icon: '🎓',
    path: '/images/train',
    color: '#F5A623',
  },
];

export default function ImageGenerationLandingPage() {
  const navigate = useNavigate();

  return (
    <Box className="image-generation-landing">
      <Box className="landing-content">
        <Box className="landing-header">
          <Typography variant="h2" className="landing-title">
            Image Generation Tools
          </Typography>
          <Typography variant="body1" className="landing-subtitle">
            Explore our powerful AI-powered image tools to create, analyze, and customize images
          </Typography>
        </Box>

        <Box className="tools-grid">
        {imageTools.map((tool) => (
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

