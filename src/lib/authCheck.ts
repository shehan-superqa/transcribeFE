import { getStoredUser, getAccessToken } from "./api";
import { store } from "../store";
import { checkAuth } from "../store/authSlice";

/**
 * Check if user is authenticated
 * @returns true if authenticated, false otherwise
 */
export function isAuthenticated(): boolean {
  const user = getStoredUser();
  const token = getAccessToken();
  return !!(user && token);
}

/**
 * Ensure user is authenticated before making an API call
 * If not authenticated, opens the auth modal
 * @param onSuccess Callback to execute after successful authentication
 * @returns Promise that resolves to true if authenticated, false if modal was opened
 */
export async function ensureAuthenticated(onSuccess?: () => void): Promise<boolean> {
  // Check Redux store first
  const state = store.getState();
  const { user, isAuthenticated: authState } = state.auth;

  if (user && authState) {
    return true;
  }

  // Double-check with stored data
  if (isAuthenticated()) {
    // Try to refresh auth state
    try {
      await store.dispatch(checkAuth()).unwrap();
      const updatedState = store.getState();
      if (updatedState.auth.user && updatedState.auth.isAuthenticated) {
        return true;
      }
    } catch (error) {
      // Auth check failed, will show modal
    }
  }

  // Not authenticated - open modal
  // Import dynamically to avoid circular dependencies
  const { useAuthModal } = await import("../contexts/AuthModalContext");
  
  // We need to get the modal context from the provider
  // Since we can't use hooks here, we'll use a different approach
  // We'll throw a special error that components can catch and handle
  throw new AuthRequiredError(onSuccess);
}

/**
 * Custom error class to signal authentication is required
 */
export class AuthRequiredError extends Error {
  onSuccess?: () => void;
  
  constructor(onSuccess?: () => void) {
    super("Authentication required");
    this.name = "AuthRequiredError";
    this.onSuccess = onSuccess;
  }
}

/**
 * Helper function to check auth and trigger modal if needed
 * This should be called from React components that have access to useAuthModal hook
 */
export function checkAuthAndTriggerModal(
  openModal: (mode?: "login" | "signup", onSuccess?: () => void) => void,
  onSuccess?: () => void
): boolean {
  // Check Redux store first (most reliable)
  const state = store.getState();
  console.log('[checkAuthAndTriggerModal] Redux state:', {
    hasUser: !!state.auth.user,
    isAuthenticated: state.auth.isAuthenticated,
    loading: state.auth.loading
  });
  
  // If still loading, check stored data as fallback
  if (state.auth.loading) {
    console.log('[checkAuthAndTriggerModal] Auth still loading, checking stored data');
    const user = getStoredUser();
    const token = getAccessToken();
    if (user && token) {
      console.log('[checkAuthAndTriggerModal] Found stored auth data, assuming authenticated');
      return true;
    }
    // No stored data, not authenticated
    console.log('[checkAuthAndTriggerModal] No stored auth data, opening modal');
    openModal("login", onSuccess);
    return false;
  }
  
  if (state.auth.user && state.auth.isAuthenticated) {
    console.log('[checkAuthAndTriggerModal] User is authenticated');
    return true;
  }

  // Not authenticated - open modal
  console.log('[checkAuthAndTriggerModal] User not authenticated, opening auth modal');
  openModal("login", onSuccess);
  return false;
}

