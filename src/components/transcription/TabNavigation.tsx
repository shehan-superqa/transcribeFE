/**
 * Tab navigation component for transcription features
 */

import { Box, Tabs, Tab } from '@mui/material';
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
  { label: 'Transcribe', icon: <UploadFileIcon />, path: '/dashboard/voice/transcribe' },
  { label: 'Batch Process', icon: <FolderIcon />, path: '/dashboard/voice/batch' },
  { label: 'Live Mic VAD', icon: <MicIcon />, path: '/dashboard/voice/livemicvad' },
  { label: 'Text-to-Speech', icon: <VolumeUpIcon />, path: '/dashboard/voice/tts' },
  { label: 'History', icon: <HistoryIcon />, path: '/dashboard/voice/history' },
  { label: 'Settings', icon: <SettingsIcon />, path: '/dashboard/voice/settings' },
  { label: 'Trainer', icon: <SchoolIcon />, path: '/dashboard/voice/trainer' },
];

export default function TabNavigation({ currentTab }: TabNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    const tab = tabs[newValue];
    if (tab) {
      navigate(tab.path);
    }
  };

  // Determine current tab from location
  const getCurrentTab = () => {
    if (location.pathname === '/dashboard' || location.pathname === '/dashboard/') {
      return 0;
    }
    const currentPath = location.pathname;
    const tabIndex = tabs.findIndex(tab => currentPath === tab.path);
    return tabIndex >= 0 ? tabIndex : 0;
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: '#333333', mb: 3 }}>
      <Tabs
        value={getCurrentTab()}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          '& .MuiTab-root': {
            color: '#a0a0a0',
            minHeight: 64,
            '&:hover': {
              color: '#00c6ff',
            },
            '&.Mui-selected': {
              color: '#00c6ff',
            },
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#00c6ff',
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

