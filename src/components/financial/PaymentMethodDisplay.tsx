import { Box, Typography, Avatar } from '@mui/material';
import { Repeat as RepeatIcon } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { Transaction } from '../../types/financial';

interface PaymentMethodDisplayProps {
  transaction: Transaction;
  compact?: boolean;
}

export default function PaymentMethodDisplay({ transaction, compact = false }: PaymentMethodDisplayProps) {
  const { theme } = useTheme();

  // Check if payment method is recurring
  const isRecurring = transaction.payment_method?.toLowerCase() === 'recurring';

  if (!isRecurring) {
    // For non-recurring payments, show simple formatted text
    const paymentMethod = transaction.payment_method || 'N/A';
    const formatted = paymentMethod
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return (
      <Typography sx={{ 
        color: theme.palette.text.primary, 
        fontFamily: "'Inter', sans-serif", 
        fontSize: compact ? '0.75rem' : '0.875rem' 
      }}>
        {formatted}
      </Typography>
    );
  }

  // For recurring payments, show the card design
  const reason = transaction.name || 'Unknown reason';
  const isUnknownReason = !transaction.name;
  const reasonColor = isUnknownReason ? '#4B5563' : theme.palette.text.primary; // Darker gray for unknown reason

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: '#EDE9FE',
            color: '#6D28D9',
          }}
        >
          <RepeatIcon sx={{ fontSize: '18px' }} />
        </Avatar>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          <Typography sx={{ 
            fontSize: '13px', 
            fontWeight: 600, 
            color: reasonColor,
            fontFamily: "'Inter', sans-serif",
            lineHeight: 1.2,
            fontStyle: isUnknownReason ? 'italic' : 'normal',
          }}>
            {reason}
          </Typography>
          <Typography sx={{ 
            fontSize: '10px', 
            fontWeight: 600, 
            color: theme.palette.text.secondary,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontFamily: "'Inter', sans-serif",
            lineHeight: 1.2,
          }}>
            RECURRING
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Avatar
        sx={{
          width: 40,
          height: 40,
          bgcolor: '#EDE9FE',
          color: '#6D28D9',
        }}
      >
        <RepeatIcon sx={{ fontSize: '20px' }} />
      </Avatar>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography sx={{ 
          fontSize: '14px', 
          fontWeight: 600, 
          color: reasonColor,
          fontFamily: "'Inter', sans-serif",
          lineHeight: 1.2,
          fontStyle: isUnknownReason ? 'italic' : 'normal',
        }}>
          {reason}
        </Typography>
        <Typography sx={{ 
          fontSize: '11px', 
          fontWeight: 600, 
          color: theme.palette.text.secondary,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontFamily: "'Inter', sans-serif",
          lineHeight: 1.2,
        }}>
          RECURRING
        </Typography>
      </Box>
    </Box>
  );
}
