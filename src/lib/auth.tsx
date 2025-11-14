import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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
  }, []);

  const initializeAuth = async () => {
    try {
      const token = getAuthToken();
      const storedUser = getStoredUser();

      if (token && storedUser) {
        try {
          const verification = await verifyToken(token);

          if (verification.valid && verification.user_id) {
            try {
              const userResponse = await getCurrentUser();
              if (userResponse.success) {
                setUser(userResponse.user);
                setStoredUser(userResponse.user);
              } else {
                logoutUser();
                setUser(null);
              }
            } catch (error) {
              // If backend is not available, use stored user
              console.warn("Backend not available, using stored user");
              setUser(storedUser);
            }
          } else {
            logoutUser();
            setUser(null);
          }
        } catch (error) {
          // If backend is not available during token verification, use stored user
          console.warn("Backend not available for token verification, using stored user");
          setUser(storedUser);
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

  const signUp = async (email: string, password: string, name?: string): Promise<{ error: any }> => {
    try {
      const response = await registerUser(email, password, name);
      if (response.success) {
        setUser(response.user);
        setStoredUser(response.user);
        return { error: null };
      }
      return { error: { message: "Registration failed" } };
    } catch (err: any) {
      const apiError = err as ApiError;
      return { error: { message: apiError.error || "Registration failed" } };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: any }> => {
    try {
      const response = await loginUser(email, password);
      if (response.success) {
        setUser(response.user);
        setStoredUser(response.user);
        return { error: null };
      }
      return { error: { message: "Login failed" } };
    } catch (err: any) {
      const apiError = err as ApiError;
      return { error: { message: apiError.error || "Login failed" } };
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
      console.error("Error refreshing user:", error);
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
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
