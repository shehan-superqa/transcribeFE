/**
 * Job store for managing job queue and history
 */

import { create } from 'zustand';
import type { Job } from '../types/api';
import { getUserJobs, getJobStatus, cancelJob } from '../lib/api/jobsApi';

interface JobState {
  jobs: Job[];
  activeJobs: Job[];
  isLoading: boolean;
  error: string | null;
  fetchJobs: (userId: string) => Promise<void>;
  getJob: (jobId: string) => Promise<Job | null>;
  cancelJob: (jobId: string) => Promise<void>;
  updateJob: (job: Job) => void;
  addJob: (job: Job) => void;
}

export const jobStore = create<JobState>((set, get) => ({
  jobs: [],
  activeJobs: [],
  isLoading: false,
  error: null,

  fetchJobs: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await getUserJobs(userId);
      
      const jobs = response.jobs || [];
      const activeJobs = jobs.filter(
        (job) => ['queued', 'starting', 'processing', 'running'].includes(job.status)
      );

      set({ jobs, activeJobs, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch jobs';
      set({ error: errorMessage, isLoading: false });
    }
  },

  getJob: async (jobId: string) => {
    try {
      const response = await getJobStatus(jobId);
      if (response.job) {
        get().updateJob(response.job);
        return response.job;
      }
      return null;
    } catch (error: any) {
      console.error('Error fetching job:', error);
      return null;
    }
  },

  cancelJob: async (jobId: string) => {
    try {
      await cancelJob(jobId);
      // Update job status locally
      const jobs = get().jobs.map((job) =>
        job._id === jobId ? { ...job, status: 'cancelled' as const } : job
      );
      const activeJobs = jobs.filter(
        (job) => ['queued', 'starting', 'processing', 'running'].includes(job.status)
      );
      set({ jobs, activeJobs });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to cancel job';
      set({ error: errorMessage });
      throw error;
    }
  },

  updateJob: (updatedJob: Job) => {
    const jobs = get().jobs.map((job) =>
      job._id === updatedJob._id ? updatedJob : job
    );
    const activeJobs = jobs.filter(
      (job) => ['queued', 'starting', 'processing', 'running'].includes(job.status)
    );
    set({ jobs, activeJobs });
  },

  addJob: (job: Job) => {
    const jobs = [job, ...get().jobs];
    const activeJobs = jobs.filter(
      (job) => ['queued', 'starting', 'processing', 'running'].includes(job.status)
    );
    set({ jobs, activeJobs });
  },
}));

