/**
 * Billing period toggle component (Monthly/Yearly)
 */

import { Box, Button } from '@mui/material';
import type { BillingPeriod } from '../../data/pricingData';

export interface BillingToggleProps {
  billingPeriod: BillingPeriod;
  onBillingChange: (period: BillingPeriod) => void;
}

export default function BillingToggle({ billingPeriod, onBillingChange }: BillingToggleProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        mb: 2,
        gap: 0.75,
      }}
    >
      <Button
        onClick={() => onBillingChange('yearly')}
        sx={{
          backgroundColor: billingPeriod === 'yearly' ? '#181818' : 'transparent',
          color: billingPeriod === 'yearly' ? '#ffffff' : '#999999',
          border: '1px solid #333333',
          borderRadius: '8px',
          padding: '0.5rem 1.5rem',
          fontWeight: 600,
          fontSize: '0.875rem',
          textTransform: 'none',
          '&:hover': {
            backgroundColor: billingPeriod === 'yearly' ? '#181818' : '#0a0a0a',
            borderColor: billingPeriod === 'yearly' ? '#00c6ff' : '#555555',
          },
          transition: 'all 0.2s ease',
        }}
      >
        Yearly • Save 20%
      </Button>
      <Button
        onClick={() => onBillingChange('monthly')}
        sx={{
          backgroundColor: billingPeriod === 'monthly' ? '#181818' : 'transparent',
          color: billingPeriod === 'monthly' ? '#ffffff' : '#999999',
          border: '1px solid #333333',
          borderRadius: '8px',
          padding: '0.5rem 1.5rem',
          fontWeight: 600,
          fontSize: '0.875rem',
          textTransform: 'none',
          '&:hover': {
            backgroundColor: billingPeriod === 'monthly' ? '#181818' : '#0a0a0a',
            borderColor: billingPeriod === 'monthly' ? '#00c6ff' : '#555555',
          },
          transition: 'all 0.2s ease',
        }}
      >
        Monthly
      </Button>
    </Box>
  );
}

