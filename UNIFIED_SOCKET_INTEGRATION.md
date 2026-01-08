# Unified Socket Server Integration Guide

This document describes the integration of the unified socket server for the financial app frontend.

## Overview

The unified socket server consolidates all WebSocket functionality (Live Transcription, GPT-5 Streaming, and Progress Updates) into a single Socket.IO server running on port 5002.

## Environment Variables

Update your `.env` file (or create one) with the following:

```env
# Unified Socket Server (replaces separate WebSocket and SSE)
VITE_WEBSOCKET_URL=http://localhost:5002

# API Base URL
VITE_API_BASE_URL=http://localhost:5000
```

**Important:** 
- Socket.IO uses HTTP/HTTPS URLs, not `ws://` URLs
- The unified socket server runs on port 5002
- Change from `ws://localhost:5003` to `http://localhost:5002`

## Files Created/Updated

### New Files

1. **`src/lib/api/websocket.ts`**
   - Unified WebSocket client using Socket.IO
   - Handles: Live Transcription, GPT-5 Streaming, Progress Updates
   - Exports `unifiedWebSocketClient` singleton instance

2. **`src/hooks/useUnifiedWebSocket.ts`**
   - React hook for unified WebSocket features
   - Provides connection management, transcription, GPT-5 streaming, and progress updates

### Updated Files

1. **`src/hooks/useFinancialJobProgress.ts`**
   - Updated to use unified socket server instead of native WebSocket
   - Falls back to SSE if unified socket is unavailable
   - Uses Socket.IO events: `subscribe_progress` and `progress_update`

## Usage

### Financial Job Progress

The `useFinancialJobProgress` hook automatically uses the unified socket:

```typescript
import { useFinancialJobProgress } from '../hooks/useFinancialJobProgress';

function MyComponent() {
  const { progress, status, message, isConnected } = useFinancialJobProgress(
    jobId,
    streamUrl // optional
  );

  // Hook automatically:
  // 1. Connects to unified socket server
  // 2. Subscribes to progress updates for the job
  // 3. Falls back to SSE if socket unavailable
  // 4. Cleans up on unmount
}
```

### Direct Unified Socket Usage

For other features (transcription, GPT-5), use the hook:

```typescript
import { useUnifiedWebSocket } from '../hooks/useUnifiedWebSocket';

function MyComponent() {
  const {
    isConnected,
    connect,
    subscribeProgress,
    progress,
    // ... other features
  } = useUnifiedWebSocket();

  useEffect(() => {
    connect();
  }, []);

  // Subscribe to progress for a job
  const handleSubscribe = async (jobId: string) => {
    await subscribeProgress(jobId);
  };
}
```

## Socket.IO Events

### Progress Updates

**Subscribe:**
```typescript
socket.emit('subscribe_progress', { job_id: 'job123' });
```

**Listen:**
```typescript
socket.on('progress_update', (data) => {
  // data: { job_id, status, progress, message, details, timestamp }
});
```

**Unsubscribe:**
```typescript
socket.emit('unsubscribe_progress', {});
```

### Other Events

- `start_transcription` - Start live transcription
- `audio_data` - Send audio data
- `stop_transcription` - Stop transcription
- `transcription_result` - Receive transcription results
- `start_gpt5_stream` - Start GPT-5 streaming
- `gpt5_chunk` - Receive GPT-5 chunks
- `gpt5_complete` - GPT-5 stream complete

## Migration Notes

### Backward Compatibility

- The old `websocketClient.ts` (port 5003) is still available for backward compatibility
- The old `progressWebSocketClient.ts` (native WebSocket) is still available but not used by financial app
- SSE fallback is maintained for environments where WebSocket is unavailable

### Breaking Changes

- Financial app progress updates now use Socket.IO instead of native WebSocket
- Event names changed from native WebSocket messages to Socket.IO events
- Connection URL changed from `ws://localhost:5002` to `http://localhost:5002`

## Testing

1. Start the unified socket server:
   ```bash
   python api/unified_socket_server.py
   ```

2. Start your frontend:
   ```bash
   npm run dev
   ```

3. Test connection:
   - Open browser console
   - Should see "Unified WebSocket connected" message
   - Check that `sessionId` is set

4. Test financial progress:
   - Upload a bill in the financial app
   - Should see progress updates via unified socket
   - Check console for "[Progress] Using unified WebSocket connection"

## Troubleshooting

### Connection Issues

- **Error: "Not connected to WebSocket server"**
  - Ensure unified socket server is running on port 5002
  - Check `VITE_WEBSOCKET_URL` environment variable
  - Verify authentication token is available

- **Falling back to SSE**
  - Unified socket connection failed
  - Check server logs for errors
  - Verify Socket.IO server is running correctly

### Progress Not Updating

- Check that `jobId` matches the job being processed
- Verify `subscribe_progress` event was emitted successfully
- Check browser console for `progress_update` events
- Ensure backend is emitting progress updates to the unified socket

## Summary of Changes

1. ✅ Created unified WebSocket client (`src/lib/api/websocket.ts`)
2. ✅ Created unified WebSocket hook (`src/hooks/useUnifiedWebSocket.ts`)
3. ✅ Updated financial progress hook to use unified socket
4. ✅ Maintained SSE fallback for compatibility
5. ✅ Environment variable: `VITE_WEBSOCKET_URL` → `http://localhost:5002`

The unified socket server consolidates all socket functionality into one endpoint, simplifying frontend integration and reducing connection overhead.

