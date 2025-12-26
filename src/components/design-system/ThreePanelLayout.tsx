import React from 'react';
import { Box } from '@mui/material';

interface ThreePanelLayoutProps {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  leftWidth?: string;
  rightWidth?: string;
  gap?: string;
}

export const ThreePanelLayout: React.FC<ThreePanelLayoutProps> = ({
  leftPanel,
  centerPanel,
  rightPanel,
  leftWidth = '300px',
  rightWidth = '320px',
  gap = '1.5rem',
}) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          lg: `${leftWidth} 1fr ${rightWidth}`,
        },
        gap: gap,
        width: '100%',
        height: '100%',
        padding: '1.5rem',
      }}
    >
      {/* Left Panel */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'block' },
          position: 'sticky',
          top: '1.5rem',
          alignSelf: 'flex-start',
          maxHeight: 'calc(100vh - 3rem)',
          overflowY: 'auto',
        }}
      >
        {leftPanel}
      </Box>

      {/* Center Panel */}
      <Box
        sx={{
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        {centerPanel}
      </Box>

      {/* Right Panel */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'block' },
          position: 'sticky',
          top: '1.5rem',
          alignSelf: 'flex-start',
          maxHeight: 'calc(100vh - 3rem)',
          overflowY: 'auto',
        }}
      >
        {rightPanel}
      </Box>

      {/* Mobile: Show panels in order */}
      <Box
        sx={{
          display: { xs: 'block', lg: 'none' },
          width: '100%',
        }}
      >
        {leftPanel}
      </Box>
      <Box
        sx={{
          display: { xs: 'block', lg: 'none' },
          width: '100%',
        }}
      >
        {rightPanel}
      </Box>
    </Box>
  );
};

export default ThreePanelLayout;

