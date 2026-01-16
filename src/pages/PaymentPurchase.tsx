import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { initiatePurchase, PurchaseRequest } from '../lib/api/paymentApi';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTheme } from '../contexts/ThemeContext';
import {
  Box,
  Typography,
  Container,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';

const PREDEFINED_AMOUNTS = [500, 1000, 2000, 5000];

export default function PaymentPurchase() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [selectedAmount, setSelectedAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [useCustomAmount, setUseCustomAmount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Optional user info fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Sri Lanka');

  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
    }
  }, [user, navigate]);

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setUseCustomAmount(false);
    setCustomAmount('');
    setError(null);
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setUseCustomAmount(true);
    setError(null);
  };

  const validateAmount = (amount: number): boolean => {
    return amount > 0 && Number.isFinite(amount);
  };

  const handlePurchase = async () => {
    setError(null);

    let purchaseAmount: number;
    if (useCustomAmount) {
      const parsed = parseFloat(customAmount);
      if (!validateAmount(parsed)) {
        setError('Please enter a valid amount greater than 0');
        return;
      }
      purchaseAmount = parsed;
    } else {
      purchaseAmount = selectedAmount;
    }

    if (!validateAmount(purchaseAmount)) {
      setError('Please select a valid purchase amount');
      return;
    }

    setLoading(true);

    try {
      const purchaseData: PurchaseRequest = {
        amount: purchaseAmount,
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone }),
        ...(address && { address }),
        ...(city && { city }),
        ...(country && { country }),
      };

      const response = await initiatePurchase(purchaseData);

      if (response.success && response.data.paymentUrl) {
        // Redirect to PayHere payment gateway
        window.location.href = response.data.paymentUrl;
      } else {
        setError('Failed to initiate purchase. Please try again.');
      }
    } catch (err: any) {
      console.error('Purchase error:', err);
      setError(err.message || 'Failed to initiate purchase. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentAmount = useCustomAmount ? parseFloat(customAmount) || 0 : selectedAmount;
  const pointsEquivalent = currentAmount; // 1 LKR = 1 energy point

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: 'calc(100vh - 80px)',
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
          paddingTop: '2rem',
          paddingBottom: '2rem',
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 1,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.mode === 'dark' ? '#ffffff' : theme.palette.text.primary})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Purchase Energy Points
            </Typography>
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
              Buy energy points to use our transcription and video generation tools
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Amount Selection */}
            <Grid item xs={12}>
              <Card sx={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Select Purchase Amount
                  </Typography>

                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {PREDEFINED_AMOUNTS.map((amount) => (
                      <Grid item xs={6} sm={3} key={amount}>
                        <Button
                          fullWidth
                          variant={selectedAmount === amount && !useCustomAmount ? 'contained' : 'outlined'}
                          onClick={() => handleAmountSelect(amount)}
                          disabled={loading}
                          sx={{
                            py: 1.5,
                            borderColor: theme.palette.divider,
                            color: selectedAmount === amount && !useCustomAmount 
                              ? (theme.palette.mode === 'dark' ? '#000000' : '#ffffff')
                              : theme.palette.text.primary,
                            backgroundColor:
                              selectedAmount === amount && !useCustomAmount ? theme.palette.primary.main : 'transparent',
                            '&:hover': {
                              borderColor: theme.palette.primary.main,
                              backgroundColor:
                                selectedAmount === amount && !useCustomAmount 
                                  ? theme.palette.primary.dark 
                                  : (theme.palette.mode === 'dark' ? 'rgba(0, 198, 255, 0.1)' : 'rgba(37, 99, 235, 0.1)'),
                            },
                          }}
                        >
                          {amount.toLocaleString()} LKR
                        </Button>
                      </Grid>
                    ))}
                  </Grid>

                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    Or enter custom amount:
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    placeholder="Enter amount in LKR"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    disabled={loading}
                    inputProps={{ min: 1, step: 1 }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: theme.palette.text.primary,
                        '& fieldset': {
                          borderColor: theme.palette.divider,
                        },
                        '&:hover fieldset': {
                          borderColor: theme.palette.primary.main,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: theme.palette.primary.main,
                        },
                      },
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Points Equivalent Display */}
            <Grid item xs={12}>
              <Card sx={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }}>
                <CardContent>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                      You will receive
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        color: theme.palette.primary.main,
                        mb: 1,
                      }}
                    >
                      {pointsEquivalent.toLocaleString()} Energy Points
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      for {currentAmount.toLocaleString()} LKR
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Optional User Information */}
            <Grid item xs={12}>
              <Card sx={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Optional Information
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                    Provide additional details to speed up your checkout process
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        disabled={loading}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: theme.palette.text.primary,
                            '& fieldset': {
                              borderColor: theme.palette.divider,
                            },
                            '&:hover fieldset': {
                              borderColor: theme.palette.primary.main,
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: theme.palette.primary.main,
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: theme.palette.text.secondary,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        disabled={loading}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: theme.palette.text.primary,
                            '& fieldset': {
                              borderColor: theme.palette.divider,
                            },
                            '&:hover fieldset': {
                              borderColor: theme.palette.primary.main,
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: theme.palette.primary.main,
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: theme.palette.text.secondary,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={loading}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: theme.palette.text.primary,
                            '& fieldset': {
                              borderColor: theme.palette.divider,
                            },
                            '&:hover fieldset': {
                              borderColor: theme.palette.primary.main,
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: theme.palette.primary.main,
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: theme.palette.text.secondary,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="City"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        disabled={loading}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: theme.palette.text.primary,
                            '& fieldset': {
                              borderColor: theme.palette.divider,
                            },
                            '&:hover fieldset': {
                              borderColor: theme.palette.primary.main,
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: theme.palette.primary.main,
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: theme.palette.text.secondary,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        disabled={loading}
                        multiline
                        rows={2}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: theme.palette.text.primary,
                            '& fieldset': {
                              borderColor: theme.palette.divider,
                            },
                            '&:hover fieldset': {
                              borderColor: theme.palette.primary.main,
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: theme.palette.primary.main,
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: theme.palette.text.secondary,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        disabled={loading}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: theme.palette.text.primary,
                            '& fieldset': {
                              borderColor: theme.palette.divider,
                            },
                            '&:hover fieldset': {
                              borderColor: theme.palette.primary.main,
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: theme.palette.primary.main,
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: theme.palette.text.secondary,
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Purchase Button */}
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                onClick={handlePurchase}
                disabled={loading || !validateAmount(currentAmount)}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.mode === 'dark' ? '#000000' : '#ffffff',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                  '&:disabled': {
                    backgroundColor: theme.palette.action.disabledBackground,
                    color: theme.palette.action.disabled,
                  },
                }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1, color: theme.palette.mode === 'dark' ? '#000000' : '#ffffff' }} />
                    Processing...
                  </>
                ) : (
                  `Purchase ${pointsEquivalent.toLocaleString()} Points for ${currentAmount.toLocaleString()} LKR`
                )}
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
}



















