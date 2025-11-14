import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getUserJobs, type JobResult } from "../lib/transcribeApi";
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
  if (status === "error") {
    return "failed";
  }
  // queued, processing -> processing
  return "processing";
}

/**
 * Determine input type from job metadata
 */
function determineInputType(job: JobResult): "file" | "youtube" | "recording" {
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
 * Map API job to frontend Transcription interface
 */
function mapJobToTranscription(job: JobResult): Transcription {
  return {
    id: job._id,
    input_type: determineInputType(job),
    input_source: job.file_info?.filename || "unknown",
    transcription_text: job.result?.text || null,
    duration_seconds: null, // Duration may not be available in job result
    energy_cost: 10, // Default cost, backend may provide this in the future
    status: mapJobStatus(job.status),
    created_at: job.created_at,
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
        state.error = action.payload || "Failed to fetch transcriptions";
      });
  },
});

export const { clearTranscriptions, addTranscription } = transcriptionsSlice.actions;
export default transcriptionsSlice.reducer;
