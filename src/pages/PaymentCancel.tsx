import { useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTheme } from '../contexts/ThemeContext';
import {
  Box,
  Typography,
  Container,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';

export default function PaymentCancel() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleTryAgain = () => {
    navigate('/payment/purchase');
  };

  const handleGoToDashboard = () => {
    navigate('/voice/transcribe');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: 'calc(100vh - 80px)',
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
          paddingTop: '4rem',
          paddingBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Container maxWidth="sm">
          <Card sx={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <CancelIcon
                sx={{
                  fontSize: 80,
                  color: theme.palette.warning.main,
                  mb: 2,
                }}
              />
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  color: theme.palette.text.primary,
                }}
              >
                Payment Cancelled
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: theme.palette.text.secondary }}>
                Your payment was cancelled and no charges were made to your account.
              </Typography>

              <Box
                sx={{
                  backgroundColor: theme.palette.background.default,
                  borderRadius: '8px',
                  padding: 2,
                  mb: 3,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
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
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.mode === 'dark' ? '#000000' : '#ffffff',
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
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
                    borderColor: theme.palette.divider,
                    color: theme.palette.text.primary,
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 198, 255, 0.1)' : 'rgba(37, 99, 235, 0.1)',
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








