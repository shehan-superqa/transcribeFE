/**
 * Tab navigation component for transcription features
 */

import { Box, Tabs, Tab } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import SchoolIcon from '@mui/icons-material/School';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FolderIcon from '@mui/icons-material/Folder';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';

export interface TabNavigationProps {
  currentTab: number;
  onTabChange: (tab: number) => void;
}

const tabs = [
  { label: 'Transcribe', icon: <UploadFileIcon /> },
  { label: 'Batch Process', icon: <FolderIcon /> },
  { label: 'Live Mic VAD', icon: <MicIcon /> },
  { label: 'Text-to-Speech', icon: <VolumeUpIcon /> },
  { label: 'History', icon: <HistoryIcon /> },
  { label: 'Settings', icon: <SettingsIcon /> },
  { label: 'Trainer', icon: <SchoolIcon /> },
];

export default function TabNavigation({ currentTab, onTabChange }: TabNavigationProps) {
  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    onTabChange(newValue);
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: '#333333', mb: 3 }}>
      <Tabs
        value={currentTab}
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

