/**
 * Pricing tabs component for service navigation
 */

import { Box, Tabs, Tab } from '@mui/material';
import type { ServiceType } from '../../data/pricingData';

export interface PricingTabsProps {
  currentService: ServiceType;
  onServiceChange: (service: ServiceType) => void;
}

const services: Array<{ id: ServiceType; label: string; accentColor: string }> = [
  { id: 'transcription', label: 'Transcription', accentColor: '#00c6ff' },
  { id: 'subtitle', label: 'Subtitle', accentColor: '#10b981' },
  { id: 'voiceover', label: 'Voiceover', accentColor: '#f59e0b' },
  { id: 'realtime', label: 'Real-Time', accentColor: '#9b5de5' },
  { id: 'video', label: 'Video Generation', accentColor: '#ec4899' },
];

export default function PricingTabs({ currentService, onServiceChange }: PricingTabsProps) {
  const currentIndex = services.findIndex(s => s.id === currentService);
  const currentAccentColor = services[currentIndex]?.accentColor || '#00c6ff';

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    const service = services[newValue];
    if (service) {
      onServiceChange(service.id);
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Tabs
        value={currentIndex}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          '& .MuiTab-root': {
            color: '#a0a0a0',
            minHeight: 48,
            fontSize: '0.875rem',
            fontWeight: 500,
            textTransform: 'none',
            padding: '0.5rem 1rem',
            '&:hover': {
              color: currentAccentColor,
            },
            '&.Mui-selected': {
              color: currentAccentColor,
            },
          },
          '& .MuiTabs-indicator': {
            backgroundColor: currentAccentColor,
            height: 2,
          },
        }}
      >
        {services.map((service) => (
          <Tab
            key={service.id}
            label={service.label}
          />
        ))}
      </Tabs>
    </Box>
  );
}

