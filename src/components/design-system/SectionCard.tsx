import React from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';

interface SectionCardProps {
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  padding?: string;
  border?: boolean;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  children,
  action,
  padding = '1.5rem',
  border = false,
}) => {
  const theme = useTheme();
  
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: '0.75rem',
        backgroundColor: theme.palette.background.paper,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        border: border ? `1px solid ${theme.palette.divider}` : 'none',
        padding: padding,
        width: '100%',
        transition: 'box-shadow 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      }}
    >
      {title && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontSize: '1rem',
              fontWeight: 600,
              color: theme.palette.text.primary,
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </Typography>
          {action && <Box>{action}</Box>}
        </Box>
      )}
      <Box>{children}</Box>
    </Paper>
  );
};

export default SectionCard;

