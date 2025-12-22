import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTheme } from '../contexts/ThemeContext';
import { Box, Typography, Container, Grid } from '@mui/material';
import PricingTabs from '../components/pricing/PricingTabs';
import PricingCard from '../components/pricing/PricingCard';
import BillingToggle from '../components/pricing/BillingToggle';
import { pricingData, type ServiceType, type BillingPeriod } from '../data/pricingData';

export default function Pricing() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [currentService, setCurrentService] = useState<ServiceType>('transcription');
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleSubscribe = (tierId: string) => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
    
    const service = pricingData[currentService];
    const tier = service.tiers.find(t => t.id === tierId);
    
    if (tier?.id === 'enterprise') {
      // Handle enterprise contact
      alert('Please contact us for enterprise pricing!');
      return;
    }
    
    // TODO: Implement actual subscription logic
    alert(`Subscription feature coming soon! You selected the ${tier?.name} plan for ${currentService}.`);
  };

  const currentPricing = pricingData[currentService];
  const serviceTitle = currentService === 'transcription' ? 'Transcription'
    : currentService === 'subtitle' ? 'Subtitle'
    : currentService === 'voiceover' ? 'Voiceover'
    : currentService === 'realtime' ? 'Real-Time'
    : 'Video Generation';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: 'calc(100vh - 80px)',
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
          paddingTop: '1rem',
          paddingBottom: '2rem',
        }}
      >
        <Container maxWidth="xl">
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography
              variant="h5"
              sx={{
                fontSize: { xs: '1.25rem', md: '1.75rem' },
                fontWeight: 700,
                mb: 0.25,
                background: `linear-gradient(90deg, ${currentPricing.accentColor}, ${theme.palette.mode === 'dark' ? '#ffffff' : theme.palette.text.primary})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              VoiceScribe {serviceTitle} Pricing
            </Typography>
          </Box>

          {/* Service Tabs */}
          <PricingTabs
            currentService={currentService}
            onServiceChange={setCurrentService}
          />

          {/* Billing Toggle */}
          <BillingToggle
            billingPeriod={billingPeriod}
            onBillingChange={setBillingPeriod}
          />

          {/* Pricing Cards */}
          <Grid
            container
            spacing={{ xs: 1, sm: 1.5 }}
            sx={{
              justifyContent: 'center',
              mb: 3,
              maxWidth: '100%',
            }}
          >
            {currentPricing.tiers.map((tier) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={false}
                lg={2.4}
                xl={2.4}
                key={tier.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  minWidth: 0,
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <PricingCard
                    tier={tier}
                    billingPeriod={billingPeriod}
                    accentColor={currentPricing.accentColor}
                    onSubscribe={handleSubscribe}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Additional Info Section */}
          <Box
            sx={{
              textAlign: 'center',
              mt: { xs: 3, md: 4 },
              padding: { xs: '1.5rem 1rem', md: '2rem 1.5rem' },
              backgroundColor: theme.palette.background.paper,
              borderRadius: '10px',
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 700,
                mb: 1,
                fontSize: '1.125rem',
              }}
            >
              Need a Custom Plan?
            </Typography>
            <Typography
              sx={{
                color: theme.palette.text.secondary,
                mb: 2,
                maxWidth: '600px',
                margin: '0 auto 1.5rem',
                fontSize: '0.875rem',
              }}
            >
              Contact us for enterprise solutions, custom pricing, and dedicated support.
            </Typography>
            <Box
              component="button"
              onClick={() => handleSubscribe('enterprise')}
              sx={{
                backgroundColor: currentPricing.accentColor,
                color: theme.palette.mode === 'dark' ? '#000000' : '#ffffff',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.875rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: `0 2px 8px ${currentPricing.accentColor}40`,
                },
              }}
            >
              Contact Sales
            </Box>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
