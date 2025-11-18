/**
 * Live transcription store
 */

import { create } from 'zustand';
import type { LiveTranscriptionConfig, LiveTranscriptionResult, VADStatus } from '../types/transcription';
import { websocketClient } from '../lib/api/websocketClient';
import { mergeTranscriptionChunks } from '../utils/textMerging';

interface LiveTranscriptionState {
  isActive: boolean;
  isConnected: boolean;
  results: string;
  vadState: 'speaking' | 'silent';
  error: string | null;
  sessionId: string | null;
  connect: () => Promise<void>;
  start: (config: LiveTranscriptionConfig) => Promise<void>;
  stop: () => Promise<void>;
  disconnect: () => void;
  appendResult: (text: string) => void;
  setVADState: (state: 'speaking' | 'silent') => void;
  setError: (error: string | null) => void;
  clearResults: () => void;
}

export const liveTranscriptionStore = create<LiveTranscriptionState>((set, get) => ({
  isActive: false,
  isConnected: false,
  results: '',
  vadState: 'silent',
  error: null,
  sessionId: null,

  connect: async () => {
    try {
      await websocketClient.connect();
      
      // Set up event listeners
      websocketClient.on('transcription', (data: LiveTranscriptionResult) => {
        get().appendResult(data.text);
      });

      websocketClient.on('vad_status', (data: VADStatus) => {
        get().setVADState(data.status);
      });

      websocketClient.on('error', (error: any) => {
        set({ error: error.error || 'WebSocket error' });
      });

      set({ isConnected: true, sessionId: websocketClient.getSessionId() });
    } catch (error: any) {
      set({ error: error.message || 'Failed to connect', isConnected: false });
      throw error;
    }
  },

  start: async (config: LiveTranscriptionConfig) => {
    if (!get().isConnected) {
      await get().connect();
    }

    try {
      await websocketClient.startTranscription(config);
      set({ isActive: true, error: null });
    } catch (error: any) {
      set({ error: error.message || 'Failed to start transcription', isActive: false });
      throw error;
    }
  },

  stop: async () => {
    try {
      await websocketClient.stopTranscription();
      set({ isActive: false });
    } catch (error: any) {
      console.error('Error stopping transcription:', error);
    }
  },

  disconnect: () => {
    websocketClient.disconnect();
    set({ 
      isConnected: false, 
      isActive: false, 
      sessionId: null,
      vadState: 'silent',
    });
  },

  appendResult: (text: string) => {
    const currentResults = get().results;
    // Use smart merging logic
    const merged = mergeTranscriptionChunks(currentResults, text);
    set({ results: merged });
  },

  setVADState: (state: 'speaking' | 'silent') => {
    set({ vadState: state });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearResults: () => {
    set({ results: '' });
  },
}));

