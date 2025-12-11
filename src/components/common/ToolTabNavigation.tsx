/**
 * Common tab navigation component for both voice and video tools
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
import VideoFileIcon from '@mui/icons-material/VideoFile';
import TranslateIcon from '@mui/icons-material/Translate';
import SubtitlesIcon from '@mui/icons-material/Subtitles';
import MovieIcon from '@mui/icons-material/Movie';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

export type ToolType = 'voice' | 'video';

interface TabConfig {
  label: string;
  icon: React.ReactElement;
  path: string;
}

const voiceTabs: TabConfig[] = [
  { label: 'Transcribe', icon: <UploadFileIcon />, path: '/voice/transcribe' },
  { label: 'Batch Process', icon: <FolderIcon />, path: '/voice/batch' },
  { label: 'Live Mic VAD', icon: <MicIcon />, path: '/voice/live' },
  { label: 'Text-to-Speech', icon: <VolumeUpIcon />, path: '/voice/tts' },
  { label: 'History', icon: <HistoryIcon />, path: '/voice/history' },
  { label: 'Settings', icon: <SettingsIcon />, path: '/voice/settings' },
  { label: 'Trainer', icon: <SchoolIcon />, path: '/voice/trainer' },
];

const videoTabs: TabConfig[] = [
  { label: 'Text to Video', icon: <AutoFixHighIcon />, path: '/video/text-to-video' },
  { label: 'Video to Text', icon: <VideoFileIcon />, path: '/video/to-text' },
  { label: 'Video Dubber', icon: <MovieIcon />, path: '/video/dubber' },
  { label: 'Video Translator', icon: <TranslateIcon />, path: '/video/translator' },
  { label: 'Subtitle Generator', icon: <SubtitlesIcon />, path: '/video/subtitle-generator' },
];

interface ToolTabNavigationProps {
  toolType: ToolType;
}

export default function ToolTabNavigation({ toolType }: ToolTabNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = toolType === 'voice' ? voiceTabs : videoTabs;
  const basePath = toolType === 'voice' ? '/voice' : '/video';

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    const tab = tabs[newValue];
    if (tab) {
      navigate(tab.path);
    }
  };

  // Determine current tab from location
  const getCurrentTab = () => {
    if (location.pathname === basePath || location.pathname === `${basePath}/`) {
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








