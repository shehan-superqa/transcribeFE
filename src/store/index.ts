import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import dataReducer from "./dataSlice";
import transcriptionsReducer from "./transcriptionsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    data: dataReducer,
    transcriptions: transcriptionsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
