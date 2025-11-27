import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getUserJobs } from "../lib/api/jobsApi";
import type { Job } from "../types/api";
import type { RootState } from "./index";

export interface Transcription {
  id: string;
  input_type: "file" | "youtube" | "recording";
  input_source: string;
  transcription_text: string | null;
  duration_seconds: number | null;
  energy_cost: number;
  status: "processing" | "completed" | "failed";
  created_at: string;
  engine_used?: string;
  file_size?: number;
  file_size_mb?: number;
  error?: string;
  started_at?: string;
  finished_at?: string;
}

export interface TranscriptionsState {
  items: Transcription[];
  loading: boolean;
  error: string | null;
}

const initialState: TranscriptionsState = {
  items: [],
  loading: false,
  error: null,
};

/**
 * Map API job status to frontend status
 */
function mapJobStatus(status: string): "processing" | "completed" | "failed" {
  if (status === "completed") {
    return "completed";
  }
  if (status === "error" || status === "cancelled") {
    return "failed";
  }
  // queued, starting, processing -> processing
  return "processing";
}

/**
 * Determine input type from job metadata
 */
function determineInputType(job: Job): "file" | "youtube" | "recording" {
  const filename = job.file_info?.filename?.toLowerCase() || "";
  
  // Check if it's a YouTube URL (stored in input_source or filename)
  if (filename.includes("youtube") || filename.includes("youtu.be") || filename.includes("watch?v=")) {
    return "youtube";
  }
  
  // Check if it's a recording
  if (filename.includes("recording") || filename.includes("webm") || filename.includes("live_recording")) {
    return "recording";
  }
  
  // Default to file
  return "file";
}

/**
 * Calculate duration from transcription segments or processing time
 */
function calculateDuration(job: Job): number | null {
  // Try to get duration from segments if available
  if (job.result?.segments && Array.isArray(job.result.segments)) {
    const segments = job.result.segments;
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      return Math.ceil(lastSegment.end);
    }
  }
  
  // Try to get duration from processing_time if available
  if (job.result?.processing_time?.total_seconds) {
    return job.result.processing_time.total_seconds;
  }
  
  // Try to calculate from started_at and finished_at
  if (job.started_at && job.finished_at) {
    const start = new Date(job.started_at).getTime();
    const finish = new Date(job.finished_at).getTime();
    if (start && finish && finish > start) {
      return Math.ceil((finish - start) / 1000);
    }
  }
  
  return null;
}

/**
 * Extract filename or generate a meaningful name
 */
function extractInputSource(job: Job): string {
  if (job.file_info?.filename) {
    // If filename exists and is not "unknown", use it
    const filename = job.file_info.filename.trim();
    if (filename && filename.toLowerCase() !== "unknown" && filename !== "") {
      return filename;
    }
  }
  
  // Generate a name based on input type and date
  const inputType = determineInputType(job);
  const date = new Date(job.created_at).toLocaleDateString();
  
  switch (inputType) {
    case "youtube":
      return `YouTube Video - ${date}`;
    case "recording":
      return `Recording - ${date}`;
    default:
      return `Audio/Video File - ${date}`;
  }
}

/**
 * Map API job to frontend Transcription interface
 */
function mapJobToTranscription(job: Job): Transcription {
  const fileSize = job.file_info?.size || 0;
  const fileSizeMB = fileSize > 0 ? fileSize / (1024 * 1024) : undefined;
  
  return {
    id: job._id,
    input_type: determineInputType(job),
    input_source: extractInputSource(job),
    transcription_text: job.result?.text || null,
    duration_seconds: calculateDuration(job),
    energy_cost: 10, // Default cost, backend may provide this in the future
    status: mapJobStatus(job.status),
    created_at: job.created_at,
    engine_used: job.engine_used,
    file_size: fileSize,
    file_size_mb: fileSizeMB,
    error: job.error,
    started_at: job.started_at,
    finished_at: job.finished_at,
  };
}

// Async thunk to fetch transcriptions
export const fetchTranscriptions = createAsyncThunk<
  Transcription[],
  void,
  { state: RootState; rejectValue: string }
>("transcriptions/fetch", async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const user = state.auth.user;
    
    if (!user || !user.id) {
      return rejectWithValue("User not authenticated");
    }

    const response = await getUserJobs(user.id);
    
    if (response.success && response.jobs) {
      // Map API jobs to frontend Transcription format
      return response.jobs.map(mapJobToTranscription);
    }
    
    return rejectWithValue("Failed to fetch transcriptions");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch transcriptions");
  }
});

const transcriptionsSlice = createSlice({
  name: "transcriptions",
  initialState,
  reducers: {
    clearTranscriptions(state) {
      state.items = [];
      state.error = null;
    },
    addTranscription(state, action) {
      state.items.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTranscriptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTranscriptions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchTranscriptions.rejected, (state, action) => {
        state.loading = false;
        const errorMessage = action.payload || "Failed to fetch transcriptions";
        // Only set error if it's not an authentication issue (those are handled by interceptors)
        if (!errorMessage.includes('Authentication failed') && !errorMessage.includes('Authentication service unavailable')) {
          state.error = errorMessage;
        } else {
          // Clear error for auth issues as they're handled by interceptors
          state.error = null;
        }
      });
  },
});

export const { clearTranscriptions, addTranscription } = transcriptionsSlice.actions;
export default transcriptionsSlice.reducer;
