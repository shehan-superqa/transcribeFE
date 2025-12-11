/**
 * Hook for generating ad script using GPT-5
 */

import { useState, useEffect } from 'react';
import { chatCompletion } from '../lib/api/gpt5Api';
import { getScriptSystemPrompt, getScriptUserPrompt, parseScriptResponse } from '../utils/adScriptPrompts';
import type { OnboardingData, AdStrategy, AdScript } from '../types/videoAds';

export interface UseAdScriptReturn {
  script: AdScript | null;
  loading: boolean;
  error: string | null;
  generateScript: (onboarding: OnboardingData, strategy: AdStrategy) => Promise<void>;
}

export function useAdScript(): UseAdScriptReturn {
  const [script, setScript] = useState<AdScript | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [currentStrategy, setCurrentStrategy] = useState<AdStrategy | null>(null);

  const generateScript = async (onboarding: OnboardingData, strategy: AdStrategy) => {
    setLoading(true);
    setError(null);
    setScript(null);
    setCurrentStrategy(strategy);

    try {
      const systemPrompt = getScriptSystemPrompt();
      const userPrompt = getScriptUserPrompt(onboarding, strategy);

      const response = await chatCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: 'gpt-4o', // Use appropriate model
        verbosity: 'medium',
      });

      if (response.success && response.job_id) {
        setJobId(response.job_id);
        // Script will be parsed when job completes via polling
      } else {
        throw new Error('Failed to start script generation');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate script');
      setLoading(false);
    }
  };

  // Poll for job completion
  useEffect(() => {
    if (!jobId) return;

    const pollJob = async () => {
      try {
        const { getGPT5JobStatus } = await import('../lib/api/gpt5Api');
        const response = await getGPT5JobStatus(jobId);

        if (response.success && response.job) {
          const job = response.job;

          if (job.status === 'completed' && job.result?.text) {
            const parsedScript = parseScriptResponse(job.result.text, currentStrategy?.adLength || 15);
            setScript(parsedScript as AdScript);
            setLoading(false);
            setJobId(null);
          } else if (job.status === 'error') {
            setError(job.error || 'Script generation failed');
            setLoading(false);
            setJobId(null);
          }
          // Continue polling if still processing
        }
      } catch (err: any) {
        console.error('Error polling script job:', err);
        // Don't set error immediately, might be temporary
      }
    };

    const interval = setInterval(pollJob, 1000);
    pollJob(); // Poll immediately

    return () => clearInterval(interval);
  }, [jobId, currentStrategy?.adLength]);

  return {
    script,
    loading,
    error,
    generateScript,
  };
}

