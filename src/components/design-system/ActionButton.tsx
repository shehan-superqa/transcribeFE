import React from 'react';
import { Button, ButtonProps } from '@mui/material';

export type ActionButtonVariant = 'primary' | 'secondary' | 'outline';

interface ActionButtonProps extends Omit<ButtonProps, 'variant'> {
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: ActionButtonVariant;
}

const variantStyles: Record<ActionButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: '#6b21a8',
    color: '#ffffff',
    border: 'none',
  },
  secondary: {
    backgroundColor: '#f3f4f6',
    color: '#111827',
    border: 'none',
  },
  outline: {
    backgroundColor: 'transparent',
    color: '#111827',
    border: '1px solid #e5e7eb',
  },
};

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  children,
  variant = 'primary',
  disabled = false,
  sx,
  ...props
}) => {
  return (
    <Button
      {...props}
      disabled={disabled}
      startIcon={icon}
      sx={{
        ...variantStyles[variant],
        borderRadius: '0.5rem',
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        textTransform: 'none',
        gap: '0.5rem',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          backgroundColor:
            variant === 'primary'
              ? '#581c87'
              : variant === 'secondary'
              ? '#e5e7eb'
              : '#f3f4f6',
          borderColor: variant === 'outline' ? '#6b21a8' : undefined,
          color: variant === 'outline' ? '#6b21a8' : undefined,
        },
        '&:disabled': {
          opacity: 0.5,
          cursor: 'not-allowed',
        },
        ...sx,
      }}
    >
      {children}
    </Button>
  );
};

export default ActionButton;

