// src/store/authSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  loginUser as apiLogin,
  registerUser as apiRegister,
  getCurrentUser,
  logoutUser as apiLogout,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  setStoredUser,
  clearAuthData,
  refreshToken as apiRefreshToken,
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
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();
      const storedUser = getStoredUser();

      if (!accessToken || !storedUser) {
        // No token or user, ensure auth data is cleared
        clearAuthData();
        return null;
      }

      try {
        const freshUser = await getCurrentUser();
        if (freshUser.success && freshUser.data) {
          setStoredUser(freshUser.data);
          return freshUser.data;
        } else {
          // Token is invalid or user data is missing, try to refresh token
          if (refreshToken) {
            try {
              await apiRefreshToken();
              // Retry getting user after refresh
              const retryUser = await getCurrentUser();
              if (retryUser.success && retryUser.data) {
                setStoredUser(retryUser.data);
                return retryUser.data;
              }
            } catch (refreshError) {
              // Refresh failed, clear auth data
              clearAuthData();
              return null;
            }
          }
          clearAuthData();
          return null;
        }
      } catch (error: any) {
        // Check if it's a 401/403 error (invalid token)
        if (error.message?.includes('401') || error.message?.includes('403') || 
            error.message?.includes('Unauthorized') || error.message?.includes('Forbidden')) {
          // Token is invalid, try to refresh
          if (refreshToken) {
            try {
              await apiRefreshToken();
              // Retry getting user after refresh
              const retryUser = await getCurrentUser();
              if (retryUser.success && retryUser.data) {
                setStoredUser(retryUser.data);
                return retryUser.data;
              }
            } catch (refreshError) {
              // Refresh failed, clear auth data
              clearAuthData();
              return null;
            }
          }
          // No refresh token available, clear auth data
          clearAuthData();
          return null;
        }
        // If backend is not available and we have a stored user, use it
        // But only if we have both token and stored user
        if (accessToken && storedUser) {
          return storedUser;
        }
        // Otherwise clear auth data
        clearAuthData();
        return null;
      }
    } catch (err: any) {
      // On any other error, clear auth data to be safe
      clearAuthData();
      return rejectWithValue(err.message || "Authentication check failed");
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
    if (!res.success || !res.data) {
      return rejectWithValue("Login failed");
    }

    setStoredUser(res.data.user);
    return res.data.user;
  } catch (err: any) {
    return rejectWithValue(err.message || "Login failed");
  }
});

export const signupUser = createAsyncThunk<
  User,
  { email: string; password: string; name?: string },
  { rejectValue: string }
>("auth/signup", async ({ email, password, name }, { rejectWithValue }) => {
  try {
    const res = await apiRegister(email, password, name || "");
    if (!res.success || !res.data) {
      return rejectWithValue("Signup failed");
    }

    setStoredUser(res.data.user);
    return res.data.user;
  } catch (err: any) {
    return rejectWithValue(err.message || "Signup failed");
  }
});

export const refreshUserData = createAsyncThunk<User | null, void, { rejectValue: string }>(
  "auth/refreshUser",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getCurrentUser();
      if (res.success && res.data) {
        setStoredUser(res.data);
        return res.data;
      } else {
        // Token is invalid, clear auth data
        clearAuthData();
        return null;
      }
    } catch (err: any) {
      // Check if it's a 401/403 error (invalid token)
      if (err.message?.includes('401') || err.message?.includes('403') || 
          err.message?.includes('Unauthorized') || err.message?.includes('Forbidden')) {
        // Token is invalid, clear auth data
        clearAuthData();
        return null;
      }
      return rejectWithValue(err.message || "Failed to refresh user data");
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
