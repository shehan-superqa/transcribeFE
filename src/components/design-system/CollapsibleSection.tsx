import React, { useState } from 'react';
import { Box, Typography, Collapse, IconButton } from '@mui/material';
import { ExpandMore, ChevronRight } from '@mui/icons-material';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  actionButton?: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultExpanded = false,
  onToggle,
  actionButton,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    onToggle?.(newExpanded);
  };

  return (
    <Box
      sx={{
        borderBottom: expanded ? '1px solid #e5e7eb' : 'none',
        paddingBottom: expanded ? '1rem' : 0,
        marginBottom: expanded ? '1rem' : 0,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          padding: '0.75rem 0',
          '&:hover': {
            backgroundColor: 'transparent',
          },
        }}
        onClick={handleToggle}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
          <IconButton
            size="small"
            sx={{
              padding: '0.25rem',
              color: '#6b7280',
              '&:hover': {
                backgroundColor: 'transparent',
              },
            }}
          >
            {expanded ? (
              <ExpandMore sx={{ fontSize: '1.25rem' }} />
            ) : (
              <ChevronRight sx={{ fontSize: '1.25rem' }} />
            )}
          </IconButton>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 500,
              color: '#111827',
              fontSize: '0.875rem',
              userSelect: 'none',
            }}
          >
            {title}
          </Typography>
        </Box>
        {actionButton && (
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            {actionButton}
          </Box>
        )}
      </Box>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ paddingLeft: '2rem', paddingTop: '0.5rem' }}>{children}</Box>
      </Collapse>
    </Box>
  );
};

export default CollapsibleSection;

