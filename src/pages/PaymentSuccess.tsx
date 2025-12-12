import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getEnergyPointsBalance } from '../lib/api/paymentApi';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Box,
  Typography,
  Container,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

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

export default function PaymentSuccess() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasedPoints, setPurchasedPoints] = useState<number | null>(null);

  const orderId = searchParams.get('order_id');

  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }

    const fetchUpdatedBalance = async () => {
      try {
        setLoading(true);
        setError(null);

        // Refresh user data to get updated energy points
        await refreshUser();

        // Fetch balance from payment API
        const response = await getEnergyPointsBalance();
        if (response.success && response.data) {
          setBalance(response.data.energyPoints);

          // If we have user's previous balance, calculate purchased points
          const previousBalance = user.energyPoints ?? 0;
          const newBalance = response.data.energyPoints;
          if (newBalance > previousBalance) {
            setPurchasedPoints(newBalance - previousBalance);
          }
        } else {
          // Fallback to user object
          setBalance(user.energyPoints ?? 0);
        }
      } catch (err: any) {
        console.error('Error fetching balance:', err);
        setError('Failed to fetch updated balance');
        // Fallback to user object
        setBalance(user.energyPoints ?? 0);
      } finally {
        setLoading(false);
      }
    };

    fetchUpdatedBalance();
  }, [user, navigate]);

  const handleContinue = () => {
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
              {loading ? (
                <>
                  <CircularProgress sx={{ mb: 2, color: '#00c6ff' }} />
                  <Typography variant="h6" sx={{ color: '#a0a0a0' }}>
                    Verifying your payment...
                  </Typography>
                </>
              ) : error ? (
                <>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                  <Typography variant="body1" sx={{ mb: 3, color: '#a0a0a0' }}>
                    Your payment was successful, but we couldn't fetch your updated balance. Please check your account
                    or contact support if needed.
                  </Typography>
                  {orderId && (
                    <Typography variant="body2" sx={{ mb: 2, color: '#666666' }}>
                      Order ID: {orderId}
                    </Typography>
                  )}
                  <Button
                    variant="contained"
                    onClick={handleContinue}
                    sx={{
                      backgroundColor: '#00c6ff',
                      color: '#000',
                      '&:hover': {
                        backgroundColor: '#00b8e6',
                      },
                    }}
                  >
                    Continue to Dashboard
                  </Button>
                </>
              ) : (
                <>
                  <CheckCircleIcon
                    sx={{
                      fontSize: 80,
                      color: '#4caf50',
                      mb: 2,
                    }}
                  />
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      mb: 1,
                      background: 'linear-gradient(90deg, #4caf50, #00c6ff)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Payment Successful!
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3, color: '#a0a0a0' }}>
                    Thank you for your purchase. Your energy points have been added to your account.
                  </Typography>

                  {purchasedPoints && (
                    <Box
                      sx={{
                        backgroundColor: '#0d0d0d',
                        borderRadius: '8px',
                        padding: 2,
                        mb: 3,
                        border: '1px solid #333333',
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#a0a0a0', mb: 1 }}>
                        Points Added
                      </Typography>
                      <Typography
                        variant="h3"
                        sx={{
                          fontWeight: 700,
                          color: '#00c6ff',
                          mb: 1,
                        }}
                      >
                        +{purchasedPoints.toLocaleString()}
                      </Typography>
                    </Box>
                  )}

                  {balance !== null && (
                    <Box
                      sx={{
                        backgroundColor: '#0d0d0d',
                        borderRadius: '8px',
                        padding: 2,
                        mb: 3,
                        border: '1px solid #333333',
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#a0a0a0', mb: 1 }}>
                        Current Balance
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 700,
                          color: '#ffffff',
                        }}
                      >
                        ⚡ {balance.toLocaleString()} Energy Points
                      </Typography>
                    </Box>
                  )}

                  {orderId && (
                    <Typography variant="body2" sx={{ mb: 3, color: '#666666' }}>
                      Order ID: {orderId}
                    </Typography>
                  )}

                  <Button
                    variant="contained"
                    onClick={handleContinue}
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
                    Continue to Dashboard
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

