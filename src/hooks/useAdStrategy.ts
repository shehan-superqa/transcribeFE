/**
 * Hook for generating ad strategy using GPT-5
 */

import { useState, useEffect } from 'react';
import { chatCompletion } from '../lib/api/gpt5Api';
import { getStrategySystemPrompt, getStrategyUserPrompt, parseStrategyResponse } from '../utils/adStrategyPrompts';
import type { OnboardingData, AdStrategy } from '../types/videoAds';

export interface UseAdStrategyReturn {
  strategy: AdStrategy | null;
  loading: boolean;
  error: string | null;
  generateStrategy: (onboarding: OnboardingData) => Promise<void>;
}

export function useAdStrategy(): UseAdStrategyReturn {
  const [strategy, setStrategy] = useState<AdStrategy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const generateStrategy = async (onboarding: OnboardingData) => {
    setLoading(true);
    setError(null);
    setStrategy(null);

    try {
      const systemPrompt = getStrategySystemPrompt();
      const userPrompt = getStrategyUserPrompt(onboarding);

      const response = await chatCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: 'gpt-4o', // Use appropriate model
        verbosity: 'low',
      });

      if (response.success && response.job_id) {
        setJobId(response.job_id);
        // Strategy will be parsed when job completes via polling
      } else {
        throw new Error('Failed to start strategy generation');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate strategy');
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
            const parsedStrategy = parseStrategyResponse(job.result.text);
            setStrategy(parsedStrategy as AdStrategy);
            setLoading(false);
            setJobId(null);
          } else if (job.status === 'error') {
            setError(job.error || 'Strategy generation failed');
            setLoading(false);
            setJobId(null);
          }
          // Continue polling if still processing
        }
      } catch (err: any) {
        console.error('Error polling strategy job:', err);
        // Don't set error immediately, might be temporary
      }
    };

    const interval = setInterval(pollJob, 1000);
    pollJob(); // Poll immediately

    return () => clearInterval(interval);
  }, [jobId]);

  return {
    strategy,
    loading,
    error,
    generateStrategy,
  };
}








