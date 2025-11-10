# YouTube to M4A Conversion Setup

This application uses FFmpeg.wasm to convert YouTube videos to M4A audio format on the client side.

## How It Works

1. **User enters YouTube URL** → The URL is validated
2. **Backend proxy fetches video** → Your backend needs to provide a proxy endpoint
3. **FFmpeg.wasm converts to M4A** → Conversion happens in the browser
4. **File is used for transcription** → The converted M4A file is processed

## Backend Proxy Requirement

**Important:** YouTube blocks direct browser access due to CORS policies. You **must** set up a backend proxy to fetch the video stream.

### Backend Proxy Endpoint

Your backend needs to provide an endpoint that:
- Accepts a YouTube URL as a query parameter
- Fetches the video stream using a tool like `yt-dlp` or `youtube-dl`
- Returns the video stream as a blob/response

**Example endpoint:**
```
GET /api/youtube/stream?url=https://www.youtube.com/watch?v=...
```

### Environment Variable

Set the proxy URL in your `.env` file:
```env
VITE_YOUTUBE_PROXY_URL=/api/youtube/stream
```

Or it will default to `/api/youtube/stream` if not set.

### Example Backend Implementation (Node.js/Express)

```javascript
const express = require('express');
const ytpl = require('ytdl-core'); // or use yt-dlp

app.get('/api/youtube/stream', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'YouTube URL is required' });
  }
  
  try {
    // Validate YouTube URL
    if (!ytpl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }
    
    // Get video info and stream
    const info = await ytpl.getInfo(url);
    const format = ytpl.chooseFormat(info.formats, { quality: 'highestvideo' });
    
    // Set headers for streaming
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="video.mp4"`);
    
    // Stream the video
    ytpl(url, { format }).pipe(res);
  } catch (error) {
    console.error('Error fetching YouTube video:', error);
    res.status(500).json({ error: 'Failed to fetch YouTube video' });
  }
});
```

### Alternative: Using yt-dlp (Python)

```python
from flask import Flask, request, Response
import yt_dlp
import requests

app = Flask(__name__)

@app.route('/api/youtube/stream')
def stream_youtube():
    url = request.args.get('url')
    if not url:
        return {'error': 'YouTube URL is required'}, 400
    
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]',
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            video_url = info['url']
            
            # Stream the video
            response = requests.get(video_url, stream=True)
            return Response(
                response.iter_content(chunk_size=8192),
                mimetype='video/mp4'
            )
    except Exception as e:
        return {'error': str(e)}, 500
```

## Client-Side Conversion

The conversion happens entirely in the browser using FFmpeg.wasm:

1. **Loading FFmpeg** (~10% progress)
2. **Fetching video from proxy** (~15-30% progress)
3. **Converting to M4A** (~40-90% progress)
4. **Finalizing** (~95-100% progress)

### Performance Considerations

- **Large videos** may take significant time and memory
- **Browser compatibility**: Works in modern browsers (Chrome, Firefox, Safari, Edge)
- **Memory usage**: Large videos may cause memory issues on low-end devices
- **Network**: Ensure stable connection for video fetching

## Troubleshooting

### Error: "Failed to fetch YouTube video"
- Check that your backend proxy is running
- Verify the proxy URL in environment variables
- Ensure the proxy endpoint returns the video stream correctly

### Error: "Failed to convert YouTube video to M4A"
- Check browser console for detailed error messages
- Ensure FFmpeg.wasm loaded successfully
- Verify the video format is supported

### Conversion is slow
- This is normal for large videos
- Consider implementing server-side conversion for better performance
- Show progress indicators to users

## Legal Considerations

⚠️ **Important:** Ensure compliance with YouTube's Terms of Service when implementing video downloading functionality.


