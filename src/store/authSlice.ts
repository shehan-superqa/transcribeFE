// src/store/authSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  loginUser as apiLogin,
  registerUser as apiRegister,
  getCurrentUser,
  verifyToken,
  logoutUser as apiLogout,
  getAuthToken,
  getStoredUser,
  setStoredUser,
  User,
} from "../lib/api";

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,
};

// Auto-login on app start
export const checkAuth = createAsyncThunk<User | null, void, { rejectValue: string }>(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      const storedUser = getStoredUser();

      if (!token || !storedUser) return null;

      try {
        const verification = await verifyToken(token);
        if (!verification.valid) {
          apiLogout();
          return null;
        }

        try {
          const freshUser = await getCurrentUser();
          if (freshUser.success) {
            setStoredUser(freshUser.user);
            return freshUser.user;
          }
        } catch {
          // If backend is not available, use stored user
          return storedUser;
        }
      } catch {
        // If backend is not available for token verification, use stored user
        return storedUser;
      }

      return null;
    } catch (err: any) {
      return rejectWithValue(err.error || "Authentication check failed");
    }
  }
);

export const loginUser = createAsyncThunk<
  User,
  { email: string; password: string },
  { rejectValue: string }
>("auth/login", async ({ email, password }, { rejectWithValue }) => {
  try {
    const res = await apiLogin(email, password);
    if (!res.success) return rejectWithValue(res.message || "Login failed");

    setStoredUser(res.user);
    return res.user;
  } catch (err: any) {
    return rejectWithValue(err.error || "Login failed");
  }
});

export const signupUser = createAsyncThunk<
  User,
  { email: string; password: string; name?: string },
  { rejectValue: string }
>("auth/signup", async ({ email, password, name }, { rejectWithValue }) => {
  try {
    const res = await apiRegister(email, password, name);
    if (!res.success) return rejectWithValue(res.message || "Signup failed");

    setStoredUser(res.user);
    return res.user;
  } catch (err: any) {
    return rejectWithValue(err.error || "Signup failed");
  }
});

export const refreshUserData = createAsyncThunk<User | null, void, { rejectValue: string }>(
  "auth/refreshUser",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getCurrentUser();
      if (res.success) {
        setStoredUser(res.user);
        return res.user;
      }
      return null;
    } catch (err: any) {
      return rejectWithValue(err.error || "Failed to refresh user data");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      apiLogout();
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        state.isAuthenticated = !!action.payload;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload || "Authentication check failed";
      })

      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Login failed";
        state.isAuthenticated = false;
      })

      // Signup
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Signup failed";
        state.isAuthenticated = false;
      })

      // Refresh User Data
      .addCase(refreshUserData.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        }
      })
      .addCase(refreshUserData.rejected, (state, action) => {
        state.error = action.payload || "Failed to refresh user data";
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
