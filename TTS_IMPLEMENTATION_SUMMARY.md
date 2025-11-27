# TTS (Text-to-Speech) Implementation Summary

## Overview
This document summarizes the frontend implementation of the Text-to-Speech (TTS) feature, integrated into the transcription application.

## Implementation Details

### 1. API Client (`src/lib/api/ttsApi.ts`)
- **submitTTSJob**: Submits a TTS job with text, voice, and optional parameters (language, emotion, speed, pitch, volume)
- **getAvailableVoices**: Fetches all available voices (300+ voices)
- **getTTSJobStatus**: Gets the status of a specific TTS job
- **getTTSJobs**: Gets all TTS jobs for the current user

### 2. Types (`src/types/api.ts`)
Added TTS-specific types:
- `TTSVoice`: Voice information (id, name, language, gender, accent, provider, category)
- `TTSJob`: Job status and result information
- `TTSConfig`: Configuration for TTS job submission

### 3. Components

#### TTSTab (`src/components/transcription/TTSTab.tsx`)
Main TTS interface component featuring:
- **Text Input**: Multi-line textarea for entering text to convert
- **Voice Selection**: Integrated voice selector component
- **Advanced Options**:
  - Emotion selection (happy, sad, angry, excited, calm, neutral)
  - Language selection (auto-populated from available voices)
  - Speed slider (0.5x - 2.0x)
  - Pitch slider (-12 to +12 semitones)
  - Volume slider (0% - 100%)
- **Progress Monitoring**: Real-time progress via SSE or polling
- **Audio Playback**: Integrated audio player for generated audio

#### VoiceSelector (`src/components/transcription/tts/VoiceSelector.tsx`)
Advanced voice selection component with:
- **Search**: Full-text search across voice names, IDs, languages, accents, and providers
- **Filtering**: Filter by language and gender
- **Grouping**: Voices grouped by language in autocomplete dropdown
- **Display**: Shows voice metadata (language, gender, accent, provider) as chips
- **Auto-complete**: Material-UI Autocomplete for better UX with 300+ voices

#### AudioPlayer (`src/components/transcription/tts/AudioPlayer.tsx`)
Full-featured audio player with:
- **Play/Pause Controls**: Standard playback controls
- **Progress Bar**: Seekable progress slider
- **Time Display**: Current time / total duration
- **Volume Control**: Volume slider with mute toggle
- **Download**: Download generated audio file

### 4. Integration

#### Tab Navigation
- Added "Text-to-Speech" tab to `TabNavigation.tsx` (position 3, before History)
- Uses VolumeUp icon from Material-UI icons

#### Dashboard Integration
- Integrated TTSTab into Dashboard component
- Tab index updated: TTS is now tab 3 (indices: 0=Transcribe, 1=Batch, 2=Live Mic, 3=TTS, 4=History, 5=Settings, 6=Trainer)

### 5. Progress Monitoring

#### SSE Support
- Uses existing `useSSE` hook for real-time progress updates
- Falls back to polling if SSE is not available
- Displays live progress updates with connection status indicator

#### Status Handling
- Supports all TTS job statuses: `queued`, `processing`, `completed`, `failed`, `error`
- Maps statuses to StatusLabel component appropriately
- Shows error messages when jobs fail

## API Endpoints Used

Based on the backend implementation prompt:

1. **POST /api/tts** - Submit TTS job
   - Request body: `{ text, voice, language?, emotion?, speed?, pitch?, volume? }`
   - Response: `{ success, job_id, message? }`

2. **GET /api/tts/voices** - Get available voices
   - Response: `{ success, voices: Voice[], total? }`

3. **GET /api/tts/jobs/<job_id>** - Get job status
   - Response: `{ success, job: TTSJobStatus }`

4. **SSE Stream** - Progress updates (via existing SSE client)
   - Endpoint: `/progress/stream/<job_id>`
   - Events: Progress updates with status, progress percentage, and result

## Features

### ✅ Implemented
- [x] TTS input form with all required fields
- [x] Voice selection UI with search and filtering
- [x] Support for 300+ voices with grouping
- [x] Job submission and status tracking
- [x] Progress monitoring (SSE + polling fallback)
- [x] Audio playback component
- [x] Error handling
- [x] UI/UX consistent with existing transcription features
- [x] Integration with existing tab navigation

### 🔄 Future Enhancements
- [ ] TTS job history integration with History tab
- [ ] Batch TTS processing
- [ ] Voice preview (play sample before generating)
- [ ] Saved voice preferences
- [ ] TTS job cancellation
- [ ] Export audio in multiple formats

## Usage

1. Navigate to the Dashboard
2. Click on the "Text-to-Speech" tab
3. Enter text in the textarea
4. Select a voice from the voice selector (use search/filters to find desired voice)
5. (Optional) Adjust advanced options (emotion, speed, pitch, volume)
6. Click "Generate Speech"
7. Monitor progress via SSE updates
8. Play/download generated audio when complete

## Error Handling

- Network errors are caught and displayed to the user
- Invalid input (empty text, no voice selected) is validated before submission
- Job failures show error messages from the backend
- SSE connection failures fall back to polling

## Styling

All components follow the existing dark theme:
- Background: `#1e1e1e` (paper), `#121212` (default)
- Primary color: `#00c6ff` (cyan)
- Text colors: `#e0e0e0` (primary), `#a0a0a0` (secondary)
- Borders: `#333333`

## Testing Recommendations

1. **Happy Path**: Submit TTS job with valid text and voice, verify audio generation
2. **Error Cases**: Test with empty text, invalid voice, network failures
3. **Edge Cases**: Very long text, special characters, multiple concurrent jobs
4. **Voice Selection**: Test search, filters, and selection with 300+ voices
5. **Progress Monitoring**: Verify SSE updates and polling fallback
6. **Audio Playback**: Test play, pause, seek, volume, and download

## Notes

- The implementation follows the same patterns as the existing transcription features
- SSE client is shared between transcription and TTS jobs
- All API calls use the same authentication mechanism
- The voice selector uses Material-UI Autocomplete for better performance with large lists



