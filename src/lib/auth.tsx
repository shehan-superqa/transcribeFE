import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  setStoredUser,
  refreshToken,
  getTokenExpiration,
  ApiError,
} from "./api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
    
    // Function to check and refresh token if needed
    const checkAndRefreshToken = async () => {
      const accessToken = getAccessToken();
      const refreshTokenValue = getRefreshToken();
      
      if (!accessToken || !refreshTokenValue) {
        return;
      }

      try {
        // Check if token is expiring soon (within 5 minutes)
        const tokenExpiration = getTokenExpiration(accessToken);
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        // If token expires within 5 minutes, refresh it
        if (tokenExpiration && (tokenExpiration - now < fiveMinutes)) {
          await refreshToken();
          // Refresh user data after token refresh
          await refreshUserData();
        }
      } catch (error) {
        console.error("Auto token refresh failed:", error);
        // Don't logout immediately - token might still be valid
        // Only logout if we get a clear error that refresh token is invalid
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('invalid') || errorMessage.includes('expired') || errorMessage.includes('401')) {
          await signOut();
        }
      }
    };

    // Check immediately
    checkAndRefreshToken();
    
    // Set up automatic token refresh (check every 5 minutes)
    const refreshInterval = setInterval(checkAndRefreshToken, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, []);

  const initializeAuth = async () => {
    try {
      const accessToken = getAccessToken();
      const storedUser = getStoredUser();

      if (accessToken && storedUser) {
        try {
          // Try to get fresh user data
          const userResponse = await getCurrentUser();
          if (userResponse.success && userResponse.data) {
            setUser(userResponse.data);
            setStoredUser(userResponse.data);
          } else {
            logoutUser();
            setUser(null);
          }
        } catch (error: any) {
          // If backend is not available or token expired, try refreshing token
          const refreshTokenValue = getRefreshToken();
          const isAuthError = error?.message?.includes('401') || 
                             error?.message?.includes('403') || 
                             error?.message?.includes('Unauthorized') || 
                             error?.message?.includes('Forbidden');
          
          if (refreshTokenValue && (isAuthError || !error?.message?.includes('fetch'))) {
            try {
              await refreshToken();
              const userResponse = await getCurrentUser();
              if (userResponse.success && userResponse.data) {
                setUser(userResponse.data);
                setStoredUser(userResponse.data);
              } else {
                logoutUser();
                setUser(null);
              }
            } catch (refreshError) {
              // If refresh also fails, check if it's a network error
              const refreshErrorMsg = refreshError instanceof Error ? refreshError.message : String(refreshError);
              if (refreshErrorMsg.includes('fetch') || refreshErrorMsg.includes('network')) {
                // Network error - keep user logged in with stored data
                console.warn("Token refresh failed due to network error, using stored user");
                setUser(storedUser);
              } else {
                // Refresh token is invalid - logout
                console.error("Token refresh failed - refresh token invalid");
                logoutUser();
                setUser(null);
              }
            }
          } else if (!refreshTokenValue) {
            // No refresh token available
            logoutUser();
            setUser(null);
          } else {
            // Network error but we have stored user - keep them logged in
            console.warn("Backend unavailable, using stored user");
            setUser(storedUser);
          }
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserData = async () => {
    try {
      const accessToken = getAccessToken();
      // Only try to refresh if we have a token
      if (!accessToken) {
        return;
      }
      
      const userResponse = await getCurrentUser();
      if (userResponse.success && userResponse.data) {
        setUser(userResponse.data);
        setStoredUser(userResponse.data);
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  const signUp = async (email: string, password: string, name?: string): Promise<{ error: any }> => {
    try {
      const response = await registerUser(email, password, name || "");
      if (response.success && response.data) {
        setUser(response.data.user);
        setStoredUser(response.data.user);
        return { error: null };
      }
      return { error: { message: "Registration failed" } };
    } catch (err: any) {
      const apiError = err as ApiError;
      return { error: { message: apiError.message || "Registration failed" } };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: any }> => {
    try {
      const response = await loginUser(email, password);
      if (response.success && response.data) {
        setUser(response.data.user);
        setStoredUser(response.data.user);
        return { error: null };
      }
      return { error: { message: "Login failed" } };
    } catch (err: any) {
      const apiError = err as ApiError;
      return { error: { message: apiError.message || "Login failed" } };
    }
  };

  const signOut = async () => {
    await logoutUser();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const accessToken = getAccessToken();
      // Only try to refresh if we have a token
      if (!accessToken) {
        setUser(null);
        return;
      }
      
      const userResponse = await getCurrentUser();
      if (userResponse.success && userResponse.data) {
        setUser(userResponse.data);
        setStoredUser(userResponse.data);
      } else {
        // If response is not successful, clear user
        await logoutUser();
        setUser(null);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
      // Only logout if we had a token (meaning it's an auth error, not just no token)
      const accessToken = getAccessToken();
      if (accessToken) {
        await logoutUser();
      }
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
