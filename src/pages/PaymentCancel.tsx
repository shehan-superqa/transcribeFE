import { useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Box,
  Typography,
  Container,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00c6ff',
    },
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a',
    },
    text: {
      primary: '#e0e0e0',
      secondary: '#a0a0a0',
    },
  },
});

export default function PaymentCancel() {
  const navigate = useNavigate();

  const handleTryAgain = () => {
    navigate('/payment/purchase');
  };

  const handleGoToDashboard = () => {
    navigate('/voice/transcribe');
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: 'calc(100vh - 80px)',
          backgroundColor: '#0a0a0a',
          color: '#ffffff',
          paddingTop: '4rem',
          paddingBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Container maxWidth="sm">
          <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333333' }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <CancelIcon
                sx={{
                  fontSize: 80,
                  color: '#ff9800',
                  mb: 2,
                }}
              />
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  color: '#ffffff',
                }}
              >
                Payment Cancelled
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: '#a0a0a0' }}>
                Your payment was cancelled and no charges were made to your account.
              </Typography>

              <Box
                sx={{
                  backgroundColor: '#0d0d0d',
                  borderRadius: '8px',
                  padding: 2,
                  mb: 3,
                  border: '1px solid #333333',
                }}
              >
                <Typography variant="body2" sx={{ color: '#a0a0a0' }}>
                  No energy points were deducted from your account. You can try purchasing again at any time.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Button
                  variant="contained"
                  onClick={handleTryAgain}
                  fullWidth
                  sx={{
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    backgroundColor: '#00c6ff',
                    color: '#000',
                    '&:hover': {
                      backgroundColor: '#00b8e6',
                    },
                  }}
                >
                  Try Again
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleGoToDashboard}
                  fullWidth
                  sx={{
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderColor: '#333333',
                    color: '#ffffff',
                    '&:hover': {
                      borderColor: '#00c6ff',
                      backgroundColor: 'rgba(0, 198, 255, 0.1)',
                    },
                  }}
                >
                  Go to Dashboard
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </ThemeProvider>
  );
}


