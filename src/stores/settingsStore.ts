/**
 * Settings store
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppSettings, AudioSettings } from '../types/transcription';

interface SettingsState extends AppSettings {
  updateAudioSettings: (settings: AudioSettings) => void;
  updateOutputDir: (dir: string) => void;
  updateApiKey: (key: string) => void;
  loadSettings: () => void;
  saveSettings: () => void;
}

const defaultSettings: AppSettings = {
  audio: {
    sample_rate: 16000,
    channels: 1,
  },
  output_dir: '',
  api_key: '',
};

export const settingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      updateAudioSettings: (settings: AudioSettings) => {
        set((state) => ({
          audio: { ...state.audio, ...settings },
        }));
      },

      updateOutputDir: (dir: string) => {
        set({ output_dir: dir });
      },

      updateApiKey: (key: string) => {
        set({ api_key: key });
      },

      loadSettings: () => {
        // Settings are automatically loaded via persist middleware
      },

      saveSettings: () => {
        // Settings are automatically saved via persist middleware
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

