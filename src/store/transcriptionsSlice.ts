import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getTranscriptions } from "../lib/api";
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

// Async thunk to fetch transcriptions
export const fetchTranscriptions = createAsyncThunk<
  Transcription[],
  void,
  { state: RootState; rejectValue: string }
>("transcriptions/fetch", async (_, { rejectWithValue }) => {
  try {
    const response = await getTranscriptions();
    if (response.success) {
      return response.transcriptions;
    }
    return rejectWithValue("Failed to fetch transcriptions");
  } catch (error: any) {
    return rejectWithValue(error.error || "Failed to fetch transcriptions");
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
