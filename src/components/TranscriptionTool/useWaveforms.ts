import { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Recording } from './types';

export const useWaveforms = (recordings: Recording[], recordingsContainerRef: React.RefObject<HTMLDivElement>) => {
  const waveformsRef = useRef<Map<string, WaveSurfer>>(new Map());

  useEffect(() => {
    if (recordings.length === 0 || !recordingsContainerRef.current) return;

    // Process each recording individually
    const processRecordings = async () => {
      for (const recording of recordings) {
        // Wait for DOM to be ready
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Find the container element for this recording
        let containerElement = document.getElementById(recording.id);
        let attempts = 0;
        while (!containerElement && attempts < 15) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          containerElement = document.getElementById(recording.id);
          attempts++;
        }

        if (!containerElement) {
          console.warn('Container element not found for recording:', recording.id);
          continue;
        }

        const waveformDiv = containerElement.querySelector('[data-waveform]') as HTMLDivElement;
        if (!waveformDiv) {
          console.warn('Waveform div not found for recording:', recording.id);
          continue;
        }

        // Check if we already have a wavesurfer instance for this recording
        const existingWaveform = waveformsRef.current.get(recording.id);
        
        // If wavesurfer exists but DOM was recreated (React re-render), we need to recreate it
        if (existingWaveform) {
          // Check if the wavesurfer's container still exists in the DOM
          try {
            const oldContainer = existingWaveform.getWrapper();
            if (oldContainer && oldContainer.parentNode && waveformDiv !== oldContainer.parentNode) {
              // DOM was recreated, destroy old instance and create new one
              console.log('DOM recreated for recording, recreating waveform:', recording.id);
              existingWaveform.destroy();
              waveformsRef.current.delete(recording.id);
            } else if (waveformDiv.children.length > 0 && waveformDiv.querySelector('wave')) {
              // Waveform already rendered and connected, skip
              continue;
            } else {
              // Waveform instance exists but not rendered, skip (will be handled below)
              continue;
            }
          } catch (e) {
            // Old instance is invalid, remove it
            waveformsRef.current.delete(recording.id);
          }
        }

        // If waveform already exists and is properly connected, skip
        if (existingWaveform && waveformDiv.children.length > 0) {
          continue;
        }

        // Verify we have a valid blob or URL
        if (!recording.blob && (!recording.url || !recording.url.startsWith('blob:'))) {
          console.warn('Invalid recording - no blob or URL:', recording.id);
          continue;
        }

        // Use blob to create URL if URL is missing or invalid, otherwise use existing URL
        let audioUrl = recording.url;
        if (!audioUrl || !audioUrl.startsWith('blob:')) {
          if (recording.blob) {
            // Recreate blob URL from stored blob
            audioUrl = URL.createObjectURL(recording.blob);
            // Note: The parent component should update the recording URL, but for now we'll use it directly
          } else {
            console.warn('No valid blob or URL for recording:', recording.id);
            continue;
          }
        }

        // Create wavesurfer instance
        let recordingWaveform: WaveSurfer | null = null;
        try {
          // Clear any existing content
          waveformDiv.innerHTML = '';

          recordingWaveform = WaveSurfer.create({
            container: waveformDiv,
            waveColor: 'rgb(200, 100, 0)',
            progressColor: 'rgb(100, 50, 0)',
            url: audioUrl,
            height: 60,
            barWidth: 2,
            normalize: true,
            backend: 'WebAudio',
          });

          // Store in ref immediately to prevent duplicate creation
          waveformsRef.current.set(recording.id, recordingWaveform);

          // Set up play button handlers (defined before error handler so it can be reused)
          const setupPlayButton = (waveform: WaveSurfer) => {
            const playButton = containerElement?.querySelector('[data-play-button]') as HTMLButtonElement;
            if (playButton && waveform) {
              playButton.onclick = () => {
                const ws = waveformsRef.current.get(recording.id);
                if (ws) {
                  ws.playPause();
                }
              };

              waveform.on('pause', () => {
                const btn = containerElement?.querySelector('[data-play-button]') as HTMLButtonElement;
                if (btn) btn.textContent = 'Play';
              });
              waveform.on('play', () => {
                const btn = containerElement?.querySelector('[data-play-button]') as HTMLButtonElement;
                if (btn) btn.textContent = 'Pause';
              });
            }
          };

          // Handle errors during loading
          recordingWaveform.on('error', (error) => {
            console.warn('Waveform loading error for recording', recording.id, ':', error);
            
            // If WebAudio fails, try MediaElement backend as fallback
            const errorMessage = error?.message || String(error || '');
            if (errorMessage.includes('decode') || errorMessage.includes('EncodingError') || errorMessage.includes('Failed to fetch')) {
              console.log('Retrying with MediaElement backend for recording:', recording.id);
              try {
                recordingWaveform.destroy();
                waveformsRef.current.delete(recording.id);
                
                // Retry with MediaElement backend
                const retryWaveform = WaveSurfer.create({
                  container: waveformDiv,
                  waveColor: 'rgb(200, 100, 0)',
                  progressColor: 'rgb(100, 50, 0)',
                  url: audioUrl,
                  height: 60,
                  barWidth: 2,
                  normalize: true,
                  backend: 'MediaElement',
                });
                
                waveformsRef.current.set(recording.id, retryWaveform);
                
                retryWaveform.on('error', (retryError) => {
                  console.warn('MediaElement backend also failed for recording', recording.id, ':', retryError);
                });
                
                retryWaveform.on('ready', () => {
                  console.log('Waveform ready (MediaElement) for recording:', recording.id);
                  setupPlayButton(retryWaveform);
                });
              } catch (retryError) {
                console.error('Failed to retry with MediaElement backend:', retryError);
              }
            }
          });

          // Log when waveform is ready
          recordingWaveform.on('ready', () => {
            console.log('Waveform ready for recording:', recording.id);
            setupPlayButton(recordingWaveform);
          });

          // Setup play button after a short delay (fallback in case ready event doesn't fire)
          setTimeout(() => setupPlayButton(recordingWaveform), 100);
        } catch (error) {
          console.warn('Error creating wavesurfer for recording', recording.id, ':', error);
          waveformsRef.current.delete(recording.id);
          continue;
        }
      }
    };

    // Start processing after a delay
    const timeoutId = setTimeout(() => {
      processRecordings();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [recordings, recordingsContainerRef]);

  // Cleanup function
  const cleanup = () => {
    waveformsRef.current.forEach((wavesurfer, id) => {
      try {
        wavesurfer.destroy();
      } catch (error) {
        console.warn('Error destroying wavesurfer:', error);
      }
      waveformsRef.current.delete(id);
    });
  };

  return { waveformsRef, cleanup };
};

