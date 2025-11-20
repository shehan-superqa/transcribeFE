/**
 * Pricing card component
 */

import { Box, Typography, Button, Chip } from '@mui/material';
import type { PricingTier, BillingPeriod } from '../../data/pricingData';
import { calculateYearlySavings } from '../../data/pricingData';

export interface PricingCardProps {
  tier: PricingTier;
  billingPeriod: BillingPeriod;
  accentColor: string;
  onSubscribe: (tierId: string) => void;
}

export default function PricingCard({ tier, billingPeriod, accentColor, onSubscribe }: PricingCardProps) {
  const price = billingPeriod === 'yearly' ? tier.yearlyPrice : tier.monthlyPrice;
  const isEnterprise = tier.id === 'enterprise';
  const savings = billingPeriod === 'yearly' && tier.monthlyPrice > 0 
    ? calculateYearlySavings(tier.monthlyPrice, tier.yearlyPrice) 
    : 0;

  // Format feature text - handle "OR" and "Everything in X, plus:" specially
  const formatFeature = (feature: string, index: number, features: string[]) => {
    const trimmedFeature = feature.trim();
    const isOr = trimmedFeature === 'OR';
    const isPlusHeader = trimmedFeature.includes('Everything in') && trimmedFeature.includes('plus:');
    
    if (isOr) {
      return (
        <Typography
          key={index}
          sx={{
            color: '#666666',
            fontSize: '0.7rem',
            fontWeight: 600,
            textAlign: 'center',
            my: 0.2,
          }}
        >
          {feature}
        </Typography>
      );
    }
    
    if (isPlusHeader) {
      return (
        <Typography
          key={index}
          sx={{
            color: '#cccccc',
            fontSize: '0.75rem',
            fontWeight: 600,
            mt: index > 0 ? 0.5 : 0,
            mb: 0.2,
          }}
        >
          {feature}
        </Typography>
      );
    }

    // Check if it's a minutes/credits feature (highlight with pill)
    const minutesMatch = feature.match(/(\d+)\s*(mins?\/mo|mins?|credits?|videos?\/mo|videos?)/i);
    if (minutesMatch) {
      const matchText = minutesMatch[0];
      const beforeMatch = feature.substring(0, minutesMatch.index).trim();
      const afterMatch = feature.substring(minutesMatch.index! + matchText.length).trim();
      
      return (
        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.4, flexWrap: 'wrap' }}>
          {beforeMatch && (
            <Typography sx={{ color: '#cccccc', fontSize: '0.75rem' }}>
              {beforeMatch}
            </Typography>
          )}
          <Chip
            label={matchText}
            size="small"
            sx={{
              backgroundColor: accentColor,
              color: '#000',
              fontWeight: 700,
              fontSize: '0.65rem',
              height: '18px',
            }}
          />
          {afterMatch && (
            <Typography sx={{ color: '#cccccc', fontSize: '0.75rem' }}>
              {afterMatch}
            </Typography>
          )}
        </Box>
      );
    }

    return (
      <Typography
        key={index}
        sx={{
          color: '#cccccc',
          fontSize: '0.75rem',
          mb: 0.4,
        }}
      >
        {feature}
      </Typography>
    );
  };

  return (
    <Box
      sx={{
        backgroundColor: '#181818',
        borderRadius: '8px',
        padding: { xs: '0.875rem', sm: '1rem', md: '1.125rem' },
        border: tier.popular ? `2px solid ${accentColor}` : '1px solid #333333',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: { xs: 'none', md: 'translateY(-2px)' },
          boxShadow: { xs: 'none', md: `0 4px 16px rgba(0, 0, 0, 0.4), 0 0 0 1px ${accentColor}40` },
        },
      }}
    >
      {tier.popular && (
        <Chip
          label="Most Popular"
          size="small"
          sx={{
            position: 'absolute',
            top: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: accentColor,
            color: '#000',
            fontWeight: 700,
            fontSize: '0.65rem',
            height: '18px',
          }}
        />
      )}

      {savings > 0 && (
        <Chip
          label={`Save $${savings}`}
          size="small"
          sx={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            backgroundColor: accentColor,
            color: '#000',
            fontWeight: 600,
            fontSize: '0.65rem',
            height: '18px',
          }}
        />
      )}

      <Typography
        variant="h6"
        sx={{
          color: '#ffffff',
          fontWeight: 700,
          mb: 0.4,
          fontSize: { xs: '1rem', md: '1.125rem' },
        }}
      >
        {tier.name}
      </Typography>

      <Box sx={{ mb: 1.5 }}>
        {isEnterprise ? (
          <Typography
            sx={{
              color: accentColor,
              fontSize: '1.25rem',
              fontWeight: 700,
            }}
          >
            Contact Us!
          </Typography>
        ) : (
          <>
            <Typography
              component="span"
              sx={{
                color: accentColor,
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '1.875rem' },
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              ${price}
            </Typography>
            <Typography
              component="span"
              sx={{
                color: '#999999',
                fontSize: { xs: '0.75rem', md: '0.8rem' },
                ml: 0.5,
              }}
            >
              {tier.credits ? `/ ${tier.credits} credits` : billingPeriod === 'yearly' ? '/month' : '/month'}
            </Typography>
            {billingPeriod === 'yearly' && !tier.credits && (
              <Typography
                sx={{
                  color: '#999999',
                  fontSize: '0.7rem',
                  mt: 0.25,
                }}
              >
                billed annually
              </Typography>
            )}
          </>
        )}
      </Box>

      <Box sx={{ flex: 1, mb: 1 }}>
        <Typography
          sx={{
            color: '#cccccc',
            fontSize: '0.75rem',
            fontWeight: 600,
            mb: 0.75,
          }}
        >
          What you get:
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {tier.features.map((feature, index) => formatFeature(feature, index, tier.features))}
        </Box>
      </Box>

      <Button
        onClick={() => onSubscribe(tier.id)}
        fullWidth
        sx={{
          backgroundColor: tier.popular ? accentColor : '#333333',
          color: tier.popular ? '#000' : '#ffffff',
          padding: '0.625rem 1rem',
          borderRadius: '6px',
          fontWeight: 600,
          fontSize: '0.8rem',
          textTransform: 'none',
          mt: 'auto',
          '&:hover': {
            backgroundColor: tier.popular ? accentColor : accentColor,
            color: tier.popular ? '#000' : '#000',
            transform: 'translateY(-1px)',
            boxShadow: `0 2px 8px ${accentColor}40`,
          },
          transition: 'all 0.2s ease',
        }}
      >
        {tier.ctaText}
      </Button>
    </Box>
  );
}

