/**
 * Tab navigation component for transcription features
 */

import { Box, Tabs, Tab, useTheme } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import MicIcon from '@mui/icons-material/Mic';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import SchoolIcon from '@mui/icons-material/School';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FolderIcon from '@mui/icons-material/Folder';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';

export interface TabNavigationProps {
  currentTab: number;
}

const tabs = [
  { label: 'Transcribe', icon: <UploadFileIcon />, path: '/voice/transcribe' },
  { label: 'Batch Process', icon: <FolderIcon />, path: '/voice/batch' },
  { label: 'Live Mic VAD', icon: <MicIcon />, path: '/voice/live' },
  { label: 'Text-to-Speech', icon: <VolumeUpIcon />, path: '/voice/tts' },
  { label: 'History', icon: <HistoryIcon />, path: '/voice/history' },
  { label: 'Settings', icon: <SettingsIcon />, path: '/voice/settings' },
  { label: 'Trainer', icon: <SchoolIcon />, path: '/voice/trainer' },
];

export default function TabNavigation({ currentTab }: TabNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    const tab = tabs[newValue];
    if (tab) {
      navigate(tab.path);
    }
  };

  // Determine current tab from location
  const getCurrentTab = () => {
    if (location.pathname === '/voice' || location.pathname === '/voice/') {
      return 0;
    }
    const currentPath = location.pathname;
    const tabIndex = tabs.findIndex(tab => currentPath === tab.path);
    return tabIndex >= 0 ? tabIndex : 0;
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: theme.palette.divider, mb: 3 }}>
      <Tabs
        value={getCurrentTab()}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          '& .MuiTab-root': {
            color: theme.palette.text.secondary,
            minHeight: 64,
            '&:hover': {
              color: theme.palette.primary.main,
            },
            '&.Mui-selected': {
              color: theme.palette.primary.main,
            },
          },
          '& .MuiTabs-indicator': {
            backgroundColor: theme.palette.primary.main,
          },
        }}
      >
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            label={tab.label}
            icon={tab.icon}
            iconPosition="start"
          />
        ))}
      </Tabs>
    </Box>
  );
}

