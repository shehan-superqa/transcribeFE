import { Box, Typography, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import './UseCaseDetail.css';

interface UseCaseDetailProps {
  title: string;
  description: string;
  category?: string;
  howItWorks?: string[];
  benefits?: string[];
  onBack: () => void;
}

export default function UseCaseDetail({ 
  title, 
  description, 
  category, 
  howItWorks = [],
  benefits = [],
  onBack 
}: UseCaseDetailProps) {
  return (
    <Box className="use-case-detail-container">
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={onBack}
        sx={{
          color: '#00c6ff',
          mb: 3,
          textTransform: 'none',
          '&:hover': {
            backgroundColor: 'rgba(0, 198, 255, 0.1)',
          },
        }}
      >
        Back to Use Cases
      </Button>

      <Paper
        sx={{
          p: 4,
          background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 50%,rgb(61, 66, 75) 100%)',
          border: '1px solid rgba(74, 144, 226, 0.3)',
          borderRadius: '16px',
        }}
      >
        {category && (
          <Typography
            variant="overline"
            sx={{
              color: '#00c6ff',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '1px',
              mb: 2,
              display: 'block',
            }}
          >
            {category}
          </Typography>
        )}

        <Typography
          variant="h3"
          sx={{
            color: '#f8fafc',
            fontWeight: 700,
            mb: 3,
            background: 'linear-gradient(135deg, #00c6ff 0%, #4A90E2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {title}
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{
              color: '#cbd5e1',
              fontWeight: 600,
              mb: 2,
            }}
          >
            Overview
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#94a3b8',
              lineHeight: 1.8,
              fontSize: '1.1rem',
            }}
          >
            {description}
          </Typography>
        </Box>

        {howItWorks.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              sx={{
                color: '#cbd5e1',
                fontWeight: 600,
                mb: 2,
              }}
            >
              How It Works
            </Typography>
            <Box
              component="ul"
              sx={{
                color: '#94a3b8',
                lineHeight: 2,
                fontSize: '1rem',
                pl: 3,
                '& li': {
                  mb: 1,
                },
              }}
            >
              {howItWorks.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </Box>
          </Box>
        )}

        {benefits.length > 0 && (
          <Box>
            <Typography
              variant="h6"
              sx={{
                color: '#cbd5e1',
                fontWeight: 600,
                mb: 2,
              }}
            >
              Benefits
            </Typography>
            <Box
              component="ul"
              sx={{
                color: '#94a3b8',
                lineHeight: 2,
                fontSize: '1rem',
                pl: 3,
                '& li': {
                  mb: 1,
                },
              }}
            >
              {benefits.map((benefit, index) => (
                <li key={index}>{benefit}</li>
              ))}
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

