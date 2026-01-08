import { useAuthModal } from "../contexts/AuthModalContext";
import { checkAuthAndTriggerModal } from "./authCheck";

/**
 * Check if an error is an authentication error
 */
export function isAuthError(error: any): boolean {
  if (!error) return false;
  
  const message = error.message || '';
  const status = error.response?.status;
  
  return (
    message.includes('not authenticated') ||
    message.includes('Please log in') ||
    message.includes('Authentication failed') ||
    message.includes('Authentication required') ||
    status === 401
  );
}

/**
 * Handle API errors - shows auth modal for auth errors, otherwise returns error message
 * @param error The error object
 * @param openModal Function to open auth modal
 * @param onRetry Callback to retry the operation after successful auth
 * @returns true if auth modal was shown, false otherwise
 */
export function handleApiError(
  error: any,
  openModal: (mode?: "login" | "signup", onSuccess?: () => void) => void,
  onRetry?: () => void
): boolean {
  if (isAuthError(error)) {
    // Show auth modal - will retry operation after successful auth
    checkAuthAndTriggerModal(openModal, onRetry);
    return true;
  }
  return false;
}















