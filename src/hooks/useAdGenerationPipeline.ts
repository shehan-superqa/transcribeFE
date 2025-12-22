/**
 * Hook for orchestrating the video ad generation pipeline
 */

import { useState, useEffect, useCallback } from 'react';
import { submitImageJob, getImageJobStatus } from '../lib/api/imageApi';
import { submitVideoJob, getVideoJobStatus } from '../lib/api/videoApi';
import { submitTTSJob, getTTSJobStatus } from '../lib/api/ttsApi';
import { useAuthModal } from '../contexts/AuthModalContext';
import { checkAuthAndTriggerModal } from '../lib/authCheck';
import type { AdScript, AdConfiguration, AdGenerationPipeline, SceneGenerationJob } from '../types/videoAds';

export interface UseAdGenerationPipelineReturn {
  pipeline: AdGenerationPipeline;
  startGeneration: (script: AdScript, configuration: AdConfiguration) => Promise<void>;
  reset: () => void;
}

export function useAdGenerationPipeline(): UseAdGenerationPipelineReturn {
  const { openModal } = useAuthModal();
  const [pipeline, setPipeline] = useState<AdGenerationPipeline>({
    status: 'idle',
    progress: 0,
    sceneJobs: [],
    message: '',
  });

  const executeGeneration = useCallback(async (script: AdScript, configuration: AdConfiguration) => {
    setPipeline({
      status: 'generating-images',
      progress: 0,
      sceneJobs: script.scenes.map((scene) => ({
        sceneId: scene.id,
        status: 'pending',
      })),
      message: 'Starting image generation...',
    });

    // Step 1: Generate scene images
    const imageJobs: Array<{ sceneId: string; jobId: string }> = [];
    
    try {
      for (let i = 0; i < script.scenes.length; i++) {
        const scene = script.scenes[i];
        setPipeline((prev) => ({
          ...prev,
          message: `Generating image for scene ${i + 1}...`,
          progress: (i / script.scenes.length) * 30,
        }));

        try {
          const imageResponse = await submitImageJob({
            prompt: scene.visualDescription,
            width: configuration.onboarding.platform === 'tiktok' ? 1080 : 1920,
            height: configuration.onboarding.platform === 'tiktok' ? 1920 : 1080,
            num_outputs: 1,
          });

          if (imageResponse.success && imageResponse.job_id) {
            imageJobs.push({ sceneId: scene.id, jobId: imageResponse.job_id });
            
            setPipeline((prev) => ({
              ...prev,
              sceneJobs: prev.sceneJobs.map((job) =>
                job.sceneId === scene.id ? { ...job, status: 'generating-image', imageJobId: imageResponse.job_id } : job
              ),
            }));
          }
        } catch (imageError: any) {
          // Check if this is an authentication error
          const errorMessage = imageError.message || imageError.response?.data?.message || '';
          const isAuthError = 
            errorMessage.includes('not authenticated') ||
            errorMessage.includes('Please log in') ||
            errorMessage.includes('Authentication failed') ||
            errorMessage.includes('Authentication required') ||
            imageError.response?.status === 401;

          if (isAuthError) {
            // Show auth modal - will retry generation after successful auth
            // Use setTimeout to ensure modal appears
            setTimeout(() => {
              checkAuthAndTriggerModal(openModal, () => executeGeneration(script, configuration));
            }, 100);
            // Don't set error message - modal will handle it
            return;
          }
          throw imageError; // Re-throw if not auth error
        }
      }

      // Poll for image completion
      let imagesCompleted = 0;
      const imageUrls: Record<string, string> = {};

      while (imagesCompleted < imageJobs.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        for (const { sceneId, jobId } of imageJobs) {
          if (imageUrls[sceneId]) continue;

          try {
            const statusResponse = await getImageJobStatus(jobId);
            if (statusResponse.success && statusResponse.job) {
              const job = statusResponse.job;
              if (job.status === 'completed' && job.result?.image_urls?.[0]) {
                imageUrls[sceneId] = job.result.image_urls[0];
                imagesCompleted++;
                
                setPipeline((prev) => ({
                  ...prev,
                  sceneJobs: prev.sceneJobs.map((job) =>
                    job.sceneId === sceneId
                      ? { ...job, status: 'generating-video', imageUrl: imageUrls[sceneId] }
                      : job
                  ),
                  progress: 30 + (imagesCompleted / imageJobs.length) * 20,
                }));
              } else if (job.status === 'error') {
                setPipeline((prev) => ({
                  ...prev,
                  sceneJobs: prev.sceneJobs.map((job) =>
                    job.sceneId === sceneId ? { ...job, status: 'error', error: job.error } : job
                  ),
                }));
              }
            }
          } catch (err) {
            console.error(`Error checking image job ${jobId}:`, err);
          }
        }
      }

      // Step 2: Generate video clips
      setPipeline((prev) => ({
        ...prev,
        status: 'generating-videos',
        message: 'Creating video clips...',
      }));

      const videoJobs: Array<{ sceneId: string; jobId: string }> = [];

      for (let i = 0; i < script.scenes.length; i++) {
        const scene = script.scenes[i];
        const imageUrl = imageUrls[scene.id];
        if (!imageUrl) continue;

        setPipeline((prev) => ({
          ...prev,
          message: `Generating video for scene ${i + 1}...`,
          progress: 50 + (i / script.scenes.length) * 20,
        }));

        try {
          const videoResponse = await submitVideoJob({
            prompt: scene.visualDescription,
            reference_images: [imageUrl],
            aspect_ratio: configuration.onboarding.platform === 'tiktok' ? '9:16' : '16:9',
            duration: Math.min(scene.duration, 8) as 4 | 6 | 8,
            generate_audio: false, // We'll add voiceover separately
          });

          if (videoResponse.success && videoResponse.job_id) {
            videoJobs.push({ sceneId: scene.id, jobId: videoResponse.job_id });
          }
        } catch (videoError: any) {
          // Check if this is an authentication error
          const errorMessage = videoError.message || videoError.response?.data?.message || '';
          const isAuthError = 
            errorMessage.includes('not authenticated') ||
            errorMessage.includes('Please log in') ||
            errorMessage.includes('Authentication failed') ||
            errorMessage.includes('Authentication required') ||
            videoError.response?.status === 401;

          if (isAuthError) {
            // Show auth modal - will retry generation after successful auth
            // Use setTimeout to ensure modal appears
            setTimeout(() => {
              checkAuthAndTriggerModal(openModal, () => executeGeneration(script, configuration));
            }, 100);
            // Don't set error message - modal will handle it
            return;
          }
          throw videoError; // Re-throw if not auth error
        }
      }

      // Poll for video completion
      let videosCompleted = 0;
      const videoUrls: Record<string, string> = {};

      while (videosCompleted < videoJobs.length) {
        await new Promise((resolve) => setTimeout(resolve, 3000));

        for (const { sceneId, jobId } of videoJobs) {
          if (videoUrls[sceneId]) continue;

          try {
            const statusResponse = await getVideoJobStatus(jobId);
            if (statusResponse.success && statusResponse.job) {
              const job = statusResponse.job;
              if (job.status === 'completed' && (job.result?.video_url || job.video_output_url)) {
                videoUrls[sceneId] = job.result?.video_url || job.video_output_url || '';
                videosCompleted++;
                
                setPipeline((prev) => ({
                  ...prev,
                  sceneJobs: prev.sceneJobs.map((job) =>
                    job.sceneId === sceneId
                      ? { ...job, status: 'completed', videoUrl: videoUrls[sceneId] }
                      : job
                  ),
                  progress: 70 + (videosCompleted / videoJobs.length) * 15,
                }));
              }
            }
          } catch (err) {
            console.error(`Error checking video job ${jobId}:`, err);
          }
        }
      }

      // Step 3: Generate voiceover
      setPipeline((prev) => ({
        ...prev,
        status: 'generating-voiceover',
        message: 'Generating voiceover...',
        progress: 85,
      }));

      const fullScriptText = script.scenes.map((s) => s.text).join(' ');
      let ttsResponse;
      try {
        ttsResponse = await submitTTSJob({
          text: fullScriptText,
          voice: configuration.voice || 'English_Trustworth_Man',
          language: configuration.onboarding.languages[0] || 'en',
        });
      } catch (ttsError: any) {
        // Check if this is an authentication error
        const errorMessage = ttsError.message || ttsError.response?.data?.message || '';
        const isAuthError = 
          errorMessage.includes('not authenticated') ||
          errorMessage.includes('Please log in') ||
          errorMessage.includes('Authentication failed') ||
          errorMessage.includes('Authentication required') ||
          ttsError.response?.status === 401;

        if (isAuthError) {
          // Show auth modal - will retry generation after successful auth
          // Use setTimeout to ensure modal appears
          setTimeout(() => {
            checkAuthAndTriggerModal(openModal, () => executeGeneration(script, configuration));
          }, 100);
          // Don't set error message - modal will handle it
          return;
        }
        throw ttsError; // Re-throw if not auth error
      }

      if (ttsResponse.success && ttsResponse.job_id) {
        setPipeline((prev) => ({
          ...prev,
          voiceoverJob: {
            jobId: ttsResponse.job_id,
            status: 'processing',
          },
        }));

        // Poll for TTS completion
        let ttsCompleted = false;
        while (!ttsCompleted) {
          await new Promise((resolve) => setTimeout(resolve, 2000));

          try {
            const ttsStatusResponse = await getTTSJobStatus(ttsResponse.job_id);
            if (ttsStatusResponse.success && ttsStatusResponse.job) {
              const ttsJob = ttsStatusResponse.job;
              if (ttsJob.status === 'completed' && (ttsJob.audio_url || ttsJob.audio_output_url)) {
                ttsCompleted = true;
                setPipeline((prev) => ({
                  ...prev,
                  voiceoverJob: {
                    jobId: ttsResponse.job_id,
                    status: 'completed',
                    audioUrl: ttsJob.audio_url || ttsJob.audio_output_url,
                  },
                  progress: 95,
                }));
              } else if (ttsJob.status === 'error') {
                setPipeline((prev) => ({
                  ...prev,
                  voiceoverJob: {
                    jobId: ttsResponse.job_id,
                    status: 'error',
                    error: ttsJob.error,
                  },
                }));
                ttsCompleted = true;
              }
            }
          } catch (err) {
            console.error('Error checking TTS job:', err);
          }
        }
      }

      // Step 4: Assembly (backend should handle this, but for now we'll mark as complete)
      setPipeline((prev) => ({
        ...prev,
        status: 'assembling',
        message: 'Assembling final video...',
        progress: 98,
      }));

      // Simulate assembly - in production, backend would combine video + audio
      setTimeout(() => {
        // For now, use first video URL as final (backend should merge all scenes + audio)
        const firstVideoUrl = Object.values(videoUrls)[0];
        setPipeline((prev) => ({
          ...prev,
          status: 'completed',
          progress: 100,
          message: 'Video generation completed!',
          finalVideoUrl: firstVideoUrl, // Backend should provide merged video URL
        }));
      }, 2000);

    } catch (error: any) {
      // Check if this is an authentication error
      if (
        error.message?.includes('not authenticated') ||
        error.message?.includes('Please log in') ||
        error.message?.includes('Authentication failed') ||
        error.message?.includes('Authentication required') ||
        error.response?.status === 401
      ) {
        // Show auth modal - will retry generation after successful auth
        checkAuthAndTriggerModal(openModal, () => executeGeneration(script, configuration));
        setPipeline((prev) => ({
          ...prev,
          status: 'error',
          error: 'Authentication required',
        }));
        return;
      }

      setPipeline((prev) => ({
        ...prev,
        status: 'error',
        error: error.message || 'Generation failed',
      }));
    }
  }, [openModal]);

  const startGeneration = useCallback(async (script: AdScript, configuration: AdConfiguration) => {
    // Check authentication before proceeding
    if (!checkAuthAndTriggerModal(openModal, () => executeGeneration(script, configuration))) {
      // Auth modal was opened, stop here - don't set error, modal will handle it
      return;
    }

    // User is authenticated, proceed with generation
    await executeGeneration(script, configuration);
  }, [openModal, executeGeneration]);

  const reset = useCallback(() => {
    setPipeline({
      status: 'idle',
      progress: 0,
      sceneJobs: [],
      message: '',
    });
  }, []);

  return {
    pipeline,
    startGeneration,
    reset,
  };
}



