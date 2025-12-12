/**
 * Tab navigation component for video features
 */

import { Box, Tabs, Tab } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import TranslateIcon from '@mui/icons-material/Translate';
import SubtitlesIcon from '@mui/icons-material/Subtitles';
import MovieIcon from '@mui/icons-material/Movie';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

const tabs = [
  { label: 'Text to Video', icon: <AutoFixHighIcon />, path: '/video/text-to-video' },
  { label: 'Video to Text', icon: <VideoFileIcon />, path: '/video/to-text' },
  { label: 'Video Dubber', icon: <MovieIcon />, path: '/video/dubber' },
  { label: 'Video Translator', icon: <TranslateIcon />, path: '/video/translator' },
  { label: 'Subtitle Generator', icon: <SubtitlesIcon />, path: '/video/subtitle-generator' },
];

export default function VideoTabNavigation() {
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
    if (location.pathname === '/video' || location.pathname === '/video/') {
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









