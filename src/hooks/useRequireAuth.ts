import { useAuth } from '../lib/auth';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Hook to require authentication before performing actions
 * Returns a function that checks auth and redirects to login if not authenticated
 */
export function useRequireAuth() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const requireAuth = (callback?: () => void): boolean => {
    if (!user) {
      // Redirect to login with current path as redirect parameter
      navigate(`/auth/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      return false;
    }
    
    if (callback) {
      callback();
    }
    
    return true;
  };

  return { requireAuth, isAuthenticated: !!user };
}



