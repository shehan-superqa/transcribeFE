// src/store/dataSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchDataFromApi } from "../lib/api";

export interface ApiCallState {
  data: any;
  loading: boolean;
  error: string | null;
}

export interface DataState {
  [key: string]: ApiCallState;
}

const initialState: DataState = {};

// Generic API thunk with cache key
export const fetchData = createAsyncThunk<
  { key: string; data: any },
  { endpoint: string; options?: RequestInit; key: string },
  { rejectValue: string }
>(
  "data/fetchData",
  async ({ endpoint, options, key }, { rejectWithValue }) => {
    try {
      const data = await fetchDataFromApi(endpoint, options);
      return { key, data };
    } catch (err: any) {
      return rejectWithValue(err.error || err.message || "API Error");
    }
  }
);

const dataSlice = createSlice({
  name: "data",
  initialState,
  reducers: {
    clearData(state, action) {
      const key = action.payload;
      if (key && state[key]) {
        delete state[key];
      }
    },
    clearAllData() {
      return {};
    },
    setData(state, action) {
      const { key, data } = action.payload;
      state[key] = {
        data,
        loading: false,
        error: null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchData.pending, (state, action) => {
        const key = action.meta.arg.key;
        state[key] = {
          data: state[key]?.data || null,
          loading: true,
          error: null,
        };
      })
      .addCase(fetchData.fulfilled, (state, action) => {
        const { key, data } = action.payload;
        state[key] = {
          data,
          loading: false,
          error: null,
        };
      })
      .addCase(fetchData.rejected, (state, action) => {
        const key = action.meta.arg.key;
        state[key] = {
          data: state[key]?.data || null,
          loading: false,
          error: action.payload || "API Error",
        };
      });
  },
});

export const { clearData, clearAllData, setData } = dataSlice.actions;
export default dataSlice.reducer;
