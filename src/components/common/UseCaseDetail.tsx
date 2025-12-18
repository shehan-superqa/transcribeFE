import { Box, Typography, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TranscriptionExample from './TranscriptionExample';
import TTSExample from './TTSExample';
import './UseCaseDetail.css';

interface UseCaseDetailProps {
  title: string;
  description: string;
  category?: string;
  howItWorks?: string[];
  benefits?: string[];
  useCaseId?: string;
  subCategoryId?: string;
  onBack: () => void;
}

export default function UseCaseDetail({ 
  title, 
  description, 
  category, 
  howItWorks = [],
  benefits = [],
  useCaseId,
  subCategoryId,
  onBack 
}: UseCaseDetailProps) {
  // Show example for all use cases under "Transcribe" category
  const showTranscriptionExample = subCategoryId === 'transcribe';
  // Show example for all use cases under "Text-to-Speech" category
  const showTTSExample = subCategoryId === 'text-to-speech';
  return (
    <Box className="use-case-detail-container">
      {/* Fixed Header Section */}
      <Box className="use-case-detail-header">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{
            color: '#00c6ff',
            mb: 1,
            textTransform: 'none',
            padding: 0,
            minWidth: 'auto',
            '&:hover': {
              backgroundColor: 'transparent',
            },
          }}
        >
          Back to Use Cases
        </Button>

        {category && (
          <Typography
            variant="overline"
            sx={{
              color: '#00c6ff',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '1px',
              mb: 0.5,
              display: 'block',
            }}
          >
            {category}
          </Typography>
        )}

        <Typography
          variant="h5"
          sx={{
            color: '#f8fafc',
            fontWeight: 700,
            fontSize: '1.25rem',
            background: 'linear-gradient(135deg, #00c6ff 0%, #4A90E2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            mb: 1,
          }}
        >
          {title}
        </Typography>
      </Box>

      {/* Scrollable Content Section */}
      <Box className="use-case-detail-content">
        <Paper
          sx={{
            p: 3,
            background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 50%,rgb(61, 66, 75) 100%)',
            border: '1px solid rgba(74, 144, 226, 0.3)',
            borderRadius: '16px',
          }}
        >
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

          {/* Example Section - For transcribe use cases */}
          {showTranscriptionExample && (
            <Box sx={{ mb: 4 }}>
              <TranscriptionExample useCaseId={useCaseId} />
            </Box>
          )}

          {/* Example Section - For text-to-speech use cases */}
          {showTTSExample && (
            <Box sx={{ mb: 4 }}>
              <TTSExample useCaseId={useCaseId} />
            </Box>
          )}

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
    </Box>
  );
}

