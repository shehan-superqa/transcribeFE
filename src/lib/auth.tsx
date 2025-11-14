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
    
    // Set up automatic token refresh (refresh every 14 minutes)
    const refreshInterval = setInterval(async () => {
      const accessToken = getAccessToken();
      const refreshTokenValue = getRefreshToken();
      
      if (accessToken && refreshTokenValue) {
        try {
          await refreshToken();
          // Refresh user data after token refresh
          await refreshUserData();
        } catch (error) {
          console.error("Auto token refresh failed:", error);
          // If refresh fails, logout user
          await signOut();
        }
      }
    }, 14 * 60 * 1000); // 14 minutes

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
        } catch (error) {
          // If backend is not available, try refreshing token
          const refreshTokenValue = getRefreshToken();
          if (refreshTokenValue) {
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
              console.warn("Token refresh failed, using stored user");
              setUser(storedUser);
            }
          } else {
            logoutUser();
            setUser(null);
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
      const userResponse = await getCurrentUser();
      if (userResponse.success && userResponse.data) {
        setUser(userResponse.data);
        setStoredUser(userResponse.data);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
      await logoutUser();
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
