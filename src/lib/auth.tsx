import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  registerUser,
  loginUser,
  getCurrentUser,
  verifyToken,
  logoutUser,
  getAuthToken,
  getStoredUser,
  setStoredUser,
  ApiError,
} from './api';

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

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = getAuthToken();
      const storedUser = getStoredUser();

      if (token && storedUser) {
        // Verify token is still valid
        const verification = await verifyToken(token);
        
        if (verification.valid && verification.user_id) {
          // Token is valid, try to get fresh user data
          try {
            const userResponse = await getCurrentUser();
            if (userResponse.success) {
              setUser(userResponse.user);
              setStoredUser(userResponse.user);
            } else {
              // If we can't get user, clear auth
              logoutUser();
              setUser(null);
            }
          } catch (error) {
            // If request fails, use stored user
            setUser(storedUser);
          }
        } else {
          // Token is invalid, clear auth
          logoutUser();
          setUser(null);
        }
      } else {
        // No token or user stored
        setUser(null);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const response = await registerUser(email, password, name);
      if (response.success) {
        setUser(response.user);
        return { error: null };
      } else {
        return { error: { message: 'Registration failed' } };
      }
    } catch (error: any) {
      const apiError = error as ApiError;
      return { error: { message: apiError.error || 'Registration failed' } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await loginUser(email, password);
      if (response.success) {
        setUser(response.user);
        return { error: null };
      } else {
        return { error: { message: 'Login failed' } };
      }
    } catch (error: any) {
      const apiError = error as ApiError;
      return { error: { message: apiError.error || 'Login failed' } };
    }
  };

  const signOut = async () => {
    logoutUser();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const userResponse = await getCurrentUser();
      if (userResponse.success) {
        setUser(userResponse.user);
        setStoredUser(userResponse.user);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      // If refresh fails, user might be logged out
      logoutUser();
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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
