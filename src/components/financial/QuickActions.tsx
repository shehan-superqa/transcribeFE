import { Box, Fab, Tooltip, SpeedDial, SpeedDialAction, SpeedDialIcon } from '@mui/material';
import { CloudUpload, Chat, Analytics, Download, Settings } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { useState } from 'react';

interface QuickActionsProps {
  onUploadClick?: () => void;
  onChatClick?: () => void;
  onAnalyticsClick?: () => void;
  onExportClick?: () => void;
  onSettingsClick?: () => void;
}

export default function QuickActions({
  onUploadClick,
  onChatClick,
  onAnalyticsClick,
  onExportClick,
  onSettingsClick,
}: QuickActionsProps) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);

  const actions = [
    {
      icon: <CloudUpload />,
      name: 'Upload Bill',
      onClick: onUploadClick,
      ariaLabel: 'Upload a bill or receipt',
    },
    {
      icon: <Chat />,
      name: 'Ask AI',
      onClick: onChatClick,
      ariaLabel: 'Ask AI assistant a question',
    },
    {
      icon: <Analytics />,
      name: 'View Analytics',
      onClick: onAnalyticsClick,
      ariaLabel: 'View detailed analytics',
    },
    {
      icon: <Download />,
      name: 'Export Data',
      onClick: onExportClick,
      ariaLabel: 'Export financial data',
    },
    {
      icon: <Settings />,
      name: 'Settings',
      onClick: onSettingsClick,
      ariaLabel: 'Open settings',
    },
  ];

  return (
    <>
      {/* Floating Action Button for Upload (Most Common Action) */}
      {onUploadClick && (
        <Tooltip title="Upload Bill" placement="left" arrow>
          <Fab
            color="primary"
            aria-label="Upload bill"
            sx={{
              position: 'fixed',
              bottom: { xs: 80, sm: 24 },
              right: { xs: 16, sm: 24 },
              zIndex: 1001,
              boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.15)',
            }}
            onClick={onUploadClick}
          >
            <CloudUpload />
          </Fab>
        </Tooltip>
      )}

      {/* Speed Dial for Other Actions */}
      <SpeedDial
        ariaLabel="Quick actions"
        sx={{
          position: 'fixed',
          bottom: { xs: 160, sm: 104 },
          right: { xs: 16, sm: 24 },
          zIndex: 1000,
          '& .MuiSpeedDial-fab': {
            backgroundColor: theme.palette.mode === 'dark' ? '#374151' : '#f3f4f6',
            color: theme.palette.text.primary,
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? '#4b5563' : '#e5e7eb',
            },
          },
        }}
        icon={<SpeedDialIcon />}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        open={open}
      >
        {actions
          .filter((action) => action.name !== 'Upload Bill' && action.onClick)
          .map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={() => {
                setOpen(false);
                action.onClick?.();
              }}
              aria-label={action.ariaLabel}
            />
          ))}
      </SpeedDial>
    </>
  );
}














