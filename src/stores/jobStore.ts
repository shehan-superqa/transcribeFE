/**
 * Job store for managing job queue and history
 */

import { create } from 'zustand';
import type { Job, ActiveJobsEvent } from '../types/api';
import { getUserJobs, getJobStatus, cancelJob, deleteJob } from '../lib/api/jobsApi';

interface JobState {
  jobs: Job[];
  activeJobs: Job[];
  isLoading: boolean;
  error: string | null;
  fetchJobs: (userId: string) => Promise<void>;
  getJob: (jobId: string) => Promise<Job | null>;
  cancelJob: (jobId: string) => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;
  updateJob: (job: Job) => void;
  addJob: (job: Job) => void;
  setActiveJobsFromWebSocket: (event: ActiveJobsEvent) => void;
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
      console.log('Jobs fetched from API:', jobs.length);
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

  deleteJob: async (jobId: string) => {
    try {
      await deleteJob(jobId);
      // Remove job from local state
      const jobs = get().jobs.filter((job) => job._id !== jobId);
      const activeJobs = jobs.filter(
        (job) => ['queued', 'starting', 'processing', 'running'].includes(job.status)
      );
      set({ jobs, activeJobs });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete job';
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
    // Add job to the end of the array (bottom of list) since we sort oldest first
    const currentJobs = get().jobs;
    // Check if job already exists to avoid duplicates
    if (currentJobs.some(j => j._id === job._id)) {
      return;
    }
    const jobs = [...currentJobs, job];
    const activeJobs = jobs.filter(
      (job) => ['queued', 'starting', 'processing', 'running'].includes(job.status)
    );
    set({ jobs, activeJobs });
    console.log('Job added to store:', job._id, 'Total jobs:', jobs.length);
  },

  setActiveJobsFromWebSocket: (event: ActiveJobsEvent) => {
    if (event.error) {
      console.error('Error in active_jobs event:', event.error);
      set({ error: event.error });
      return;
    }

    // Map WebSocket job format to Job type
    const jobsFromWebSocket: Job[] = (event.jobs || []).map((wsJob) => {
      // Ensure file_info has required fields
      const fileInfo = wsJob.file_info || {
        filename: 'Unknown',
        size: 0,
        extension: '',
      };

      return {
        _id: wsJob.job_id,
        user_id: wsJob.user_id || '',
        file_info: {
          filename: fileInfo.filename || 'Unknown',
          size: fileInfo.size || 0,
          extension: fileInfo.extension || '',
          size_mb: fileInfo.size_mb,
          modified: fileInfo.modified,
        },
        engine_used: 'unknown', // Default value, can be updated later
        status: wsJob.status,
        created_at: wsJob.created_at,
        started_at: wsJob.started_at,
        updated_at: wsJob.updated_at || wsJob.created_at,
        result: wsJob.result,
        error: wsJob.error,
      };
    });

    // Update jobs: merge with existing jobs, updating existing ones and adding new ones
    const currentJobs = get().jobs;
    const jobsMap = new Map(currentJobs.map(job => [job._id, job]));
    
    // Update or add jobs from WebSocket
    jobsFromWebSocket.forEach(wsJob => {
      const existingJob = jobsMap.get(wsJob._id);
      // Merge with existing job to preserve fields like engine_used if they exist
      if (existingJob) {
        jobsMap.set(wsJob._id, {
          ...existingJob,
          ...wsJob,
          // Preserve engine_used from existing job if WebSocket job doesn't have it
          engine_used: wsJob.engine_used === 'unknown' && existingJob.engine_used ? existingJob.engine_used : wsJob.engine_used,
        });
      } else {
        jobsMap.set(wsJob._id, wsJob);
      }
    });

    const allJobs = Array.from(jobsMap.values());
    const activeJobs = allJobs.filter(
      (job) => ['queued', 'starting', 'processing', 'running'].includes(job.status)
    );

    set({ jobs: allJobs, activeJobs });
    console.log(`Active jobs updated from WebSocket: ${activeJobs.length} active jobs out of ${allJobs.length} total`);
  },
}));

