/**
 * YouTube to M4A Converter using FFmpeg.wasm
 * Converts YouTube videos to M4A audio format on the client side
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// Note: YouTube blocks direct browser access due to CORS
// You'll need a backend proxy endpoint to fetch the video stream
// Example: GET /api/youtube/stream?url=...
const YOUTUBE_PROXY_URL = import.meta.env.VITE_YOUTUBE_PROXY_URL || '/api/youtube/stream';

export interface ConversionProgress {
  progress: number; // 0-100
  stage: 'loading' | 'fetching' | 'converting' | 'complete';
}

/**
 * Fetches YouTube video stream from backend proxy
 */
async function fetchYouTubeVideo(youtubeUrl: string): Promise<Blob> {
  const proxyUrl = `${YOUTUBE_PROXY_URL}?url=${encodeURIComponent(youtubeUrl)}`;
  
  const response = await fetch(proxyUrl);
  
  if (!response.ok) {
    throw new Error(
      `Failed to fetch YouTube video: ${response.statusText}. ` +
      `Please ensure your backend proxy is configured correctly.`
    );
  }
  
  return await response.blob();
}

/**
 * Converts YouTube video URL to M4A audio file
 * @param youtubeUrl - YouTube video URL
 * @param onProgress - Optional progress callback
 * @returns Promise<File> - M4A audio file
 */
export async function convertYouTubeToM4A(
  youtubeUrl: string,
  onProgress?: (progress: ConversionProgress) => void
): Promise<File> {
  const ffmpeg = new FFmpeg();
  
  try {
    // Stage 1: Loading FFmpeg
    onProgress?.({ progress: 0, stage: 'loading' });
    
    // Load FFmpeg - it will automatically fetch core and wasm from CDN if not configured
    // For better performance, you can configure custom URLs:
    // await ffmpeg.load({ coreURL: '...', wasmURL: '...' });
    await ffmpeg.load();
    
    onProgress?.({ progress: 10, stage: 'loading' });
    
    // Stage 2: Fetching video from backend proxy
    onProgress?.({ progress: 15, stage: 'fetching' });
    const videoBlob = await fetchYouTubeVideo(youtubeUrl);
    onProgress?.({ progress: 30, stage: 'fetching' });
    
    // Stage 3: Writing video to FFmpeg virtual filesystem
    const videoData = await fetchFile(videoBlob);
    await ffmpeg.writeFile('input.mp4', videoData);
    onProgress?.({ progress: 40, stage: 'converting' });
    
    // Stage 4: Converting to M4A
    // Listen to FFmpeg progress events
    ffmpeg.on('progress', ({ progress: ffmpegProgress }) => {
      // Map FFmpeg progress (0-1) to our progress (40-90)
      const mappedProgress = 40 + (ffmpegProgress * 50);
      onProgress?.({ 
        progress: Math.min(mappedProgress, 90), 
        stage: 'converting' 
      });
    });
    
    // Execute conversion
    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-vn',              // No video
      '-acodec', 'aac',   // AAC codec (M4A container)
      '-b:a', '192k',     // Audio bitrate
      '-f', 'mp4',        // MP4 container (M4A is MP4 with audio only)
      'output.m4a'
    ]);
    
    onProgress?.({ progress: 95, stage: 'converting' });
    
    // Stage 5: Reading output file
    const m4aData = await ffmpeg.readFile('output.m4a');
    
    // Clean up virtual filesystem
    await ffmpeg.deleteFile('input.mp4');
    await ffmpeg.deleteFile('output.m4a');
    
    // Create File object
    const m4aBlob = new Blob([m4aData], { type: 'audio/mp4' });
    const m4aFile = new File([m4aBlob], 'youtube-audio.m4a', { 
      type: 'audio/mp4' 
    });
    
    onProgress?.({ progress: 100, stage: 'complete' });
    
    return m4aFile;
  } catch (error: any) {
    // Clean up on error
    try {
      await ffmpeg.deleteFile('input.mp4').catch(() => {});
      await ffmpeg.deleteFile('output.m4a').catch(() => {});
    } catch {}
    
    throw new Error(
      `Failed to convert YouTube video to M4A: ${error.message || 'Unknown error'}`
    );
  }
}

/**
 * Validates YouTube URL format
 */
export function isValidYouTubeUrl(url: string): boolean {
  const patterns = [
    /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/,
    /^https?:\/\/youtube\.com\/watch\?v=[\w-]+/,
    /^https?:\/\/youtu\.be\/[\w-]+/,
  ];
  
  return patterns.some(pattern => pattern.test(url));
}

